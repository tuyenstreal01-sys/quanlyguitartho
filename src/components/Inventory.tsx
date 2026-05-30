import React, { useState, useMemo } from 'react';
import { Product, Transaction, Settings } from '../types';
import { calculateStock, getStockStatusLabel } from '../utils';
import { Calendar, Search, Filter, RefreshCw, AlertTriangle, Check, RotateCcw } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  transactions: Transaction[];
  settings: Settings;
}

export default function Inventory({ products, transactions, settings }: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, OK, ATTENTION, OUT_OF_STOCK

  // Date Fluctuation States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Default helper presets
  const setPresetRange = (range: 'thisMonth' | 'last30Days' | 'allTime') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (range === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (range === 'last30Days') {
      const priorDate = new Date(today.setDate(today.getDate() - 30));
      setStartDate(priorDate.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Compute stats and stock balances
  const reportData = useMemo(() => {
    // Current absolute stock
    const currentStock = calculateStock(transactions, products);

    // Filtered transaction subset for date ranges
    const txBefore = transactions.filter((tx) => startDate && tx.date < startDate);
    const txInPeriod = transactions.filter(
      (tx) => (!startDate || tx.date >= startDate) && (!endDate || tx.date <= endDate)
    );

    // Stock before selected range starts (Inception to startDate - 1)
    const initialStock = calculateStock(txBefore, products);

    // Compute period totals
    const periodSent: Record<string, number> = {};
    const periodRecv: Record<string, number> = {};
    const periodScrap: Record<string, number> = {};

    products.forEach((p) => {
      periodSent[p.code] = 0;
      periodRecv[p.code] = 0;
      periodScrap[p.code] = 0;
    });

    txInPeriod.forEach((tx) => {
      tx.items.forEach((item) => {
        if (tx.type === 'GUI_SON') {
          periodSent[item.productCode] = (periodSent[item.productCode] || 0) + item.quantity;
        } else if (tx.type === 'NHAN_THANH_PHAM') {
          periodRecv[item.productCode] = (periodRecv[item.productCode] || 0) + item.quantity;
        } else if (tx.type === 'XUAT_HUY') {
          periodScrap[item.productCode] = (periodScrap[item.productCode] || 0) + item.quantity;
        }
      });
    });

    return products.map((p) => {
      const cStock = currentStock[p.code] || { painting: 0, finished: 0 };
      const initSt = initialStock[p.code] || { painting: 0, finished: 0 };
      const statusInfo = getStockStatusLabel(cStock.finished, settings.alertThreshold);

      return {
        product: p,
        currentPainting: cStock.painting,
        currentFinished: cStock.finished,
        initPainting: initSt.painting,
        initFinished: initSt.finished,
        sent: periodSent[p.code] || 0,
        recv: periodRecv[p.code] || 0,
        scrap: periodScrap[p.code] || 0,
        status: statusInfo
      };
    });
  }, [products, transactions, startDate, endDate, settings.alertThreshold]);

  // Product groups listed for UI filter
  const groupsList = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.group) list.add(p.group);
    });
    return Array.from(list);
  }, [products]);

  // Apply filters on table list
  const filteredReport = useMemo(() => {
    return reportData.filter((row) => {
      // 1. Search term match
      const codeMatch = row.product.code.toLowerCase().includes(searchTerm.toLowerCase());
      const nameMatch = row.product.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (searchTerm && !codeMatch && !nameMatch) return false;

      // 2. Group filter
      if (selectedGroup !== 'All' && row.product.group !== selectedGroup) return false;

      // 3. Status filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'OK' && row.status.label !== 'OK') return false;
        if (statusFilter === 'ATTENTION' && row.status.label !== 'Cần chú ý') return false;
        if (statusFilter === 'OUT_OF_STOCK' && row.status.label !== 'Không có hàng') return false;
      }

      return true;
    });
  }, [reportData, searchTerm, selectedGroup, statusFilter]);

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Sổ Theo Dõi Tồn Kho Chi Tiết</h2>
          <p className="text-xs text-slate-500">Giám sát số lượng đàn nằm tại xưởng sơn và thành phẩm lưu kho mẫu</p>
        </div>

        {/* Date Filters block */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4 text-slate-400 ml-1" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs bg-white text-slate-700 px-2 py-1 rounded border border-slate-200 outline-hidden"
              placeholder="Từ ngày"
            />
            <span className="text-xs text-slate-400">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-white text-slate-700 px-2 py-1 rounded border border-slate-200 outline-hidden"
              placeholder="Đến ngày"
            />
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setPresetRange('thisMonth')}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-[10px] text-slate-600 px-2 py-1 rounded font-medium"
            >
              Tháng này
            </button>
            <button
              onClick={() => setPresetRange('last30Days')}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-[10px] text-slate-600 px-2 py-1 rounded font-medium"
            >
              30 ngày qua
            </button>
            {(startDate || endDate) && (
              <button
                onClick={clearDateFilters}
                className="bg-slate-200 hover:bg-slate-300 text-[10px] text-slate-700 px-2 py-1 rounded font-medium flex items-center space-x-0.5"
                title="Xóa lọc ngày"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inputs Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã hoặc tên đàn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-blue-400 outline-hidden text-slate-700 font-medium"
          />
        </div>

        <div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-blue-400 outline-hidden text-slate-700 font-medium cursor-pointer"
          >
            <option value="All">Tất cả nhóm</option>
            {groupsList.map((g) => (
              <option key={g} value={g}>
                Nhóm {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-blue-400 outline-hidden text-slate-700 font-medium cursor-pointer"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="OK">Trạng thái: OK</option>
            <option value="ATTENTION">Trạng thái: Cần chú ý</option>
            <option value="OUT_OF_STOCK">Trạng thái: Không có hàng</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 pl-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Dưới {settings.alertThreshold} chiếc = Sắp hết hàng</span>
        </div>
      </div>

      {/* Inventory Movements Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 font-semibold tracking-wider border-b border-slate-100">
            <tr>
              <th scope="col" className="px-4 py-3">Mã đàn</th>
              <th scope="col" className="px-4 py-3">Tên sản phẩm</th>
              <th scope="col" className="px-4 py-3">Phân nhóm</th>
              <th scope="col" className="px-4 py-3 text-center bg-blue-50/40 text-blue-800">Đang sơn</th>
              <th scope="col" className="px-4 py-3 text-center bg-teal-50/40 text-teal-800">Thành phẩm</th>
              {(startDate || endDate) && (
                <>
                  <th scope="col" className="px-3 py-3 text-center text-amber-700 bg-amber-50/20">Đầu kỳ Gửi/TP</th>
                  <th scope="col" className="px-3 py-3 text-center text-indigo-700 bg-indigo-50/20">Gửi sơn</th>
                  <th scope="col" className="px-3 py-3 text-center text-emerald-700 bg-emerald-50/20">Biến động Nhận</th>
                  <th scope="col" className="px-3 py-3 text-center text-rose-700 bg-rose-50/20">Hủy bỏ</th>
                </>
              )}
              <th scope="col" className="px-4 py-3 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReport.length === 0 ? (
              <tr>
                <td colSpan={(startDate || endDate) ? 10 : 6} className="px-4 py-8 text-center text-slate-400 font-medium">
                  Không tìm thấy sản phẩm nào khớp với điều kiện lọc.
                </td>
              </tr>
            ) : (
              filteredReport.map((row) => (
                <tr key={row.product.code} className="hover:bg-slate-50/50 transition-all font-medium text-slate-700">
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-800">{row.product.code}</td>
                  <td className="px-4 py-3.5 text-slate-800 text-[13px]">{row.product.name}</td>
                  <td className="px-4 py-3.5 text-[11px] text-slate-500">
                    <span className="px-2 py-1 rounded bg-slate-100">{row.product.group}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-blue-600 bg-blue-50/10">
                    {row.currentPainting}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-teal-600 bg-teal-50/10">
                    {row.currentFinished}
                  </td>

                  {/* Period Fluctuations Columns */}
                  {(startDate || endDate) && (
                    <>
                      <td className="px-3 py-3.5 text-center text-xs text-slate-500 font-mono bg-amber-50/10">
                        {row.initPainting} / {row.initFinished}
                      </td>
                      <td className="px-3 py-3.5 text-center text-xs text-indigo-600 font-mono bg-indigo-50/10">
                        {row.sent > 0 ? `+${row.sent}` : '0'}
                      </td>
                      <td className="px-3 py-3.5 text-center text-xs text-emerald-600 font-mono bg-emerald-50/10">
                        {row.recv > 0 ? `+${row.recv}` : '0'}
                      </td>
                      <td className="px-3 py-3.5 text-center text-xs text-rose-500 font-mono bg-rose-50/10">
                        {row.scrap > 0 ? `-${row.scrap}` : '0'}
                      </td>
                    </>
                  )}

                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${row.status.badgeClass} inline-block`}>
                      {row.status.label}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

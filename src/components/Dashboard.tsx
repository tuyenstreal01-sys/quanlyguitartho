import React, { useState, useMemo } from 'react';
import { Product, Transaction, Settings, GuitarStock } from '../types';
import { calculateStock, formatCurrency, getStockStatusLabel } from '../utils';
import { Paintbrush, CheckCircle, Flame, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  settings: Settings;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ products, transactions, settings, onNavigate }: DashboardProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  // Compute stocks dynamically from logs
  const stockMap = useMemo(() => {
    return calculateStock(transactions, products);
  }, [transactions, products]);

  // Aggregate current stock counts
  const totals = useMemo(() => {
    let paintingSum = 0;
    let finishedSum = 0;
    products.forEach((p) => {
      const st = stockMap[p.code];
      if (st) {
        paintingSum += st.painting;
        finishedSum += st.finished;
      }
    });
    return { painting: paintingSum, finished: finishedSum };
  }, [stockMap, products]);

  // Months statistics (Current month)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let sentCount = 0;
    let receivedCount = 0;
    let costSum = 0;

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        if (tx.type === 'GUI_SON') {
          tx.items.forEach((item) => {
            sentCount += item.quantity;
          });
        } else if (tx.type === 'NHAN_THANH_PHAM') {
          tx.items.forEach((item) => {
            receivedCount += item.quantity;
            if (item.unitPrice && item.quantity) {
              costSum += item.quantity * item.unitPrice;
            }
          });
        }
      }
    });

    return {
      sent: sentCount,
      received: receivedCount,
      cost: costSum,
      monthName: `Tháng ${currentMonth + 1}/${currentYear}`
    };
  }, [transactions]);

  // Product groups for filters
  const groups = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.group) list.add(p.group);
    });
    return ['All', ...Array.from(list)];
  }, [products]);

  // Low Stock Alerts (finished quantity <= threshold)
  const alerts = useMemo(() => {
    return products
      .map((p) => {
        const stock = stockMap[p.code] || { painting: 0, finished: 0 };
        const status = getStockStatusLabel(stock.finished, settings.alertThreshold);
        return {
          product: p,
          stock,
          status
        };
      })
      .filter((item) => item.status.label !== 'OK');
  }, [products, stockMap, settings.alertThreshold]);

  // Filtered products to display
  const filteredProducts = useMemo(() => {
    return products.filter((p) => selectedGroup === 'All' || p.group === selectedGroup);
  }, [products, selectedGroup]);

  return (
    <div className="space-y-6">
       {/* Upper overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* State Painting */}
        <div className="bg-[#eff6ff] p-5 rounded-2xl border border-[#dbeafe] shadow-2xs flex items-center space-x-4">
          <div className="p-3 bg-white/80 text-[#1e40af] rounded-xl shadow-3xs">
            <Paintbrush className="h-6 w-6 stroke-[1.8]" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">XƯỞNG SƠN ĐANG GIỮ</p>
            <h3 className="text-2xl font-bold text-[#1e40af] mt-0.5">{totals.painting.toLocaleString()} <span className="text-xs font-semibold text-[#1e40af]/60">cây</span></h3>
          </div>
        </div>

        {/* State Finished */}
        <div className="bg-[#f0fdf4] p-5 rounded-2xl border border-[#dcfce7] shadow-2xs flex items-center space-x-4">
          <div className="p-3 bg-white/80 text-[#166534] rounded-xl shadow-3xs">
            <CheckCircle className="h-6 w-6 stroke-[1.8]" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans">KHO THÀNH PHẨM</p>
            <h3 className="text-2xl font-bold text-[#166534] mt-0.5">{totals.finished.toLocaleString()} <span className="text-xs font-semibold text-[#166534]/60">cây</span></h3>
          </div>
        </div>

        {/* Sent this month */}
        <div className="bg-[#f5f3ff] p-5 rounded-2xl border border-[#ede9fe] shadow-2xs flex items-center space-x-4">
          <div className="p-3 bg-white/80 text-[#5b21b6] rounded-xl shadow-3xs">
            <ArrowUpRight className="h-6 w-6 stroke-[1.8]" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{monthlyStats.monthName} — ĐÃ GỬI</p>
            <h3 className="text-2xl font-bold text-[#5b21b6] mt-0.5">+{monthlyStats.sent.toLocaleString()} <span className="text-xs font-semibold text-[#5b21b6]/60">cây</span></h3>
          </div>
        </div>

        {/* Received this month / paint debt */}
        <div className="bg-[#fff7ed] p-5 rounded-2xl border border-[#ffedd5] shadow-2xs flex items-center space-x-4">
          <div className="p-3 bg-white/80 text-[#9a3412] rounded-xl shadow-3xs">
            <ArrowDownLeft className="h-6 w-6 stroke-[1.8]" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">TIỀN CÔNG SƠN (THÁNG)</p>
            <h3 className="text-xl font-extrabold text-[#9a3412] mt-0.5">{formatCurrency(monthlyStats.cost)}</h3>
          </div>
        </div>
      </div>

      {/* Warning threshold box if warning triggered */}
      {alerts.length > 0 && (
        <div className="bg-[#fffbeb] border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 text-sm">Cảnh báo tồn kho thấp hoặc hết hàng!</h4>
              <p className="text-xs text-amber-800">Đã phát hiện {alerts.length} mã gỗ thành phẩm có số lượng dưới ngưỡng ({settings.alertThreshold} chiếc).</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="self-start md:self-auto bg-amber-600 hover:bg-amber-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors"
          >
            Kiểm tra tồn kho
          </button>
        </div>
      )}

      {/* Main product statuses grid */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Tình Trạng Sơn & Tồn Kho Các Mã Đàn</h2>
            <p className="text-xs text-slate-500">Dữ liệu tính toán thời gian thực dựa trên sổ giao dịch linh hoạt</p>
          </div>

          {/* Group filtering tab buttons */}
          <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {groups.map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedGroup === grp
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {grp === 'All' ? 'Tất cả' : grp}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const stock = stockMap[p.code] || { painting: 0, finished: 0 };
            const statusInfo = getStockStatusLabel(stock.finished, settings.alertThreshold);

            return (
              <div
                key={p.code}
                className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">{p.group}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm mt-1.5">{p.name || p.code}</h4>
                  <p className="text-xs font-mono font-semibold text-slate-500 mt-1">Mã: {p.code}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
                    <p className="text-[10px] text-blue-600 font-medium">Đang sơn</p>
                    <p className="text-base font-bold text-blue-900">{stock.painting}</p>
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    stock.finished === 0 
                      ? 'bg-rose-50/50 border-rose-100' 
                      : stock.finished <= settings.alertThreshold 
                        ? 'bg-amber-50/50 border-amber-100' 
                        : 'bg-emerald-50/50 border-emerald-100'
                  }`}>
                    <p className={`text-[10px] font-medium ${
                      stock.finished === 0 
                        ? 'text-rose-600' 
                        : stock.finished <= settings.alertThreshold 
                          ? 'text-amber-600' 
                          : 'text-emerald-600'
                    }`}>Thành phẩm</p>
                    <p className={`text-base font-bold ${
                      stock.finished === 0 
                        ? 'text-rose-900' 
                        : stock.finished <= settings.alertThreshold 
                          ? 'text-amber-900' 
                          : 'text-emerald-950'
                    }`}>{stock.finished}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

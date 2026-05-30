import React, { useState, useMemo } from 'react';
import { Transaction, Invoice, Product } from '../types';
import { formatCurrency } from '../utils';
import { ArrowUpRight, ArrowDownLeft, Trash2, ShieldAlert, Award, CreditCard, Calendar } from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
  invoices: Invoice[];
  products: Product[];
}

export default function Analytics({ transactions, invoices, products }: AnalyticsProps) {
  const [periodPreset, setPeriodPreset] = useState<'month' | 'quarter' | 'year' | 'custom'>('year');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Date boundaries based on user presets
  const dateRange = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let start = '';
    let end = '';

    if (periodPreset === 'month') {
      const first = new Date(currentYear, currentMonth, 1);
      start = first.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    } else if (periodPreset === 'quarter') {
      // Determine calendar quarter
      const quarterMo = Math.floor(currentMonth / 3) * 3;
      const first = new Date(currentYear, quarterMo, 1);
      start = first.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    } else if (periodPreset === 'year') {
      const first = new Date(currentYear, 0, 1);
      start = first.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    } else {
      start = customStart;
      end = customEnd;
    }

    return { start, end };
  }, [periodPreset, customStart, customEnd]);

  // Filter transactions within selected period range
  const filteredTransactions = useMemo(() => {
    const { start, end } = dateRange;
    return transactions.filter((tx) => {
      if (start && tx.date < start) return false;
      if (end && tx.date > end) return false;
      return true;
    });
  }, [transactions, dateRange]);

  // Filter invoices within selected period range
  const filteredInvoices = useMemo(() => {
    const { start, end } = dateRange;
    return invoices.filter((inv) => {
      if (start && inv.date < start) return false;
      if (end && inv.date > end) return false;
      return true;
    });
  }, [invoices, dateRange]);

  // 1. Calculate 6 KPIs: Gửi, Nhận, Hủy, Tiền công, Hiệu suất, Công nợ còn lại
  const kpis = useMemo(() => {
    let sentQty = 0;
    let recvQty = 0;
    let scrapQty = 0;
    let totalCost = 0;
    let totalDebt = 0;

    filteredTransactions.forEach((tx) => {
      tx.items.forEach((item) => {
        if (tx.type === 'GUI_SON') {
          sentQty += item.quantity;
        } else if (tx.type === 'NHAN_THANH_PHAM') {
          recvQty += item.quantity;
          if (item.unitPrice) {
            totalCost += item.quantity * item.unitPrice;
          }
        } else if (tx.type === 'XUAT_HUY') {
          scrapQty += item.quantity;
        }
      });
    });

    // Accounts Payables Debt filtered in period
    filteredInvoices.forEach((inv) => {
      const unpaid = inv.totalAmount - inv.paidAmount;
      if (unpaid > 0) {
        totalDebt += unpaid;
      }
    });

    // Efficiency ratio calculation: % returned vs sent
    // For realistic computation, we prevent division by zero
    const efficiency = sentQty > 0 ? (recvQty / sentQty) * 100 : 100;

    return {
      sent: sentQty,
      recv: recvQty,
      scrap: scrapQty,
      cost: totalCost,
      debt: totalDebt,
      efficiency
    };
  }, [filteredTransactions, filteredInvoices]);

  // 2. Aggregate charts details
  const chartData = useMemo(() => {
    const sentMap: Record<string, number> = {};
    const recvMap: Record<string, number> = {};
    const scrapMap: Record<string, number> = {};
    const costMap: Record<string, number> = {};

    products.forEach((p) => {
      sentMap[p.code] = 0;
      recvMap[p.code] = 0;
      scrapMap[p.code] = 0;
      costMap[p.code] = 0;
    });

    filteredTransactions.forEach((tx) => {
      tx.items.forEach((item) => {
        const code = item.productCode;
        if (tx.type === 'GUI_SON') {
          sentMap[code] = (sentMap[code] || 0) + item.quantity;
        } else if (tx.type === 'NHAN_THANH_PHAM') {
          recvMap[code] = (recvMap[code] || 0) + item.quantity;
          if (item.unitPrice) {
            costMap[code] = (costMap[code] || 0) + (item.quantity * item.unitPrice);
          }
        } else if (tx.type === 'XUAT_HUY') {
          scrapMap[code] = (scrapMap[code] || 0) + item.quantity;
        }
      });
    });

    const productsBySent = Object.entries(sentMap)
      .map(([code, value]) => ({ code, value }))
      .filter((v) => v.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const productsByRecv = Object.entries(recvMap)
      .map(([code, value]) => ({ code, value }))
      .filter((v) => v.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const productsByScrap = Object.entries(scrapMap)
      .map(([code, value]) => ({ code, value }))
      .filter((v) => v.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const productsByCost = Object.entries(costMap)
      .map(([code, value]) => ({ code, value }))
      .filter((v) => v.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      sent: productsBySent,
      recv: productsByRecv,
      scrap: productsByScrap,
      cost: productsByCost
    };
  }, [filteredTransactions, products]);

  // Reusable custom horizontal bar chart rendering component
  const HorizontalBarChart = ({
    data,
    color,
    isCurrency = false
  }: {
    data: { code: string; value: number }[];
    color: 'blue' | 'green' | 'amber' | 'rose' | 'purple';
    isCurrency?: boolean;
  }) => {
    const maxValue = useMemo(() => {
      const max = Math.max(...data.map((d) => d.value), 0);
      return max > 0 ? max : 1;
    }, [data]);

    const bgAndBarColor = {
      blue: { bg: 'bg-blue-500/10', bar: 'bg-blue-500', text: 'text-blue-700' },
      green: { bg: 'bg-emerald-500/10', bar: 'bg-emerald-500', text: 'text-emerald-700' },
      amber: { bg: 'bg-amber-500/10', bar: 'bg-amber-500', text: 'text-amber-700' },
      rose: { bg: 'bg-rose-500/10', bar: 'bg-rose-500', text: 'text-rose-700' },
      purple: { bg: 'bg-purple-500/10', bar: 'bg-purple-500', text: 'text-purple-700' }
    }[color];

    if (data.length === 0) {
      return (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400 italic font-medium">
          Không có dữ liệu thống kê nào được ghi nhận trong kỳ.
        </div>
      );
    }

    return (
      <div className="space-y-3.5 py-2">
        {data.map((item, idx) => {
          const percentage = (item.value / maxValue) * 100;
          const labelProduct = products.find((p) => p.code === item.code)?.name || item.code;

          return (
            <div key={item.code} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 truncate pr-4">
                  <span className="font-bold text-slate-400 font-mono mr-1.5">#{idx + 1}</span>
                  {labelProduct} <span className="text-[10px] text-slate-400 font-mono">({item.code})</span>
                </span>
                <span className={`font-bold font-mono ${bgAndBarColor.text}`}>
                  {isCurrency ? formatCurrency(item.value) : `${item.value.toLocaleString()} chiếc`}
                </span>
              </div>
              <div className={`w-full ${bgAndBarColor.bg} h-5 rounded-lg overflow-hidden relative`}>
                <div
                  className={`h-full ${bgAndBarColor.bar} transition-all duration-700 rounded-lg flex items-center pl-2`}
                  style={{ width: `${percentage}%` }}
                >
                  {percentage > 12 && (
                    <span className="text-[9px] font-extrabold text-white font-mono">
                      {percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and title card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Phân Tích Hiệu Suất & Chi Phí Sản Xuất</h2>
          <p className="text-xs text-slate-500">Giám sát năng suất của xưởng sơn, lượng phế phẩm và phân bổ công nợ đầu tư</p>
        </div>

        {/* Presets and custom range inputs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl shrink-0 gap-1 overflow-x-auto">
            <button
              onClick={() => setPeriodPreset('month')}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                periodPreset === 'month' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setPeriodPreset('quarter')}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                periodPreset === 'quarter' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quý này
            </button>
            <button
              onClick={() => setPeriodPreset('year')}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                periodPreset === 'year' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Năm nay
            </button>
            <button
              onClick={() => setPeriodPreset('custom')}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                periodPreset === 'custom' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tùy chọn
            </button>
          </div>

          {periodPreset === 'custom' && (
            <div className="flex items-center space-x-1 border border-slate-100 p-1 bg-slate-50 rounded-xl">
              <Calendar className="h-3 w-3 text-slate-400" />
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-hidden"
              />
              <span className="text-[10px] text-slate-400">—</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Blocks Display */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* KPI 1: Gửi sơn */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng thô gửi đi</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-xl font-bold text-slate-800">{kpis.sent} <span className="text-xs font-normal text-slate-500">đàn</span></h3>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* KPI 2: Nhận TP */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng nhận thành phẩm</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-xl font-bold text-slate-800">{kpis.recv} <span className="text-xs font-normal text-slate-500">đàn</span></h3>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* KPI 3: Xuất hủy */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phế phẩm xuất hủy</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-xl font-bold text-rose-700">{kpis.scrap} <span className="text-xs font-normal text-slate-400">đàn</span></h3>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Trash2 className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* KPI 4: Tiền công sơn */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng chi công sơn</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-base font-bold text-indigo-700 truncate">{formatCurrency(kpis.cost)}</h3>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* KPI 5: Hiệu suất sơn */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Năng suất sơn hoàn tất</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-xl font-bold text-purple-700">{kpis.efficiency.toFixed(0)}%</h3>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Award className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* KPI 6: Nợ chưa trả */}
        <div className="bg-white p-4.5 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Dư nợ AP kỳ này</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-base font-bold text-rose-800 truncate">{formatCurrency(kpis.debt)}</h3>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 4 beautiful horizontal bar charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Top mã gửi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
            🔥 Top 5 Mã Gỗ Xuất Sơn Nhiều Nhất
          </h4>
          <HorizontalBarChart data={chartData.sent} color="blue" />
        </div>

        {/* Chart 2: Top mã nhận thành phẩm */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
            ✅ Top 5 Mã Nhận Kho Thành Phẩm Nhiều Nhất
          </h4>
          <HorizontalBarChart data={chartData.recv} color="green" />
        </div>

        {/* Chart 3: Top hủy bỏ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
            ⚠️ Top 5 Mã Chịu Chi Phí Xuất Hủy Cao Nhất
          </h4>
          <HorizontalBarChart data={chartData.scrap} color="rose" />
        </div>

        {/* Chart 4: Top chi phí công sơn dán */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
            💳 Top 5 Kinh Phí Sơn Chi Tiết Nhất Theo Nhóm
          </h4>
          <HorizontalBarChart data={chartData.cost} color="purple" isCurrency />
        </div>
      </div>
    </div>
  );
}

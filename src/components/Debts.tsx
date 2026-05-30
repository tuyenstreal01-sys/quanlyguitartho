import React, { useState, useMemo, useRef } from 'react';
import { Invoice, PaymentHistory, Transaction, Product, Settings } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { DollarSign, FileText, Printer, CheckCircle2, ChevronRight, X, Calendar, Search, CreditCard } from 'lucide-react';

interface DebtsProps {
  invoices: Invoice[];
  transactions: Transaction[];
  products: Product[];
  settings: Settings;
  onUpdateInvoice: (updated: Invoice) => void;
}

export default function Debts({
  invoices,
  transactions,
  products,
  settings,
  onUpdateInvoice
}: DebtsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All'); // All, UNPAID, PARTIAL, PAID
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Partial Payment Modal form parameters
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNote, setPayNote] = useState('Thanh toán thanh lý kỳ hạn công nợ');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showPayForm, setShowPayForm] = useState(false);

  // Printing state flag
  const [isPrinting, setIsPrinting] = useState(false);

  // Cumulative liability stats
  const metrics = useMemo(() => {
    let grandTotal = 0;
    let settledTotal = 0;
    invoices.forEach((inv) => {
      grandTotal += inv.totalAmount;
      settledTotal += inv.paidAmount;
    });
    return {
      total: grandTotal,
      paid: settledTotal,
      debt: Math.max(0, grandTotal - settledTotal)
    };
  }, [invoices]);

  // Selected Invoice Object lookup
  const selectedInvoice = useMemo(() => {
    return invoices.find((inv) => inv.id === selectedInvoiceId) || null;
  }, [invoices, selectedInvoiceId]);

  // Associated Transaction item list
  const selectedTx = useMemo(() => {
    if (!selectedInvoice) return null;
    return transactions.find((tx) => tx.id === selectedInvoice.transactionId) || null;
  }, [selectedInvoice, transactions]);

  // Filtering invoices list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search term
      const searchMatch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.notes && inv.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      if (searchTerm && !searchMatch) return false;

      // Status matching
      if (selectedStatus !== 'All' && inv.status !== selectedStatus) return false;

      return true;
    });
  }, [invoices, searchTerm, selectedStatus]);

  // Select Invoice callback
  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setShowPayForm(false);
    // Initialize standard payment suggestion to remaining unpaid balance
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setPayAmount(inv.totalAmount - inv.paidAmount);
    }
  };

  // Add Partial Payment Handler
  const handleAddPaymentSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (payAmount <= 0) {
      alert('Vui lòng nhập số tiền thanh toán lớn hơn 0.');
      return;
    }
    const remaining = selectedInvoice.totalAmount - selectedInvoice.paidAmount;
    if (payAmount > remaining) {
      alert(`Số tiền thanh toán vượt quá số dư nợ còn lại của hóa đơn (${formatCurrency(remaining)}).`);
      return;
    }

    const timestamp = new Date().toISOString().replace(/T/, '-').replace(/[-:]/g, '').substring(0, 15);
    const newPayment: PaymentHistory = {
      id: `PM-PAY-${timestamp}`,
      date: payDate,
      amount: payAmount,
      note: payNote.trim() || undefined
    };

    const updatedPayments = [...selectedInvoice.payments, newPayment];
    const newPaidSum = selectedInvoice.paidAmount + payAmount;
    const newRemaining = selectedInvoice.totalAmount - newPaidSum;

    let status: 'UNPAID' | 'PARTIAL' | 'PAID' = 'PARTIAL';
    if (newRemaining === 0) {
      status = 'PAID';
    } else if (newPaidSum === 0) {
      status = 'UNPAID';
    }

    const updatedInvoice: Invoice = {
      ...selectedInvoice,
      paidAmount: newPaidSum,
      status,
      payments: updatedPayments
    };

    onUpdateInvoice(updatedInvoice);
    setPayAmount(newRemaining); // Reset pay amount suggestion
    setShowPayForm(false);
    alert('Ghi nhận giao dịch thanh toán thành công!');
  };

  // Execute browser printing on demand
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. AP accounting metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total painting invoices billed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng Tiền Nhận Hàng (Lũy kế)</p>
            <h3 className="text-xl font-bold text-slate-800">{formatCurrency(metrics.total)}</h3>
          </div>
        </div>

        {/* Settled debts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đã Thanh Toán Xưởng Sơn</p>
            <h3 className="text-xl font-bold text-emerald-600">{formatCurrency(metrics.paid)}</h3>
          </div>
        </div>

        {/* Liability outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl animate-pulse">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium font-semibold">Công Nợ Hiện Tại (Cần Trả)</p>
            <h3 className="text-xl font-bold text-rose-700">{formatCurrency(metrics.debt)}</h3>
          </div>
        </div>
      </div>

      {/* 2. Main structure: Invoices on left, selection summary audit on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left pane: Bảng hóa đơn */}
        <div className="lg:col-span-7 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Sổ Theo Dõi Công Nợ Giao Nhận</h3>
              <p className="text-xs text-slate-500">Ấn từng hóa đơn để xem kê khai, thanh toán dư nợ, in biên lai</p>
            </div>
          </div>

          {/* Table filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm hóa đơn, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-300 font-medium text-slate-700"
              />
            </div>
            <div className="flex bg-slate-50 p-1 border border-slate-100 rounded-lg shrink-0 gap-1 overflow-x-auto">
              {['All', 'UNPAID', 'PARTIAL', 'PAID'].map((stKey) => {
                const label = stKey === 'All' ? 'Tất cả' : stKey === 'UNPAID' ? 'Chưa trả' : stKey === 'PARTIAL' ? 'Một phần' : 'Đã trả';
                return (
                  <button
                    key={stKey}
                    onClick={() => setSelectedStatus(stKey)}
                    className={`text-[10px] px-2.5 py-1 rounded-md mb-1 font-bold transition-all shrink-0 ${
                      selectedStatus === stKey
                        ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Invoices List table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-[460px] overflow-y-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="text-slate-700 uppercase bg-slate-50 font-semibold tracking-wider border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 py-3">Mã hóa đơn</th>
                  <th scope="col" className="px-4 py-3">Ngày nhận</th>
                  <th scope="col" className="px-3 py-3 text-right">Tổng tiền công</th>
                  <th scope="col" className="px-3 py-3 text-right">Còn nợ lại</th>
                  <th scope="col" className="px-3 py-3 text-center">Trạng thái</th>
                  <th scope="col" className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                      Chưa ghi nhận hóa đơn công nợ nào khớp điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isSelected = inv.id === selectedInvoiceId;
                    const debtRem = inv.totalAmount - inv.paidAmount;

                    let badgeColor = '';
                    let label = '';
                    if (inv.status === 'PAID') {
                      badgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                      label = 'Đã thanh toán';
                    } else if (inv.status === 'PARTIAL') {
                      badgeColor = 'bg-amber-50 border-amber-200 text-amber-700';
                      label = 'Trả một phần';
                    } else {
                      badgeColor = 'bg-rose-50 border-rose-200 text-rose-700';
                      label = 'Chưa trả nợ';
                    }

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => handleSelectInvoice(inv.id)}
                        className={`hover:bg-slate-50/50 transition-all cursor-pointer font-medium ${
                          isSelected ? 'bg-indigo-50/30 border-l-2 border-indigo-600' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{inv.id}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(inv.date)}</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-800">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-rose-600">
                          {debtRem > 0 ? formatCurrency(debtRem) : '0đ'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${badgeColor}`}>
                            {label}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-slate-400">
                          <ChevronRight className="h-4 w-4" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right pane: Selected details view, partial payments, and Print */}
        <div className="lg:col-span-5 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-6">
          {!selectedInvoice ? (
            <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2 h-full">
              <FileText className="h-10 w-10 text-slate-200" />
              <span>Vui lòng click chọn một đơn nhận hành ở bảng bên trái để thực hiện đối chiếu, ghi thu chi, in hóa đơn.</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Box header */}
              <div className="flex items-start justify-between border-b border-slate-50 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-mono">Chi Tiết: {selectedInvoice.id}</h4>
                  <p className="text-xs text-slate-400">Ngày lập: {formatDate(selectedInvoice.date)}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={triggerPrint}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg transition-all flex items-center space-x-1"
                    title="In phiếu đối chiếu nợ nần"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedInvoiceId(null)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Items details breakdown */}
              <div>
                <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Danh sách sản phẩm hoàn thiện
                </h5>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/60 text-xs space-y-2">
                  {selectedTx?.items.map((it) => {
                    const pInfo = products.find((pr) => pr.code === it.productCode);
                    const cost = it.quantity * (it.unitPrice || 0);

                    return (
                      <div key={it.productCode} className="flex justify-between items-center text-slate-700 font-medium">
                        <div className="min-w-0 flex-1 pr-3">
                          <span className="font-semibold text-slate-800 truncate block">
                            {pInfo?.name || it.productCode}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            Mã: {it.productCode} | Đơn giá: {formatCurrency(it.unitPrice || 0)}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-slate-800">{it.quantity} chiếc</p>
                          <p className="text-[10px] text-slate-500 font-mono font-semibold">{formatCurrency(cost)}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="border-t border-slate-200/60 pt-2 flex justify-between font-bold text-slate-800">
                    <span>Tổng hóa đơn công sơn:</span>
                    <span className="text-indigo-600">{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payments log */}
              <div>
                <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Lịch sử ký nhận thanh toán ({selectedInvoice.payments.length})
                </h5>

                {selectedInvoice.payments.length === 0 ? (
                  <p className="text-xs text-rose-500 italic">Chưa thực hiện đợt thanh quyết toán nào (Nợ 100%).</p>
                ) : (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {selectedInvoice.payments.map((pm) => (
                      <div
                        key={pm.id}
                        className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-emerald-800">+{formatCurrency(pm.amount)}</p>
                          <p className="text-[10px] text-slate-400 italic">Nội dung: {pm.note || 'Không có ghi chú'}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">{formatDate(pm.date)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Debt outstanding status */}
              <div className="bg-slate-50/55 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                <div>
                  <p className="text-slate-500">Còn nợ lại xưởng sơn:</p>
                  <p className="text-lg font-extrabold text-rose-700">
                    {formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}
                  </p>
                </div>

                {selectedInvoice.totalAmount - selectedInvoice.paidAmount > 0 ? (
                  <button
                    onClick={() => setShowPayForm(!showPayForm)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border-0 outline-hidden rounded-xl text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Trả thêm nợ</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold">
                    Đã thanh toán đủ
                  </span>
                )}
              </div>

              {/* Pay Form inside */}
              {showPayForm && (
                <form
                  onSubmit={handleAddPaymentSub}
                  className="bg-indigo-50/40 p-4 border border-indigo-100 rounded-xl space-y-3 animation-slide"
                >
                  <h6 className="text-xs font-bold text-indigo-900">Tiến Hành Đóng Thêm Tiền Nợ</h6>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Số tiền đóng trả (đ)</label>
                      <input
                        type="number"
                        min="0"
                        max={selectedInvoice.totalAmount - selectedInvoice.paidAmount}
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg outline-hidden font-bold text-indigo-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Ngày nộp tiền</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-slate-200 bg-white rounded-lg outline-hidden font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Nội dung nộp tiền</label>
                    <input
                      type="text"
                      required
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      placeholder="Ví dụ: Đóng đợt 2, chuyển khoản VCB..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg outline-hidden text-slate-700 font-medium"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPayForm(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                    >
                      Lưu và Cập Nhật Sổ
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Printable Audit Bill (Hidden on screen via styles or placed under, but styled beautifully for "print") */}
      {selectedInvoice && (
        <div className="hidden print:block absolute top-0 left-0 w-full p-8 bg-white text-slate-800 text-xs font-sans print-shadow-none">
          <div className="space-y-6">
            {/* Header / Brand info */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-4">
              <div>
                <h1 className="text-base font-extrabold text-slate-900 uppercase font-sans tracking-wide">
                  {settings.rawWorkshopName || 'XƯỞNG SẢN XUẤT GUITAR THÔ'}
                </h1>
                <p className="text-[10px] text-slate-500 mt-1">Đơn vị giao gỗ, khung thô & theo dõi sơn thành phẩm</p>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-bold text-slate-900 font-mono">BẢNG ĐỐI CHIẾU CÔNG NỢ</h2>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Số: {selectedInvoice.id}</p>
                <p className="text-[10px] text-slate-500">Ngày lập: {formatDate(selectedInvoice.date)}</p>
              </div>
            </div>

            {/* Partners info */}
            <div className="grid grid-cols-2 gap-6 text-[11px]">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1">BÊN GIAO (BÊN A):</h3>
                <p className="font-medium">{settings.rawWorkshopName || 'Xưởng Guitar Thô'}</p>
                <p className="text-slate-550">Nơi lưu kho thành phẩm</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1">BÊN NHẬN SƠN (BÊN B):</h3>
                <p className="font-bold">{settings.paintWorkshopName || 'Xưởng Sơn Ngoài'}</p>
                <p className="text-slate-550">Địa chỉ: {settings.paintWorkshopAddress}</p>
                <p className="text-slate-550">SĐT liên hệ: {settings.paintWorkshopPhone}</p>
              </div>
            </div>

            {/* Items details table */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2 font-sans tracking-wider uppercase text-[10px] border-b border-slate-200 pb-1">
                KÊ KHAI HÀNG HÓA HOÀN THIỆN
              </h4>
              <table className="w-full text-slate-800 text-[11px] border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                    <th scope="col" className="px-3 py-1.5 text-left border-r border-slate-300">STT</th>
                    <th scope="col" className="px-3 py-1.5 text-left border-r border-slate-300">Mã Đàn</th>
                    <th scope="col" className="px-3 py-1.5 text-left border-r border-slate-300">Tên Sản Phẩm</th>
                    <th scope="col" className="px-3 py-1.5 text-center border-r border-slate-300">Số Lượng</th>
                    <th scope="col" className="px-3 py-1.5 text-right border-r border-slate-300">Đơn Giá</th>
                    <th scope="col" className="px-3 py-1.5 text-right">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {selectedTx?.items.map((it, index) => {
                    const pDef = products.find((pr) => pr.code === it.productCode);
                    const cost = it.quantity * (it.unitPrice || 0);
                    return (
                      <tr key={it.productCode}>
                        <td className="px-3 py-1.5 border-r border-slate-300">{index + 1}</td>
                        <td className="px-3 py-1.5 font-mono font-bold border-r border-slate-300">{it.productCode}</td>
                        <td className="px-3 py-1.5 border-r border-slate-300">{pDef?.name || it.productCode}</td>
                        <td className="px-3 py-1.5 text-center border-r border-slate-300">{it.quantity}</td>
                        <td className="px-3 py-1.5 text-right border-r border-slate-300">{formatCurrency(it.unitPrice || 0)}</td>
                        <td className="px-3 py-1.5 text-right font-bold">{formatCurrency(cost)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                    <td colSpan={3} className="px-3 py-2 text-right border-r border-slate-300">Tổng cộng công sơn:</td>
                    <td className="px-3 py-2 text-center border-r border-slate-300">
                      {selectedTx?.items.reduce((acc, curr) => acc + curr.quantity, 0)} chiếc
                    </td>
                    <td className="px-3 py-2 border-r border-slate-300"></td>
                    <td className="px-3 py-2 text-right text-indigo-700">{formatCurrency(selectedInvoice.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
              <span className="text-[10px] text-slate-450 italic block mt-1">
                * Lưu ý: Đơn vị tiền tệ tính bằng nghìn đồng (đ). 1,000đ ứng với một triệu đồng Việt Nam.
              </span>
            </div>

            {/* Payment history list in printable area */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2 font-sans tracking-wider uppercase text-[10px] border-b border-slate-200 pb-1">
                LỊCH SỬ CÁC ĐỢT KÝ NHẬN THANH TOÁN
              </h4>
              <table className="w-full text-slate-800 text-[10px] border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 font-bold border-b border-slate-250">
                    <th scope="col" className="px-3 py-1 border-r border-slate-200">Đợt số</th>
                    <th scope="col" className="px-3 py-1 border-r border-slate-200">Ngày Đóng</th>
                    <th scope="col" className="px-3 py-1 border-r border-slate-200">Chi Tiết / Đối Tác Thư Từ</th>
                    <th scope="col" className="px-3 py-1 text-right">Số Tiền Đã Thanh Toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedInvoice.payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-center text-rose-600">
                        Chưa ký nhận bất kỳ khoản trả tiền nào. Bên A đang nợ 100%.
                      </td>
                    </tr>
                  ) : (
                    selectedInvoice.payments.map((pm, index) => (
                      <tr key={pm.id}>
                        <td className="px-3 py-1 border-r border-slate-200">Đợt {index + 1}</td>
                        <td className="px-3 py-1 border-r border-slate-200">{formatDate(pm.date)}</td>
                        <td className="px-3 py-1 border-r border-slate-200">{pm.note}</td>
                        <td className="px-3 py-1 text-right font-semibold">{formatCurrency(pm.amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-50 font-bold border-t border-slate-300">
                    <td colSpan={3} className="px-3 py-1.5 text-right border-r border-slate-200">Tổng đã thanh toán A-B:</td>
                    <td className="px-3 py-1.5 text-right text-emerald-800">{formatCurrency(selectedInvoice.paidAmount)}</td>
                  </tr>
                  <tr className="bg-rose-50/50 font-bold text-rose-800 border-t border-slate-300">
                    <td colSpan={3} className="px-3 py-1.5 text-right border-r border-slate-200">SỐ DƯ NỢ CÒN LẠI (CÔN NỢ):</td>
                    <td className="px-3 py-1.5 text-right text-rose-700">
                      {formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signature section */}
            <div className="pt-8 grid grid-cols-2 gap-10 text-center">
              <div className="space-y-12">
                <p className="font-bold text-slate-800">ĐẠI DIỆN BÊN GIAO (BÊN A)</p>
                <div className="text-[10px] text-slate-450 italic">
                  (Ký, ghi rõ họ tên và đóng dấu)
                </div>
              </div>

              <div className="space-y-12">
                <p className="font-bold text-slate-800">ĐẠI DIỆN BÊN SƠN (BÊN B)</p>
                <div className="text-[10px] text-slate-450 italic">
                  (Ký, ghi rõ họ tên và đóng dấu)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

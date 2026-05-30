import React, { useState, useMemo } from 'react';
import { Product, Transaction, TransactionItem, Settings, Invoice, PaymentHistory } from '../types';
import { calculateStock, formatCurrency } from '../utils';
import { Plus, Trash2, CheckCircle, HelpCircle, DollarSign, ArrowLeftRight } from 'lucide-react';

interface ReceiveFinishedProps {
  products: Product[];
  transactions: Transaction[];
  settings: Settings;
  invoices: Invoice[];
  onAddReceiveTransaction: (tx: Transaction, invoice: Invoice) => void;
}

interface DraftReceiptItem {
  productCode: string;
  quantity: number;
  unitPrice: number;
}

export default function ReceiveFinished({
  products,
  transactions,
  settings,
  invoices,
  onAddReceiveTransaction
}: ReceiveFinishedProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [initialPaidAmount, setInitialPaidAmount] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState('Thanh toán khi nhận hàng');

  // Draft delivery lines
  const [draftItems, setDraftItems] = useState<DraftReceiptItem[]>([]);

  // Compute stock levels to show outstanding amounts at the painting shop
  const stockMap = useMemo(() => {
    return calculateStock(transactions, products);
  }, [transactions, products]);

  // List of products that have outstanding amount > 0 AT the painting shop
  const productsAtPaintShop = useMemo(() => {
    return products.map((p) => {
      const stock = stockMap[p.code] || { painting: 0, finished: 0 };
      return { product: p, qtyAtPaint: stock.painting };
    });
  }, [products, stockMap]);

  // Auto-calculated next invoice number for this date
  const generatedInvoiceId = useMemo(() => {
    if (!date) return 'HD-YYYYMMDD-001';
    const dateCompact = date.replace(/-/g, ''); // "20260530"
    const prefix = `HD-${dateCompact}-`;

    const dailyInvoices = invoices.filter((inv) => inv.id.startsWith(prefix));
    let nextNum = 1;
    if (dailyInvoices.length > 0) {
      // Find maximum numeric suffix
      const suffixes = dailyInvoices.map((inv) => {
        const parts = inv.id.split('-');
        return parseInt(parts[2]) || 0;
      });
      nextNum = Math.max(...suffixes) + 1;
    }

    const numStr = nextNum.toString().padStart(3, '0'); // "001"
    return `${prefix}${numStr}`;
  }, [date, invoices]);

  // Handle adding product line to receipt
  const handleAddItem = (code: string) => {
    // Prevent duplicates
    if (draftItems.find((item) => item.productCode === code)) {
      alert('Sản phẩm đã có trong hóa đơn nhận thành phẩm.');
      return;
    }

    const defaultPrice = settings.defaultPrices[code] || 150; // default 150k
    setDraftItems((prev) => [
      ...prev,
      { productCode: code, quantity: 5, unitPrice: defaultPrice }
    ]);
  };

  const handleUpdateItem = (code: string, fields: Partial<DraftReceiptItem>) => {
    setDraftItems((prev) =>
      prev.map((item) => {
        if (item.productCode === code) {
          const updated = { ...item, ...fields };
          // Bound validations
          if (updated.quantity < 1) updated.quantity = 1;
          if (updated.unitPrice < 0) updated.unitPrice = 0;
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (code: string) => {
    setDraftItems((prev) => prev.filter((item) => item.productCode !== code));
  };

  // Grand total calculation in thousands VND
  const totalPaintCost = useMemo(() => {
    return draftItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [draftItems]);

  // Safety bound check on initial limit
  const handlePaidAmountChange = (val: number) => {
    if (val < 0) return;
    if (val > totalPaintCost) {
      setInitialPaidAmount(totalPaintCost);
    } else {
      setInitialPaidAmount(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftItems.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm nhận thành phẩm.');
      return;
    }

    const txTimestamp = new Date().toISOString().replace(/T/, '-').replace(/[-:]/g, '').substring(0, 15);
    const uniqueTxId = `TX-RECV-${txTimestamp}`;

    // 1. Prepare Transaction items
    const txItems: TransactionItem[] = draftItems.map((item) => ({
      productCode: item.productCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    // Generate Transaction Record
    const newTx: Transaction = {
      id: uniqueTxId,
      type: 'NHAN_THANH_PHAM',
      date,
      items: txItems,
      notes: notes.trim() || undefined,
      invoiceId: generatedInvoiceId
    };

    // 2. Prepare payments history list
    const payments: PaymentHistory[] = [];
    if (initialPaidAmount > 0) {
      payments.push({
        id: `PM-RECV-${txTimestamp}`,
        date,
        amount: initialPaidAmount,
        note: paymentNote.trim() || 'Thanh toán đợt nhận hàng'
      });
    }

    // Determine status of the accounts payable debt
    let status: 'UNPAID' | 'PARTIAL' | 'PAID' = 'UNPAID';
    if (initialPaidAmount === totalPaintCost) {
      status = 'PAID';
    } else if (initialPaidAmount > 0) {
      status = 'PARTIAL';
    }

    // Generate Invoice Record
    const newInvoice: Invoice = {
      id: generatedInvoiceId,
      transactionId: uniqueTxId,
      date,
      totalAmount: totalPaintCost,
      paidAmount: initialPaidAmount,
      status,
      payments,
      notes: notes.trim() || undefined
    };

    onAddReceiveTransaction(newTx, newInvoice);

    // Reset states
    setDraftItems([]);
    setNotes('');
    setInitialPaidAmount(0);
    alert(`Đã lưu hóa đơn thành công! Số Hóa Đơn: ${generatedInvoiceId}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Mini stock lists of guitar currently at paint shop */}
      <div className="lg:col-span-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Số Dư Tại Xưởng Sơn</h3>
          <p className="text-xs text-slate-500">Bấm dấu ＋ để nhanh chóng lập đơn nhận thành phẩm</p>
        </div>

        <div className="max-h-[460px] overflow-y-auto border border-slate-50 rounded-xl divide-y divide-slate-100">
          {productsAtPaintShop.map((item) => {
            const alreadyAdded = draftItems.some((d) => d.productCode === item.product.code);
            return (
              <div
                key={item.product.code}
                className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-all text-xs"
              >
                <div>
                  <h5 className="font-semibold text-slate-800">{item.product.name}</h5>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="font-mono font-bold text-slate-400">Mã: {item.product.code}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-semibold">
                      Đang sơn: <strong className="text-blue-600">{item.qtyAtPaint}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddItem(item.product.code)}
                  disabled={alreadyAdded}
                  className={`p-1.5 rounded-lg border transition ${
                    alreadyAdded
                      ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                  }`}
                  title="Thêm vào hóa đơn nhận"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Main receiving receipt builder form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-8 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex flex-col justify-between space-y-6"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-3 gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
                <span>Vận Đơn Nhận Thành Phẩm</span>
                <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  {generatedInvoiceId}
                </span>
              </h3>
              <p className="text-xs text-slate-500">Tự tính tiền công sơn & tự động cập nhật sổ nợ xưởng</p>
            </div>
            {draftItems.length > 0 && (
              <button
                type="button"
                onClick={() => setDraftItems([])}
                className="text-xs text-rose-500 hover:text-rose-600 flex items-center space-x-1 font-medium self-end sm:self-auto"
              >
                <Trash2 className="h-4 w-4" />
                <span>Xóa biểu mẫu</span>
              </button>
            )}
          </div>

          {/* Form details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày nhận thành phẩm</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-emerald-300 font-medium text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Ghi chú sự kiện</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Nhận đợt hoàn thiện sơn mờ 2K mỏng sáng bóng..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-emerald-300 text-slate-700 font-medium"
              />
            </div>
          </div>

          {/* Items spreadsheet */}
          <div className="border border-slate-100 rounded-xl overflow-hidden mt-2">
            <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase font-sans border-b border-slate-100 grid grid-cols-12 gap-2 text-left">
              <span className="col-span-5 sm:col-span-6">TÊN SẢN PHẨM / MÃ</span>
              <span className="col-span-3 sm:col-span-2 text-center">SỐ LƯỢNG MỚI</span>
              <span className="col-span-4 text-right">ĐƠN GIÁ CÔNG SƠN</span>
            </div>

            {draftItems.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                <CheckCircle className="h-8 w-8 text-slate-300" />
                <span>Hoá đơn rỗng. Nhấn dấu ＋ từ danh sách số dư đang sơn bên trái để kê khai!</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[220px] overflow-y-auto">
                {draftItems.map((item) => {
                  const p = products.find((prod) => prod.code === item.productCode);
                  const qtyAtPaint = stockMap[item.productCode]?.painting || 0;

                  return (
                    <div
                      key={item.productCode}
                      className="px-4 py-3 hover:bg-slate-50/20 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      {/* Name col */}
                      <div className="col-span-5 sm:col-span-6 min-w-0 pr-2">
                        <h6 className="font-semibold text-slate-800 truncate" title={p?.name}>
                          {p?.name || item.productCode}
                        </h6>
                        <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                          Mã: {item.productCode} | Đang sơn: <strong>{qtyAtPaint}</strong>
                        </span>
                      </div>

                      {/* Quantity Input */}
                      <div className="col-span-3 sm:col-span-2 flex justify-center">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.productCode, { quantity: parseInt(e.target.value) || 1 })}
                          className="w-16 text-center text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-hidden font-bold text-slate-800"
                        />
                      </div>

                      {/* Labor price Input */}
                      <div className="col-span-4 flex items-center justify-end space-x-2">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.productCode, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-20 sm:w-24 text-right text-xs pl-2 pr-5 py-1.5 border border-slate-200 rounded-lg outline-hidden font-bold text-slate-800"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-slate-400">đ</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productCode)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                          title="Gỡ dòng"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sổ Công Nợ / AP ledger post box right inside the receipt voucher wizard! */}
          {draftItems.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Ghi Nhận Thanh Toán (Đặt cọc / Trả trước)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Số tiền thanh toán ngay (đ)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={totalPaintCost}
                      value={initialPaidAmount}
                      onChange={(e) => handlePaidAmountChange(parseFloat(e.target.value) || 0)}
                      placeholder="Có thể bỏ trống để nợ hoàn toàn..."
                      className="w-full text-xs pl-3 pr-8 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-emerald-300 font-bold text-emerald-700"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">nghìn</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Đặt cọc bằng: <strong>{formatCurrency(initialPaidAmount)}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Ghi chú thanh toán</label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Ghi chú kèm theo, nộp tiền..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-emerald-300 text-slate-700 font-medium"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lower Submit and Summary columns */}
        {draftItems.length > 0 && (
          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Chi phí công sơn thành phẩm dự kiến:</p>
              <h2 className="text-xl font-bold text-slate-800">
                {formatCurrency(totalPaintCost)}{' '}
                {initialPaidAmount > 0 && (
                  <span className="text-xs font-medium text-slate-500">
                    (Ghi nợ: <strong className="text-rose-600">{formatCurrency(totalPaintCost - initialPaidAmount)}</strong>)
                  </span>
                )}
              </h2>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-100 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Nhập Kho TP & Tạo Hóa Đơn Phải Trả</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

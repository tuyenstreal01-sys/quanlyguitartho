import React, { useState, useMemo } from 'react';
import { Product, Transaction, TransactionItem } from '../types';
import { calculateStock } from '../utils';
import { Trash2, AlertTriangle, CheckSquare, RefreshCw } from 'lucide-react';

interface ScrapProductsProps {
  products: Product[];
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
}

export default function ScrapProducts({ products, transactions, onAddTransaction }: ScrapProductsProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromLocation, setFromLocation] = useState<'painting' | 'finished'>('painting');
  const [selectedProductCode, setSelectedProductCode] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Compute stock levels
  const stockMap = useMemo(() => {
    return calculateStock(transactions, products);
  }, [transactions, products]);

  // Current selected item stock level limit
  const maxAvailable = useMemo(() => {
    if (!selectedProductCode) return 0;
    const stock = stockMap[selectedProductCode];
    if (!stock) return 0;
    return fromLocation === 'finished' ? stock.finished : stock.painting;
  }, [selectedProductCode, fromLocation, stockMap]);

  // Handle location shift
  const handleLocationChange = (loc: 'painting' | 'finished') => {
    setFromLocation(loc);
    setQuantity(1);
  };

  const handleProductChange = (code: string) => {
    setSelectedProductCode(code);
    setQuantity(1);
  };

  const triggerConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductCode) {
      alert('Vui lòng chọn mã sản phẩm cần hủy.');
      return;
    }
    if (quantity < 1) {
      alert('Số lượng hủy phải lớn hơn hoặc bằng 1.');
      return;
    }
    if (quantity > maxAvailable) {
      alert(`Không thể xuất hủy nhiều hơn số lượng hiện có (${maxAvailable} chiếc).`);
      return;
    }
    if (!reason.trim()) {
      alert('Vui lòng điền cụ thể lý do xuất hủy hàng hóa này.');
      return;
    }

    setShowConfirm(true);
  };

  const executeScrap = () => {
    const timestamp = new Date().toISOString().replace(/T/, '-').replace(/[-:]/g, '').substring(0, 15);
    const uniqueTxId = `TX-HUY-${timestamp}`;

    const scrapItem: TransactionItem = {
      productCode: selectedProductCode,
      quantity,
      from: fromLocation,
      reason: reason.trim()
    };

    const newTx: Transaction = {
      id: uniqueTxId,
      type: 'XUAT_HUY',
      date,
      items: [scrapItem],
      notes: `Lý do hủy: ${reason.trim()}`
    };

    onAddTransaction(newTx);

    // Reset Form
    setSelectedProductCode('');
    setQuantity(1);
    setReason('');
    setShowConfirm(false);
    alert('Đã xuất hủy sản phẩm thành công!');
  };

  const selectedProductDetails = products.find((p) => p.code === selectedProductCode);

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Biên Bản Kê Khai Xuất Hủy</h2>
        <p className="text-xs text-slate-500">Khai báo phế phẩm nứt vỡ trong lò sơn, hỏng hóc hoặc trả sửa khách lỗi sơn</p>
      </div>

      <form onSubmit={triggerConfirm} className="space-y-4">
        {/* Date and Location selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày lập biên bản</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-red-300 font-medium text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Hủy hàng từ kho / vị trí nào?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLocationChange('painting')}
                className={`text-xs py-2 rounded-lg font-medium border transition-colors ${
                  fromLocation === 'painting'
                    ? 'bg-red-50 border-red-300 text-red-700 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Xưởng sơn ngoại
              </button>
              <button
                type="button"
                onClick={() => handleLocationChange('finished')}
                className={`text-xs py-2 rounded-lg font-medium border transition-colors ${
                  fromLocation === 'finished'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Kho thành phẩm
              </button>
            </div>
          </div>
        </div>

        {/* Product selection and available display */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Chọn sản phẩm xuất hủy</label>
            <select
              value={selectedProductCode}
              required
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-red-300 outline-hidden text-slate-700 font-medium cursor-pointer"
            >
              <option value="">-- Vui lòng chọn mã đàn --</option>
              {products.map((p) => {
                const stock = stockMap[p.code] || { painting: 0, finished: 0 };
                const qtyVal = fromLocation === 'finished' ? stock.finished : stock.painting;
                return (
                  <option key={p.code} value={p.code} disabled={qtyVal === 0}>
                    {p.name} ({p.code}) — Có {qtyVal} chiếc sẵn sàng
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quantity selector bounded */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Số lượng hủy</label>
            <input
              type="number"
              min="1"
              max={maxAvailable || 1}
              required
              disabled={!selectedProductCode}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxAvailable, parseInt(e.target.value) || 1))}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-red-300 font-bold text-slate-800"
            />
          </div>
        </div>

        {/* Display details of stock loss */}
        {selectedProductCode && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/60 text-xs space-y-1">
            <p className="text-slate-600">
              Sản phẩm: <strong>{selectedProductDetails?.name}</strong> (Mã {selectedProductCode})
            </p>
            <p className="text-slate-600">
              Vị trí giảm trừ: <strong>{fromLocation === 'finished' ? 'Kho thành phẩm' : 'Đóng tại lò Sơn xưởng ngoài'}</strong>
            </p>
            <p className="text-slate-600">
              Tồn kho tối đa khả dụng: <strong className="text-red-600">{maxAvailable} chiếc</strong>
            </p>
          </div>
        )}

        {/* Reason string input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Chi tiết lý do xuất hủy</label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Khai rõ lý do nứt sớ mộc, trầy tróc mảng lớn sơn lại không đạt hoặc hư hỏng nặng từ khách..."
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-red-300 text-slate-700 font-medium"
          />
        </div>

        {/* Button Trigger */}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-red-50"
        >
          <Trash2 className="h-4 w-4" />
          <span>Lập Biên Bản & Xuất Tiêu Hủy</span>
        </button>
      </form>

      {/* Confirmation Modal overlay inside */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="h-6 w-6 stroke-2" />
              <h3 className="text-base font-bold text-slate-800">Xác Nhận Xuất Hủy Hàng Hóa</h3>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>Bạn đang lập biên bản hủy vĩnh viễn hàng hóa sau từ sổ theo dõi:</p>
              <div className="bg-red-50/50 p-3 rounded-xl border border-red-100/50 space-y-1 font-medium">
                <p>— Mã sản phẩm: <strong>{selectedProductCode}</strong></p>
                <p>— Tên đàn: <strong>{selectedProductDetails?.name}</strong></p>
                <p>— Số lượng hủy: <strong className="text-red-700">{quantity} chiếc</strong></p>
                <p>— Vị trí: <strong>{fromLocation === 'finished' ? 'Kho thành phẩm' : 'Đang sơn bên ngoài'}</strong></p>
                <p>— Lý do: <em>"{reason}"</em></p>
              </div>
              <p className="text-[11px] text-amber-650 font-medium">
                ⚠️ Hành động này sẽ giảm vĩnh viễn số dư tồn kho thực tế và không thể tự khôi phục trực tiếp. Bạn chắc chắn muốn hoàn thành?
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2.5">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeScrap}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition flex items-center space-x-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Tôi đồng ý xuất hủy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

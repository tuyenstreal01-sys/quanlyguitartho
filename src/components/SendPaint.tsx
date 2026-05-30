import React, { useState, useMemo } from 'react';
import { Product, Transaction, TransactionItem } from '../types';
import { Plus, Trash2, Send, Beer, AlertCircle, Sparkles } from 'lucide-react';

interface SendPaintProps {
  products: Product[];
  onAddTransaction: (tx: Transaction) => void;
}

interface DraftItem {
  productCode: string;
  quantity: number;
}

export default function SendPaint({ products, onAddTransaction }: SendPaintProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  // Draft delivery basket
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  // Unique groups list
  const groupsList = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.group) list.add(p.group);
    });
    return Array.from(list);
  }, [products]);

  // Catalog filtered based on selection
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedGroup !== 'All' && p.group !== selectedGroup) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return p.code.toLowerCase().includes(term) || p.name.toLowerCase().includes(term);
      }
      return true;
    });
  }, [products, selectedGroup, searchTerm]);

  // Add Item callback from catalog or manual
  const handleAddItem = (code: string) => {
    setDraftItems((prev) => {
      const existing = prev.find((item) => item.productCode === code);
      if (existing) {
        return prev.map((item) =>
          item.productCode === code ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productCode: code, quantity: 5 }]; // Default sending 5
    });
  };

  const handleUpdateQty = (code: string, qty: number) => {
    if (qty < 1) return;
    setDraftItems((prev) =>
      prev.map((item) => (item.productCode === code ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveItem = (code: string) => {
    setDraftItems((prev) => prev.filter((item) => item.productCode !== code));
  };

  // Submit GUI_SON
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để gửi sơn.');
      return;
    }

    // Generate neat unique ID
    const timestamp = new Date().toISOString().replace(/T/, '-').replace(/[-:]/g, '').substring(0, 15);
    const uniqueId = `TX-GS-${timestamp}`;

    const items: TransactionItem[] = draftItems.map((d) => ({
      productCode: d.productCode,
      quantity: d.quantity
    }));

    const newTx: Transaction = {
      id: uniqueId,
      type: 'GUI_SON',
      date,
      items,
      notes: notes.trim() || undefined
    };

    onAddTransaction(newTx);

    // Reset draft
    setDraftItems([]);
    setNotes('');
    alert('Đã lưu giao dịch gửi sơn thành công!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Catalog picker */}
      <div className="lg:col-span-5 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Chọn Mã Sản Phẩm</h3>
          <p className="text-xs text-slate-500">Bấm dấu ＋ để thêm trực tiếp vào danh sách xuất thô</p>
        </div>

        {/* Filters and search */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Tìm mã hoặc tên đàn thô..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-blue-300"
          />

          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedGroup('All')}
              className={`text-[10px] px-2.5 py-1 rounded-md mb-1 font-medium transition-colors ${
                selectedGroup === 'All'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {groupsList.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`text-[10px] px-2.5 py-1 rounded-md mb-1 font-medium transition-colors ${
                  selectedGroup === g
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog List */}
        <div className="max-h-[380px] overflow-y-auto border border-slate-50 rounded-xl divide-y divide-slate-100">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy sản phẩm thô nào.</div>
          ) : (
            filteredProducts.map((p) => {
              const inBasket = draftItems.find((item) => item.productCode === p.code);
              return (
                <div key={p.code} className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-all">
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800">{p.name}</h5>
                    <p className="text-[10px] font-mono font-medium text-slate-400 uppercase">Mã: {p.code} | {p.group}</p>
                  </div>
                  <button
                    onClick={() => handleAddItem(p.code)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      inBasket
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                    title="Thêm vào danh sách gửi"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Selected Shipping packing builder */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
                <span>Phiếu Gửi Hàng Đi Sơn</span>
                <span className="text-xs font-normal text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Kho thô vô hạn
                </span>
              </h3>
              <p className="text-xs text-slate-500">Kiểm tra thông tin chi tiết và số lượng xuất xưởng</p>
            </div>
            {draftItems.length > 0 && (
              <button
                type="button"
                onClick={() => setDraftItems([])}
                className="text-xs text-rose-500 hover:text-rose-600 flex items-center space-x-1 font-medium"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa hết</span>
              </button>
            )}
          </div>

          {/* Core settings - date, note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày gửi hàng</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-300 font-medium text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Ghi chú vận chuyển</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Giao xe ôm buổi sáng, đóng thùng cẩn thận..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-300 text-slate-700 font-medium"
              />
            </div>
          </div>

          {/* Packing basket List */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase font-sans border-b border-slate-100">
              Sản phẩm trong phiếu gửi ({draftItems.length})
            </div>

            {draftItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                <Beer className="h-8 w-8 text-slate-300" />
                <span>Phiếu gửi hiện đang trống. Bấm dấu ＋ từ danh mục sản phẩm thô bên trái để thêm ngay!</span>
              </div>
            ) : (
              <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-50">
                {draftItems.map((item, idx) => {
                  const p = products.find((prod) => prod.code === item.productCode);
                  return (
                    <div key={item.productCode} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/20">
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                          #{idx + 1}
                        </span>
                        <span className="ml-2 text-xs font-semibold text-slate-800">{p?.name || item.productCode}</span>
                        <span className="block text-[10px] font-mono text-slate-400 mt-0.5">Mã: {item.productCode}</span>
                      </div>

                      {/* Quantity selector */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productCode, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-xs text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-xs rounded transition-all font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQty(item.productCode, parseInt(e.target.value) || 1)}
                            className="w-10 text-center text-xs border-0 bg-transparent outline-hidden font-bold text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productCode, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-xs text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-xs rounded transition-all font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productCode)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
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
        </div>

        {/* Submit shipping btn */}
        <button
          type="submit"
          disabled={draftItems.length === 0}
          className={`w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            draftItems.length === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Gửi sang Xưởng Sơn Ngoài ({draftItems.reduce((acc, curr) => acc + curr.quantity, 0)} chiếc)</span>
        </button>
      </form>
    </div>
  );
}

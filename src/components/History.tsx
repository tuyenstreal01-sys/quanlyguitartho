import React, { useState, useMemo } from 'react';
import { Transaction, Product } from '../types';
import { formatDate, formatCurrency } from '../utils';
import { Search, Trash2, Calendar, FileText, XCircle, Paintbrush, CheckCircle, RefreshCw } from 'lucide-react';

interface HistoryProps {
  transactions: Transaction[];
  products: Product[];
  onDeleteTransaction: (id: string) => void;
  onClearAllTransactions: () => void;
}

export default function History({
  transactions,
  products,
  onDeleteTransaction,
  onClearAllTransactions
}: HistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All'); // All, GUI_SON, NHAN_THANH_PHAM, XUAT_HUY
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtering transactions
  const filteredTransactions = useMemo(() => {
    // Sort transactions by date descending (newest first)
    const sortedTx = [...transactions].sort((a, b) => b.id.localeCompare(a.id));

    return sortedTx.filter((tx) => {
      // 1. Transaction Type filter
      if (selectedType !== 'All' && tx.type !== selectedType) return false;

      // 2. Date filters
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // 3. Search Term filter (matches transaction ID, notes, or product codes inside)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const idMatch = tx.id.toLowerCase().includes(term);
        const notesMatch = tx.notes && tx.notes.toLowerCase().includes(term);
        const codeMatch = tx.items.some((item) => item.productCode.toLowerCase().includes(term));

        if (!idMatch && !notesMatch && !codeMatch) return false;
      }

      return true;
    });
  }, [transactions, selectedType, startDate, endDate, searchTerm]);

  // Specific confirmation handlers
  const handleDeleteRow = (id: string) => {
    if (confirm(`Bạn chắc chắn muốn xóa vĩnh viễn dòng lịch sử '${id}' không?\nTồn kho và công nợ liên quan sẽ được tự động cập nhật lại.`)) {
      onDeleteTransaction(id);
    }
  };

  const handleClearAll = () => {
    if (confirm('⚠️ CẢNH BÁO CỰC KỲ QUAN TRỌNG!\nHành động này sẽ xóa toàn bộ nhật ký giao dịch trong sổ của bạn.\nTồn kho và công nợ sẽ trở về 0.\nBạn có chắc chắn muốn thực hiện?')) {
      onClearAllTransactions();
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-50 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Sổ Nhật Ký Giao Dịch</h2>
          <p className="text-xs text-slate-500">Xem và hiệu chỉnh các đợt xuất thô, nhận thành phẩm và xuất hủy từ trước đến nay</p>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
          >
            <XCircle className="h-4 w-4" />
            <span>Xóa toàn bộ nhật ký</span>
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/55 p-4 rounded-xl border border-slate-100">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tìm kiếm nhanh
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Mã đàn, mã phiếu, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-300 outline-hidden font-medium text-slate-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Loại giao dịch
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-300 outline-hidden text-slate-700 font-medium cursor-pointer"
          >
            <option value="All">Tất cả biên lai</option>
            <option value="GUI_SON">Gửi xưởng sơn (Xuất thô)</option>
            <option value="NHAN_THANH_PHAM">Nhận thành phẩm (Vào kho)</option>
            <option value="XUAT_HUY">Hủy hàng hóa (Giảm kho)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-200 focus:border-indigo-300 outline-hidden font-medium text-slate-700"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-200 focus:border-indigo-300 outline-hidden font-medium text-slate-700"
          />
        </div>
      </div>

      {/* Transactions list */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-xs text-left text-slate-650">
          <thead className="text-slate-705 uppercase bg-slate-50 font-bold tracking-wider border-b border-slate-100">
            <tr>
              <th scope="col" className="px-4 py-3">Mã phiếu</th>
              <th scope="col" className="px-4 py-3">Ngày lưu</th>
              <th scope="col" className="px-4 py-3">Nghiệp vụ</th>
              <th scope="col" className="px-4 py-3">Sản phẩm chi tiết</th>
              <th scope="col" className="px-4 py-3">Tổng số lượng</th>
              <th scope="col" className="px-4 py-3">Ghi chú</th>
              <th scope="col" className="px-3 py-3 text-center">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-medium">
                  Chưa ghi nhận giao dịch nào khớp với bộ lọc khảo sát.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                let typeBadge = '';
                let typeLabel = '';

                if (tx.type === 'GUI_SON') {
                  typeBadge = 'bg-blue-50 border-blue-150 text-blue-700';
                  typeLabel = 'Gửi xưởng sơn';
                } else if (tx.type === 'NHAN_THANH_PHAM') {
                  typeBadge = 'bg-emerald-50 border-emerald-150 text-emerald-700';
                  typeLabel = 'Nhận thành phẩm';
                } else if (tx.type === 'XUAT_HUY') {
                  typeBadge = 'bg-rose-50 border-rose-150 text-rose-700';
                  typeLabel = 'Xuất hủy';
                }

                // Sum items count
                const totalItemQty = tx.items.reduce((acc, curr) => acc + curr.quantity, 0);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/40 transition-all font-medium">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800">{tx.id}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${typeBadge}`}>
                        {typeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      <div className="space-y-1 max-w-[260px]">
                        {tx.items.map((item) => {
                          const prod = products.find((p) => p.code === item.productCode);
                          return (
                            <div key={item.productCode} className="flex justify-between items-center bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              <span className="font-semibold text-[10px] truncate">{prod?.name || item.productCode}</span>
                              <span className="font-mono font-bold text-indigo-650 shrink-0 ml-2">
                                x{item.quantity}
                                {item.unitPrice ? ` (${formatCurrency(item.unitPrice)})` : ''}
                                {item.from ? ` (Hủy ở: ${item.from === 'finished' ? 'Kho' : 'Sơn'})` : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-slate-800 text-center">
                      {totalItemQty.toLocaleString()} chiếc
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-[180px] break-words">
                      {tx.notes || <span className="text-slate-350 italic">—</span>}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg transition-all"
                        title="Xóa dòng giao dịch này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

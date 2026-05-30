import React, { useState } from 'react';
import { Settings, Product } from '../types';
import { Save, RefreshCw, Plus, Trash2, Download, Upload, AlertOctagon } from 'lucide-react';
import { DEFAULT_PRICES } from '../utils';

interface SettingsProps {
  settings: Settings;
  products: Product[];
  onUpdateSettings: (updated: Settings) => void;
  onAddProduct: (prod: Product) => void;
  onDeleteProduct: (code: string) => void;
  onRestoreAllData: (bundle: {
    products: Product[];
    settings: Settings;
    transactions: any[];
    invoices: any[];
  }) => void;
  onResetFactory: () => void;
}

export default function SettingsComponent({
  settings,
  products,
  onUpdateSettings,
  onAddProduct,
  onDeleteProduct,
  onRestoreAllData,
  onResetFactory
}: SettingsProps) {
  // Workshop Configuration States
  const [rawName, setRawName] = useState(settings.rawWorkshopName);
  const [paintName, setPaintName] = useState(settings.paintWorkshopName);
  const [paintAddr, setPaintAddr] = useState(settings.paintWorkshopAddress);
  const [paintPhone, setPaintPhone] = useState(settings.paintWorkshopPhone);
  const [alertThreshold, setAlertThreshold] = useState<number>(settings.alertThreshold);

  // Editable prices states
  const [editablePrices, setEditablePrices] = useState<Record<string, number>>({
    ...settings.defaultPrices
  });

  // Adding Custom Product States
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('X Series');
  const [customGroupText, setCustomGroupText] = useState('');

  // Tab internal states
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'prices' | 'products' | 'backup'>('info');

  // Trigger Save workshop info
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Settings = {
      ...settings,
      rawWorkshopName: rawName.trim(),
      paintWorkshopName: paintName.trim(),
      paintWorkshopAddress: paintAddr.trim(),
      paintWorkshopPhone: paintPhone.trim(),
      alertThreshold
    };
    onUpdateSettings(updated);
    alert('Đã cập nhật thông tin và cài đặt ngưỡng cảnh báo thành công!');
  };

  // Trigger Save Labor rates
  const handleSavePrices = () => {
    const updated: Settings = {
      ...settings,
      defaultPrices: editablePrices
    };
    onUpdateSettings(updated);
    alert('Đã lưu bảng giá công sơn mặc định thành công!');
  };

  const handleUpdatePriceField = (code: string, value: number) => {
    if (value < 0) return;
    setEditablePrices((prev) => ({
      ...prev,
      [code]: value
    }));
  };

  // Trigger Add new custom product
  const handleAddNewProductSub = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase();
    if (!cleanCode) {
      alert('Vui lòng điền mã sản phẩm.');
      return;
    }
    // Check duplication
    if (products.some((p) => p.code.toLowerCase() === cleanCode.toLowerCase())) {
      alert(`Mã sản phẩm '${cleanCode}' đã tồn tại trong danh sách hệ thống.`);
      return;
    }

    const groupToSave = newGroup === 'Custom' ? customGroupText.trim() : newGroup;
    if (!groupToSave) {
      alert('Vui lòng định nghĩa tên nhóm sản phẩm.');
      return;
    }

    const newProd: Product = {
      code: cleanCode,
      name: newName.trim() || `Guitar ${cleanCode}`,
      group: groupToSave,
      isCustom: true
    };

    onAddProduct(newProd);

    // Update editablePrices default if missing
    setEditablePrices((prev) => ({
      ...prev,
      [cleanCode]: 150 // default price starts at 150k
    }));

    // Reset Form
    setNewCode('');
    setNewName('');
    setCustomGroupText('');
    alert(`Đã tạo thành công sản phẩm mới: ${cleanCode}!`);
  };

  // Back-up Export JSON
  const handleBackupExport = () => {
    try {
      const dataStr = localStorage.getItem('guitar_data_all_bundle');
      const backupObj = {
        products,
        settings,
        transactions: JSON.parse(localStorage.getItem('guitar_transactions') || '[]'),
        invoices: JSON.parse(localStorage.getItem('guitar_invoices') || '[]')
      };

      const jsonBlob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
      const dlLink = document.createElement('a');
      dlLink.download = `GUITAR_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      dlLink.href = URL.createObjectURL(jsonBlob);
      dlLink.click();
    } catch {
      alert('Gặp lỗi khi tạo file sao lưu.');
    }
  };

  // Read Backup File inside
  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.products || !json.settings || !json.transactions || !json.invoices) {
          alert('Tệp phục hồi không đúng định dạng chuẩn của ứng dụng.');
          return;
        }

        if (confirm('Hành động phục hồi này sẽ thay thế TOÀN BỘ dữ liệu hiện tại bằng dữ liệu trong file sao lưu.\nBạn có muốn tiếp tục?')) {
          onRestoreAllData({
            products: json.products,
            settings: json.settings,
            transactions: json.transactions,
            invoices: json.invoices
          });

          // Sync local settings copy
          setRawName(json.settings.rawWorkshopName);
          setPaintName(json.settings.paintWorkshopName);
          setPaintAddr(json.settings.paintWorkshopAddress);
          setPaintPhone(json.settings.paintWorkshopPhone);
          setAlertThreshold(json.settings.alertThreshold);
          setEditablePrices(json.settings.defaultPrices);

          alert('Đã phục hồi toàn bộ dữ liệu thành công!');
        }
      } catch {
        alert('Có lỗi xảy ra khi phân tích tệp JSON phục hồi.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <div className="md:col-span-3 bg-slate-50 p-4 border-r border-slate-100 flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest pl-2.5 mb-4">Cài Đặt Hệ Thống</h3>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveSubTab('info')}
              className={`w-full text-left font-medium text-xs px-3 py-2.5 rounded-xl transition ${
                activeSubTab === 'info'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-950'
              }`}
            >
              Thông tin & Ngưỡng
            </button>
            <button
              onClick={() => setActiveSubTab('prices')}
              className={`w-full text-left font-medium text-xs px-3 py-2.5 rounded-xl transition ${
                activeSubTab === 'prices'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-950'
              }`}
            >
              Bảng giá Công Sơn
            </button>
            <button
              onClick={() => setActiveSubTab('products')}
              className={`w-full text-left font-medium text-xs px-3 py-2.5 rounded-xl transition ${
                activeSubTab === 'products'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-950'
              }`}
            >
              Quản lý Sản Phẩm (+ Mới)
            </button>
            <button
              onClick={() => setActiveSubTab('backup')}
              className={`w-full text-left font-medium text-xs px-3 py-2.5 rounded-xl transition ${
                activeSubTab === 'backup'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-950'
              }`}
            >
              Sao lưu & Hoàn tác
            </button>
          </nav>
        </div>

        {/* Global Factory Clear Wipe */}
        <div className="pt-8 border-t border-slate-200">
          <button
            onClick={() => {
              if (confirm('🔥 CHÚÝ! Bạn có chắc chắn muốn KHÔI PHỤC CÀI ĐẶT GỐC?\nToàn bộ dữ liệu tự định nghĩa, mọi hóa đơn và lịch sử giao dịch sẽ được xóa bỏ sạch sẽ và hoàn nguyên về dữ liệu mẫu ban đầu.\nHành động này KHÔNG THỂ đảo ngược.')) {
                onResetFactory();
                alert('Đã xóa dữ liệu và đưa hệ thống về trạng thái mặc định.');
              }
            }}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <AlertOctagon className="h-4 w-4" />
            <span>Xóa Sạch Dữ Liệu</span>
          </button>
        </div>
      </div>

      {/* Settings Active tab Panel content */}
      <div className="md:col-span-9 p-6">
        {/* SUBTAB 1: Workshop & Alerts Threshold */}
        {activeSubTab === 'info' && (
          <form onSubmit={handleSaveInfo} className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">Thông Tin Tổ Chức & Cảnh Báo</h3>
              <p className="text-xs text-slate-450">Thiết lập thương hiệu và địa chỉ xuất hiện trên các phiếu công nợ đối chiếu dán in</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tên xưởng mộc thô ban đầu (Bên A)</label>
                <input
                  type="text"
                  required
                  value={rawName}
                  onChange={(e) => setRawName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-400 font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tên xưởng sơn ngoài ủy nhiệm (Bên B)</label>
                <input
                  type="text"
                  required
                  value={paintName}
                  onChange={(e) => setPaintName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-400 font-medium text-slate-700"
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Địa chỉ xưởng sơn ngoại</label>
                  <input
                    type="text"
                    required
                    value={paintAddr}
                    onChange={(e) => setPaintAddr(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-400 font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">SĐT liên hệ xưởng sơn</label>
                  <input
                    type="text"
                    required
                    value={paintPhone}
                    onChange={(e) => setPaintPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-400 font-medium text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex justify-between">
                <span>Ngưỡng Cảnh Báo Hàng Sắp Hết</span>
                <span className="text-xs text-indigo-600 font-bold">{alertThreshold} cây đàn</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Khi số lượng đàn <strong>thành phẩm tồn kho</strong> của bất kỳ mẫu nào rơi xuống dưới hoặc bằng ngưỡng này, hệ thống tự hiển thị cảnh báo đỏ nổi bật.
              </p>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value) || 0)}
                  className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value) || 0)}
                  className="w-16 text-center text-xs px-2 py-1 border border-slate-200 rounded font-bold"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-100 flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Lưu thông tin & Ngưỡng</span>
              </button>
            </div>
          </form>
        )}

        {/* SUBTAB 2: Default labor Rate configurations */}
        {activeSubTab === 'prices' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Biểu Giá Sơn Thành Phẩm Mặc Định</h3>
              <p className="text-xs text-slate-450">
                Lưu trữ giá công mộc mặc định cho từng mẫu đàn (nghìn đồng/chiếc) để hệ thống tự điền khi nhận thành phẩm.
              </p>
            </div>

            {/* Price list grid editable */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {products.map((p) => {
                const currentVal = editablePrices[p.code] !== undefined ? editablePrices[p.code] : 150;
                return (
                  <div
                    key={p.code}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 flex flex-col justify-between"
                  >
                    <div>
                      <h5 className="font-semibold text-xs text-slate-800 truncate" title={p.name}>
                        {p.code} — {p.name}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-mono italic">{p.group}</span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={currentVal}
                        onChange={(e) => handleUpdatePriceField(p.code, parseFloat(e.target.value) || 0)}
                        className="w-full text-xs pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold outline-hidden focus:border-indigo-400"
                      />
                      <span className="absolute right-2.5 top-2.5 text-[9px] text-slate-400 font-bold">đ</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSavePrices}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-100 flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Cập nhật bảng giá sơn</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Product Management and Create Product form */}
        {activeSubTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Product Creation */}
            <form onSubmit={handleAddNewProductSub} className="lg:col-span-5 bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-4 h-fit">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1">
                  <Plus className="h-4 w-4 text-emerald-600" />
                  <span>Sản phẩm mới</span>
                </h4>
                <p className="text-[10px] text-slate-450">Tạo mã thô mới để bắt đầu lưu kho và gửi sơn</p>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Mã sản phẩm (Viết liền, in hoa)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: X9, C6, D1, MINI2"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg outline-hidden focus:border-emerald-400 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Tên sản phẩm</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Guitar Acoustic gỗ mộc X9"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg outline-hidden focus:border-emerald-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Phân nhóm đàn</label>
                <select
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg outline-hidden text-slate-750 font-medium cursor-pointer"
                >
                  <option value="X Series">X Series</option>
                  <option value="C Series">C Series</option>
                  <option value="Đặc biệt">Đặc biệt</option>
                  <option value="Custom">Tạo nhóm tùy chỉnh mới...</option>
                </select>
              </div>

              {newGroup === 'Custom' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Tên nhóm tùy chỉnh</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: D Series"
                    value={customGroupText}
                    onChange={(e) => setCustomGroupText(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg outline-hidden focus:border-emerald-400"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Khai báo sản phẩm mới</span>
              </button>
            </form>

            {/* Custom/Registry Products lists */}
            <div className="lg:col-span-7 bg-white border border-slate-100 p-4 rounded-xl space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Danh sách danh mục ({products.length})</h4>
                <p className="text-[10px] text-slate-450">Có thể xóa các mã đàn tùy chỉnh do chính bạn tự tạo bồi</p>
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50 border border-slate-100 rounded-lg">
                {products.map((p) => (
                  <div key={p.code} className="flex items-center justify-between p-2.5 hover:bg-slate-50 text-xs font-medium">
                    <div>
                      <h5 className="font-semibold text-slate-800">
                        {p.code} <span className="font-normal text-slate-500">— {p.name}</span>
                      </h5>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                        {p.group}
                      </span>
                    </div>

                    {p.isCustom ? (
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa mã sản phẩm '${p.code}' khỏi dữ liệu?`)) {
                            onDeleteProduct(p.code);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                        title="Xóa mã sản phẩm này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-350 pr-2 italic">Mặc định</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: Backup Operations */}
        {activeSubTab === 'backup' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Sao Lưu & Phục Hồi Dữ Liệu</h3>
              <p className="text-xs text-slate-450">Tải tệp nén sao lưu đầy đủ gồm tồn kho, cài đặt thô và công nợ để lưu về PC</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Box */}
              <div className="p-5 bg-indigo-50/20 border border-indigo-100 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Download className="h-4.5 w-4.5 text-indigo-600" />
                  <span>Trích xuất file sao lưu</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Xuất toàn bộ cấu trúc cơ sở dữ liệu hiện tại (gồm danh mục sản phẩm tùy chỉnh, sổ giao dịch thô, tiền công nợ hóa đơn) ra một tệp JSON về thiết bị của bạn.
                </p>
                <button
                  onClick={handleBackupExport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Tải file sao lưu (.JSON)
                </button>
              </div>

              {/* Import Box */}
              <div className="p-5 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Upload className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Phục hồi từ file sẵn có</span>
                </h4>
                <p className="text-[11px] text-slate-550 leading-relaxed">
                  Tải lên tệp sao lưu định dạng `.json` đã lưu từ trước để nạp đè lên hệ thống. Đảm bảo file được xuất chính gốc từ nền tảng ứng dụng này.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleBackupImport}
                    className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Product, Transaction, Invoice, Settings } from './types';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
  SEED_TRANSACTIONS,
  SEED_INVOICES,
  calculateStock
} from './utils';

// Components
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import SendPaint from './components/SendPaint';
import ReceiveFinished from './components/ReceiveFinished';
import ScrapProducts from './components/ScrapProducts';
import Debts from './components/Debts';
import Analytics from './components/Analytics';
import History from './components/History';
import SettingsComponent from './components/Settings';

// Icons
import {
  LayoutDashboard,
  Layers,
  Send,
  CornerDownLeft,
  Trash2,
  DollarSign,
  BarChart3,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Guitar,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- STATE INITIALIZATION WITH LOCALSTORAGE SYNC ---
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('guitar_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('guitar_transactions');
    return saved ? JSON.parse(saved) : SEED_TRANSACTIONS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('guitar_invoices');
    return saved ? JSON.parse(saved) : SEED_INVOICES;
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('guitar_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Save states to localStorage whenever modified
  useEffect(() => {
    localStorage.setItem('guitar_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('guitar_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('guitar_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('guitar_settings', JSON.stringify(settings));
  }, [settings]);

  // --- ACTIONS STATE CALLBACK HANDLERS ---

  // Add a standard transaction (e.g. Sent for Paint, Scrapped)
  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Add receiving transaction and its mapped debt Invoice
  const handleAddReceiveTransaction = (newTx: Transaction, newInv: Invoice) => {
    setTransactions((prev) => [newTx, ...prev]);
    setInvoices((prev) => [newInv, ...prev]);
  };

  // Update payment logs or details of an Invoice
  const handleUpdateInvoice = (updatedInv: Invoice) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updatedInv.id ? updatedInv : inv)));
  };

  // Save Settings from component
  const handleUpdateSettings = (updatedSettings: Settings) => {
    setSettings(updatedSettings);
  };

  // Product management: Add custom created product
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [...prev, newProd]);
  };

  // Product management: Delete custom created product
  const handleDeleteProduct = (code: string) => {
    setProducts((prev) => prev.filter((p) => p.code !== code));
    // Clean associated settings defaults
    setSettings((prev) => {
      const copyPrices = { ...prev.defaultPrices };
      delete copyPrices[code];
      return { ...prev, defaultPrices: copyPrices };
    });
  };

  // History management: Delete single record
  const handleDeleteTransaction = (id: string) => {
    // Lookup if transaction is receive, and if it has invoice associated
    const targetTx = transactions.find((t) => t.id === id);
    if (targetTx?.type === 'NHAN_THANH_PHAM' && targetTx.invoiceId) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== targetTx.invoiceId));
    }

    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  // Clear all transaction logs & wipe bills
  const handleClearAllTransactions = () => {
    setTransactions([]);
    setInvoices([]);
  };

  // Restore dataset completely from copy file
  const handleRestoreAllData = (bundle: {
    products: Product[];
    settings: Settings;
    transactions: Transaction[];
    invoices: Invoice[];
  }) => {
    setProducts(bundle.products);
    setSettings(bundle.settings);
    setTransactions(bundle.transactions);
    setInvoices(bundle.invoices);
  };

  // Full system hard-wipe to factory defaults
  const handleResetFactory = () => {
    setProducts(DEFAULT_PRODUCTS);
    setSettings(DEFAULT_SETTINGS);
    setTransactions(SEED_TRANSACTIONS);
    setInvoices(SEED_INVOICES);
  };

  // Side navigation menu items definitions
  const tabsList = [
    { id: 'dashboard', label: '📊 Tổng quan', icon: LayoutDashboard },
    { id: 'inventory', label: '📦 Tồn kho', icon: Layers },
    { id: 'send', label: '📤 Gửi sơn', icon: Send },
    { id: 'receive', label: '📥 Nhận TP', icon: CornerDownLeft },
    { id: 'scrap', label: '🗑 Xuất hủy', icon: Trash2 },
    { id: 'debts', label: '💳 Công nợ', icon: DollarSign },
    { id: 'analytics', label: '📈 Phân tích', icon: BarChart3 },
    { id: 'history', label: '📋 Lịch sử', icon: HistoryIcon },
    { id: 'settings', label: '⚙️ Cài đặt', icon: SettingsIcon }
  ];

  const handleTabSwitch = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-[#f9fafb] flex flex-col lg:flex-row font-sans antialiased text-[#1f2937]">
      
      {/* 1. Desktop Sidebar Navigation (Hidden on print or mobile) */}
      <aside className="no-print w-60 bg-white border-r border-[#e5e7eb] hidden lg:flex flex-col h-screen sticky top-0 shrink-0 select-none">
        
        {/* Brand/Logo Header */}
        <div className="p-6 border-b border-[#e5e7eb]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Guitar className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                GUITAR <span className="text-[#2563eb] font-extrabold">PRO</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Xưởng Sản Xuất &amp; Sơn</p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {tabsList.map((item) => {
            const TabIcon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSwitch(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-xs font-semibold rounded-xl tracking-wide transition-all ${
                  isActive
                    ? 'bg-[#eff6ff] text-[#2563eb] border-r-3 border-[#2563eb]'
                    : 'text-slate-500 hover:text-slate-905 hover:bg-slate-50/70'
                }`}
              >
                <TabIcon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#2563eb]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer badge */}
        <div className="p-4 border-t border-[#e5e7eb] bg-slate-50/50">
          <div className="text-[10px] text-slate-450 text-center font-medium font-mono">
            SỔ NỘI BỘ MẬT • TRÌNH TRUYỆT
          </div>
        </div>
      </aside>

      {/* 2. Right Side Canvas Wrapper */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        
        {/* Mobile Header (Hidden on print or desktop) */}
        <header className="no-print lg:hidden bg-white border-b border-[#e5e7eb] sticky top-0 z-30 h-16 px-4 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center space-x-2.5 select-none">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Guitar className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div>
              <h1 className="text-xs font-bold tracking-tight text-slate-900 leading-none">GUITAR <span className="text-[#2563eb]">PRO</span></h1>
              <span className="text-[9px] text-slate-400 font-medium block mt-0.5 uppercase">Sổ nội bộ xưởng</span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-500 hover:text-slate-950 hover:bg-slate-50 rounded-xl border border-slate-100 transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="no-print lg:hidden bg-white border-b border-[#e5e7eb] sticky top-16 z-40 shadow-md">
            <nav className="p-4 space-y-1">
              {tabsList.map((item) => {
                const TabIcon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSwitch(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                      isActive
                        ? 'bg-[#eff6ff] text-[#2563eb]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <TabIcon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Desktop Header panel status bar (Hidden on print or mobile) */}
        <header className="no-print hidden lg:flex h-16 bg-white border-b border-[#e5e7eb] items-center justify-between px-8 sticky top-0 z-20 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' ? 'Overview Dashboard' : 
               activeTab === 'inventory' ? 'Báo Cáo Tồn Kho' :
               activeTab === 'send' ? 'Gửi Sản Phẩm Sơn' :
               activeTab === 'receive' ? 'Nhận Thành Phẩm Đàn' :
               activeTab === 'scrap' ? 'Xuất Hủy Hàng Hóa' :
               activeTab === 'debts' ? 'Sổ Theo Dõi Công Nợ' :
               activeTab === 'analytics' ? 'Bản Đồ Phân Tích Kinh Doanh' :
               activeTab === 'history' ? 'Nhật Ký Sổ Giao Dịch' :
               activeTab === 'settings' ? 'Cài Đặt Hệ Thống' : 'Quản Lý Guitar'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right select-none">
              <div className="text-xs font-bold text-slate-800">Cửa hàng &amp; Xưởng mộc</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Admin Phiên làm việc</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-xs text-[#2563eb]">
              AD
            </div>
          </div>
        </header>

        {/* 3. Main content stage */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          
          <div className="print:hidden">
            {activeTab === 'dashboard' && (
              <Dashboard
                products={products}
                transactions={transactions}
                settings={settings}
                onNavigate={handleTabSwitch}
              />
            )}

            {activeTab === 'inventory' && (
              <Inventory
                products={products}
                transactions={transactions}
                settings={settings}
              />
            )}

            {activeTab === 'send' && (
              <SendPaint
                products={products}
                onAddTransaction={handleAddTransaction}
              />
            )}

            {activeTab === 'receive' && (
              <ReceiveFinished
                products={products}
                transactions={transactions}
                settings={settings}
                invoices={invoices}
                onAddReceiveTransaction={handleAddReceiveTransaction}
              />
            )}

            {activeTab === 'scrap' && (
              <ScrapProducts
                products={products}
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
              />
            )}

            {activeTab === 'debts' && (
              <Debts
                invoices={invoices}
                transactions={transactions}
                products={products}
                settings={settings}
                onUpdateInvoice={handleUpdateInvoice}
              />
            )}

            {activeTab === 'analytics' && (
              <Analytics
                transactions={transactions}
                invoices={invoices}
                products={products}
              />
            )}

            {activeTab === 'history' && (
              <History
                transactions={transactions}
                products={products}
                onDeleteTransaction={handleDeleteTransaction}
                onClearAllTransactions={handleClearAllTransactions}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsComponent
                settings={settings}
                products={products}
                onUpdateSettings={handleUpdateSettings}
                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
                onRestoreAllData={handleRestoreAllData}
                onResetFactory={handleResetFactory}
              />
            )}
          </div>
        </main>

        {/* 4. Universal humble footer (Hidden on print) */}
        <footer className="no-print bg-white border-t border-[#e5e7eb] py-5 text-center select-none text-[10px] text-slate-400 font-sans tracking-wide shrink-0">
          <p>© 2026 Xưởng Gỗ Guitar Thô — Hỗ trợ quản lý sơn ngoài uy tín</p>
          <p className="mt-1">Dữ liệu an toàn lưu cục bộ trên trình duyệt của bạn</p>
        </footer>
      </div>
    </div>
  );
}

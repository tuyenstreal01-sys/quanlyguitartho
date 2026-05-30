import { Product, Transaction, Invoice, Settings, GuitarStock } from './types';

// Default price list for products (in thousands đ, i.e., 150 = 150,000đ)
export const DEFAULT_PRICES: Record<string, number> = {
  'X1': 150,
  'X2': 160,
  'X3': 170,
  'X4': 180,
  'X5': 200,
  'X6': 220,
  'X7': 250,
  'X8': 280,
  'C1': 220,
  'C2': 240,
  'C3': 260,
  'C4': 300,
  'C5': 350,
  'Mini': 120,
  'Loa': 180,
  'Sửa': 90,
  'Lỗi sơn lại': 70,
};

export const DEFAULT_PRODUCTS: Product[] = [
  // X Series
  { code: 'X1', name: 'Acoustic Guitar X1', group: 'X Series' },
  { code: 'X2', name: 'Acoustic Guitar X2', group: 'X Series' },
  { code: 'X3', name: 'Acoustic Guitar X3', group: 'X Series' },
  { code: 'X4', name: 'Acoustic Guitar X4', group: 'X Series' },
  { code: 'X5', name: 'Acoustic Guitar X5', group: 'X Series' },
  { code: 'X6', name: 'Acoustic Guitar X6', group: 'X Series' },
  { code: 'X7', name: 'Acoustic Guitar X7', group: 'X Series' },
  { code: 'X8', name: 'Acoustic Guitar X8', group: 'X Series' },
  // C Series
  { code: 'C1', name: 'Classic Guitar C1', group: 'C Series' },
  { code: 'C2', name: 'Classic Guitar C2', group: 'C Series' },
  { code: 'C3', name: 'Classic Guitar C3', group: 'C Series' },
  { code: 'C4', name: 'Classic Guitar C4', group: 'C Series' },
  { code: 'C5', name: 'Classic Guitar C5', group: 'C Series' },
  // Special
  { code: 'Mini', name: 'Đàn Guitar Mini', group: 'Đặc biệt' },
  { code: 'Loa', name: 'Đàn Guitar tích hợp Loa', group: 'Đặc biệt' },
  { code: 'Sửa', name: 'Đàn khách gửi sửa chữa', group: 'Đặc biệt' },
  { code: 'Lỗi sơn lại', name: 'Đàn lỗi gửi sơn lại', group: 'Đặc biệt' }
];

export const DEFAULT_SETTINGS: Settings = {
  alertThreshold: 5,
  rawWorkshopName: 'Xưởng Mộc Guitar Thô Antigravity',
  paintWorkshopName: 'Xưởng Sơn Mỹ Nghệ Bình Dương',
  paintWorkshopAddress: 'Đại lộ Bình Dương, Thủ Dầu Một, Bình Dương',
  paintWorkshopPhone: '0987.654.321',
  defaultPrices: DEFAULT_PRICES,
};

// Seed Transactions to populate the UI magnificently on first use
export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-20260510-001',
    type: 'GUI_SON',
    date: '2026-05-10',
    notes: 'Gửi lô thô đầu tháng chuẩn bị đơn hàng gỗ thông',
    items: [
      { productCode: 'X1', quantity: 20 },
      { productCode: 'X2', quantity: 15 },
      { productCode: 'X5', quantity: 10 },
      { productCode: 'C1', quantity: 12 },
      { productCode: 'Mini', quantity: 8 },
      { productCode: 'Sửa', quantity: 3 }
    ]
  },
  {
    id: 'TX-20260515-001',
    type: 'NHAN_THANH_PHAM',
    date: '2026-05-15',
    invoiceId: 'HD-20260515-001',
    notes: 'Nhận đợt 1 hoàn thiện mịn, bóng mờ',
    items: [
      { productCode: 'X1', quantity: 12, unitPrice: 150 }, // Total: 1800
      { productCode: 'X2', quantity: 10, unitPrice: 160 }, // Total: 1600
      { productCode: 'X5', quantity: 5, unitPrice: 200 },  // Total: 1000
      { productCode: 'Mini', quantity: 6, unitPrice: 120 }, // Total: 720
      { productCode: 'Sửa', quantity: 3, unitPrice: 90 }  // Total: 270 -> Sum: 5390
    ]
  },
  {
    id: 'TX-20260518-001',
    type: 'GUI_SON',
    date: '2026-05-18',
    notes: 'Bổ sung đơn gấp Classic và lỗi sơn lại',
    items: [
      { productCode: 'C1', quantity: 10 },
      { productCode: 'C4', quantity: 5 },
      { productCode: 'Lỗi sơn lại', quantity: 6 }
    ]
  },
  {
    id: 'TX-20260522-001',
    type: 'NHAN_THANH_PHAM',
    date: '2026-05-22',
    invoiceId: 'HD-20260522-001',
    notes: 'Nhận thành phẩm Classic bóng sáng',
    items: [
      { productCode: 'C1', quantity: 15, unitPrice: 220 }, // 12 + 10 - 15 = 7 left in painting. Cost: 3300
      { productCode: 'C4', quantity: 4, unitPrice: 300 },  // 1.200
      { productCode: 'Lỗi sơn lại', quantity: 5, unitPrice: 70 } // 350 -> Sum: 4850
    ]
  },
  {
    id: 'TX-20260525-001',
    type: 'XUAT_HUY',
    date: '2026-05-25',
    notes: 'Hủy hàng lỗi nứt gỗ trong lúc hấp sơn xưởng sơn',
    items: [
      { productCode: 'X2', quantity: 1, from: 'painting', reason: 'Nứt gỗ mặt trước' },
      { productCode: 'Mini', quantity: 1, from: 'finished', reason: 'Khách đổi mẫu xước sơn' }
    ]
  }
];

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'HD-20260515-001',
    transactionId: 'TX-20260515-001',
    date: '2026-05-15',
    totalAmount: 5390,
    paidAmount: 5390,
    status: 'PAID',
    payments: [
      { id: 'PM-1', date: '2026-05-15', amount: 5390, note: 'Thanh toán chuyển khoản trọn gói' }
    ],
    notes: 'Đã quyết toán biên lai số 992-BD'
  },
  {
    id: 'HD-20260522-001',
    transactionId: 'TX-20260522-001',
    date: '2026-05-22',
    totalAmount: 4850,
    paidAmount: 2000,
    status: 'PARTIAL',
    payments: [
      { id: 'PM-2', date: '2026-05-22', amount: 2000, note: 'Tạm ứng đợt một' }
    ],
    notes: 'Còn nợ lại thanh toán vào cuối tháng'
  }
];

/**
 * Format currency to human readable format
 * e.g., value of 5000 is 5,000đ (which stands for 5 million VND according to "nhập 5000 = 5 triệu, hiển thị 5,000đ")
 */
export function formatCurrency(value: number): string {
  return `${value.toLocaleString('vi-VN')}đ`;
}

/**
 * Convert Date String (YYYY-MM-DD) to friendly Vietnamese format DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Recalculate stock counters dynamically from transaction history log
 */
export function calculateStock(
  transactions: Transaction[],
  products: Product[]
): Record<string, GuitarStock> {
  const stock: Record<string, GuitarStock> = {};

  // Initialize all products with 0
  products.forEach((p) => {
    stock[p.code] = { painting: 0, finished: 0 };
  });

  // Sort transactions by date ascending (optional, but good practice)
  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  sortedTx.forEach((tx) => {
    tx.items.forEach((item) => {
      // Ensure the product holds space
      if (!stock[item.productCode]) {
        stock[item.productCode] = { painting: 0, finished: 0 };
      }

      const pStock = stock[item.productCode];

      if (tx.type === 'GUI_SON') {
        pStock.painting += item.quantity;
      } else if (tx.type === 'NHAN_THANH_PHAM') {
        // Only deduct from paint shop if positive, since raw inventory is infinite
        pStock.painting = Math.max(0, pStock.painting - item.quantity);
        pStock.finished += item.quantity;
      } else if (tx.type === 'XUAT_HUY') {
        if (item.from === 'finished') {
          pStock.finished = Math.max(0, pStock.finished - item.quantity);
        } else {
          pStock.painting = Math.max(0, pStock.painting - item.quantity);
        }
      }
    });
  });

  return stock;
}

/**
 * Check state status of a stock item:
 * - OK: Stock finished > threshold
 * - Cần chú ý (Attention): 0 < Stock finished <= threshold
 * - Không có hàng (Out of Stock): Stock finished === 0
 */
export function getStockStatusLabel(finishedQty: number, threshold: number): {
  label: 'OK' | 'Cần chú ý' | 'Không có hàng';
  colorClass: string;
  badgeClass: string;
} {
  if (finishedQty === 0) {
    return {
      label: 'Không có hàng',
      colorClass: 'text-rose-600',
      badgeClass: 'bg-rose-50 border-rose-200 text-rose-700'
    };
  } else if (finishedQty <= threshold) {
    return {
      label: 'Cần chú ý',
      colorClass: 'text-amber-600',
      badgeClass: 'bg-amber-50 border-amber-200 text-amber-700'
    };
  } else {
    return {
      label: 'OK',
      colorClass: 'text-emerald-500',
      badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700'
    };
  }
}

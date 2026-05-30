export interface Product {
  code: string;
  name: string;
  group: 'X Series' | 'C Series' | 'Đặc biệt' | string;
  isCustom?: boolean;
}

export type TransactionType = 'GUI_SON' | 'NHAN_THANH_PHAM' | 'XUAT_HUY';

export interface TransactionItem {
  productCode: string;
  quantity: number;
  unitPrice?: number; // Only for NHAN_THANH_PHAM
  from?: 'painting' | 'finished'; // Only for XUAT_HUY
  reason?: string; // Only for XUAT_HUY
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  items: TransactionItem[];
  notes?: string;
  invoiceId?: string; // Links to Invoice if type is NHAN_THANH_PHAM
}

export interface PaymentHistory {
  id: string;
  date: string;
  amount: number; // in thousands (đ)
  note?: string;
}

export interface Invoice {
  id: string; // e.g. HD-YYYYMMDD-XXXX
  transactionId: string;
  date: string;
  totalAmount: number; // in thousands (đ)
  paidAmount: number; // in thousands (đ)
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  payments: PaymentHistory[];
  notes?: string;
}

export interface Settings {
  alertThreshold: number;
  rawWorkshopName: string;
  paintWorkshopName: string;
  paintWorkshopAddress: string;
  paintWorkshopPhone: string;
  defaultPrices: Record<string, number>; // map from productCode to unitPrice (in thousands/đ)
}

export interface GuitarStock {
  painting: number;
  finished: number;
}

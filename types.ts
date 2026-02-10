
export interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number; // Harga Beli / Modal
  price: number;     // Harga Jual
  stock: number;
  arrivalDate: string;
  expiryDate: string;
  category: string;
  defaultDiscountPercent: number; // Diskon default dalam persen (%)
}

export interface CartItem extends Product {
  quantity: number;
  manualDiscount: number;
}

export enum PaymentMethod {
  CASH = 'Tunai',
  DEBIT = 'Debit',
  CREDIT_CARD = 'Kartu Kredit',
  QRIS = 'QRIS',
  E_WALLET = 'E-Wallet'
}

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  KARYAWAN = 'KARYAWAN'
}

export interface User {
  id: string;
  username: string;
  password: string; // Dalam produksi ini harus di-hash
  role: Role;
  fullName: string;
  ktp: string;
  address: string;
  startDate: string;
  contractMonths: number;
  endDate: string;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  totalAmount: number;
  globalDiscount: number; // Diskon tambahan di akhir total
  paymentMethod: PaymentMethod;
  cashReceived?: number;  // Jumlah uang yang diterima (untuk Cash)
  changeAmount?: number;  // Jumlah uang kembalian (untuk Cash)
  paymentMetadata?: {
    bankName?: string;
    cardNumber?: string;
    referenceNumber?: string;
    providerName?: string;
  };
  timestamp: string;
  cashierName: string; // Nama kasir yang memproses
}

export type View = 'DASHBOARD' | 'POS' | 'INVENTORY' | 'HISTORY' | 'USERS';

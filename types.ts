
export interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  price: number;
  stock: number;
  arrivalDate: string;
  expiryDate: string;
  category: string;
  defaultDiscountPercent: number;
}

export interface StoreSettings {
  name: string;
  address: string;
  logo: string;
  phone?: string;
  website?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  showLogoOnReceipt?: boolean;
  showBarcodeOnReceipt?: boolean;
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
  password: string;
  role: Role;
  fullName: string;
  ktp: string;
  address: string;
  startDate: string;
  contractMonths: number;
  endDate: string;
  photo?: string;
}

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  totalAmount: number;
  globalDiscount: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeAmount?: number;
  paymentMetadata?: {
    bankName?: string;
    cardNumber?: string;
    referenceNumber?: string;
    providerName?: string;
  };
  timestamp: string;
  cashierName: string;
}

export type View = 'DASHBOARD' | 'POS' | 'INVENTORY' | 'HISTORY' | 'USERS' | 'ATTENDANCE' | 'RECEIPT_CONFIG';

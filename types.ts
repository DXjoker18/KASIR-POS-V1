
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

export interface CardCustomization {
  template: 'modern' | 'corporate' | 'creative';
  accentColor: string;
  bgColor: string;
  textColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  showBarcode: boolean;
  showId: boolean;
  showJoinDate: boolean;
  showExpiry: boolean;
  nameFontSize: number;
  nameFontWeight: string;
  roleFontSize: number;
  roleFontWeight: string;
  idFontSize: number;
  idFontWeight: string;
  bgImage?: string;
}

export type ReceiptTemplate = 'classic' | 'modern' | 'elegant' | 'compact';

export interface PrinterInfo {
  id: string;
  name: string;
  type: 'Bluetooth' | 'USB' | 'Network';
  status: 'connected' | 'disconnected';
}

export interface StoreSettings {
  name: string;
  address: string;
  logo: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  taxPercentage?: number;
  currencySymbol?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  showLogoOnReceipt?: boolean;
  showBarcodeOnReceipt?: boolean;
  receiptTemplate?: ReceiptTemplate;
  cardCustomization?: CardCustomization;
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

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  cardNumber: string; // Barcode member
  joinDate: string;
  points: number;
}

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
}

export enum CashType {
  IN = 'MASUK',
  OUT = 'KELUAR'
}

export interface CashEntry {
  id: string;
  type: CashType;
  category: string;
  amount: number;
  note: string;
  timestamp: string;
  user: string;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  totalAmount: number;
  globalDiscount: number;
  taxAmount?: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeAmount?: number;
  paymentMetadata?: {
    bankName?: string;
    cardNumber?: string;
    referenceNumber?: string;
    providerName?: string;
  };
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  timestamp: string;
  cashierName: string;
}

export type View = 'DASHBOARD' | 'POS' | 'INVENTORY' | 'HISTORY' | 'USERS' | 'ATTENDANCE' | 'RECEIPT_CONFIG' | 'FINANCE' | 'CUSTOMERS' | 'SETTINGS';

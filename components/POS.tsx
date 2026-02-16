
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, PaymentMethod, CartItem, Transaction, StoreSettings, Customer } from '../types';

interface POSProps {
  products: Product[];
  customers: Customer[];
  cashierName: string;
  onCheckout: (
    cart: CartItem[], 
    total: number, 
    globalDiscount: number, 
    method: PaymentMethod,
    cashReceived?: number,
    changeAmount?: number,
    paymentMetadata?: Transaction['paymentMetadata'],
    customerId?: string,
    customerName?: string,
    customerPhone?: string
  ) => void;
  storeSettings: StoreSettings;
  printerConnected: boolean;
  onOpenPrinterManager: () => void;
}

const POS: React.FC<POSProps> = ({ products, customers, cashierName, onCheckout, storeSettings, printerConnected, onOpenPrinterManager }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [unifiedSearch, setUnifiedSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  
  // State Pelanggan
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Metadata Non-Tunai
  const [bankName, setBankName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [providerName, setProviderName] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemLevelDiscounts = cart.reduce((sum, item) => sum + item.manualDiscount, 0);
  const totalAfterDiscount = Math.max(0, subTotal - itemLevelDiscounts - globalDiscount);
  
  const taxPercentage = storeSettings.taxPercentage || 0;
  const taxAmount = (totalAfterDiscount * taxPercentage) / 100;
  const grandTotal = totalAfterDiscount + taxAmount;
  const changeAmount = Math.max(0, cashReceived - grandTotal);

  // Filter gabungan
  const searchResults = useMemo(() => {
    if (!unifiedSearch.trim()) return { products: [], customers: [] };
    
    const term = unifiedSearch.toLowerCase();
    
    const matchedProducts = products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.sku.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    ).slice(0, 5);

    const matchedCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.phone.includes(term) ||
      c.cardNumber.includes(term)
    ).slice(0, 3);

    return { products: matchedProducts, customers: matchedCustomers };
  }, [unifiedSearch, products, customers]);

  // Handle klik di luar untuk menutup pencarian
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("Stok habis!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("Stok tidak mencukupi!");
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      const defaultDiscountValue = product.defaultDiscountPercent ? (product.price * product.defaultDiscountPercent / 100) : 0;
      return [...prev, { ...product, quantity: 1, manualDiscount: defaultDiscountValue }];
    });
    setUnifiedSearch('');
    setIsSearchFocused(false);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setUnifiedSearch('');
    setIsSearchFocused(false);
  };

  const confirmCheckout = () => {
    if (!isPaymentValid) return;

    const paymentMetadata = (paymentMethod !== PaymentMethod.CASH) ? {
      bankName: bankName || providerName,
      cardNumber: cardNumber,
      referenceNumber: refNumber,
      providerName: providerName || bankName
    } : undefined;

    const txId = `TRX-${Date.now()}`;
    // Catatan: grandTotal sudah termasuk pajak, kita teruskan total sebelum pajak (totalAfterDiscount) ke onCheckout agar perhitungan ulang di App.tsx sinkron
    onCheckout(cart, totalAfterDiscount, globalDiscount, paymentMethod, cashReceived, changeAmount, paymentMetadata, selectedCustomer?.id, selectedCustomer?.name, selectedCustomer?.phone);
    
    // Set last transaction untuk modal sukses (termasuk pajak)
    const txData: Transaction = {
      id: txId,
      items: [...cart],
      totalAmount: grandTotal,
      taxAmount: taxAmount,
      globalDiscount: globalDiscount,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod === PaymentMethod.CASH ? cashReceived : undefined,
      changeAmount: paymentMethod === PaymentMethod.CASH ? changeAmount : undefined,
      paymentMetadata: paymentMetadata,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      timestamp: new Date().toISOString(),
      cashierName: cashierName
    };
    setLastTransaction(txData);
    setIsCheckingOut(false);
  };

  const isPaymentValid = useMemo(() => {
    if (grandTotal <= 0) return false;
    if (paymentMethod === PaymentMethod.CASH) return cashReceived >= (Math.floor(grandTotal));
    
    if ([PaymentMethod.DEBIT, PaymentMethod.CREDIT_CARD].includes(paymentMethod)) {
      return bankName.trim() !== '' && cardNumber.trim() !== '';
    }
    if ([PaymentMethod.QRIS, PaymentMethod.E_WALLET].includes(paymentMethod)) {
      return providerName.trim() !== '' && refNumber.trim() !== '';
    }
    return true;
  }, [paymentMethod, cashReceived, grandTotal, bankName, cardNumber, providerName, refNumber]);

  const handleNextTransaction = () => {
    setCart([]);
    setGlobalDiscount(0);
    setLastTransaction(null);
    setSelectedCustomer(null);
    setUnifiedSearch('');
    setCashReceived(0);
    setBankName('');
    setCardNumber('');
    setRefNumber('');
    setProviderName('');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handlePrintReceipt = () => {
    if (!printerConnected) {
      const confirm = window.confirm("Printer belum terhubung. Hubungkan sekarang?");
      if (confirm) onOpenPrinterManager();
      return;
    }
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full relative text-left">
      <div className="flex-1 space-y-6 no-print text-left">
        
        {/* Unified Search Header */}
        <div ref={searchContainerRef} className="relative z-[50]">
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 transition-all focus-within:shadow-xl focus-within:border-blue-400">
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari Produk, Scan Barcode, atau Cari Nama/HP Member..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-0 text-sm font-bold text-gray-800"
                value={unifiedSearch}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setUnifiedSearch(e.target.value)}
              />
              <span className="absolute left-3.5 top-3.5 text-gray-400">🔍</span>
            </div>
            
            {/* Status Pelanggan Terpilih */}
            {selectedCustomer ? (
              <div className="flex items-center gap-2 bg-blue-600 text-white pl-4 pr-2 py-2 rounded-2xl animate-in fade-in slide-in-from-right-2 shadow-lg shadow-blue-100">
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase opacity-60 leading-none">Member Aktif</p>
                  <p className="text-[10px] font-black uppercase tracking-tight">{selectedCustomer.name}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/40 transition-all">✕</button>
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-end opacity-40">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Smart Search POS</p>
                <p className="text-[10px] font-bold text-gray-500">Produk + Pelanggan</p>
              </div>
            )}
          </div>

          {/* Search Dropdown Panel */}
          {isSearchFocused && (unifiedSearch.length > 0) && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {searchResults.customers.length > 0 && (
                    <div className="p-4 border-b border-gray-50">
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3 ml-2">👤 Hasil Pencarian Pelanggan</p>
                      <div className="space-y-1">
                        {searchResults.customers.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => selectCustomer(c)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group text-left"
                          >
                            <div>
                               <p className="font-black text-sm uppercase leading-none">{c.name}</p>
                               <p className="text-[10px] font-medium opacity-60 mt-1">{c.phone} | MBR: {c.cardNumber}</p>
                            </div>
                            <span className="text-[9px] font-black border border-blue-200 px-2 py-1 rounded-lg group-hover:border-white/50">PILIH MEMBER</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-2">📦 Hasil Pencarian Produk</p>
                    {searchResults.products.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.products.map(p => (
                          <button 
                            key={p.id} 
                            disabled={p.stock <= 0}
                            onClick={() => addToCart(p)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left group ${p.stock <= 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex-1">
                               <p className="font-black text-sm uppercase leading-none text-gray-800">{p.name}</p>
                               <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">{p.category} | SKU: {p.sku}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-gray-900 group-hover:text-blue-600">{storeSettings.currencySymbol} {p.price.toLocaleString()}</p>
                               <p className={`text-[9px] font-black uppercase ${p.stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>Sisa: {p.stock}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center opacity-30">
                        <p className="text-xs font-black uppercase tracking-widest">Produk tidak ditemukan</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Katalog Produk */}
        {!isSearchFocused && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Katalog Produk</h3>
               <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Stok Tersedia</span>
               </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh] p-1 custom-scrollbar text-gray-800">
              {products.slice(0, 12).map((p) => (
                <button 
                  key={p.id} 
                  onClick={() => addToCart(p)} 
                  disabled={p.stock <= 0} 
                  className={`flex flex-col text-left p-5 rounded-3xl border-2 transition-all relative overflow-hidden group ${p.stock <= 0 ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-transparent hover:border-blue-400 hover:shadow-xl shadow-sm'}`}
                >
                  <div className="text-[9px] font-black text-blue-500 mb-1 uppercase tracking-widest">{p.category}</div>
                  <div className="font-bold line-clamp-2 h-10 leading-tight text-gray-800">{p.name}</div>
                  <div className="text-lg font-black text-gray-900 mt-4">{storeSettings.currencySymbol} {p.price.toLocaleString()}</div>
                  <div className={`mt-2 text-[10px] font-black px-2 py-0.5 rounded-lg inline-block ${p.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>Sisa: {p.stock}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-[420px] bg-white border border-gray-200 rounded-[2.5rem] shadow-2xl flex flex-col sticky top-0 overflow-hidden text-gray-800 no-print text-left">
        <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
          <div>
             <h3 className="font-black text-xl tracking-tight uppercase">Tagihan</h3>
             <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Struk: {Date.now().toString().slice(-6)}</p>
          </div>
          <span className="bg-white/20 px-4 py-2 rounded-2xl text-xs font-black">{cart.reduce((s, i) => s + i.quantity, 0)} BARANG</span>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[45vh] p-8 space-y-6 custom-scrollbar">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center group">
              <div className="flex-1 mr-4">
                <span className="font-bold text-sm text-gray-800 leading-tight block truncate">{item.name}</span>
                <p className="text-[10px] text-gray-400 font-bold mt-1">{storeSettings.currencySymbol} {item.price.toLocaleString()} x {item.quantity}</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex bg-gray-100 rounded-xl p-1">
                    <button onClick={() => {
                      if (item.quantity > 1) setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity - 1} : c));
                    }} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all">-</button>
                    <span className="font-black px-3 py-1.5 text-xs">{item.quantity}</span>
                    <button onClick={() => {
                      if (item.quantity < item.stock) setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1} : c));
                    }} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all">+</button>
                 </div>
                 <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-red-300 hover:text-red-500">✕</button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-gray-400 font-bold text-sm">
               <span>Subtotal</span>
               <span>{storeSettings.currencySymbol} {subTotal.toLocaleString()}</span>
            </div>
            {itemLevelDiscounts + globalDiscount > 0 && (
              <div className="flex justify-between text-red-400 font-bold text-sm">
                 <span>Potongan Belanja</span>
                 <span>-{storeSettings.currencySymbol} {(itemLevelDiscounts + globalDiscount).toLocaleString()}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-blue-400 font-bold text-sm">
                 <span>Pajak ({taxPercentage}%)</span>
                 <span>+{storeSettings.currencySymbol} {taxAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-3xl font-black pt-4 text-gray-900 border-t border-gray-200">
              <span>TOTAL</span>
              <span className="text-blue-600">{storeSettings.currencySymbol} {grandTotal.toLocaleString()}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsCheckingOut(true)} 
            disabled={cart.length === 0} 
            className={`w-full py-5 rounded-3xl font-black text-lg text-white transition-all transform active:scale-95 shadow-2xl mb-6 ${cart.length === 0 ? 'bg-gray-300' : 'bg-blue-600 shadow-blue-200'}`}
          >
            PROSES PEMBAYARAN
          </button>

          {/* DETAIL PELANGGAN */}
          <div className="mt-2 border-t border-gray-200 pt-6">
             {selectedCustomer ? (
               <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Detail Pelanggan</p>
                        <h4 className="text-sm font-black text-gray-900 uppercase leading-none">{selectedCustomer.name}</h4>
                     </div>
                     <button onClick={() => setSelectedCustomer(null)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-tight">Hapus</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gray-50 p-3 rounded-2xl">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Poin</p>
                        <p className="text-[10px] font-black text-blue-700">{selectedCustomer.points} PT</p>
                     </div>
                     <div className="bg-gray-50 p-3 rounded-2xl">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">No. HP</p>
                        <p className="text-[10px] font-bold text-gray-700">{selectedCustomer.phone}</p>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="bg-gray-100 rounded-3xl p-6 border-2 border-dashed border-gray-200 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum Ada Pelanggan</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {lastTransaction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[120] p-4 text-gray-800 no-print text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 animate-in fade-in zoom-in shadow-2xl text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><span className="text-4xl">✅</span></div>
            <h3 className="text-2xl font-black text-gray-900 uppercase mb-2">Sukses</h3>
            <p className="text-gray-500 text-sm mb-8 font-medium">Transaksi <span className="font-black text-blue-600">#{lastTransaction.id.slice(-8)}</span> berhasil.</p>
            <div className="bg-gray-50 p-6 rounded-3xl mb-8 space-y-4 border border-gray-100 text-left">
               <div className="flex justify-between items-center text-lg font-black text-blue-600">
                  <span className="text-[10px] uppercase font-black text-gray-400">Total Akhir</span>
                  <span>{storeSettings.currencySymbol} {lastTransaction.totalAmount.toLocaleString()}</span>
               </div>
            </div>
            <div className="space-y-3">
              <button onClick={handlePrintReceipt} className="w-full py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-xs uppercase hover:bg-blue-600 hover:text-white transition-all">🖨️ Cetak Struk</button>
              <button onClick={handleNextTransaction} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">Lanjut Transaksi</button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      {isCheckingOut && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 no-print text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl p-10 animate-in fade-in zoom-in shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar text-gray-800">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black uppercase tracking-tight">Selesaikan Pembayaran</h3>
               <button onClick={() => setIsCheckingOut(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               <div className="lg:col-span-4 space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Metode</p>
                  <div className="grid grid-cols-1 gap-3">
                     {[
                       { id: PaymentMethod.CASH, label: 'Tunai / Cash', icon: '💵' },
                       { id: PaymentMethod.DEBIT, label: 'Debit Card', icon: '💳' },
                       { id: PaymentMethod.CREDIT_CARD, label: 'Credit Card', icon: '🏧' },
                       { id: PaymentMethod.QRIS, label: 'QRIS / Digital', icon: '📱' },
                       { id: PaymentMethod.E_WALLET, label: 'E-Wallet', icon: '👛' }
                     ].map(method => (
                       <button
                         key={method.id}
                         onClick={() => setPaymentMethod(method.id)}
                         className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${paymentMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-50 bg-white hover:border-gray-200'}`}
                       >
                          <span className="text-2xl">{method.icon}</span>
                          <span className={`font-black text-xs uppercase tracking-tight ${paymentMethod === method.id ? 'text-blue-600' : 'text-gray-700'}`}>{method.label}</span>
                       </button>
                     ))}
                  </div>
               </div>

               <div className="lg:col-span-8 bg-gray-50 rounded-3xl p-8 border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                     <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Total Bayar (Incl. Pajak)</span>
                     <span className="text-3xl font-black text-blue-600">{storeSettings.currencySymbol} {grandTotal.toLocaleString()}</span>
                  </div>

                  {paymentMethod === PaymentMethod.CASH ? (
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Uang Tunai Diterima</label>
                          <input 
                            autoFocus 
                            type="number" 
                            className={`w-full text-4xl font-black p-6 rounded-2xl border-2 bg-white focus:outline-none transition-all ${cashReceived > 0 && cashReceived < grandTotal ? 'border-red-400 text-red-600' : 'border-blue-100 focus:border-blue-500'}`} 
                            placeholder="0"
                            value={cashReceived || ''} 
                            onChange={(e) => setCashReceived(parseInt(e.target.value) || 0)} 
                          />
                          <div className="flex gap-2">
                             {[grandTotal, 10000, 20000, 50000, 100000].map(val => (
                               <button key={val} onClick={() => setCashReceived(val)} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">Rp {val.toLocaleString()}</button>
                             ))}
                          </div>
                       </div>
                       <div className="bg-white p-6 rounded-2xl flex justify-between items-center shadow-sm">
                          <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Kembalian</span>
                          <span className={`text-3xl font-black ${changeAmount >= 0 ? 'text-green-600' : 'text-red-400'}`}>Rp {changeAmount.toLocaleString()}</span>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Institusi / Bank</label>
                             <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold" placeholder="BCA/Mandiri/Dana" value={bankName || providerName} onChange={(e) => { setBankName(e.target.value); setProviderName(e.target.value); }} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Nomor Ref / Kartu</label>
                             <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold" placeholder="4 Digit / Reff ID" value={cardNumber || refNumber} onChange={(e) => { setCardNumber(e.target.value); setRefNumber(e.target.value); }} />
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="mt-10 flex gap-4">
                     <button 
                       onClick={confirmCheckout} 
                       disabled={!isPaymentValid} 
                       className={`flex-1 py-5 rounded-2xl font-black text-lg text-white shadow-xl transition-all ${isPaymentValid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 opacity-50 cursor-not-allowed'}`}
                     >
                        KONFIRMASI PEMBAYARAN
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Template (Hidden) */}
      <div className="print-only">
        {lastTransaction && (
          <div className="receipt-container mx-auto bg-white flex flex-col w-[80mm] text-gray-900 font-mono items-center text-center p-4">
            {storeSettings.showLogoOnReceipt && storeSettings.logo && (
              <img src={storeSettings.logo} alt="Logo" className="w-12 h-12 object-contain mb-2 grayscale" crossOrigin="anonymous" />
            )}
            <h4 className="font-bold uppercase text-sm mb-1">{storeSettings.name}</h4>
            <p className="text-[9px] leading-tight mb-4 whitespace-pre-wrap">{storeSettings.address}</p>
            <div className="w-full border-y border-dashed py-2 mb-3 space-y-1 text-left border-gray-400 text-[10px]">
              <div className="flex justify-between"><span>ID Transaksi:</span><span>{lastTransaction.id}</span></div>
              <div className="flex justify-between"><span>Waktu:</span><span>{new Date(lastTransaction.timestamp).toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span>Kasir:</span><span>{lastTransaction.cashierName}</span></div>
            </div>
            <div className="w-full border-b border-dashed pb-2 mb-2 space-y-1 text-left border-gray-400 text-[10px]">
              {lastTransaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between font-bold uppercase">
                  <span className="w-3/4">{item.name} x {item.quantity}</span>
                  <span>{((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="w-full space-y-1 mb-4 border-b border-dashed pb-3 text-left border-gray-400 text-[10px]">
              <div className="flex justify-between"><span>Pajak (Incl)</span><span>{lastTransaction.taxAmount?.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-xs uppercase pt-1 border-t border-dotted border-gray-300 mt-1">
                <span>Total Bayar</span>
                <span>{storeSettings.currencySymbol} {lastTransaction.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-center w-full italic text-[9px]">{storeSettings.receiptFooter}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;

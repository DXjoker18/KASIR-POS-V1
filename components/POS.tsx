
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
  const [showPreview, setShowPreview] = useState(false);
  
  // State Pelanggan
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Metadata Non-Tunai
  const [metadata, setMetadata] = useState({
    bankName: '',
    cardNumber: '',
    referenceNumber: '',
    providerName: ''
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemLevelDiscounts = cart.reduce((sum, item) => sum + item.manualDiscount, 0);
  const totalAfterDiscount = Math.max(0, subTotal - itemLevelDiscounts - globalDiscount);
  
  const taxPercentage = storeSettings.taxPercentage || 0;
  const taxAmount = (totalAfterDiscount * taxPercentage) / 100;
  const grandTotal = totalAfterDiscount + taxAmount;
  const changeAmount = Math.max(0, cashReceived - grandTotal);

  const searchResults = useMemo(() => {
    if (!unifiedSearch.trim()) return { products: [], customers: [] };
    const term = unifiedSearch.toLowerCase();
    const matchedProducts = products.filter(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)).slice(0, 5);
    const matchedCustomers = customers.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term) || c.cardNumber.includes(term)).slice(0, 3);
    return { products: matchedProducts, customers: matchedCustomers };
  }, [unifiedSearch, products, customers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) { alert("Stok habis!"); return; }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { alert("Stok tidak mencukupi!"); return prev; }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      const defaultDiscountValue = product.defaultDiscountPercent ? (product.price * product.defaultDiscountPercent / 100) : 0;
      return [...prev, { ...product, quantity: 1, manualDiscount: defaultDiscountValue }];
    });
    setUnifiedSearch('');
    setIsSearchFocused(false);
  };

  const selectCustomer = (customer: Customer) => { setSelectedCustomer(customer); setUnifiedSearch(''); setIsSearchFocused(false); };

  const confirmCheckout = () => {
    if (!isPaymentValid) return;

    const finalMetadata = paymentMethod !== PaymentMethod.CASH ? {
      bankName: metadata.bankName || metadata.providerName,
      cardNumber: metadata.cardNumber,
      referenceNumber: metadata.referenceNumber,
      providerName: metadata.providerName || metadata.bankName
    } : undefined;

    const roundedGrandTotal = Math.floor(grandTotal);
    const finalChange = paymentMethod === PaymentMethod.CASH ? (cashReceived - roundedGrandTotal) : 0;

    onCheckout(
      cart, 
      totalAfterDiscount, 
      globalDiscount, 
      paymentMethod, 
      paymentMethod === PaymentMethod.CASH ? cashReceived : undefined, 
      paymentMethod === PaymentMethod.CASH ? finalChange : undefined, 
      finalMetadata, 
      selectedCustomer?.id, 
      selectedCustomer?.name, 
      selectedCustomer?.phone
    );
    
    const txData: Transaction = {
      id: `TRX-${Date.now()}`,
      items: [...cart],
      totalAmount: grandTotal,
      taxAmount: taxAmount,
      globalDiscount: globalDiscount,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod === PaymentMethod.CASH ? cashReceived : undefined,
      changeAmount: paymentMethod === PaymentMethod.CASH ? finalChange : undefined,
      paymentMetadata: finalMetadata,
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
      return metadata.bankName.trim() !== '' && metadata.cardNumber.trim() !== '';
    }
    if ([PaymentMethod.QRIS, PaymentMethod.E_WALLET].includes(paymentMethod)) {
      return metadata.providerName.trim() !== '' && metadata.referenceNumber.trim() !== '';
    }
    return true;
  }, [paymentMethod, cashReceived, grandTotal, metadata]);

  const handleNextTransaction = () => {
    setCart([]);
    setGlobalDiscount(0);
    setLastTransaction(null);
    setSelectedCustomer(null);
    setUnifiedSearch('');
    setCashReceived(0);
    setMetadata({ bankName: '', cardNumber: '', referenceNumber: '', providerName: '' });
    setShowPreview(false);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full relative text-left">
      <div className="flex-1 space-y-6 no-print text-left">
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
            {selectedCustomer ? (
              <div className="flex items-center gap-2 bg-blue-600 text-white pl-4 pr-2 py-2 rounded-2xl shadow-lg shadow-blue-100">
                <div className="text-left"><p className="text-[8px] font-black uppercase opacity-60 leading-none">Member Aktif</p><p className="text-[10px] font-black uppercase tracking-tight">{selectedCustomer.name}</p></div>
                <button onClick={() => setSelectedCustomer(null)} className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/40">✕</button>
              </div>
            ) : <div className="hidden md:flex flex-col items-end opacity-40"><p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Smart Search POS</p><p className="text-[10px] font-bold text-gray-500">Produk + Pelanggan</p></div>}
          </div>
          {isSearchFocused && (unifiedSearch.length > 0) && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {searchResults.customers.length > 0 && (
                    <div className="p-4 border-b border-gray-50">
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3 ml-2">👤 Pelanggan</p>
                      <div className="space-y-1">
                        {searchResults.customers.map(c => <button key={c.id} onClick={() => selectCustomer(c)} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group text-left"><div><p className="font-black text-sm uppercase leading-none">{c.name}</p><p className="text-[10px] font-medium opacity-60 mt-1">{c.phone} | MBR: {c.cardNumber}</p></div><span className="text-[9px] font-black border border-blue-200 px-2 py-1 rounded-lg">PILIH MEMBER</span></button>)}
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-2">📦 Produk</p>
                    {searchResults.products.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.products.map(p => <button key={p.id} disabled={p.stock <= 0} onClick={() => addToCart(p)} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left group ${p.stock <= 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}><div className="flex-1"><p className="font-black text-sm uppercase leading-none text-gray-800">{p.name}</p><p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">{p.category} | SKU: {p.sku}</p></div><div className="text-right"><p className="text-sm font-black text-gray-900 group-hover:text-blue-600">{storeSettings.currencySymbol} {p.price.toLocaleString()}</p><p className={`text-[9px] font-black uppercase ${p.stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>Sisa: {p.stock}</p></div></button>)}
                      </div>
                    ) : <div className="py-10 text-center opacity-30"><p className="text-xs font-black uppercase tracking-widest">Produk tidak ditemukan</p></div>}
                  </div>
               </div>
            </div>
          )}
        </div>

        {!isSearchFocused && (
          <div className="animate-in fade-in duration-500">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1 mb-4">Katalog Produk</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh] p-1 custom-scrollbar text-gray-800">
              {products.slice(0, 12).map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className={`flex flex-col text-left p-5 rounded-3xl border-2 transition-all relative overflow-hidden group ${p.stock <= 0 ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-transparent hover:border-blue-400 hover:shadow-xl shadow-sm'}`}>
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

      <div className="w-full lg:w-[420px] bg-white border border-gray-200 rounded-[2.5rem] shadow-2xl flex flex-col sticky top-0 overflow-hidden text-gray-800 no-print text-left">
        <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
          <div><h3 className="font-black text-xl tracking-tight uppercase">Tagihan</h3><p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Struk: {Date.now().toString().slice(-6)}</p></div>
          <span className="bg-white/20 px-4 py-2 rounded-2xl text-xs font-black">{cart.reduce((s, i) => s + i.quantity, 0)} BARANG</span>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[45vh] p-8 space-y-6 custom-scrollbar">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center group">
              <div className="flex-1 mr-4"><span className="font-bold text-sm text-gray-800 leading-tight block truncate">{item.name}</span><p className="text-[10px] text-gray-400 font-bold mt-1">{storeSettings.currencySymbol} {item.price.toLocaleString()} x {item.quantity}</p></div>
              <div className="flex items-center gap-3">
                 <div className="flex bg-gray-100 rounded-xl p-1">
                    <button onClick={() => item.quantity > 1 && setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity - 1} : c))} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-blue-600 hover:bg-blue-600 hover:text-white">-</button>
                    <span className="font-black px-3 py-1.5 text-xs">{item.quantity}</span>
                    <button onClick={() => item.quantity < item.stock && setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1} : c))} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-blue-600 hover:bg-blue-600 hover:text-white">+</button>
                 </div>
                 <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-red-300 hover:text-red-500">✕</button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-8 bg-gray-50 border-t border-gray-100">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-gray-400 font-bold text-sm"><span>Subtotal</span><span>{storeSettings.currencySymbol} {subTotal.toLocaleString()}</span></div>
            {taxAmount > 0 && <div className="flex justify-between text-blue-400 font-bold text-sm"><span>Pajak ({taxPercentage}%)</span><span>+{storeSettings.currencySymbol} {taxAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between text-3xl font-black pt-4 text-gray-900 border-t border-gray-200"><span>TOTAL</span><span className="text-blue-600">{storeSettings.currencySymbol} {grandTotal.toLocaleString()}</span></div>
          </div>
          <button onClick={() => setIsCheckingOut(true)} disabled={cart.length === 0} className={`w-full py-5 rounded-3xl font-black text-lg text-white transition-all transform active:scale-95 shadow-2xl mb-6 ${cart.length === 0 ? 'bg-gray-300' : 'bg-blue-600 shadow-blue-200'}`}>PROSES PEMBAYARAN</button>
          {selectedCustomer ? (
               <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                     <div><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Pelanggan</p><h4 className="text-sm font-black text-gray-900 uppercase leading-none">{selectedCustomer.name}</h4></div>
                     <button onClick={() => setSelectedCustomer(null)} className="text-[10px] font-black text-red-400 uppercase">Hapus</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4"><div className="bg-gray-50 p-3 rounded-2xl"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Poin</p><p className="text-[10px] font-black text-blue-700">{selectedCustomer.points} PT</p></div><div className="bg-gray-50 p-3 rounded-2xl"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">No. HP</p><p className="text-[10px] font-bold text-gray-700">{selectedCustomer.phone}</p></div></div>
               </div>
          ) : <div className="bg-gray-100 rounded-3xl p-6 border-2 border-dashed border-gray-200 text-center"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum Ada Pelanggan</p></div>}
        </div>
      </div>

      {isCheckingOut && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 no-print text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl p-10 animate-in fade-in zoom-in shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar text-gray-800">
            <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black uppercase tracking-tight">Pembayaran</h3><button onClick={() => setIsCheckingOut(false)} className="text-gray-400">✕</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               <div className="lg:col-span-4 space-y-3">
                  {[
                    { id: PaymentMethod.CASH, label: 'Tunai', icon: '💵' },
                    { id: PaymentMethod.DEBIT, label: 'Debit', icon: '💳' },
                    { id: PaymentMethod.CREDIT_CARD, label: 'Kredit', icon: '🏧' },
                    { id: PaymentMethod.QRIS, label: 'QRIS', icon: '📱' },
                    { id: PaymentMethod.E_WALLET, label: 'E-Wallet', icon: '👛' }
                  ].map(m => (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all w-full text-left ${paymentMethod === m.id ? 'border-blue-600 bg-blue-50' : 'border-gray-50 bg-white'}`}>
                       <span className="text-2xl">{m.icon}</span><span className={`font-black text-xs uppercase ${paymentMethod === m.id ? 'text-blue-600' : 'text-gray-700'}`}>{m.label}</span>
                    </button>
                  ))}
               </div>
               <div className="lg:col-span-8 bg-gray-50 rounded-3xl p-8 border border-gray-100">
                  <div className="flex justify-between items-center mb-6"><span className="text-gray-400 font-black uppercase text-[10px]">Total Tagihan</span><span className="text-3xl font-black text-blue-600">{storeSettings.currencySymbol} {grandTotal.toLocaleString()}</span></div>
                  {paymentMethod === PaymentMethod.CASH ? (
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase block ml-1">Uang Tunai</label>
                          <input autoFocus type="number" className="w-full text-4xl font-black p-6 rounded-2xl border-2 bg-white focus:border-blue-500" placeholder="0" value={cashReceived || ''} onChange={(e) => setCashReceived(parseInt(e.target.value) || 0)} />
                          <div className="flex gap-2">{[grandTotal, 10000, 20000, 50000, 100000].map(val => <button key={val} onClick={() => setCashReceived(Math.floor(val))} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">Rp {val.toLocaleString()}</button>)}</div>
                       </div>
                       <div className="bg-white p-6 rounded-2xl flex justify-between items-center shadow-sm"><span className="text-gray-400 font-black uppercase text-[10px]">Kembalian</span><span className={`text-3xl font-black ${changeAmount >= 0 ? 'text-green-600' : 'text-red-400'}`}>Rp {changeAmount.toLocaleString()}</span></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase block ml-1">Nama Bank / Provider</label>
                             <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold" placeholder="Contoh: BCA / Dana" value={[PaymentMethod.QRIS, PaymentMethod.E_WALLET].includes(paymentMethod) ? metadata.providerName : metadata.bankName} onChange={(e) => setMetadata({...metadata, bankName: e.target.value, providerName: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase block ml-1">No. Kartu / Ref</label>
                             <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold" placeholder="4 Digit Terakhir / Reff ID" value={[PaymentMethod.QRIS, PaymentMethod.E_WALLET].includes(paymentMethod) ? metadata.referenceNumber : metadata.cardNumber} onChange={(e) => setMetadata({...metadata, cardNumber: e.target.value, referenceNumber: e.target.value})} />
                          </div>
                       </div>
                    </div>
                  )}
                  <button onClick={confirmCheckout} disabled={!isPaymentValid} className={`w-full py-5 rounded-2xl font-black text-lg text-white shadow-xl mt-10 transition-all ${isPaymentValid ? 'bg-green-600' : 'bg-gray-300 opacity-50'}`}>KONFIRMASI PEMBAYARAN</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {lastTransaction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[120] p-4 text-gray-800 no-print text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 animate-in fade-in zoom-in shadow-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner text-4xl">✅</div>
              <h3 className="text-2xl font-black text-gray-900 uppercase mb-1">Transaksi Berhasil</h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">TRX ID: #{lastTransaction.id.slice(-8)}</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-3">
                 <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-black text-gray-400">Total Belanja</span><span className="text-lg font-black text-gray-900">{storeSettings.currencySymbol} {lastTransaction.totalAmount.toLocaleString()}</span></div>
                 {lastTransaction.paymentMethod === PaymentMethod.CASH && (
                   <>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200"><span className="text-[10px] uppercase font-black text-blue-400">Uang Diterima</span><span className="text-lg font-black text-blue-600">{storeSettings.currencySymbol} {lastTransaction.cashReceived?.toLocaleString()}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-black text-green-400">Kembalian</span><span className="text-lg font-black text-green-600">{storeSettings.currencySymbol} {lastTransaction.changeAmount?.toLocaleString()}</span></div>
                   </>
                 )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button 
                onClick={() => setShowPreview(true)} 
                className="py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                👁️ Lihat Struk Digital
              </button>
              <button 
                onClick={handleDirectPrint} 
                className="py-4 bg-white border-2 border-green-600 text-green-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-sm"
              >
                🖨️ Cetak Struk Fisik
              </button>
            </div>
            
            <button 
              onClick={handleNextTransaction} 
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              Transaksi Baru ➡️
            </button>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU STRUK */}
      {showPreview && lastTransaction && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[130] p-6 no-print overflow-y-auto">
          <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
             <div className="bg-white p-8 rounded shadow-2xl overflow-hidden" style={{ width: '80mm' }}>
                <div className="receipt-container flex flex-col w-full text-gray-900 font-mono items-center text-center p-0">
                  {storeSettings.showLogoOnReceipt && storeSettings.logo && <img src={storeSettings.logo} alt="Logo" className="w-16 h-16 object-contain mb-4 grayscale" crossOrigin="anonymous" />}
                  <h4 className="font-black uppercase text-base mb-1">{storeSettings.name}</h4>
                  <p className="text-[11px] leading-tight mb-4 whitespace-pre-wrap font-bold">{storeSettings.address}</p>
                  
                  <div className="w-full border-y border-dashed py-2 mb-4 space-y-1 text-left border-gray-400 text-[11px] font-bold">
                    <div className="flex justify-between"><span>No. TRX:</span><span>{lastTransaction.id}</span></div>
                    <div className="flex justify-between"><span>Waktu:</span><span>{new Date(lastTransaction.timestamp).toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between border-b border-black pb-2 mb-2"><span>Kasir:</span><span className="uppercase">{lastTransaction.cashierName}</span></div>
                    <div className="flex justify-between"><span>Customer:</span><span className="uppercase">{lastTransaction.customerName || 'Umum'}</span></div>
                  </div>

                  <div className="w-full border-b border-dashed pb-2 mb-4 space-y-2 text-left border-gray-400 text-[11px] font-bold">
                    {lastTransaction.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div className="flex justify-between uppercase">
                          <span className="w-3/4">{item.name}</span>
                          <span>{((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] opacity-70 italic font-medium">
                          <span>{item.quantity} x {item.price.toLocaleString()}</span>
                          {item.manualDiscount > 0 && <span>(Disc: -{item.manualDiscount.toLocaleString()})</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="w-full space-y-1 mb-6 text-left border-gray-400 text-[11px] font-bold">
                    <div className="flex justify-between"><span>Subtotal Produk</span><span>{lastTransaction.items.reduce((s,i) => s + (i.price*i.quantity), 0).toLocaleString()}</span></div>
                    {lastTransaction.taxAmount && lastTransaction.taxAmount > 0 && (
                      <div className="flex justify-between"><span>Pajak (PPN)</span><span>+{lastTransaction.taxAmount.toLocaleString()}</span></div>
                    )}
                    <div className="flex justify-between font-black text-sm uppercase pt-3 border-t-2 border-black mt-3">
                      <span>TOTAL BAYAR</span>
                      <span>{storeSettings.currencySymbol} {lastTransaction.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mt-1 pt-1 border-t border-dotted border-gray-300">
                      <span>{lastTransaction.paymentMethod}:</span>
                      <span>{lastTransaction.cashReceived?.toLocaleString() || lastTransaction.totalAmount.toLocaleString()}</span>
                    </div>
                    {lastTransaction.changeAmount !== undefined && lastTransaction.changeAmount > 0 && (
                      <div className="flex justify-between"><span>Kembalian:</span><span>{lastTransaction.changeAmount.toLocaleString()}</span></div>
                    )}
                  </div>

                  <div className="text-center w-full italic text-[11px] font-bold leading-tight px-2 whitespace-pre-wrap border-t border-dashed border-gray-400 pt-4 mb-6">
                    {storeSettings.receiptFooter}
                  </div>

                  {storeSettings.showBarcodeOnReceipt && (
                    <div className="flex flex-col items-center">
                       <div className="barcode-font text-[45px] leading-none text-black">*{lastTransaction.id.slice(-8)}*</div>
                       <p className="text-[10px] font-black tracking-widest uppercase mt-1">POS SMART SYSTEM</p>
                    </div>
                  )}
                </div>
             </div>

             <div className="flex gap-4 w-full max-w-sm">
                <button onClick={handleDirectPrint} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all active:scale-95">🖨️ Cetak Fisik</button>
                <button onClick={() => setShowPreview(false)} className="flex-1 py-5 bg-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all">Tutup</button>
             </div>
          </div>
        </div>
      )}

      <div className="print-only">
        {lastTransaction && (
          <div className="receipt-container mx-auto bg-white flex flex-col w-[80mm] text-gray-900 font-mono items-center text-center p-4">
            {storeSettings.showLogoOnReceipt && storeSettings.logo && <img src={storeSettings.logo} alt="Logo" className="w-12 h-12 object-contain mb-2 grayscale" crossOrigin="anonymous" />}
            <h4 className="font-bold uppercase text-sm mb-1">{storeSettings.name}</h4>
            <p className="text-[9px] leading-tight mb-4 whitespace-pre-wrap">{storeSettings.address}</p>
            <div className="w-full border-y border-dashed py-2 mb-3 space-y-1 text-left border-gray-400 text-[10px] font-bold">
              <div className="flex justify-between"><span>ID Transaksi:</span><span>{lastTransaction.id}</span></div>
              <div className="flex justify-between"><span>Waktu:</span><span>{new Date(lastTransaction.timestamp).toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span>Kasir:</span><span>{lastTransaction.cashierName}</span></div>
            </div>
            {lastTransaction.paymentMetadata && (
              <div className="w-full text-left text-[9px] pb-2 border-b border-dotted border-gray-300 font-bold">
                <div>Metode: {lastTransaction.paymentMethod}</div>
                <div>Bank/Provider: {lastTransaction.paymentMetadata.bankName}</div>
                <div>Ref: {lastTransaction.paymentMetadata.cardNumber || lastTransaction.paymentMetadata.referenceNumber}</div>
              </div>
            )}
            <div className="w-full border-b border-dashed pb-2 mb-2 space-y-1 text-left border-gray-400 text-[10px] font-bold">
              {lastTransaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between uppercase">
                  <span className="w-3/4">{item.name} x {item.quantity}</span>
                  <span>{((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="w-full space-y-1 mb-4 border-b border-dashed pb-3 text-left border-gray-400 text-[10px] font-bold">
              <div className="flex justify-between"><span>Subtotal</span><span>{lastTransaction.items.reduce((s,i) => s + (i.price*i.quantity), 0).toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-xs uppercase pt-1 border-t border-dotted border-gray-300 mt-1"><span>TOTAL BAYAR</span><span>{storeSettings.currencySymbol} {lastTransaction.totalAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Bayar:</span><span>{lastTransaction.cashReceived?.toLocaleString() || lastTransaction.totalAmount.toLocaleString()}</span></div>
              {lastTransaction.changeAmount !== undefined && lastTransaction.changeAmount > 0 && (
                <div className="flex justify-between"><span>Kembali:</span><span>{lastTransaction.changeAmount.toLocaleString()}</span></div>
              )}
            </div>
            <div className="text-center w-full italic text-[9px] font-bold">{storeSettings.receiptFooter}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;

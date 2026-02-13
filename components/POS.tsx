
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, PaymentMethod, CartItem, Transaction, StoreSettings } from '../types';

interface POSProps {
  products: Product[];
  cashierName: string;
  onCheckout: (
    cart: CartItem[], 
    total: number, 
    globalDiscount: number, 
    method: PaymentMethod,
    cashReceived?: number,
    changeAmount?: number,
    paymentMetadata?: Transaction['paymentMetadata']
  ) => void;
  storeSettings: StoreSettings;
}

const POS: React.FC<POSProps> = ({ products, cashierName, onCheckout, storeSettings }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<{name: string, price: number} | null>(null);
  const [isContinuousScan, setIsContinuousScan] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Metadata states for Non-Cash
  const [bankName, setBankName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [providerName, setProviderName] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemLevelDiscounts = cart.reduce((sum, item) => sum + item.manualDiscount, 0);
  const grandTotal = Math.max(0, subTotal - itemLevelDiscounts - globalDiscount);
  const changeAmount = Math.max(0, cashReceived - grandTotal);

  // Validation Logic
  const isPaymentValid = useMemo(() => {
    if (paymentMethod === PaymentMethod.CASH) {
      return cashReceived >= grandTotal && grandTotal > 0;
    }
    if (paymentMethod === PaymentMethod.DEBIT || paymentMethod === PaymentMethod.CREDIT_CARD) {
      return bankName.trim().length > 0 && refNumber.trim().length > 0;
    }
    if (paymentMethod === PaymentMethod.QRIS || paymentMethod === PaymentMethod.E_WALLET) {
      return providerName.trim().length > 0 && refNumber.trim().length > 0;
    }
    return false;
  }, [paymentMethod, cashReceived, grandTotal, bankName, refNumber, providerName]);

  useEffect(() => {
    if (isCheckingOut) {
      setCashReceived(0);
      setBankName('');
      setCardNumber('');
      setRefNumber('');
      setProviderName('');
    }
  }, [isCheckingOut, paymentMethod]);

  useEffect(() => {
    if (!isCheckingOut && !isScanning && !lastTransaction) {
      searchInputRef.current?.focus();
    }
  }, [isCheckingOut, isScanning, lastTransaction]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (!isScanning) return;
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Browser Anda tidak mendukung akses kamera.");
        }
        const constraints = { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(e => console.error("Video play failed:", e));
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setIsScanning(false);
      }
    };
    const timer = setTimeout(() => startCamera(), 100);
    return () => {
      clearTimeout(timer);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isScanning]);

  const addToCart = (product: Product, fromScan = false) => {
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
    if (fromScan) {
      setScanSuccess({name: product.name, price: product.price});
      setTimeout(() => setScanSuccess(null), 1500);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const exactMatch = products.find(p => p.sku.toLowerCase() === searchTerm.toLowerCase());
      if (exactMatch) {
        addToCart(exactMatch, true);
        setSearchTerm('');
        if (isContinuousScan) e.preventDefault();
      }
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.stock) {
          alert("Stok tidak mencukupi!");
          return item;
        }
        const discountPerUnit = item.manualDiscount / item.quantity;
        return { ...item, quantity: newQty, manualDiscount: discountPerUnit * newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const confirmCheckout = () => {
    if (!isPaymentValid) return;

    const txId = `TRX-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const paymentMetadata = (paymentMethod !== PaymentMethod.CASH) ? {
      bankName: bankName,
      cardNumber: cardNumber,
      referenceNumber: refNumber,
      providerName: providerName
    } : undefined;

    const txData: Transaction = {
      id: txId,
      items: [...cart],
      totalAmount: grandTotal,
      globalDiscount: globalDiscount,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod === PaymentMethod.CASH ? cashReceived : undefined,
      changeAmount: paymentMethod === PaymentMethod.CASH ? changeAmount : undefined,
      paymentMetadata: paymentMetadata,
      timestamp: timestamp,
      cashierName: cashierName
    };

    onCheckout(cart, grandTotal, globalDiscount, paymentMethod, txData.cashReceived, txData.changeAmount, txData.paymentMetadata);
    setLastTransaction(txData);
    setIsCheckingOut(false);
  };

  const handleNextTransaction = () => {
    setCart([]);
    setGlobalDiscount(0);
    setLastTransaction(null);
    setSearchTerm('');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handlePrintReceipt = () => window.print();

  const maskCardNumber = (num: string) => {
    if (!num) return '';
    const cleanNum = num.replace(/\s/g, '');
    if (cleanNum.length < 4) return cleanNum;
    return `**** **** **** ${cleanNum.slice(-4)}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full relative">
      <div className="flex-1 space-y-4 no-print">
        {/* Header & Barcode Input */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 group w-full">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Scan Barcode / SKU atau Cari Nama..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent shadow-sm rounded-2xl focus:border-blue-500 focus:outline-none text-lg font-black transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <span className="absolute left-4 top-4 text-xl opacity-40 group-focus-within:opacity-100 transition-opacity">📦</span>
            {scanSuccess && (
              <div className="absolute -top-12 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-green-600 text-white px-4 py-2 rounded-full text-xs font-black shadow-lg flex items-center gap-2">
                  <span>✅</span> ADDED: {scanSuccess.name} (Rp {scanSuccess.price.toLocaleString()})
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setIsScanning(true)} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
              <span className="text-xl">📷</span>
              <span className="font-black text-[10px] uppercase tracking-widest">Kamera</span>
            </button>
            <button onClick={() => setIsContinuousScan(!isContinuousScan)} className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isContinuousScan ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
              {isContinuousScan ? 'Auto-Clear: ON' : 'Auto-Clear: OFF'}
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[70vh] p-1 custom-scrollbar text-gray-800">
          {filteredProducts.map((p) => (
            <button key={p.id} onClick={() => addToCart(p, false)} disabled={p.stock <= 0} className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden group ${p.stock <= 0 ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' : 'bg-white border-transparent hover:border-blue-400 hover:shadow-xl hover:-translate-y-1'}`}>
              <div className="text-[9px] font-black text-blue-600 mb-1 uppercase tracking-widest flex justify-between">
                <span>{p.category}</span>
              </div>
              <div className="font-bold line-clamp-2 h-10 leading-tight">{p.name}</div>
              <div className="text-lg font-black text-gray-900 mt-3">Rp {p.price.toLocaleString()}</div>
              <div className="flex justify-between items-center mt-2">
                <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>Stok: {p.stock}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-[400px] bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col sticky top-0 overflow-hidden text-gray-800 no-print">
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="font-black text-xl tracking-tight uppercase">Keranjang</h3>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black">{cart.reduce((s, i) => s + i.quantity, 0)} ITEM</span>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[45vh] p-6 space-y-6 custom-scrollbar">
          {cart.map((item) => (
            <div key={item.id} className="space-y-3 pb-6 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-start">
                <div className="w-2/3">
                  <span className="font-bold text-sm text-gray-800 leading-tight block">{item.name}</span>
                  <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">SKU: {item.sku}</span>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">✕</button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black">-</button>
                  <span className="font-black px-4 text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black">+</button>
                </div>
                <div className="text-right font-black text-blue-600">Rp {((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between text-2xl font-black pt-4 mb-6 text-gray-900 border-t border-gray-200">
            <span>TOTAL</span>
            <span className="text-blue-600">Rp {grandTotal.toLocaleString()}</span>
          </div>
          <button onClick={() => setIsCheckingOut(true)} disabled={cart.length === 0} className={`w-full py-5 rounded-2xl font-black text-lg text-white transition-all transform active:scale-95 ${cart.length === 0 ? 'bg-gray-300' : 'bg-blue-600 shadow-xl shadow-blue-200'}`}>PROSES BAYAR</button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 animate-in fade-in zoom-in shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar text-gray-800">
            <h3 className="text-2xl font-black mb-6 uppercase tracking-tight text-center">Metode Pembayaran</h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {Object.values(PaymentMethod).map((method) => (
                <button key={method} onClick={() => setPaymentMethod(method)} className={`p-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${paymentMethod === method ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200'}`}>
                  {method}
                </button>
              ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl mb-6 space-y-4 border border-gray-100">
               <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Total Tagihan</span>
                  <span className="text-2xl font-black text-blue-600">Rp {grandTotal.toLocaleString()}</span>
               </div>

               {/* CASH SECTION */}
               {paymentMethod === PaymentMethod.CASH && (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Uang Tunai Diterima</label>
                       {cashReceived > 0 && cashReceived < grandTotal && <span className="text-[9px] font-black text-red-500 animate-pulse">UANG KURANG!</span>}
                    </div>
                    <input 
                      autoFocus 
                      type="number" 
                      className={`w-full text-3xl font-black p-4 rounded-xl border-2 bg-white focus:outline-none transition-all ${cashReceived > 0 && cashReceived < grandTotal ? 'border-red-400 text-red-600' : 'border-blue-100 text-gray-900 focus:border-blue-500'}`} 
                      placeholder="0"
                      value={cashReceived || ''} 
                      onChange={(e) => setCashReceived(parseInt(e.target.value) || 0)} 
                    />
                    <div className="flex justify-between items-center">
                       <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Kembalian</span>
                       <span className={`text-2xl font-black ${changeAmount >= 0 ? 'text-green-600' : 'text-red-400'}`}>Rp {changeAmount.toLocaleString()}</span>
                    </div>
                 </div>
               )}

               {/* DEBIT / CREDIT CARD SECTION */}
               {(paymentMethod === PaymentMethod.DEBIT || paymentMethod === PaymentMethod.CREDIT_CARD) && (
                 <div className="space-y-4">
                   <div>
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nama Bank <span className="text-red-500">*</span></label>
                     <input type="text" className={`w-full p-3 bg-white border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${bankName.trim() === '' ? 'border-red-200' : 'border-gray-200'}`} placeholder="BCA, Mandiri, BRI, dll" value={bankName} onChange={e => setBankName(e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nomor Kartu (Opsional)</label>
                     <input type="text" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="XXXX XXXX XXXX XXXX" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nomor Referensi (EDC) <span className="text-red-500">*</span></label>
                     <input required type="text" className={`w-full p-3 bg-white border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${refNumber.trim() === '' ? 'border-red-200' : 'border-gray-200'}`} placeholder="Masukkan No. Trace / Ref" value={refNumber} onChange={e => setRefNumber(e.target.value)} />
                   </div>
                 </div>
               )}

               {/* QRIS / E-WALLET SECTION */}
               {(paymentMethod === PaymentMethod.QRIS || paymentMethod === PaymentMethod.E_WALLET) && (
                 <div className="space-y-4">
                   <div>
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Provider <span className="text-red-500">*</span></label>
                     <input type="text" className={`w-full p-3 bg-white border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${providerName.trim() === '' ? 'border-red-200' : 'border-gray-200'}`} placeholder="GoPay, OVO, ShopeePay, dll" value={providerName} onChange={e => setProviderName(e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ID Transaksi / Ref <span className="text-red-500">*</span></label>
                     <input required type="text" className={`w-full p-3 bg-white border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${refNumber.trim() === '' ? 'border-red-200' : 'border-gray-200'}`} placeholder="Masukkan No. Ref Transaksi" value={refNumber} onChange={e => setRefNumber(e.target.value)} />
                   </div>
                 </div>
               )}
            </div>

            <div className="space-y-3">
              <button 
                onClick={confirmCheckout} 
                disabled={!isPaymentValid}
                className={`w-full py-5 rounded-2xl font-black text-lg text-white shadow-xl transform active:scale-95 transition-all ${isPaymentValid ? 'bg-green-500 hover:bg-green-600 shadow-green-100' : 'bg-gray-300 cursor-not-allowed shadow-none'}`}
              >
                Selesaikan Pembayaran
              </button>
              <button onClick={() => setIsCheckingOut(false)} className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-gray-600 transition-colors">Batalkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {lastTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[120] p-4 text-gray-800 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 animate-in fade-in zoom-in shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">✅</span></div>
            <h3 className="text-xl font-black text-gray-900 uppercase mb-2">Transaksi Berhasil</h3>
            <p className="text-gray-500 text-sm mb-6">Pembayaran via <span className="font-bold text-blue-600">{lastTransaction.paymentMethod}</span></p>
            
            <div className="bg-gray-50 p-6 rounded-3xl mb-6 space-y-3 border border-gray-100 text-left">
               <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-gray-400 uppercase">Tagihan</span>
                  <span className="font-black text-gray-800">Rp {lastTransaction.totalAmount.toLocaleString()}</span>
               </div>
               {lastTransaction.paymentMetadata?.referenceNumber && (
                 <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-200 pt-2">
                    <span className="font-bold uppercase">No. Referensi</span>
                    <span className="font-mono">{lastTransaction.paymentMetadata.referenceNumber}</span>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handlePrintReceipt} className="py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-xs uppercase hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><span>🖨️</span> Struk</button>
              <button onClick={handleNextTransaction} className="py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">Lanjut</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Receipt Template */}
      {lastTransaction && (
        <div className="print-only receipt-container mx-auto font-mono text-gray-900 bg-white">
          <div className="text-center mb-4">
            {storeSettings.showLogoOnReceipt && storeSettings.logo && <img src={storeSettings.logo} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2 grayscale" />}
            <h2 className="text-lg font-bold uppercase">{storeSettings.name}</h2>
            <p className="text-[9px] whitespace-pre-wrap">{storeSettings.address}</p>
          </div>
          <div className="w-full text-center border-y border-dashed py-2 mb-3 text-[9px] italic">{storeSettings.receiptHeader || 'Selamat Datang'}</div>
          <div className="text-[9px] space-y-1 mb-3 border-b border-dashed pb-2">
             <div className="flex justify-between"><span>No: {lastTransaction.id}</span></div>
             <div className="flex justify-between"><span>Tgl: {new Date(lastTransaction.timestamp).toLocaleString('id-ID')}</span></div>
             <div className="flex justify-between"><span>Kasir: {lastTransaction.cashierName}</span></div>
          </div>
          <div className="text-[9px] space-y-1.5 mb-3">
             {lastTransaction.items.map((item, idx) => (
               <div key={idx} className="flex justify-between uppercase">
                  <span className="w-full truncate">{item.name} x{item.quantity}</span>
                  <span>{((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</span>
               </div>
             ))}
          </div>
          <div className="border-t border-dashed pt-2 space-y-1 text-[9px]">
             <div className="flex justify-between font-bold text-sm uppercase"><span>Total</span><span>Rp {lastTransaction.totalAmount.toLocaleString()}</span></div>
             <div className="flex justify-between pt-2"><span>Metode</span><span>{lastTransaction.paymentMethod}</span></div>
             {lastTransaction.paymentMethod === PaymentMethod.CASH ? (
               <div className="flex justify-between font-bold"><span>Tunai</span><span>Rp {lastTransaction.cashReceived?.toLocaleString()}</span></div>
             ) : (
               <>
                 {lastTransaction.paymentMetadata?.bankName && <div className="flex justify-between"><span>Bank</span><span>{lastTransaction.paymentMetadata.bankName}</span></div>}
                 {lastTransaction.paymentMetadata?.providerName && <div className="flex justify-between"><span>Provider</span><span>{lastTransaction.paymentMetadata.providerName}</span></div>}
                 {lastTransaction.paymentMetadata?.cardNumber && <div className="flex justify-between"><span>Kartu</span><span>{maskCardNumber(lastTransaction.paymentMetadata.cardNumber)}</span></div>}
                 <div className="flex justify-between font-bold"><span>No. Ref</span><span>{lastTransaction.paymentMetadata?.referenceNumber}</span></div>
               </>
             )}
          </div>
          <div className="text-center mt-6 text-[8px] italic border-t border-dashed pt-3 pb-4">{storeSettings.receiptFooter || 'Terima kasih telah berbelanja!'}</div>
          {storeSettings.showBarcodeOnReceipt && <div className="flex flex-col items-center"><div className="barcode-font text-[30px] leading-none mb-1">*{lastTransaction.id}*</div></div>}
        </div>
      )}
    </div>
  );
};

export default POS;


import React, { useState, useEffect } from 'react';
import { Product, PaymentMethod, CartItem, Transaction } from '../types';

interface POSProps {
  products: Product[];
  // Fix: Added cashierName to POSProps to identify who is processing the transaction
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
}

const POS: React.FC<POSProps> = ({ products, cashierName, onCheckout }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  // Metadata states
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

  useEffect(() => {
    if (isCheckingOut) {
      setCashReceived(0);
      setBankName('');
      setCardNumber('');
      setRefNumber('');
      setProviderName('');
    }
  }, [isCheckingOut, paymentMethod]);

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
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      const defaultDiscountValue = product.defaultDiscountPercent 
        ? (product.price * product.defaultDiscountPercent / 100) 
        : 0;

      return [...prev, { ...product, quantity: 1, manualDiscount: defaultDiscountValue }];
    });
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
        const newTotalDiscount = discountPerUnit * newQty;
        return { ...item, quantity: newQty, manualDiscount: newTotalDiscount };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const applyItemDiscount = (id: string, amount: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, manualDiscount: Math.max(0, amount) } : item
    ));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
  };

  const confirmCheckout = () => {
    if (paymentMethod === PaymentMethod.CASH && cashReceived < grandTotal) {
      alert("Uang yang diterima kurang!");
      return;
    }

    const txId = `TRX-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const paymentMetadata = (paymentMethod !== PaymentMethod.CASH) ? {
      bankName: bankName,
      cardNumber: cardNumber,
      referenceNumber: refNumber,
      providerName: providerName
    } : undefined;

    // Fix: Added missing cashierName property to the Transaction object
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

    onCheckout(
      cart, 
      grandTotal, 
      globalDiscount, 
      paymentMethod, 
      txData.cashReceived,
      txData.changeAmount,
      txData.paymentMetadata
    );
    
    setLastTransaction(txData);
    setIsCheckingOut(false);
  };

  const handleNextTransaction = () => {
    setCart([]);
    setGlobalDiscount(0);
    setLastTransaction(null);
    setSearchTerm('');
  };

  const printReceipt = () => {
    window.print();
  };

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Product Selection Area */}
      <div className="flex-1 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari barang atau scan barcode..."
            className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-5 top-4 text-xl">🔍</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[70vh] p-1 custom-scrollbar">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className={`flex flex-col text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${
                p.stock <= 0 
                ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' 
                : 'bg-white border-gray-100 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              {p.defaultDiscountPercent > 0 && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-xl shadow-sm">
                  -{p.defaultDiscountPercent}%
                </div>
              )}
              <div className="text-[10px] font-black text-blue-600 mb-1 uppercase tracking-widest">{p.category}</div>
              <div className="font-bold text-gray-800 line-clamp-2 h-10 leading-tight">{p.name}</div>
              <div className="text-lg font-black text-gray-900 mt-3">Rp {p.price.toLocaleString()}</div>
              <div className={`text-[10px] mt-2 font-bold px-2 py-0.5 rounded-full inline-block w-fit ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                Stok: {p.stock}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-full lg:w-[400px] bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col sticky top-0 overflow-hidden">
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="font-black text-xl tracking-tight uppercase">Keranjang</h3>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black">
            {cart.reduce((s, i) => s + i.quantity, 0)} ITEM
          </span>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[45vh] p-6 space-y-6 custom-scrollbar">
          {cart.map((item) => (
            <div key={item.id} className="space-y-3 pb-6 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-gray-800 leading-tight w-2/3">{item.name}</span>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 font-bold">-</button>
                  <span className="font-black px-4 text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 font-bold">+</button>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400 line-through">Rp {(item.price * item.quantity).toLocaleString()}</div>
                  <div className="font-black text-blue-600">Rp {((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-yellow-50 p-2 rounded-xl border border-yellow-100">
                <div className="flex flex-col">
                  <span className="text-[9px] text-yellow-700 uppercase font-black">Diskon Rp:</span>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full text-xs bg-transparent border-b border-yellow-200 focus:border-yellow-500 focus:outline-none p-1 font-bold text-yellow-800"
                  value={item.manualDiscount || ''}
                  onChange={(e) => applyItemDiscount(item.id, parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center py-12 text-gray-300">
              <div className="text-6xl mb-4">🛒</div>
              <p className="font-bold text-sm">Keranjang Kosong</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-2xl font-black pt-4 border-t border-gray-200 text-gray-900">
              <span>TOTAL</span>
              <span className="text-blue-600">Rp {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-5 rounded-2xl font-black text-lg text-white transition-all transform active:scale-95 ${
              cart.length === 0 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200'
            }`}
          >
            PROSES BAYAR
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 animate-in fade-in zoom-in duration-200 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-2xl font-black mb-2 text-center uppercase tracking-tight">Metode Pembayaran</h3>
            <p className="text-center text-gray-400 text-sm mb-6 font-medium">Lengkapi rincian pembayaran pelanggan</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
              {Object.values(PaymentMethod).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 rounded-xl border-2 font-black text-xs transition-all flex items-center justify-center text-center leading-tight ${
                    paymentMethod === method 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl mb-6 border border-gray-100 space-y-4">
               <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Total Tagihan</span>
                  <span className="text-2xl font-black text-blue-600">Rp {grandTotal.toLocaleString()}</span>
               </div>

               {/* Dinamis Input Berdasarkan Metode */}
               {paymentMethod === PaymentMethod.CASH ? (
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uang Tunai Diterima (Rp)</label>
                     <input
                       autoFocus
                       type="number"
                       className="w-full text-3xl font-black p-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 focus:outline-none text-right bg-white"
                       placeholder="0"
                       value={cashReceived || ''}
                       onChange={(e) => setCashReceived(parseInt(e.target.value) || 0)}
                     />
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {[10000, 20000, 50000, 100000].map(amt => (
                        <button key={amt} onClick={() => handleQuickCash(amt)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
                          +Rp {amt.toLocaleString()}
                        </button>
                      ))}
                      <button onClick={() => handleQuickCash(grandTotal)} className="px-3 py-1.5 bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-black hover:bg-blue-200 transition-colors">Uang Pas</button>
                   </div>
                   <div className="flex justify-between items-center pt-2">
                     <span className="text-gray-500 font-bold uppercase text-xs">Kembalian</span>
                     <span className={`text-2xl font-black ${changeAmount >= 0 ? 'text-green-600' : 'text-red-400'}`}>Rp {changeAmount.toLocaleString()}</span>
                   </div>
                 </div>
               ) : (paymentMethod === PaymentMethod.DEBIT || paymentMethod === PaymentMethod.CREDIT_CARD) ? (
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2 col-span-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Bank</label>
                     <input
                       type="text"
                       className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none bg-white font-bold"
                       placeholder="Contoh: BCA, Mandiri, BNI"
                       value={bankName}
                       onChange={(e) => setBankName(e.target.value)}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">4 Digit Terakhir</label>
                     <input
                       type="text"
                       maxLength={4}
                       className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none bg-white font-bold"
                       placeholder="XXXX"
                       value={cardNumber}
                       onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. Ref / EDC</label>
                     <input
                       type="text"
                       className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none bg-white font-bold"
                       placeholder="Kode Transaksi"
                       value={refNumber}
                       onChange={(e) => setRefNumber(e.target.value)}
                     />
                   </div>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2 col-span-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Provider / App</label>
                     <input
                       type="text"
                       className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none bg-white font-bold"
                       placeholder="Contoh: Gopay, OVO, ShopeePay"
                       value={providerName}
                       onChange={(e) => setProviderName(e.target.value)}
                     />
                   </div>
                   <div className="space-y-2 col-span-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Referensi Transaksi</label>
                     <input
                       type="text"
                       className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none bg-white font-bold"
                       placeholder="Kode unik pembayaran"
                       value={refNumber}
                       onChange={(e) => setRefNumber(e.target.value)}
                     />
                   </div>
                 </div>
               )}
            </div>

            <div className="space-y-3">
              <button
                onClick={confirmCheckout}
                disabled={paymentMethod === PaymentMethod.CASH && cashReceived < grandTotal}
                className={`w-full py-5 text-white rounded-2xl font-black text-lg shadow-xl transition-all ${
                  paymentMethod === PaymentMethod.CASH && cashReceived < grandTotal
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-green-500 hover:bg-green-600 shadow-green-100 active:scale-95'
                }`}
              >
                Selesaikan Transaksi
              </button>
              <button
                onClick={() => setIsCheckingOut(false)}
                className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm uppercase tracking-widest text-center"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Success & Print Modal */}
      {lastTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 animate-in fade-in zoom-in duration-300 shadow-2xl relative overflow-hidden">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-4xl">✅</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Berhasil!</h3>
              <p className="text-gray-500 text-sm font-medium">Transaksi telah disimpan ke sistem.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl mb-8 space-y-3 border border-gray-100">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Metode</span>
                  <span className="font-bold text-gray-800 text-sm">{lastTransaction.paymentMethod}</span>
               </div>
               <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Bayar</span>
                  <span className="text-lg font-black text-blue-600">Rp {lastTransaction.totalAmount.toLocaleString()}</span>
               </div>
               {lastTransaction.paymentMethod === PaymentMethod.CASH ? (
                 <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Kembalian</span>
                    <span className="text-xl font-black text-green-600">Rp {lastTransaction.changeAmount?.toLocaleString()}</span>
                 </div>
               ) : (
                 <div className="pt-2 border-t border-gray-200">
                    <p className="text-[9px] text-gray-400 uppercase font-black mb-1">Detail Ref</p>
                    <p className="text-xs font-bold text-gray-600">
                      {lastTransaction.paymentMetadata?.bankName || lastTransaction.paymentMetadata?.providerName || '-'} 
                      {lastTransaction.paymentMetadata?.cardNumber ? ` (*${lastTransaction.paymentMetadata.cardNumber})` : ''}
                    </p>
                    <p className="text-[10px] font-mono text-blue-500 mt-1 uppercase">Ref: {lastTransaction.paymentMetadata?.referenceNumber || '-'}</p>
                 </div>
               )}
            </div>

            <div className="space-y-3">
              <button
                onClick={printReceipt}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95"
              >
                <span>🖨️</span>
                <span>CETAK STRUK</span>
              </button>
              <button
                onClick={handleNextTransaction}
                className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all uppercase tracking-widest"
              >
                Transaksi Baru
              </button>
            </div>

            {/* Hidden Receipt Area for Printing */}
            <div id="printable-receipt" className="hidden">
              <div className="text-center mb-6 space-y-1">
                <h3 className="font-bold text-xl uppercase tracking-wider">STRUK PEMBAYARAN</h3>
                <p className="text-xs text-gray-500">Sistem Kasir Pintar (Smart POS)</p>
                <p className="text-[10px] text-gray-400">Smart Office Park, Jakarta</p>
                <div className="border-b border-dashed border-gray-300 pt-4"></div>
              </div>

              <div className="text-xs space-y-2 mb-6 text-gray-700">
                <div className="flex justify-between">
                  <span>No. Transaksi:</span>
                  <span className="font-bold">{lastTransaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(lastTransaction.timestamp).toLocaleString()}</span>
                </div>
                {/* Fix: Added cashier info to the printable receipt */}
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{lastTransaction.cashierName}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-300 mb-4"></div>

              <div className="space-y-4 mb-6">
                {lastTransaction.items.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between font-bold mb-1">
                      <span className="max-w-[180px] break-words">{item.name}</span>
                      <span>Rp {((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 italic">
                      <span>{item.quantity} x Rp {item.price.toLocaleString()}</span>
                      {item.manualDiscount > 0 && (
                        <span className="text-red-500 font-medium">- Rp {item.manualDiscount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-gray-300 mb-4"></div>

              <div className="space-y-2 mb-6 text-xs">
                <div className="flex justify-between text-lg font-black pt-2">
                  <span>TOTAL</span>
                  <span>Rp {lastTransaction.totalAmount.toLocaleString()}</span>
                </div>
                
                <div className="pt-2 space-y-1 border-t border-gray-100 mt-2">
                  <div className="flex justify-between font-semibold text-gray-600 uppercase text-[10px]">
                    <span>Metode</span>
                    <span>{lastTransaction.paymentMethod}</span>
                  </div>
                  
                  {lastTransaction.paymentMethod === PaymentMethod.CASH ? (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Bayar</span>
                        <span>Rp {lastTransaction.cashReceived?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 font-bold">
                        <span>Kembali</span>
                        <span>Rp {lastTransaction.changeAmount?.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Provider/Bank</span>
                        <span>{lastTransaction.paymentMetadata?.bankName || lastTransaction.paymentMetadata?.providerName || '-'}</span>
                      </div>
                      {lastTransaction.paymentMetadata?.cardNumber && (
                        <div className="flex justify-between text-gray-600">
                          <span>Kartu</span>
                          <span>**** {lastTransaction.paymentMetadata.cardNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600 font-mono text-[9px]">
                        <span>Ref</span>
                        <span>{lastTransaction.paymentMetadata?.referenceNumber || '-'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400 mt-8 mb-4 italic border-t border-dashed border-gray-200 pt-4">
                Terima kasih telah berbelanja!<br/>
                Kunjungi kami kembali.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;


import React, { useState, useMemo } from 'react';
import { Transaction, PaymentMethod, StoreSettings } from '../types';

interface HistoryProps {
  transactions: Transaction[];
  storeSettings: StoreSettings;
}

const History: React.FC<HistoryProps> = ({ transactions, storeSettings }) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const lowerSearch = searchTerm.toLowerCase();
    return transactions.filter((tx) => {
      const matchesId = tx.id.toLowerCase().includes(lowerSearch);
      const matchesMethod = tx.paymentMethod.toLowerCase().includes(lowerSearch);
      const matchesRef = tx.paymentMetadata?.referenceNumber?.toLowerCase().includes(lowerSearch);
      return matchesId || matchesMethod || matchesRef;
    });
  }, [transactions, searchTerm]);

  const handlePrintReceipt = (tx: Transaction) => {
    setSelectedTx(tx);
    // Delay to ensure the DOM is updated before printing
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const calculateTxProfit = (tx: Transaction) => {
    const itemsProfit = tx.items.reduce((sum, item) => {
      const revenue = (item.price * item.quantity) - (item.manualDiscount || 0);
      const cost = (item.costPrice || 0) * item.quantity;
      return sum + (revenue - cost);
    }, 0);
    return itemsProfit - (tx.globalDiscount || 0);
  };

  const maskCardNumber = (num: string) => {
    if (!num) return '';
    const cleanNum = num.replace(/\s/g, '');
    if (cleanNum.length < 4) return cleanNum;
    return `**** **** **** ${cleanNum.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Riwayat Transaksi</h2>
          <p className="text-sm text-gray-400 font-medium">Lacak dan tinjau semua aktivitas penjualan toko.</p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari ID, metode, atau no. referensi..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden text-gray-800 no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                <th className="p-6">ID Transaksi</th>
                <th className="p-6">Waktu</th>
                <th className="p-6">Metode</th>
                <th className="p-6">Total</th>
                <th className="p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-6 font-bold text-sm text-gray-900">{tx.id}</td>
                  <td className="p-6 text-xs text-gray-500 font-medium">{new Date(tx.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="p-6">
                    <span className="text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-tight bg-blue-100 text-blue-600">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="p-6 font-black text-sm text-gray-900">Rp {tx.totalAmount.toLocaleString()}</td>
                  <td className="p-6 text-right flex justify-end gap-3">
                    <button 
                      onClick={() => handlePrintReceipt(tx)} 
                      className="bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all transform active:scale-95"
                    >
                      Struk
                    </button>
                    <button 
                      onClick={() => setSelectedTx(tx)} 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all transform active:scale-95"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <span className="text-6xl mb-4">📂</span>
                      <p className="font-black uppercase tracking-widest text-xs text-gray-400">Tidak ada transaksi ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Transaction Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 text-gray-800 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 animate-in fade-in zoom-in duration-200 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex flex-col items-center text-center mb-8">
               {storeSettings.logo && <img src={storeSettings.logo} alt="Logo" className="w-16 h-16 object-contain mb-4 rounded-xl shadow-sm" />}
               <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">{storeSettings.name}</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Laporan Detail Penjualan</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-[10px] mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="font-black text-gray-400 uppercase tracking-widest mb-1">ID Transaksi</p>
                <p className="font-bold text-gray-900">{selectedTx.id}</p>
              </div>
              <div>
                <p className="font-black text-gray-400 uppercase tracking-widest mb-1">Kasir</p>
                <p className="font-bold text-gray-900">{selectedTx.cashierName}</p>
              </div>
              <div className="col-span-2 mt-2 pt-2 border-t border-gray-200/50">
                <p className="font-black text-gray-400 uppercase tracking-widest mb-1">Waktu</p>
                <p className="font-bold text-gray-900">{new Date(selectedTx.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Daftar Barang & Perhitungan Laba</p>
              {selectedTx.items.map((item, idx) => {
                const itemRevenue = (item.price * item.quantity) - (item.manualDiscount || 0);
                const itemCost = (item.costPrice || 0) * item.quantity;
                const itemProfit = itemRevenue - itemCost;
                
                return (
                  <div key={idx} className="flex flex-col space-y-1 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-gray-800 uppercase leading-tight w-2/3">{item.name} x{item.quantity}</span>
                      <span className="text-xs font-black text-gray-900">Rp {itemRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
                      <span className="text-gray-400">HPP: Rp {itemCost.toLocaleString()}</span>
                      <span className={itemProfit >= 0 ? "text-green-600" : "text-red-500"}>
                        Laba: Rp {itemProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-100 mb-8 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Penjualan</span>
                <span className="text-xl font-black">Rp {selectedTx.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/20">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Keuntungan</span>
                  <p className="text-[8px] opacity-50 lowercase">*setelah diskon global</p>
                </div>
                <span className={`text-sm font-black ${calculateTxProfit(selectedTx) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  Rp {calculateTxProfit(selectedTx).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-10 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <div className="flex justify-between"><span>Metode Pembayaran</span><span className="text-gray-900">{selectedTx.paymentMethod}</span></div>
              {selectedTx.paymentMetadata?.referenceNumber && (
                <div className="flex justify-between"><span>No. Referensi</span><span className="text-gray-900 font-mono tracking-normal lowercase">{selectedTx.paymentMetadata.referenceNumber}</span></div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handlePrintReceipt(selectedTx)} 
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95"
              >
                🖨️ Cetak Struk
              </button>
              <button 
                onClick={() => setSelectedTx(null)} 
                className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Receipt Template - Optimized for Thermal Printers */}
      {selectedTx && (
        <div className="print-only receipt-container mx-auto font-mono text-gray-900 bg-white">
          <div className="flex flex-col items-center text-center mb-4">
            {storeSettings.showLogoOnReceipt && storeSettings.logo && (
              <img src={storeSettings.logo} alt="Logo" className="w-12 h-12 object-contain mb-2 grayscale" />
            )}
            <h2 className="text-lg font-bold uppercase leading-tight mb-1">{storeSettings.name}</h2>
            <p className="text-[9px] leading-tight whitespace-pre-wrap px-2">{storeSettings.address}</p>
            {storeSettings.phone && <p className="text-[9px]">Telp: {storeSettings.phone}</p>}
            {storeSettings.website && <p className="text-[9px]">{storeSettings.website}</p>}
          </div>

          <div className="w-full text-center border-y border-dashed py-2 mb-4 italic text-[9px]">
            {storeSettings.receiptHeader || 'Selamat Datang di Toko Kami'}
          </div>

          <div className="text-[9px] space-y-1 mb-4 border-b border-dashed pb-2">
             <div className="flex justify-between"><span>Tgl:</span><span>{new Date(selectedTx.timestamp).toLocaleString('id-ID')}</span></div>
             <div className="flex justify-between"><span>ID:</span><span>{selectedTx.id}</span></div>
             <div className="flex justify-between"><span>Kasir:</span><span>{selectedTx.cashierName}</span></div>
          </div>

          <div className="text-[9px] space-y-2 mb-4">
             {selectedTx.items.map((item, idx) => (
               <div key={idx} className="flex flex-col">
                  <div className="flex justify-between uppercase">
                    <span>{item.name}</span>
                    <span>{((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</span>
                  </div>
                  <div className="text-[8px] opacity-70">x{item.quantity} @ {item.price.toLocaleString()}</div>
               </div>
             ))}
          </div>

          <div className="border-t border-dashed pt-2 space-y-1.5 text-[9px] mb-6">
             <div className="flex justify-between font-bold text-sm uppercase"><span>TOTAL</span><span>Rp {selectedTx.totalAmount.toLocaleString()}</span></div>
             <div className="flex justify-between pt-1 border-t border-dotted mt-2 opacity-80"><span>Metode</span><span>{selectedTx.paymentMethod}</span></div>
             {selectedTx.paymentMethod === PaymentMethod.CASH ? (
               <>
                 <div className="flex justify-between opacity-80"><span>Tunai</span><span>Rp {selectedTx.cashReceived?.toLocaleString()}</span></div>
                 <div className="flex justify-between font-bold"><span>Kembalian</span><span>Rp {selectedTx.changeAmount?.toLocaleString()}</span></div>
               </>
             ) : (
               <>
                 {selectedTx.paymentMetadata?.bankName && <div className="flex justify-between opacity-80"><span>Bank</span><span>{selectedTx.paymentMetadata.bankName}</span></div>}
                 {selectedTx.paymentMetadata?.providerName && <div className="flex justify-between opacity-80"><span>Provider</span><span>{selectedTx.paymentMetadata.providerName}</span></div>}
                 {selectedTx.paymentMetadata?.cardNumber && <div className="flex justify-between opacity-80"><span>Kartu</span><span>{maskCardNumber(selectedTx.paymentMetadata.cardNumber)}</span></div>}
                 <div className="flex justify-between font-bold"><span>No. Ref</span><span>{selectedTx.paymentMetadata?.referenceNumber}</span></div>
               </>
             )}
          </div>

          <div className="text-center mt-6 text-[9px] italic border-t border-dashed pt-4 mb-4">
            {storeSettings.receiptFooter || 'Terima kasih telah berbelanja!'}
          </div>

          {storeSettings.showBarcodeOnReceipt && (
            <div className="flex flex-col items-center mt-2">
               <div className="barcode-font text-[30px] leading-none mb-1 text-black">*{selectedTx.id}*</div>
               <p className="text-[7px] font-black tracking-widest text-black">{selectedTx.id}</p>
            </div>
          )}
          
          <div className="text-[6px] text-gray-300 font-bold uppercase tracking-widest text-center mt-8">Smart POS System v1.0.0</div>
        </div>
      )}
    </div>
  );
};

export default History;

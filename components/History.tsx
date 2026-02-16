
import React, { useState, useMemo, useRef } from 'react';
import { Transaction, StoreSettings, PaymentMethod, Role } from '../types';

interface HistoryProps {
  transactions: Transaction[];
  storeSettings: StoreSettings;
  printerConnected: boolean;
  onOpenPrinterManager: () => void;
  userRole: Role;
  onDeleteTransaction: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ 
  transactions, 
  storeSettings, 
  printerConnected, 
  onOpenPrinterManager,
  userRole,
  onDeleteTransaction
}) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const isOwner = userRole === Role.OWNER;

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const lowerSearch = searchTerm.toLowerCase();
    return transactions.filter((tx) => {
      const matchesId = tx.id.toLowerCase().includes(lowerSearch);
      const matchesMethod = tx.paymentMethod.toLowerCase().includes(lowerSearch);
      const matchesRef = tx.paymentMetadata?.referenceNumber?.toLowerCase().includes(lowerSearch);
      const matchesBank = tx.paymentMetadata?.bankName?.toLowerCase().includes(lowerSearch);
      const matchesCustomer = tx.customerName?.toLowerCase().includes(lowerSearch);
      const matchesPhone = tx.customerPhone?.toLowerCase().includes(lowerSearch);
      return matchesId || matchesMethod || matchesRef || matchesBank || matchesCustomer || matchesPhone;
    });
  }, [transactions, searchTerm]);

  const handleDirectPrint = (tx: Transaction) => {
    if (!printerConnected) {
      if (window.confirm("Printer belum terhubung. Cari printer sekarang?")) onOpenPrinterManager();
      return;
    }
    setSelectedTx(tx);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
    }
  };

  return (
    <div className="space-y-6 text-gray-800 text-left animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print text-left">
        <div className="text-left">
          <h2 className="text-2xl font-black text-gray-900 text-left uppercase tracking-tight">Riwayat Penjualan</h2>
          <p className="text-sm text-gray-400 font-medium text-left">Tinjau seluruh aktivitas kasir dan manajemen transaksi.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={onOpenPrinterManager}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${printerConnected ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
          >
            📡 {printerConnected ? 'Printer Siap' : 'Cek Printer'}
          </button>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Cari ID, No. HP, Bank..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden no-print text-left">
        <div className="overflow-x-auto text-left">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100 text-left">
                <th className="p-6 text-left">No. TRX</th>
                <th className="p-6 text-left">Waktu Transaksi</th>
                <th className="p-6 text-left">Metode Bayar</th>
                <th className="p-6 text-left">Total</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-left">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-blue-50/20 transition-colors text-left group">
                  <td className="p-6 font-black text-sm text-gray-900 text-left">#{tx.id.slice(-8)}</td>
                  <td className="p-6 text-xs text-gray-500 font-bold text-left">
                    <p>{new Date(tx.timestamp).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                    <p className="opacity-50">{new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="p-6 text-left">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-tight text-blue-600 mb-1">
                        {tx.paymentMethod}
                      </span>
                      {tx.paymentMetadata?.bankName && (
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{tx.paymentMetadata.bankName} - {tx.paymentMetadata.cardNumber || tx.paymentMetadata.referenceNumber}</span>
                      )}
                      {tx.customerName && (
                        <span className="text-[9px] text-green-600 font-black uppercase tracking-widest">👤 {tx.customerName}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-6 font-black text-sm text-gray-900 text-left">Rp {tx.totalAmount.toLocaleString()}</td>
                  <td className="p-6 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => handleDirectPrint(tx)} 
                        className="w-10 h-10 bg-white border border-gray-100 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all transform active:scale-90 shadow-sm flex items-center justify-center"
                        title="Cetak Struk"
                      >
                        🖨️
                      </button>
                      <button 
                        onClick={() => setSelectedTx(tx)} 
                        className="w-10 h-10 bg-white border border-gray-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all transform active:scale-90 shadow-sm flex items-center justify-center"
                        title="Detail Transaksi"
                      >
                        👁️
                      </button>
                      {isOwner && (
                        <button 
                          onClick={() => setTransactionToDelete(tx.id)} 
                          className="w-10 h-10 bg-white border border-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all transform active:scale-90 shadow-sm flex items-center justify-center"
                          title="Hapus Transaksi (Khusus Owner)"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <span className="text-6xl mb-4">📂</span>
                      <p className="font-black uppercase tracking-widest text-xs text-gray-400">Belum ada riwayat transaksi</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[200] p-4 text-left animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">⚠️</div>
              <h3 className="text-xl font-black text-gray-900 uppercase mb-2">Hapus Transaksi?</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Anda akan menghapus data transaksi <span className="font-bold text-gray-900">#{transactionToDelete.slice(-8)}</span>. Tindakan ini tidak dapat dibatalkan dan akan berpengaruh pada laporan keuangan.
              </p>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={confirmDelete}
                  className="py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all active:scale-95"
                 >
                   Hapus Permanen
                 </button>
                 <button 
                  onClick={() => setTransactionToDelete(null)}
                  className="py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                 >
                   Batalkan
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Detail Modal (Keep existing) */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[150] p-4 no-print text-left animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar text-gray-800">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Detail Transaksi</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">ID: {selectedTx.id}</p>
                 </div>
                 <button onClick={() => setSelectedTx(null)} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Informasi Waktu</p>
                       <p className="text-xs font-bold text-gray-800">{new Date(selectedTx.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Metode Pembayaran</p>
                       <p className="text-xs font-black text-blue-600 uppercase">{selectedTx.paymentMethod}</p>
                       {selectedTx.paymentMetadata && (
                         <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                           {selectedTx.paymentMetadata.bankName} - {selectedTx.paymentMetadata.cardNumber || selectedTx.paymentMetadata.referenceNumber}
                         </p>
                       )}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                       <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Status Pelanggan</p>
                       <p className="text-xs font-bold text-gray-800">{selectedTx.customerName || 'Bukan Member (Umum)'}</p>
                       {selectedTx.customerPhone && <p className="text-[10px] font-bold text-blue-400 mt-0.5">{selectedTx.customerPhone}</p>}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Kasir Bertugas</p>
                       <p className="text-xs font-bold text-gray-800 uppercase">{selectedTx.cashierName}</p>
                    </div>
                 </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Daftar Barang Belanja</h4>
                 <div className="space-y-3">
                    {selectedTx.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200">
                         <div className="flex-1">
                            <p className="text-sm font-black text-gray-800 uppercase leading-none mb-1">{item.name}</p>
                            <p className="text-[10px] font-bold text-gray-400">Rp {item.price.toLocaleString()} x {item.quantity}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-gray-900">Rp {((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</p>
                            {item.manualDiscount > 0 && <p className="text-[9px] font-bold text-red-400 uppercase italic">Potongan: Rp {item.manualDiscount.toLocaleString()}</p>}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="mt-8 bg-gray-900 rounded-[2rem] p-8 text-white">
                 <div className="flex justify-between items-center mb-4 opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Penjualan</span>
                    <span className="text-xs font-bold font-mono">Rp {selectedTx.items.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span>
                 </div>
                 {selectedTx.globalDiscount > 0 && (
                   <div className="flex justify-between items-center mb-4 text-red-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Potongan Global</span>
                      <span className="text-xs font-bold font-mono">-Rp {selectedTx.globalDiscount.toLocaleString()}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-sm font-black uppercase tracking-widest">Grand Total</span>
                    <span className="text-2xl font-black text-blue-400 font-mono">Rp {selectedTx.totalAmount.toLocaleString()}</span>
                 </div>
              </div>

              <div className="mt-8 flex gap-3">
                 <button onClick={() => handleDirectPrint(selectedTx)} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-2">
                    🖨️ Cetak Ulang Struk
                 </button>
                 <button onClick={() => setSelectedTx(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                    Tutup Detail
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Print View (Thermal Receipt - Existing) */}
      <div className="print-only">
        {selectedTx && (
          <div 
            className="receipt-container mx-auto bg-white flex flex-col w-[80mm] text-gray-900 font-mono items-center text-center p-4"
            style={{ fontFamily: 'monospace' }}
          >
            {storeSettings.showLogoOnReceipt && storeSettings.logo && (
              <img src={storeSettings.logo} alt="Logo" className="w-12 h-12 object-contain mb-2 grayscale" crossOrigin="anonymous" />
            )}
            <h4 className="font-bold uppercase text-sm mb-1">{storeSettings.name}</h4>
            <p className="text-[9px] leading-tight mb-4 whitespace-pre-wrap">{storeSettings.address}</p>
            
            <div className="w-full border-y border-dashed py-2 mb-3 space-y-1 text-left border-gray-400 text-[10px]">
              <div className="flex justify-between"><span>No. TRX:</span><span>{selectedTx.id}</span></div>
              <div className="flex justify-between"><span>Waktu:</span><span>{new Date(selectedTx.timestamp).toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span>Kasir:</span><span>{selectedTx.cashierName}</span></div>
              {selectedTx.customerName && (
                <>
                  <div className="flex justify-between"><span>Member:</span><span>{selectedTx.customerName}</span></div>
                  <div className="flex justify-between"><span>HP:</span><span>{selectedTx.customerPhone}</span></div>
                </>
              )}
            </div>

            <div className="w-full border-b border-dashed pb-2 mb-2 space-y-1 text-left border-gray-400 text-[10px]">
              {selectedTx.items.map((item, idx) => (
                <div key={idx} className="flex flex-col mb-1">
                  <div className="flex justify-between font-bold uppercase">
                    <span className="w-3/4">{item.name}</span>
                    <span>{((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</span>
                  </div>
                  <div className="text-[8px] opacity-70">
                    {item.price.toLocaleString()} x {item.quantity} {item.manualDiscount > 0 ? `(Disc: -${item.manualDiscount.toLocaleString()})` : ''}
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full space-y-1 mb-4 border-b border-dashed pb-3 text-left border-gray-400 text-[10px]">
              {selectedTx.globalDiscount > 0 && (
                <div className="flex justify-between italic">
                  <span>Potongan Belanja</span>
                  <span>-Rp {selectedTx.globalDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs uppercase pt-1 border-t border-dotted border-gray-300 mt-1">
                <span>TOTAL BAYAR</span>
                <span>Rp {selectedTx.totalAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between pt-2 border-t border-dotted border-gray-300 mt-2">
                 <span>Metode</span>
                 <span className="font-bold uppercase">{selectedTx.paymentMethod}</span>
              </div>
            </div>

            <div className="text-center w-full mb-6 italic text-[9px]">
              {storeSettings.receiptFooter || 'Terima kasih telah berbelanja!'}
            </div>

            {storeSettings.showBarcodeOnReceipt && (
              <div className="flex flex-col items-center">
                <div className="barcode-font text-[30px] leading-none text-black">*{selectedTx.id.slice(-8)}*</div>
                <p className="text-[7px] font-bold mt-1 tracking-widest">{selectedTx.id}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

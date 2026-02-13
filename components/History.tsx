
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
    setTimeout(() => window.print(), 500);
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
        <h2 className="text-2xl font-bold">Riwayat Transaksi</h2>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari ID, metode, atau no. referensi..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-gray-800 no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                <th className="p-4">ID Transaksi</th>
                <th className="p-4">Waktu</th>
                <th className="p-4">Metode</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-semibold text-sm">{tx.id}</td>
                  <td className="p-4 text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString('id-ID')}</td>
                  <td className="p-4"><span className="text-[10px] px-2 py-1 rounded font-bold uppercase bg-blue-50 text-blue-600">{tx.paymentMethod}</span></td>
                  <td className="p-4 font-bold text-sm text-green-600">Rp {tx.totalAmount.toLocaleString()}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handlePrintReceipt(tx)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100">Cetak</button>
                    <button onClick={() => setSelectedTx(tx)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm text-gray-800 no-print">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in duration-200 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h3 className="text-xl font-bold uppercase text-center mb-6">{storeSettings.name}</h3>
            <div className="text-xs space-y-2 mb-6 text-gray-700">
              <div className="flex justify-between"><span>ID:</span><span className="font-bold">{selectedTx.id}</span></div>
              <div className="flex justify-between"><span>Kasir:</span><span>{selectedTx.cashierName}</span></div>
              <div className="flex justify-between"><span>Waktu:</span><span>{new Date(selectedTx.timestamp).toLocaleString()}</span></div>
            </div>
            <div className="border-b border-dashed border-gray-300 mb-4"></div>
            <div className="space-y-3 mb-6">
              {selectedTx.items.map((item, idx) => (
                <div key={idx} className="text-xs flex flex-col uppercase">
                  <div className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-bold">Rp {((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-400 italic">
                    <span>HPP: Rp {(item.costPrice * item.quantity).toLocaleString()}</span>
                    <span>Laba: Rp {((item.price * item.quantity) - item.manualDiscount - (item.costPrice * item.quantity)).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-b border-dashed border-gray-300 mb-4"></div>
            <div className="space-y-2 mb-8">
              <div className="flex justify-between text-lg font-black text-blue-800">
                <span>TOTAL</span>
                <span>Rp {selectedTx.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                <span className="uppercase tracking-widest">Total Laba</span>
                <span>Rp {calculateTxProfit(selectedTx).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase mt-4"><span>Pembayaran</span><span>{selectedTx.paymentMethod}</span></div>
              {selectedTx.paymentMetadata?.referenceNumber && (
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase"><span>No. Referensi</span><span className="font-mono">{selectedTx.paymentMetadata.referenceNumber}</span></div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => window.print()} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm uppercase">🖨️ Cetak Struk</button>
              <button onClick={() => setSelectedTx(null)} className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm uppercase">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Receipt Template */}
      {selectedTx && (
        <div className="print-only receipt-container mx-auto font-mono text-gray-900 bg-white">
          <div className="text-center mb-6">
            {storeSettings.showLogoOnReceipt && storeSettings.logo && <img src={storeSettings.logo} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2 grayscale" />}
            <h2 className="text-lg font-bold uppercase">{storeSettings.name}</h2>
            <p className="text-[10px] whitespace-pre-wrap">{storeSettings.address}</p>
          </div>
          <div className="text-[10px] space-y-1 mb-4 border-b border-dashed pb-2">
             <div className="flex justify-between"><span>No: {selectedTx.id}</span></div>
             <div className="flex justify-between"><span>Tgl: {new Date(selectedTx.timestamp).toLocaleString()}</span></div>
             <div className="flex justify-between"><span>Kasir: {selectedTx.cashierName}</span></div>
          </div>
          <div className="text-[10px] space-y-2 mb-4">
             {selectedTx.items.map((item, idx) => (
               <div key={idx} className="flex justify-between uppercase">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</span>
               </div>
             ))}
          </div>
          <div className="border-t border-dashed pt-2 space-y-1 text-[10px]">
             <div className="flex justify-between font-bold text-sm uppercase"><span>Total</span><span>Rp {selectedTx.totalAmount.toLocaleString()}</span></div>
             <div className="flex justify-between pt-2"><span>Metode</span><span>{selectedTx.paymentMethod}</span></div>
             {selectedTx.paymentMethod === PaymentMethod.CASH ? (
               <div className="flex justify-between"><span>Tunai</span><span>Rp {selectedTx.cashReceived?.toLocaleString()}</span></div>
             ) : (
               <>
                 {selectedTx.paymentMetadata?.bankName && <div className="flex justify-between"><span>Bank</span><span>{selectedTx.paymentMetadata.bankName}</span></div>}
                 {selectedTx.paymentMetadata?.providerName && <div className="flex justify-between"><span>Provider</span><span>{selectedTx.paymentMetadata.providerName}</span></div>}
                 {selectedTx.paymentMetadata?.cardNumber && <div className="flex justify-between"><span>Kartu</span><span>{maskCardNumber(selectedTx.paymentMetadata.cardNumber)}</span></div>}
                 <div className="flex justify-between font-bold"><span>No. Ref</span><span>{selectedTx.paymentMetadata?.referenceNumber}</span></div>
               </>
             )}
          </div>
          <div className="text-center mt-8 text-[9px] italic border-t border-dashed pt-4">{storeSettings.receiptFooter || 'Terima kasih telah berbelanja!'}</div>
        </div>
      )}
    </div>
  );
};

export default History;

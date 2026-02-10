
import React, { useState, useMemo } from 'react';
import { Transaction, PaymentMethod } from '../types';

interface HistoryProps {
  transactions: Transaction[];
}

const History: React.FC<HistoryProps> = ({ transactions }) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter transactions based on search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;

    const lowerSearch = searchTerm.toLowerCase();
    return transactions.filter((tx) => {
      // Search by Transaction ID
      const matchesId = tx.id.toLowerCase().includes(lowerSearch);
      
      // Search by Payment Method
      const matchesMethod = tx.paymentMethod.toLowerCase().includes(lowerSearch);
      
      // Search by Item Names within the transaction
      const matchesItems = tx.items.some(item => 
        item.name.toLowerCase().includes(lowerSearch)
      );

      return matchesId || matchesMethod || matchesItems;
    });
  }, [transactions, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Riwayat Transaksi</h2>
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari ID, barang, atau metode..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                <th className="p-4">ID Transaksi</th>
                <th className="p-4">Tanggal & Waktu</th>
                <th className="p-4">Metode</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-sm">{tx.id}</div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                      {tx.items.map(i => i.name).join(', ')}
                    </div>
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {new Date(tx.timestamp).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                      tx.paymentMethod === PaymentMethod.CASH ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-sm">Rp {tx.totalAmount.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedTx(tx)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                      Lihat Struk
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-gray-400">
                    <div className="text-5xl mb-4 opacity-20">🔎</div>
                    <p className="font-medium">Transaksi tidak ditemukan</p>
                    <p className="text-xs mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div id="printable-receipt" className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="text-center mb-6 space-y-1">
                <h3 className="font-bold text-xl uppercase tracking-wider">STRUK PEMBAYARAN</h3>
                <p className="text-xs text-gray-500 font-medium tracking-tight">Sistem Kasir Pintar (Smart POS)</p>
                <p className="text-[10px] text-gray-400">Jl. Contoh No. 123, Indonesia</p>
                <div className="border-b border-dashed border-gray-300 pt-4"></div>
              </div>

              <div className="text-xs space-y-2 mb-6 text-gray-700">
                <div className="flex justify-between">
                  <span>No. Transaksi:</span>
                  <span className="font-bold">{selectedTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(selectedTx.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  {/* Fix: Use the cashier name from the transaction instead of hardcoded 'Administrator' */}
                  <span>{selectedTx.cashierName}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-300 mb-4"></div>

              <div className="space-y-4 mb-6">
                {selectedTx.items.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between font-bold mb-1">
                      <span className="max-w-[180px] break-words leading-snug">{item.name}</span>
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
                {selectedTx.globalDiscount > 0 && (
                  <div className="flex justify-between text-red-500 font-semibold italic">
                    <span>DISKON TAMBAHAN</span>
                    <span>- Rp {selectedTx.globalDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-blue-800 pt-2 border-t border-gray-100">
                  <span>TOTAL AKHIR</span>
                  <span>Rp {selectedTx.totalAmount.toLocaleString()}</span>
                </div>
                
                <div className="pt-2 space-y-1 border-t border-gray-100 mt-2">
                  <div className="flex justify-between font-bold text-gray-700 uppercase text-[10px]">
                    <span>Metode</span>
                    <span>{selectedTx.paymentMethod}</span>
                  </div>
                  
                  {selectedTx.paymentMethod === PaymentMethod.CASH ? (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Bayar</span>
                        <span>Rp {selectedTx.cashReceived?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 font-bold">
                        <span>Kembali</span>
                        <span>Rp {selectedTx.changeAmount?.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Provider/Bank</span>
                        <span>{selectedTx.paymentMetadata?.bankName || selectedTx.paymentMetadata?.providerName || '-'}</span>
                      </div>
                      {selectedTx.paymentMetadata?.cardNumber && (
                        <div className="flex justify-between text-gray-600">
                          <span>Kartu</span>
                          <span>**** {selectedTx.paymentMetadata.cardNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600 font-mono text-[9px] pt-1">
                        <span>ID Ref</span>
                        <span className="uppercase">{selectedTx.paymentMetadata?.referenceNumber || '-'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400 mt-8 mb-4 italic pt-4 border-t border-dashed border-gray-200">
                Simpan struk ini sebagai bukti pembayaran.<br/>
                Terima kasih telah berbelanja!
              </div>
            </div>

            <div className="space-y-3 no-print mt-4">
              <button
                onClick={handlePrint}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center space-x-2"
              >
                <span>🖨️</span>
                <span>CETAK STRUK</span>
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors uppercase tracking-wider"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;

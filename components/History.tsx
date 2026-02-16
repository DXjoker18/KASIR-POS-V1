
import React, { useState, useMemo, useRef } from 'react';
import { Transaction, StoreSettings, Role } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface HistoryProps {
  transactions: Transaction[];
  storeSettings: StoreSettings;
  printerConnected: boolean;
  onOpenPrinterManager: () => void;
  userRole: Role;
  onDeleteTransaction: (id: string) => void;
}

type PrintFormat = 'RECEIPT' | 'INVOICE';

const History: React.FC<HistoryProps> = ({ 
  transactions, 
  storeSettings, 
  printerConnected, 
  onOpenPrinterManager,
  userRole,
  onDeleteTransaction
}) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [printFormat, setPrintFormat] = useState<PrintFormat>('RECEIPT');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const lowerSearch = searchTerm.toLowerCase();
    return transactions.filter((tx) => {
      const matchesId = tx.id.toLowerCase().includes(lowerSearch);
      const matchesMethod = tx.paymentMethod.toLowerCase().includes(lowerSearch);
      const matchesCustomer = tx.customerName?.toLowerCase().includes(lowerSearch);
      const matchesPhone = tx.customerPhone?.toLowerCase().includes(lowerSearch);
      return matchesId || matchesMethod || matchesCustomer || matchesPhone;
    });
  }, [transactions, searchTerm]);

  const handlePrint = (tx: Transaction, format: PrintFormat) => {
    setSelectedTx(tx);
    setPrintFormat(format);
    
    // Memberikan waktu untuk React render pratinjau sebelum memicu print dialog
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDownloadPDF = async (tx: Transaction, format: PrintFormat) => {
    setSelectedTx(tx);
    setPrintFormat(format);
    setIsGeneratingPDF(true);

    // Tunggu render selesai
    setTimeout(async () => {
      if (!printRef.current) return;

      try {
        const canvas = await html2canvas(printRef.current, {
          scale: 2, // Kualitas tinggi
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: format === 'RECEIPT' ? 'p' : 'p',
          unit: 'mm',
          format: format === 'RECEIPT' ? [80, canvas.height * 80 / canvas.width] : 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${format.toLowerCase()}_${tx.id.slice(-8)}.pdf`);
      } catch (error) {
        console.error('Gagal membuat PDF:', error);
        alert('Gagal membuat file PDF. Silakan coba lagi.');
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 500);
  };

  return (
    <div className="space-y-6 text-gray-800 text-left animate-in fade-in duration-500">
      {/* Loading Overlay untuk PDF */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center text-white no-print">
          <div className="bg-white p-8 rounded-[2.5rem] flex flex-col items-center gap-4 text-gray-900 shadow-2xl">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="font-black uppercase text-xs tracking-widest">Menyiapkan Dokumen PDF...</p>
          </div>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div className="text-left">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Riwayat Penjualan</h2>
          <p className="text-sm text-gray-400 font-medium">Kelola transaksi dan unduh bukti pembayaran profesional.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={onOpenPrinterManager} 
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${printerConnected ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
          >
            {printerConnected ? '🟢 Printer Ready' : '📡 Cek Printer'}
          </button>
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Cari Transaksi atau Pelanggan..." 
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 text-sm font-bold" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
          </div>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                <th className="p-6">ID TRX</th>
                <th className="p-6">Informasi</th>
                <th className="p-6">Metode</th>
                <th className="p-6">Total</th>
                <th className="p-6 text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="p-6 font-black text-sm text-gray-900">#{tx.id.slice(-8)}</td>
                  <td className="p-6">
                    <p className="text-xs font-black text-gray-800 uppercase leading-none mb-1">{tx.customerName || 'Pelanggan Umum'}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{new Date(tx.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{tx.paymentMethod}</span>
                  </td>
                  <td className="p-6 font-black text-sm text-gray-900">{storeSettings.currencySymbol} {tx.totalAmount.toLocaleString()}</td>
                  <td className="p-6 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => handlePrint(tx, 'RECEIPT')} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[8px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">🖨️ Struk</button>
                        <button onClick={() => handleDownloadPDF(tx, 'RECEIPT')} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">📥 PDF</button>
                      </div>
                      <div className="w-px h-8 bg-gray-100 mx-1"></div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => handlePrint(tx, 'INVOICE')} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[8px] font-black uppercase hover:bg-green-600 hover:text-white transition-all">🖨️ Invoice</button>
                        <button onClick={() => handleDownloadPDF(tx, 'INVOICE')} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[8px] font-black uppercase hover:bg-green-600 hover:text-white transition-all">📥 PDF</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tampilan Khusus Cetak & PDF Generator */}
      <div className="print-only" style={{ webkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        {selectedTx && (
          <div ref={printRef} className="bg-white text-black leading-tight">
            {printFormat === 'RECEIPT' ? (
              /* --- REFINED THERMAL RECEIPT --- */
              <div className="w-[80mm] font-mono flex flex-col items-center text-center p-4 bg-white">
                {storeSettings.showLogoOnReceipt && storeSettings.logo && (
                  <img src={storeSettings.logo} className="w-20 h-20 object-contain mb-4 grayscale" alt="logo" crossOrigin="anonymous" />
                )}
                <h4 className="text-lg font-black uppercase mb-1">{storeSettings.name}</h4>
                <p className="text-[10px] font-bold mb-1 leading-tight whitespace-pre-wrap">{storeSettings.address}</p>
                {storeSettings.phone && <p className="text-[10px] font-bold mb-4">Telp: {storeSettings.phone}</p>}
                
                <div className="w-full border-t border-black pt-2 mb-4 space-y-1 text-left text-[10px] font-bold">
                  <div className="flex justify-between"><span>No. TRX:</span><span>{selectedTx.id}</span></div>
                  <div className="flex justify-between"><span>Tanggal:</span><span>{new Date(selectedTx.timestamp).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between border-b border-black pb-2 mb-2"><span>Kasir:</span><span className="uppercase">{selectedTx.cashierName}</span></div>
                  <div className="flex justify-between"><span>Customer:</span><span className="uppercase">{selectedTx.customerName || 'Umum'}</span></div>
                </div>

                <div className="w-full border-b border-black py-2 mb-4 space-y-2 text-left text-[10px] font-bold">
                  {selectedTx.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                      <div className="flex justify-between uppercase">
                        <span className="w-3/4">{item.name}</span>
                        <span>{((item.price * item.quantity) - item.manualDiscount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[9px] opacity-70 italic">
                        <span>{item.quantity} x {item.price.toLocaleString()}</span>
                        {item.manualDiscount > 0 && <span>(Disc: -{item.manualDiscount.toLocaleString()})</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="w-full space-y-1 mb-6 text-left text-[10px] font-bold">
                  <div className="flex justify-between"><span>Total Item:</span><span>{selectedTx.items.reduce((s, i) => s + i.quantity, 0)}</span></div>
                  {selectedTx.taxAmount && selectedTx.taxAmount > 0 && (
                    <div className="flex justify-between"><span>Pajak (PPN):</span><span>{selectedTx.taxAmount.toLocaleString()}</span></div>
                  )}
                  <div className="flex justify-between text-sm font-black border-t-2 border-black pt-2 mt-2">
                    <span>TOTAL BAYAR</span>
                    <span>{storeSettings.currencySymbol} {selectedTx.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-1"><span>{selectedTx.paymentMethod}:</span><span>{selectedTx.cashReceived?.toLocaleString() || selectedTx.totalAmount.toLocaleString()}</span></div>
                  {selectedTx.changeAmount !== undefined && selectedTx.changeAmount > 0 && (
                    <div className="flex justify-between"><span>Kembalian:</span><span>{selectedTx.changeAmount.toLocaleString()}</span></div>
                  )}
                </div>

                <div className="text-[11px] font-black italic mb-6 px-4 whitespace-pre-wrap leading-tight">{storeSettings.receiptFooter}</div>
                
                {storeSettings.showBarcodeOnReceipt && (
                  <div className="flex flex-col items-center">
                    <div className="barcode-font text-[50px] leading-none mb-1">*{selectedTx.id.slice(-8)}*</div>
                    <p className="text-[8px] font-bold tracking-widest uppercase">POS SMART SYSTEM</p>
                  </div>
                )}
              </div>
            ) : (
              /* --- PROFESSIONAL INVOICE A4 --- */
              <div className="w-full max-w-[210mm] p-12 bg-white font-sans">
                <div className="flex justify-between items-start border-b-8 border-gray-900 pb-10 mb-10">
                  <div className="flex items-center gap-6">
                    {storeSettings.showLogoOnReceipt && storeSettings.logo && (
                      <img src={storeSettings.logo} className="w-24 h-24 object-contain" alt="logo" crossOrigin="anonymous" />
                    )}
                    <div className="text-left">
                      <h1 className="text-4xl font-black uppercase text-gray-900 leading-tight">{storeSettings.name}</h1>
                      <p className="text-sm font-bold text-gray-500 mt-2 whitespace-pre-wrap max-w-sm">{storeSettings.address}</p>
                      <p className="text-sm font-black text-blue-600 mt-1">T: {storeSettings.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-6xl font-black text-gray-100 uppercase tracking-tighter mb-2">INVOICE</h2>
                    <p className="text-lg font-black text-gray-900 leading-none">NO: #{selectedTx.id}</p>
                    <p className="text-sm font-bold text-gray-400 mt-1">{new Date(selectedTx.timestamp).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16 mb-12">
                  <div className="text-left bg-gray-50 p-8 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Tagihan Kepada:</p>
                    <h3 className="text-2xl font-black text-gray-900 uppercase leading-none">{selectedTx.customerName || 'Pelanggan Umum'}</h3>
                    <p className="text-sm font-bold text-gray-500 mt-3">{selectedTx.customerPhone || 'N/A'}</p>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Metode Pembayaran</p>
                      <span className="text-sm font-black text-blue-600 uppercase">{selectedTx.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end items-end space-y-4">
                     <div className="w-full bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-100">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1 text-right">Total Seluruhnya</p>
                        <h4 className="text-4xl font-black text-right">{storeSettings.currencySymbol} {selectedTx.totalAmount.toLocaleString()}</h4>
                     </div>
                     <div className="w-full border-2 border-dashed border-gray-200 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Status Pembayaran: <span className="text-green-600 ml-2">LUNAS / PAID</span></p>
                     </div>
                  </div>
                </div>

                <div className="w-full mb-12">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest">
                        <th className="p-5 rounded-l-2xl">Deskripsi Produk</th>
                        <th className="p-5 text-center">Harga</th>
                        <th className="p-5 text-center">Qty</th>
                        <th className="p-5 text-center">Diskon</th>
                        <th className="p-5 text-right rounded-r-2xl">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedTx.items.map((item, idx) => (
                        <tr key={idx} className="text-sm font-bold text-gray-800">
                          <td className="p-5 uppercase font-black">{item.name}</td>
                          <td className="p-5 text-center text-gray-500">{item.price.toLocaleString()}</td>
                          <td className="p-5 text-center">{item.quantity}</td>
                          <td className="p-5 text-center text-red-500">-{item.manualDiscount.toLocaleString()}</td>
                          <td className="p-5 text-right font-black text-gray-900">
                            {((item.price * item.quantity) - item.manualDiscount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mb-16">
                  <div className="w-full max-w-[400px] space-y-4 bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                    <div className="flex justify-between text-sm font-bold text-gray-500"><span>Subtotal Produk</span><span>{selectedTx.items.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm font-bold text-red-400"><span>Diskon Manual</span><span>-{selectedTx.items.reduce((s, i) => s + i.manualDiscount, 0).toLocaleString()}</span></div>
                    {selectedTx.taxAmount && selectedTx.taxAmount > 0 && (
                      <div className="flex justify-between text-sm font-bold text-gray-500"><span>Pajak Terhitung (PPN)</span><span>+{selectedTx.taxAmount.toLocaleString()}</span></div>
                    )}
                    <div className="flex justify-between text-3xl font-black text-gray-900 border-t-4 border-gray-200 pt-6 mt-4">
                      <span>TOTAL</span>
                      <span className="text-blue-600">{storeSettings.currencySymbol} {selectedTx.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-20">
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Syarat & Ketentuan:</p>
                    <p className="text-xs font-medium text-gray-500 leading-relaxed italic whitespace-pre-wrap border-l-4 border-gray-100 pl-4">{storeSettings.receiptFooter}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-20">Hormat Kami,</p>
                    <div className="w-48 border-b-2 border-gray-900 mb-2"></div>
                    <p className="text-sm font-black uppercase text-gray-900">{selectedTx.cashierName}</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Admin / Kasir</p>
                  </div>
                </div>

                <div className="mt-24 pt-10 border-t border-gray-50 text-center">
                  <p className="text-[10px] font-black text-gray-200 uppercase tracking-[0.8em]">Terbitan Resmi Sistem POS Pintar - Digital Authentication</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;


import React, { useState } from 'react';
// Added Role to imports
import { StoreSettings, Role } from '../types';

interface ReceiptDesignerProps {
  settings: StoreSettings;
  onUpdate: (settings: StoreSettings) => void;
}

const ReceiptDesigner: React.FC<ReceiptDesignerProps> = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState<StoreSettings>({
    ...settings,
    receiptHeader: settings.receiptHeader || 'Selamat Datang di Toko Kami',
    receiptFooter: settings.receiptFooter || 'Terima kasih telah berbelanja!',
    showLogoOnReceipt: settings.showLogoOnReceipt ?? true,
    showBarcodeOnReceipt: settings.showBarcodeOnReceipt ?? true,
    phone: settings.phone || '',
    website: settings.website || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = () => {
    onUpdate(formData);
    alert('Desain struk berhasil diperbarui!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Desain Struk</h2>
          <p className="text-sm text-gray-400 font-medium">Sesuaikan tampilan struk belanja agar terlihat profesional.</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          SIMPAN DESAIN
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Settings Form */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Konfigurasi Konten</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Telepon</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Contoh: 081234567..." />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Website/Sosmed</label>
              <input name="website" value={formData.website} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Contoh: www.toko.com" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pesan Header (Atas)</label>
            <textarea name="receiptHeader" value={formData.receiptHeader} onChange={handleChange} rows={2} className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold resize-none" placeholder="Masukkan pesan sambutan..." />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pesan Footer (Bawah)</label>
            <textarea name="receiptFooter" value={formData.receiptFooter} onChange={handleChange} rows={2} className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold resize-none" placeholder="Masukkan pesan penutup..." />
          </div>

          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mt-8 mb-2">Opsi Tampilan</h3>
          <div className="space-y-3">
             <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" name="showLogoOnReceipt" checked={formData.showLogoOnReceipt} onChange={(e) => setFormData({...formData, showLogoOnReceipt: e.target.checked})} className="w-5 h-5 rounded accent-blue-600" />
                <span className="text-sm font-bold text-gray-700">Tampilkan Logo Toko</span>
             </label>
             <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" name="showBarcodeOnReceipt" checked={formData.showBarcodeOnReceipt} onChange={(e) => setFormData({...formData, showBarcodeOnReceipt: e.target.checked})} className="w-5 h-5 rounded accent-blue-600" />
                <span className="text-sm font-bold text-gray-700">Tampilkan Barcode Transaksi</span>
             </label>
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex flex-col items-center">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Pratinjau Struk Virtual</p>
           <div className="w-[80mm] min-h-[120mm] bg-white shadow-2xl rounded-sm p-6 flex flex-col items-center border-t-8 border-blue-600 text-gray-800 font-mono text-[10px] relative">
              <div className="absolute top-0 right-4 w-4 h-8 bg-blue-600/10 rounded-b-full"></div>
              
              {formData.showLogoOnReceipt && formData.logo && (
                <img src={formData.logo} alt="Logo" className="w-12 h-12 object-contain mb-2 grayscale" />
              )}
              
              <div className="text-center w-full mb-4">
                <h4 className="text-sm font-black uppercase leading-tight mb-1">{formData.name}</h4>
                <p className="opacity-70 leading-tight mb-1">{formData.address}</p>
                {formData.phone && <p className="opacity-70 leading-tight">Telp: {formData.phone}</p>}
                {formData.website && <p className="opacity-70 leading-tight">{formData.website}</p>}
              </div>

              <div className="w-full text-center border-y border-dashed py-2 mb-4 italic opacity-60">
                {formData.receiptHeader}
              </div>

              <div className="w-full space-y-1.5 mb-4">
                <div className="flex justify-between"><span>No: TRX-SAMPLE-123</span></div>
                <div className="flex justify-between"><span>Tgl: {new Date().toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>Kasir: {Role.ADMIN}</span></div>
              </div>

              <div className="w-full space-y-2 border-b border-dashed pb-3 mb-3">
                 <div className="flex justify-between uppercase"><span>Barang Sampel 1</span><span>20.000</span></div>
                 <div className="flex justify-between uppercase font-bold"><span>Total</span><span>20.000</span></div>
              </div>

              <div className="text-center w-full mb-6 italic opacity-70">
                {formData.receiptFooter}
              </div>

              {formData.showBarcodeOnReceipt && (
                <div className="flex flex-col items-center opacity-80">
                   <div className="barcode-font text-[30px] leading-none mb-1">*TRX-SAMPLE-123*</div>
                   <p className="text-[8px] font-black tracking-widest">TRX-SAMPLE-123</p>
                </div>
              )}

              <div className="mt-8 text-[7px] text-gray-300 font-black tracking-widest">POS SYSTEM v1.0</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDesigner;


import React, { useState } from 'react';
import { StoreSettings, ReceiptTemplate, Role } from '../types';

interface SettingsProps {
  settings: StoreSettings;
  onUpdate: (settings: StoreSettings) => void;
  onExportData: () => void;
  onImportData: (data: string) => void;
  onResetData: () => void;
}

type SettingsTab = 'IDENTITY' | 'TRANSACTION' | 'RECEIPT' | 'DATA';

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onExportData, onImportData, onResetData }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('IDENTITY');
  const [formData, setFormData] = useState<StoreSettings>({
    ...settings,
    taxPercentage: settings.taxPercentage || 0,
    currencySymbol: settings.currencySymbol || 'Rp',
    receiptTemplate: settings.receiptTemplate || 'classic'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = parseFloat(value) || 0;
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdate(formData);
    alert('Pengaturan berhasil diperbarui!');
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        onImportData(event.target.result);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const renderVirtualReceipt = () => {
    const t = formData.receiptTemplate || 'classic';
    const isCompact = t === 'compact';
    const isModern = t === 'modern';
    const isElegant = t === 'elegant';

    return (
      <div 
        className={`w-full max-w-[300px] min-h-[400px] bg-white shadow-xl rounded-sm p-6 flex flex-col border-t-4 border-blue-600 text-gray-800 font-mono relative transition-all duration-300 mx-auto lg:mx-0
          ${isCompact ? 'text-[8px] p-4 leading-tight' : 'text-[10px]'}
          ${isModern ? 'items-start' : 'items-center text-center'}
          ${isElegant ? 'border-x border-b border-gray-100' : ''}
        `}
        style={{ fontSize: isCompact ? '8px' : '10px' }}
      >
        {formData.showLogoOnReceipt && formData.logo && (
          <img src={formData.logo} alt="Logo" className={`${isCompact ? 'w-8 h-8' : 'w-12 h-12'} object-contain mb-2 grayscale`} />
        )}
        
        <div className={`w-full mb-4 ${isModern ? 'text-left' : 'text-center'}`}>
          <h4 className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-black uppercase leading-tight mb-1`}>{formData.name || 'NAMA TOKO ANDA'}</h4>
          <p className="opacity-70 leading-tight mb-1">{formData.address || 'Alamat Lengkap Toko'}</p>
        </div>

        <div className={`w-full border-y border-dashed py-2 mb-4 italic opacity-60 ${isModern ? 'text-left' : 'text-center'}`}>
          {formData.receiptHeader || 'Selamat Datang'}
        </div>

        <div className="w-full space-y-1 mb-4 text-left">
          <div className="flex justify-between"><span>No: TRX-12345</span></div>
          <div className="flex justify-between"><span>Tgl: 20/05/2024</span></div>
          <div className="flex justify-between"><span>Kasir: {Role.ADMIN}</span></div>
        </div>

        <div className="w-full space-y-2 border-b border-dashed pb-3 mb-3">
           <div className="flex justify-between uppercase font-bold">
             <span className="truncate pr-2">Contoh Barang A</span>
             <span>25.000</span>
           </div>
           <div className="flex justify-between opacity-70">
             <span>1 x 25.000</span>
           </div>
        </div>

        <div className="w-full space-y-1 mb-4 border-b border-dashed pb-3">
           <div className="flex justify-between font-black">
             <span>TOTAL</span>
             <span>25.000</span>
           </div>
           <div className="flex justify-between opacity-70">
             <span>Tunai</span>
             <span>50.000</span>
           </div>
           <div className="flex justify-between font-bold">
             <span>Kembali</span>
             <span>25.000</span>
           </div>
        </div>

        <div className={`text-center w-full mb-6 italic opacity-70 ${isModern ? 'text-left' : 'text-center'}`}>
          {formData.receiptFooter || 'Terima kasih!'}
        </div>

        {formData.showBarcodeOnReceipt && (
          <div className="flex flex-col items-center opacity-50 mt-auto">
             <div className="barcode-font text-[24px] leading-none text-black">*12345*</div>
             <p className="text-[7px] font-black tracking-widest mt-1">TRX-12345</p>
          </div>
        )}
      </div>
    );
  };

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'IDENTITY', label: 'Profil Toko', icon: '🏪' },
    { id: 'TRANSACTION', label: 'Transaksi', icon: '⚙️' },
    { id: 'RECEIPT', label: 'Struk', icon: '🧾' },
    { id: 'DATA', label: 'Database', icon: '💾' },
  ];

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Pengaturan Toko</h2>
          <p className="text-sm text-gray-400 font-medium">Konfigurasi pusat sistem dan identitas bisnis.</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          SIMPAN PERUBAHAN
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Tabs */}
        <div className="w-full lg:w-64 bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 min-h-[60vh]">
          {activeTab === 'IDENTITY' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-8">
                <div className="relative group">
                   <div className="w-32 h-32 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-4xl opacity-20">🏢</span>
                      )}
                   </div>
                   <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                   <label htmlFor="logo-upload" className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-700 transition-all">📷</label>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Logo & Branding</h3>
                  <p className="text-xs text-gray-400 font-medium max-w-xs mt-1">Gunakan gambar PNG/JPG transparan untuk hasil terbaik pada struk digital.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Bisnis / Toko</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nomor Telepon</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Bisnis</label>
                  <input name="email" value={formData.email} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="kontak@bisnis.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Website / Link</label>
                  <input name="website" value={formData.website} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="www.tokoanda.com" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                  <textarea name="address" rows={3} value={formData.address} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold resize-none" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TRANSACTION' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 max-w-xl">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Aturan Transaksi</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-blue-50 rounded-3xl border border-blue-100">
                  <div className="flex-1">
                    <p className="font-black text-sm text-blue-800 uppercase leading-none mb-1">Pajak (PPN)</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tight">Otomatis ditambahkan ke total belanja POS.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input name="taxPercentage" type="number" value={formData.taxPercentage} onChange={handleInputChange} className="w-20 p-3 bg-white rounded-xl font-black text-center text-blue-600 focus:outline-none" />
                    <span className="font-black text-blue-600">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex-1">
                    <p className="font-black text-sm text-gray-800 uppercase leading-none mb-1">Simbol Mata Uang</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Simbol yang akan tampil di seluruh aplikasi.</p>
                  </div>
                  <input name="currencySymbol" type="text" value={formData.currencySymbol} onChange={handleInputChange} className="w-20 p-3 bg-white rounded-xl font-black text-center text-gray-800 focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'RECEIPT' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Kustomisasi Struk Belanja</h3>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pesan Header (Atas)</label>
                    <textarea name="receiptHeader" rows={2} value={formData.receiptHeader} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold resize-none" placeholder="Masukkan pesan sambutan..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pesan Footer (Bawah)</label>
                    <textarea name="receiptFooter" rows={2} value={formData.receiptFooter} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold resize-none" placeholder="Masukkan pesan penutup..." />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border border-transparent hover:border-blue-100">
                       <span className="text-[10px] font-black text-gray-600 uppercase">Logo di Struk</span>
                       <input type="checkbox" name="showLogoOnReceipt" checked={formData.showLogoOnReceipt} onChange={handleInputChange} className="w-5 h-5 accent-blue-600" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border border-transparent hover:border-blue-100">
                       <span className="text-[10px] font-black text-gray-600 uppercase">Barcode TRX</span>
                       <input type="checkbox" name="showBarcodeOnReceipt" checked={formData.showBarcodeOnReceipt} onChange={handleInputChange} className="w-5 h-5 accent-blue-600" />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Pilih Gaya Template</label>
                    <div className="grid grid-cols-2 gap-3">
                       {(['classic', 'modern', 'elegant', 'compact'] as ReceiptTemplate[]).map(t => (
                         <button
                           key={t}
                           onClick={() => setFormData(prev => ({ ...prev, receiptTemplate: t }))}
                           className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all flex flex-col items-center gap-2 ${formData.receiptTemplate === t ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-50' : 'border-gray-50 bg-white text-gray-400 hover:border-gray-200'}`}
                         >
                           <span className="text-lg">{t === 'classic' ? '📜' : t === 'modern' ? '✨' : t === 'elegant' ? '🏛️' : '✂️'}</span>
                           {t}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Pratinjau Live Struk</p>
                   <div className="p-4 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200">
                      {renderVirtualReceipt()}
                   </div>
                   <p className="mt-4 text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">Simulasi Ukuran Kertas: 80mm</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DATA' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 max-w-2xl">
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Pencadangan & Pemulihan</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Simpan salinan data Anda secara berkala untuk menghindari kehilangan data.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={onExportData}
                  className="flex flex-col items-center gap-4 p-8 bg-blue-50 text-blue-600 rounded-[2.5rem] border-2 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">📤</span>
                  <div className="text-center">
                    <p className="font-black text-xs uppercase tracking-widest">Backup Data</p>
                    <p className="text-[9px] opacity-70 mt-1 uppercase font-bold">Unduh file .JSON</p>
                  </div>
                </button>

                <button 
                  onClick={handleImportClick}
                  className="flex flex-col items-center gap-4 p-8 bg-green-50 text-green-600 rounded-[2.5rem] border-2 border-green-100 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all group"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">📥</span>
                  <div className="text-center">
                    <p className="font-black text-xs uppercase tracking-widest">Restore Data</p>
                    <p className="text-[9px] opacity-70 mt-1 uppercase font-bold">Unggah file .JSON</p>
                  </div>
                </button>
              </div>

              <div className="pt-10 border-t border-gray-100">
                <h3 className="text-lg font-black text-red-600 uppercase tracking-tight">Area Berbahaya</h3>
                <p className="text-xs text-gray-400 font-medium mt-1 mb-6">Tindakan ini akan menghapus seluruh rekaman toko secara permanen.</p>
                
                <button 
                  onClick={() => {
                    const pass = prompt('Ketik "HAPUS" untuk konfirmasi pembersihan seluruh data:');
                    if (pass === 'HAPUS') onResetData();
                  }}
                  className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                >
                  Hard Reset Seluruh Data Toko
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

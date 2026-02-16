
import React, { useState } from 'react';
import { StoreSettings, ReceiptTemplate, Role, CardCustomization } from '../types';
import IDCard from './IDCard';

interface SettingsProps {
  settings: StoreSettings;
  onUpdate: (settings: StoreSettings) => void;
  onExportData: () => void;
  onImportData: (data: string) => void;
  onResetData: () => void;
}

type SettingsTab = 'IDENTITY' | 'TRANSACTION' | 'RECEIPT' | 'CARDS' | 'DATA';

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onExportData, onImportData, onResetData }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('IDENTITY');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseFloat(value) || 0 : value);
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // Limit 1MB
        alert("Ukuran file terlalu besar. Maksimal 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
  };

  const handleCardConfigChange = (field: keyof CardCustomization, value: any) => {
    setFormData(prev => ({
      ...prev,
      cardCustomization: { ...(prev.cardCustomization as CardCustomization), [field]: value }
    }));
  };

  const handleSave = () => { onUpdate(formData); alert('Konfigurasi toko berhasil disimpan!'); };

  const renderVirtualReceipt = () => (
    <div className={`w-[250px] bg-white shadow-xl p-4 border-t-4 border-blue-600 text-gray-800 font-mono text-[9px] text-center`}>
      {formData.showLogoOnReceipt && formData.logo && <img src={formData.logo} className="w-10 h-10 mx-auto mb-2 grayscale object-contain" />}
      <h4 className="font-black uppercase">{formData.name}</h4>
      <p className="opacity-60">{formData.address}</p>
      <div className="border-y border-dashed py-2 my-2 italic opacity-60">{formData.receiptHeader || 'Welcome'}</div>
      <div className="text-left space-y-1 mb-2">
        <div className="flex justify-between"><span>Barang A</span><span>10.000</span></div>
        <div className="flex justify-between font-black border-t border-dashed pt-1"><span>TOTAL</span><span>10.000</span></div>
      </div>
      <div className="italic opacity-60 mb-2">{formData.receiptFooter || 'Thank you'}</div>
      {formData.showBarcodeOnReceipt && <div className="barcode-font text-[20px]">*1234*</div>}
    </div>
  );

  return (
    <div className="space-y-6 text-left pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">Pengaturan Sistem</h2>
          <p className="text-sm text-gray-400 font-medium">Kendali pusat identitas dan konfigurasi toko.</p>
        </div>
        <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">SIMPAN SEMUA</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 bg-white rounded-[2rem] p-4 space-y-1 shadow-sm border border-gray-100">
          {[
            { id: 'IDENTITY', label: 'Profil Toko', icon: '🏪' },
            { id: 'TRANSACTION', label: 'Transaksi', icon: '⚙️' },
            { id: 'RECEIPT', label: 'Desain Struk', icon: '🧾' },
            { id: 'CARDS', label: 'Kartu Staff', icon: '🪪' },
            { id: 'DATA', label: 'Database', icon: '💾' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as SettingsTab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
              <span className="text-lg">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 min-h-[60vh]">
          {activeTab === 'IDENTITY' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="w-full md:w-1/3 flex flex-col items-center">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 self-start ml-2">Logo Toko</p>
                   <div className="w-40 h-40 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden relative group">
                      {formData.logo ? (
                        <>
                          <img src={formData.logo} alt="Store Logo" className="w-full h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={handleRemoveLogo} className="bg-red-500 text-white p-2 rounded-xl text-xs font-black uppercase">Hapus Logo</button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center opacity-30">
                           <span className="text-4xl mb-2">📸</span>
                           <span className="text-[8px] font-black uppercase">No Logo</span>
                        </div>
                      )}
                   </div>
                   <label className="mt-4 w-full">
                      <span className="block w-full text-center py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-600 hover:text-white transition-all">Ganti Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                   </label>
                </div>
                
                <div className="flex-1 w-full space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nama Toko</label><input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold transition-all" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Telepon Operasional</label><input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold transition-all" /></div>
                    <div className="col-span-full space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Alamat Lengkap (Ditampilkan di Struk)</label><textarea name="address" rows={3} value={formData.address} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold resize-none transition-all" /></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TRANSACTION' && (
            <div className="space-y-6 max-w-md animate-in fade-in duration-300">
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex justify-between items-center">
                <span className="font-black text-xs uppercase text-blue-800">Pajak PPN (%)</span>
                <input name="taxPercentage" type="number" value={formData.taxPercentage} onChange={handleInputChange} className="w-20 p-2 rounded-xl text-center font-black" />
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl flex justify-between items-center">
                <span className="font-black text-xs uppercase text-gray-600">Mata Uang</span>
                <input name="currencySymbol" value={formData.currencySymbol} onChange={handleInputChange} className="w-20 p-2 rounded-xl text-center font-black" />
              </div>
            </div>
          )}

          {activeTab === 'RECEIPT' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in duration-300">
              <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Pesan Pembuka (Header)</label>
                   <textarea name="receiptHeader" rows={2} value={formData.receiptHeader} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold resize-none" placeholder="Contoh: Selamat Datang!" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Pesan Penutup (Footer)</label>
                   <textarea name="receiptFooter" rows={2} value={formData.receiptFooter} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold resize-none" placeholder="Contoh: Terima Kasih!" />
                </div>
                <div className="flex gap-4">
                  <label className="flex-1 flex justify-between items-center p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <span className="text-[10px] font-black uppercase">Tampil Logo</span>
                    <input type="checkbox" name="showLogoOnReceipt" checked={formData.showLogoOnReceipt} onChange={handleInputChange} className="w-5 h-5 accent-blue-600" />
                  </label>
                  <label className="flex-1 flex justify-between items-center p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <span className="text-[10px] font-black uppercase">Barcode TRX</span>
                    <input type="checkbox" name="showBarcodeOnReceipt" checked={formData.showBarcodeOnReceipt} onChange={handleInputChange} className="w-5 h-5 accent-blue-600" />
                  </label>
                </div>
              </div>
              <div className="flex flex-col items-center">
                 <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4">Live Preview Struk</p>
                 {renderVirtualReceipt()}
              </div>
            </div>
          )}

          {activeTab === 'CARDS' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                  <span className="text-[10px] font-black uppercase">Warna Aksen</span>
                  <input type="color" value={formData.cardCustomization?.accentColor} onChange={e => handleCardConfigChange('accentColor', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                  <span className="text-[10px] font-black uppercase">Template Dasar</span>
                  <select value={formData.cardCustomization?.template} onChange={e => handleCardConfigChange('template', e.target.value)} className="bg-white border p-1 rounded font-bold text-xs focus:ring-2 focus:ring-blue-500">
                    <option value="modern">Modern Professional</option>
                    <option value="corporate">Corporate Solid</option>
                    <option value="creative">Creative Minimal</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   {['showBarcode', 'showId', 'showJoinDate', 'showExpiry'].map(field => (
                     <label key={field} className="flex justify-between p-3 bg-gray-50 rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-blue-50 transition-colors">
                       {field.replace('show', '')}
                       <input type="checkbox" checked={(formData.cardCustomization as any)[field]} onChange={e => handleCardConfigChange(field as any, e.target.checked)} className="accent-blue-600" />
                     </label>
                   ))}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center scale-90">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 text-center">Preview Kartu</p>
                <IDCard user={{ id: 'ID-12345678', fullName: 'REZA ADITAMA', role: Role.ADMIN, ktp: '320123456789', address: 'Kota Bogor', startDate: '2023-01-01', contractMonths: 12, endDate: '2024-01-01', username: '', password: '' }} settings={formData} />
              </div>
            </div>
          )}

          {activeTab === 'DATA' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={onExportData} className="p-8 bg-blue-50 text-blue-600 border border-blue-100 rounded-[2rem] font-black uppercase text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm">📤 Export / Backup Data</button>
                <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='.json'; i.onchange=(e:any)=> { const f=e.target.files[0]; const r=new FileReader(); r.onload=(ev:any)=>onImportData(ev.target.result); r.readAsText(f); }; i.click(); }} className="p-8 bg-green-50 text-green-600 border border-green-100 rounded-[2rem] font-black uppercase text-xs hover:bg-green-600 hover:text-white transition-all shadow-sm">📥 Import / Restore Data</button>
              </div>
              <div className="pt-10 border-t border-gray-100">
                <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
                   <h4 className="text-red-600 font-black uppercase text-sm mb-2">Zona Berbahaya</h4>
                   <p className="text-xs text-red-400 font-medium mb-6">Tindakan ini akan menghapus seluruh database operasional (produk, transaksi, pelanggan, dll) secara permanen.</p>
                   <button onClick={() => { if (prompt('Ketik HAPUS untuk konfirmasi reset total:') === 'HAPUS') onResetData(); }} className="w-full py-4 bg-white text-red-600 border-2 border-red-600 rounded-2xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all">Hard Reset Seluruh Sistem</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;


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

  const handleCardConfigChange = (field: keyof CardCustomization, value: any) => {
    setFormData(prev => ({
      ...prev,
      cardCustomization: { ...(prev.cardCustomization as CardCustomization), [field]: value }
    }));
  };

  const handleSave = () => { onUpdate(formData); alert('Berhasil disimpan!'); };

  const renderVirtualReceipt = () => (
    <div className={`w-[250px] bg-white shadow-xl p-4 border-t-4 border-blue-600 text-gray-800 font-mono text-[9px] text-center`}>
      {formData.logo && <img src={formData.logo} className="w-10 h-10 mx-auto mb-2 grayscale" />}
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
          <h2 className="text-2xl font-black uppercase tracking-tight">Pengaturan Sistem</h2>
          <p className="text-sm text-gray-400 font-medium">Kendali pusat identitas dan konfigurasi toko.</p>
        </div>
        <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl shadow-blue-100">SIMPAN SEMUA</button>
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">Nama Toko</label><input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl font-bold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">Telp</label><input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl font-bold" /></div>
                <div className="col-span-full space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">Alamat</label><textarea name="address" rows={3} value={formData.address} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl font-bold" /></div>
              </div>
            </div>
          )}

          {activeTab === 'TRANSACTION' && (
            <div className="space-y-6 max-w-md">
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="space-y-4">
                <textarea name="receiptHeader" rows={2} value={formData.receiptHeader} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl font-bold" placeholder="Header Struk" />
                <textarea name="receiptFooter" rows={2} value={formData.receiptFooter} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-2xl font-bold" placeholder="Footer Struk" />
                <div className="flex gap-2">
                  <label className="flex-1 flex justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <span className="text-[10px] font-black uppercase">Tampil Logo</span>
                    <input type="checkbox" name="showLogoOnReceipt" checked={formData.showLogoOnReceipt} onChange={handleInputChange} />
                  </label>
                  <label className="flex-1 flex justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <span className="text-[10px] font-black uppercase">Barcode TRX</span>
                    <input type="checkbox" name="showBarcodeOnReceipt" checked={formData.showBarcodeOnReceipt} onChange={handleInputChange} />
                  </label>
                </div>
              </div>
              <div className="flex flex-col items-center">{renderVirtualReceipt()}</div>
            </div>
          )}

          {activeTab === 'CARDS' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                  <span className="text-[10px] font-black uppercase">Warna Aksen</span>
                  <input type="color" value={formData.cardCustomization?.accentColor} onChange={e => handleCardConfigChange('accentColor', e.target.value)} />
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                  <span className="text-[10px] font-black uppercase">Template</span>
                  <select value={formData.cardCustomization?.template} onChange={e => handleCardConfigChange('template', e.target.value)} className="bg-white border p-1 rounded font-bold text-xs">
                    <option value="modern">Modern</option>
                    <option value="corporate">Corporate</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   {['showBarcode', 'showId', 'showJoinDate', 'showExpiry'].map(field => (
                     <label key={field} className="flex justify-between p-3 bg-gray-50 rounded-lg text-[9px] font-black uppercase cursor-pointer">
                       {field.replace('show', '')}
                       <input type="checkbox" checked={(formData.cardCustomization as any)[field]} onChange={e => handleCardConfigChange(field as any, e.target.checked)} />
                     </label>
                   ))}
                </div>
              </div>
              <div className="flex justify-center scale-90">
                <IDCard user={{ id: 'ID-123', fullName: 'Nama Contoh', role: Role.ADMIN, ktp: '123', address: '', startDate: '2024', contractMonths: 12, endDate: '2025', username: '', password: '' }} settings={formData} />
              </div>
            </div>
          )}

          {activeTab === 'DATA' && (
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={onExportData} className="p-8 bg-blue-50 text-blue-600 rounded-[2rem] font-black uppercase text-xs hover:bg-blue-600 hover:text-white transition-all">📤 Backup Data</button>
                <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='.json'; i.onchange=(e:any)=> { const f=e.target.files[0]; const r=new FileReader(); r.onload=(ev:any)=>onImportData(ev.target.result); r.readAsText(f); }; i.click(); }} className="p-8 bg-green-50 text-green-600 rounded-[2rem] font-black uppercase text-xs hover:bg-green-600 hover:text-white transition-all">📥 Restore Data</button>
              </div>
              <div className="pt-10 border-t"><button onClick={() => { if (prompt('Ketik HAPUS') === 'HAPUS') onResetData(); }} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all">Hard Reset Seluruh Sistem</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

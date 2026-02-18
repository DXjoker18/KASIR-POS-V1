
import React, { useState, useMemo } from 'react';
import { StoreSettings, CardCustomization, User, Role, EmployeeStatus } from '../types';
import IDCard from './IDCard';

interface CardDesignerProps {
  settings: StoreSettings;
  onUpdate: (settings: StoreSettings) => void;
}

const CardDesigner: React.FC<CardDesignerProps> = ({ settings, onUpdate }) => {
  const [config, setConfig] = useState<CardCustomization>(settings.cardCustomization || {
    template: 'modern',
    accentColor: '#0077CC',
    bgColor: '#F0F8FF',
    textColor: '#001F3F',
    fontFamily: 'sans',
    showBarcode: true,
    showId: true,
    showJoinDate: true,
    showExpiry: true,
    nameFontSize: 10,
    nameFontWeight: '900',
    roleFontSize: 8,
    roleFontWeight: '900',
    idFontSize: 10,
    idFontWeight: '900'
  });

  const [previewId, setPreviewId] = useState('USER-12345');
  const [previewName, setPreviewName] = useState('REZA ADITAMA');

  // Fix: Add missing required properties 'phone', 'status', and 'basicSalary' to sampleUser
  const sampleUser: User = useMemo(() => ({
    id: previewId,
    fullName: previewName,
    role: Role.KARYAWAN,
    username: 'sample',
    password: '',
    ktp: '1234567890',
    phone: '08123456789',
    address: 'Jl. Contoh No. 123',
    startDate: '2023-01-01',
    contractMonths: 12,
    endDate: '2024-01-01',
    status: EmployeeStatus.CONTRACT,
    basicSalary: 0,
    photo: ''
  }), [previewId, previewName]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, bgImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdate({ ...settings, cardCustomization: config });
    alert('Desain Kartu Staff Berhasil Disimpan!');
  };

  const templates: { id: CardCustomization['template'], name: string, desc: string }[] = [
    { id: 'modern', name: 'Modern Minimal', desc: 'Bersih, profesional, dengan gaya KTP.' },
    { id: 'corporate', name: 'Corporate Pro', desc: 'Struktur kaku, header solid, tanpa sudut bulat.' },
    { id: 'creative', name: 'Creative Wave', desc: 'Geometris, foto bulat, tampilan futuristik.' }
  ];

  const fonts: { id: CardCustomization['fontFamily'], name: string }[] = [
    { id: 'sans', name: 'Inter (Sans)' },
    { id: 'serif', name: 'Libre (Serif)' },
    { id: 'mono', name: 'Inconsolata (Mono)' }
  ];

  const fontWeights = ['300', '400', '500', '600', '700', '800', '900'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black">Desainer Kartu Staff</h2>
          <p className="text-sm text-gray-400 font-medium">Kustomisasi manual tampilan kartu identitas karyawan Anda.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfig({ ...config, bgImage: undefined })}
            className="bg-white border border-gray-200 text-red-500 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all focus:ring-2 focus:ring-red-100 focus:outline-none"
          >
            Hapus Background
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 focus:ring-4 focus:ring-blue-100 focus:outline-none"
          >
            SIMPAN DESAIN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Editor Panel */}
        <div className="xl:col-span-4 space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar text-left">
          
          {/* Preview Data Section */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Data Pratinjau (Preview)</h3>
             <div className="space-y-3">
               <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">ID Staff Pratinjau</label>
                  <input 
                    type="text" 
                    value={previewId}
                    onChange={(e) => setPreviewId(e.target.value)}
                    placeholder="Contoh: USER-99999"
                    className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                  />
               </div>
               <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Nama Pratinjau</label>
                  <input 
                    type="text" 
                    value={previewName}
                    onChange={(e) => setPreviewName(e.target.value)}
                    placeholder="Contoh: BUDI SANTOSO"
                    className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                  />
               </div>
             </div>
          </div>

          {/* Template Gallery */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Pilih Template Dasar</h3>
             <div className="space-y-2">
                {templates.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setConfig({ ...config, template: t.id })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${config.template === t.id ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:border-gray-200 bg-white'}`}
                  >
                    <p className={`font-black text-xs uppercase ${config.template === t.id ? 'text-blue-600' : 'text-gray-900'}`}>{t.name}</p>
                    <p className="text-[9px] text-gray-400 font-medium leading-tight mt-1">{t.desc}</p>
                  </button>
                ))}
             </div>
          </div>

          {/* Manual Customization */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
             <div>
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Warna & Tipografi</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center group">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-600 transition-colors">Aksen Utama</label>
                     <input type="color" value={config.accentColor} onChange={e => setConfig({...config, accentColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                  </div>
                  <div className="flex justify-between items-center group">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-600 transition-colors">Background</label>
                     <input type="color" value={config.bgColor} onChange={e => setConfig({...config, bgColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                  </div>
                  <div className="flex justify-between items-center group">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-600 transition-colors">Teks Utama</label>
                     <input type="color" value={config.textColor} onChange={e => setConfig({...config, textColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Gaya Tulisan (Font)</label>
                    <select 
                      value={config.fontFamily} 
                      onChange={e => setConfig({...config, fontFamily: e.target.value as any})}
                      className="w-full p-2 bg-gray-50 rounded-lg text-xs font-bold border-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      {fonts.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
               </div>
             </div>

             <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 border-t pt-4">Ukuran & Ketebalan Teks</h3>
               
               {/* Name Settings */}
               <div className="space-y-3 p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                 <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 block">Nama Staff</label>
                    <span className="text-[10px] font-black text-gray-900 bg-white px-2 rounded border">{config.nameFontSize}px</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <span className="text-[8px] font-bold text-gray-400">Font Size</span>
                     <input type="range" min="6" max="24" step="1" value={config.nameFontSize || 10} onChange={e => setConfig({...config, nameFontSize: parseInt(e.target.value)})} className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                   </div>
                   <div>
                     <span className="text-[8px] font-bold text-gray-400">Ketebalan</span>
                     <select value={config.nameFontWeight || '900'} onChange={e => setConfig({...config, nameFontWeight: e.target.value})} className="w-full p-1 bg-white border border-gray-200 rounded text-[9px] font-bold">
                       {fontWeights.map(w => <option key={w} value={w}>{w}</option>)}
                     </select>
                   </div>
                 </div>
               </div>

               {/* Role Settings */}
               <div className="space-y-3 p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                 <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 block">Jabatan / Role</label>
                    <span className="text-[10px] font-black text-gray-900 bg-white px-2 rounded border">{config.roleFontSize}px</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <span className="text-[8px] font-bold text-gray-400">Font Size</span>
                     <input type="range" min="4" max="18" step="1" value={config.roleFontSize || 8} onChange={e => setConfig({...config, roleFontSize: parseInt(e.target.value)})} className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                   </div>
                   <div>
                     <span className="text-[8px] font-bold text-gray-400">Ketebalan</span>
                     <select value={config.roleFontWeight || '900'} onChange={e => setConfig({...config, roleFontWeight: e.target.value})} className="w-full p-1 bg-white border border-gray-200 rounded text-[9px] font-bold">
                       {fontWeights.map(w => <option key={w} value={w}>{w}</option>)}
                     </select>
                   </div>
                 </div>
               </div>

               {/* ID Settings */}
               <div className="space-y-3 p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                 <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 block">NIK / ID Staff</label>
                    <span className="text-[10px] font-black text-gray-900 bg-white px-2 rounded border">{config.idFontSize}px</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <span className="text-[8px] font-bold text-gray-400">Font Size</span>
                     <input type="range" min="6" max="20" step="1" value={config.idFontSize || 10} onChange={e => setConfig({...config, idFontSize: parseInt(e.target.value)})} className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                   </div>
                   <div>
                     <span className="text-[8px] font-bold text-gray-400">Ketebalan</span>
                     <select value={config.idFontWeight || '900'} onChange={e => setConfig({...config, idFontWeight: e.target.value})} className="w-full p-1 bg-white border border-gray-200 rounded text-[9px] font-bold">
                       {fontWeights.map(w => <option key={w} value={w}>{w}</option>)}
                     </select>
                   </div>
                 </div>
               </div>
             </div>

             <div>
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Gambar Latar (Custom)</h3>
               <label className="flex items-center justify-center p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer hover:bg-blue-100 transition-all group">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest group-hover:scale-105 transition-transform">Unggah Gambar</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
               </label>
             </div>

             <div>
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Visibilitas Data</h3>
               <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'showId', label: 'ID Staff' },
                    { id: 'showJoinDate', label: 'Tgl Join' },
                    { id: 'showExpiry', label: 'Expired' },
                    { id: 'showBarcode', label: 'Barcode' }
                  ].map(field => (
                    <label key={field.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-all">
                      <input 
                        type="checkbox" 
                        checked={(config as any)[field.id]} 
                        onChange={(e) => setConfig({...config, [field.id]: e.target.checked})} 
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer" 
                      />
                      <span className="text-[9px] font-black uppercase tracking-tight">{field.label}</span>
                    </label>
                  ))}
               </div>
             </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="xl:col-span-8 flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none"></div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mb-12 relative z-10">Live Preview Canvas</p>
           
           <div className="scale-125 md:scale-150 transition-transform duration-500 relative z-10 flex items-center justify-center">
              <IDCard user={sampleUser} settings={{ ...settings, cardCustomization: config }} />
           </div>
           
           <div className="mt-20 flex gap-4 w-full max-w-md relative z-10">
              <div className="flex-1 p-4 bg-gray-50 rounded-2xl text-center border border-gray-100">
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Dimensi Fisik</p>
                 <p className="text-[10px] font-black text-gray-800">85.6mm x 54mm</p>
              </div>
              <div className="flex-1 p-4 bg-gray-50 rounded-2xl text-center border border-gray-100">
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Kualitas Output</p>
                 <p className="text-[10px] font-black text-gray-800">300 DPI Vector</p>
              </div>
           </div>
           
           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-50 rounded-full opacity-50 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default CardDesigner;

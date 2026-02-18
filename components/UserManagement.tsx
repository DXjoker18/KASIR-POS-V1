
import React, { useState, useMemo } from 'react';
import { User, Role, StoreSettings, EmployeeStatus } from '../types';
import IDCard from './IDCard';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  storeSettings: StoreSettings;
}

type UserTab = 'PRIBADI' | 'KEPEGAWAIAN' | 'AKUN' | 'KONTAK';

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, storeSettings }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<UserTab>('PRIBADI');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [printUser, setPrintUser] = useState<User | null>(null);
  const [previewUser, setPreviewUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormState: User = {
    id: '',
    username: '',
    password: '',
    role: Role.KARYAWAN,
    fullName: '',
    ktp: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki',
    religion: '',
    education: '',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    startDate: new Date().toISOString().split('T')[0],
    contractMonths: 12,
    endDate: '',
    status: EmployeeStatus.CONTRACT,
    basicSalary: 0,
    allowance: 0,
    photo: ''
  };

  const [formData, setFormData] = useState<User>(initialFormState);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(u => 
      u.fullName.toLowerCase().includes(term) || 
      u.ktp.includes(term) || 
      u.username.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const calculateEndDate = (start: string, months: number) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ktp.length < 10) return alert('NIK minimal 10 digit!');
    
    const finalUser = {
      ...formData,
      id: editingUserId || `USER-${Date.now()}`,
      endDate: calculateEndDate(formData.startDate, formData.contractMonths)
    };
    editingUserId ? onUpdateUser(finalUser) : onAddUser(finalUser);
    resetForm();
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsFormOpen(false);
    setEditingUserId(null);
    setActiveTab('PRIBADI');
  };

  const handleEdit = (u: User) => {
    setFormData(u);
    setEditingUserId(u.id);
    setIsFormOpen(true);
  };

  const handleExecutePrint = (user: User) => {
    setPrintUser(user);
    setPreviewUser(null);
    setTimeout(() => { 
      window.print(); 
      setPrintUser(null); 
    }, 500);
  };

  const getContractStatus = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) return { label: 'Kontrak Habis', color: 'text-red-600 bg-red-50 border-red-200' };
    if (diffDays <= 30) return { label: `${diffDays} Hari Lagi`, color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { label: 'Kontrak Aktif', color: 'text-green-600 bg-green-50 border-green-200' };
  };

  const renderFormContent = () => {
    switch (activeTab) {
      case 'PRIBADI':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="md:col-span-2 flex flex-col items-center mb-4">
              <div className="w-32 h-32 bg-gray-100 rounded-[2.5rem] border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center relative group shadow-inner">
                {formData.photo ? (
                  <img src={formData.photo} alt="Staff" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl opacity-20">👤</span>
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Ganti Foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              {formData.photo && (
                <button type="button" onClick={() => setFormData({...formData, photo: ''})} className="mt-2 text-[10px] font-black text-red-400 uppercase hover:text-red-600 transition-colors">Hapus Foto</button>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap Sesuai KTP</label>
              <input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">NIK (Nomor Induk Kependudukan)</label>
              <input required maxLength={16} className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.ktp} onChange={e => setFormData({...formData, ktp: e.target.value.replace(/\D/g, '')})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tempat Lahir</label>
              <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.birthPlace} onChange={e => setFormData({...formData, birthPlace: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Lahir</label>
              <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
              <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pendidikan Terakhir</label>
              <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" placeholder="Contoh: S1 Informatika" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} />
            </div>
          </div>
        );
      case 'KEPEGAWAIAN':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jabatan / Role Akses</label>
              <select 
                disabled={editingUserId === 'user-owner'}
                className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all disabled:opacity-50" 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value as Role})}
              >
                <option value={Role.KARYAWAN}>KARYAWAN (POS & Presensi)</option>
                <option value={Role.ADMIN}>ADMIN (Inventaris & Laporan)</option>
                <option value={Role.OWNER}>OWNER (Akses Penuh)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Kepegawaian</label>
              <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as EmployeeStatus})}>
                <option value={EmployeeStatus.PERMANENT}>TETAP (No Expiry)</option>
                <option value={EmployeeStatus.CONTRACT}>KONTRAK</option>
                <option value={EmployeeStatus.PROBATION}>PROBATION (Percobaan)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gaji Pokok (Bulanan)</label>
              <input type="number" min="0" className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-lg focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tunjangan Lainnya</label>
              <input type="number" min="0" className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.allowance} onChange={e => setFormData({...formData, allowance: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Mulai Kontrak</label>
              <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Durasi Kontrak (Bulan)</label>
              <input type="number" min="1" className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.contractMonths} onChange={e => setFormData({...formData, contractMonths: parseInt(e.target.value) || 0})} />
            </div>
            <div className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">Take Home Pay (THP)</span>
                   <span className="text-sm font-medium opacity-80">Gaji Pokok + Total Tunjangan</span>
                </div>
                <span className="text-3xl font-black">{storeSettings.currencySymbol} {((formData.basicSalary || 0) + (formData.allowance || 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      case 'KONTAK':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nomor WhatsApp Staff</label>
              <input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Aktif</label>
              <input type="email" className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Tinggal Sekarang</label>
              <textarea rows={2} className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 border-none transition-all resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Kontak Darurat</label>
              <input className="w-full p-4 bg-red-50 text-red-700 rounded-2xl font-bold focus:ring-2 focus:ring-red-200 border-none transition-all" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HP Kontak Darurat</label>
              <input className="w-full p-4 bg-red-50 text-red-700 rounded-2xl font-bold focus:ring-2 focus:ring-red-200 border-none transition-all" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} />
            </div>
          </div>
        );
      case 'AKUN':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username Login</label>
                <input required className="w-full p-4 bg-gray-900 text-white rounded-2xl font-bold border-none transition-all" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password Sistem</label>
                <input required type="password" className="w-full p-4 bg-gray-900 text-white rounded-2xl font-bold border-none transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             </div>
             <div className="md:col-span-2 p-6 bg-amber-50 border border-amber-100 rounded-3xl">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">⚠️ Keamanan Data</p>
                <ul className="text-xs text-amber-700 font-bold space-y-1 list-disc ml-4">
                  <li>Data akun digunakan oleh staff untuk mengakses aplikasi sesuai role-nya.</li>
                  <li>Jangan berikan password kepada siapapun.</li>
                  <li>Role OWNER dapat melihat seluruh laporan keuangan.</li>
                </ul>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 text-left pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">Kepegawaian & Akun</h2>
          <p className="text-sm text-gray-400 font-medium">Manajemen rekam medis, payroll, dan hak akses aplikasi.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              placeholder="Cari Nama/NIK Staff..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-bold focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3.5 top-3.5 text-gray-400">🔍</span>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 whitespace-nowrap"
          >
            + TAMBAH STAFF
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 no-print animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8 border-b pb-6">
             <h3 className="text-xl font-black uppercase tracking-tight">{editingUserId ? '🛠️ Perbarui Profil Staff' : '👤 Registrasi Staff Baru'}</h3>
             <button onClick={resetForm} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">✕</button>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            {(['PRIBADI', 'KEPEGAWAIAN', 'KONTAK', 'AKUN'] as UserTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {renderFormContent()}
            <div className="pt-6 border-t border-gray-50 flex gap-4">
              <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Simpan Seluruh Data</button>
              <button type="button" onClick={resetForm} className="px-10 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-sm uppercase transition-all hover:bg-gray-200">Batalkan</button>
            </div>
          </form>
        </div>
      )}

      {/* User Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 no-print">
        {filteredUsers.map(u => {
          const contractStatus = getContractStatus(u.endDate);
          return (
            <div key={u.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:border-blue-100">
              <div className="p-8 flex items-start gap-5">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex-shrink-0 border border-gray-100 overflow-hidden shadow-inner">
                  {u.photo ? <img src={u.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">👤</div>}
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-black text-base uppercase tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{u.fullName}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">{u.role}</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${contractStatus.color}`}>{contractStatus.label}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-3 tracking-widest uppercase opacity-70">NIK: {u.ktp}</p>
                  <p className="text-sm font-black text-blue-700 mt-2">{storeSettings.currencySymbol} {((u.basicSalary || 0) + (u.allowance || 0)).toLocaleString()}</p>
                </div>
              </div>
              <div className="px-8 pb-8 pt-0 grid grid-cols-2 gap-2 mt-auto">
                <button onClick={() => handleEdit(u)} className="py-3 bg-gray-50 text-gray-700 rounded-xl font-black text-[9px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">Edit Profil</button>
                <button onClick={() => setPreviewUser(u)} className="py-3 bg-gray-50 text-gray-700 rounded-xl font-black text-[9px] uppercase hover:bg-green-600 hover:text-white transition-all shadow-sm">Cetak ID</button>
                {u.id !== 'user-owner' ? (
                  <button onClick={() => { if(confirm(`Hapus staff "${u.fullName}" secara permanen? Akun ini tidak akan bisa login lagi.`)) onDeleteUser(u.id)}} className="col-span-2 py-2 text-red-300 font-black text-[8px] uppercase hover:text-red-500 transition-colors">Hapus Data Staff</button>
                ) : (
                  <button disabled className="col-span-2 py-2 text-gray-300 font-black text-[8px] uppercase cursor-not-allowed italic">Akun Sistem Utama (Proteksi Aktif)</button>
                )}
              </div>
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30">
             <span className="text-6xl mb-4 block">🔎</span>
             <p className="font-black uppercase tracking-[0.4em] text-xs">Staff tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* ID Card Preview Modal */}
      {previewUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[150] p-6 no-print text-center animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-12 shadow-2xl flex flex-col items-center max-w-lg w-full">
              <div className="mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Pratinjau Kartu Staff</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Verifikasi data sebelum dikirim ke printer</p>
              </div>

              <div className="scale-110 md:scale-125 transition-transform duration-500 my-10 relative">
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
                <div className="relative z-10 shadow-2xl rounded-2xl">
                   <IDCard user={previewUser} settings={storeSettings} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-10">
                 <button 
                  onClick={() => handleExecutePrint(previewUser)} 
                  className="py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                 >
                   🖨️ Cetak Kartu Sekarang
                 </button>
                 <button 
                  onClick={() => setPreviewUser(null)} 
                  className="py-5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                 >
                   Tutup & Batal
                 </button>
              </div>
              
              <div className="mt-8 flex items-center gap-2 opacity-40">
                <span className="text-lg">💡</span>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Hasil cetak disesuaikan dengan dimensi kartu PVC standar (CR80)</p>
              </div>
           </div>
        </div>
      )}

      {/* Actual Invisible Print Element */}
      <div className="print-only">
         {printUser && (
            <div className="flex justify-center p-10">
              <IDCard user={printUser} settings={storeSettings} />
            </div>
         )}
      </div>
    </div>
  );
};

export default UserManagement;


import React, { useState } from 'react';
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

  const calculateEndDate = (start: string, months: number) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const renderFormContent = () => {
    switch (activeTab) {
      case 'PRIBADI':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap Sesuai KTP</label>
              <input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">NIK (Nomor Induk Kependudukan)</label>
              <input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.ktp} onChange={e => setFormData({...formData, ktp: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tempat Lahir</label>
              <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.birthPlace} onChange={e => setFormData({...formData, birthPlace: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Lahir</label>
              <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
              <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pendidikan Terakhir</label>
              <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold" placeholder="Contoh: S1 Informatika" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} />
            </div>
          </div>
        );
      case 'KEPEGAWAIAN':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jabatan / Role Akses</label>
              <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                <option value={Role.KARYAWAN}>KARYAWAN (Hanya POS & Riwayat)</option>
                <option value={Role.ADMIN}>ADMIN (Inventaris & Laporan)</option>
                <option value={Role.OWNER}>OWNER (Akses Penuh)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Kepegawaian</label>
              <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as EmployeeStatus})}>
                <option value={EmployeeStatus.PERMANENT}>TETAP</option>
                <option value={EmployeeStatus.CONTRACT}>KONTRAK</option>
                <option value={EmployeeStatus.PROBATION}>PROBATION (Percobaan)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gaji Pokok (Bulanan)</label>
              <input type="number" className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-lg" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tunjangan Lainnya</label>
              <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.allowance} onChange={e => setFormData({...formData, allowance: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Mulai Kontrak</label>
              <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Durasi Kontrak (Bulan)</label>
              <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.contractMonths} onChange={e => setFormData({...formData, contractMonths: parseInt(e.target.value) || 0})} />
            </div>
          </div>
        );
      case 'KONTAK':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nomor Handphone (WhatsApp)</label>
              <input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Pribadi</label>
              <input type="email" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Domisili Sekarang</label>
              <textarea rows={2} className="w-full p-4 bg-gray-50 rounded-2xl font-bold resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Kontak Darurat</label>
              <input className="w-full p-4 bg-red-50 rounded-2xl font-bold" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HP Kontak Darurat</label>
              <input className="w-full p-4 bg-red-50 rounded-2xl font-bold" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} />
            </div>
          </div>
        );
      case 'AKUN':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username Sistem</label>
                <input required className="w-full p-4 bg-gray-900 text-white rounded-2xl font-bold" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password Baru</label>
                <input required type="password" className="w-full p-4 bg-gray-900 text-white rounded-2xl font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             </div>
             <div className="md:col-span-2 p-6 bg-blue-50 border border-blue-100 rounded-3xl">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Informasi Penting</p>
                <ul className="text-xs text-blue-700 font-bold space-y-1 list-disc ml-4">
                  <li>Data akun ini digunakan untuk login staff ke aplikasi.</li>
                  <li>Pastikan username unik dan mudah diingat.</li>
                  <li>Password minimal terdiri dari 6 karakter.</li>
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
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">Database Kepegawaian</h2>
          <p className="text-sm text-gray-400 font-medium">Manajemen rekam jejak, kontrak, dan hak akses staff.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          + DAFTARKAN STAFF BARU
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 no-print">
          <div className="flex justify-between items-center mb-8 border-b pb-6">
             <h3 className="text-xl font-black uppercase tracking-tight">{editingUserId ? '🛠️ Pembaruan Data Staff' : '👤 Registrasi Staff Baru'}</h3>
             <button onClick={resetForm} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-100">✕</button>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            {(['PRIBADI', 'KEPEGAWAIAN', 'KONTAK', 'AKUN'] as UserTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {renderFormContent()}
            <div className="pt-6 border-t border-gray-50 flex gap-4">
              <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Simpan Seluruh Data</button>
              <button type="button" onClick={resetForm} className="px-10 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-sm uppercase transition-all">Batalkan</button>
            </div>
          </form>
        </div>
      )}

      {/* User Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 no-print">
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:border-blue-100">
            <div className="p-8 flex items-start gap-5">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex-shrink-0 border border-gray-100 overflow-hidden">
                {u.photo ? <img src={u.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">👤</div>}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-black text-sm uppercase tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">{u.fullName}</h4>
                <div className="flex gap-2 mt-1">
                  <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{u.role}</span>
                  <span className="text-[8px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase">{u.status}</span>
                </div>
                <p className="text-[9px] text-gray-400 font-bold mt-2">NIK: {u.ktp}</p>
                <p className="text-[10px] font-black text-blue-600 mt-2">{storeSettings.currencySymbol} {u.basicSalary.toLocaleString()}</p>
              </div>
            </div>
            <div className="px-8 pb-8 pt-0 grid grid-cols-2 gap-2 mt-auto">
               <button onClick={() => handleEdit(u)} className="py-3 bg-gray-50 text-gray-700 rounded-xl font-black text-[9px] uppercase hover:bg-blue-600 hover:text-white transition-all">Edit Profil</button>
               <button onClick={() => setPreviewUser(u)} className="py-3 bg-gray-50 text-gray-700 rounded-xl font-black text-[9px] uppercase hover:bg-green-600 hover:text-white transition-all">Cetak ID</button>
               {u.role !== Role.OWNER && (
                 <button onClick={() => { if(confirm('Hapus staff ini secara permanen?')) onDeleteUser(u.id)}} className="col-span-2 py-2 text-red-300 font-black text-[8px] uppercase hover:text-red-500 transition-colors">Hapus Data Staff</button>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* ID Card Preview Modal */}
      {previewUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[150] p-6 no-print text-center animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-12 shadow-2xl flex flex-col items-center max-w-lg w-full">
              <div className="mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Pratinjau Kartu Staff</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Pastikan seluruh informasi sudah benar</p>
              </div>

              <div className="scale-110 md:scale-125 transition-transform duration-500 my-10 relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full"></div>
                <div className="relative z-10">
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
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Gunakan Kertas Ukuran CR80 (PVC Card) untuk hasil terbaik</p>
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

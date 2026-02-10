
import React, { useState } from 'react';
import { User, Role } from '../types';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: Role.KARYAWAN,
    ktp: '',
    address: '',
    startDate: new Date().toISOString().split('T')[0],
    contractMonths: 12
  });

  const calculateEndDate = (start: string, months: number) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + parseInt(months.toString()));
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      ...formData,
      id: `USER-${Date.now()}`,
      endDate: calculateEndDate(formData.startDate, formData.contractMonths)
    };
    onAddUser(newUser);
    setIsAdding(false);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: Role.KARYAWAN,
      ktp: '',
      address: '',
      startDate: new Date().toISOString().split('T')[0],
      contractMonths: 12
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Manajemen Staff</h2>
          <p className="text-sm text-gray-400 font-medium">Kelola hak akses dan data karyawan toko Anda.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            + Tambah Staff Baru
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black mb-6 uppercase tracking-tight">Formulir Pendaftaran Staff</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
              <input required className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nomor KTP</label>
              <input required maxLength={16} className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.ktp} onChange={e => setFormData({...formData, ktp: e.target.value.replace(/\D/g, '')})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat Domisili</label>
              <input required className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username Akses</label>
              <input required className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
              <input required type="password" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role Jabatan</label>
              <select className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                <option value={Role.ADMIN}>ADMIN</option>
                <option value={Role.KARYAWAN}>KARYAWAN</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tgl Mulai Kerja</label>
              <input type="date" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Durasi Kontrak (Bulan)</label>
              <input type="number" min="1" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.contractMonths} onChange={e => setFormData({...formData, contractMonths: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Otomatis Selesai Kontrak</label>
              <div className="w-full p-3 bg-gray-100 rounded-xl font-bold text-blue-600">
                {calculateEndDate(formData.startDate, formData.contractMonths)}
              </div>
            </div>
            <div className="col-span-full flex space-x-3 pt-6">
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">Simpan Staff</button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-100 text-gray-500 px-8 py-3 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 relative group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">👤</div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === Role.OWNER ? 'bg-purple-100 text-purple-600' : u.role === Role.ADMIN ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                {u.role}
              </div>
            </div>
            
            <h4 className="font-black text-lg text-gray-900 leading-tight mb-1">{u.fullName}</h4>
            <p className="text-xs text-gray-400 font-medium mb-4">@{u.username}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400 font-black uppercase">No. KTP</span>
                <span className="text-gray-700 font-bold">{u.ktp}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400 font-black uppercase">Mulai Kerja</span>
                <span className="text-gray-700 font-bold">{u.startDate}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400 font-black uppercase">Akhir Kontrak</span>
                <span className="text-red-500 font-black">{u.endDate}</span>
              </div>
            </div>

            {u.role !== Role.OWNER && (
              <button
                onClick={() => onDeleteUser(u.id)}
                className="w-full py-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-xs transition-all uppercase tracking-widest"
              >
                Hapus Akses
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;

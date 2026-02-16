
import React, { useState } from 'react';
import { User, Role, StoreSettings } from '../types';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  storeSettings: StoreSettings;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, storeSettings }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const initialFormData = {
    username: '',
    password: '',
    fullName: '',
    role: Role.KARYAWAN,
    ktp: '',
    address: '',
    startDate: new Date().toISOString().split('T')[0],
    contractMonths: 12,
    photo: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const calculateEndDate = (start: string, months: number) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + parseInt(months.toString()));
    return d.toISOString().split('T')[0];
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      ktp: user.ktp,
      address: user.address,
      startDate: user.startDate,
      contractMonths: user.contractMonths,
      photo: user.photo || ''
    });
    setIsFormOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      const updatedUser: User = {
        ...formData,
        id: editingUserId,
        endDate: calculateEndDate(formData.startDate, formData.contractMonths)
      };
      onUpdateUser(updatedUser);
    } else {
      const newUser: User = {
        ...formData,
        id: `USER-${Date.now()}`,
        endDate: calculateEndDate(formData.startDate, formData.contractMonths)
      };
      onAddUser(newUser);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setIsFormOpen(false);
    setEditingUserId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black">Manajemen Staff</h2>
          <p className="text-sm text-gray-400 font-medium">Kelola data staff dan akun akses sistem.</p>
        </div>
        <div className="flex gap-2">
          {!isFormOpen && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              + Tambah Staff
            </button>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black mb-6 uppercase tracking-tight text-left">
            {editingUserId ? 'Edit Data Staff' : 'Daftar Staff Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-gray-800 text-left">
            <div className="col-span-full mb-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Foto Profil</label>
              <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-24 h-24 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {formData.photo && formData.photo.trim().length > 10 ? (
                    <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <span className="text-4xl opacity-20">👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="staff-photo-upload" 
                    onChange={handlePhotoUpload}
                  />
                  <label 
                    htmlFor="staff-photo-upload" 
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-blue-700 transition-all mb-2"
                  >
                    Pilih Foto
                  </label>
                  <p className="text-[9px] text-gray-400 font-medium">Foto staff akan digunakan sebagai identitas profil.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
              <input required className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. KTP</label>
              <input required maxLength={16} className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.ktp} onChange={e => setFormData({...formData, ktp: e.target.value.replace(/\D/g, '')})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username Akses</label>
              <input required className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password Akses</label>
              <input required type="password" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</label>
              <select 
                className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value as Role})}
              >
                <option value={Role.OWNER}>OWNER</option>
                <option value={Role.ADMIN}>ADMIN</option>
                <option value={Role.KARYAWAN}>KARYAWAN</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tgl Masuk</label>
              <input type="date" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kontrak (Bulan)</label>
              <input type="number" min="1" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.contractMonths} onChange={e => setFormData({...formData, contractMonths: parseInt(e.target.value)})} />
            </div>
            <div className="col-span-full flex space-x-3 pt-6">
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">Simpan Staff</button>
              <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-500 px-8 py-3 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 relative group flex flex-col text-left">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center overflow-hidden border border-blue-100 shadow-sm">
                {u.photo && u.photo.trim().length > 10 ? <img src={u.photo} alt={u.fullName} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <span className="text-2xl opacity-40">👤</span>}
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === Role.OWNER ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                {u.role}
              </div>
            </div>
            <h4 className="font-black text-lg text-gray-900 leading-tight mb-1 truncate">{u.fullName}</h4>
            <p className="text-xs text-gray-400 font-medium mb-4">@{u.username}</p>
            <div className="flex flex-col gap-2 mt-auto">
              <button onClick={() => handleEdit(u)} className="w-full py-3 bg-gray-50 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all">Edit Profil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;

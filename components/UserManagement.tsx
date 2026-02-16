
import React, { useState } from 'react';
import { User, Role, StoreSettings } from '../types';
import IDCard from './IDCard';

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
  const [printUser, setPrintUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', role: Role.KARYAWAN, ktp: '', address: '', startDate: new Date().toISOString().split('T')[0], contractMonths: 12, photo: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const endDate = new Date(formData.startDate);
    endDate.setMonth(endDate.getMonth() + formData.contractMonths);
    const user = { ...formData, id: editingUserId || `USER-${Date.now()}`, endDate: endDate.toISOString().split('T')[0] };
    editingUserId ? onUpdateUser(user as User) : onAddUser(user as User);
    resetForm();
  };

  const resetForm = () => { setFormData({ username: '', password: '', fullName: '', role: Role.KARYAWAN, ktp: '', address: '', startDate: new Date().toISOString().split('T')[0], contractMonths: 12, photo: '' }); setIsFormOpen(false); setEditingUserId(null); };

  const handlePrint = (user: User) => {
    setPrintUser(user);
    setTimeout(() => { window.print(); setPrintUser(null); }, 200);
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      <div className="flex justify-between items-center no-print">
        <div><h2 className="text-2xl font-black">Manajemen Staff</h2><p className="text-sm text-gray-400 font-medium">Kelola data staff dan hak akses sistem.</p></div>
        <button onClick={() => setIsFormOpen(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl shadow-blue-100">+ Tambah Staff</button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 no-print mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">Nama Lengkap</label><input required className="w-full p-3 bg-gray-50 rounded-xl font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
             <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">NIK / KTP</label><input required className="w-full p-3 bg-gray-50 rounded-xl font-bold" value={formData.ktp} onChange={e => setFormData({...formData, ktp: e.target.value})} /></div>
             <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">Role</label><select className="w-full p-3 bg-gray-50 rounded-xl font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}><option value={Role.OWNER}>OWNER</option><option value={Role.ADMIN}>ADMIN</option><option value={Role.KARYAWAN}>KARYAWAN</option></select></div>
             <div className="col-span-full flex gap-3"><button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase">Simpan</button><button type="button" onClick={resetForm} className="bg-gray-100 text-gray-500 px-8 py-3 rounded-2xl font-black text-xs uppercase">Batal</button></div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 no-print">
        {users.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl mb-4 overflow-hidden border border-gray-100">{u.photo ? <img src={u.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">👤</div>}</div>
            <h4 className="font-black text-lg text-center">{u.fullName}</h4>
            <span className="text-[9px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-black uppercase mb-6">{u.role}</span>
            <div className="grid grid-cols-2 gap-2 w-full">
               <button onClick={() => { setEditingUserId(u.id); setFormData({ ...u }); setIsFormOpen(true); }} className="py-3 bg-gray-50 text-blue-600 rounded-xl font-black text-[10px] uppercase hover:bg-blue-500 hover:text-white transition-all">Edit</button>
               <button onClick={() => handlePrint(u)} className="py-3 bg-gray-50 text-green-600 rounded-xl font-black text-[10px] uppercase hover:bg-green-500 hover:text-white transition-all">Cetak Kartu</button>
               <button onClick={() => onDeleteUser(u.id)} className="col-span-2 py-2 text-red-400 font-bold text-[9px] uppercase">Hapus Akun</button>
            </div>
          </div>
        ))}
      </div>

      <div className="print-only">
         {printUser && <div className="flex justify-center p-10"><IDCard user={printUser} settings={storeSettings} /></div>}
      </div>
    </div>
  );
};

export default UserManagement;

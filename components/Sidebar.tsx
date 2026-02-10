
import React from 'react';
import { View, User, Role } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, user, onLogout }) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: '📊', roles: [Role.OWNER, Role.ADMIN, Role.KARYAWAN] },
    { id: 'POS', label: 'Kasir (POS)', icon: '🛒', roles: [Role.OWNER, Role.ADMIN, Role.KARYAWAN] },
    { id: 'INVENTORY', label: 'Stok Barang', icon: '📦', roles: [Role.OWNER, Role.ADMIN] },
    { id: 'HISTORY', label: 'Riwayat', icon: '📜', roles: [Role.OWNER, Role.ADMIN, Role.KARYAWAN] },
    { id: 'USERS', label: 'Staff & Akun', icon: '👥', roles: [Role.OWNER] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100 hidden md:block">
        <h1 className="text-xl font-black text-blue-600 tracking-tight">KASIR PINTAR</h1>
      </div>
      <div className="p-4 md:hidden text-center text-xl font-black text-blue-600">
        KP
      </div>
      
      <div className="flex-1 mt-4 px-2 space-y-1">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
              activeView === item.id
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl mr-3">{item.icon}</span>
            <span className="hidden md:block text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 hidden md:block">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Login</p>
          <p className="text-xs font-black text-gray-800 truncate">{user.fullName}</p>
          <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase">
            {user.role}
          </span>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
        >
          <span className="text-xl mr-3">🚪</span>
          <span className="hidden md:block">Keluar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

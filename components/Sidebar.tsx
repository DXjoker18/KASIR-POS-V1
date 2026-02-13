
import React from 'react';
import { View, User, Role, StoreSettings } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  user: User;
  onLogout: () => void;
  storeSettings: StoreSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, user, onLogout, storeSettings }) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: '📊', roles: [Role.OWNER, Role.ADMIN, Role.KARYAWAN] },
    { id: 'POS', label: 'Kasir (POS)', icon: '🛒', roles: [Role.OWNER, Role.ADMIN, Role.KARYAWAN] },
    { id: 'ATTENDANCE', label: 'Daftar Hadir', icon: '⏰', roles: [Role.OWNER, Role.ADMIN, Role.KARYAWAN] },
    { id: 'INVENTORY', label: 'Stok Barang', icon: '📦', roles: [Role.OWNER, Role.ADMIN] },
    { id: 'HISTORY', label: 'Riwayat', icon: '📜', roles: [Role.OWNER, Role.ADMIN, Role.KARYAWAN] },
    { id: 'RECEIPT_CONFIG', label: 'Desain Struk', icon: '🧾', roles: [Role.OWNER, Role.ADMIN] },
    { id: 'USERS', label: 'Staff & Akun', icon: '👥', roles: [Role.OWNER] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-40 no-print">
      <div className="p-6 border-b border-gray-100 hidden md:block">
        <div className="flex items-center gap-3">
          {storeSettings.logo ? (
            <img src={storeSettings.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
          ) : (
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-black">KP</div>
          )}
          <h1 className="text-sm font-black text-blue-600 tracking-tight leading-tight truncate uppercase">
            {storeSettings.name}
          </h1>
        </div>
      </div>
      <div className="p-4 md:hidden text-center text-xl font-black text-blue-600">
        {storeSettings.logo ? (
          <img src={storeSettings.logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain mx-auto" />
        ) : (
          "KP"
        )}
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

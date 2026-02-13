
import React, { useMemo, useState, useEffect } from 'react';
import { Product, Transaction, Role, StoreSettings } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  role: Role;
  storeSettings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
}

type TimeFrame = 'Harian' | 'Mingguan' | 'Bulanan';

const Dashboard: React.FC<DashboardProps> = ({ products, transactions, role, storeSettings, onUpdateSettings }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('Harian');
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<StoreSettings>(storeSettings);

  const isOwner = role === Role.OWNER;
  const isOwnerOrAdmin = role === Role.OWNER || role === Role.ADMIN;

  const CRITICAL_THRESHOLD = 5;
  const criticalItems = useMemo(() => 
    products.filter(p => p.stock <= CRITICAL_THRESHOLD), 
    [products]
  );

  useEffect(() => {
    if (criticalItems.length > 0 && isOwnerOrAdmin) {
      setShowCriticalAlert(true);
    }
  }, [criticalItems.length, isOwnerOrAdmin]);

  const totalRevenue = transactions.reduce((sum, trx) => sum + trx.totalAmount, 0);
  
  const totalProfit = useMemo(() => {
    return transactions.reduce((sumTrx, trx) => {
      const trxItemsProfit = trx.items.reduce((sumItem, item) => {
        const itemCost = (item.costPrice || 0) * item.quantity;
        const itemRevenue = (item.price * item.quantity) - (item.manualDiscount || 0);
        return sumItem + (itemRevenue - itemCost);
      }, 0);
      return sumTrx + (trxItemsProfit - (trx.globalDiscount || 0));
    }, 0);
  }, [transactions]);

  const totalSales = transactions.length;
  
  const outOfStockItems = products.filter(p => p.stock <= 0);
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 10);

  const expiringSoon = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiry > today && expiry <= thirtyDaysFromNow;
  });

  const chartData = useMemo(() => {
    const dataMap: Record<string, { revenue: number, profit: number }> = {};
    transactions.forEach(trx => {
      const date = new Date(trx.timestamp);
      let key = '';
      if (timeFrame === 'Harian') {
        key = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      } else if (timeFrame === 'Mingguan') {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(date.setDate(diff));
        key = `Mgg ${Math.ceil(weekStart.getDate() / 7)} ${weekStart.toLocaleDateString('id-ID', { month: 'short' })}`;
      } else if (timeFrame === 'Bulanan') {
        key = date.toLocaleDateString('id-ID', { month: 'long' });
      }
      if (!dataMap[key]) dataMap[key] = { revenue: 0, profit: 0 };
      dataMap[key].revenue += trx.totalAmount;
      const trxItemsProfit = trx.items.reduce((sumItem, item) => {
        const itemCost = (item.costPrice || 0) * item.quantity;
        const itemRevenue = (item.price * item.quantity) - (item.manualDiscount || 0);
        return sumItem + (itemRevenue - itemCost);
      }, 0);
      dataMap[key].profit += (trxItemsProfit - (trx.globalDiscount || 0));
    });
    return Object.entries(dataMap)
      .map(([name, vals]) => ({ name, total: vals.revenue, profit: vals.profit }))
      .reverse();
  }, [transactions, timeFrame]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = () => {
    onUpdateSettings(tempSettings);
    setIsSettingsOpen(false);
    alert('Pengaturan toko berhasil diperbarui!');
  };

  return (
    <div className="space-y-6 pb-10 relative">
      {showCriticalAlert && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="bg-white border-l-8 border-red-500 rounded-2xl shadow-2xl p-6 w-80 relative overflow-hidden">
            <button onClick={() => setShowCriticalAlert(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h4 className="font-black text-red-600 text-sm uppercase tracking-tight">Peringatan Stok!</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">Ada <span className="font-bold text-red-600">{criticalItems.length} barang</span> yang stoknya di bawah {CRITICAL_THRESHOLD + 1} unit.</p>
            <button onClick={() => setShowCriticalAlert(false)} className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors">Saya Mengerti</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black truncate">{storeSettings.name}</h2>
          <p className="text-sm text-gray-400 font-medium">Informasi terkini operasional toko Anda.</p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <button 
              onClick={() => {
                setTempSettings(storeSettings);
                setIsSettingsOpen(true);
              }}
              className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <span>⚙️</span> Pengaturan Toko
            </button>
          )}
          {isOwnerOrAdmin && (
            <div className="flex bg-gray-200 p-1 rounded-xl shadow-inner">
              {(['Harian', 'Mingguan', 'Bulanan'] as TimeFrame[]).map((f) => (
                <button key={f} onClick={() => setTimeFrame(f)} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${timeFrame === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-lg transition-all">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Pendapatan</p>
          <p className="text-2xl font-black text-blue-600">Rp {totalRevenue.toLocaleString()}</p>
        </div>
        {role === Role.OWNER && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-lg transition-all">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Laba (Profit)</p>
            <p className="text-2xl font-black text-green-600">Rp {totalProfit.toLocaleString()}</p>
          </div>
        )}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-lg transition-all">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Barang Terdaftar</p>
          <p className="text-2xl font-black text-purple-600">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-lg transition-all">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Transaksi Selesai</p>
          <p className="text-2xl font-black text-orange-600">{totalSales}</p>
        </div>
      </div>

      {isOwnerOrAdmin && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-black mb-6 uppercase tracking-tight">Grafik Penjualan</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={4} fillOpacity={0.1} fill="#2563eb" />
                {role === Role.OWNER && <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fillOpacity={0.1} fill="#10b981" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-[300px] flex flex-col">
          <h3 className="text-lg font-black mb-4 uppercase tracking-tight">Status Stok</h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {lowStockItems.concat(outOfStockItems).map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                <div>
                  <p className="font-bold text-sm text-gray-800">{p.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">SKU: {p.sku}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.stock <= 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {p.stock <= 0 ? 'HABIS' : `${p.stock} UNIT`}
                </span>
              </div>
            ))}
            {lowStockItems.length === 0 && outOfStockItems.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <span className="text-4xl mb-2">✅</span>
                  <p className="text-xs font-bold">Stok Aman Terkendali</p>
               </div>
            )}
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-[300px] flex flex-col">
          <h3 className="text-lg font-black mb-4 uppercase tracking-tight text-red-500">Masa Kadaluarsa</h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {expiringSoon.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-2xl">
                <p className="font-bold text-sm text-gray-800">{p.name}</p>
                <p className="text-[10px] text-red-600 font-black uppercase">{p.expiryDate}</p>
              </div>
            ))}
            {expiringSoon.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <span className="text-4xl mb-2">🌿</span>
                  <p className="text-xs font-bold">Tidak ada barang kadaluarsa dalam waktu dekat</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 animate-in fade-in zoom-in duration-300 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar text-gray-800">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">Pengaturan Toko</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-400 font-medium mb-8">Informasi ini akan muncul pada laporan dan struk cetak.</p>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                <div className="relative group">
                  {tempSettings.logo ? (
                    <img src={tempSettings.logo} alt="Store Logo" className="w-24 h-24 object-contain rounded-2xl bg-white p-2 shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center text-4xl">🏢</div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                    <span className="text-white text-[10px] font-black uppercase">Ubah Logo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Klik logo untuk mengunggah gambar baru</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Toko</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold"
                  value={tempSettings.name}
                  onChange={e => setTempSettings({...tempSettings, name: e.target.value})}
                  placeholder="Contoh: Toko Berkah Abadi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Telepon</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold"
                    value={tempSettings.phone || ''}
                    onChange={e => setTempSettings({...tempSettings, phone: e.target.value})}
                    placeholder="0812..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Website</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold"
                    value={tempSettings.website || ''}
                    onChange={e => setTempSettings({...tempSettings, website: e.target.value})}
                    placeholder="www.toko.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                <textarea 
                  rows={3}
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold resize-none"
                  value={tempSettings.address}
                  onChange={e => setTempSettings({...tempSettings, address: e.target.value})}
                  placeholder="Jl. Utama No. 123..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={saveSettings}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
                >
                  SIMPAN PERUBAHAN
                </button>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                >
                  BATAL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


import React, { useMemo, useState, useEffect } from 'react';
import { Product, Transaction, Role } from '../types';
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
}

type TimeFrame = 'Harian' | 'Mingguan' | 'Bulanan';

const Dashboard: React.FC<DashboardProps> = ({ products, transactions, role }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('Harian');
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);

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

  const totalAssetValue = products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
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
          <h2 className="text-2xl font-black">Beranda Toko</h2>
          <p className="text-sm text-gray-400 font-medium">Informasi terkini operasional toko Anda.</p>
        </div>
        {isOwnerOrAdmin && (
          <div className="flex bg-gray-200 p-1 rounded-xl">
            {(['Harian', 'Mingguan', 'Bulanan'] as TimeFrame[]).map((f) => (
              <button key={f} onClick={() => setTimeFrame(f)} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${timeFrame === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
            ))}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Pendapatan</p>
          <p className="text-2xl font-black text-blue-600">Rp {totalRevenue.toLocaleString()}</p>
        </div>
        {role === Role.OWNER && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Laba (Profit)</p>
            <p className="text-2xl font-black text-green-600">Rp {totalProfit.toLocaleString()}</p>
          </div>
        )}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Barang Terdaftar</p>
          <p className="text-2xl font-black text-purple-600">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
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
                <Tooltip />
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
              <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold text-sm">{p.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">SKU: {p.sku}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.stock <= 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {p.stock <= 0 ? 'HABIS' : `${p.stock} UNIT`}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-[300px] flex flex-col">
          <h3 className="text-lg font-black mb-4 uppercase tracking-tight text-red-500">Masa Kadaluarsa</h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {expiringSoon.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-2xl">
                <p className="font-bold text-sm">{p.name}</p>
                <p className="text-[10px] text-red-600 font-black uppercase">{p.expiryDate}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

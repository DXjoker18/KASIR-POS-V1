
import React, { useMemo, useState, useEffect } from 'react';
import { Product, Transaction, Role, StoreSettings, CashEntry, CashType, View } from '../types';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  cashEntries: CashEntry[];
  role: Role;
  storeSettings: StoreSettings;
  onAddCashEntry: (entry: CashEntry) => void;
  setView: (view: View) => void;
}

type TimeFrame = 'Harian' | 'Mingguan' | 'Bulanan';

const Dashboard: React.FC<DashboardProps> = ({ products, transactions, cashEntries, role, storeSettings, onAddCashEntry, setView }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('Harian');
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [isQuickCashOpen, setIsQuickCashOpen] = useState(false);
  const [quickCashType, setQuickCashType] = useState<CashType>(CashType.IN);
  const [quickCashData, setQuickCashData] = useState({ category: '', amount: 0, note: '' });

  const isOwnerOrAdmin = role === Role.OWNER || role === Role.ADMIN;
  const criticalItems = useMemo(() => products.filter(p => p.stock <= 5), [products]);

  useEffect(() => {
    if (criticalItems.length > 0 && isOwnerOrAdmin) setShowCriticalAlert(true);
  }, [criticalItems.length, isOwnerOrAdmin]);

  const totalBelanja = useMemo(() => transactions.reduce((sum, trx) => sum + trx.totalAmount, 0), [transactions]);
  const modalTerjual = useMemo(() => transactions.reduce((sumTrx, trx) => sumTrx + trx.items.reduce((sumItem, item) => sumItem + ((item.costPrice || 0) * item.quantity), 0), 0), [transactions]);
  const kasMasukLain = useMemo(() => cashEntries.filter(e => e.type === CashType.IN).reduce((sum, e) => sum + e.amount, 0), [cashEntries]);
  const kasKeluarOperasional = useMemo(() => cashEntries.filter(e => e.type === CashType.OUT).reduce((sum, e) => sum + e.amount, 0), [cashEntries]);
  const saldoBersih = (totalBelanja + kasMasukLain) - (modalTerjual + kasKeluarOperasional);

  const chartData = useMemo(() => {
    const dataMap: Record<string, { masuk: number, keluar: number }> = {};
    [...transactions.map(t => ({ t: t.timestamp, type: 'SALES', amount: t.totalAmount, cost: t.items.reduce((s, i) => s + (i.costPrice * i.quantity), 0) })), 
     ...cashEntries.map(e => ({ t: e.timestamp, type: e.type, amount: e.amount, cost: 0 }))].forEach(item => {
      const date = new Date(item.t);
      let key = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      if (!dataMap[key]) dataMap[key] = { masuk: 0, keluar: 0 };
      if (item.type === 'SALES') { dataMap[key].masuk += item.amount; dataMap[key].keluar += item.cost; }
      else if (item.type === CashType.IN) dataMap[key].masuk += item.amount;
      else dataMap[key].keluar += item.amount;
    });
    return Object.entries(dataMap).map(([name, vals]) => ({ name, 'Kas Masuk': vals.masuk, 'Kas Keluar': vals.keluar })).slice(-10);
  }, [transactions, cashEntries, timeFrame]);

  return (
    <div className="space-y-6 pb-10 text-left animate-in fade-in duration-500">
      {showCriticalAlert && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-white border-l-8 border-red-500 rounded-2xl shadow-2xl p-6 w-80 relative">
            <button onClick={() => setShowCriticalAlert(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
            <h4 className="font-black text-red-600 text-sm uppercase mb-2">Stok Kritis!</h4>
            <p className="text-xs text-gray-500 mb-4">Ada {criticalItems.length} barang hampir habis.</p>
            <button onClick={() => setView('INVENTORY')} className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Cek Stok</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase">{storeSettings.name}</h2>
          <p className="text-sm text-gray-400 font-medium">Ringkasan operasional toko hari ini.</p>
        </div>
        <div className="flex gap-2">
          {role === Role.OWNER && (
            <button onClick={() => setView('SETTINGS')} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase">⚙️ Pengaturan</button>
          )}
          <div className="bg-gray-200 p-1 rounded-xl flex">
            {['Harian', 'Mingguan', 'Bulanan'].map((f) => (
              <button key={f} onClick={() => setTimeFrame(f as TimeFrame)} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg ${timeFrame === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border-b-4 border-blue-500 shadow-sm">
          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Total Penjualan</p>
          <p className="text-2xl font-black">Rp {totalBelanja.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-b-4 border-green-500 shadow-sm">
          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Kas Masuk</p>
          <p className="text-2xl font-black text-green-600">Rp {(totalBelanja + kasMasukLain).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-b-4 border-red-500 shadow-sm">
          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Kas Keluar</p>
          <p className="text-2xl font-black text-red-600">Rp {(modalTerjual + kasKeluarOperasional).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white">
        <p className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">Saldo Bersih (Estimasi Kas Tunai)</p>
        <h3 className="text-4xl font-black">Rp {saldoBersih.toLocaleString()}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-sm font-black uppercase mb-8">Grafik Kas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold' }} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} axisLine={false} />
                <Tooltip />
                <Bar dataKey="Kas Masuk" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Kas Keluar" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-sm font-black uppercase mb-6">Aksi Cepat</h3>
          <div className="space-y-3 flex-1">
             <button onClick={() => { setQuickCashType(CashType.IN); setIsQuickCashOpen(true); }} className="w-full py-4 bg-green-50 text-green-600 rounded-2xl font-black text-[10px] uppercase border border-green-100 hover:bg-green-600 hover:text-white transition-all">📥 Tambah Modal</button>
             <button onClick={() => { setQuickCashType(CashType.OUT); setIsQuickCashOpen(true); }} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all">📤 Catat Pengeluaran</button>
          </div>
        </div>
      </div>

      {isQuickCashOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl">
            <h3 className="text-xl font-black uppercase mb-6">{quickCashType === CashType.IN ? 'Dana Masuk' : 'Dana Keluar'}</h3>
            <div className="space-y-4">
              <input type="number" placeholder="Nominal Rp" className="w-full p-4 bg-gray-50 rounded-2xl font-black" onChange={e => setQuickCashData({...quickCashData, amount: parseInt(e.target.value)})} />
              <textarea placeholder="Keterangan..." rows={3} className="w-full p-4 bg-gray-50 rounded-2xl font-bold" onChange={e => setQuickCashData({...quickCashData, note: e.target.value})} />
              <div className="flex gap-3">
                <button onClick={() => { onAddCashEntry({ id: `CASH-${Date.now()}`, type: quickCashType, category: 'Lainnya', amount: quickCashData.amount, note: quickCashData.note, timestamp: new Date().toISOString(), user: role }); setIsQuickCashOpen(false); }} className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase ${quickCashType === CashType.IN ? 'bg-green-600' : 'bg-red-600'}`}>Simpan</button>
                <button onClick={() => setIsQuickCashOpen(false)} className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

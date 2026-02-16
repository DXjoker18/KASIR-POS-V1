
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
  const [showSummaryAlert, setShowSummaryAlert] = useState(false);
  const [isQuickCashOpen, setIsQuickCashOpen] = useState(false);
  const [quickCashType, setQuickCashType] = useState<CashType>(CashType.IN);
  const [quickCashData, setQuickCashData] = useState({ category: '', amount: 0, note: '' });

  const isOwnerOrAdmin = role === Role.OWNER || role === Role.ADMIN;

  // Analisis Produk Bermasalah
  const criticalItems = useMemo(() => products.filter(p => p.stock <= 5), [products]);
  const expiringItems = useMemo(() => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    
    return products.filter(p => {
      if (!p.expiryDate) return false;
      const expDate = new Date(p.expiryDate);
      return expDate <= nextMonth;
    });
  }, [products]);

  useEffect(() => {
    if ((criticalItems.length > 0 || expiringItems.length > 0) && isOwnerOrAdmin) {
      setShowSummaryAlert(true);
    }
  }, [criticalItems.length, expiringItems.length, isOwnerOrAdmin]);

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
    <div className="space-y-6 pb-20 text-left animate-in fade-in duration-500">
      {/* Smart Alert Popup */}
      {showSummaryAlert && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-white border-l-8 border-orange-500 rounded-[2rem] shadow-2xl p-6 w-80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
            <button onClick={() => setShowSummaryAlert(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-black">✕</button>
            <h4 className="font-black text-gray-900 text-sm uppercase mb-4 flex items-center gap-2"><span className="text-xl">🚨</span> Butuh Perhatian!</h4>
            <div className="space-y-3 mb-5">
              {criticalItems.length > 0 && <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">{criticalItems.length}</div><p className="text-[11px] font-bold text-gray-600 uppercase">Stok Kritis</p></div>}
              {expiringItems.length > 0 && <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">{expiringItems.length}</div><p className="text-[11px] font-bold text-gray-600 uppercase">Mendekati Expired</p></div>}
            </div>
            <button onClick={() => { setShowSummaryAlert(false); setView('INVENTORY'); }} className="w-full py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Lihat Detail Inventaris</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">{storeSettings.name}</h2>
          <p className="text-sm text-gray-400 font-medium">Laporan performa toko & kesehatan stok barang.</p>
        </div>
        <div className="flex gap-2">
          {role === Role.OWNER && (
            <button onClick={() => setView('SETTINGS')} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all hover:border-blue-500">⚙️ Pengaturan</button>
          )}
          <div className="bg-gray-200 p-1 rounded-xl flex">
            {['Harian', 'Mingguan', 'Bulanan'].map((f) => (
              <button key={f} onClick={() => setTimeFrame(f as TimeFrame)} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${timeFrame === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border-b-4 border-blue-500 shadow-sm transition-transform hover:-translate-y-1">
          <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Total Penjualan</p>
          <p className="text-2xl font-black">Rp {totalBelanja.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-b-4 border-green-500 shadow-sm transition-transform hover:-translate-y-1">
          <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Kas Masuk (Gross)</p>
          <p className="text-2xl font-black text-green-600">Rp {(totalBelanja + kasMasukLain).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-b-4 border-red-500 shadow-sm transition-transform hover:-translate-y-1">
          <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Biaya Keluar (HPP + Operasional)</p>
          <p className="text-2xl font-black text-red-600">Rp {(modalTerjual + kasKeluarOperasional).toLocaleString()}</p>
        </div>
      </div>

      {/* Main Saldo Banner */}
      <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-blue-500/20"></div>
        <p className="text-[10px] font-black uppercase opacity-40 mb-2 tracking-[0.3em]">Saldo Bersih Saat Ini</p>
        <h3 className="text-5xl font-black tracking-tighter">Rp {saldoBersih.toLocaleString()}</h3>
      </div>

      {/* Inventory Health Detailed Report Section */}
      {(criticalItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* Section: Critical Stock Details */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-red-100 shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                 ⚠️ Detail Stok Kritis ({criticalItems.length})
               </h3>
               <button onClick={() => setView('INVENTORY')} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Kelola Stok</button>
             </div>
             <div className="space-y-3 overflow-y-auto max-h-60 custom-scrollbar pr-2">
                {criticalItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl border border-red-50 transition-all hover:bg-red-50">
                    <div>
                      <p className="text-sm font-black text-gray-800 uppercase leading-none">{item.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold mt-1 tracking-widest">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600">{item.stock}</p>
                      <p className="text-[8px] font-black text-red-400 uppercase tracking-tighter">SISA UNIT</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>

           {/* Section: Expiry Details */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                 📅 Detail Barang Expired ({expiringItems.length})
               </h3>
               <button onClick={() => setView('INVENTORY')} className="text-[9px] font-black text-blue-600 uppercase hover:underline">Tarik Barang</button>
             </div>
             <div className="space-y-3 overflow-y-auto max-h-60 custom-scrollbar pr-2">
                {expiringItems.map(item => {
                  const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  return (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-orange-50/50 rounded-2xl border border-orange-50 transition-all hover:bg-orange-50">
                      <div>
                        <p className="text-sm font-black text-gray-800 uppercase leading-none">{item.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-1 tracking-widest">EXP: {new Date(item.expiryDate).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${daysLeft <= 0 ? 'text-black' : 'text-orange-600'}`}>
                          {daysLeft <= 0 ? 'SUDAH LEWAT' : `${daysLeft} HARI LAGI`}
                        </p>
                        <p className="text-[8px] font-black text-orange-400 uppercase tracking-tighter">ESTIMASI</p>
                      </div>
                    </div>
                  );
                })}
             </div>
           </div>
        </div>
      )}

      {/* Chart and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-sm font-black uppercase mb-8 tracking-widest text-gray-400">Arus Kas 10 Hari Terakhir</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Bar dataKey="Kas Masuk" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Kas Keluar" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-sm font-black uppercase mb-6 tracking-widest text-gray-400">Pencatatan Cepat</h3>
          <div className="space-y-4 flex-1">
             <button onClick={() => { setQuickCashType(CashType.IN); setIsQuickCashOpen(true); }} className="w-full py-5 bg-green-50 text-green-600 rounded-3xl font-black text-xs uppercase border-2 border-green-100 hover:bg-green-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-3">
               <span className="text-xl">➕</span> Tambah Modal / Saldo
             </button>
             <button onClick={() => { setQuickCashType(CashType.OUT); setIsQuickCashOpen(true); }} className="w-full py-5 bg-red-50 text-red-600 rounded-3xl font-black text-xs uppercase border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-3">
               <span className="text-xl">➖</span> Catat Pengeluaran Lain
             </button>
             
             <div className="mt-8 pt-8 border-t border-gray-50">
               <div className="bg-gray-50 p-6 rounded-3xl">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kesehatan Stok Keseluruhan</p>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{products.length} Barang</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-red-500 h-full" style={{ width: `${(criticalItems.length / (products.length || 1)) * 100}%` }}></div>
                    <div className="bg-orange-500 h-full" style={{ width: `${(expiringItems.length / (products.length || 1)) * 100}%` }}></div>
                    <div className="bg-green-500 h-full flex-1"></div>
                  </div>
                  <div className="flex justify-between mt-3 text-[9px] font-black uppercase text-gray-400">
                    <span className="text-red-500">{criticalItems.length} Kritis</span>
                    <span className="text-orange-500">{expiringItems.length} Expired</span>
                    <span className="text-green-500">{products.length - criticalItems.length - expiringItems.length} Aman</span>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Modal Quick Cash */}
      {isQuickCashOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black uppercase mb-6 tracking-tight">{quickCashType === CashType.IN ? '💰 Tambah Saldo Kas' : '💸 Catat Pengeluaran'}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nominal Transaksi (Rp)</label>
                <input type="number" placeholder="Contoh: 50000" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-black text-xl transition-all" onChange={e => setQuickCashData({...quickCashData, amount: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Keterangan / Keperluan</label>
                <textarea placeholder="Masukkan alasan pencatatan..." rows={3} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold resize-none transition-all" onChange={e => setQuickCashData({...quickCashData, note: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => { if(quickCashData.amount > 0) onAddCashEntry({ id: `CASH-${Date.now()}`, type: quickCashType, category: 'Aksi Cepat', amount: quickCashData.amount, note: quickCashData.note, timestamp: new Date().toISOString(), user: role }); setIsQuickCashOpen(false); }} className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${quickCashType === CashType.IN ? 'bg-green-600 shadow-green-100' : 'bg-red-600 shadow-red-100'}`}>Simpan</button>
                <button onClick={() => setIsQuickCashOpen(false)} className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase hover:bg-gray-200 transition-all">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

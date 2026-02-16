
import React, { useMemo, useState, useEffect } from 'react';
import { Product, Transaction, Role, StoreSettings, CashEntry, CashType, View } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  cashEntries: CashEntry[];
  role: Role;
  storeSettings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  onAddCashEntry: (entry: CashEntry) => void;
  setView: (view: View) => void;
}

type TimeFrame = 'Harian' | 'Mingguan' | 'Bulanan';

const Dashboard: React.FC<DashboardProps> = ({ products, transactions, cashEntries, role, storeSettings, onUpdateSettings, onAddCashEntry, setView }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('Harian');
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickCashOpen, setIsQuickCashOpen] = useState(false);
  const [quickCashType, setQuickCashType] = useState<CashType>(CashType.IN);
  const [tempSettings, setTempSettings] = useState<StoreSettings>(storeSettings);

  const [quickCashData, setQuickCashData] = useState({
    category: '',
    amount: 0,
    note: ''
  });

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

  const totalBelanja = useMemo(() => transactions.reduce((sum, trx) => sum + trx.totalAmount, 0), [transactions]);
  const modalTerjual = useMemo(() => {
    return transactions.reduce((sumTrx, trx) => {
      const trxItemsCost = trx.items.reduce((sumItem, item) => {
        return sumItem + ((item.costPrice || 0) * item.quantity);
      }, 0);
      return sumTrx + trxItemsCost;
    }, 0);
  }, [transactions]);

  const kasMasukLain = useMemo(() => 
    cashEntries.filter(e => e.type === CashType.IN).reduce((sum, e) => sum + e.amount, 0), 
    [cashEntries]
  );

  const kasKeluarOperasional = useMemo(() => 
    cashEntries.filter(e => e.type === CashType.OUT).reduce((sum, e) => sum + e.amount, 0), 
    [cashEntries]
  );

  const totalKasMasuk = totalBelanja + kasMasukLain;
  const totalKasKeluar = modalTerjual + kasKeluarOperasional;
  const saldoBersih = totalKasMasuk - totalKasKeluar;

  const chartData = useMemo(() => {
    const dataMap: Record<string, { belanja: number, masuk: number, keluar: number }> = {};
    const allData = [
      ...transactions.map(t => ({ t: t.timestamp, type: 'SALES', amount: t.totalAmount, cost: t.items.reduce((s, i) => s + (i.costPrice * i.quantity), 0) })),
      ...cashEntries.map(e => ({ t: e.timestamp, type: e.type, amount: e.amount, cost: 0 }))
    ];

    allData.forEach(item => {
      const date = new Date(item.t);
      let key = '';
      if (timeFrame === 'Harian') key = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      else if (timeFrame === 'Mingguan') key = `Mgg ${Math.ceil(date.getDate() / 7)}`;
      else if (timeFrame === 'Bulanan') key = date.toLocaleDateString('id-ID', { month: 'short' });

      if (!dataMap[key]) dataMap[key] = { belanja: 0, masuk: 0, keluar: 0 };
      if (item.type === 'SALES') {
        dataMap[key].belanja += item.amount;
        dataMap[key].masuk += item.amount;
        dataMap[key].keluar += item.cost;
      } else if (item.type === CashType.IN) dataMap[key].masuk += item.amount;
      else if (item.type === CashType.OUT) dataMap[key].keluar += item.amount;
    });

    return Object.entries(dataMap).map(([name, vals]) => ({ 
      name, 'Total Belanja': vals.belanja, 'Kas Masuk': vals.masuk, 'Kas Keluar': vals.keluar 
    })).slice(-10);
  }, [transactions, cashEntries, timeFrame]);

  const handleQuickCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCashData.amount <= 0) return alert('Jumlah harus lebih dari 0');
    if (!quickCashData.note.trim()) return alert('Keterangan harus diisi!');
    
    const entry: CashEntry = {
      id: `CASH-${Date.now()}`,
      type: quickCashType,
      category: quickCashData.category || (quickCashType === CashType.IN ? 'Modal Awal' : 'Lainnya'),
      amount: quickCashData.amount,
      note: quickCashData.note,
      timestamp: new Date().toISOString(),
      user: 'OWNER'
    };
    
    onAddCashEntry(entry);
    setIsQuickCashOpen(false);
    setQuickCashData({ category: '', amount: 0, note: '' });
    alert(`${quickCashType === CashType.IN ? 'Modal/Kas Masuk' : 'Kas Keluar'} berhasil dicatat!`);
  };

  const saveSettings = () => {
    onUpdateSettings(tempSettings);
    setIsSettingsOpen(false);
    alert('Pengaturan toko berhasil diperbarui!');
  };

  return (
    <div className="space-y-6 pb-10 relative text-left">
      {/* Critical Stock Alert */}
      {showCriticalAlert && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="bg-white border-l-8 border-red-500 rounded-2xl shadow-2xl p-6 w-80 relative overflow-hidden">
            <button onClick={() => setShowCriticalAlert(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h4 className="font-black text-red-600 text-sm uppercase tracking-tight">Stok Kritis!</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">Ada <span className="font-bold text-red-600">{criticalItems.length} barang</span> yang hampir habis.</p>
            <button onClick={() => setView('INVENTORY')} className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors">Lihat Inventaris</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black truncate uppercase tracking-tight">{storeSettings.name}</h2>
          <p className="text-sm text-gray-400 font-medium text-left">Laporan Keuangan & Ringkasan Transaksi</p>
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
              <span>⚙️</span> Toko
            </button>
          )}
          <div className="flex bg-gray-200 p-1 rounded-xl shadow-inner">
            {(['Harian', 'Mingguan', 'Bulanan'] as TimeFrame[]).map((f) => (
              <button key={f} onClick={() => setTimeFrame(f)} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${timeFrame === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-lg transition-all border-b-4 border-b-blue-500">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Belanja (Penjualan)</p>
            <span className="text-blue-500 text-xl">🛒</span>
          </div>
          <p className="text-2xl font-black text-gray-900">Rp {totalBelanja.toLocaleString()}</p>
          <p className="text-[9px] text-gray-400 font-bold mt-1">Bruto dari {transactions.length} Transaksi</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-lg transition-all border-b-4 border-b-green-500">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Kas Masuk (Total)</p>
            <span className="text-green-500 text-xl">➕</span>
          </div>
          <p className="text-2xl font-black text-green-600">Rp {totalKasMasuk.toLocaleString()}</p>
          <div className="mt-2 flex gap-2">
             <span className="text-[8px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-black">Sales: {totalBelanja.toLocaleString()}</span>
             {kasMasukLain > 0 && <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black">Lain: {kasMasukLain.toLocaleString()}</span>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-lg transition-all border-b-4 border-b-red-500">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Kas Keluar (Total)</p>
            <span className="text-red-500 text-xl">➖</span>
          </div>
          <p className="text-2xl font-black text-red-600">Rp {totalKasKeluar.toLocaleString()}</p>
          <div className="mt-2 flex gap-2">
             <span className="text-[8px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-black">Modal: {modalTerjual.toLocaleString()}</span>
             {kasKeluarOperasional > 0 && <span className="text-[8px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-black">Biaya: {kasKeluarOperasional.toLocaleString()}</span>}
          </div>
        </div>
      </div>

      {/* Saldo Bersih & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <div className="lg:col-span-8 bg-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Sisa Saldo Kas (Laba Bersih)</p>
            <h3 className="text-4xl font-black">Rp {saldoBersih.toLocaleString()}</h3>
            <p className="text-xs font-medium mt-3 opacity-80 italic max-w-lg">Estimasi dana tunai yang tersedia setelah dikurangi Modal (HPP) dan seluruh Pengeluaran Operasional toko.</p>
         </div>

         <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between gap-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Aksi Cepat Keuangan</h4>
            <button 
              onClick={() => {
                setQuickCashType(CashType.IN);
                setIsQuickCashOpen(true);
              }}
              className="w-full py-3.5 bg-green-50 text-green-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all border border-green-100 flex items-center justify-center gap-2"
            >
              <span>📥</span> Tambah Modal / Kas Masuk
            </button>
            <button 
              onClick={() => {
                setQuickCashType(CashType.OUT);
                setIsQuickCashOpen(true);
              }}
              className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100 flex items-center justify-center gap-2"
            >
              <span>📤</span> Catat Kas Keluar
            </button>
         </div>
      </div>

      {/* Charts & Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-black uppercase tracking-tight">Analisis Aliran Dana</h3>
            <div className="flex gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                <Bar dataKey="Kas Masuk" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={15} />
                <Bar dataKey="Kas Keluar" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black uppercase tracking-tight">Peringatan Stok</h3>
            <span className="bg-red-100 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">{criticalItems.length} KRITIS</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {criticalItems.map(p => (
              <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-red-100 transition-all">
                <div>
                  <p className="font-bold text-sm text-gray-800">{p.name}</p>
                  <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest mt-1">SKU: {p.sku}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.stock <= 0 ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                    {p.stock <= 0 ? 'HABIS' : `${p.stock} UNIT`}
                  </span>
                </div>
              </div>
            ))}
            {criticalItems.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <span className="text-4xl mb-2">✅</span>
                  <p className="text-xs font-bold uppercase tracking-widest">Stok Aman</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Cash Entry Modal */}
      {isQuickCashOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 text-left no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 animate-in fade-in zoom-in duration-300 shadow-2xl text-gray-800">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
              {quickCashType === CashType.IN ? 'Tambah Modal' : 'Catat Pengeluaran'}
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Informasi Arus Kas Langsung</p>
            
            <form onSubmit={handleQuickCashSubmit} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
                 <select 
                   required
                   className="w-full p-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                   value={quickCashData.category}
                   onChange={e => setQuickCashData({...quickCashData, category: e.target.value})}
                 >
                   <option value="">Pilih Kategori</option>
                   {quickCashType === CashType.IN ? (
                     <>
                        <option value="Modal Awal">Modal Awal Toko</option>
                        <option value="Piutang Cair">Piutang Cair</option>
                        <option value="Dana Darurat">Dana Darurat</option>
                        <option value="Lainnya">Lainnya</option>
                     </>
                   ) : (
                     <>
                        <option value="Listrik & Air">Listrik & Air</option>
                        <option value="Sewa Tempat">Sewa Tempat</option>
                        <option value="Gaji Staff">Gaji Staff</option>
                        <option value="Beli Perlengkapan">Beli Perlengkapan</option>
                        <option value="Lainnya">Lainnya</option>
                     </>
                   )}
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jumlah Nominal (Rp)</label>
                 <input 
                   required
                   type="number"
                   className={`w-full p-4 rounded-2xl focus:outline-none focus:ring-2 font-black text-2xl ${quickCashType === CashType.IN ? 'bg-green-50 text-green-600 focus:ring-green-500' : 'bg-red-50 text-red-600 focus:ring-red-500'}`}
                   placeholder="0"
                   value={quickCashData.amount || ''}
                   onChange={e => setQuickCashData({...quickCashData, amount: parseInt(e.target.value) || 0})}
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Keterangan / Deskripsi</label>
                 <textarea 
                   required
                   rows={3}
                   className="w-full p-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold resize-none"
                   placeholder="Contoh: Tambah modal untuk stok beras lebaran..."
                   value={quickCashData.note}
                   onChange={e => setQuickCashData({...quickCashData, note: e.target.value})}
                 />
               </div>

               <div className="flex gap-3 pt-4">
                  <button type="submit" className={`flex-1 py-5 rounded-2xl font-black text-sm uppercase transition-all shadow-xl active:scale-95 text-white ${quickCashType === CashType.IN ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}`}>
                    Simpan Data
                  </button>
                  <button type="button" onClick={() => setIsQuickCashOpen(false)} className="px-8 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm uppercase hover:bg-gray-200 transition-all">
                    Batal
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal (Simplified) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 text-left no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 animate-in fade-in zoom-in duration-300 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar text-gray-800">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tight">Profil Toko</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Toko</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold"
                  value={tempSettings.name}
                  onChange={e => setTempSettings({...tempSettings, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                <textarea 
                  rows={2}
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold resize-none"
                  value={tempSettings.address}
                  onChange={e => setTempSettings({...tempSettings, address: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={saveSettings} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95">SIMPAN</button>
                <button onClick={() => setIsSettingsOpen(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">BATAL</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

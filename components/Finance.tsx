
import React, { useState, useMemo } from 'react';
import { CashEntry, CashType, User, Transaction, StoreSettings } from '../types';

interface FinanceProps {
  cashEntries: CashEntry[];
  transactions: Transaction[];
  storeSettings: StoreSettings;
  onAddEntry: (entry: CashEntry) => void;
  onDeleteEntry: (id: string) => void;
  currentUser: User;
}

type FinanceTab = 'MUTASI' | 'LABA_RUGI';
type TimeFrame = 'Harian' | 'Mingguan' | 'Bulanan';

const Finance: React.FC<FinanceProps> = ({ cashEntries, transactions, storeSettings, onAddEntry, onDeleteEntry, currentUser }) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('MUTASI');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('Harian');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: CashType.OUT,
    category: '',
    amount: 0,
    note: ''
  });

  const categories = {
    [CashType.OUT]: ['Listrik & Air', 'Sewa Tempat', 'Gaji Staff', 'Maintenance', 'Pajak', 'Beli Perlengkapan', 'Lainnya'],
    [CashType.IN]: ['Modal Awal Toko', 'Piutang Cair', 'Bonus Supplier', 'Dana Darurat', 'Lainnya']
  };

  // Helper to check if date is within timeframe
  const isWithinTimeFrame = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (timeFrame === 'Harian') return diffDays <= 1;
    if (timeFrame === 'Mingguan') return diffDays <= 7;
    if (timeFrame === 'Bulanan') return diffDays <= 30;
    return true;
  };

  const filteredTransactions = useMemo(() => transactions.filter(tx => isWithinTimeFrame(tx.timestamp)), [transactions, timeFrame]);
  const filteredCashEntries = useMemo(() => cashEntries.filter(ce => isWithinTimeFrame(ce.timestamp)), [cashEntries, timeFrame]);

  // P&L Calculations
  const plData = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, tx) => sum + (tx.totalAmount - (tx.taxAmount || 0)), 0);
    const totalHPP = filteredTransactions.reduce((sumTrx, tx) => 
      sumTrx + tx.items.reduce((sumItem, item) => sumItem + ((item.costPrice || 0) * item.quantity), 0), 0
    );
    const otherIncome = filteredCashEntries.filter(e => e.type === CashType.IN).reduce((sum, e) => sum + e.amount, 0);
    const operationalExpenses = filteredCashEntries.filter(e => e.type === CashType.OUT).reduce((sum, e) => sum + e.amount, 0);
    
    const grossProfit = totalSales - totalHPP;
    const netProfit = grossProfit + otherIncome - operationalExpenses;

    return { totalSales, totalHPP, grossProfit, otherIncome, operationalExpenses, netProfit };
  }, [filteredTransactions, filteredCashEntries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return alert('Jumlah harus lebih dari 0');
    if (!formData.note.trim()) return alert('Keterangan wajib diisi!');
    
    const newEntry: CashEntry = {
      id: `CASH-${Date.now()}`,
      ...formData,
      timestamp: new Date().toISOString(),
      user: currentUser.fullName
    };
    
    onAddEntry(newEntry);
    setIsFormOpen(false);
    setFormData({ type: CashType.OUT, category: '', amount: 0, note: '' });
  };

  return (
    <div className="space-y-6 text-left pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">Keuangan & Profitabilitas</h2>
          <p className="text-sm text-gray-400 font-medium">Pantau arus kas dan analisis laba rugi secara akurat.</p>
        </div>
        <div className="flex bg-gray-200 p-1 rounded-2xl">
          {(['MUTASI', 'LABA_RUGI'] as FinanceTab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'LABA_RUGI' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
             <span className="text-xs font-black uppercase tracking-widest text-gray-400 ml-4">Periode Laporan</span>
             <div className="flex gap-2">
                {(['Harian', 'Mingguan', 'Bulanan'] as TimeFrame[]).map(tf => (
                  <button 
                    key={tf}
                    onClick={() => setTimeFrame(tf)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${timeFrame === tf ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    {tf}
                  </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-white p-6 rounded-[2rem] border-b-4 border-blue-500 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pendapatan Bersih</p>
                <p className="text-xl font-black text-gray-900">{storeSettings.currencySymbol} {plData.totalSales.toLocaleString()}</p>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border-b-4 border-orange-500 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total HPP</p>
                <p className="text-xl font-black text-gray-900">{storeSettings.currencySymbol} {plData.totalHPP.toLocaleString()}</p>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border-b-4 border-green-500 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pemasukan Lain</p>
                <p className="text-xl font-black text-green-600">+{storeSettings.currencySymbol} {plData.otherIncome.toLocaleString()}</p>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border-b-4 border-red-500 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Biaya Operasional</p>
                <p className="text-xl font-black text-red-600">-{storeSettings.currencySymbol} {plData.operationalExpenses.toLocaleString()}</p>
             </div>
          </div>

          <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
             <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 relative z-10">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">Estimasi Laba Bersih ({timeFrame})</p>
                   <h3 className={`text-5xl font-black tracking-tighter ${plData.netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                     {storeSettings.currencySymbol} {plData.netProfit.toLocaleString()}
                   </h3>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase opacity-40 mb-1">Margin Keuntungan</p>
                   <p className="text-2xl font-black text-blue-400">
                     {plData.totalSales > 0 ? ((plData.netProfit / plData.totalSales) * 100).toFixed(1) : '0'}%
                   </p>
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
             <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 border-b pb-4">Rincian Laba Rugi</h3>
             <div className="space-y-4 font-bold text-gray-800">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                   <span className="text-xs uppercase">1. Pendapatan Penjualan (Net)</span>
                   <span>{storeSettings.currencySymbol} {plData.totalSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50 text-orange-600">
                   <span className="text-xs uppercase">2. Harga Pokok Penjualan (HPP)</span>
                   <span>({storeSettings.currencySymbol} {plData.totalHPP.toLocaleString()})</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-gray-50 px-4 rounded-xl font-black text-blue-600">
                   <span className="text-xs uppercase">LABA KOTOR (1 - 2)</span>
                   <span>{storeSettings.currencySymbol} {plData.grossProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50 text-green-600">
                   <span className="text-xs uppercase">3. Pendapatan Non-Operasional</span>
                   <span>+{storeSettings.currencySymbol} {plData.otherIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50 text-red-500">
                   <span className="text-xs uppercase">4. Beban / Pengeluaran Lainnya</span>
                   <span>({storeSettings.currencySymbol} {plData.operationalExpenses.toLocaleString()})</span>
                </div>
                <div className="flex justify-between items-center py-5 border-t-4 border-gray-900 mt-6 text-xl font-black">
                   <span className="uppercase">LABA BERSIH AKHIR</span>
                   <span className={plData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                     {storeSettings.currencySymbol} {plData.netProfit.toLocaleString()}
                   </span>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'MUTASI' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex bg-gray-200 p-1 rounded-2xl">
                {(['Harian', 'Mingguan', 'Bulanan'] as TimeFrame[]).map(tf => (
                  <button 
                    key={tf}
                    onClick={() => setTimeFrame(tf)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${timeFrame === tf ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tf}
                  </button>
                ))}
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              + CATAT MUTASI DANA
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                    <th className="p-6">Waktu & Tipe</th>
                    <th className="p-6">Kategori</th>
                    <th className="p-6">Nominal</th>
                    <th className="p-6">Keterangan Transaksi</th>
                    <th className="p-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-800">
                  {filteredCashEntries.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-6">
                        <p className="text-[10px] font-black text-gray-400 mb-1">
                          {new Date(e.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-tight ${e.type === CashType.IN ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="p-6 font-black text-xs uppercase tracking-tight">{e.category}</td>
                      <td className={`p-6 font-black text-sm ${e.type === CashType.IN ? 'text-green-600' : 'text-red-600'}`}>
                        {e.type === CashType.IN ? '+' : '-'} {storeSettings.currencySymbol} {e.amount.toLocaleString()}
                      </td>
                      <td className="p-6">
                        <p className="text-xs text-gray-600 font-bold leading-relaxed max-w-xs">{e.note}</p>
                        <p className="text-[8px] text-gray-400 mt-1 uppercase font-black">Dicatat oleh: {e.user}</p>
                      </td>
                      <td className="p-6 text-right">
                        <button onClick={() => onDeleteEntry(e.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center mx-auto lg:ml-auto">✕</button>
                      </td>
                    </tr>
                  ))}
                  {filteredCashEntries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-20 text-center">
                        <div className="flex flex-col items-center opacity-20">
                          <span className="text-6xl mb-4">🏦</span>
                          <p className="font-black uppercase tracking-widest text-xs text-gray-400">Tidak ada mutasi dana pada periode ini</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in duration-300 shadow-2xl text-gray-800">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Pencatatan Arus Kas</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: CashType.OUT, category: ''})}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.type === CashType.OUT ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Kas Keluar
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: CashType.IN, category: ''})}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.type === CashType.IN ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Kas Masuk / Modal
                </button>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Kategori</label>
                <select 
                  required
                  className="w-full p-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold border-2 border-transparent"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories[formData.type].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jumlah Nominal ({storeSettings.currencySymbol})</label>
                <input 
                  required
                  type="number"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl focus:outline-none font-black text-xl transition-all"
                  placeholder="0"
                  value={formData.amount || ''}
                  onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Keterangan Lengkap</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl focus:outline-none font-bold resize-none transition-all"
                  placeholder="Berikan alasan atau detail mutasi dana..."
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">SIMPAN DATA</button>
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">BATAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;


import React, { useState } from 'react';
import { CashEntry, CashType, User } from '../types';

interface FinanceProps {
  cashEntries: CashEntry[];
  onAddEntry: (entry: CashEntry) => void;
  onDeleteEntry: (id: string) => void;
  currentUser: User;
}

const Finance: React.FC<FinanceProps> = ({ cashEntries, onAddEntry, onDeleteEntry, currentUser }) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return alert('Jumlah harus lebih dari 0');
    if (!formData.note.trim()) return alert('Keterangan / Alasan transaksi wajib diisi!');
    
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
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black">Laporan Arus Kas</h2>
          <p className="text-sm text-gray-400 font-medium text-left">Detail mutasi dana operasional dan penambahan modal toko.</p>
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
              {cashEntries.map((e) => (
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
                    {e.type === CashType.IN ? '+' : '-'} Rp {e.amount.toLocaleString()}
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
              {cashEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <span className="text-6xl mb-4">🏦</span>
                      <p className="font-black uppercase tracking-widest text-xs text-gray-400">Belum ada mutasi dana hari ini</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 animate-in fade-in zoom-in duration-300 shadow-2xl text-gray-800">
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
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jumlah Nominal (Rp)</label>
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

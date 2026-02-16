
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';

interface CustomerManagementProps {
  customers: Customer[];
  onAdd: (customer: Customer) => void;
  onUpdate: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingCard, setViewingCard] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    cardNumber: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) ||
    c.cardNumber.includes(searchTerm)
  );

  const generateCardNumber = () => {
    const random = Math.floor(1000000000 + Math.random() * 9000000000);
    setFormData(prev => ({ ...prev, cardNumber: random.toString() }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      onUpdate({ ...editingCustomer, ...formData } as Customer);
    } else {
      const newCustomer: Customer = {
        id: `CUST-${Date.now()}`,
        name: formData.name || '',
        phone: formData.phone || '',
        email: formData.email,
        address: formData.address || '',
        cardNumber: formData.cardNumber || `MBR${Date.now()}`,
        joinDate: new Date().toISOString().split('T')[0],
        points: 0,
        ...formData
      };
      onAdd(newCustomer);
    }
    resetForm();
  };

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData(c);
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '', cardNumber: '' });
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black">Manajemen Pelanggan</h2>
          <p className="text-sm text-gray-400 font-medium">Kelola database member dan kartu pelanggan setia.</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
              <input 
                type="text" 
                placeholder="Cari Member..."
                className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
           </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            + DAFTAR MEMBER BARU
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                <th className="p-6">Pelanggan</th>
                <th className="p-6">No. Member</th>
                <th className="p-6">Kontak</th>
                <th className="p-6">Total Poin</th>
                <th className="p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-800">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-sm text-gray-800 uppercase">{c.name}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gabung: {c.joinDate}</p>
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] font-mono font-black bg-gray-100 px-3 py-1 rounded-lg text-gray-600">
                      {c.cardNumber}
                    </span>
                  </td>
                  <td className="p-6">
                    <p className="text-xs font-bold text-gray-600">{c.phone}</p>
                    <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{c.email || '-'}</p>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{c.points} PT</span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setViewingCard(c)} className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm" title="Lihat Kartu Member">💳</button>
                       <button onClick={() => handleEdit(c)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">✏️</button>
                       <button onClick={() => onDelete(c.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <span className="text-6xl mb-4">💎</span>
                      <p className="font-black uppercase tracking-widest text-xs text-gray-400">Belum ada pelanggan terdaftar</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[130] p-4 text-left">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 animate-in fade-in zoom-in shadow-2xl text-gray-800">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Data Pelanggan</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input required className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Handphone</label>
                       <input required className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Kartu Member</label>
                       <div className="relative">
                          <input required className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 font-mono font-black" value={formData.cardNumber} onChange={e => setFormData({...formData, cardNumber: e.target.value})} />
                          <button type="button" onClick={generateCardNumber} className="absolute right-2 top-2 p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-xs font-black">ACAK</button>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                    <input type="email" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat</label>
                    <textarea rows={2} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 font-bold resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">SIMPAN DATA</button>
                    <button type="button" onClick={resetForm} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm uppercase transition-all">BATAL</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Customer Card Preview Modal */}
      {viewingCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[130] p-4 text-left no-print">
           <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center animate-in zoom-in duration-300">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-8">Kartu Pelanggan Setia</h4>
              
              {/* Card Container */}
              <div className="w-[85.6mm] h-[54mm] bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white mb-8 border border-white/20">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                 <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full -ml-20 -mb-20 blur-2xl"></div>
                 
                 <div className="flex justify-between items-start relative z-10">
                    <div>
                       <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Smart Member Card</p>
                       <h5 className="text-sm font-black uppercase tracking-tighter mt-1">KASIR PINTAR POS</h5>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 flex items-center justify-center">💎</div>
                 </div>
                 
                 <div className="mt-8 relative z-10">
                    <p className="text-[18px] font-mono tracking-[0.3em] font-black">{viewingCard.cardNumber}</p>
                    <p className="text-[10px] font-black uppercase mt-1 tracking-widest">{viewingCard.name}</p>
                 </div>
                 
                 <div className="absolute bottom-6 right-6 flex flex-col items-end opacity-90">
                    <div className="barcode-font text-[35px] leading-none text-white">*{viewingCard.cardNumber}*</div>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                 <button onClick={() => window.print()} className="py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">CETAK KARTU</button>
                 <button onClick={() => setViewingCard(null)} className="py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase transition-all">TUTUP</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;

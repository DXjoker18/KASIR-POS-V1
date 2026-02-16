
import React, { useState, useMemo } from 'react';
import { Product } from '../types';

interface InventoryProps {
  products: Product[];
  onAdd: (product: Product) => void;
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

type InventoryFilter = 'ALL' | 'CRITICAL' | 'EXPIRING';

const Inventory: React.FC<InventoryProps> = ({ products, onAdd, onUpdate, onDelete, canEdit }) => {
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>('ALL');
  const [isEditing, setIsEditing] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [quickAdjProduct, setQuickAdjProduct] = useState<Product | null>(null);
  const [adjAmount, setAdjAmount] = useState<number>(0);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    costPrice: 0,
    price: 0,
    stock: 0,
    category: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    defaultDiscountPercent: 0
  });

  const categories = ['Makanan', 'Minuman', 'Kebutuhan Rumah', 'Elektronik', 'Kesehatan', 'Lainnya'];

  const getStatus = (p: Product) => {
    const today = new Date();
    const expDate = p.expiryDate ? new Date(p.expiryDate) : null;
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const isExpired = expDate && expDate <= today;
    const isExpiringSoon = expDate && expDate > today && expDate <= nextMonth;
    const isLowStock = p.stock <= 5;

    if (isExpired) return { label: 'Kadaluarsa', color: 'bg-black text-white', status: 'EXPIRING' };
    if (isExpiringSoon) return { label: 'Hampir Exp', color: 'bg-orange-500 text-white', status: 'EXPIRING' };
    if (isLowStock) return { label: 'Stok Kritis', color: 'bg-red-500 text-white', status: 'CRITICAL' };
    return { label: 'Aman', color: 'bg-green-100 text-green-700', status: 'ALL' };
  };

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'ALL') return products;
    return products.filter(p => {
      const statusInfo = getStatus(p);
      return statusInfo.status === activeFilter;
    });
  }, [products, activeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProduct.id) {
      onUpdate(currentProduct as Product);
    } else {
      onAdd({
        ...currentProduct as Product,
        id: `PROD-${Date.now()}`,
        defaultDiscountPercent: currentProduct.defaultDiscountPercent || 0
      });
    }
    resetForm();
  };

  const handleQuickAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdjProduct) return;

    const newStock = quickAdjProduct.stock + adjAmount;
    if (newStock < 0) {
      alert("Stok tidak boleh kurang dari 0!");
      return;
    }

    onUpdate({
      ...quickAdjProduct,
      stock: newStock
    });
    setQuickAdjProduct(null);
    setAdjAmount(0);
  };

  const resetForm = () => {
    setCurrentProduct({
      name: '',
      sku: '',
      costPrice: 0,
      price: 0,
      stock: 0,
      category: '',
      arrivalDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      defaultDiscountPercent: 0
    });
    setIsEditing(false);
  };

  const handleEdit = (p: Product) => {
    setCurrentProduct(p);
    setIsEditing(true);
    setViewingProduct(null);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      onDelete(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  return (
    <div className="space-y-6 text-left pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Manajemen Inventaris</h2>
          <p className="text-sm text-gray-400 font-medium">Audit stok, deteksi kadaluarsa, dan update harga.</p>
        </div>
        {!isEditing && canEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            + Daftarkan Barang
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      {!isEditing && (
        <div className="flex bg-gray-200 p-1 rounded-2xl w-fit">
          {[
            { id: 'ALL', label: 'Semua Barang' },
            { id: 'CRITICAL', label: 'Stok Kritis' },
            { id: 'EXPIRING', label: 'Kadaluarsa / Hampir Exp' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as InventoryFilter)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilter === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black mb-6 uppercase tracking-tight text-left text-gray-900 border-b pb-4">
            {currentProduct.id ? '🛠️ Edit Informasi Barang' : '📦 Input Barang Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Produk / Barang</label>
              <input required type="text" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:outline-none font-bold transition-all" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU / Kode Barcode</label>
              <input required type="text" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:outline-none font-bold transition-all" value={currentProduct.sku} onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
              <select required className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:outline-none font-bold transition-all" value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}>
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Harga Modal (Rp)</label>
              <input required type="number" className="w-full p-4 bg-blue-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:outline-none font-black transition-all" value={currentProduct.costPrice || ''} onChange={e => setCurrentProduct({...currentProduct, costPrice: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">Harga Jual (Rp)</label>
              <input required type="number" className="w-full p-4 bg-green-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:outline-none font-black transition-all" value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Diskon Produk (%)</label>
              <input type="number" max="100" min="0" className="w-full p-4 bg-red-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:outline-none font-black transition-all" value={currentProduct.defaultDiscountPercent || ''} onChange={e => setCurrentProduct({...currentProduct, defaultDiscountPercent: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jumlah Stok Awal</label>
              <input required type="number" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:outline-none font-black transition-all" value={currentProduct.stock || ''} onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Masuk</label>
              <input required type="date" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:outline-none font-bold transition-all" value={currentProduct.arrivalDate} onChange={e => setCurrentProduct({...currentProduct, arrivalDate: e.target.value})} />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Tanggal Kadaluarsa</label>
              <input type="date" className="w-full p-4 bg-orange-50 border-2 border-transparent focus:border-orange-500 rounded-2xl focus:outline-none font-bold transition-all" value={currentProduct.expiryDate} onChange={e => setCurrentProduct({...currentProduct, expiryDate: e.target.value})} />
            </div>
            <div className="col-span-full flex space-x-3 pt-8 border-t border-gray-50">
              <button type="submit" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">Simpan Data</button>
              <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-500 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Batalkan</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden text-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                <th className="p-6">Informasi Barang</th>
                <th className="p-6">Status & Stok</th>
                <th className="p-6">Harga Satuan</th>
                <th className="p-6">Kadaluarsa</th>
                <th className="p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => {
                const status = getStatus(p);
                return (
                  <tr key={p.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <p className="font-black text-sm text-gray-800 uppercase group-hover:text-blue-600 transition-colors">{p.name}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">SKU: {p.sku}</span>
                          <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tight">| {p.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-2">
                        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-tight self-start ${status.color}`}>
                          {status.label}
                        </span>
                        <div className="flex items-center gap-3">
                           <span className={`font-black text-lg ${p.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>{p.stock}</span>
                           {canEdit && (
                             <button 
                               onClick={() => {
                                 setQuickAdjProduct(p);
                                 setAdjAmount(0);
                               }} 
                               className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-sm font-black shadow-sm"
                               title="Update Stok"
                             >
                               +
                             </button>
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="font-black text-sm text-blue-600">Rp {p.price.toLocaleString()}</p>
                      {p.defaultDiscountPercent > 0 && (
                        <p className="text-[9px] text-red-500 font-black uppercase">Diskon: {p.defaultDiscountPercent}%</p>
                      )}
                    </td>
                    <td className="p-6">
                      {p.expiryDate ? (
                        <div className="flex flex-col">
                           <p className={`text-xs font-black ${new Date(p.expiryDate) <= new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                             {new Date(p.expiryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                           </p>
                           <p className="text-[9px] text-gray-400 font-bold uppercase">Tgl Exp</p>
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest">Tidak Ada</span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <button onClick={() => setViewingProduct(p)} className="p-3 bg-gray-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Lihat Detail">🔍</button>
                        {canEdit && (
                          <>
                            <button onClick={() => handleEdit(p)} className="p-3 bg-gray-50 text-orange-500 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm" title="Edit Barang">✏️</button>
                            <button onClick={() => setDeletingProduct(p)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Hapus Barang">🗑️</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center opacity-30 italic font-black text-xs uppercase tracking-[0.5em]">
                    {activeFilter === 'ALL' ? 'Belum ada data barang terdaftar' : 'Tidak ada barang bermasalah di kategori ini'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Delete Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 text-gray-800">
          <div className="bg-white rounded-[2.5rem] w-full max-sm p-10 animate-in fade-in zoom-in duration-200 shadow-2xl text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">🗑️</div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Hapus Produk?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">
              Anda akan menghapus <span className="font-black text-gray-900 uppercase">"{deletingProduct.name}"</span>. Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={confirmDelete} className="py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all active:scale-95">Hapus</button>
              <button onClick={() => setDeletingProduct(null)} className="py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Adjustment Modal */}
      {quickAdjProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 animate-in fade-in zoom-in duration-300 shadow-2xl text-gray-800">
            <h3 className="text-xl font-black mb-1 uppercase tracking-tight text-center text-gray-900">Update Stok Cepat</h3>
            <p className="text-[10px] text-center text-blue-600 font-black uppercase tracking-widest mb-8">{quickAdjProduct.name}</p>
            <form onSubmit={handleQuickAdjustment} className="space-y-8 text-center">
              <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200">
                <div className="flex justify-between items-center mb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                  <span>Stok Lama</span>
                  <span>Prediksi Baru</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-2xl font-black text-gray-400">{quickAdjProduct.stock}</span>
                  <span className="text-3xl text-blue-200">→</span>
                  <span className={`text-3xl font-black ${quickAdjProduct.stock + adjAmount < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                    {quickAdjProduct.stock + adjAmount}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-left ml-2">Jumlah Perubahan (+/-)</label>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-3xl">
                  <button type="button" onClick={() => setAdjAmount(prev => prev - 1)} className="w-14 h-14 rounded-2xl bg-white shadow-sm text-gray-600 font-black text-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90">-</button>
                  <input autoFocus type="number" className="flex-1 bg-transparent border-none focus:ring-0 font-black text-center text-3xl" value={adjAmount} onChange={(e) => setAdjAmount(parseInt(e.target.value) || 0)} />
                  <button type="button" onClick={() => setAdjAmount(prev => prev + 1)} className="w-14 h-14 rounded-2xl bg-white shadow-sm text-blue-600 font-black text-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-90">+</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button type="submit" className="py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">Simpan Stok</button>
                <button type="button" onClick={() => setQuickAdjProduct(null)} className="py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

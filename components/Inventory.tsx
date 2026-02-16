
import React, { useState } from 'react';
import { Product } from '../types';

interface InventoryProps {
  products: Product[];
  onAdd: (product: Product) => void;
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

const Inventory: React.FC<InventoryProps> = ({ products, onAdd, onUpdate, onDelete, canEdit }) => {
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
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Inventaris Barang</h2>
          <p className="text-sm text-gray-400 font-medium">Manajemen stok dan harga barang toko.</p>
        </div>
        {!isEditing && canEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            + Tambah Barang Baru
          </button>
        )}
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black mb-6 uppercase tracking-tight text-left">{currentProduct.id ? 'Edit Barang' : 'Input Barang Baru'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Barang</label>
              <input required type="text" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SKU / Barcode</label>
              <input required type="text" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.sku} onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
              <select required className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}>
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-blue-600">Harga Beli</label>
              <input required type="number" className="w-full p-3 bg-blue-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.costPrice || ''} onChange={e => setCurrentProduct({...currentProduct, costPrice: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-green-600">Harga Jual</label>
              <input required type="number" className="w-full p-3 bg-green-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-red-500">Diskon (%)</label>
              <input type="number" max="100" min="0" className="w-full p-3 bg-red-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.defaultDiscountPercent || ''} onChange={e => setCurrentProduct({...currentProduct, defaultDiscountPercent: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stok</label>
              <input required type="number" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.stock || ''} onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tgl Datang</label>
              <input required type="date" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.arrivalDate} onChange={e => setCurrentProduct({...currentProduct, arrivalDate: e.target.value})} />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tgl Kadaluarsa</label>
              <input type="date" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.expiryDate} onChange={e => setCurrentProduct({...currentProduct, expiryDate: e.target.value})} />
            </div>
            <div className="col-span-full flex space-x-3 pt-6">
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">Simpan Barang</button>
              <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-500 px-8 py-3 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                <th className="p-6">Barang</th>
                <th className="p-6">Kategori</th>
                <th className="p-6">Stok</th>
                <th className="p-6">Harga Jual</th>
                <th className="p-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    <button onClick={() => setViewingProduct(p)} className="text-left group">
                      <p className="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">SKU: {p.sku}</p>
                    </button>
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-black uppercase">{p.category}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                       <span className={`font-black text-sm ${p.stock <= 5 ? 'text-red-500' : 'text-gray-800'}`}>{p.stock}</span>
                       {canEdit && (
                         <button 
                           onClick={() => {
                             setQuickAdjProduct(p);
                             setAdjAmount(0);
                           }} 
                           className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-[10px]"
                           title="Update Stok Cepat"
                         >
                           ➕
                         </button>
                       )}
                    </div>
                  </td>
                  <td className="p-6 font-black text-sm text-blue-600">Rp {p.price.toLocaleString()}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setViewingProduct(p)} className="text-blue-500 hover:text-blue-700 font-black text-[10px] uppercase tracking-widest transition-colors">Detail</button>
                      {canEdit && (
                        <>
                          <button onClick={() => {
                            setQuickAdjProduct(p);
                            setAdjAmount(0);
                          }} className="text-green-500 hover:text-green-700 font-black text-[10px] uppercase tracking-widest transition-colors">Stok</button>
                          <button onClick={() => handleEdit(p)} className="text-orange-500 hover:text-orange-700 font-black text-[10px] uppercase tracking-widest transition-colors">Edit</button>
                          <button onClick={() => setDeletingProduct(p)} className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest transition-colors">Hapus</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-300 font-bold italic uppercase tracking-widest text-xs">Belum ada barang di inventaris</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Delete Modal (Inventory) */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 text-gray-800">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 animate-in fade-in zoom-in duration-200 shadow-2xl text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">⚠️</div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase">Hapus Barang?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Anda akan menghapus barang <span className="font-bold text-gray-900">"{deletingProduct.name}"</span> secara permanen. Pastikan tidak ada stok tersisa sebelum melakukan penghapusan.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={confirmDelete}
                className="py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all active:scale-95"
              >
                Hapus
              </button>
              <button 
                onClick={() => setDeletingProduct(null)}
                className="py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Modals (Keep Existing) */}
      {quickAdjProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 animate-in fade-in zoom-in duration-300 shadow-2xl text-gray-800">
            <h3 className="text-lg font-black mb-1 uppercase tracking-tight text-center">Update Stok Cepat</h3>
            <p className="text-xs text-center text-gray-400 font-bold mb-6 uppercase tracking-widest">{quickAdjProduct.name}</p>
            <form onSubmit={handleQuickAdjustment} className="space-y-6 text-center">
              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <div className="flex justify-between items-center mb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                  <span>Stok Saat Ini</span>
                  <span>Stok Akhir</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-2xl font-black text-gray-400">{quickAdjProduct.stock}</span>
                  <span className="text-4xl text-blue-100">→</span>
                  <span className={`text-2xl font-black ${quickAdjProduct.stock + adjAmount < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                    {quickAdjProduct.stock + adjAmount}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Jumlah Perubahan (+/-)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setAdjAmount(prev => prev - 1)} className="w-12 h-12 rounded-xl bg-gray-100 text-gray-600 font-black text-xl hover:bg-gray-200 transition-all active:scale-90">-</button>
                  <input autoFocus type="number" className="flex-1 p-4 bg-blue-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:outline-none font-black text-center text-xl" value={adjAmount} onChange={(e) => setAdjAmount(parseInt(e.target.value) || 0)} />
                  <button type="button" onClick={() => setAdjAmount(prev => prev + 1)} className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl hover:bg-blue-700 transition-all active:scale-90">+</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="submit" className="py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">Simpan</button>
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

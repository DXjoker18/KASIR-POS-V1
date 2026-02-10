
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Inventaris Barang</h2>
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
          <h3 className="text-lg font-black mb-6 uppercase tracking-tight">{currentProduct.id ? 'Edit Barang' : 'Input Barang Baru'}</h3>
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
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-blue-600">Harga Beli</label>
              <input required type="number" className="w-full p-3 bg-blue-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.costPrice || ''} onChange={e => setCurrentProduct({...currentProduct, costPrice: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-green-600">Harga Jual</label>
              <input required type="number" className="w-full p-3 bg-green-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-red-500">Diskon (%)</label>
              <input type="number" max="100" min="0" className="w-full p-3 bg-red-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.defaultDiscountPercent || ''} onChange={e => setCurrentProduct({...currentProduct, defaultDiscountPercent: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stok</label>
              <input required type="number" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.stock || ''} onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tgl Datang</label>
              <input required type="date" className="w-full p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentProduct.arrivalDate} onChange={e => setCurrentProduct({...currentProduct, arrivalDate: e.target.value})} />
            </div>
            <div className="space-y-2">
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
                    <button onClick={() => setViewingProduct(p)} className="text-left">
                      <p className="font-bold text-sm text-gray-800">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">SKU: {p.sku}</p>
                    </button>
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-black uppercase">{p.category}</span>
                  </td>
                  <td className="p-6">
                    <span className={`font-black text-sm ${p.stock <= 5 ? 'text-red-500' : 'text-gray-800'}`}>{p.stock}</span>
                  </td>
                  <td className="p-6 font-black text-sm text-blue-600">Rp {p.price.toLocaleString()}</td>
                  <td className="p-6 space-x-4">
                    <button onClick={() => setViewingProduct(p)} className="text-blue-500 hover:text-blue-700 font-black text-[10px] uppercase tracking-widest">Detail</button>
                    {canEdit && (
                      <>
                        <button onClick={() => handleEdit(p)} className="text-orange-500 hover:text-orange-700 font-black text-[10px] uppercase tracking-widest">Edit</button>
                        <button onClick={() => onDelete(p.id)} className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest">Hapus</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 animate-in fade-in zoom-in duration-200 shadow-2xl relative overflow-hidden">
            <button onClick={() => setViewingProduct(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">✕</button>
            <div className="mb-8">
              <span className="bg-blue-100 text-blue-600 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Info Produk</span>
              <h3 className="text-2xl font-black text-gray-900 mt-2">{viewingProduct.name}</h3>
              <p className="text-xs font-mono text-gray-400">SKU: {viewingProduct.sku}</p>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kategori</label><p className="font-bold text-gray-800">{viewingProduct.category}</p></div>
                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Harga Beli</label><p className="font-bold text-blue-600">Rp {viewingProduct.costPrice.toLocaleString()}</p></div>
                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Harga Jual</label><p className="font-bold text-green-600">Rp {viewingProduct.price.toLocaleString()}</p></div>
              </div>
              <div className="space-y-4">
                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Stok Saat Ini</label><p className="font-black text-xl">{viewingProduct.stock} Unit</p></div>
                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kadaluarsa</label><p className="font-bold text-red-500">{viewingProduct.expiryDate || '-'}</p></div>
              </div>
            </div>
            <button onClick={() => setViewingProduct(null)} className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-gray-200">Tutup Detail</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

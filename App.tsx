
import React, { useState, useEffect } from 'react';
import { View, Product, Transaction, PaymentMethod, CartItem, User, Role } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import History from './components/History';
import UserManagement from './components/UserManagement';
import Login from './components/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Initialize with an Owner account if no users exist
  useEffect(() => {
    const savedUsers = localStorage.getItem('pos_users');
    if (!savedUsers) {
      const defaultOwner: User = {
        id: 'user-owner',
        username: 'owner',
        password: '123',
        role: Role.OWNER,
        fullName: 'Bapak Pemilik Toko',
        ktp: '1234567890123456',
        address: 'Jl. Utama No. 1',
        startDate: new Date().toISOString().split('T')[0],
        contractMonths: 999,
        endDate: '2099-12-31'
      };
      const initialUsers = [defaultOwner];
      setUsers(initialUsers);
      localStorage.setItem('pos_users', JSON.stringify(initialUsers));
    } else {
      setUsers(JSON.parse(savedUsers));
    }

    const savedProducts = localStorage.getItem('pos_products');
    const savedTransactions = localStorage.getItem('pos_transactions');
    
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));

    // Check session
    const savedSession = sessionStorage.getItem('pos_current_user');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('pos_users', JSON.stringify(users));
  }, [users]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('pos_current_user', JSON.stringify(user));
    setCurrentView(user.role === Role.KARYAWAN ? 'POS' : 'DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('pos_current_user');
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const processSale = (
    cartItems: CartItem[], 
    total: number, 
    globalDiscount: number, 
    method: PaymentMethod,
    cashReceived?: number,
    changeAmount?: number,
    paymentMetadata?: Transaction['paymentMetadata']
  ) => {
    const newTransaction: Transaction = {
      id: `TRX-${Date.now()}`,
      items: cartItems,
      totalAmount: total,
      globalDiscount: globalDiscount,
      paymentMethod: method,
      cashReceived: cashReceived,
      changeAmount: changeAmount,
      paymentMetadata: paymentMetadata,
      timestamp: new Date().toISOString(),
      cashierName: currentUser?.fullName || 'Unknown'
    };

    setTransactions(prev => [newTransaction, ...prev]);

    setProducts(prevProducts => {
      return prevProducts.map(product => {
        const cartItem = cartItems.find(item => item.id === product.id);
        if (cartItem) {
          return {
            ...product,
            stock: product.stock - cartItem.quantity
          };
        }
        return product;
      });
    });
  };

  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard products={products} transactions={transactions} role={currentUser.role} />;
      case 'POS':
        // Fix: Pass the cashierName prop to the POS component
        return <POS products={products} cashierName={currentUser.fullName} onCheckout={processSale} />;
      case 'INVENTORY':
        return (
          <Inventory 
            products={products} 
            onAdd={addProduct} 
            onUpdate={updateProduct} 
            onDelete={deleteProduct} 
            canEdit={currentUser.role !== Role.KARYAWAN}
          />
        );
      case 'HISTORY':
        return <History transactions={transactions} />;
      case 'USERS':
        if (currentUser.role !== Role.OWNER) return <div className="p-8">Akses Ditolak</div>;
        return <UserManagement users={users} onAddUser={(u) => setUsers([...users, u])} onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))} />;
      default:
        return <Dashboard products={products} transactions={transactions} role={currentUser.role} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      <Sidebar 
        activeView={currentView} 
        setView={setCurrentView} 
        user={currentUser} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        {renderView()}
      </main>
    </div>
  );
};

export default App;

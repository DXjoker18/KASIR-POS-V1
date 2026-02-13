
import React, { useState, useEffect } from 'react';
import { View, Product, Transaction, PaymentMethod, CartItem, User, Role, StoreSettings, Attendance as IAttendance } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import History from './components/History';
import UserManagement from './components/UserManagement';
import Attendance from './components/Attendance';
import ReceiptDesigner from './components/ReceiptDesigner';
import Login from './components/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<IAttendance[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: 'KASIR PINTAR',
    address: 'Jl. Contoh No. 123, Indonesia',
    logo: ''
  });

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
      setUsers([defaultOwner]);
    } else {
      setUsers(JSON.parse(savedUsers));
    }

    const savedProducts = localStorage.getItem('pos_products');
    const savedTransactions = localStorage.getItem('pos_transactions');
    const savedSettings = localStorage.getItem('pos_settings');
    const savedAttendances = localStorage.getItem('pos_attendances');
    
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedSettings) setStoreSettings(JSON.parse(savedSettings));
    if (savedAttendances) setAttendances(JSON.parse(savedAttendances));

    const savedSession = sessionStorage.getItem('pos_current_user');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));
  }, []);

  useEffect(() => localStorage.setItem('pos_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('pos_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('pos_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('pos_settings', JSON.stringify(storeSettings)), [storeSettings]);
  useEffect(() => localStorage.setItem('pos_attendances', JSON.stringify(attendances)), [attendances]);

  const handleCheckIn = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newAttendance: IAttendance = {
      id: `ATT-${Date.now()}`,
      userId: userId,
      userName: user.fullName,
      date: new Date().toISOString().split('T')[0],
      checkIn: new Date().toISOString()
    };
    setAttendances(prev => [newAttendance, ...prev]);
  };

  const handleCheckOut = (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setAttendances(prev => prev.map(a => 
      (a.userId === userId && a.date === today && !a.checkOut) 
      ? { ...a, checkOut: new Date().toISOString() } 
      : a
    ));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('pos_current_user', JSON.stringify(user));
    setCurrentView(user.role === Role.KARYAWAN ? 'POS' : 'DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('pos_current_user');
  };

  const renderView = () => {
    if (!currentUser) return null;
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard products={products} transactions={transactions} role={currentUser.role} storeSettings={storeSettings} onUpdateSettings={setStoreSettings} />;
      case 'POS':
        return <POS products={products} cashierName={currentUser.fullName} onCheckout={(cart, total, disc, method, cash, change, meta) => {
          const newTx: Transaction = {
            id: `TRX-${Date.now()}`,
            items: cart,
            totalAmount: total,
            globalDiscount: disc,
            paymentMethod: method,
            cashReceived: cash,
            changeAmount: change,
            paymentMetadata: meta,
            timestamp: new Date().toISOString(),
            cashierName: currentUser.fullName
          };
          setTransactions(prev => [newTx, ...prev]);
          setProducts(prev => prev.map(p => {
            const item = cart.find(c => c.id === p.id);
            return item ? { ...p, stock: p.stock - item.quantity } : p;
          }));
        }} storeSettings={storeSettings} />;
      case 'ATTENDANCE':
        return <Attendance users={users} attendances={attendances} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} />;
      case 'INVENTORY':
        return <Inventory products={products} onAdd={p => setProducts([...products, p])} onUpdate={up => setProducts(products.map(p => p.id === up.id ? up : p))} onDelete={id => setProducts(products.filter(p => p.id !== id))} canEdit={currentUser.role !== Role.KARYAWAN} />;
      case 'HISTORY':
        return <History transactions={transactions} storeSettings={storeSettings} />;
      case 'RECEIPT_CONFIG':
        return <ReceiptDesigner settings={storeSettings} onUpdate={setStoreSettings} />;
      case 'USERS':
        return <UserManagement users={users} onAddUser={u => setUsers([...users, u])} onUpdateUser={up => setUsers(users.map(u => u.id === up.id ? up : u))} onDeleteUser={id => setUsers(users.filter(u => u.id !== id))} storeSettings={storeSettings} />;
      default:
        return null;
    }
  };

  if (!currentUser) return <Login users={users} onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      <Sidebar activeView={currentView} setView={setCurrentView} user={currentUser} onLogout={handleLogout} storeSettings={storeSettings} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        {renderView()}
      </main>
    </div>
  );
};

export default App;

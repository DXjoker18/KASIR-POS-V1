
import React, { useState, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { View, Product, Transaction, User, Role, StoreSettings, Attendance as IAttendance, CashEntry, Customer, PrinterInfo, EmployeeStatus } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import History from './components/History';
import UserManagement from './components/UserManagement';
import Attendance from './components/Attendance';
import Login from './components/Login';
import Finance from './components/Finance';
import CustomerManagement from './components/CustomerManagement';
import PrinterManager from './components/PrinterManager';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<IAttendance[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: 'KASIR PINTAR',
    address: 'Jl. Contoh No. 123, Indonesia',
    logo: '',
    taxPercentage: 0,
    currencySymbol: 'Rp',
    cardCustomization: {
      template: 'modern',
      accentColor: '#2563eb',
      bgColor: '#ffffff',
      textColor: '#1e293b',
      fontFamily: 'sans',
      showBarcode: true,
      showId: true,
      showJoinDate: true,
      showExpiry: true,
      nameFontSize: 12,
      nameFontWeight: '900',
      roleFontSize: 9,
      roleFontWeight: '700',
      idFontSize: 10,
      idFontWeight: '500'
    }
  });

  const [connectedPrinter, setConnectedPrinter] = useState<PrinterInfo | null>(null);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);

  useEffect(() => {
    const savedUsers = localStorage.getItem('pos_users');
    if (!savedUsers) {
      const defaultOwner: User = {
        id: 'user-owner',
        username: 'owner',
        password: '123',
        role: Role.OWNER,
        fullName: 'Pemilik Toko',
        ktp: '1234567890123456',
        phone: '08123456789',
        address: 'Kantor Utama',
        startDate: new Date().toISOString().split('T')[0],
        contractMonths: 99,
        endDate: '2099-12-31',
        status: EmployeeStatus.PERMANENT,
        basicSalary: 0
      };
      setUsers([defaultOwner]);
    } else {
      setUsers(JSON.parse(savedUsers));
    }

    const savedProducts = localStorage.getItem('pos_products');
    const savedTransactions = localStorage.getItem('pos_transactions');
    const savedCashEntries = localStorage.getItem('pos_cash_entries');
    const savedCustomers = localStorage.getItem('pos_customers');
    const savedSettings = localStorage.getItem('pos_settings');
    const savedAttendances = localStorage.getItem('pos_attendances');
    
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedCashEntries) setCashEntries(JSON.parse(savedCashEntries));
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    if (savedSettings) setStoreSettings(JSON.parse(savedSettings));
    if (savedAttendances) setAttendances(JSON.parse(savedAttendances));

    const savedSession = sessionStorage.getItem('pos_current_user');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));
  }, []);

  useEffect(() => localStorage.setItem('pos_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('pos_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('pos_cash_entries', JSON.stringify(cashEntries)), [cashEntries]);
  useEffect(() => localStorage.setItem('pos_customers', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('pos_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('pos_settings', JSON.stringify(storeSettings)), [storeSettings]);
  useEffect(() => localStorage.setItem('pos_attendances', JSON.stringify(attendances)), [attendances]);

  const handleExportData = () => {
    const backup = { products, transactions, cashEntries, customers, users, attendances, storeSettings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.products) setProducts(data.products);
      if (data.transactions) setTransactions(data.transactions);
      if (data.cashEntries) setCashEntries(data.cashEntries);
      if (data.customers) setCustomers(data.customers);
      if (data.users) setUsers(data.users);
      if (data.attendances) setAttendances(data.attendances);
      if (data.storeSettings) setStoreSettings(data.storeSettings);
      alert('Pemulihan data berhasil!');
    } catch (e) {
      alert('File backup tidak valid.');
    }
  };

  const handleResetData = () => {
    setProducts([]);
    setTransactions([]);
    setCashEntries([]);
    setCustomers([]);
    setAttendances([]);
    alert('Seluruh data operasional telah dibersihkan.');
  };

  const renderView = () => {
    if (!currentUser) return null;
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard 
          products={products} transactions={transactions} cashEntries={cashEntries} 
          role={currentUser.role} storeSettings={storeSettings} 
          onAddCashEntry={e => setCashEntries([e, ...cashEntries])} setView={setCurrentView}
        />;
      case 'POS':
        return <POS 
          products={products} customers={customers} cashierName={currentUser.fullName} 
          onCheckout={(cart, total, disc, method, cash, change, meta, customerId, customerName, customerPhone) => {
            const taxAmount = (total * (storeSettings.taxPercentage || 0)) / 100;
            const newTx: Transaction = {
              id: `TRX-${Date.now()}`, items: cart, totalAmount: total + taxAmount, globalDiscount: disc, taxAmount,
              paymentMethod: method, cashReceived: cash, changeAmount: change, paymentMetadata: meta,
              customerId, customerName, customerPhone, timestamp: new Date().toISOString(), cashierName: currentUser.fullName
            };
            setTransactions(prev => [newTx, ...prev]);
            setProducts(prev => prev.map(p => {
              const item = cart.find(c => c.id === p.id);
              return item ? { ...p, stock: p.stock - item.quantity } : p;
            }));
            if (customerId) setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, points: c.points + Math.floor(total / 10000) } : c));
          }} 
          storeSettings={storeSettings} printerConnected={!!connectedPrinter} onOpenPrinterManager={() => setIsPrinterModalOpen(true)}
        />;
      case 'CUSTOMERS':
        return <CustomerManagement customers={customers} onAdd={c => setCustomers([c, ...customers])} onUpdate={up => setCustomers(customers.map(c => c.id === up.id ? up : c))} onDelete={id => setCustomers(customers.filter(c => c.id !== id))} />;
      case 'FINANCE':
        return <Finance cashEntries={cashEntries} transactions={transactions} storeSettings={storeSettings} onAddEntry={e => setCashEntries([e, ...cashEntries])} onDeleteEntry={id => setCashEntries(cashEntries.filter(e => e.id !== id))} currentUser={currentUser} />;
      case 'ATTENDANCE':
        return <Attendance users={users} attendances={attendances} onCheckIn={id => setAttendances([{ id: `ATT-${Date.now()}`, userId: id, userName: users.find(u => u.id === id)?.fullName || '', date: new Date().toISOString().split('T')[0], checkIn: new Date().toISOString() }, ...attendances])} onCheckOut={id => setAttendances(attendances.map(a => (a.userId === id && a.date === new Date().toISOString().split('T')[0] && !a.checkOut) ? { ...a, checkOut: new Date().toISOString() } : a))} />;
      case 'INVENTORY':
        return <Inventory products={products} onAdd={p => setProducts([...products, p])} onUpdate={up => setProducts(products.map(p => p.id === up.id ? up : p))} onDelete={id => setProducts(products.filter(p => p.id !== id))} canEdit={currentUser.role !== Role.KARYAWAN} />;
      case 'HISTORY':
        return <History transactions={transactions} storeSettings={storeSettings} printerConnected={!!connectedPrinter} onOpenPrinterManager={() => setIsPrinterModalOpen(true)} userRole={currentUser.role} onDeleteTransaction={id => setTransactions(transactions.filter(tx => tx.id !== id))} />;
      case 'USERS':
        return <UserManagement users={users} onAddUser={u => setUsers([...users, u])} onUpdateUser={up => setUsers(users.map(u => u.id === up.id ? up : u))} onDeleteUser={id => setUsers(users.filter(u => u.id !== id))} storeSettings={storeSettings} />;
      case 'SETTINGS':
        return <Settings settings={storeSettings} onUpdate={setStoreSettings} onExportData={handleExportData} onImportData={handleImportData} onResetData={handleResetData} />;
      default:
        return null;
    }
  };

  if (!currentUser) return (
    <>
      <Login users={users} onLogin={user => { setCurrentUser(user); sessionStorage.setItem('pos_current_user', JSON.stringify(user)); setCurrentView(user.role === Role.KARYAWAN ? 'POS' : 'DASHBOARD'); }} />
      <SpeedInsights />
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      <Sidebar activeView={currentView} setView={setCurrentView} user={currentUser} onLogout={() => { setCurrentUser(null); sessionStorage.removeItem('pos_current_user'); }} storeSettings={storeSettings} connectedPrinter={connectedPrinter} onOpenPrinterManager={() => setIsPrinterModalOpen(true)} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">{renderView()}</main>
      <PrinterManager isOpen={isPrinterModalOpen} onClose={() => setIsPrinterModalOpen(false)} connectedPrinter={connectedPrinter} onConnect={p => { setConnectedPrinter(p); setIsPrinterModalOpen(false); }} onDisconnect={() => setConnectedPrinter(null)} />
      <SpeedInsights />
    </div>
  );
};

export default App;

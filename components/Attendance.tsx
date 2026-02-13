
import React, { useState, useEffect, useRef } from 'react';
import { User, Attendance as IAttendance } from '../types';

interface AttendanceProps {
  users: User[];
  attendances: IAttendance[];
  onCheckIn: (userId: string) => void;
  onCheckOut: (userId: string) => void;
}

const Attendance: React.FC<AttendanceProps> = ({ users, attendances, onCheckIn, onCheckOut }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualBarcode, setManualBarcode] = useState('');

  // Sederhanakan daftar hadir untuk hari ini
  const today = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.date === today);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (!isScanning) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
        setIsScanning(false);
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isScanning]);

  const processBarcode = (barcode: string) => {
    const user = users.find(u => u.ktp === barcode);
    if (!user) {
      setScanStatus({ type: 'error', message: 'Staff tidak ditemukan!' });
      return;
    }

    const existingAttendance = todayAttendances.find(a => a.userId === user.id);
    if (!existingAttendance) {
      onCheckIn(user.id);
      setScanStatus({ type: 'success', message: `Check-in Berhasil: ${user.fullName}` });
    } else if (!existingAttendance.checkOut) {
      onCheckOut(user.id);
      setScanStatus({ type: 'success', message: `Check-out Berhasil: ${user.fullName}` });
    } else {
      setScanStatus({ type: 'error', message: 'Staff sudah Check-out hari ini.' });
    }

    setTimeout(() => setScanStatus(null), 3000);
    setManualBarcode('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode) processBarcode(manualBarcode);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Daftar Hadir Staff</h2>
          <p className="text-sm text-gray-400 font-medium">Scan barcode Kartu ID untuk presensi harian.</p>
        </div>
        <button
          onClick={() => setIsScanning(true)}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2"
        >
          <span>📷</span> MULAI SCAN BARCODE
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Scan Manual */}
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
             <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Input Manual / Barcode Gun</h3>
             <form onSubmit={handleManualSubmit}>
               <input 
                autoFocus
                type="text" 
                placeholder="Tempelkan kursor & scan..."
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl focus:outline-none font-bold"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
               />
             </form>
             {scanStatus && (
               <div className={`mt-4 p-4 rounded-xl text-xs font-black uppercase tracking-tight text-center animate-bounce ${scanStatus.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                 {scanStatus.message}
               </div>
             )}
           </div>
        </div>

        {/* Tabel Riwayat Hari Ini */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Kehadiran Hari Ini ({today})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <th className="px-6 py-4">Nama Staff</th>
                  <th className="px-6 py-4">Check-In</th>
                  <th className="px-6 py-4">Check-Out</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayAttendances.map((a) => (
                  <tr key={a.id} className="text-sm font-bold text-gray-700">
                    <td className="px-6 py-4">{a.userName}</td>
                    <td className="px-6 py-4 text-blue-600">{new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 text-orange-600">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${a.checkOut ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'}`}>
                        {a.checkOut ? 'Selesai' : 'Aktif'}
                      </span>
                    </td>
                  </tr>
                ))}
                {todayAttendances.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-300 font-bold italic">Belum ada data kehadiran hari ini</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Scanner Kamera */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="relative w-full max-w-lg aspect-square bg-gray-900 rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-32 border-2 border-blue-500/50 relative">
                <div className="w-full h-0.5 bg-red-500 shadow-[0_0_15px_red] animate-pulse mt-16"></div>
              </div>
              <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] mt-10 bg-black/50 px-6 py-2 rounded-full backdrop-blur-md">Arahkan ke Barcode Kartu ID</p>
            </div>
          </div>
          <button onClick={() => setIsScanning(false)} className="mt-8 px-10 py-4 bg-white/10 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-white/10">Tutup Kamera</button>
        </div>
      )}
    </div>
  );
};

export default Attendance;

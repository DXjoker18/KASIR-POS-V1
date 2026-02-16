
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter attendance for today
  const today = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.date === today);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let scanningInterval: number | null = null;

    const startCamera = async () => {
      if (!isScanning) return;
      try {
        // Mencoba akses kamera belakang (environment) terlebih dahulu
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
        } catch (fallbackErr) {
          // Jika gagal (misal di PC/Laptop tanpa kamera belakang), fallback ke kamera apa saja yang tersedia
          console.warn("Kamera environment tidak ditemukan, mencoba kamera default...");
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Logic for auto-detecting barcode if BarcodeDetector API is available (Chrome/Android)
        // @ts-ignore
        if ('BarcodeDetector' in window) {
          // @ts-ignore
          const barcodeDetector = new BarcodeDetector({ formats: ['code_128', 'ean_13', 'qr_code'] });
          scanningInterval = window.setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                // @ts-ignore
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  processBarcode(barcodes[0].rawValue);
                  setIsScanning(false);
                }
              } catch (e) {
                console.error("Barcode detection error:", e);
              }
            }
          }, 500);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        let errorMsg = 'Gagal mengakses kamera.';
        if (err instanceof DOMException && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
          errorMsg = 'Kamera tidak ditemukan pada perangkat ini.';
        } else if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          errorMsg = 'Akses kamera ditolak. Berikan izin pada browser.';
        }
        setScanStatus({ type: 'error', message: errorMsg });
        setIsScanning(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (scanningInterval) {
        clearInterval(scanningInterval);
      }
    };
  }, [isScanning]);

  const processBarcode = (barcode: string) => {
    const user = users.find(u => u.ktp === barcode || u.id === barcode);
    if (!user) {
      setScanStatus({ type: 'error', message: `Staff tidak ditemukan! (ID: ${barcode})` });
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

    setTimeout(() => setScanStatus(null), 4000);
    setManualBarcode('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode) processBarcode(manualBarcode);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">Kehadiran Presensi</h2>
          <p className="text-sm text-gray-400 font-medium">Gunakan Kartu ID atau scan wajah/barcode untuk presensi.</p>
        </div>
        <button
          onClick={() => setIsScanning(true)}
          className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <span className="text-xl">📷</span> MULAI SCAN KAMERA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manual & Quick Input Column */}
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-left">
             <div className="flex items-center gap-2 mb-6">
               <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">⌨️</div>
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Input Manual</h3>
             </div>
             
             <form onSubmit={handleManualSubmit} className="space-y-4">
               <div className="relative group">
                 <input 
                  autoFocus
                  type="text" 
                  placeholder="Masukkan NIK atau Scan..."
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:outline-none font-black text-gray-800 transition-all pr-16"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                 />
                 <button 
                  type="button"
                  onClick={() => setIsScanning(true)}
                  className="absolute right-3 top-3 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-90"
                  title="Scan dengan Kamera"
                 >
                   📷
                 </button>
               </div>
               <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest ml-1 opacity-60">Sistem mendeteksi ID Staff & NIK KTP</p>
             </form>

             {scanStatus && (
               <div className={`mt-6 p-5 rounded-2xl text-[10px] font-black uppercase tracking-tight text-center animate-in slide-in-from-top-2 duration-300 border-2 ${
                 scanStatus.type === 'success' 
                 ? 'bg-green-50 text-green-600 border-green-100' 
                 : 'bg-red-50 text-red-600 border-red-100'
               }`}>
                 <div className="text-xl mb-1">{scanStatus.type === 'success' ? '✅' : '❌'}</div>
                 {scanStatus.message}
               </div>
             )}
           </div>

           {/* Today Stats Summary */}
           <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Total Hadir Hari Ini</p>
              <h4 className="text-4xl font-black">{todayAttendances.length} <span className="text-sm font-bold opacity-60 ml-1">STAFF</span></h4>
              <div className="mt-6 flex gap-2">
                <span className="text-[9px] font-black px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 uppercase tracking-tighter">
                  {todayAttendances.filter(a => !a.checkOut).length} Aktif
                </span>
                <span className="text-[9px] font-black px-3 py-1 bg-white/10 text-white/60 rounded-full border border-white/10 uppercase tracking-tighter">
                  {todayAttendances.filter(a => a.checkOut).length} Selesai
                </span>
              </div>
           </div>
        </div>

        {/* Real-time Attendance Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden text-left flex flex-col">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Riwayat Kehadiran ({new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })})</h3>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Live Update</span>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                  <th className="px-8 py-4">Informasi Staff</th>
                  <th className="px-8 py-4">Waktu Masuk</th>
                  <th className="px-8 py-4">Waktu Pulang</th>
                  <th className="px-8 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-800">
                {todayAttendances.map((a) => (
                  <tr key={a.id} className="hover:bg-blue-50/10 transition-colors">
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <p className="font-black text-sm uppercase tracking-tight">{a.userName}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">UID: {a.userId.split('-')[1] || a.userId}</p>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          <span className="text-blue-600 font-black text-sm">{new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[8px] bg-blue-50 text-blue-400 px-2 py-0.5 rounded font-black uppercase">Masuk</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       {a.checkOut ? (
                         <div className="flex items-center gap-2">
                            <span className="text-orange-600 font-black text-sm">{new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-[8px] bg-orange-50 text-orange-400 px-2 py-0.5 rounded font-black uppercase">Pulang</span>
                         </div>
                       ) : (
                         <span className="text-xs text-gray-300 font-black italic">Belum Pulang</span>
                       )}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${a.checkOut ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600 shadow-sm border border-green-200'}`}>
                        {a.checkOut ? 'SHIFT SELESAI' : 'SEDANG BEKERJA'}
                      </span>
                    </td>
                  </tr>
                ))}
                {todayAttendances.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                       <div className="flex flex-col items-center opacity-20 grayscale">
                          <span className="text-6xl mb-4">⏰</span>
                          <p className="font-black uppercase tracking-[0.5em] text-xs text-gray-400">Belum ada aktivitas hari ini</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Camera Scanning Overlay (Modal) */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/95 z-[150] flex flex-col items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg aspect-square bg-gray-900 rounded-[3rem] overflow-hidden border-4 border-white/20 shadow-2xl flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            
            {/* Scanning UI Elements */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Corner Brackets */}
              <div className="absolute top-10 left-10 w-16 h-16 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl opacity-80"></div>
              <div className="absolute top-10 right-10 w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl opacity-80"></div>
              <div className="absolute bottom-10 left-10 w-16 h-16 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl opacity-80"></div>
              <div className="absolute bottom-10 right-10 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br-3xl opacity-80"></div>
              
              {/* Scanning Line Animation */}
              <div className="w-[80%] h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-[scan_2s_infinite_ease-in-out]"></div>
              
              <div className="mt-20 bg-black/40 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/10 flex flex-col items-center gap-1">
                 <p className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Arahkan Barcode Member</p>
                 <p className="text-blue-400 text-[8px] font-bold uppercase tracking-widest">Sistem Deteksi Otomatis</p>
              </div>
            </div>
            
            {/* Hidden canvas for potential manual capture processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="flex gap-4">
              <button 
                onClick={() => setIsScanning(false)} 
                className="px-12 py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all hover:bg-red-700 active:scale-95 shadow-2xl shadow-red-500/20"
              >
                Batal & Tutup
              </button>
            </div>
            <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest opacity-60">Pastikan pencahayaan cukup terang</p>
          </div>
        </div>
      )}

      {/* Global CSS for scanning animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-120px); opacity: 0.2; }
          50% { transform: translateY(120px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Attendance;


import React, { useState, useEffect } from 'react';
import { PrinterInfo } from '../types';

interface PrinterManagerProps {
  isOpen: boolean;
  onClose: () => void;
  connectedPrinter: PrinterInfo | null;
  onConnect: (printer: PrinterInfo) => void;
  onDisconnect: () => void;
}

const PrinterManager: React.FC<PrinterManagerProps> = ({ 
  isOpen, 
  onClose, 
  connectedPrinter, 
  onConnect, 
  onDisconnect 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<PrinterInfo[]>([]);

  const startScan = () => {
    setIsScanning(true);
    setDiscoveredPrinters([]);
    
    // Simulasi pencarian perangkat
    setTimeout(() => {
      setDiscoveredPrinters([
        { id: 'PRN-001', name: 'Thermal Printer 58mm', type: 'Bluetooth', status: 'disconnected' },
        { id: 'PRN-002', name: 'EPSON TM-T82 III', type: 'USB', status: 'disconnected' },
        { id: 'PRN-003', name: 'RPP02N Mobile Printer', type: 'Bluetooth', status: 'disconnected' }
      ]);
      setIsScanning(false);
    }, 2500);
  };

  useEffect(() => {
    if (isOpen && !connectedPrinter) {
      startScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 text-left">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Printer Control Center</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>

        {connectedPrinter ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6 text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 animate-pulse">
                🖨️
              </div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Status: Terhubung</p>
              <h4 className="text-lg font-black text-gray-900">{connectedPrinter.name}</h4>
              <p className="text-xs text-gray-500 font-medium">{connectedPrinter.type} Interface</p>
            </div>
            
            <button 
              onClick={onDisconnect}
              className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
            >
              Putuskan Koneksi
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              {isScanning ? (
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">📡</div>
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl opacity-40">🖨️</div>
              )}
              <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {isScanning ? 'Mencari Perangkat Nearby...' : 'Siap Menghubungkan'}
              </p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {discoveredPrinters.map(p => (
                <button
                  key={p.id}
                  onClick={() => onConnect(p)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-blue-400 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl grayscale group-hover:grayscale-0 transition-all">🖨️</span>
                    <div className="text-left">
                      <p className="text-xs font-black text-gray-800 uppercase">{p.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{p.type}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-blue-600 bg-blue-100 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">HUBUNGKAN</span>
                </button>
              ))}
              {!isScanning && discoveredPrinters.length === 0 && (
                <p className="text-center text-[10px] font-bold text-gray-400 py-4 uppercase italic">Tidak ada printer ditemukan</p>
              )}
            </div>

            <button 
              onClick={startScan}
              disabled={isScanning}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 ${isScanning ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
            >
              {isScanning ? 'Scanning...' : 'Cari Ulang Perangkat'}
            </button>
          </div>
        )}
        
        <p className="text-center mt-6 text-[8px] text-gray-300 font-black uppercase tracking-widest">
          Pastikan Bluetooth / USB Printer Aktif
        </p>
      </div>
    </div>
  );
};

export default PrinterManager;


import React from 'react';
import { User, StoreSettings, Role } from '../types';

interface IDCardProps {
  user: User;
  settings: StoreSettings;
  innerRef?: React.Ref<HTMLDivElement>;
}

const IDCard: React.FC<IDCardProps> = ({ user, settings, innerRef }) => {
  const config = settings.cardCustomization || {
    template: 'modern', accentColor: '#2563eb', bgColor: '#ffffff', textColor: '#1e293b',
    fontFamily: 'sans', showBarcode: true, showId: true, showJoinDate: true, showExpiry: true,
    nameFontSize: 12, nameFontWeight: '900', roleFontSize: 9, roleFontWeight: '700', idFontSize: 10, idFontWeight: '500'
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.OWNER: return '#9333ea';
      case Role.ADMIN: return '#2563eb';
      default: return '#64748b';
    }
  };

  const baseStyle: React.CSSProperties = {
    width: '85.6mm', height: '54mm', backgroundColor: config.bgColor, color: config.textColor,
    fontFamily: config.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
    borderRadius: config.template === 'corporate' ? '0' : '12px',
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', border: '1px solid rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
  };

  return (
    <div ref={innerRef} style={baseStyle}>
      <div style={{ backgroundColor: config.accentColor }} className="h-4 w-full flex items-center justify-center text-[6px] font-black text-white uppercase tracking-widest">Employee Identity Card</div>
      <div className="flex-1 p-4 flex gap-4">
        <div className="w-20 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
           {user.photo ? <img src={user.photo} className="w-full h-full object-cover" /> : <span className="text-3xl opacity-20">👤</span>}
        </div>
        <div className="flex-1 flex flex-col justify-center text-left">
           <h4 style={{ fontSize: config.nameFontSize, fontWeight: config.nameFontWeight }}>{user.fullName}</h4>
           <p style={{ fontSize: config.roleFontSize, fontWeight: config.roleFontWeight, color: getRoleColor(user.role) }} className="uppercase tracking-widest mb-2">{user.role}</p>
           <div className="space-y-1 text-[7px] font-bold text-gray-400">
              {config.showId && <p>ID: {user.id.split('-')[1] || user.id}</p>}
              {config.showJoinDate && <p>Gabung: {user.startDate}</p>}
              {config.showExpiry && <p>Berlaku: {user.endDate}</p>}
           </div>
        </div>
      </div>
      <div className="h-10 bg-gray-50 border-t flex flex-col items-center justify-center">
         {config.showBarcode && (
           <>
             <div className="barcode-font text-[24px] leading-none text-black">*{user.ktp}*</div>
             <p className="text-[6px] font-mono -mt-1">{user.ktp}</p>
           </>
         )}
      </div>
    </div>
  );
};

export default IDCard;

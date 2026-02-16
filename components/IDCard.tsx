
import React from 'react';
import { User, StoreSettings, Role } from '../types';

interface IDCardProps {
  user: User;
  settings: StoreSettings;
  innerRef?: React.Ref<HTMLDivElement>;
}

const IDCard: React.FC<IDCardProps> = ({ user, settings, innerRef }) => {
  const config = settings.cardCustomization || {
    template: 'modern',
    accentColor: '#0077CC',
    bgColor: '#F0F8FF',
    textColor: '#001F3F',
    fontFamily: 'sans',
    showBarcode: true,
    showId: true,
    showJoinDate: true,
    showExpiry: true,
    nameFontSize: 10,
    nameFontWeight: '900',
    roleFontSize: 8,
    roleFontWeight: '900',
    idFontSize: 10,
    idFontWeight: '900'
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.OWNER: return '#9333ea';
      case Role.ADMIN: return '#2563eb';
      default: return '#64748b';
    }
  };

  const roleColor = getRoleColor(user.role);

  const fontStyle = {
    fontFamily: config.fontFamily === 'serif' ? 'serif' : config.fontFamily === 'mono' ? 'monospace' : 'inherit',
    transition: 'all 0.3s ease-in-out'
  };

  const isValidImage = (src?: string) => src && src.trim().length > 10;

  const baseStyle: React.CSSProperties = {
    width: '85.6mm',
    height: '54mm',
    backgroundColor: config.bgColor,
    color: config.textColor,
    backgroundImage: isValidImage(config.bgImage) ? `url(${config.bgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    borderRadius: config.template === 'corporate' ? '0px' : '12px',
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
    border: '1px solid rgba(0,0,0,0.08)',
    transition: 'background-color 0.3s ease, color 0.3s ease, border-radius 0.3s ease, background-image 0.3s ease',
    ...fontStyle
  };

  const smoothTransition = { transition: 'font-size 0.2s ease-out, font-weight 0.2s ease-out, color 0.3s ease' };

  const nameStyle: React.CSSProperties = {
    fontSize: `${config.nameFontSize || 10}px`,
    fontWeight: config.nameFontWeight || '900',
    ...smoothTransition
  };
  
  const roleTextStyle: React.CSSProperties = {
    fontSize: `${config.roleFontSize || 8}px`,
    fontWeight: config.roleFontWeight || '900',
    ...smoothTransition
  };

  const idTextStyle: React.CSSProperties = {
    fontSize: `${config.idFontSize || 10}px`,
    fontWeight: config.idFontWeight || '900',
    ...smoothTransition
  };

  const KtpHeader = () => (
    <div 
      style={{ 
        backgroundColor: `${config.accentColor}20`, 
        borderBottom: `1px solid ${config.accentColor}40`,
        transition: 'all 0.3s ease'
      }} 
      className="px-4 py-2 text-center z-10"
    >
      <h5 className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-800">Provinsi Jawa Barat</h5>
      <h6 className="text-[7px] font-bold uppercase tracking-[0.1em] text-gray-600">Kabupaten Bekasi</h6>
    </div>
  );

  if (config.template === 'modern') {
    return (
      <div ref={innerRef} style={baseStyle} className="no-print">
        <KtpHeader />
        <div className="flex-1 p-4 flex gap-4 relative z-10 text-left">
          <div className="space-y-2.5 flex-1">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase text-gray-900 leading-none">NIK : </span>
                <span style={idTextStyle} className="text-blue-700 tracking-wider">
                  {config.showId ? (user.id.split('-')[1] || user.id) : '**********'}
                </span>
             </div>
             
             <div className="space-y-1.5 ml-2">
                <div className="grid grid-cols-12 gap-1 items-start">
                   <span className="col-span-4 text-[7px] font-bold uppercase text-gray-400">Nama</span>
                   <span className="col-span-1 text-[7px] font-bold text-gray-400">:</span>
                   <span style={nameStyle} className="col-span-7 uppercase text-gray-900 leading-tight">{user.fullName}</span>
                </div>
                {config.showJoinDate && (
                  <div className="grid grid-cols-12 gap-1 items-start">
                    <span className="col-span-4 text-[7px] font-bold uppercase text-gray-400">Gabung</span>
                    <span className="col-span-1 text-[7px] font-bold text-gray-400">:</span>
                    <span className="col-span-7 text-[8px] font-black uppercase text-gray-900">{user.startDate}</span>
                  </div>
                )}
                <div className="grid grid-cols-12 gap-1 items-start">
                   <span className="col-span-4 text-[7px] font-bold uppercase text-gray-400">Jabatan</span>
                   <span className="col-span-1 text-[7px] font-bold text-gray-400">:</span>
                   <span style={{ ...roleTextStyle, color: roleColor }} className="col-span-7 uppercase">{user.role}</span>
                </div>
                {config.showExpiry && (
                  <div className="grid grid-cols-12 gap-1 items-start">
                    <span className="col-span-4 text-[7px] font-bold uppercase text-gray-400">Berlaku</span>
                    <span className="col-span-1 text-[7px] font-bold text-gray-400">:</span>
                    <span className="col-span-7 text-[8px] font-black uppercase text-gray-900">{user.endDate}</span>
                  </div>
                )}
             </div>
          </div>
          
          <div className="w-24 flex flex-col items-center">
             <div className="w-20 h-24 bg-white border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden shadow-sm p-0.5">
                {isValidImage(user.photo) ? <img src={user.photo} className="w-full h-full object-cover rounded" crossOrigin="anonymous" /> : <span className="text-3xl opacity-10">👤</span>}
             </div>
             <div className="mt-2 text-[5px] font-black uppercase text-gray-300 tracking-widest text-center">
                {settings.name}
             </div>
          </div>
        </div>

        <div className="px-4 py-2 flex items-center justify-center relative z-10">
           {config.showBarcode && (
             <div className="flex flex-col items-center opacity-80" style={{ transition: 'all 0.3s ease' }}>
                <div className="barcode-font text-[28px] leading-none text-black">*{user.ktp}*</div>
                <p className="text-[6px] font-mono font-black -mt-1">{user.ktp}</p>
             </div>
           )}
        </div>
      </div>
    );
  }

  if (config.template === 'corporate') {
    return (
      <div ref={innerRef} style={baseStyle} className="no-print">
        <div style={{ backgroundColor: config.accentColor, transition: 'background-color 0.3s ease' }} className="px-4 py-3 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            {isValidImage(settings.logo) ? (
              <img src={settings.logo} className="h-5 w-5 object-contain brightness-0 invert" crossOrigin="anonymous" />
            ) : (
              <div className="h-5 w-5 bg-white/20 rounded flex items-center justify-center text-white font-black text-[7px]">KP</div>
            )}
            <span className="text-[9px] font-black text-white uppercase tracking-tighter">{settings.name}</span>
          </div>
          <span className="text-[6px] font-black text-white/70 uppercase tracking-widest">Employee Identity</span>
        </div>
        <div className="flex p-4 gap-4 flex-1 relative z-10 bg-white/80 text-left">
          <div className="w-20 h-24 border-2 border-gray-100 bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
             {isValidImage(user.photo) ? <img src={user.photo} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <span className="text-3xl opacity-20">👤</span>}
          </div>
          <div className="flex-1 space-y-2 py-0.5 text-left">
             <div className="border-b border-gray-100 pb-1">
               <p style={nameStyle} className="uppercase leading-none mb-1">{user.fullName}</p>
               <span style={{ ...roleTextStyle, color: roleColor }} className="uppercase tracking-wider">{user.role}</span>
             </div>
             <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[7px] font-bold uppercase text-gray-500">
                {config.showId && (
                  <div>
                    <p className="opacity-50 text-[4px] leading-none mb-0.5">ID STAFF</p>
                    <p style={idTextStyle} className="text-gray-800 leading-none">#{user.id.split('-')[1] || user.id}</p>
                  </div>
                )}
                {config.showJoinDate && (
                  <div>
                    <p className="opacity-50 text-[4px] leading-none mb-0.5">TERDAFTAR</p>
                    <p className="text-gray-800 font-black">{user.startDate}</p>
                  </div>
                )}
                {config.showExpiry && (
                  <div className="col-span-2">
                    <p className="opacity-50 text-[4px] leading-none mb-0.5">BERAKHIR PADA</p>
                    <p className="text-gray-800 font-black">{user.endDate}</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {config.showBarcode && (
          <div className="mt-auto px-4 pb-2 flex items-center justify-between border-t border-gray-50 pt-1 bg-white">
            <div className="barcode-font text-[28px] leading-none text-black">*{user.ktp}*</div>
            <p className="text-[6px] font-mono text-gray-400">{user.ktp}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={innerRef} style={baseStyle} className="no-print">
      <div style={{ backgroundColor: config.accentColor, position: 'absolute', top: '-10mm', left: '-10mm', width: '30mm', height: '30mm', borderRadius: '50%', opacity: 0.2, transition: 'all 0.5s ease' }}></div>
      <div style={{ backgroundColor: config.accentColor, position: 'absolute', bottom: '-20mm', right: '-10mm', width: '60mm', height: '60mm', borderRadius: '50%', opacity: 0.1, transition: 'all 0.5s ease' }}></div>

      <div className="flex flex-col items-center justify-center flex-1 p-4 z-10 text-center">
         <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden mb-2 bg-white flex items-center justify-center">
            {isValidImage(user.photo) ? <img src={user.photo} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <span className="text-2xl opacity-20">👤</span>}
         </div>
         <h4 style={nameStyle} className="uppercase leading-tight">{user.fullName}</h4>
         <div style={{ backgroundColor: roleColor, transition: 'background-color 0.3s ease' }} className="px-4 py-0.5 rounded-full mt-1 shadow-sm">
            <span style={{ ...roleTextStyle, color: '#fff' }} className="uppercase">{user.role}</span>
         </div>
         
         <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-gray-400 uppercase tracking-widest opacity-60">
            {config.showId && <div style={idTextStyle}>ID: {user.id.split('-')[1] || user.id}</div>}
            {config.showJoinDate && <div className="text-[6px] font-black">JOIN: {user.startDate}</div>}
            {config.showExpiry && <div className="text-[6px] font-black">EXP: {user.endDate}</div>}
         </div>
      </div>

      <div className="p-2 flex flex-col items-center bg-white/40 backdrop-blur-md border-t border-white/30 z-10">
         {config.showBarcode && (
           <>
              <div className="barcode-font text-[26px] leading-none text-black">*{user.ktp}*</div>
              <p className="text-[6px] font-mono font-bold tracking-[0.4em] -mt-1">{user.ktp}</p>
           </>
         )}
      </div>
    </div>
  );
};

export default IDCard;

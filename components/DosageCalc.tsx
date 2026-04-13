import React, { useState } from 'react';

const inputStyle = "w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold text-lg placeholder:text-slate-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm";
const labelStyle = "block text-[10px] font-black uppercase text-blue-600 ml-2 mb-1 tracking-widest";

const DosageCalc: React.FC = () => {
  const [p, setP] = useState('');
  const [l, setL] = useState('');
  const [t, setT] = useState('');
  const [ppm, setPpm] = useState('');
  
  const volume = (parseFloat(p) || 0) * (parseFloat(l) || 0) * (parseFloat(t) || 0);
  const dosis = volume * (parseFloat(ppm) || 0);

  const handleDecimalOnly = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
    setter(value);
  };

  return (
    <div className="space-y-4">
      <label className={labelStyle}>Volume Kolam (Meter)</label>
      <div className="grid grid-cols-3 gap-2">
        <input type="tel" placeholder="P" value={p} onChange={handleDecimalOnly(setP)} className={inputStyle} />
        <input type="tel" placeholder="L" value={l} onChange={handleDecimalOnly(setL)} className={inputStyle} />
        <input type="tel" placeholder="T" value={t} onChange={handleDecimalOnly(setT)} className={inputStyle} />
      </div>
      <div>
        <label className={labelStyle}>Target Dosis (ppm)</label>
        <input type="tel" value={ppm} onChange={handleDecimalOnly(setPpm)} className={inputStyle} placeholder="mg/L" />
      </div>
      {dosis > 0 && (
        <div className="p-6 bg-blue-50 text-blue-700 rounded-[2rem] text-center shadow-inner">
          <p className="text-sm font-bold opacity-60 uppercase">Kebutuhan Bahan</p>
          <p className="text-4xl font-black">{dosis.toFixed(1)} Gram</p>
          <p className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Volume: {volume.toFixed(1)} m³</p>
        </div>
      )}
    </div>
  );
};

export default DosageCalc;
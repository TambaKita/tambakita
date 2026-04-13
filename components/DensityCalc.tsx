import React, { useState } from 'react';

type FishType = 'Nila' | 'Lele' | 'Mas' | 'Gurame' | 'Patin';
type PondType = 'Terpal' | 'Bioflok' | 'Tanah' | 'Beton';

// Data FCR untuk referensi (meskipun gak dipakai di density)
const fishPresets: Record<FishType, { fcr: number; name: string }> = {
  'Nila': { fcr: 1.3, name: 'Nila' },
  'Lele': { fcr: 1.0, name: 'Lele' },
  'Mas': { fcr: 1.5, name: 'Mas' },
  'Gurame': { fcr: 1.8, name: 'Gurame' },
  'Patin': { fcr: 1.2, name: 'Patin' }
};

// Data padat tebar (ekor/m²) berdasarkan standar
const densityPresets: Record<PondType, Record<FishType, number>> = {
  'Terpal': { 'Nila': 30, 'Lele': 150, 'Mas': 20, 'Gurame': 5, 'Patin': 25 },
  'Bioflok': { 'Nila': 100, 'Lele': 800, 'Mas': 40, 'Gurame': 10, 'Patin': 60 },
  'Tanah': { 'Nila': 10, 'Lele': 50, 'Mas': 5, 'Gurame': 2, 'Patin': 8 },
  'Beton': { 'Nila': 50, 'Lele': 250, 'Mas': 30, 'Gurame': 8, 'Patin': 40 }
};

const inputStyle = "w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold text-lg placeholder:text-slate-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm";
const labelStyle = "block text-[10px] font-black uppercase text-blue-600 ml-2 mb-1 tracking-widest";

const DensityCalc: React.FC = () => {
  const [p, setP] = useState('');
  const [l, setL] = useState('');
  const [pondType, setPondType] = useState<PondType>('Terpal');
  const [fishType, setFishType] = useState<FishType>('Nila');

  const length = parseFloat(p) || 0;
  const width = parseFloat(l) || 0;
  const area = length * width;
  const densityLimit = densityPresets[pondType][fishType];
  const estimate = Math.floor(area * densityLimit);

  const handleDecimalOnly = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
    setter(value);
  };

  // Informasi rekomendasi berdasarkan jenis kolam
  const getPondDescription = () => {
    switch(pondType) {
      case 'Terpal':
        return '📌 Cocok untuk pemula, kontrol air mudah, sirkulasi baik';
      case 'Bioflok':
        return '⚡ Padat tebar tinggi, teknologi modern, perlu manajemen protein';
      case 'Tanah':
        return '🌿 Ekosistem alami, biaya murah, perlu pengelolaan lumpur';
      case 'Beton':
        return '🏗️ Permanen, mudah dibersihkan, investasi awal lebih tinggi';
      default:
        return '';
    }
  };

  // Informasi rekomendasi berdasarkan jenis ikan
  const getFishDescription = () => {
    switch(fishType) {
      case 'Lele':
        return '📈 Pertumbuhan cepat, toleransi tinggi, cocok padat tebar';
      case 'Nila':
        return '🐟 Populer, tahan penyakit, cocok polikultur';
      case 'Mas':
        return '🎏 Pakan alami, kualitas air terjaga, pertumbuhan sedang';
      case 'Gurame':
        return '🐠 Harga jual tinggi, butuh kesabaran, tebar rendah';
      case 'Patin':
        return '🐋 Cepat besar, pakan efisien, permintaan pasar tinggi';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelStyle}>Jenis Kolam</label>
          <select value={pondType} onChange={e => setPondType(e.target.value as PondType)} className={inputStyle}>
            <option value="Terpal">Terpal</option>
            <option value="Bioflok">Bioflok</option>
            <option value="Beton">Beton</option>
            <option value="Tanah">Tanah</option>
          </select>
          <p className="text-[9px] text-slate-400 mt-1 ml-2">{getPondDescription()}</p>
        </div>
        <div>
          <label className={labelStyle}>Jenis Ikan</label>
          <select value={fishType} onChange={e => setFishType(e.target.value as FishType)} className={inputStyle}>
            {Object.keys(fishPresets).map(k => <option key={k} value={k}>{fishPresets[k as FishType].name}</option>)}
          </select>
          <p className="text-[9px] text-slate-400 mt-1 ml-2">{getFishDescription()}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelStyle}>Panjang (m)</label>
          <input type="tel" value={p} onChange={handleDecimalOnly(setP)} className={inputStyle} placeholder="0" />
        </div>
        <div>
          <label className={labelStyle}>Lebar (m)</label>
          <input type="tel" value={l} onChange={handleDecimalOnly(setL)} className={inputStyle} placeholder="0" />
        </div>
      </div>
      
      {estimate > 0 && (
        <div className="p-6 bg-blue-50 text-blue-700 rounded-[2rem] text-center border border-blue-100 shadow-inner">
          <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Padat Tebar Standar</p>
          <p className="text-5xl font-black">{estimate.toLocaleString()}</p>
          <p className="text-xs font-black mt-2 uppercase tracking-widest">Ekor Ikan {fishPresets[fishType].name}</p>
          <div className="mt-3 py-2 px-4 bg-white/50 rounded-xl inline-block">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Rekomendasi {pondType}</p>
            <p className="text-[10px] font-black text-blue-600">{densityLimit} ekor/m²</p>
          </div>
          <div className="mt-3 text-[9px] text-slate-500">
            📐 Luas kolam: {area.toFixed(1)} m²
          </div>
        </div>
      )}
      
      {/* Tips Tambahan */}
      {estimate > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-xl">
          <p className="text-[9px] font-black text-yellow-700 uppercase tracking-wider">💡 TIPS</p>
          <p className="text-[9px] text-slate-600 mt-1">
            Untuk hasil optimal, jangan terlalu padat. Sediakan aerasi yang cukup dan pantau kualitas air secara rutin.
          </p>
        </div>
      )}
    </div>
  );
};

export default DensityCalc;
import React, { useState } from 'react';

type FishType = 'Lele' | 'Nila' | 'Mas' | 'Patin' | 'Gurame';

const fishPresets: Record<FishType, { fcr: number; name: string; minHarvestMonth: number; maxHarvestMonth: number; targetWeight: number; description: string }> = {
  'Lele': { 
    fcr: 1.0, 
    name: 'Lele', 
    minHarvestMonth: 2, 
    maxHarvestMonth: 3, 
    targetWeight: 150,
    description: 'Panen dalam 2–3 bulan (ukuran 5–10 ekor/kg), sangat cepat dan populer untuk kolam terpal.'
  },
  'Nila': { 
    fcr: 1.3, 
    name: 'Nila', 
    minHarvestMonth: 2, 
    maxHarvestMonth: 3, 
    targetWeight: 250,
    description: 'Panen dalam 2–3 bulan (ukuran 3–5 ekor/kg) dengan manajemen pakan yang baik.'
  },
  'Mas': { 
    fcr: 1.5, 
    name: 'Mas', 
    minHarvestMonth: 3, 
    maxHarvestMonth: 4, 
    targetWeight: 300,
    description: 'Panen dalam 3–4 bulan untuk mencapai ukuran konsumsi.'
  },
  'Patin': { 
    fcr: 1.2, 
    name: 'Patin', 
    minHarvestMonth: 3, 
    maxHarvestMonth: 6, 
    targetWeight: 600,
    description: 'Panen membutuhkan waktu lebih lama, sekitar 3–6 bulan, sering menggunakan pakan organik.'
  },
  'Gurame': { 
    fcr: 1.8, 
    name: 'Gurame', 
    minHarvestMonth: 5, 
    maxHarvestMonth: 8, 
    targetWeight: 500,
    description: 'Panen membutuhkan waktu 5–8 bulan, tergantung ukuran benih awal.'
  }
};

const inputStyle = "w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold text-lg placeholder:text-slate-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm";
const labelStyle = "block text-[10px] font-black uppercase text-blue-600 ml-2 mb-1 tracking-widest";

const FeedRequirementCalc: React.FC = () => {
  const [fishType, setFishType] = useState<FishType>('Lele');
  const [jumlahIkan, setJumlahIkan] = useState('');
  const [sr, setSr] = useState('90');
  const [beratTarget, setBeratTarget] = useState('');
  const [bulanPanen, setBulanPanen] = useState('3');

  const qty = parseFloat(jumlahIkan) || 0;
  const survival = parseFloat(sr) || 0;
  const weightPerFish = parseFloat(beratTarget) || 0;
  const months = parseFloat(bulanPanen) || 1;
  const fcr = fishPresets[fishType].fcr;

  const totalBiomassHarvest = (qty * (survival / 100) * weightPerFish) / 1000;
  const totalFeed = totalBiomassHarvest * fcr;
  const monthlyFeed = totalFeed / months;
  const dailyFeed = monthlyFeed / 30;

  // Fungsi untuk mendapatkan pesan saran berdasarkan jenis ikan
  const getFishAdvice = () => {
    const fishData = fishPresets[fishType];
    const currentMonths = months;
    
    if (currentMonths < fishData.minHarvestMonth) {
      return `⚠️ Waktu panen terlalu cepat! ${fishData.name} ${fishData.description.toLowerCase()}`;
    } else if (currentMonths > fishData.maxHarvestMonth) {
      return `⚠️ Waktu panen terlalu lama! ${fishData.name} ${fishData.description.toLowerCase()}`;
    } else {
      return `✅ Waktu panen ${currentMonths} bulan sesuai untuk ${fishData.name}. ${fishData.description}`;
    }
  };

  // Fungsi untuk mendapatkan pola pakan berdasarkan bulan
  const getFeedingPattern = () => {
    const monthsCount = Math.floor(months);
    const fishData = fishPresets[fishType];
    
    // Untuk Lele dan Nila (2-3 bulan)
    if (fishType === 'Lele' || fishType === 'Nila') {
      const phases = [];
      if (monthsCount >= 1) phases.push({ phase: 'Bulan 1 (benih)', percentage: 15, desc: 'Pakan halus, frekuensi 4x/hari' });
      if (monthsCount >= 2) phases.push({ phase: 'Bulan 2', percentage: 40, desc: 'Pelet ukuran kecil, pakan meningkat pesat' });
      if (monthsCount >= 3) phases.push({ phase: 'Bulan 3', percentage: 45, desc: 'Puncak konsumsi, menjelang panen' });
      return { title: `📊 Pola Pakan ${fishData.name} (${monthsCount} bulan)`, phases };
    }
    
    // Untuk Mas dan Patin (3-6 bulan)
    if (fishType === 'Mas' || fishType === 'Patin') {
      const phases = [];
      if (monthsCount >= 1) phases.push({ phase: 'Bulan 1 (benih)', percentage: 10, desc: 'Pakan halus, frekuensi 3-4x/hari' });
      if (monthsCount >= 2) phases.push({ phase: 'Bulan 2', percentage: 15, desc: 'Pelet ukuran kecil, 3x/hari' });
      if (monthsCount >= 3) phases.push({ phase: 'Bulan 3-4', percentage: 35, desc: 'Pakan meningkat pesat, fase growth' });
      if (monthsCount >= 5) phases.push({ phase: `Bulan 5-${monthsCount}`, percentage: 40, desc: 'Puncak konsumsi, menjelang panen' });
      return { title: `📊 Pola Pakan ${fishData.name} (${monthsCount} bulan)`, phases };
    }
    
    // Untuk Gurame (5-8 bulan)
    if (fishType === 'Gurame') {
      const phases = [];
      if (monthsCount >= 2) phases.push({ phase: 'Bulan 1-2 (benih)', percentage: 10, desc: 'Pakan halus + cacing sutra, frekuensi 3x/hari' });
      if (monthsCount >= 4) phases.push({ phase: 'Bulan 3-4', percentage: 20, desc: 'Pelet apung 2-3mm, 3x/hari' });
      if (monthsCount >= 6) phases.push({ phase: 'Bulan 5-6', percentage: 35, desc: 'Pelet apung 4-5mm, puncak pertumbuhan' });
      if (monthsCount >= 8) phases.push({ phase: `Bulan 7-${monthsCount}`, percentage: 35, desc: 'Pelet apung + daun-daunan, menjelang panen' });
      return { title: `📊 Pola Pakan ${fishData.name} (${monthsCount} bulan)`, phases };
    }
    
    return { title: `📊 Pola Pakan ${fishData.name} (${monthsCount} bulan)`, phases: [] };
  };

  const handleNumberOnly = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setter(value);
  };

  const feedingPattern = getFeedingPattern();

  return (
    <div className="space-y-5">
      {/* Jenis Ikan - Tanpa kurung */}
      <div>
        <label className={labelStyle}>Jenis Ikan</label>
        <select value={fishType} onChange={e => setFishType(e.target.value as FishType)} className={inputStyle}>
          {Object.keys(fishPresets).map(k => (
            <option key={k} value={k}>
              {fishPresets[k as FishType].name}
            </option>
          ))}
        </select>
        {/* Informasi estimasi panen */}
        <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[9px] text-slate-500 leading-relaxed">
            📅 {fishPresets[fishType].description}
          </p>
        </div>
      </div>

      {/* Jumlah Tebar - Full Width */}
      <div>
        <label className={labelStyle}>Jumlah Tebar (Ekor)</label>
        <input type="tel" value={jumlahIkan} onChange={handleNumberOnly(setJumlahIkan)} className={inputStyle} placeholder="1000" />
      </div>

      {/* Survival Rate dan Target - 2 kolom */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelStyle}>Survival Rate (%)</label>
          <input type="tel" value={sr} onChange={handleNumberOnly(setSr)} className={inputStyle} placeholder="90" />
        </div>
        <div>
          <label className={labelStyle}>Target (Gr/Ekor)</label>
          <input type="tel" value={beratTarget} onChange={handleNumberOnly(setBeratTarget)} className={inputStyle} placeholder={fishPresets[fishType].targetWeight.toString()} />
        </div>
      </div>

      {/* Lama Budidaya - Full Width */}
      <div>
        <label className={labelStyle}>Lama Budidaya (Bulan)</label>
        <input type="tel" value={bulanPanen} onChange={handleNumberOnly(setBulanPanen)} className={inputStyle} placeholder={fishPresets[fishType].minHarvestMonth.toString()} />
      </div>

      {totalFeed > 0 && (
        <div className="space-y-4 pt-2">
          {/* Hasil Utama */}
          <div className="p-6 bg-blue-600 text-white rounded-[2.5rem] text-center shadow-xl shadow-blue-500/20">
            <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Total Kebutuhan Pakan</p>
            <p className="text-4xl font-black">{totalFeed.toLocaleString(undefined, { maximumFractionDigits: 1 })} Kg</p>
            <div className="flex justify-between mt-3 px-4 pt-3 border-t border-white/20 text-[9px] font-bold uppercase">
              <span>Target Panen: {totalBiomassHarvest.toFixed(1)} Kg</span>
              <span>FCR: {fcr}</span>
            </div>
          </div>

          {/* Rata-rata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 text-slate-700 rounded-2xl text-center border border-slate-100">
              <p className="text-[8px] font-black uppercase opacity-60">Rata Bulanan</p>
              <p className="text-xl font-black">{monthlyFeed.toFixed(1)} Kg</p>
              <p className="text-[9px] text-slate-400 mt-1">≈ {Math.round(monthlyFeed / 30)} kg/hari</p>
            </div>
            <div className="p-4 bg-slate-50 text-slate-700 rounded-2xl text-center border border-slate-100">
              <p className="text-[8px] font-black uppercase opacity-60">Rata Harian</p>
              <p className="text-xl font-black">{dailyFeed.toFixed(1)} Kg</p>
              <p className="text-[9px] text-slate-400 mt-1">Rata-rata selama {Math.floor(months * 30)} hari</p>
            </div>
          </div>

          {/* Saran Waktu Panen */}
          <div className={`p-4 rounded-xl border-l-4 ${months < fishPresets[fishType].minHarvestMonth || months > fishPresets[fishType].maxHarvestMonth ? 'bg-yellow-50 border-yellow-500' : 'bg-green-50 border-green-500'}`}>
            <p className="text-[10px] font-black uppercase tracking-wider mb-1">
              {months < fishPresets[fishType].minHarvestMonth || months > fishPresets[fishType].maxHarvestMonth ? '⚠️ SARAN' : '✅ REKOMENDASI'}
            </p>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              {getFishAdvice()}
            </p>
          </div>

          {/* KETERANGAN POLA PAKAN */}
          {feedingPattern.phases.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
              <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-2">
                {feedingPattern.title}
              </p>
              <p className="text-[10px] text-slate-600 mb-3">
                📊 Angka <strong className="text-blue-600">{dailyFeed.toFixed(1)} kg/hari</strong> adalah <strong>RATA-RATA</strong> selama {Math.floor(months * 30)} hari.
              </p>
              <div className="space-y-3">
                {feedingPattern.phases.map((phase, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[9px]">
                    <div className="w-24 font-bold text-blue-600 flex-shrink-0">{phase.phase}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${phase.percentage}%` }} />
                        </div>
                        <span className="text-blue-600 font-bold w-8">{phase.percentage}%</span>
                      </div>
                      <p className="text-slate-500 mt-0.5">{phase.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[8px] text-slate-400 mt-3 text-center">
                *Estimasi berdasarkan standar budidaya {fishPresets[fishType].name}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedRequirementCalc;
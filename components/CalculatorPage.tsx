
import React, { useState } from 'react';

type FishType = 'Nila' | 'Lele' | 'Mas' | 'Gurame' | 'Udang Vaname';
type PondType = 'Terpal' | 'Bioflok' | 'Tanah' | 'Beton';

const CalculatorPage: React.FC = () => {
  const [activeCalc, setActiveCalc] = useState<'feed' | 'profit' | 'dosage' | 'density'>('feed');

  const inputStyle = "w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold text-lg placeholder:text-slate-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm";
  const labelStyle = "block text-[10px] font-black uppercase text-blue-600 ml-2 mb-1 tracking-widest";

  // Standard FCR constants based on Indonesian CBIB/SNI
  const fishPresets: Record<FishType, { fcr: number }> = {
    'Nila': { fcr: 1.3 },
    'Lele': { fcr: 1.0 },
    'Mas': { fcr: 1.5 },
    'Gurame': { fcr: 1.8 },
    'Udang Vaname': { fcr: 1.4 }
  };

  // Stocking Density (ekor/m2 or m3) based on CBIB Standards
  const densityPresets: Record<PondType, Record<FishType, number>> = {
    'Terpal': { 'Nila': 30, 'Lele': 150, 'Mas': 20, 'Gurame': 5, 'Udang Vaname': 80 },
    'Bioflok': { 'Nila': 100, 'Lele': 800, 'Mas': 40, 'Gurame': 10, 'Udang Vaname': 150 },
    'Tanah': { 'Nila': 10, 'Lele': 50, 'Mas': 5, 'Gurame': 2, 'Udang Vaname': 40 },
    'Beton': { 'Nila': 50, 'Lele': 250, 'Mas': 30, 'Gurame': 8, 'Udang Vaname': 100 }
  };

  const FeedRequirementCalc = () => {
    const [fishType, setFishType] = useState<FishType>('Nila');
    const [jumlahIkan, setJumlahIkan] = useState('');
    const [sr, setSr] = useState('90'); 
    const [beratTarget, setBeratTarget] = useState(''); // gram per ekor
    const [bulanPanen, setBulanPanen] = useState('4');

    const qty = parseFloat(jumlahIkan) || 0;
    const survival = parseFloat(sr) || 0;
    const weightPerFish = parseFloat(beratTarget) || 0;
    const months = parseFloat(bulanPanen) || 1;
    const fcr = fishPresets[fishType].fcr;

    const totalBiomassHarvest = (qty * (survival / 100) * weightPerFish) / 1000;
    const totalFeed = totalBiomassHarvest * fcr;
    const monthlyFeed = totalFeed / months;
    const dailyFeed = monthlyFeed / 30;

    return (
      <div className="space-y-5">
        <div><label className={labelStyle}>Jenis Ikan</label>
          <select value={fishType} onChange={e => setFishType(e.target.value as FishType)} className={inputStyle}>
            {Object.keys(fishPresets).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelStyle}>Jumlah Tebar (Ekor)</label>
            <input type="number" value={jumlahIkan} onChange={e => setJumlahIkan(e.target.value)} className={inputStyle} placeholder="1000" />
          </div>
          <div><label className={labelStyle}>Survival Rate (%)</label>
            <input type="number" value={sr} onChange={e => setSr(e.target.value)} className={inputStyle} placeholder="90" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelStyle}>Target Berat (Gr/Ekor)</label>
            <input type="number" value={beratTarget} onChange={e => setBeratTarget(e.target.value)} className={inputStyle} placeholder="250" />
          </div>
          <div><label className={labelStyle}>Lama Budidaya (Bulan)</label>
            <input type="number" value={bulanPanen} onChange={e => setBulanPanen(e.target.value)} className={inputStyle} placeholder="4" />
          </div>
        </div>

        {totalFeed > 0 && (
          <div className="space-y-3 pt-2">
             <div className="p-6 bg-blue-600 text-white rounded-[2.5rem] text-center shadow-xl shadow-blue-500/20">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Total Kebutuhan Pakan</p>
                <p className="text-4xl font-black">{totalFeed.toLocaleString(undefined, {maximumFractionDigits: 1})} Kg</p>
                <div className="flex justify-between mt-3 px-4 pt-3 border-t border-white/20 text-[9px] font-bold uppercase">
                  <span>Target Panen: {totalBiomassHarvest.toFixed(1)} Kg</span>
                  <span>FCR: {fcr}</span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div className="p-4 bg-slate-50 text-slate-700 rounded-2xl text-center border border-slate-100">
                   <p className="text-[8px] font-black uppercase opacity-60">Rata Bulanan</p>
                   <p className="text-lg font-black">{monthlyFeed.toFixed(1)} Kg</p>
                </div>
                <div className="p-4 bg-slate-50 text-slate-700 rounded-2xl text-center border border-slate-100">
                   <p className="text-[8px] font-black uppercase opacity-60">Rata Harian</p>
                   <p className="text-lg font-black">{dailyFeed.toFixed(1)} Kg</p>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const ProfitLossCalc = () => {
    const [costs, setCosts] = useState({ seed: '', feed: '', labor: '', power: '', meds: '', other: '' });
    const [revenue, setRevenue] = useState({ weight: '', price: '' });

    // Fix: Explicitly type acc and val and cast Object.values to string[] to avoid 'unknown' inference in reduce
    const totalCost = (Object.values(costs) as string[]).reduce((acc: number, val: string) => acc + (parseFloat(val) || 0), 0);
    const totalRevenue = (parseFloat(revenue.weight) || 0) * (parseFloat(revenue.price) || 0);
    const profit = totalRevenue - totalCost;
    const isProfit = profit >= 0;

    return (
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Biaya Operasional (Rp)</h4>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Bibit" value={costs.seed} onChange={e => setCosts({...costs, seed: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
          <input type="number" placeholder="Pakan" value={costs.feed} onChange={e => setCosts({...costs, feed: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
          <input type="number" placeholder="Tenaga" value={costs.labor} onChange={e => setCosts({...costs, labor: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
          <input type="number" placeholder="Listrik" value={costs.power} onChange={e => setCosts({...costs, power: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
          <input type="number" placeholder="Obat" value={costs.meds} onChange={e => setCosts({...costs, meds: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
          <input type="number" placeholder="Lainnya" value={costs.other} onChange={e => setCosts({...costs, other: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 mt-4">Hasil Penjualan</h4>
        <div className="grid grid-cols-2 gap-2">
           <input type="number" placeholder="Total Kg" value={revenue.weight} onChange={e => setRevenue({...revenue, weight: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
           <input type="number" placeholder="Harga/Kg" value={revenue.price} onChange={e => setRevenue({...revenue, price: e.target.value})} className="p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
        </div>

        {totalCost > 0 && totalRevenue > 0 && (
          <div className={`p-6 rounded-[2.5rem] text-center border-2 mt-4 ${isProfit ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            <p className="text-[10px] font-black uppercase opacity-60 mb-1">{isProfit ? 'Keuntungan' : 'Kerugian'}</p>
            <p className="text-3xl font-black">Rp {Math.abs(profit).toLocaleString()}</p>
            <div className="flex justify-between mt-3 pt-3 border-t border-current/10 text-[10px] font-bold">
               <span>Modal: Rp {totalCost.toLocaleString()}</span>
               <span>Omset: Rp {totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const DosageCalc = () => {
    const [p, setP] = useState('');
    const [l, setL] = useState('');
    const [t, setT] = useState('');
    const [ppm, setPpm] = useState('');
    const volume = (parseFloat(p) || 0) * (parseFloat(l) || 0) * (parseFloat(t) || 0);
    const dosis = volume * (parseFloat(ppm) || 0);

    return (
      <div className="space-y-4">
        <label className={labelStyle}>Volume Kolam (Meter)</label>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="P" value={p} onChange={e => setP(e.target.value)} className={inputStyle}/>
          <input type="number" placeholder="L" value={l} onChange={e => setL(e.target.value)} className={inputStyle}/>
          <input type="number" placeholder="T" value={t} onChange={e => setT(e.target.value)} className={inputStyle}/>
        </div>
        <div><label className={labelStyle}>Target Dosis (ppm)</label>
          <input type="number" value={ppm} onChange={e => setPpm(e.target.value)} className={inputStyle} placeholder="mg/L" />
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

  const DensityCalc = () => {
    const [p, setP] = useState('');
    const [l, setL] = useState('');
    const [pondType, setPondType] = useState<PondType>('Terpal');
    const [fishType, setFishType] = useState<FishType>('Nila');
    
    const length = parseFloat(p) || 0;
    const width = parseFloat(l) || 0;
    const area = length * width;
    const densityLimit = densityPresets[pondType][fishType];
    const estimate = Math.floor(area * densityLimit);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelStyle}>Jenis Kolam</label>
            <select value={pondType} onChange={e => setPondType(e.target.value as PondType)} className={inputStyle}>
              <option value="Terpal">Kolam Terpal</option>
              <option value="Bioflok">Bioflok</option>
              <option value="Beton">Kolam Beton</option>
              <option value="Tanah">Kolam Tanah</option>
            </select>
          </div>
          <div><label className={labelStyle}>Jenis Ikan</label>
            <select value={fishType} onChange={e => setFishType(e.target.value as FishType)} className={inputStyle}>
              {Object.keys(fishPresets).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelStyle}>Panjang (m)</label>
            <input type="number" value={p} onChange={e => setP(e.target.value)} className={inputStyle} placeholder="0" />
          </div>
          <div><label className={labelStyle}>Lebar (m)</label>
            <input type="number" value={l} onChange={e => setL(e.target.value)} className={inputStyle} placeholder="0" />
          </div>
        </div>
        {estimate > 0 && (
          <div className="p-6 bg-blue-50 text-blue-700 rounded-[2rem] text-center border border-blue-100 shadow-inner">
            <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Padat Tebar CBIB</p>
            <p className="text-5xl font-black">{estimate.toLocaleString()}</p>
            <p className="text-xs font-black mt-2 uppercase tracking-widest">Ekor Ikan {fishType}</p>
            <div className="mt-3 py-2 px-4 bg-white/50 rounded-xl inline-block">
               <p className="text-[9px] font-bold text-slate-500 uppercase">Rekomendasi {pondType}</p>
               <p className="text-[10px] font-black text-blue-600">{densityLimit} ekor/m²</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-24 p-4">
      <div className="flex overflow-x-auto gap-2 mb-6 no-scrollbar p-1">
        {[
          {id: 'feed', label: 'Pakan'},
          {id: 'profit', label: 'Untung-Rugi'},
          {id: 'dosage', label: 'Dosis'},
          {id: 'density', label: 'Tebar'}
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveCalc(tab.id as any)} 
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-all flex-shrink-0 ${
              activeCalc === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-400 border border-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 min-h-[500px] animate-in fade-in zoom-in-95">
        {activeCalc === 'feed' && <FeedRequirementCalc />}
        {activeCalc === 'profit' && <ProfitLossCalc />}
        {activeCalc === 'dosage' && <DosageCalc />}
        {activeCalc === 'density' && <DensityCalc />}
      </div>
    </div>
  );
};

export default CalculatorPage;

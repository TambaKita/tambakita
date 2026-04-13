import React, { useState } from 'react';

const ProfitLossCalc: React.FC = () => {
  const [costs, setCosts] = useState({ seed: '', feed: '', labor: '', power: '', meds: '', other: '' });
  const [revenue, setRevenue] = useState({ weight: '', price: '' });

  // Fungsi untuk format angka ke Rupiah (contoh: 5000000 -> 5.000.000)
  const formatRupiah = (angka: string) => {
    if (!angka) return '';
    const number = parseFloat(angka.replace(/\./g, ''));
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('id-ID').format(number);
  };

  // Fungsi untuk hapus format sebelum disimpan ke state
  const unformatRupiah = (value: string) => {
    return value.replace(/\./g, '').replace(/[^0-9]/g, '');
  };

  const handleNumberChange = (setter: any, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = unformatRupiah(e.target.value);
    setter((prev: any) => ({ ...prev, [field]: rawValue }));
  };

  // Parse nilai untuk perhitungan
  const seed = parseFloat(costs.seed) || 0;
  const feed = parseFloat(costs.feed) || 0;
  const labor = parseFloat(costs.labor) || 0;
  const power = parseFloat(costs.power) || 0;
  const meds = parseFloat(costs.meds) || 0;
  const other = parseFloat(costs.other) || 0;
  
  const totalCost = seed + feed + labor + power + meds + other;
  const totalRevenue = (parseFloat(revenue.weight) || 0) * (parseFloat(revenue.price) || 0);
  const profit = totalRevenue - totalCost;
  const isProfit = profit >= 0;

  const inputStyle = "p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Biaya Operasional (Rp)</h4>
      <div className="grid grid-cols-2 gap-2">
        <input 
          type="tel" 
          placeholder="Bibit" 
          value={costs.seed ? formatRupiah(costs.seed) : ''} 
          onChange={handleNumberChange(setCosts, 'seed')} 
          className={inputStyle} 
        />
        <input 
          type="tel" 
          placeholder="Pakan" 
          value={costs.feed ? formatRupiah(costs.feed) : ''} 
          onChange={handleNumberChange(setCosts, 'feed')} 
          className={inputStyle} 
        />
        <input 
          type="tel" 
          placeholder="Tenaga" 
          value={costs.labor ? formatRupiah(costs.labor) : ''} 
          onChange={handleNumberChange(setCosts, 'labor')} 
          className={inputStyle} 
        />
        <input 
          type="tel" 
          placeholder="Listrik" 
          value={costs.power ? formatRupiah(costs.power) : ''} 
          onChange={handleNumberChange(setCosts, 'power')} 
          className={inputStyle} 
        />
        <input 
          type="tel" 
          placeholder="Obat" 
          value={costs.meds ? formatRupiah(costs.meds) : ''} 
          onChange={handleNumberChange(setCosts, 'meds')} 
          className={inputStyle} 
        />
        <input 
          type="tel" 
          placeholder="Lainnya" 
          value={costs.other ? formatRupiah(costs.other) : ''} 
          onChange={handleNumberChange(setCosts, 'other')} 
          className={inputStyle} 
        />
      </div>

      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 mt-4">Hasil Penjualan</h4>
      <div className="grid grid-cols-2 gap-2">
        <input 
          type="tel" 
          placeholder="Total Kg" 
          value={revenue.weight} 
          onChange={(e) => setRevenue({...revenue, weight: e.target.value.replace(/[^0-9]/g, '')})} 
          className={inputStyle} 
        />
        <input 
          type="tel" 
          placeholder="Harga/Kg" 
          value={revenue.price ? formatRupiah(revenue.price) : ''} 
          onChange={(e) => {
            const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
            setRevenue({...revenue, price: raw});
          }} 
          className={inputStyle} 
        />
      </div>

      {(totalCost > 0 || totalRevenue > 0) && (
        <div className={`p-6 rounded-[2.5rem] text-center border-2 mt-4 ${isProfit ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : profit < 0 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
          <p className="text-[10px] font-black uppercase opacity-60 mb-1">
            {profit > 0 ? 'Keuntungan' : profit < 0 ? 'Kerugian' : 'Impas'}
          </p>
          <p className="text-3xl font-black">Rp {Math.abs(profit).toLocaleString('id-ID')}</p>
          <div className="flex justify-between mt-3 pt-3 border-t border-current/10 text-[10px] font-bold">
            <span>Modal: Rp {totalCost.toLocaleString('id-ID')}</span>
            <span>Omset: Rp {totalRevenue.toLocaleString('id-ID')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossCalc;
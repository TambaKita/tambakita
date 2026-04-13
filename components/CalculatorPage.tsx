import React, { useState } from 'react';
import FeedRequirementCalc from './FeedRequirementCalc';
import ProfitLossCalc from './ProfitLossCalc';
import DosageCalc from './DosageCalc';
import DensityCalc from './DensityCalc';

const CalculatorPage: React.FC = () => {
  const [activeCalc, setActiveCalc] = useState<'feed' | 'profit' | 'dosage' | 'density'>('feed');

  return (
    <div className="pb-24 p-4">
      <div className="flex overflow-x-auto gap-2 mb-6 no-scrollbar p-1">
        {[
          { id: 'feed', label: 'Pakan' },
          { id: 'profit', label: 'Untung-Rugi' },
          { id: 'dosage', label: 'Dosis' },
          { id: 'density', label: 'Tebar' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCalc(tab.id as any)}
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-all flex-shrink-0 ${activeCalc === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-400 border border-slate-100'
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
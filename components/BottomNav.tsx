
import React from 'react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: NavTab.Dashboard, icon: 'fa-chart-pie', label: 'Dashboard' },
    { id: NavTab.Activity, icon: 'fa-calendar-check', label: 'Harian' },
    { id: NavTab.Calculator, icon: 'fa-calculator', label: 'Kalkulator' },
    { id: NavTab.Community, icon: 'fa-users', label: 'Diskusi' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg safe-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
              activeTab === tab.id ? 'text-blue-600 scale-110' : 'text-gray-400'
            }`}
          >
            <i className={`fas ${tab.icon} text-xl`}></i>
            <span className="text-[10px] mt-1 font-bold">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

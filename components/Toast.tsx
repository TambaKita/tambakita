import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 1500); // ← 1,5 DETIK
    
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const bgColor = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500'
  }[type];

  const icon = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-triangle-exclamation',
    info: 'fa-info-circle'
  }[type];

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] bg-white rounded-2xl shadow-xl flex justify-between items-center animate-in slide-in-from-top-2 overflow-hidden">
      <div className={`w-1.5 h-full absolute left-0 top-0 bottom-0 ${bgColor}`}></div>
      <div className="flex items-center gap-3 pl-5 pr-4 py-3">
        <i className={`fas ${icon} text-base ${type === 'success' ? 'text-emerald-500' : type === 'error' ? 'text-rose-500' : type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`}></i>
        <span className="text-sm font-bold text-slate-700">{message}</span>
      </div>
      <button onClick={() => { setIsVisible(false); onClose(); }} className="text-slate-400 hover:text-slate-600 pr-4">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Toast;
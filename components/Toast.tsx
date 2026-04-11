import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = 
    type === 'success' ? 'bg-emerald-500' : 
    type === 'error' ? 'bg-rose-500' : 
    'bg-amber-500';

  const icon = 
    type === 'success' ? 'fa-check-circle' : 
    type === 'error' ? 'fa-exclamation-circle' : 
    'fa-info-circle';

  return (
    <div className={`fixed top-4 left-4 right-4 z-[200] ${bgColor} text-white p-4 rounded-2xl shadow-lg flex justify-between items-center animate-in slide-in-from-top-2`}>
      <div className="flex items-center gap-3">
        <i className={`fas ${icon} text-lg`}></i>
        <span className="text-sm font-bold">{message}</span>
      </div>
      <button onClick={onClose} className="text-white/80 hover:text-white">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Toast;

import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AskAIPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Halo! Saya pakar budidaya TambaKita. Bagaimana kondisi kolam Anda hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);
    try {
      const response = await chatWithAI([], userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response || "Sedang ada gangguan." }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: "Error server AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] bg-slate-50 relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-1 p-2">
            <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce delay-75"></div>
            <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce delay-150"></div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </div>
      
      {/* Input container exactly above navigation */}
      <div className="p-3 bg-white border-t border-slate-100 sticky bottom-0 left-0 right-0 z-10">
        <div className="flex gap-2 max-w-md mx-auto">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && handleSend()} 
            placeholder="Tanyakan masalah perikanan..." 
            className="flex-1 bg-slate-50 p-4 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all border border-slate-100" 
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading} 
            className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AskAIPage;


import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage, User } from '../types';

interface MessagesPageProps {
  user: User;
  initialChatWith?: User | null;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ user, initialChatWith }) => {
  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem('tambakita_dms');
    return saved ? JSON.parse(saved) : [];
  });

  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialChatWith?.id || null);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('tambakita_dms', JSON.stringify(messages));
    if (activePartnerId) {
      // Mark as read when opening chat
      const updated = messages.map(m => (m.receiverId === user.id && m.senderId === activePartnerId) ? { ...m, isRead: true } : m);
      if (JSON.stringify(updated) !== JSON.stringify(messages)) setMessages(updated);
    }
  }, [messages, activePartnerId, user.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activePartnerId, messages]);

  const partners = messages.reduce((acc: {id: string, name: string, lastMsg: string, time: string, unread: boolean}[], m) => {
    const partnerId = m.senderId === user.id ? m.receiverId : m.senderId;
    const partnerName = m.senderId === user.id ? m.receiverName : m.senderName;
    const isUnread = m.receiverId === user.id && !m.isRead;
    
    const existing = acc.find(p => p.id === partnerId);
    if (!existing) {
      acc.push({ id: partnerId, name: partnerName, lastMsg: m.content, time: m.timestamp, unread: isUnread });
    } else {
      existing.unread = existing.unread || isUnread;
      // update last message if timestamp is later
      if (new Date(m.timestamp) > new Date(existing.time)) {
        existing.lastMsg = m.content;
        existing.time = m.timestamp;
      }
    }
    return acc;
  }, []).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  if (initialChatWith && !partners.find(p => p.id === initialChatWith.id)) {
    partners.unshift({ id: initialChatWith.id, name: initialChatWith.name, lastMsg: 'Mulai obrolan...', time: new Date().toISOString(), unread: false });
  }

  const activeChat = messages.filter(m => 
    (m.senderId === user.id && m.receiverId === activePartnerId) || 
    (m.senderId === activePartnerId && m.receiverId === user.id)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const handleSend = () => {
    if (!inputText.trim() || !activePartnerId) return;
    const partner = partners.find(p => p.id === activePartnerId);
    const newDm: DirectMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      receiverId: activePartnerId,
      receiverName: partner?.name || 'Unknown',
      content: inputText,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setMessages([...messages, newDm]);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white overflow-hidden">
      {!activePartnerId ? (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-5 py-6">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Pesan</h2>
            <div className="space-y-1">
              {partners.length === 0 ? (
                <div className="text-center py-20">
                  <i className="far fa-comments text-5xl text-slate-100 mb-4"></i>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Belum ada obrolan</p>
                </div>
              ) : partners.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => setActivePartnerId(p.id)}
                  className="w-full flex items-center gap-4 p-4 active:bg-slate-50 transition-colors rounded-2xl relative"
                >
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xl flex-shrink-0">
                    {p.name[0]}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-800">{p.name}</h3>
                      <span className="text-[10px] text-slate-300 font-bold">
                        {new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs truncate pr-4 ${p.unread ? 'font-black text-slate-900' : 'text-slate-400'}`}>
                      {p.lastMsg}
                    </p>
                  </div>
                  {p.unread && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full absolute right-4 top-1/2 -translate-y-1/2 shadow-lg shadow-blue-500/30"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col animate-in slide-in-from-right">
          <div className="h-16 flex items-center px-4 border-b border-slate-50">
             <button onClick={() => setActivePartnerId(null)} className="w-10 h-10 flex items-center justify-center text-slate-800">
                <i className="fas fa-chevron-left"></i>
             </button>
             <div className="flex items-center gap-3 ml-2">
                <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm">
                   {partners.find(p => p.id === activePartnerId)?.name[0]}
                </div>
                <h3 className="font-black text-sm text-slate-800 uppercase tracking-widest">
                  {partners.find(p => p.id === activePartnerId)?.name}
                </h3>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-slate-50/50">
            {activeChat.map(msg => (
              <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-4 rounded-3xl shadow-sm relative ${msg.senderId === user.id ? 'bg-blue-600 text-white rounded-tr-lg' : 'bg-white text-slate-800 rounded-tl-lg border border-slate-100'}`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-50 safe-bottom">
            <div className="flex gap-2 max-w-md mx-auto items-end">
              <textarea 
                rows={1}
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                placeholder="Kirim pesan..." 
                className="flex-1 bg-slate-100 p-4 rounded-3xl text-sm font-bold outline-none border-none resize-none max-h-32" 
              />
              <button onClick={handleSend} className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-90 flex-shrink-0 transition-transform">
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;

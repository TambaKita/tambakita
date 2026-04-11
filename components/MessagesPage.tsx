import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../src/lib/supabase';

interface User {
  id: string;
  name: string;
}

interface DirectMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface MessagesPageProps {
  user: User;
  initialChatWith?: User | null;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ user, initialChatWith }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialChatWith?.id || null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<any[]>([]);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getDeletedChats = useCallback(() => {
    const deleted = localStorage.getItem(`deleted_chats_${user?.id}`);
    return deleted ? JSON.parse(deleted) : [];
  }, [user?.id]);

  const saveDeletedChats = useCallback((deletedChats: string[]) => {
    localStorage.setItem(`deleted_chats_${user?.id}`, JSON.stringify(deletedChats));
  }, [user?.id]);

  const fetchMessages = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetch messages:', error);
    } else {
      setMessages(data || []);
      
      let deletedChats = getDeletedChats();
      
      // Cek partner mana yang punya pesan (biar yang dihapus bisa muncul kembali)
      const activePartnersFromMessages = new Set();
      (data || []).forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        activePartnersFromMessages.add(partnerId);
      });
      
      // Hapus dari deletedChats jika partner tersebut punya pesan
      let needUpdate = false;
      const updatedDeletedChats = deletedChats.filter(id => {
        if (activePartnersFromMessages.has(id)) {
          needUpdate = true;
          return false;
        }
        return true;
      });
      
      if (needUpdate) {
        saveDeletedChats(updatedDeletedChats);
        deletedChats = updatedDeletedChats;
      }
      
      const partnerMap = new Map();
      
      (data || []).forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        // Skip jika partner ini dihapus
        if (deletedChats.includes(partnerId)) return;
        
        const partnerName = msg.sender_id === user.id ? msg.receiver_name : msg.sender_name;
        const isUnread = msg.receiver_id === user.id && !msg.is_read;
        
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, {
            id: partnerId,
            name: partnerName,
            lastMsg: msg.content,
            time: msg.created_at,
            unread: isUnread
          });
        } else {
          const existing = partnerMap.get(partnerId);
          existing.unread = existing.unread || isUnread;
          // Update lastMsg jika waktu lebih baru
          if (new Date(msg.created_at) > new Date(existing.time)) {
            existing.lastMsg = msg.content;
            existing.time = msg.created_at;
          }
        }
      });
      
      // Urutkan dari yang terbaru ke terlama
      const sortedPartners = Array.from(partnerMap.values()).sort((a, b) => 
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      
      setPartners(sortedPartners);
    }
    setLoading(false);
  }, [user?.id, getDeletedChats, saveDeletedChats]);

  const handleSend = async () => {
    if (!inputText.trim() || !activePartnerId) return;
    
    const deletedChats = getDeletedChats();
    if (deletedChats.includes(activePartnerId)) {
      saveDeletedChats(deletedChats.filter(id => id !== activePartnerId));
    }
    
    const partner = partners.find(p => p.id === activePartnerId);
    const newMessage = {
      sender_id: user.id,
      sender_name: user.name,
      receiver_id: activePartnerId,
      receiver_name: partner?.name || 'Unknown',
      content: inputText,
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    const { error } = await supabase
      .from('direct_messages')
      .insert(newMessage);
    
    if (error) {
      console.error('Error send message:', error);
      alert('Gagal kirim pesan: ' + error.message);
    } else {
      setInputText('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      fetchMessages();
    }
  };

  const handleClearChat = async () => {
    if (!activePartnerId) return;
    
    const deletedChats = getDeletedChats();
    if (!deletedChats.includes(activePartnerId)) {
      saveDeletedChats([...deletedChats, activePartnerId]);
    }
    
    setActivePartnerId(null);
    fetchMessages();
    setShowClearChatModal(false);
  };

  const markAsRead = async () => {
    if (!activePartnerId) return;
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', activePartnerId)
      .eq('is_read', false);
    fetchMessages();
  };

  // Subscribe realtime
  useEffect(() => {
    if (!user?.id) return;
    
    fetchMessages();
    
    const channel = supabase
      .channel('direct_messages_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => fetchMessages())
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchMessages]);

  useEffect(() => {
    const handleFocus = () => fetchMessages();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchMessages]);

  useEffect(() => {
    if (activePartnerId) markAsRead();
  }, [activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeChat = messages.filter(m => 
    (m.sender_id === user.id && m.receiver_id === activePartnerId) || 
    (m.sender_id === activePartnerId && m.receiver_id === user.id)
  );

  useEffect(() => {
    if (initialChatWith && !partners.find(p => p.id === initialChatWith.id)) {
      const deletedChats = getDeletedChats();
      if (deletedChats.includes(initialChatWith.id)) {
        saveDeletedChats(deletedChats.filter(id => id !== initialChatWith.id));
      }
      setActivePartnerId(initialChatWith.id);
      fetchMessages();
    }
  }, [initialChatWith, partners, fetchMessages, getDeletedChats, saveDeletedChats]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading && !activePartnerId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {showClearChatModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="bg-red-600 p-5 text-white text-center">
              <i className="fas fa-trash-alt text-3xl mb-2"></i>
              <h3 className="font-black text-lg uppercase tracking-widest">Hapus Obrolan</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-slate-600 font-medium">
                Yakin ingin menghapus obrolan dengan {partners.find(p => p.id === activePartnerId)?.name}?
                <br />
                <span className="text-xs text-slate-400">Obrolan akan hilang dari daftar pesan Anda.</span>
              </p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowClearChatModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase">Batal</button>
                <button onClick={handleClearChat} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase shadow-lg">Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!activePartnerId ? (
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-6 pb-28">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Pesan</h2>
            {partners.length === 0 ? (
              <div className="text-center py-20">
                <i className="far fa-comments text-5xl text-slate-100 mb-4"></i>
                <p className="text-slate-400 font-bold text-sm">Belum ada obrolan</p>
              </div>
            ) : (
              partners.map(p => (
                <button key={p.id} onClick={() => setActivePartnerId(p.id)} className="w-full flex items-center gap-4 p-4 active:bg-slate-50 rounded-2xl text-left">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xl">
                    {p.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-black text-slate-800">{p.name}</h3>
                      <span className="text-[10px] text-slate-300">{new Date(p.time).toLocaleTimeString()}</span>
                    </div>
                    <p className={`text-xs truncate ${p.unread ? 'font-black text-slate-900' : 'text-slate-400'}`}>{p.lastMsg}</p>
                  </div>
                  {p.unread && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full relative">
          <div className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b bg-white">
            <div className="flex items-center">
              <button onClick={() => setActivePartnerId(null)} className="w-10 h-10"><i className="fas fa-chevron-left text-lg"></i></button>
              <div className="flex items-center gap-3 ml-2">
                <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black">
                  {partners.find(p => p.id === activePartnerId)?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <h3 className="font-black">{partners.find(p => p.id === activePartnerId)?.name}</h3>
              </div>
            </div>

          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-3 bg-slate-50/50" style={{ paddingBottom: '120px' }}>
            {activeChat.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <i className="far fa-comment-dots text-4xl text-slate-200 mb-3"></i>
                <p className="text-slate-400 text-xs font-bold">Belum ada pesan</p>
                <p className="text-slate-300 text-[10px] mt-1">Mulai kirim pesan sekarang</p>
              </div>
            ) : (
              activeChat.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl ${msg.sender_id === user.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white rounded-bl-none border border-slate-100'}`}>
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className={`text-[9px] mt-1 ${msg.sender_id === user.id ? 'text-blue-200' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-3 shadow-lg" style={{ marginBottom: '60px' }}>
            <div className="flex gap-2 items-end">
              <textarea ref={inputRef} rows={1} value={inputText} onChange={e => { setInputText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }} onKeyPress={handleKeyPress} placeholder="Ketik pesan..." className="flex-1 bg-slate-100 p-3 rounded-2xl text-sm font-medium outline-none resize-none max-h-24 focus:ring-2 focus:ring-blue-100" />
              <button onClick={handleSend} disabled={!inputText.trim()} className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-50 disabled:active:scale-100"><i className="fas fa-paper-plane"></i></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
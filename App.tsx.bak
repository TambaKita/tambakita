import React, { useState, useEffect, useMemo, useRef } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import ActivityPage from './components/ActivityPage';
import CalculatorPage from './components/CalculatorPage';
import ForumPage from './components/ForumPage';
import ProfilePage from './components/ProfilePage';
import MessagesPage from './components/MessagesPage';
import AuthPage from './components/AuthPage';
import { NavTab, User, Pond, DirectMessage, AppNotification } from './types';
import { authService } from './services/authService';
import { supabase } from './src/lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.Dashboard);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // === AMBIL DATA KOLAM DARI SUPABASE ===
  const fetchPonds = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('ponds')
        .select('*');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setPonds([]);
        return;
      }
      
      // Format data sesuai tipe Pond
      const formattedPonds: Pond[] = data.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        type: item.type || 'Bioflok',
        size: item.size || 'D3 (Standard)',
        ownerId: item.owner_id,
        ownerName: item.owner_name || '',
        fishType: item.fish_type || 'Nila',
        fishCount: item.fish_count || 0,
        members: item.members || [],
        customFeeds: item.custom_feeds || ['LP-1', 'LP-2', 'LP-3'],
        currentMetrics: item.current_metrics || { 
          ph: 7, 
          temp: 28, 
          ammonia: 0, 
          do: 5, 
          lastUpdated: new Date().toISOString() 
        },
        inviteCode: item.invite_code,
        inviteCodeExpiry: item.invite_code_expiry ? new Date(item.invite_code_expiry).getTime() : undefined
      }));
      
      // Filter kolam yang user punya akses
      const myPonds = formattedPonds.filter(p => 
        p.members?.some((m: any) => m.id === user.id) || p.ownerId === user.id
      );
      
      setPonds(myPonds);
      
    } catch (error) {
      console.error('❌ Gagal mengambil ponds:', error);
    }
  };

  // Polling ponds setiap 3 detik
  useEffect(() => {
    if (!user) return;
    fetchPonds();
    const interval = setInterval(fetchPonds, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Sinkronisasi messages dari localStorage (tetap)
  useEffect(() => {
    const savedDms = localStorage.getItem('tambakita_dms');
    if (savedDms) setMessages(JSON.parse(savedDms));
  }, [activeTab]);

  // Urgent alerts dari data ponds realtime
  const urgentAlerts = useMemo(() => {
    if (!user) return [];
    const alerts: { pondName: string; issue: string }[] = [];
    
    ponds.forEach(p => {
      const m = p.currentMetrics;
      if (m) {
        const issues = [];
        if (m.ph < 6.5 || m.ph > 8.5) issues.push(`pH (${m.ph}) tidak normal`);
        if (m.do < 5) issues.push(`DO (${m.do}) terlalu rendah`);
        if (m.ammonia > 0.1) issues.push(`Amonia (${m.ammonia}) terlalu tinggi`);
        
        if (issues.length > 0) {
          alerts.push({ pondName: p.name, issue: issues.join(', ') });
        }
      }
    });
    
    return alerts;
  }, [ponds, user]);

  const [lastAlertCount, setLastAlertCount] = useState(0);
  useEffect(() => {
    if (urgentAlerts.length > lastAlertCount) {
      console.log('🔴 DANGER DETECTED! Memainkan alarm...');
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.volume = 1.0;
      }
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.log('Audio play blocked:', e));
      }
      setShowUrgentModal(true);
    }
    setLastAlertCount(urgentAlerts.length);
  }, [urgentAlerts]);

  // Inisialisasi autentikasi
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  // === AMBIL NOTIFIKASI DARI SUPABASE ===
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const appNotifs: AppNotification[] = (data || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        fromName: n.from_name,
        postExcerpt: n.post_excerpt,
        timestamp: n.created_at,
        isRead: n.is_read
      }));

      setNotifications(appNotifs);
    } catch (error) {
      console.error('Gagal mengambil notifikasi:', error);
    }
  };

  // Polling notifikasi setiap 3 detik
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadMsgCount = useMemo(
    () => messages.filter(m => m.receiverId === user?.id && !m.isRead).length,
    [messages, user]
  );
  
  const unreadNotifCount = useMemo(
    () => notifications.filter(n => n.userId === user?.id && !n.isRead).length,
    [notifications, user]
  );

  const handleOpenChat = (partner: User) => {
    setChatPartner(partner);
    setActiveTab(NavTab.Messages);
  };

  const markNotifsAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      
      setNotifications(prev => prev.map(n => 
        n.userId === user.id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Gagal menandai notifikasi dibaca:', error);
    }
  };

  if (isInitializing)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
    
  if (!user) return <AuthPage onAuthSuccess={setUser} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {urgentAlerts.length > 0 && (
        <div className="bg-rose-600 text-white px-4 py-3 flex items-center justify-center gap-3 animate-pulse text-[10px] font-black uppercase tracking-widest z-[60] shadow-xl border-b border-rose-700">
          <i className="fas fa-triangle-exclamation text-base"></i>
          DANGER: {urgentAlerts[0].pondName} Kritis!
          <button
            onClick={() => setShowUrgentModal(true)}
            className="bg-white/20 px-3 py-1 rounded-full font-black ml-2 border border-white/30 active:scale-95"
          >
            DETAIL
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-5 h-20 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 logo-gradient rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
              <i className="fas fa-droplet text-white/40 text-xl absolute translate-y-0.5"></i>
            </div>
            <div className="relative z-10">
              <i className="fas fa-fish-fins text-white text-base transform -rotate-12"></i>
            </div>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tighter">
            Tamba<span className="text-blue-600">Kita</span>
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setActiveTab(NavTab.Messages)}
            className={`w-11 h-11 flex items-center justify-center relative rounded-xl transition-all ${
              activeTab === NavTab.Messages ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
            }`}
          >
            <i className="far fa-comment-dots text-xl"></i>
            {unreadMsgCount > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-black">
                {unreadMsgCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setShowNotifModal(true);
              markNotifsAsRead();
            }}
            className={`w-11 h-11 flex items-center justify-center relative rounded-xl transition-all ${
              unreadNotifCount > 0 ? 'bg-rose-50 text-rose-500' : 'text-slate-400'
            }`}
          >
            <i className="far fa-bell text-xl"></i>
            {unreadNotifCount > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-black">
                {unreadNotifCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab(NavTab.Profile)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
              activeTab === NavTab.Profile
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                : 'bg-slate-50 text-slate-400 border border-slate-100 active:scale-90'
            }`}
          >
            {user.name?.[0]?.toUpperCase()}
          </button>
        </div>
      </header>

      {showNotifModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
            <div className="bg-blue-600 p-6 text-white text-center">
              <h3 className="text-lg font-black uppercase tracking-widest leading-none">Notifikasi</h3>
            </div>
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.filter(n => n.userId === user.id).length === 0 ? (
                <p className="text-center py-10 text-slate-300 font-bold text-sm uppercase">
                  Belum ada aktifitas.
                </p>
              ) : (
                notifications
                  .filter(n => n.userId === user.id)
                  .map(n => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-[1.5rem] border flex gap-4 transition-all ${
                        n.type === 'danger' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          n.type === 'like'
                            ? 'bg-rose-100 text-rose-500'
                            : n.type === 'danger'
                            ? 'bg-rose-600 text-white animate-pulse shadow-lg'
                            : 'bg-blue-100 text-blue-500'
                        }`}
                      >
                        <i
                          className={`fas ${
                            n.type === 'like'
                              ? 'fa-heart'
                              : n.type === 'danger'
                              ? 'fa-triangle-exclamation'
                              : 'fa-comment'
                          }`}
                        ></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className={`text-[10px] font-black uppercase tracking-tighter ${
                              n.type === 'danger' ? 'text-rose-600' : 'text-blue-600'
                            }`}
                          >
                            {n.type === 'danger' ? 'DANGER ALERT' : n.fromName}
                          </p>
                          {!n.isRead && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                        </div>
                        <p
                          className={`text-[11px] leading-tight ${
                            n.type === 'danger' ? 'text-slate-900 font-black' : 'text-slate-700 font-medium'
                          }`}
                        >
                          {n.type === 'danger' ? (
                            n.postExcerpt
                          ) : (
                            <>
                              {n.type === 'like'
                                ? 'menyukai'
                                : n.type === 'reply'
                                ? 'membalas'
                                : 'mengomentari'}{' '}
                              postingan Anda.
                            </>
                          )}
                        </p>
                        {n.postExcerpt && n.type !== 'danger' && (
                          <p className="text-[10px] text-slate-400 font-bold italic mt-1 truncate max-w-[150px]">
                            "{n.postExcerpt}"
                          </p>
                        )}
                        <p className="text-[8px] text-slate-300 font-black mt-1 uppercase tracking-tighter">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <div className="p-4">
              <button
                onClick={() => setShowNotifModal(false)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase active:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showUrgentModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden border border-rose-500/20">
            <div className="bg-rose-600 p-8 text-white text-center">
              <i className="fas fa-triangle-exclamation text-5xl mb-3 animate-bounce"></i>
              <h3 className="text-xl font-black uppercase tracking-widest leading-none">Status Kritis!</h3>
              <p className="text-[10px] font-bold opacity-70 mt-2 uppercase tracking-tighter">
                Butuh Tindakan Segera
              </p>
            </div>
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto no-scrollbar">
              {urgentAlerts.map((a, i) => (
                <div key={i} className="flex gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-200">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i className="fas fa-water"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-tighter">
                      {a.pondName}
                    </p>
                    <p className="text-xs font-black text-slate-800 mt-1 leading-relaxed">{a.issue}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4">
              <button
                onClick={() => setShowUrgentModal(false)}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                SAYA MENGERTI
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-md mx-auto">
          {activeTab === NavTab.Dashboard && <Dashboard user={user} />}
          {activeTab === NavTab.Activity && <ActivityPage user={user} />}
          {activeTab === NavTab.Calculator && <CalculatorPage />}
          {activeTab === NavTab.Community && <ForumPage user={user} onOpenChat={handleOpenChat} />}
          {activeTab === NavTab.Profile && (
            <ProfilePage
              user={user}
              onLogout={() => {
                authService.logout();
                setUser(null);
              }}
              onUpdateUser={setUser}
            />
          )}
          {activeTab === NavTab.Messages && <MessagesPage user={user} initialChatWith={chatPartner} />}
        </div>
      </main>
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setChatPartner(null);
          setActiveTab(tab);
        }}
      />
    </div>
  );
};

export default App;
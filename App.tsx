import React, { useState, useEffect, useMemo, useRef } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import ActivityPage from './components/ActivityPage';
import CalculatorPage from './components/CalculatorPage';
import ProfilePage from './components/ProfilePage';
import AuthPage from './components/AuthPage';
import AuthCallback from './components/AuthCallback';
import ResetPasswordPage from './components/ResetPasswordPage';
import { NavTab, User, Pond } from './types';
import { authService } from './services/authService';
import { supabase } from './src/lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.Dashboard);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [isAuthCallback, setIsAuthCallback] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cek apakah halaman callback atau reset password
  useEffect(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    
    if (pathname.includes('/auth/callback')) {
      setIsAuthCallback(true);
    }
    
    // Cek untuk reset password (hash dari Supabase)
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      setIsResetPassword(true);
    }
  }, []);

  // Jika halaman callback, tampilkan AuthCallback
  if (isAuthCallback) {
    return <AuthCallback />;
  }
  
  // Jika halaman reset password
  if (isResetPassword) {
    return <ResetPasswordPage onPasswordReset={() => {
      setIsResetPassword(false);
      window.location.href = '/';
    }} />;
  }

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
            onClick={() => setActiveTab(NavTab.Profile)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black transition-all overflow-hidden ${
              activeTab === NavTab.Profile
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                : 'bg-slate-50 text-slate-400 border border-slate-100 active:scale-90'
            }`}
          >
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              user.name?.[0]?.toUpperCase()
            )}
          </button>
        </div>
      </header>

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
        </div>
      </main>
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};

export default App;
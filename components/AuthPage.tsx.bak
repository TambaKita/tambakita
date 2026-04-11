import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { supabase } from '../src/lib/supabase';
import CompleteProfilePage from './CompleteProfilePage';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

interface RegionItem {
  id: string;
  name: string;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);

  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  const checkUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking profile:', error);
    }
    return data;
  };

  const handleAuthSuccess = async (authUser: any) => {
    const profile = await checkUserProfile(authUser.id);
    
    if (profile && profile.name) {
      const fullUser: User = {
        id: authUser.id,
        email: authUser.email,
        name: profile.name,
        phone: profile.phone,
        province: profile.province,
        city: profile.city,
        district: profile.district,
        village: profile.village
      };
      onAuthSuccess(fullUser);
    } else {
      setTempUser({
        id: authUser.id,
        email: authUser.email,
        name: '',
        phone: ''
      });
      setShowCompleteProfile(true);
    }
  };

  // Handle Google Login dengan deteksi WebView APK
  const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    setError('');
    
    // Deteksi apakah di WebView APK
    const userAgent = navigator.userAgent;
    const isWebView = /Android/i.test(userAgent) && 
                      !/Chrome/i.test(userAgent) &&
                      /WebView|wv/i.test(userAgent);
    
    // PAKAI HTTPS DOMAIN UNTUK SEMUA (lebih reliable)
    const redirectUrl = "https://TambaKita.github.io/tambakita/auth/callback";
    
    console.log("Redirect URL:", redirectUrl);
    console.log("Is WebView:", isWebView);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    
    if (error) throw error;
    
  } catch (err: any) {
    setError(err.message);
    setLoading(false);
  }
};
      
      if (error) throw error;
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await checkUserProfile(session.user.id);
        
        if (profile && profile.name) {
          const fullUser: User = {
            id: session.user.id,
            email: session.user.email!,
            name: profile.name,
            phone: profile.phone,
            province: profile.province,
            city: profile.city,
            district: profile.district,
            village: profile.village
          };
          onAuthSuccess(fullUser);
        } else {
          setTempUser({
            id: session.user.id,
            email: session.user.email!,
            name: '',
            phone: ''
          });
          setShowCompleteProfile(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthSuccess]);

  useEffect(() => {
    if (mode === 'signup') {
      fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
        .then(res => res.json())
        .then(data => setProvinces(data));
    }
  }, [mode]);

  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince}.json`)
        .then(res => res.json())
        .then(data => {
          setCities(data);
          setDistricts([]);
          setVillages([]);
          setSelectedCity('');
        });
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity}.json`)
        .then(res => res.json())
        .then(data => {
          setDistricts(data);
          setVillages([]);
          setSelectedDistrict('');
        });
    }
  }, [selectedCity]);

  useEffect(() => {
    if (selectedDistrict) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrict}.json`)
        .then(res => res.json())
        .then(data => setVillages(data));
    }
  }, [selectedDistrict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await authService.login(email, password);
        await handleAuthSuccess(user);
      } else if (mode === 'signup') {
        if (!name || !phone || !selectedProvince || !selectedCity) {
          throw new Error('Mohon lengkapi semua data pendaftaran');
        }
        
        const provinceName = provinces.find(p => p.id === selectedProvince)?.name || '';
        const cityName = cities.find(c => c.id === selectedCity)?.name || '';
        const districtName = districts.find(d => d.id === selectedDistrict)?.name || '';
        const villageName = villages.find(v => v.id === selectedVillage)?.name || '';

        const user = await authService.signup({
          email,
          password,
          name,
          phone,
          province: provinceName,
          city: cityName,
          district: districtName,
          village: villageName
        });
        onAuthSuccess(user);
      } else if (mode === 'forgot') {
        await authService.forgotPassword(email);
        setSuccess('Link reset password telah dikirim ke email Anda. Silakan cek kotak masuk atau spam.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showCompleteProfile && tempUser) {
    return <CompleteProfilePage user={tempUser} onComplete={onAuthSuccess} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(37,99,235,0.1)] overflow-y-auto max-h-[95vh] no-scrollbar p-8 space-y-8 border border-gray-50">
        <div className="text-center space-y-6">
          <div className="relative inline-block animate-float">
            <div className="absolute inset-[-10px] border border-blue-200 border-dashed rounded-full animate-orbit"></div>
            <div className="relative w-24 h-24 mx-auto">
              <div className="relative w-full h-full logo-gradient rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 overflow-hidden border-2 border-white">
                <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                   <i className="fas fa-droplet text-white/40 text-6xl absolute translate-y-1"></i>
                </div>
                <div className="relative z-10 animate-neon">
                  <i className="fas fa-fish-fins text-white text-4xl drop-shadow-lg transform -rotate-12"></i>
                </div>
                <div className="absolute top-0 left-0 right-0 h-1/2 glass-reflection opacity-60"></div>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">
              Tamba<span className="text-blue-600">Kita</span>
            </h1>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">Future Aquaculture</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'forgot' && (
            <p className="text-xs text-slate-500 font-medium text-center leading-relaxed">
              Masukkan email Anda yang terdaftar untuk mendapatkan instruksi pemulihan kata sandi.
            </p>
          )}

          {mode === 'signup' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Nama Lengkap</label>
                <div className="relative group">
                  <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors"></i>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all font-bold text-sm"
                    placeholder="Nama Terang"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Nomor WhatsApp</label>
                <div className="relative group">
                  <i className="fab fa-whatsapp absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors"></i>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all font-bold text-sm"
                    placeholder="0812xxxxxx"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Email</label>
            <div className="relative group">
              <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors"></i>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all font-bold text-sm"
                placeholder="nama@email.com"
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Password</label>
              <div className="relative group">
                <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors"></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all font-bold text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
              {mode === 'login' && (
                <div className="text-right px-2">
                   <button 
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
                   >
                    Lupa Password?
                   </button>
                </div>
              )}
            </div>
          )}

          {mode === 'signup' && (
            <div className="pt-2 space-y-4">
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className="h-[1px] flex-1 bg-gray-100"></span>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Lokasi Tambak</span>
                <span className="h-[1px] flex-1 bg-gray-100"></span>
              </div>

              <div className="space-y-3">
                <select 
                  value={selectedProvince} 
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all font-bold text-sm text-gray-700"
                >
                  <option value="">Provinsi</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <select 
                  value={selectedCity} 
                  disabled={!selectedProvince}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all font-bold text-sm text-gray-700 disabled:opacity-50"
                >
                  <option value="">Kota/Kabupaten</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select 
                  value={selectedDistrict} 
                  disabled={!selectedCity}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all font-bold text-sm text-gray-700 disabled:opacity-50"
                >
                  <option value="">Kecamatan</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                <select 
                  value={selectedVillage} 
                  disabled={!selectedDistrict}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-[1.2rem] focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all font-bold text-sm text-gray-700 disabled:opacity-50"
                >
                  <option value="">Kelurahan/Desa</option>
                  {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-[11px] rounded-[1rem] font-bold flex items-center gap-3 border border-red-100 animate-shake">
              <i className="fas fa-triangle-exclamation text-lg"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-600 text-[11px] rounded-[1rem] font-bold flex items-center gap-3 border border-emerald-100">
              <i className="fas fa-circle-check text-lg"></i>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-[1.2rem] font-black text-base shadow-xl shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>
                {mode === 'login' ? 'Masuk Sekarang' : mode === 'signup' ? 'Daftar Sekarang' : 'Kirim'}
              </span>
            )}
          </button>
        </form>

        {mode !== 'forgot' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atau</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-[1.2rem] font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all hover:border-blue-200 disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Lanjut dengan Google</span>
            </button>
          </div>
        )}

        <div className="text-center pt-2 space-y-3">
          {mode === 'forgot' ? (
            <button onClick={() => { setMode('login'); setSuccess(''); setError(''); }} className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Kembali ke Masuk
            </button>
          ) : (
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
              {mode === 'login' ? 'Ingin bergabung? ' : 'Sudah ada akun? '}
              <span className="text-blue-600 font-black">{mode === 'login' ? 'Daftar Baru' : 'Masuk'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
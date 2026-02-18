import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

interface ResetPasswordPageProps {
  onPasswordReset: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onPasswordReset }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    // Cek apakah token valid
    const hash = window.location.hash;
    if (!hash || (!hash.includes('type=recovery') && !hash.includes('access_token'))) {
      setError('Link reset password tidak valid atau sudah kadaluarsa');
      setIsValidToken(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setMessage('✅ Password berhasil direset!');
      setTimeout(() => {
        onPasswordReset();
      }, 2000);
      
    } catch (err: any) {
      console.error('Reset password error:', err);
      
      if (err.message.includes('JWT')) {
        setError('Token reset password sudah kadaluarsa. Silakan minta link baru.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
        <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Link Tidak Valid</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
            Reset<span className="text-blue-600">Password</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium">
            Masukkan password baru Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div className="p-4 bg-emerald-50 text-emerald-600 text-sm rounded-xl font-bold text-center">
              {message}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-black text-blue-600 uppercase ml-2 tracking-widest">
              Password Baru
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-sm"
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-blue-600 uppercase ml-2 tracking-widest">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-sm"
              placeholder="Ketik ulang password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-black text-base shadow-xl active:scale-95 transition-all disabled:opacity-70"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
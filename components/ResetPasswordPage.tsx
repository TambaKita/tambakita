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

  useEffect(() => {
    console.log('ResetPasswordPage mounted');
    // Cek session
    supabase.auth.getSession().then(({ data }) => {
      console.log('Session:', data.session);
      if (!data.session) {
        setError('Session tidak ditemukan. Silakan minta link reset password baru.');
      }
    });
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
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) throw error;
      
      setMessage('✅ Password berhasil direset!');
      
      setTimeout(() => {
        onPasswordReset();
      }, 2000);
      
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Gagal reset password');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-black text-slate-800 mb-2">Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <a href="/tambakita/" className="text-blue-600 font-bold">← Kembali ke Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-lock text-blue-600 text-3xl"></i>
          </div>
          <h1 className="text-2xl font-black text-slate-800">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-2">Masukkan password baru Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">
              Password Baru
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Minimal 6 karakter"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Ulangi password baru"
              required
            />
          </div>

          {message && (
            <div className="p-4 bg-emerald-50 text-emerald-600 text-sm rounded-2xl font-bold text-center border border-emerald-100">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-black text-sm uppercase shadow-xl active:scale-95 transition-all disabled:opacity-70"
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
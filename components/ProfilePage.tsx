import React, { useState, useRef } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onUpdateUser }) => {
  const [activeView, setActiveView] = useState<'main' | 'edit' | 'security'>('main');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle upload foto profil
  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    setMessage(null);
    
    try {
      const result = await authService.uploadAvatar(file);
      
      if (result.success) {
        // Refresh user data
        const updatedUser = await authService.getCurrentUser();
        if (updatedUser) {
          onUpdateUser(updatedUser);
        }
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal upload foto' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Hapus foto profil?')) return;
    
    setUploadingPhoto(true);
    try {
      const result = await authService.deleteAvatar();
      if (result.success) {
        const updatedUser = await authService.getCurrentUser();
        if (updatedUser) {
          onUpdateUser(updatedUser);
        }
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal hapus foto' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editName.trim()) {
      setMessage({ type: 'error', text: 'Nama tidak boleh kosong!' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await authService.updateProfile({ 
        name: editName,
        phone: editPhone
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        const updatedUser = await authService.getCurrentUser();
        if (updatedUser) {
          onUpdateUser(updatedUser);
        }
        setTimeout(() => {
          setActiveView('main');
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal update profil' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Masukkan password lama!' });
      return;
    }
    
    if (!newPassword) {
      setMessage({ type: 'error', text: 'Masukkan password baru!' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password baru tidak cocok!' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter!' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await authService.updatePassword(currentPassword, newPassword);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setActiveView('main');
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white min-h-[calc(100vh-120px)] rounded-t-[2.5rem] mt-4 shadow-2xl overflow-hidden">
      {/* Input file tersembunyi */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="p-8 space-y-6">
        {activeView === 'main' && (
          <>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative group">
                <button 
                  onClick={handlePhotoClick}
                  disabled={uploadingPhoto}
                  className="relative w-28 h-28 bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-2xl overflow-hidden active:scale-95 transition-transform"
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.name?.[0]?.toUpperCase() || 'U'
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <i className="fas fa-camera text-2xl"></i>
                  </div>
                </button>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 border-4 border-white rounded-full flex items-center justify-center text-[10px] text-white cursor-pointer hover:bg-blue-700 transition-colors">
                  <i className="fas fa-pencil"></i>
                </div>
              </div>
              
              {/* Tombol hapus foto (jika ada avatar) */}
              {user.avatar && (
                <button
                  onClick={handleDeletePhoto}
                  disabled={uploadingPhoto}
                  className="text-[10px] text-red-500 font-bold uppercase tracking-wider hover:text-red-600"
                >
                  <i className="fas fa-trash-alt mr-1"></i> Hapus Foto
                </button>
              )}
              
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{user.name}</h2>
                <p className="text-gray-400 font-medium">{user.email}</p>
                {user.phone && <p className="text-gray-400 text-sm mt-1">📱 {user.phone}</p>}
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <i className={`fas ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 pt-6 border-t border-gray-100">
              <button 
                onClick={() => {
                  setEditName(user.name);
                  setEditPhone(user.phone || '');
                  setMessage(null);
                  setActiveView('edit');
                }}
                className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl font-bold text-gray-700 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-user-pen"></i>
                  </div>
                  <span>Edit Profil</span>
                </div>
                <i className="fas fa-chevron-right text-gray-300 text-sm"></i>
              </button>
              
              <button 
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setMessage(null);
                  setActiveView('security');
                }}
                className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl font-bold text-gray-700 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-shield-halved"></i>
                  </div>
                  <span>Keamanan & Password</span>
                </div>
                <i className="fas fa-chevron-right text-gray-300 text-sm"></i>
              </button>

              <button 
                onClick={onLogout}
                className="flex items-center gap-4 p-5 bg-red-50 rounded-2xl font-bold text-red-600 mt-6 shadow-sm active:bg-red-100 transition-colors"
              >
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-right-from-bracket"></i>
                </div>
                <span>Logout</span>
              </button>
            </div>
          </>
        )}

        {/* Edit Profile Form - sama seperti sebelumnya */}
        {activeView === 'edit' && (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <button type="button" onClick={() => setActiveView('main')} className="w-10 h-10 flex items-center justify-center text-gray-400">
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
              <h2 className="text-xl font-black text-gray-800">Ubah Profil</h2>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <i className={`fas ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl outline-none font-medium text-gray-400"
                  placeholder="Email"
                />
                <p className="text-[8px] text-gray-400 ml-2">Email tidak dapat diubah</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Nomor Telepon</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  placeholder="Nomor telepon (opsional)"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : "Simpan Perubahan"}
            </button>
          </form>
        )}

        {/* Security Form - sama seperti sebelumnya */}
        {activeView === 'security' && (
          <form onSubmit={handleUpdateSecurity} className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <button type="button" onClick={() => setActiveView('main')} className="w-10 h-10 flex items-center justify-center text-gray-400">
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
              <h2 className="text-xl font-black text-gray-800">Keamanan</h2>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <i className={`fas ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Password Lama</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-cyan-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-cyan-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
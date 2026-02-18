import React, { useState, useEffect } from 'react';
import { Pond, User } from '../types';
import QRCodeScanner from './QRCodeScanner';
import { supabase } from '../src/lib/supabase';

interface DashboardProps {
  user: User;
}

// Komponen Notifikasi
const Notification: React.FC<{ 
  message: string; 
  type: 'success' | 'error' | 'warning';
  onClose?: () => void;
}> = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-amber-500';
  return (
    <div className={`${bgColor} text-white p-4 rounded-2xl shadow-lg mb-4 flex justify-between items-center animate-in slide-in-from-top-2`}>
      <span className="text-sm font-bold">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-white/80">
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
};

// Komponen InviteCodeDisplay
const InviteCodeDisplay: React.FC<{ code: string; expiry: number; onClear: () => void }> = ({ code, expiry, onClear }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiry]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft <= 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-blue-100 relative shadow-sm">
        <div className="pr-12">
          <p className="text-[8px] font-black text-slate-400 uppercase">Kode Join ({minutes}:{seconds < 10 ? '0' : ''}{seconds})</p>
          <p className="text-xl font-black text-blue-600 tracking-widest">{code}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowQR(!showQR)} className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center active:scale-90 transition-all">
            <i className={`fas ${showQR ? 'fa-code' : 'fa-qrcode'}`}></i>
          </button>
          <button onClick={handleCopy} className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
          </button>
          <button onClick={onClear} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center active:scale-90 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      {showQR && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col items-center animate-in zoom-in-95">
          <div className="w-32 h-32 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${code}`} alt="Join QR" className="w-24 h-24" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pindai untuk bergabung</p>
        </div>
      )}
    </div>
  );
};

// Dashboard Utama
const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' }>>([]);

  const addNotification = (message: string, type: 'success' | 'error' | 'warning') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const [showAddPond, setShowAddPond] = useState(false);
  const [newPondName, setNewPondName] = useState('');
  const [newPondType, setNewPondType] = useState<'Bioflok' | 'Tanah' | 'Beton' | 'Terpal'>('Bioflok');
  const [newPondFish, setNewPondFish] = useState('Nila');
  const [newPondCount, setNewPondCount] = useState('1000');
  const [showJoinPond, setShowJoinPond] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [editingPondId, setEditingPondId] = useState<string | null>(null);
  const [managingMembersId, setManagingMembersId] = useState<string | null>(null);
  const [editFishType, setEditFishType] = useState('');
  const [editFishCount, setEditFishCount] = useState('');
  const [showFeedManagerId, setShowFeedManagerId] = useState<string | null>(null);
  const [newFeedName, setNewFeedName] = useState('');

  // Ambil data kolam dari Supabase
  const fetchPonds = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching ponds...');
      
      const { data, error } = await supabase
        .from('ponds')
        .select('*');
      
      if (error) {
        console.error('❌ Fetch error:', error);
        throw error;
      }
      
      console.log('📦 Data mentah:', data);
      
      if (!data || data.length === 0) {
        setPonds([]);
        setLoading(false);
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
        currentMetrics: item.current_metrics || { ph: 7, temp: 28, ammonia: 0, do: 5, lastUpdated: new Date().toISOString() },
        inviteCode: item.invite_code,
        inviteCodeExpiry: item.invite_code_expiry ? new Date(item.invite_code_expiry).getTime() : undefined
      }));
      
      console.log('✅ Data terformat:', formattedPonds);
      
      setPonds(formattedPonds);
      
    } catch (error) {
      console.error('❌ Error di fetchPonds:', error);
      addNotification('Gagal memuat data kolam', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPonds();
  }, []);

  // ===== TIDAK ADA LAGI NOTIFIKASI LOKAL UNTUK PARAMETER KRITIS =====
  // Notifikasi bahaya sekarang dikirim oleh trigger database dan ditampilkan di App

  // Tambah kolam
  const handleAddPond = async () => {
    if (!newPondName) {
      addNotification('Nama kolam harus diisi!', 'error');
      return;
    }
    
    try {
      console.log('➕ Menambah kolam...');
      
      const fishCountNum = parseInt(newPondCount) || 0;
      
      const newPond = {
        name: newPondName,
        type: newPondType,
        owner_id: user.id,
        owner_name: user.name,
        fish_type: newPondFish,
        fish_count: fishCountNum,
        members: [{ id: user.id, name: user.name, role: 'owner' }],
        custom_feeds: ['LP-1', 'LP-2', 'LP-3'],
        current_metrics: { ph: 7, temp: 28, ammonia: 0, do: 5 }
      };

      const { data, error } = await supabase
        .from('ponds')
        .insert([newPond])
        .select();

      if (error) {
        console.error('❌ Error:', error);
        addNotification('Gagal tambah kolam: ' + error.message, 'error');
        return;
      }

      console.log('✅ Data dari Supabase:', data);

      if (data && data.length > 0) {
        const pondFromDB = data[0];
        
        const newPondFormatted: Pond = {
          id: pondFromDB.id,
          name: pondFromDB.name,
          type: pondFromDB.type,
          size: 'D3 (Standard)',
          ownerId: pondFromDB.owner_id,
          ownerName: pondFromDB.owner_name,
          fishType: pondFromDB.fish_type,
          fishCount: pondFromDB.fish_count,
          members: pondFromDB.members || [{ id: user.id, name: user.name, role: 'owner' }],
          customFeeds: pondFromDB.custom_feeds || ['LP-1', 'LP-2', 'LP-3'],
          currentMetrics: pondFromDB.current_metrics || { ph: 7, temp: 28, ammonia: 0, do: 5, lastUpdated: new Date().toISOString() }
        };

        setPonds([...ponds, newPondFormatted]);
        setNewPondName('');
        setShowAddPond(false);
        addNotification('Kolam berhasil ditambahkan!', 'success');
      }
      
    } catch (err) {
      console.error('💥 Error:', err);
      addNotification('Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    }
  };

  // Hapus kolam
  const handleDeletePond = async (pondId: string) => {
    if (!confirm('Anda yakin hapus kolam ini? Data akan hilang permanen!')) {
      setEditingPondId(null);
      return;
    }
    
    try {
      const pondToDelete = ponds.find(p => p.id === pondId);
      if (!pondToDelete) return;
      
      if (pondToDelete.ownerId !== user.id) {
        addNotification('Hanya owner yang bisa menghapus kolam!', 'error');
        return;
      }
      
      const { error } = await supabase
        .from('ponds')
        .delete()
        .eq('id', pondId);

      if (error) {
        console.error('❌ Error:', error);
        addNotification('Gagal hapus: ' + error.message, 'error');
        return;
      }

      setPonds(ponds.filter(p => p.id !== pondId));
      setEditingPondId(null);
      addNotification('Kolam berhasil dihapus!', 'success');
      
    } catch (err) {
      console.error('💥 Error:', err);
      addNotification('Terjadi kesalahan', 'error');
    }
  };

  // Join kolam
  const handleJoinPond = async () => {
    if (!joinCode) {
      addNotification('Masukkan kode join', 'error');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('ponds')
        .select('*')
        .eq('invite_code', joinCode.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        addNotification('Kode join tidak ditemukan.', 'error');
        return;
      }

      if (data.invite_code_expiry && new Date(data.invite_code_expiry) < new Date()) {
        addNotification('Kode join sudah kedaluwarsa.', 'error');
        return;
      }

      if (data.members?.some((m: any) => m.id === user.id)) {
        addNotification('Anda sudah menjadi anggota kolam ini.', 'warning');
        return;
      }

      const currentMembers = data.members || [];
      const updatedMembers = [...currentMembers, { id: user.id, name: user.name, role: 'staff' }];
      
      const { error: updateError } = await supabase
        .from('ponds')
        .update({ members: updatedMembers })
        .eq('id', data.id);

      if (updateError) throw updateError;

      addNotification(`Berhasil bergabung dengan kolam ${data.name}!`, 'success');
      setShowJoinPond(false);
      setJoinCode('');
      fetchPonds();
      
    } catch (err: any) {
      console.error('Error join:', err);
      addNotification('Gagal bergabung: ' + err.message, 'error');
    }
  };

  // Generate kode undangan
  const handleGenerateCode = async (pondId: string) => {
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('ponds')
        .update({ 
          invite_code: code, 
          invite_code_expiry: expiry 
        })
        .eq('id', pondId);

      if (error) throw error;
      fetchPonds();
      addNotification('Kode undangan berhasil dibuat (berlaku 5 menit)', 'success');
    } catch (err: any) {
      addNotification('Gagal generate kode: ' + err.message, 'error');
    }
  };

  const handleClearCode = async (pondId: string) => {
    try {
      await supabase
        .from('ponds')
        .update({ invite_code: null, invite_code_expiry: null })
        .eq('id', pondId);
      fetchPonds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFeed = async (pondId: string) => {
    if (!newFeedName.trim()) return;
    
    try {
      const pond = ponds.find(p => p.id === pondId);
      const currentFeeds = pond?.customFeeds || [];
      const updatedFeeds = [...currentFeeds, newFeedName.trim()];

      await supabase
        .from('ponds')
        .update({ custom_feeds: updatedFeeds })
        .eq('id', pondId);

      fetchPonds();
      setNewFeedName('');
      addNotification('Pakan berhasil ditambahkan', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Gagal menambah pakan', 'error');
    }
  };

  const handleRemoveMember = async (pondId: string, memberId: string) => {
    if (!confirm('Hapus akses anggota ini dari kolam?')) return;
    
    try {
      const pond = ponds.find(p => p.id === pondId);
      const currentMembers = pond?.members || [];
      const updatedMembers = currentMembers.filter(m => m.id !== memberId);

      await supabase
        .from('ponds')
        .update({ members: updatedMembers })
        .eq('id', pondId);

      fetchPonds();
      addNotification('Anggota berhasil dihapus', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Gagal menghapus anggota', 'error');
    }
  };

  const handleSaveEdit = async (pondId: string) => {
    try {
      await supabase
        .from('ponds')
        .update({ 
          fish_type: editFishType, 
          fish_count: parseInt(editFishCount) || 0 
        })
        .eq('id', pondId);

      fetchPonds();
      setEditingPondId(null);
      addNotification('Data kolam diperbarui', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Gagal memperbarui data', 'error');
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Notifikasi */}
      <div className="fixed top-4 left-4 right-4 z-50 space-y-2 max-w-md mx-auto">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => removeNotification(notif.id)}
          />
        ))}
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[2.5rem] text-white shadow-xl relative">
        <h2 className="text-2xl font-black mb-1 tracking-tighter">Manajemen Kolam</h2>
        <p className="text-blue-100 text-[11px] font-medium opacity-80 mb-4 uppercase tracking-widest">Kontrol Budidaya Aktif</p>
        <div className="flex gap-2">
          <button onClick={() => setShowAddPond(!showAddPond)} className="flex-1 py-3 bg-white text-blue-700 rounded-xl font-black text-[10px] uppercase shadow-lg">Kolam Baru</button>
          <button onClick={() => setShowJoinPond(!showJoinPond)} className="flex-1 py-3 bg-blue-500/30 text-white rounded-xl font-black text-[10px] uppercase border border-white/20">Gabung Akses</button>
        </div>
      </div>

      {/* Form Join */}
      {showJoinPond && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-blue-100 space-y-4 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Gabung Kolam</h3>
            <button onClick={() => { setShowJoinPond(false); setIsScanning(false); }} className="text-slate-400"><i className="fas fa-times"></i></button>
          </div>
          
          {!isScanning ? (
            <div className="space-y-4">
              <input 
                type="text" 
                value={joinCode} 
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="MASUKKAN KODE JOIN" 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none text-center text-lg font-black tracking-widest outline-none placeholder:text-slate-300 placeholder:tracking-normal" 
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleJoinPond} className="py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg active:scale-95">Gabung</button>
                <button onClick={() => setIsScanning(true)} className="py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95">
                  <i className="fas fa-qrcode"></i> Scan QR
                </button>
              </div>
            </div>
          ) : (
            <QRCodeScanner
              key="qr-scanner-unique"
              onScan={(code) => {
                setJoinCode(code);
                setIsScanning(false);
                setTimeout(() => handleJoinPond(), 500);
              }}
              onClose={() => setIsScanning(false)}
            />
          )}
        </div>
      )}

      {/* Form Tambah Kolam */}
      {showAddPond && (
        <div className="bg-white p-5 rounded-[2rem] shadow-xl border border-blue-50 space-y-4 animate-in fade-in">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Tambah Kolam</h3>
          <input type="text" placeholder="Nama Kolam" value={newPondName} onChange={e => setNewPondName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Jenis Ikan" value={newPondFish} onChange={e => setNewPondFish(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold outline-none" />
            <input type="number" placeholder="Jumlah" value={newPondCount} onChange={e => setNewPondCount(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold outline-none" />
          </div>
          <select value={newPondType} onChange={e => setNewPondType(e.target.value as any)} className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-black text-slate-700 outline-none">
            <option value="Bioflok">Bioflok</option>
            <option value="Tanah">Tanah</option>
            <option value="Beton">Beton</option>
            <option value="Terpal">Terpal</option>
          </select>
          <div className="flex gap-3">
            <button onClick={handleAddPond} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95">Simpan Kolam</button>
            <button onClick={() => setShowAddPond(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm active:bg-slate-200">Batal</button>
          </div>
        </div>
      )}

      {/* Daftar Kolam */}
      <div className="space-y-4">
        <h3 className="font-black text-slate-400 px-1 uppercase text-[10px] tracking-[0.2em]">Daftar Kolam</h3>
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : ponds.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[2rem] border border-slate-100">
            <i className="fas fa-water text-3xl text-slate-100 mb-2"></i>
            <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Belum ada kolam aktif.</p>
          </div>
        ) : (
          ponds.map(pond => {
            const m = pond.currentMetrics || { ph: 7, temp: 28, ammonia: 0, do: 5 };
            const isCritical = m.ph < 6.5 || m.ph > 8.5 || m.do < 5 || m.ammonia > 0.1;
            const isOwner = pond.ownerId === user.id;

            return (
              <div key={pond.id} className={`bg-white rounded-[2rem] shadow-sm border transition-all ${isCritical ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-50'}`}>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden ${isCritical ? 'logo-gradient text-white animate-pulse' : 'logo-gradient text-white opacity-90'}`}>
                        <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                          <i className="fas fa-droplet text-white/30 text-xl absolute translate-y-0.5"></i>
                        </div>
                        <i className="fas fa-fish-fins text-white text-base relative z-10 transform -rotate-12"></i>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 leading-none mb-1">{pond.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{pond.type} • {isOwner ? '👑 Owner' : '👷 Staff'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {isOwner && (
                        <>
                          <button onClick={() => setManagingMembersId(managingMembersId === pond.id ? null : pond.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${managingMembersId === pond.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                            <i className="fas fa-users-gear text-xs"></i>
                          </button>
                          <button onClick={() => setShowFeedManagerId(showFeedManagerId === pond.id ? null : pond.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showFeedManagerId === pond.id ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                            <i className="fas fa-bowl-food text-xs"></i>
                          </button>
                          <button onClick={() => { setEditingPondId(editingPondId === pond.id ? null : pond.id); setEditFishType(pond.fishType); setEditFishCount(pond.fishCount.toString()); }} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${editingPondId === pond.id ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                            <i className="fas fa-edit text-xs"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Manajemen Pakan */}
                  {showFeedManagerId === pond.id && isOwner && (
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-3 animate-in slide-in-from-top-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Manajemen Pakan</p>
                      <div className="flex flex-wrap gap-2">
                        {(pond.customFeeds || ['LP-1', 'LP-2', 'LP-3']).map((feed, idx) => (
                          <span key={idx} className="bg-white px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 border border-slate-100">{feed}</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newFeedName} 
                          onChange={e => setNewFeedName(e.target.value)}
                          placeholder="Nama pakan baru..." 
                          className="flex-1 p-3 bg-white rounded-xl border-none text-[11px] font-bold outline-none shadow-sm"
                        />
                        <button onClick={() => handleAddFeed(pond.id)} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center active:scale-90"><i className="fas fa-plus"></i></button>
                      </div>
                    </div>
                  )}

                  {/* Manajemen Anggota */}
                  {managingMembersId === pond.id && isOwner && (
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-3 animate-in slide-in-from-top-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Pengaturan Anggota</p>
                      <div className="space-y-2">
                        {pond.members.map(member => (
                          <div key={member.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">{member.name[0]}</div>
                              <span className="text-xs font-bold text-slate-700">{member.name} {member.id === user.id && '(Anda)'}</span>
                            </div>
                            {member.role !== 'owner' && (
                              <button onClick={() => handleRemoveMember(pond.id, member.id)} className="w-7 h-7 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center active:scale-90 transition-all">
                                <i className="fas fa-trash-can text-[10px]"></i>
                              </button>
                            )}
                            {member.role === 'owner' && <span className="text-[8px] font-black text-blue-500 uppercase px-2">Owner</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informasi Ikan */}
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    {editingPondId === pond.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={editFishType} onChange={e => setEditFishType(e.target.value)} className="p-2 bg-white rounded-lg text-xs font-bold border border-blue-200" />
                          <input type="number" value={editFishCount} onChange={e => setEditFishCount(e.target.value)} className="p-2 bg-white rounded-lg text-xs font-bold border border-blue-200" />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => handleSaveEdit(pond.id)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase">Simpan</button>
                          <button onClick={() => setEditingPondId(null)} className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase">Batal</button>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                          <button onClick={() => handleDeletePond(pond.id)} className="w-full py-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase active:bg-rose-100">Hapus Kolam Secara Permanen</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Jenis Ikan</p><p className="text-xs font-black text-slate-800">{pond.fishType}</p></div>
                        <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Populasi</p><p className="text-xs font-black text-slate-800">{pond.fishCount.toLocaleString()} Ekor</p></div>
                      </div>
                    )}
                  </div>

                  {/* Parameter Air */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className={`p-2 rounded-xl text-center border transition-colors ${(m.ph < 6.5 || m.ph > 8.5) ? 'bg-rose-600 text-white border-rose-700 shadow-lg animate-pulse' : 'bg-slate-50 text-slate-800 border-transparent'}`}>
                      <p className="text-[8px] font-black uppercase mb-0.5 opacity-40">pH</p>
                      <p className="text-xs font-black">{m.ph}</p>
                    </div>
                    <div className={`p-2 rounded-xl text-center border transition-colors ${m.temp > 32 ? 'bg-rose-600 text-white border-rose-700 shadow-lg animate-pulse' : 'bg-slate-50 text-slate-800 border-transparent'}`}>
                      <p className="text-[8px] font-black uppercase mb-0.5 opacity-40">Suhu</p>
                      <p className="text-xs font-black">{m.temp}°</p>
                    </div>
                    <div className={`p-2 rounded-xl text-center border transition-colors ${m.do < 5 ? 'bg-rose-600 text-white border-rose-700 shadow-lg animate-pulse' : 'bg-slate-50 text-slate-800 border-transparent'}`}>
                      <p className="text-[8px] font-black uppercase mb-0.5 opacity-40">DO</p>
                      <p className="text-xs font-black">{m.do}</p>
                    </div>
                    <div className={`p-2 rounded-xl text-center border transition-colors ${m.ammonia > 0.1 ? 'bg-rose-600 text-white border-rose-700 shadow-lg animate-pulse' : 'bg-slate-50 text-slate-800 border-transparent'}`}>
                      <p className="text-[8px] font-black uppercase mb-0.5 opacity-40">NH3</p>
                      <p className="text-xs font-black">{m.ammonia}</p>
                    </div>
                  </div>

                  {/* Akses Staf */}
                  {isOwner && (
                    <div className="p-3 bg-blue-50/50 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Akses Staf</span>
                        <button onClick={() => handleGenerateCode(pond.id)} className="text-[9px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase active:scale-95 transition-all">Generate Kode</button>
                      </div>
                      {pond.inviteCode && pond.inviteCodeExpiry && (
                        <InviteCodeDisplay code={pond.inviteCode} expiry={pond.inviteCodeExpiry} onClear={() => handleClearCode(pond.id)} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;
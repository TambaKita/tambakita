import React, { useState, useEffect } from 'react';
import { ForumPost, User } from '../types';
import { supabase } from '../src/lib/supabase';
import Toast from './Toast';

interface RegionItem {
  id: string;
  name: string;
}

const ForumPage: React.FC<{ user: User; onOpenChat: (to: User) => void }> = ({ user, onOpenChat }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Diskusi' | 'Marketplace'>('Semua');
  const [search, setSearch] = useState('');
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedRegencyName, setSelectedRegencyName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<'Diskusi' | 'Marketplace'>('Diskusi');
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Ambil data dari Supabase
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  // Load Provinsi
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Error loading provinces:", err));
  }, []);

  // Load Kabupaten
  useEffect(() => {
    if (selectedProvinceId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvinceId}.json`)
        .then(res => res.json())
        .then(data => {
          setRegencies(data);
          setSelectedRegencyName('');
        })
        .catch(err => console.error("Error loading regencies:", err));
    } else {
      setRegencies([]);
      setSelectedRegencyName('');
    }
  }, [selectedProvinceId]);

  // Tambah notifikasi ke Supabase
  const addNotification = async (notif: any) => {
    try {
      await supabase.from('notifications').insert({
        user_id: notif.userId,
        type: notif.type,
        from_name: notif.fromName,
        post_excerpt: notif.postExcerpt,
        created_at: new Date().toISOString(),
        is_read: false
      });
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // Tambah Postingan Baru
  const handleAddPost = async () => {
    if (!newContent.trim()) {
      setToast({ message: "Tulis judul atau deskripsi postingan!", type: 'warning' });
      return;
    }
    
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        user_id: user.id,
        user_name: user.name,
        user_location: user.city?.toUpperCase() || 'JAWA BARAT',
        type: newType,
        content: newContent,
        image: newImage || null,
        likes: [],
        comments: [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (!error && data) {
      setPosts([data, ...posts]);
      setNewContent('');
      setNewImage(null);
      setShowAddModal(false);
      setToast({ message: "Postingan berhasil ditambahkan!", type: 'success' });
    } else {
      setToast({ message: "Gagal menambahkan postingan!", type: 'error' });
    }
  };

  // LIKE
  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const alreadyLiked = post.likes?.includes(user.id) || false;
    const newLikes = alreadyLiked 
      ? post.likes.filter(id => id !== user.id)
      : [...(post.likes || []), user.id];
    
    const { error } = await supabase
      .from('forum_posts')
      .update({ likes: newLikes })
      .eq('id', postId);
    
    if (!error) {
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes: newLikes } : p
      ));
      
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({ ...selectedPost, likes: newLikes });
      }
      
      if (!alreadyLiked && post.user_id !== user.id) {
        await addNotification({
          userId: post.user_id,
          type: 'like',
          fromName: user.name,
          postExcerpt: post.content?.substring(0, 30) || '',
          timestamp: new Date().toISOString(),
          isRead: false
        });
      }
    }
  };

  // Hapus Postingan
  const handleDeletePost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (post.user_id !== user.id) {
      setToast({ message: "Hanya penulis yang bisa menghapus postingan ini!", type: 'error' });
      return;
    }
    
    setConfirmModal({
      show: true,
      title: "Hapus Postingan",
      message: "Yakin ingin menghapus postingan ini? Tindakan ini tidak bisa dibatalkan!",
      onConfirm: async () => {
        const { error } = await supabase
          .from('forum_posts')
          .delete()
          .eq('id', postId);
        
        if (!error) {
          setPosts(prev => prev.filter(p => p.id !== postId));
          if (selectedPost?.id === postId) {
            setSelectedPost(null);
          }
          setToast({ message: "Postingan berhasil dihapus!", type: 'success' });
        } else {
          setToast({ message: "Gagal menghapus postingan!", type: 'error' });
        }
        setConfirmModal(null);
      }
    });
  };

  // Hapus Komentar
  const handleDeleteComment = (postId: string, commentId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const comment = post.comments?.find(c => c.id === commentId);
    if (!comment) return;
    
    if (comment.authorId !== user.id && post.user_id !== user.id) {
      setToast({ message: "Hanya penulis komentar atau penulis postingan yang bisa menghapus!", type: 'error' });
      return;
    }
    
    setConfirmModal({
      show: true,
      title: "Hapus Komentar",
      message: "Yakin ingin menghapus komentar ini?",
      onConfirm: async () => {
        const updatedComments = post.comments.filter(c => c.id !== commentId);
        
        const { error } = await supabase
          .from('forum_posts')
          .update({ comments: updatedComments })
          .eq('id', postId);
        
        if (!error) {
          setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, comments: updatedComments } : p
          ));
          if (selectedPost && selectedPost.id === postId) {
            setSelectedPost({ ...selectedPost, comments: updatedComments });
          }
          setToast({ message: "Komentar berhasil dihapus!", type: 'success' });
        } else {
          setToast({ message: "Gagal menghapus komentar!", type: 'error' });
        }
        setConfirmModal(null);
      }
    });
  };

  // KOMENTAR + NOTIFIKASI BALASAN
  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) {
      setToast({ message: "Tulis komentar terlebih dahulu!", type: 'warning' });
      return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    let parentCommentAuthorId = null;
    let parentCommentAuthorName = null;
    if (replyToCommentId) {
      const parentComment = post.comments?.find(c => c.id === replyToCommentId);
      if (parentComment) {
        parentCommentAuthorId = parentComment.authorId;
        parentCommentAuthorName = parentComment.authorName;
      }
    }
    
    const newComment = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.name,
      content: replyToCommentId ? `@${parentCommentAuthorName} ${commentText}` : commentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replies: []
    };
    
    const updatedComments = [...(post.comments || []), newComment];
    
    const { error } = await supabase
      .from('forum_posts')
      .update({ comments: updatedComments })
      .eq('id', postId);
    
    if (!error) {
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comments: updatedComments } : p
      ));
      
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({ ...selectedPost, comments: updatedComments });
      }
      
      if (post.user_id !== user.id) {
        await addNotification({
          userId: post.user_id,
          type: 'comment',
          fromName: user.name,
          postExcerpt: post.content?.substring(0, 30) || '',
          timestamp: new Date().toISOString(),
          isRead: false
        });
      }
      
      if (replyToCommentId && parentCommentAuthorId && parentCommentAuthorId !== user.id) {
        await addNotification({
          userId: parentCommentAuthorId,
          type: 'reply',
          fromName: user.name,
          postExcerpt: `membalas komentar Anda: "${commentText.substring(0, 40)}${commentText.length > 40 ? '...' : ''}"`,
          timestamp: new Date().toISOString(),
          isRead: false
        });
      }
      
      setCommentText('');
      setReplyToCommentId(null);
      setToast({ message: "Komentar berhasil ditambahkan!", type: 'success' });
    } else {
      setToast({ message: "Gagal menambahkan komentar!", type: 'error' });
    }
  };

  // Filter postingan
  const filteredPosts = posts.filter(p => {
    const matchesCat = activeCategory === 'Semua' || p.type === activeCategory;
    const matchesQuery = p.content?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchesLoc = selectedRegencyName ? p.user_location?.toLowerCase().includes(selectedRegencyName.toLowerCase()) : true;
    return matchesCat && matchesQuery && matchesLoc;
  });

  return (
    <div className="p-4 pb-24 space-y-4 bg-slate-50 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Modal Konfirmasi Hapus */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="bg-red-600 p-5 text-white text-center">
              <i className="fas fa-trash-alt text-3xl mb-2"></i>
              <h3 className="font-black text-lg uppercase tracking-widest">{confirmModal.title}</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-slate-600 font-medium">{confirmModal.message}</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase shadow-lg"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kategori */}
      <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
        {['Semua', 'Diskusi', 'Marketplace'].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Add */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center px-4">
            <i className="fas fa-search text-slate-400 mr-2"></i>
            <input type="text" placeholder="Cari topik diskusi..." value={search} onChange={e => setSearch(e.target.value)} className="w-full py-4 text-sm font-bold outline-none bg-transparent" />
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-90">
            <i className="fas fa-plus"></i>
          </button>
        </div>

        {/* Filter Lokasi */}
        <div className="grid grid-cols-2 gap-2">
          <select value={selectedProvinceId} onChange={e => setSelectedProvinceId(e.target.value)} className="bg-white rounded-2xl border border-slate-200 p-3 text-[10px] font-black uppercase outline-none">
            <option value="">Semua Provinsi</option>
            {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={selectedRegencyName} onChange={e => setSelectedRegencyName(e.target.value)} disabled={!selectedProvinceId} className="bg-white rounded-2xl border border-slate-200 p-3 text-[10px] font-black uppercase outline-none disabled:opacity-50">
            <option value="">Semua Kabupaten</option>
            {regencies.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {/* Daftar Postingan */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 text-xs mt-2">Memuat diskusi...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl">
            <p className="text-slate-400 text-xs">Belum ada postingan</p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const lines = post.content?.split('\n') || [];
            const title = lines[0]?.length > 50 ? lines[0].substring(0, 50) + '...' : lines[0] || 'Postingan';

            return (
              <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden active:bg-slate-50 cursor-pointer">
                <div className="p-5 flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${post.type === 'Marketplace' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        {post.type}
                      </span>
                      <span className="text-[9px] font-bold text-slate-300">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-800 leading-tight">{title}</h3>
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={(e) => { e.stopPropagation(); onOpenChat({ id: post.user_id, name: post.user_name } as User); }} className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[9px] font-black">
                        {post.user_name?.[0] || '?'}
                      </button>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{post.user_name} • {post.user_location}</span>
                    </div>
                  </div>
                  {post.image && (
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
                      <img src={post.image} className="w-full h-full object-cover" alt="Thumb" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tambah Postingan */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 space-y-5">
            <h3 className="font-black text-center text-slate-800 uppercase text-sm">Postingan Baru</h3>
            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
              <button onClick={() => setNewType('Diskusi')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${newType === 'Diskusi' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Diskusi</button>
              <button onClick={() => setNewType('Marketplace')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${newType === 'Marketplace' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Market</button>
            </div>
            <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Tulis judul di baris pertama..." className="w-full p-5 bg-slate-50 rounded-[1.5rem] text-sm font-bold h-44 outline-none" />
            <div className="flex gap-2">
              <button onClick={handleAddPost} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs">Posting</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px]">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Postingan */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <button onClick={() => setSelectedPost(null)} className="w-10 h-10 flex items-center justify-center">
              <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <h3 className="font-black text-slate-800 uppercase text-xs">{selectedPost.type}</h3>
            {selectedPost.user_id === user.id && (
              <button 
                onClick={() => handleDeletePost(selectedPost.id)}
                className="w-10 h-10 flex items-center justify-center text-red-500"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            )}
            {selectedPost.user_id !== user.id && <div className="w-10"></div>}
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-32">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => onOpenChat({ id: selectedPost.user_id, name: selectedPost.user_name } as User)} className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                  {selectedPost.user_name?.[0] || '?'}
                </button>
                <div>
                  <h4 className="text-sm font-black text-slate-800">{selectedPost.user_name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{selectedPost.user_location}</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-2">
                <h2 className="text-2xl font-black text-slate-900">{selectedPost.content?.split('\n')[0]}</h2>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedPost.content?.split('\n').slice(1).join('\n')}</p>
                {selectedPost.image && <img src={selectedPost.image} className="w-full rounded-[2.5rem] shadow-lg" alt="Full" />}
              </div>

              <button onClick={() => handleLike(selectedPost.id)} className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black ${selectedPost.likes?.includes(user.id) ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                <i className={`${selectedPost.likes?.includes(user.id) ? 'fas' : 'far'} fa-heart`}></i> {selectedPost.likes?.length || 0} Suka
              </button>
            </div>

            <div className="space-y-5">
              <h3 className="font-black text-slate-800 uppercase text-[10px]">Komentar ({selectedPost.comments?.length || 0})</h3>
              {selectedPost.comments?.map(c => (
                <div key={c.id} className="flex gap-3">
                  <button onClick={() => onOpenChat({ id: c.authorId, name: c.authorName } as User)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black">
                    {c.authorName?.[0] || '?'}
                  </button>
                  <div className="flex-1">
                    <div className="bg-slate-100/70 p-4 rounded-[1.5rem] rounded-tl-none">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-blue-600">{c.authorName}</p>
                        {(c.authorId === user.id || selectedPost.user_id === user.id) && (
                          <button 
                            onClick={() => handleDeleteComment(selectedPost.id, c.id)}
                            className="text-red-400 text-xs ml-2"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-700 mt-1">{c.content}</p>
                    </div>
                    <div className="flex gap-4 pl-2 mt-1">
                      <button onClick={() => setReplyToCommentId(c.id)} className="text-[9px] font-black text-slate-400 uppercase">Balas</button>
                      <span className="text-[9px] font-bold text-slate-300">{c.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!selectedPost.comments || selectedPost.comments.length === 0) && <p className="text-center text-slate-300 py-10 text-xs">Belum ada komentar.</p>}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100">
            {replyToCommentId && (
              <div className="flex justify-between px-4 py-2 bg-blue-50 text-blue-600 rounded-t-2xl mb-1 text-[10px] font-bold">
                <span>Membalas komentar</span>
                <button onClick={() => setReplyToCommentId(null)}><i className="fas fa-times"></i></button>
              </div>
            )}
            <div className="flex gap-2">
              <textarea rows={1} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Tulis komentar..." className="flex-1 p-4 bg-slate-100 rounded-2xl text-sm font-bold outline-none resize-none" />
              <button onClick={() => handleAddComment(selectedPost.id)} className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumPage;
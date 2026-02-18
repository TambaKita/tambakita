
import React, { useState, useEffect } from 'react';
import { ForumPost, User, ForumComment, AppNotification } from '../types';

interface RegionItem {
  id: string;
  name: string;
}

const ForumPage: React.FC<{ user: User; onOpenChat: (to: User) => void }> = ({ user, onOpenChat }) => {
  const [posts, setPosts] = useState<ForumPost[]>(() => {
    const saved = localStorage.getItem('tambakita_posts');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', authorId: 'u1', authorName: 'H. Sulam', authorLocation: 'KABUPATEN CIREBON', type: 'Diskusi', content: 'Tips Menghadapi Musim Hujan untuk Kolam Bioflok\nMusim hujan pakan mulai tidak dimakan. Ada saran?', likes: [], comments: [], timestamp: '1 jam lalu' },
      { id: '2', authorId: 'u2', authorName: 'Toko Tani Makmur', authorLocation: 'KABUPATEN SUBANG', type: 'Marketplace', content: 'Promo Probiotik EM4 Murah\nProbiotik EM4 ready stok banyak harga grosir!', likes: [], comments: [], timestamp: '3 jam lalu' }
    ];
  });

  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Diskusi' | 'Marketplace'>('Semua');
  const [search, setSearch] = useState('');
  
  // Location Filter States
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

  useEffect(() => {
    localStorage.setItem('tambakita_posts', JSON.stringify(posts));
  }, [posts]);

  // Load Provinces
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Error loading provinces:", err));
  }, []);

  // Load Regencies when province changes
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

  const addNotification = (notif: AppNotification) => {
    const saved = localStorage.getItem('tambakita_notifications');
    const all = saved ? JSON.parse(saved) : [];
    localStorage.setItem('tambakita_notifications', JSON.stringify([notif, ...all]));
  };

  const handleAddPost = () => {
    if (!newContent.trim()) return;
    const newPost: ForumPost = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.name,
      authorLocation: user.city?.toUpperCase() || 'JAWA BARAT',
      type: newType,
      content: newContent,
      image: newImage || undefined,
      likes: [],
      comments: [],
      timestamp: 'Baru saja'
    };
    setPosts([newPost, ...posts]);
    setNewContent('');
    setNewImage(null);
    setShowAddModal(false);
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        const alreadyLiked = p.likes.includes(user.id);
        if (!alreadyLiked && p.authorId !== user.id) {
          addNotification({
            id: Date.now().toString(),
            userId: p.authorId,
            type: 'like',
            fromName: user.name,
            postId: p.id,
            postExcerpt: p.content.substring(0, 30) + '...',
            timestamp: new Date().toISOString(),
            isRead: false
          });
        }
        return {
          ...p,
          likes: alreadyLiked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id]
        };
      }
      return p;
    }));
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;
    const newComment: ForumComment = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.name,
      content: replyToCommentId ? `@${posts.find(p => p.id === postId)?.comments.find(c => c.id === replyToCommentId)?.authorName} ${commentText}` : commentText,
      timestamp: 'Baru saja',
      replies: []
    };
    
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        const authorId = replyToCommentId 
          ? p.comments.find(c => c.id === replyToCommentId)?.authorId 
          : p.authorId;
          
        if (authorId && authorId !== user.id) {
          addNotification({
            id: Date.now().toString(),
            userId: authorId,
            type: replyToCommentId ? 'reply' : 'comment',
            fromName: user.name,
            postId: p.id,
            postExcerpt: p.content.substring(0, 30) + '...',
            timestamp: new Date().toISOString(),
            isRead: false
          });
        }
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    }));
    setCommentText('');
    setReplyToCommentId(null);
  };

  const filteredPosts = posts.filter(p => {
    const matchesCat = activeCategory === 'Semua' || p.type === activeCategory;
    const matchesQuery = p.content.toLowerCase().includes(search.toLowerCase());
    const matchesLoc = selectedRegencyName ? p.authorLocation?.toLowerCase().includes(selectedRegencyName.toLowerCase()) : true;
    return matchesCat && matchesQuery && matchesLoc;
  });

  return (
    <div className="p-4 pb-24 space-y-4 bg-slate-50 min-h-screen">
      <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
        {['Semua', 'Diskusi', 'Marketplace'].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {/* LIGHT SEARCH BAR */}
        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center px-4 overflow-hidden group focus-within:ring-2 focus-within:ring-blue-100">
            <i className="fas fa-search text-slate-400 mr-2 group-focus-within:text-blue-500 transition-colors"></i>
            <input 
              type="text" 
              placeholder="Cari topik diskusi..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full py-4 text-sm font-bold outline-none bg-transparent placeholder:text-slate-300" 
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 flex-shrink-0">
            <i className="fas fa-plus"></i>
          </button>
        </div>

        {/* REGIONAL FILTER SYSTEM */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center px-4 overflow-hidden">
            <select 
              value={selectedProvinceId} 
              onChange={e => setSelectedProvinceId(e.target.value)}
              className="w-full py-3 text-[10px] font-black text-slate-700 uppercase outline-none bg-transparent"
            >
              <option value="">Semua Provinsi</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center px-4 overflow-hidden disabled:opacity-50">
            <select 
              value={selectedRegencyName} 
              onChange={e => setSelectedRegencyName(e.target.value)}
              disabled={!selectedProvinceId}
              className="w-full py-3 text-[10px] font-black text-slate-700 uppercase outline-none bg-transparent"
            >
              <option value="">Semua Kabupaten</option>
              {regencies.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredPosts.map(post => {
          const lines = post.content.split('\n');
          const title = lines[0].length > 50 ? lines[0].substring(0, 50) + '...' : lines[0];

          return (
            <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden active:bg-slate-50 transition-colors cursor-pointer group">
              <div className="p-5 flex gap-4">
                <div className="flex-1 space-y-2">
                   <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${post.type === 'Marketplace' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {post.type}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300">{post.timestamp}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-800 leading-tight group-active:text-blue-600 transition-colors">{title}</h3>
                  <div className="flex items-center gap-2 pt-1">
                     <button 
                       onClick={(e) => { e.stopPropagation(); onOpenChat({ id: post.authorId, name: post.authorName } as User); }}
                       className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[9px] font-black active:scale-90"
                     >
                       {post.authorName[0]}
                     </button>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{post.authorName} • {post.authorLocation}</span>
                  </div>
                </div>
                {post.image && (
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100">
                    <img src={post.image} className="w-full h-full object-cover" alt="Thumb" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 space-y-5">
            <h3 className="font-black text-center text-slate-800 uppercase tracking-widest text-sm">Postingan Baru</h3>
            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
              <button onClick={() => setNewType('Diskusi')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${newType === 'Diskusi' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>Diskusi</button>
              <button onClick={() => setNewType('Marketplace')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${newType === 'Marketplace' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>Market</button>
            </div>
            <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Tulis judul di baris pertama, lalu deskripsi..." className="w-full p-5 bg-slate-50 rounded-[1.5rem] border-none text-sm font-bold h-44 outline-none focus:ring-4 focus:ring-blue-50 transition-all" />
            <div className="flex gap-2">
              <button onClick={handleAddPost} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Posting</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase">Batal</button>
            </div>
          </div>
        </div>
      )}

      {selectedPost && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-right">
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
             <button onClick={() => setSelectedPost(null)} className="w-10 h-10 flex items-center justify-center text-slate-800 active:scale-90">
                <i className="fas fa-arrow-left text-lg"></i>
             </button>
             <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{selectedPost.type}</h3>
             <div className="w-10"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-32">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onOpenChat({ id: selectedPost.authorId, name: selectedPost.authorName } as User)}
                  className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-lg active:scale-95 transition-all shadow-lg shadow-blue-500/30"
                >
                  {selectedPost.authorName[0]}
                </button>
                <div>
                  <h4 className="text-sm font-black text-slate-800">{selectedPost.authorName}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedPost.authorLocation} • {selectedPost.timestamp}</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-2">
                 <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedPost.content.split('\n')[0]}</h2>
                 <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedPost.content.split('\n').slice(1).join('\n')}</p>
                 {selectedPost.image && (
                   <img src={selectedPost.image} className="w-full rounded-[2.5rem] shadow-lg border-4 border-white" alt="Full" />
                 )}
              </div>

              <div className="flex gap-4 py-4 border-y border-slate-50">
                <button onClick={() => handleLike(selectedPost.id)} className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black transition-all ${selectedPost.likes.includes(user.id) ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400 active:bg-rose-50'}`}>
                  <i className={`${selectedPost.likes.includes(user.id) ? 'fas' : 'far'} fa-heart`}></i> {selectedPost.likes.length} Suka
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] px-2">Komentar ({selectedPost.comments.length})</h3>
              {selectedPost.comments.map(c => (
                <div key={c.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2">
                   <button 
                    onClick={() => onOpenChat({ id: c.authorId, name: c.authorName } as User)}
                    className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center text-xs font-black text-slate-400 border border-white shadow-sm"
                   >
                      {c.authorName[0]}
                   </button>
                   <div className="flex-1 space-y-1">
                      <div className="bg-slate-100/70 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mb-1">{c.authorName}</p>
                        <p className="text-xs font-medium text-slate-700 leading-relaxed">{c.content}</p>
                      </div>
                      <div className="flex gap-4 pl-2">
                         <button onClick={() => handleLike(selectedPost.id)} className="text-[9px] font-black text-slate-400 uppercase">Suka</button>
                         <button onClick={() => { setReplyToCommentId(c.id); setCommentText(''); }} className="text-[9px] font-black text-slate-400 uppercase">Balas</button>
                         <span className="text-[9px] font-bold text-slate-300 uppercase">{c.timestamp}</span>
                      </div>
                   </div>
                </div>
              ))}
              {selectedPost.comments.length === 0 && <p className="text-center text-slate-300 py-10 font-bold text-xs uppercase tracking-widest">Belum ada diskusi.</p>}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 safe-bottom">
            {replyToCommentId && (
              <div className="flex justify-between items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-t-2xl mb-1 text-[10px] font-bold uppercase animate-in slide-in-from-bottom">
                <span>Membalas {posts.find(p => p.id === selectedPost.id)?.comments.find(c => c.id === replyToCommentId)?.authorName}</span>
                <button onClick={() => setReplyToCommentId(null)}><i className="fas fa-times"></i></button>
              </div>
            )}
            <div className="flex gap-2 max-w-md mx-auto items-end">
              <textarea 
                rows={1}
                value={commentText} 
                onChange={e => setCommentText(e.target.value)} 
                placeholder="Tulis komentar..." 
                className="flex-1 p-4 bg-slate-100 rounded-2xl text-sm font-bold outline-none border-none resize-none focus:ring-4 focus:ring-blue-50 transition-all" 
              />
              <button onClick={() => handleAddComment(selectedPost.id)} className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 flex-shrink-0">
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

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Send, Image as ImageIcon, X, Trash2, User, Users, Home, Compass, Bell, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('pt-BR');
}

function PostCard({ post, currentUser, onLike, onDelete, onCommentAdded }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const token = localStorage.getItem('brane_token');
  const headers = { Authorization: `Bearer ${token}` };

  const liked = currentUser && post.likes?.includes(currentUser.user_id);
  const canDelete = currentUser && (currentUser.user_id === post.user_id || currentUser.role === 'admin');

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await axios.get(`${API}/social/posts/${post.post_id}/comments`);
      setComments(res.data.comments || []);
    } catch {}
    setLoadingComments(false);
  };

  const toggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next) loadComments();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await axios.post(`${API}/social/posts/${post.post_id}/comments`, { content: commentText }, { headers });
      setCommentText('');
      await loadComments();
      onCommentAdded?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao comentar');
    }
    setSubmittingComment(false);
  };

  return (
    <div className="bg-[#1a1028] border border-purple-900/40 rounded-2xl p-4 hover:border-purple-700/60 transition-all" data-testid={`post-${post.post_id}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0"
             style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
          {post.user_picture ? (
            <img src={post.user_picture} alt={post.user_name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{getInitials(post.user_name)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{post.user_name}</p>
          <p className="text-xs text-purple-300/60">{timeAgo(post.created_at)}</p>
        </div>
        {canDelete && (
          <button onClick={() => onDelete(post.post_id)} className="text-purple-300/50 hover:text-red-400 transition-colors p-1" data-testid={`delete-post-${post.post_id}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

      {/* Image */}
      {post.image && (
        <div className="rounded-xl overflow-hidden mb-3 bg-black/30">
          <img src={post.image.startsWith('http') ? post.image : `${API}/files/${post.image}`} alt="Post" className="w-full max-h-[500px] object-contain" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-purple-900/40">
        <button
          onClick={() => onLike(post.post_id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${liked ? 'text-pink-400 bg-pink-500/10' : 'text-purple-200/70 hover:text-pink-400 hover:bg-pink-500/5'}`}
          data-testid={`like-post-${post.post_id}`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-pink-400' : ''}`} />
          <span className="text-xs font-medium">{post.likes_count || 0}</span>
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-purple-200/70 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
          data-testid={`comment-post-${post.post_id}`}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{post.comments_count || 0}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-purple-900/40 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-purple-300/50 text-center">Carregando...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-purple-300/50 text-center py-2">Seja o primeiro a comentar</p>
          ) : (
            comments.map(c => (
              <div key={c.comment_id} className="flex gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                     style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
                  {c.user_picture ? <img src={c.user_picture} className="w-full h-full rounded-full object-cover" alt={c.user_name} /> : getInitials(c.user_name)}
                </div>
                <div className="flex-1 bg-black/30 rounded-2xl px-3 py-2">
                  <p className="text-xs font-semibold text-white">{c.user_name}</p>
                  <p className="text-xs text-purple-100/80">{c.content}</p>
                  <p className="text-[10px] text-purple-300/40 mt-1">{timeAgo(c.created_at)}</p>
                </div>
              </div>
            ))
          )}
          {currentUser && (
            <form onSubmit={submitComment} className="flex gap-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1 bg-black/30 border border-purple-900/40 rounded-full px-4 py-2 text-sm text-white placeholder:text-purple-300/40 focus:outline-none focus:border-pink-400"
                data-testid={`comment-input-${post.post_id}`}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white disabled:opacity-50 hover:scale-105 transition-transform"
                data-testid={`submit-comment-${post.post_id}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function SocialPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('brane_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/social/posts?limit=30`);
      setPosts(res.data.posts || []);
    } catch {}
    setLoading(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 5MB)');
      return;
    }
    setNewImage(file);
    const reader = new FileReader();
    reader.onload = () => setNewImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setNewImage(null);
    setNewImagePreview('');
  };

  const submitPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    if (!user) { navigate('/auth'); return; }

    setSubmitting(true);
    try {
      let imagePath = '';
      if (newImage) {
        const fd = new FormData();
        fd.append('file', newImage);
        const up = await axios.post(`${API}/upload`, fd, { headers });
        imagePath = up.data.path;
      }
      await axios.post(`${API}/social/posts`, { content: newPost, image: imagePath }, { headers });
      setNewPost('');
      removeImage();
      toast.success('Post publicado!');
      loadPosts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao publicar');
    }
    setSubmitting(false);
  };

  const toggleLike = async (postId) => {
    if (!user) { navigate('/auth'); return; }
    try {
      const res = await axios.post(`${API}/social/posts/${postId}/like`, {}, { headers });
      setPosts(prev => prev.map(p => {
        if (p.post_id !== postId) return p;
        const likes = p.likes || [];
        const newLikes = res.data.liked
          ? [...likes, user.user_id]
          : likes.filter(id => id !== user.user_id);
        return { ...p, likes: newLikes, likes_count: res.data.likes_count };
      }));
    } catch {}
  };

  const deletePost = async (postId) => {
    if (!confirm('Remover este post?')) return;
    try {
      await axios.delete(`${API}/social/posts/${postId}`, { headers });
      setPosts(prev => prev.filter(p => p.post_id !== postId));
      toast.success('Post removido');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0014 0%, #1a0033 100%)' }} data-testid="social-page">
      {/* Social Top Bar */}
      <div className="sticky top-16 z-40 backdrop-blur-xl bg-[#0a0014]/80 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
              <Users className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              BRANE
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/market" className="text-xs text-purple-300/70 hover:text-pink-300 px-3 py-1.5 rounded-lg border border-purple-900/40 hover:border-pink-500/40 transition-all">
              Ir ao Market →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Composer */}
        {user ? (
          <div className="bg-[#1a1028] border border-purple-900/40 rounded-2xl p-4 mb-6">
            <form onSubmit={submitPost}>
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                     style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
                  {user.picture ? <img src={user.picture} alt={user.name} className="w-full h-full rounded-full object-cover" /> : getInitials(user.name)}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    placeholder={`No que está pensando, ${user.name?.split(' ')[0] || 'você'}?`}
                    className="w-full bg-transparent text-white placeholder:text-purple-300/40 resize-none focus:outline-none text-sm"
                    rows={3}
                    maxLength={2000}
                    data-testid="post-content-input"
                  />
                </div>
              </div>
              {newImagePreview && (
                <div className="relative mt-3 rounded-xl overflow-hidden bg-black/30">
                  <img src={newImagePreview} alt="preview" className="w-full max-h-80 object-contain" />
                  <button type="button" onClick={removeImage} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-900/40">
                <label className="cursor-pointer flex items-center gap-2 text-xs text-purple-300 hover:text-pink-300 transition-colors" data-testid="add-image-btn">
                  <ImageIcon className="w-4 h-4" />
                  Adicionar foto
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
                <Button
                  type="submit"
                  disabled={!newPost.trim() || submitting}
                  className="rounded-full px-6 text-white"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
                  data-testid="submit-post-btn"
                >
                  {submitting ? 'Publicando...' : 'Publicar'}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-2xl p-6 mb-6 text-center">
            <Users className="w-10 h-10 text-pink-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-2">Entre para começar a postar</p>
            <p className="text-xs text-purple-200/60 mb-4">Conecte-se com outras pessoas na comunidade BRANE</p>
            <Link to="/auth">
              <Button className="rounded-full px-6 text-white" style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
                Entrar / Criar Conta
              </Button>
            </Link>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-[#1a1028] border border-purple-900/40 rounded-2xl">
              <MessageSquare className="w-12 h-12 text-purple-500/50 mx-auto mb-3" />
              <p className="text-purple-200/70">Nenhum post ainda.</p>
              <p className="text-xs text-purple-300/40 mt-2">Seja o primeiro a publicar!</p>
            </div>
          ) : (
            posts.map(p => (
              <PostCard
                key={p.post_id}
                post={p}
                currentUser={user}
                onLike={toggleLike}
                onDelete={deletePost}
                onCommentAdded={() => setPosts(prev => prev.map(x => x.post_id === p.post_id ? { ...x, comments_count: (x.comments_count || 0) + 1 } : x))}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

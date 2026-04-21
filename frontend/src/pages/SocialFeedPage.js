import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, MessageCircle, Share2, Image, Video, Send, X, MoreHorizontal, UserPlus, Users, Sparkles, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SocialNavbar from '../components/SocialNavbar';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function mediaUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}/files/${path}`;
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'agora';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function getInitials(name) {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
}

function Avatar({ user, size = 40, to }) {
  const body = (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center font-bold"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
        color: '#fff',
        fontSize: size * 0.4,
      }}
    >
      {user?.picture ? <img src={mediaUrl(user.picture)} alt="" className="w-full h-full object-cover" /> : getInitials(user?.display_name || user?.name || '?')}
    </div>
  );
  if (to) return <Link to={to}>{body}</Link>;
  return body;
}

// ==================== STORIES BAR ====================
function StoriesBar({ onCreate }) {
  const [groups, setGroups] = useState([]);
  const [viewing, setViewing] = useState(null);

  const fetch = () => axios.get(`${API}/social/stories`).then(r => setGroups(r.data.groups)).catch(() => {});
  useEffect(() => { fetch(); }, []);

  return (
    <>
      <div className="social-card p-4 mb-4" data-testid="stories-bar">
        <div className="flex gap-3 overflow-x-auto social-scroll">
          <button
            onClick={onCreate}
            className="flex flex-col items-center shrink-0"
            data-testid="create-story-btn"
          >
            <div className="story-ring relative" style={{ background: 'rgba(124, 58, 237, 0.3)' }}>
              <div className="story-inner">
                <div className="story-avatar" style={{ background: '#1a1a25' }}>
                  <Plus className="w-6 h-6 text-purple-300" />
                </div>
              </div>
            </div>
            <span className="text-[10px] mt-1 text-purple-300 font-medium">Criar Story</span>
          </button>

          {groups.map(g => (
            <button
              key={g.author_id}
              onClick={() => setViewing(g)}
              className="flex flex-col items-center shrink-0"
              data-testid={`story-${g.author_id}`}
            >
              <div className="story-ring">
                <div className="story-inner">
                  <div className="story-avatar">
                    {g.author_picture ? <img src={mediaUrl(g.author_picture)} alt="" /> : getInitials(g.author_name)}
                  </div>
                </div>
              </div>
              <span className="text-[10px] mt-1 text-[#C4B5FD] truncate max-w-[70px]">{g.author_name?.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {viewing && <StoryViewer group={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function StoryViewer({ group, onClose }) {
  const [idx, setIdx] = useState(0);
  const story = group.stories[idx];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (idx < group.stories.length - 1) setIdx(idx + 1);
      else onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [idx]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={onClose} data-testid="story-viewer">
      <button className="absolute top-4 right-4 text-white p-2" onClick={onClose}>
        <X className="w-6 h-6" />
      </button>

      <div className="absolute top-4 left-4 right-20 flex gap-1">
        {group.stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className={`h-full bg-white ${i < idx ? 'w-full' : i === idx ? 'animate-storyProgress w-0' : 'w-0'}`}
              style={{ animation: i === idx ? 'storyProgress 5s linear forwards' : undefined }} />
          </div>
        ))}
      </div>

      <div className="absolute top-8 left-4 flex items-center gap-2 text-white">
        <Avatar user={{ name: group.author_name, picture: group.author_picture }} size={32} />
        <span className="font-medium text-sm">{group.author_name}</span>
      </div>

      <div className="max-w-md w-full aspect-[9/16] bg-[#14141F] rounded-2xl overflow-hidden flex items-center justify-center" onClick={e => e.stopPropagation()}>
        {story.media_type === 'video' ? (
          <video src={mediaUrl(story.media)} controls autoPlay className="w-full h-full object-contain" />
        ) : (
          <img src={mediaUrl(story.media)} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {story.caption && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-white text-sm max-w-md">
          {story.caption}
        </div>
      )}

      <style>{`@keyframes storyProgress { from { width: 0%; } to { width: 100%; } }`}</style>
    </div>
  );
}

// ==================== CREATE POST ====================
function CreatePost({ onCreated }) {
  const { user, token } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const h = { Authorization: `Bearer ${token}` };

  const upload = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await axios.post(`${API}/upload`, fd, { headers: h, withCredentials: true });
    return res.data.path;
  };

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const paths = await Promise.all(files.map(upload));
      setMedia([...media, ...paths]);
    } catch { toast.error('Erro no upload'); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (!content.trim() && !media.length) return;
    setPosting(true);
    try {
      const res = await axios.post(`${API}/social/posts`, {
        content, media, media_type: 'image'
      }, { headers: h, withCredentials: true });
      setContent(''); setMedia([]);
      if (onCreated) onCreated(res.data);
      toast.success('Post publicado!');
    } catch { toast.error('Erro ao publicar'); }
    finally { setPosting(false); }
  };

  return (
    <div className="social-card p-4 mb-4" data-testid="create-post">
      <div className="flex gap-3">
        <Avatar user={user} size={40} />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`No que você está pensando, ${user?.name?.split(' ')[0]}?`}
          className="flex-1 social-input p-3 min-h-[60px] resize-none text-sm"
          data-testid="post-content-input"
        />
      </div>

      {media.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {media.map((m, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
              <img src={mediaUrl(m)} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setMedia(media.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-900/20">
        <div className="flex gap-2">
          <label className="social-btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} disabled={uploading} />
            <Image className="w-4 h-4" /> Fotos
          </label>
          <label className="social-btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer">
            <input type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={uploading} />
            <Video className="w-4 h-4" /> Video
          </label>
        </div>
        <button
          onClick={submit}
          disabled={posting || uploading || (!content.trim() && !media.length)}
          className="social-btn px-5 py-1.5 text-sm disabled:opacity-50"
          data-testid="submit-post-btn"
        >
          {posting ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </div>
  );
}

// ==================== CREATE STORY MODAL ====================
function CreateStoryModal({ open, onClose, onCreated }) {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  if (!open) return null;

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await axios.post(`${API}/upload`, fd, { headers: h, withCredentials: true });
      await axios.post(`${API}/social/stories`, {
        media: up.data.path,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
        caption,
      }, { headers: h, withCredentials: true });
      toast.success('Story publicado!');
      onCreated && onCreated();
      onClose();
      setFile(null); setPreview(''); setCaption('');
    } catch { toast.error('Erro ao publicar story'); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose} data-testid="create-story-modal">
      <div className="social-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h3 className="social-title text-xl mb-4">Criar Story</h3>

        {!preview ? (
          <label className="block aspect-[9/16] max-h-96 rounded-2xl border-2 border-dashed border-purple-500/30 flex items-center justify-center cursor-pointer hover:border-purple-500/60">
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
            <div className="text-center">
              <Image className="w-12 h-12 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-[#C4B5FD]">Clique para enviar foto ou vídeo</p>
            </div>
          </label>
        ) : (
          <div className="relative aspect-[9/16] max-h-96 mx-auto rounded-2xl overflow-hidden bg-black">
            {file?.type.startsWith('video') ? <video src={preview} controls className="w-full h-full" /> : <img src={preview} alt="" className="w-full h-full object-contain" />}
          </div>
        )}

        <input
          type="text"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Adicione uma legenda (opcional)"
          className="social-input w-full p-3 mt-4 text-sm"
          data-testid="story-caption-input"
        />

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="social-btn-ghost flex-1 py-2 text-sm">Cancelar</button>
          <button onClick={submit} disabled={!file || uploading} className="social-btn flex-1 py-2 text-sm" data-testid="publish-story-btn">
            {uploading ? 'Publicando...' : 'Publicar Story'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== POST CARD ====================
function PostCard({ post, onUpdate, onDelete }) {
  const { user, token } = useAuth();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [animating, setAnimating] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  const toggleLike = async () => {
    if (!user) return toast.error('Entre para curtir');
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    try {
      const res = await axios.post(`${API}/social/posts/${post.post_id}/like`, {}, { headers: h, withCredentials: true });
      setLiked(res.data.liked);
      setLikes(l => l + (res.data.liked ? 1 : -1));
    } catch {}
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const r = await axios.get(`${API}/social/posts/${post.post_id}/comments`);
        setComments(r.data.comments);
      } catch {}
    }
    setShowComments(!showComments);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const r = await axios.post(`${API}/social/posts/${post.post_id}/comments`, { content: newComment }, { headers: h, withCredentials: true });
      setComments([...comments, r.data]);
      setNewComment('');
    } catch {}
  };

  const share = async () => {
    try {
      await axios.post(`${API}/social/posts/${post.post_id}/share`, {}, { headers: h, withCredentials: true });
      navigator.clipboard?.writeText(`${window.location.origin}/social/posts/${post.post_id}`);
      toast.success('Link copiado!');
    } catch {}
  };

  const remove = async () => {
    if (!window.confirm('Remover post?')) return;
    try {
      await axios.delete(`${API}/social/posts/${post.post_id}`, { headers: h, withCredentials: true });
      onDelete && onDelete(post.post_id);
    } catch {}
  };

  const isOwner = user && post.author?.user_id === user.user_id;
  const authorName = post.author?.display_name || post.author?.name || 'Usuário';

  return (
    <div className="social-card p-4 mb-4" data-testid={`post-${post.post_id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar user={post.author} size={44} to={`/social/profile/${post.author?.user_id}`} />
          <div>
            <Link to={`/social/profile/${post.author?.user_id}`} className="username text-sm" data-testid={`post-author-${post.post_id}`}>
              {authorName}
            </Link>
            {post.author?.is_vip && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">VIP</span>}
            <p className="text-xs text-[#6B6B7B]">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        {isOwner && (
          <button onClick={remove} className="text-[#6B6B7B] hover:text-red-400 p-1" data-testid={`delete-post-${post.post_id}`}>
            <MoreHorizontal className="w-5 h-5" />
          </button>
        )}
      </div>

      {post.content && <p className="text-sm text-[#E5E7EB] mb-3 whitespace-pre-wrap">{post.content}</p>}

      {post.media?.length > 0 && (
        <div className={`grid gap-1 rounded-xl overflow-hidden mb-3 ${
          post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
        }`}>
          {post.media.slice(0, 4).map((m, i) => (
            <div key={i} className="relative aspect-square bg-black">
              {post.media_type === 'video' || /\.(mp4|mov|webm)$/i.test(m) ? (
                <video src={mediaUrl(m)} controls className="w-full h-full object-cover" />
              ) : (
                <img src={mediaUrl(m)} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-2 px-2">
        <span>{likes > 0 && `${likes} curtida${likes !== 1 ? 's' : ''}`}</span>
        <span>{post.comments_count > 0 && `${post.comments_count} comentário${post.comments_count !== 1 ? 's' : ''}`}</span>
      </div>

      <div className="flex items-center justify-around border-t border-purple-900/20 pt-2">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg hover:bg-purple-500/10 transition-all ${animating ? 'heart-pulse' : ''}`}
          data-testid={`like-btn-${post.post_id}`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-pink-500 text-pink-500' : 'text-[#9CA3AF]'}`} />
          <span className={`text-sm ${liked ? 'text-pink-500 font-medium' : 'text-[#9CA3AF]'}`}>Curtir</span>
        </button>
        <button
          onClick={loadComments}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg hover:bg-purple-500/10 text-[#9CA3AF] hover:text-purple-300"
          data-testid={`comment-btn-${post.post_id}`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">Comentar</span>
        </button>
        <button
          onClick={share}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg hover:bg-purple-500/10 text-[#9CA3AF] hover:text-purple-300"
          data-testid={`share-btn-${post.post_id}`}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm">Compartilhar</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-purple-900/20">
          <div className="space-y-2 max-h-60 overflow-y-auto social-scroll mb-3">
            {comments.length === 0 && <p className="text-xs text-[#6B6B7B] text-center py-2">Nenhum comentário ainda</p>}
            {comments.map(c => (
              <div key={c.comment_id} className="flex gap-2">
                <Avatar user={{ name: c.author_name, picture: c.author_picture }} size={28} to={`/social/profile/${c.author_id}`} />
                <div className="flex-1 bg-[#14141F]/80 rounded-2xl px-3 py-2">
                  <Link to={`/social/profile/${c.author_id}`} className="username text-xs">{c.author_name}</Link>
                  <p className="text-sm text-[#E5E7EB]">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          {user && (
            <div className="flex gap-2">
              <Avatar user={user} size={28} />
              <div className="flex-1 flex gap-1">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                  placeholder="Escreva um comentário..."
                  className="social-input flex-1 px-3 py-1.5 text-sm"
                  data-testid={`comment-input-${post.post_id}`}
                />
                <button onClick={addComment} className="social-btn px-3 py-1.5" data-testid={`send-comment-${post.post_id}`}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== AD CARD ====================
function AdCard({ ad }) {
  const click = async () => {
    try { await axios.post(`${API}/social/ads/${ad.ad_id}/click`); } catch {}
    window.open(ad.link, '_blank');
  };
  return (
    <div className="social-card p-4 mb-4 relative border-amber-500/30" style={{ borderColor: 'rgba(179, 139, 54, 0.3)' }} data-testid={`social-ad-${ad.ad_id}`}>
      <div className="absolute top-3 right-3 social-ad-badge">ANÚNCIO</div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-amber-400 text-sm">{ad.title}</p>
          <p className="text-[10px] text-[#6B6B7B]">Patrocinado · BRANE</p>
        </div>
      </div>
      {ad.body && <p className="text-sm text-[#E5E7EB] mb-3">{ad.body}</p>}
      {ad.image && (
        <div className="rounded-xl overflow-hidden mb-3 cursor-pointer" onClick={click}>
          <img src={mediaUrl(ad.image)} alt={ad.title} className="w-full object-cover max-h-96" />
        </div>
      )}
      <button onClick={click} className="social-btn w-full py-2 text-sm" style={{ background: 'linear-gradient(135deg, #B38B36, #D4A84B)' }}>
        {ad.cta || 'Saiba mais'}
      </button>
    </div>
  );
}

// ==================== SUGGESTIONS ====================
function Suggestions() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const h = { Authorization: `Bearer ${token}` };

  const fetch = () => axios.get(`${API}/social/suggestions`, { headers: h, withCredentials: true })
    .then(r => setUsers(r.data.suggestions)).catch(() => {});

  useEffect(() => { fetch(); }, []);

  const follow = async (uid) => {
    try {
      await axios.post(`${API}/social/follow/${uid}`, {}, { headers: h, withCredentials: true });
      setUsers(u => u.filter(x => x.user_id !== uid));
      toast.success('Seguindo!');
    } catch {}
  };

  if (!users.length) return null;

  return (
    <div className="social-card p-4 sticky top-24" data-testid="suggestions-panel">
      <h3 className="social-title text-sm mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-purple-400" /> Sugestões
      </h3>
      <div className="space-y-3">
        {users.slice(0, 5).map(u => (
          <div key={u.user_id} className="flex items-center gap-2">
            <Avatar user={u} size={32} to={`/social/profile/${u.user_id}`} />
            <Link to={`/social/profile/${u.user_id}`} className="flex-1 min-w-0">
              <p className="username text-xs truncate">{u.display_name || u.name}</p>
              <p className="text-[10px] text-[#6B6B7B] truncate">@{u.user_id.slice(0, 10)}</p>
            </Link>
            <button onClick={() => follow(u.user_id)} className="social-btn-ghost px-2 py-1 text-[10px]" data-testid={`follow-${u.user_id}`}>
              Seguir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== FEED PAGE ====================
export default function SocialFeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storyOpen, setStoryOpen] = useState(false);
  const storiesRef = useRef();

  useEffect(() => {
    if (!user) {
      navigate('/entry');
      return;
    }
  }, [user]);

  const fetchFeed = () => {
    setLoading(true);
    axios.get(`${API}/social/feed?limit=30`)
      .then(r => setPosts(r.data.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFeed(); }, []);

  const onNewPost = (p) => setPosts([p, ...posts]);
  const onDelete = (id) => setPosts(posts.filter(p => p.post_id !== id));

  if (!user) return null;

  return (
    <div className="social-shell">
      <SocialNavbar />
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <StoriesBar onCreate={() => setStoryOpen(true)} />
          <CreatePost onCreated={onNewPost} />

          {loading ? (
            <div className="text-center py-12 text-[#9CA3AF]" data-testid="feed-loading">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : posts.length === 0 ? (
            <div className="social-card p-12 text-center" data-testid="feed-empty">
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <p className="text-[#C4B5FD] mb-1 font-semibold">Seu feed está vazio</p>
              <p className="text-sm text-[#6B6B7B]">Publique algo ou siga pessoas para começar.</p>
            </div>
          ) : (
            <div data-testid="feed-posts">
              {posts.map(p => (
                p.is_ad ? <AdCard key={p.post_id || p.ad_id} ad={p} /> : <PostCard key={p.post_id} post={p} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <Suggestions />
        </aside>
      </div>

      <CreateStoryModal open={storyOpen} onClose={() => setStoryOpen(false)} onCreated={fetchFeed} />
    </div>
  );
}

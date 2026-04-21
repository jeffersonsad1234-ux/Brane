import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import SocialNavbar from '../components/SocialNavbar';
import { UserPlus, UserCheck, MessageCircle, Image, Camera, Edit3, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const mediaUrl = (p) => !p ? '' : p.startsWith('http') ? p : `${API}/files/${p}`;
const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

export default function SocialProfilePage() {
  const { userId } = useParams();
  const { user: me, token, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: '', bio: '', picture: '', cover: '' });
  const [uploading, setUploading] = useState(null);

  const h = { Authorization: `Bearer ${token}` };
  const isMe = me?.user_id === userId;

  const fetchProfile = () => {
    setLoading(true);
    axios.get(`${API}/social/profile/${userId}`, { headers: h, withCredentials: true })
      .then(r => {
        setProfile(r.data);
        setForm({
          display_name: r.data.display_name || '',
          bio: r.data.bio || '',
          picture: r.data.picture || '',
          cover: r.data.cover || '',
        });
      })
      .catch(() => toast.error('Perfil não encontrado'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, [userId]);

  const toggleFollow = async () => {
    try {
      const r = await axios.post(`${API}/social/follow/${userId}`, {}, { headers: h, withCredentials: true });
      setProfile({ ...profile, is_following: r.data.following, followers_count: profile.followers_count + (r.data.following ? 1 : -1) });
    } catch { toast.error('Erro'); }
  };

  const handleUpload = async (file, field) => {
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, { headers: h, withCredentials: true });
      setForm(f => ({ ...f, [field]: res.data.path }));
    } catch { toast.error('Erro no upload'); }
    finally { setUploading(null); }
  };

  const saveProfile = async () => {
    try {
      const res = await axios.put(`${API}/social/profile`, form, { headers: h, withCredentials: true });
      toast.success('Perfil atualizado!');
      setEditing(false);
      if (setUser) setUser(u => ({ ...u, ...res.data }));
      fetchProfile();
    } catch { toast.error('Erro ao salvar'); }
  };

  if (loading) {
    return (
      <div className="social-shell">
        <SocialNavbar />
        <div className="max-w-4xl mx-auto p-8 text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="social-shell" data-testid="social-profile-page">
      <SocialNavbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Cover + Avatar */}
        <div className="relative mb-20">
          <div className="profile-hero" style={editing && form.cover ? { backgroundImage: `url(${mediaUrl(form.cover)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : (profile.cover ? { backgroundImage: `url(${mediaUrl(profile.cover)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})}>
            {editing && (
              <label className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs cursor-pointer hover:bg-black/80 flex items-center gap-1">
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUpload(e.target.files[0], 'cover')} />
                <Camera className="w-3.5 h-3.5" /> {uploading === 'cover' ? 'Enviando...' : 'Capa'}
              </label>
            )}
          </div>
          <div className="absolute -bottom-16 left-6 flex items-end gap-4">
            <div className="profile-avatar-lg relative">
              {(editing ? form.picture : profile.picture) ?
                <img src={mediaUrl(editing ? form.picture : profile.picture)} alt="" /> :
                getInitials(profile.display_name || profile.name)
              }
              {editing && (
                <label className="absolute bottom-1 right-1 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700">
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUpload(e.target.files[0], 'picture')} />
                  <Camera className="w-3.5 h-3.5 text-white" />
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="absolute right-4 -bottom-12 flex gap-2">
            {isMe ? (
              editing ? (
                <>
                  <button onClick={() => { setEditing(false); setForm({ display_name: profile.display_name || '', bio: profile.bio || '', picture: profile.picture || '', cover: profile.cover || '' }); }} className="social-btn-ghost px-4 py-2 text-sm" data-testid="cancel-edit">
                    <X className="w-4 h-4 mr-1 inline" /> Cancelar
                  </button>
                  <button onClick={saveProfile} className="social-btn px-4 py-2 text-sm" data-testid="save-profile">
                    <Check className="w-4 h-4 mr-1 inline" /> Salvar
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="social-btn-ghost px-4 py-2 text-sm" data-testid="edit-profile">
                  <Edit3 className="w-4 h-4 mr-1 inline" /> Editar perfil
                </button>
              )
            ) : me ? (
              <>
                <button onClick={toggleFollow} className={profile.is_following ? "social-btn-ghost px-4 py-2 text-sm" : "social-btn px-4 py-2 text-sm"} data-testid="toggle-follow">
                  {profile.is_following ? <><UserCheck className="w-4 h-4 mr-1 inline" /> Seguindo</> : <><UserPlus className="w-4 h-4 mr-1 inline" /> Seguir</>}
                </button>
                <button onClick={() => navigate(`/social/messages/${userId}`)} className="social-btn-ghost px-4 py-2 text-sm" data-testid="message-user">
                  <MessageCircle className="w-4 h-4 mr-1 inline" /> Mensagem
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Info */}
        <div className="px-6 mb-6" data-testid="profile-info">
          {editing ? (
            <>
              <input
                value={form.display_name}
                onChange={e => setForm({ ...form, display_name: e.target.value })}
                placeholder="Nome de exibição"
                className="social-input px-3 py-2 text-xl font-bold w-full max-w-md mb-2"
                data-testid="edit-display-name"
              />
              <textarea
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Sua bio..."
                rows={3}
                className="social-input px-3 py-2 text-sm w-full max-w-md"
                data-testid="edit-bio"
              />
            </>
          ) : (
            <>
              <h1 className="social-title text-2xl sm:text-3xl flex items-center gap-2" data-testid="profile-name">
                {profile.display_name || profile.name}
                {profile.is_vip && <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">VIP</span>}
              </h1>
              <p className="text-[#9CA3AF] text-sm mt-1">@{profile.user_id?.slice(0, 12)}</p>
              {profile.bio && <p className="text-sm text-[#D1D5DB] mt-3 max-w-xl whitespace-pre-wrap">{profile.bio}</p>}
            </>
          )}

          <div className="flex gap-6 mt-4 text-sm">
            <div data-testid="stat-posts"><span className="font-bold text-white">{profile.posts_count}</span> <span className="text-[#9CA3AF]">posts</span></div>
            <div data-testid="stat-followers"><span className="font-bold text-white">{profile.followers_count}</span> <span className="text-[#9CA3AF]">seguidores</span></div>
            <div data-testid="stat-following"><span className="font-bold text-white">{profile.following_count}</span> <span className="text-[#9CA3AF]">seguindo</span></div>
          </div>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2" data-testid="profile-posts">
          {profile.posts?.length === 0 && (
            <div className="col-span-3 text-center py-12 text-[#6B6B7B]">
              <Image className="w-10 h-10 mx-auto mb-2" />
              <p>Nenhuma publicação ainda</p>
            </div>
          )}
          {profile.posts?.map(p => (
            <Link key={p.post_id} to={`/social/posts/${p.post_id}`} className="aspect-square rounded-lg overflow-hidden bg-[#14141F] group relative">
              {p.media?.[0] ? (
                <img src={mediaUrl(p.media[0])} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <p className="text-xs text-[#9CA3AF] line-clamp-4">{p.content}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

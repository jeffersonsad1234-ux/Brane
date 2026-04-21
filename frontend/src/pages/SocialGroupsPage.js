import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import SocialNavbar from '../components/SocialNavbar';
import { Users, Plus, X, Image as ImageIcon, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const mediaUrl = (p) => !p ? '' : p.startsWith('http') ? p : `${API}/files/${p}`;
const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function CreateGroupModal({ open, onClose, onCreated }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ name: '', description: '', privacy: 'public', cover: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  if (!open) return null;

  const uploadCover = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', f);
      const r = await axios.post(`${API}/upload`, fd, { headers: h, withCredentials: true });
      setForm({ ...form, cover: r.data.path });
    } catch { toast.error('Erro no upload'); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Nome é obrigatório');
    setSaving(true);
    try {
      const r = await axios.post(`${API}/social/groups`, form, { headers: h, withCredentials: true });
      toast.success('Grupo criado!');
      onCreated && onCreated(r.data);
      onClose();
      setForm({ name: '', description: '', privacy: 'public', cover: '' });
    } catch { toast.error('Erro ao criar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose} data-testid="create-group-modal">
      <div className="social-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h3 className="social-title text-xl mb-4">Criar Grupo</h3>
        <div className="space-y-3">
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Nome do grupo"
            className="social-input w-full px-3 py-2 text-sm"
            data-testid="group-name-input"
          />
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição (opcional)"
            rows={3}
            className="social-input w-full px-3 py-2 text-sm"
            data-testid="group-desc-input"
          />
          <div className="flex gap-2">
            <button onClick={() => setForm({ ...form, privacy: 'public' })} className={form.privacy === 'public' ? 'social-btn flex-1 py-2 text-xs' : 'social-btn-ghost flex-1 py-2 text-xs'}>
              <Globe className="w-3.5 h-3.5 inline mr-1" /> Público
            </button>
            <button onClick={() => setForm({ ...form, privacy: 'private' })} className={form.privacy === 'private' ? 'social-btn flex-1 py-2 text-xs' : 'social-btn-ghost flex-1 py-2 text-xs'}>
              <Lock className="w-3.5 h-3.5 inline mr-1" /> Privado
            </button>
          </div>
          <label className="block">
            <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-purple-500/30 rounded-lg cursor-pointer hover:border-purple-500/60 text-sm text-[#9CA3AF]">
              <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
              <ImageIcon className="w-4 h-4" /> {form.cover ? 'Trocar capa' : (uploading ? 'Enviando...' : 'Adicionar capa (opcional)')}
            </div>
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="social-btn-ghost flex-1 py-2 text-sm">Cancelar</button>
          <button onClick={submit} disabled={saving} className="social-btn flex-1 py-2 text-sm" data-testid="submit-group">
            {saving ? 'Criando...' : 'Criar Grupo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SocialGroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const fetch = () => axios.get(`${API}/social/groups`).then(r => setGroups(r.data.groups)).catch(() => {});

  useEffect(() => {
    if (!user) { navigate('/entry'); return; }
    fetch();
  }, [user]);

  if (!user) return null;

  return (
    <div className="social-shell" data-testid="social-groups-page">
      <SocialNavbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="social-title text-2xl flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" /> Grupos
          </h1>
          <button onClick={() => setShowCreate(true)} className="social-btn px-4 py-2 text-sm" data-testid="create-group-btn">
            <Plus className="w-4 h-4 mr-1 inline" /> Criar Grupo
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="social-card p-12 text-center" data-testid="no-groups">
            <Users className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-[#C4B5FD]">Nenhum grupo ainda. Seja o primeiro!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => (
              <Link key={g.group_id} to={`/social/groups/${g.group_id}`} className="social-card overflow-hidden hover:scale-[1.02] transition-transform" data-testid={`group-${g.group_id}`}>
                <div className="h-32 relative" style={g.cover ? { backgroundImage: `url(${mediaUrl(g.cover)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                  {g.privacy === 'private' && (
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Privado
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="social-title text-lg line-clamp-1">{g.name}</h3>
                  <p className="text-xs text-[#9CA3AF] line-clamp-2 min-h-[32px] mt-1">{g.description || 'Sem descrição'}</p>
                  <p className="text-xs text-purple-400 mt-2"><Users className="w-3 h-3 inline mr-1" /> {g.members_count} membros</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetch} />
    </div>
  );
}

export function SocialGroupDetailPage() {
  const { groupId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const h = { Authorization: `Bearer ${token}` };

  const fetch = () => axios.get(`${API}/social/groups/${groupId}`, { headers: h, withCredentials: true }).then(r => { setGroup(r.data); setLoading(false); }).catch(() => { setLoading(false); });

  useEffect(() => {
    if (!user) { navigate('/entry'); return; }
    fetch();
  }, [groupId, user]);

  const toggleJoin = async () => {
    try {
      const r = await axios.post(`${API}/social/groups/${groupId}/join`, {}, { headers: h, withCredentials: true });
      toast.success(r.data.joined ? 'Você entrou no grupo!' : 'Você saiu do grupo');
      fetch();
    } catch {}
  };

  const post = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await axios.post(`${API}/social/groups/posts`, { group_id: groupId, content }, { headers: h, withCredentials: true });
      setContent('');
      fetch();
    } catch { toast.error('Erro ao publicar'); }
    finally { setPosting(false); }
  };

  if (!user) return null;

  if (loading) return (
    <div className="social-shell"><SocialNavbar />
      <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
    </div>
  );

  if (!group) return (
    <div className="social-shell"><SocialNavbar />
      <div className="p-8 text-center text-[#9CA3AF]">Grupo não encontrado</div>
    </div>
  );

  return (
    <div className="social-shell" data-testid="social-group-detail-page">
      <SocialNavbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="social-card overflow-hidden mb-4">
          <div className="h-48" style={group.cover ? { backgroundImage: `url(${mediaUrl(group.cover)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="social-title text-2xl">{group.name}</h1>
                <p className="text-sm text-[#9CA3AF] mt-1"><Users className="w-4 h-4 inline mr-1" /> {group.members_count} membros · {group.privacy === 'private' ? 'Privado' : 'Público'}</p>
                {group.description && <p className="text-sm text-[#D1D5DB] mt-3">{group.description}</p>}
              </div>
              <button onClick={toggleJoin} className={group.is_member ? 'social-btn-ghost px-4 py-2 text-sm' : 'social-btn px-4 py-2 text-sm'} data-testid="toggle-group-join">
                {group.is_member ? 'Sair' : 'Entrar'}
              </button>
            </div>
          </div>
        </div>

        {group.is_member && (
          <div className="social-card p-4 mb-4">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Compartilhe algo com o grupo..."
              rows={3}
              className="social-input w-full px-3 py-2 text-sm"
              data-testid="group-post-input"
            />
            <div className="flex justify-end mt-2">
              <button onClick={post} disabled={posting || !content.trim()} className="social-btn px-4 py-1.5 text-sm disabled:opacity-50" data-testid="group-post-submit">
                {posting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        )}

        <div data-testid="group-posts">
          {group.posts?.length === 0 ? (
            <div className="social-card p-8 text-center text-[#9CA3AF]">Nenhuma publicação ainda</div>
          ) : (
            group.posts?.map(p => (
              <div key={p.post_id} className="social-card p-4 mb-3" data-testid={`group-post-${p.post_id}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Link to={`/social/profile/${p.author?.user_id}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-500 flex items-center justify-center text-white font-bold">
                      {p.author?.picture ? <img src={mediaUrl(p.author.picture)} alt="" className="w-full h-full object-cover" /> : getInitials(p.author?.name)}
                    </div>
                  </Link>
                  <div>
                    <Link to={`/social/profile/${p.author?.user_id}`} className="username text-sm">{p.author?.display_name || p.author?.name}</Link>
                    <p className="text-xs text-[#6B6B7B]">{timeAgo(p.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm text-[#E5E7EB] whitespace-pre-wrap">{p.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

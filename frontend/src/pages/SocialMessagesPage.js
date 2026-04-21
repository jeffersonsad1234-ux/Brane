import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import SocialNavbar from '../components/SocialNavbar';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const mediaUrl = (p) => !p ? '' : p.startsWith('http') ? p : `${API}/files/${p}`;
const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

function Avatar({ user, size = 40 }) {
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: '#fff', fontSize: size * 0.4 }}
    >
      {user?.picture ? <img src={mediaUrl(user.picture)} alt="" className="w-full h-full object-cover" /> : getInitials(user?.display_name || user?.name || '?')}
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function SocialMessagesPage() {
  const { userId } = useParams();
  const { user: me, token } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef();

  const h = { Authorization: `Bearer ${token}` };

  const fetchThreads = () => {
    axios.get(`${API}/social/messages/threads`, { headers: h, withCredentials: true })
      .then(r => setThreads(r.data.threads)).catch(() => {}).finally(() => setLoading(false));
  };

  const fetchThread = (uid) => {
    axios.get(`${API}/social/messages/${uid}`, { headers: h, withCredentials: true })
      .then(r => {
        setMessages(r.data.messages);
        setOtherUser(r.data.other_user);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }).catch(() => {});
  };

  useEffect(() => {
    if (!me) { navigate('/entry'); return; }
    fetchThreads();
  }, [me]);

  useEffect(() => {
    if (userId) fetchThread(userId);
    else { setMessages([]); setOtherUser(null); }
  }, [userId]);

  // Polling for new messages when viewing a thread
  useEffect(() => {
    if (!userId) return;
    const t = setInterval(() => fetchThread(userId), 5000);
    return () => clearInterval(t);
  }, [userId]);

  const send = async () => {
    if (!newMsg.trim() || !userId) return;
    try {
      await axios.post(`${API}/social/messages`, { to_user_id: userId, content: newMsg }, { headers: h, withCredentials: true });
      setNewMsg('');
      fetchThread(userId);
      fetchThreads();
    } catch {}
  };

  if (!me) return null;

  return (
    <div className="social-shell" data-testid="social-messages-page">
      <SocialNavbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="social-card overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100vh-140px)]">
          {/* Threads list */}
          <div className={`border-r border-purple-900/20 overflow-y-auto social-scroll ${userId ? 'hidden md:block' : ''}`}>
            <div className="p-4 border-b border-purple-900/20">
              <h2 className="social-title text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-400" /> Mensagens
              </h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-[#9CA3AF] text-sm">Carregando...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-[#6B6B7B] text-sm" data-testid="no-threads">
                <MessageCircle className="w-10 h-10 mx-auto mb-2" />
                <p>Nenhuma conversa ainda</p>
              </div>
            ) : (
              threads.map(t => (
                <Link
                  key={t.thread_id}
                  to={`/social/messages/${t.other_user?.user_id}`}
                  className={`flex items-center gap-3 p-3 hover:bg-purple-500/5 transition-all ${userId === t.other_user?.user_id ? 'bg-purple-500/10' : ''}`}
                  data-testid={`thread-${t.other_user?.user_id}`}
                >
                  <Avatar user={t.other_user} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="username text-sm truncate">{t.other_user?.display_name || t.other_user?.name}</p>
                      <span className="text-[10px] text-[#6B6B7B] shrink-0">{timeAgo(t.last_message?.created_at)}</span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] truncate">{t.last_message?.content}</p>
                  </div>
                  {t.unread_count > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-pink-500 text-white rounded-full flex items-center justify-center">{t.unread_count}</span>
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Chat area */}
          <div className={`flex flex-col ${!userId ? 'hidden md:flex' : ''}`}>
            {userId && otherUser ? (
              <>
                <div className="p-3 border-b border-purple-900/20 flex items-center gap-3">
                  <button onClick={() => navigate('/social/messages')} className="md:hidden text-[#9CA3AF] p-1">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Link to={`/social/profile/${otherUser.user_id}`}><Avatar user={otherUser} size={40} /></Link>
                  <div>
                    <Link to={`/social/profile/${otherUser.user_id}`} className="username text-sm">{otherUser.display_name || otherUser.name}</Link>
                    <p className="text-[10px] text-[#6B6B7B]">@{otherUser.user_id?.slice(0, 10)}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 social-scroll">
                  {messages.length === 0 && (
                    <div className="text-center py-12 text-[#6B6B7B]">
                      <p>Comece a conversa!</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {messages.map(m => (
                      <div key={m.message_id} className={`flex ${m.from_user_id === me.user_id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`chat-bubble ${m.from_user_id === me.user_id ? 'chat-bubble-me' : 'chat-bubble-them'}`} data-testid={`msg-${m.message_id}`}>
                          <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                          <p className="text-[10px] opacity-70 mt-1">{timeAgo(m.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div ref={endRef} />
                </div>

                <div className="p-3 border-t border-purple-900/20 flex gap-2">
                  <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Escreva uma mensagem..."
                    className="social-input flex-1 px-4 py-2 text-sm"
                    data-testid="msg-input"
                  />
                  <button onClick={send} className="social-btn px-4 py-2" disabled={!newMsg.trim()} data-testid="send-msg">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#6B6B7B]">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-3 text-purple-500/30" />
                  <p className="social-title text-lg">Selecione uma conversa</p>
                  <p className="text-sm mt-1">Ou comece uma nova pelo perfil</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

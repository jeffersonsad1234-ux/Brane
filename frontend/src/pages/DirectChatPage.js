import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, User as UserIcon, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DirectChatPage() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent(`/chat/${userId}`)}`);
      return;
    }
    if (userId === user.user_id) {
      toast.error('Você não pode conversar consigo mesmo');
      navigate(-1);
      return;
    }
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/direct-chat/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setOther(res.data.other);
      setMessages(res.data.messages || []);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('Usuário não encontrado');
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    setSending(true);
    try {
      await axios.post(`${API}/direct-chat/${userId}`, { message: msg, product_id: productId || null }, { headers: { Authorization: `Bearer ${token}` } });
      setText('');
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  const fmtTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    } catch { return ''; }
  };

  if (loading) {
    return (
      <div className="min-h-screen carbon-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-bg py-6" data-testid="direct-chat-page">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-[#A6A8B3] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="bg-[#0B0D12] border border-[#1E2230] rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 160px)', minHeight: '500px' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E2230] bg-gradient-to-r from-[#0B0D12] to-[#11131A]">
            <div className="w-12 h-12 rounded-full bg-[#11131A] border border-[#1E2230] overflow-hidden flex items-center justify-center shrink-0">
              {other?.picture ? (
                <img src={other.picture} alt={other.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-6 h-6 text-[#D4A24C]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{other?.name || 'Usuário'}</p>
              <p className="text-xs text-[#A6A8B3] flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> Chat direto
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#050608]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[#6F7280]">
                <MessageCircle className="w-12 h-12 text-[#1E2230] mb-3" />
                <p className="text-sm">Nenhuma mensagem ainda. Envie a primeira!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.sender_id === user?.user_id;
                return (
                  <div key={m.message_id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                      isMine
                        ? 'bg-gradient-to-br from-[#D4A24C] to-[#B38B36] text-black rounded-br-md'
                        : 'bg-[#11131A] border border-[#1E2230] text-white rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-black/60' : 'text-[#6F7280]'}`}>
                        {fmtTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="px-3 py-3 border-t border-[#1E2230] bg-[#0B0D12] flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Escreva sua mensagem..."
              className="flex-1 px-4 py-2.5 rounded-full bg-[#11131A] border border-[#1E2230] text-white text-sm placeholder:text-[#4F525B] focus:outline-none focus:border-[#D4A24C] transition-colors"
              disabled={sending}
              data-testid="direct-chat-input"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="w-11 h-11 rounded-full bg-[#D4A24C] hover:bg-[#E8C372] text-black flex items-center justify-center disabled:opacity-50 transition"
              data-testid="direct-chat-send-btn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

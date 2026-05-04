import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { MessageCircle, Send, ArrowLeft, HelpCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SupportPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = () => {
    if (!token) return;
    axios.get(`${API}/support/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setMessages(r.data.messages))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(); const i = setInterval(fetchMessages, 5000); return () => clearInterval(i); }, [token]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMsg = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await axios.post(`${API}/support/message`, { message: msg }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg('');
      fetchMessages();
    } catch { toast.error('Erro ao enviar'); }
    finally { setSending(false); }
  };

  if (loading) return <div className="brane-page flex items-center justify-center"><div className="w-9 h-9 border-2 border-[#5B1CB5] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="brane-page py-10" data-testid="support-page">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#A6A8B3] hover:text-[#D4A24C] mb-4 transition" data-testid="back-btn">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="brane-label mb-2">Atendimento</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-[#D4A24C]" /> Suporte BRANE
            </h1>
          </div>
          <Link to="/pages/faq" data-testid="help-center-link">
            <button className="brane-btn-outline">
              <HelpCircle className="w-4 h-4" /> Central de Ajuda
            </button>
          </Link>
        </div>

        <div className="brane-card overflow-hidden">
          <div className="h-[420px] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-10 h-10 text-[#4F525B] mx-auto mb-3" />
                <p className="text-[#A6A8B3]">Envie sua primeira mensagem</p>
                <p className="text-xs text-[#6F7280] mt-1">A equipe responderá em até 24h.</p>
              </div>
            ) : messages.map(m => (
              <div key={m.message_id} className={`flex ${m.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  m.is_admin_reply
                    ? 'bg-[#11131A] text-white border border-[#1E2230] rounded-bl-sm'
                    : 'text-white rounded-br-sm'
                }`} style={!m.is_admin_reply ? { background: 'linear-gradient(135deg, #5B1CB5 0%, #6D28D9 100%)' } : {}}>
                  <p className="text-sm">{m.message}</p>
                  <p className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-[#1E2230] p-3 flex gap-2">
            <input
              value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#11131A] border border-[#1E2230] text-white text-sm focus:outline-none focus:border-[#5B1CB5]"
              data-testid="support-message-input"
            />
            <button onClick={sendMsg} disabled={sending || !msg.trim()}
              className="px-5 py-2.5 rounded-xl text-white disabled:opacity-50 transition"
              style={{ background: 'linear-gradient(135deg, #5B1CB5 0%, #6D28D9 100%)' }}
              data-testid="support-send-btn">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

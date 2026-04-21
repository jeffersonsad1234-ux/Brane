import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SupportPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = () => {
    if (!token) return;
    axios.get(`${API}/support/messages`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true })
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
      await axios.post(`${API}/support/message`, { message: msg }, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
      setMsg('');
      fetchMessages();
    } catch { toast.error('Erro ao enviar'); }
    finally { setSending(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="support-page">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#888] hover:text-[#B38B36] mb-4"><ArrowLeft className="w-4 h-4" /> Voltar</button>
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><MessageCircle className="w-6 h-6 text-[#B38B36]" /> Suporte BRANE</h1>
        <div className="dark-card rounded-xl overflow-hidden">
          <div className="h-[400px] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12"><MessageCircle className="w-10 h-10 text-[#333] mx-auto mb-3" /><p className="text-[#888]">Envie sua primeira mensagem</p></div>
            ) : messages.map(m => (
              <div key={m.message_id} className={`flex ${m.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${m.is_admin_reply ? 'bg-[#2A2A2A] text-white rounded-bl-sm' : 'bg-[#B38B36] text-white rounded-br-sm'}`}>
                  <p className="text-sm">{m.message}</p>
                  <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-[#2A2A2A] p-3 flex gap-2">
            <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder="Digite sua mensagem..." className="flex-1 px-4 py-2.5 rounded-lg bg-[#111] border border-[#2A2A2A] text-white text-sm focus:outline-none focus:border-[#B38B36]" />
            <button onClick={sendMsg} disabled={sending || !msg.trim()}
              className="px-4 py-2.5 bg-[#B38B36] hover:bg-[#D4A842] text-white rounded-lg disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

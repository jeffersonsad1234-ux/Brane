import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, X, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function FloatingSupport() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const sendMsg = async () => {
    if (!msg.trim()) return;
    if (!user) { navigate('/auth'); return; }
    setSending(true);
    try {
      await axios.post(`${API}/support/message`, { message: msg }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Mensagem enviada ao suporte!');
      setMsg('');
      setOpen(false);
    } catch { toast.error('Erro ao enviar'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]" data-testid="floating-support">
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
          <div className="bg-[#B38B36] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Suporte BRANE</p>
              <p className="text-white/70 text-xs">Estamos aqui para ajudar</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4">
            <p className="text-[#888] text-xs mb-3">Envie sua mensagem e responderemos o mais rapido possivel.</p>
            <textarea
              value={msg} onChange={e => setMsg(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="w-full h-24 p-3 rounded-lg bg-[#111] border border-[#2A2A2A] text-white text-sm resize-none focus:outline-none focus:border-[#B38B36]"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setOpen(false); navigate('/support'); }}
                className="flex-1 py-2 text-xs text-[#888] hover:text-white border border-[#2A2A2A] rounded-lg transition-colors">
                Ver historico
              </button>
              <button onClick={sendMsg} disabled={sending || !msg.trim()}
                className="flex-1 py-2 text-sm font-medium text-white bg-[#B38B36] hover:bg-[#D4A842] rounded-lg disabled:opacity-50 flex items-center justify-center gap-1">
                <Send className="w-3.5 h-3.5" /> {sending ? '...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => user ? setOpen(!open) : navigate('/auth')}
        className="w-14 h-14 rounded-full bg-[#B38B36] hover:bg-[#D4A842] text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
        data-testid="floating-support-btn">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}

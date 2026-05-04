import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, Store as StoreIcon, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function StoreChatPage() {
  const params = useParams();
  const slug = params.slug || params.store_id || params.id;
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);

    axios.get(API + '/stores/' + slug)
      .then((res) => {
        if (cancelled) return;
        setStore(res.data);
        setStoreId(res.data.store_id || slug);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Loja não encontrada');
        setStore(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const fetchMessages = async () => {
    if (!storeId || !token) return;

    try {
      const res = await axios.get(API + '/stores/' + storeId + '/chat', {
        headers: { Authorization: 'Bearer ' + token }
      });

      setMessages(res.data.messages || []);

      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    } catch (error) {
      if (error && error.response && error.response.status === 401) {
        toast.error('Faça login para conversar');
      }
    }
  };

  useEffect(() => {
    if (!storeId) return;

    if (!user) {
      navigate('/auth?next=' + encodeURIComponent('/stores/' + slug + '/chat'));
      return;
    }

    fetchMessages();

    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [storeId, user, token]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();

    const msg = text.trim();

    if (!msg) return;

    if (!user) {
      navigate('/auth?next=' + encodeURIComponent('/stores/' + slug + '/chat'));
      return;
    }

    setSending(true);

    try {
      await axios.post(
        API + '/stores/' + storeId + '/chat',
        { message: msg },
        { headers: { Authorization: 'Bearer ' + token } }
      );

      setText('');
      fetchMessages();
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const fmtTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const logoUrl = store && store.logo
    ? (
        store.logo.startsWith('data:image') || store.logo.startsWith('http')
          ? store.logo
          : API + '/files/' + store.logo
      )
    : null;

  if (loading) {
    return (
      <div className="min-h-screen carbon-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen carbon-bg flex items-center justify-center">
        <div className="text-center">
          <StoreIcon className="w-16 h-16 text-[#6F7280] mx-auto mb-4" />
          <p className="text-[#A6A8B3] mb-4">Loja não encontrada</p>
          <Link to="/stores" className="px-4 py-2 rounded-lg bg-[#D4A24C] text-black font-semibold">
            Ver Lojas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-bg py-6" data-testid="store-chat-page">
      <div className="max-w-3xl mx-auto px-4">
        <Link
          to={'/stores/' + (store.slug || store.store_id || slug)}
          className="inline-flex items-center gap-2 text-sm text-[#A6A8B3] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a loja
        </Link>

        <div
          className="bg-[#0B0D12] border border-[#1E2230] rounded-2xl overflow-hidden flex flex-col"
          style={{ height: 'calc(100vh - 160px)', minHeight: '500px' }}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E2230] bg-gradient-to-r from-[#0B0D12] to-[#11131A]">
            <div className="w-12 h-12 rounded-xl bg-[#11131A] border border-[#1E2230] overflow-hidden flex items-center justify-center shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <StoreIcon className="w-6 h-6 text-[#D4A24C]" />
              )}
            </div>

            <p className="text-xs text-[#A6A8B3] flex items-center gap-1">
  <MessageCircle className="w-3 h-3" />
  {user?.user_id === store?.owner_id
    ? 'Chat da Loja'
    : 'Chat com o vendedor'}
</p>
            </div>
          </div>

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
                  <div key={m.message_id} className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={
                        'max-w-[80%] px-4 py-2.5 rounded-2xl ' +
                        (isMine
                          ? 'bg-gradient-to-br from-[#D4A24C] to-[#B38B36] text-black rounded-br-md'
                          : 'bg-[#11131A] border border-[#1E2230] text-white rounded-bl-md')
                      }
                    >
                      {!isMine && (
                        <p className="text-xs font-semibold mb-1 text-[#D4A24C]">
                          {m.sender_name}
                        </p>
                      )}

                      <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>

                      <p className={'text-[10px] mt-1 ' + (isMine ? 'text-black/60' : 'text-[#6F7280]')}>
                        {fmtTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={sendMessage} className="px-3 py-3 border-t border-[#1E2230] bg-[#0B0D12] flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva sua mensagem..."
              className="flex-1 px-4 py-2.5 rounded-full bg-[#11131A] border border-[#1E2230] text-white text-sm placeholder:text-[#4F525B] focus:outline-none focus:border-[#D4A24C] transition-colors"
              disabled={sending}
              data-testid="chat-input"
            />

            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="w-11 h-11 rounded-full bg-[#D4A24C] hover:bg-[#E8C372] text-black flex items-center justify-center disabled:opacity-50 transition"
              data-testid="chat-send-btn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
  
  );
}

import { useState, useEffect } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Search, MessageSquare, Eye, Trash2, ChevronRight, X, Clock, ArrowLeft } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

export default function AdminMessages() {
  const { authHeaders } = useAdminData();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API + "/admin/blivre/messages", { headers: authHeaders }).catch(() => null);
        if (res?.data?.conversations) setConversations(res.data.conversations);
        else setConversations([]);
      } catch { setConversations([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [authHeaders]);

  const openConvo = async (convo) => {
    setSelectedConvo(convo);
    setChatLoading(true);
    setShowList(false);
    try {
      const res = await axios.get(API + "/admin/blivre/messages/" + convo.post_id, { headers: authHeaders }).catch(() => null);
      if (res?.data?.messages) setChatMessages(res.data.messages);
      else setChatMessages([]);
    } catch { setChatMessages([]); }
    finally { setChatLoading(false); }
  };

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.post_title || "").toLowerCase().includes(q) || (c.sender_name || "").toLowerCase().includes(q) || (c.post_author || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Mensagens" description="Moderação de mensagens B Livre" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Mensagens</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">Modere as conversas entre usuários</p>
        </div>
        {selectedConvo && <button onClick={() => { setSelectedConvo(null); setShowList(true); }} className="lg:hidden px-3 py-2 text-[12px] text-[#D4A24C] font-semibold"><ArrowLeft size={16} className="inline mr-1" /> Voltar</button>}
      </div>

      <div className={`${glassCard} overflow-hidden`}>
        <div className="flex h-[600px] lg:h-[70vh]">
          <div className={`w-full lg:w-[380px] xl:w-[420px] border-r border-white/[0.06] flex-shrink-0 flex flex-col ${!showList ? "hidden lg:flex" : "flex"}`}>
            <div className="p-4 border-b border-white/[0.06]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar conversas..." className="pl-9 h-9 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl w-full" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
              {loading ? (
                <div className="flex items-center justify-center h-full text-[#8C8F9A]">
                  <div className="w-6 h-6 border-2 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#8C8F9A] p-8 text-center">
                  <MessageSquare size={32} className="mb-3 opacity-30" />
                  <p className="text-[13px]">Nenhuma conversa encontrada</p>
                </div>
              ) : filtered.map((c) => (
                <button key={c.post_id} onClick={() => openConvo(c)}
                  className={`w-full text-left p-4 transition-colors hover:bg-white/[0.02] ${selectedConvo?.post_id === c.post_id ? "bg-[#D4A24C]/[0.03] border-l-2 border-[#D4A24C]" : ""}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="text-[10px] bg-[#D4A24C]/10 text-[#D4A24C] font-semibold">
                          {(c.post_title || "A")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] font-medium text-white truncate">{c.post_title}</span>
                    </div>
                    <span className="text-[10px] text-[#5C5F6A] flex-shrink-0">{c.message_count} msgs</span>
                  </div>
                  <p className="text-[12px] text-[#8C8F9A] truncate pl-9">{c.last_message}</p>
                  <div className="flex items-center gap-2 mt-1 pl-9">
                    <span className="text-[10px] text-[#D4A24C]">{c.post_author}</span>
                    <span className="text-[9px] text-[#5C5F6A]">• {c.sender_name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`flex-1 min-w-0 flex flex-col ${showList ? "hidden lg:flex" : "flex"}`}>
            {!selectedConvo ? (
              <div className="h-full flex flex-col items-center justify-center text-[#8C8F9A] p-8 text-center">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p className="text-[15px] font-medium text-white mb-1">Selecione uma conversa</p>
                <p className="text-[12px]">Escolha uma conversa na lista ao lado para visualizar</p>
              </div>
            ) : chatLoading ? (
              <div className="flex items-center justify-center h-full text-[#8C8F9A]">
                <div className="w-6 h-6 border-2 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="text-[11px] bg-[#D4A24C]/10 text-[#D4A24C] font-semibold">
                        {(selectedConvo.post_title || "A")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-white truncate">{selectedConvo.post_title}</p>
                      <p className="text-[11px] text-[#8C8F9A]">{selectedConvo.post_author} • {selectedConvo.message_count} mensagens</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-[#8C8F9A] text-[13px] py-8">Nenhuma mensagem nesta conversa</p>
                  ) : chatMessages.map((msg, i) => (
                    <div key={msg.id || msg._id || i} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-[#D4A24C]">{msg.sender_name || "Alguém"}</span>
                        <span className="text-[9px] text-[#5C5F6A]">
                          {msg.created_at ? new Date(msg.created_at).toLocaleString("pt-BR") : ""}
                        </span>
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.06] p-3 rounded-2xl rounded-tl-sm max-w-[85%]">
                        <p className="text-[13px] text-white leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

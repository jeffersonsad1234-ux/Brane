import { X, Send, MessageSquare, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BLivreMessageProvider, useBLivreMessages } from "../contexts/BLivreMessageContext";

function MessagesContent() {
  const {
    messages, selectedChat, chatMessages, chatMessage, unreadCount, notifications,
    chatScrollRef, openChat, closeChat, sendChatMessage, setChatMessage
  } = useBLivreMessages();
  const navigate = useNavigate();

  const findName = (item) => item?.sender_name || item?.name || item?.data?.name || "";

  const conversations = (() => {
    const grouped = {};
    (notifications || []).forEach((n) => {
      if (n.type !== "social_message") return;
      const pid = n.data?.post_id;
      if (!pid) return;
      const existing = grouped[pid];
      if (!existing) {
        grouped[pid] = { post_id: pid, lastMsg: null, otherName: findName(n.data) || findName(n) || "Usuário", createdAt: n.created_at || "" };
      }
      if (n.created_at > (grouped[pid].createdAt || "")) {
        grouped[pid].lastMsg = { message: n.message, created_at: n.created_at };
        grouped[pid].otherName = findName(n.data) || findName(n) || grouped[pid].otherName;
        grouped[pid].createdAt = n.created_at;
      }
    });
    (messages || []).forEach((m) => {
      const pid = m.post_id;
      if (!pid || grouped[pid]) return;
      grouped[pid] = {
        post_id: pid,
        lastMsg: { message: m.message, created_at: m.created_at },
        otherName: findName(m) || "Usuário",
        createdAt: m.created_at || ""
      };
    });
    const list = Object.values(grouped);
    list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return list;
  })();

  return (
    <div className="min-h-screen bg-[#050608] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <h1 className="text-sm font-black text-white">Mensagens</h1>
        <button onClick={() => navigate("/blivre")}
          className="text-[11px] text-[#D4A24C] font-bold">Voltar</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedChat ? (
          <div className="brane-card-premium p-4" style={{ borderRadius: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base brane-gold-text flex items-center gap-2">
                <MessageSquare size={18} />
                Chat com {selectedChat.sender_name || "Usuário"}
              </h2>
              <button onClick={closeChat} className="w-8 h-8 brane-btn-gold flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="h-[50vh] overflow-y-auto mb-4 space-y-3" ref={chatScrollRef}>
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[#6F7280]">
                  <MessageSquare className="w-10 h-10 text-[#1E2230] mb-2" />
                  <p className="text-sm">Nenhuma mensagem ainda.</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${msg.isMine ? "brane-btn-gold text-black" : "bg-white/10 text-white"}`}>
                      {!msg.isMine && <p className="text-[10px] font-semibold mb-1 text-[#D4A24C]">{msg.sender}</p>}
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-[9px] mt-1 ${msg.isMine ? "text-black/50" : "text-white/40"}`}>
                        {msg.timestamp.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Digite sua mensagem..." className="flex-1 p-3 brane-input" />
              <button onClick={sendChatMessage} disabled={!chatMessage.trim()}
                className="brane-btn-gold disabled:opacity-60"><Send size={16} /></button>
            </div>
          </div>
        ) : (
          <div className="brane-card-premium p-4" style={{ borderRadius: 24 }}>
            <h2 className="font-bold text-base mb-4 flex items-center gap-2 brane-gold-text">
              <MessageSquare size={18} />
              Conversas
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </h2>

            {conversations.length === 0 ? (
              <p className="text-sm text-[#8C8F9A]">Nenhuma mensagem por enquanto.</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv, i) => (
                  <button key={conv.post_id || i} onClick={() => openChat({ post_id: conv.post_id, sender_name: conv.otherName, message: conv.lastMsg?.message })}
                    className="w-full text-left brane-card-soft p-3 hover:bg-white/[0.08] transition-colors flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D4A24C]/20 to-[#8A2CFF]/20 flex items-center justify-center text-[#D4A24C] shrink-0">
                      <Package size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white truncate">{conv.post_id}</p>
                        <span className="text-[10px] text-[#6F7280] shrink-0">
                          {conv.createdAt ? new Date(conv.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}
                        </span>
                      </div>
                      <p className="text-xs text-[#D4A24C] mt-0.5 font-medium">{conv.otherName}</p>
                      <p className="text-[11px] text-[#A6A8B3] mt-0.5 truncate">{conv.lastMsg?.message || "Clique para ver a conversa"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BLivreMessagesPage() {
  return (
    <BLivreMessageProvider>
      <MessagesContent />
    </BLivreMessageProvider>
  );
}

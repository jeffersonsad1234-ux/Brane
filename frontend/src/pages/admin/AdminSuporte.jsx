import { useState } from "react";
import { useAdminData } from "../../contexts/AdminDataContext";
import { AdminSupportProvider, useAdminSupport } from "../../contexts/AdminSupportContext";
import { Search, Send, MessageSquare, Clock, CheckCircle, AlertCircle, ChevronRight, X, Paperclip } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

const statusColors = {
  aberto: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  aguardando: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolvido: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  fechado: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function TicketBadge({ status }) {
  const c = statusColors[status] || statusColors.aberto;
  const labels = { aberto: "Aberto", aguardando: "Aguardando", resolvido: "Resolvido", fechado: "Fechado" };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c}`}>{labels[status] || status}</span>;
}

// ── Ticket List ──
function TicketList() {
  const { tickets, selectedTicket, openTicket, search, setSearch, statusFilter, setStatusFilter } = useAdminSupport();
  const { allTickets } = useAdminSupport();

  const counts = {
    todas: allTickets.length,
    aberto: allTickets.filter(t => t.status === "aberto").length,
    aguardando: allTickets.filter(t => t.status === "aguardando").length,
    resolvido: allTickets.filter(t => t.status === "resolvido").length,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/[0.06] space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou assunto..."
            className="pl-9 h-9 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl w-full" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "todas", label: "Todas", count: counts.todas },
            { id: "aberto", label: "Aberto", count: counts.aberto },
            { id: "aguardando", label: "Aguardando", count: counts.aguardando },
            { id: "resolvido", label: "Resolvido", count: counts.resolvido },
          ].map(t => (
            <button key={t.id} onClick={() => setStatusFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                statusFilter === t.id ? "bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20" : "text-[#8C8F9A] hover:text-white border border-transparent"
              }`}>
              {t.label} {t.count > 0 && <span className="ml-1 opacity-60">({t.count})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8C8F9A] p-8 text-center">
            <MessageSquare size={32} className="mb-3 opacity-30" />
            <p className="text-[13px]">Nenhum ticket encontrado</p>
          </div>
        ) : tickets.map(ticket => (
          <button key={ticket.id} onClick={() => openTicket(ticket)}
            className={`w-full text-left p-4 transition-colors hover:bg-white/[0.02] ${
              selectedTicket?.id === ticket.id ? "bg-[#D4A24C]/[0.03] border-l-2 border-[#D4A24C]" : ""
            }`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className="text-[10px] bg-[#D4A24C]/10 text-[#D4A24C] font-semibold">
                    {(ticket.user || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-medium text-white truncate">{ticket.user || "Usuário"}</span>
              </div>
              <TicketBadge status={ticket.status} />
            </div>
            <p className="text-[12px] text-[#8C8F9A] truncate pl-9">{ticket.subject}</p>
            <p className="text-[10px] text-[#5C5F6A] pl-9 mt-0.5">
              {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("pt-BR") : ""}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Chat View ──
function ChatView() {
  const { selectedTicket, chatMessages, replyText, setReplyText, sendReply, closeTicket, updateStatus, sending, catLabel } = useAdminSupport();

  if (!selectedTicket) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#8C8F9A] p-8 text-center">
        <MessageSquare size={48} className="mb-4 opacity-20" />
        <p className="text-[15px] font-medium text-white mb-1">Selecione um ticket</p>
        <p className="text-[12px]">Escolha um ticket na lista ao lado para visualizar e responder</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="text-[11px] bg-[#D4A24C]/10 text-[#D4A24C] font-semibold">
              {(selectedTicket.user || "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-white truncate">{selectedTicket.user}</p>
            <p className="text-[11px] text-[#8C8F9A] truncate">{selectedTicket.email || selectedTicket.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedTicket.status !== "resolvido" && (
            <Button onClick={() => updateStatus(selectedTicket.id, "resolvido")}
              className="h-8 px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-semibold hover:bg-emerald-500/20">
              <CheckCircle size={13} className="mr-1" /> Resolver
            </Button>
          )}
          <Button onClick={closeTicket} variant="ghost" size="icon" className="h-8 w-8 text-[#8C8F9A] rounded-xl">
            <X size={15} />
          </Button>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.04] flex items-center gap-3 text-[11px] text-[#8C8F9A]">
        <span className="flex items-center gap-1"><AlertCircle size={12} /> {catLabel(selectedTicket.category)}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString("pt-BR") : ""}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.from === "admin"
                ? "bg-[#D4A24C]/10 border border-[#D4A24C]/15 text-white rounded-tr-md"
                : "bg-white/[0.04] border border-white/[0.06] text-white rounded-tl-md"
            }`}>
              {msg.from !== "admin" && (
                <p className="text-[10px] text-[#D4A24C] font-semibold mb-1">{msg.name || "Usuário"}</p>
              )}
              <p className="text-[13px] leading-relaxed">{msg.text}</p>
              <p className="text-[9px] text-[#5C5F6A] mt-1.5 text-right">
                {msg.time ? new Date(msg.time).toLocaleString("pt-BR") : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply input */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Digite sua resposta..."
              rows={2}
              className="w-full bg-[#0A0A0C] border border-white/10 text-white text-[13px] rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-[#D4A24C]/30 placeholder:text-[#8C8F9A]"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
            />
          </div>
          <Button onClick={sendReply} disabled={!replyText.trim() || sending}
            className="h-[42px] px-4 bg-[#D4A24C] text-black font-bold rounded-xl hover:bg-[#C49542] disabled:opacity-50">
            <Send size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function AdminSuporte() {
  const { authHeaders, token } = useAdminData();
  const [showList, setShowList] = useState(true);

  if (!token) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Suporte" description="Tickets de suporte B Livre" />
        <h1 className="text-xl font-black text-white">Suporte</h1>
        <div className="p-12 text-center">
          <p className="text-lg font-bold text-white mb-1">Faça login na B Livre primeiro</p>
          <p className="text-sm text-[#8C8F9A]">Você precisa estar logado com uma conta administradora.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminSupportProvider authHeaders={authHeaders}>
      <div className="space-y-6">
        <BLivreSEO page="home" title="Suporte" description="Tickets de suporte B Livre" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Suporte</h1>
            <p className="text-sm text-[#8C8F9A] mt-0.5">Atendimento e tickets de suporte</p>
          </div>
        </div>

        <div className={`${glassCard} overflow-hidden`}>
          <div className="flex h-[600px] lg:h-[70vh]">
            {/* Ticket List - sidebar on desktop, fullscreen on mobile */}
            <div className={`w-full lg:w-[340px] xl:w-[380px] border-r border-white/[0.06] flex-shrink-0 ${
              !showList ? "hidden lg:flex" : "flex"
            }`}>
              <TicketList />
            </div>
            {/* Chat */}
            <div className={`flex-1 min-w-0 ${showList ? "hidden lg:flex" : "flex"}`}>
              <ChatView />
            </div>
          </div>
        </div>
      </div>
    </AdminSupportProvider>
  );
}

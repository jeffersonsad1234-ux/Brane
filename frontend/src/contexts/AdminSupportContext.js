import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

const AdminSupportContext = createContext(null);

export function AdminSupportProvider({ children, authHeaders }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      // Try admin support endpoint first, fallback to support messages
      let res;
      try {
        res = await axios.get(API + "/admin/support", { headers: authHeaders });
        setTickets(res.data.tickets || []);
      } catch {
        res = await axios.get(API + "/support/messages", { headers: authHeaders });
        const msgs = res.data.messages || res.data || [];
        setTickets(Array.isArray(msgs) ? msgs.map((m, i) => ({
          id: m.id || m._id || "TK-" + String(i + 1).padStart(3, "0"),
          user: m.name || m.sender_name || m.email || "Usuário",
          email: m.email || "",
          subject: m.subject || m.assunto || "Suporte",
          message: m.message || m.text || "",
          status: m.status || "aberto",
          category: m.category || "suporte_geral",
          createdAt: m.created_at || m.createdAt || m.date || new Date().toISOString(),
          updatedAt: m.updated_at || m.updatedAt || m.date || new Date().toISOString(),
        })) : []);
      }
    } catch (e) {
      console.error("Erro ao buscar tickets:", e);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openTicket = useCallback(async (ticket) => {
    setSelectedTicket(ticket);
    // Try to load existing chat/conversation
    try {
      const res = await axios.get(API + "/admin/support/" + ticket.id + "/messages", { headers: authHeaders }).catch(() => null);
      if (res?.data?.messages) {
        setChatMessages(res.data.messages);
      } else {
        // Use the initial ticket message as the first chat entry
        setChatMessages([{
          id: "msg-0",
          from: "user",
          text: ticket.message || "Mensagem não disponível",
          name: ticket.user || "Usuário",
          time: ticket.createdAt || new Date().toISOString(),
        }]);
      }
    } catch {
      setChatMessages([{
        id: "msg-0", from: "user", text: ticket.message || "Mensagem não disponível",
        name: ticket.user || "Usuário", time: ticket.createdAt || new Date().toISOString(),
      }]);
    }
  }, [authHeaders]);

  const closeTicket = useCallback(() => {
    setSelectedTicket(null);
    setChatMessages([]);
    setReplyText("");
  }, []);

  const sendReply = useCallback(async () => {
    if (!replyText.trim() || !selectedTicket) return;
    const text = replyText;
    setReplyText("");
    setSending(true);
    try {
      await axios.post(API + "/admin/support/" + selectedTicket.id + "/reply", { message: text }, { headers: authHeaders });
      setChatMessages(prev => [...prev, {
        id: "msg-admin-" + Date.now(), from: "admin", text, name: "Admin",
        time: new Date().toISOString()
      }]);
      // Update ticket status to "aguardando"
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: "aguardando" } : t));
      setSelectedTicket(prev => prev ? { ...prev, status: "aguardando" } : null);
    } catch {
      // Fallback: just add the message locally
      setChatMessages(prev => [...prev, {
        id: "msg-admin-" + Date.now(), from: "admin", text, name: "Admin",
        time: new Date().toISOString()
      }]);
    } finally {
      setSending(false);
    }
  }, [replyText, selectedTicket, authHeaders]);

  const updateStatus = useCallback(async (ticketId, newStatus) => {
    try {
      await axios.put(API + "/admin/support/" + ticketId + "/status", { status: newStatus }, { headers: authHeaders }).catch(() => {});
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (e) { console.error(e); }
  }, [authHeaders, selectedTicket]);

  const filtered = tickets.filter(t => {
    if (statusFilter !== "todas" && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = (t.user || "").toLowerCase().includes(q);
      const matchEmail = (t.email || "").toLowerCase().includes(q);
      const matchSubject = (t.subject || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchSubject) return false;
    }
    return true;
  });

  const categories = [
    { value: "suporte_geral", label: "Suporte Geral" },
    { value: "problema_login", label: "Problema de Login" },
    { value: "esqueci_senha", label: "Esqueci Senha" },
    { value: "recuperacao_conta", label: "Recuperação de Conta" },
    { value: "denuncia", label: "Denúncia" },
    { value: "problema_anuncio", label: "Problema em Anúncio" },
    { value: "pagamento", label: "Pagamento" },
  ];

  const catLabel = (value) => categories.find(c => c.value === value)?.label || value;

  return (
    <AdminSupportContext.Provider value={{
      tickets: filtered, allTickets: tickets, selectedTicket, chatMessages,
      replyText, loading, sending, search, statusFilter, categories, catLabel,
      setSearch, setStatusFilter, setReplyText,
      openTicket, closeTicket, sendReply, updateStatus, fetchTickets,
    }}>
      {children}
    </AdminSupportContext.Provider>
  );
}

export const useAdminSupport = () => {
  const ctx = useContext(AdminSupportContext);
  if (!ctx) throw new Error("useAdminSupport must be used within AdminSupportProvider");
  return ctx;
};

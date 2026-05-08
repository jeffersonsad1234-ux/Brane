import { useEffect, useState } from "react";
import { blApi, blFmtErr } from "./api";
import { Search, RefreshCw, Plus, Send, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

export default function BLivreMessages() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [newForm, setNewForm] = useState({ recipient_id: "", message: "", subject: "Mensagem do Administrador" });
  const [users, setUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await blApi.get("/admin/messages");
      let list = data?.messages || data || [];
      if (!Array.isArray(list)) list = [];
      if (q) {
        const qq = q.toLowerCase();
        list = list.filter((m) =>
          (m.content || m.message || "").toLowerCase().includes(qq) ||
          (m.sender_name || m.from_name || "").toLowerCase().includes(qq) ||
          (m.recipient_name || m.to_name || "").toLowerCase().includes(qq)
        );
      }
      setItems(list);
    } catch (e) {
      toast.error(blFmtErr(e));
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await blApi.get("/admin/users");
      setUsers(data?.users || []);
    } catch {}
  };

  const sendNewMessage = async () => {
    if (!newForm.recipient_id || !newForm.message.trim()) {
      toast.error("Selecione um usuário e digite a mensagem");
      return;
    }
    try {
      await blApi.post("/admin/messages/send", newForm);
      toast.success("Mensagem enviada!");
      setNewForm({ recipient_id: "", message: "", subject: "Mensagem do Administrador" });
      setShowNewMsg(false);
      load();
    } catch (e) {
      toast.error(blFmtErr(e));
    }
  };

  const sendReply = async (msgId) => {
    if (!replyText.trim()) {
      toast.error("Digite uma resposta");
      return;
    }
    try {
      await blApi.post(`/admin/messages/${msgId}/reply`, { message: replyText });
      toast.success("Resposta enviada!");
      setReplyText("");
      setReplyTo(null);
      load();
    } catch (e) {
      toast.error(blFmtErr(e));
    }
  };

  useEffect(() => { load(); loadUsers(); /* eslint-disable-next-line */ }, []);

  return (
    <div data-testid="bl-messages-page" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--bl-text-mute)" }}>Moderação</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 4px" }}>Mensagens</h1>
          <p style={{ fontSize: 14, color: "var(--bl-text-dim)", margin: 0 }}>
            {items.length} mensagem(ns) entre usuários da B-Livre
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowNewMsg(!showNewMsg); if (!showNewMsg) loadUsers(); }} data-testid="bl-new-message-btn">
          {showNewMsg ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nova Mensagem</>}
        </button>
      </div>

      {showNewMsg && (
        <div className="card-premium" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Enviar Nova Mensagem</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: "var(--bl-text-dim)" }}>Destinatário</label>
              <select className="input-premium" value={newForm.recipient_id} onChange={(e) => setNewForm({ ...newForm, recipient_id: e.target.value })}>
                <option value="">Selecione um usuário...</option>
                {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name} ({u.email}) - {u.role}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: "var(--bl-text-dim)" }}>Assunto</label>
              <input className="input-premium" value={newForm.subject} onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })} placeholder="Assunto da mensagem" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: "var(--bl-text-dim)" }}>Mensagem</label>
              <textarea className="input-premium" value={newForm.message} onChange={(e) => setNewForm({ ...newForm, message: e.target.value })} rows={4} placeholder="Digite sua mensagem..." style={{ resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <button className="btn btn-primary" onClick={sendNewMessage} data-testid="bl-send-new-message">
              <Send size={14} /> Enviar Mensagem
            </button>
          </div>
        </div>
      )}

      <div className="card-premium" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--bl-text-mute)" }} />
          <input
            data-testid="bl-messages-search"
            className="input-premium"
            placeholder="Buscar por conteúdo ou usuário"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <button className="btn btn-ghost" onClick={load} data-testid="bl-messages-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card-premium" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>
          {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}><RefreshCw className="animate-spin" size={16} style={{ display: "inline-block" }} /></div>}
          {!loading && items.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}>Sem mensagens.</div>}
          {items.map((m, i) => (
            <div key={m.message_id || m.id || i} style={{ border: "1px solid var(--bl-line)", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.sender_name || m.from_name || "—"}</div>
                  <div style={{ color: "var(--bl-text-mute)", fontSize: 12 }}>→ {m.recipient_name || m.to_name || "—"}</div>
                </div>
                <div style={{ color: "var(--bl-text-dim)", fontSize: 12 }} className="mono">
                  {(m.created_at || "").replace("T", " ").slice(0, 16)}
                </div>
              </div>
              <div style={{ background: "var(--bl-bg-1)", padding: 12, borderRadius: 8, marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 14 }}>{m.content || m.message || "—"}</p>
              </div>
              {replyTo === (m.message_id || m.id) ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <textarea 
                    className="input-premium" 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)} 
                    placeholder="Digite sua resposta..." 
                    rows={3}
                    style={{ resize: "vertical", fontFamily: "inherit" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => sendReply(m.message_id || m.id)}>
                      <Send size={12} /> Enviar Resposta
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setReplyTo(null); setReplyText(""); }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-ghost" onClick={() => setReplyTo(m.message_id || m.id)}>
                  <MessageSquare size={12} /> Responder
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { blApi, blFmtErr } from "./api";
import { RefreshCw, Send, X } from "lucide-react";
import { toast } from "sonner";

const STATUS = [
  { key: "", label: "Todos" },
  { key: "open", label: "Abertos" },
  { key: "in_progress", label: "Em andamento" },
  { key: "resolved", label: "Resolvidos" },
  { key: "closed", label: "Fechados" },
];

const StatusBadge = ({ s }) => {
  const map = {
    open: ["badge-amber", "Aberto"],
    in_progress: ["badge-blue", "Em andamento"],
    resolved: ["badge-green", "Resolvido"],
    closed: ["badge-gray", "Fechado"],
    pendente: ["badge-amber", "Pendente"],
    pending: ["badge-amber", "Pendente"],
  };
  const [c, l] = map[s] || ["badge-gray", s || "—"];
  return <span className={`badge ${c}`}>{l}</span>;
};

export default function BLivreSupport() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await blApi.get("/admin/support");
      let list = data?.messages || data?.tickets || data?.support_messages || data || [];
      if (!Array.isArray(list)) list = [];
      if (filter) list = list.filter((s) => (s.status || "").toLowerCase() === filter);
      setItems(list);
      if (active) {
        const upd = list.find((t) => (t.message_id || t.id) === (active.message_id || active.id));
        if (upd) setActive(upd);
      }
    } catch (e) {
      toast.error(blFmtErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const sendReply = async () => {
    if (!reply.trim() || !active) return;
    setSending(true);
    try {
      const id = active.message_id || active.id;
      await blApi.post(`/admin/support/${id}/reply`, { reply, message: reply });
      toast.success("Resposta enviada");
      setReply("");
      await load();
    } catch (e) {
      toast.error(blFmtErr(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="bl-support-page" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--bl-text-mute)" }}>Atendimento</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 4px" }}>Suporte</h1>
        <p style={{ fontSize: 14, color: "var(--bl-text-dim)", margin: 0 }}>{items.length} chamado(s)</p>
      </div>

      <div className="card-premium" style={{ padding: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {STATUS.map((s) => (
          <button
            key={s.key || "all"}
            data-testid={`bl-support-tab-${s.key || "all"}`}
            className={`btn ${filter === s.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(s.key)}
          >
            {s.label}
          </button>
        ))}
        <button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={load} data-testid="bl-support-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card-premium" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-premium">
            <thead>
              <tr>
                <th>Assunto</th>
                <th>Usuário</th>
                <th>Status</th>
                <th>Atualizado</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody data-testid="bl-support-table">
              {loading && <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}><RefreshCw className="animate-spin" size={16} style={{ display: "inline-block" }} /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}>Sem chamados.</td></tr>}
              {items.map((t) => (
                <tr key={t.message_id || t.id} data-testid={`bl-support-row-${t.message_id || t.id}`}>
                  <td style={{ fontWeight: 500, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject || (t.message || "").slice(0, 60) || "—"}</td>
                  <td>
                    <div style={{ fontSize: 14 }}>{t.user_name || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--bl-text-mute)" }}>{t.user_email || ""}</div>
                  </td>
                  <td><StatusBadge s={t.status} /></td>
                  <td style={{ color: "var(--bl-text-dim)", fontSize: 12 }} className="mono">{((t.updated_at || t.created_at) || "").slice(0, 16).replace("T", " ")}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-primary" onClick={() => setActive(t)} data-testid={`bl-open-ticket-${t.message_id || t.id}`}>
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {active && (
        <div
          onClick={() => setActive(null)}
          data-testid="bl-ticket-modal"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 50, display: "flex", justifyContent: "flex-end" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fade-up"
            style={{ width: "100%", maxWidth: 640, height: "100%", background: "var(--bl-bg-1)", borderLeft: "1px solid var(--bl-line)", display: "flex", flexDirection: "column" }}
          >
            <div style={{ padding: 20, borderBottom: "1px solid var(--bl-line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--bl-text-mute)" }}>Chamado</div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: "4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active.subject || (active.message || "").slice(0, 60)}</h2>
                <div style={{ fontSize: 12, color: "var(--bl-text-mute)" }}>
                  {active.user_name || "—"} ({active.user_email || "—"}) · <StatusBadge s={active.status} />
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setActive(null)} data-testid="bl-close-ticket"><X size={14} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "var(--bl-bg-2)", border: "1px solid var(--bl-line)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: "var(--bl-text-mute)", marginBottom: 4 }}>{active.user_name || "—"} · {(active.created_at || "").replace("T", " ").slice(0, 16)}</div>
                <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{active.message || active.content || "—"}</div>
              </div>
              {(active.replies || []).map((r, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 12, padding: 16, border: "1px solid",
                    ...(r.by === "admin" || r.is_admin
                      ? { background: "rgba(16,185,129,0.10)", borderColor: "rgba(16,185,129,0.3)", marginLeft: 32 }
                      : { background: "var(--bl-bg-2)", borderColor: "var(--bl-line)", marginRight: 32 }),
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--bl-text-mute)", marginBottom: 4 }}>
                    {(r.by === "admin" || r.is_admin) ? "Suporte" : (active.user_name || "Usuário")} · {(r.created_at || "").replace("T", " ").slice(0, 16)}
                  </div>
                  <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{r.message || r.reply}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 20, borderTop: "1px solid var(--bl-line)", display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea
                data-testid="bl-ticket-reply-input"
                className="input-premium"
                rows={3}
                placeholder="Escreva uma resposta ao usuário..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                style={{ resize: "vertical" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  data-testid="bl-ticket-reply-submit"
                  className="btn btn-primary"
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                >
                  <Send size={14} /> {sending ? "Enviando..." : "Enviar resposta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { api, formatErr } from "../api";
import { RefreshCw, Send, X } from "lucide-react";

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
  };
  const [c, l] = map[s] || ["badge-gray", s];
  return <span className={`badge ${c}`}>{l}</span>;
};

export default function SupportPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // ticket being viewed
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.append("status", filter);
      const { data } = await api.get(`/admin/blivre/support?${params}`);
      setItems(data);
      if (active) {
        const updated = data.find((t) => t.id === active.id);
        if (updated) setActive(updated);
      }
    } catch (e) {
      alert(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/blivre/support/${id}`, { status });
      load();
    } catch (e) {
      alert(formatErr(e));
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !active) return;
    setSending(true);
    try {
      await api.post(`/admin/blivre/support/${active.id}/reply`, { message: reply });
      setReply("");
      await load();
    } catch (e) {
      alert(formatErr(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5" data-testid="support-page">
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-mute)]">Atendimento</div>
        <h1 className="text-2xl font-bold mt-1">Suporte</h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">{items.length} chamado(s)</p>
      </div>

      <div className="card-premium p-4 flex flex-wrap items-center gap-2">
        {STATUS.map((s) => (
          <button
            key={s.key}
            data-testid={`support-tab-${s.key || "all"}`}
            className={`btn ${filter === s.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(s.key)}
          >
            {s.label}
          </button>
        ))}
        <button className="btn btn-ghost ml-auto" onClick={load} data-testid="support-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Assunto</th>
                <th>Categoria</th>
                <th>Usuário</th>
                <th>Status</th>
                <th>Atualizado</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody data-testid="support-table">
              {loading && <tr><td colSpan={6} className="text-center py-10 text-[var(--text-mute)]"><RefreshCw className="inline animate-spin" size={16} /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-[var(--text-mute)]">Sem chamados.</td></tr>}
              {items.map((t) => (
                <tr key={t.id} data-testid={`support-row-${t.id}`}>
                  <td className="font-medium max-w-[280px] truncate">{t.subject}</td>
                  <td><span className="badge badge-violet">{t.category}</span></td>
                  <td>
                    <div className="text-sm">{t.user_name}</div>
                    <div className="text-xs text-[var(--text-mute)]">{t.user_email}</div>
                  </td>
                  <td><StatusBadge s={t.status} /></td>
                  <td className="text-[var(--text-dim)] text-xs mono">{(t.updated_at || t.created_at)?.slice(0, 16).replace("T", " ")}</td>
                  <td className="text-right">
                    <button className="btn btn-primary" onClick={() => setActive(t)} data-testid={`open-ticket-${t.id}`}>
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer / Modal */}
      {active && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setActive(null)}
          data-testid="ticket-modal"
        >
          <div
            className="w-full max-w-2xl h-full bg-[var(--bg-1)] border-l border-[var(--line)] flex flex-col fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[var(--line)] flex items-start justify-between">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-widest text-[var(--text-mute)]">Chamado</div>
                <h2 className="text-lg font-semibold truncate">{active.subject}</h2>
                <div className="text-xs text-[var(--text-mute)] mt-1">
                  {active.user_name} ({active.user_email}) · <StatusBadge s={active.status} />
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setActive(null)} data-testid="close-ticket"><X size={14} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-[var(--bg-2)] border border-[var(--line)] rounded-xl p-4">
                <div className="text-xs text-[var(--text-mute)] mb-1">{active.user_name} · {active.created_at?.replace("T", " ").slice(0, 16)}</div>
                <div className="text-sm whitespace-pre-wrap">{active.message}</div>
              </div>
              {(active.replies || []).map((r) => (
                <div
                  key={r.id}
                  className={`rounded-xl p-4 border ${r.by === "admin" ? "bg-emerald-500/10 border-emerald-500/30 ml-8" : "bg-[var(--bg-2)] border-[var(--line)] mr-8"}`}
                >
                  <div className="text-xs text-[var(--text-mute)] mb-1">
                    {r.by === "admin" ? "Suporte" : active.user_name} · {r.created_at?.replace("T", " ").slice(0, 16)}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{r.message}</div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-[var(--line)] space-y-3">
              <div className="flex gap-2 items-center">
                <span className="text-xs text-[var(--text-mute)] uppercase tracking-widest">Status:</span>
                <select
                  data-testid="ticket-status-select"
                  className="input-premium w-auto text-xs py-1.5"
                  value={active.status}
                  onChange={(e) => updateStatus(active.id, e.target.value)}
                >
                  <option value="open">Aberto</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="resolved">Resolvido</option>
                  <option value="closed">Fechado</option>
                </select>
              </div>
              <textarea
                data-testid="ticket-reply-input"
                className="input-premium"
                rows={3}
                placeholder="Escreva uma resposta ao usuário..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  data-testid="ticket-reply-submit"
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

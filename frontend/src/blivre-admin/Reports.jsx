import { useEffect, useState } from "react";
import { blApi, blFmtErr } from "./api";
import { RefreshCw, Check, X, Ban, ShieldOff, Send, MessageSquare, Eye, Clock } from "lucide-react";
import { toast } from "sonner";

const STATUS = [
  { key: "", label: "Todas" },
  { key: "pending", label: "Pendentes" },
  { key: "analyzed", label: "Em Análise" },
  { key: "resolved", label: "Resolvidas" },
  { key: "ignored", label: "Ignoradas" },
];

const StatusBadge = ({ s }) => {
  const map = {
    pendente: ["badge-amber", "Pendente"],
    pending: ["badge-amber", "Pendente"],
    analyzed: ["badge-blue", "Em Análise"],
    reviewing: ["badge-blue", "Em análise"],
    resolved: ["badge-green", "Resolvida"],
    ignored: ["badge-gray", "Ignorada"],
    dismissed: ["badge-gray", "Descartada"],
  };
  const [c, l] = map[s] || ["badge-gray", s || "—"];
  return <span className={`badge ${c}`}>{l}</span>;
};

function fmtDate(s) {
  if (!s) return "—";
  return String(s).replace("T", " ").slice(0, 16);
}

export default function BLivreReports() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);            // denúncia aberta no drawer
  const [responseText, setResponseText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await blApi.get("/admin/reports");
      let list = data?.reports || data || [];
      if (!Array.isArray(list)) list = [];
      if (filter) list = list.filter((r) => (r.status || "").toLowerCase() === filter);
      setItems(list);

      // Se há um drawer aberto, atualiza com a versão mais recente
      if (active) {
        const upd = list.find((r) => (r.report_id || r.id) === (active.report_id || active.id));
        if (upd) setActive(upd);
      }
    } catch (e) {
      toast.error(blFmtErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const action = async (r, kind) => {
    try {
      const id = r.report_id || r.id;
      const url =
        kind === "resolve" ? `/admin/reports/${id}/resolve` :
        kind === "ignore" ? `/admin/reports/${id}/ignore` :
        kind === "block_ad" ? `/admin/reports/${id}/block_ad` :
        kind === "block_user" ? `/admin/reports/${id}/block_user` :
        null;
      if (!url) return;
      await blApi.put(url);
      toast.success(
        kind === "resolve" ? "Denúncia resolvida" :
        kind === "ignore" ? "Denúncia ignorada" :
        kind === "block_ad" ? "Anúncio bloqueado" :
        "Usuário bloqueado"
      );
      await load();
    } catch (e) { toast.error(blFmtErr(e)); }
  };

  const sendResponse = async () => {
    if (!responseText.trim() || !active) {
      toast.error("Digite uma resposta");
      return;
    }
    setSending(true);
    try {
      const id = active.report_id || active.id;
      await blApi.post(`/admin/reports/${id}/respond`, { response: responseText });
      toast.success("Resposta enviada (email + notificação)");
      setResponseText("");
      await load();
    } catch (e) {
      toast.error(blFmtErr(e));
    } finally {
      setSending(false);
    }
  };

  const isOpen = (s) => ["pending", "pendente", "analyzed", "reviewing"].includes(String(s || "").toLowerCase());

  // Histórico unificado: admin_responses[] (novo) + admin_response (legado)
  const historyOf = (r) => {
    if (!r) return [];
    const arr = Array.isArray(r.admin_responses) ? [...r.admin_responses] : [];
    if (arr.length === 0 && r.admin_response) {
      arr.push({
        by: "admin",
        message: r.admin_response,
        created_at: r.response_at || r.updated_at || r.created_at
      });
    }
    return arr;
  };

  return (
    <div data-testid="bl-reports-page" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--bl-text-mute)" }}>Moderação</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 4px" }}>Denúncias</h1>
        <p style={{ fontSize: 14, color: "var(--bl-text-dim)", margin: 0 }}>{items.length} denúncia(s)</p>
      </div>

      <div className="card-premium" style={{ padding: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {STATUS.map((s) => (
          <button
            key={s.key || "all"}
            data-testid={`bl-reports-tab-${s.key || "all"}`}
            className={`btn ${filter === s.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(s.key)}
          >
            {s.label}
          </button>
        ))}
        <button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={load} data-testid="bl-reports-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card-premium" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
          {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}><RefreshCw className="animate-spin" size={16} style={{ display: "inline-block" }} /></div>}
          {!loading && items.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}>Sem denúncias.</div>}
          {items.map((r) => {
            const id = r.report_id || r.id;
            const respCount = historyOf(r).length;
            return (
              <div key={id} data-testid={`bl-report-row-${id}`} style={{ border: "1px solid var(--bl-line)", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span className="badge badge-violet">{r.target_type || r.tipo || "—"}</span>
                      <StatusBadge s={r.status} />
                      {respCount > 0 && (
                        <span className="badge badge-blue">{respCount} resposta{respCount > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{r.reason || r.motivo || "—"}</div>
                    {(r.description || r.descricao) && (
                      <div style={{ fontSize: 13, color: "var(--bl-text-dim)", marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {r.description || r.descricao}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "var(--bl-text-dim)", flexWrap: "wrap" }}>
                      <span>Por: {r.reporter_name || "—"}</span>
                      <span className="mono">{fmtDate(r.created_at)}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setActive(r); setResponseText(""); }}
                    data-testid={`bl-open-report-${id}`}
                    style={{ flexShrink: 0 }}
                  >
                    <Eye size={14} /> Ver detalhes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawer de detalhes */}
      {active && (
        <div
          onClick={() => setActive(null)}
          data-testid="bl-report-drawer"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 50, display: "flex", justifyContent: "flex-end" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fade-up"
            style={{
              width: "100%", maxWidth: 680, height: "100%",
              background: "var(--bl-bg-1)", borderLeft: "1px solid var(--bl-line)",
              display: "flex", flexDirection: "column"
            }}
          >
            <div style={{ padding: 20, borderBottom: "1px solid var(--bl-line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--bl-text-mute)" }}>Denúncia</div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: "4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {active.reason || active.motivo || "—"}
                </h2>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12, color: "var(--bl-text-mute)" }}>
                  <span className="badge badge-violet">{active.target_type || active.tipo || "—"}</span>
                  <StatusBadge s={active.status} />
                  <span>· {active.reporter_name || "—"}</span>
                  <span className="mono">· {fmtDate(active.created_at)}</span>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setActive(null)} data-testid="bl-close-report-drawer">
                <X size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Detalhes da denúncia */}
              <div style={{ background: "var(--bl-bg-2)", border: "1px solid var(--bl-line)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: "var(--bl-text-mute)", marginBottom: 6 }}>Descrição</div>
                <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                  {active.description || active.descricao || active.message || "—"}
                </div>
                {active.target_id && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--bl-text-dim)" }}>
                    Alvo: <span className="mono">{active.target_id}</span>
                  </div>
                )}
              </div>

              {/* Timeline / histórico */}
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--bl-text-mute)", marginBottom: 8 }}>
                  Histórico de respostas
                </div>
                {historyOf(active).length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--bl-text-dim)", padding: "10px 0", display: "flex", alignItems: "center", gap: 8 }}>
                    <Clock size={14} /> Nenhuma resposta ainda.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {historyOf(active).map((h, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          border: "1px solid rgba(16,185,129,0.25)",
                          borderRadius: 12, padding: 12,
                        }}
                      >
                        <div style={{ fontSize: 12, color: "var(--bl-text-mute)", marginBottom: 4 }}>
                          Suporte / ADM · {fmtDate(h.created_at)}
                        </div>
                        <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{h.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ações no rodapé */}
            <div style={{ padding: 20, borderTop: "1px solid var(--bl-line)", display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea
                data-testid="bl-report-response-input"
                className="input-premium"
                rows={3}
                placeholder="Escreva uma resposta para o denunciante..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  data-testid="bl-report-send-response"
                  className="btn btn-primary"
                  onClick={sendResponse}
                  disabled={sending || !responseText.trim()}
                >
                  <Send size={14} /> {sending ? "Enviando..." : "Enviar resposta"}
                </button>

                {isOpen(active.status) && (
                  <>
                    <button
                      className="btn btn-ghost"
                      onClick={() => action(active, "resolve")}
                      data-testid={`bl-resolve-${active.report_id || active.id}`}
                    >
                      <Check size={14} /> Resolver denúncia
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => action(active, "ignore")}
                      data-testid={`bl-ignore-${active.report_id || active.id}`}
                    >
                      <X size={14} /> Ignorar
                    </button>
                  </>
                )}

                {(active.target_type === "anuncio" || active.tipo === "anuncio") && isOpen(active.status) && (
                  <button
                    className="btn btn-danger"
                    onClick={() => action(active, "block_ad")}
                    data-testid={`bl-block-ad-${active.report_id || active.id}`}
                  >
                    <ShieldOff size={14} /> Bloquear anúncio
                  </button>
                )}

                {isOpen(active.status) && (
                  <button
                    className="btn btn-danger"
                    onClick={() => action(active, "block_user")}
                    data-testid={`bl-block-user-${active.report_id || active.id}`}
                  >
                    <Ban size={14} /> Bloquear usuário
                  </button>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "var(--bl-text-mute)" }}>
                A resposta é enviada ao denunciante por email + notificação na plataforma e fica salva no histórico.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

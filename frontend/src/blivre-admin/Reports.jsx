import { useEffect, useState } from "react";
import { blApi, blFmtErr } from "./api";
import { RefreshCw, Check, X, Ban, ShieldOff, Send, MessageSquare } from "lucide-react";
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

export default function BLivreReports() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [respondTo, setRespondTo] = useState(null);
  const [responseText, setResponseText] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await blApi.get("/admin/reports");
      let list = data?.reports || data || [];
      if (!Array.isArray(list)) list = [];
      if (filter) list = list.filter((r) => (r.status || "").toLowerCase() === filter);
      setItems(list);
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
      toast.success("Atualizado");
      load();
    } catch (e) { toast.error(blFmtErr(e)); }
  };

  const sendResponse = async (r) => {
    if (!responseText.trim()) {
      toast.error("Digite uma resposta");
      return;
    }
    try {
      const id = r.report_id || r.id;
      await blApi.post(`/admin/reports/${id}/respond`, { response: responseText });
      toast.success("Resposta enviada (email + notificação)!");
      setResponseText("");
      setRespondTo(null);
      load();
    } catch (e) {
      toast.error(blFmtErr(e));
    }
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>
          {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}><RefreshCw className="animate-spin" size={16} style={{ display: "inline-block" }} /></div>}
          {!loading && items.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}>Sem denúncias.</div>}
          {items.map((r) => (
            <div key={r.report_id || r.id} data-testid={`bl-report-row-${r.report_id || r.id}`} style={{ border: "1px solid var(--bl-line)", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span className="badge badge-violet">{r.target_type || r.tipo || "—"}</span>
                    <StatusBadge s={r.status} />
                  </div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{r.reason || r.motivo || "—"}</div>
                  {(r.description || r.descricao) && <div style={{ fontSize: 13, color: "var(--bl-text-dim)", marginBottom: 8 }}>{r.description || r.descricao}</div>}
                  {r.admin_response && (
                    <div style={{ background: "var(--bl-bg-1)", borderLeft: "3px solid var(--bl-accent)", padding: 12, borderRadius: 8, marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: "var(--bl-accent)", fontWeight: 600, marginBottom: 4 }}>Resposta do Admin:</div>
                      <div style={{ fontSize: 13 }}>{r.admin_response}</div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: "var(--bl-text-dim)" }}>
                    <span>Por: {r.reporter_name || "—"}</span>
                    <span className="mono">{(r.created_at || "").slice(0, 10)}</span>
                  </div>
                </div>
              </div>
              
              {respondTo === (r.report_id || r.id) ? (
                <div style={{ borderTop: "1px solid var(--bl-line)", paddingTop: 12, marginTop: 12 }}>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 8, color: "var(--bl-text-dim)" }}>
                    Resposta para o denunciante (será enviada por <strong>email + notificação</strong>):
                  </label>
                  <textarea 
                    className="input-premium" 
                    value={responseText} 
                    onChange={(e) => setResponseText(e.target.value)} 
                    placeholder="Digite sua resposta para o denunciante..." 
                    rows={3}
                    style={{ resize: "vertical", fontFamily: "inherit", marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => sendResponse(r)}>
                      <Send size={12} /> Enviar Resposta (Email + Notificação)
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setRespondTo(null); setResponseText(""); }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid var(--bl-line)", paddingTop: 12, marginTop: 12 }}>
                  {(r.status === "pending" || r.status === "pendente" || r.status === "analyzed") && (
                    <>
                      <button className="btn btn-ghost" onClick={() => setRespondTo(r.report_id || r.id)}>
                        <MessageSquare size={12} /> Responder
                      </button>
                      <button className="btn btn-ghost" onClick={() => action(r, "resolve")} data-testid={`bl-resolve-${r.report_id}`}>
                        <Check size={12} /> Resolver
                      </button>
                      <button className="btn btn-ghost" onClick={() => action(r, "ignore")} data-testid={`bl-ignore-${r.report_id}`}>
                        <X size={12} /> Ignorar
                      </button>
                      {(r.target_type === "anuncio" || r.tipo === "anuncio") && (
                        <button className="btn btn-danger" onClick={() => action(r, "block_ad")} data-testid={`bl-block-ad-${r.report_id}`}>
                          <ShieldOff size={12} /> Bloquear anúncio
                        </button>
                      )}
                      <button className="btn btn-danger" onClick={() => action(r, "block_user")} data-testid={`bl-block-user-${r.report_id}`}>
                        <Ban size={12} /> Bloquear usuário
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

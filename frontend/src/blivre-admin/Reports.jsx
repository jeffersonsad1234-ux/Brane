import { useEffect, useState } from "react";
import { blApi, blFmtErr } from "./api";
import { RefreshCw, Check, X, Ban, ShieldOff } from "lucide-react";
import { toast } from "sonner";

const STATUS = [
  { key: "", label: "Todas" },
  { key: "pendente", label: "Pendentes" },
  { key: "resolved", label: "Resolvidas" },
  { key: "ignored", label: "Ignoradas" },
];

const StatusBadge = ({ s }) => {
  const map = {
    pendente: ["badge-amber", "Pendente"],
    pending: ["badge-amber", "Pendente"],
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
        <div style={{ overflowX: "auto" }}>
          <table className="table-premium">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Reportado por</th>
                <th>Status</th>
                <th>Criada</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody data-testid="bl-reports-table">
              {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}><RefreshCw className="animate-spin" size={16} style={{ display: "inline-block" }} /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}>Sem denúncias.</td></tr>}
              {items.map((r) => (
                <tr key={r.report_id || r.id} data-testid={`bl-report-row-${r.report_id || r.id}`}>
                  <td><span className="badge badge-violet">{r.target_type || "—"}</span></td>
                  <td style={{ fontWeight: 500, maxWidth: 280 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason || "—"}</div>
                    {r.description && <div style={{ fontSize: 12, color: "var(--bl-text-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</div>}
                  </td>
                  <td style={{ color: "var(--bl-text-dim)", fontSize: 13 }}>{r.reporter_name || "—"}</td>
                  <td><StatusBadge s={r.status} /></td>
                  <td style={{ color: "var(--bl-text-dim)", fontSize: 12 }} className="mono">{(r.created_at || "").slice(0, 10)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <button className="btn btn-ghost" onClick={() => action(r, "resolve")} data-testid={`bl-resolve-${r.report_id}`}><Check size={12} /> Resolver</button>
                      <button className="btn btn-ghost" onClick={() => action(r, "ignore")} data-testid={`bl-ignore-${r.report_id}`}><X size={12} /> Ignorar</button>
                      <button className="btn btn-danger" onClick={() => action(r, "block_ad")} data-testid={`bl-block-ad-${r.report_id}`}><ShieldOff size={12} /> Bloquear anúncio</button>
                      <button className="btn btn-danger" onClick={() => action(r, "block_user")} data-testid={`bl-block-user-${r.report_id}`}><Ban size={12} /> Bloquear usuário</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

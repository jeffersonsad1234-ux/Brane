import { useEffect, useState } from "react";
import { api, formatErr } from "../api";
import { RefreshCw } from "lucide-react";

const STATUS = [
  { key: "", label: "Todas" },
  { key: "pending", label: "Pendentes" },
  { key: "reviewing", label: "Em análise" },
  { key: "resolved", label: "Resolvidas" },
  { key: "dismissed", label: "Descartadas" },
];

const StatusBadge = ({ s }) => {
  const map = {
    pending: ["badge-amber", "Pendente"],
    reviewing: ["badge-blue", "Em análise"],
    resolved: ["badge-green", "Resolvida"],
    dismissed: ["badge-gray", "Descartada"],
  };
  const [c, l] = map[s] || ["badge-gray", s];
  return <span className={`badge ${c}`}>{l}</span>;
};

export default function ReportsPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.append("status", filter);
      const { data } = await api.get(`/admin/blivre/reports?${params}`);
      setItems(data);
    } catch (e) {
      alert(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filter]);

  const update = async (id, status) => {
    try {
      await api.patch(`/admin/blivre/reports/${id}`, { status });
      load();
    } catch (e) {
      alert(formatErr(e));
    }
  };

  return (
    <div className="space-y-5" data-testid="reports-page">
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-mute)]">Moderação</div>
        <h1 className="text-2xl font-bold mt-1">Denúncias</h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">{items.length} denúncia(s)</p>
      </div>

      <div className="card-premium p-4 flex flex-wrap items-center gap-2">
        {STATUS.map((s) => (
          <button
            key={s.key}
            data-testid={`reports-tab-${s.key || "all"}`}
            className={`btn ${filter === s.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(s.key)}
          >
            {s.label}
          </button>
        ))}
        <button className="btn btn-ghost ml-auto" onClick={load} data-testid="reports-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Reportado por</th>
                <th>Alvo</th>
                <th>Status</th>
                <th>Criada</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody data-testid="reports-table">
              {loading && <tr><td colSpan={7} className="text-center py-10 text-[var(--text-mute)]"><RefreshCw className="inline animate-spin" size={16} /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-[var(--text-mute)]">Sem denúncias.</td></tr>}
              {items.map((r) => (
                <tr key={r.id} data-testid={`report-row-${r.id}`}>
                  <td><span className="badge badge-violet">{r.target_type}</span></td>
                  <td className="font-medium max-w-[280px]">
                    <div className="truncate">{r.reason}</div>
                    {r.description && <div className="text-xs text-[var(--text-mute)] truncate">{r.description}</div>}
                  </td>
                  <td className="text-[var(--text-dim)] text-sm">{r.reporter_name}</td>
                  <td className="text-xs mono text-[var(--text-mute)] max-w-[160px] truncate">{r.target_id}</td>
                  <td><StatusBadge s={r.status} /></td>
                  <td className="text-[var(--text-dim)] text-xs mono">{r.created_at?.slice(0, 10)}</td>
                  <td className="text-right">
                    <select
                      data-testid={`report-status-${r.id}`}
                      className="input-premium w-auto text-xs py-1.5"
                      value={r.status}
                      onChange={(e) => update(r.id, e.target.value)}
                    >
                      <option value="pending">Pendente</option>
                      <option value="reviewing">Em análise</option>
                      <option value="resolved">Resolver</option>
                      <option value="dismissed">Descartar</option>
                    </select>
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

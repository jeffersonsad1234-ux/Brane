import { useEffect, useState } from "react";
import { api, formatErr } from "../api";
import { Search, Trash2, RefreshCw, Eye, Heart } from "lucide-react";

const StatusBadge = ({ status }) => {
  const map = {
    active: ["badge-green", "Ativo"],
    removed: ["badge-red", "Removido"],
    pending: ["badge-amber", "Pendente"],
  };
  const [cls, lbl] = map[status] || ["badge-gray", status];
  return <span className={`badge ${cls}`}>{lbl}</span>;
};

export default function ListingsPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (filter) params.append("status", filter);
      const { data } = await api.get(`/admin/blivre/listings?${params}`);
      setItems(data);
    } catch (e) {
      alert(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const remove = async (id, title) => {
    if (!window.confirm(`Remover o anúncio "${title}"?`)) return;
    try {
      await api.delete(`/admin/blivre/listings/${id}`);
      load();
    } catch (e) {
      alert(formatErr(e));
    }
  };

  return (
    <div className="space-y-5" data-testid="listings-page">
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-mute)]">Moderação</div>
        <h1 className="text-2xl font-bold mt-1">Anúncios B-Livre</h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">{items.length} anúncio(s) · classificados gratuitos</p>
      </div>

      <div className="card-premium p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-mute)]" />
          <input
            data-testid="listings-search"
            className="input-premium pl-9"
            placeholder="Buscar por título, descrição ou categoria"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <select className="input-premium w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} data-testid="listings-filter">
          <option value="">Todos</option>
          <option value="active">Ativos</option>
          <option value="removed">Removidos</option>
        </select>
        <button className="btn btn-ghost" onClick={load} data-testid="listings-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Anúncio</th>
                <th>Categoria</th>
                <th>Autor</th>
                <th>Métricas</th>
                <th>Status</th>
                <th>Criado</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody data-testid="listings-table">
              {loading && <tr><td colSpan={7} className="text-center py-10 text-[var(--text-mute)]"><RefreshCw className="inline animate-spin" size={16} /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-[var(--text-mute)]">Nenhum anúncio encontrado.</td></tr>}
              {items.map((l) => (
                <tr key={l.id} data-testid={`listing-row-${l.id}`}>
                  <td className="font-medium max-w-[260px] truncate">{l.title}</td>
                  <td><span className="badge badge-blue">{l.category || "geral"}</span></td>
                  <td className="text-[var(--text-dim)]">{l.owner_name || "—"}</td>
                  <td>
                    <div className="flex gap-3 text-xs">
                      <span className="flex items-center gap-1 text-[var(--text-dim)]"><Eye size={11} /> {l.views || 0}</span>
                      <span className="flex items-center gap-1 text-[var(--text-dim)]"><Heart size={11} /> {l.interests || 0}</span>
                    </div>
                  </td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="text-[var(--text-dim)] text-xs mono">{l.created_at?.slice(0, 10)}</td>
                  <td className="text-right">
                    {l.status !== "removed" && (
                      <button className="btn btn-danger" onClick={() => remove(l.id, l.title)} data-testid={`remove-listing-${l.id}`}>
                        <Trash2 size={13} /> Remover
                      </button>
                    )}
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

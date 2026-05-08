import { useEffect, useState } from "react";
import { api, formatErr } from "../api";
import { Search, UserX, Ban, CheckCircle2, Trash2, RefreshCw } from "lucide-react";

const StatusBadge = ({ status, online }) => {
  if (online) return <span className="badge badge-green">● Online</span>;
  if (status === "active") return <span className="badge badge-gray">Offline</span>;
  if (status === "suspended") return <span className="badge badge-amber">Suspenso</span>;
  if (status === "banned") return <span className="badge badge-red">Bloqueado</span>;
  return <span className="badge badge-gray">{status}</span>;
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (filter) params.append("status", filter);
      const { data } = await api.get(`/admin/blivre/users?${params}`);
      setUsers(data);
    } catch (e) {
      setErr(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateStatus = async (id, status) => {
    if (!window.confirm(`Confirmar alteração de status para "${status}"?`)) return;
    try {
      await api.patch(`/admin/blivre/users/${id}`, { status });
      load();
    } catch (e) {
      alert(formatErr(e));
    }
  };

  const removeUser = async (id, name) => {
    if (!window.confirm(`Remover permanentemente o usuário "${name}" e todos os seus anúncios?`)) return;
    try {
      await api.delete(`/admin/blivre/users/${id}`);
      load();
    } catch (e) {
      alert(formatErr(e));
    }
  };

  return (
    <div className="space-y-5" data-testid="users-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-mute)]">Moderação</div>
          <h1 className="text-2xl font-bold mt-1">Usuários da B-Livre</h1>
          <p className="text-sm text-[var(--text-dim)] mt-1">{users.length} usuário(s) listado(s)</p>
        </div>
      </div>

      <div className="card-premium p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-mute)]" />
          <input
            data-testid="users-search"
            className="input-premium pl-9"
            placeholder="Buscar por nome ou e-mail"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <select
          data-testid="users-filter"
          className="input-premium w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="active">Ativos</option>
          <option value="suspended">Suspensos</option>
          <option value="banned">Bloqueados</option>
        </select>
        <button className="btn btn-ghost" onClick={load} data-testid="users-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {err && <div className="card-premium p-4 text-sm text-red-300">{err}</div>}

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Anúncios</th>
                <th>Status</th>
                <th>Cadastrado</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody data-testid="users-table">
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-[var(--text-mute)]"><RefreshCw className="inline animate-spin" size={16} /></td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-[var(--text-mute)]">Nenhum usuário encontrado.</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} data-testid={`user-row-${u.id}`}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent-2)] flex items-center justify-center text-xs font-bold">
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="font-medium">{u.name}</div>
                    </div>
                  </td>
                  <td className="text-[var(--text-dim)]">{u.email}</td>
                  <td className="tabular-nums">{u.listings_count}</td>
                  <td><StatusBadge status={u.status} online={u.online} /></td>
                  <td className="text-[var(--text-dim)] text-xs mono">{u.created_at?.slice(0, 10)}</td>
                  <td>
                    <div className="flex items-center gap-2 justify-end">
                      {u.status !== "active" ? (
                        <button className="btn btn-ghost" onClick={() => updateStatus(u.id, "active")} data-testid={`activate-${u.id}`}>
                          <CheckCircle2 size={13} /> Reativar
                        </button>
                      ) : (
                        <button className="btn btn-ghost" onClick={() => updateStatus(u.id, "suspended")} data-testid={`suspend-${u.id}`}>
                          <UserX size={13} /> Suspender
                        </button>
                      )}
                      {u.status !== "banned" && (
                        <button className="btn btn-danger" onClick={() => updateStatus(u.id, "banned")} data-testid={`ban-${u.id}`}>
                          <Ban size={13} /> Bloquear
                        </button>
                      )}
                      <button className="btn btn-danger" onClick={() => removeUser(u.id, u.name)} data-testid={`delete-${u.id}`}>
                        <Trash2 size={13} />
                      </button>
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

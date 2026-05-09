import { useEffect, useState } from "react";
import { blApi, blFmtErr } from "./api";
import { Search, UserX, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const StatusBadge = ({ blocked }) =>
  blocked
    ? <span className="badge badge-red">Bloqueado</span>
    : <span className="badge badge-green">Ativo</span>;

export default function BLivreUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await blApi.get("/admin/users");
      let list = data?.users || data || [];
      if (!Array.isArray(list)) list = [];
      if (q) {
        const qq = q.toLowerCase();
        list = list.filter((u) =>
          (u.name || "").toLowerCase().includes(qq) ||
          (u.email || "").toLowerCase().includes(qq)
        );
      }
      setUsers(list);
    } catch (e) {
      toast.error(blFmtErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const block = async (u) => {
    if (!window.confirm(`Suspender o usuário ${u.name}?`)) return;
    try {
      await blApi.put(`/admin/users/${u.user_id}/block`);
      toast.success("Usuário suspenso");
      load();
    } catch (e) { toast.error(blFmtErr(e)); }
  };

  const unblock = async (u) => {
    try {
      await blApi.put(`/admin/users/${u.user_id}/unblock`);
      toast.success("Usuário reativado");
      load();
    } catch (e) { toast.error(blFmtErr(e)); }
  };

  return (
    <div data-testid="bl-users-page" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--bl-text-mute)" }}>Moderação</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 4px" }}>Usuários da B-Livre</h1>
        <p style={{ fontSize: 14, color: "var(--bl-text-dim)", margin: 0 }}>{users.length} usuário(s) listado(s)</p>
      </div>

      <div className="card-premium" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--bl-text-mute)" }} />
          <input
            data-testid="bl-users-search"
            className="input-premium"
            placeholder="Buscar por nome ou e-mail"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <button className="btn btn-ghost" onClick={load} data-testid="bl-users-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card-premium" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-premium">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Função</th>
                <th>Status</th>
                <th>Cadastrado</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody data-testid="bl-users-table">
              {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}><RefreshCw className="animate-spin" size={16} style={{ display: "inline-block" }} /></td></tr>}
              {!loading && users.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}>Nenhum usuário encontrado.</td></tr>}
              {users.map((u) => (
                <tr key={u.user_id} data-testid={`bl-user-row-${u.user_id}`}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bl-accent-soft)", color: "var(--bl-accent-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                        {(u.name || "?")[0].toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                    </div>
                  </td>
                  <td style={{ color: "var(--bl-text-dim)" }}>{u.email}</td>
                  <td><span className="badge badge-violet">{u.role || "user"}</span></td>
                  <td><StatusBadge blocked={u.is_blocked} /></td>
                  <td style={{ color: "var(--bl-text-dim)", fontSize: 12 }} className="mono">{(u.created_at || "").slice(0, 10)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      {u.is_blocked ? (
                        <button className="btn btn-ghost" onClick={() => unblock(u)} data-testid={`bl-unblock-${u.user_id}`}>
                          <CheckCircle2 size={13} /> Reativar
                        </button>
                      ) : (
                        <button className="btn btn-danger" onClick={() => block(u)} data-testid={`bl-block-${u.user_id}`}>
                          <UserX size={13} /> Suspender
                        </button>
                      )}
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

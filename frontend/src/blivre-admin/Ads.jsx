import { useEffect, useState } from "react";
import { blApi, blFmtErr } from "./api";
import { Search, Trash2, RefreshCw, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

export default function BLivreAds() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await blApi.get("/admin/ads");
      let list = data?.ads || data || [];
      if (!Array.isArray(list)) list = [];
      if (q) {
        const qq = q.toLowerCase();
        list = list.filter((a) =>
          (a.title || a.content || "").toLowerCase().includes(qq) ||
          (a.category || "").toLowerCase().includes(qq) ||
          (a.user_name || "").toLowerCase().includes(qq)
        );
      }
      setItems(list);
    } catch (e) {
      toast.error(blFmtErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const remove = async (a) => {
    if (!window.confirm(`Remover o anúncio "${a.title || a.content?.slice(0, 30)}"?`)) return;
    try {
      const id = a.ad_id || a.post_id || a.id;
      await blApi.delete(`/admin/ads/${id}`);
      toast.success("Anúncio removido");
      load();
    } catch (e) {
      // fallback: try social-posts/remove
      try {
        const id = a.post_id || a.ad_id || a.id;
        await blApi.put(`/admin/social-posts/${id}/remove`);
        toast.success("Anúncio removido");
        load();
      } catch (e2) { toast.error(blFmtErr(e2)); }
    }
  };

  const toggleBlock = async (a) => {
    try {
      const id = a.post_id || a.ad_id || a.id;
      if (a.is_blocked) {
        await blApi.put(`/admin/social-posts/${id}/unblock`);
        toast.success("Anúncio reativado");
      } else {
        await blApi.put(`/admin/social-posts/${id}/remove`);
        toast.success("Anúncio bloqueado");
      }
      load();
    } catch (e) { toast.error(blFmtErr(e)); }
  };

  return (
    <div data-testid="bl-ads-page" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--bl-text-mute)" }}>Moderação</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 4px" }}>Anúncios B-Livre</h1>
        <p style={{ fontSize: 14, color: "var(--bl-text-dim)", margin: 0 }}>{items.length} anúncio(s) · classificados gratuitos</p>
      </div>

      <div className="card-premium" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--bl-text-mute)" }} />
          <input
            data-testid="bl-ads-search"
            className="input-premium"
            placeholder="Buscar por título, autor ou categoria"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <button className="btn btn-ghost" onClick={load} data-testid="bl-ads-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card-premium" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-premium">
            <thead>
              <tr>
                <th>Anúncio</th>
                <th>Autor</th>
                <th>Cidade</th>
                <th>Status</th>
                <th>Criado</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody data-testid="bl-ads-table">
              {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}><RefreshCw className="animate-spin" size={16} style={{ display: "inline-block" }} /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}>Nenhum anúncio encontrado.</td></tr>}
              {items.map((a) => (
                <tr key={a.post_id || a.ad_id || a.id} data-testid={`bl-ad-row-${a.post_id || a.ad_id}`}>
                  <td style={{ fontWeight: 500, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title || a.content?.slice(0, 50) || "Sem título"}</td>
                  <td style={{ color: "var(--bl-text-dim)" }}>{a.user_name || "—"}</td>
                  <td style={{ color: "var(--bl-text-dim)", fontSize: 13 }}>{a.city || "—"}</td>
                  <td>{a.is_blocked
                    ? <span className="badge badge-red">Bloqueado</span>
                    : <span className="badge badge-green">Ativo</span>}</td>
                  <td style={{ color: "var(--bl-text-dim)", fontSize: 12 }} className="mono">{(a.created_at || "").slice(0, 10)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost" onClick={() => toggleBlock(a)} data-testid={`bl-toggle-${a.post_id || a.ad_id}`}>
                        {a.is_blocked ? <><Unlock size={13} /> Desbloquear</> : <><Lock size={13} /> Bloquear</>}
                      </button>
                      <button className="btn btn-danger" onClick={() => remove(a)} data-testid={`bl-remove-${a.post_id || a.ad_id}`}>
                        <Trash2 size={13} /> Remover
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

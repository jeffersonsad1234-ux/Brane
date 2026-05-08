import { useEffect, useState } from "react";
import { blApi, blFmtErr } from "./api";
import { Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function BLivreMessages() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await blApi.get("/admin/messages");
      let list = data?.messages || data || [];
      if (!Array.isArray(list)) list = [];
      if (q) {
        const qq = q.toLowerCase();
        list = list.filter((m) =>
          (m.content || m.message || "").toLowerCase().includes(qq) ||
          (m.sender_name || m.from_name || "").toLowerCase().includes(qq) ||
          (m.recipient_name || m.to_name || "").toLowerCase().includes(qq)
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

  return (
    <div data-testid="bl-messages-page" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--bl-text-mute)" }}>Moderação</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 4px" }}>Mensagens</h1>
        <p style={{ fontSize: 14, color: "var(--bl-text-dim)", margin: 0 }}>
          {items.length} mensagem(ns) entre usuários da B-Livre
        </p>
      </div>

      <div className="card-premium" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--bl-text-mute)" }} />
          <input
            data-testid="bl-messages-search"
            className="input-premium"
            placeholder="Buscar por conteúdo ou usuário"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <button className="btn btn-ghost" onClick={load} data-testid="bl-messages-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card-premium" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-premium">
            <thead>
              <tr>
                <th>De → Para</th>
                <th>Mensagem</th>
                <th>Quando</th>
              </tr>
            </thead>
            <tbody data-testid="bl-messages-table">
              {loading && <tr><td colSpan={3} style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}><RefreshCw className="animate-spin" size={16} style={{ display: "inline-block" }} /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", padding: 40, color: "var(--bl-text-mute)" }}>Sem mensagens.</td></tr>}
              {items.map((m, i) => (
                <tr key={m.message_id || m.id || i}>
                  <td style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 500 }}>{m.sender_name || m.from_name || "—"}</div>
                    <div style={{ color: "var(--bl-text-mute)", fontSize: 12 }}>→ {m.recipient_name || m.to_name || "—"}</div>
                  </td>
                  <td style={{ fontSize: 14, maxWidth: 480 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.content || m.message || "—"}
                    </div>
                  </td>
                  <td style={{ color: "var(--bl-text-dim)", fontSize: 12 }} className="mono">
                    {(m.created_at || "").replace("T", " ").slice(0, 16)}
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

import { useEffect, useState } from "react";
import { api, formatErr } from "../api";
import { Search, RefreshCw } from "lucide-react";

export default function MessagesPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      const { data } = await api.get(`/admin/blivre/messages?${params}`);
      setItems(data);
    } catch (e) {
      alert(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5" data-testid="messages-page">
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-mute)]">Moderação</div>
        <h1 className="text-2xl font-bold mt-1">Mensagens</h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          {items.length} mensagem(ns) entre anunciantes e interessados
        </p>
      </div>

      <div className="card-premium p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-mute)]" />
          <input
            data-testid="messages-search"
            className="input-premium pl-9"
            placeholder="Buscar por conteúdo, usuário ou anúncio"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <button className="btn btn-ghost" onClick={load} data-testid="messages-refresh">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th>De → Para</th>
                <th>Anúncio</th>
                <th>Mensagem</th>
                <th>Quando</th>
              </tr>
            </thead>
            <tbody data-testid="messages-table">
              {loading && <tr><td colSpan={4} className="text-center py-10 text-[var(--text-mute)]"><RefreshCw className="inline animate-spin" size={16} /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-[var(--text-mute)]">Sem mensagens.</td></tr>}
              {items.map((m) => (
                <tr key={m.id} data-testid={`message-row-${m.id}`}>
                  <td className="text-sm">
                    <div className="font-medium">{m.from_user_name}</div>
                    <div className="text-[var(--text-mute)] text-xs">→ {m.to_user_name}</div>
                  </td>
                  <td className="text-[var(--text-dim)] text-sm max-w-[220px] truncate">{m.listing_title || "—"}</td>
                  <td className="text-sm max-w-[420px]">
                    <div className="truncate">{m.content}</div>
                  </td>
                  <td className="text-[var(--text-dim)] text-xs mono">{m.created_at?.replace("T", " ").slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

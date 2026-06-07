import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { search } from "./BranpyAPI";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app").trim();

export default function BranpySearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState("videos");
  const [results, setResults] = useState({ videos: [], users: [], hashtags: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      doSearch(initialQuery, tab);
    }
  }, [initialQuery, tab]);

  const doSearch = async (q, t) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await search(q, t);
      setResults((prev) => ({ ...prev, [t]: data[t] || [] }));
    } catch {}
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim(), type: tab });
      doSearch(query.trim(), tab);
    }
  };

  const tabs = [
    { id: "videos", label: "Videos" },
    { id: "users", label: "Usuarios" },
    { id: "hashtags", label: "Hashtags" },
  ];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar videos, usuarios, hashtags..."
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, outline: "none",
            }}
          />
          <button type="submit" style={{
            padding: "10px 16px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg,#8A2CFF,#5B1BA6)", color: "#fff", cursor: "pointer", fontSize: 13,
          }}>
            Buscar
          </button>
        </div>
      </form>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {tabs.map((t) => (
          <div key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, textAlign: "center", padding: "10px 0", fontSize: 13, cursor: "pointer",
              color: tab === t.id ? "#fff" : "rgba(255,255,255,0.4)",
              borderBottom: tab === t.id ? "2px solid #8A2CFF" : "2px solid transparent",
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Buscando...</div>}

      {tab === "videos" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
          {results.videos.map((v) => (
            <Link key={v.video_id} to={`/branpy/video/${v.video_id}`} style={{ aspectRatio: "9/16", background: "#111", borderRadius: 6, overflow: "hidden", display: "block", textDecoration: "none", position: "relative" }}>
              {v.file_path ? (
                <video src={`${API_BASE}/api/files/${v.file_path}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.1)", fontSize: 20 }}>📹</div>
              )}
              <div style={{ position: "absolute", bottom: 4, left: 4, right: 4 }}>
                <div style={{ fontSize: 10, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title || "Sem titulo"}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>@{v.user?.name}</div>
              </div>
            </Link>
          ))}
          {!loading && query && results.videos.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Nenhum video encontrado para "{query}"</div>}
        </div>
      )}

      {tab === "users" && (
        <div>
          {results.users.map((u) => (
            <Link key={u.user_id} to={`/branpy/profile/${u.user_id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", textDecoration: "none", color: "inherit" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: u.picture ? `url(${u.picture}) center/cover` : "linear-gradient(135deg,#8A2CFF,#5B1BA6)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 600 }}>
                {!u.picture && (u.name?.[0] || "U")}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{u.email}</div>
              </div>
            </Link>
          ))}
          {!loading && query && results.users.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Nenhum usuario encontrado para "{query}"</div>}
        </div>
      )}

      {tab === "hashtags" && (
        <div>
          {results.hashtags.map((h) => (
            <Link key={h.name} to={`/branpy/search?q=${h.name}&type=videos`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", textDecoration: "none", color: "inherit" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(138,44,255,0.9)" }}>#{h.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{h.count || 0} videos</div>
              </div>
              <span style={{ fontSize: 18 }}>➡️</span>
            </Link>
          ))}
          {!loading && query && results.hashtags.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Nenhuma hashtag encontrada para "{query}"</div>}
        </div>
      )}

      {!query && (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
          Digite algo para buscar no BRANPI
        </div>
      )}
    </div>
  );
}

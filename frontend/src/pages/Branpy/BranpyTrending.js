import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTrending } from "./BranpyAPI";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app").trim();

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export default function BranpyTrending() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all"); // all, today, week

  useEffect(() => {
    loadTrending();
  }, [period]);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const data = await getTrending(1, 30);
      setVideos(data.videos || []);
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Tendencias 🔥</h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Videos mais populares do BRANPI</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "today", "week"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{
              padding: "6px 14px", borderRadius: 16, border: "none", cursor: "pointer",
              background: period === p ? "linear-gradient(135deg,#8A2CFF,#5B1BA6)" : "rgba(255,255,255,0.06)",
              color: period === p ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 12,
            }}
          >
            {p === "all" ? "Tudo" : p === "today" ? "Hoje" : "Semana"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Carregando...</div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Nenhum video em tendencia</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {videos.map((v, i) => (
            <Link key={v.video_id || i} to={`/branpy/video/${v.video_id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ borderRadius: 10, overflow: "hidden", background: "#111", position: "relative" }}>
                <div style={{ aspectRatio: "9/16", background: "#1a1a1a" }}>
                  {v.file_path ? (
                    <video src={`${API_BASE}/api/files/${v.file_path}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.1)", fontSize: 24 }}>📹</div>
                  )}
                </div>
                <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#fff" }}>
                  #{i + 1}
                </div>
                <div style={{ padding: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title || "Sem titulo"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>@{v.user?.name || "usuario"}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>👁️ {formatCount(v.views_count)} • ❤️ {formatCount(v.likes_count)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

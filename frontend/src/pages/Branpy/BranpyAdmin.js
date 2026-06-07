import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getAdminStats, getAdminVideos, getAdminUsers, deleteVideo } from "./BranpyAPI";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app").trim();

export default function BranpyAdmin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("stats");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, v, u] = await Promise.all([
        getAdminStats(),
        getAdminVideos(),
        getAdminUsers(),
      ]);
      setStats(s);
      setVideos(v.videos || []);
      setUsers(u.users || []);
    } catch {}
    setLoading(false);
  };

  if (!user || user.role !== "admin") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh", color: "rgba(255,255,255,0.3)", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <div style={{ fontSize: 16 }}>Acesso restrito a administradores</div>
      </div>
    );
  }

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Deletar este video permanentemente?")) return;
    try {
      await deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v.video_id !== videoId));
    } catch {}
  };

  const tabs = [
    { id: "stats", label: "Estatisticas" },
    { id: "videos", label: "Videos" },
    { id: "users", label: "Usuarios" },
  ];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Painel BRANPI</h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Administracao da plataforma de videos</p>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {tabs.map((t) => (
          <div key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px", fontSize: 13, cursor: "pointer", color: tab === t.id ? "#fff" : "rgba(255,255,255,0.4)",
              borderBottom: tab === t.id ? "2px solid #8A2CFF" : "2px solid transparent",
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>Carregando...</div>
      ) : tab === "stats" && stats ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {[
            { label: "Total Videos", value: stats.total_videos },
            { label: "Total Likes", value: stats.total_likes },
            { label: "Total Comentarios", value: stats.total_comments },
            { label: "Total Views", value: stats.total_views },
            { label: "Total Seguidores", value: stats.total_follows },
            { label: "Usuarios Ativos (24h)", value: stats.active_users_today },
            { label: "Criadores Unicos", value: stats.total_users?.length || 0 },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{s.value ?? "—"}</div>
            </div>
          ))}
        </div>
      ) : tab === "videos" ? (
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{videos.length} videos no total</div>
          {videos.map((v) => (
            <div key={v.video_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ width: 40, height: 60, borderRadius: 4, background: "#1a1a1a", flexShrink: 0, overflow: "hidden" }}>
                {v.file_path ? (
                  <video src={`${API_BASE}/api/files/${v.file_path}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.1)", fontSize: 16 }}>📹</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title || "Sem titulo"}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>@{v.user?.name} • {v.views_count || 0} views • {v.likes_count || 0} likes</div>
              </div>
              <button onClick={() => handleDeleteVideo(v.video_id)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "rgba(239,68,68,0.7)", fontSize: 11, cursor: "pointer" }}>
                Deletar
              </button>
            </div>
          ))}
          {videos.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Nenhum video cadastrado</div>}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{users.length} usuarios</div>
          {users.map((u) => (
            <div key={u.user_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: u.picture ? `url(${u.picture}) center/cover` : "linear-gradient(135deg,#8A2CFF,#5B1BA6)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>
                {!u.picture && (u.name?.[0] || "U")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{u.email} • {u.role}</div>
              </div>
            </div>
          ))}
          {users.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Nenhum usuario</div>}
        </div>
      )}
    </div>
  );
}

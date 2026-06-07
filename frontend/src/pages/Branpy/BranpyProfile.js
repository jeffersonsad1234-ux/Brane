import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProfile, getUserVideos, toggleFollow, checkFollowed, getFollowers, getFollowing } from "./BranpyAPI";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app").trim();

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export default function BranpyProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [tab, setTab] = useState("videos");

  useEffect(() => {
    loadProfile();
    loadVideos();
  }, [id]);

  const loadProfile = async () => {
    try {
      const p = await getProfile(id);
      setProfile(p);
      setFollowing(p.is_followed);
    } catch {}
    finally { setLoading(false); }
  };

  const loadVideos = async () => {
    try {
      const d = await getUserVideos(id);
      setVideos(d.videos || []);
    } catch {}
  };

  const handleFollow = async () => {
    if (!me) { navigate("/auth"); return; }
    try {
      const r = await toggleFollow(id);
      setFollowing(r.following);
      setProfile((p) => ({ ...p, followers_count: p.followers_count + (r.following ? 1 : -1) }));
    } catch {}
  };

  const loadFollowers = async () => {
    const d = await getFollowers(id);
    setFollowersList(d.users || []);
    setShowFollowers(true);
  };

  const loadFollowings = async () => {
    const d = await getFollowing(id);
    setFollowingList(d.users || []);
    setShowFollowing(true);
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>Carregando...</div>;
  }

  if (!profile) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>Usuario nao encontrado</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 0 }}>
      {/* Banner */}
      <div style={{ height: 160, background: profile.banner ? `url(${API_BASE}/api/files/${profile.banner}) center/cover` : "linear-gradient(135deg,#8A2CFF20,#5B1BA620)", borderRadius: "0 0 20px 20px" }} />

      {/* Avatar & Info */}
      <div style={{ padding: "0 16px", marginTop: -50 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: profile.avatar ? `url(${API_BASE}/api/files/${profile.avatar}) center/cover` : "linear-gradient(135deg,#8A2CFF,#5B1BA6)", border: "3px solid #050608", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28, fontWeight: 700 }}>
            {!profile.avatar && (profile.name?.[0] || "U")}
          </div>
          <div style={{ flex: 1, paddingTop: 40 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{profile.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>@{profile.name?.toLowerCase().replace(/\s/g, "_")}</div>
          </div>
          {me && me.user_id !== id && (
            <button onClick={handleFollow}
              style={{
                padding: "8px 20px", borderRadius: 20, border: following ? "1px solid rgba(255,255,255,0.2)" : "none",
                background: following ? "transparent" : "linear-gradient(135deg,#8A2CFF,#5B1BA6)",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {following ? "Seguindo" : "Seguir"}
            </button>
          )}
        </div>

        {/* Bio */}
        {profile.bio && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 10, lineHeight: 1.4 }}>{profile.bio}</div>}

        {/* Stats */}
        <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 13 }}>
          <div><strong style={{ color: "#fff" }}>{formatCount(profile.videos_count)}</strong> <span style={{ color: "rgba(255,255,255,0.4)" }}>videos</span></div>
          <div onClick={loadFollowers} style={{ cursor: "pointer" }}><strong style={{ color: "#fff" }}>{formatCount(profile.followers_count)}</strong> <span style={{ color: "rgba(255,255,255,0.4)" }}>seguidores</span></div>
          <div onClick={loadFollowings} style={{ cursor: "pointer" }}><strong style={{ color: "#fff" }}>{formatCount(profile.following_count)}</strong> <span style={{ color: "rgba(255,255,255,0.4)" }}>seguindo</span></div>
        </div>
        {profile.total_views > 0 && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{formatCount(profile.total_views)} visualizacoes totais</div>
        )}
      </div>

      {/* Video grid */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
          <div onClick={() => setTab("videos")} style={{ flex: 1, textAlign: "center", padding: "10px 0", fontSize: 13, color: tab === "videos" ? "#fff" : "rgba(255,255,255,0.4)", borderBottom: tab === "videos" ? "2px solid #8A2CFF" : "2px solid transparent", cursor: "pointer" }}>Videos</div>
          <div onClick={() => setTab("liked")} style={{ flex: 1, textAlign: "center", padding: "10px 0", fontSize: 13, color: tab === "liked" ? "#fff" : "rgba(255,255,255,0.4)", borderBottom: tab === "liked" ? "2px solid #8A2CFF" : "2px solid transparent", cursor: "pointer" }}>Curtidos</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, padding: "0 2px" }}>
          {videos.map((v) => (
            <Link key={v.video_id} to={`/branpy/video/${v.video_id}`} style={{ aspectRatio: "9/16", background: "#111", borderRadius: 4, overflow: "hidden", display: "block", position: "relative", textDecoration: "none" }}>
              {v.file_path ? (
                <video src={`${API_BASE}/api/files/${v.file_path}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Sem video</div>
              )}
              <div style={{ position: "absolute", bottom: 4, right: 4, fontSize: 10, color: "#fff", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4 }}>
                ❤️ {v.likes_count || 0}
              </div>
            </Link>
          ))}
        </div>
        {videos.length === 0 && <div style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Nenhum video publicado</div>}
      </div>

      {/* Followers modal */}
      {showFollowers && (
        <div onClick={() => setShowFollowers(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#111", borderRadius: 12, padding: 16, width: "100%", maxWidth: 360, maxHeight: "60vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Seguidores ({profile.followers_count})</div>
              <div onClick={() => setShowFollowers(false)} style={{ cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>✕</div>
            </div>
            {followersList.map((u) => (
              <Link key={u.user_id} to={`/branpy/profile/${u.user_id}`} onClick={() => setShowFollowers(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", textDecoration: "none", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.avatar || "linear-gradient(135deg,#8A2CFF,#5B1BA6)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>{u.name?.[0] || "U"}</div>
                <span>{u.name}</span>
              </Link>
            ))}
            {followersList.length === 0 && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 20, fontSize: 13 }}>Nenhum seguidor</div>}
          </div>
        </div>
      )}

      {/* Following modal */}
      {showFollowing && (
        <div onClick={() => setShowFollowing(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#111", borderRadius: 12, padding: 16, width: "100%", maxWidth: 360, maxHeight: "60vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Seguindo ({profile.following_count})</div>
              <div onClick={() => setShowFollowing(false)} style={{ cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>✕</div>
            </div>
            {followingList.map((u) => (
              <Link key={u.user_id} to={`/branpy/profile/${u.user_id}`} onClick={() => setShowFollowing(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", textDecoration: "none", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.avatar || "linear-gradient(135deg,#8A2CFF,#5B1BA6)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>{u.name?.[0] || "U"}</div>
                <span>{u.name}</span>
              </Link>
            ))}
            {followingList.length === 0 && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 20, fontSize: 13 }}>Nao segue ninguem</div>}
          </div>
        </div>
      )}
    </div>
  );
}

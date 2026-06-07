import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getVideo, toggleLike, addView, checkLiked, getComments, addComment, deleteComment, toggleFollow, deleteVideo } from "./BranpyAPI";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app").trim();

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return "agora";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d`;
  return `${Math.floor(sec / 2592000)}mes`;
}

export default function BranpyVideoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    loadVideo();
    loadComments();
    addView(id);
  }, [id]);

  const loadVideo = async () => {
    try {
      const v = await getVideo(id);
      setVideo(v);
      setLiked(v.is_liked);
      setFollowing(v.is_followed);
    } catch { setError("Video nao encontrado"); }
    finally { setLoading(false); }
  };

  const loadComments = async () => {
    try {
      const d = await getComments(id);
      setComments(d.comments || []);
    } catch {}
  };

  const handleLike = async () => {
    if (!user) { navigate("/auth"); return; }
    const r = await toggleLike(id);
    setLiked(r.liked);
    setVideo((v) => ({ ...v, likes_count: r.likes_count }));
  };

  const handleFollow = async () => {
    if (!user) { navigate("/auth"); return; }
    const r = await toggleFollow(video.user_id);
    setFollowing(r.following);
  };

  const handleComment = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const r = await addComment(id, commentText.trim());
      setComments((prev) => [{ ...r, user: { name: user.name, user_id: user.user_id, picture: user.picture }, created_at: new Date().toISOString() }, ...prev]);
      setCommentText("");
      setVideo((v) => ({ ...v, comments_count: (v.comments_count || 0) + 1 }));
    } catch {}
    setCommentLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Deletar este video?")) return;
    try {
      await deleteVideo(id);
      navigate("/branpy");
    } catch {}
  };

  const handleShare = () => {
    const url = window.location.origin + "/branpy/video/" + id;
    navigator.clipboard?.writeText?.(url);
    alert("Link copiado!");
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>Carregando...</div>;
  }

  if (error || !video) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>{error || "Video nao encontrado"}</div>;
  }

  const vidUrl = video.file_path ? `${API_BASE}/api/files/${video.file_path}` : null;
  const isOwner = user && user.user_id === video.user_id;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Video player */}
      <div style={{ background: "#000", position: "relative" }}>
        {vidUrl ? (
          <video ref={videoRef} src={vidUrl} controls autoPlay playsInline preload="metadata"
            style={{ width: "100%", maxHeight: "70vh", display: "block", outline: "none" }}
          />
        ) : (
          <div style={{ aspectRatio: "9/16", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)" }}>Video indisponivel</div>
        )}
      </div>

      {/* Video info */}
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{video.title || "Sem titulo"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {(video.hashtags || []).map((h, i) => (
            <Link key={i} to={`/branpy/search?q=${h}&type=videos`} style={{ fontSize: 12, color: "rgba(138,44,255,0.8)", textDecoration: "none" }}>#{h}</Link>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>{formatCount(video.views_count)} visualizacoes • {timeAgo(video.created_at)}</div>

        {/* User bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Link to={`/branpy/profile/${video.user_id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: video.user?.picture ? `url(${video.user.picture}) center/cover` : "linear-gradient(135deg,#8A2CFF,#5B1BA6)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 600 }}>
              {!video.user?.picture && (video.user?.name?.[0] || "U")}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{video.user?.name || "Usuario"}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{formatCount(video.user?.followers_count)} seguidores</div>
            </div>
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            {isOwner ? (
              <button onClick={handleDelete} style={{ padding: "6px 14px", borderRadius: 16, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "rgba(239,68,68,0.7)", fontSize: 12, cursor: "pointer" }}>
                Deletar
              </button>
            ) : user && (
              <button onClick={handleFollow}
                style={{
                  padding: "6px 14px", borderRadius: 16, border: following ? "1px solid rgba(255,255,255,0.2)" : "none",
                  background: following ? "transparent" : "linear-gradient(135deg,#8A2CFF,#5B1BA6)",
                  color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600,
                }}
              >
                {following ? "Seguindo" : "Seguir"}
              </button>
            )}
          </div>
        </div>

        {/* Actions row */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center", padding: "12px 0" }}>
          <div onClick={handleLike} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
            <span style={{ fontSize: 28, filter: liked ? "none" : "grayscale(1) opacity(0.5)", transition: "all 0.2s" }}>❤️</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{formatCount(video.likes_count)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 26, opacity: 0.7 }}>💬</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{formatCount(video.comments_count)}</span>
          </div>
          <div onClick={handleShare} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
            <span style={{ fontSize: 24, opacity: 0.7 }}>🔗</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Compartilhar</span>
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, marginBottom: 12, padding: "8px 0" }}>
            {video.description}
          </div>
        )}

        {/* Comments */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Comentarios ({video.comments_count || 0})</div>

          {user && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={500}
                placeholder="Adicione um comentario..."
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, outline: "none",
                }}
              />
              <button onClick={handleComment} disabled={commentLoading || !commentText.trim()}
                style={{
                  padding: "10px 16px", borderRadius: 8, border: "none",
                  background: commentLoading ? "rgba(138,44,255,0.4)" : "linear-gradient(135deg,#8A2CFF,#5B1BA6)",
                  color: "#fff", fontSize: 12, cursor: commentLoading ? "not-allowed" : "pointer",
                }}
              >
                {commentLoading ? "..." : "Enviar"}
              </button>
            </div>
          )}

          {comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Nenhum comentario ainda. Seja o primeiro!</div>
          ) : (
            comments.map((c) => (
              <div key={c.comment_id || c.created_at} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Link to={`/branpy/profile/${c.user_id}`}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: c.user?.picture ? `url(${c.user.picture}) center/cover` : "linear-gradient(135deg,#8A2CFF,#5B1BA6)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>
                    {!c.user?.picture && (c.user?.name?.[0] || "U")}
                  </div>
                </Link>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.user?.name || "Usuario"}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{timeAgo(c.created_at)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{c.content}</div>
                  {(user && (user.user_id === c.user_id || user.role === "admin")) && (
                    <div onClick={() => { deleteComment(c.comment_id); setComments((prev) => prev.filter((x) => x.comment_id !== c.comment_id)); }} style={{ fontSize: 10, color: "rgba(239,68,68,0.5)", cursor: "pointer", marginTop: 4 }}>
                      Excluir
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

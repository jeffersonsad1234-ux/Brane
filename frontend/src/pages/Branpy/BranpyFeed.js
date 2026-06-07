import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFeed, toggleLike, addView, checkLiked } from "./BranpyAPI";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app").trim();

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

function VideoCard({ video, isActive, onPlayState }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const progressRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const vidUrl = video.file_path ? `${API_BASE}/api/files/${video.file_path}` : null;
  const thumbUrl = video.thumbnail ? `${API_BASE}/api/files/${video.thumbnail}` : null;

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setProgress(0);
    }
  }, [isActive]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (v.duration) setProgress((v.currentTime / v.duration) * 100);
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [isActive]);

  useEffect(() => {
    if (isActive && video.video_id) {
      addView(video.video_id);
      checkLiked(video.video_id).then((r) => setLiked(r.liked)).catch(() => {});
    }
  }, [isActive, video.video_id]);

  const handleLike = async () => {
    try {
      const r = await toggleLike(video.video_id);
      setLiked(r.liked);
      setLikeCount(r.likes_count);
    } catch {}
  };

  const handleProfile = (e) => {
    e.stopPropagation();
    navigate(`/branpy/profile/${video.user_id}`);
  };

  return (
    <div style={{
      height: "calc(100vh - 116px)", position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#000", scrollSnapAlign: "start",
    }}>
      {vidUrl ? (
        <video ref={videoRef} src={vidUrl} muted loop playsInline preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onClick={() => { if (videoRef.current) { if (videoRef.current.paused) videoRef.current.play(); else videoRef.current.pause(); }}}
        />
      ) : (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Carregando video...</div>
      )}

      {/* Progress bar */}
      <div ref={progressRef} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.1)" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#8A2CFF,#FF2D55)", transition: "width 0.3s linear" }} />
      </div>

      {/* Overlay info */}
      <div style={{ position: "absolute", bottom: 16, left: 12, right: 80, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div onClick={handleProfile} style={{ width: 36, height: 36, borderRadius: "50%", background: video.user?.picture ? `url(${video.user.picture}) center/cover` : "linear-gradient(135deg,#8A2CFF,#5B1BA6)", cursor: "pointer", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 600 }}>
            {!video.user?.picture && (video.user?.name?.[0] || "U")}
          </div>
          <div>
            <div onClick={handleProfile} style={{ fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>@{video.user?.name || "usuario"}</div>
            {video.title && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{video.title}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(video.hashtags || []).slice(0, 3).map((h, i) => (
            <span key={i} style={{ fontSize: 11, color: "rgba(138,44,255,0.8)" }}>#{h}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ position: "absolute", bottom: 16, right: 8, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div onClick={handleLike} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
          <div style={{ fontSize: 26, filter: liked ? "none" : "grayscale(1) opacity(0.6)", transition: "all 0.2s" }}>❤️</div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>{formatCount(likeCount)}</span>
        </div>
        <div onClick={() => setShowComments(!showComments)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
          <div style={{ fontSize: 24, opacity: 0.7 }}>💬</div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>{formatCount(video.comments_count)}</span>
        </div>
        <div onClick={() => { navigator.clipboard?.writeText?.(window.location.origin + "/branpy/video/" + video.video_id); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
          <div style={{ fontSize: 22, opacity: 0.7 }}>🔗</div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>Compartilhar</span>
        </div>
        <div onClick={handleProfile} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
          <div style={{ fontSize: 22, opacity: 0.7 }}>👤</div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>Perfil</span>
        </div>
      </div>
    </div>
  );
}

export default function BranpyFeed() {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => { loadVideos(); }, []);

  const loadVideos = async () => {
    try {
      const data = await getFeed(page, 10);
      setVideos((prev) => [...prev, ...data.videos]);
      setHasMore(data.has_more);
      setPage((p) => p + 1);
    } catch (e) {
      console.error("Feed error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setActiveIndex(idx);
    if (idx >= videos.length - 3 && hasMore && !loading) {
      loadVideos();
    }
  }, [videos.length, hasMore, loading]);

  if (loading && videos.length === 0) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Carregando feed...</div>;
  }

  if (videos.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "rgba(255,255,255,0.4)", padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>📹</div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)" }}>Nenhum video encontrado</div>
        <div style={{ fontSize: 13 }}>Seja o primeiro a fazer upload!</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} onScroll={handleScroll}
      style={{ height: "calc(100vh - 116px)", overflowY: "scroll", scrollSnapType: "y mandatory", scrollBehavior: "smooth" }}
    >
      {videos.map((v, i) => (
        <VideoCard key={v.video_id || i} video={v} isActive={i === activeIndex} />
      ))}
      {hasMore && <div style={{ padding: 16, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Carregando mais videos...</div>}
    </div>
  );
}

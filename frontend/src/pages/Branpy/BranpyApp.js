import { Routes, Route, Navigate, useParams, Link, useLocation } from "react-router-dom";
import BranpyFeed from "./BranpyFeed";
import BranpyUpload from "./BranpyUpload";
import BranpyProfile from "./BranpyProfile";
import BranpyTrending from "./BranpyTrending";
import BranpySearch from "./BranpySearch";
import BranpyVideoDetail from "./BranpyVideoDetail";
import BranpyAdmin from "./BranpyAdmin";
import BranpyLive from "./BranpyLive";
import BranpyLiveAdmin from "./BranpyLiveAdmin";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

function BranpyNav({ onSearch }) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 16px", background: "rgba(5,5,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(12px)",
    }}>
      <Link to="/branpy" style={{ fontSize: 22, fontWeight: 800, color: "#fff", textDecoration: "none", letterSpacing: -0.5 }}>
        BRANPI
      </Link>
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 360, margin: "0 16px" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar videos, usuarios, hashtags..."
          style={{
            width: "100%", padding: "8px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, outline: "none",
          }}
        />
      </form>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link to="/branpy/upload" style={{ background: "linear-gradient(135deg,#8A2CFF,#5B1BA6)", color: "#fff", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
          + Upload
        </Link>
        <Link to="/branpy/live" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13 }}>🎯</Link>
        <Link to="/branpy/trending" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13 }}>🔥</Link>
        <div style={{ position: "relative" }}>
          <div onClick={() => setMenu(!menu)} style={{ width: 30, height: 30, borderRadius: "50%", background: user?.picture ? `url(${user.picture}) center/cover` : "linear-gradient(135deg,#8A2CFF,#5B1BA6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 600 }}>
            {!user?.picture && (user?.name?.[0] || "U")}
          </div>
          {menu && (
            <div style={{ position: "absolute", top: 36, right: 0, background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 6, minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
              {user ? (
                <>
                  <Link to={`/branpy/profile/${user.user_id}`} onClick={() => setMenu(false)} style={{ display: "block", padding: "8px 12px", color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 13, borderRadius: 6 }}>Meu Perfil</Link>
                  <Link to="/branpy/search" onClick={() => setMenu(false)} style={{ display: "block", padding: "8px 12px", color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 13, borderRadius: 6 }}>Buscar</Link>
                  <Link to="/branpy/live" onClick={() => setMenu(false)} style={{ display: "block", padding: "8px 12px", color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 13, borderRadius: 6 }}>Quiz ao Vivo</Link>
                {user.role === "admin" && <Link to="/branpy/admin" onClick={() => setMenu(false)} style={{ display: "block", padding: "8px 12px", color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 13, borderRadius: 6 }}>Admin</Link>}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }} />
                  <div onClick={() => { logout(); setMenu(false); }} style={{ padding: "8px 12px", color: "rgba(255,80,80,0.8)", cursor: "pointer", fontSize: 13, borderRadius: 6 }}>Sair</div>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMenu(false)} style={{ display: "block", padding: "8px 12px", color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 13, borderRadius: 6 }}>Entrar</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BranpyBottomNav() {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-around",
      padding: "8px 0", paddingBottom: "env(safe-area-inset-bottom, 8px)",
      background: "rgba(5,5,8,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(12px)",
    }}>
      <Link to="/branpy" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <span style={{ fontSize: 20 }}>🏠</span><span>Inicio</span>
      </Link>
      <Link to="/branpy/trending" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <span style={{ fontSize: 20 }}>🔥</span><span>Tendencias</span>
      </Link>
      <Link to="/branpy/upload" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <span style={{ fontSize: 20 }}>➕</span><span>Upload</span>
      </Link>
      <Link to="/branpy/search" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <span style={{ fontSize: 20 }}>🔍</span><span>Buscar</span>
      </Link>
    </div>
  );
}

export default function BranpyApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const isLive = location.pathname === "/branpy/live" || location.pathname === "/branpy/live/admin";

  if (searchQuery) {
    return <Navigate to={`/branpy/search?q=${encodeURIComponent(searchQuery)}`} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050608", color: "#fff", fontFamily: "system-ui,-apple-system,sans-serif", paddingTop: isLive ? 0 : 52, paddingBottom: isLive ? 0 : 64 }}>
      {!isLive && <BranpyNav onSearch={setSearchQuery} />}
      <Routes>
        <Route index element={<BranpyFeed />} />
        <Route path="upload" element={<BranpyUpload />} />
        <Route path="profile/:id" element={<BranpyProfile />} />
        <Route path="trending" element={<BranpyTrending />} />
        <Route path="search" element={<BranpySearch />} />
        <Route path="video/:id" element={<BranpyVideoDetail />} />
        <Route path="live/admin" element={<BranpyLiveAdmin />} />
        <Route path="live" element={<BranpyLive />} />
        <Route path="admin" element={<BranpyAdmin />} />
      </Routes>
      {!isLive && <BranpyBottomNav />}
    </div>
  );
}

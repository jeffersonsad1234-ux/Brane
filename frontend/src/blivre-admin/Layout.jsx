import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { blApi } from "./api";
import {
  LayoutDashboard, Users, Megaphone, MessagesSquare,
  ShieldAlert, LifeBuoy, LogOut, Bell, ShieldCheck, X
} from "lucide-react";
import "./blivre-admin.css";

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("brane_user") || "null"); }
  catch { return null; }
}

export default function BLivreLayout() {
  const nav = useNavigate();
  const [me, setMe] = useState(getStoredUser());
  const [authOk, setAuthOk] = useState(null);
  const [counts, setCounts] = useState({ pending_reports: 0, support: 0, recent_total: 0 });
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Validate token
  useEffect(() => {
    const t = localStorage.getItem("brane_token");
    if (!t) {
      setAuthOk(false);
      return;
    }
    blApi.get("/auth/me")
      .then((r) => {
        if (r.data?.role === "admin") {
          setMe(r.data);
          try { localStorage.setItem("brane_user", JSON.stringify(r.data)); } catch {}
          setAuthOk(true);
        } else {
          setAuthOk(false);
        }
      })
      .catch(() => setAuthOk(false));
  }, []);

  // Polling notifications
  useEffect(() => {
    if (!authOk) return;
    let alive = true;
    const fetchAll = async () => {
      try {
        const [c, d, n] = await Promise.all([
          blApi.get("/admin/notification-counts").catch(() => ({ data: {} })),
          blApi.get("/admin/dashboard").catch(() => ({ data: {} })),
          blApi.get("/admin/notifications").catch(() => ({ data: { notifications: [] } }))
        ]);
        if (!alive) return;
        setCounts({
          pending_reports: c.data?.reports || d.data?.pending_reports || 0,
          support: c.data?.support || d.data?.open_support || 0,
          recent_total: 0,
        });
        setNotifications((n.data.notifications || []).slice(0, 5));
      } catch {}
    };
    fetchAll();
    const id = setInterval(fetchAll, 12000);
    return () => { alive = false; clearInterval(id); };
  }, [authOk]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = async (notif) => {
    try {
      // Mark as read
      await blApi.put(`/admin/notifications/${notif.notification_id}/read`).catch(() => {});
      
      // Navigate based on type
      if (notif.type?.includes('report') || notif.type?.includes('denunc')) {
        nav('/admin/blivre/denuncias');
      } else if (notif.type?.includes('support') || notif.type?.includes('suporte')) {
        nav('/admin/blivre/suporte');
      } else if (notif.type?.includes('message') || notif.type?.includes('mensag')) {
        nav('/admin/blivre/mensagens');
      }
      
      setNotifOpen(false);
    } catch (err) {
      console.error('Erro ao processar notificação:', err);
    }
  };

  if (authOk === null) {
    return (
      <div className="bl-admin" data-testid="bl-layout-loading">
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bl-text-mute)" }}>
          Carregando painel B-Livre...
        </div>
      </div>
    );
  }
  if (authOk === false) return <Navigate to="/admin/blivre/login" replace />;

  const handleLogout = () => {
    localStorage.removeItem("brane_token");
    localStorage.removeItem("brane_user");
    nav("/admin/blivre/login", { replace: true });
  };

  const links = [
    { to: "/admin/blivre", end: true, icon: LayoutDashboard, label: "Visão geral", testid: "bl-nav-overview" },
    { to: "/admin/blivre/usuarios", icon: Users, label: "Usuários", testid: "bl-nav-users" },
    { to: "/admin/blivre/anuncios", icon: Megaphone, label: "Anúncios", testid: "bl-nav-ads" },
    { to: "/admin/blivre/mensagens", icon: MessagesSquare, label: "Mensagens", testid: "bl-nav-messages" },
    { to: "/admin/blivre/denuncias", icon: ShieldAlert, label: "Denúncias", count: counts.pending_reports, testid: "bl-nav-reports" },
    { to: "/admin/blivre/suporte", icon: LifeBuoy, label: "Suporte", count: counts.support, testid: "bl-nav-support" },
  ];

  const totalRecent = (counts.pending_reports || 0) + (counts.support || 0);

  return (
    <div className="bl-admin" data-testid="bl-admin-layout">
      <div className="bg-grid" style={{ display: "flex", minHeight: "100vh", maxHeight: "100vh", overflow: "hidden" }}>
        {/* SIDEBAR */}
        <aside style={{ width: 260, flexShrink: 0, borderRight: "1px solid var(--bl-line)", background: "var(--bl-bg-1)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--bl-line)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bl-accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px -8px rgba(16,185,129,.5)" }}>
              <ShieldCheck size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--bl-text-mute)" }}>B-Livre</div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.1 }}>Admin Panel</div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--bl-text-mute)", padding: "0 12px 8px" }}>Painel</div>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                data-testid={l.testid}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                style={{ marginBottom: 4 }}
              >
                <l.icon size={16} />
                <span>{l.label}</span>
                {l.count > 0 && <span className="nav-count">{l.count}</span>}
              </NavLink>
            ))}

            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--bl-text-mute)", padding: "24px 12px 8px" }}>Escopo</div>
            <div style={{ padding: "0 12px", fontSize: 12, color: "var(--bl-text-dim)", lineHeight: 1.5 }}>
              B-Livre é classificados gratuitos: <strong style={{ color: "var(--bl-text)" }}>usuários, anúncios, mensagens, denúncias e suporte</strong>.
              <br />
              Marketplace é separado.
            </div>
          </nav>

          <div style={{ borderTop: "1px solid var(--bl-line)", padding: 12 }}>
            <div style={{ padding: "8px 12px", marginBottom: 8, borderRadius: 8, background: "var(--bl-bg-2)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bl-accent-soft)", color: "var(--bl-accent-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                {(me?.name || "A")[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me?.name || "Admin"}</div>
                <div style={{ fontSize: 11, color: "var(--bl-text-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me?.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} data-testid="bl-logout">
              <LogOut size={14} /> Sair
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header className="glass" style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--bl-line)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="pulse-dot" />
              <span style={{ fontSize: 13, color: "var(--bl-text-dim)" }}>Painel ao vivo · atualização a cada 12s</span>
            </div>
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(!notifOpen)} className="btn btn-ghost" data-testid="bl-notif-bell">
                <Bell size={15} /> Notificações
                {totalRecent > 0 && <span style={{ marginLeft: 4, background: "var(--bl-danger)", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 7px" }}>{totalRecent}</span>}
              </button>
              
              {notifOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 360, maxHeight: 400, overflowY: "auto", background: "var(--bl-bg-1)", border: "1px solid var(--bl-line)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 50 }}>
                  <div style={{ padding: 12, borderBottom: "1px solid var(--bl-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Notificações</span>
                    <button onClick={() => setNotifOpen(false)} className="btn btn-ghost" style={{ padding: 4, minWidth: "auto" }}>
                      <X size={14} />
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--bl-text-mute)", fontSize: 13 }}>
                      Nenhuma notificação recente
                    </div>
                  ) : (
                    <div>
                      {notifications.map(n => (
                        <div
                          key={n.notification_id}
                          onClick={() => handleNotifClick(n)}
                          style={{
                            padding: 12,
                            borderBottom: "1px solid var(--bl-line-2)",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            background: n.read ? "transparent" : "rgba(16,185,129,0.05)"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bl-bg-2)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = n.read ? "transparent" : "rgba(16,185,129,0.05)"}
                        >
                          <p style={{ fontSize: 13, color: "var(--bl-text)", marginBottom: 4 }}>{n.message}</p>
                          <p style={{ fontSize: 11, color: "var(--bl-text-mute)" }}>
                            {new Date(n.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          <div style={{ flex: 1, padding: 28, overflowY: "auto", overflowX: "hidden" }} data-testid="bl-main-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

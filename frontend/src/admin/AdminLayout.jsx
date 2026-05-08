import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api } from "../api";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  MessagesSquare,
  ShieldAlert,
  LifeBuoy,
  LogOut,
  Bell,
  ShieldCheck,
} from "lucide-react";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [notif, setNotif] = useState({ pending_reports: 0, open_support: 0, recent: { reports_5m: 0, support_5m: 0, messages_5m: 0 } });

  // polling for notifications every 12s
  useEffect(() => {
    let alive = true;
    const fetchNotif = async () => {
      try {
        const { data } = await api.get("/admin/blivre/notifications");
        if (alive) setNotif(data);
      } catch {}
    };
    fetchNotif();
    const id = setInterval(fetchNotif, 12000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const handleLogout = () => {
    logout();
    nav("/admin/blivre/login", { replace: true });
  };

  const links = [
    { to: "/admin/blivre", end: true, icon: LayoutDashboard, label: "Visão geral", testid: "nav-overview" },
    { to: "/admin/blivre/usuarios", icon: Users, label: "Usuários", testid: "nav-users" },
    { to: "/admin/blivre/anuncios", icon: Megaphone, label: "Anúncios", testid: "nav-listings" },
    { to: "/admin/blivre/mensagens", icon: MessagesSquare, label: "Mensagens", testid: "nav-messages" },
    { to: "/admin/blivre/denuncias", icon: ShieldAlert, label: "Denúncias", count: notif.pending_reports, testid: "nav-reports" },
    { to: "/admin/blivre/suporte", icon: LifeBuoy, label: "Suporte", count: notif.open_support, testid: "nav-support" },
  ];

  const totalRecent =
    (notif.recent?.reports_5m || 0) + (notif.recent?.support_5m || 0) + (notif.recent?.messages_5m || 0);

  return (
    <div className="min-h-screen flex bg-grid" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 border-r border-[var(--line)] bg-[var(--bg-1)] flex flex-col">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-[var(--line)]">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-mute)]">B-Livre</div>
            <div className="text-sm font-semibold leading-tight">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-[var(--text-mute)] px-3 mb-2">Painel</div>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={l.testid}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <l.icon size={16} />
              <span>{l.label}</span>
              {l.count > 0 && <span className="nav-count">{l.count}</span>}
            </NavLink>
          ))}

          <div className="text-[10px] uppercase tracking-widest text-[var(--text-mute)] px-3 mt-6 mb-2">Escopo</div>
          <div className="px-3 text-xs text-[var(--text-dim)] leading-relaxed">
            B-Livre é classificados gratuitos: <strong className="text-[var(--text)]">usuários, anúncios, mensagens, denúncias e suporte</strong>.
            <br />
            Marketplace (vendas, comissão) é separado.
          </div>
        </nav>

        <div className="border-t border-[var(--line)] p-3">
          <div className="px-3 py-2 mb-2 rounded-lg bg-[var(--bg-2)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent-2)] flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user?.name || "Admin"}</div>
              <div className="text-[11px] text-[var(--text-mute)] truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost w-full justify-center" data-testid="admin-logout">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 glass border-b border-[var(--line)] px-7 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="pulse-dot" />
            <span className="text-sm text-[var(--text-dim)]">
              Painel ao vivo · atualização a cada 12s
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="btn btn-ghost" data-testid="notif-bell">
                <Bell size={15} />
                Notificações
                {totalRecent > 0 && (
                  <span className="ml-1 bg-[var(--danger)] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {totalRecent}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-7 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

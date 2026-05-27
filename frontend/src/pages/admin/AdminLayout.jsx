import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, Users, ShoppingBag, FileText, Bell, Settings,
  LogOut, Menu, Search, ChevronRight, Flag, DollarSign, HeadphonesIcon,
  MessageSquare, Image
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { useAdminData } from "../../contexts/AdminDataContext";
import { useTranslation } from "../../i18n/I18nContext";
import LanguageSelector from "../../components/LanguageSelector";

const gold = "#D4A24C";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

export default function AdminLayout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { authHeaders } = useAdminData();

  const navItems = [
    { path: "/blivre/admin", label: t("admin.dashboard"), icon: LayoutDashboard, exact: true },
    { path: "/blivre/admin/users", label: t("admin.users"), icon: Users },
    { path: "/blivre/admin/products", label: t("admin.products"), icon: ShoppingBag },
    { path: "/blivre/admin/messages", label: t("admin.messages"), icon: MessageSquare },
    { path: "/blivre/admin/banners", label: t("admin.banners"), icon: Image },
    { path: "/blivre/admin/reports", label: t("admin.reports"), icon: FileText },
    { path: "/blivre/admin/denuncias", label: t("admin.complaints"), icon: Flag },
    { path: "/blivre/admin/financeiro", label: t("admin.financial"), icon: DollarSign },
    { path: "/blivre/admin/suporte", label: t("admin.support"), icon: HeadphonesIcon },
    { path: "/blivre/admin/configuracoes", label: t("admin.settings"), icon: Settings },
  ];

  useEffect(() => {
    const ping = async () => {
      try {
        await axios.post(API + "/admin/presence", {}, { headers: authHeaders });
        setAdminOnline(true);
      } catch { setAdminOnline(false); }
    };
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [authHeaders]);

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  useEffect(() => {
      document.title = `${t('admin.admin')} — B Livre`;
    const handler = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
    };
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-white flex">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[#0A0A0C] border-r border-white/[0.04] flex flex-col transition-transform duration-300 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="flex items-center h-16 px-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4A24C]/10 border border-[#D4A24C]/20 flex items-center justify-center text-[#D4A24C] font-black text-sm">
              BL
            </div>
            <div>
              <p className="text-sm font-black text-white">B Livre</p>
              <p className="text-[9px] text-[#D4A24C] font-semibold uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button key={item.path} onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  active
                    ? "bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/15"
                    : "text-[#8C8F9A] hover:text-white hover:bg-white/[0.03] border border-transparent"
                }`}>
                <Icon size={18} className={active ? "text-[#D4A24C]" : ""} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.04]">
          <button onClick={() => navigate("/blivre")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#8C8F9A] hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut size={18} />
            <span>{t('admin.backToMarketplace')}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-white/[0.04] flex items-center justify-between px-4 lg:px-6 bg-[#050608]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)}
              className="lg:hidden w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#8C8F9A]">
              <Menu size={16} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[12px]">
              <span className="text-[#8C8F9A]">{t('admin.admin')}</span>
              <ChevronRight size={12} className="text-[#8C8F9A]" />
              <span className="font-semibold text-white">
                {navItems.find(i => isActive(i))?.label || "Dashboard"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className={`relative flex h-2 w-2 ${adminOnline ? "" : "opacity-30"}`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${adminOnline ? "" : "hidden"}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${adminOnline ? "bg-emerald-400" : "bg-gray-500"}`} />
              </span>
              <span className="text-[10px] font-semibold text-emerald-400">{adminOnline ? `${t('admin.admin')} ${t('admin.online')}` : t('admin.offline')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
              <Input placeholder={t('admin.search')} className="pl-9 h-8 w-40 lg:w-56 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
            </div>
              <LanguageSelector variant="admin" />
              <button className="relative w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#8C8F9A] hover:text-white">
                <Bell size={15} />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#D4A24C] rounded-full text-[8px] font-bold text-black flex items-center justify-center">3</span>
            </button>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="text-[11px] bg-[#D4A24C]/10 text-[#D4A24C] font-semibold">AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

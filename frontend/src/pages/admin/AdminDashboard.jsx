import { useAdminData } from "../../contexts/AdminDataContext";
import { Megaphone, Users, Flag, CreditCard, Eye, TrendingUp, TrendingDown } from "lucide-react";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

export default function AdminDashboard() {
  const { dashboard, users, posts, loading } = useAdminData();

  const hasData = dashboard && (dashboard.totalUsers > 0 || dashboard.totalPosts > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
        <h1 className="text-xl font-black text-white">Dashboard</h1>
        <div className="flex items-center justify-center h-64 text-[#8C8F9A]">
          <div className="w-8 h-8 border-2 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
        <h1 className="text-xl font-black text-white">Dashboard</h1>
        <div className={`${glassCard} p-12 text-center`}>
          <Megaphone size={48} className="mx-auto mb-4 text-[#8C8F9A] opacity-20" />
          <p className="text-lg font-bold text-white mb-1">Nenhum dado real ainda</p>
          <p className="text-sm text-[#8C8F9A]">Conecte-se ao backend para visualizar as métricas da plataforma.</p>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Anúncios Ativos", value: String(dashboard.activePosts), icon: Megaphone },
    { label: "Total Anúncios", value: String(dashboard.totalPosts), icon: Eye },
    { label: "Usuários", value: String(dashboard.totalUsers), icon: Users },
    { label: "Pendentes", value: String(dashboard.pendingPosts), icon: Flag },
  ];

  const recentUsers = (users || []).slice(0, 5);
  const recentPosts = (posts || []).slice(0, 5);

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
      <h1 className="text-xl font-black text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={m.label} className={`${glassCard} p-5`}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-[#D4A24C]/10 border border-[#D4A24C]/10">
                <m.icon size={18} className="text-[#D4A24C]" />
              </div>
            </div>
            <p className="text-[11px] font-medium text-[#8C8F9A] uppercase tracking-wider">{m.label}</p>
            <p className="text-2xl font-black text-white mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${glassCard} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Últimos Anúncios</h3>
            <span className="text-[11px] text-[#8C8F9A]">{posts?.length || 0} total</span>
          </div>
          {recentPosts.length === 0 ? (
            <p className="text-[#8C8F9A] text-[13px] text-center py-8">Nenhum anúncio encontrado</p>
          ) : recentPosts.map((p, i) => (
            <div key={p.key || p.id || i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.02]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#D4A24C]/10 text-[#D4A24C] flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(p.title || p.titulo || "A")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.title || p.titulo || "Anúncio"}</p>
                  <p className="text-[11px] text-[#8C8F9A]">{p.author || p.autor || "—"}</p>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                (p.status || "active") === "active" || (p.status || "ativo") === "ativo"
                  ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                  : "text-amber-400 border-amber-500/20 bg-amber-500/10"
              }`}>{p.status || "ativo"}</span>
            </div>
          ))}
        </div>

        <div className={`${glassCard} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Últimos Usuários</h3>
            <span className="text-[11px] text-[#8C8F9A]">{users?.length || 0} total</span>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-[#8C8F9A] text-[13px] text-center py-8">Nenhum usuário encontrado</p>
          ) : recentUsers.map((u, i) => (
            <div key={u.id || i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.02]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#D4A24C]/10 text-[#D4A24C] flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(u.name || u.nome || "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name || u.nome || "Usuário"}</p>
                  <p className="text-[11px] text-[#8C8F9A] truncate">{u.email || ""}</p>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                u.blocked ? "text-red-400 border-red-500/20 bg-red-500/10" : "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
              }`}>{u.blocked ? "Bloqueado" : "Ativo"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useAdminData } from "../../contexts/AdminDataContext";
import { FileText, Eye, TrendingUp, TrendingDown } from "lucide-react";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

export default function AdminReports() {
  const { dashboard, posts, users, loading } = useAdminData();

  const hasData = dashboard && (dashboard.totalUsers > 0 || dashboard.totalPosts > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Relatórios" description="Relatórios e analytics" />
        <h1 className="text-xl font-black text-white">Relatórios</h1>
        <div className="flex items-center justify-center h-64 text-[#8C8F9A]">
          <div className="w-8 h-8 border-2 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Relatórios" description="Relatórios e analytics" />
        <h1 className="text-xl font-black text-white">Relatórios</h1>
        <div className={`${glassCard} p-12 text-center`}>
          <FileText size={48} className="mx-auto mb-4 text-[#8C8F9A] opacity-20" />
          <p className="text-lg font-bold text-white mb-1">Nenhum dado real ainda</p>
          <p className="text-sm text-[#8C8F9A]">Os relatórios serão gerados quando houver dados no banco.</p>
        </div>
      </div>
    );
  }

  const summaryItems = [
    { label: "Total Anúncios", value: String(dashboard.totalPosts) },
    { label: "Usuários Cadastrados", value: String(dashboard.totalUsers) },
    { label: "Anúncios Ativos", value: String(dashboard.activePosts) },
    { label: "Bloqueados", value: String(dashboard.blockedPosts) },
    { label: "Pendentes", value: String(dashboard.pendingPosts) },
    { label: "Transações", value: String(dashboard.totalTransactions || 0) },
  ];

  const topPosts = (posts || []).slice().sort((a, b) => (b.views || b.visualizacoes || 0) - (a.views || a.visualizacoes || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Relatórios" description="Relatórios e analytics" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Relatórios</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">Métricas e indicadores da plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryItems.map((r, i) => (
          <div key={r.label} className={`${glassCard} p-4 text-center`}>
            <p className="text-[11px] text-[#8C8F9A] mb-1">{r.label}</p>
            <p className="text-lg font-black text-white">{r.value}</p>
          </div>
        ))}
      </div>

      <div className={`${glassCard} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Mais Visualizados</h3>
        </div>
        {topPosts.length === 0 ? (
          <p className="text-[#8C8F9A] text-[13px] text-center py-8">Nenhum dado de visualização disponível</p>
        ) : topPosts.map((p, i) => (
          <div key={p.key || p.id || i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02]">
            <span className="w-6 h-6 rounded-lg bg-[#D4A24C]/10 text-[#D4A24C] flex items-center justify-center text-[11px] font-bold">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{p.title || p.titulo || "—"}</p>
              <p className="text-[11px] text-[#8C8F9A]">{p.author || p.autor || "—"}</p>
            </div>
            <div className="text-right flex items-center gap-1 text-[#8C8F9A]">
              <Eye size={12} />
              <span className="text-sm font-bold text-white">{p.views || p.visualizacoes || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Megaphone, Users, Flag, DollarSign, TrendingUp, TrendingDown, Eye, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, Tooltip as ReTooltip, Legend } from "recharts";
import { Badge } from "../../components/ui/badge";
import { useAdminData } from "../../contexts/AdminDataContext";
import BLivreSEO from "../../components/BLivreSEO";

const gold = "#D4A24C";
const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

const COLORS = [gold, "#6B5BFF", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"];

function StatusBadge({ status }) {
  const map = {
    ativo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pendente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    resolvido: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const c = map[status] || "bg-gray-500/10 text-gray-400";
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c}`}>{status}</span>;
}

export default function AdminDashboard() {
  const { dashboard, posts, users } = useAdminData();

  const metrics = [
    { label: "Anúncios Ativos", value: String(dashboard?.activePosts || 0), change: dashboard?.growthPosts || "+0%", up: true, icon: Megaphone },
    { label: "Usuários", value: String(dashboard?.totalUsers || 0), change: dashboard?.growthUsers || "+0%", up: true, icon: Users },
    { label: "Pendentes", value: String(dashboard?.pendingPosts || 0), change: "-", up: false, icon: Flag },
    { label: "Bloqueados", value: String(dashboard?.blockedPosts || 0), change: "-", up: false, icon: DollarSign },
  ];

  const categoryMap = {};
  (posts || []).forEach(p => {
    const cat = p.category || p.categoria || "Outros";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryDist = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const recentPosts = (posts || []).slice(0, 6).map(p => ({
    action: p.title || p.titulo || "Anúncio",
    user: p.author || p.autor || p.user || "Usuário",
    item: p.category || p.categoria || "",
    time: p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "",
    status: p.status || "ativo",
  }));

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
      <h1 className="text-xl font-black text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`${glassCard} p-5 hover:bg-[#1A1A20]/80 transition-colors`}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-[#D4A24C]/10 border border-[#D4A24C]/10">
                <m.icon size={18} className="text-[#D4A24C]" />
              </div>
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${m.up ? "text-emerald-400" : "text-red-400"}`}>
                {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{m.change}
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#8C8F9A] uppercase tracking-wider">{m.label}</p>
            <p className="text-2xl font-black text-white mt-1">{m.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className={`${glassCard} lg:col-span-2 p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Anúncios Recentes</h3>
            <Badge variant="outline" className="text-[10px] border-white/10 text-[#8C8F9A]">{posts?.length || 0} total</Badge>
          </div>
          <div className="space-y-1">
            {recentPosts.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    a.status === "ativo" || a.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                    a.status === "blocked" || a.status === "bloqueado" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                  }`}>{a.action[0]}</div>
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-[300px]">{a.action}</p>
                    <p className="text-[11px] text-[#8C8F9A]">{a.user} · {a.time}</p>
                  </div>
                </div>
                <StatusBadge status={a.status === "active" ? "ativo" : a.status} />
              </div>
            ))}
            {recentPosts.length === 0 && (
              <p className="text-[#8C8F9A] text-[13px] text-center py-8">Nenhum anúncio encontrado</p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4">Categorias</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryDist.length ? categoryDist : [{ name: "Sem dados", value: 1 }]} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {categoryDist.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span style={{ color: "#8C8F9A", fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className={`${glassCard} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Usuários Recentes</h3>
          <span className="text-[11px] text-[#8C8F9A]">{users?.length || 0} total</span>
        </div>
        <div className="space-y-1">
          {(users || []).slice(0, 6).map((u, i) => (
            <div key={u.id || i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4A24C]/10 text-[#D4A24C] flex items-center justify-center text-xs font-bold">
                  {(u.name || u.nome || "U")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{u.name || u.nome || "Usuário"}</p>
                  <p className="text-[11px] text-[#8C8F9A]">{u.email || ""}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                u.blocked || u.status === "banido" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>{u.blocked ? "Bloqueado" : "Ativo"}</span>
            </div>
          ))}
          {(users || []).length === 0 && (
            <p className="text-[#8C8F9A] text-[13px] text-center py-8">Nenhum usuário encontrado</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

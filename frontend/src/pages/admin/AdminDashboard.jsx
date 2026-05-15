import { motion } from "framer-motion";
import {
  Megaphone, Users, Flag, DollarSign, TrendingUp, TrendingDown,
  Eye, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer,
  CartesianGrid, Tooltip as ReTooltip, Legend
} from "recharts";
import { Badge } from "../../components/ui/badge";
import BLivreSEO from "../../components/BLivreSEO";

const gold = "#D4A24C";
const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

const metrics = [
  { label: "Anúncios Ativos", value: "2,847", change: "+12.5%", up: true, icon: Megaphone },
  { label: "Usuários", value: "18,293", change: "+8.2%", up: true, icon: Users },
  { label: "Denúncias (mês)", value: "143", change: "-5.7%", up: false, icon: Flag },
  { label: "Receita (mês)", value: "R$ 47.890", change: "+23.1%", up: true, icon: DollarSign },
];

const chartViews = [
  { name: "Jan", views: 4200, ads: 2400 },
  { name: "Fev", views: 3800, ads: 2200 },
  { name: "Mar", views: 5100, ads: 2900 },
  { name: "Abr", views: 4800, ads: 2700 },
  { name: "Mai", views: 5600, ads: 3100 },
  { name: "Jun", views: 6200, ads: 3500 },
  { name: "Jul", views: 5900, ads: 3300 },
  { name: "Ago", views: 6700, ads: 3800 },
  { name: "Set", views: 7200, ads: 4100 },
  { name: "Out", views: 7800, ads: 4300 },
  { name: "Nov", views: 8400, ads: 4700 },
  { name: "Dez", views: 9100, ads: 5100 },
];

const categoryDist = [
  { name: "Celulares", value: 35 }, { name: "Veículos", value: 20 },
  { name: "Imóveis", value: 15 }, { name: "Moda", value: 12 },
  { name: "Casa", value: 10 }, { name: "Outros", value: 8 },
];

const recentActivity = [
  { action: "Novo anúncio", user: "Maria S.", item: "iPhone 13", time: "2 min atrás", status: "ativo" },
  { action: "Denúncia", user: "João P.", item: "Gol G5 2012", time: "15 min atrás", status: "pendente" },
  { action: "Usuário banido", user: "Admin", item: "carlos_**@", time: "1h atrás", status: "resolvido" },
  { action: "Anúncio removido", user: "Sistema", item: "Kit festa", time: "2h atrás", status: "resolvido" },
  { action: "Novo usuário", user: "Ana C.", item: "anac***@gmail.com", time: "3h atrás", status: "ativo" },
  { action: "Pagamento", user: "Lucas R.", item: "Destaque 7 dias", time: "4h atrás", status: "ativo" },
];

function StatusBadge({ status }) {
  const map = {
    ativo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pendente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    resolvido: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const c = map[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c}`}>{status}</span>;
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Dashboard Admin" description="Painel administrativo B Livre" />

      <h1 className="text-xl font-black text-white">Dashboard</h1>

      {/* Metrics */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className={`${glassCard} lg:col-span-2 p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Visualizações & Anúncios</h3>
            <Badge variant="outline" className="text-[10px] border-white/10 text-[#8C8F9A]">12 meses</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartViews}>
              <defs>
                <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={gold} stopOpacity={0.2} /><stop offset="100%" stopColor={gold} stopOpacity={0} /></linearGradient>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6B5BFF" stopOpacity={0.2} /><stop offset="100%" stopColor="#6B5BFF" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <ReTooltip contentStyle={{ background: "#121216", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff" }} />
              <Area type="monotone" dataKey="views" stroke={gold} fill="url(#vGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="ads" stroke="#6B5BFF" fill="url(#aGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4">Categorias</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {categoryDist.map((_, i) => (
                  <Cell key={i} fill={[gold, "#6B5BFF", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"][i]} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span style={{ color: "#8C8F9A", fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className={`${glassCard} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Atividade Recente</h3>
          <button className="text-[11px] text-[#D4A24C] font-semibold flex items-center gap-1 hover:underline">
            Ver todas <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="space-y-1">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  a.status === "ativo" ? "bg-emerald-500/10 text-emerald-400" :
                  a.status === "pendente" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                }`}>{a.action[0]}</div>
                <div>
                  <p className="text-sm font-medium text-white">{a.action} <span className="text-[#D4A24C]">{a.item}</span></p>
                  <p className="text-[11px] text-[#8C8F9A]">{a.user} · {a.time}</p>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

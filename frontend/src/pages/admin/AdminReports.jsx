import { motion } from "framer-motion";
import { Download, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, ResponsiveContainer,
  CartesianGrid, Tooltip as ReTooltip, XAxis, YAxis
} from "recharts";
import { Button } from "../../components/ui/button";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const gold = "#D4A24C";

const relatoriosResumo = [
  { label: "Total Anúncios", value: "12.847", change: "+15%", up: true },
  { label: "Usuários Ativos", value: "8.293", change: "+8%", up: true },
  { label: "Taxa Conversão", value: "3.2%", change: "+0.4%", up: true },
  { label: "Ticket Médio", value: "R$ 24,90", change: "-2%", up: false },
  { label: "Denúncias resolvidas", value: "87%", change: "+5%", up: true },
  { label: "Tempo médio resposta", value: "4.2h", change: "-12%", up: true },
];

const chartViews = [
  { name: "Jan", views: 4200, users: 1800 },
  { name: "Fev", views: 3800, users: 1600 },
  { name: "Mar", views: 5100, users: 2100 },
  { name: "Abr", views: 4800, users: 2000 },
  { name: "Mai", views: 5600, users: 2400 },
  { name: "Jun", views: 6200, users: 2800 },
  { name: "Jul", views: 5900, users: 2600 },
  { name: "Ago", views: 6700, users: 3000 },
  { name: "Set", views: 7200, users: 3300 },
  { name: "Out", views: 7800, users: 3600 },
  { name: "Nov", views: 8400, users: 3900 },
  { name: "Dez", views: 9100, users: 4200 },
];

const topAnuncios = [
  { rank: 1, titulo: "Apartamento 2 quartos", views: 3456, interesses: 89 },
  { rank: 2, titulo: "iPhone 13 128GB", views: 2156, interesses: 67 },
  { rank: 3, titulo: "PlayStation 5", views: 1876, interesses: 54 },
  { rank: 4, titulo: "Notebook gamer", views: 1243, interesses: 42 },
  { rank: 5, titulo: "Gol G5 2012", views: 892, interesses: 31 },
];

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Relatórios" description="Relatórios e analytics B Livre" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Relatórios</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">Métricas e indicadores da plataforma</p>
        </div>
        <Button variant="outline" className="h-9 border-white/10 text-[#8C8F9A] rounded-xl text-[12px] hover:text-white">
          <Download size={14} className="mr-1" /> Exportar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {relatoriosResumo.map((r, i) => (
          <motion.div key={r.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${glassCard} p-4 text-center`}>
            <p className="text-[11px] text-[#8C8F9A] mb-1">{r.label}</p>
            <p className="text-lg font-black text-white">{r.value}</p>
            <p className={`text-[11px] mt-1 flex items-center justify-center gap-1 ${r.up ? "text-emerald-400" : "text-red-400"}`}>
              {r.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{r.change}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4">Visualizações (12 meses)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartViews}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#8C8F9A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8C8F9A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <ReTooltip contentStyle={{ background: "#121216", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff" }} />
              <Bar dataKey="views" fill={gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4">Novos Usuários (12 meses)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartViews}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#8C8F9A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8C8F9A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <ReTooltip contentStyle={{ background: "#121216", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff" }} />
              <Line type="monotone" dataKey="users" stroke="#6B5BFF" strokeWidth={2} dot={{ fill: "#6B5BFF", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Anúncios */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className={`${glassCard} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Top Anúncios</h3>
          <button className="text-[11px] text-[#D4A24C] font-semibold flex items-center gap-1 hover:underline">
            Ver relatório completo <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {topAnuncios.map((a) => (
            <div key={a.rank} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
              <span className="w-6 h-6 rounded-lg bg-[#D4A24C]/10 text-[#D4A24C] flex items-center justify-center text-[11px] font-bold">#{a.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{a.titulo}</p>
                <p className="text-[11px] text-[#8C8F9A]">{a.interesses} interesses</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{a.views.toLocaleString()}</p>
                <p className="text-[10px] text-[#8C8F9A]">visualizações</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

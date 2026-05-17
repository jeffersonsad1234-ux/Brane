import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Megaphone, Users, Flag, MessageSquare, Eye, TrendingUp, TrendingDown, Activity, UserPlus, Clock, Bell } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className={`${glassCard} p-5 relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl border ${color || "bg-[#D4A24C]/10 border-[#D4A24C]/10"}`}>
          <Icon size={18} className={color ? "text-white" : "text-[#D4A24C]"} />
        </div>
      </div>
      <p className="text-[11px] font-medium text-[#8C8F9A] uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-white mt-1">{value ?? "—"}</p>
      {sub && <p className="text-[10px] text-[#D4A24C] mt-1">{sub}</p>}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-[12px]">
        <p className="text-[#8C8F9A]">{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>)}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { authHeaders } = useAdminData();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get(API + "/admin/blivre/dashboard", { headers: authHeaders }).catch(() => null);
      if (res?.data) { setStats(res.data); setErr(false); }
      else setErr(true);
    } catch { setErr(true); }
    finally { setLoading(false); }
  }, [authHeaders]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
        <h1 className="text-xl font-black text-white">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`${glassCard} p-5`}>
              <div className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (err || !stats) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
        <h1 className="text-xl font-black text-white">Dashboard</h1>
        <div className={`${glassCard} p-12 text-center`}>
          <Megaphone size={48} className="mx-auto mb-4 text-[#8C8F9A] opacity-20" />
          <p className="text-lg font-bold text-white mb-1">Aguardando dados do backend</p>
          <p className="text-sm text-[#8C8F9A]">O painel será atualizado automaticamente quando houver dados.</p>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Usuários Totais", value: stats.total_users, icon: Users, sub: `+${stats.new_today || 0} hoje` },
    { label: "Usuários Online", value: stats.online_users, icon: Activity, sub: `${stats.active_today || 0} ativos hoje`, color: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Novos Hoje", value: stats.new_today, icon: UserPlus, color: "bg-blue-500/10 border-blue-500/20" },
    { label: "Anúncios", value: stats.total_posts, icon: Megaphone, sub: `+${stats.posts_today || 0} hoje` },
    { label: "Mensagens", value: stats.total_messages, icon: MessageSquare, sub: `${stats.messages_today || 0} hoje` },
    { label: "Mensagens Hoje", value: stats.messages_today, icon: Clock, color: "bg-purple-500/10 border-purple-500/20" },
    { label: "Denúncias Pendentes", value: stats.pending_reports, icon: Flag, color: "bg-red-500/10 border-red-500/20" },
    { label: "Total Denúncias", value: stats.total_reports, icon: Bell },
  ];

  const topPosts = stats.top_posts || [];
  const usersPerDay = (stats.users_per_day || []).map(d => ({ ...d, name: d.date?.slice(5) || d.name }));
  const postsPerDay = (stats.posts_per_day || []).map(d => ({ ...d, name: d.date?.slice(5) || d.name }));

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Dashboard</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">Atualização automática a cada 15 segundos</p>
        </div>
        <button onClick={fetchDashboard}
          className="h-8 px-3 bg-white/[0.04] border border-white/10 rounded-xl text-[11px] text-[#8C8F9A] hover:text-white font-semibold">
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4">Usuários (7 dias)</h3>
          {usersPerDay.length === 0 ? (
            <p className="text-[#8C8F9A] text-[13px] text-center py-8">Sem dados suficientes</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={usersPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: "#8C8F9A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8C8F9A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="count" name="Usuários" stroke="#D4A24C" strokeWidth={2} dot={{ r: 3, fill: "#D4A24C" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4">Anúncios (7 dias)</h3>
          {postsPerDay.length === 0 ? (
            <p className="text-[#8C8F9A] text-[13px] text-center py-8">Sem dados suficientes</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={postsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: "#8C8F9A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8C8F9A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Anúncios" fill="#D4A24C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={`${glassCard} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Anúncios Mais Vistos</h3>
          <span className="text-[11px] text-[#8C8F9A]">{stats.total_posts} total</span>
        </div>
        {topPosts.length === 0 ? (
          <p className="text-[#8C8F9A] text-[13px] text-center py-8">Nenhum dado de visualização disponível</p>
        ) : topPosts.map((p, i) => (
          <div key={p.post_id || i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02]">
            <span className="w-6 h-6 rounded-lg bg-[#D4A24C]/10 text-[#D4A24C] flex items-center justify-center text-[11px] font-bold">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{p.title || "—"}</p>
              <p className="text-[11px] text-[#8C8F9A]">{p.author || "—"}</p>
            </div>
            <div className="flex items-center gap-3 text-[#8C8F9A]">
              <div className="flex items-center gap-1"><Eye size={12} /><span className="text-sm font-bold text-white">{p.views || 0}</span></div>
              <div className="flex items-center gap-1"><TrendingUp size={12} /><span className="text-sm font-bold text-white">{p.interests || 0}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

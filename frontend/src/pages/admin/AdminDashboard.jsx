import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Megaphone, Users, Flag, MessageSquare, UserPlus, Clock, Activity, AlertTriangle, BarChart3, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart as RePie, Pie, Cell } from "recharts";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;
const COLORS = ["#D4A24C", "#22c55e", "#ef4444", "#3b82f6", "#a855f7", "#f97316", "#06b6d4", "#ec4899"];

function MetricCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className={`${glassCard} p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg border ${accent || "bg-[#D4A24C]/10 border-[#D4A24C]/15"}`}>
          <Icon size={16} className={accent ? "text-white" : "text-[#D4A24C]"} />
        </div>
      </div>
      <p className="text-[11px] font-medium text-[#8C8F9A] uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black text-white mt-0.5">{value ?? "—"}</p>
      {sub && <p className="text-[10px] text-[#D4A24C] mt-0.5">{sub}</p>}
    </div>
  );
}

function DonutCard({ online, offline }) {
  const total = online + offline || 1;
  const data = [
    { name: "Online", value: online },
    { name: "Offline", value: offline },
  ];
  return (
    <div className={`${glassCard} p-5`}>
      <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2"><Activity size={14} className="text-[#D4A24C]" /> Usuários</h4>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <RePie>
            <Pie data={data} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
          </RePie>
        </ResponsiveContainer>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#D4A24C]" /><span className="text-[12px] text-[#8C8F9A]">Online <strong className="text-white">{online}</strong></span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /><span className="text-[12px] text-[#8C8F9A]">Offline <strong className="text-white">{offline}</strong></span></div>
        </div>
      </div>
      <p className="text-[10px] text-[#8C8F9A] mt-3 text-center">{total} total · {total > 0 ? Math.round(online / total * 100) : 0}% online</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { authHeaders, token } = useAdminData();
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const fetchAll = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [statsRes, catRes, dailyRes] = await Promise.allSettled([
        axios.get(API + "/admin/stats", { headers: authHeaders }),
        axios.get(API + "/admin/posts/categories", { headers: authHeaders }),
        axios.get(API + "/admin/daily-activity?days=7", { headers: authHeaders }),
      ]);
      if (statsRes.status === "fulfilled") { setStats(statsRes.value.data); setErr(false); setErrMsg(""); }
      else { setErr(true); setErrMsg(statsRes.reason?.response?.data?.detail || statsRes.reason?.message || "Erro"); }
      if (catRes.status === "fulfilled") setCategories(catRes.value.data.categories || []);
      if (dailyRes.status === "fulfilled") setDaily(dailyRes.value.data.days || []);
    } catch (e) { setErr(true); setErrMsg(e.message); }
    finally { setLoading(false); }
  }, [authHeaders, token]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (!token) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
        <h1 className="text-xl font-black text-white">Dashboard</h1>
        <div className={`${glassCard} p-12 text-center`}>
          <Megaphone size={48} className="mx-auto mb-4 text-[#8C8F9A] opacity-20" />
          <p className="text-lg font-bold text-white mb-1">Faça login na B Livre primeiro</p>
          <p className="text-sm text-[#8C8F9A]">Você precisa estar logado com uma conta administradora.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
        <h1 className="text-xl font-black text-white">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className={`${glassCard} p-4`}><div className="h-16 bg-white/[0.03] rounded-xl animate-pulse" /></div>)}
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
          <AlertTriangle size={48} className="mx-auto mb-4 text-[#8C8F9A] opacity-20" />
          <p className="text-lg font-bold text-white mb-1">Erro ao carregar dados</p>
          <p className="text-sm text-[#8C8F9A]">API: <code className="text-[#D4A24C]">{errMsg}</code></p>
          <button onClick={fetchAll} className="mt-4 h-8 px-4 bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20 rounded-xl text-[11px] font-semibold hover:bg-[#D4A24C]/20">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Usuários Totais", value: stats.total_users, icon: Users, sub: `+${stats.users_today || 0} hoje` },
    { label: "Usuários Online", value: stats.online_users, icon: Activity, accent: "bg-emerald-500/10 border-emerald-500/20", sub: `${Math.round(stats.online_users / (stats.total_users || 1) * 100)}% ativos` },
    { label: "Novos Hoje", value: stats.users_today, icon: UserPlus, accent: "bg-blue-500/10 border-blue-500/20" },
    { label: "Anúncios", value: stats.total_posts, icon: Megaphone, sub: `+${stats.posts_today || 0} hoje` },
    { label: "Anúncios Hoje", value: stats.posts_today, icon: Clock, accent: "bg-purple-500/10 border-purple-500/20" },
    { label: "Mensagens", value: stats.total_messages, icon: MessageSquare, sub: `${stats.messages_today || 0} hoje` },
    { label: "Denúncias Pendentes", value: stats.pending_reports, icon: Flag, accent: "bg-red-500/10 border-red-500/20" },
    { label: "Total Denúncias", value: stats.total_reports, icon: AlertTriangle },
  ];

  const catData = categories.slice(0, 8);
  const totalCat = catData.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Dashboard</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">Atualização automática a cada 15 segundos</p>
        </div>
        <button onClick={fetchAll}
          className="h-8 px-3 bg-white/[0.04] border border-white/10 rounded-xl text-[11px] text-[#8C8F9A] hover:text-white font-semibold">
          Atualizar
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Online/Offline Donut */}
        <DonutCard online={stats.online_users || 0} offline={(stats.total_users || 0) - (stats.online_users || 0)} />

        {/* Categories Bar */}
        <div className={`${glassCard} p-5 lg:col-span-2`}>
          <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-[#D4A24C]" /> Anúncios por Categoria</h4>
          {catData.length === 0 ? (
            <p className="text-[#8C8F9A] text-[12px] text-center py-8">Nenhuma categoria</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#8C8F9A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#8C8F9A", fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background: "#1A1A1E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" fill="#D4A24C" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily Activity Line Chart */}
      <div className={`${glassCard} p-5`}>
        <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2"><PieChart size={14} className="text-[#D4A24C]" /> Atividade (7 dias)</h4>
        {daily.length === 0 ? (
          <p className="text-[#8C8F9A] text-[12px] text-center py-8">Sem dados nos últimos 7 dias</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#8C8F9A", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v?.slice(5) || v} />
              <YAxis tick={{ fill: "#8C8F9A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1A1A1E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="users" name="Usuários" stroke="#D4A24C" strokeWidth={2} dot={{ r: 3, fill: "#D4A24C" }} />
              <Line type="monotone" dataKey="posts" name="Anúncios" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} />
              <Line type="monotone" dataKey="messages" name="Mensagens" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
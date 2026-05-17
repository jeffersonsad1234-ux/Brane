import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Megaphone, Users, Flag, MessageSquare, Eye, TrendingUp, Activity, UserPlus, Clock, Bell } from "lucide-react";
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

export default function AdminDashboard() {
  const { authHeaders, token } = useAdminData();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const fetchDashboard = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await axios.get(API + "/admin/stats", { headers: authHeaders });
      setStats(res.data);
      setErr(false);
      setErrMsg("");
    } catch (e) {
      setErr(true);
      setErrMsg(e.response?.data?.detail || e.message || "Erro desconhecido");
    }
    finally { setLoading(false); }
  }, [authHeaders, token]);

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

  if (!token) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Dashboard" description="Painel administrativo B Livre" />
        <h1 className="text-xl font-black text-white">Dashboard</h1>
        <div className={`${glassCard} p-12 text-center`}>
          <Megaphone size={48} className="mx-auto mb-4 text-[#8C8F9A] opacity-20" />
          <p className="text-lg font-bold text-white mb-1">Faça login na B Livre primeiro</p>
          <p className="text-sm text-[#8C8F9A]">Você precisa estar logado com uma conta administradora para acessar o painel.</p>
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
          <p className="text-lg font-bold text-white mb-1">Erro ao carregar dados</p>
          <p className="text-sm text-[#8C8F9A]">API: <code className="text-[#D4A24C]">{errMsg}</code></p>
          <button onClick={fetchDashboard} className="mt-4 h-8 px-4 bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20 rounded-xl text-[11px] font-semibold hover:bg-[#D4A24C]/20">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Usuários Totais", value: stats.total_users, icon: Users, sub: `+${stats.users_today || 0} hoje` },
    { label: "Anúncios", value: stats.total_posts, icon: Megaphone, sub: `+${stats.posts_today || 0} hoje` },
    { label: "Mensagens", value: stats.total_messages, icon: MessageSquare },
    { label: "Anúncios Hoje", value: stats.posts_today, icon: Clock, color: "bg-purple-500/10 border-purple-500/20" },
  ];

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
    </div>
  );
}

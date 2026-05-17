import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

export default function AdminDashboard() {
  const { authHeaders } = useAdminData();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get(API + "/admin/blivre/dashboard", { headers: authHeaders }).catch(() => null);
      if (res?.data) setStats(res.data);
    } catch {}
    finally { setLoading(false); }
  }, [authHeaders]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-black text-white">Dashboard</h1>
        <p className="text-sm text-[#8C8F9A]">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black text-white">Dashboard</h1>
      <p className="text-sm text-[#8C8F9A]">Painel administrativo B Livre</p>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={glassCard + " p-5"}>
            <p className="text-[11px] text-[#8C8F9A]">Usuários</p>
            <p className="text-2xl font-black text-white mt-1">{stats.total_users || 0}</p>
          </div>
          <div className={glassCard + " p-5"}>
            <p className="text-[11px] text-[#8C8F9A]">Online</p>
            <p className="text-2xl font-black text-white mt-1">{stats.online_users || 0}</p>
          </div>
          <div className={glassCard + " p-5"}>
            <p className="text-[11px] text-[#8C8F9A]">Anúncios</p>
            <p className="text-2xl font-black text-white mt-1">{stats.total_posts || 0}</p>
          </div>
          <div className={glassCard + " p-5"}>
            <p className="text-[11px] text-[#8C8F9A]">Denúncias Pendentes</p>
            <p className="text-2xl font-black text-white mt-1">{stats.pending_reports || 0}</p>
          </div>
        </div>
      ) : (
        <div className={glassCard + " p-12 text-center"}>
          <p className="text-lg font-bold text-white mb-1">Aguardando dados</p>
          <p className="text-sm text-[#8C8F9A]">Conecte-se ao backend para visualizar as métricas.</p>
        </div>
      )}
    </div>
  );
}

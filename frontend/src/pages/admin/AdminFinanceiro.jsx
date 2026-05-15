import { useState, useEffect } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";
import { DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

export default function AdminFinanceiro() {
  const { API, authHeaders, loading } = useAdminData();
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setTxLoading(true);
      try {
        const res = await axios.get(API + "/admin/finance/dashboard", { headers: authHeaders }).catch(() => null);
        if (res?.data) {
          setTransactions(res.data.transactions || []);
          setStats({
            totalRevenue: res.data.totalRevenue || res.data.total_revenue || 0,
            totalTransactions: res.data.totalTransactions || res.data.total_transactions || 0,
            pendingCount: res.data.pendingCount || res.data.pending_count || 0,
          });
        } else {
          setTransactions([]);
          setStats(null);
        }
      } catch {
        setTransactions([]);
        setStats(null);
      } finally {
        setTxLoading(false);
      }
    };
    fetch();
  }, [API, authHeaders]);

  const isLoading = loading || txLoading;
  const hasData = transactions.length > 0;

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Financeiro" description="Transações e receitas" />
      <div>
        <h1 className="text-xl font-black text-white">Financeiro</h1>
        <p className="text-sm text-[#8C8F9A] mt-0.5">Transações e receitas</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-[#8C8F9A]">
          <div className="w-8 h-8 border-2 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasData ? (
        <div className={`${glassCard} p-12 text-center`}>
          <DollarSign size={48} className="mx-auto mb-4 text-[#8C8F9A] opacity-20" />
          <p className="text-lg font-bold text-white mb-1">Nenhum dado real ainda</p>
          <p className="text-sm text-[#8C8F9A]">Nenhuma transação encontrada no banco de dados.</p>
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${glassCard} p-4`}>
                <p className="text-[11px] text-[#8C8F9A] mb-1">Receita Total</p>
                <p className="text-xl font-black text-white">
                  {typeof stats.totalRevenue === "number"
                    ? "R$ " + stats.totalRevenue.toFixed(2).replace(".", ",")
                    : stats.totalRevenue}
                </p>
              </div>
              <div className={`${glassCard} p-4`}>
                <p className="text-[11px] text-[#8C8F9A] mb-1">Transações</p>
                <p className="text-xl font-black text-white">{stats.totalTransactions}</p>
              </div>
              <div className={`${glassCard} p-4`}>
                <p className="text-[11px] text-[#8C8F9A] mb-1">Pendentes</p>
                <p className="text-xl font-black text-amber-400">{stats.pendingCount}</p>
              </div>
            </div>
          )}
          <div className={`${glassCard} p-5`}>
            <h3 className="text-sm font-bold text-white mb-4">Transações</h3>
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.04]">
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium">ID</TableHead>
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Usuário</TableHead>
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Tipo</TableHead>
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Valor</TableHead>
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
                  <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t, i) => (
                  <TableRow key={t.id || i} className="border-white/[0.04] hover:bg-white/[0.02]">
                    <TableCell className="text-[#8C8F9A] font-mono text-[12px]">{t.id || "#" + (i + 1)}</TableCell>
                    <TableCell className="text-white">{t.user || t.usuario || t.buyer || "—"}</TableCell>
                    <TableCell className="text-[#8C8F9A]">{t.type || t.tipo || "—"}</TableCell>
                    <TableCell className={`font-semibold ${(t.amount || t.valor || 0) < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {t.amount ? "R$ " + Math.abs(t.amount).toFixed(2).replace(".", ",") : t.valor || "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        t.status === "completed" || t.status === "confirmado"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : t.status === "pending" || t.status === "pendente"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }`}>{t.status || "—"}</span>
                    </TableCell>
                    <TableCell className="text-[#8C8F9A] text-[12px] text-right">
                      {t.date || t.data || t.created_at ? new Date(t.date || t.data || t.created_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

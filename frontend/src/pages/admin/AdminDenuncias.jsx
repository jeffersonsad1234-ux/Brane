import { useState, useEffect } from "react";
import axios from "axios";
import { Search, CheckCircle, Flag } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

export default function AdminDenuncias() {
  const { authHeaders } = useAdminData();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("todas");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API + "/admin/blivre/reports", { headers: authHeaders }).catch(() => null);
      if (res?.data?.reports) setReports(res.data.reports);
      else setReports([]);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [authHeaders]);

  const filtered = reports.filter(r => {
    if (tab !== "todas" && r.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (r.post_id || r.anuncio_id || r.title || "").toLowerCase().includes(q) || (r.reported_user || r.author || r.autor || "").toLowerCase().includes(q) || (r.reporter || "").toLowerCase().includes(q);
    }
    return true;
  });

  const handleRemove = async (report) => {
    if (!window.confirm(`Remover conteúdo da denúncia?`)) return;
    try {
      await axios.put(API + "/admin/blivre/reports/" + report.id + "/remove-content", {}, { headers: authHeaders });
      await fetchReports();
    } catch {}
  };

  const handleBan = async (report) => {
    if (!window.confirm(`Banir usuário "${report.reported_user || report.author || report.autor || report.reporter}"?`)) return;
    try {
      const uid = report.reported_user || report.author_email || report.reporter;
      if (uid) await axios.put(API + "/admin/users/" + uid + "/block", {}, { headers: authHeaders });
    } catch {}
    try {
      await axios.put(API + "/admin/blivre/reports/" + report.id + "/resolve", {}, { headers: authHeaders });
      await fetchReports();
    } catch {}
  };

  const handleIgnore = async (report) => {
    if (!window.confirm(`Ignorar denúncia?`)) return;
    try {
      await axios.put(API + "/admin/blivre/reports/" + report.id + "/resolve", {}, { headers: authHeaders });
      await fetchReports();
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Denúncias" description="Moderação de denúncias B Livre" />
        <div className="flex items-center justify-between"><div><h1 className="text-xl font-black text-white">Denúncias</h1></div></div>
        <div className={`${glassCard} p-12 text-center`}>
          <div className="w-8 h-8 border-2 border-[#D4A24C] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Denúncias" description="Moderação de denúncias B Livre" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Denúncias</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">Modere os anúncios denunciados pelos usuários</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..." className="pl-9 h-9 w-52 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
        </div>
      </div>

      {reports.length === 0 ? (
        <div className={`${glassCard} p-12 text-center`}>
          <p className="text-lg font-bold text-white mb-1">Nenhuma denúncia encontrada</p>
          <p className="text-sm text-[#8C8F9A]">Todas as denúncias foram resolvidas ou o endpoint não retornou dados.</p>
        </div>
      ) : (
        <div className={`${glassCard} p-5`}>
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.06] overflow-x-auto">
            {[
              { id: "todas", label: "Todas", count: reports.length },
              { id: "pendente", label: "Pendentes", count: reports.filter(r => r.status === "pendente").length },
              { id: "em_andamento", label: "Em andamento", count: reports.filter(r => r.status === "em_andamento").length },
              { id: "resolvido", label: "Resolvidas", count: reports.filter(r => r.status === "resolvido").length },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${
                  tab === t.id ? "bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20" : "text-[#8C8F9A] hover:text-white border border-transparent"
                }`}>
                {t.label} <span className="ml-1 opacity-60">({t.count})</span>
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04]">
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Anúncio</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Autor</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Denunciante</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Motivo</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id || r.post_id} className="border-white/[0.04] hover:bg-white/[0.02]">
                  <TableCell>
                    <p className="text-white font-medium text-[13px]">{r.post_id || r.title || "—"}</p>
                    <p className="text-[10px] text-[#8C8F9A] font-mono">{r.id || ""}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-[#D4A24C]/10 text-[#D4A24C]">{(r.reported_user || r.author || r.autor || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[12px] text-white">{r.reported_user || r.author || r.autor || "—"}</p>
                        <p className="text-[10px] text-[#8C8F9A]">{r.reason || r.motivo || ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#8C8F9A] text-[12px]">{r.reporter || "—"}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-white text-[12px]">{r.reason || r.motivo || "—"}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status !== "resolvido" ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button onClick={() => handleRemove(r)}
                          className="h-8 px-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-semibold hover:bg-red-500/20">Remover</Button>
                        <Button onClick={() => handleBan(r)}
                          className="h-8 px-2.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl text-[11px] font-semibold hover:bg-orange-500/20">Banir</Button>
                        <Button onClick={() => handleIgnore(r)}
                          className="h-8 px-2.5 bg-white/[0.04] text-[#8C8F9A] border border-white/10 rounded-xl text-[11px] font-semibold hover:text-white">Ignorar</Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-semibold">Resolvido</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-[#8C8F9A]">
              <CheckCircle size={28} className="mb-2 opacity-30" />
              <p className="text-[13px]">Nenhuma denúncia com esses filtros</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

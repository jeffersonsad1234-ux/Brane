import { useState } from "react";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Search, Eye, Trash2, Shield, XCircle, CheckCircle, AlertTriangle, UserMinus, Image } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;
const FALLBACK_REPORTS = [
  { id: "R-001", anuncio: "iPhone 13 128GB", autor: "Maria S.", email: "maria@email.com", denunciante: "João P.", motivo: "Produto proibido - arma branca", status: "pendente", data: "15/05", imagens: 0 },
  { id: "R-002", anuncio: "Kit festa completo", autor: "Carlos M.", email: "carlos@email.com", denunciante: "Sistema", motivo: "Anúncio duplicado (3x)", status: "pendente", data: "15/05", imagens: 2 },
  { id: "R-003", anuncio: "Notebook gamer", autor: "Ana L.", email: "ana@email.com", denunciante: "Admin", motivo: "Preço enganoso", status: "em_andamento", data: "14/05", imagens: 1 },
  { id: "R-004", anuncio: "Gol G5 2012", autor: "João P.", email: "joao@email.com", denunciante: "Pedro A.", motivo: "Golpe - veículo clonado", status: "em_andamento", data: "13/05", imagens: 3 },
  { id: "R-005", anuncio: "Armas de brinquedo", autor: "Maria S.", email: "maria@email.com", denunciante: "Sistema", motivo: "Categoria incorreta", status: "pendente", data: "13/05", imagens: 0 },
  { id: "R-006", anuncio: "PlayStation 5", autor: "Pedro A.", email: "pedro@email.com", denunciante: "Lucas R.", motivo: "Produto falsificado", status: "resolvido", data: "12/05", imagens: 2 },
  { id: "R-007", anuncio: "Bicicleta aro 29", autor: "Admin Test", email: "admin@test.com", denunciante: "Sistema", motivo: "Má categorização", status: "resolvido", data: "12/05", imagens: 0 },
];

export default function AdminDenuncias() {
  const { authHeaders, deletePost } = useAdminData();
  const [reports, setReports] = useState(FALLBACK_REPORTS);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("todas");
  const [selectedReport, setSelectedReport] = useState(null);

  const filtered = reports.filter(r => {
    if (tab !== "todas" && r.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.anuncio.toLowerCase().includes(q) || r.autor.toLowerCase().includes(q) || r.denunciante.toLowerCase().includes(q);
    }
    return true;
  });

  const handleRemove = async (report) => {
    if (!window.confirm(`Remover anúncio "${report.anuncio}" de ${report.autor}?`)) return;
    try {
      await deletePost(report.anuncio);
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "resolvido" } : r));
    } catch {
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "resolvido" } : r));
    }
  };

  const handleBan = async (report) => {
    if (!window.confirm(`Banir usuário "${report.autor}" (${report.email})?`)) return;
    try {
      await axios.put(API + "/admin/users/" + report.email + "/block", {}, { headers: authHeaders }).catch(() => {});
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "resolvido" } : r));
    } catch {
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "resolvido" } : r));
    }
    alert("Usuário banido: " + report.autor);
  };

  const handleIgnore = (report) => {
    if (!window.confirm(`Ignorar denúncia #${report.id}?`)) return;
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "resolvido" } : r));
  };

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

      <div className={`${glassCard} p-5`}>
        {/* Tabs */}
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

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04]">
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Anúncio</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Autor</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Denunciante</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Motivo</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Data</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                <TableCell>
                  <div>
                    <p className="text-white font-medium text-[13px]">{r.anuncio}</p>
                    <p className="text-[10px] text-[#8C8F9A] font-mono">{r.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-[#D4A24C]/10 text-[#D4A24C]">{(r.autor || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[12px] text-white">{r.autor}</p>
                      <p className="text-[10px] text-[#8C8F9A]">{r.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-[#8C8F9A] text-[12px]">{r.denunciante}</TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-white text-[12px]">{r.motivo}</p>
                  {r.imagens > 0 && (
                    <span className="text-[10px] text-[#D4A24C] flex items-center gap-1 mt-0.5">
                      <Image size={10} /> {r.imagens} imagem(ns)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-[#8C8F9A] text-[12px]">{r.data}</TableCell>
                <TableCell className="text-right">
                  {r.status !== "resolvido" ? (
                    <div className="flex items-center justify-end gap-1">
                      <Button onClick={() => handleRemove(r)}
                        className="h-8 px-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-semibold hover:bg-red-500/20">
                        <Trash2 size={12} className="mr-1" /> Remover
                      </Button>
                      <Button onClick={() => handleBan(r)}
                        className="h-8 px-2.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl text-[11px] font-semibold hover:bg-orange-500/20">
                        <UserMinus size={12} className="mr-1" /> Banir
                      </Button>
                      <Button onClick={() => handleIgnore(r)}
                        className="h-8 px-2.5 bg-white/[0.04] text-[#8C8F9A] border border-white/10 rounded-xl text-[11px] font-semibold hover:text-white">
                        <XCircle size={12} className="mr-1" /> Ignorar
                      </Button>
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
            <p className="text-[13px]">Nenhuma denúncia encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}

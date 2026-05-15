import { useState } from "react";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

const denunciasData = [
  { id: "#001", motivo: "Produto proibido", autor: "Carlos M.", anuncio: "Kit festa completo", status: "pendente", data: "15/05" },
  { id: "#002", motivo: "Anúncio duplicado", autor: "Ana L.", anuncio: "iPhone 13", status: "pendente", data: "15/05" },
  { id: "#003", motivo: "Preço enganoso", autor: "Admin", anuncio: "Notebook gamer", status: "em_andamento", data: "14/05" },
  { id: "#004", motivo: "Conteúdo ofensivo", autor: "Sistema", anuncio: "Anúncio #889", status: "resolvido", data: "14/05" },
  { id: "#005", motivo: "Golpe", autor: "João P.", anuncio: "Gol G5 2012", status: "resolvido", data: "13/05" },
  { id: "#006", motivo: "Produto proibido", autor: "Maria S.", anuncio: "Armas de brinquedo", status: "pendente", data: "13/05" },
  { id: "#007", motivo: "Má categorização", autor: "Sistema", anuncio: "Bicicleta aro 29", status: "em_andamento", data: "12/05" },
  { id: "#008", motivo: "Anúncio falso", autor: "Pedro A.", anuncio: "PlayStation 5", status: "resolvido", data: "12/05" },
];

function StatusBadge({ status }) {
  const map = {
    pendente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    em_andamento: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    resolvido: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  const c = map[status] || "bg-gray-500/10 text-gray-400";
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c}`}>
    {status === "em_andamento" ? "Em andamento" : status.charAt(0).toUpperCase() + status.slice(1)}
  </span>;
}

export default function AdminDenuncias() {
  const [tab, setTab] = useState("todas");
  const filtered = tab === "todas" ? denunciasData : denunciasData.filter(d => d.status === tab);

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Denúncias" description="Gerenciar denúncias B Livre" />
      <div>
        <h1 className="text-xl font-black text-white">Denúncias</h1>
        <p className="text-sm text-[#8C8F9A] mt-0.5">Gerencie as denúncias recebidas</p>
      </div>

      <div className={`${glassCard} p-5`}>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.06] overflow-x-auto">
          {[
            { id: "todas", label: "Todas", count: denunciasData.length },
            { id: "pendente", label: "Pendentes", count: denunciasData.filter(d => d.status === "pendente").length },
            { id: "em_andamento", label: "Em andamento", count: denunciasData.filter(d => d.status === "em_andamento").length },
            { id: "resolvido", label: "Resolvidas", count: denunciasData.filter(d => d.status === "resolvido").length },
          ].map((t) => (
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
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">ID</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Motivo</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Autor</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Anúncio</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Data</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                <TableCell className="text-white font-medium">{d.id}</TableCell>
                <TableCell className="text-white">{d.motivo}</TableCell>
                <TableCell className="text-[#8C8F9A]">{d.autor}</TableCell>
                <TableCell className="text-white">{d.anuncio}</TableCell>
                <TableCell className="text-[#8C8F9A] text-[12px]">{d.data}</TableCell>
                <TableCell><StatusBadge status={d.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400 hover:text-emerald-300"><CheckCircle size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300"><XCircle size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8C8F9A] hover:text-white"><Eye size={14} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

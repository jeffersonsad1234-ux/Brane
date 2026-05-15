import { useState } from "react";
import { Search, Eye, Edit3, Trash2, Filter } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

const anunciosData = [
  { id: "A-001", titulo: "iPhone 13 128GB", categoria: "Celulares", preco: "R$ 3.500", autor: "Maria S.", status: "ativo", views: 1243 },
  { id: "A-002", titulo: "Gol G5 2012", categoria: "Veículos", preco: "R$ 18.900", autor: "João P.", status: "ativo", views: 892 },
  { id: "A-003", titulo: "Kit festa completo", categoria: "Outros", preco: "R$ 450", autor: "Carlos M.", status: "bloqueado", views: 67 },
  { id: "A-004", titulo: "Notebook gamer", categoria: "Celulares", preco: "R$ 2.200", autor: "Ana L.", status: "ativo", views: 2156 },
  { id: "A-005", titulo: "Sofá 3 lugares", categoria: "Casa", preco: "R$ 800", autor: "Pedro A.", status: "ativo", views: 445 },
  { id: "A-006", titulo: "Bicicleta aro 29", categoria: "Outros", preco: "R$ 600", autor: "Admin Test", status: "pendente", views: 234 },
  { id: "A-007", titulo: "PlayStation 5", categoria: "Celulares", preco: "R$ 3.200", autor: "Pedro A.", status: "ativo", views: 1876 },
  { id: "A-008", titulo: "Fone Bluetooth", categoria: "Celulares", preco: "R$ 120", autor: "Lucas R.", status: "ativo", views: 567 },
  { id: "A-009", titulo: "Apartamento 2 quartos", categoria: "Imóveis", preco: "R$ 180.000", autor: "Fernanda C.", status: "ativo", views: 3456 },
  { id: "A-010", titulo: "Vestido de festa", categoria: "Moda", preco: "R$ 89", autor: "Juliana S.", status: "pendente", views: 123 },
];

function StatusBadge({ status }) {
  const map = {
    ativo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    bloqueado: "bg-red-500/10 text-red-400 border-red-500/20",
    pendente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  const c = map[status] || "bg-gray-500/10 text-gray-400";
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c}`}>{status}</span>;
}

const categories = ["Todas", "Celulares", "Veículos", "Imóveis", "Casa", "Moda", "Outros"];

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");
  const filtered = anunciosData.filter(a => {
    if (cat !== "Todas" && a.categoria !== cat) return false;
    return a.titulo.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Anúncios" description="Gerenciar anúncios B Livre" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Anúncios</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">{anunciosData.length} anúncios no total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..." className="pl-9 h-9 w-52 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 border-white/10 text-[#8C8F9A] rounded-xl"><Filter size={14} /></Button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${
              cat === c ? "bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20" : "text-[#8C8F9A] hover:text-white border border-transparent"
            }`}>{c}</button>
        ))}
      </div>

      <div className={`${glassCard} p-5`}>
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04]">
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Anúncio</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Categoria</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Preço</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Autor</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Views</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                <TableCell className="text-white font-medium">{a.titulo}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] border-white/10 text-[#8C8F9A] bg-white/[0.02]">{a.categoria}</Badge></TableCell>
                <TableCell className="text-white font-semibold">{a.preco}</TableCell>
                <TableCell className="text-[#8C8F9A]">{a.autor}</TableCell>
                <TableCell className="text-[#8C8F9A] flex items-center gap-1"><Eye size={12} />{a.views}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8C8F9A] hover:text-white"><Edit3 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300"><Trash2 size={14} /></Button>
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

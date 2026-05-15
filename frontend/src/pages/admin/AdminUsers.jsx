import { useState } from "react";
import { Search, UserCheck, UserX, Eye } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

const usuariosData = [
  { id: "U-001", nome: "Maria Silva", email: "maria@email.com", status: "ativo", anuncios: 12, denuncias: 0, data: "Jan/24" },
  { id: "U-002", nome: "João Pereira", email: "joao@email.com", status: "ativo", anuncios: 5, denuncias: 2, data: "Mar/24" },
  { id: "U-003", nome: "Carlos Mendes", email: "carlos@email.com", status: "banido", anuncios: 3, denuncias: 8, data: "Fev/24" },
  { id: "U-004", nome: "Ana Lúcia", email: "ana@email.com", status: "ativo", anuncios: 8, denuncias: 0, data: "Abr/24" },
  { id: "U-005", nome: "Pedro Alves", email: "pedro@email.com", status: "ativo", anuncios: 15, denuncias: 1, data: "Dez/23" },
  { id: "U-006", nome: "Lucas Ribeiro", email: "lucas@email.com", status: "suspenso", anuncios: 2, denuncias: 3, data: "Jun/24" },
  { id: "U-007", nome: "Fernanda Costa", email: "fernanda@email.com", status: "ativo", anuncios: 7, denuncias: 0, data: "Mar/24" },
  { id: "U-008", nome: "Rafael Oliveira", email: "rafael@email.com", status: "ativo", anuncios: 10, denuncias: 0, data: "Abr/24" },
  { id: "U-009", nome: "Juliana Santos", email: "juliana@email.com", status: "suspenso", anuncios: 1, denuncias: 2, data: "Mai/24" },
  { id: "U-010", nome: "Thiago Lima", email: "thiago@email.com", status: "banido", anuncios: 4, denuncias: 6, data: "Jan/24" },
];

function StatusBadge({ status }) {
  const map = {
    ativo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    banido: "bg-red-500/10 text-red-400 border-red-500/20",
    suspenso: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };
  const c = map[status] || "bg-gray-500/10 text-gray-400";
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c}`}>{status}</span>;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const filtered = usuariosData.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Usuários" description="Gerenciar usuários B Livre" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Usuários</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">{usuariosData.length} usuários cadastrados</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..." className="pl-9 h-9 w-52 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
        </div>
      </div>

      <div className={`${glassCard} p-5`}>
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04]">
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Usuário</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Email</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Anúncios</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Denúncias</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Desde</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[11px] bg-[#D4A24C]/10 text-[#D4A24C] font-semibold">
                        {u.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white font-medium text-[13px]">{u.nome}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[#8C8F9A] text-[12px]">{u.email}</TableCell>
                <TableCell><StatusBadge status={u.status} /></TableCell>
                <TableCell className="text-white">{u.anuncios}</TableCell>
                <TableCell className={u.denuncias > 0 ? "text-red-400" : "text-[#8C8F9A]"}>{u.denuncias}</TableCell>
                <TableCell className="text-[#8C8F9A] text-[12px]">{u.data}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400 hover:text-emerald-300"><UserCheck size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300"><UserX size={14} /></Button>
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

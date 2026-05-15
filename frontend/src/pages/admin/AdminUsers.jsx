import { useState } from "react";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Search, UserCheck, UserX, Eye } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

export default function AdminUsers() {
  const { users, loading, blockUser } = useAdminData();
  const [search, setSearch] = useState("");

  const filtered = (users || []).filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || u.nome || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Usuários" description="Gerenciar usuários B Livre" />
        <UsersSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Usuários" description="Gerenciar usuários B Livre" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Usuários</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">{users?.length || 0} usuários cadastrados</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..." className="pl-9 h-9 w-52 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
        </div>
      </div>

      {(!users || users.length === 0) ? (
        <div className={`${glassCard} p-12 text-center`}>
          <p className="text-lg font-bold text-white mb-1">Nenhum dado real ainda</p>
          <p className="text-sm text-[#8C8F9A]">Nenhum usuário encontrado no banco de dados.</p>
        </div>
      ) : (
        <div className={`${glassCard} p-5`}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04]">
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Usuário</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Email</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Anúncios</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u, i) => (
                <TableRow key={u.id || i} className="border-white/[0.04] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[11px] bg-[#D4A24C]/10 text-[#D4A24C] font-semibold">
                          {(u.name || u.nome || "U").split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium text-[13px]">{u.name || u.nome || "Usuário"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#8C8F9A] text-[12px]">{u.email || "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      u.blocked ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>{u.blocked ? "Bloqueado" : "Ativo"}</span>
                  </TableCell>
                  <TableCell className="text-white">{u.posts_count || u.ads_count || u.anuncios || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button onClick={() => blockUser(u.id)}
                        className={`h-8 px-3 rounded-xl text-[11px] font-semibold border ${
                          u.blocked
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                        }`}>
                        {u.blocked ? <UserCheck size={13} className="mr-1" /> : <UserX size={13} className="mr-1" />}
                        {u.blocked ? "Desbloquear" : "Bloquear"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-white/[0.04] rounded-xl animate-pulse" />
        <div className="h-9 w-52 bg-white/[0.04] rounded-xl animate-pulse" />
      </div>
      <div className="rounded-2xl border bg-[#121216]/80 p-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-white/[0.02] rounded-xl mb-2 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

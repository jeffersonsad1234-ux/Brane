import { useState } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Search, UserCheck, UserX, Trash2, Eye, MapPin, Calendar, Shield, MoreHorizontal } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

export default function AdminUsers() {
  const { users: ctxUsers, loading, blockUser, authHeaders } = useAdminData();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("todos");

  // Merge with online status from context users
  const users = ctxUsers || [];

  const filtered = users.filter(u => {
    if (tab === "online" && !u.last_active_at) return false;
    if (tab === "blocked" && !u.is_blocked && !u.blocked) return false;
    if (tab === "active" && u.is_blocked) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || u.nome || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.city || u.cidade || "").toLowerCase().includes(q);
  });

  const isOnline = (u) => {
    if (!u.last_active_at) return false;
    const diff = Date.now() - new Date(u.last_active_at).getTime();
    return diff < 15 * 60 * 1000;
  };

  const deleteUser = async (uid) => {
    if (!window.confirm(`Excluir permanentemente o usuário ${uid}? Esta ação não pode ser desfeita.`)) return;
    try {
      await axios.delete(API + "/users/" + uid, { headers: authHeaders }).catch(() => {});
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <BLivreSEO page="home" title="Usuários" description="Gerenciar usuários B Livre" />
        <div className="h-8 w-32 bg-white/[0.04] rounded-xl animate-pulse" />
        <div className={`${glassCard} p-5`}>
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/[0.02] rounded-xl mb-2 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Usuários" description="Gerenciar usuários B Livre" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Usuários</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">{users.length} usuários cadastrados</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..." className="pl-9 h-9 w-52 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
        </div>
      </div>

      {users.length === 0 ? (
        <div className={`${glassCard} p-12 text-center`}>
          <p className="text-lg font-bold text-white mb-1">Nenhum dado real ainda</p>
          <p className="text-sm text-[#8C8F9A]">Nenhum usuário encontrado no banco de dados.</p>
        </div>
      ) : (
        <div className={`${glassCard} p-5`}>
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.06] overflow-x-auto">
            {[
              { id: "todos", label: "Todos", count: users.length },
              { id: "online", label: "Online", count: users.filter(u => isOnline(u)).length },
              { id: "active", label: "Ativos", count: users.filter(u => !u.is_blocked && !u.blocked).length },
              { id: "blocked", label: "Bloqueados", count: users.filter(u => u.is_blocked || u.blocked).length },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${tab === t.id ? "bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20" : "text-[#8C8F9A] hover:text-white border border-transparent"}`}>
                {t.label} <span className="ml-1 opacity-60">({t.count})</span>
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04]">
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Usuário</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Localização</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Cadastro</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u, i) => (
                <TableRow key={u.user_id || u.id || i} className="border-white/[0.04] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[11px] bg-[#D4A24C]/10 text-[#D4A24C] font-semibold">
                            {(u.name || u.nome || "U").split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline(u) && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#121216]" />}
                      </div>
                      <div>
                        <p className="text-white font-medium text-[13px]">{u.name || u.nome || "Usuário"}</p>
                        <p className="text-[11px] text-[#8C8F9A]">{u.email || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-[12px] text-[#8C8F9A]">
                      <MapPin size={11} />
                      <span>{(u.city || u.cidade || "—")}{(u.city || u.cidade) && (u.state || u.estado) ? ", " : ""}{(u.state || u.estado || "")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        u.is_blocked || u.blocked
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : isOnline(u)
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-white/[0.04] text-[#8C8F9A] border-white/10"
                      }`}>
                        {u.is_blocked || u.blocked ? "Bloqueado" : isOnline(u) ? "Online" : "Offline"}
                      </span>
                      {u.role === "admin" && <Shield size={13} className="text-[#D4A24C]" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#8C8F9A] text-[12px]">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} />
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button onClick={() => blockUser(u.user_id || u.id)}
                        className={`h-8 px-3 rounded-xl text-[11px] font-semibold border ${
                          u.is_blocked || u.blocked
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                        }`}>
                        {u.is_blocked || u.blocked ? <UserCheck size={13} className="mr-1" /> : <UserX size={13} className="mr-1" />}
                        {u.is_blocked || u.blocked ? "Desbloquear" : "Bloquear"}
                      </Button>
                      <Button onClick={() => deleteUser(u.user_id || u.id)}
                        className="h-8 px-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-semibold hover:bg-red-500/20">
                        <Trash2 size={12} />
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

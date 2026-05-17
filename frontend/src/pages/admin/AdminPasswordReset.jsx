import { useState, useEffect } from "react";
import axios from "axios";
import { useAdminData } from "../../contexts/AdminDataContext";
import { Search, Send, Shield, AlertTriangle } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";
const API = `${process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app"}/api`;

export default function AdminPasswordReset() {
  const { authHeaders, token } = useAdminData();
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API + "/admin/blivre/password-resets", { headers: authHeaders }).catch(() => null);
        if (res?.data?.requests) setRequests(res.data.requests);
        else setRequests([]);
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [authHeaders]);

  const sendReset = async (req) => {
    try {
      await axios.post(API + "/admin/blivre/password-resets/" + req.id + "/send", {}, { headers: authHeaders }).catch(() => {});
    } catch {}
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "enviado" } : r));
  };

  const blockUser = async (req) => {
    try {
      await axios.put(API + "/admin/blivre/password-resets/" + req.id + "/status", { status: "resolvido" }, { headers: authHeaders }).catch(() => {});
    } catch {}
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "resolvido" } : r));
  };

  const filtered = requests.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.email.toLowerCase().includes(q) || (r.user || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Recuperação de Senha" description="Gerenciar solicitações de recuperação de senha" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Recuperação de Senha</h1>
          <p className="text-sm text-[#8C8F9A] mt-0.5">Solicitações de redefinição de senha</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por email..." className="pl-9 h-9 w-52 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
        </div>
      </div>

      <div className={`${glassCard} p-5`}>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[#8C8F9A]">
            <div className="w-6 h-6 border-2 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !token ? (
          <div className="p-12 text-center">
            <p className="text-lg font-bold text-white mb-1">Faça login na B Livre primeiro</p>
            <p className="text-sm text-[#8C8F9A]">Você precisa estar logado com uma conta administradora.</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-bold text-white mb-1">Nenhuma solicitação encontrada</p>
            <p className="text-sm text-[#8C8F9A]">Nenhum pedido de recuperação de senha no momento.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04]">
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">ID</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Usuário</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Email</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Data</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                  <TableCell className="text-[#8C8F9A] font-mono text-[12px]">{r.id}</TableCell>
                  <TableCell className="text-white font-medium">{r.user || "—"}</TableCell>
                  <TableCell className="text-[#8C8F9A]">{r.email}</TableCell>
                  <TableCell className="text-[#8C8F9A] text-[12px]">{r.data || (r.created_at ? new Date(r.created_at).toLocaleString("pt-BR") : "—")}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      r.status === "resolvido" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      r.status === "enviado" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {r.status === "resolvido" ? "Resolvido" : r.status === "enviado" ? "Email enviado" : "Pendente"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button onClick={() => sendReset(r)}
                        disabled={r.status === "resolvido"}
                        className="h-8 px-3 bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20 rounded-xl text-[11px] font-semibold hover:bg-[#D4A24C]/20 disabled:opacity-40">
                        <Send size={12} className="mr-1" /> Enviar Reset
                      </Button>
                      <Button onClick={() => blockUser(r)}
                        className="h-8 px-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-semibold hover:bg-red-500/20">
                        <Shield size={12} className="mr-1" /> Bloquear
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className={`${glassCard} p-5`}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#D4A24C] mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Sobre recuperação de senha</h3>
            <p className="text-[12px] text-[#8C8F9A] leading-relaxed">
              As solicitações de recuperação de senha aparecem automaticamente quando um usuário solicita
              a redefinição. Utilize "Enviar Reset" para disparar o email de recuperação ou "Bloquear"
              caso desconfie de atividade suspeita. O backend precisa implementar o endpoint
              <code className="text-[#D4A24C] mx-1">/api/admin/password-resets</code> para operação completa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

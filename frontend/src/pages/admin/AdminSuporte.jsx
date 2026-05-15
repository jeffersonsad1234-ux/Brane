import { MessageSquare, CheckCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

const suporteData = [
  { id: "TK-001", usuario: "Maria S.", assunto: "Anúncio não aparece", prioridade: "alta", status: "aberto", data: "15/05" },
  { id: "TK-002", usuario: "João P.", assunto: "Problema ao fazer login", prioridade: "media", status: "aberto", data: "15/05" },
  { id: "TK-003", usuario: "Ana L.", assunto: "Como editar anúncio?", prioridade: "baixa", status: "respondido", data: "14/05" },
  { id: "TK-004", usuario: "Pedro A.", assunto: "Cobrança indevida", prioridade: "alta", status: "aberto", data: "14/05" },
  { id: "TK-005", usuario: "Carlos M.", assunto: "Excluir conta", prioridade: "media", status: "fechado", data: "13/05" },
  { id: "TK-006", usuario: "Lucas R.", assunto: "Dúvida sobre destaque", prioridade: "baixa", status: "fechado", data: "12/05" },
  { id: "TK-007", usuario: "Fernanda C.", assunto: "Erro ao enviar foto", prioridade: "media", status: "aberto", data: "11/05" },
  { id: "TK-008", usuario: "Rafael O.", assunto: "Solicitação de reembolso", prioridade: "alta", status: "respondido", data: "10/05" },
];

function Badge({ variant, children }) {
  const colors = {
    alta: "bg-red-500/10 text-red-400 border-red-500/20",
    media: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    baixa: "bg-green-500/10 text-green-400 border-green-500/20",
    aberto: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    respondido: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    fechado: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colors[variant] || colors.media}`}>{children}</span>;
}

export default function AdminSuporte() {
  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Suporte" description="Tickets de suporte B Livre" />
      <div>
        <h1 className="text-xl font-black text-white">Suporte</h1>
        <p className="text-sm text-[#8C8F9A] mt-0.5">Tickets de suporte</p>
      </div>

      <div className={`${glassCard} p-5`}>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.06] overflow-x-auto">
          {["todos", "aberto", "respondido", "fechado"].map((s) => (
            <button key={s}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap text-[#8C8F9A] hover:text-white border border-transparent">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04]">
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Ticket</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Usuário</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Assunto</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Prioridade</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Data</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suporteData.map((t) => (
              <TableRow key={t.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                <TableCell className="text-[#8C8F9A] font-mono text-[12px]">{t.id}</TableCell>
                <TableCell className="text-white">{t.usuario}</TableCell>
                <TableCell className="text-white">{t.assunto}</TableCell>
                <TableCell><Badge variant={t.prioridade}>{t.prioridade}</Badge></TableCell>
                <TableCell><Badge variant={t.status}>{t.status}</Badge></TableCell>
                <TableCell className="text-[#8C8F9A] text-[12px]">{t.data}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8C8F9A] hover:text-white"><MessageSquare size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8C8F9A] hover:text-white"><CheckCheck size={14} /></Button>
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

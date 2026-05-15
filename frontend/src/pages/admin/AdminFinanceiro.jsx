import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

const financeiroData = [
  { id: "T-001", usuario: "Maria S.", tipo: "Destaque", valor: "R$ 29,90", metodo: "Pix", status: "confirmado", data: "15/05" },
  { id: "T-002", usuario: "João P.", tipo: "Destaque", valor: "R$ 19,90", metodo: "Cartão", status: "confirmado", data: "14/05" },
  { id: "T-003", usuario: "Ana L.", tipo: "Assinatura", valor: "R$ 49,90", metodo: "Pix", status: "pendente", data: "14/05" },
  { id: "T-004", usuario: "Pedro A.", tipo: "Destaque", valor: "R$ 29,90", metodo: "Cartão", status: "confirmado", data: "13/05" },
  { id: "T-005", usuario: "Carlos M.", tipo: "Reembolso", valor: "-R$ 19,90", metodo: "Pix", status: "estornado", data: "13/05" },
  { id: "T-006", usuario: "Lucas R.", tipo: "Destaque", valor: "R$ 9,90", metodo: "Pix", status: "confirmado", data: "12/05" },
  { id: "T-007", usuario: "Maria S.", tipo: "Saque", valor: "-R$ 150,00", metodo: "Pix", status: "processando", data: "12/05" },
  { id: "T-008", usuario: "Fernanda C.", tipo: "Assinatura", valor: "R$ 49,90", metodo: "Cartão", status: "confirmado", data: "11/05" },
];

function StatusBadge({ status }) {
  const map = {
    confirmado: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pendente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    estornado: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    processando: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const c = map[status] || "bg-gray-500/10 text-gray-400";
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c}`}>{status}</span>;
}

export default function AdminFinanceiro() {
  const totalReceita = financeiroData
    .filter(t => t.valor.startsWith("R$") && !t.valor.startsWith("-"))
    .reduce((acc, t) => acc + (parseFloat(t.valor.replace("R$ ", "").replace(",", ".")) || 0), 0);
  const pendentes = financeiroData.filter(t => t.status === "pendente" || t.status === "processando").length;

  return (
    <div className="space-y-6">
      <BLivreSEO page="home" title="Financeiro" description="Transações B Livre" />
      <div>
        <h1 className="text-xl font-black text-white">Financeiro</h1>
        <p className="text-sm text-[#8C8F9A] mt-0.5">Transações e receitas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${glassCard} p-4`}>
          <p className="text-[11px] text-[#8C8F9A] mb-1">Receita Total</p>
          <p className="text-xl font-black text-white">R$ {totalReceita.toFixed(2).replace(".", ",")}</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1"><ArrowUpRight size={12} />+23% esse mês</p>
        </div>
        <div className={`${glassCard} p-4`}>
          <p className="text-[11px] text-[#8C8F9A] mb-1">Transações</p>
          <p className="text-xl font-black text-white">{financeiroData.length}</p>
          <p className="text-[11px] text-[#8C8F9A] mt-1">esse mês</p>
        </div>
        <div className={`${glassCard} p-4`}>
          <p className="text-[11px] text-[#8C8F9A] mb-1">Pendentes</p>
          <p className="text-xl font-black text-amber-400">{pendentes}</p>
          <p className="text-[11px] text-[#8C8F9A] mt-1">aguardando</p>
        </div>
        <div className={`${glassCard} p-4`}>
          <p className="text-[11px] text-[#8C8F9A] mb-1">Ticket Médio</p>
          <p className="text-xl font-black text-white">R$ 24,90</p>
          <p className="text-[11px] text-[#8C8F9A] mt-1">por transação</p>
        </div>
      </div>

      <div className={`${glassCard} p-5`}>
        <h3 className="text-sm font-bold text-white mb-4">Últimas Transações</h3>
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04]">
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">ID</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Usuário</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Tipo</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Valor</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Método</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
              <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financeiroData.map((t) => (
              <TableRow key={t.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                <TableCell className="text-[#8C8F9A] font-mono text-[12px]">{t.id}</TableCell>
                <TableCell className="text-white">{t.usuario}</TableCell>
                <TableCell className="text-[#8C8F9A]">{t.tipo}</TableCell>
                <TableCell className={`font-semibold ${t.valor.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>{t.valor}</TableCell>
                <TableCell className="text-[#8C8F9A] text-[12px]">{t.metodo}</TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell className="text-[#8C8F9A] text-[12px] text-right">{t.data}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

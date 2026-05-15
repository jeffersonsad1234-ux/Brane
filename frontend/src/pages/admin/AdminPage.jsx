import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, LayoutDashboard, Flag, Megaphone, Users, DollarSign,
  Bell, FileText, HeadphonesIcon, Settings, LogOut, Menu, X,
  Search, ChevronDown, MoreHorizontal, TrendingUp, TrendingDown,
  Eye, MessageSquare, Star, Shield, Filter, Download, Plus,
  CheckCircle, XCircle, Clock, AlertTriangle, Trash2, Edit3,
  UserCheck, UserX, Mail, Phone, MapPin, Calendar, ChevronRight,
  CreditCard, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw,
  Send, Paperclip, HelpCircle, CheckCheck, Globe, Lock, Moon,
  Sun, Sliders
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../../components/ui/table";
import BLivreSEO from "../../components/BLivreSEO";

// ─── Theme Colors ───────────────────────────────────────
const gold = "#D4A24C";
const goldLight = "#F1D28A";
const bgDark = "#0A0A0C";
const bgCard = "#121216";
const bgCardHover = "#1A1A20";
const borderColor = "rgba(255,255,255,0.06)";
const textMuted = "#8C8F9A";
const textPrimary = "#F5F5F7";

// ─── Sidebar Navigation ─────────────────────────────────
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "denuncias", label: "Denúncias", icon: Flag },
  { id: "anuncios", label: "Anúncios", icon: Megaphone },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "financeiro", label: "Financeiro", icon: DollarSign },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "relatorios", label: "Relatórios", icon: FileText },
  { id: "suporte", label: "Suporte", icon: HeadphonesIcon },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

// ─── Mock Data ───────────────────────────────────────────
const metrics = [
  { label: "Anúncios Ativos", value: "2,847", change: "+12.5%", up: true, icon: Megaphone },
  { label: "Usuários", value: "18,293", change: "+8.2%", up: true, icon: Users },
  { label: "Denúncias (mês)", value: "143", change: "-5.7%", up: false, icon: Flag },
  { label: "Receita (mês)", value: "R$ 47.890", change: "+23.1%", up: true, icon: DollarSign },
];

const chartViews = [
  { name: "Jan", views: 4200, ads: 2400, users: 1800 },
  { name: "Fev", views: 3800, ads: 2200, users: 1600 },
  { name: "Mar", views: 5100, ads: 2900, users: 2100 },
  { name: "Abr", views: 4800, ads: 2700, users: 2000 },
  { name: "Mai", views: 5600, ads: 3100, users: 2400 },
  { name: "Jun", views: 6200, ads: 3500, users: 2800 },
  { name: "Jul", views: 5900, ads: 3300, users: 2600 },
  { name: "Ago", views: 6700, ads: 3800, users: 3000 },
  { name: "Set", views: 7200, ads: 4100, users: 3300 },
  { name: "Out", views: 7800, ads: 4300, users: 3600 },
  { name: "Nov", views: 8400, ads: 4700, users: 3900 },
  { name: "Dez", views: 9100, ads: 5100, users: 4200 },
];

const categoryDist = [
  { name: "Celulares", value: 35 }, { name: "Veículos", value: 20 },
  { name: "Imóveis", value: 15 }, { name: "Moda", value: 12 },
  { name: "Casa", value: 10 }, { name: "Outros", value: 8 },
];

const recentActivity = [
  { action: "Novo anúncio", user: "Maria S.", item: "iPhone 13", time: "2 min atrás", status: "ativo" },
  { action: "Denúncia", user: "João P.", item: "Gol G5 2012", time: "15 min atrás", status: "pendente" },
  { action: "Usuário banido", user: "Admin", item: "carlos_**@", time: "1h atrás", status: "resolvido" },
  { action: "Anúncio removido", user: "Sistema", item: "Kit festa", time: "2h atrás", status: "resolvido" },
  { action: "Novo usuário", user: "Ana C.", item: "anac***@gmail.com", time: "3h atrás", status: "ativo" },
  { action: "Pagamento", user: "Lucas R.", item: "Destaque 7 dias", time: "4h atrás", status: "ativo" },
];

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

const anunciosData = [
  { id: "A-001", titulo: "iPhone 13 128GB", categoria: "Celulares", preco: "R$ 3.500", autor: "Maria S.", status: "ativo", views: 1243 },
  { id: "A-002", titulo: "Gol G5 2012", categoria: "Veículos", preco: "R$ 18.900", autor: "João P.", status: "ativo", views: 892 },
  { id: "A-003", titulo: "Kit festa completo", categoria: "Outros", preco: "R$ 450", autor: "Carlos M.", status: "bloqueado", views: 67 },
  { id: "A-004", titulo: "Notebook gamer", categoria: "Celulares", preco: "R$ 2.200", autor: "Ana L.", status: "ativo", views: 2156 },
  { id: "A-005", titulo: "Sofá 3 lugares", categoria: "Casa", preco: "R$ 800", autor: "Pedro A.", status: "ativo", views: 445 },
  { id: "A-006", titulo: "Bicicleta aro 29", categoria: "Outros", preco: "R$ 600", autor: "Admin Test", status: "pendente", views: 234 },
  { id: "A-007", titulo: "PlayStation 5", categoria: "Celulares", preco: "R$ 3.200", autor: "Pedro A.", status: "ativo", views: 1876 },
  { id: "A-008", titulo: "Fone Bluetooth", categoria: "Celulares", preco: "R$ 120", autor: "Lucas R.", status: "ativo", views: 567 },
];

const usuariosData = [
  { id: "U-001", nome: "Maria Silva", email: "maria@email.com", status: "ativo", anuncios: 12, denuncias: 0, data: "Jan/24" },
  { id: "U-002", nome: "João Pereira", email: "joao@email.com", status: "ativo", anuncios: 5, denuncias: 2, data: "Mar/24" },
  { id: "U-003", nome: "Carlos Mendes", email: "carlos@email.com", status: "banido", anuncios: 3, denuncias: 8, data: "Fev/24" },
  { id: "U-004", nome: "Ana Lúcia", email: "ana@email.com", status: "ativo", anuncios: 8, denuncias: 0, data: "Abr/24" },
  { id: "U-005", nome: "Pedro Alves", email: "pedro@email.com", status: "ativo", anuncios: 15, denuncias: 1, data: "Dez/23" },
  { id: "U-006", nome: "Lucas Ribeiro", email: "lucas@email.com", status: "suspenso", anuncios: 2, denuncias: 3, data: "Jun/24" },
];

const financeiroData = [
  { id: "T-001", usuario: "Maria S.", tipo: "Destaque", valor: "R$ 29,90", metodo: "Pix", status: "confirmado", data: "15/05" },
  { id: "T-002", usuario: "João P.", tipo: "Destaque", valor: "R$ 19,90", metodo: "Cartão", status: "confirmado", data: "14/05" },
  { id: "T-003", usuario: "Ana L.", tipo: "Assinatura", valor: "R$ 49,90", metodo: "Pix", status: "pendente", data: "14/05" },
  { id: "T-004", usuario: "Pedro A.", tipo: "Destaque", valor: "R$ 29,90", metodo: "Cartão", status: "confirmado", data: "13/05" },
  { id: "T-005", usuario: "Carlos M.", tipo: "Reembolso", valor: "-R$ 19,90", metodo: "Pix", status: "estornado", data: "13/05" },
  { id: "T-006", usuario: "Lucas R.", tipo: "Destaque", valor: "R$ 9,90", metodo: "Pix", status: "confirmado", data: "12/05" },
  { id: "T-007", usuario: "Maria S.", tipo: "Saque", valor: "-R$ 150,00", metodo: "Pix", status: "processando", data: "12/05" },
];

const notificacoesData = [
  { id: "N-001", tipo: "denuncia", msg: "Nova denúncia no anúncio 'Kit festa completo'", lida: false, data: "15/05 10:32" },
  { id: "N-002", tipo: "usuario", msg: "Usuário 'carlos_**@' atingiu 5 denúncias", lida: false, data: "15/05 09:15" },
  { id: "N-003", tipo: "anuncio", msg: "Anúncio 'Notebook gamer' reportado como duplicado", lida: false, data: "14/05 22:40" },
  { id: "N-004", tipo: "sistema", msg: "Backup automático concluído com sucesso", lida: true, data: "14/05 03:00" },
  { id: "N-005", tipo: "pagamento", msg: "Pagamento de R$ 49,90 recebido de Ana L.", lida: true, data: "13/05 18:22" },
  { id: "N-006", tipo: "denuncia", msg: "Denúncia #005 resolvida por Admin", lida: true, data: "13/05 15:10" },
  { id: "N-007", tipo: "usuario", msg: "Novo usuário registrado: lucas.r@email.com", lida: true, data: "12/05 11:45" },
  { id: "N-008", tipo: "sistema", msg: "Atualização de segurança aplicada v2.4.1", lida: true, data: "11/05 06:30" },
];

const suporteData = [
  { id: "TK-001", usuario: "Maria S.", assunto: "Anúncio não aparece", prioridade: "alta", status: "aberto", data: "15/05" },
  { id: "TK-002", usuario: "João P.", assunto: "Problema ao fazer login", prioridade: "media", status: "aberto", data: "15/05" },
  { id: "TK-003", usuario: "Ana L.", assunto: "Como editar anúncio?", prioridade: "baixa", status: "respondido", data: "14/05" },
  { id: "TK-004", usuario: "Pedro A.", assunto: "Cobrança indevida", prioridade: "alta", status: "aberto", data: "14/05" },
  { id: "TK-005", usuario: "Carlos M.", assunto: "Excluir conta", prioridade: "media", status: "fechado", data: "13/05" },
  { id: "TK-006", usuario: "Lucas R.", assunto: "Dúvida sobre destaque", prioridade: "baixa", status: "fechado", data: "12/05" },
];

const relatoriosResumo = [
  { label: "Total Anúncios", value: "12.847", change: "+15%", up: true },
  { label: "Usuários Ativos", value: "8.293", change: "+8%", up: true },
  { label: "Taxa Conversão", value: "3.2%", change: "+0.4%", up: true },
  { label: "Ticket Médio", value: "R$ 24,90", change: "-2%", up: false },
  { label: "Denúncias resolvidas", value: "87%", change: "+5%", up: true },
  { label: "Tempo médio resposta", value: "4.2h", change: "-12%", up: true },
];

// ─── Status Badge Helper ─────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    ativo: { label: "Ativo", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    pendente: { label: "Pendente", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    em_andamento: { label: "Em andamento", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    resolvido: { label: "Resolvido", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    bloqueado: { label: "Bloqueado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
    banido: { label: "Banido", color: "bg-red-500/10 text-red-400 border-red-500/20" },
    suspenso: { label: "Suspenso", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    confirmado: { label: "Confirmado", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    estornado: { label: "Estornado", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    processando: { label: "Processando", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    aberto: { label: "Aberto", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    respondido: { label: "Respondido", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    fechado: { label: "Fechado", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    alta: { label: "Alta", color: "bg-red-500/10 text-red-400 border-red-500/20" },
    media: { label: "Média", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    baixa: { label: "Baixa", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  };
  const s = map[status] || { label: status, color: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.color.split(" ")[0].replace("bg-", "bg-").replace("/10", "")}`} />
      {s.label}
    </span>
  );
}

// ─── Section Header ──────────────────────────────────────
function SectionHeader({ title, description, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-black text-white">{title}</h1>
        {description && <p className="text-sm text-[#8C8F9A] mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

// ─── Glass Card ──────────────────────────────────────────
const glassCard = "rounded-2xl border bg-[#121216]/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

// ═══════════════════════════════════════════════════════════
//  SECTIONS
// ═══════════════════════════════════════════════════════════

// ─── Dashboard ──────────────────────────────────────────
function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`${glassCard} p-5 hover:bg-[#1A1A20]/80 transition-colors cursor-pointer`}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-[#D4A24C]/10 border border-[#D4A24C]/10">
                <m.icon size={18} className="text-[#D4A24C]" />
              </div>
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${m.up ? "text-emerald-400" : "text-red-400"}`}>
                {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {m.change}
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#8C8F9A] uppercase tracking-wider">{m.label}</p>
            <p className="text-2xl font-black text-white mt-1">{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className={`${glassCard} lg:col-span-2 p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Visualizações & Anúncios</h3>
            <Badge variant="outline" className="text-[10px] border-white/10 text-[#8C8F9A]">12 meses</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartViews}>
              <defs>
                <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={gold} stopOpacity={0.2} /><stop offset="100%" stopColor={gold} stopOpacity={0} /></linearGradient>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6B5BFF" stopOpacity={0.2} /><stop offset="100%" stopColor="#6B5BFF" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <ReTooltip contentStyle={{ background: "#121216", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff" }} />
              <Area type="monotone" dataKey="views" stroke={gold} fill="url(#vGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="ads" stroke="#6B5BFF" fill="url(#aGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className={`${glassCard} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Categorias</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {categoryDist.map((_, i) => (
                  <Cell key={i} fill={[gold, "#6B5BFF", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"][i]} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span style={{ color: "#8C8F9A", fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className={`${glassCard} p-5`}>
        <SectionHeader title="Atividade Recente" />
        <div className="space-y-1">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  a.status === "ativo" ? "bg-emerald-500/10 text-emerald-400" :
                  a.status === "pendente" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                }`}>
                  {a.action[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{a.action} <span className="text-[#D4A24C]">{a.item}</span></p>
                  <p className="text-[11px] text-[#8C8F9A]">{a.user} · {a.time}</p>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Denúncias ──────────────────────────────────────────
function Denuncias() {
  const [tab, setTab] = useState("todas");
  const filtered = tab === "todas" ? denunciasData : denunciasData.filter(d => d.status === tab);
  return (
    <div className="space-y-6">
      <SectionHeader title="Denúncias" description="Gerencie as denúncias recebidas" />
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
        <div className="overflow-x-auto">
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"><CheckCircle size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"><XCircle size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8C8F9A] hover:text-white"><Eye size={14} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Anúncios ──────────────────────────────────────────
function Anuncios() {
  const [search, setSearch] = useState("");
  const filtered = anunciosData.filter(a => a.titulo.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-6">
      <SectionHeader title="Anúncios" description={`${anunciosData.length} anúncios no total`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar anúncios..." className="pl-9 h-9 w-52 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 border-white/10 text-[#8C8F9A] rounded-xl"><Filter size={14} /></Button>
          </div>
        }
      />
      <div className={`${glassCard} p-5`}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04]">
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">ID</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Título</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Categoria</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Preço</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Autor</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Visualizações</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium">Status</TableHead>
                <TableHead className="text-[11px] text-[#8C8F9A] font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                  <TableCell className="text-[#8C8F9A] font-mono text-[12px]">{a.id}</TableCell>
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
    </div>
  );
}

// ─── Usuários ──────────────────────────────────────────
function Usuarios() {
  const [search, setSearch] = useState("");
  const filtered = usuariosData.filter(u => u.nome.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-6">
      <SectionHeader title="Usuários" description="Gerencie todos os usuários da plataforma"
        action={
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuários..." className="pl-9 h-9 w-52 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
          </div>
        }
      />
      <div className={`${glassCard} p-5`}>
        <div className="overflow-x-auto">
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
    </div>
  );
}

// ─── Financeiro ────────────────────────────────────────
function Financeiro() {
  const totalReceita = financeiroData.filter(t => t.valor.startsWith("R$") && !t.valor.startsWith("-")).reduce((acc, t) => {
    const num = parseFloat(t.valor.replace("R$ ", "").replace(",", "."));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
  return (
    <div className="space-y-6">
      <SectionHeader title="Financeiro" description="Transações e receitas" />
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
          <p className="text-xl font-black text-amber-400">{financeiroData.filter(t => t.status === "pendente" || t.status === "processando").length}</p>
          <p className="text-[11px] text-[#8C8F9A] mt-1">aguardando</p>
        </div>
        <div className={`${glassCard} p-4`}>
          <p className="text-[11px] text-[#8C8F9A] mb-1">Ticket Médio</p>
          <p className="text-xl font-black text-white">R$ 24,90</p>
          <p className="text-[11px] text-[#8C8F9A] mt-1">por transação</p>
        </div>
      </div>
      <div className={`${glassCard} p-5`}>
        <SectionHeader title="Últimas Transações" />
        <div className="overflow-x-auto">
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
    </div>
  );
}

// ─── Notificações ──────────────────────────────────────
function Notificacoes() {
  const [filter, setFilter] = useState("todas");
  const filtered = filter === "todas" ? notificacoesData : filter === "naolidas" ? notificacoesData.filter(n => !n.lida) : notificacoesData.filter(n => n.tipo === filter);
  const iconMap = { denuncia: Flag, usuario: Users, anuncio: Megaphone, sistema: Settings, pagamento: DollarSign };
  return (
    <div className="space-y-6">
      <SectionHeader title="Notificações" description="Central de notificações do sistema" />
      <div className={`${glassCard} p-5`}>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.06] overflow-x-auto">
          {[
            { id: "todas", label: "Todas", count: notificacoesData.length },
            { id: "naolidas", label: "Não lidas", count: notificacoesData.filter(n => !n.lida).length },
            { id: "denuncia", label: "Denúncias" },
            { id: "usuario", label: "Usuários" },
            { id: "pagamento", label: "Pagamentos" },
          ].map((t) => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${
                filter === t.id ? "bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20" : "text-[#8C8F9A] hover:text-white border border-transparent"
              }`}>
              {t.label} {t.count !== undefined && <span className="ml-1 opacity-60">({t.count})</span>}
            </button>
          ))}
        </div>
        <div className="space-y-1">
          {filtered.map((n) => {
            const Icon = iconMap[n.tipo] || Bell;
            return (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${n.lida ? "opacity-60 hover:opacity-80" : "bg-[#D4A24C]/[0.03] hover:bg-[#D4A24C]/[0.06]"}`}>
                <div className={`p-2 rounded-xl ${n.lida ? "bg-white/[0.04] text-[#8C8F9A]" : "bg-[#D4A24C]/10 text-[#D4A24C]"}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] ${n.lida ? "text-[#8C8F9A]" : "text-white font-medium"}`}>{n.msg}</p>
                  <p className="text-[11px] text-[#5C5F6A] mt-0.5">{n.data}</p>
                </div>
                {!n.lida && <span className="w-2 h-2 rounded-full bg-[#D4A24C] mt-2 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Relatórios ────────────────────────────────────────
function Relatorios() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Relatórios" description="Métricas e indicadores da plataforma"
        action={
          <Button variant="outline" className="h-9 border-white/10 text-[#8C8F9A] rounded-xl text-[12px] hover:text-white">
            <Download size={14} className="mr-1" /> Exportar
          </Button>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {relatoriosResumo.map((r, i) => (
          <motion.div key={r.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${glassCard} p-4 text-center`}>
            <p className="text-[11px] text-[#8C8F9A] mb-1">{r.label}</p>
            <p className="text-lg font-black text-white">{r.value}</p>
            <p className={`text-[11px] mt-1 flex items-center justify-center gap-1 ${r.up ? "text-emerald-400" : "text-red-400"}`}>
              {r.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{r.change}
            </p>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4">Visualizações (12 meses)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartViews}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <ReTooltip contentStyle={{ background: "#121216", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff" }} />
              <Bar dataKey="views" fill={gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4">Novos Usuários (12 meses)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartViews}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <ReTooltip contentStyle={{ background: "#121216", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff" }} />
              <Line type="monotone" dataKey="users" stroke="#6B5BFF" strokeWidth={2} dot={{ fill: "#6B5BFF", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Suporte ──────────────────────────────────────────
function Suporte() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Suporte" description="Tickets de suporte" />
      <div className={`${glassCard} p-5`}>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.06] overflow-x-auto">
          {["todos", "aberto", "respondido", "fechado"].map((s) => (
            <button key={s}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap text-[#8C8F9A] hover:text-white border border-transparent">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
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
                  <TableCell><StatusBadge status={t.prioridade} /></TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
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
    </div>
  );
}

// ─── Configurações ────────────────────────────────────
function Configuracoes() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Configurações" description="Gerencie as configurações da plataforma" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Globe size={16} className="text-[#D4A24C]" /> Geral</h3>
          <div className="space-y-4">
            {[
              { label: "Nome da plataforma", value: "B Livre" },
              { label: "URL base", value: "https://blivre.com" },
              { label: "Email de contato", value: "suporte@blivre.com" },
              { label: "Moeda", value: "BRL (R$)" },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#8C8F9A]">{f.label}</label>
                <Input defaultValue={f.value} className="h-9 bg-[#0A0A0C] border-white/10 text-white text-[13px] rounded-xl" />
              </div>
            ))}
          </div>
        </div>
        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Shield size={16} className="text-[#D4A24C]" /> Moderação</h3>
          <div className="space-y-4">
            {[
              { label: "Aprovação automática", value: "Sim", type: "toggle" },
              { label: "Notificar sobre denúncias", value: "Sim", type: "toggle" },
              { label: "Bloqueio automático após 3 denúncias", value: "Sim", type: "toggle" },
              { label: "Limite de anúncios por usuário", value: "50", type: "input" },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2">
                <label className="text-[13px] text-white">{f.label}</label>
                <div className={`w-10 h-5 rounded-full transition-colors ${f.value === "Sim" ? "bg-[#D4A24C]" : "bg-white/10"} relative cursor-pointer`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${f.value === "Sim" ? "left-5" : "left-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Lock size={16} className="text-[#D4A24C]" /> Segurança</h3>
          <div className="space-y-4">
            {[
              { label: "Autenticação em dois fatores" },
              { label: "Recaptcha no cadastro" },
              { label: "Verificação de email obrigatória" },
              { label: "Log de atividades" },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2">
                <label className="text-[13px] text-white">{f.label}</label>
                <div className="w-10 h-5 rounded-full bg-white/10 relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${glassCard} p-5`}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Sliders size={16} className="text-[#D4A24C]" /> Aparência</h3>
          <div className="space-y-4">
            {[
              { label: "Tema escuro", value: true },
              { label: "Modo compacto", value: false },
              { label: "Mostrar indicadores", value: true },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2">
                <label className="text-[13px] text-white">{f.label}</label>
                <div className={`w-10 h-5 rounded-full transition-colors ${f.value ? "bg-[#D4A24C]" : "bg-white/10"} relative cursor-pointer`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${f.value ? "left-5" : "left-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <Button className="w-full h-10 bg-[#D4A24C] text-black font-bold rounded-xl hover:bg-[#C49542]">
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Renderer ────────────────────────────────────
const sections = {
  dashboard: Dashboard,
  denuncias: Denuncias,
  anuncios: Anuncios,
  usuarios: Usuarios,
  financeiro: Financeiro,
  notificacoes: Notificacoes,
  relatorios: Relatorios,
  suporte: Suporte,
  configuracoes: Configuracoes,
};

// ═══════════════════════════════════════════════════════════
//  LAYOUT
// ═══════════════════════════════════════════════════════════
export default function AdminPage() {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const Section = sections[active] || Dashboard;

  useEffect(() => {
    document.title = `Admin — B Livre`;
    const handler = () => setSidebarOpen(window.innerWidth >= 1024);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-white flex">
      <BLivreSEO page="home" title="Admin" description="Painel administrativo B Livre" />

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[#0A0A0C] border-r border-white/[0.04] flex flex-col transition-transform duration-300 ${
        mobileOpen ? "translate-x-0" : sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-[72px]"
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4A24C]/10 border border-[#D4A24C]/20 flex items-center justify-center text-[#D4A24C] font-black text-sm">BL</div>
            {(sidebarOpen || mobileOpen) && (
              <div>
                <p className="text-sm font-black text-white">B Livre</p>
                <p className="text-[9px] text-[#D4A24C] font-semibold uppercase tracking-widest">Admin</p>
              </div>
            )}
          </div>
          <button onClick={() => { setSidebarOpen(!sidebarOpen); setMobileOpen(false); }}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 items-center justify-center text-[#8C8F9A] hover:text-white">
            <ChevronRight size={14} className={`transition-transform ${sidebarOpen ? "" : "rotate-180"}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => { setActive(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive ? "bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/15" : "text-[#8C8F9A] hover:text-white hover:bg-white/[0.03] border border-transparent"
                }`}>
                <Icon size={18} className={isActive ? "text-[#D4A24C]" : ""} />
                {(sidebarOpen || mobileOpen) && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.04]">
          <button onClick={() => navigate("/blivre")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#8C8F9A] hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut size={18} />
            {(sidebarOpen || mobileOpen) && <span>Voltar</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/[0.04] flex items-center justify-between px-4 lg:px-6 bg-[#050608]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#8C8F9A]">
              <Menu size={16} />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[12px] text-[#8C8F9A]">Admin</span>
              <ChevronRight size={12} className="text-[#8C8F9A]" />
              <span className="text-[12px] font-semibold text-white">
                {navItems.find(n => n.id === active)?.label || "Dashboard"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8F9A]" />
              <Input placeholder="Buscar..." className="pl-9 h-8 w-40 lg:w-56 bg-[#0A0A0C] border-white/10 text-white text-[12px] placeholder:text-[#8C8F9A] rounded-xl" />
            </div>
            <button className="relative w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#8C8F9A] hover:text-white">
              <Bell size={15} />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#D4A24C] rounded-full text-[8px] font-bold text-black flex items-center justify-center">3</span>
            </button>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="text-[11px] bg-[#D4A24C]/10 text-[#D4A24C] font-semibold">AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
              <Section />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

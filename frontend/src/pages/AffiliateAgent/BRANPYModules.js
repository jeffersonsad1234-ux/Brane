import React, { useState, useRef, useEffect } from "react";
import { useLocalStorage, useArray } from "../../hooks/useLocalStorage";

export function TopBar({ title, children }) {
  return (
    <div className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-sm">
      <h1 className="text-sm font-medium text-white/80">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function Btn({ children, onClick, primary, active, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
        primary
          ? "bg-emerald-500/80 hover:bg-emerald-500 text-white"
          : active
          ? "bg-white/10 text-white/80"
          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function ScrollArea({ children, className = "" }) {
  return <div className={`flex-1 overflow-y-auto scrollbar-thin ${className}`}>{children}</div>;
}

import VideoStudioEditor from "./VideoStudioEditor";
import CanvaEditor from "./CanvaEditor";
import PhotoshopEditor from "./PhotoshopEditor";
import EnhancedCalendar from "./EnhancedCalendar";
import CodeStudio from "./CodeStudio";
import StreamingStudioView from "./StreamingStudioView";
import LiveStudio from "./LiveStudio";
import TeamChatView from "./TeamChatView";
import NotesView from "./NotesView";
import TasksView from "./TasksView";
import CloudDriveView from "./CloudDriveView";
import FinanceHubView from "./FinanceHubView";
import EnhancedCRM from "./EnhancedCRM";
import EnhancedCodeGenerator from "./EnhancedCodeGenerator";
import EnhancedProjects from "./EnhancedProjects";
import EnhancedAnalytics from "./EnhancedAnalytics";
import AgentMarketplaceNew from "./AgentMarketplace";
import ImageStudioNew from "./ImageStudio";
import SiteBuilderNew from "./SiteBuilder";
import BrandStudioNew from "./BrandStudio";
import SocialPublisherNew from "./SocialPublisher";
import AutomationHubNew from "./AutomationHub";
import EcommerceNew from "./Ecommerce";
import TemplateLibraryNew from "./TemplateLibrary";
import VoiceStudioNew from "./VoiceStudio";
import TranscriptionAINew from "./TranscriptionAI";
import DocumentsAINew from "./DocumentsAI";
import MediaBankNew from "./MediaBank";
import MusicHubNew from "./MusicHub";
import AIAvatarsNew from "./AIAvatars";
import LeadsCenterNew from "./LeadsCenter";
import ReportsViewNew from "./ReportsView";
import InvoiceCenterNew from "./InvoiceCenter";
import SchedulePostsNew from "./SchedulePosts";
import SpreadsheetAINew from "./SpreadsheetAI";
import PresentationBuilderNew from "./PresentationBuilder";
import LogoStudioNew from "./LogoStudio";
import MockupStudioNew from "./MockupStudio";
import BannerStudioNew from "./BannerStudio";
import ThumbnailStudioNew from "./ThumbnailStudio";
import AIArtGeneratorNew from "./AIArtGenerator";
import PodcastStudioNew from "./PodcastStudio";
import SoundFXStudioNew from "./SoundFXStudio";
import AIDubStudioNew from "./AIDubStudio";
import WhiteboardViewNew from "./WhiteboardView";
import SubtitleStudioNew from "./SubtitleStudio";
import BrandKitsNew from "./BrandKits";
import AssetsManagerNew from "./AssetsManager";
import WorkspaceViewNew from "./WorkspaceView";
import MeetingsViewNew from "./MeetingsView";
import TemplatesHubNew from "./TemplatesHub";
import WebhooksViewNew from "./WebhooksView";
import Studio3DNew from "./Studio3D";

export function VideoStudio() { return <VideoStudioEditor />; }
export function CanvaEditorFn() { return <CanvaEditor />; }
export function PhotoshopEditorFn() { return <PhotoshopEditor />; }
export function CalendarViewFn() { return <EnhancedCalendar />; }
export function CodeStudioFn() { return <CodeStudio />; }
export function LiveStudioFn() { return <LiveStudio />; }
export function StreamingStudioViewFn() { return <StreamingStudioView />; }
export function TeamChatViewFn() { return <TeamChatView />; }
export function NotesViewFn() { return <NotesView />; }
export function TasksViewFn() { return <TasksView />; }
export function CloudDriveViewFn() { return <CloudDriveView />; }
export function FinanceHubViewFn() { return <FinanceHubView />; }
export function ImageStudio() { return <ImageStudioNew />; }
export function SiteBuilder() { return <SiteBuilderNew />; }
export function BrandStudio() { return <BrandStudioNew />; }
export function SocialPublisher() { return <SocialPublisherNew />; }
export function AutomationHub() { return <AutomationHubNew />; }
export function AgentMarketplace() { return <AgentMarketplaceNew />; }
export function LeadsCRM() { return <EnhancedCRM />; }
export function Ecommerce() { return <EcommerceNew />; }
export function AnalyticsAdvanced() { return <EnhancedAnalytics />; }
export function TemplateLibrary() { return <TemplateLibraryNew />; }
export function VoiceAI() { return <VoiceStudioNew />; }
export function TranscriptionAI() { return <TranscriptionAINew />; }
export function CodeGenerator() { return <EnhancedCodeGenerator />; }
export function DocumentsAI() { return <DocumentsAINew />; }
export function MediaBank() { return <MediaBankNew />; }
export function MusicHub() { return <MusicHubNew />; }
export function AIAvatars() { return <AIAvatarsNew />; }
export function Projects() { return <EnhancedProjects />; }
export function LeadsCenterFn() { return <LeadsCenterNew />; }
export function ReportsViewFn() { return <ReportsViewNew />; }
export function InvoiceCenterFn() { return <InvoiceCenterNew />; }
export function SchedulePostsFn() { return <SchedulePostsNew />; }
export function SpreadsheetAIFn() { return <SpreadsheetAINew />; }
export function PresentationBuilderFn() { return <PresentationBuilderNew />; }
export function LogoStudioFn() { return <LogoStudioNew />; }
export function MockupStudioFn() { return <MockupStudioNew />; }
export function BannerStudioFn() { return <BannerStudioNew />; }
export function ThumbnailStudioFn() { return <ThumbnailStudioNew />; }
export function AIArtGeneratorFn() { return <AIArtGeneratorNew />; }
export function PodcastStudioFn() { return <PodcastStudioNew />; }
export function SoundFXStudioFn() { return <SoundFXStudioNew />; }
export function AIDubStudioFn() { return <AIDubStudioNew />; }
export function WhiteboardViewFn() { return <WhiteboardViewNew />; }
export function SubtitleStudioFn() { return <SubtitleStudioNew />; }
export function BrandKitsFn() { return <BrandKitsNew />; }
export function AssetsManagerFn() { return <AssetsManagerNew />; }
export function WorkspaceViewFn() { return <WorkspaceViewNew />; }
export function MeetingsViewFn() { return <MeetingsViewNew />; }
export function TemplatesHubFn() { return <TemplatesHubNew />; }
export function WebhooksViewFn() { return <WebhooksViewNew />; }
export function Studio3DFn() { return <Studio3DNew />; }

export function IntegrationsPage() {
  const defaultConnections = {
    "OpenAI": true, "TikTok": true, "Instagram": false, "Shopee": true,
    "Amazon": false, "Railway": false, "YouTube": false, "Mercado Livre": false, "Vercel": false,
  };
  const [connections, setConnections] = useLocalStorage("integrations_connections", defaultConnections);

  const integrations = [
    { name: "OpenAI", icon: "🤖" },
    { name: "TikTok", icon: "🎵" },
    { name: "Instagram", icon: "📸" },
    { name: "Shopee", icon: "🛒" },
    { name: "Amazon", icon: "📦" },
    { name: "Railway", icon: "🚂" },
    { name: "YouTube", icon: "▶️" },
    { name: "Mercado Livre", icon: "📋" },
    { name: "Vercel", icon: "▲" },
  ];

  const toggleConnection = (name) => {
    setConnections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Integrações">
        <Btn primary>+ Adicionar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          {integrations.map((i) => {
            const connected = connections[i.name];
            return (
              <div key={i.name} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.04] transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{i.icon}</span>
                  <span className="text-sm text-white/70">{i.name}</span>
                </div>
                <button onClick={() => toggleConnection(i.name)} className={`text-[10px] px-2 py-1 rounded-lg transition-all ${connected ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-white/5 text-white/30 hover:bg-white/10"}`}>
                  {connected ? "Conectado" : "Conectar"}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export function PlansPage() {
  const [billing, setBilling] = useState("monthly");
  const [currentPlan, setCurrentPlan] = useLocalStorage("current_plan", null);

  const plans = [
    { name: "Free", price: "R$ 0", desc: "Teste a plataforma", features: ["50 créditos/mês", "Chat IA básico", "Importar produtos", "1 projeto"], popular: false },
    { name: "Pro", price: billing === "monthly" ? "R$ 49" : "R$ 39", desc: "Para profissionais", features: ["500 créditos/mês", "Chat IA completo", "Video Studio", "Automações", "10 projetos", "Suporte prioritário"], popular: true },
    { name: "Enterprise", price: billing === "monthly" ? "R$ 199" : "R$ 159", desc: "Para equipes", features: ["Créditos ilimitados", "Tudo do Pro", "Equipe até 10", "API dedicada", "Projetos ilimitados", "Onboarding personalizado"], popular: false },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Planos & Assinatura">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
          <button onClick={() => setBilling("monthly")} className={`px-3 py-1 text-[10px] rounded-md transition-all ${billing === "monthly" ? "bg-white/10 text-white/70" : "text-white/30"}`}>Mensal</button>
          <button onClick={() => setBilling("yearly")} className={`px-3 py-1 text-[10px] rounded-md transition-all ${billing === "yearly" ? "bg-white/10 text-white/70" : "text-white/30"}`}>Anual</button>
        </div>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.name;
            return (
              <div key={plan.name} className={`rounded-xl bg-white/[0.02] border p-5 relative ${plan.popular ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-white/[0.06]"} ${isCurrent ? "ring-2 ring-emerald-500/30" : ""}`}>
                {plan.popular && <div className="absolute -top-2.5 left-5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Mais popular</div>}
                {isCurrent && <div className="absolute -top-2.5 right-5 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Atual</div>}
                <div className="text-sm font-medium text-white/60">{plan.name}</div>
                <div className="text-2xl font-semibold text-white mt-2">{plan.price}<span className="text-xs text-white/20 font-normal">/mês</span></div>
                <div className="text-[10px] text-white/30 mt-1">{plan.desc}</div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-white/40 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-500/50" />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setCurrentPlan(plan.name)} className={`mt-5 w-full text-xs py-2 rounded-lg transition-all ${isCurrent ? "bg-emerald-500/20 text-emerald-400" : plan.popular ? "bg-emerald-500/80 text-white hover:bg-emerald-500" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>
                  {isCurrent ? "Assinatura Ativa" : plan.name === "Free" ? "Começar Grátis" : "Assinar"}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export function TeamPage() {
  const { items: members, add: addMember, remove: removeMember } = useArray("team_members", [
    { name: "Você", email: "admin@brane.app", role: "Owner", status: "Online" },
    { name: "Ana Silva", email: "ana@brane.app", role: "Editor", status: "Ausente" },
    { name: "Carlos Mendes", email: "carlos@brane.app", role: "Viewer", status: "Offline" },
  ]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const handleInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    addMember({ name: inviteName, email: inviteEmail, role: "Editor", status: "Offline" });
    setInviteName("");
    setInviteEmail("");
    setShowInvite(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Equipe">
        <Btn primary onClick={() => setShowInvite(true)}>Convidar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider">
              <span className="col-span-2">Membro</span><span>Função</span><span>Status</span>
            </div>
            {members.map((m, i) => (
              <div key={i} className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-white/[0.03] text-xs text-white/50 hover:bg-white/[0.02] items-center group">
                <div className="col-span-2 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">{m.name[0]}</div>
                  <div className="flex-1"><div className="text-white/70">{m.name}</div><div className="text-[10px] text-white/30">{m.email}</div></div>
                </div>
                <span className="text-white/40">{m.role}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${m.status === "Online" ? "text-emerald-400" : m.status === "Ausente" ? "text-amber-400" : "text-white/30"}`}>{m.status}</span>
                  {i > 0 && <button onClick={() => removeMember(i)} className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400/50 hover:text-red-400 ml-auto">×</button>}
                </div>
              </div>
            ))}
          </div>
          {showInvite && (
            <div className="mt-4 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Convidar Membro</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20" placeholder="Nome" />
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20" placeholder="Email" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleInvite} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Enviar Convite</button>
                <button onClick={() => setShowInvite(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useLocalStorage("app_settings", {
    Nome: "Admin",
    Email: "admin@brane.app",
    "Notificação Email": "Ativado",
    "Notificação Push": "Desativado",
    "OpenAI Key": "••••••••",
    "TikTok Key": "••••••••",
    "2FA": "Desativado",
    Sessões: "1 ativa",
  });

  const sections = [
    { section: "Perfil", fields: ["Nome", "Email"] },
    { section: "Notificações", fields: ["Notificação Email", "Notificação Push"] },
    { section: "API Keys", fields: ["OpenAI Key", "TikTok Key"] },
    { section: "Segurança", fields: ["2FA", "Sessões"] },
  ];

  const updateField = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Configurações" />
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {sections.map((s) => (
            <div key={s.section} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">{s.section}</div>
              {s.fields.map((f) => (
                <div key={f} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                  <span className="text-xs text-white/50">{f}</span>
                  <input value={settings[f] || ""} onChange={(e) => updateField(f, e.target.value)} className="text-xs text-white/30 bg-transparent border-b border-transparent hover:border-white/10 focus:border-white/20 outline-none text-right px-2 py-0.5 w-40" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function SupportPage() {
  const { items: tickets, add: addTicket } = useArray("support_tickets", [
    { subject: "Problema ao importar produto", status: "Aberto", date: "Hoje" },
    { subject: "Dúvida sobre plano Pro", status: "Respondido", date: "Ontem" },
    { subject: "Sugestão de nova feature", status: "Fechado", date: "3 dias" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const handleNewTicket = () => {
    if (!subject.trim()) return;
    addTicket({ subject, status: "Aberto", date: "Agora", description });
    setSubject("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Suporte">
        <Btn primary onClick={() => setShowForm(true)}>Novo Ticket</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 mb-6">
          {[
            { icon: "📖", title: "Base de Conhecimento", desc: "Guias, tutoriais e documentação" },
            { icon: "🎥", title: "Video Tutoriais", desc: "Aprenda visualmente" },
            { icon: "💬", title: "Chat Ao Vivo", desc: "Segunda a Sexta, 9h-18h" },
            { icon: "📧", title: "Email", desc: "Resposta em até 24h" },
          ].map((c) => (
            <div key={c.title} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.04] transition-all cursor-pointer">
              <div className="text-lg mb-2">{c.icon}</div>
              <div className="text-sm text-white/70">{c.title}</div>
              <div className="text-[10px] text-white/30 mt-1">{c.desc}</div>
            </div>
          ))}
        </div>
        <div className="max-w-3xl mx-auto rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Tickets Recentes</div>
          {tickets.length === 0 ? (
            <div className="text-center py-6 text-[10px] text-white/20">Nenhum ticket ainda. Crie um novo ticket.</div>
          ) : (
            tickets.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.03] text-xs">
                <span className="text-white/60">{t.subject}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${t.status === "Aberto" ? "text-amber-400" : t.status === "Respondido" ? "text-emerald-400" : "text-white/30"}`}>{t.status}</span>
                  <span className="text-white/20">{t.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
            <div onClick={(e) => e.stopPropagation()} className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl p-6 max-w-lg w-full mx-4">
              <div className="text-xs font-medium text-white/50 mb-3">Novo Ticket</div>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20 mb-3" placeholder="Assunto" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-24 bg-white/[0.03] border border-white/10 rounded p-3 text-xs text-white/60 outline-none focus:border-white/20 resize-none mb-3" placeholder="Descreva seu problema..." />
              <div className="flex gap-2">
                <button onClick={handleNewTicket} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Criar Ticket</button>
                <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

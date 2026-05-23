import React from "react";

function ModulePlaceholder({ icon, title, description, features }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d]">
      <div className="flex items-center px-6 h-14 border-b border-white/[0.06] flex-shrink-0">
        <h1 className="text-sm font-medium text-white/90">{title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-medium text-white/90">{title}</h2>
              <p className="text-sm text-white/40">{description}</p>
            </div>
          </div>
          {features && features.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div key={i} className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-xs text-white/60">{f}</div>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 py-6 rounded-xl bg-white/[0.02] border border-white/[0.06] border-dashed text-center">
            <p className="text-sm text-white/30">Em desenvolvimento. Em breve você poderá usar todas as funcionalidades diretamente aqui.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoStudio() {
  return <ModulePlaceholder icon="🎬" title="Video Studio" description="Editor de vídeo profissional com timeline, cortes, transições, legendas e exportação." features={["Timeline multi-track", "Cortes e transições", "Legendas automáticas AI", "Templates prontos", "Exportação MP4/HD", "Banco de trilhas"]} />;
}

export function ImageStudio() {
  return <ModulePlaceholder icon="🎨" title="Image Studio" description="Gerador e editor de imagens com IA: produtos, banners, thumbnails e criativos." features={["Gerar imagem IA", "Remover fundo", "Redimensionar", "Upscale HD", "Banners/capas", "Mockups 3D"]} />;
}

export function SiteBuilder() {
  return <ModulePlaceholder icon="🌐" title="Site & App Builder" description="Construtor de sites, landing pages, apps e dashboards com IA." features={["Gerar frontend completo", "Gerar backend API", "Preview ao vivo", "Exportar código", "Templates profissionais", "Deploy integrado"]} />;
}

export function BrandStudio() {
  return <ModulePlaceholder icon="✨" title="Brand Studio" description="Editor visual estilo Canva para posts, banners, logos e anúncios." features={["Posts redes sociais", "Banners e capas", "Logos e marcas", "Thumbnails YouTube", "Templates editáveis", "Exportação HD"]} />;
}

export function SocialPublisher() {
  return <ModulePlaceholder icon="📱" title="Social Publisher" description="Agende e publique conteúdo em múltiplas redes sociais automaticamente." features={["TikTok", "Instagram", "Facebook", "YouTube Shorts", "Kwai", "Agendamento"]} />;
}

export function AutomationHub() {
  return <ModulePlaceholder icon="⚡" title="Automation Hub" description="Crie fluxos de automação visuais: produto → copy → vídeo → publicação → análise." features={["Fluxos visuais", "Gatilhos e ações", "Execução automática", "Histórico completo", "Ciclos agendados", "Notificações"]} />;
}

export function AgentMarketplace() {
  return <ModulePlaceholder icon="🤖" title="Agent Marketplace" description="Crie, ative e gerencie agentes de IA especializados para cada tarefa." features={["Criar agente", "Duplicar agente", "Agente afiliado", "Agente social", "Agente vendas", "Agente vídeo"]} />;
}

export function LeadsCRM() {
  return <ModulePlaceholder icon="👥" title="Leads & CRM" description="Gerencie leads, contatos e pipeline de vendas com automação." features={["Pipeline visual", "Captura de leads", "Automação mensagens", "Etiquetas e filtros", "Histórico contatos", "Exportação CSV"]} />;
}

export function Ecommerce() {
  return <ModulePlaceholder icon="🛒" title="E-commerce / Loja" description="Loja virtual integrada com afiliados, pagamentos e gestão de produtos." features={["Catálogo produtos", "Carrinho compras", "Checkout", "Afiliados", "Gestão pedidos", "Relatórios"]} />;
}

export function AnalyticsAdvanced() {
  return <ModulePlaceholder icon="📈" title="Analytics Avançado" description="Dashboard completo com receita, tráfego, vendas, CTR e crescimento." features={["Receita total", "Tráfego e vendas", "CTR campanhas", "Crescimento", "Relatórios PDF", "Exportação dados"]} />;
}

export function TemplateLibrary() {
  return <ModulePlaceholder icon="📋" title="Biblioteca de Templates" description="Templates prontos para vídeos, imagens, posts, sites e documentos." features={["Vídeo templates", "Image templates", "Site templates", "Documentos", "Post redes sociais", "Importar template"]} />;
}

export function VoiceAI() {
  return <ModulePlaceholder icon="🎙️" title="Voz AI & Dublagem" description="Geração de voz realista, dublagem e narração com IA." features={["Texto para voz", "Múltiplas vozes", "Dublagem vídeo", "Narração", "PT-BR natural", "Exportação áudio"]} />;
}

export function TranscriptionAI() {
  return <ModulePlaceholder icon="📝" title="Transcrição AI" description="Transcreva áudio e vídeo para texto automaticamente." features={["Transcrição áudio", "Transcrição vídeo", "Múltiplos idiomas", "Legendas automáticas", "Exportação SRT/TXT", "Identificação falantes"]} />;
}

export function CodeGenerator() {
  return <ModulePlaceholder icon="💻" title="Gerador de Código" description="Gere código frontend, backend, scripts e componentes com IA." features={["React/Next.js", "Node/Python API", "Componentes UI", "Scripts automação", "SQL queries", "Exportar projeto"]} />;
}

export function DocumentsAI() {
  return <ModulePlaceholder icon="📄" title="Documentos AI" description="Crie, edite e gerencie documentos com assistência de IA." features={["Editor documentos", "Gerar texto AI", "Resumir conteúdo", "Reescrever", "Traduzir", "Exportar PDF/DOCX"]} />;
}

export function MediaBank() {
  return <ModulePlaceholder icon="🗂️" title="Banco de Mídia" description="Gerencie todas as suas mídias em um só lugar: imagens, vídeos, áudios." features={["Upload arquivos", "Organização pastas", "Busca inteligente", "Pré-visualização", "Compartilhar", "Armazenamento cloud"]} />;
}

export function MusicHub() {
  return <ModulePlaceholder icon="🎵" title="Músicas & Sons" description="Biblioteca de músicas, efeitos sonoros e trilhas para seus projetos." features={["Músicas royalty-free", "Efeitos sonoros", "Trilhas categorias", "Pré-visualização", "Favoritos", "Download WAV/MP3"]} />;
}

export function AIAvatars() {
  return <ModulePlaceholder icon="🧑‍🎤" title="AI Avatares" description="Crie avatares virtuais realistas para vídeos, apresentações e conteúdo." features={["Avatar realista", "Voz e expressão", "Apresentador virtual", "Vídeo com avatar", "Personalizar aparência", "Exportar vídeo"]} />;
}

export function Projects() {
  return <ModulePlaceholder icon="📁" title="Projetos" description="Organize todo seu trabalho em projetos com tarefas, prazos e colaboração." features={["Criar projeto", "Tarefas e checklist", "Prazos e metas", "Colaboradores", "Progresso", "Arquivos anexos"]} />;
}

export function IntegrationsPage() {
  return <ModulePlaceholder icon="🔌" title="Integrações" description="Conecte BRANPY com suas ferramentas favoritas: APIs, webhooks e serviços." features={["OpenAI API", "TikTok API", "Instagram API", "Shopee/Amazon", "Railway/Vercel", "Webhooks"]} />;
}

export function PlansPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d]">
      <div className="flex items-center px-6 h-14 border-b border-white/[0.06] flex-shrink-0">
        <h1 className="text-sm font-medium text-white/90">Planos & Assinatura</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white/90">Escolha seu plano</h2>
            <p className="text-sm text-white/40 mt-1">Comece grátis e evolua conforme sua necessidade</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
              <h3 className="text-sm font-medium text-white/70">Grátis</h3>
              <p className="text-2xl font-semibold text-white mt-2">R$ 0</p>
              <p className="text-xs text-white/30 mt-1">Teste a plataforma</p>
              <ul className="mt-4 space-y-2 text-xs text-white/50">
                <li>✓ 50 créditos/mês</li>
                <li>✓ Chat IA básico</li>
                <li>✓ Importar produtos</li>
                <li>✗ Video Studio</li>
                <li>✗ Automações</li>
              </ul>
            </div>
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5 relative">
              <span className="absolute -top-2.5 right-3 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Popular</span>
              <h3 className="text-sm font-medium text-white/70">Pro</h3>
              <p className="text-2xl font-semibold text-white mt-2">R$ 49</p>
              <p className="text-xs text-white/30 mt-1">/mês</p>
              <ul className="mt-4 space-y-2 text-xs text-white/50">
                <li>✓ 500 créditos/mês</li>
                <li>✓ Chat IA completo</li>
                <li>✓ Importar produtos</li>
                <li>✓ Video Studio</li>
                <li>✓ Automações</li>
              </ul>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
              <h3 className="text-sm font-medium text-white/70">Enterprise</h3>
              <p className="text-2xl font-semibold text-white mt-2">R$ 199</p>
              <p className="text-xs text-white/30 mt-1">/mês</p>
              <ul className="mt-4 space-y-2 text-xs text-white/50">
                <li>✓ Créditos ilimitados</li>
                <li>✓ Tudo do Pro</li>
                <li>✓ Equipe até 10</li>
                <li>✓ Prioridade suporte</li>
                <li>✓ API dedicada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeamPage() {
  return <ModulePlaceholder icon="👤" title="Equipe / Colaboradores" description="Gerencie sua equipe, convide colaboradores e defina permissões." features={["Convidar membros", "Permissões por módulo", "Histórico atividades", "Chat equipe", "Compartilhar projetos", "Limites uso"]} />;
}

export function SettingsPage() {
  return <ModulePlaceholder icon="⚙️" title="Configurações" description="Configure sua conta, preferências e integrações da plataforma." features={["Perfil e conta", "Notificações", "API Keys", "Preferências", "Segurança", "Exportar dados"]} />;
}

export function SupportPage() {
  return <ModulePlaceholder icon="❓" title="Suporte" description="Central de ajuda, documentação e suporte técnico da plataforma." features={["FAQ", "Base conhecimento", "Tutorial vídeos", "Chat suporte", "Reportar bug", "Sugerir melhoria"]} />;
}

import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { AffiliateAgent, NICHOS, PRODUTOS, PLATAFORMAS, PLATAFORMAS_POST, AGENDA } from "./AffiliateEngine";
import { loadConnections, saveConnections } from "../../services/affiliateProviders";
import { AutoPostEngine, SOCIAL_PLATFORMS, loadSocialConnections, saveSocialConnections } from "../../services/autoPostEngine";
import BrowserConnectionPanel from "../../components/BrowserConnectionPanel";
import VideoPreviewApproval from "../../components/VideoPreviewApproval";
import { getVozesDisponiveis } from "../../services/ttsEngine";
import "./AffiliateAgent.css";

function useAgent() {
  const [agent] = useState(() => new AffiliateAgent());
  return agent;
}

function Sidebar({ active }) {
  const navigate = useNavigate();
  return (
    <aside className="aa-sidebar">
      <div className="aa-sidebar-logo" onClick={() => navigate('/affiliate-agent')}>
        <span className="aa-logo-icon">⚡</span>
        <div>
          <span className="aa-logo-title">BRANE</span>
          <span className="aa-logo-sub">Affiliate Agent AI</span>
        </div>
      </div>
      <nav className="aa-sidebar-nav">
        <div className="aa-sidebar-label">Dashboard</div>
        <Link to="/affiliate-agent" className={`aa-sidebar-link ${active === 'dashboard' ? 'active' : ''}`}>📊 Visão Geral</Link>
        <Link to="/affiliate-agent/conexoes" className={`aa-sidebar-link ${active === 'conexoes' ? 'active' : ''}`}>🔗 Conexões</Link>
        <Link to="/affiliate-agent/aprendizado" className={`aa-sidebar-link ${active === 'aprendizado' ? 'active' : ''}`}>🧠 Aprendizado</Link>
        <Link to="/affiliate-agent/social-publish" className={`aa-sidebar-link ${active === 'social' ? 'active' : ''}`}>📱 Publicação Social</Link>
        <Link to="/affiliate-agent/criativos" className={`aa-sidebar-link ${active === 'criativos' ? 'active' : ''}`}>🎨 Criativos IA</Link>
        <Link to="/affiliate-agent/campanha" className={`aa-sidebar-link ${active === 'campanha' ? 'active' : ''}`}>🛒 Campanha Amazon</Link>
        <div className="aa-sidebar-label">Lojas Automáticas</div>
        {NICHOS.map(n => (
          <Link key={n.id} to={`/affiliate-agent/loja/${n.id}`} className={`aa-sidebar-link ${active === n.id ? 'active' : ''}`}>
            {n.icone} {n.nome}
          </Link>
        ))}
      </nav>
      <div className="aa-sidebar-footer">
        <span className="aa-version">v7.0.0 • Fase 3 — Automação por Navegador</span>
      </div>
    </aside>
  );
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="aa-stat" style={{ borderTopColor: color || '#2563eb' }}>
      <div className="aa-stat-header">
        <span className="aa-stat-icon">{icon}</span>
        <span className="aa-stat-label">{label}</span>
      </div>
      <span className="aa-stat-value">{value}</span>
      {sub && <span className="aa-stat-sub">{sub}</span>}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [agent] = useState(() => new AffiliateAgent());
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(agent.stats);
  const [logs, setLogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stores, setStores] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [cycleCount, setCycleCount] = useState(0);
  const [learning, setLearning] = useState(agent.learning);
  const [topProdutos, setTopProdutos] = useState({});
  const [topLojas, setTopLojas] = useState({});
  const [topPosts, setTopPosts] = useState([]);
  const [criativosStats, setCriativosStats] = useState(agent.criativosStats);

  const refresh = useCallback(() => {
    setStats(agent.stats);
    setLogs(agent.logs);
    setPosts(agent.allPosts);
    setStores(agent.stores);
    setScheduled(agent.scheduled);
    setRunning(agent.running);
    setCycleCount(agent.cycleCount);
    setLearning(agent.learning);
    setTopProdutos(agent.topProdutos);
    setTopLojas(agent.topLojas);
    setTopPosts(agent.topPosts);
    setCriativosStats(agent.criativosStats);
  }, [agent]);

  useEffect(() => {
    const iv = setInterval(refresh, 1000);
    refresh();
    return () => clearInterval(iv);
  }, [refresh]);

  const handleStart = () => { agent.start(); refresh(); };
  const handleStop = () => { agent.stop(); refresh(); };
  const handleExecutar = () => { agent.executarAgora(); setTimeout(refresh, 400); };

  const produtosArr = Object.values(topProdutos).filter(Boolean);
  const topByCliques = [...produtosArr].sort((a, b) => b.cliques - a.cliques).slice(0, 5);
  const topLojasArr = Object.values(topLojas).filter(Boolean);
  const lojasByVendas = [...topLojasArr].sort((a, b) => b.vendas - a.vendas);

  const publicados = posts.filter(p => p.publicado).length;
  const pendentes = posts.filter(p => !p.publicado).length;

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <h2>📊 Visão Geral</h2>
        <div className="aa-topbar-actions">
          <div className="aa-status">
            <span className={`aa-status-dot ${running ? 'running' : ''}`} />
            <span>{running ? 'Rodando' : 'Parado'}</span>
            <span className="aa-cycle-badge">Ciclo #{cycleCount}</span>
          </div>
          {!running ? (
            <button className="aa-btn aa-btn-primary" onClick={handleStart}>▶ Iniciar Trabalho</button>
          ) : (
            <button className="aa-btn aa-btn-danger" onClick={handleStop}>⏹ Parar Agent</button>
          )}
          <button className="aa-btn aa-btn-outline" onClick={handleExecutar}>⚡ Ciclo Único</button>
        </div>
      </div>

      <div className="aa-stats">
        <StatCard label="Lojas" value={stats.lojasCriadas} icon="🏪" color="#2563eb" sub={`${NICHOS.length - stats.lojasCriadas} restantes`} />
        <StatCard label="Produtos" value={stats.produtosEncontrados} icon="📦" color="#059669" />
        <StatCard label="Posts" value={stats.postsGerados} icon="📝" color="#d97706" sub={`${publicados} pub · ${pendentes} pend`} />
        <StatCard label="Links Pendentes" value={stats.linksAfiliadosPendentes} icon="🔗" color="#7c3aed" />
        <StatCard label="Cliques (mock)" value={stats.cliquesMock} icon="🖱️" color="#0891b2" />
        <StatCard label="CTR" value={`${stats.ctrMock.toFixed(1)}%`} icon="📈" color="#0d9488" />
        <StatCard label="Conversões" value={stats.conversaoMock} icon="✅" color="#84cc16" />
        <StatCard label="Comissão (mock)" value={`R$ ${stats.comissaoMock.toFixed(2)}`} icon="💰" color="#e11d48" />
        <StatCard label="Criativos IA" value={criativosStats.totalCriativos} icon="🎨" color="#8b5cf6" sub={`${criativosStats.thumbsGeradas} thumbs · ${criativosStats.videosGerados} vídeos`} />
      </div>

      <div className="aa-grid-3">
        <div className="aa-card">
          <h3 className="aa-card-title">🏆 Produtos Mais Acessados</h3>
          {topByCliques.length === 0 ? <p className="aa-muted">Aguardando dados...</p> : (
            <div className="aa-rank-list">
              {topByCliques.map((p, i) => (
                <div key={p.id || i} className="aa-rank-item">
                  <span className="aa-rank-pos">{i + 1}</span>
                  <span className="aa-rank-icon">{p.img}</span>
                  <div className="aa-rank-info">
                    <strong>{p.nome}</strong>
                    <span className="aa-rank-meta">{p.cliques} cliques · {p.conversoes} conv</span>
                  </div>
                  <span className="aa-rank-trend">{p.tendencia}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">🏪 Lojas por Vendas</h3>
          {lojasByVendas.length === 0 ? <p className="aa-muted">Aguardando dados...</p> : (
            <div className="aa-rank-list">
              {lojasByVendas.map((s, i) => (
                <div key={s.id} className="aa-rank-item" onClick={() => navigate(`/affiliate-agent/loja/${s.id}`)} style={{ cursor: 'pointer' }}>
                  <span className="aa-rank-pos">{i + 1}</span>
                  <span className="aa-rank-icon">{s.icone}</span>
                  <div className="aa-rank-info">
                    <strong>{s.nome}</strong>
                    <span className="aa-rank-meta">{s.vendas} vendas · {s.acessos} acessos</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">🔥 Posts Mais Virais</h3>
          {topPosts.length === 0 ? <p className="aa-muted">Aguardando dados...</p> : (
            <div className="aa-rank-list">
              {topPosts.slice(0, 5).map((p, i) => (
                <div key={p.id} className="aa-rank-item viral">
                  <span className="aa-rank-pos">{i + 1}</span>
                  <span className="aa-rank-icon">{p.plataforma === 'tiktok' ? '🎵' : p.plataforma === 'instagram' ? '📸' : p.plataforma === 'pinterest' ? '📌' : p.plataforma === 'x' ? '🐦' : p.plataforma === 'facebook' ? '📘' : '📱'}</span>
                  <div className="aa-rank-info">
                    <strong>{p.produto}</strong>
                    <span className="aa-rank-meta">{p.plataforma} · {p.cliques} cliques</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="aa-grid-2">
        <div className="aa-card">
          <h3 className="aa-card-title">📋 Logs Inteligentes</h3>
          <div className="aa-logs">
            {logs.length === 0 ? <p className="aa-muted">Nenhum log ainda.</p> : (
              logs.slice(0, 25).map((l, i) => (
                <div key={i} className={`aa-log aa-log-${l.tipo}`}>
                  <span className="aa-log-time">[{l.data}]</span>
                  <span>{l.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">📅 Próximos Posts Agendados</h3>
          {scheduled.filter(p => !p.publicado).length === 0 ? <p className="aa-muted">Nenhum post pendente.</p> : (
            <div className="aa-schedule-list">
              {scheduled.filter(p => !p.publicado).slice(0, 12).map(p => (
                <div key={p.id} className="aa-schedule-item">
                  <span className={`aa-schedule-icon plat-${p.plataforma}`}>
                    {p.plataforma === 'tiktok' ? '🎵' : p.plataforma === 'instagram' ? '📸' : p.plataforma === 'pinterest' ? '📌' : p.plataforma === 'x' ? '🐦' : p.plataforma === 'facebook' ? '📘' : '📱'}
                  </span>
                  <div className="aa-schedule-info">
                    <strong>{p.produto}</strong>
                    <span className="aa-schedule-meta">{p.plataforma} · {p.agendadoPara || 'sem horário'}</span>
                  </div>
                  <span className="aa-schedule-status">⏳ Pendente</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="aa-card">
        <h3 className="aa-card-title">📊 Distribuição de Agendamentos por Plataforma</h3>
        <div className="aa-chart-bars">
          {Object.entries(AGENDA).map(([plat, cfg]) => {
            const count = scheduled.filter(p => p.plataforma === plat && !p.publicado).length;
            return (
              <div key={plat} className="aa-chart-row">
                <span className="aa-chart-label">{plat === 'tiktok' ? '🎵' : plat === 'instagram' ? '📸' : plat === 'pinterest' ? '📌' : plat === 'x' ? '🐦' : plat === 'facebook' ? '📘' : '📱'} {plat}</span>
                <div className="aa-chart-bar-bg">
                  <div className="aa-chart-bar" style={{ width: `${Math.min((count / cfg.max) * 100, 100)}%` }} />
                </div>
                <span className="aa-chart-value">{count}/{cfg.max} {plat === 'pinterest' ? 'pins' : 'posts'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AprendizadoPage() {
  const navigate = useNavigate();
  const [agent] = useState(() => new AffiliateAgent());
  const [learning, setLearning] = useState(agent.learning);
  const [stats, setStats] = useState(agent.stats);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setLearning(agent.learning);
      setStats(agent.stats);
      setTotalPosts(agent.allPosts.length);
    }, 1000);
    return () => clearInterval(iv);
  }, [agent]);

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>🧠 Sistema de Aprendizado</h2>
        </div>
      </div>

      <div className="aa-grid-3">
        <div className="aa-card aa-card-learning">
          <h3 className="aa-card-title">🏆 Melhores Nichos</h3>
          {learning.melhoresNichos.length === 0 ? (
            <p className="aa-muted">O agente ainda não coletou dados suficientes.</p>
          ) : (
            <div className="aa-learn-list">
              {learning.melhoresNichos.map((n, i) => (
                <div key={i} className="aa-learn-item">
                  <span className="aa-rank-pos">{i + 1}</span>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card aa-card-learning">
          <h3 className="aa-card-title">🔥 Produtos Virais Detectados</h3>
          {learning.produtosVirais.length === 0 ? (
            <p className="aa-muted">Nenhum produto viral ainda.</p>
          ) : (
            <div className="aa-learn-list">
              {learning.produtosVirais.slice(0, 10).map((p, i) => (
                <div key={i} className="aa-learn-item viral">
                  <span>🔥</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card aa-card-learning">
          <h3 className="aa-card-title">⛔ Produtos com Baixo Desempenho</h3>
          {learning.produtosRuins.length === 0 ? (
            <p className="aa-muted">Nenhum produto marcado como ruim.</p>
          ) : (
            <div className="aa-learn-list">
              {learning.produtosRuins.slice(0, 5).map((p, i) => (
                <div key={i} className="aa-learn-item ruin">
                  <span>⛔</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="aa-grid-2">
        <div className="aa-card">
          <h3 className="aa-card-title">📈 Métricas de Aprendizado</h3>
          <div className="aa-metrics-grid">
            <div className="aa-metric-box">
              <span className="aa-metric-value">{stats.postsGerados}</span>
              <span className="aa-metric-label">Posts Analisados</span>
            </div>
            <div className="aa-metric-box">
              <span className="aa-metric-value">{learning.melhoresPosts.length}</span>
              <span className="aa-metric-label">Melhores Posts</span>
            </div>
            <div className="aa-metric-box">
              <span className="aa-metric-value">{learning.produtosVirais.length}</span>
              <span className="aa-metric-label">Produtos Virais</span>
            </div>
            <div className="aa-metric-box">
              <span className="aa-metric-value">{learning.produtosRuins.length}</span>
              <span className="aa-metric-label">Produtos em Risco</span>
            </div>
          </div>
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">💡 Como o Agente Aprende</h3>
          <ul className="aa-learn-list-desc">
            <li>📊 <strong>Analisa cliques</strong> — produtos com mais cliques são priorizados</li>
            <li>🔄 <strong>Identifica tendências</strong> — detecta padrões de alta conversão</li>
            <li>🏪 <strong>Avalia nichos</strong> — nichos com mais vendas ganham mais posts</li>
            <li>🔥 <strong>Posts virais</strong> — produtos com alto engajamento viral são replicados</li>
            <li>⛔ <strong>Produtos ruins</strong> — itens sem conversão são despriorizados</li>
            <li>📅 <strong>Agendamento inteligente</strong> — distribui posts conforme melhor horário</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StorePage() {
  const { nicho } = useParams();
  const navigate = useNavigate();
  const nichoData = NICHOS.find(n => n.id === nicho);
  const produtos = PRODUTOS[nicho] || [];

  if (!nichoData) return <Navigate to="/affiliate-agent" replace />;

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>{nichoData.icone} {nichoData.nome}</h2>
        </div>
        <span className="aa-status"><span className="aa-status-dot" /> Demo · Preparação</span>
      </div>

      <div className="aa-store-header">
        <div className="aa-store-banner" style={{ background: `linear-gradient(135deg, ${nichoData.cor}11, ${nichoData.cor}33)` }}>
          <span style={{ fontSize: '3rem' }}>{nichoData.icone}</span>
          <div>
            <h3>{nichoData.nome} — Loja Automática</h3>
            <p>{produtos.length} produtos em modo preparação · Todos com headline SEO e tags</p>
            <div className="aa-store-meta-tags">
              {gerarTags(nicho, { nome: nichoData.nome }).slice(0, 5).map((t, i) => (
                <span key={i} className="aa-tag">#{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="aa-products">
        {produtos.map((p, i) => {
          const headline = gerarHeadlineLocal(nicho, p.nome);
          return (
            <div key={i} className="aa-product-card">
              <div className="aa-product-img">{p.img}</div>
              <div className="aa-product-body">
                <h4>{p.nome}</h4>
                <p className="aa-product-headline">{headline}</p>
                <span className="aa-product-price">R$ {p.preco.toFixed(2)}</span>
                <div className="aa-product-tags">
                  {gerarTagsLocal(nicho, p.nome).slice(0, 3).map((t, j) => (
                    <span key={j} className="aa-tag aa-tag-sm">#{t}</span>
                  ))}
                </div>
                <div className="aa-product-footer">
                  <button className="aa-btn aa-btn-sm aa-btn-primary" disabled>Comprar</button>
                  <span className="aa-product-link-status">🔗 Aguardando afiliado</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function gerarHeadlineLocal(nicho, nome) {
  const map = {
    tecnologia: [`O ${nome} que está bombando!`, `${nome} com tecnologia de ponta`],
    casa: [`Transforme seu lar com ${nome}`, `${nome} para uma casa moderna`],
    beleza: [`Realce sua beleza com ${nome}`, `${nome} para cuidados premium`],
    gadgets: [`O gadget do momento: ${nome}`, `${nome} que vai facilitar sua vida`],
    gamer: [`Domine o jogo com ${nome}`, `${nome} para seu setup gamer`],
    fitness: [`Transforme seu treino com ${nome}`, `${nome} para resultados reais`],
    cozinha: [`O ${nome} que sua cozinha precisa`, `Receitas incríveis com ${nome}`],
    pets: [`Seu pet merece ${nome}`, `O ${nome} ideal para seu pet`],
  };
  const opts = map[nicho] || [nome];
  return opts[nome.length % opts.length];
}

function gerarTagsLocal(nicho, nome) {
  return ['oferta', 'promoção', nicho, nome.split(' ')[0].toLowerCase()];
}

function CreativesPage() {
  const navigate = useNavigate();
  const [agent] = useState(() => new AffiliateAgent());
  const [media, setMedia] = useState(agent.mediaLibrary);
  const [cStats, setCStats] = useState(agent.criativosStats);
  const [ab, setAb] = useState(agent.abTests);
  const [melhorThumb, setMelhorThumb] = useState(agent.melhorThumbnail);
  const [topProd, setTopProd] = useState({});

  useEffect(() => {
    const iv = setInterval(() => {
      setMedia(agent.mediaLibrary);
      setCStats(agent.criativosStats);
      setAb(agent.abTests);
      setMelhorThumb(agent.melhorThumbnail);
      setTopProd(agent.topProdutos);
    }, 1000);
    return () => clearInterval(iv);
  }, [agent]);

  const totalCriativos = cStats.totalCriativos;
  const thumbs = media.thumbnails || [];
  const banners = media.banners || [];
  const stories = media.stories || [];
  const videos = media.videos || [];
  const produtosArr = Object.values(topProd).filter(Boolean);
  const viralProd = [...produtosArr].sort((a, b) => b.viralScore - a.viralScore).slice(0, 3);

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>🎨 Criativos IA</h2>
        </div>
        <span className="aa-status"><span className="aa-status-dot" /> {totalCriativos} criativos gerados</span>
      </div>

      <div className="aa-stats">
        <StatCard label="Thumbnails" value={cStats.thumbsGeradas} icon="🖼️" color="#8b5cf6" />
        <StatCard label="Banners" value={cStats.bannersGerados} icon="📢" color="#f59e0b" />
        <StatCard label="Stories" value={cStats.storiesGeradas} icon="📱" color="#ec4899" />
        <StatCard label="Vídeos Mock" value={cStats.videosGerados} icon="🎬" color="#ef4444" />
      </div>

      <div className="aa-grid-3">
        <div className="aa-card">
          <h3 className="aa-card-title">🖼️ Thumbnails Geradas</h3>
          {thumbs.length === 0 ? <p className="aa-muted">Nenhuma thumbnail ainda.</p> : (
            <div className="aa-criativos-list">
              {thumbs.slice(0, 6).map(t => (
                <div key={t.id} className="aa-criativo-card">
                  <div className="aa-criativo-preview" style={{ background: t.cor, color: '#fff' }}>
                    <span style={{ fontSize: '2rem' }}>{t.produtoNome.split(' ').length > 2 ? t.produtoNome.split(' ').slice(0, 2).join(' ') : t.produtoNome}</span>
                  </div>
                  <div className="aa-criativo-info">
                    <strong>{t.estilo}</strong>
                    <span className="aa-criativo-meta">⭐ {t.rating} · {t.vendas} vendas</span>
                    <span className="aa-criativo-ctr">CTR: {(t.ctr || 0).toFixed(1)}% · {t.cliques} cliques</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {melhorThumb && <div className="aa-criativo-best">🏆 Melhor estilo: <strong>{melhorThumb}</strong></div>}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">📢 Banners Promocionais</h3>
          {banners.length === 0 ? <p className="aa-muted">Nenhum banner ainda.</p> : (
            <div className="aa-criativos-list">
              {banners.slice(0, 6).map(b => (
                <div key={b.id} className="aa-criativo-card">
                  <div className="aa-criativo-banner" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d1b69)', color: '#fff' }}>
                    <span className="aa-criativo-banner-text">{b.headline}</span>
                    <span className="aa-criativo-banner-offer">{b.oferta}</span>
                    <span className="aa-criativo-banner-cta">{b.cta}</span>
                  </div>
                  <div className="aa-criativo-info">
                    <strong>{b.produtoNome}</strong>
                    <span className="aa-criativo-meta">{b.estilo} · {b.dimensao}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">🎬 Vídeos Mock</h3>
          {videos.length === 0 ? <p className="aa-muted">Nenhum vídeo ainda.</p> : (
            <div className="aa-criativos-list">
              {videos.slice(0, 4).map(v => (
                <div key={v.id} className="aa-video-card">
                  <div className="aa-video-preview" style={{ background: 'linear-gradient(135deg, #0f0f23, #1a0a2e)' }}>
                    <span className="aa-video-hook">"{v.roteiro.hook.slice(0, 50)}..."</span>
                    <div className="aa-video-badge">{v.roteiro.duracao} · {v.roteiro.cortes} cortes</div>
                  </div>
                  <div className="aa-video-body">
                    <strong>{v.produtoNome}</strong>
                    <span className="aa-criativo-meta">{v.formato} · 🎬 {v.roteiro.estiloEdicao}</span>
                    <span className="aa-criativo-meta">👤 {v.roteiro.pessoa} · {v.roteiro.vibe}</span>
                    <div className="aa-video-scores">
                      <span className="aa-score" style={{ background: v.roteiro.score.hook >= 9 ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)' }}>
                        🎯 Hook: <strong>{v.roteiro.score.hook}</strong>
                      </span>
                      <span className="aa-score" style={{ background: v.roteiro.score.viralizacao >= 9 ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)' }}>
                        🔥 Viral: <strong>{v.roteiro.score.viralizacao}</strong>
                      </span>
                      <span className="aa-score" style={{ background: v.roteiro.score.cta >= 9 ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)' }}>
                        🛒 CTA: <strong>{v.roteiro.score.cta}</strong>
                      </span>
                    </div>
                    <span className="aa-video-conversion">Conversão estimada: <strong>{v.roteiro.score.conversaoEstimada}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="aa-grid-2">
        <div className="aa-card">
          <h3 className="aa-card-title">🧪 Testes A/B — Thumbnails</h3>
          {ab.length === 0 ? <p className="aa-muted">Nenhum teste A/B ainda.</p> : (
            <div className="aa-ab-list">
              {ab.slice(0, 5).map(test => (
                <div key={test.id} className="aa-ab-item">
                  <strong className="aa-ab-produto">{test.produtoNome}</strong>
                  <div className="aa-ab-variants">
                    {test.variantes.map((v, i) => (
                      <div key={i} className={`aa-ab-variant ${v.estilo === test.vencedor ? 'winner' : ''}`}>
                        <span>{v.estilo}</span>
                        <span className="aa-ab-ctr">CTR: {v.ctr.toFixed(1)}%</span>
                        <span className="aa-ab-cliques">{v.cliques} cliques</span>
                        {v.estilo === test.vencedor && <span className="aa-ab-winner">🏆</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">🔥 Produtos com Criativos Mais Virais</h3>
          {viralProd.length === 0 ? <p className="aa-muted">Aguardando dados...</p> : (
            <div className="aa-rank-list">
              {viralProd.map((p, i) => (
                <div key={p.id || i} className="aa-rank-item viral">
                  <span className="aa-rank-pos">{i + 1}</span>
                  <span className="aa-rank-icon">{p.img}</span>
                  <div className="aa-rank-info">
                    <strong>{p.nome}</strong>
                    <span className="aa-rank-meta">Viral Score: {(p.viralScore * 100).toFixed(0)}% · {p.cliques} cliques</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialPublishPage() {
  const navigate = useNavigate();
  const [engine] = useState(() => new AutoPostEngine());
  const [modo, setModo] = useState('navegador');
  const [connections, setConnections] = useState(() => {
    const saved = loadSocialConnections();
    return SOCIAL_PLATFORMS.map(p => ({
      ...p,
      ...(saved?.[p.id] || {}),
      status: saved?.[p.id]?.status || 'desconectado',
      token: saved?.[p.id]?.token || '',
      pageId: saved?.[p.id]?.pageId || '',
      accountName: saved?.[p.id]?.accountName || '',
    }));
  });
  const [schedule, setSchedule] = useState([]);
  const [published, setPublished] = useState([]);
  const [failed, setFailed] = useState([]);
  const [stats, setStats] = useState(engine.stats);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setSchedule(engine.schedule);
      setPublished(engine.published);
      setFailed(engine.failed);
      setStats(engine.stats);
      setRunning(engine.running);
    }, 1000);
    return () => clearInterval(iv);
  }, [engine]);

  useEffect(() => {
    const map = {};
    connections.forEach(c => {
      map[c.id] = { status: c.status, token: c.token || '', pageId: c.pageId || '', accountName: c.accountName || '' };
    });
    saveSocialConnections(map);
  }, [connections]);

  const updateField = (id, field, value) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    engine.setConnection(id, { [field]: value });
  };

  const handleConectar = (id) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, status: 'conectado' } : c));
    engine.setConnection(id, { status: 'conectado' });
  };

  const handleDesconectar = (id) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, status: 'desconectado', token: '', pageId: '', accountName: '' } : c));
    engine.disconnect(id);
  };

  const handleStartPub = () => {
    engine.startAutoPublish(30000);
  };

  const handleStopPub = () => {
    engine.stopAutoPublish();
  };

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>📱 Publicação Social Automática</h2>
        </div>
        <div className="aa-topbar-actions">
          <div className="aa-status">
            <span className={`aa-status-dot ${running ? 'running' : ''}`} />
            <span>{running ? 'Publicando' : 'Parado'}</span>
          </div>
          {!running ? (
            <button className="aa-btn aa-btn-primary" onClick={handleStartPub}>▶ Iniciar Publicação</button>
          ) : (
            <button className="aa-btn aa-btn-danger" onClick={handleStopPub}>⏹ Parar</button>
          )}
        </div>
      </div>

      <div className="aa-stats">
        <StatCard label="Programados" value={stats.totalProgramados} icon="📅" color="#2563eb" />
        <StatCard label="Publicados" value={stats.totalPublicados} icon="✅" color="#059669" />
        <StatCard label="Falhas" value={stats.totalFalhas} icon="❌" color="#dc2626" />
        <StatCard label="Plataformas Ativas" value={stats.totalPlataformas} icon="🔗" color="#7c3aed" />
      </div>

      <div className="aa-mode-tabs">
        <button className={`aa-mode-tab ${modo === 'navegador' ? 'active' : ''}`} onClick={() => setModo('navegador')}>
          🌐 Navegador Logado
        </button>
        <button className={`aa-mode-tab ${modo === 'api' ? 'active' : ''}`} onClick={() => setModo('api')}>
          🔌 API Oficial
        </button>
        <button className={`aa-mode-tab ${modo === 'assistida' ? 'active' : ''}`} onClick={() => setModo('assistida')}>
          🤝 Conexão Assistida
        </button>
      </div>

      {modo === 'navegador' && (
        <div className="aa-browser-connections">
          {SOCIAL_PLATFORMS.map(p => (
            <BrowserConnectionPanel key={p.id} plataforma={p.id} onPublishConfirm={() => {}} />
          ))}
        </div>
      )}

      {modo === 'api' && (
        <div className="aa-connect-section">
          <h3>🔌 API Oficial — Conectar Redes Sociais</h3>
          <div className="aa-connect-grid">
            {connections.map(p => (
              <div key={p.id} className="aa-connect-card">
                <div className="aa-connect-header">
                  <span className="aa-connect-icon">{p.icone}</span>
                  <h4>{p.nome}</h4>
                  <span className={`aa-connect-status ${p.status === 'conectado' ? 'connected' : ''}`}>{p.status === 'conectado' ? 'Conectado' : 'Desconectado'}</span>
                </div>
                <div className="aa-connect-body">
                  <label>Token de Acesso</label>
                  <input className="aa-input" type="text" placeholder="Token da API" value={p.token || ''} onChange={e => updateField(p.id, 'token', e.target.value)} />
                  <label style={{ marginTop: 8 }}>Page / Account ID</label>
                  <input className="aa-input" type="text" placeholder="ID da página/conta" value={p.pageId || ''} onChange={e => updateField(p.id, 'pageId', e.target.value)} />
                  <label style={{ marginTop: 8 }}>Nome da Conta</label>
                  <input className="aa-input" type="text" placeholder="Nome para identificação" value={p.accountName || ''} onChange={e => updateField(p.id, 'accountName', e.target.value)} />
                  <p className="aa-connect-aviso">Limite: {p.maxDiario}/{p.maxDiario} posts/dia · Intervalo mínimo {p.intervaloMin}min</p>
                </div>
                <div className="aa-connect-footer">
                  {p.status === 'conectado' ? (
                    <button className="aa-btn aa-btn-sm aa-btn-danger" onClick={() => handleDesconectar(p.id)}>Desconectar</button>
                  ) : (
                    <button className="aa-btn aa-btn-sm aa-btn-primary" onClick={() => handleConectar(p.id)}>Conectar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modo === 'assistida' && (
        <div className="aa-connect-section">
          <h3>🤝 Conexão Assistida</h3>
          <div className="aa-assistida-card">
            <p>Configure o agente para operar semi-autonomamente com supervisão. O agente prepara os posts e você revisa antes de publicar.</p>
            <ul>
              <li>✅ Agente gera título, legenda, hashtags e CTA</li>
              <li>👁️ Você revisa antes de cada publicação</li>
              <li>📅 Posts preparados no agendamento abaixo</li>
              <li>🚀 Publique manualmente quando aprovar</li>
            </ul>
            <p className="aa-connect-aviso" style={{ marginTop: 12 }}>Nenhum post é publicado sem sua aprovação explícita.</p>
          </div>
        </div>
      )}

      <div className="aa-grid-3">
        <div className="aa-card">
          <h3 className="aa-card-title">📅 Próximos Posts</h3>
          {schedule.filter(s => s.status === 'agendado').length === 0 ? (
            <p className="aa-muted">Nenhum post agendado. Inicie o agente para gerar posts.</p>
          ) : (
            <div className="aa-social-list">
              {schedule.filter(s => s.status === 'agendado').slice(0, 8).map(s => (
                <div key={s.id} className="aa-social-item">
                  <span className="aa-social-icon">{s.plataforma === 'tiktok' ? '🎵' : s.plataforma === 'instagram' ? '📸' : s.plataforma === 'pinterest' ? '📌' : s.plataforma === 'facebook' ? '📘' : '▶️'}</span>
                  <div className="aa-social-info">
                    <strong>{s.titulo.slice(0, 30)}...</strong>
                    <span className="aa-social-meta">{s.plataforma} · {new Date(s.agendadoPara).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">✅ Publicados Recentemente</h3>
          {published.length === 0 ? (
            <p className="aa-muted">Nenhum post publicado ainda.</p>
          ) : (
            <div className="aa-social-list">
              {published.slice(0, 8).map(s => (
                <div key={s.id} className="aa-social-item published">
                  <span className="aa-social-icon">{s.plataforma === 'tiktok' ? '🎵' : s.plataforma === 'instagram' ? '📸' : s.plataforma === 'pinterest' ? '📌' : s.plataforma === 'facebook' ? '📘' : '▶️'}</span>
                  <div className="aa-social-info">
                    <strong>{s.titulo.slice(0, 30)}...</strong>
                    <span className="aa-social-meta">👁️ {s.visualizacoes} · 🖱️ {s.cliques} cliques</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">❌ Falhas</h3>
          {failed.length === 0 ? (
            <p className="aa-muted">Nenhuma falha registrada.</p>
          ) : (
            <div className="aa-social-list">
              {failed.slice(0, 5).map(f => (
                <div key={f.id} className="aa-social-item failed">
                  <span className="aa-social-icon">❌</span>
                  <div className="aa-social-info">
                    <strong>{f.titulo?.slice(0, 30) || 'Post'}</strong>
                    <span className="aa-social-meta">{f.motivo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConexoesPage() {
  const navigate = useNavigate();
  const [conexoes, setConexoes] = useState(() => {
    const saved = loadConnections();
    if (saved) {
      return PLATAFORMAS.map(p => ({
        ...p,
        ...(saved[p.id] || {}),
        status: saved[p.id]?.status || 'desconectado',
      }));
    }
    return PLATAFORMAS.map(p => ({ ...p, status: 'desconectado', apiKey: '', token: '', affiliateId: '', trackingId: '' }));
  });

  useEffect(() => {
    const map = {};
    conexoes.forEach(c => {
      map[c.id] = {
        status: c.status, apiKey: c.apiKey || '', token: c.token || '',
        affiliateId: c.affiliateId || '', trackingId: c.trackingId || '',
      };
    });
    saveConnections(map);
  }, [conexoes]);

  const updateField = (id, field, value) => {
    setConexoes(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleConectar = (id) => {
    setConexoes(prev => prev.map(c => c.id === id ? { ...c, status: 'conectado' } : c));
  };

  const handleDesconectar = (id) => {
    setConexoes(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'desconectado', apiKey: '', token: '', affiliateId: '', trackingId: '' } : c
    ));
  };

  const afiliados = conexoes.filter(c => ['shopee', 'amazon', 'mercado-livre', 'aliexpress'].includes(c.id));
  const sociais = conexoes.filter(c => ['tiktok', 'instagram', 'pinterest', 'x', 'kwai', 'facebook'].includes(c.id));

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>🔗 Conexões</h2>
        </div>
      </div>

      <div className="aa-connect-info">
        <span>💾 Dados salvos no navegador (localStorage). Preparado para migração futura para banco de dados.</span>
      </div>

      <div className="aa-connect-section">
        <h3>🛒 Plataformas de Afiliados</h3>
        <div className="aa-connect-grid">
          {afiliados.map(p => (
            <div key={p.id} className="aa-connect-card">
              <div className="aa-connect-header">
                <span className="aa-connect-icon">{p.icone}</span>
                <h4>{p.nome}</h4>
                <span className={`aa-connect-status ${p.status === 'conectado' ? 'connected' : ''}`}>{p.status === 'conectado' ? 'Conectado' : 'Desconectado'}</span>
              </div>
              <div className="aa-connect-body">
                <label>API Key</label>
                <input className="aa-input" type="text" placeholder="Chave da API" value={p.apiKey || ''} onChange={e => updateField(p.id, 'apiKey', e.target.value)} />
                <label style={{ marginTop: 8 }}>Token</label>
                <input className="aa-input" type="text" placeholder="Token de acesso" value={p.token || ''} onChange={e => updateField(p.id, 'token', e.target.value)} />
                <label style={{ marginTop: 8 }}>Affiliate ID</label>
                <input className="aa-input" type="text" placeholder="ID de afiliado" value={p.affiliateId || ''} onChange={e => updateField(p.id, 'affiliateId', e.target.value)} />
                <label style={{ marginTop: 8 }}>Tracking ID</label>
                <input className="aa-input" type="text" placeholder="ID de rastreamento" value={p.trackingId || ''} onChange={e => updateField(p.id, 'trackingId', e.target.value)} />
                <p className="aa-connect-aviso">Use apenas tokens oficiais. Arquitetura preparada para banco de dados.</p>
              </div>
              <div className="aa-connect-footer">
                {p.status === 'conectado' ? (
                  <button className="aa-btn aa-btn-sm aa-btn-danger" onClick={() => handleDesconectar(p.id)}>Desconectar</button>
                ) : (
                  <button className="aa-btn aa-btn-sm aa-btn-primary" onClick={() => handleConectar(p.id)}>Conectar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="aa-connect-section">
        <h3>📱 Redes Sociais</h3>
        <div className="aa-connect-grid">
          {sociais.map(p => (
            <div key={p.id} className="aa-connect-card">
              <div className="aa-connect-header">
                <span className="aa-connect-icon">{p.icone}</span>
                <h4>{p.nome}</h4>
                <span className={`aa-connect-status ${p.status === 'conectado' ? 'connected' : ''}`}>{p.status === 'conectado' ? 'Conectado' : 'Desconectado'}</span>
              </div>
              <div className="aa-connect-body">
                <label>API Key</label>
                <input className="aa-input" type="text" placeholder="Chave da API" value={p.apiKey || ''} onChange={e => updateField(p.id, 'apiKey', e.target.value)} />
                <label style={{ marginTop: 8 }}>Token</label>
                <input className="aa-input" type="text" placeholder="Token de acesso" value={p.token || ''} onChange={e => updateField(p.id, 'token', e.target.value)} />
                <label style={{ marginTop: 8 }}>Affiliate ID</label>
                <input className="aa-input" type="text" placeholder="ID de afiliado" value={p.affiliateId || ''} onChange={e => updateField(p.id, 'affiliateId', e.target.value)} />
                <label style={{ marginTop: 8 }}>Tracking ID</label>
                <input className="aa-input" type="text" placeholder="ID de rastreamento" value={p.trackingId || ''} onChange={e => updateField(p.id, 'trackingId', e.target.value)} />
                <p className="aa-connect-aviso">Use OAuth oficial. Prepare sua arquitetura de banco.</p>
              </div>
              <div className="aa-connect-footer">
                {p.status === 'conectado' ? (
                  <button className="aa-btn aa-btn-sm aa-btn-danger" onClick={() => handleDesconectar(p.id)}>Desconectar</button>
                ) : (
                  <button className="aa-btn aa-btn-sm aa-btn-primary" onClick={() => handleConectar(p.id)}>Conectar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CampanhaPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({
    nome: '',
    link: '',
    preco: '',
    categoria: 'tecnologia',
    descricao: '',
    imagem: '',
    lojaDestino: 'minha-loja',
  });
  const [campaign, setCampaign] = useState(null);
  const [video, setVideo] = useState(null);
  const [realVideoUrl, setRealVideoUrl] = useState(null);
  const [realVideoBlob, setRealVideoBlob] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStatus, setGenStatus] = useState('');
  const [voiceId, setVoiceId] = useState('pt-BR-FranciscaNeural');
  const [voiceStatus, setVoiceStatus] = useState('pending');
  const [videoLegenda, setVideoLegenda] = useState('');
  const [videoRoteiro, setVideoRoteiro] = useState('');
  const [campLogs, setCampLogs] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [publicado, setPublicado] = useState(null);

  const vozes = getVozesDisponiveis();

  const categorias = [
    { id: 'tecnologia', nome: 'Tecnologia', icone: '💻' },
    { id: 'casa', nome: 'Casa', icone: '🏠' },
    { id: 'beleza', nome: 'Beleza', icone: '💄' },
    { id: 'gadgets', nome: 'Gadgets', icone: '📱' },
    { id: 'gamer', nome: 'Gamer', icone: '🎮' },
    { id: 'fitness', nome: 'Fitness', icone: '💪' },
    { id: 'cozinha', nome: 'Cozinha', icone: '🍳' },
    { id: 'pets', nome: 'Pets', icone: '🐾' },
  ];

  const addLog = (tipo, msg) => {
    const log = { tipo, msg, data: new Date().toLocaleTimeString('pt-BR'), timestamp: Date.now() };
    setCampLogs(prev => [log, ...prev]);
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const generateSlug = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const generateCampanha = async () => {
    addLog('info', '🛒 Iniciando criação da campanha...');

    const precoNum = parseFloat(form.preco);
    if (!form.nome.trim() || !form.link.trim() || isNaN(precoNum)) {
      addLog('error', '❌ Preencha nome, link e preço corretamente');
      return;
    }

    const storeSlug = generateSlug(form.lojaDestino || form.nome);
    const lojaUrl = `https://brane.app/loja/${storeSlug}`;
    const prodId = `camp_${Date.now()}`;

    const titulo = form.nome;
    const legenda = `${form.nome} com frete grátis!\n💰 R$ ${precoNum.toFixed(2)} na promoção!\n🔗 Link na bio!\n\nAproveite essa oportunidade imperdível!`;
    const descricao = form.descricao || `${form.nome} — produto original de alta qualidade. Aproveite o frete grátis e condições especiais.`;
    const hashtagsArr = [
      `#${form.nome.split(' ')[0].toLowerCase()}`,
      '#amazon', '#oferta', '#promoção', '#fretegrátis',
      '#imperdível', '#compreagora', '#top',
    ];

    const hooks = [
      `🔥 ${form.nome} COM DESCONTO IMPERDÍVEL!`,
      `💰 O ${form.nome} MAIS BARATO DA WEB!`,
      `⚡ ${form.nome} — CORRE QUE É POR TEMPO LIMITADO!`,
    ];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];

    const cenario = categorias.find(c => c.id === form.categoria) || categorias[0];

    const camp = {
      id: prodId,
      nome: titulo,
      link: form.link,
      preco: precoNum,
      categoria: form.categoria,
      descricao,
      imagem: form.imagem || '📦',
      lojaDestino: form.lojaDestino,
      lojaUrl,
      titulo: titulo,
      legenda,
      hashtags: hashtagsArr,
      hook,
      cenario: cenario.icone + ' ' + cenario.nome,
      criadoEm: new Date().toISOString(),
    };

    setCampaign(camp);
    setVideoLegenda(legenda);
    setStep('aprovacao');
    setRealVideoUrl(null);
    setRealVideoBlob(null);

    addLog('success', `✅ Loja criada: ${lojaUrl}`);
    addLog('success', `✅ Produto adicionado: ${form.nome}`);
    addLog('info', '⏳ Gerando vídeo real com apresentador...');

    // Generate real video
    setGenerating(true);
    setGenProgress(0);
    setGenStatus('Gerando narração...');
    setVoiceStatus('generating');

    try {
      const { generateRealVideo } = await import("../../services/realVideoGenerator");
      const result = await generateRealVideo(camp, (pct, status) => {
        setGenProgress(pct);
        if (status) setGenStatus(status);
      }, voiceId);

      setVideo(result.videoMeta);
      setVideoRoteiro(result.videoMeta.narracaoCompleta);

      if (result.voiceStatus === 'generated') {
        setVoiceStatus('generated');
        addLog('success', `🎤 Voz gerada: ${vozes.find(v => v.id === voiceId)?.nome || voiceId}`);
      } else if (result.voiceStatus === 'failed') {
        setVoiceStatus('failed');
        addLog('warn', '⚠️ Voz não gerada — vídeo será apenas com música');
      }

      if (result.url) {
        setRealVideoUrl(result.url);
        setRealVideoBlob(result.blob);
        addLog('success', `✅ Vídeo MP4 real gerado: ${result.videoMeta.duracao}s · ${result.videoMeta.resolucao} · ${result.videoMeta.cortesRapidos} cortes`);
        addLog('info', '⏳ Assista, edite se necessário e aprove para publicar');
      } else {
        addLog('error', `❌ Falha na renderização do vídeo: ${result.error || 'erro desconhecido'}`);
      }
    } catch (err) {
      addLog('error', `❌ Erro ao gerar vídeo: ${err.message}`);
      setVoiceStatus('failed');
    }

    setGenerating(false);
    setGenStatus('');
  };

  const handleRegenerate = async () => {
    if (!campaign) return;
    addLog('info', '🔄 Gerando nova versão do vídeo...');
    setRealVideoUrl(null);
    setRealVideoBlob(null);
    setGenerating(true);
    setGenProgress(0);
    setGenStatus('Gerando narração...');
    setVoiceStatus('generating');

    try {
      const { regenerateRealVideo } = await import("../../services/realVideoGenerator");
      const result = await regenerateRealVideo(campaign, video, (pct, status) => {
        setGenProgress(pct);
        if (status) setGenStatus(status);
      }, voiceId);

      setVideo(result.videoMeta);
      setVideoRoteiro(result.videoMeta.narracaoCompleta);

      if (result.voiceStatus === 'generated') {
        setVoiceStatus('generated');
      } else if (result.voiceStatus === 'failed') {
        setVoiceStatus('failed');
      }

      if (result.url) {
        setRealVideoUrl(result.url);
        setRealVideoBlob(result.blob);
        addLog('success', `✅ Novo vídeo gerado: ${result.videoMeta.duracao}s · roteiro diferente · nova cena`);
      } else {
        addLog('warn', '⚠️ Regenerado metadados, mas render falhou');
      }
    } catch (err) {
      addLog('error', `❌ Erro: ${err.message}`);
      setVoiceStatus('failed');
    }

    setGenerating(false);
    setGenStatus('');
    addLog('info', '⏳ Vídeo ainda não publicado. Aprove para publicar.');
  };

  const handleChangeVoice = (newVoiceId) => {
    setVoiceId(newVoiceId);
    addLog('info', `🎤 Voz alterada para: ${newVoiceId}`);
  };

  const handleRegenerateVoice = async () => {
    if (!campaign || !video) return;
    if (!realVideoUrl && !generating) {
      // No video yet, just regenerate the whole thing
      addLog('info', '🔄 Gerando vídeo com nova voz...');
      setVoiceStatus('generating');
      setGenerating(true);
      setGenProgress(0);
      setGenStatus('Gerando narração...');

      try {
        const { generateRealVideo } = await import("../../services/realVideoGenerator");
        const result = await generateRealVideo(campaign, (pct, status) => {
          setGenProgress(pct);
          if (status) setGenStatus(status);
        }, voiceId);

        setVideo(result.videoMeta);
        setVideoRoteiro(result.videoMeta.narracaoCompleta);

        if (result.voiceStatus === 'generated') {
          setVoiceStatus('generated');
          addLog('success', '🎤 Nova narração gerada com sucesso');
        } else {
          setVoiceStatus('failed');
          addLog('warn', '⚠️ Falha ao gerar nova voz');
        }

        if (result.url) {
          setRealVideoUrl(result.url);
          setRealVideoBlob(result.blob);
          addLog('success', '✅ Vídeo atualizado com nova voz');
        }
      } catch (err) {
        addLog('error', `❌ Erro: ${err.message}`);
        setVoiceStatus('failed');
      }

      setGenerating(false);
      setGenStatus('');
    }
  };

  const handleReject = () => {
    addLog('warn', '⏹️ Campanha rejeitada');
    setCampaign(null);
    setVideo(null);
    setStep('form');
  };

  const handleEditLegenda = (novaLegenda) => {
    setVideoLegenda(novaLegenda);
    if (campaign) setCampaign(prev => ({ ...prev, legenda: novaLegenda }));
    addLog('info', '✏️ Legenda editada');
  };

  const handleEditRoteiro = (novoRoteiro) => {
    setVideoRoteiro(novoRoteiro);
    if (video) setVideo(prev => ({ ...prev, narracaoCompleta: novoRoteiro }));
    addLog('info', '✏️ Roteiro editado');
  };

  const handleApprove = async () => {
    if (!campaign) return;

    if (!realVideoUrl) {
      addLog('error', '❌ Gere e aprove um vídeo antes de publicar.');
      return;
    }

    setPublishing(true);
    addLog('info', '✅ Campanha aprovada');

    const { BrowserAutomator } = await import("../../services/browserAutomation");
    const bot = new BrowserAutomator('tiktok');

    if (!bot.logado) {
      addLog('error', '❌ TikTok não conectado — vá em Publicação Social e conecte primeiro');
      setPublishing(false);
      return;
    }

    const campanhaFinal = { ...campaign, legenda: videoLegenda };
    addLog('info', '🚀 Publicando no TikTok...');
    const result = await bot.publicarCampanha(campanhaFinal);

    if (result.success) {
      addLog('success', `✅ Publicado no TikTok: ${result.postUrl}`);
      addLog('success', `🔗 Link da loja: ${campaign.lojaUrl}`);
      setPublicado({ postUrl: result.postUrl, lojaUrl: campaign.lojaUrl, nome: campaign.nome });
      setStep('publicado');
    } else {
      addLog('error', `❌ Falha na publicação: ${result.motivo || result.error}`);
    }

    setPublishing(false);
  };

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>🛒 Campanha Amazon Manual</h2>
        </div>
      </div>

      <div className="aa-connect-info">
        <span>Adicione um produto manualmente com link de afiliado Amazon, gere um vídeo real de divulgação e publique no TikTok conectado.</span>
      </div>

      {step === 'form' && (
        <>
          <div className="aa-camp-form">
            <div className="full-width">
              <label>Nome do Produto</label>
              <input className="aa-input" type="text" placeholder="Ex: Fone Bluetooth X200" value={form.nome} onChange={e => updateField('nome', e.target.value)} />
            </div>

            <div>
              <label>Link Afiliado Amazon</label>
              <input className="aa-input" type="text" placeholder="https://amzn.to/..." value={form.link} onChange={e => updateField('link', e.target.value)} />
            </div>

            <div>
              <label>Preço (R$)</label>
              <input className="aa-input" type="number" step="0.01" min="0" placeholder="99.90" value={form.preco} onChange={e => updateField('preco', e.target.value)} />
            </div>

            <div>
              <label>Categoria</label>
              <select className="aa-input" value={form.categoria} onChange={e => updateField('categoria', e.target.value)}>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
              </select>
            </div>

            <div className="full-width">
              <label>Descrição Curta</label>
              <textarea className="aa-input" placeholder="Descrição natural do produto..." value={form.descricao} onChange={e => updateField('descricao', e.target.value)} />
            </div>

            <div>
              <label>Imagem / Thumbnail</label>
              <input className="aa-input" type="text" placeholder="🔗 URL da imagem ou emoji" value={form.imagem} onChange={e => updateField('imagem', e.target.value)} />
            </div>

            <div>
              <label>Loja Destino</label>
              <input className="aa-input" type="text" placeholder="minha-loja" value={form.lojaDestino} onChange={e => updateField('lojaDestino', e.target.value)} />
            </div>
          </div>

          <div className="aa-camp-actions">
            <button className="aa-btn aa-btn-primary" onClick={generateCampanha} style={{ fontSize: '0.95rem', padding: '12px 28px' }}>
              🚀 Criar campanha teste
            </button>
          </div>

          {campLogs.length > 0 && (
            <div className="aa-card">
              <h3 className="aa-card-title">📋 Logs</h3>
              <div className="aa-camp-logs">
                {campLogs.map((l, i) => (
                  <div key={i} className={`aa-camp-log ${l.tipo}`}>
                    <span className="time">{l.data}</span>
                    {l.msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {step === 'aprovacao' && campaign && (
        <>
          {!realVideoUrl && !generating && (
            <div className="vp-error">⚠️ Nenhum vídeo gerado. Gere um vídeo antes de publicar.</div>
          )}

          <div className="aa-camp-queue">
            <VideoPreviewApproval
              video={video}
              realVideoUrl={realVideoUrl}
              legenda={videoLegenda}
              hashtags={campaign.hashtags}
              campaign={campaign}
              publishing={publishing}
              generating={generating}
              genProgress={genProgress}
              genStatus={genStatus}
              voiceStatus={voiceStatus}
              voiceId={voiceId}
              onApprove={handleApprove}
              onReject={handleReject}
              onRegenerate={handleRegenerate}
              onEditLegenda={handleEditLegenda}
              onEditRoteiro={handleEditRoteiro}
              onChangeVoice={handleChangeVoice}
              onRegenerateVoice={handleRegenerateVoice}
            />
          </div>

          <div className="aa-card" style={{ marginTop: 20 }}>
            <h3 className="aa-card-title">📋 Logs da Campanha</h3>
            <div className="aa-camp-logs">
              {campLogs.map((l, i) => (
                <div key={i} className={`aa-camp-log ${l.tipo}`}>
                  <span className="time">{l.data}</span>
                  {l.msg}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {step === 'publicado' && publicado && (
        <>
          <div className="aa-camp-success">
            <strong>✅ Campanha publicada com sucesso!</strong>
            <p style={{ margin: '6px 0', fontSize: '0.85rem' }}>📹 <strong>Produto:</strong> {publicado.nome}</p>
            <p style={{ margin: '6px 0', fontSize: '0.85rem' }}>🎵 <strong>Post no TikTok:</strong> <a href={publicado.postUrl} target="_blank" rel="noopener noreferrer">{publicado.postUrl}</a></p>
            <p style={{ margin: '6px 0', fontSize: '0.85rem' }}>🔗 <strong>Loja:</strong> <a href={publicado.lojaUrl} target="_blank" rel="noopener noreferrer">{publicado.lojaUrl}</a></p>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button className="aa-btn aa-btn-outline" onClick={() => { setStep('form'); setCampaign(null); setVideo(null); setPublicado(null); setCampLogs([]); }}>
              📦 Nova Campanha
            </button>
            <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>
              ← Dashboard
            </button>
          </div>

          <div className="aa-card" style={{ marginTop: 20 }}>
            <h3 className="aa-card-title">📋 Histórico da Campanha</h3>
            <div className="aa-camp-logs">
              {campLogs.map((l, i) => (
                <div key={i} className={`aa-camp-log ${l.tipo}`}>
                  <span className="time">{l.data}</span>
                  {l.msg}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AffiliateAgentApp() {
  return (
    <div className="aa-root">
      <Routes>
        <Route path="/" element={<><Sidebar active="dashboard" /><Dashboard /></>} />
        <Route path="/loja/:nicho" element={<><Sidebar active={null} /><StorePage /></>} />
        <Route path="/conexoes" element={<><Sidebar active="conexoes" /><ConexoesPage /></>} />
        <Route path="/aprendizado" element={<><Sidebar active="aprendizado" /><AprendizadoPage /></>} />
        <Route path="/criativos" element={<><Sidebar active="criativos" /><CreativesPage /></>} />
        <Route path="/campanha" element={<><Sidebar active="campanha" /><CampanhaPage /></>} />
        <Route path="/social-publish" element={<><Sidebar active="social" /><SocialPublishPage /></>} />
        <Route path="*" element={<Navigate to="/affiliate-agent" replace />} />
      </Routes>
    </div>
  );
}

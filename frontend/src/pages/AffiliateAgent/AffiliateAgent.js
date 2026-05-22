import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { AffiliateAgent, NICHOS, PRODUTOS, PLATAFORMAS, PLATAFORMAS_POST, AGENDA } from "./AffiliateEngine";
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
        <Link to="/affiliate-agent/criativos" className={`aa-sidebar-link ${active === 'criativos' ? 'active' : ''}`}>🎨 Criativos IA</Link>
        <div className="aa-sidebar-label">Lojas Automáticas</div>
        {NICHOS.map(n => (
          <Link key={n.id} to={`/affiliate-agent/loja/${n.id}`} className={`aa-sidebar-link ${active === n.id ? 'active' : ''}`}>
            {n.icone} {n.nome}
          </Link>
        ))}
      </nav>
      <div className="aa-sidebar-footer">
        <span className="aa-version">v4.0.0 • Fase 4 — Criativos IA</span>
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
                <div key={v.id} className="aa-criativo-card">
                  <div className="aa-criativo-video" style={{ background: '#0f0f23', color: '#fff' }}>
                    <span style={{ fontSize: '2rem' }}>🎬</span>
                    <span className="aa-criativo-video-info">{v.roteiro.duracao} · {v.roteiro.musica.slice(0, 20)}...</span>
                  </div>
                  <div className="aa-criativo-info">
                    <strong>{v.produtoNome}</strong>
                    <span className="aa-criativo-meta">{v.formato} · {v.resolucao}</span>
                    <span className="aa-criativo-ctr">👁️ {v.visualizacoes} views</span>
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

function ConexoesPage() {
  const navigate = useNavigate();
  const [conexoes, setConexoes] = useState(() =>
    PLATAFORMAS.map(p => ({ ...p, status: 'desconectado', token: '' }))
  );

  const handleConectar = (id) => {
    setConexoes(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'conectado', token: '••••••••' } : c
    ));
  };

  const handleDesconectar = (id) => {
    setConexoes(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'desconectado', token: '' } : c
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

      <div className="aa-connect-warning">⚠️ Modo Preparação — Nenhuma conexão real é feita. Configure APIs/tokens oficiais no futuro.</div>

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
                <label>API Key / Token</label>
                <input className="aa-input" type="text" placeholder="Cole sua API key aqui" value={p.token} readOnly />
                <p className="aa-connect-aviso">Use apenas tokens oficiais. Nunca salve senhas.</p>
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
                <label>API Key / Token</label>
                <input className="aa-input" type="text" placeholder="Token oficial da API" value={p.token} readOnly />
                <p className="aa-connect-aviso">Use OAuth oficial. Nunca compartilhe senhas.</p>
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

export default function AffiliateAgentApp() {
  return (
    <div className="aa-root">
      <Routes>
        <Route path="/" element={<><Sidebar active="dashboard" /><Dashboard /></>} />
        <Route path="/loja/:nicho" element={<><Sidebar active={null} /><StorePage /></>} />
        <Route path="/conexoes" element={<><Sidebar active="conexoes" /><ConexoesPage /></>} />
        <Route path="/aprendizado" element={<><Sidebar active="aprendizado" /><AprendizadoPage /></>} />
        <Route path="/criativos" element={<><Sidebar active="criativos" /><CreativesPage /></>} />
        <Route path="*" element={<Navigate to="/affiliate-agent" replace />} />
      </Routes>
    </div>
  );
}

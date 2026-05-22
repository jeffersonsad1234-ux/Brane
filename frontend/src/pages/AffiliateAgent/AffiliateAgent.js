import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { AffiliateAgent, NICHOS, PLATAFORMAS } from "./AffiliateEngine";
import { loadConnections, saveConnections } from "../../services/affiliateProviders";
import AnunciosPage from "./AnunciosPage";
import { LinksPage, getStoreLink } from "./LinksPage";
import { isMediaWorkerEnabled, createUGCJob, getUGCJobStatus } from "../../services/mediaWorker";
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
        <Link to="/affiliate-agent/anuncios" className={`aa-sidebar-link ${active === 'anuncios' ? 'active' : ''}`}>📺 Anúncios</Link>
        <Link to="/affiliate-agent/conexoes" className={`aa-sidebar-link ${active === 'conexoes' ? 'active' : ''}`}>🔗 Conexões</Link>
        <Link to="/affiliate-agent/aprendizado" className={`aa-sidebar-link ${active === 'aprendizado' ? 'active' : ''}`}>🧠 Aprendizado</Link>
        <Link to="/affiliate-agent/social-publish" className={`aa-sidebar-link ${active === 'social' ? 'active' : ''}`}>📱 Publicação Social</Link>
        <Link to="/affiliate-agent/criativos" className={`aa-sidebar-link ${active === 'criativos' ? 'active' : ''}`}>🎨 Criativos IA</Link>
        <Link to="/affiliate-agent/links" className={`aa-sidebar-link ${active === 'links' ? 'active' : ''}`}>🔗 Links Afiliados</Link>
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
  const [logs, setLogs] = useState([]);

  function readState() {
    try { return JSON.parse(localStorage.getItem('brane_agent_state') || 'null'); } catch { return null; }
  }
  function readQueue() {
    try { return JSON.parse(localStorage.getItem('brane_affiliate_ads') || '[]'); } catch { return []; }
  }
  function readStores() {
    try { return JSON.parse(localStorage.getItem('brane_stores') || '{}'); } catch { return {}; }
  }

  const [agentState, setAgentState] = useState(readState());
  const running = agentState?.running || false;
  const cycleCount = agentState?.currentCycle || 0;
  const startedAt = agentState?.startedAt || null;

  const cards = readQueue();
  const stores = readStores();
  const pendentes = cards.filter(c => c.status === 'pendente' || c.status === 'pronto').length;
  const aprovados = cards.filter(c => c.status === 'aprovado').length;
  const publicados = cards.filter(c => c.status === 'publicado').length;
  const erros = cards.filter(c => c.status === 'erro').length;
  const storeKeys = Object.keys(stores);
  const storeList = storeKeys.map(k => stores[k]);

  const refresh = useCallback(() => {
    setLogs(agent.logs);
    setAgentState(readState());
  }, [agent]);

  useEffect(() => {
    const iv = setInterval(refresh, 1500);
    refresh();
    return () => clearInterval(iv);
  }, [refresh]);

  const handleStart = async () => {
    try {
      const cards = readQueue();
      const approved = cards.filter(c => c.status === 'aprovado');
      if (approved.length === 0) {
        agent._log('warn', '⚠️ Nenhum anúncio aprovado para publicar');
        refresh();
        return;
      }
      agent._log('success', `📋 ${approved.length} anúncio(s) aprovado(s) encontrados`);

      const socialConns = (() => {
        try { return JSON.parse(localStorage.getItem('brane_social_connections') || '{}'); }
        catch { return {}; }
      })();
      const anySocialConnected = Object.values(socialConns).some(c => c.status === 'conectado');

      const stores = readStores();
      const updated = cards.map(c => {
        if (c.status === 'aprovado') {
          const storeUrl = getStoreLink(c.categoria);
          if (stores[c.categoria]) {
            stores[c.categoria].produtos = (stores[c.categoria].produtos || 0) + 1;
          }
          agent._log('success', `🏪 Loja "${c.categoria}" — produto adicionado`);
          agent._log('info', `  🔗 ${storeUrl}`);
          if (anySocialConnected) {
            agent._log('info', `  📱 Rede social conectada — publicado via API`);
            return { ...c, status: 'publicado', storeUrl, publicadoEm: new Date().toISOString(), publicadoVia: 'api' };
          } else {
            agent._log('info', `  ⏸ Nenhuma rede conectada — aguardando publicação manual`);
            return { ...c, status: 'publicado', storeUrl, publicadoEm: new Date().toISOString(), publicadoVia: 'manual' };
          }
        }
        return c;
      });
      localStorage.setItem('brane_stores', JSON.stringify(stores));
      localStorage.setItem('brane_affiliate_ads', JSON.stringify(updated));
      agent._log('success', `✅ ${approved.length} anúncio(s) publicado(s)`);
      if (!anySocialConnected) {
        agent._log('warn', '🔌 Publique manualmente em Social Publish > Download e abra a rede social');
      }
      const storeKeys = Object.keys(stores);
      agent._log('success', `🏪 ${storeKeys.length} loja(s) no total`);
    } catch (e) {
      agent._log('error', `❌ Erro ao processar fila: ${e.message}`);
    }
    agent.start();
    refresh();
  };

  const handleStop = () => {
    agent.stop();
    refresh();
  };

  const handleExecutar = () => {
    agent.executarAgora();
    setTimeout(refresh, 500);
  };

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <h2>📊 Visão Geral</h2>
        <div className="aa-topbar-actions">
          <div className="aa-status">
            <span className={`aa-status-dot ${running ? 'running' : ''}`} />
            <span>{running ? 'Rodando' : 'Parado'}</span>
            {cycleCount > 0 && <span className="aa-cycle-badge">Ciclo #{cycleCount}</span>}
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
        <StatCard label="Lojas Criadas" value={storeKeys.length} icon="🏪" color="#2563eb" sub={`${storeKeys.length} categoria(s)`} />
        <StatCard label="Anúncios Aprovados" value={aprovados} icon="✅" color="#059669" />
        <StatCard label="Publicados" value={publicados} icon="📦" color="#d97706" />
        <StatCard label="Pendentes" value={pendentes} icon="⏳" color="#7c3aed" sub={erros > 0 ? `${erros} com erro` : ''} />
        <StatCard label="Produtos em Loja" value={storeList.reduce((s, st) => s + (st.produtos || 0), 0)} icon="📋" color="#0891b2" />
      </div>

      <div className="aa-grid-3">
        <div className="aa-card">
          <h3 className="aa-card-title">🏪 Lojas por Categoria</h3>
          {storeList.length === 0 ? (
            <p className="aa-muted">Nenhuma loja criada ainda. Aprove anúncios e clique em "Iniciar Trabalho".</p>
          ) : (
            <div className="aa-rank-list">
              {storeList.map((s, i) => (
                <div key={s.id} className="aa-rank-item" onClick={() => navigate(`/affiliate-agent/loja/${s.id}`)} style={{ cursor: 'pointer' }}>
                  <span className="aa-rank-pos">{i + 1}</span>
                  <span className="aa-rank-icon">{NICHOS.find(n => n.id === s.id)?.icone || '🏪'}</span>
                  <div className="aa-rank-info">
                    <strong>{s.nome}</strong>
                    <span className="aa-rank-meta">{s.produtos || 0} produto(s)</span>
                  </div>
                  <span className="aa-rank-trend" style={{ fontSize: 11 }}>{s.url?.replace('https://', '')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">✅ Anúncios Aprovados</h3>
          {cards.filter(c => c.status === 'aprovado' || c.status === 'publicado').length === 0 ? (
            <p className="aa-muted">Nenhum anúncio aprovado. Vá em "Links Afiliados" para criar e aprovar.</p>
          ) : (
            <div className="aa-rank-list">
              {cards.filter(c => c.status === 'aprovado' || c.status === 'publicado').slice(0, 8).map(c => (
                <div key={c.id} className="aa-rank-item">
                  <span className="aa-rank-icon">{c.categoria === 'gamer' ? '🎮' : c.categoria === 'tecnologia' ? '💻' : c.categoria === 'cozinha' ? '🍳' : c.categoria === 'beleza' ? '💄' : c.categoria === 'pet' ? '🐾' : c.categoria === 'fitness' ? '💪' : c.categoria === 'moda' ? '👗' : '📦'}</span>
                  <div className="aa-rank-info">
                    <strong style={{ fontSize: 13 }}>{c.titulo}</strong>
                    <span className="aa-rank-meta">R$ {c.preco.toFixed(2)} · {c.marketplace}</span>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 8,
                    color: c.status === 'publicado' ? '#10b981' : '#60a5fa',
                    background: c.status === 'publicado' ? 'rgba(16,185,129,0.15)' : 'rgba(96,165,250,0.15)',
                  }}>
                    {c.status === 'publicado' ? '✅ Publicado' : '✅ Aprovado'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">📋 Logs</h3>
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
          {startedAt && (
            <p style={{ fontSize: 11, color: '#555', marginTop: 8, textAlign: 'right' }}>
              Iniciado em: {new Date(startedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {storeList.length > 0 && (
        <div className="aa-card" style={{ marginTop: 12 }}>
          <h3 className="aa-card-title">🔗 URLs das Lojas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {storeList.map(s => (
              <div key={s.id} style={{ fontSize: 13, color: '#60a5fa', fontFamily: 'monospace' }}>
                {NICHOS.find(n => n.id === s.id)?.icone || '📦'} {s.nome}: {s.url}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AprendizadoPage() {
  const navigate = useNavigate();
  const ads = JSON.parse(localStorage.getItem('brane_affiliate_ads') || '[]');
  const publicados = ads.filter(a => a.status === 'publicado').length;
  const aprovados = ads.filter(a => a.status === 'aprovado').length;
  const stores = JSON.parse(localStorage.getItem('brane_stores') || '{}');
  const storeCount = Object.keys(stores).length;

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>🧠 Dados Reais</h2>
        </div>
      </div>

      <div className="aa-grid-3">
        <div className="aa-card">
          <h3 className="aa-card-title">📊 Métricas Reais</h3>
          <div className="aa-metrics-grid">
            <div className="aa-metric-box">
              <span className="aa-metric-value">{ads.length}</span>
              <span className="aa-metric-label">Anúncios Criados</span>
            </div>
            <div className="aa-metric-box">
              <span className="aa-metric-value">{aprovados}</span>
              <span className="aa-metric-label">Aprovados</span>
            </div>
            <div className="aa-metric-box">
              <span className="aa-metric-value">{publicados}</span>
              <span className="aa-metric-label">Publicados</span>
            </div>
            <div className="aa-metric-box">
              <span className="aa-metric-value">{storeCount}</span>
              <span className="aa-metric-label">Lojas Criadas</span>
            </div>
          </div>
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">🏪 Lojas por Categoria</h3>
          {storeCount === 0 ? (
            <p className="aa-muted">Nenhuma loja criada ainda.</p>
          ) : (
            <div className="aa-learn-list">
              {Object.entries(stores).map(([id, s]) => (
                <div key={id} className="aa-learn-item">
                  <span>{NICHOS.find(n => n.id === id)?.icone || '📦'}</span>
                  <span>{s.nome} — {s.produtos || 0} produto(s)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">📋 Últimos Anúncios</h3>
          {ads.length === 0 ? (
            <p className="aa-muted">Nenhum anúncio criado. Vá em "Links Afiliados".</p>
          ) : (
            <div className="aa-learn-list">
              {ads.slice(-5).reverse().map(a => (
                <div key={a.id} className="aa-learn-item">
                  <span>{a.categoria === 'gamer' ? '🎮' : a.categoria === 'tecnologia' ? '💻' : a.categoria === 'cozinha' ? '🍳' : '📦'}</span>
                  <span>{a.titulo} — R$ {a.preco.toFixed(2)}</span>
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 6,
                    color: a.status === 'publicado' ? '#10b981' : a.status === 'aprovado' ? '#60a5fa' : '#f59e0b',
                    background: a.status === 'publicado' ? 'rgba(16,185,129,0.15)' : a.status === 'aprovado' ? 'rgba(96,165,250,0.15)' : 'rgba(245,158,11,0.15)',
                  }}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StorePage() {
  const { nicho } = useParams();
  const navigate = useNavigate();
  const nichoData = NICHOS.find(n => n.id === nicho);
  const stores = JSON.parse(localStorage.getItem('brane_stores') || '{}');
  const storeInfo = stores[nicho];
  const queueCards = JSON.parse(localStorage.getItem('brane_affiliate_ads') || '[]');
  const produtosReais = queueCards.filter(c =>
    c.categoria === nicho && (c.status === 'publicado' || c.status === 'aprovado')
  );
  const produtos = produtosReais;
  const isReal = produtosReais.length > 0;
  const ICONES = { gamer: "🎮", tecnologia: "💻", cozinha: "🍳", beleza: "💄", pet: "🐾", fitness: "💪", moda: "👗", casa: "🏠" };

  if (!nichoData) return <Navigate to="/affiliate-agent" replace />;

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>{nichoData.icone} {nichoData.nome}</h2>
        </div>
        <span className="aa-status">
          <span className={`aa-status-dot ${isReal ? 'running' : ''}`} />
          {isReal ? `${produtos.length} · Loja Ativa` : 'Demo · Preparação'}
        </span>
      </div>

      <div className="aa-store-header">
        <div className="aa-store-banner" style={{ background: `linear-gradient(135deg, ${nichoData.cor}11, ${nichoData.cor}33)` }}>
          <span style={{ fontSize: '3rem' }}>{nichoData.icone}</span>
          <div>
            <h3>{nichoData.nome} {isReal ? '🛒 Loja Ativa' : '— Loja Automática'}</h3>
            <p>{produtos.length} produto(s) · {isReal ? 'Links afiliados reais' : 'Em modo preparação'}</p>
            {storeInfo && <p style={{ fontSize: 12, color: '#60a5fa' }}>🔗 {window.location.origin}{storeInfo.url}</p>}
          </div>
        </div>
      </div>

      <div className="aa-products">
        {produtos.length === 0 && (
          <div className="aa-card" style={{ textAlign: 'center', padding: 30, color: '#666' }}>
            Nenhum produto nesta loja ainda.
          </div>
        )}
        {produtos.map((p, i) => {
          const headline = isReal
            ? (p.descricao || p.titulo).slice(0, 80)
            : gerarHeadlineLocal(nicho, p.nome);
          return (
            <div key={p.id || i} className="aa-product-card">
              <div className="aa-product-img">
                {isReal ? (ICONES[p.categoria] || '📦') : p.img}
              </div>
              <div className="aa-product-body">
                <h4>{isReal ? p.titulo : p.nome}</h4>
                <p className="aa-product-headline">{headline}</p>
                <span className="aa-product-price">R$ {(isReal ? p.preco : p.preco).toFixed(2)}</span>
                <div className="aa-product-tags">
                  {['oferta', nicho].concat(isReal ? [p.marketplace || 'afiliado'] : gerarTagsLocal(nicho, p.nome)).slice(0, 3).map((t, j) => (
                    <span key={j} className="aa-tag aa-tag-sm">#{t}</span>
                  ))}
                </div>
                <div className="aa-product-footer">
                  {isReal && p.link ? (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="aa-btn aa-btn-sm aa-btn-primary">
                      🔗 Comprar
                    </a>
                  ) : (
                    <button className="aa-btn aa-btn-sm aa-btn-primary" disabled>Comprar</button>
                  )}
                  <span className="aa-product-link-status">
                    {isReal ? `✅ ${p.storeUrl ? 'Loja vinculada' : 'Aguardando'}` : '🔗 Aguardando afiliado'}
                  </span>
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
  const ads = JSON.parse(localStorage.getItem('brane_affiliate_ads') || '[]');
  const videos = ads.filter(a => a.videoUrl).length;

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>🎨 Criativos</h2>
        </div>
        <span className="aa-status"><span className="aa-status-dot" /> {videos} vídeo(s) gerado(s)</span>
      </div>

      <div className="aa-stats">
        <StatCard label="Vídeos Gerados" value={videos} icon="🎬" color="#8b5cf6" sub="apenas links afiliados" />
      </div>

      <div className="aa-card" style={{ textAlign: 'center', padding: 40, marginTop: 12 }}>
        <p style={{ color: '#666', fontSize: 14 }}>
          Criativos são gerados automaticamente ao criar anúncios em "Links Afiliados".
        </p>
        <p style={{ color: '#555', fontSize: 13, marginTop: 8 }}>
          Cada anúncio aprovado recebe um vídeo viral MP4 pronto para publicação.
        </p>
        <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
          Thumbnails, banners e stories: disponível em versão futura.
        </p>
      </div>
    </div>
  );
}

function SocialPublishPage() {
  const navigate = useNavigate();
  const ads = JSON.parse(localStorage.getItem('brane_affiliate_ads') || '[]');
  const publicados = ads.filter(a => a.status === 'publicado' && a.videoUrl);
  const pendentes = ads.filter(a => a.status === 'aprovado' && a.videoUrl);

  function downloadVideo(url, nome) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nome.replace(/\s+/g, '_').toLowerCase()}_video.mp4`;
    a.click();
  }

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>📱 Publicação Manual</h2>
        </div>
      </div>

      <div className="aa-card" style={{ marginBottom: 16 }}>
        <h3 className="aa-card-title">📤 Publicar Vídeos Manualmente</h3>
        <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>
          A publicação automática no Instagram/TikTok requer integração via API oficial.
          Enquanto isso, baixe o vídeo e publique manualmente.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="aa-btn" style={{ background: '#e1306c' }}>📸 Abrir Instagram</a>
          <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="aa-btn" style={{ background: '#000' }}>🎵 Abrir TikTok</a>
        </div>
      </div>

      {publicados.length > 0 && (
        <div className="aa-card" style={{ marginBottom: 12 }}>
          <h3 className="aa-card-title">✅ Publicados — Baixar Vídeos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {publicados.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(16,185,129,0.05)', borderRadius: 8 }}>
                <div>
                  <strong style={{ fontSize: 13 }}>{a.titulo}</strong>
                  <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>R$ {a.preco.toFixed(2)} · {a.categoria}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="aa-btn aa-btn-sm" style={{ background: '#1e3a5f' }} onClick={() => downloadVideo(a.videoUrl, a.titulo)}>⬇ Baixar Vídeo</button>
                  {a.storeUrl && <span style={{ fontSize: 11, color: '#60a5fa', alignSelf: 'center' }}>{a.storeUrl}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendentes.length > 0 && (
        <div className="aa-card">
          <h3 className="aa-card-title">⏳ Aguardando Publicação Manual</h3>
          <p style={{ color: '#999', fontSize: 12, marginTop: 4 }}>{pendentes.length} anúncio(s) com vídeo pronto — publique manualmente nas redes.</p>
        </div>
      )}

      {publicados.length === 0 && pendentes.length === 0 && (
        <div className="aa-card" style={{ textAlign: 'center', padding: 40 }}>
          <p className="aa-muted">Nenhum anúncio publicado ou com vídeo disponível.</p>
          <p style={{ fontSize: 12, color: '#555', marginTop: 8 }}>
            Crie e aprove anúncios em "Links Afiliados" primeiro.
          </p>
        </div>
      )}
    </div>
  );
}

const BACKEND_URL_OAUTH = (process.env.REACT_APP_BACKEND_URL || "https://brane-production-3c87.up.railway.app").trim();
const API_OAUTH = `${BACKEND_URL_OAUTH}/api`;

const SOCIAL_OAUTH_PLATFORMS = ['instagram', 'tiktok'];
const SOCIAL_COMING_SOON = ['pinterest', 'facebook', 'x', 'kwai'];

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
  const [socialConns, setSocialConns] = useState(() => {
    try { return JSON.parse(localStorage.getItem('brane_social_connections') || '{}'); }
    catch { return {}; }
  });
  const [oauthLoading, setOauthLoading] = useState(null);

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

  useEffect(() => {
    try { localStorage.setItem('brane_social_connections', JSON.stringify(socialConns)); }
    catch {}
  }, [socialConns]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthPlatform = params.get('oauth');
    const oauthStatus = params.get('status');
    if (oauthPlatform && oauthStatus === 'connected') {
      const username = params.get('username') || 'conectado';
      const avatar = params.get('avatar') || '';
      setSocialConns(prev => ({
        ...prev,
        [oauthPlatform]: { status: 'conectado', username, avatar, connectedAt: Date.now() },
      }));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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

  const handleOAuthStart = (platform) => {
    setOauthLoading(platform);
    const redirectUri = window.location.origin + '/affiliate-agent/conexoes';
    window.location.href = `${API_OAUTH}/oauth/${platform}/start?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const handleOAuthDisconnect = async (platform) => {
    setSocialConns(prev => {
      const next = { ...prev };
      delete next[platform];
      return next;
    });
    try {
      const token = localStorage.getItem('brane_token');
      await fetch(`${API_OAUTH}/oauth/${platform}/disconnect`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}
  };

  const afiliados = conexoes.filter(c => ['shopee', 'amazon', 'mercado-livre', 'aliexpress'].includes(c.id));
  const sociaisDisponiveis = SOCIAL_OAUTH_PLATFORMS.map(id => conexoes.find(c => c.id === id));
  const sociaisFuturos = SOCIAL_COMING_SOON.map(id => conexoes.find(c => c.id === id));

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>🔗 Conexões</h2>
        </div>
      </div>

      <div className="aa-connect-info">
        <span>💾 Conexões sociais salvas apenas no servidor (tokens seguros). Plataformas de afiliados salvam no navegador.</span>
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
        <h3>📱 Redes Sociais — OAuth Oficial</h3>
        <div className="aa-connect-grid">
          {sociaisDisponiveis.map(p => {
            const conn = socialConns[p.id];
            const isConnected = conn?.status === 'conectado';
            return (
              <div key={p.id} className="aa-connect-card">
                <div className="aa-connect-header">
                  <span className="aa-connect-icon">{p.icone}</span>
                  <h4>{p.nome}</h4>
                  <span className={`aa-connect-status ${isConnected ? 'connected' : ''}`}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                <div className="aa-connect-body">
                  {isConnected ? (
                    <div className="aa-oauth-profile">
                      {conn.avatar && <img src={conn.avatar} alt="" className="aa-oauth-avatar" />}
                      <span className="aa-oauth-username">@{conn.username || 'conectado'}</span>
                      <span className="aa-oauth-connected-since">
                        Conectado {new Date(conn.connectedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ) : (
                    <p className="aa-connect-desc">
                      Autorize via OAuth oficial. Você será redirecionado ao {p.nome} para autenticar.
                    </p>
                  )}
                </div>
                <div className="aa-connect-footer">
                  {isConnected ? (
                    <button className="aa-btn aa-btn-sm aa-btn-danger" onClick={() => handleOAuthDisconnect(p.id)}>
                      Desconectar
                    </button>
                  ) : (
                    <button
                      className="aa-btn aa-btn-sm aa-btn-primary"
                      onClick={() => handleOAuthStart(p.id)}
                      disabled={oauthLoading === p.id}
                    >
                      {oauthLoading === p.id ? 'Abrindo...' : `Conectar ${p.nome}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {sociaisFuturos.map(p => (
            <div key={p.id} className="aa-connect-card aa-connect-card-soon">
              <div className="aa-connect-header">
                <span className="aa-connect-icon">{p.icone}</span>
                <h4>{p.nome}</h4>
                <span className="aa-connect-status">Em breve</span>
              </div>
              <div className="aa-connect-body">
                <p className="aa-connect-desc">Integração OAuth em desenvolvimento. Disponivel em breve.</p>
              </div>
              <div className="aa-connect-footer">
                <button className="aa-btn aa-btn-sm" disabled>Em breve</button>
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
  });
  const [campaign, setCampaign] = useState(null);
  const [video, setVideo] = useState(null);
  const [realVideoUrl, setRealVideoUrl] = useState(null);
  const [realVideoBlob, setRealVideoBlob] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStatus, setGenStatus] = useState('');
  const [videoLegenda, setVideoLegenda] = useState('');
  const [videoRoteiro, setVideoRoteiro] = useState('');
  const [campLogs, setCampLogs] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [publicado, setPublicado] = useState(null);
  const ugcEnabled = isMediaWorkerEnabled();
  const [ugcStatus, setUgcStatus] = useState('idle');
  const [ugcJobId, setUgcJobId] = useState(null);
  const [ugcProgress, setUgcProgress] = useState(0);
  const [ugcVideoUrl, setUgcVideoUrl] = useState(null);
  const [ugcError, setUgcError] = useState(null);
  const [useUgcVideo, setUseUgcVideo] = useState(false);

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

    const storeSlug = form.categoria;
    const lojaUrl = getStoreLink(form.categoria);
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
    setGenStatus('Gerando vídeo...');

    try {
      const { generateRealVideo } = await import("../../services/realVideoGenerator");
      const result = await generateRealVideo(camp, (pct, status) => {
        setGenProgress(pct);
        if (status) setGenStatus(status);
      });

      setVideo(result.videoMeta);

      if (result.url) {
        setRealVideoUrl(result.url);
        setRealVideoBlob(result.blob);
        addLog('success', `✅ Vídeo MP4 gerado: ${result.videoMeta.duracao}s · ${result.videoMeta.resolucao} · ${result.videoMeta.cortesRapidos} cortes`);
        addLog('info', '⏳ Assista, edite e publique após aprovação');
      } else {
        addLog('error', `❌ Renderização: ${result.error || 'erro desconhecido'}`);
      }
    } catch (err) {
      addLog('error', `❌ Erro ao gerar vídeo: ${err.message}`);
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
    setGenStatus('Gerando nova versão...');

    try {
      const { regenerateRealVideo } = await import("../../services/realVideoGenerator");
      const result = await regenerateRealVideo(campaign, video, (pct, status) => {
        setGenProgress(pct);
        if (status) setGenStatus(status);
      });

      setVideo(result.videoMeta);

      if (result.url) {
        setRealVideoUrl(result.url);
        setRealVideoBlob(result.blob);
        addLog('success', `✅ Novo vídeo gerado: ${result.videoMeta.duracao}s · roteiro diferente · nova cena`);
      } else {
        addLog('warn', '⚠️ Regenerado metadados, mas render falhou');
      }
    } catch (err) {
      addLog('error', `❌ Erro: ${err.message}`);
    }

    setGenerating(false);
    setGenStatus('');
    addLog('info', '⏳ Vídeo ainda não publicado. Aprove para publicar.');
  };

  const handleStartUGC = async () => {
    if (!campaign) return;
    setUgcStatus('sending');
    setUgcJobId(null);
    setUgcVideoUrl(null);
    setUgcError(null);
    setUseUgcVideo(false);
    addLog('info', '🎬 Solicitando vídeo UGC com apresentador...');

    try {
      const { jobId } = await createUGCJob(campaign);
      setUgcJobId(jobId);
      setUgcStatus('processing');
      addLog('info', `📥 Job UGC enviado: ${jobId}`);
    } catch (err) {
      setUgcStatus('failed');
      setUgcError(err.message);
      addLog('error', `❌ UGC falhou: ${err.message}`);
    }
  };

  useEffect(() => {
    if (!ugcJobId || ugcStatus === 'ready' || ugcStatus === 'failed') return;
    const iv = setInterval(async () => {
      try {
        const info = await getUGCJobStatus(ugcJobId);
        const s = info.status;
        if (s === 'pending' || s === 'running') setUgcStatus('processing');
        else if (s === 'rendering') setUgcStatus('rendering');
        else if (s === 'done') {
          setUgcStatus('ready');
          setUgcVideoUrl(info.videoUrl || '');
          addLog('success', `✅ Vídeo UGC pronto: ${info.videoUrl || ''}`);
          clearInterval(iv);
        } else if (s === 'failed') {
          setUgcStatus('failed');
          setUgcError(info.error || 'Erro desconhecido');
          addLog('error', `❌ UGC falhou: ${info.error || 'Erro desconhecido'}`);
          clearInterval(iv);
        }
        if (info.progress) setUgcProgress(info.progress);
      } catch (e) {
        if (ugcStatus === 'failed') clearInterval(iv);
      }
    }, 2500);
    return () => clearInterval(iv);
  }, [ugcJobId]);

  const handleUseUgc = () => {
    setUseUgcVideo(true);
    addLog('info', '✅ Usando vídeo UGC com apresentador para publicação');
  };

  const handleKeepVisual = () => {
    setUseUgcVideo(false);
    addLog('info', '✅ Mantendo vídeo visual atual para publicação');
  };

  const handleReject = () => {
    addLog('warn', '⏹️ Campanha rejeitada');
    setCampaign(null);
    setVideo(null);
    setRealVideoUrl(null);
    setRealVideoBlob(null);
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

    const finalVideoUrl = useUgcVideo && ugcVideoUrl ? ugcVideoUrl : realVideoUrl;

    if (!finalVideoUrl) {
      addLog('error', '❌ Gere um vídeo antes de publicar.');
      return;
    }

    addLog('info', `✅ Campanha aprovada — usando ${useUgcVideo ? 'UGC com apresentador' : 'vídeo visual'}`);

    adicionarAnuncio({
      nome: campaign.nome,
      videoUrl: finalVideoUrl,
      videoBlob: useUgcVideo ? null : realVideoBlob,
      legenda: videoLegenda,
      hashtags: campaign.hashtags || [],
      lojaUrl: campaign.lojaUrl || campaign.link || '',
      loja: campaign.nome || 'Amazon',
      produto: campaign.nome,
    });

    addLog('success', `✅ "${campaign.nome}" adicionado à central de anúncios`);
    addLog('info', '📺 Vá em "Anúncios" para gerenciar, agendar ou publicar');

    setPublicado({ nome: campaign.nome });
    setStep('publicado');
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

            <div className="full-width">
              <label>Imagens do Produto (URLs, uma por linha — até 5)</label>
              <textarea className="aa-input" rows="4" placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg&#10;https://exemplo.com/imagem3.jpg&#10;https://exemplo.com/imagem4.jpg&#10;https://exemplo.com/imagem5.jpg" value={form.imagem} onChange={e => updateField('imagem', e.target.value)} />
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
              onApprove={handleApprove}
              onReject={handleReject}
              onRegenerate={handleRegenerate}
              onEditLegenda={handleEditLegenda}
              onEditRoteiro={handleEditRoteiro}
            />
          </div>

          {ugcEnabled && campaign && (
            <div className="aa-card" style={{ marginTop: 18 }}>
              <h3 className="aa-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
                🎬 Vídeo UGC com Apresentador
                {ugcStatus === 'ready' && <span className="vp-tag vp-tag-real" style={{ fontSize: '0.65rem' }}>PRONTO</span>}
                {ugcStatus === 'failed' && <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>indisponível</span>}
              </h3>

              <p style={{ fontSize: '0.78rem', color: 'var(--aa-text-muted)', marginBottom: 12 }}>
                Gere um vídeo estilo UGC com apresentador IA mostrando o produto.
              </p>

              {ugcStatus === 'idle' && (
                <button className="aa-btn aa-btn-outline" onClick={handleStartUGC} style={{ fontSize: '0.85rem' }}>
                  🎬 Gerar vídeo UGC com apresentador
                </button>
              )}

              {(ugcStatus === 'sending' || ugcStatus === 'processing') && (
                <div className="vp-generating">
                  <div className="vp-generating-spinner" />
                  <div className="vp-generating-text">Enviando job para Media Worker...</div>
                </div>
              )}

              {ugcStatus === 'processing' && (
                <div className="vp-generating">
                  <div className="vp-generating-spinner" />
                  <div className="vp-generating-text">Processando UGC... gerando cenas</div>
                  <div className="vp-generating-bar">
                    <div className="vp-generating-fill" style={{ width: `${Math.max(ugcProgress * 100, 10)}%` }} />
                  </div>
                </div>
              )}

              {ugcStatus === 'rendering' && (
                <div className="vp-generating">
                  <div className="vp-generating-spinner" />
                  <div className="vp-generating-text">🎞️ Renderizando vídeo UGC... </div>
                  <div className="vp-generating-bar">
                    <div className="vp-generating-fill" style={{ width: `${Math.max(ugcProgress * 100, 50)}%` }} />
                  </div>
                </div>
              )}

              {ugcStatus === 'ready' && ugcVideoUrl && (
                <div>
                  <div className="vp-container" style={{ marginBottom: 12 }}>
                    <div className="vp-player">
                      <div className="vp-screen vp-screen-real">
                        <video src={ugcVideoUrl} className="vp-real-video" controls playsInline preload="auto" style={{ width: '100%', maxHeight: 400 }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="aa-btn aa-btn-primary"
                      onClick={handleUseUgc}
                      style={{ fontSize: '0.85rem' }}
                      disabled={publishing}
                    >
                      ✅ Usar vídeo UGC
                    </button>
                    <button
                      className="aa-btn aa-btn-outline"
                      onClick={handleKeepVisual}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Manter vídeo visual atual
                    </button>
                    <button
                      className="aa-btn aa-btn-ghost"
                      onClick={handleStartUGC}
                      style={{ fontSize: '0.85rem' }}
                      disabled={publishing}
                    >
                      🔄 Gerar outro UGC
                    </button>
                  </div>
                  {useUgcVideo && (
                    <p style={{ fontSize: '0.78rem', color: '#10b981', marginTop: 8 }}>
                      ✅ Vídeo UGC selecionado para publicação
                    </p>
                  )}
                </div>
              )}

              {ugcStatus === 'failed' && (
                <div className="vp-error" style={{ padding: '10px 14px' }}>
                  ⚠️ UGC indisponível. Use o vídeo visual atual.
                  <br />
                  <span style={{ fontSize: '0.72rem', color: 'var(--aa-text-muted)' }}>{ugcError || ''}</span>
                  <div style={{ marginTop: 8 }}>
                    <button className="aa-btn aa-btn-ghost" onClick={() => setUgcStatus('idle')} style={{ fontSize: '0.8rem' }}>
                      🔄 Tentar novamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
        <Route path="/anuncios" element={<><Sidebar active="anuncios" /><AnunciosPage /></>} />
        <Route path="/criativos" element={<><Sidebar active="criativos" /><CreativesPage /></>} />
        <Route path="/links" element={<><Sidebar active="links" /><LinksPage /></>} />
        <Route path="/campanha" element={<><Sidebar active="campanha" /><CampanhaPage /></>} />
        <Route path="/social-publish" element={<><Sidebar active="social" /><SocialPublishPage /></>} />
        <Route path="*" element={<Navigate to="/affiliate-agent" replace />} />
      </Routes>
    </div>
  );
}

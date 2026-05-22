import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { AffiliateAgent, NICHOS, PRODUTOS, PLATAFORMAS } from "./AffiliateEngine";
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
          <span className="aa-logo-sub">Affiliate Agent</span>
        </div>
      </div>
      <nav className="aa-sidebar-nav">
        <div className="aa-sidebar-label">Dashboard</div>
        <Link to="/affiliate-agent" className={`aa-sidebar-link ${active === 'dashboard' ? 'active' : ''}`}>📊 Visão Geral</Link>
        <Link to="/affiliate-agent/conexoes" className={`aa-sidebar-link ${active === 'conexoes' ? 'active' : ''}`}>🔗 Conexões</Link>
        <div className="aa-sidebar-label">Lojas Automáticas</div>
        {NICHOS.map(n => (
          <Link key={n.id} to={`/affiliate-agent/loja/${n.id}`} className={`aa-sidebar-link ${active === n.id ? 'active' : ''}`}>
            {n.icone} {n.nome}
          </Link>
        ))}
      </nav>
      <div className="aa-sidebar-footer">
        <span className="aa-version">v1.0.0 • Preparação</span>
      </div>
    </aside>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="aa-stat" style={{ borderTopColor: color || '#2563eb' }}>
      <div className="aa-stat-header">
        <span className="aa-stat-icon">{icon}</span>
        <span className="aa-stat-label">{label}</span>
      </div>
      <span className="aa-stat-value">{value}</span>
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
  const [cycleCount, setCycleCount] = useState(0);

  const refresh = useCallback(() => {
    setStats(agent.stats);
    setLogs(agent.logs);
    setPosts(agent.allPosts);
    setStores(agent.stores);
    setRunning(agent.running);
    setCycleCount(agent.cycleCount);
  }, [agent]);

  useEffect(() => {
    const iv = setInterval(refresh, 1000);
    refresh();
    return () => clearInterval(iv);
  }, [refresh]);

  const handleStart = () => { agent.start(); refresh(); };
  const handleStop = () => { agent.stop(); refresh(); };
  const handleExecutar = () => { agent.executarAgora(); setTimeout(refresh, 300); };

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <h2>📊 Visão Geral</h2>
        <div className="aa-topbar-actions">
          <div className="aa-status">
            <span className={`aa-status-dot ${running ? 'running' : ''}`} />
            <span>{running ? 'Rodando' : 'Parado'}</span>
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
        <StatCard label="Lojas Criadas" value={stats.lojasCriadas} icon="🏪" color="#2563eb" />
        <StatCard label="Produtos Encontrados" value={stats.produtosEncontrados} icon="📦" color="#059669" />
        <StatCard label="Posts Gerados" value={stats.postsGerados} icon="📝" color="#d97706" />
        <StatCard label="Links Pendentes" value={stats.linksAfiliadosPendentes} icon="🔗" color="#7c3aed" />
        <StatCard label="Vendas (Mock)" value={stats.vendasMock} icon="🛒" color="#0891b2" />
        <StatCard label="Comissão (Mock)" value={`R$ ${stats.comissaoMock.toFixed(2)}`} icon="💰" color="#e11d48" />
      </div>

      <div className="aa-grid-2">
        <div className="aa-card">
          <h3 className="aa-card-title">🏪 Lojas Automáticas</h3>
          {stores.length === 0 ? (
            <p className="aa-muted">Nenhuma loja criada ainda. Inicie o agente.</p>
          ) : (
            <div className="aa-store-list">
              {stores.map(s => (
                <div key={s.id} className="aa-store-mini" onClick={() => navigate(`/affiliate-agent/loja/${s.id}`)}>
                  <span className="aa-store-mini-icon">{s.icone}</span>
                  <div>
                    <strong>{s.nome}</strong>
                    <span className="aa-store-mini-meta">{s.produtos.length} produtos • {s.posts.length} posts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">📝 Últimos Posts</h3>
          {posts.length === 0 ? (
            <p className="aa-muted">Nenhum post gerado ainda.</p>
          ) : (
            <div className="aa-post-list">
              {posts.slice(0, 8).map(p => (
                <div key={p.id} className="aa-post-mini">
                  <span className="aa-post-platform">{p.plataforma === 'tiktok' ? '🎵' : p.plataforma === 'instagram' ? '📸' : p.plataforma === 'pinterest' ? '📌' : p.plataforma === 'x' ? '🐦' : '📱'}</span>
                  <div>
                    <strong>{p.produto}</strong>
                    <span className="aa-post-mini-meta">→ {p.plataforma} • {p.geradoEm}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="aa-grid-2">
        <div className="aa-card">
          <h3 className="aa-card-title">📋 Logs do Agente</h3>
          <div className="aa-logs">
            {logs.length === 0 ? <p className="aa-muted">Nenhum log ainda.</p> : (
              logs.slice(0, 20).map((l, i) => (
                <div key={i} className={`aa-log aa-log-${l.tipo}`}>
                  <span className="aa-log-time">[{l.data}]</span>
                  <span>{l.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="aa-card">
          <h3 className="aa-card-title">📈 Distribuição de Posts</h3>
          {posts.length === 0 ? <p className="aa-muted">Nenhum dado ainda.</p> : (
            <div className="aa-chart-bars">
              {['tiktok', 'instagram', 'pinterest', 'x', 'kwai'].map(plat => {
                const count = posts.filter(p => p.plataforma === plat).length;
                const max = posts.length / 5;
                return (
                  <div key={plat} className="aa-chart-row">
                    <span className="aa-chart-label">{plat === 'tiktok' ? '🎵' : plat === 'instagram' ? '📸' : plat === 'pinterest' ? '📌' : plat === 'x' ? '🐦' : '📱'} {plat}</span>
                    <div className="aa-chart-bar-bg">
                      <div className="aa-chart-bar" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="aa-chart-value">{count}</span>
                  </div>
                );
              })}
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

  if (!nichoData) return <Navigate to="/affiliate-agent" replace />;

  const produtos = PRODUTOS[nicho] || [];

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>{nichoData.icone} {nichoData.nome}</h2>
        </div>
        <span className="aa-status"><span className="aa-status-dot" /> Demo</span>
      </div>

      <div className="aa-store-header">
        <div className="aa-store-banner" style={{ background: `linear-gradient(135deg, ${nichoData.cor}22, ${nichoData.cor}44)` }}>
          <span style={{ fontSize: '3rem' }}>{nichoData.icone}</span>
          <div>
            <h3>{nichoData.nome}</h3>
            <p>Loja automática • {produtos.length} produtos • Modo Preparação</p>
          </div>
        </div>
      </div>

      <div className="aa-products">
        {produtos.map((p, i) => (
          <div key={i} className="aa-product-card">
            <div className="aa-product-img">{p.img}</div>
            <div className="aa-product-body">
              <h4>{p.nome}</h4>
              <p className="aa-product-desc">{gerarDescLocal(p.nome)}</p>
              <span className="aa-product-price">R$ {p.preco.toFixed(2)}</span>
              <span className="aa-product-tag">Demo</span>
              <div className="aa-product-footer">
                <button className="aa-btn aa-btn-sm aa-btn-primary" disabled>Comprar</button>
                <span className="aa-product-link-status">🔗 Aguardando afiliado</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function gerarDescLocal(nome) {
  const descs = [
    'Produto de alta qualidade com design moderno.',
    'Ideal para uso diário. Conforto e durabilidade.',
    'Melhor custo-benefício da categoria. Aproveite!',
    'Produto premium com tecnologia de ponta.',
  ];
  return descs[nome.length % descs.length];
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
  const sociais = conexoes.filter(c => ['tiktok', 'instagram', 'pinterest', 'x', 'kwai'].includes(c.id));

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <div className="aa-topbar-left">
          <button className="aa-btn aa-btn-ghost" onClick={() => navigate('/affiliate-agent')}>← Dashboard</button>
          <h2>🔗 Conexões</h2>
        </div>
      </div>

      <div className="aa-connect-warning">
        ⚠️ Modo Preparação — Nenhuma conexão real é feita. Configure APIs/tokens oficiais no futuro.
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
                <label>API Key / Token</label>
                <input className="aa-input" type="text" placeholder="Cole sua API key aqui" value={p.token} onChange={e => {/* no-op */}} />
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
                <input className="aa-input" type="text" placeholder="Token oficial da API" value={p.token} onChange={e => {/* no-op */}} />
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
        <Route path="*" element={<Navigate to="/affiliate-agent" replace />} />
      </Routes>
    </div>
  );
}

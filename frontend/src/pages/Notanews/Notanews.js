import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { Routes, Route, useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { NotaAgent, gerarNoticiasIniciais, CATEGORIES, criarNoticia } from "./NotaEngine";
import "./NotaNews.css";

const NotaContext = createContext();
export function useNota() { return useContext(NotaContext); }

function NotaProvider({ children }) {
  const [noticias, setNoticias] = useState(() => gerarNoticiasIniciais());
  const [publicadas, setPublicadas] = useState([]);
  const [agent] = useState(() => new NotaAgent());
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [selecionadas, setSelecionadas] = useState([]);

  const handlePublicar = useCallback((noticia) => {
    const n = { ...noticia, dataPublicacao: new Date().toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) };
    setPublicadas(prev => [n, ...prev]);
    setNoticias(prev => [n, ...prev]);
  }, []);

  const handleRevisar = useCallback((noticia) => {
    const n = { ...noticia, dataPublicacao: new Date().toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) };
    setSelecionadas(prev => [...prev, n]);
  }, []);

  const publicarRevisada = useCallback((noticia) => {
    setPublicadas(prev => [noticia, ...prev]);
    setNoticias(prev => [noticia, ...prev]);
    setSelecionadas(prev => prev.filter(n => n.id !== noticia.id));
  }, []);

  const descartarRevisada = useCallback((id) => {
    setSelecionadas(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    agent.onPublicar(handlePublicar);
  }, [agent, handlePublicar]);

  const value = { noticias, publicadas, agent, adminAuthed, setAdminAuthed, selecionadas, setSelecionadas, handleRevisar, publicarRevisada, descartarRevisada, handlePublicar, setNoticias };
  return <NotaContext.Provider value={value}>{children}</NotaContext.Provider>;
}

function Header() {
  const { noticias } = useNota();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const topNoticias = noticias.slice(0, 3);

  return (
    <header className="nn-header">
      <div className="nn-header-top">
        <div className="nn-container nn-header-flex">
          <div className="nn-logo" onClick={() => navigate('/Notanews')}>
            <span className="nn-logo-icon">✦</span>
            <span className="nn-logo-text">Nota News</span>
          </div>
          <div className="nn-header-right">
            <div className="nn-search-hide-mobile">
              <input className="nn-search-input" type="text" placeholder="Buscar notícias..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && search.trim()) { navigate(`/Notanews?busca=${encodeURIComponent(search.trim())}`); setSearch(''); } }} />
            </div>
            <button className="nn-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          </div>
        </div>
      </div>
      <nav className="nn-nav">
        <div className="nn-container nn-nav-flex">
          {CATEGORIES.map(c => (
            <Link key={c.id} to={`/Notanews?cat=${c.id}`} className="nn-nav-link">{c.icon} {c.name}</Link>
          ))}
          <Link to="/Notanews/admin" className="nn-nav-link nn-nav-admin">⚙️ Admin</Link>
        </div>
      </nav>
      {menuOpen && (
        <div className="nn-mobile-menu">
          <div className="nn-mobile-search">
            <input className="nn-search-input" type="text" placeholder="Buscar notícias..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && search.trim()) { navigate(`/Notanews?busca=${encodeURIComponent(search.trim())}`); setSearch(''); setMenuOpen(false); } }} />
          </div>
          {CATEGORIES.map(c => (
            <Link key={c.id} to={`/Notanews?cat=${c.id}`} className="nn-mobile-link" onClick={() => setMenuOpen(false)}>{c.icon} {c.name}</Link>
          ))}
          <Link to="/Notanews/admin" className="nn-mobile-link" onClick={() => setMenuOpen(false)}>⚙️ Admin</Link>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="nn-footer">
      <div className="nn-container nn-footer-grid">
        <div className="nn-footer-col">
          <h4>✦ Nota News</h4>
          <p>Portal de notícias automatizado por inteligência artificial. Informação original e contextualizada.</p>
        </div>
        <div className="nn-footer-col">
          <h4>Categorias</h4>
          {CATEGORIES.map(c => (
            <Link key={c.id} to={`/Notanews?cat=${c.id}`} className="nn-footer-link">{c.icon} {c.name}</Link>
          ))}
        </div>
        <div className="nn-footer-col">
          <h4>Institucional</h4>
          <Link to="/Notanews" className="nn-footer-link">Sobre</Link>
          <Link to="/Notanews" className="nn-footer-link">Contato</Link>
          <Link to="/Notanews/admin" className="nn-footer-link">Painel Admin</Link>
        </div>
        <div className="nn-footer-col">
          <h4>Publicidade</h4>
          <div className="nn-ad-placeholder">Espaço reservado para Google AdSense</div>
        </div>
      </div>
      <div className="nn-container nn-footer-bottom">
        <p>© 2026 Nota News — Conteúdo gerado por IA com supervisão editorial.</p>
      </div>
    </footer>
  );
}

function NoticiaCard({ noticia, featured }) {
  const navigate = useNavigate();
  return (
    <article className={`nn-card ${featured ? 'nn-card-featured' : ''}`} onClick={() => navigate(`/Notanews/noticia/${noticia.slug}`)}>
      <div className="nn-card-img">
        <div className="nn-card-img-placeholder" style={{ background: `linear-gradient(135deg, hsla(${noticia.categoria === 'tecnologia' ? 200 : noticia.categoria === 'mundo' ? 170 : noticia.categoria === 'brasil' ? 140 : noticia.categoria === 'economia' ? 110 : noticia.categoria === 'esportes' ? 30 : noticia.categoria === 'entretenimento' ? 300 : 260}, 40%, 35%, 1), hsla(${noticia.categoria === 'tecnologia' ? 240 : noticia.categoria === 'mundo' ? 200 : noticia.categoria === 'brasil' ? 170 : noticia.categoria === 'economia' ? 140 : noticia.categoria === 'esportes' ? 50 : noticia.categoria === 'entretenimento' ? 330 : 280}, 50%, 20%, 1)` }}>
          <span className="nn-card-img-text">{noticia.categoriaIcon} {noticia.categoriaNome}</span>
        </div>
        <span className="nn-card-cat">{noticia.categoriaNome}</span>
      </div>
      <div className="nn-card-body">
        <h3 className="nn-card-title">{noticia.titulo}</h3>
        <p className="nn-card-resumo">{noticia.resumo}</p>
        <div className="nn-card-meta">
          <span className="nn-card-date">{noticia.dataPublicacao}</span>
          <span className="nn-card-views">👁️ {noticia.visualizacoes}</span>
        </div>
      </div>
    </article>
  );
}

function HomePage() {
  const { noticias } = useNota();
  const params = new URLSearchParams(window.location.search);
  const filterCat = params.get('cat');
  const busca = params.get('busca');

  let filtered = [...noticias];
  if (filterCat) filtered = filtered.filter(n => n.categoria === filterCat);
  if (busca) {
    const q = busca.toLowerCase();
    filtered = filtered.filter(n => n.titulo.toLowerCase().includes(q) || n.resumo.toLowerCase().includes(q));
  }

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const catName = filterCat ? CATEGORIES.find(c => c.id === filterCat)?.name || 'Categoria' : null;

  return (
    <main className="nn-main">
      <div className="nn-container">
        {catName && <h2 className="nn-page-title">{CATEGORIES.find(c => c.id === filterCat)?.icon} {catName}</h2>}
        {busca && <h2 className="nn-page-title">🔍 Resultados para: "{busca}"</h2>}

        {filtered.length === 0 && (
          <div className="nn-empty">
            <p>Nenhuma notícia encontrada.</p>
          </div>
        )}

        {featured && !filterCat && !busca && (
          <div className="nn-featured-section">
            <NoticiaCard noticia={featured} featured />
          </div>
        )}

        {rest.length > 0 && (
          <div className="nn-grid">
            {rest.map(n => (
              <NoticiaCard key={n.id} noticia={n} />
            ))}
          </div>
        )}

        {featured && (filterCat || busca) && (
          <div className="nn-grid">
            {filtered.map(n => (
              <NoticiaCard key={n.id} noticia={n} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ArticlePage() {
  const { slug } = useParams();
  const { noticias } = useNota();
  const noticia = noticias.find(n => n.slug === slug);
  const navigate = useNavigate();

  if (!noticia) {
    return (
      <main className="nn-main">
        <div className="nn-container">
          <div className="nn-empty">
            <h2>Notícia não encontrada</h2>
            <p>Esta notícia pode ter sido removida ou o link está incorreto.</p>
            <button className="nn-btn nn-btn-primary" onClick={() => navigate('/Notanews')}>← Voltar para Home</button>
          </div>
        </div>
      </main>
    );
  }

  const related = noticias.filter(n => n.categoria === noticia.categoria && n.id !== noticia.id).slice(0, 3);

  return (
    <main className="nn-main nn-article-page">
      <div className="nn-container nn-article-layout">
        <article className="nn-article">
          <div className="nn-article-header">
            <span className="nn-article-cat">{noticia.categoriaIcon} {noticia.categoriaNome}</span>
            <h1 className="nn-article-title">{noticia.titulo}</h1>
            <div className="nn-article-meta">
              <span>📅 {noticia.dataPublicacao}</span>
              <span>👁️ {noticia.visualizacoes} visualizações</span>
              {noticia.agenteGerado && <span className="nn-article-agent">🤖 Gerado por IA</span>}
            </div>
          </div>

          <div className="nn-article-img">
            <div className="nn-article-img-placeholder" style={{ background: `linear-gradient(135deg, hsla(${noticia.categoria === 'tecnologia' ? 200 : noticia.categoria === 'mundo' ? 170 : noticia.categoria === 'brasil' ? 140 : noticia.categoria === 'economia' ? 110 : noticia.categoria === 'esportes' ? 30 : noticia.categoria === 'entretenimento' ? 300 : 260}, 50%, 40%, 1), hsla(${noticia.categoria === 'tecnologia' ? 240 : noticia.categoria === 'mundo' ? 200 : noticia.categoria === 'brasil' ? 170 : noticia.categoria === 'economia' ? 140 : noticia.categoria === 'esportes' ? 50 : noticia.categoria === 'entretenimento' ? 330 : 280}, 60%, 25%, 1)` }}>
              <div className="nn-article-img-content">
                <span className="nn-article-img-icon">{noticia.categoriaIcon}</span>
                <p className="nn-article-img-desc">{noticia.imgDesc}</p>
              </div>
            </div>
          </div>

          <div className="nn-article-body">
            <p className="nn-article-resumo">{noticia.resumo}</p>
            {noticia.conteudo.map((p, i) => <p key={i} className="nn-article-p">{p}</p>)}
          </div>

          <div className="nn-article-importa">
            <h3>🎯 Por que isso importa</h3>
            <p>{noticia.porQueImporta}</p>
          </div>

          <div className="nn-article-footer">
            <div className="nn-article-tags">
              {noticia.tags.map((t, i) => <span key={i} className="nn-tag">#{t}</span>)}
            </div>
            <div className="nn-article-fonte">
              <span>📰 Fonte: <a href={noticia.fonte.url} target="_blank" rel="noopener noreferrer">{noticia.fonte.nome}</a></span>
            </div>
          </div>
        </article>

        <aside className="nn-sidebar">
          <div className="nn-sidebar-section">
            <h3>📰 Mais Lidas</h3>
            {noticias.slice(0, 5).map(n => (
              <div key={n.id} className="nn-sidebar-item" onClick={() => navigate(`/Notanews/noticia/${n.slug}`)}>
                <span className="nn-sidebar-rank">{noticias.indexOf(n) + 1}</span>
                <div>
                  <p className="nn-sidebar-title">{n.titulo}</p>
                  <span className="nn-sidebar-meta">{n.categoriaNome} • {n.visualizacoes} views</span>
                </div>
              </div>
            ))}
          </div>
          <div className="nn-sidebar-section">
            <h3>📌 Relacionadas</h3>
            {related.map(n => (
              <div key={n.id} className="nn-sidebar-item" onClick={() => navigate(`/Notanews/noticia/${n.slug}`)}>
                <div>
                  <p className="nn-sidebar-title">{n.titulo}</p>
                  <span className="nn-sidebar-meta">{n.categoriaNome}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="nn-sidebar-ad">
            <div className="nn-ad-placeholder">Espaço AdSense</div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function AdminLogin() {
  const { setAdminAuthed } = useNota();
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pass === 'admin123') {
      setAdminAuthed(true);
      localStorage.setItem('nn_admin', 'true');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="nn-admin-login">
      <div className="nn-admin-login-box">
        <h2>✦ Nota News Admin</h2>
        <p>Painel administrativo do agente de notícias IA</p>
        <form onSubmit={handleLogin}>
          <input className="nn-input" type="password" placeholder="Senha de administrador" value={pass} onChange={e => setPass(e.target.value)} autoFocus />
          <button className="nn-btn nn-btn-primary nn-btn-full" type="submit">Entrar</button>
          {error && <p className="nn-error">Senha incorreta. Tente: admin123</p>}
        </form>
      </div>
    </div>
  );
}

function AdminPanel() {
  const { agent, selecionadas, publicarRevisada, descartarRevisada, setAdminAuthed, setNoticias, handleRevisar } = useNota();
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [agentNoticias, setAgentNoticias] = useState([]);
  const [totalGerados, setTotalGerados] = useState(0);
  const [tab, setTab] = useState('painel');

  useEffect(() => {
    const saved = localStorage.getItem('nn_admin');
    if (saved === 'true') { /* already authed */ }
  }, []);

  const refreshLogs = useCallback(() => {
    setLogs(agent.logs);
    setRunning(agent.running);
    setTotalGerados(agent.totalGerados);
  }, [agent]);

  useEffect(() => {
    const iv = setInterval(refreshLogs, 1000);
    refreshLogs();
    return () => clearInterval(iv);
  }, [refreshLogs]);

  useEffect(() => {
    agent.setAutoMode(autoMode);
  }, [agent, autoMode]);

  const handleStart = () => {
    agent.start();
    setRunning(true);
  };

  const handleStop = () => {
    agent.stop();
    setRunning(false);
  };

  const handleExecutarAgora = () => {
    agent.executarAgora();
    setTimeout(refreshLogs, 500);
  };

  const handleLogout = () => {
    agent.stop();
    setRunning(false);
    setAdminAuthed(false);
    localStorage.removeItem('nn_admin');
  };

  const handlePublicarSelecionada = (n) => {
    publicarRevisada(n);
  };

  return (
    <div className="nn-admin">
      <div className="nn-admin-header">
        <div className="nn-container nn-admin-header-flex">
          <h2>⚙️ Painel do Agente</h2>
          <div className="nn-admin-status">
            <span className={`nn-status-dot ${running ? 'running' : 'stopped'}`}></span>
            <span>{running ? 'Rodando' : 'Parado'}</span>
            <span className="nn-admin-divider">|</span>
            <span>Total: {totalGerados} artigos</span>
            <span className="nn-admin-divider">|</span>
            <button className="nn-btn nn-btn-sm" onClick={handleLogout}>Sair</button>
          </div>
        </div>
      </div>

      <div className="nn-admin-tabs">
        <div className="nn-container nn-admin-tabs-flex">
          <button className={`nn-tab ${tab === 'painel' ? 'active' : ''}`} onClick={() => setTab('painel')}>📊 Painel</button>
          <button className={`nn-tab ${tab === 'agente' ? 'active' : ''}`} onClick={() => setTab('agente')}>🤖 Agente</button>
          <button className={`nn-tab ${tab === 'revisao' ? 'active' : ''}`} onClick={() => setTab('revisao')}>📋 Revisão {selecionadas.length > 0 && `(${selecionadas.length})`}</button>
          <button className={`nn-tab ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>📝 Logs</button>
          <button className={`nn-tab ${tab === 'config' ? 'active' : ''}`} onClick={() => setTab('config')}>⚙️ Config</button>
        </div>
      </div>

      <div className="nn-container nn-admin-content">
        {tab === 'painel' && (
          <div className="nn-admin-painel">
            <div className="nn-stats">
              <div className="nn-stat-card"><span className="nn-stat-num">{totalGerados}</span><span>Artigos Publicados</span></div>
              <div className="nn-stat-card"><span className="nn-stat-num">{logs.filter(l => l.tipo === 'info').length}</span><span>Total de Operações</span></div>
              <div className="nn-stat-card"><span className="nn-stat-num">{logs.filter(l => l.tipo === 'success').length}</span><span>Sucessos</span></div>
              <div className="nn-stat-card"><span className="nn-stat-num">{running ? 'Ativo' : 'Parado'}</span><span>Status do Agente</span></div>
            </div>
            <div className="nn-admin-actions">
              <button className={`nn-btn nn-btn-${running ? 'danger' : 'primary'} nn-btn-lg`} onClick={running ? handleStop : handleStart}>
                {running ? '⏹ Parar Agente' : '▶ Iniciar Agente'}
              </button>
              <button className="nn-btn nn-btn-secondary nn-btn-lg" onClick={handleExecutarAgora} disabled={!running}>
                ⚡ Executar Agora
              </button>
            </div>
          </div>
        )}

        {tab === 'agente' && (
          <div className="nn-admin-agente">
            <div className="nn-admin-agent-controls">
              <button className={`nn-btn nn-btn-${running ? 'danger' : 'primary'} nn-btn-lg`} onClick={running ? handleStop : handleStart}>
                {running ? '⏹ Parar Agente' : '▶ Iniciar Agente'}
              </button>
              <button className="nn-btn nn-btn-secondary nn-btn-lg" onClick={handleExecutarAgora}>
                ⚡ Executar Ciclo Único
              </button>
            </div>
            <div className="nn-admin-info">
              <p>🤖 <strong>Status:</strong> {running ? 'Rodando (ciclo a cada 30s)' : 'Parado'}</p>
              <p>📰 <strong>Artigos gerados:</strong> {totalGerados}</p>
              <p>🔄 <strong>Modo:</strong> {autoMode ? 'Automático (publicação direta)' : 'Revisão manual'}</p>
            </div>
          </div>
        )}

        {tab === 'revisao' && (
          <div className="nn-admin-revisao">
            {selecionadas.length === 0 ? (
              <p className="nn-empty-text">Nenhum artigo aguardando revisão. Inicie o agente para gerar artigos.</p>
            ) : (
              selecionadas.map(n => (
                <div key={n.id} className="nn-revisao-card">
                  <h4>{n.titulo}</h4>
                  <p className="nn-revisao-resumo">{n.resumo}</p>
                  <div className="nn-revisao-meta">
                    <span>{n.categoriaIcon} {n.categoriaNome}</span>
                    <span>{n.dataPublicacao}</span>
                  </div>
                  <div className="nn-revisao-actions">
                    <button className="nn-btn nn-btn-primary nn-btn-sm" onClick={() => handlePublicarSelecionada(n)}>✅ Publicar</button>
                    <button className="nn-btn nn-btn-danger nn-btn-sm" onClick={() => descartarRevisada(n.id)}>❌ Descartar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'logs' && (
          <div className="nn-admin-logs">
            <div className="nn-logs-header">
              <span className="nn-logs-count">{logs.length} eventos</span>
              <button className="nn-btn nn-btn-sm" onClick={() => { agent._logs = []; setLogs([]); }}>Limpar</button>
            </div>
            <div className="nn-logs-list">
              {logs.length === 0 ? <p className="nn-empty-text">Nenhum log ainda. Inicie o agente.</p> : (
                logs.map((l, i) => (
                  <div key={i} className={`nn-log-entry nn-log-${l.tipo}`}>
                    <span className="nn-log-time">[{l.data}]</span>
                    <span className="nn-log-msg">{l.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'config' && (
          <div className="nn-admin-config">
            <div className="nn-config-group">
              <label className="nn-config-label">
                <input type="checkbox" checked={autoMode} onChange={e => setAutoMode(e.target.checked)} />
                <span>Modo automático (publicar sem revisão)</span>
              </label>
              <p className="nn-config-desc">Quando ativo, o agente publica artigos automaticamente. Quando desativado, artigos vão para revisão manual.</p>
            </div>
            <div className="nn-config-group">
              <label className="nn-config-label">
                <input type="checkbox" defaultChecked />
                <span>Verificar duplicidade antes de publicar</span>
              </label>
            </div>
            <div className="nn-config-group">
              <h4>Intervalo do Agente</h4>
              <p className="nn-config-desc">Atualmente: 30 segundos (configurável em versões futuras)</p>
            </div>
            <div className="nn-config-group">
              <h4>Fontes de Notícias</h4>
              <p className="nn-config-desc">O agente utiliza fontes públicas e APIs abertas. A lista completa de fontes será exibida aqui.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Notanews() {
  const { adminAuthed } = useNota();

  return (
    <div className="nn-root">
      <Routes>
        <Route path="/" element={<><Header /><HomePage /><Footer /></>} />
        <Route path="/noticia/:slug" element={<><Header /><ArticlePage /><Footer /></>} />
        <Route path="/admin" element={adminAuthed ? <><Header /><AdminPanel /></> : <AdminLogin />} />
        <Route path="*" element={<Navigate to="/Notanews/" replace />} />
      </Routes>
    </div>
  );
}

function NotanewsWrapper() {
  return (
    <NotaProvider>
      <Notanews />
    </NotaProvider>
  );
}

export default NotanewsWrapper;

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Routes, Route, useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { gerarNoticiasIniciais, CATEGORIES } from "./NotaEngine";
import "./NotaNews.css";

const NotaContext = createContext();
export function useNota() { return useContext(NotaContext); }

function NotaProvider({ children }) {
  const [noticias, setNoticias] = useState(() => gerarNoticiasIniciais());

  const value = { noticias, setNoticias };
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
          <div className="nn-logo" onClick={() => navigate('/notanews')}>
            <span className="nn-logo-icon">✦</span>
            <span className="nn-logo-text">Nota News</span>
          </div>
          <div className="nn-header-right">
            <div className="nn-search-hide-mobile">
              <input className="nn-search-input" type="text" placeholder="Buscar notícias..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && search.trim()) { navigate(`/notanews?busca=${encodeURIComponent(search.trim())}`); setSearch(''); } }} />
            </div>
            <button className="nn-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          </div>
        </div>
      </div>
      <nav className="nn-nav">
        <div className="nn-container nn-nav-flex">
          {CATEGORIES.map(c => (
            <Link key={c.id} to={`/notanews?cat=${c.id}`} className="nn-nav-link">{c.icon} {c.name}</Link>
          ))}
          <Link to="/notanews/admin" className="nn-nav-link nn-nav-admin">⚙️ Admin</Link>
        </div>
      </nav>
      {menuOpen && (
        <div className="nn-mobile-menu">
          <div className="nn-mobile-search">
            <input className="nn-search-input" type="text" placeholder="Buscar notícias..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && search.trim()) { navigate(`/notanews?busca=${encodeURIComponent(search.trim())}`); setSearch(''); setMenuOpen(false); } }} />
          </div>
          {CATEGORIES.map(c => (
            <Link key={c.id} to={`/notanews?cat=${c.id}`} className="nn-mobile-link" onClick={() => setMenuOpen(false)}>{c.icon} {c.name}</Link>
          ))}
          <Link to="/notanews/admin" className="nn-mobile-link" onClick={() => setMenuOpen(false)}>⚙️ Admin</Link>
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
            <Link key={c.id} to={`/notanews?cat=${c.id}`} className="nn-footer-link">{c.icon} {c.name}</Link>
          ))}
        </div>
        <div className="nn-footer-col">
          <h4>Institucional</h4>
          <Link to="/notanews" className="nn-footer-link">Sobre</Link>
          <Link to="/notanews" className="nn-footer-link">Contato</Link>
          <Link to="/notanews/admin" className="nn-footer-link">Painel Admin</Link>
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
    <article className={`nn-card ${featured ? 'nn-card-featured' : ''}`} onClick={() => navigate(`/notanews/noticia/${noticia.slug}`)}>
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
            <button className="nn-btn nn-btn-primary" onClick={() => navigate('/notanews')}>← Voltar para Home</button>
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
              <div key={n.id} className="nn-sidebar-item" onClick={() => navigate(`/notanews/noticia/${n.slug}`)}>
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
              <div key={n.id} className="nn-sidebar-item" onClick={() => navigate(`/notanews/noticia/${n.slug}`)}>
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

function AdminPlaceholder() {
  return (
    <div className="nn-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚙️</div>
      <h2 style={{ marginBottom: '8px' }}>Painel Administrativo</h2>
      <p style={{ color: 'var(--nn-text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
        O painel do agente de notícias IA estará disponível em breve.
      </p>
      <p style={{ color: 'var(--nn-text-secondary)', fontSize: '0.82rem' }}>
        Funcionalidades futuras: agente automático, revisão de notícias, logs, configurações.
      </p>
    </div>
  );
}

function Notanews() {
  return (
    <div className="nn-root">
      <Routes>
        <Route path="/" element={<><Header /><HomePage /><Footer /></>} />
        <Route path="/noticia/:slug" element={<><Header /><ArticlePage /><Footer /></>} />
        <Route path="/admin" element={<><Header /><AdminPlaceholder /></>} />
        <Route path="*" element={<Navigate to="/notanews/" replace />} />
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

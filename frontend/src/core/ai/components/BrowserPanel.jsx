import React, { useState, useEffect, useCallback } from "react";
import { browserEngine } from "../browser/BrowserEngine";

export default function BrowserPanel({ onClose }) {
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState("browse");
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [pageContent, setPageContent] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    setTabs(browserEngine.tabs);
    setActiveTab(browserEngine.activeTab);
    setBookmarks(browserEngine.bookmarks);
  }, []);

  const refreshState = useCallback(() => {
    setTabs([...browserEngine.tabs]);
    setActiveTab(browserEngine.activeTab);
    setBookmarks([...browserEngine.bookmarks]);
  }, []);

  const handleNavigate = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    if (!browserEngine.activeTab) browserEngine.createTab(url);
    const result = await browserEngine.navigate(url);
    setPageContent(result);
    setLoading(false);
    refreshState();
  }, [url, refreshState]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setActiveView("search");
    const results = await browserEngine.search(query);
    setSearchResults(results);
    setLoading(false);
  }, [query]);

  const handleNewTab = () => {
    browserEngine.createTab();
    refreshState();
  };

  const handleCloseTab = (tabId) => {
    browserEngine.closeTab(tabId);
    refreshState();
  };

  const handleSwitchTab = (tabId) => {
    browserEngine.switchTab(tabId);
    refreshState();
  };

  const handleBookmark = () => {
    if (activeTab) {
      browserEngine.addBookmark(activeTab.url, activeTab.title);
      setBookmarks([...browserEngine.bookmarks]);
    }
  };

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      background: "#0a0a0a", color: "white", fontSize: 12,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        height: 36, flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
        padding: "0 8px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "#0c0c0c",
      }}>
        <div style={{ display: "flex", gap: 2, marginRight: 4 }}>
          <button onClick={handleNewTab}
            style={{ padding: "2px 6px", border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "inherit", borderRadius: 3 }}
            className="cs-hover-soft"
          >+</button>
        </div>
        <div style={{ flex: 1, display: "flex", gap: 2, overflow: "hidden" }}>
          {tabs.slice(0, 8).map((tab) => (
            <div key={tab.id} style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "2px 6px", borderRadius: 4, cursor: "pointer",
              background: tab.id === activeTab?.id ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.02)",
              color: tab.id === activeTab?.id ? "rgba(59,130,246,0.7)" : "rgba(255,255,255,0.4)",
              fontSize: 10, maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
              onClick={() => handleSwitchTab(tab.id)}
            >
              <span>🌐</span>
              <span>{tab.title || tab.url || "Nova aba"}</span>
              <span onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                style={{ marginLeft: 2, color: "rgba(255,255,255,0.2)", cursor: "pointer" }}
              >✕</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={() => setActiveView(activeView === "search" ? "browse" : "search")}
            style={{
              padding: "2px 6px", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
              background: activeView === "search" ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "inherit", borderRadius: 3,
            }}
            className="cs-hover-soft"
          >{activeView === "search" ? "Navegar" : "Pesquisar"}</button>
          {onClose && (
            <button onClick={onClose}
              style={{ padding: 2, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "inherit" }}
              className="cs-hover-soft"
            >✕</button>
          )}
        </div>
      </div>

      {/* URL / Search bar */}
      <div style={{ display: "flex", gap: 4, padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {activeView === "browse" ? (
          <>
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
              placeholder="Digite uma URL..."
              style={{
                flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "inherit", outline: "none",
              }}
            />
            <button onClick={handleNavigate} disabled={loading}
              style={{
                padding: "4px 10px", borderRadius: 4, border: "none", cursor: "pointer",
                background: "rgba(59,130,246,0.15)", color: "rgba(59,130,246,0.6)", fontSize: 11, fontFamily: "inherit",
              }}
              className="cs-hover-soft"
            >{loading ? "..." : "Ir"}</button>
            <button onClick={handleBookmark}
              style={{
                padding: "4px 6px", borderRadius: 4, border: "none", cursor: "pointer",
                background: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "inherit",
              }}
              className="cs-hover-soft"
              title="Adicionar aos favoritos"
            >★</button>
          </>
        ) : (
          <>
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Pesquisar na web..."
              style={{
                flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "inherit", outline: "none",
              }}
            />
            <button onClick={handleSearch} disabled={loading}
              style={{
                padding: "4px 10px", borderRadius: 4, border: "none", cursor: "pointer",
                background: "rgba(59,130,246,0.15)", color: "rgba(59,130,246,0.6)", fontSize: 11, fontFamily: "inherit",
              }}
              className="cs-hover-soft"
            >🔍</button>
          </>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden auto", padding: "8px 10px" }} className="cs-scrollbar">
        {activeView === "browse" && pageContent && (
          <div>
            {pageContent.title && <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>{pageContent.title}</div>}
            {pageContent.error ? (
              <div style={{ color: "rgba(239,68,68,0.6)", fontSize: 12, padding: 8 }}>Erro: {pageContent.error}</div>
            ) : (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {pageContent.text?.slice(0, 5000)}
              </div>
            )}
            {pageContent.links?.length > 0 && (
              <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Links encontrados ({pageContent.links.length})</div>
                {pageContent.links.slice(0, 10).map((link, i) => (
                  <div key={i} style={{ fontSize: 11, marginBottom: 2, color: "rgba(59,130,246,0.5)", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    onClick={() => { setUrl(link.url); setActiveView("browse"); }}
                  >🔗 {link.text || link.url}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "search" && searchResults && (
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
              {searchResults.results?.length || 0} resultados para "{query}"
            </div>
            {searchResults.results?.map((r, i) => (
              <div key={i} style={{
                marginBottom: 8, padding: "6px 8px", borderRadius: 6,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                cursor: "pointer",
              }}
                onClick={() => { setUrl(r.url); setActiveView("browse"); handleNavigate(); }}
              >
                <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(59,130,246,0.6)", marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 2, fontFamily: "monospace" }}>{r.url}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: "1.4" }}>{r.snippet}</div>
              </div>
            ))}
            {(!searchResults.results || searchResults.results.length === 0) && (
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", padding: 20 }}>Nenhum resultado encontrado</div>
            )}
          </div>
        )}

        {!pageContent && !searchResults && !loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
            <span style={{ fontSize: 32 }}>🌐</span>
            <span>Navegue ou pesquise na web</span>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
            <span style={{ animation: "blink 1s infinite" }}>Carregando...</span>
          </div>
        )}
      </div>

      {/* Bookmarks bar */}
      {bookmarks.length > 0 && (
        <div style={{
          display: "flex", gap: 2, padding: "3px 8px", flexShrink: 0,
          borderTop: "1px solid rgba(255,255,255,0.04)", overflow: "hidden",
          background: "rgba(255,255,255,0.01)",
        }}>
          {bookmarks.slice(0, 10).map((bm, i) => (
            <div key={i} style={{
              padding: "2px 6px", borderRadius: 3, cursor: "pointer", fontSize: 10,
              color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100,
            }}
              className="cs-hover-soft"
              onClick={() => { setUrl(bm.url); setActiveView("browse"); }}
            >★ {bm.title}</div>
          ))}
        </div>
      )}

      <style>{`
        .cs-scrollbar::-webkit-scrollbar { width: 4px; }
        .cs-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
        .cs-hover-soft:hover { background: rgba(255,255,255,0.06) !important; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

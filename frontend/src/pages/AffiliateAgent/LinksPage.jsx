import React, { useState, useEffect, useRef } from "react";

const STORAGE_KEY_LINKS = "brane_links_afiliados";
const STORE_BASE = "https://branpy.stormarck/loja";

const MARKETPLACES = [
  { id: "amazon", nome: "Amazon", domains: ["amazon", "amzn"] },
  { id: "shopee", nome: "Shopee", domains: ["shopee"] },
  { id: "aliexpress", nome: "AliExpress", domains: ["aliexpress", "alibaba"] },
  { id: "temu", nome: "Temu", domains: ["temu"] },
  { id: "outro", nome: "Outro", domains: [] },
];

const CATEGORIAS_DETECT = [
  { id: "gamer", keywords: ["gamer", "headset", "mousepad", "controle", "cadeira", "joystick", "playstation", "xbox", "nintendo", "rgb", "mecanico", "teclado", "mecânico"] },
  { id: "tecnologia", keywords: ["computador", "notebook", "tablet", "celular", "smartphone", "carregador", "fone", "mouse", "monitor", "webcam", "camera", "roteador", "hd", "ssd", "memoria", "processador", "placa", "fonte", "gabinete", "fone", "bluetooth", "carregador", "adaptador", "cabo", "hub", "dock"] },
  { id: "cozinha", keywords: ["cozinha", "panela", "frigideira", "air fryer", "mixer", "cafeteira", "faca", "liquidificador", "batedeira", "fogao", "geladeira", "microondas", "forno", "jogo de facas", "tempero", "garrafa termica", "pote", "tupperware"] },
  { id: "beleza", keywords: ["beleza", "maquiagem", "perfume", "creme", "shampoo", "condicionador", "secador", "chapinha", "escova", "barbeador", "depilador", "paleta", "batom", "base", "hidratante", "protetor solar", "maquiagem"] },
  { id: "saude", keywords: ["saude", "vitamina", "suplemento", "whey", "remedio", "farmacia", "bem-estar", "massageador", "termometro", "medicamento"] },
  { id: "pet", keywords: ["pet", "cachorro", "gato", "racao", "coleira", "guia", "brinquedo pet", "cama pet", "comedouro", "arranhador", "cao"] },
  { id: "fitness", keywords: ["fitness", "academia", "peso", "halter", "anilha", "corda", "tapete yoga", "yoga", "bicicleta", "esteira", "garrafa termica", "faixa elastica", "suplemento"] },
  { id: "moda", keywords: ["roupa", "vestido", "camiseta", "calc", "tenis", "sapato", "bolsa", "mochila", "jaqueta", "casaco", "bone", "chapeu", "oculos", "relogio", "moda"] },
  { id: "casa", keywords: ["casa", "luminaria", "lampada", "tapete", "cortina", "vaso", "decoracao", "decorativo", "sofa", "mesa", "cadeira", "estante", "prateleira", "organizador"] },
];

const HOOKS_POR_CATEGORIA = {
  gamer: ["⚡ OFERTA IMPERDÍVEL", "🔥 OPORTUNIDADE ÚNICA", "💥 MELHOR PREÇO DA WEB"],
  tecnologia: ["🚀 TECNOLOGIA COM DESCONTO", "⚡ LANÇAMENTO IMPERDÍVEL", "🔥 OPORTUNIDADE ÚNICA"],
  cozinha: ["🍳 COZINHA COM ESTILO", "🔥 OFERTA IMPERDÍVEL", "✨ TRANSFORME SUA COZINHA"],
  beleza: ["💄 BELEZA QUE VOCÊ MERECE", "✨ TRATAMENTO PREMIUM", "🔥 OFERTA LIMITADA"],
  pet: ["🐾 SEU PET MERECE", "✨ CONFORTO E QUALIDADE", "🔥 OFERTA ESPECIAL"],
  fitness: ["💪 ATIVE SEU POTENCIAL", "🔥 TRANSFORMAÇÃO JÁ", "⚡ RESULTADOS REAIS"],
  moda: ["👗 MODA COM DESCONTO", "✨ ESTILO ÚNICO", "🔥 OFERTA IMPERDÍVEL"],
  casa: ["🏠 CASA DOS SONHOS", "✨ DECORE COM ESTILO", "🔥 OFERTA ESPECIAL"],
};

const HASHTAGS_POR_CATEGORIA = {
  gamer: ["#gamer", "#setupgamer", "#rgb", "#gamingsetup", "#tecnologia"],
  tecnologia: ["#tecnologia", "#inovacao", "#ofertadia", "#promocao", "#eletronicos"],
  cozinha: ["#cozinha", "#culinaria", "#casa", "#oferta", "#gastronomia"],
  beleza: ["#beleza", "#skincare", "#maquiagem", "#cosmeticos", "#cuidados"],
  pet: ["#pet", "#petshop", "#animais", "#cachorro", "#gato"],
  fitness: ["#fitness", "#academia", "#treino", "#saude", "#motivacao"],
  moda: ["#moda", "#estilo", "#roupas", "#lookdomida", "#tendencias"],
  casa: ["#casa", "#decoracao", "#lar", "#organizacao", "#conforto"],
};

const CATEGORY_ICON = {
  gamer: "🎮", tecnologia: "💻", cozinha: "🍳", beleza: "💄",
  saude: "🏥", pet: "🐾", fitness: "💪", moda: "👗", casa: "🏠",
};

const CATEGORY_STORE_LINKS = {
  gamer: `${STORE_BASE}/gamer`,
  tecnologia: `${STORE_BASE}/tecnologia`,
  cozinha: `${STORE_BASE}/cozinha`,
  beleza: `${STORE_BASE}/beleza`,
  saude: `${STORE_BASE}/saude`,
  pet: `${STORE_BASE}/pets`,
  fitness: `${STORE_BASE}/fitness`,
  moda: `${STORE_BASE}/moda`,
  casa: `${STORE_BASE}/casa`,
};

export function getStoreLink(categoria) {
  return CATEGORY_STORE_LINKS[categoria] || `${STORE_BASE}/tecnologia`;
}

function detectMarketplace(url) {
  const u = url.toLowerCase();
  for (const m of MARKETPLACES) {
    for (const d of m.domains) {
      if (u.includes(d)) return m.id;
    }
  }
  return "outro";
}

function extractProductName(url) {
  try {
    const u = new URL(url);
    const path = decodeURIComponent(u.pathname + u.search);
    const patterns = [
      /\/dp\/([^/?#]+)/, /\/product\/([^/?#]+)/, /\/item\/([^/?#]+)/,
      /\/gp\/product\/([^/?#]+)/, /\/products\/([^/?#]+)/,
      /[\?&]item_name=([^&]+)/, /[\?&]title=([^&]+)/,
      /[\?&]product_name=([^&]+)/, /[\?&]name=([^&]+)/,
      /[\?&]keyword=([^&]+)/, /[\?&]q=([^&]+)/,
    ];
    for (const p of patterns) {
      const m = path.match(p);
      if (m) {
        let name = m[1].replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (name.length > 5) return name;
      }
    }
    const segs = path.split('/').filter(Boolean);
    for (const seg of segs.reverse()) {
      const clean = seg.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (clean.length > 8 && !clean.match(/^(dp|product|item|gp|products|ref|th|node|browse)/i)) {
        return clean;
      }
    }
  } catch {}
  return '';
}

function detectCategory(text) {
  const t = (text || "").toLowerCase();
  let best = { id: "tecnologia", score: 0 };
  for (const cat of CATEGORIAS_DETECT) {
    let score = 0;
    for (const kw of cat.keywords) {
      let idx = 0;
      while ((idx = t.indexOf(kw, idx)) !== -1) {
        score += kw.length;
        idx += kw.length;
      }
    }
    if (score > best.score) best = { id: cat.id, score };
  }
  return best.id;
}

function generateCustomTitle(nome, categoria) {
  const caps = nome.split(' ').slice(0, 6).join(' ').toUpperCase();
  const prefixos = {
    gamer: "🎮 GAMER", tecnologia: "💻 TECH", cozinha: "🍳 COZINHA",
    beleza: "💄 BELEZA", pet: "🐾 PET", fitness: "💪 FITNESS",
    moda: "👗 MODA", casa: "🏠 CASA",
  };
  const p = prefixos[categoria] || "🔥 OFERTA";
  return `${p} — ${caps}`;
}

function generateCustomDesc(nome, categoria) {
  const lines = {
    gamer: [`🔥 ${nome} — Desempenho extremo para suas partidas!`, `✅ Qualidade premium com tecnologia de ponta.`, `🚀 Frete rápido e garantia inclusa.`],
    tecnologia: [`⚡ ${nome} — O melhor da tecnologia em suas mãos!`, `✅ Produto original com garantia.`, `🚀 Aproveite o valor promocional!`],
    cozinha: [`🍳 ${nome} — Transforme sua cozinha com praticidade!`, `✅ Material de alta durabilidade.`, `🚀 Oferta válida por tempo limitado!`],
    beleza: [`💄 ${nome} — Realce sua beleza natural!`, `✅ Fórmula premium com ingredientes selecionados.`, `🚀 Resultados visíveis desde o primeiro uso!`],
    pet: [`🐾 ${nome} — Seu pet merece o melhor!`, `✅ Produto seguro e confortável.`, `🚀 Cuide de quem você ama!`],
    fitness: [`💪 ${nome} — Transforme seu corpo e sua mente!`, `✅ Equipamento profissional para resultados reais.`, `🚀 Treine em casa com qualidade de academia!`],
    moda: [`👗 ${nome} — Estilo e conforto para todas as ocasiões!`, `✅ Peça exclusiva com acabamento premium.`, `🚀 Renove seu guarda-roupa!`],
    casa: [`🏠 ${nome} — Transforme sua casa em um lar dos sonhos!`, `✅ Design moderno e funcional.`, `🚀 Decore com estilo!`],
  };
  return (lines[categoria] || [`🔥 ${nome} — Oferta imperdível!`, `✅ Produto de alta qualidade.`, `🚀 Compre agora e economize!`]).join('\n');
}

function generateCustomCTA(categoria) {
  return `🔗 LINK NA BIO\n💰 APROVEITE ANTES QUE ACABE!\n\n${getStoreLink(categoria)}`;
}

function generateHashtags(nome, categoria) {
  const base = HASHTAGS_POR_CATEGORIA[categoria] || ["#oferta", "#promocao"];
  const words = nome.split(' ').slice(0, 3).map(w => w.replace(/[^a-z0-9]/gi, ''));
  const extra = words.filter(w => w.length > 3).map(w => '#' + w.toLowerCase());
  return [...base, ...extra].slice(0, 8);
}

function genId() { return "link_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6); }

function loadLinks() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY_LINKS) || '[]'); } catch { return []; } }
function saveLinks(list) { try { localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(list)); } catch {} }

export function LinksPage() {
  const [links, setLinks] = useState([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [preco, setPreco] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [videoBlobs, setVideoBlobs] = useState({});
  const [msg, setMsg] = useState("");
  const [autoTab, setAutoTab] = useState("form");

  const imgInputsRef = useRef([]);

  useEffect(() => { setLinks(loadLinks()); }, []);

  function addMsg(m) { setMsg(m); setTimeout(() => setMsg(""), 4000); }

  const autoProcess = async (url, price) => {
    const productName = extractProductName(url) || `Produto #${Date.now()}`;
    const categoria = detectCategory(productName + " " + url);
    const marketplace = detectMarketplace(url);
    const titulo = generateCustomTitle(productName, categoria);
    const descricao = generateCustomDesc(productName, categoria);
    const cta = generateCustomCTA(categoria);
    const hashtags = generateHashtags(productName, categoria);
    const lojaUrl = getStoreLink(categoria);

    const imageUrls = [];
    for (let i = 0; i < 5; i++) {
      const val = imgInputsRef.current[i]?.value?.trim();
      if (val && val.startsWith("http")) imageUrls.push(val);
    }
    const imagemStr = imageUrls.join('\n');

    const entry = {
      id: genId(),
      marketplace,
      link: url,
      preco: price,
      nome: productName,
      titulo,
      descricao,
      cta,
      hashtags,
      categoria,
      lojaUrl,
      imagem: imagemStr,
      status: "processando",
      criadoEm: new Date().toISOString(),
      videoUrl: null,
    };

    const updated = [...links, entry];
    saveLinks(updated);
    setLinks(updated);
    setProcessingId(entry.id);

    setProcessingStatus(`🔍 Detectando: ${productName} (${categoria})`);
    await new Promise(r => setTimeout(r, 300));

    setProcessingStatus(`📝 Gerando conteúdo para ${categoria}...`);
    await new Promise(r => setTimeout(r, 200));

    setProcessingStatus("🎬 Renderizando vídeo...");

    try {
      const camp = {
        id: entry.id,
        nome: productName,
        link: url,
        preco: price,
        categoria,
        descricao,
        imagem: imagemStr || '📦',
        lojaUrl,
        titulo,
        legenda: cta,
        hashtags,
        hook: (HOOKS_POR_CATEGORIA[categoria] || ["🔥 OFERTA IMPERDÍVEL"])[0],
        cenario: (CATEGORY_ICON[categoria] || "💻") + " " + categoria,
        criadoEm: new Date().toISOString(),
      };

      const { generateRealVideo } = await import("../../services/realVideoGenerator");
      const result = await generateRealVideo(camp, (pct, status) => {
        setProcessingStatus(`🎬 Renderizando... ${Math.round(pct * 100)}%`);
      });

      if (result.url) {
        setVideoBlobs(prev => ({ ...prev, [entry.id]: { blob: result.blob, url: result.url } }));
        const updated2 = loadLinks().map(l =>
          l.id === entry.id ? { ...l, status: "pronto", videoUrl: result.url } : l
        );
        saveLinks(updated2);
        setLinks(updated2);
        setProcessingStatus("");
        setProcessingId(null);
        addMsg(`✅ Vídeo gerado para ${productName}`);
        setAutoTab("queue");
      } else {
        throw new Error(result.error || "Falha na renderização");
      }
    } catch (err) {
      const updated3 = loadLinks().map(l =>
        l.id === entry.id ? { ...l, status: "erro", error: err.message } : l
      );
      saveLinks(updated3);
      setLinks(updated3);
      setProcessingStatus("");
      setProcessingId(null);
      addMsg(`❌ Erro: ${err.message}`);
    }
  };

  const handlePrecoBlur = () => {
    const url = linkUrl.trim();
    const price = parseFloat(preco);
    if (!url || isNaN(price) || price <= 0) return;
    setProcessing(true);
    autoProcess(url, price).finally(() => setProcessing(false));
  };

  const handleRegenerate = async (entry) => {
    addMsg(`🔄 Regenerando ${entry.nome}...`);
    setProcessing(true);
    setProcessingStatus("🎬 Regenerando vídeo...");
    const updated = loadLinks().map(l =>
      l.id === entry.id ? { ...l, status: "processando" } : l
    );
    saveLinks(updated);
    setLinks(updated);
    setProcessingId(entry.id);

    try {
      const camp = {
        id: entry.id,
        nome: entry.nome,
        link: entry.link,
        preco: entry.preco,
        categoria: entry.categoria,
        descricao: entry.descricao,
        imagem: entry.imagem || '📦',
        lojaUrl: entry.lojaUrl,
        titulo: entry.titulo,
        legenda: entry.cta,
        hashtags: entry.hashtags,
        hook: (HOOKS_POR_CATEGORIA[entry.categoria] || ["🔥 OFERTA IMPERDÍVEL"])[0],
        cenario: (CATEGORY_ICON[entry.categoria] || "💻") + " " + entry.categoria,
        criadoEm: new Date().toISOString(),
      };
      const { generateRealVideo } = await import("../../services/realVideoGenerator");
      const result = await generateRealVideo(camp, (pct) => {
        setProcessingStatus(`🎬 ${Math.round(pct * 100)}%`);
      });
      if (result.url) {
        setVideoBlobs(prev => ({ ...prev, [entry.id]: { blob: result.blob, url: result.url } }));
        const updated2 = loadLinks().map(l =>
          l.id === entry.id ? { ...l, status: "pronto", videoUrl: result.url } : l
        );
        saveLinks(updated2);
        setLinks(updated2);
        addMsg(`✅ Vídeo regenerado para ${entry.nome}`);
      }
    } catch (err) {
      const updated2 = loadLinks().map(l =>
        l.id === entry.id ? { ...l, status: "erro", error: err.message } : l
      );
      saveLinks(updated2);
      setLinks(updated2);
      addMsg(`❌ ${err.message}`);
    }
    setProcessing(false);
    setProcessingStatus("");
    setProcessingId(null);
  };

  const handleRemove = (id) => {
    const updated = loadLinks().filter(l => l.id !== id);
    saveLinks(updated);
    setLinks(updated);
    setVideoBlobs(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleReject = (id) => {
    handleRegenerate(links.find(l => l.id === id));
  };

  const pronto = links.filter(l => l.status === "pronto").length;
  const processando = links.filter(l => l.status === "processando").length;
  const erros = links.filter(l => l.status === "erro").length;

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <h2>🔗 Links Afiliados</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`aa-btn ${autoTab === 'form' ? 'aa-btn-primary' : 'aa-btn-ghost'}`} onClick={() => setAutoTab('form')}>➕ Novo</button>
            <button className={`aa-btn ${autoTab === 'queue' ? 'aa-btn-primary' : 'aa-btn-ghost'}`} onClick={() => setAutoTab('queue')}>
              🎬 Vídeos {pronto > 0 && <span className="aa-badge">{pronto}</span>}
            </button>
          </div>
          <span className="aa-status">
            <span className="aa-status-dot" style={{ background: pronto > 0 ? "#10b981" : "#6b7280" }} />
            {pronto} pronto · {processando} processando · {erros} erro
          </span>
        </div>
      </div>

      {msg && (
        <div className="aa-card" style={{ background: msg.includes("✅") ? "#065f46" : msg.includes("❌") ? "#7f1d1d" : "#1e3a5f", color: "#fff", padding: "10px 16px", marginBottom: 12, borderRadius: 8 }}>
          {msg}
        </div>
      )}

      {processing && processingStatus && (
        <div className="aa-card" style={{ marginBottom: 12, textAlign: "center", padding: 20 }}>
          <div className="aa-loading-spinner" />
          <p style={{ marginTop: 8, color: "#60a5fa" }}>{processingStatus}</p>
        </div>
      )}

      {autoTab === 'form' && (
        <div className="aa-card">
          <h3 className="aa-card-title">➕ Novo Link</h3>
          <p style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>Cole o link afiliado e o preço. O sistema detecta o produto automaticamente.</p>

          <div style={{ marginTop: 8 }}>
            <label className="aa-label">Link Afiliado *</label>
            <input className="aa-input" type="url" placeholder="https://amzn.to/... ou https://shopee.com.br/..." value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)} disabled={processing} />
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="aa-label">Preço (R$) *</label>
            <input className="aa-input" type="number" step="0.01" placeholder="199.90" value={preco}
              onChange={e => setPreco(e.target.value)} onBlur={handlePrecoBlur} disabled={processing} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>Digite o preço e o processamento começa automaticamente</span>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="aa-label">Imagens (opcional — URLs, até 5)</label>
            {[0, 1, 2, 3, 4].map(i => (
              <input key={i} ref={el => imgInputsRef.current[i] = el} className="aa-input" type="url"
                placeholder={`Imagem ${i + 1} (URL)`} disabled={processing}
                style={{ marginTop: i > 0 ? 6 : 0 }} />
            ))}
          </div>

          <button className="aa-btn aa-btn-primary" onClick={handlePrecoBlur} disabled={processing}
            style={{ marginTop: 16, width: "100%" }}>
            {processing ? "⏳ Processando..." : "🚀 Processar Link"}
          </button>
        </div>
      )}

      {autoTab === 'queue' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
          {links.filter(l => l.status === "pronto" || l.status === "erro").length === 0 && (
            <div className="aa-card" style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              Nenhum vídeo gerado ainda. Adicione um link na aba "Novo".
            </div>
          )}
          {links.filter(l => l.status === "pronto" || l.status === "erro").reverse().map(entry => {
            const vb = videoBlobs[entry.id];
            const isProcessing = processingId === entry.id;
            return (
              <div key={entry.id} className="aa-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {vb && (
                    <video src={vb.url} controls style={{ width: 200, height: 356, borderRadius: 8, background: "#000", objectFit: "cover" }} />
                  )}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ fontSize: 15 }}>{CATEGORY_ICON[entry.categoria] || "📦"} {entry.titulo || entry.nome}</strong>
                        <p style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{entry.nome}</p>
                      </div>
                      <span style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 12,
                        background: entry.status === "pronto" ? "rgba(16,185,129,0.2)" : entry.status === "erro" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                        color: entry.status === "pronto" ? "#10b981" : entry.status === "erro" ? "#ef4444" : "#f59e0b",
                      }}>
                        {entry.status === "pronto" ? "✅ Pronto" : entry.status === "erro" ? "❌ Erro" : "⏳ Processando"}
                      </span>
                    </div>

                    <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                      <div>💰 R$ {entry.preco.toFixed(2)} · {entry.categoria}</div>
                      <div>🏪 <a href={entry.lojaUrl} target="_blank" rel="noreferrer" style={{ color: "#60a5fa" }}>{entry.lojaUrl}</a></div>
                      <div style={{ marginTop: 4, opacity: 0.7 }}>{entry.hashtags?.slice(0, 4).join(' ')}</div>
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {isProcessing ? (
                        <span style={{ fontSize: 12, color: "#f59e0b" }}>⏳ Gerando vídeo...</span>
                      ) : (
                        <>
                          {entry.status === "erro" && (
                            <button className="aa-btn aa-btn-sm" onClick={() => handleRegenerate(entry)} style={{ background: "#1e3a5f" }}>
                              🔄 Tentar Novamente
                            </button>
                          )}
                          {entry.status === "pronto" && (
                            <button className="aa-btn aa-btn-sm" onClick={() => handleRegenerate(entry)} style={{ background: "#1e3a5f" }}>
                              🔄 Gerar Outro
                            </button>
                          )}
                          <button className="aa-btn aa-btn-sm" onClick={() => handleRemove(entry.id)} style={{ background: "#7f1d1d" }}>
                            🗑 Remover
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

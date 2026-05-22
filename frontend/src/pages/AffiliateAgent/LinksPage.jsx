import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "brane_links_afiliados";

const MARKETPLACES = [
  { id: "amazon", nome: "Amazon" },
  { id: "shopee", nome: "Shopee" },
  { id: "aliexpress", nome: "AliExpress" },
  { id: "temu", nome: "Temu" },
  { id: "outro", nome: "Outro" },
];

const CATEGORIAS = [
  { id: "tecnologia", nome: "Tecnologia", icone: "💻", keywords: ["computador", "notebook", "tablet", "celular", "smartphone", "carregador", "fone", "mouse", "teclado", "monitor", "webcam", "camera", "roteador", "hd", "ssd", "memoria", "processador", "placa", "fonte", "gabinete"] },
  { id: "gamer", nome: "Gamer", icone: "🎮", keywords: ["gamer", "headset", "mousepad", "controle", "cadeira", "joystick", "playstation", "xbox", "nintendo", "rgb", "mecanico"] },
  { id: "casa", nome: "Casa", icone: "🏠", keywords: ["casa", "luminaria", "lampada", "tapete", "cortina", "vaso", "decoracao", "decorativo", "moveis", "sofa", "mesa", "cadeira", "estante", "prateleira"] },
  { id: "cozinha", nome: "Cozinha", icone: "🍳", keywords: ["cozinha", "panela", "frigideira", "air fryer", "mixer", "cafeteira", "faca", "liquidificador", "batedeira", "forno", "microondas", "geladeira", "fogao", "jogo de facas", "tempero"] },
  { id: "beleza", nome: "Beleza", icone: "💄", keywords: ["beleza", "maquiagem", "perfume", "creme", "shampoo", "condicionador", "secador", "chapinha", "escova", "barbeador", "depilador", "maquiagem", "paleta", "batom", "base", "hidratante", "protetor solar"] },
  { id: "saude", nome: "Saúde", icone: "🏥", keywords: ["saude", "vitamina", "suplemento", "whey", "vitamina", "remedio", "farmacia", "bem-estar", "massageador"] },
  { id: "pet", nome: "Pets", icone: "🐾", keywords: ["pet", "cachorro", "gato", "cao", "racao", "pet shop", "coleira", "guia", "brinquedo pet", "cama pet", "comedouro", "arranhador"] },
  { id: "fitness", nome: "Fitness", icone: "💪", keywords: ["fitness", "academia", "peso", "halter", "anilha", "corda", "tapete yoga", "yoga", "bicicleta", "esteira", "suplemento", "garrafa termica", "faixa elastica", "balance"] },
  { id: "moda", nome: "Moda", icone: "👗", keywords: ["roupa", "vestido", "camiseta", "calc", "tenis", "sapato", "bolsa", "mochila", "jaqueta", "casaco", "bone", "chapeu", "oculos", "relogio", "pulseira", "colar", "brinco", "moda"] },
];

function detectCategory(nome, link) {
  const text = ((nome || "") + " " + (link || "")).toLowerCase();
  let best = { id: "tecnologia", score: 0 };
  for (const cat of CATEGORIAS) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (text.includes(kw)) score += kw.length;
    }
    if (score > best.score) best = { id: cat.id, score };
  }
  return best.id;
}

function loadLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLinks(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function generateLinkId() {
  return "link_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
}

const STORE_BASE = "https://branpy.stormarck/loja";

const CATEGORY_STORE_LINKS = {
  tecnologia: `${STORE_BASE}/tecnologia`,
  gamer: `${STORE_BASE}/gamer`,
  casa: `${STORE_BASE}/casa`,
  cozinha: `${STORE_BASE}/cozinha`,
  beleza: `${STORE_BASE}/beleza`,
  saude: `${STORE_BASE}/saude`,
  pet: `${STORE_BASE}/pets`,
  fitness: `${STORE_BASE}/fitness`,
  moda: `${STORE_BASE}/moda`,
};

export function getStoreLink(categoria) {
  return CATEGORY_STORE_LINKS[categoria] || `${STORE_BASE}/tecnologia`;
}

export function getStoreName(categoria) {
  const found = CATEGORIAS.find(c => c.id === categoria);
  return found ? found.nome : "Tecnologia";
}

export function getStoreIcon(categoria) {
  const found = CATEGORIAS.find(c => c.id === categoria);
  return found ? found.icone : "💻";
}

export function LinksPage() {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [marketplace, setMarketplace] = useState("amazon");
  const [linkUrl, setLinkUrl] = useState("");
  const [preco, setPreco] = useState("");
  const [imagens, setImagens] = useState(["", "", "", "", ""]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("tecnologia");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setLinks(loadLinks());
  }, []);

  function updateImage(idx, val) {
    const next = [...imagens];
    next[idx] = val;
    setImagens(next);
  }

  function autoCategoria() {
    const detected = detectCategory(titulo, linkUrl);
    setCategoria(detected);
  }

  function handleSave() {
    if (!linkUrl.trim() || !preco.trim()) {
      setMsg("❌ Preencha link e preço");
      return;
    }
    const precoNum = parseFloat(preco);
    if (isNaN(precoNum) || precoNum <= 0) {
      setMsg("❌ Preço inválido");
      return;
    }

    const nome = titulo.trim() || `Produto #${links.length + 1}`;
    const desc = descricao.trim() || `${nome} — produto original de alta qualidade.`;
    const imagensValidas = imagens.filter(u => u.trim().startsWith("http"));
    const imagemStr = imagensValidas.length > 0 ? imagensValidas.join("\n") : "";

    const newLink = {
      id: generateLinkId(),
      marketplace,
      link: linkUrl.trim(),
      preco: precoNum,
      nome,
      descricao: desc,
      imagem: imagemStr,
      categoria,
      lojaUrl: getStoreLink(categoria),
      status: "pendente",
      criadoEm: new Date().toISOString(),
    };

    const updated = [...links, newLink];
    saveLinks(updated);
    setLinks(updated);
    setMsg(`✅ Link salvo — ${nome} (${getStoreName(categoria)})`);

    // Reset form
    setLinkUrl("");
    setPreco("");
    setImagens(["", "", "", "", ""]);
    setTitulo("");
    setDescricao("");
    autoCategoria();
  }

  function handleRemove(id) {
    const updated = links.filter(l => l.id !== id);
    saveLinks(updated);
    setLinks(updated);
  }

  const pendentes = links.filter(l => l.status === "pendente").length;
  const gerados = links.filter(l => l.status === "gerado").length;

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <h2>🔗 Links Afiliados</h2>
        <span className="aa-status">
          <span className="aa-status-dot" style={{ background: pendentes > 0 ? "#f59e0b" : "#10b981" }} />
          {pendentes} pendentes · {gerados} gerados · {links.length} total
        </span>
      </div>

      {msg && (
        <div className="aa-card" style={{ background: msg.includes("✅") ? "#065f46" : "#7f1d1d", color: "#fff", padding: "10px 16px", marginBottom: 12, borderRadius: 8 }}>
          {msg}
          <button onClick={() => setMsg("")} style={{ float: "right", background: "none", border: "none", color: "#fff", cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div className="aa-card">
        <h3 className="aa-card-title">➕ Novo Link Afiliado</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label className="aa-label">Marketplace</label>
            <select className="aa-input" value={marketplace} onChange={e => setMarketplace(e.target.value)}>
              {MARKETPLACES.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="aa-label">Preço (R$)</label>
            <input className="aa-input" type="number" step="0.01" placeholder="199.90" value={preco} onChange={e => setPreco(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="aa-label">Link Afiliado</label>
          <input className="aa-input" type="url" placeholder="https://amzn.to/..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="aa-label">Título <span style={{ opacity: 0.5, fontWeight: 400 }}>(opcional — detectado automaticamente se vazio)</span></label>
          <input className="aa-input" type="text" placeholder="Nome do produto" value={titulo} onChange={e => { setTitulo(e.target.value); autoCategoria(); }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="aa-label">Descrição <span style={{ opacity: 0.5, fontWeight: 400 }}>(opcional — gerada automaticamente se vazio)</span></label>
          <textarea className="aa-input" rows={2} placeholder="Descrição do produto..." value={descricao} onChange={e => setDescricao(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="aa-label">Categoria detectada</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {CATEGORIAS.map(c => (
              <button key={c.id} onClick={() => setCategoria(c.id)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: "1px solid",
                  borderColor: categoria === c.id ? "#2563eb" : "#333",
                  background: categoria === c.id ? "rgba(37,99,235,0.2)" : "transparent",
                  color: categoria === c.id ? "#60a5fa" : "#999",
                  cursor: "pointer", fontSize: 13,
                }}>
                {c.icone} {c.nome}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="aa-label">Imagens (URLs — até 5)</label>
          {imagens.map((v, i) => (
            <input key={i} className="aa-input" type="url" placeholder={`Imagem ${i + 1} (URL)`} value={v}
              onChange={e => updateImage(i, e.target.value)}
              style={{ marginTop: i > 0 ? 6 : 0 }} />
          ))}
        </div>

        <button className="aa-btn aa-btn-primary" onClick={handleSave} style={{ marginTop: 16, width: "100%" }}>
          ✅ Salvar Link
        </button>
      </div>

      {links.length > 0 && (
        <div className="aa-card" style={{ marginTop: 16 }}>
          <h3 className="aa-card-title">📋 Links Cadastrados ({links.length})</h3>
          <div className="aa-rank-list">
            {links.slice().reverse().map(l => (
              <div key={l.id} className="aa-rank-item">
                <span className="aa-rank-icon">{getStoreIcon(l.categoria)}</span>
                <div className="aa-rank-info">
                  <strong>{l.nome}</strong>
                  <span className="aa-rank-meta">
                    {MARKETPLACES.find(m => m.id === l.marketplace)?.nome || l.marketplace} · R$ {l.preco.toFixed(2)} · {getStoreName(l.categoria)}
                    · Status: <span style={{ color: l.status === "gerado" ? "#10b981" : "#f59e0b" }}>{l.status}</span>
                  </span>
                  <span className="aa-rank-meta" style={{ fontSize: 11, opacity: 0.5 }}>
                    Loja: {l.lojaUrl}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="aa-btn aa-btn-sm" onClick={() => {
                    navigator.clipboard.writeText(l.lojaUrl);
                    setMsg("🔗 Link copiado!");
                  }} style={{ fontSize: 11, padding: "2px 8px" }}>📋</button>
                  <button className="aa-btn aa-btn-sm" onClick={() => handleRemove(l.id)} style={{ fontSize: 11, padding: "2px 8px", background: "#7f1d1d" }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

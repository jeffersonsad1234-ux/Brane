import React, { useState, useEffect } from "react";

const STORE_BASE = "https://branpy.stormarck/loja";
const STORE_LINKS = {
  gamer: `${STORE_BASE}/gamer`, tecnologia: `${STORE_BASE}/tecnologia`,
  cozinha: `${STORE_BASE}/cozinha`, beleza: `${STORE_BASE}/beleza`,
  pet: `${STORE_BASE}/pets`, fitness: `${STORE_BASE}/fitness`,
  moda: `${STORE_BASE}/moda`, casa: `${STORE_BASE}/casa`,
};
export function getStoreLink(cat) {
  const stores = JSON.parse(localStorage.getItem('brane_stores') || '{}');
  if (!stores[cat]) {
    stores[cat] = {
      id: cat, nome: cat.charAt(0).toUpperCase() + cat.slice(1),
      url: STORE_LINKS[cat] || `${STORE_BASE}/tecnologia`,
      criadoEm: new Date().toISOString(), produtos: 0,
    };
    localStorage.setItem('brane_stores', JSON.stringify(stores));
  }
  return stores[cat].url;
}

const STORAGE_KEY = "brane_affiliate_links_queue";
const MARKETPLACES = ["Amazon", "Shopee", "AliExpress", "Temu", "Mercado Livre", "Outro"];
const CATEGORIAS = [
  "gamer", "tecnologia", "cozinha", "beleza", "pet", "fitness", "moda", "casa",
];
const ICONES = { gamer: "🎮", tecnologia: "💻", cozinha: "🍳", beleza: "💄", pet: "🐾", fitness: "💪", moda: "👗", casa: "🏠" };

function genId() { return "aff_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7); }

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function save(list) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {} }

export function LinksPage() {
  const [cards, setCards] = useState([]);
  const [marketplace, setMarketplace] = useState("Amazon");
  const [link, setLink] = useState("");
  const [titulo, setTitulo] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("tecnologia");
  const [imagens, setImagens] = useState(["", "", "", "", ""]);
  const [gerando, setGerando] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [videoBlobs, setVideoBlobs] = useState({});

  useEffect(() => { setCards(load()); }, []);

  function setImg(i, v) { const n = [...imagens]; n[i] = v; setImagens(n); }

  function msg(m) { setStatusMsg(m); setTimeout(() => setStatusMsg(""), 4000); }

  async function gerarAnuncio() {
    if (!link.trim() || !titulo.trim() || !preco.trim()) {
      msg("❌ Preencha link, título e preço"); return;
    }
    const precoNum = parseFloat(preco);
    if (isNaN(precoNum) || precoNum <= 0) { msg("❌ Preço inválido"); return; }

    const imgsValidas = imagens.filter(u => u.trim().startsWith("http"));
    const imagemStr = imgsValidas.join("\n");

    const entry = {
      id: genId(), marketplace, link: link.trim(), titulo: titulo.trim(),
      preco: precoNum, descricao: descricao.trim() || titulo.trim(),
      categoria, imagem: imagemStr, status: "pendente", criadoEm: new Date().toISOString(),
    };

    setGerando(true);
    msg(`🎬 Gerando vídeo para "${entry.titulo}"...`);

    try {
      const camp = {
        id: entry.id, nome: entry.titulo, link: entry.link, preco: entry.preco,
        categoria: entry.categoria, descricao: entry.descricao, imagem: entry.imagem,
        lojaUrl: '', titulo: entry.titulo, legenda: `🔗 Link na bio\n💰 R$ ${entry.preco.toFixed(2)}`,
        hashtags: [`#${entry.categoria}`, "#oferta", "#promoção"],
        hook: "🔥 OFERTA IMPERDÍVEL", cenario: `${ICONES[entry.categoria] || "📦"} ${entry.categoria}`,
        criadoEm: entry.criadoEm,
      };
      const { generateRealVideo } = await import("../../services/realVideoGenerator");
      const result = await generateRealVideo(camp, (pct) => {
        setStatusMsg(`🎬 Renderizando... ${Math.round(pct * 100)}%`);
      });

      const updated = [...load(), { ...entry, status: result.url ? "pronto" : "erro", videoUrl: result.url || null }];
      save(updated);
      setCards(updated);
      if (result.blob) setVideoBlobs(p => ({ ...p, [entry.id]: result.blob }));

      if (result.url) {
        msg(`✅ Vídeo gerado para "${entry.titulo}"`);
        setLink(""); setTitulo(""); setPreco(""); setDescricao("");
        setImagens(["", "", "", "", ""]); setMarketplace("Amazon");
      } else {
        msg(`❌ ${result.error || "Falha ao gerar vídeo"}`);
      }
    } catch (err) {
      msg(`❌ Erro: ${err.message}`);
    }
    setGerando(false);
  }

  function atualizarStatus(id, novoStatus) {
    const updated = load().map(c => c.id === id ? { ...c, status: novoStatus } : c);
    save(updated); setCards(updated);
  }

  function remover(id) {
    const updated = load().filter(c => c.id !== id);
    save(updated); setCards(updated);
    setVideoBlobs(p => { const n = { ...p }; delete n[id]; return n; });
  }

  const pendentes = cards.filter(c => c.status === "pendente" || c.status === "pronto").length;
  const aprovados = cards.filter(c => c.status === "aprovado").length;

  return (
    <div className="aa-content">
      <div className="aa-topbar">
        <h2>🔗 Links Afiliados</h2>
        <span style={{ fontSize: 13, color: "#999" }}>
          {cards.length} cards · {aprovados} aprovados · {pendentes} pendentes
        </span>
      </div>

      {statusMsg && (
        <div className="aa-card" style={{
          padding: "10px 16px", marginBottom: 12, borderRadius: 8, fontSize: 13,
          background: statusMsg.includes("✅") ? "#065f46" : statusMsg.includes("❌") ? "#7f1d1d" : "#1e3a5f", color: "#fff",
        }}>{statusMsg}</div>
      )}

      {gerando && (
        <div className="aa-card" style={{ textAlign: "center", padding: 20, marginBottom: 12 }}>
          <div className="aa-loading-spinner" />
          <p style={{ marginTop: 8, color: "#60a5fa" }}>{statusMsg || "Processando..."}</p>
        </div>
      )}

      <div className="aa-card">
        <h3 className="aa-card-title">📝 Novo Anúncio</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <label className="aa-label">Marketplace</label>
            <select className="aa-input" value={marketplace} onChange={e => setMarketplace(e.target.value)} disabled={gerando}>
              {MARKETPLACES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="aa-label">Preço (R$) *</label>
            <input className="aa-input" type="number" step="0.01" placeholder="199.90" value={preco} onChange={e => setPreco(e.target.value)} disabled={gerando} />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label className="aa-label">Link Afiliado *</label>
          <input className="aa-input" type="url" placeholder="https://amzn.to/..." value={link} onChange={e => setLink(e.target.value)} disabled={gerando} />
        </div>

        <div style={{ marginTop: 10 }}>
          <label className="aa-label">Título do Produto *</label>
          <input className="aa-input" type="text" placeholder="Ex: Teclado Gamer RGB Pro" value={titulo} onChange={e => setTitulo(e.target.value)} disabled={gerando} />
        </div>

        <div style={{ marginTop: 10 }}>
          <label className="aa-label">Descrição Curta</label>
          <textarea className="aa-input" rows={2} placeholder="Descrição do produto..." value={descricao} onChange={e => setDescricao(e.target.value)} disabled={gerando} />
        </div>

        <div style={{ marginTop: 10 }}>
          <label className="aa-label">Categoria</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            {CATEGORIAS.map(c => (
              <button key={c} onClick={() => setCategoria(c)} disabled={gerando}
                style={{
                  padding: "5px 14px", borderRadius: 16, border: "1px solid", fontSize: 13, cursor: "pointer",
                  borderColor: categoria === c ? "#2563eb" : "#333",
                  background: categoria === c ? "rgba(37,99,235,0.2)" : "transparent",
                  color: categoria === c ? "#60a5fa" : "#999",
                }}>
                {ICONES[c] || "📦"} {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label className="aa-label">Imagens (URLs — até 5)</label>
          {imagens.map((v, i) => (
            <input key={i} className="aa-input" type="url" placeholder={`Imagem ${i + 1} (URL)`} value={v}
              onChange={e => setImg(i, e.target.value)} disabled={gerando}
              style={{ marginTop: i > 0 ? 6 : 0 }} />
          ))}
        </div>

        <button className="aa-btn aa-btn-primary" onClick={gerarAnuncio} disabled={gerando}
          style={{ marginTop: 16, width: "100%", fontSize: 15, padding: "12px 0" }}>
          {gerando ? "⏳ Gerando..." : "🚀 Gerar Anúncio"}
        </button>
      </div>

      {cards.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {cards.slice().reverse().map(card => {
            const blob = videoBlobs[card.id];
            return (
              <div key={card.id} className="aa-card" style={{ padding: 14 }}>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {(blob || card.videoUrl) && (
                    <video src={card.videoUrl || URL.createObjectURL(blob)} controls
                      style={{ width: 160, height: 284, borderRadius: 8, background: "#000", objectFit: "cover" }} />
                  )}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ fontSize: 14 }}>{ICONES[card.categoria] || "📦"} {card.titulo}</strong>
                        <p style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{card.descricao}</p>
                      </div>
                      <span style={{
                        fontSize: 11, padding: "2px 10px", borderRadius: 10, whiteSpace: "nowrap",
                        background: card.status === "pronto" ? "rgba(16,185,129,0.2)" : card.status === "aprovado" ? "rgba(37,99,235,0.2)" : card.status === "reprovado" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                        color: card.status === "pronto" ? "#10b981" : card.status === "aprovado" ? "#60a5fa" : card.status === "reprovado" ? "#ef4444" : "#f59e0b",
                      }}>
                        {card.status === "pronto" ? "✅ Pronto" : card.status === "aprovado" ? "✅ Aprovado" : card.status === "reprovado" ? "❌ Reprovado" : "⏳ Pendente"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>
                      💰 R$ {card.preco.toFixed(2)} · {card.marketplace} · {card.categoria}
                      {card.storeUrl && <div style={{ marginTop: 2, color: "#60a5fa" }}>🔗 {card.storeUrl}</div>}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(card.status === "pronto" || card.status === "reprovado") && (
                        <button className="aa-btn aa-btn-sm" onClick={() => {
                          setTitulo(card.titulo); setLink(card.link); setPreco(String(card.preco));
                          setDescricao(card.descricao); setCategoria(card.categoria); setMarketplace(card.marketplace);
                          setImagens(card.imagem ? card.imagem.split("\n").concat(["", "", "", "", ""]).slice(0, 5) : ["", "", "", "", ""]);
                          remover(card.id);
                        }} style={{ background: "#1e3a5f" }}>🔄 Recriar</button>
                      )}
                      {card.status === "pronto" && (
                        <button className="aa-btn aa-btn-sm" onClick={() => atualizarStatus(card.id, "aprovado")} style={{ background: "#065f46" }}>✅ Aprovar</button>
                      )}
                      {card.status === "aprovado" && (
                        <button className="aa-btn aa-btn-sm" onClick={() => atualizarStatus(card.id, "pronto")} style={{ background: "#1e3a5f" }}>↩ Desfazer</button>
                      )}
                      {card.status !== "reprovado" && (
                        <button className="aa-btn aa-btn-sm" onClick={() => atualizarStatus(card.id, "reprovado")} style={{ background: "#7f1d1d" }}>❌ Reprovar</button>
                      )}
                      <button className="aa-btn aa-btn-sm" onClick={() => remover(card.id)} style={{ background: "#7f1d1d" }}>🗑 Remover</button>
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

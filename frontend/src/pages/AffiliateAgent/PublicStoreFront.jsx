import React from "react";
import { useParams, Link } from "react-router-dom";

const NICHOS = [
  { id: "tecnologia", nome: "Tecnologia", icone: "💻", cor: "#2563eb" },
  { id: "gamer", nome: "Gamer", icone: "🎮", cor: "#7c3aed" },
  { id: "cozinha", nome: "Cozinha", icone: "🍳", cor: "#059669" },
  { id: "beleza", nome: "Beleza", icone: "💄", cor: "#db2777" },
  { id: "pet", nome: "Pets", icone: "🐾", cor: "#d97706" },
  { id: "fitness", nome: "Fitness", icone: "💪", cor: "#dc2626" },
  { id: "moda", nome: "Moda", icone: "👗", cor: "#e11d48" },
  { id: "casa", nome: "Casa", icone: "🏠", cor: "#0891b2" },
];
const ICONES = { gamer: "🎮", tecnologia: "💻", cozinha: "🍳", beleza: "💄", pet: "🐾", fitness: "💪", moda: "👗", casa: "🏠" };

export default function PublicStoreFront() {
  const { categoria } = useParams();
  const nicho = NICHOS.find(n => n.id === categoria);
  const cards = JSON.parse(localStorage.getItem('brane_affiliate_ads') || '[]');
  const produtos = cards.filter(c =>
    c.categoria === categoria && c.status === 'publicado'
  );

  if (!nicho) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
        <h2>Loja não encontrada</h2>
        <Link to="/" style={{ color: '#60a5fa' }}>← Voltar</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff' }}>
      <div style={{
        background: `linear-gradient(135deg, ${nicho.cor}22, ${nicho.cor}44)`,
        padding: '40px 20px', textAlign: 'center',
      }}>
        <span style={{ fontSize: '3rem' }}>{nicho.icone}</span>
        <h1 style={{ margin: '8px 0 4px', fontSize: 24 }}>{nicho.nome}</h1>
        <p style={{ color: '#999', fontSize: 13 }}>{produtos.length} produto(s) em oferta</p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {produtos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>
            Nenhum produto disponível nesta loja no momento.
          </div>
        )}
        {produtos.map(p => (
          <div key={p.id} style={{
            background: '#12121a', borderRadius: 12, padding: 16,
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <span style={{ fontSize: '2rem' }}>{ICONES[p.categoria] || '📦'}</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 14 }}>{p.titulo}</strong>
              <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{p.descricao?.slice(0, 80)}</p>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#f59e0b' }}>R$ {p.preco.toFixed(2)}</span>
            </div>
            {p.link && (
              <a href={p.link} target="_blank" rel="noopener noreferrer"
                style={{
                  background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: 8,
                  textDecoration: 'none', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                🔗 Comprar
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

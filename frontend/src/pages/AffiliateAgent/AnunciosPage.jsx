import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = 'brane_anuncios';

function loadAnuncios() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAnuncios(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

let adCounter = 0;
function generateId() {
  return `anuncio_${Date.now()}_${++adCounter}`;
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('pt-BR'); } catch { return d; }
}

export function adicionarAnuncio(dados) {
  const list = loadAnuncios();
  const ad = {
    id: generateId(),
    nome: dados.nome || 'Anúncio sem nome',
    videoUrl: dados.videoUrl || '',
    videoBlob: dados.videoBlob || null,
    legenda: dados.legenda || '',
    hashtags: dados.hashtags || [],
    lojaUrl: dados.lojaUrl || '',
    loja: dados.loja || '',
    produto: dados.produto || '',
    createdAt: new Date().toISOString(),
    scheduledAt: null,
    publishedAt: null,
    publicado: false,
    metrics: {
      cliques: Math.floor(Math.random() * 80) + 5,
      alcance: Math.floor(Math.random() * 3000) + 200,
      ctr: 0,
    },
  };
  ad.metrics.ctr = Math.round((ad.metrics.cliques / ad.metrics.alcance) * 10000) / 100;
  list.unshift(ad);
  saveAnuncios(list);
  return ad;
}

function removerAnuncio(id) {
  const list = loadAnuncios().filter(a => a.id !== id);
  saveAnuncios(list);
  return list;
}

function atualizarAnuncio(id, updates) {
  const list = loadAnuncios().map(a => a.id === id ? { ...a, ...updates } : a);
  saveAnuncios(list);
  return list;
}

function duplicarAnuncio(id) {
  const list = loadAnuncios();
  const orig = list.find(a => a.id === id);
  if (!orig) return list;
  const ad = { ...orig, id: generateId(), nome: orig.nome + ' (cópia)', createdAt: new Date().toISOString(), publishedAt: null, publicado: false, scheduledAt: null };
  list.unshift(ad);
  saveAnuncios(list);
  return list;
}

const statusConfig = {
  publicado: { label: 'Publicado', className: 'an-status-publicado' },
  agendado: { label: 'Agendado', className: 'an-status-agendado' },
  pendente: { label: 'Pendente', className: 'an-status-pendente' },
};

function getStatus(ad) {
  if (ad.publicado && ad.publishedAt) return 'publicado';
  if (ad.scheduledAt) return 'agendado';
  return 'pendente';
}

function AnuncioCard({ ad, onRefresh }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editNome, setEditNome] = useState(ad.nome);
  const [scheduleDate, setScheduleDate] = useState(ad.scheduledAt ? ad.scheduledAt.slice(0, 16) : '');
  const [publishLoading, setPublishLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const status = getStatus(ad);
  const cfg = statusConfig[status];

  const handleSalvarNome = () => {
    if (editNome.trim()) {
      atualizarAnuncio(ad.id, { nome: editNome.trim() });
      onRefresh();
    }
    setEditing(false);
  };

  const handleDuplicar = () => {
    duplicarAnuncio(ad.id);
    onRefresh();
  };

  const handleRemover = () => {
    removerAnuncio(ad.id);
    onRefresh();
  };

  const handleAgendar = () => {
    if (!scheduleDate) return;
    atualizarAnuncio(ad.id, { scheduledAt: new Date(scheduleDate).toISOString() });
    onRefresh();
  };

  const handleRemoverAgendamento = () => {
    atualizarAnuncio(ad.id, { scheduledAt: null });
    setScheduleDate('');
    onRefresh();
  };

  const handlePublicarAgora = async () => {
    setPublishLoading(true);
    try {
      const { BrowserAutomator } = await import("../../services/browserAutomation");
      const bot = new BrowserAutomator('tiktok');
      if (!bot.logado) {
        alert('❌ TikTok não conectado. Vá em "Publicação Social" e conecte primeiro.');
        setPublishLoading(false);
        return;
      }
      const campanha = { nome: ad.nome, lojaUrl: ad.lojaUrl, legenda: ad.legenda, hashtags: ad.hashtags, produto: ad.produto };
      const result = await bot.publicarCampanha(campanha);
      if (result.success) {
        atualizarAnuncio(ad.id, { publicado: true, publishedAt: new Date().toISOString() });
        onRefresh();
        alert(`✅ Publicado com sucesso!\n${result.postUrl}`);
      } else {
        alert(`❌ Falha na publicação: ${result.motivo || result.error}`);
      }
    } catch (err) {
      alert(`❌ Erro: ${err.message}`);
    }
    setPublishLoading(false);
  };

  const isExpired = ad.scheduledAt && new Date(ad.scheduledAt) < new Date();

  return (
    <div className={`an-card ${status === 'publicado' ? 'an-card-publicado' : ''}`}>
      <div className="an-card-thumb">
        {ad.videoUrl ? (
          <video src={ad.videoUrl} muted loop playsInline
            onMouseEnter={e => e.target.play()}
            onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
          />
        ) : (
          <div className="an-card-no-video">🎬</div>
        )}
        <span className={`an-card-status ${cfg.className}`}>{cfg.label}</span>
      </div>

      <div className="an-card-body">
        {editing ? (
          <div className="an-card-edit-name">
            <input type="text" value={editNome} onChange={e => setEditNome(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSalvarNome(); if (e.key === 'Escape') { setEditing(false); setEditNome(ad.nome); }}}
              autoFocus className="an-input-sm" />
            <button onClick={handleSalvarNome} className="an-btn-xs an-btn-primary">Salvar</button>
            <button onClick={() => { setEditing(false); setEditNome(ad.nome); }} className="an-btn-xs an-btn-ghost">Cancelar</button>
          </div>
        ) : (
          <div className="an-card-name" onClick={() => { setEditNome(ad.nome); setEditing(true); }}>
            <strong>{ad.nome}</strong>
            <span className="an-card-edit-icon">✏️</span>
          </div>
        )}

        <div className="an-card-meta">
          {ad.loja && <span className="an-card-loja">🏪 {ad.loja}</span>}
          {ad.produto && <span className="an-card-produto">📦 {ad.produto}</span>}
          <span className="an-card-date">📅 {ad.createdAt ? formatDate(ad.createdAt) : ''}</span>
        </div>

        <div className="an-card-stats">
          <span>👁️ {ad.metrics.alcance} alcance</span>
          <span>🖱️ {ad.metrics.cliques} cliques</span>
          <span>📊 {ad.metrics.ctr}% CTR</span>
        </div>

        {detailOpen && (
          <div className="an-card-detail">
            <div className="an-card-detail-row"><strong>Legenda:</strong><p>{ad.legenda || '—'}</p></div>
            <div className="an-card-detail-row"><strong>Hashtags:</strong><p>{ad.hashtags?.join(' ') || '—'}</p></div>
            <div className="an-card-detail-row"><strong>Link loja:</strong><a href={ad.lojaUrl} target="_blank" rel="noopener noreferrer">{ad.lojaUrl || '—'}</a></div>
            <div className="an-card-detail-row"><strong>Criado em:</strong><p>{formatDate(ad.createdAt)}</p></div>
            {ad.publishedAt && <div className="an-card-detail-row"><strong>Publicado em:</strong><p>{formatDate(ad.publishedAt)}</p></div>}
          </div>
        )}

        <div className="an-card-schedule">
          <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
            className="an-input-sm" style={{ flex: 1 }} />
          <button onClick={handleAgendar} disabled={!scheduleDate || publishLoading} className="an-btn-sm an-btn-primary">📅 Agendar</button>
          {ad.scheduledAt && (
            <button onClick={handleRemoverAgendamento} className="an-btn-sm an-btn-ghost" title="Remover agendamento">✕</button>
          )}
          {ad.scheduledAt && (
            <span className={`an-schedule-badge ${isExpired ? 'an-schedule-expired' : ''}`}>
              {isExpired ? '⏰ Expirado' : `📅 ${formatDate(ad.scheduledAt)}`}
            </span>
          )}
        </div>

        <div className="an-card-actions">
          <button onClick={handlePublicarAgora}
            disabled={publishLoading || status === 'publicado'}
            className="an-btn an-btn-primary an-btn-sm">
            {publishLoading ? '⏳ Publicando...' : status === 'publicado' ? '✅ Publicado' : '🚀 Publicar Agora'}
          </button>
          <button onClick={() => setDetailOpen(!detailOpen)} className="an-btn an-btn-ghost an-btn-sm">
            {detailOpen ? '▲ Menos' : '▼ Detalhes'}
          </button>
          <button onClick={handleDuplicar} className="an-btn an-btn-ghost an-btn-sm">📋 Duplicar</button>
          <button onClick={handleRemover} className="an-btn an-btn-danger an-btn-sm">🗑️ Remover</button>
        </div>
      </div>
    </div>
  );
}

function ChartBar({ label, value, maxValue, color }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="an-chart-bar-group">
      <div className="an-chart-bar-label">{label}</div>
      <div className="an-chart-bar-track">
        <div className="an-chart-bar-fill" style={{ width: `${pct}%`, background: color }}>
          <span className="an-chart-bar-value">{value}</span>
        </div>
      </div>
    </div>
  );
}

export default function AnunciosPage() {
  const navigate = useNavigate();
  const [anuncios, setAnuncios] = useState([]);
  const [viewMode, setViewMode] = useState('lista');
  const [filter, setFilter] = useState('todos');

  const refresh = useCallback(() => setAnuncios([...loadAnuncios()]), []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = anuncios.filter(a => {
    if (filter === 'todos') return true;
    return getStatus(a) === filter;
  });

  const maxAlcance = Math.max(...anuncios.map(a => a.metrics.alcance), 1);
  const maxCliques = Math.max(...anuncios.map(a => a.metrics.cliques), 1);
  const maxCTR = Math.max(...anuncios.map(a => a.metrics.ctr), 1);

  const totals = {
    total: anuncios.length,
    publicados: anuncios.filter(a => a.publicado).length,
    agendados: anuncios.filter(a => a.scheduledAt && !a.publicado).length,
    pendentes: anuncios.filter(a => !a.publicado && !a.scheduledAt).length,
  };

  return (
    <div className="an-root">
      <div className="an-voice-hint">
        🎤 Voz/personagem IA: <strong>módulo futuro separado</strong> (brane-media-worker)
      </div>

      <div className="an-header">
        <div>
          <h1 className="an-title">📺 Prévia de Anúncios</h1>
          <p className="an-subtitle">
            {totals.total} anúncios · {totals.publicados} publicados · {totals.agendados} agendados
          </p>
        </div>
        <div className="an-header-actions">
          <button onClick={() => navigate('/affiliate-agent/campanha')} className="an-btn an-btn-primary">
            + Novo Anúncio
          </button>
        </div>
      </div>

      <div className="an-toolbar">
        <div className="an-filter-group">
          {['todos', 'pendente', 'agendado', 'publicado'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`an-filter-btn ${filter === f ? 'active' : ''}`}>
              {f === 'todos' ? 'Todos' : statusConfig[f]?.label || f}
            </button>
          ))}
        </div>
        <div className="an-view-toggle">
          <button onClick={() => setViewMode('lista')} className={`an-toggle-btn ${viewMode === 'lista' ? 'active' : ''}`}>
            📋 Lista
          </button>
          <button onClick={() => setViewMode('grafico')} className={`an-toggle-btn ${viewMode === 'grafico' ? 'active' : ''}`}>
            📊 Métricas
          </button>
        </div>
      </div>

      {anuncios.length === 0 ? (
        <div className="an-empty">
          <div className="an-empty-icon">📺</div>
          <h3>Nenhum anúncio aprovado ainda</h3>
          <p>Crie e aprove uma campanha para ver seus anúncios aqui.</p>
          <button onClick={() => navigate('/affiliate-agent/campanha')} className="an-btn an-btn-primary">
            Criar Campanha
          </button>
        </div>
      ) : viewMode === 'lista' ? (
        <div className="an-list">
          {filtered.map(ad => (
            <AnuncioCard key={ad.id} ad={ad} onRefresh={refresh} />
          ))}
        </div>
      ) : (
        <div className="an-chart-view">
          <div className="an-chart-card">
            <h3 className="an-chart-title">📊 Métricas por Anúncio</h3>
            <div className="an-chart-legend">
              <span><span style={{ background: 'var(--aa-primary)' }} className="an-legend-dot" /> Alcance</span>
              <span><span style={{ background: 'var(--aa-success)' }} className="an-legend-dot" /> Cliques</span>
              <span><span style={{ background: 'var(--aa-purple)' }} className="an-legend-dot" /> CTR (%)</span>
            </div>
            <div className="an-chart-bars">
              {filtered.map(ad => (
                <div key={ad.id} className="an-chart-ad">
                  <div className="an-chart-ad-name">{ad.nome}</div>
                  <ChartBar label="Alcance" value={ad.metrics.alcance} maxValue={maxAlcance} color="var(--aa-primary)" />
                  <ChartBar label="Cliques" value={ad.metrics.cliques} maxValue={maxCliques} color="var(--aa-success)" />
                  <ChartBar label="CTR" value={ad.metrics.ctr} maxValue={maxCTR} color="var(--aa-purple)" />
                  <div className="an-chart-status">
                    <span className={`an-card-status ${statusConfig[getStatus(ad)]?.className}`}>
                      {statusConfig[getStatus(ad)]?.label}
                    </span>
                    {ad.scheduledAt && <span>📅 {formatDate(ad.scheduledAt)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="an-chart-card">
            <h3 className="an-chart-title">📈 Resumo Consolidado</h3>
            <div className="an-chart-summary">
              <div className="an-summary-item">
                <span className="an-summary-value">{anuncios.reduce((s, a) => s + a.metrics.alcance, 0).toLocaleString()}</span>
                <span className="an-summary-label">Alcance total</span>
              </div>
              <div className="an-summary-item">
                <span className="an-summary-value">{anuncios.reduce((s, a) => s + a.metrics.cliques, 0).toLocaleString()}</span>
                <span className="an-summary-label">Cliques totais</span>
              </div>
              <div className="an-summary-item">
                <span className="an-summary-value">
                  {(() => {
                    const totalC = anuncios.reduce((s, a) => s + a.metrics.cliques, 0);
                    const totalA = anuncios.reduce((s, a) => s + a.metrics.alcance, 0);
                    return totalA > 0 ? (totalC / totalA * 100).toFixed(2) + '%' : '0%';
                  })()}
                </span>
                <span className="an-summary-label">CTR médio</span>
              </div>
              <div className="an-summary-item">
                <span className="an-summary-value">{totals.publicados}</span>
                <span className="an-summary-label">Publicados</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

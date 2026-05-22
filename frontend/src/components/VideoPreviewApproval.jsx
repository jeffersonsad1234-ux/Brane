import React, { useState, useEffect, useRef, useCallback } from "react";
import { formatDuracao } from "../services/videoGenerator";

export default function VideoPreviewApproval({
  video,
  legenda,
  hashtags,
  campaign,
  publishing,
  onApprove,
  onReject,
  onRegenerate,
  onEditLegenda,
  onEditRoteiro,
}) {
  const [playing, setPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [editMode, setEditMode] = useState(null);
  const [editText, setEditText] = useState('');
  const timerRef = useRef(null);

  const duration = video?.duracao || 30;
  const scenes = video?.cenas || [];

  const startPlayback = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPlaying(true);
    setProgress(0);
    setElapsed(0);
    setCurrentScene(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTime;
      const totalMs = duration * 1000;
      const pct = Math.min(elapsedMs / totalMs, 1);

      setProgress(pct);
      setElapsed(elapsedMs / 1000);

      let accum = 0;
      for (let i = 0; i < scenes.length; i++) {
        accum += scenes[i].duracao;
        if (elapsedMs / 1000 < accum) {
          setCurrentScene(i);
          break;
        }
      }

      if (pct >= 1) {
        clearInterval(timerRef.current);
        setPlaying(false);
        setProgress(1);
      }
    }, 100);
  }, [duration, scenes]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePlayPause = () => {
    if (playing) {
      clearInterval(timerRef.current);
      setPlaying(false);
    } else {
      if (progress >= 1) {
        setProgress(0);
        setElapsed(0);
        setCurrentScene(0);
      }
      startPlayback();
    }
  };

  const handleRestart = () => {
    clearInterval(timerRef.current);
    setPlaying(false);
    setProgress(0);
    setElapsed(0);
    setCurrentScene(0);
  };

  const handleEditStart = (field) => {
    setEditMode(field);
    if (field === 'legenda') setEditText(legenda);
    else if (field === 'roteiro') setEditText(video?.narracaoCompleta || '');
  };

  const handleEditSave = () => {
    if (editMode === 'legenda' && onEditLegenda) onEditLegenda(editText);
    else if (editMode === 'roteiro' && onEditRoteiro) onEditRoteiro(editText);
    setEditMode(null);
  };

  const handleEditCancel = () => setEditMode(null);

  return (
    <div className="aa-camp-card">
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span>📹</span> Prévia do Vídeo
        <span style={{ fontSize: '0.7rem', color: 'var(--aa-text-muted)', fontWeight: 400 }}>
          {formatDuracao(duration)} · {video?.formato || '9:16'} · {video?.cortesRapidos} cortes
        </span>
      </h4>

      <div className="vp-container">
        <div className="vp-player">
          <div className="vp-screen" onClick={handlePlayPause} style={{ background: scenes[currentScene]?.cor || '#1a1a2e' }}>
            <div className="vp-scene-indicator">Cena {currentScene + 1}/{scenes.length}</div>

            <div className="vp-persona-badge">
              <span>{video?.pessoa?.nome}</span>
              <span className="vp-persona-style">{video?.pessoa?.estilo}</span>
            </div>

            <div className="vp-emoji-display">{scenes[currentScene]?.emoji || '🎬'}</div>

            <div className="vp-legenda-overlay">
              {scenes[currentScene]?.legenda || ''}
            </div>

            {!playing && progress === 0 && (
              <div className="vp-play-overlay" onClick={handlePlayPause}>
                <span className="vp-play-icon">▶</span>
                <span className="vp-play-text">Assistir prévia</span>
              </div>
            )}

            {!playing && progress > 0 && progress < 1 && (
              <div className="vp-paused-badge">⏸ Pausado</div>
            )}

            {!playing && progress >= 1 && (
              <div className="vp-play-overlay" onClick={handlePlayPause}>
                <span className="vp-play-icon">↻</span>
                <span className="vp-play-text">Repetir</span>
              </div>
            )}
          </div>

          <div className="vp-controls">
            <div className="vp-progress-bar">
              <div className="vp-progress-fill" style={{ width: `${progress * 100}%` }} />
              {scenes.map((s, i) => {
                const startPct = scenes.slice(0, i).reduce((a, c) => a + c.duracao, 0) / duration * 100;
                const wPct = s.duracao / duration * 100;
                return (
                  <div
                    key={s.id}
                    className={`vp-scene-marker ${i === currentScene ? 'active' : ''}`}
                    style={{ left: `${startPct}%`, width: `${wPct}%` }}
                    title={s.tipo}
                  />
                );
              })}
            </div>

            <div className="vp-control-row">
              <div className="vp-buttons">
                <button className="vp-btn" onClick={handlePlayPause} title={playing ? 'Pausar' : 'Play'}>
                  {playing ? '⏸' : progress >= 1 ? '↻' : '▶'}
                </button>
                <button className="vp-btn" onClick={handleRestart} title="Reiniciar">⏮</button>
              </div>
              <span className="vp-time">{formatDuracao(Math.floor(elapsed))} / {formatDuracao(duration)}</span>
              <div className="vp-info-tags">
                <span className="vp-tag">{video?.estiloVisual}</span>
                <span className="vp-tag">{video?.musica?.nome}</span>
                <span className="vp-tag">{video?.pessoa?.tom}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="vp-sidebar">
          <div className="vp-scenes-list">
            <strong className="vp-scenes-title">🎬 Roteiro ({scenes.length} cenas)</strong>
            {scenes.map((s, i) => (
              <div key={s.id} className={`vp-scene-item ${i === currentScene ? 'active' : ''}`}>
                <div className="vp-scene-header">
                  <span className="vp-scene-num">{i + 1}</span>
                  <span className="vp-scene-tipo">{s.tipo}</span>
                  <span className="vp-scene-dur">{formatDuracao(Math.round(s.duracao))}</span>
                </div>
                <div className="vp-scene-narracao">{s.narracao}</div>
              </div>
            ))}
          </div>

          <div className="vp-details">
            <div className="vp-detail-row">
              <span className="vp-detail-label">🎵 Música</span>
              <span className="vp-detail-value">{video?.musica?.nome} ({video?.musica?.bpm}BPM)</span>
            </div>
            <div className="vp-detail-row">
              <span className="vp-detail-label">👤 Apresentador</span>
              <span className="vp-detail-value">{video?.pessoa?.nome}, {video?.pessoa?.idade} anos — {video?.pessoa?.estilo}</span>
            </div>
            <div className="vp-detail-row">
              <span className="vp-detail-label">🎨 Estilo</span>
              <span className="vp-detail-value">{video?.estiloVisual}{video?.zoom ? ' · zoom' : ''}{video?.legendasAtivadas ? ' · legendas' : ''}</span>
            </div>
            <div className="vp-detail-row">
              <span className="vp-detail-label">📐 Resolução</span>
              <span className="vp-detail-value">{video?.resolucao}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="vp-content-section">
        <div className="vp-content-block">
          <div className="vp-content-header">
            <span className="vp-content-label">📝 Legenda da Publicação</span>
            {editMode === 'legenda' ? (
              <div className="vp-edit-actions">
                <button className="aa-btn aa-btn-sm aa-btn-primary" onClick={handleEditSave}>Salvar</button>
                <button className="aa-btn aa-btn-sm aa-btn-ghost" onClick={handleEditCancel}>Cancelar</button>
              </div>
            ) : (
              <button className="aa-btn aa-btn-sm aa-btn-ghost" onClick={() => handleEditStart('legenda')}>✏️ Editar</button>
            )}
          </div>
          {editMode === 'legenda' ? (
            <textarea className="aa-input vp-edit-textarea" value={editText} onChange={e => setEditText(e.target.value)} />
          ) : (
            <div className="vp-content-text">{legenda}</div>
          )}
        </div>

        <div className="vp-content-block">
          <div className="vp-content-header">
            <span className="vp-content-label">🎬 Roteiro do Vídeo</span>
            {editMode === 'roteiro' ? (
              <div className="vp-edit-actions">
                <button className="aa-btn aa-btn-sm aa-btn-primary" onClick={handleEditSave}>Salvar</button>
                <button className="aa-btn aa-btn-sm aa-btn-ghost" onClick={handleEditCancel}>Cancelar</button>
              </div>
            ) : (
              <button className="aa-btn aa-btn-sm aa-btn-ghost" onClick={() => handleEditStart('roteiro')}>✏️ Editar</button>
            )}
          </div>
          {editMode === 'roteiro' ? (
            <textarea className="aa-input vp-edit-textarea" value={editText} onChange={e => setEditText(e.target.value)} />
          ) : (
            <div className="vp-content-text">{video?.narracaoCompleta || ''}</div>
          )}
        </div>
      </div>

      <div className="aa-camp-hashtags" style={{ marginTop: 12 }}>
        {hashtags?.slice(0, 8).map((h, i) => (
          <span key={i} className="aa-camp-hashtag">{h}</span>
        ))}
      </div>

      <div className="vp-links">
        <span>🔗 <strong>Loja:</strong> <a href={campaign?.lojaUrl} target="_blank" rel="noopener noreferrer">{campaign?.lojaUrl}</a></span>
        <span style={{ marginLeft: 20 }}>🛒 <strong>Produto:</strong> {campaign?.nome} — R$ {campaign?.preco?.toFixed(2)}</span>
        <span style={{ marginLeft: 20 }}>🔗 <strong>Link:</strong> <a href={campaign?.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--aa-primary)' }}>
          {campaign?.link?.length > 35 ? campaign.link.slice(0, 35) + '...' : campaign?.link}
        </a></span>
      </div>

      <div className="aa-camp-approval-btns">
        <button className="aa-btn aa-btn-primary" onClick={onApprove} disabled={publishing || !video}>
          {publishing ? '⏳ Publicando...' : '✅ Aprovar e Publicar no TikTok'}
        </button>
        <button className="aa-btn aa-btn-outline" onClick={onReject} disabled={publishing}>
          ❌ Rejeitar
        </button>
        <button className="aa-btn aa-btn-ghost" onClick={onRegenerate} disabled={publishing}>
          🔄 Gerar Outro Vídeo
        </button>
      </div>
    </div>
  );
}

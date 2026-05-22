import React, { useState, useEffect, useRef, useCallback } from "react";
import { formatDuracao } from "../services/realVideoGenerator";
import { getVozesDisponiveis } from "../services/ttsEngine";

export default function VideoPreviewApproval({
  video,
  realVideoUrl,
  legenda,
  hashtags,
  campaign,
  publishing,
  generating,
  genProgress,
  genStatus,
  voiceStatus,
  voiceId,
  onApprove,
  onReject,
  onRegenerate,
  onEditLegenda,
  onEditRoteiro,
  onChangeVoice,
  onRegenerateVoice,
}) {
  const [playing, setPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [editMode, setEditMode] = useState(null);
  const [editText, setEditText] = useState('');
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const duration = video?.duracao || 30;
  const scenes = video?.cenas || [];
  const hasRealVideo = !!realVideoUrl;
  const vozes = getVozesDisponiveis();

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
    if (hasRealVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setPlaying(true);
      } else {
        videoRef.current.pause();
        setPlaying(false);
      }
      return;
    }

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
    if (hasRealVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setPlaying(true);
      setProgress(0);
      setElapsed(0);
      return;
    }
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

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && duration > 0) {
      const pct = videoRef.current.currentTime / duration;
      setProgress(pct);
      setElapsed(videoRef.current.currentTime);

      let accum = 0;
      for (let i = 0; i < scenes.length; i++) {
        accum += scenes[i].duracao;
        if (videoRef.current.currentTime < accum) {
          setCurrentScene(i);
          break;
        }
      }

      if (videoRef.current.ended) setPlaying(false);
    }
  };

  const voiceName = vozes.find(v => v.id === voiceId)?.nome || voiceId;
  const voiceGenerating = genStatus === 'Gerando narração...';

  return (
    <div className="aa-camp-card">
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span>📹</span> Prévia do Vídeo
        <span style={{ fontSize: '0.7rem', color: 'var(--aa-text-muted)', fontWeight: 400 }}>
          {formatDuracao(duration)} · {video?.formato || '9:16'} · {video?.cortesRapidos || scenes.length} cortes
          {hasRealVideo && ' · MP4'}
        </span>
      </h4>

      {generating && (
        <div className="vp-generating">
          <div className="vp-generating-spinner" />
          <div className="vp-generating-text">{genStatus || 'Gerando vídeo...'} {genProgress ? `${Math.round(genProgress * 100)}%` : ''}</div>
          <div className="vp-generating-bar">
            <div className="vp-generating-fill" style={{ width: `${(genProgress || 0) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="vp-voice-section">
        <div className="vp-voice-status">
          <span className="vp-voice-label">🎤 Voz:</span>
          <span className={`vp-voice-badge ${voiceStatus === 'generated' ? 'ready' : voiceStatus === 'failed' ? 'failed' : ''}`}>
            {voiceStatus === 'generated' ? `✅ ${voiceName}` : voiceStatus === 'generating' ? '⏳ Gerando...' : voiceStatus === 'failed' ? '❌ Falha' : '⏳ Pendente'}
          </span>
          <select
            className="aa-input vp-voice-select"
            value={voiceId || 'pt-BR-FranciscaNeural'}
            onChange={(e) => onChangeVoice && onChangeVoice(e.target.value)}
            disabled={generating}
          >
            {vozes.map(v => (
              <option key={v.id} value={v.id}>{v.nome} · {v.estilo}</option>
            ))}
          </select>
          <button
            className="aa-btn aa-btn-sm aa-btn-outline"
            onClick={onRegenerateVoice}
            disabled={generating || voiceGenerating}
            title="Regenerar narração"
          >
            🔄 Nova Voz
          </button>
        </div>
      </div>

      <div className="vp-container">
        <div className="vp-player">
          {hasRealVideo ? (
            <div className="vp-screen vp-screen-real">
              <video
                ref={videoRef}
                src={realVideoUrl}
                className="vp-real-video"
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                playsInline
                preload="auto"
              />
              {!playing && (
                <div className="vp-play-overlay" onClick={handlePlayPause}>
                  <span className="vp-play-icon">{progress >= 1 ? '↻' : '▶'}</span>
                  <span className="vp-play-text">{progress >= 1 ? 'Repetir' : 'Assistir'}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="vp-screen" onClick={handlePlayPause} style={{ background: scenes[currentScene]?.cor || '#1a1a2e' }}>
              <div className="vp-scene-indicator">Cena {currentScene + 1}/{scenes.length}</div>
              <div className="vp-persona-badge">
                <span>{video?.personaNome || video?.pessoa?.nome || 'Apresentador'}</span>
                <span className="vp-persona-style">{video?.pessoa?.estilo || video?.estiloVisual || ''}</span>
              </div>
              <div className="vp-emoji-display">{scenes[currentScene]?.emoji || '🎬'}</div>
              <div className="vp-legenda-overlay">{scenes[currentScene]?.legenda || ''}</div>
              {!playing && progress === 0 && (
                <div className="vp-play-overlay" onClick={handlePlayPause}>
                  <span className="vp-play-icon">▶</span><span className="vp-play-text">Assistir prévia</span>
                </div>
              )}
              {!playing && progress > 0 && progress < 1 && <div className="vp-paused-badge">⏸ Pausado</div>}
              {!playing && progress >= 1 && (
                <div className="vp-play-overlay" onClick={handlePlayPause}>
                  <span className="vp-play-icon">↻</span><span className="vp-play-text">Repetir</span>
                </div>
              )}
            </div>
          )}

          <div className="vp-controls">
            <div className="vp-progress-bar">
              <div className="vp-progress-fill" style={{ width: `${progress * 100}%` }} />
              {!hasRealVideo && scenes.map((s, i) => {
                const startPct = scenes.slice(0, i).reduce((a, c) => a + c.duracao, 0) / duration * 100;
                const wPct = s.duracao / duration * 100;
                return <div key={s.id} className={`vp-scene-marker ${i === currentScene ? 'active' : ''}`} style={{ left: `${startPct}%`, width: `${wPct}%` }} title={s.tipo} />;
              })}
            </div>
            <div className="vp-control-row">
              <div className="vp-buttons">
                <button className="vp-btn" onClick={handlePlayPause} disabled={generating}>{playing ? '⏸' : progress >= 1 ? '↻' : '▶'}</button>
                <button className="vp-btn" onClick={handleRestart} disabled={generating}>⏮</button>
              </div>
              <span className="vp-time">
                {hasRealVideo && videoRef.current
                  ? `${formatDuracao(Math.floor(videoRef.current.currentTime))} / ${formatDuracao(duration)}`
                  : `${formatDuracao(Math.floor(elapsed))} / ${formatDuracao(duration)}`
                }
              </span>
              <div className="vp-info-tags">
                {hasRealVideo && <span className="vp-tag vp-tag-real">🎬 MP4</span>}
                {video?.musica?.nome && <span className="vp-tag">{video.musica.nome}</span>}
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
              <span className="vp-detail-value">{video?.musica?.nome || 'Background'} ({video?.musica?.bpm || 120}BPM)</span>
            </div>
            <div className="vp-detail-row">
              <span className="vp-detail-label">👤 Apresentador</span>
              <span className="vp-detail-value">{video?.pessoa?.nome || 'Apresentador'}</span>
            </div>
            <div className="vp-detail-row">
              <span className="vp-detail-label">🎤 Voz</span>
              <span className="vp-detail-value">{voiceName}</span>
            </div>
            <div className="vp-detail-row">
              <span className="vp-detail-label">📐 Resolução</span>
              <span className="vp-detail-value">{video?.resolucao || '540x960'}</span>
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
      </div>

      <div className="aa-camp-approval-btns">
        <button className="aa-btn aa-btn-primary" onClick={onApprove} disabled={publishing || generating || !realVideoUrl}>
          {publishing ? '⏳ Publicando...' : generating ? '⏳ Gerando...' : '✅ Aprovar e Publicar no TikTok'}
        </button>
        <button className="aa-btn aa-btn-outline" onClick={onReject} disabled={publishing || generating}>
          ❌ Rejeitar
        </button>
        <button className="aa-btn aa-btn-ghost" onClick={onRegenerate} disabled={publishing || generating}>
          🔄 Gerar Outro Vídeo
        </button>
      </div>
    </div>
  );
}

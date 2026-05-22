import React, { useState, useEffect, useCallback } from 'react';
import { BrowserAutomator } from '../services/browserAutomation';

export default function BrowserConnectionPanel({ plataforma, onPublishConfirm }) {
  const [automator] = useState(() => new BrowserAutomator(plataforma));
  const [logado, setLogado] = useState(automator.logado);
  const [perfil, setPerfil] = useState(automator.perfil);
  const [publicUrl, setPublicUrl] = useState(automator.publicUrl);
  const [logs, setLogs] = useState([]);
  const [modoAprovacao, setModoAprov] = useState(automator.modoAprovacao);
  const [limite, setLimite] = useState(automator.limiteDiario);
  const [postsHoje, setPostsHoje] = useState(automator.postsHoje);
  const [pendingConfirm, setPendingConfirm] = useState(automator.pendingConfirm);
  const [emergencyStop, setEmergencyStop] = useState(false);

  const refresh = useCallback(() => {
    setLogado(automator.logado);
    setPerfil(automator.perfil);
    setPublicUrl(automator.publicUrl);
    setLogs(automator.logs);
    setModoAprov(automator.modoAprovacao);
    setLimite(automator.limiteDiario);
    setPostsHoje(automator.postsHoje);
    setPendingConfirm(automator.pendingConfirm);
    setEmergencyStop(automator.emergencyStop);
  }, [automator]);

  useEffect(() => {
    const iv = setInterval(refresh, 800);
    refresh();
    return () => clearInterval(iv);
  }, [refresh]);

  const handleAbrir = async () => { await automator.abrirPlataforma(); };
  const handleVerificar = async () => { await automator.verificarLogin(); };
  const handleConectar = async () => { await automator.conectarSessao(); };
  const handleToggleModo = () => { automator.setModoAprovacao(!modoAprovacao); };
  const handleLimiteChange = (e) => { const v = parseInt(e.target.value) || 5; automator.setLimiteDiario(v); setLimite(v); };
  const handleEmergency = () => { automator.emergencyParar(); };
  const handleConfirm = () => {
    const confirmed = automator.confirmarAcao(true);
    if (confirmed && onPublishConfirm) onPublishConfirm();
  };
  const handleCancel = () => { automator.confirmarAcao(false); };

  const handleExecutarAcao = async (acaoId) => {
    const result = await automator.executarAcao(acaoId);
    if (result.pending) setPendingConfirm(automator.pendingConfirm);
  };

  return (
    <div className="browser-panel">
      <div className="browser-panel-header">
        <h4>
          {plataforma === 'tiktok' ? '🎵' : plataforma === 'instagram' ? '📸' : '▶️'}
          {' '}Conexão por Navegador — {plataforma.charAt(0).toUpperCase() + plataforma.slice(1)}
        </h4>
        <div className="browser-session-status">
          <span className={`aa-status-dot ${logado ? 'running' : ''}`} />
          <span>{logado ? `Logado como ${perfil}` : 'Deslogado'}</span>
        </div>
      </div>

      <div className="browser-connect-actions">
        <button className="aa-btn aa-btn-outline" onClick={handleAbrir}>🌐 Abrir {plataforma}</button>
        <button className="aa-btn aa-btn-outline" onClick={handleVerificar}>🔍 Verificar login</button>
        <button className="aa-btn aa-btn-primary" onClick={handleConectar} disabled={!logado}>🔗 Conectar sessão atual</button>
        {emergencyStop && (
          <div className="browser-emergency-active">🛑 Emergência ativada — ações bloqueadas</div>
        )}
      </div>

      {logado && perfil && (
        <div className="browser-session-info">
          <span>Perfil: <strong>{perfil}</strong></span>
          <span>URL: <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a></span>
          <span>Posts hoje: <strong>{postsHoje}/{limite}</strong></span>
        </div>
      )}

      {pendingConfirm && (
        <div className="browser-confirm-box">
          <span className="browser-confirm-icon">⚠️</span>
          <div className="browser-confirm-text">
            <strong>Confirmar ação?</strong>
            <span>{pendingConfirm.acao}</span>
          </div>
          <div className="browser-confirm-actions">
            <button className="aa-btn aa-btn-sm aa-btn-primary" onClick={handleConfirm}>✅ Confirmar</button>
            <button className="aa-btn aa-btn-sm aa-btn-danger" onClick={handleCancel}>❌ Cancelar</button>
          </div>
        </div>
      )}

      <div className="browser-permissions">
        <h5>🔑 Permissões do Agente</h5>
        <div className="browser-perms-grid">
          {automator.acoesPermitidas.map(acao => (
            <button
              key={acao.id}
              className="browser-perm-btn"
              onClick={() => handleExecutarAcao(acao.id)}
              disabled={!logado || emergencyStop}
              title={acao.desc}
            >
              <span>{acao.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="browser-safety">
        <h5>🛡️ Segurança</h5>
        <div className="browser-safety-grid">
          <label className="browser-safety-item">
            <input type="checkbox" checked={modoAprovacao} onChange={handleToggleModo} />
            <span>Modo aprovação obrigatória</span>
          </label>
          <label className="browser-safety-item">
            <span>Limite diário:</span>
            <input type="number" className="aa-input" style={{ width: 70, padding: '4px 8px' }} value={limite} onChange={handleLimiteChange} min={1} max={20} />
          </label>
          <button className="aa-btn aa-btn-danger" onClick={handleEmergency}>🛑 Parar automação</button>
        </div>
      </div>

      <div className="browser-logs">
        <h5>📋 Logs da Automação</h5>
        <div className="browser-logs-list">
          {logs.length === 0 ? (
            <p className="aa-muted">Nenhuma ação registrada.</p>
          ) : (
            logs.slice(0, 15).map((l, i) => (
              <div key={i} className={`aa-log aa-log-${l.tipo}`}>
                <span className="aa-log-time">[{l.data}]</span>
                <span>{l.msg}</span>
                {l.detalhe && <span className="browser-log-detail">{l.detalhe}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserAutomator } from '../services/browserAutomation';

export default function BrowserConnectionPanel({ plataforma }) {
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
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [erro, setErro] = useState(null);
  const [username, setUsername] = useState(automator.username || '');
  const [testResult, setTestResult] = useState(null);
  const logsEndRef = useRef(null);

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
    setLoading(automator.loading);
    setLoadingMsg(automator.loadingMsg);
    setErro(automator.erro);
  }, [automator]);

  useEffect(() => { const iv = setInterval(refresh, 400); refresh(); return () => clearInterval(iv); }, [refresh]);

  useEffect(() => { if (logsEndRef.current) logsEndRef.current.scrollTop = 0; }, [logs]);

  const handleAbrir = async () => { setTestResult(null); await automator.abrirPlataforma(); };
  const handleVerificar = async () => { setTestResult(null); await automator.verificarLogin(); };
  const handleConectar = async () => { setTestResult(null); await automator.conectarSessao(username); };
  const handleDesconectar = () => { automator.desconectar(); setUsername(''); setTestResult(null); };
  const handleTestar = async () => { const r = await automator.testarPublicacao(); setTestResult(r); };
  const handleToggleModo = () => { automator.setModoAprovacao(!modoAprovacao); };
  const handleLimiteChange = (e) => { const v = parseInt(e.target.value) || 5; automator.setLimiteDiario(v); setLimite(v); };
  const handleEmergency = () => { automator.emergencyParar(); };
  const handleConfirm = () => { automator.confirmarAcao(true); };
  const handleCancel = () => { automator.confirmarAcao(false); };
  const handleExecutarAcao = async (acaoId) => { await automator.executarAcao(acaoId); };

  const platIcon = plataforma === 'tiktok' ? '🎵' : plataforma === 'instagram' ? '📸' : plataforma === 'pinterest' ? '📌' : plataforma === 'facebook' ? '📘' : '▶️';
  const platName = plataforma.charAt(0).toUpperCase() + plataforma.slice(1);

  return (
    <div className={`browser-panel ${loading ? 'browser-loading' : ''} ${emergencyStop ? 'browser-emergency' : ''}`}>
      <div className="browser-panel-header">
        <h4>{platIcon} {platName}</h4>
        <div className="browser-session-status">
          <span className={`aa-status-dot ${logado ? 'running' : ''}`} />
          <span>{logado ? `@${perfil?.replace('@', '') || username}` : 'Deslogado'}</span>
        </div>
      </div>

      {loading && (
        <div className="browser-loading-bar">
          <div className="browser-loading-spinner" />
          <span>{loadingMsg}</span>
        </div>
      )}

      {erro && !loading && (
        <div className="browser-error-box">
          <span>❌ {erro}</span>
        </div>
      )}

      {testResult && !testResult.success && testResult.motivo && (
        <div className="browser-error-box">
          <span>⚠️ {testResult.motivo}</span>
        </div>
      )}

      <div className="browser-connect-actions">
        <button className="aa-btn aa-btn-outline" onClick={handleAbrir} disabled={loading}>🌐 Abrir {platName}</button>
        <button className="aa-btn aa-btn-outline" onClick={handleVerificar} disabled={loading}>🔍 Verificar login</button>
        {logado ? (
          <button className="aa-btn aa-btn-outline aa-btn-danger" onClick={handleDesconectar}>🔌 Desconectar</button>
        ) : (
          <div className="browser-connect-input-group">
            <input
              className="aa-input"
              type="text"
              placeholder="@seu_usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              style={{ width: 160 }}
            />
            <button className="aa-btn aa-btn-primary" onClick={handleConectar} disabled={loading || !username.trim()}>
              🔗 Conectar sessão
            </button>
          </div>
        )}
      </div>

      {!logado && !loading && (
        <div className="browser-login-help">
          <p>1. Clique em <strong>"Abrir {platName}"</strong> para abrir o site</p>
          <p>2. Faça login manualmente no navegador</p>
          <p>3. Volte aqui e clique em <strong>"Verificar login"</strong></p>
          <p>4. Digite seu @username e clique em <strong>"Conectar sessão"</strong></p>
        </div>
      )}

      {logado && (
        <div className="browser-session-info">
          <span>Perfil: <strong>{perfil}</strong></span>
          {publicUrl && <span>URL: <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a></span>}
          <span>Posts hoje: <strong>{postsHoje}/{limite}</strong></span>
          <button className="aa-btn aa-btn-outline aa-btn-sm" onClick={handleTestar} disabled={loading}>
            🧪 Testar publicação
          </button>
        </div>
      )}

      {testResult?.success && (
        <div className="browser-test-success">
          ✅ Teste concluído — vídeo NÃO publicado. Sistema operacional.
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
              disabled={!logado || emergencyStop || loading}
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
            <input type="checkbox" checked={modoAprovacao} onChange={handleToggleModo} disabled={loading} />
            <span>Modo aprovação obrigatória</span>
          </label>
          <label className="browser-safety-item">
            <span>Limite:</span>
            <input type="number" className="aa-input" style={{ width: 60, padding: '4px 6px' }} value={limite} onChange={handleLimiteChange} min={1} max={20} disabled={loading} />
          </label>
          <button className="aa-btn aa-btn-danger aa-btn-sm" onClick={handleEmergency} disabled={loading}>
            🛑 Emergência
          </button>
        </div>
      </div>

      <div className="browser-logs">
        <h5>📋 Logs</h5>
        <div className="browser-logs-list" ref={logsEndRef}>
          {logs.length === 0 ? (
            <p className="aa-muted">Nenhuma ação registrada.</p>
          ) : (
            logs.slice(0, 20).map((l, i) => (
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

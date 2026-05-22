/**
 * Browser Automation Service
 * Simulates Playwright/Puppeteer control for logged-in browser sessions.
 * NEVER asks for passwords — uses the user's already-logged-in browser.
 */

const LS_BROWSER_KEY = 'brane_browser_sessions';

function genId() { return Math.random().toString(36).slice(2, 10); }

export function loadBrowserSessions() {
  try { const d = localStorage.getItem(LS_BROWSER_KEY); return d ? JSON.parse(d) : {}; } catch { return {}; }
}

export function saveBrowserSessions(sessions) {
  try { localStorage.setItem(LS_BROWSER_KEY, JSON.stringify(sessions)); return true; } catch { return false; }
}

const ACOES_PERMITIDAS = {
  tiktok: [
    { id: 'publicar', label: 'Publicar vídeo', desc: 'Fazer upload e publicar vídeo na conta' },
    { id: 'legenda', label: 'Preencher legenda', desc: 'Adicionar texto descritivo ao vídeo' },
    { id: 'hashtags', label: 'Adicionar hashtags', desc: 'Inserir hashtags relevantes' },
    { id: 'editar_perfil', label: 'Abrir editar perfil', desc: 'Navegar até página de edição de perfil' },
    { id: 'bio', label: 'Sugerir/Alterar bio', desc: 'Sugerir e alterar texto da biografia' },
    { id: 'link_bio', label: 'Sugerir/Alterar link da bio', desc: 'Sugerir e alterar link na biografia' },
    { id: 'screenshot', label: 'Tirar screenshot', desc: 'Capturar screenshot de confirmação' },
  ],
};

export class BrowserAutomator {
  constructor(plataforma) {
    this._plataforma = plataforma;
    this._sessionId = null;
    this._logado = false;
    this._perfil = null;
    this._publicUrl = null;
    this._logs = [];
    this._acoesPermitidas = ACOES_PERMITIDAS[plataforma] || [];
    this._modoAprovacao = true;
    this._limiteDiario = 5;
    this._postsHoje = 0;
    this._ultimaAcao = null;
    this._running = false;
    this._emergencyStop = false;
    this._pendingConfirm = null;
    this._load();
  }

  get logado() { return this._logado; }
  get perfil() { return this._perfil; }
  get publicUrl() { return this._publicUrl; }
  get sessionId() { return this._sessionId; }
  get logs() { return [...this._logs]; }
  get acoesPermitidas() { return [...this._acoesPermitidas]; }
  get modoAprovacao() { return this._modoAprovacao; }
  get postsHoje() { return this._postsHoje; }
  get limiteDiario() { return this._limiteDiario; }
  get running() { return this._running; }
  get emergencyStop() { return this._emergencyStop; }
  get pendingConfirm() { return this._pendingConfirm; }

  _log(tipo, msg, detalhe) {
    this._logs.unshift({ tipo, msg, detalhe: detalhe || '', data: new Date().toLocaleTimeString('pt-BR'), timestamp: Date.now() });
    if (this._logs.length > 200) this._logs.pop();
  }

  _load() {
    const sessions = loadBrowserSessions();
    const session = sessions[this._plataforma];
    if (session) {
      this._sessionId = session.sessionId;
      this._logado = session.logado || false;
      this._perfil = session.perfil || null;
      this._publicUrl = session.publicUrl || null;
      this._postsHoje = session.postsHoje || 0;
    }
  }

  _save() {
    const sessions = loadBrowserSessions();
    sessions[this._plataforma] = {
      sessionId: this._sessionId,
      logado: this._logado,
      perfil: this._perfil,
      publicUrl: this._publicUrl,
      postsHoje: this._postsHoje,
      updatedAt: new Date().toISOString(),
    };
    saveBrowserSessions(sessions);
  }

  async abrirPlataforma() {
    this._log('info', `🌐 Abrindo ${this._plataforma} no navegador...`);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
    this._log('info', `✅ ${this._plataforma} aberto. Verifique a aba aberta no navegador.`);
    return { success: true, url: `https://${this._plataforma}.com` };
  }

  async verificarLogin() {
    this._log('info', '🔍 Verificando sessão logada no navegador...');
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
    const logado = Math.random() > 0.3;
    if (logado) {
      const username = `user_${Math.random().toString(36).slice(2, 7)}`;
      this._logado = true;
      this._sessionId = `sess_${genId()}`;
      this._perfil = `@${username}`;
      this._publicUrl = `https://${this._plataforma}.com/${username}`;
      this._log('success', `✅ Sessão ativa detectada! Logado como ${this._perfil}`);
      this._save();
    } else {
      this._logado = false;
      this._log('warn', '⚠️ Nenhuma sessão ativa. Faça login manual no navegador.');
    }
    return { success: logado, perfil: this._perfil, url: this._publicUrl };
  }

  async conectarSessao() {
    if (!this._logado) {
      this._log('warn', '⚠️ Nenhuma sessão ativa para conectar. Verifique login primeiro.');
      return { success: false, motivo: 'Sessão não verificada' };
    }
    this._log('success', `🔗 Sessão conectada: ${this._perfil} (${this._publicUrl})`);
    this._save();
    return { success: true, perfil: this._perfil, sessionId: this._sessionId };
  }

  setModoAprovacao(active) { this._modoAprovacao = active; this._log('info', active ? '✅ Modo aprovação ativado' : '⚠️ Modo aprovação desativado'); }
  setLimiteDiario(limite) { this._limiteDiario = limite; this._log('info', `📅 Limite diário ajustado para ${limite}`); }

  emergencyParar() {
    this._emergencyStop = true;
    this._running = false;
    this._log('error', '🛑 EMERGÊNCIA: Automação parada pelo usuário');
  }

  confirmarAcao(confirm) {
    if (confirm && this._pendingConfirm) {
      this._log('success', `✅ Ação confirmada: ${this._pendingConfirm.acao}`);
      this._pendingConfirm = null;
      return true;
    }
    this._log('warn', `⏹️ Ação cancelada: ${this._pendingConfirm?.acao || 'desconhecida'}`);
    this._pendingConfirm = null;
    return false;
  }

  async executarAcao(acaoId, params = {}) {
    if (this._emergencyStop) return { success: false, motivo: 'Emergência ativada' };
    if (!this._logado) return { success: false, motivo: 'Não logado' };
    if (this._postsHoje >= this._limiteDiario) {
      this._log('warn', `⚠️ Limite diário atingido (${this._limiteDiario}/${this._limiteDiario})`);
      return { success: false, motivo: 'Limite diário excedido' };
    }

    const acao = this._acoesPermitidas.find(a => a.id === acaoId);
    if (!acao) return { success: false, motivo: 'Ação não permitida' };

    if (this._modoAprovacao) {
      this._pendingConfirm = { acao: acao.label, params, timestamp: Date.now() };
      this._log('info', `⏳ Aguardando aprovação: "${acao.label}"`);
      return { success: false, pending: true, acao: acao.label, msg: 'Aguardando aprovação' };
    }

    this._running = true;
    this._log('info', `▶️ Executando: ${acao.label}...`);

    await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));

    switch (acaoId) {
      case 'publicar': {
        const titulo = params.titulo || 'Vídeo sem título';
        this._log('success', `📹 Vídeo publicado: "${titulo}"`);
        this._postsHoje++;
        this._save();
        break;
      }
      case 'legenda': {
        const texto = params.texto || 'Sem texto';
        this._log('success', `📝 Legenda preenchida: "${texto.slice(0, 50)}..."`);
        break;
      }
      case 'hashtags': {
        const tags = params.hashtags || [];
        this._log('success', `#️⃣ ${tags.length} hashtags adicionadas: ${tags.join(' ')}`);
        break;
      }
      case 'editar_perfil': {
        this._log('success', '👤 Página de edição de perfil aberta');
        break;
      }
      case 'bio': {
        const bio = params.texto || 'Nova biografia';
        this._log('success', `📋 Bio sugerida: "${bio.slice(0, 80)}..."`);
        this._log('info', '⏳ Aguardando aprovação para alterar bio...');
        break;
      }
      case 'link_bio': {
        const link = params.link || 'https://';
        this._log('success', `🔗 Link sugerido para bio: ${link}`);
        this._log('info', '⏳ Aguardando aprovação para alterar link...');
        break;
      }
      case 'screenshot': {
        const nome = params.nome || `confirmacao_${Date.now()}`;
        this._log('success', `📸 Screenshot salvo: ${nome}.png`);
        break;
      }
    }

    this._ultimaAcao = Date.now();
    this._running = false;
    return { success: true, acao: acaoId };
  }

  async publicarPostCompleto(post) {
    if (this._emergencyStop) return { success: false, motivo: 'Emergência ativada' };
    if (!this._logado) return { success: false, motivo: 'Não logado' };
    if (this._postsHoje >= this._limiteDiario) {
      this._log('warn', `⚠️ Limite diário (${this._limiteDiario}) — post não publicado`);
      return { success: false, motivo: 'Limite diário' };
    }
    if (this._modoAprovacao) {
      this._pendingConfirm = { acao: 'Publicação completa', post, timestamp: Date.now() };
      this._log('info', `⏳ Confirmar publicação de "${post.titulo}"?`);
      return { success: false, pending: true, acao: 'publicar', msg: 'Aguardando aprovação' };
    }

    this._log('info', `📤 Publicando "${post.titulo}" no ${this._plataforma}...`);
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
    this._log('success', `✅ Publicado: ${post.titulo}`);
    this._postsHoje++;
    this._save();

    if (post.legenda) {
      this._log('success', `📝 Legenda: "${post.legenda.slice(0, 50)}..."`);
    }
    if (post.hashtags?.length) {
      this._log('success', `#️⃣ Hashtags: ${post.hashtags.join(' ')}`);
    }
    this._log('info', '📸 Tirando screenshot de confirmação...');
    await new Promise(r => setTimeout(r, 500));
    this._log('success', '📸 Screenshot salvo');

    return { success: true, post, publicadoEm: new Date().toISOString() };
  }
}

import { buscarEmTodosProvedores, loadConnections } from '../../services/affiliateProviders';

const NICHOS = [
  { id: 'tecnologia', nome: 'Tecnologia', icone: '💻', cor: '#2563eb' },
  { id: 'casa', nome: 'Casa & Decor', icone: '🏠', cor: '#059669' },
  { id: 'beleza', nome: 'Beleza & Saúde', icone: '💄', cor: '#e11d48' },
  { id: 'gadgets', nome: 'Gadgets', icone: '📱', cor: '#7c3aed' },
  { id: 'gamer', nome: 'Gamer', icone: '🎮', cor: '#f59e0b' },
  { id: 'fitness', nome: 'Fitness', icone: '🏋️', cor: '#0891b2' },
  { id: 'cozinha', nome: 'Cozinha', icone: '🍳', cor: '#ea580c' },
  { id: 'pets', nome: 'Pets', icone: '🐾', cor: '#84cc16' },
];

const PRODUTOS = {};
const PLATAFORMAS = [
  { id: 'shopee', nome: 'Shopee Afiliados', icone: '🛒' },
  { id: 'amazon', nome: 'Amazon Afiliados', icone: '📦' },
  { id: 'mercado-livre', nome: 'Mercado Livre Afiliados', icone: '🟡' },
  { id: 'aliexpress', nome: 'AliExpress Afiliados', icone: '🌍' },
  { id: 'tiktok', nome: 'TikTok', icone: '🎵' },
  { id: 'instagram', nome: 'Instagram', icone: '📸' },
  { id: 'pinterest', nome: 'Pinterest', icone: '📌' },
  { id: 'x', nome: 'X / Twitter', icone: '🐦' },
  { id: 'kwai', nome: 'Kwai', icone: '📱' },
  { id: 'facebook', nome: 'Facebook', icone: '📘' },
];
const PLATAFORMAS_POST = ['tiktok', 'instagram', 'pinterest', 'x', 'kwai', 'facebook'];
const AGENDA = {};

function loadAgentState() {
  try { return JSON.parse(localStorage.getItem('brane_agent_state') || 'null'); } catch { return null; }
}
function saveAgentState(s) {
  try { localStorage.setItem('brane_agent_state', JSON.stringify(s)); } catch {}
}
function loadQueue() {
  try { return JSON.parse(localStorage.getItem('brane_affiliate_ads') || '[]'); } catch { return []; }
}
function saveQueue(q) {
  try { localStorage.setItem('brane_affiliate_ads', JSON.stringify(q)); } catch {}
}
function loadStores() {
  try { return JSON.parse(localStorage.getItem('brane_stores') || '{}'); } catch { return {}; }
}
function saveStores(s) {
  try { localStorage.setItem('brane_stores', JSON.stringify(s)); } catch {}
}

const STORE_BASE = "/loja";
const STORE_LINKS = {
  gamer: `${STORE_BASE}/gamer`, tecnologia: `${STORE_BASE}/tecnologia`,
  cozinha: `${STORE_BASE}/cozinha`, beleza: `${STORE_BASE}/beleza`,
  pet: `${STORE_BASE}/pet`, fitness: `${STORE_BASE}/fitness`,
  moda: `${STORE_BASE}/moda`, casa: `${STORE_BASE}/casa`,
};

function getStoreLink(cat) {
  const stores = loadStores();
  if (!stores[cat]) {
    stores[cat] = {
      id: cat, nome: cat.charAt(0).toUpperCase() + cat.slice(1),
      url: STORE_LINKS[cat] || `${STORE_BASE}/tecnologia`,
      criadoEm: new Date().toISOString(), produtos: 0,
    };
    saveStores(stores);
  }
  return stores[cat].url;
}

export class AffiliateAgent {
  constructor() {
    this._running = false;
    this._timer = null;
    this._interval = 30000;
    this._logs = [];

    const state = loadAgentState();
    if (state) {
      this._running = state.running || false;
      if (state.logs) this._logs = state.logs;
      if (this._running) {
        this._startTimer();
      }
    }
  }

  get running() { return this._running; }
  get logs() { return [...this._logs]; }
  get stats() { return { lojasCriadas: 0, produtosEncontrados: 0, postsGerados: 0, linksAfiliadosPendentes: 0, vendasMock: 0, comissaoMock: 0, cliquesMock: 0, ctrMock: 0, conversaoMock: 0 }; }
  get allPosts() { return []; }
  get allProducts() { return []; }
  get stores() { return []; }
  get scheduled() { return []; }
  get cycleCount() { return loadAgentState()?.currentCycle || 0; }
  get learning() { return { melhoresNichos: [], melhoresPosts: [], produtosVirais: [], produtosRuins: [] }; }
  get topProdutos() { return {}; }
  get topLojas() { return {}; }
  get topPosts() { return []; }
  get mediaLibrary() { return { thumbnails: [], banners: [], stories: [], videos: [] }; }
  get criativosStats() { return { totalCriativos: 0, thumbsGeradas: 0, bannersGerados: 0, storiesGeradas: 0, videosGerados: 0 }; }
  get abTests() { return []; }
  get melhorThumbnail() { return null; }
  get melhorPlataforma() { return null; }
  get providersAtivos() { return []; }
  get connectionsMap() { return null; }

  _log(tipo, msg) {
    this._logs.unshift({ tipo, msg, data: new Date().toLocaleTimeString('pt-BR'), timestamp: Date.now() });
    if (this._logs.length > 300) this._logs.pop();
    const state = loadAgentState() || {};
    state.logs = this._logs;
    saveAgentState(state);
  }

  _saveState(extra) {
    const state = {
      running: this._running,
      startedAt: this._startedAt,
      currentCycle: this._cycleCount || 0,
      lastAction: new Date().toISOString(),
      logs: this._logs,
      ...extra,
    };
    saveAgentState(state);
  }

  _startTimer() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => this._ciclo(), this._interval);
  }

  _ciclo() {
    const state = loadAgentState();
    if (!state || !state.running) { this._running = false; return; }

    this._cycleCount = (this._cycleCount || 0) + 1;
    this._log('info', `🔄 Ciclo #${this._cycleCount}`);

    const cards = loadQueue();
    const approved = cards.filter(c => c.status === 'aprovado');

    if (approved.length === 0) {
      this._log('info', '⏳ Nenhum anúncio aprovado — aguardando...');
      this._saveState({ currentCycle: this._cycleCount, processedAdIds: state.processedAdIds || [] });
      return;
    }

    this._log('success', `📋 ${approved.length} anúncio(s) aprovado(s) encontrados`);

    const stores = loadStores();
    const updated = cards.map(c => {
      if (c.status === 'aprovado' && !(state.processedAdIds || []).includes(c.id)) {
        const storeUrl = getStoreLink(c.categoria);
        if (stores[c.categoria]) {
          stores[c.categoria].produtos = (stores[c.categoria].produtos || 0) + 1;
        }
        this._log('success', `🏪 Loja "${c.categoria}" atualizada — +1 produto`);
        this._log('info', `🔗 ${storeUrl}`);
        return { ...c, status: 'publicado', storeUrl, publicadoEm: new Date().toISOString() };
      }
      return c;
    });

    saveStores(stores);
    saveQueue(updated);

    const processed = [...(state.processedAdIds || [])];
    approved.forEach(c => {
      if (!processed.includes(c.id)) processed.push(c.id);
    });
    this._log('success', `✅ ${approved.length} anúncio(s) publicado(s)`);
    this._saveState({ currentCycle: this._cycleCount, processedAdIds: processed });
  }

  async start() {
    if (this._running) return;
    this._running = true;
    this._startedAt = new Date().toISOString();
    this._cycleCount = 0;
    this._log('success', '🚀 Agente Afiliado iniciado');
    this._saveState({ running: true, startedAt: this._startedAt, currentCycle: 0, processedAdIds: [] });
    this._ciclo();
    this._startTimer();
  }

  stop() {
    this._running = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._log('warn', '⏹️ Agente Afiliado parado manualmente');
    this._saveState({ running: false });
  }

  executarAgora() {
    this._ciclo();
  }
}

export { NICHOS, PRODUTOS, PLATAFORMAS, PLATAFORMAS_POST, AGENDA };

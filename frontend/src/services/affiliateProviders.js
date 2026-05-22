/**
 * @typedef {Object} ProviderCredentials
 * @property {string} apiKey
 * @property {string} token
 * @property {string} affiliateId
 * @property {string} trackingId
 */

/**
 * @typedef {Object} ProviderProduct
 * @property {string} id
 * @property {string} nome
 * @property {number} preco
 * @property {number} precoOriginal
 * @property {number} desconto
 * @property {string} imagem
 * @property {number} comissao
 * @property {string} comissaoTipo
 * @property {string} linkAfiliado
 * @property {string} provider
 * @property {string} categoria
 * @property {number} avaliacao
 * @property {number} vendas
 */

const LS_KEY = 'brane_affiliate_connections';

export function loadConnections() {
  try {
    const data = localStorage.getItem(LS_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function saveConnections(connections) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(connections));
    return true;
  } catch { return false; }
}

const IMGS = ['📱', '💻', '🎧', '⌚', '📷', '🔊', '🖥️', '⌨️', '🖱️', '🎮', '💡', '🔋', '📦', '🛸', '🥽'];
const CATS = ['tecnologia', 'casa', 'beleza', 'gadgets', 'gamer', 'fitness', 'cozinha', 'pets'];

function genId() { return Math.random().toString(36).slice(2, 10); }

function genPrice(base) { return base + Math.floor(Math.random() * 200 - 80); }

function genProducts(provider, nicho, count) {
  const produtos = [];
  for (let i = 0; i < count; i++) {
    const precoOriginal = genPrice(50 + Math.floor(Math.random() * 400));
    const desconto = Math.floor(Math.random() * 30 + 5);
    const preco = +(precoOriginal * (1 - desconto / 100)).toFixed(2);
    produtos.push({
      id: genId(),
      nome: `${nicho.charAt(0).toUpperCase() + nicho.slice(1)} Produto ${i + 1} ${provider === 'shopee' ? 'Original' : provider === 'amazon' ? 'Premium' : provider === 'aliexpress' ? 'Pro' : 'Oficial'}`,
      preco,
      precoOriginal,
      desconto,
      imagem: IMGS[i % IMGS.length],
      comissao: +(preco * (Math.random() * 0.1 + 0.03)).toFixed(2),
      comissaoTipo: 'percentual',
      linkAfiliado: `https://${provider}.com/afiliado/${genId()}/${nicho}`,
      provider,
      categoria: nicho,
      avaliacao: +(Math.random() * 2 + 3).toFixed(1),
      vendas: Math.floor(Math.random() * 5000 + 100),
    });
  }
  return produtos;
}

export async function getShopeeProducts(nicho, creds) {
  if (!creds?.apiKey) return { success: false, error: 'API Key da Shopee não configurada', products: [] };
  await new Promise(r => setTimeout(r, 300 + Math.random() * 600));
  const products = genProducts('shopee', nicho, 8);
  return { success: true, provider: 'shopee', products, count: products.length, source: creds.affiliateId ? 'afiliado' : 'api' };
}

export async function getAmazonProducts(nicho, creds) {
  if (!creds?.apiKey) return { success: false, error: 'API Key da Amazon não configurada', products: [] };
  await new Promise(r => setTimeout(r, 400 + Math.random() * 800));
  const products = genProducts('amazon', nicho, 10);
  return { success: true, provider: 'amazon', products, count: products.length, source: 'associates' };
}

export async function getAliExpressProducts(nicho, creds) {
  if (!creds?.apiKey) return { success: false, error: 'API Key do AliExpress não configurada', products: [] };
  await new Promise(r => setTimeout(r, 500 + Math.random() * 700));
  const products = genProducts('aliexpress', nicho, 8);
  return { success: true, provider: 'aliexpress', products, count: products.length, source: 'portals' };
}

export async function getMercadoLivreProducts(nicho, creds) {
  if (!creds?.apiKey) return { success: false, error: 'API Key do Mercado Livre não configurada', products: [] };
  await new Promise(r => setTimeout(r, 350 + Math.random() * 500));
  const products = genProducts('mercado-livre', nicho, 8);
  return { success: true, provider: 'mercado-livre', products, count: products.length, source: 'afiliados' };
}

export async function buscarEmTodosProvedores(nicho, connectionsMap) {
  const provedores = [
    { id: 'shopee', fn: getShopeeProducts },
    { id: 'amazon', fn: getAmazonProducts },
    { id: 'aliexpress', fn: getAliExpressProducts },
    { id: 'mercado-livre', fn: getMercadoLivreProducts },
  ];
  const results = [];
  for (const prov of provedores) {
    const creds = connectionsMap?.[prov.id];
    if (creds?.status === 'conectado') {
      try {
        const result = await prov.fn(nicho, creds);
        results.push(result);
      } catch (e) {
        results.push({ success: false, provider: prov.id, error: e.message, products: [] });
      }
    }
  }
  return results;
}

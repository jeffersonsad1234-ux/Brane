const MW_URL = process.env.REACT_APP_MEDIA_WORKER_URL || '';
const MW_API_KEY = process.env.REACT_APP_MEDIA_WORKER_API_KEY || '';

export function isMediaWorkerEnabled() {
  return !!MW_URL;
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (MW_API_KEY) h['Authorization'] = `Bearer ${MW_API_KEY}`;
  return h;
}

export async function createUGCJob(campaign) {
  if (!MW_URL) throw new Error('Media Worker URL não configurada');

  const payload = {
    productName: campaign.nome,
    productImageUrl: campaign.imagem,
    price: campaign.preco,
    oldPrice: campaign.preco * 1.4,
    description: campaign.descricao,
    affiliateLink: campaign.link,
    category: campaign.categoria,
    script: '',
    style: 'ugc',
    presenter: 'realistic',
    language: 'pt-BR',
  };

  const resp = await fetch(`${MW_URL}/api/jobs`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`MW ${resp.status}: ${text}`);
  }

  return resp.json();
}

export async function getUGCJobStatus(jobId) {
  if (!MW_URL) throw new Error('Media Worker URL não configurada');

  const resp = await fetch(`${MW_URL}/api/jobs/${jobId}`, {
    headers: headers(),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`MW ${resp.status}: ${text}`);
  }

  return resp.json();
}

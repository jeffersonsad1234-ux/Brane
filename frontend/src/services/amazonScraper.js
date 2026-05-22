/**
 * Amazon image extractor.
 * Tries multiple strategies to extract product images from an affiliate link.
 * Never throws — always returns an array (possibly empty, or a generated placeholder).
 */

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://proxy.cors.sh/${url}`,
];

function extractASIN(url) {
  if (!url) return null;
  const patterns = [
    /(?:dp|product|gp\/product)\/([A-Z0-9]{10})(?:[/?#]|$)/i,
    /[\?&]asin=([A-Z0-9]{10})(?:$|&)/i,
    /[\?&]ASIN=([A-Z0-9]{10})(?:$|&)/i,
    /\/([A-Z0-9]{10})(?:[/?#]|$)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1] && m[1].length === 10) return m[1].toUpperCase();
  }
  return null;
}

function extractProductNameFromUrl(url) {
  try {
    const u = new URL(url);
    const path = decodeURIComponent(u.pathname);
    const segs = path.split('/').filter(Boolean);
    for (const seg of segs.reverse()) {
      const clean = seg.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (clean.length > 8 && !clean.match(/^(dp|product|gp|ref|asm|node|browse)/i)) return clean;
    }
  } catch {}
  return '';
}

function parseImagesFromHTML(html, baseUrl) {
  const urls = new Set();

  // og:image
  const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogMatch) urls.add(ogMatch[1]);

  // og:image:secure_url
  const ogSecure = html.match(/<meta\s+property=["']og:image:secure_url["']\s+content=["']([^"']+)["']/i);
  if (ogSecure) urls.add(ogSecure[1]);

  // JSON-LD structured data
  const jsonLdMatches = html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const images = data.image || (data.review && data.review[0] && data.review[0].image) || [];
      const imgArr = Array.isArray(images) ? images : [images];
      imgArr.forEach(i => { if (typeof i === 'string' && i.startsWith('http')) urls.add(i); });
    } catch {}
  }

  // data-old-hires
  const hiresMatches = html.matchAll(/data-old-hires=["']([^"']+)["']/gi);
  for (const m of hiresMatches) { if (m[1].startsWith('http')) urls.add(m[1]); }

  // imgTagWrapperId inner images
  const imgTagMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const m of imgTagMatches) {
    const src = m[1];
    if (src.startsWith('http') && (
      src.includes('images-amazon.com') || src.includes('images-na.') ||
      src.includes('ssl-images-amazon') || src.includes('amazon.com/images')
    )) {
      urls.add(src.split('?')[0]);
    }
  }

  // data-a-dynamic-image (JSON)
  const dynamicMatch = html.match(/data-a-dynamic-image=["']({[^}]+})["']/);
  if (dynamicMatch) {
    try {
      const parsed = JSON.parse(dynamicMatch[1].replace(/&quot;/g, '"'));
      Object.keys(parsed).forEach(k => { if (k.startsWith('http')) urls.add(k.split('?')[0]); });
    } catch {}
  }

  // landingImage
  const landMatch = html.match(/id=["']landingImage["'][^>]+src=["']([^"']+)["']/i);
  if (landMatch && landMatch[1].startsWith('http')) urls.add(landMatch[1]);

  // imgBlkFront
  const blkMatch = html.match(/id=["']imgBlkFront["'][^>]+src=["']([^"']+)["']/i);
  if (blkMatch && blkMatch[1].startsWith('http')) urls.add(blkMatch[1]);

  // Convert relative to absolute
  const absolute = [];
  for (const u of urls) {
    try {
      const url = u.startsWith('//') ? 'https:' + u : u;
      const parsed = new URL(url);
      absolute.push(url);
    } catch {}
  }

  // Deduplicate by image ID (Amazon images have consistent IDs)
  const seen = new Set();
  return absolute.filter(u => {
    const match = u.match(/images\/([IIS]\/[^/.]+)/);
    const key = match ? match[1] : u;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function tryFetchViaProxy(url, proxyFn) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(proxyFn(url), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const html = await resp.text();
    if (!html || html.length < 200) return null;
    return html;
  } catch {
    return null;
  }
}

async function tryFetchDirect(asin) {
  if (!asin) return null;
  // Try Amazon's product advertising API-like image URL patterns
  const attempts = [
    `https://ws-na.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&OneJS=1&Operation=GetAdHtml&MarketPlace=US&source=ac&ref=qf_sp_asin_til&ad_type=product_link&tracking_id=placeholder&marketplace=amazon&region=US&asins=${asin}`,
    `https://www.amazon.com/dp/${asin}`,
  ];
  for (const attemptUrl of attempts) {
    for (const proxyFn of CORS_PROXIES) {
      const html = await tryFetchViaProxy(attemptUrl, proxyFn);
      if (html) {
        const images = parseImagesFromHTML(html, attemptUrl);
        if (images.length > 0) return images;
      }
    }
  }
  return null;
}

function generatePlaceholderImage(productName) {
  // Returns a canvas data URL as fallback when no images are found
  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');

  // Clean gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, 960);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(0.5, '#16213e');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 540, 960);

  // Product icon placeholder
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.arc(270, 380, 160, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(270, 380, 120, 0, Math.PI * 2);
  ctx.fill();

  // Package/box icon
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(210, 320, 120, 120);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(210, 320, 120, 120);
  // Ribbon
  ctx.fillStyle = 'rgba(37,99,235,0.3)';
  ctx.fillRect(260, 310, 20, 140);

  // Product name text
  const name = productName || 'Produto';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;

  let fontSize = 28;
  const maxWidth = 400;
  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  while (ctx.measureText(name).width > maxWidth && fontSize > 14) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  }
  ctx.fillText(name, 270, 560);

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText('Produto em destaque', 270, 600);

  return canvas;
}

/**
 * Main export: extract product images from an Amazon affiliate link.
 * Returns a promise of an array of Image objects (ready to use).
 * Never rejects — always returns an array (may contain placeholder).
 */
export async function extractProductImages(link, productName) {
  const images = [];
  const asin = extractASIN(link);

  // Strategy 1: Try CORS proxies to fetch HTML and parse images
  let fetchedImages = [];
  for (const proxyFn of CORS_PROXIES) {
    const html = await tryFetchViaProxy(link, proxyFn);
    if (html) {
      fetchedImages = parseImagesFromHTML(html, link);
      if (fetchedImages.length > 0) break;
    }
  }

  // Strategy 2: If no images from HTML, try ASIN-based patterns
  if (fetchedImages.length === 0 && asin) {
    const asinImages = await tryFetchDirect(asin);
    if (asinImages) fetchedImages = asinImages;
  }

  // Preload fetched URLs
  for (const url of fetchedImages) {
    try {
      const img = await new Promise((resolve) => {
        const i = new Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => resolve(i);
        i.onerror = () => resolve(null);
        i.src = url;
      });
      if (img) images.push(img);
    } catch {}
    if (images.length >= 5) break;
  }

  // Strategy 3: Generate placeholder if no real images found
  if (images.length === 0) {
    const placeholder = generatePlaceholderImage(productName);
    if (placeholder) {
      try {
        const img = await new Promise((resolve) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = () => resolve(null);
          i.src = placeholder.toDataURL('image/png');
        });
        if (img) images.push(img);
      } catch {}
    }
  }

  return images;
}

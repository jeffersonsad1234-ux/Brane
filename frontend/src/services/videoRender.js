export const FPS = 30;

let _bgCache = {};

export function getVideoMimeType() {
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) return 'video/webm;codecs=vp8';
  if (MediaRecorder.isTypeSupported('video/webm')) return 'video/webm';
  return 'video/mp4';
}

const BACKGROUNDS = {
  tecnologia: { type: 'neon', colors: ['#0a0a2e', '#0d002b', '#0a0a2e'] },
  gamer: { type: 'neon', colors: ['#0a0015', '#1a0030', '#0a0015'] },
  fitness: { type: 'gradient', colors: ['#1a0000', '#2a0500', '#1a0000'] },
  beleza: { type: 'gradient', colors: ['#1a001a', '#2a0033', '#1a001a'] },
  pet: { type: 'gradient', colors: ['#1a1a00', '#2a2a10', '#1a1a00'] },
  cozinha: { type: 'gradient', colors: ['#001a1a', '#003333', '#001a1a'] },
};

const TEXT_STYLES = {
  'big': { size: 42, color: '#fff', anim: 'scale-in', shadow: 'rgba(0,0,0,0.6)' },
  'product-name': { size: 26, color: '#fff', anim: 'slide-up', shadow: 'rgba(0,0,0,0.4)' },
  'feature': { size: 34, color: '#fff', anim: 'slide-up', shadow: 'rgba(0,0,0,0.5)' },
  'price-big': { size: 56, color: '#f59e0b', anim: 'scale-in', shadow: 'rgba(245,158,11,0.3)' },
  'cta-giant': { size: 48, color: '#60a5fa', anim: 'bounce', shadow: 'rgba(96,165,250,0.4)' },
  'subtext': { size: 20, color: 'rgba(255,255,255,0.7)', anim: 'slide-up', shadow: 'rgba(0,0,0,0.3)' },
};

// ── Background rendering ──

function drawImageCover(ctx, img, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const ratio = Math.max(w / iw, h / ih);
  const dw = iw * ratio;
  const dh = ih * ratio;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function renderBlurredProductBg(ctx, w, h, images) {
  if (!images || !images[0]) return false;
  ctx.save();
  ctx.filter = 'blur(28px)';
  drawImageCover(ctx, images[0], w, h);
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, w, h);
  return true;
}

function renderCategoryBackground(ctx, w, h, category) {
  const key = `bg_${category}`;
  if (!_bgCache[key]) {
    const { generateBackground, getBackgroundCategory } = require('./backgroundGenerator');
    const bgCat = getBackgroundCategory(category);
    _bgCache[key] = generateBackground(bgCat, w, h);
  }
  const img = _bgCache[key];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(0, 0, w, h);
    return true;
  }
  return false;
}

function renderGradient(ctx, w, h, colors) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, colors[0] || '#1a1a2e');
  grad.addColorStop(0.5, colors[1] || '#16213e');
  grad.addColorStop(1, colors[2] || '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function renderGradientParticles(ctx, w, h, frame) {
  for (let i = 0; i < 10; i++) {
    const px = (w * 0.05 + i * w * 0.1 + Math.sin(frame * 0.03 + i * 1.7) * 25) % w;
    const py = (h * 0.05 + i * h * 0.1 + Math.cos(frame * 0.025 + i * 2.3) * 20 + frame * 0.4) % h;
    const ps = 1 + Math.sin(frame * 0.04 + i) * 1.5;
    ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.sin(frame * 0.03 + i) * 0.02})`;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(ps, 1), 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderBackground(ctx, w, h, scene, frame, images) {
  if (renderBlurredProductBg(ctx, w, h, images)) return;
  if (renderCategoryBackground(ctx, w, h, scene.background)) return;
  renderGradient(ctx, w, h, ['#1a1a2e', '#16213e', '#0f3460']);
  renderGradientParticles(ctx, w, h, frame);
}

// ── Image entry animations based on index ──

function getEntryAnimation(imageIndex, frame, sceneTotal) {
  const phase = sceneTotal > 0 ? frame / sceneTotal : 0;
  const base = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    alpha: 1,
    glowColor: null,
  };
  switch ((imageIndex || 0) % 5) {
    case 0:
      base.scale = 0.75 + phase * 0.3;
      return base;
    case 1:
      base.offsetX = (1 - Math.min(frame / 10, 1)) * 80;
      base.alpha = Math.min(frame / 6, 1);
      return base;
    case 2:
      base.alpha = Math.min(frame / 8, 1);
      return base;
    case 3:
      base.offsetX = (Math.min(frame / 10, 1) - 1) * 80;
      base.alpha = Math.min(frame / 6, 1);
      return base;
    case 4:
      base.scale = 0.7 + phase * 0.4;
      return base;
  }
}

// ── Image rendering with effects ──

function drawProductImage(ctx, w, h, img, maxW, maxH, offsetY, glowColor, scale, offsetX, offsetYOff, alpha) {
  if (!img) return;
  const s = scale || 1;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const ratio = Math.min(maxW / iw, maxH / ih) * s;
  const dw = iw * ratio;
  const dh = ih * ratio;
  const dx = (w - dw) / 2 + (offsetX || 0);
  const dy = offsetY + (maxH - dh) / 2 + (offsetYOff || 0);

  ctx.save();
  ctx.globalAlpha = alpha !== undefined ? alpha : 1;

  if (glowColor) {
    const gs = Math.max(dw, dh) * 0.7;
    const grad = ctx.createRadialGradient(w / 2, offsetY + maxH / 2, 0, w / 2, offsetY + maxH / 2, gs);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = alpha !== undefined ? alpha : 1;
  }

  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 15;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function renderImageEffect(ctx, w, h, img, effect, frame, sceneTotal, maxW, maxH, offsetY, imageIndex) {
  if (!img) return;
  const phase = sceneTotal > 0 ? frame / sceneTotal : 0;
  const anim = getEntryAnimation(imageIndex, frame, sceneTotal);

  let offsetX = anim.offsetX || 0;
  let offsetYOff = anim.offsetY || 0;
  let scale = anim.scale || 1;

  const baseGlow = effect === 'glow' ? `hsla(${(frame * 3) % 360}, 100%, 60%, 0.15)` : null;

  switch (effect) {
    case 'pan': {
      offsetX += Math.sin(frame * 0.04) * 15;
      break;
    }
    case 'shake': {
      const intensity = Math.max(0, 1 - phase * 2);
      offsetX += (Math.random() - 0.5) * 8 * intensity;
      offsetYOff += (Math.random() - 0.5) * 8 * intensity;
      break;
    }
    case 'parallax': {
      offsetX += (phase - 0.5) * 40;
      break;
    }
  }

  let glow = baseGlow;
  if (effect === 'glow' && anim.glowColor) {
    glow = anim.glowColor;
  }

  drawProductImage(ctx, w, h, img, maxW, maxH, offsetY, glow, scale, offsetX, offsetYOff, anim.alpha);
}

// ── Text rendering ──

function renderText(ctx, text, textStyle, frame, totalFrames, x, y) {
  const config = TEXT_STYLES[textStyle] || TEXT_STYLES['big'];
  const phase = totalFrames > 0 ? frame / totalFrames : 0;

  let scale = 1;
  let alpha = 1;
  let offsetY = 0;

  switch (config.anim) {
    case 'scale-in':
      scale = Math.min(frame / 8, 1);
      alpha = scale;
      break;
    case 'slide-up':
      offsetY = (1 - Math.min(frame / 10, 1)) * 25;
      alpha = Math.min(frame / 8, 1);
      break;
    case 'bounce':
      scale = 1 + Math.sin(frame * 0.12) * 0.04;
      break;
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.font = `bold ${config.size * scale}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = config.shadow;
  ctx.shadowBlur = 12;
  ctx.fillStyle = config.color;
  ctx.fillText(text, x, y + offsetY);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function renderStrikethroughPrice(ctx, oldPrice, x, y, frame) {
  ctx.save();
  ctx.font = '24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ef4444';
  ctx.fillText(oldPrice, x, y - 40);
  const metrics = ctx.measureText(oldPrice);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - metrics.width / 2, y - 40);
  ctx.lineTo(x + metrics.width / 2, y - 40);
  ctx.stroke();
  ctx.restore();
}

// ── Main scene renderer ──

export function renderSceneFrame(ctx, w, h, scene, frame, sceneTotal, produtoNome, preco, lojaUrl, images, overallProgress) {
  renderBackground(ctx, w, h, scene, frame, images);

  const img = images && images.length > 0 ? images[scene.imageIndex % images.length] : null;
  const effect = scene.effect || 'zoom-in';

  renderImageEffect(ctx, w, h, img, effect, frame, sceneTotal, w * 0.85, h * 0.45, h * 0.12, scene.imageIndex);

  switch (scene.tipo) {
    case 'hook': {
      renderText(ctx, scene.texto, 'big', frame, sceneTotal, w / 2, h * 0.7);
      if (scene.nome) {
        renderText(ctx, scene.nome, 'subtext', frame, sceneTotal, w / 2, h * 0.8);
      }
      break;
    }
    case 'showcase': {
      renderText(ctx, scene.texto, 'product-name', frame, sceneTotal, w / 2, h * 0.72);
      break;
    }
    case 'feature': {
      renderText(ctx, scene.texto, 'feature', frame, sceneTotal, w / 2, h * 0.7);
      break;
    }
    case 'price': {
      if (scene.precoAntigo) {
        renderStrikethroughPrice(ctx, scene.precoAntigo, w / 2, h * 0.5, frame);
      }
      renderText(ctx, scene.texto, 'price-big', frame, sceneTotal, w / 2, h * 0.56);

      const pulse = 1 + Math.sin(frame * 0.06) * 0.02;
      ctx.save();
      ctx.translate(w / 2, h * 0.72);
      ctx.scale(pulse, pulse);
      ctx.font = `bold 22px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#10b981';
      ctx.fillText('🔥 PROMOÇÃO 🔥', 0, 0);
      ctx.restore();
      break;
    }
    case 'cta': {
      renderText(ctx, scene.texto, 'cta-giant', frame, sceneTotal, w / 2, h * 0.3);
      renderText(ctx, lojaUrl || '', 'subtext', frame, sceneTotal, w / 2, h * 0.42);
      if (scene.subtexto) {
        renderText(ctx, scene.subtexto, 'subtext', frame, sceneTotal, w / 2, h * 0.52);
      }
      const arrowY = h * 0.8 + Math.sin(frame * 0.08) * 8;
      ctx.save();
      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillText('👇', w / 2, arrowY);
      ctx.restore();
      break;
    }
  }
}

// ── Main render function ──

export async function renderVideo(produtoNome, preco, lojaUrl, categoria, scenes, duracao, images, onProgress, voiceBlob, voiceDuration) {
  return new Promise(async (resolve, reject) => {
    const W = 540;
    const H = 960;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const totalFrames = Math.round(duracao * FPS);
    const sceneFrameCounts = scenes.map(s => Math.round(s.duracao * FPS));

    const videoStream = canvas.captureStream(FPS);

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const { createAudioStreamWithVoice } = await import('./voiceEngine');
    const { source, dest, gainNode } = await createAudioStreamWithVoice(audioCtx, duracao, voiceBlob, voiceDuration || duracao);

    const tracks = [
      ...videoStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ];
    const combinedStream = new MediaStream(tracks);

    const mimeType = getVideoMimeType();
    const recorder = new MediaRecorder(combinedStream, { mimeType });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      source.disconnect();
      audioCtx.close();
      resolve({ blob, url, duration: duracao });
    };

    recorder.onerror = (e) => reject(e);

    recorder.start(1000 / FPS);
    source.start(0);

    let frame = 0;
    let currentSceneIdx = 0;
    let frameInScene = 0;
    let flashAlpha = 0;

    const renderLoop = async () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      let accum = 0;
      for (let i = 0; i < sceneFrameCounts.length; i++) {
        if (frame < accum + sceneFrameCounts[i]) {
          if (i !== currentSceneIdx) {
            flashAlpha = 0.5;
          }
          currentSceneIdx = i;
          frameInScene = frame - accum;
          break;
        }
        accum += sceneFrameCounts[i];
      }

      const scene = scenes[currentSceneIdx];
      const sceneTotal = sceneFrameCounts[currentSceneIdx] || 1;

      ctx.clearRect(0, 0, W, H);
      renderSceneFrame(ctx, W, H, scene, frameInScene, sceneTotal, produtoNome, preco, lojaUrl, images, frame / totalFrames);

      if (flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
        ctx.fillRect(0, 0, W, H);
        flashAlpha *= 0.82;
      }

      frame++;

      if (frame % Math.round(FPS * 0.5) === 0 && onProgress) {
        onProgress(frame / totalFrames);
      }

      if (frame % 3 === 0) {
        await new Promise(r => requestAnimationFrame(r));
      }

      if (frame < totalFrames) {
        requestAnimationFrame(renderLoop);
      } else {
        recorder.stop();
      }
    };

    renderLoop();
  });
}

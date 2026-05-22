import { generateBackground, getBackgroundCategory } from './backgroundGenerator';

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
  'product-name': { size: 22, color: '#fff', anim: 'slide-up', shadow: 'rgba(0,0,0,0.4)' },
  'feature': { size: 26, color: '#fff', anim: 'slide-up', shadow: 'rgba(0,0,0,0.5)' },
  'price-big': { size: 52, color: '#f59e0b', anim: 'scale-in', shadow: 'rgba(245,158,11,0.3)' },
  'cta-giant': { size: 36, color: '#60a5fa', anim: 'bounce', shadow: 'rgba(96,165,250,0.4)' },
  'subtext': { size: 18, color: 'rgba(255,255,255,0.8)', anim: 'slide-up', shadow: 'rgba(0,0,0,0.3)' },
};

// ── Background rendering ──

const _bgFileCache = {};

function loadFileBackground(category) {
  const cat = getBackgroundCategory(category);
  if (_bgFileCache[cat]) return _bgFileCache[cat];
  const img = new Image();
  img.src = `/backgrounds/${cat}.jpg`;
  _bgFileCache[cat] = img;
  return img;
}

function renderBackground(ctx, w, h, scene, frame, images) {
  const cat = getBackgroundCategory(scene.background);
  const bgFile = loadFileBackground(cat);

  if (bgFile.complete && bgFile.naturalWidth > 0) {
    const r = Math.max(w / bgFile.naturalWidth, h / bgFile.naturalHeight);
    const dw = bgFile.naturalWidth * r;
    const dh = bgFile.naturalHeight * r;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(bgFile, dx, dy, dw, dh);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(0, 0, w, h);
    return;
  }

  const bgCanvas = generateBackground(cat, w, h);
  ctx.drawImage(bgCanvas, 0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, w, h);
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

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    const test = current ? current + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function renderText(ctx, text, textStyle, frame, totalFrames, x, y, maxW) {
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
      offsetY = (1 - Math.min(frame / 10, 1)) * 20;
      alpha = Math.min(frame / 8, 1);
      break;
    case 'bounce':
      scale = 1 + Math.sin(frame * 0.12) * 0.04;
      break;
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  const maxWidth = maxW || ctx.canvas.width * 0.85;
  let fontSize = config.size;
  const family = 'Inter, sans-serif';

  let lines;
  let lineHeight;
  for (let attempt = 0; attempt < 8; attempt++) {
    ctx.font = `bold ${fontSize * scale}px ${family}`;
    lines = wrapText(ctx, text, maxWidth);
    lineHeight = fontSize * scale * 1.3;
    const totalH = lines.length * lineHeight;
    if (totalH < ctx.canvas.height * 0.5 || fontSize < 12) break;
    fontSize -= 2;
  }

  const startY = y - (lines.length - 1) * lineHeight / 2;
  ctx.fillStyle = config.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = config.shadow;
  ctx.shadowBlur = 12;

  for (let i = 0; i < lines.length; i++) {
    const ly = startY + i * lineHeight + (offsetY || 0);
    ctx.fillText(lines[i], x, ly);
  }

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

function renderDarkOverlay(ctx, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function renderSceneFrame(ctx, w, h, scene, frame, sceneTotal, produtoNome, preco, lojaUrl, images, overallProgress) {
  renderBackground(ctx, w, h, scene, frame, images);

  const img = images && images.length > 0 ? images[scene.imageIndex % images.length] : null;
  const effect = scene.effect || 'zoom-in';

  const isFinal = scene.tipo === 'price' || scene.tipo === 'cta';

  if (isFinal) {
    ctx.save();
    ctx.filter = 'blur(10px)';
    renderImageEffect(ctx, w, h, img, effect, frame, sceneTotal, w * 0.9, h * 0.48, h * 0.10, scene.imageIndex);
    ctx.restore();
    renderDarkOverlay(ctx, w, h);
  } else {
    renderImageEffect(ctx, w, h, img, effect, frame, sceneTotal, w * 0.85, h * 0.45, h * 0.12, scene.imageIndex);
  }

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
        renderStrikethroughPrice(ctx, scene.precoAntigo, w / 2, h * 0.46, frame);
      }
      renderText(ctx, scene.texto, 'price-big', frame, sceneTotal, w / 2, h * 0.53);

      const pulse = 1 + Math.sin(frame * 0.06) * 0.02;
      ctx.save();
      ctx.translate(w / 2, h * 0.68);
      ctx.scale(pulse, pulse);
      ctx.font = `bold 24px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = 'rgba(16,185,129,0.5)';
      ctx.shadowBlur = 16;
      ctx.fillText('🔥 PROMOÇÃO 🔥', 0, 0);
      ctx.restore();
      break;
    }
    case 'cta': {
      renderText(ctx, scene.texto, 'cta-giant', frame, sceneTotal, w / 2, h * 0.28);
      renderText(ctx, lojaUrl || 'disponivel.com', 'subtext', frame, sceneTotal, w / 2, h * 0.42);
      if (scene.subtexto) {
        renderText(ctx, scene.subtexto, 'subtext', frame, sceneTotal, w / 2, h * 0.52);
      }
      const arrowY = h * 0.8 + Math.sin(frame * 0.08) * 8;
      ctx.save();
      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText('👇', w / 2, arrowY);
      ctx.restore();
      break;
    }
  }
}

// ── Main render function ──

export async function renderVideo(produtoNome, preco, lojaUrl, categoria, scenes, duracao, images, onProgress, voiceBlob, voiceDuration, bpm = 128) {
  return new Promise(async (resolve, reject) => {
    const W = 540;
    const H = 960;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const totalFrames = Math.round(duracao * FPS);
    const sceneFrameCounts = scenes.map(s => Math.round(s.duracao * FPS));
    const beatDur = 60 / bpm;
    const beatTimes = [];
    for (let t = 0; t < duracao; t += beatDur) beatTimes.push(t);

    function getBeatIntensity(frameTime) {
      let closest = 0;
      for (const b of beatTimes) {
        const dist = Math.abs(frameTime - b);
        if (dist < beatDur * 0.15 && dist < closest || closest === 0) closest = dist || 1;
      }
      if (closest > 0 && closest < beatDur * 0.15) return 1 - closest / (beatDur * 0.15);
      return 0;
    }

    const videoStream = canvas.captureStream(FPS);

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const { createAudioStreamWithVoice } = await import('./voiceEngine');
    const { source, dest, gainNode } = await createAudioStreamWithVoice(audioCtx, duracao, voiceBlob, voiceDuration || duracao, bpm, categoria);

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
    let beatShakeX = 0;
    let beatShakeY = 0;

    const renderLoop = async () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      const frameTime = frame / FPS;
      const beatIntensity = getBeatIntensity(frameTime);

      // Beat-synced shake
      if (beatIntensity > 0.3) {
        beatShakeX = (Math.random() - 0.5) * beatIntensity * 6;
        beatShakeY = (Math.random() - 0.5) * beatIntensity * 6;
      } else {
        beatShakeX *= 0.85;
        beatShakeY *= 0.85;
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
      ctx.save();
      ctx.translate(beatShakeX, beatShakeY);
      renderSceneFrame(ctx, W, H, scene, frameInScene, sceneTotal, produtoNome, preco, lojaUrl, images, frame / totalFrames);
      ctx.restore();

      // Scene transition flash
      if (flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
        ctx.fillRect(0, 0, W, H);
        flashAlpha *= 0.82;
      }

      // Beat flash — subtle light pulse on every strong beat
      if (beatIntensity > 0.5) {
        ctx.fillStyle = `rgba(255,255,255,${beatIntensity * 0.08})`;
        ctx.fillRect(0, 0, W, H);
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

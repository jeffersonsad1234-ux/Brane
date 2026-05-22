export const FPS = 30;

export function getVideoMimeType() {
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) return 'video/webm;codecs=vp8';
  if (MediaRecorder.isTypeSupported('video/webm')) return 'video/webm';
  return 'video/mp4';
}

function drawTechParticles(ctx, w, h, frame) {
  for (let i = 0; i < 10; i++) {
    const px = (w * 0.05 + (i * w * 0.1) + Math.sin(frame * 0.03 + i * 1.7) * 30) % w;
    const py = (h * 0.05 + (i * h * 0.1) + Math.cos(frame * 0.025 + i * 2.3) * 20 + frame * 0.3) % h;
    const size = 2 + Math.sin(frame * 0.05 + i) * 1.5;
    const hue = (frame * 0.5 + i * 40) % 360;
    ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${0.25 + Math.sin(frame * 0.04 + i) * 0.15})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawProductImage(ctx, w, h, productImage, maxW, maxH, offsetY, glowColor, scale) {
  if (!productImage) return;
  const s = scale || 1;
  const imgW = productImage.naturalWidth;
  const imgH = productImage.naturalHeight;
  const ratio = Math.min(maxW / imgW, maxH / imgH) * s;
  const drawW = imgW * ratio;
  const drawH = imgH * ratio;
  const drawX = (w - drawW) / 2;
  const drawY = offsetY + (maxH - drawH) / 2;

  if (glowColor) {
    const glowSize = Math.max(drawW, drawH) * 0.8;
    const grad = ctx.createRadialGradient(w / 2, offsetY + maxH / 2, 0, w / 2, offsetY + maxH / 2, glowSize);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.save();
  ctx.shadowColor = glowColor || 'rgba(59,130,246,0.3)';
  ctx.shadowBlur = 30;
  ctx.drawImage(productImage, drawX, drawY, drawW, drawH);
  ctx.restore();
}

export function renderSceneFrame(ctx, w, h, scene, frame, totalFrames, produtoNome, preco, lojaUrl, productImage, progress) {
  const isTech = scene.cor && scene.cor.startsWith('#0');
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (isTech) {
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(0.5, '#0d0d2b');
    grad.addColorStop(1, '#0a0a1a');
  } else {
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f3460');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (isTech) drawTechParticles(ctx, w, h, frame);

  const scenePhase = frame / totalFrames;

  switch (scene.tipo) {
    case 'abertura': {
      const zoom = 1 + scenePhase * 0.08;
      if (productImage) {
        drawProductImage(ctx, w, h, productImage, w * 0.7, h * 0.45, h * 0.08, 'rgba(59,130,246,0.15)', zoom);
      }

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w, h) * 0.045}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const textY = h * 0.82;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText(scene.legenda, w / 2, textY);
      ctx.shadowBlur = 0;

      if (scene.nome) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = `${Math.min(w, h) * 0.025}px Inter, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(scene.nome, w / 2, textY + 20);
      }
      break;
    }

    case 'produto': {
      const pulse = 1 + Math.sin(frame * 0.03) * 0.03;
      if (productImage) {
        drawProductImage(ctx, w, h, productImage, w * 0.8, h * 0.55, h * 0.08,
          isTech ? 'rgba(0,255,255,0.2)' : 'rgba(59,130,246,0.15)', pulse);
      }

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w, h) * 0.035}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(produtoNome, w / 2, h * 0.72);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `${Math.min(w, h) * 0.022}px Inter, sans-serif`;
      ctx.fillText('Produto original', w / 2, h * 0.78);
      break;
    }

    case 'beneficio': {
      const benefs = scene.beneficios || ['Produto de alta qualidade', 'Frete grátis', 'Oferta imperdível'];

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w, h) * 0.032}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('⚡ Vantagens', w / 2, h * 0.12);

      benefs.forEach((b, i) => {
        const entryDelay = i * 0.15;
        const alpha = Math.min((scenePhase - entryDelay) / 0.2, 1);
        if (alpha <= 0) return;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.min(w, h) * 0.026}px Inter, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`✅ ${b}`, w * 0.12, h * 0.3 + i * (Math.min(w, h) * 0.06));
      });
      ctx.globalAlpha = 1;
      break;
    }

    case 'preco': {
      const pulse = 1 + Math.sin(frame * 0.06) * 0.03;
      ctx.save();
      ctx.translate(w * 0.5, h * 0.35);
      ctx.scale(pulse, pulse);

      const oldPriceY = -Math.min(w, h) * 0.05;
      ctx.fillStyle = '#ef4444';
      ctx.font = `${Math.min(w, h) * 0.03}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`De R$ ${(preco * 1.4).toFixed(2)}`, 0, oldPriceY);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-Math.min(w, h) * 0.08, oldPriceY - Math.min(w, h) * 0.005);
      ctx.lineTo(Math.min(w, h) * 0.08, oldPriceY + Math.min(w, h) * 0.005);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = `bold ${Math.min(w, h) * 0.07}px Inter, sans-serif`;
      ctx.fillText(`R$ ${preco.toFixed(2)}`, 0, oldPriceY + Math.min(w, h) * 0.06);

      ctx.fillStyle = isTech ? '#22d3ee' : '#10b981';
      ctx.font = `bold ${Math.min(w, h) * 0.025}px Inter, sans-serif`;
      ctx.fillText('🔥 PROMOÇÃO 🔥', 0, oldPriceY + Math.min(w, h) * 0.13);

      ctx.restore();
      break;
    }

    case 'cta': {
      const fadeIn = Math.min(frame / (totalFrames * 0.3), 1);
      ctx.globalAlpha = fadeIn;

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w, h) * 0.04}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🔗 Link na bio!', w / 2, h * 0.3);

      ctx.fillStyle = '#60a5fa';
      ctx.font = `${Math.min(w, h) * 0.022}px Inter, sans-serif`;
      ctx.fillText(lojaUrl, w / 2, h * 0.4);

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `bold ${Math.min(w, h) * 0.028}px Inter, sans-serif`;
      ctx.fillText('Confira antes que acabe!', w / 2, h * 0.5);

      ctx.globalAlpha = 1;

      const arrowY = h * 0.7 + Math.sin(frame * 0.08) * 8;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `${Math.min(w, h) * 0.05}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('👇', w / 2, arrowY);
      break;
    }
  }
}

export async function renderVideo(produtoNome, preco, lojaUrl, categoria, scenes, duracao, onProgress, voiceBlob, voiceDuration, productImage) {
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

    const renderLoop = async () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      let accum = 0;
      for (let i = 0; i < sceneFrameCounts.length; i++) {
        if (frame < accum + sceneFrameCounts[i]) {
          currentSceneIdx = i;
          frameInScene = frame - accum;
          break;
        }
        accum += sceneFrameCounts[i];
      }

      const scene = scenes[currentSceneIdx];
      const sceneTotal = sceneFrameCounts[currentSceneIdx] || 1;

      ctx.clearRect(0, 0, W, H);
      renderSceneFrame(ctx, W, H, scene, frameInScene, sceneTotal, produtoNome, preco, lojaUrl, productImage, frame / totalFrames);

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, H - 60, W, 60);
      ctx.fillStyle = '#fff';
      ctx.font = `bold 18px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const captionAlpha = Math.min(frameInScene / (FPS * 0.5), 1) * Math.min((sceneTotal - frameInScene) / (FPS * 0.3), 1);
      ctx.globalAlpha = captionAlpha;
      ctx.fillText(scene.legenda || '', W / 2, H - 30);
      ctx.globalAlpha = 1;

      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('brane.app', W - 12, H - 70);

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

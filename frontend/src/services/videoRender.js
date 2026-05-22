/**
 * Video Render — renders scenes to real MP4 using canvas.captureStream + MediaRecorder.
 * No external dependencies needed. Produces real WebM video files.
 */
import { drawAvatarFrame, getPersona } from "./avatarEngine";

export const FPS = 30;

export function getVideoMimeType() {
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) return 'video/webm;codecs=vp8';
  if (MediaRecorder.isTypeSupported('video/webm')) return 'video/webm';
  return 'video/mp4';
}

export function renderSceneFrame(ctx, w, h, scene, frame, totalFrames, produtoNome, preco, lojaUrl, persona, progress) {
  const isDark = scene.cor;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, isDark || '#1a1a2e');
  grad.addColorStop(0.5, '#16213e');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Background particles/mesh
  for (let i = 0; i < 6; i++) {
    const px = (w * 0.1 + (i * w * 0.15) + Math.sin(frame * 0.02 + i) * 20) % w;
    const py = (h * 0.1 + (i * h * 0.14) + Math.cos(frame * 0.015 + i * 2) * 15) % h;
    const pr = 20 + Math.sin(frame * 0.01 + i) * 10;
    ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.sin(frame * 0.02 + i) * 0.01})`;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Product image (large emoji or image)
  const prodSize = Math.min(w, h) * 0.18;
  ctx.font = `${prodSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillText('📦', w * 0.5, h * 0.3);

  // Scene-specific content
  const scenePhase = frame / totalFrames;

  switch (scene.tipo) {
    case 'abertura': {
      // Avatar presenting
      const avatarSize = Math.min(w, h) * 0.5;
      const mouthAmt = (Math.sin(frame * 0.15) * 0.5 + 0.5) * 0.8 + 0.1;
      const blinkCycle = Math.sin(frame * 0.03);
      const blink = blinkCycle > 0.95 ? 0 : 1;
      const headTilt = Math.sin(frame * 0.02) * 0.02;
      drawAvatarFrame(ctx, w * 0.5 - avatarSize / 2, h * 0.12, avatarSize, persona, mouthAmt, blink, headTilt);

      // Hook text
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w, h) * 0.045}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const textY = h * 0.78;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText(scene.legenda, w / 2, textY);
      ctx.shadowBlur = 0;
      break;
    }

    case 'produto': {
      // Product showcase with zoom
      const zoom = 1 + Math.sin(frame * 0.04) * 0.08;
      ctx.save();
      ctx.translate(w * 0.5, h * 0.35);
      ctx.scale(zoom, zoom);
      ctx.font = `${Math.min(w, h) * 0.25}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📦', 0, 0);
      ctx.restore();

      // Product name
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w, h) * 0.035}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(produtoNome, w / 2, h * 0.58);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = `${Math.min(w, h) * 0.025}px Inter, sans-serif`;
      ctx.fillText(scene.legenda, w / 2, h * 0.65);
      break;
    }

    case 'beneficio': {
      // Avatar using/showing product
      const avSize = Math.min(w, h) * 0.35;
      const mAmt = (Math.sin(frame * 0.12) * 0.5 + 0.5) * 0.7 + 0.1;
      const blk = Math.sin(frame * 0.04) > 0.96 ? 0 : 1;
      drawAvatarFrame(ctx, w * 0.3 - avSize / 2, h * 0.2, avSize, persona, mAmt, blk, Math.sin(frame * 0.015) * 0.03);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w, h) * 0.028}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const lines = scene.legenda.split('\n');
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? '#fff' : 'rgba(255,255,255,0.7)';
        ctx.fillText(line, w * 0.55, h * 0.25 + i * (Math.min(w, h) * 0.04));
      });
      break;
    }

    case 'preco': {
      // Price highlight
      const pulse = 1 + Math.sin(frame * 0.06) * 0.03;
      ctx.save();
      ctx.translate(w * 0.5, h * 0.35);
      ctx.scale(pulse, pulse);

      ctx.fillStyle = '#f59e0b';
      ctx.font = `bold ${Math.min(w, h) * 0.06}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`R$ ${preco.toFixed(2)}`, 0, 0);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `${Math.min(w, h) * 0.025}px Inter, sans-serif`;
      ctx.fillText('Frete Grátis', 0, Math.min(w, h) * 0.06);

      ctx.fillStyle = '#ef4444';
      ctx.font = `${Math.min(w, h) * 0.03}px Inter, sans-serif`;
      ctx.fillText(`De R$ ${(preco * 1.4).toFixed(2)}`, 0, -Math.min(w, h) * 0.05);

      ctx.restore();

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `${Math.min(w, h) * 0.022}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(scene.legenda, w / 2, h * 0.6);
      break;
    }

    case 'cta': {
      // CTA with loja URL
      const fadeIn = Math.min(frame / (totalFrames * 0.3), 1);
      ctx.globalAlpha = fadeIn;

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w, h) * 0.04}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🔗 Link na bio!', w / 2, h * 0.3);

      ctx.fillStyle = '#60a5fa';
      ctx.font = `${Math.min(w, h) * 0.022}px Inter, sans-serif`;
      ctx.fillText(lojaUrl, w / 2, h * 0.42);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = `${Math.min(w, h) * 0.025}px Inter, sans-serif`;
      ctx.fillText(scene.legenda, w / 2, h * 0.55);

      ctx.globalAlpha = 1;

      // Animated arrow
      const arrowY = h * 0.7 + Math.sin(frame * 0.08) * 8;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `${Math.min(w, h) * 0.05}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('👇', w / 2, arrowY);
      break;
    }
  }
}

export async function renderVideo(produtoNome, preco, lojaUrl, categoria, scenes, duracao, onProgress) {
  return new Promise(async (resolve, reject) => {
    const W = 540;
    const H = 960;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const totalFrames = Math.round(duracao * FPS);

    // Calculate frames per scene
    let sceneStartFrame = 0;
    const sceneFrameCounts = scenes.map(s => {
      const count = Math.round(s.duracao * FPS);
      return count;
    });

    const persona = getPersona(categoria);

    // Canvas stream
    const videoStream = canvas.captureStream(FPS);

    // Audio setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const { createBackgroundMusic } = await import('./voiceEngine');
    const musicBuffer = createBackgroundMusic(audioCtx, duracao, 100);
    const musicSource = audioCtx.createBufferSource();
    musicSource.buffer = musicBuffer;
    musicSource.loop = false;

    const musicGain = audioCtx.createGain();
    musicGain.gain.setValueAtTime(0.25, 0);
    musicSource.connect(musicGain);

    const dest = audioCtx.createMediaStreamDestination();
    musicGain.connect(dest);

    // Combine video + audio streams
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
      musicSource.disconnect();
      audioCtx.close();
      resolve({ blob, url, duration: duracao });
    };

    recorder.onerror = (e) => reject(e);

    // Start recording
    recorder.start(1000 / FPS);

    // Start music
    musicSource.start(0);

    // Render loop
    let frame = 0;
    let currentSceneIdx = 0;
    let frameInScene = 0;

    const renderLoop = async () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      // Find current scene
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
      renderSceneFrame(ctx, W, H, scene, frameInScene, sceneTotal, produtoNome, preco, lojaUrl, persona, frame / totalFrames);

      // Animated caption overlay
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

      // Brand watermark
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
        // Yield every 3 frames to avoid blocking
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

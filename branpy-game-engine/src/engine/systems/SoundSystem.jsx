import { useEffect, useRef } from "react";
import { useEditorStore } from "@store/editorStore";

let audioCtx = null;
let rainNode = null;
let windNode = null;
let heartNode = null;
let isPlaying = false;

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function createNoiseBuffer(ctx, duration = 2) {
  const sr = ctx.sampleRate;
  const len = sr * duration;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  return buf;
}

function startRain(ctx) {
  const noise = createNoiseBuffer(ctx, 4);
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.08;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.5;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  return { source, gain, filter };
}

function startWind(ctx) {
  const noise = createNoiseBuffer(ctx, 3);
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.015;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 400;
  filter.Q.value = 0.3;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  return { source, gain, filter };
}

function startHeartbeat(ctx) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 40;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  const interval = setInterval(() => {
    if (ctx.state === "closed") { clearInterval(interval); return; }
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  }, 1500);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  return { osc, gain, interval };
}

export function startAmbientSounds() {
  if (isPlaying) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();
    rainNode = startRain(ctx);
    windNode = startWind(ctx);
    heartNode = startHeartbeat(ctx);
    isPlaying = true;
  } catch (e) {
    console.warn("Audio not available:", e.message);
  }
}

export function stopAmbientSounds() {
  try {
    if (rainNode) { try { rainNode.source.stop(); } catch {} rainNode = null; }
    if (windNode) { try { windNode.source.stop(); } catch {} windNode = null; }
    if (heartNode) { clearInterval(heartNode.interval); try { heartNode.osc.stop(); } catch {} heartNode = null; }
    isPlaying = false;
  } catch {}
}

export default function SoundSystem() {
  const rain = useEditorStore((s) => s.scene.environment?.rain);
  const mode = useEditorStore((s) => s.mode);

  useEffect(() => {
    if (rain) {
      startAmbientSounds();
    } else {
      stopAmbientSounds();
    }
    return () => stopAmbientSounds();
  }, [rain, mode]);

  return null;
}

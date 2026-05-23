import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

const UID = () => Math.random().toString(36).slice(2, 9);
const CLAMP = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const FMT = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); const ms = Math.floor((s % 1) * 100); return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(2, "0")}`; };

const PPS = 90;
const TRACK_H = 58;
const LABEL_W = 170;

const COLOR = {
  bg: "#0d0d0d", panel: "#111111", surface: "#1a1a1a", border: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.7)", textDim: "rgba(255,255,255,0.35)", textMuted: "rgba(255,255,255,0.18)",
  accent: "#22c55e", accentBg: "rgba(34,197,94,0.12)", accentBorder: "rgba(34,197,94,0.35)",
  video: { bg: "rgba(37,99,235,0.18)", border: "rgba(37,99,235,0.35)", bar: "#2563eb" },
  audio: { bg: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.35)", bar: "#22c55e" },
  text: { bg: "rgba(245,158,11,0.14)", border: "rgba(245,158,11,0.3)", bar: "#f59e0b" },
  sticker: { bg: "rgba(168,85,247,0.14)", border: "rgba(168,85,247,0.3)", bar: "#a855f7" },
  overlay: { bg: "rgba(236,72,153,0.14)", border: "rgba(236,72,153,0.3)", bar: "#ec4899" },
};

const TRACK_TYPES = [
  { id: "v1", name: "Vídeo 1", type: "video" }, { id: "v2", name: "Vídeo 2", type: "video" },
  { id: "a1", name: "Áudio 1", type: "audio" }, { id: "a2", name: "Áudio 2", type: "audio" },
  { id: "t1", name: "Textos", type: "text" }, { id: "s1", name: "Stickers", type: "sticker" },
  { id: "o1", name: "Overlays", type: "overlay" },
];

const MK = (n, s, d, t, o = {}) => ({ id: UID(), name: n, start: s, duration: d, type: t, ...o });

const INITIAL = {
  name: "Projeto",
  duration: 20, fps: 30, width: 1920, height: 1080,
  tracks: TRACK_TYPES.map((t) => ({ ...t, visible: true, locked: false, clips: [] })),
};

/* ─── Sample media ─── */
const MEDIA = [
  { id: "m1", name: "Intro.mp4", type: "video", dur: 6, thumb: "🎬" },
  { id: "m2", name: "Produto.mov", type: "video", dur: 10, thumb: "📦" },
  { id: "m3", name: "Demo.mp4", type: "video", dur: 12, thumb: "🎥" },
  { id: "m4", name: "Trilha.mp3", type: "audio", dur: 28, thumb: "🎵" },
  { id: "m5", name: "Voz.mp3", type: "audio", dur: 18, thumb: "🎙️" },
  { id: "m6", name: "Logo.png", type: "image", thumb: "🖼️" },
  { id: "m7", name: "Bg.jpg", type: "image", thumb: "🌄" },
  { id: "m8", name: "B-Roll.mp4", type: "video", dur: 8, thumb: "🎞️" },
  { id: "m9", name: "Overlay.mp4", type: "video", dur: 5, thumb: "✨" },
  { id: "m10", name: "Card.png", type: "image", thumb: "🃏" },
];

const TEXT_TMPL = [
  { id: "tx1", name: "Título", font: "Inter", size: 48 },
  { id: "tx2", name: "Subtítulo", font: "Inter", size: 30 },
  { id: "tx3", name: "Legenda", font: "Inter", size: 22 },
  { id: "tx4", name: "CTA", font: "Inter", size: 36 },
  { id: "tx5", name: "Intro", font: "Playfair", size: 50 },
  { id: "tx6", name: "Créditos", font: "Inter", size: 18 },
];

const STICKERS = [
  { id: "st1", e: "✨" }, { id: "st2", e: "🔥" }, { id: "st3", e: "❤️" }, { id: "st4", e: "⭐" },
  { id: "st5", e: "➡️" }, { id: "st6", e: "✅" }, { id: "st7", e: "⭕" }, { id: "st8", e: "⚡" },
  { id: "st9", e: "👑" }, { id: "st10", e: "🎯" }, { id: "st11", e: "💡" }, { id: "st12", e: "🎉" },
];

const EFFECTS = [
  { id: "ef1", name: "Blur", i: "🌫️" }, { id: "ef2", name: "VHS", i: "📼" }, { id: "ef3", name: "Cinematic", i: "🎬" },
  { id: "ef4", name: "RGB Split", i: "🌈" }, { id: "ef5", name: "Glitch", i: "💥" }, { id: "ef6", name: "Zoom", i: "🔍" },
  { id: "ef7", name: "Shake", i: "📳" }, { id: "ef8", name: "Old Film", i: "🎞️" }, { id: "ef9", name: "Dream", i: "💫" },
  { id: "ef10", name: "Noise", i: "📺" },
];

const TRANS = [
  { id: "tr1", name: "Crossfade", d: 0.5 }, { id: "tr2", name: "Fade Black", d: 0.5 },
  { id: "tr3", name: "Slide Left", d: 0.4 }, { id: "tr4", name: "Slide Right", d: 0.4 },
  { id: "tr5", name: "Zoom", d: 0.5 }, { id: "tr6", name: "Cube", d: 0.6 },
  { id: "tr7", name: "Wipe", d: 0.5 }, { id: "tr8", name: "Mosaic", d: 0.5 },
  { id: "tr9", name: "Burn", d: 0.5 }, { id: "tr10", name: "Page", d: 0.6 },
];

const FILTERS = [
  { id: "fl1", name: "Vintage" }, { id: "fl2", name: "Noir" }, { id: "fl3", name: "Pastel" },
  { id: "fl4", name: "HDR" }, { id: "fl5", name: "Drama" }, { id: "fl6", name: "Fade" },
  { id: "fl7", name: "Cool" }, { id: "fl8", name: "Warm" }, { id: "fl9", name: "Retro" },
  { id: "fl10", name: "Mint" },
];

const AI_LIST = [
  { id: "ai1", name: "Legenda Automática", desc: "Transcrição IA" },
  { id: "ai2", name: "Remover Fundo", desc: "Chroma key inteligente" },
  { id: "ai3", name: "Auto Cortes", desc: "Detecção de silêncio" },
  { id: "ai4", name: "Auto Zoom", desc: "Zoom em falantes" },
  { id: "ai5", name: "Thumbnail IA", desc: "Melhor frame" },
  { id: "ai6", name: "Estabilizar", desc: "Correção de tremor" },
  { id: "ai7", name: "Color Grade", desc: "Cor automática" },
  { id: "ai8", name: "Upgrade 4K", desc: "Super resolução" },
  { id: "ai9", name: "Slow Mo", desc: "Interpolação" },
  { id: "ai10", name: "Remover Ruído", desc: "Áudio limpo" },
  { id: "ai11", name: "Clonar Voz", desc: "Narração IA" },
  { id: "ai12", name: "Traduzir", desc: "Dublagem automática" },
];

/* ─── Initial clips ─── */
INITIAL.tracks.find((t) => t.id === "v1").clips = [
  MK("Intro.mp4", 0, 5, "video", { thumb: "🎬" }),
  MK("Produto.mov", 5, 7, "video", { thumb: "📦" }),
  MK("Demo.mp4", 12, 6, "video", { thumb: "🎥" }),
];
INITIAL.tracks.find((t) => t.id === "a1").clips = [
  MK("Trilha.mp3", 0, 2, "audio", { thumb: "🎵" }),
  MK("Voz.mp3", 2, 9, "audio", { thumb: "🎙️" }),
];
INITIAL.tracks.find((t) => t.id === "t1").clips = [
  MK("Título", 1.5, 4, "text", { thumb: "T", font: "Inter", size: 48 }),
];
INITIAL.tracks.find((t) => t.id === "s1").clips = [
  MK("✨", 4, 3, "sticker", { thumb: "✨" }),
];
INITIAL.tracks.find((t) => t.id === "o1").clips = [
  MK("Blur", 7, 2.5, "overlay", { thumb: "🌫️" }),
];

/* ─── Icons ─── */
const Svg = ({ d, size = 18, style }) => <svg style={{ width: size, height: size, flexShrink: 0, ...style }} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;

const I = {
  play: "M8 5v14l11-7z", pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  skipB: "M6 6h2v12H6zm3.5 6l8.5 6V6z", skipF: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  full: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z",
  snap: "M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z",
  cut: "M3 17h2v-2H3v2zm0-4h2v-2H3v2zm0-4h2V7H3v2zm4 12h2V7H7v14zm4-4h2v-2h-2v2zm0-4h2v-2h-2v2zm12-2v2h-6v-2h6z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  dup: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
  redo: "M11.5 8c-4.65 0-8.58 3.03-9.97 7.22l2.37.78c1.05-3.19 4.06-5.5 7.6-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6C16.55 9.01 14.15 8 11.5 8z",
  imp: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
  exp: "M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z",
  save: "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm2-10H5V5h9v4z",
  speed: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  keyf: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z",
  zoomI: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  zoomO: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7V9z",
  chvD: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  chvR: "M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z",
  ck: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  text: "M5 4v3h5.5v12h3V7H19V4z",
  efx: "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z",
  trans: "M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.73 0-3.29-.74-4.39-1.93l-1.42 1.42C8.2 19.06 10.05 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.73 0 3.29.74 4.39 1.93l1.42-1.42C15.8 4.94 13.95 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z",
  filter: "M3 17c0 .55.45 1 1 1h5v-2H4c-.55 0-1 .45-1 1zM3 7c0 .55.45 1 1 1h3V6H4c-.55 0-1 .45-1 1zm5 6c0 .55.45 1 1 1h11c.55 0 1-.45 1-1s-.45-1-1-1H9c-.55 0-1 .45-1 1zM3 12c0 .55.45 1 1 1h2v-2H4c-.55 0-1 .45-1 1z",
  adj: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  lock: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
  logo: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  folder: "M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  search: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z",
  history: "M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
  select: "M3 17h2v-2H3v2zm0-4h2v-2H3v2zm0-4h2V7H3v2zm4 12h2V7H7v14z",
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z",
  paste: "M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z",
  freeze: "M8 5v14l11-7z", // placeholder
  replace: "M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.73 0-3.29-.74-4.39-1.93l-1.42 1.42C8.2 19.06 10.05 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.73 0 3.29.74 4.39 1.93l1.42-1.42C15.8 4.94 13.95 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z",
  captions: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 3h2v2H6v-2zm5-3h2v2h-2v-2zm0 3h2v2h-2v-2zm5-3h2v2h-2v-2zm0 3h2v2h-2v-2z",
  extract: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  template: "M21 3H3v18h18V3zM11 19H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z",
  ai: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  sticker: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
};

/* ─── Waveform ─── */
function Waveform({ w = 80, h = 36, color = "#22c55e" }) {
  const bars = useMemo(() => Array.from({ length: 40 }, () => Math.random() * 0.7 + 0.15), []);
  const bw = Math.max(2, (w - 4) / 40);
  return (
    <div className="flex items-end gap-px" style={{ height: h, width: w, flexShrink: 0 }}>
      {bars.slice(0, Math.floor(w / (bw + 1))).map((s, i) => (
        <div key={i} style={{ width: bw, height: `${s * 100}%`, borderRadius: "1px", background: color, opacity: 0.5 + s * 0.5 }} />
      ))}
    </div>
  );
}

/* ─── Thumbnail strip ─── */
function ThumbStrip({ dur, colors }) {
  const c = colors || ["#1e3a5f", "#1e40af", "#2563eb", "#3b82f6", "#60a5fa"];
  const n = Math.max(4, Math.floor(dur * 5));
  return (
    <div className="flex h-full w-full overflow-hidden rounded-[3px]">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex-1 h-full" style={{ background: `linear-gradient(135deg, ${c[i % c.length]}, ${c[(i + 2) % c.length]})` }} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   STYLE HELPERS
   ════════════════════════════════════════ */
const inputRange = "w-full h-1 accent-emerald-500 bg-white/[0.07] rounded-full appearance-none cursor-pointer";
const btnSm = "px-2 py-1 text-[10px] rounded-md transition-all";
const btnIcon = "p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors";
const scroll = "scrollbar-thin scrollbar-thumb-white/[0.06] scrollbar-track-transparent";

/* ════════════════════════════════════════
   TOOLTIP
   ════════════════════════════════════════ */
function TTip({ children, text }) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#1a1a1a] border border-white/10 text-[9px] text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">{text}</div>
    </div>
  );
}

/* ════════════════════════════════════════
   TOPBAR
   ════════════════════════════════════════ */
function TopBar({ project, setProject, onImport, onExport, ct, dur }) {
  const [editing, setEditing] = useState(false);
  const [nv, setNv] = useState(project.name);
  const [saved, setSaved] = useState(true);
  const ref = useRef(null);

  useEffect(() => { editing && ref.current?.focus(); }, [editing]);
  useEffect(() => {
    if (!saved) { const t = setTimeout(() => setSaved(true), 800); return () => clearTimeout(t); }
  }, [saved]);

  const submitName = () => { if (nv.trim()) setProject((p) => ({ ...p, name: nv.trim() })); setEditing(false); };

  return (
    <div className="h-12 flex-shrink-0 bg-[#0c0c0c] border-b border-white/[0.06] flex items-center px-4 gap-2 z-40">
      <div className="flex items-center gap-2.5 mr-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/15">
          <Svg d={I.logo} size={13} />
        </div>
        <span className="text-sm font-bold text-white/80 tracking-tight">BRANPY</span>
      </div>

      <div className="w-px h-6 bg-white/[0.06]" />

      {editing ? (
        <input ref={ref} value={nv} onChange={(e) => setNv(e.target.value)} onBlur={submitName} onKeyDown={(e) => e.key === "Enter" && submitName()} className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-xs text-white/70 outline-none w-36" />
      ) : (
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/[0.04] text-xs text-white/50 hover:text-white/70">
          <Svg d={I.folder} size={14} />
          <span className="max-w-[120px] truncate">{project.name}</span>
          <Svg d={I.chvD} size={14} />
        </button>
      )}

      <div className={`flex items-center gap-1 text-[9px] ${saved ? "text-emerald-400/50" : "text-amber-400/60"}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${saved ? "bg-emerald-400/50" : "bg-amber-400/60 animate-pulse"}`} />
        {saved ? "Salvo" : "Salvando..."}
      </div>

      <div className="w-px h-6 bg-white/[0.06] ml-1" />

      <TTip text="Salvar"><button className={btnIcon}><Svg d={I.save} size={16} /></button></TTip>
      <TTip text="Desfazer"><button className={btnIcon}><Svg d={I.undo} size={16} /></button></TTip>
      <TTip text="Refazer"><button className={btnIcon}><Svg d={I.redo} size={16} /></button></TTip>
      <TTip text="Histórico"><button className={btnIcon}><Svg d={I.history} size={16} /></button></TTip>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg px-2.5 py-1">
        <span className="text-[10px] text-white/25 font-mono">{FMT(ct)}</span>
        <span className="text-[10px] text-white/15">/</span>
        <span className="text-[10px] text-white/25 font-mono">{FMT(dur)}</span>
      </div>

      <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg px-2.5 py-1 text-[10px] text-white/25">
        <span>16:9</span>
        <Svg d={I.chvD} size={12} />
      </div>

      <button onClick={onImport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/40 hover:text-white/70 text-[11px] transition-all">
        <Svg d={I.imp} size={14} /> Importar
      </button>
      <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-[11px] transition-all shadow-sm shadow-emerald-500/15">
        <Svg d={I.exp} size={14} /> Exportar
      </button>

      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white ml-1 shadow-sm cursor-pointer">J</div>
    </div>
  );
}

/* ════════════════════════════════════════
   SIDEBAR TABS
   ════════════════════════════════════════ */
const SIDEBAR_ICONS = {
  media: I.folder, audio: I.music, text: I.text, sticker: I.sticker,
  effects: I.efx, transitions: I.trans, filters: I.filter, adjust: I.adj,
  templates: I.template, ai: I.ai,
};

function SideTab({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full h-11 flex items-center justify-center relative ${active ? "text-emerald-400" : "text-white/20 hover:text-white/45"} transition-colors`} title={label}>
      <Svg d={icon} size={17} />
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-emerald-500" />}
    </button>
  );
}

/* ════════════════════════════════════════
   LEFT PANEL
   ════════════════════════════════════════ */
function LeftPanel({ tab, importedFiles, onFileImport, fileInputRef, onMediaDrag }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");

  const allMedia = useMemo(() => [...MEDIA, ...importedFiles], [importedFiles]);

  const CATEGORIES = [
    { id: "all", label: "Tudo" }, { id: "local", label: "Local" },
    { id: "library", label: "Biblioteca" }, { id: "video", label: "Vídeos" },
    { id: "image", label: "Imagens" }, { id: "audio", label: "Áudios" },
  ];

  const filtered = useMemo(() => {
    let items = allMedia;
    if (cat === "video") items = items.filter((m) => m.type === "video");
    else if (cat === "image") items = items.filter((m) => m.type === "image");
    else if (cat === "audio") items = items.filter((m) => m.type === "audio");
    if (search.trim()) items = items.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [allMedia, cat, search]);

  return (
    <div className="w-64 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] flex flex-col min-h-0">
      {/* Header */}
      <div className="h-10 flex-shrink-0 flex items-center px-3 border-b border-white/[0.06] gap-2">
        <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">
          {tab === "media" ? "Mídia" : tab === "audio" ? "Áudio" : tab === "text" ? "Texto" : tab === "sticker" ? "Stickers" : tab === "effects" ? "Efeitos" : tab === "transitions" ? "Transições" : tab === "filters" ? "Filtros" : tab === "adjust" ? "Ajustes" : tab === "templates" ? "Templates" : "IA"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tab === "media" && (
          <div>
            {/* Search */}
            <div className="px-3 pt-2 pb-1">
              <div className="flex items-center gap-1.5 bg-white/[0.06] rounded-lg px-2.5 py-1.5 text-white/25">
                <Svg d={I.search} size={13} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar mídia..." className="bg-transparent text-[10px] text-white/60 outline-none w-full placeholder:text-white/15" />
                {search && <button onClick={() => setSearch("")} className="text-white/15 hover:text-white/40"><Svg d={I.close} size={12} /></button>}
              </div>
            </div>

            {/* Categories */}
            <div className="flex px-3 gap-1 mb-2 overflow-x-auto scrollbar-none">
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setCat(c.id)} className={`flex-shrink-0 text-[9px] px-2 py-1 rounded-lg ${cat === c.id ? "bg-white/12 text-white/60" : "text-white/20 hover:text-white/40 hover:bg-white/[0.04]"}`}>{c.label}</button>
              ))}
            </div>

            {/* Upload */}
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) onFileImport(e.dataTransfer.files); }} className="mx-3 mb-2 border-[1.5px] border-dashed border-white/[0.07] rounded-lg p-2.5 text-center hover:border-emerald-500/20 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="text-[9px] text-white/20">Arraste ou clique para importar</div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-2xl mb-2 opacity-20">📂</div>
                <div className="text-[10px] text-white/15">Nenhum arquivo encontrado</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 px-3 pb-4">
                {filtered.map((item) => (
                  <div key={item.id} draggable onDragStart={(e) => onMediaDrag(e, item)} className="group flex flex-col rounded-lg border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/10 cursor-grab active:cursor-grabbing transition-all overflow-hidden">
                    <div className="w-full aspect-video flex items-center justify-center bg-black/30 text-2xl group-hover:scale-105 transition-transform">{item.thumb}</div>
                    <div className="px-2 py-1.5">
                      <div className="text-[10px] text-white/50 truncate group-hover:text-white/70 transition-colors">{item.name}</div>
                      <div className="text-[8px] text-white/18">{item.dur ? `${item.dur}s` : item.type === "image" ? "Imagem" : item.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "audio" && (
          <div className="grid grid-cols-2 gap-1.5 p-3">
            {[...MEDIA.filter((m) => m.type === "audio"), ...[
              { id: "au3", name: "SFX.mp3", dur: 3, thumb: "🔔" }, { id: "au4", name: "Transição.wav", dur: 1.5, thumb: "🔊" },
              { id: "au5", name: "Ambiente.mp3", dur: 60, thumb: "🌿" }, { id: "au6", name: "Bass.mp3", dur: 4, thumb: "🎸" },
            ]].map((item) => (
              <div key={item.id} draggable onDragStart={(e) => onMediaDrag(e, item)} className="flex flex-col items-center p-2 rounded-lg border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] cursor-grab active:cursor-grabbing">
                <div className="w-full aspect-video rounded-md flex items-center justify-center bg-black/30 text-2xl mb-1">{item.thumb}</div>
                <div className="text-[10px] text-white/50 truncate">{item.name}</div>
                <div className="text-[8px] text-white/20">{item.dur}s</div>
              </div>
            ))}
          </div>
        )}

        {tab === "text" && (
          <div className="space-y-px px-2 pb-3 mt-1">
            {TEXT_TMPL.map((t) => (
              <div key={t.id} draggable onDragStart={(e) => onMediaDrag(e, t)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] cursor-grab active:cursor-grabbing">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-white/40">{t.name[0]}</div>
                <div>
                  <div className="text-[11px] text-white/50">{t.name}</div>
                  <div className="text-[8px] text-white/20">{t.font} · {t.size}px</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "sticker" && (
          <div className="grid grid-cols-4 gap-1.5 p-3">
            {STICKERS.map((s) => (
              <div key={s.id} draggable onDragStart={(e) => onMediaDrag(e, s)} className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-2xl hover:bg-white/[0.06] hover:scale-110 transition-all cursor-grab active:cursor-grabbing">{s.e}</div>
            ))}
          </div>
        )}

        {tab === "effects" && (
          <div className="grid grid-cols-2 gap-1.5 p-3">
            {EFFECTS.map((ef) => (
              <div key={ef.id} draggable onDragStart={(e) => onMediaDrag(e, ef)} className="flex flex-col items-center p-2 rounded-lg border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] cursor-grab active:cursor-grabbing">
                <div className="w-full aspect-video rounded-md flex items-center justify-center bg-black/30 text-xl mb-1">{ef.i}</div>
                <div className="text-[10px] text-white/50">{ef.name}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "transitions" && (
          <div className="grid grid-cols-2 gap-1.5 p-3">
            {TRANS.map((tr) => (
              <div key={tr.id} draggable onDragStart={(e) => onMediaDrag(e, tr)} className="flex flex-col items-center p-2 rounded-lg border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] cursor-pointer">
                <div className="w-full aspect-video rounded-md flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02] text-lg mb-1"><Svg d={I.trans} size={18} style={{ color: "rgba(255,255,255,0.25)" }} /></div>
                <div className="text-[10px] text-white/50">{tr.name}</div>
                <div className="text-[8px] text-white/20">{tr.d}s</div>
              </div>
            ))}
          </div>
        )}

        {tab === "filters" && (
          <div className="grid grid-cols-2 gap-1.5 p-3">
            {FILTERS.map((fl) => (
              <div key={fl.id} className="flex flex-col items-center p-2 rounded-lg border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] cursor-pointer">
                <div className="w-full aspect-video rounded-md flex items-center justify-center bg-gradient-to-br from-white/5 via-transparent to-white/[0.02] text-xs mb-1 text-white/30">🎞️</div>
                <div className="text-[10px] text-white/50">{fl.name}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "adjust" && (
          <AdjustPanel />
        )}

        {tab === "templates" && (
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {["Intro Animada", "Produto", "Tutorial", "Vlog", "Review", "Unboxing", "Antes/Depois", "CTA Final"].map((t) => (
                <div key={t} className="flex flex-col items-center p-2.5 rounded-lg border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] cursor-pointer">
                  <div className="w-full aspect-video rounded-md flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-blue-500/10 text-lg mb-1">📁</div>
                  <div className="text-[10px] text-white/50">{t}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "ai" && (
          <div className="p-2 space-y-1">
            {AI_LIST.map((ai) => (
              <button key={ai.id} className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400 text-[9px] font-bold flex-shrink-0">AI</div>
                <div className="min-w-0">
                  <div className="text-[10px] text-white/50 truncate">{ai.name}</div>
                  <div className="text-[8px] text-white/20 truncate">{ai.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdjustPanel() {
  const [vals, setVals] = useState({ bright: 0, contrast: 0, sat: 0, hl: 0, sh: 0, temp: 0, tint: 0, vig: 0, sharp: 0 });
  const sliders = [
    { k: "bright", label: "Brilho", min: -100, max: 100 },
    { k: "contrast", label: "Contraste", min: -100, max: 100 },
    { k: "sat", label: "Saturação", min: -100, max: 100 },
    { k: "hl", label: "Luzes", min: -100, max: 100 },
    { k: "sh", label: "Sombras", min: -100, max: 100 },
    { k: "temp", label: "Temperatura", min: -100, max: 100 },
    { k: "tint", label: "Matiz", min: -100, max: 100 },
    { k: "vig", label: "Vinheta", min: 0, max: 100 },
    { k: "sharp", label: "Nitidez", min: 0, max: 100 },
  ];

  return (
    <div className="px-3 pb-3 space-y-2 mt-1">
      {sliders.map((s) => (
        <div key={s.k}>
          <div className="flex justify-between text-[10px] text-white/30 mb-1"><span>{s.label}</span><span className="text-white/20">{vals[s.k] > 0 ? "+" : ""}{vals[s.k]}</span></div>
          <input type="range" min={s.min} max={s.max} value={vals[s.k]} onChange={(e) => setVals((v) => ({ ...v, [s.k]: +e.target.value }))} className={inputRange} />
        </div>
      ))}
      <div className="pt-2 flex gap-1">
        <button className="flex-1 text-[10px] py-1.5 rounded bg-white/5 text-white/30 hover:bg-white/10">Resetar</button>
        <button className="flex-1 text-[10px] py-1.5 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25">Auto</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   PREVIEW PANEL
   ════════════════════════════════════════ */
function PreviewPanel({ playing, setPlaying, ct, setCt, proj, vol, setVol }) {
  const [fs, setFs] = useState(false);
  const [pz, setPz] = useState(100);
  const ref = useRef(null);
  const toggleFs = () => { if (!document.fullscreenElement) ref.current?.requestFullscreen(); else document.exitFullscreen(); setFs(!fs); };

  const ratio = proj.width / proj.height;
  const baseW = Math.min(560, window.innerWidth * 0.35);
  const baseH = baseW / ratio;

  return (
    <div ref={ref} className="flex-1 flex flex-col min-h-0 bg-[#070707]">
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden">
        <div className="rounded-lg overflow-hidden shadow-2xl border border-white/[0.07] bg-black" style={{ width: baseW, height: baseH, transform: `scale(${pz / 100})`, transformOrigin: "center center" }}>
          {playing || ct > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, hsl(${(ct * 25) % 360}, 35%, 10%), hsl(${(ct * 25 + 80) % 360}, 30%, 14%))` }} />
              <div className="relative z-10 text-center px-4">
                <div className="text-3xl mb-1.5 opacity-15">🎬</div>
                <div className="text-[9px] text-white/8 font-mono">{proj.width}×{proj.height}</div>
                <div className="text-[9px] text-white/8 font-mono mt-0.5">{FMT(ct)}</div>
                <div className="mt-3 w-40 h-0.5 bg-white/5 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-emerald-500/30 rounded-full transition-all" style={{ width: `${(ct / (proj.duration || 1)) * 100}%` }} />
                </div>
                <div className="mt-2 text-[8px] text-white/10">{ct < 5 ? "Intro" : ct < 12 ? "Produto" : "Demo"}</div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full border-[1.5px] border-white/8 flex items-center justify-center mx-auto mb-3 cursor-pointer hover:border-white/20 transition-all" onClick={() => setPlaying(true)}>
                  <Svg d={I.play} size={22} style={{ color: "rgba(255,255,255,0.3)", marginLeft: 2 }} />
                </div>
                <div className="text-[10px] text-white/12">Preview</div>
                <div className="text-[8px] text-white/8 mt-0.5">{proj.width}×{proj.height} · {proj.fps}fps · 16:9</div>
              </div>
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="absolute right-3 bottom-3 flex items-center gap-1 bg-[#0c0c0c]/90 border border-white/[0.06] rounded-lg px-2 py-1.5 backdrop-blur-sm">
          <button onClick={() => setPz((z) => Math.max(25, z - 25))} className="p-0.5 text-white/20 hover:text-white/50"><Svg d={I.zoomO} size={13} /></button>
          <span className="text-[9px] text-white/30 w-7 text-center">{pz}%</span>
          <button onClick={() => setPz((z) => Math.min(200, z + 25))} className="p-0.5 text-white/20 hover:text-white/50"><Svg d={I.zoomI} size={13} /></button>
          <div className="w-px h-3 bg-white/[0.06] mx-1" />
          <button className="p-0.5 text-white/20 hover:text-white/50"><Svg d={I.snap} size={13} /></button>
          <button onClick={toggleFs} className="p-0.5 text-white/20 hover:text-white/50"><Svg d={I.full} size={13} /></button>
        </div>
      </div>

      {/* Playback bar */}
      <div className="h-11 flex-shrink-0 bg-[#0c0c0c] border-t border-white/[0.06] flex items-center px-4 gap-2">
        <div className="flex items-center gap-0.5">
          <TTip text="Início"><button onClick={() => setCt(0)} className={btnIcon}><Svg d={I.skipB} size={16} /></button></TTip>
          <TTip text={playing ? "Pausar" : "Play"}>
            <button onClick={() => setPlaying(!playing)} className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white/90">
              <Svg d={playing ? I.pause : I.play} size={20} />
            </button>
          </TTip>
          <TTip text="Pular"><button className={btnIcon}><Svg d={I.skipF} size={16} /></button></TTip>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-mono w-14 text-right tabular-nums">{FMT(ct)}</span>
          <input type="range" min={0} max={proj.duration} step={0.04} value={ct} onChange={(e) => setCt(+e.target.value)} className="flex-1 h-1 accent-emerald-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #22c55e ${(ct / (proj.duration || 1)) * 100}%, rgba(255,255,255,0.06) ${(ct / (proj.duration || 1)) * 100}%)` }} />
          <span className="text-[10px] text-white/20 font-mono w-14 tabular-nums">{FMT(proj.duration)}</span>
        </div>

        <TTip text="Capturar frame"><button className={btnIcon}><Svg d={I.snap} size={16} /></button></TTip>
        <div className="flex items-center gap-1 ml-1">
          <Svg d={I.music} size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
          <input type="range" min={0} max={100} value={vol} onChange={(e) => setVol(+e.target.value)} className="w-14 h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   RIGHT PANEL
   ════════════════════════════════════════ */
function RightPanel({ clip }) {
  const [tab, setTab] = useState("video");

  if (!clip) {
    return (
      <div className="w-64 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] flex flex-col min-h-0">
        <div className="h-10 flex-shrink-0 flex items-center px-3 border-b border-white/[0.06]">
          <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Propriedades</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2"><Svg d={I.layers} size={18} style={{ color: "rgba(255,255,255,0.15)" }} /></div>
            <div className="text-[10px] text-white/15">Selecione um item na timeline</div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "video", label: "Vídeo" }, { id: "audio", label: "Áudio" },
    { id: "speed", label: "Veloc." }, { id: "anim", label: "Animação" },
    { id: "adjust", label: "Ajuste" }, { id: "ai", label: "IA" },
  ];

  const props = [
    { l: "Posição X", v: "0.0" }, { l: "Posição Y", v: "0.0" },
    { l: "Escala", v: "100%", range: true, min: 1, max: 500 },
    { l: "Rotação", v: "0°", range: true, min: -180, max: 180 },
    { l: "Opacidade", v: "100%", range: true, min: 0, max: 100 },
    { l: "Mistura", v: "Normal", select: true, opts: ["Normal", "Multiply", "Screen", "Overlay", "Add", "Subtract", "Lighten", "Darken"] },
    { l: "Âncora X", v: "0.5" }, { l: "Âncora Y", v: "0.5" },
  ];

  return (
    <div className="w-64 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] flex flex-col min-h-0">
      <div className="h-10 flex-shrink-0 flex items-center px-3 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Propriedades</span>
      </div>

      <div className="flex-shrink-0 flex border-b border-white/[0.06] overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 text-[10px] py-2 whitespace-nowrap relative ${tab === t.id ? "text-white/70" : "text-white/20 hover:text-white/40"}`}>
            {t.label}
            {tab === t.id && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-t bg-emerald-500" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-3 space-y-3">
          {/* Clip header */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.06]">
            <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center text-lg flex-shrink-0">{clip.thumb || "🎬"}</div>
            <div className="min-w-0">
              <div className="text-[11px] text-white/60 font-medium truncate">{clip.name}</div>
              <div className="text-[8px] text-white/20">{FMT(clip.start)} → {FMT(clip.start + clip.duration)}</div>
            </div>
          </div>

          {tab === "video" && props.map((p) => (
            <div key={p.l}>
              <div className="flex justify-between text-[10px] text-white/30 mb-1"><span>{p.l}</span>{!p.select && <span className="text-white/20">{p.v}</span>}</div>
              {p.select ? (
                <select className="w-full bg-white/[0.06] border border-white/10 rounded text-[10px] text-white/50 px-2 py-1 outline-none focus:border-white/20">{p.opts.map((o) => <option key={o}>{o}</option>)}</select>
              ) : p.range ? (
                <input type="range" min={p.min || -1000} max={p.max || 1000} defaultValue={+(p.v) || 0} className={inputRange} />
              ) : (
                <input type="text" defaultValue={p.v} className="w-full bg-white/[0.06] border border-white/10 rounded text-[10px] text-white/50 px-2 py-1 outline-none focus:border-white/20" />
              )}
            </div>
          ))}

          {tab === "video" && (
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-white/25"><Svg d={I.ck} size={14} /> Chroma Key</div>
              <div className="grid grid-cols-4 gap-1">
                {["Green", "Blue", "Red", "Custom"].map((c) => (
                  <button key={c} className="text-[8px] py-1 rounded bg-white/[0.06] text-white/30 hover:bg-white/10 transition-colors">{c}</button>
                ))}
              </div>
              <input type="range" min={0} max={100} defaultValue={50} className={inputRange} />
              <div className="flex justify-between text-[8px] text-white/20"><span>Tolerância</span><span>50%</span></div>

              <div className="flex gap-1 pt-1">
                <button className="flex-1 text-[9px] py-1.5 rounded bg-white/[0.06] text-white/30 hover:bg-white/10">Estabilizar</button>
                <button className="flex-1 text-[9px] py-1.5 rounded bg-white/[0.06] text-white/30 hover:bg-white/10">Remover Fundo</button>
              </div>
            </div>
          )}

          {tab === "audio" && (
            <>
              {[{ l: "Volume", min: 0, max: 200, v: 100 }, { l: "Fade In", min: 0, max: 5, v: 0 }, { l: "Fade Out", min: 0, max: 5, v: 0 }].map((s) => (
                <div key={s.l}>
                  <div className="flex justify-between text-[10px] text-white/30 mb-1"><span>{s.l}</span><span className="text-white/20">{s.v}</span></div>
                  <input type="range" min={s.min} max={s.max} defaultValue={s.v} className={inputRange} />
                </div>
              ))}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[10px] text-white/20 mb-1.5">Equalizador</div>
                {[60, 200, 500, 2000, 8000, 16000].map((hz) => (
                  <div key={hz} className="flex items-center gap-2 text-[9px] text-white/20 mb-1">
                    <span className="w-10 flex-shrink-0">{hz}Hz</span>
                    <input type="range" min={-12} max={12} defaultValue={0} className="flex-1 h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
                  </div>
                ))}
              </div>
              <button className="w-full text-[10px] py-1.5 rounded bg-red-500/8 text-red-400/70 hover:bg-red-500/15 mt-1">Remover Ruído</button>
              <button className="w-full text-[10px] py-1.5 rounded bg-white/[0.06] text-white/30 hover:bg-white/10">Extrair Áudio</button>
            </>
          )}

          {tab === "speed" && (
            <>
              <div className="flex justify-between text-[10px] text-white/30 mb-1"><span>Velocidade</span><span className="text-white/20">1.0x</span></div>
              <input type="range" min={0.1} max={8} step={0.1} defaultValue={1} className={inputRange} />
              <div className="grid grid-cols-4 gap-1 mt-2">
                {["0.25x", "0.5x", "1x", "1.5x", "2x", "4x", "8x", "0.75x"].map((s) => (
                  <button key={s} className={`text-[10px] py-1.5 rounded ${s === "1x" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30 hover:bg-white/10"}`}>{s}</button>
                ))}
              </div>
              <div className="pt-3 space-y-1.5">
                <button className="w-full text-[10px] py-1.5 rounded bg-white/5 text-white/30 hover:bg-white/10">Reverter</button>
                <button className="w-full text-[10px] py-1.5 rounded bg-white/5 text-white/30 hover:bg-white/10">Congelar Frame</button>
                <button className="w-full text-[10px] py-1.5 rounded bg-white/5 text-white/30 hover:bg-white/10">Substituir</button>
              </div>
            </>
          )}

          {tab === "anim" && (
            <>
              <div className="text-[10px] text-white/20 mb-2">Entrada</div>
              <div className="grid grid-cols-3 gap-1 mb-3">
                {["Fade", "Slide Up", "Slide Down", "Slide L", "Slide R", "Scale", "Rotate", "Bounce", "Zoom"].map((a) => (
                  <button key={a} className="text-[9px] py-2 rounded bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50">{a}</button>
                ))}
              </div>
              <div className="text-[10px] text-white/20 mb-2">Saída</div>
              <div className="grid grid-cols-3 gap-1 mb-3">
                {["Fade", "Slide Down", "Slide R", "Scale", "Rotate", "Zoom Out"].map((a) => (
                  <button key={a} className="text-[9px] py-2 rounded bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50">{a}</button>
                ))}
              </div>
              <div className="text-[10px] text-white/20 mb-1">Duração</div>
              <input type="range" min={0.1} max={3} step={0.1} defaultValue={0.5} className={inputRange} />
            </>
          )}

          {tab === "adjust" && (
            <>
              {[{ l: "Brilho", min: -100, max: 100 }, { l: "Contraste", min: -100, max: 100 }, { l: "Saturação", min: -100, max: 100 }, { l: "Realce", min: -100, max: 100 }, { l: "Sombras", min: -100, max: 100 }, { l: "Temperatura", min: -100, max: 100 }].map((s) => (
                <div key={s.l}>
                  <div className="flex justify-between text-[10px] text-white/30 mb-1"><span>{s.l}</span><span className="text-white/20">0</span></div>
                  <input type="range" min={s.min} max={s.max} defaultValue={0} className={inputRange} />
                </div>
              ))}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-[10px] text-white/25 mb-2"><Svg d={I.ck} size={14} /> Chroma Key</div>
                <div className="grid grid-cols-2 gap-1 mb-1.5">
                  {["Green", "Blue", "Red", "Custom"].map((c) => (
                    <button key={c} className="text-[9px] py-1 rounded bg-white/5 text-white/30 hover:bg-white/10">{c}</button>
                  ))}
                </div>
                <input type="range" min={0} max={100} defaultValue={50} className={inputRange} />
                <div className="text-[8px] text-white/20 mt-0.5">Tolerância</div>
              </div>
              <div className="flex gap-1 pt-1">
                <button className="flex-1 text-[9px] py-1.5 rounded bg-white/[0.06] text-white/30 hover:bg-white/10">Estabilizar</button>
                <button className="flex-1 text-[9px] py-1.5 rounded bg-gradient-to-r from-emerald-500/15 to-purple-500/15 text-emerald-400/70 hover:from-emerald-500/25 hover:to-purple-500/25">Remover Fundo IA</button>
              </div>
            </>
          )}

          {tab === "ai" && (
            <div className="space-y-1">
              {AI_LIST.slice(0, 8).map((ai) => (
                <button key={ai.id} className="w-full text-left flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-white/[0.04]">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400 text-[9px] font-bold">AI</div>
                  <div>
                    <div className="text-[10px] text-white/50">{ai.name}</div>
                    <div className="text-[8px] text-white/20">{ai.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   TIMELINE
   ════════════════════════════════════════ */
function Timeline({ project, setProject, ct, setCt, zoom, setZoom, playing, setPlaying, sel, setSel }) {
  const rulerRef = useRef(null);
  const tracksRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [trim, setTrim] = useState(null);
  const [phDrag, setPhDrag] = useState(false);

  const pps = PPS * (zoom / 100);
  const totalW = Math.max(project.duration * pps + 200, 3000);

  const findSnap = useCallback((ns, cId, tId) => {
    const track = project.tracks.find((t) => t.id === tId);
    if (!track) return ns;
    const others = track.clips.filter((c) => c.id !== cId);
    let snapped = ns, minDist = 6 / pps;
    for (const c of others) {
      for (const t of [c.start, c.start + c.duration]) { const d = Math.abs(ns - t); if (d < minDist) { snapped = t; minDist = d; } }
      const ed = Math.abs(ns + (drag?.clip?.duration || 0) - c.start);
      if (ed < minDist) { snapped = c.start - (drag?.clip?.duration || 0); minDist = ed; }
    }
    const pd = Math.abs(ns - ct);
    if (pd < minDist) { snapped = ct; }
    return Math.max(0, snapped);
  }, [project, ct, pps, drag]);

  const clipColor = (type) => {
    switch (type) {
      case "video": return COLOR.video;
      case "audio": return COLOR.audio;
      case "text": return COLOR.text;
      case "sticker": return COLOR.sticker;
      case "overlay": return COLOR.overlay;
      default: return { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", bar: "#888" };
    }
  };

  const trackBadge = (type) => {
    switch (type) {
      case "video": return { bg: "#1e40af", label: "V" };
      case "audio": return { bg: "#166534", label: "A" };
      case "text": return { bg: "#92400e", label: "T" };
      case "sticker": return { bg: "#6b21a8", label: "S" };
      case "overlay": return { bg: "#831843", label: "O" };
      default: return { bg: "#333", label: "?" };
    }
  };

  /* Mouse handlers */
  const handleClipMD = useCallback((e, clip, tId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isL = (e.clientX - rect.left) < 8;
    const isR = (rect.right - e.clientX) < 8;
    if (isL || isR) {
      setTrim({ clip, tId, side: isL ? "left" : "right", sx: e.clientX, os: clip.start, od: clip.duration });
    } else {
      setDrag({ clip, tId, sx: e.clientX, os: clip.start });
    }
    setSel({ ...clip, trackId: tId });
  }, [setSel]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      const dx = e.clientX - drag.sx;
      const dt = dx / pps;
      const raw = drag.os + dt;
      const snapped = findSnap(raw, drag.clip.id, drag.tId);
      setProject((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) => t.id === drag.tId ? { ...t, clips: t.clips.map((c) => c.id === drag.clip.id ? { ...c, start: snapped } : c) } : t),
      }));
    };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [drag, pps, findSnap, setProject]);

  useEffect(() => {
    if (!trim) return;
    const onMove = (e) => {
      const dx = e.clientX - trim.sx;
      const dt = dx / pps;
      if (trim.side === "left") {
        const ns = Math.max(0, Math.min(trim.os + dt, trim.os + trim.od - 0.5));
        const nd = trim.od - (ns - trim.os);
        setProject((prev) => ({
          ...prev, tracks: prev.tracks.map((t) => t.id === trim.tId ? { ...t, clips: t.clips.map((c) => c.id === trim.clip.id ? { ...c, start: ns, duration: Math.max(0.5, nd) } : c) } : t),
        }));
      } else {
        setProject((prev) => ({
          ...prev, tracks: prev.tracks.map((t) => t.id === trim.tId ? { ...t, clips: t.clips.map((c) => c.id === trim.clip.id ? { ...c, duration: Math.max(0.5, trim.od + dt) } : c) } : t),
        }));
      }
    };
    const onUp = () => setTrim(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [trim, pps, setProject]);

  const handleRulerMD = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPhDrag(true);
    const update = (cx) => { setCt(Math.max(0, Math.min(project.duration, (cx - rect.left) / pps))); };
    update(e.clientX);
    const onMove = (ev) => update(ev.clientX);
    const onUp = () => setPhDrag(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [pps, project.duration, setCt]);

  /* Keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === " " || e.key === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      if ((e.key === "Delete" || e.key === "Backspace") && sel?.trackId) {
        setProject((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: t.clips.filter((c) => c.id !== sel.id) } : t) }));
        setSel(null);
      }
      if (e.key === "ArrowLeft" && e.shiftKey) { e.preventDefault(); setCt((t) => Math.max(0, t - 0.5)); }
      if (e.key === "ArrowRight" && e.shiftKey) { e.preventDefault(); setCt((t) => Math.min(project.duration, t + 0.5)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, setProject, setCt, setPlaying, project.duration]);

  const handleDrop = useCallback((e, tId) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    const item = JSON.parse(data);
    const tlRect = rulerRef.current?.getBoundingClientRect();
    const relX = e.clientX - (tlRect?.left || 0);
    const st = Math.max(0, relX / pps);
    const dur = item.dur || 4;
    const nc = MK(item.name, st, dur, item.type || "video", { thumb: item.thumb || item.e || "🎬" });
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => t.id === tId ? { ...t, clips: [...t.clips, nc].sort((a, b) => a.start - b.start) } : t),
    }));
    setSel({ ...nc, trackId: tId });
  }, [pps, setProject, setSel]);

  const handleSplit = useCallback(() => {
    if (!sel?.trackId) return;
    const { trackId, id } = sel;
    setProject((prev) => {
      const track = prev.tracks.find((t) => t.id === trackId);
      if (!track) return prev;
      const clip = track.clips.find((c) => c.id === id);
      if (!clip || ct <= clip.start || ct >= clip.start + clip.duration) return prev;
      const lD = ct - clip.start, rD = clip.duration - lD;
      if (lD < 0.3 || rD < 0.3) return prev;
      const rc = { ...clip, id: UID(), start: ct, duration: rD };
      return { ...prev, tracks: prev.tracks.map((t) => t.id === trackId ? { ...t, clips: [...t.clips.filter((c) => c.id !== id), { ...clip, duration: lD }, rc].sort((a, b) => a.start - b.start) } : t) };
    });
  }, [sel, ct, setProject]);

  const handleDel = useCallback(() => {
    if (!sel?.trackId) return;
    setProject((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: t.clips.filter((c) => c.id !== sel.id) } : t) }));
    setSel(null);
  }, [sel, setProject, setSel]);

  const handleDup = useCallback(() => {
    if (!sel?.trackId) return;
    setProject((prev) => {
      const track = prev.tracks.find((t) => t.id === sel.trackId);
      if (!track) return prev;
      const clip = track.clips.find((c) => c.id === sel.id);
      if (!clip) return prev;
      const d = { ...clip, id: UID(), start: clip.start + clip.duration + 0.5 };
      return { ...prev, tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: [...t.clips, d].sort((a, b) => a.start - b.start) } : t) };
    });
  }, [sel, setProject]);

  const toggleVis = useCallback((tid) => setProject((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === tid ? { ...t, visible: !t.visible } : t) })), [setProject]);
  const toggleLock = useCallback((tid) => setProject((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === tid ? { ...t, locked: !t.locked } : t) })), [setProject]);

  return (
    <div className="h-60 flex-shrink-0 border-t border-white/[0.06] bg-[#0a0a0a] flex flex-col">
      {/* Timeline toolbar */}
      <div className="h-9 flex-shrink-0 bg-[#0c0c0c] border-b border-white/[0.06] flex items-center px-3 gap-0.5 overflow-x-auto scrollbar-none">
        <TTip text="Selecionar"><button className={`${btnSm} ${sel ? "bg-white/10 text-white/60" : "text-white/25 hover:bg-white/5"}`}><Svg d={I.select} size={13} /></button></TTip>
        <div className="w-px h-4 bg-white/[0.06] mx-0.5" />
        <TTip text="Dividir"><button onClick={handleSplit} className={`${btnSm} ${sel ? "hover:bg-white/10 text-white/40 hover:text-white/70" : "text-white/15"}`}><Svg d={I.cut} size={13} /> Dividir</button></TTip>
        <TTip text="Excluir"><button onClick={handleDel} className={`${btnSm} ${sel ? "hover:bg-white/10 text-white/40 hover:text-red-400" : "text-white/15"}`}><Svg d={I.trash} size={13} /> Excluir</button></TTip>
        <TTip text="Duplicar"><button onClick={handleDup} className={`${btnSm} ${sel ? "hover:bg-white/10 text-white/40 hover:text-white/70" : "text-white/15"}`}><Svg d={I.dup} size={13} /> Duplicar</button></TTip>
        <div className="w-px h-4 bg-white/[0.06] mx-0.5" />
        <TTip text="Cortar"><button className={btnSm + " text-white/25 hover:bg-white/5"}><Svg d={I.cut} size={13} /> Cortar</button></TTip>
        <TTip text="Copiar"><button className={btnSm + " text-white/25 hover:bg-white/5"}><Svg d={I.copy} size={13} /> Copiar</button></TTip>
        <TTip text="Colar"><button className={btnSm + " text-white/25 hover:bg-white/5"}><Svg d={I.paste} size={13} /> Colar</button></TTip>
        <TTip text="Congelar"><button className={btnSm + " text-white/25 hover:bg-white/5"}><Svg d={I.freeze} size={13} /> Congelar</button></TTip>
        <TTip text="Reverter"><button className={btnSm + " text-white/25 hover:bg-white/5"}><Svg d={I.replace} size={13} /> Reverter</button></TTip>
        <div className="w-px h-4 bg-white/[0.06] mx-0.5" />
        <TTip text="Velocidade"><button className={btnSm + " text-white/25 hover:bg-white/5"}><Svg d={I.speed} size={13} /> Veloc.</button></TTip>
        <TTip text="Chroma Key"><button className={btnSm + " text-white/25 hover:bg-white/5"}><Svg d={I.ck} size={13} /> Chroma</button></TTip>
        <TTip text="Recorte"><button className={btnSm + " text-white/25 hover:bg-white/5"}><Svg d={I.snap} size={13} /> Recorte</button></TTip>
        <TTip text="Legendas"><button className={btnSm + " text-white/25 hover:bg-white/5"}><Svg d={I.captions} size={13} /> Legendas</button></TTip>
        <TTip text="Extrair Áudio"><button className={btnSm + " text-white/25 hover:bg-white/5"}><Svg d={I.extract} size={13} /> Extrair</button></TTip>

        <div className="flex-1" />
        <TTip text="Keyframe"><button className={btnIcon}><Svg d={I.keyf} size={14} /></button></TTip>
        <TTip text="Snapping"><button className={`${btnIcon} text-white/40`}><Svg d={I.snap} size={14} /></button></TTip>
        <div className="flex items-center gap-1 bg-white/[0.04] rounded px-1.5 py-0.5 ml-1">
          <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="p-0.5 text-white/20 hover:text-white/50"><Svg d={I.zoomO} size={11} /></button>
          <span className="text-[9px] text-white/30 w-7 text-center tabular-nums">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(400, z + 25))} className="p-0.5 text-white/20 hover:text-white/50"><Svg d={I.zoomI} size={11} /></button>
        </div>
      </div>

      {/* Timeline body */}
      <div className="flex-1 flex min-h-0">
        {/* Track labels */}
        <div className="w-[170px] flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] overflow-y-auto overflow-x-hidden">
          {project.tracks.map((t) => {
            const badge = trackBadge(t.type);
            return (
              <div key={t.id} className="h-[58px] border-b border-white/[0.03] flex items-center px-2 gap-1 transition-opacity" style={{ opacity: t.visible ? 1 : 0.3 }}>
                <button onClick={() => toggleLock(t.id)} className={`p-0.5 rounded flex-shrink-0 ${t.locked ? "text-amber-400/50" : "text-white/12 hover:text-white/30"}`}><Svg d={I.lock} size={11} /></button>
                <button onClick={() => toggleVis(t.id)} className="p-0.5 rounded text-white/15 hover:text-white/35 flex-shrink-0"><Svg d={t.visible ? I.eye : I.close} size={11} /></button>
                <div className="flex items-center gap-1.5 min-w-0 ml-0.5">
                  <div className="w-[18px] h-[18px] rounded flex items-center justify-center text-[8px] font-bold text-white/80 flex-shrink-0" style={{ background: badge.bg }}>{badge.label}</div>
                  <span className="text-[9px] text-white/35 truncate">{t.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tracks + Ruler */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Ruler */}
          <div ref={rulerRef} className="h-6 flex-shrink-0 border-b border-white/[0.06] bg-[#0c0c0c] relative cursor-pointer" onMouseDown={handleRulerMD}>
            <div className="h-full relative" style={{ width: totalW }}>
              {Array.from({ length: Math.ceil(project.duration) + 1 }).map((_, i) => (
                <div key={i} className="absolute top-0 flex flex-col items-start" style={{ left: i * pps }}>
                  <span className="text-[8px] text-white/15 leading-6 ml-1.5 select-none tabular-nums">{i}s</span>
                </div>
              ))}
              {Array.from({ length: Math.ceil(project.duration) * 5 }).map((_, i) => (
                <div key={`t-${i}`} className="absolute top-0 w-px h-1.5 bg-white/[0.03]" style={{ left: ((i + 1) / 5) * pps }} />
              ))}
            </div>
          </div>

          {/* Tracks area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" ref={tracksRef}>
            <div className="relative" style={{ width: totalW, minWidth: "100%" }}>
              {project.tracks.map((t) => (
                <div key={t.id} className="h-[58px] border-b border-white/[0.03] relative transition-opacity" style={{ opacity: t.visible ? 1 : 0.3, display: t.visible ? undefined : "none" }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                  onDrop={(e) => handleDrop(e, t.id)}
                  onClick={() => setSel(null)}
                >
                  {/* Grid */}
                  {Array.from({ length: Math.ceil(project.duration) + 1 }).map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-white/[0.02]" style={{ left: i * pps }} />
                  ))}
                  {Array.from({ length: Math.ceil(project.duration) * 5 }).map((_, i) => (
                    <div key={`g-${i}`} className="absolute top-0 bottom-0 w-px bg-white/[0.007]" style={{ left: ((i + 1) / 5) * pps }} />
                  ))}

                  {/* Clips */}
                  {t.clips.map((clip) => {
                    const col = clipColor(clip.type);
                    const isSel = sel?.id === clip.id && sel?.trackId === t.id;
                    const lp = clip.start * pps;
                    const wp = clip.duration * pps - 1;

                    return (
                      <div key={clip.id} className={`absolute top-[4px] h-[50px] rounded-[4px] border cursor-pointer overflow-hidden transition-shadow ${isSel ? "z-10" : "hover:shadow-md"}`}
                        style={{ left: lp, width: Math.max(10, wp), borderColor: isSel ? "rgba(34,197,94,0.7)" : col.border, background: col.bg }}
                        onMouseDown={(e) => handleClipMD(e, clip, t.id)}
                      >
                        {clip.type === "video" && wp > 40 && (
                          <div className="absolute inset-0 rounded-[3px] overflow-hidden"><ThumbStrip dur={clip.duration} /></div>
                        )}
                        {clip.type === "audio" && wp > 25 && (
                          <div className="absolute inset-0 flex items-center justify-center px-1">
                            <Waveform w={Math.max(20, wp - 10)} h={34} color={col.bar} />
                          </div>
                        )}
                        {clip.type === "text" && (
                          <div className="absolute inset-0 flex items-center px-2 gap-1"><span className="text-[10px] font-bold text-amber-400/60">{clip.thumb || "T"}</span>{wp > 60 && <span className="text-[8px] text-white/35 truncate">{clip.name}</span>}</div>
                        )}
                        {clip.type === "sticker" && (
                          <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg">{clip.thumb || "✨"}</span></div>
                        )}
                        {clip.type === "overlay" && (
                          <div className="absolute inset-0 flex items-center px-2 gap-1"><span className="text-sm">{clip.thumb || "🌫️"}</span>{wp > 50 && <span className="text-[8px] text-white/35 truncate">{clip.name}</span>}</div>
                        )}

                        {/* Label overlay on video */}
                        {clip.type === "video" && wp > 60 && (
                          <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                            <span className="text-[8px] text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate">{clip.name}</span>
                            <span className="text-[7px] text-white/60 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tabular-nums">{clip.duration.toFixed(1)}s</span>
                          </div>
                        )}

                        {/* Trim + selection */ }
                        {isSel && (
                          <>
                            <div className="absolute left-0 top-0 bottom-0 w-[6px] cursor-col-resize bg-white/15 hover:bg-white/25 rounded-l-[3px]" />
                            <div className="absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize bg-white/15 hover:bg-white/25 rounded-r-[3px]" />
                            <div className="absolute inset-0 rounded-[3px] ring-1 ring-emerald-500/40 pointer-events-none" />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Playhead */}
              <div className="absolute top-0 bottom-0 w-px bg-red-400/60 z-20 pointer-events-none shadow-[0_0_8px_rgba(248,113,113,0.2)]" style={{ left: ct * pps }} />
              <div className="absolute -top-[5px] w-3 h-3 bg-red-400 rounded-sm rotate-45 z-20 pointer-events-none shadow-md" style={{ left: ct * pps - 6 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN EDITOR
   ════════════════════════════════════════ */
export default function VideoStudioEditor() {
  const [project, setProject] = useState(INITIAL);
  const [ct, setCt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [vol, setVol] = useState(80);
  const [sel, setSel] = useState(null);
  const [sTab, setSTab] = useState("media");
  const [imported, setImported] = useState([]);
  const fRef = useRef(null);
  const piRef = useRef(null);

  useEffect(() => {
    if (playing) {
      piRef.current = setInterval(() => { setCt((t) => { if (t >= project.duration) { setPlaying(false); return 0; } return t + 1 / 30; }); }, 1000 / 30);
    }
    return () => clearInterval(piRef.current);
  }, [playing, project.duration]);

  const handleImport = useCallback((files) => {
    const items = Array.from(files).map((f) => ({
      id: UID(), name: f.name, type: f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "audio" : "image",
      file: f, url: URL.createObjectURL(f), dur: 5, thumb: f.type.startsWith("video") ? "🎬" : f.type.startsWith("audio") ? "🎵" : "🖼️",
    }));
    setImported((prev) => [...prev, ...items]);
  }, []);

  const handleMDrag = useCallback((e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: item.type || "video" }));
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const onImp = useCallback(() => fRef.current?.click(), []);
  const onExp = useCallback(() => alert("Exportação via FFmpeg backend (em desenvolvimento)"), []);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d] text-white overflow-hidden">
      <TopBar project={project} setProject={setProject} onImport={onImp} onExport={onExp} ct={ct} dur={project.duration} />

      <div className="flex-1 flex min-h-0">
        {/* Sidebar tabs */}
        <div className="w-11 flex-shrink-0 bg-[#090909] border-r border-white/[0.06] flex flex-col py-2 items-center">
          {Object.entries(SIDEBAR_ICONS).map(([id, icon]) => (
            <SideTab key={id} icon={icon} label={id} active={sTab === id} onClick={() => setSTab(id)} />
          ))}
        </div>

        <LeftPanel tab={sTab} importedFiles={imported} onFileImport={handleImport} fileInputRef={fRef} onMediaDrag={handleMDrag} />

        <PreviewPanel playing={playing} setPlaying={setPlaying} ct={ct} setCt={setCt} proj={project} vol={vol} setVol={setVol} />

        <RightPanel clip={sel} />
      </div>

      <Timeline project={project} setProject={setProject} ct={ct} setCt={setCt} zoom={zoom} setZoom={setZoom} playing={playing} setPlaying={setPlaying} sel={sel} setSel={setSel} />

      <input ref={fRef} type="file" multiple accept="video/*,audio/*,image/*" className="hidden" onChange={(e) => { if (e.target.files.length) { handleImport(e.target.files); e.target.value = ""; } }} />
    </div>
  );
}

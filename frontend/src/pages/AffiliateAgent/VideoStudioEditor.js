import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ─── Util ─── */
const UID = () => Math.random().toString(36).slice(2, 9);
const FMT = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); const ms = Math.floor((s % 1) * 100); return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(2, "0")}`; };
const CLAMP = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ─── Constants ─── */
const PPS_BASE = 80;
const TRACK_H = 52;
const LABEL_W = 164;
const COLORS = {
  bg: "#0a0a0a", panel: "#0e0e0e", surface: "#141414", raised: "#1a1a1a", border: "rgba(255,255,255,0.05)",
  text: "rgba(255,255,255,0.75)", dim: "rgba(255,255,255,0.35)", muted: "rgba(255,255,255,0.14)",
  accent: "#22c55e", accentBg: "rgba(34,197,94,0.1)",
  track: { video: { bar: "#2563eb", bg: "rgba(37,99,235,0.12)", bd: "rgba(37,99,235,0.25)" }, audio: { bar: "#22c55e", bg: "rgba(34,197,94,0.12)", bd: "rgba(34,197,94,0.25)" }, text: { bar: "#f59e0b", bg: "rgba(245,158,11,0.1)", bd: "rgba(245,158,11,0.2)" }, sticker: { bar: "#a855f7", bg: "rgba(168,85,247,0.1)", bd: "rgba(168,85,247,0.2)" }, overlay: { bar: "#ec4899", bg: "rgba(236,72,153,0.1)", bd: "rgba(236,72,153,0.2)" }, },
};

/* ─── Icons (minimal set) ─── */
const S = ({ d, sz = 14, style }) => <svg style={{ width: sz, height: sz, flexShrink: 0, ...style }} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;
const I = {
  play: "M8 5v14l11-7z", pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z", skipB: "M6 6h2v12H6zm3.5 6l8.5 6V6z", skipF: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  full: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z", snap: "M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z",
  cut: "M3 17h2v-2H3v2zm0-4h2v-2H3v2zm0-4h2V7H3v2zm4 12h2V7H7v14zm4-4h2v-2h-2v2zm0-4h2v-2h-2v2zm12-2v2h-6v-2h6z",
  del: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  dup: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z",
  undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
  redo: "M11.5 8c-4.65 0-8.58 3.03-9.97 7.22l2.37.78c1.05-3.19 4.06-5.5 7.6-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6C16.55 9.01 14.15 8 11.5 8z",
  imp: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z", exp: "M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z",
  save: "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4z", keyf: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z",
  zoI: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z",
  zoO: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM7 9h5v1H7V9z",
  chD: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  ck: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z", close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  textI: "M5 4v3h5.5v12h3V7H19V4z",
  efx: "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z",
  trans: "M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.73 0-3.29-.74-4.39-1.93l-1.42 1.42C8.2 19.06 10.05 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.73 0 3.29.74 4.39 1.93l1.42-1.42C15.8 4.94 13.95 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z",
  flt: "M3 17c0 .55.45 1 1 1h5v-2H4c-.55 0-1 .45-1 1zM3 7c0 .55.45 1 1 1h3V6H4c-.55 0-1 .45-1 1zm5 6c0 .55.45 1 1 1h11c.55 0 1-.45 1-1s-.45-1-1-1H9c-.55 0-1 .45-1 1zM3 12c0 .55.45 1 1 1h2v-2H4c-.55 0-1 .45-1 1z",
  adj: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  lay: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  lockI: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
  logo: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  srch: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z",
  hist: "M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18z",
  sel: "M3 17h2v-2H3v2zm0-4h2v-2H3v2zm0-4h2V7H3v2zm4 12h2V7H7v14z",
  copyI: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z",
  cap: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z",
  mrk: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z",
  gpu: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  lut: "M21 3H3v18h18V3zM11 19H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z",
  motion: "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z",
  brand: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  captions: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
};

/* ─── Waveform ─── */
function Wv({ w = 60, h = 30, c = "#22c55e" }) {
  const b = useMemo(() => Array.from({ length: 36 }, () => Math.random() * 0.7 + 0.15), []);
  return <div className="flex items-end gap-[1px]" style={{ height: h, width: w }}>{b.map((s, i) => <div key={i} style={{ width: Math.max(1.5, (w - 4) / 36), height: `${s * 100}%`, borderRadius: "1px", background: c, opacity: 0.4 + s * 0.6 }} />)}</div>;
}

/* ─── Thumbnail strip ─── */
function ThS({ dur }) {
  const n = Math.max(3, Math.floor(dur * 4));
  const pal = ["#1e3a5f", "#1e40af", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];
  return <div className="flex h-full w-full overflow-hidden rounded-[2px]">{Array.from({ length: n }).map((_, i) => <div key={i} className="flex-1 h-full" style={{ background: `linear-gradient(135deg, ${pal[i % pal.length]} 0%, ${pal[(i + 2) % pal.length]} 100%)` }} />)}</div>;
}

/* ─── Input range ─── */
const Rng = ({ min, max, val, onChange, cls = "" }) => <input type="range" min={min} max={max} value={val} onChange={onChange} className={`w-full h-[3px] accent-emerald-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer ${cls}`} />;

/* ─── Tooltip ─── */
const Tp = ({ text, ch }) => <div className="group relative inline-flex">{ch}<div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#1a1a1a] border border-white/10 text-[9px] text-white/50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">{text}</div></div>;

/* ─── Button icon ─── */
const Bi = ({ d, onClick, sz = 14, cls = "", tip }) => {
  const b = <button onClick={onClick} className={`p-1 rounded hover:bg-white/10 text-white/25 hover:text-white/55 transition-colors ${cls}`}><S d={d} sz={sz} /></button>;
  return tip ? <Tp text={tip} ch={b} /> : b;
};

/* ─── Sample data ─── */
const MEDIA_LIB = [
  { id: "m1", name: "Intro.mp4", type: "video", dur: 6, thumb: "🎬" }, { id: "m2", name: "Produto.mov", type: "video", dur: 10, thumb: "📦" },
  { id: "m3", name: "Demo.mp4", type: "video", dur: 12, thumb: "🎥" }, { id: "m4", name: "Trilha.mp3", type: "audio", dur: 28, thumb: "🎵" },
  { id: "m5", name: "Voz.mp3", type: "audio", dur: 18, thumb: "🎙️" }, { id: "m6", name: "Logo.png", type: "image", thumb: "🖼️" },
  { id: "m7", name: "Bg.jpg", type: "image", thumb: "🌄" }, { id: "m8", name: "B-Roll.mp4", type: "video", dur: 8, thumb: "🎞️" },
  { id: "m9", name: "Overlay.mp4", type: "video", dur: 5, thumb: "✨" }, { id: "m10", name: "Card.png", type: "image", thumb: "🃏" },
];

const EFX_CATS = [
  { id: "blur", name: "Blur", i: "🌫️" }, { id: "glow", name: "Glow", i: "✨" }, { id: "vhs", name: "VHS", i: "📼" },
  { id: "shake", name: "Shake", i: "📳" }, { id: "rgb", name: "RGB Split", i: "🌈" }, { id: "zoom", name: "Zoom", i: "🔍" },
  { id: "cine", name: "Cinematic", i: "🎬" }, { id: "noise", name: "Noise", i: "📺" }, { id: "film", name: "Film Grain", i: "🎞️" },
  { id: "dream", name: "Dream", i: "💫" }, { id: "glitch", name: "Glitch", i: "💥" }, { id: "mirror", name: "Mirror", i: "🪞" },
];

const TRANS_LIST = [
  { id: "fade", name: "Fade", d: 0.5 }, { id: "slide", name: "Slide", d: 0.4 }, { id: "mblur", name: "Motion Blur", d: 0.5 },
  { id: "spin", name: "Spin", d: 0.6 }, { id: "cam", name: "Camera", d: 0.5 }, { id: "zoomT", name: "Zoom", d: 0.5 },
  { id: "warp", name: "Warp", d: 0.7 }, { id: "cube", name: "Cube", d: 0.6 }, { id: "wipe", name: "Wipe", d: 0.5 },
  { id: "mosaic", name: "Mosaic", d: 0.5 }, { id: "burn", name: "Burn", d: 0.5 }, { id: "page", name: "Page", d: 0.6 },
];

const LUTS = [
  { id: "l1", name: "Cinematic" }, { id: "l2", name: "Teal/Orange" }, { id: "l3", name: "Warm" }, { id: "l4", name: "Cool" },
  { id: "l5", name: "Moody" }, { id: "l6", name: "Vibrant" }, { id: "l7", name: "B&W" }, { id: "l8", name: "Film Stock" },
  { id: "l9", name: "Vintage" }, { id: "l10", name: "Neon" }, { id: "l11", name: "Pastel" }, { id: "l12", name: "Drama" },
];

const TEXT_STYLES = [
  { id: "tx1", name: "Título", font: "Inter", sz: 48 }, { id: "tx2", name: "Subtítulo", font: "Inter", sz: 30 },
  { id: "tx3", name: "Legenda", font: "Inter", sz: 22 }, { id: "tx4", name: "CTA", font: "Inter", sz: 36, w: 700 },
  { id: "tx5", name: "Intro", font: "Playfair", sz: 50 }, { id: "tx6", name: "Créditos", font: "Inter", sz: 18 },
  { id: "tx7", name: "Título Animado", font: "Inter", sz: 44 }, { id: "tx8", name: "Destaque", font: "Inter", sz: 28, w: 600 },
];

const STICKER_SET = [
  { id: "st1", e: "✨" }, { id: "st2", e: "🔥" }, { id: "st3", e: "❤️" }, { id: "st4", e: "⭐" }, { id: "st5", e: "➡️" },
  { id: "st6", e: "✅" }, { id: "st7", e: "⭕" }, { id: "st8", e: "⚡" }, { id: "st9", e: "👑" }, { id: "st10", e: "🎯" },
  { id: "st11", e: "💡" }, { id: "st12", e: "🎉" }, { id: "st13", e: "🚀" }, { id: "st14", e: "💎" }, { id: "st15", e: "🌟" },
  { id: "st16", e: "🔥" }, { id: "st17", e: "💯" }, { id: "st18", e: "🎵" },
];

const AI_TOOLS = [
  { id: "ai1", name: "Auto Subtitles", desc: "Transcrição automática", icon: "💬" },
  { id: "ai2", name: "Remove Background", desc: "Chroma key IA", icon: "✂️" },
  { id: "ai3", name: "Voice Enhancer", desc: "Áudio cristalino", icon: "🎤" },
  { id: "ai4", name: "Silence Remover", desc: "Remove pausas", icon: "🔇" },
  { id: "ai5", name: "AI Resize", desc: "Redimensiona inteligente", icon: "📐" },
  { id: "ai6", name: "Auto Cut", desc: "Cortes automáticos", icon: "✂️" },
  { id: "ai7", name: "Script to Video", desc: "Texto → vídeo", icon: "📝" },
  { id: "ai8", name: "AI Highlights", desc: "Melhores momentos", icon: "⭐" },
  { id: "ai9", name: "Translate Captions", desc: "Traduz legendas", icon: "🌐" },
  { id: "ai10", name: "Dub Video", desc: "Dublagem IA", icon: "🗣️" },
  { id: "ai11", name: "Color Grade AI", desc: "Cor automática", icon: "🎨" },
  { id: "ai12", name: "Upscale 4K", desc: "Super resolução", icon: "🔬" },
  { id: "ai13", name: "Slow Motion AI", desc: "Interpolação frames", icon: "🐢" },
  { id: "ai14", name: "Denoise", desc: "Redução de ruído", icon: "📡" },
];

const MOTION_PRESETS = [
  { id: "mp1", name: "Pan Left" }, { id: "mp2", name: "Pan Right" }, { id: "mp3", name: "Zoom In" },
  { id: "mp4", name: "Zoom Out" }, { id: "mp5", name: "Tilt Up" }, { id: "mp6", name: "Tilt Down" },
  { id: "mp7", name: "Track Left" }, { id: "mp8", name: "Track Right" },
];

const BRAND_ASSETS = [
  { id: "ba1", name: "Logo Primary.png", type: "image", thumb: "🏢" },
  { id: "ba2", name: "Logo Dark.png", type: "image", thumb: "🌙" },
  { id: "ba3", name: "Colors.ase", type: "palette", thumb: "🎨" },
  { id: "ba4", name: "Font Pack.zip", type: "font", thumb: "🔤" },
  { id: "ba5", name: "Watermark.png", type: "image", thumb: "®️" },
  { id: "ba6", name: "Pattern.png", type: "image", thumb: "🔷" },
];

const TEMPLATES = [
  { id: "tp1", name: "Intro Animada", dur: 5, thumb: "🚀" }, { id: "tp2", name: "Produto", dur: 15, thumb: "📦" },
  { id: "tp3", name: "Tutorial", dur: 30, thumb: "📚" }, { id: "tp4", name: "Vlog", dur: 20, thumb: "🎥" },
  { id: "tp5", name: "Review", dur: 25, thumb: "⭐" }, { id: "tp6", name: "Unboxing", dur: 18, thumb: "📬" },
  { id: "tp7", name: "Antes/Depois", dur: 10, thumb: "🔄" }, { id: "tp8", name: "CTA Final", dur: 8, thumb: "🎯" },
  { id: "tp9", name: "Story Promo", dur: 15, thumb: "📱" }, { id: "tp10", name: "Intro Podcast", dur: 10, thumb: "🎙️" },
];

/* ─── Initial project ─── */
const MK = (n, s, d, type, o = {}) => ({ id: UID(), name: n, start: s, duration: d, type, ...o });
const INITIAL = {
  name: "Projeto", duration: 20, fps: 30, width: 1920, height: 1080,
  tracks: [
    { id: "v1", name: "Vídeo 1", type: "video", visible: true, locked: false, clips: [MK("Intro.mp4", 0, 5, "video", { t: "🎬" }), MK("Produto.mov", 5, 7, "video", { t: "📦" }), MK("Demo.mp4", 12, 6, "video", { t: "🎥" })] },
    { id: "v2", name: "Vídeo 2", type: "video", visible: true, locked: false, clips: [] },
    { id: "a1", name: "Áudio 1", type: "audio", visible: true, locked: false, clips: [MK("Trilha.mp3", 0, 18, "audio", { t: "🎵" })] },
    { id: "a2", name: "Áudio 2", type: "audio", visible: true, locked: false, clips: [MK("Voz.mp3", 2, 9, "audio", { t: "🎙️" })] },
    { id: "t1", name: "Textos", type: "text", visible: true, locked: false, clips: [MK("Título", 1.5, 4, "text", { t: "T" })] },
    { id: "s1", name: "Stickers", type: "sticker", visible: true, locked: false, clips: [MK("✨", 4, 3, "sticker", { t: "✨" })] },
    { id: "o1", name: "Overlays", type: "overlay", visible: true, locked: false, clips: [MK("Blur", 7, 2.5, "overlay", { t: "🌫️" })] },
  ],
  markers: [
    { id: "mk1", time: 5, label: "Intro End", color: "#f59e0b" },
    { id: "mk2", time: 12, label: "Demo Start", color: "#3b82f6" },
  ],
};

/* ════════════════════════════════════════
   TOPBAR
   ════════════════════════════════════════ */
function TopBar({ proj, setProj, onImp, onExp, ct, dur }) {
  const [ed, setEd] = useState(false); const [nv, setNv] = useState(proj.name);
  const [sv, setSv] = useState(true); const ref = useRef(null);
  useEffect(() => { ed && ref.current?.focus(); }, [ed]);
  useEffect(() => { if (!sv) { const t = setTimeout(() => setSv(true), 600); return () => clearTimeout(t); } }, [sv]);
  const sub = () => { if (nv.trim()) setProj((p) => ({ ...p, name: nv.trim() })); setEd(false); };
  return (
    <div className="h-11 flex-shrink-0 bg-[#0c0c0c] border-b border-white/[0.06] flex items-center px-3 gap-1.5 z-40 select-none">
      <div className="flex items-center gap-2 mr-1.5">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm shadow-emerald-500/10"><S d={I.logo} sz={11} /></div>
        <span className="text-xs font-bold text-white/70 tracking-tight">BRANPY</span>
      </div>
      <div className="w-px h-5 bg-white/6" />
      {ed ? <input ref={ref} value={nv} onChange={(e) => setNv(e.target.value)} onBlur={sub} onKeyDown={(e) => e.key === "Enter" && sub()} className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-[11px] text-white/60 outline-none w-32" autoFocus />
        : <button onClick={() => setEd(true)} className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/4 text-[11px] text-white/40 hover:text-white/60"><S d={I.lay} sz={12} /><span className="max-w-[100px] truncate">{proj.name}</span><S d={I.chD} sz={11} /></button>}
      <div className={`flex items-center gap-1 text-[8px] ${sv ? "text-emerald-500/40" : "text-amber-400/50"}`}><div className={`w-1 h-1 rounded-full ${sv ? "bg-emerald-500/40" : "bg-amber-400/50 animate-pulse"}`} />{sv ? "Saved" : "Saving..."}</div>
      <div className="w-px h-5 bg-white/6 mx-0.5" />
      <Bi d={I.save} tip="Save" sz={13} /><Bi d={I.undo} tip="Undo" sz={13} /><Bi d={I.redo} tip="Redo" sz={13} /><Bi d={I.hist} tip="History" sz={13} />
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 bg-white/4 rounded px-2 py-0.5"><span className="text-[9px] text-white/20 font-mono tabular-nums">{FMT(ct)}</span><span className="text-[9px] text-white/10">/</span><span className="text-[9px] text-white/20 font-mono tabular-nums">{FMT(dur)}</span></div>
      <div className="flex items-center gap-1 bg-white/4 rounded px-2 py-0.5 text-[9px] text-white/20"><span>16:9</span><S d={I.chD} sz={10} /></div>
      <button onClick={onImp} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/6 hover:bg-white/10 text-white/35 hover:text-white/65 text-[10px] transition-all"><S d={I.imp} sz={12} />Import</button>
      <button onClick={onExp} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/70 hover:bg-emerald-500 text-white text-[10px] transition-all shadow-sm shadow-emerald-500/10"><S d={I.exp} sz={12} />Export</button>
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center text-[9px] font-bold text-white ml-0.5 cursor-pointer shadow-sm">J</div>
    </div>
  );
}

/* ════════════════════════════════════════
   SIDEBAR TABS
   ════════════════════════════════════════ */
const SIDEBAR_MAP = {
  media: I.srch, audio: I.music, text: I.textI, sticker: I.star, transitions: I.trans,
  effects: I.efx, luts: I.lut, color: I.adj, motion: I.motion, ai: I.star,
  assets: I.lay, templates: I.doc, captions: I.captions, brand: I.brand,
};

function SideTab({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full h-[38px] flex items-center justify-center relative ${active ? "text-emerald-400" : "text-white/18 hover:text-white/40"} transition-colors`} title={label}>
      <S d={icon} sz={15} />
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r bg-emerald-500" />}
    </button>
  );
}

/* ─── Panel header ─── */
const Ph = ({ label, ch }) => <div className="h-9 flex-shrink-0 flex items-center px-3 border-b border-white/6 gap-2"><span className="text-[10px] font-semibold text-white/18 uppercase tracking-[0.15em]">{label}</span>{ch}</div>;

/* ════════════════════════════════════════
   LEFT PANEL
   ════════════════════════════════════════ */
function LeftPanel({ tab, imm, onImp, fRef, onMDrag }) {
  const [srch, setSrch] = useState("");
  const [cat, setCat] = useState("all");
  const all = useMemo(() => [...MEDIA_LIB, ...imm], [imm]);
  const CATS = [{ id: "all", label: "All" }, { id: "local", label: "Local" }, { id: "video", label: "Videos" }, { id: "image", label: "Images" }, { id: "audio", label: "Audio" }];

  const filtered = useMemo(() => { let i = all; if (cat === "video") i = i.filter((m) => m.type === "video"); else if (cat === "image") i = i.filter((m) => m.type === "image"); else if (cat === "audio") i = i.filter((m) => m.type === "audio"); if (srch.trim()) i = i.filter((m) => m.name.toLowerCase().includes(srch.toLowerCase())); return i; }, [all, cat, srch]);

  return (
    <div className="w-[260px] flex-shrink-0 border-r border-white/6 bg-[#0d0d0d] flex flex-col min-h-0">
      <Ph label={tab === "media" ? "Media" : tab === "audio" ? "Audio" : tab === "text" ? "Text" : tab === "sticker" ? "Stickers" : tab === "transitions" ? "Transitions" : tab === "effects" ? "Effects" : tab === "luts" ? "LUTs" : tab === "color" ? "Color" : tab === "motion" ? "Motion" : tab === "ai" ? "AI Tools" : tab === "assets" ? "Assets" : tab === "templates" ? "Templates" : tab === "captions" ? "Captions" : "Brand Kit"} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tab === "media" && (<>
          <div className="px-3 pt-2 pb-1"><div className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1.5"><S d={I.srch} sz={11} /><input value={srch} onChange={(e) => setSrch(e.target.value)} placeholder="Search media..." className="bg-transparent text-[10px] text-white/50 outline-none w-full placeholder:text-white/12" />{srch && <button onClick={() => setSrch("")} className="text-white/12 hover:text-white/35"><S d={I.close} sz={10} /></button>}</div></div>
          <div className="flex px-3 gap-1 mb-2 overflow-x-auto scrollbar-none">{CATS.map((c) => <button key={c.id} onClick={() => setCat(c.id)} className={`flex-shrink-0 text-[8px] px-2 py-1 rounded-md ${cat === c.id ? "bg-white/10 text-white/55" : "text-white/18 hover:text-white/35 hover:bg-white/4"}`}>{c.label}</button>)}</div>
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) onImp(e.dataTransfer.files); }} className="mx-3 mb-2 border border-dashed border-white/8 rounded-md p-2 text-center hover:border-emerald-500/20 cursor-pointer" onClick={() => fRef.current?.click()}>
            <div className="text-[8px] text-white/18">Drop files or click to import</div>
          </div>
          <div className={filtered.length === 0 ? "px-4 py-8 text-center" : "grid grid-cols-2 gap-1.5 px-3 pb-4"}>
            {filtered.length === 0 ? <><div className="text-xl opacity-15 mb-1">📂</div><div className="text-[9px] text-white/12">No files found</div></>
              : filtered.map((item) => (
                <div key={item.id} draggable onDragStart={(e) => onMDrag(e, { ...item, type: item.type || "video" })} className="group flex flex-col rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 hover:border-white/8 cursor-grab active:cursor-grabbing transition-all overflow-hidden">
                  <div className="w-full aspect-video flex items-center justify-center bg-black/40 text-xl group-hover:scale-105 transition-transform">{item.thumb}</div>
                  <div className="px-1.5 py-1"><div className="text-[9px] text-white/45 truncate group-hover:text-white/65">{item.name}</div><div className="text-[7px] text-white/14">{item.dur ? `${item.dur}s` : item.type}</div></div>
                </div>
              ))}
          </div>
        </>)}
        {tab === "audio" && <AudioPanel />}
        {tab === "text" && <TextPanel />}
        {tab === "sticker" && <StickerPanel />}
        {tab === "transitions" && <TransitionsPanel />}
        {tab === "effects" && <EffectsPanel />}
        {tab === "luts" && <LUTsPanel />}
        {tab === "color" && <ColorPanel />}
        {tab === "motion" && <MotionPanel />}
        {tab === "ai" && <AIPanel />}
        {tab === "assets" && <AssetsPanel />}
        {tab === "templates" && <TemplatesPanel />}
        {tab === "captions" && <CaptionsPanel />}
        {tab === "brand" && <BrandPanel />}
      </div>
    </div>
  );
}

function AudioPanel() {
  const items = [...MEDIA_LIB.filter((m) => m.type === "audio"), ...[
    { id: "au3", name: "SFX.mp3", dur: 3, thumb: "🔔" }, { id: "au4", name: "Transição.wav", dur: 1.5, thumb: "🔊" },
    { id: "au5", name: "Ambiente.mp3", dur: 60, thumb: "🌿" }, { id: "au6", name: "Bass.mp3", dur: 4, thumb: "🎸" },
    { id: "au7", name: "Clap.wav", dur: 0.3, thumb: "👏" }, { id: "au8", name: "Riser.mp3", dur: 3, thumb: "📈" },
  ]];
  return (
    <div className="grid grid-cols-2 gap-1.5 p-3">
      {items.map((item) => (
        <div key={item.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: "audio" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }} className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-grab active:cursor-grabbing">
          <div className="w-full aspect-video rounded flex items-center justify-center bg-black/40 text-xl mb-1">{item.thumb}</div>
          <div className="text-[9px] text-white/45 truncate">{item.name}</div>
          <div className="text-[7px] text-white/15">{item.dur}s</div>
        </div>
      ))}
    </div>
  );
}

function TextPanel() {
  return (
    <div className="space-y-px px-2 pb-3 mt-1">
      {TEXT_STYLES.map((t) => (
        <div key={t.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...t, type: "text" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-white/4 cursor-grab active:cursor-grabbing">
          <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-xs font-bold text-white/35">{t.name[0]}</div>
          <div><div className="text-[10px] text-white/45">{t.name}</div><div className="text-[7px] text-white/15">{t.font} · {t.sz}px{t.w ? ` · ${t.w}` : ""}</div></div>
        </div>
      ))}
    </div>
  );
}

function StickerPanel() {
  return <div className="grid grid-cols-4 gap-1.5 p-3">{STICKER_SET.map((s) => <div key={s.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...s, type: "sticker" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }} className="aspect-square rounded-lg bg-white/2 border border-white/4 flex items-center justify-center text-xl hover:bg-white/6 hover:scale-110 transition-all cursor-grab active:cursor-grabbing">{s.e}</div>)}</div>;
}

function TransitionsPanel() {
  return <div className="grid grid-cols-2 gap-1.5 p-3">{TRANS_LIST.map((tr) => <div key={tr.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...tr, type: "overlay" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }} className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-pointer"><div className="w-full aspect-video rounded flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.01] text-sm mb-1"><S d={I.trans} sz={16} style={{ color: "rgba(255,255,255,0.2)" }} /></div><div className="text-[9px] text-white/45">{tr.name}</div><div className="text-[7px] text-white/15">{tr.d}s</div></div>)}</div>;
}

function EffectsPanel() {
  return <div className="grid grid-cols-2 gap-1.5 p-3">{EFX_CATS.map((ef) => <div key={ef.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...ef, type: "overlay", dur: 3 })); e.dataTransfer.effectAllowed = "copy"; } catch {} }} className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-grab active:cursor-grabbing"><div className="w-full aspect-video rounded flex items-center justify-center bg-black/40 text-lg mb-1">{ef.i}</div><div className="text-[9px] text-white/45">{ef.name}</div></div>)}</div>;
}

function LUTsPanel() {
  return <div className="grid grid-cols-2 gap-1.5 p-3">{LUTS.map((l) => <div key={l.id} className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-pointer"><div className="w-full aspect-video rounded flex items-center justify-center bg-gradient-to-br from-white/10 via-transparent to-black/40 text-[9px] text-white/20">LUT</div><div className="text-[9px] text-white/45 mt-1">{l.name}</div></div>)}</div>;
}

function ColorPanel() {
  const [v, setV] = useState({ temp: 0, tint: 0, sat: 0, exp: 0, cont: 0, hl: 0, sh: 0 });
  return <div className="px-3 pb-3 space-y-2 mt-1">{[
    { k: "temp", label: "Temp" }, { k: "tint", label: "Tint" }, { k: "sat", label: "Saturation" },
    { k: "exp", label: "Exposure" }, { k: "cont", label: "Contrast" }, { k: "hl", label: "Highlights" }, { k: "sh", label: "Shadows" },
  ].map((s) => (<div key={s.k}><div className="flex justify-between text-[9px] text-white/25 mb-0.5"><span>{s.label}</span><span className="text-white/15">{v[s.k] > 0 ? "+" : ""}{v[s.k]}</span></div><Rng min={-100} max={100} val={v[s.k]} onChange={(e) => setV((x) => ({ ...x, [s.k]: +e.target.value }))} /></div>))}
    <button className="w-full text-[9px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10">Reset</button>
  </div>;
}

function MotionPanel() {
  return <div className="grid grid-cols-2 gap-1 p-3">{MOTION_PRESETS.map((mp) => <div key={mp.id} className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-pointer"><div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-xs">🎬</div><span className="text-[10px] text-white/45">{mp.name}</span></div>)}</div>;
}

function AIPanel() {
  return <div className="p-2 space-y-1">{AI_TOOLS.map((ai) => (<button key={ai.id} className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-white/4"><div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400/70 text-[9px]">{ai.icon}</div><div><div className="text-[9px] text-white/45">{ai.name}</div><div className="text-[7px] text-white/15">{ai.desc}</div></div></button>))}</div>;
}

function AssetsPanel() {
  return <div className="grid grid-cols-2 gap-1.5 p-3">{BRAND_ASSETS.map((a) => <div key={a.id} className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-pointer"><div className="w-full aspect-video rounded flex items-center justify-center bg-black/40 text-xl mb-1">{a.thumb}</div><div className="text-[9px] text-white/45 truncate">{a.name}</div></div>)}</div>;
}

function TemplatesPanel() {
  return <div className="grid grid-cols-2 gap-1.5 p-3">{TEMPLATES.map((t) => <div key={t.id} className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-pointer"><div className="w-full aspect-video rounded flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-blue-500/10 text-lg mb-1">{t.thumb}</div><div className="text-[9px] text-white/45">{t.name}</div><div className="text-[7px] text-white/15">{t.dur}s</div></div>)}</div>;
}

function CaptionsPanel() {
  return <div className="p-3 space-y-2">{[{ id: "c1", name: "Auto Detect", lang: "Auto", icon: "🌐" }, { id: "c2", name: "Portuguese", lang: "PT-BR", icon: "🇧🇷" }, { id: "c3", name: "English", lang: "EN", icon: "🇺🇸" }, { id: "c4", name: "Spanish", lang: "ES", icon: "🇪🇸" },].map((c) => (<button key={c.id} className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-white/4"><div className="text-lg">{c.icon}</div><div><div className="text-[9px] text-white/45">{c.name}</div><div className="text-[7px] text-white/15">{c.lang}</div></div></button>))}
    <div className="pt-2 border-t border-white/6"><button className="w-full text-[9px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10">Generate Captions</button></div>
  </div>;
}

function BrandPanel() {
  return <div className="p-3 space-y-2"><div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-white/4"><div className="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">B</div><div><div className="text-[10px] text-white/50">BRANPY Brand</div><div className="text-[7px] text-white/15">Active kit</div></div></div>
    <div className="grid grid-cols-3 gap-1.5">{["#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#ec4899", "#ef4444"].map((c, i) => <div key={i} className="h-8 rounded-md cursor-pointer hover:scale-110 transition-transform" style={{ background: c }} />)}</div>
    <button className="w-full text-[9px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 mt-1">Edit Brand Kit</button>
  </div>;
}

/* ════════════════════════════════════════
   PREVIEW PANEL
   ════════════════════════════════════════ */
function PreviewPanel({ playing, setPlaying, ct, setCt, proj, vol, setVol }) {
  const ref = useRef(null);
  const [pz, setPz] = useState(75);
  const [grid, setGrid] = useState(false);
  const [safe, setSafe] = useState(false);
  const toggleFs = () => { if (!document.fullscreenElement) ref.current?.requestFullscreen(); else document.exitFullscreen(); };
  const baseW = Math.min(520, window.innerWidth * 0.32);
  const baseH = baseW / (16 / 9);

  return (
    <div ref={ref} className="flex-1 flex flex-col min-h-0 bg-[#080808]">
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden">
        <div className="rounded-lg overflow-hidden shadow-2xl border border-white/8 bg-black relative" style={{ width: baseW, height: baseH, transform: `scale(${pz / 100})` }}>
          {playing || ct > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, hsl(${(ct * 25) % 360}, 30%, 10%), hsl(${(ct * 25 + 80) % 360}, 25%, 14%))` }} />
              {/* Safe area overlay */}
              {safe && <div className="absolute inset-[10%] border border-white/15 rounded-sm pointer-events-none" />}
              {/* Grid overlay */}
              {grid && <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "16.66% 16.66%" }} />}
              <div className="relative z-10 text-center px-4">
                <div className="text-2xl mb-1 opacity-10">🎬</div>
                <div className="text-[8px] text-white/6 font-mono">{proj.width}×{proj.height}</div>
                <div className="text-[8px] text-white/6 font-mono mt-0.5">{FMT(ct)}</div>
                <div className="mt-2 w-32 h-[2px] bg-white/5 rounded-full mx-auto overflow-hidden"><div className="h-full bg-emerald-500/30 rounded-full" style={{ width: `${(ct / (proj.duration || 1)) * 100}%` }} /></div>
              </div>
              {/* GPU / quality indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5 text-[7px] text-white/25"><S d={I.gpu} sz={8} />GPU · 1080p · {proj.fps}fps</div>
              <div className="absolute top-2 right-2 bg-black/40 rounded px-1.5 py-0.5 text-[7px] text-white/25">● Live</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border border-white/8 flex items-center justify-center mx-auto mb-2.5 cursor-pointer hover:border-white/20 transition-all" onClick={() => setPlaying(true)}>
                  <S d={I.play} sz={20} style={{ color: "rgba(255,255,255,0.25)", marginLeft: 2 }} />
                </div>
                <div className="text-[9px] text-white/10">Preview</div>
                <div className="text-[7px] text-white/6 mt-0.5">{proj.width}×{proj.height} · {proj.fps}fps · 16:9</div>
              </div>
            </div>
          )}
        </div>

        {/* Overlay controls */}
        <div className="absolute right-3 bottom-3 flex items-center gap-1 bg-[#0c0c0c]/90 border border-white/6 rounded-md px-2 py-1 backdrop-blur-sm">
          <button onClick={() => setGrid(!grid)} className={`p-0.5 ${grid ? "text-emerald-400/60" : "text-white/18 hover:text-white/35"}`}><S d={I.snap} sz={11} /></button>
          <button onClick={() => setSafe(!safe)} className={`p-0.5 ${safe ? "text-emerald-400/60" : "text-white/18 hover:text-white/35"}`}><S d={I.lay} sz={11} /></button>
          <div className="w-px h-3 bg-white/6 mx-0.5" />
          <button onClick={() => setPz((z) => Math.max(25, z - 15))} className="p-0.5 text-white/18 hover:text-white/35"><S d={I.zoO} sz={11} /></button>
          <span className="text-[8px] text-white/25 w-6 text-center tabular-nums">{pz}%</span>
          <button onClick={() => setPz((z) => Math.min(200, z + 15))} className="p-0.5 text-white/18 hover:text-white/35"><S d={I.zoI} sz={11} /></button>
          <div className="w-px h-3 bg-white/6 mx-0.5" />
          <button onClick={toggleFs} className="p-0.5 text-white/18 hover:text-white/35"><S d={I.full} sz={11} /></button>
        </div>
      </div>

      {/* Playback bar */}
      <div className="h-10 flex-shrink-0 bg-[#0c0c0c] border-t border-white/6 flex items-center px-3 gap-1.5">
        <Bi d={I.skipB} tip="Start" sz={14} onClick={() => setCt(0)} />
        <button onClick={() => setPlaying(!playing)} className="p-1 rounded hover:bg-white/10 text-white/55 hover:text-white/85"><S d={playing ? I.pause : I.play} sz={17} /></button>
        <Bi d={I.skipF} tip="End" sz={14} />
        <span className="text-[10px] text-white/25 font-mono w-12 text-right tabular-nums">{FMT(ct)}</span>
        <input type="range" min={0} max={proj.duration} step={0.04} value={ct} onChange={(e) => setCt(+e.target.value)} className="flex-1 h-[3px] accent-emerald-500 bg-white/5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #22c55e ${(ct / (proj.duration || 1)) * 100}%, rgba(255,255,255,0.05) ${(ct / (proj.duration || 1)) * 100}%)` }} />
        <span className="text-[10px] text-white/18 font-mono w-12 tabular-nums">{FMT(proj.duration)}</span>
        <div className="w-px h-5 bg-white/6 mx-1" />
        <Bi d={I.snap} tip="Frame" sz={14} />
        <div className="flex items-center gap-1"><S d={I.music} sz={13} style={{ color: "rgba(255,255,255,0.2)" }} /><Rng min={0} max={100} val={vol} onChange={(e) => setVol(+e.target.value)} cls="w-12 h-[2px]" /></div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   RIGHT PANEL — INSPECTOR
   ════════════════════════════════════════ */
function Inspector({ clip }) {
  const [tab, setTab] = useState("transform");
  if (!clip) return <div className="w-[260px] flex-shrink-0 border-l border-white/6 bg-[#0d0d0d] flex flex-col min-h-0"><Ph label="Inspector" /><div className="flex-1 flex items-center justify-center"><div className="text-center px-4"><div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-1.5"><S d={I.lay} sz={15} style={{ color: "rgba(255,255,255,0.12)" }} /></div><div className="text-[9px] text-white/12">Select a clip to inspect</div></div></div></div>;

  const TABS = [
    { id: "transform", label: "Transform" }, { id: "color", label: "Color" },
    { id: "audio", label: "Audio" }, { id: "effects", label: "Effects" },
    { id: "motion", label: "Motion" }, { id: "ai", label: "AI" }, { id: "captions", label: "Captions" },
  ];

  return (
    <div className="w-[260px] flex-shrink-0 border-l border-white/6 bg-[#0d0d0d] flex flex-col min-h-0">
      <Ph label="Inspector" />
      <div className="flex-shrink-0 flex border-b border-white/6 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 text-[9px] py-2 whitespace-nowrap relative ${tab === t.id ? "text-white/65" : "text-white/18 hover:text-white/35"}`}>
            {t.label}
            {tab === t.id && <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] rounded-t bg-emerald-500" />}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-3 space-y-2.5">
          {/* Clip header */}
          <div className="flex items-center gap-2 pb-2 border-b border-white/6">
            <div className="w-9 h-9 rounded-md bg-white/5 flex items-center justify-center text-base flex-shrink-0">{clip.t || "🎬"}</div>
            <div className="min-w-0"><div className="text-[10px] text-white/55 font-medium truncate">{clip.name}</div><div className="text-[7px] text-white/15">{FMT(clip.start)} — {FMT(clip.start + clip.duration)}</div></div>
          </div>

          {tab === "transform" && <>
            {[{ l: "Position X", k: "px", v: 0 }, { l: "Position Y", k: "py", v: 0 }].map((s) => (
              <div key={s.k}><div className="flex justify-between text-[9px] text-white/25 mb-0.5"><span>{s.l}</span><span className="text-white/15">{s.v}</span></div><Rng min={-2000} max={2000} val={s.v} /></div>
            ))}
            <div className="grid grid-cols-2 gap-1.5">
              {[{ l: "Scale", k: "scale", v: 100, min: 1, max: 500 }, { l: "Rotation", k: "rot", v: 0, min: -180, max: 180 }, { l: "Opacity", k: "op", v: 100, min: 0, max: 100 }, { l: "Blur", k: "blur", v: 0, min: 0, max: 50 }].map((s) => (
                <div key={s.k}><div className="flex justify-between text-[8px] text-white/22 mb-0.5"><span>{s.l}</span><span className="text-white/12">{s.v}</span></div><Rng min={s.min} max={s.max} val={s.v} /></div>
              ))}
            </div>
            <div className="pt-1"><div className="flex justify-between text-[9px] text-white/25 mb-0.5"><span>Blend Mode</span></div>
              <select className="w-full bg-white/5 border border-white/8 rounded text-[9px] text-white/40 px-1.5 py-1 outline-none focus:border-white/15">{[{ v: "normal", l: "Normal" }, { v: "multiply", l: "Multiply" }, { v: "screen", l: "Screen" }, { v: "overlay", l: "Overlay" }, { v: "add", l: "Add" }, { v: "subtract", l: "Subtract" }].map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
            </div>
            <div className="flex gap-1 pt-1"><button className="flex-1 text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10">Chroma Key</button><button className="flex-1 text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10">Stabilize</button></div>
          </>}

          {tab === "color" && <>
            {[{ l: "Exposure", k: "exp", v: 0 }, { l: "Contrast", k: "cont", v: 0 }, { l: "Highlights", k: "hl", v: 0 }, { l: "Shadows", k: "sh", v: 0 }, { l: "Whites", k: "wh", v: 0 }, { l: "Blacks", k: "bk", v: 0 }, { l: "Saturation", k: "sat", v: 0 }, { l: "Hue", k: "hue", v: 0 }, { l: "Temperature", k: "temp", v: 0 }, { l: "Tint", k: "tint", v: 0 }, { l: "Sharpness", k: "sharp", v: 0 }, { l: "Vignette", k: "vig", v: 0 }].map((s) => (
              <div key={s.k}><div className="flex justify-between text-[8px] text-white/22 mb-0.5"><span>{s.l}</span><span className="text-white/12">{s.v > 0 ? "+" : ""}{s.v}</span></div><Rng min={-100} max={100} val={s.v} /></div>
            ))}
            <div className="pt-1"><button className="w-full text-[9px] py-1.5 rounded bg-gradient-to-r from-emerald-500/15 to-purple-500/15 text-emerald-400/70 hover:from-emerald-500/25 hover:to-purple-500/25">Auto Color Grade</button></div>
          </>}

          {tab === "audio" && <>
            {[{ l: "Volume", k: "vol", v: 100, min: 0, max: 200 }, { l: "Fade In", k: "fIn", v: 0, min: 0, max: 5 }, { l: "Fade Out", k: "fOut", v: 0, min: 0, max: 5 }, { l: "Pan", k: "pan", v: 0, min: -100, max: 100 }].map((s) => (
              <div key={s.k}><div className="flex justify-between text-[8px] text-white/22 mb-0.5"><span>{s.l}</span><span className="text-white/12">{s.v}</span></div><Rng min={s.min} max={s.max} val={s.v} /></div>
            ))}
            <div className="pt-2 border-t border-white/6"><div className="text-[9px] text-white/18 mb-1.5">Equalizer</div>{[60, 200, 500, 2000, 8000, 16000].map((hz) => (<div key={hz} className="flex items-center gap-2 text-[8px] text-white/15 mb-0.5"><span className="w-8 flex-shrink-0">{hz < 1000 ? `${hz}Hz` : `${hz / 1000}k`}</span><Rng min={-12} max={12} val={0} /></div>))}</div>
            <div className="flex gap-1 pt-1"><button className="flex-1 text-[8px] py-1.5 rounded bg-red-500/8 text-red-400/60 hover:bg-red-500/15">Denoise</button><button className="flex-1 text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10">Voice Enhancer</button></div>
          </>}

          {tab === "effects" && <>
            <div className="grid grid-cols-2 gap-1">{EFX_CATS.slice(0, 8).map((ef) => <button key={ef.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white/5 text-white/30 hover:bg-white/10 text-[8px]"><span>{ef.i}</span>{ef.name}</button>)}</div>
            <div className="pt-2 border-t border-white/6"><div className="text-[9px] text-white/18 mb-1">Speed Ramp</div><Rng min={0.1} max={8} step={0.1} val={1} />
              <div className="grid grid-cols-4 gap-1 mt-1.5">{[0.25, 0.5, 1, 2, 4, 8, 0.75, 1.5].map((s) => <button key={s} className={`text-[9px] py-1 rounded ${s === 1 ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/25 hover:bg-white/10"}`}>{s}x</button>)}</div>
            </div>
          </>}

          {tab === "motion" && <>
            <div className="text-[9px] text-white/18 mb-1">Easing</div>
            <div className="grid grid-cols-2 gap-1">{["Linear", "Ease In", "Ease Out", "Ease In Out", "Bounce", "Elastic"].map((e) => <button key={e} className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10">{e}</button>)}</div>
            <div className="pt-2 border-t border-white/6"><div className="text-[9px] text-white/18 mb-1">Animation</div><div className="grid grid-cols-3 gap-1">{["Fade", "Slide Up", "Slide Down", "Slide L", "Slide R", "Scale", "Rotate", "Zoom", "Bounce"].map((a) => <button key={a} className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10">{a}</button>)}</div></div>
            <div className="flex gap-1 pt-2"><button className="flex-1 text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10">Reverse</button><button className="flex-1 text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10">Freeze Frame</button></div>
          </>}

          {tab === "ai" && <>
            {AI_TOOLS.slice(0, 8).map((ai) => (<button key={ai.id} className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-white/4"><div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400/60 text-[8px]">{ai.icon}</div><div><div className="text-[9px] text-white/45">{ai.name}</div><div className="text-[7px] text-white/12">{ai.desc}</div></div></button>))}
          </>}

          {tab === "captions" && <>
            <button className="w-full text-[9px] py-2 rounded bg-white/6 text-white/35 hover:bg-white/10">Generate Captions</button>
            <div className="pt-2 space-y-1">{["Auto Detect · PT-BR", "Auto Detect · EN", "Manual"].map((o) => <button key={o} className="w-full text-left text-[9px] px-2.5 py-2 rounded-md hover:bg-white/4 text-white/35">{o}</button>)}</div>
            <div className="pt-2"><div className="text-[9px] text-white/18 mb-0.5">Font Size</div><Rng min={12} max={72} val={24} /></div>
          </>}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   TIMELINE
   ════════════════════════════════════════ */
function Timeline({ proj, setProj, ct, setCt, zoom, setZoom, playing, setPlaying, sel, setSel }) {
  const rulerRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [trim, setTrim] = useState(null);
  const pps = PPS_BASE * (zoom / 100);
  const totalW = Math.max(proj.duration * pps + 200, 3000);

  const findSnap = useCallback((ns, cId, tId) => {
    const track = proj.tracks.find((t) => t.id === tId);
    if (!track) return ns;
    const others = track.clips.filter((c) => c.id !== cId);
    let snap = ns, md = 5 / pps;
    for (const c of others) { for (const t of [c.start, c.start + c.duration]) { const d = Math.abs(ns - t); if (d < md) { snap = t; md = d; } } }
    const ed = Math.abs(ns + (drag?.clip?.duration || 0) - (others.length ? others[Math.min(others.length - 1, 0)].start : 0));
    const pd = Math.abs(ns - ct); if (pd < md) { snap = ct; }
    return Math.max(0, snap);
  }, [proj, ct, pps, drag]);

  const clipColor = (type) => COLORS.track[type] || COLORS.track.video;

  const handleClipMD = useCallback((e, clip, tId) => {
    if (e.button !== 0) return; e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isL = (e.clientX - rect.left) < 7, isR = (rect.right - e.clientX) < 7;
    if (isL || isR) setTrim({ clip, tId, side: isL ? "left" : "right", sx: e.clientX, os: clip.start, od: clip.duration });
    else setDrag({ clip, tId, sx: e.clientX, os: clip.start });
    setSel({ ...clip, trackId: tId });
  }, [setSel]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => { const snapped = findSnap(drag.os + (e.clientX - drag.sx) / pps, drag.clip.id, drag.tId); setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === drag.tId ? { ...t, clips: t.clips.map((c) => c.id === drag.clip.id ? { ...c, start: snapped } : c) } : t) })); };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [drag, pps, findSnap, setProj]);

  useEffect(() => {
    if (!trim) return;
    const onMove = (e) => { const dt = (e.clientX - trim.sx) / pps; if (trim.side === "left") { const ns = Math.max(0, Math.min(trim.os + dt, trim.os + trim.od - 0.5)); setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === trim.tId ? { ...t, clips: t.clips.map((c) => c.id === trim.clip.id ? { ...c, start: ns, duration: Math.max(0.5, trim.od - (ns - trim.os)) } : c) } : t) })); } else { setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === trim.tId ? { ...t, clips: t.clips.map((c) => c.id === trim.clip.id ? { ...c, duration: Math.max(0.5, trim.od + dt) } : c) } : t) })); } };
    const onUp = () => setTrim(null);
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [trim, pps, setProj]);

  const handleRulerMD = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = rulerRef.current?.getBoundingClientRect(); if (!rect) return;
    const update = (cx) => setCt(Math.max(0, Math.min(proj.duration, (cx - rect.left) / pps)));
    update(e.clientX);
    const onMove = (ev) => update(ev.clientX); const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }, [pps, proj.duration, setCt]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === " " || e.key === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      if ((e.key === "Delete" || e.key === "Backspace") && sel?.trackId) { setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: t.clips.filter((c) => c.id !== sel.id) } : t) })); setSel(null); }
      if (e.key === "ArrowLeft" && e.shiftKey) { e.preventDefault(); setCt((t) => Math.max(0, t - 0.5)); }
      if (e.key === "ArrowRight" && e.shiftKey) { e.preventDefault(); setCt((t) => Math.min(proj.duration, t + 0.5)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, setProj, setCt, setPlaying, proj.duration]);

  const handleDrop = useCallback((e, tId) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    try {
      const item = JSON.parse(data);
      const tlRect = rulerRef.current?.getBoundingClientRect();
      const st = Math.max(0, (e.clientX - (tlRect?.left || 0)) / pps);
      const dur = item.dur || 4;
      const nc = { id: UID(), name: item.name, start: st, duration: dur, type: item.type || "video", t: item.t || item.thumb || item.e || "🎬" };
      setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === tId ? { ...t, clips: [...t.clips, nc].sort((a, b) => a.start - b.start) } : t) }));
      setSel({ ...nc, trackId: tId });
    } catch {}
  }, [pps, setProj, setSel]);

  const handleSplit = useCallback(() => {
    if (!sel?.trackId) return;
    const { trackId, id } = sel;
    setProj((prev) => {
      const track = prev.tracks.find((t) => t.id === trackId); if (!track) return prev;
      const clip = track.clips.find((c) => c.id === id); if (!clip || ct <= clip.start || ct >= clip.start + clip.duration) return prev;
      const lD = ct - clip.start, rD = clip.duration - lD; if (lD < 0.3 || rD < 0.3) return prev;
      const rc = { ...clip, id: UID(), start: ct, duration: rD };
      return { ...prev, tracks: prev.tracks.map((t) => t.id === trackId ? { ...t, clips: [...t.clips.filter((c) => c.id !== id), { ...clip, duration: lD }, rc].sort((a, b) => a.start - b.start) } : t) };
    });
  }, [sel, ct, setProj]);

  const handleDel = useCallback(() => { if (!sel?.trackId) return; setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: t.clips.filter((c) => c.id !== sel.id) } : t) })); setSel(null); }, [sel, setProj, setSel]);

  const handleDup = useCallback(() => { if (!sel?.trackId) return; setProj((prev) => { const track = prev.tracks.find((t) => t.id === sel.trackId); if (!track) return prev; const clip = track.clips.find((c) => c.id === sel.id); if (!clip) return prev; const d = { ...clip, id: UID(), start: clip.start + clip.duration + 0.5 }; return { ...prev, tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: [...t.clips, d].sort((a, b) => a.start - b.start) } : t) }; }); }, [sel, setProj]);

  const toggleVis = useCallback((tid) => setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === tid ? { ...t, visible: !t.visible } : t) })), [setProj]);
  const toggleLock = useCallback((tid) => setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === tid ? { ...t, locked: !t.locked } : t) })), [setProj]);

  const badge = (type) => ({ video: { bg: "#1e40af", l: "V" }, audio: { bg: "#166534", l: "A" }, text: { bg: "#92400e", l: "T" }, sticker: { bg: "#6b21a8", l: "S" }, overlay: { bg: "#831843", l: "O" } })[type] || { bg: "#333", l: "?" };

  return (
    <div className="h-[248px] flex-shrink-0 border-t border-white/6 bg-[#0b0b0b] flex flex-col">
      {/* Timeline toolbar */}
      <div className="h-8 flex-shrink-0 bg-[#0e0e0e] border-b border-white/6 flex items-center px-2 gap-0.5 overflow-x-auto scrollbar-none">
        <Tp text="Select" ch={<button className={`p-1 rounded ${sel ? "bg-white/10 text-white/55" : "text-white/20 hover:bg-white/5"}`}><S d={I.sel} sz={12} /></button>} />
        <div className="w-px h-3.5 bg-white/6 mx-0.5" />
        <Tp text="Split" ch={<button onClick={handleSplit} className={`px-1.5 py-0.5 text-[9px] rounded ${sel ? "hover:bg-white/10 text-white/35 hover:text-white/65" : "text-white/12"}`}>Split</button>} />
        <Tp text="Delete" ch={<button onClick={handleDel} className={`px-1.5 py-0.5 text-[9px] rounded ${sel ? "hover:bg-white/10 text-white/35 hover:text-red-400" : "text-white/12"}`}>Del</button>} />
        <Tp text="Duplicate" ch={<button onClick={handleDup} className={`px-1.5 py-0.5 text-[9px] rounded ${sel ? "hover:bg-white/10 text-white/35 hover:text-white/65" : "text-white/12"}`}>Dup</button>} />
        <div className="w-px h-3.5 bg-white/6 mx-0.5" />
        <Tp text="Cut" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Cut</button>} />
        <Tp text="Copy" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Copy</button>} />
        <Tp text="Paste" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Paste</button>} />
        <Tp text="Freeze" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Freeze</button>} />
        <Tp text="Reverse" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Reverse</button>} />
        <div className="w-px h-3.5 bg-white/6 mx-0.5" />
        <Tp text="Speed" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Speed</button>} />
        <Tp text="Chroma" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Chroma</button>} />
        <Tp text="Crop" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Crop</button>} />
        <Tp text="Captions" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">CC</button>} />
        <Tp text="Extract Audio" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Audio</button>} />
        <div className="flex-1" />
        <Tp text="Marker" ch={<button className="p-1 rounded text-white/20 hover:bg-white/5"><S d={I.mrk} sz={12} /></button>} />
        <Tp text="Snap" ch={<button className={`p-1 rounded text-white/35`}><S d={I.snap} sz={12} /></button>} />
        <div className="flex items-center gap-1 bg-white/4 rounded px-1.5 py-0.5 ml-1">
          <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="p-0.5 text-white/18 hover:text-white/35"><S d={I.zoO} sz={10} /></button>
          <span className="text-[8px] text-white/22 w-6 text-center tabular-nums">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(400, z + 25))} className="p-0.5 text-white/18 hover:text-white/35"><S d={I.zoI} sz={10} /></button>
        </div>
      </div>

      {/* Timeline body */}
      <div className="flex-1 flex min-h-0">
        {/* Track labels */}
        <div className="w-[164px] flex-shrink-0 border-r border-white/6 bg-[#0e0e0e] overflow-y-auto overflow-x-hidden">
          {proj.tracks.map((t) => {
            const b = badge(t.type);
            return (
              <div key={t.id} className="h-[52px] border-b border-white/[0.025] flex items-center px-2 gap-1" style={{ opacity: t.visible ? 1 : 0.25 }}>
                <button onClick={() => toggleLock(t.id)} className={`p-0.5 rounded flex-shrink-0 ${t.locked ? "text-amber-400/40" : "text-white/10 hover:text-white/25"}`}><S d={I.lockI} sz={10} /></button>
                <button onClick={() => toggleVis(t.id)} className="p-0.5 rounded text-white/12 hover:text-white/30 flex-shrink-0"><S d={t.visible ? I.eye : I.close} sz={10} /></button>
                <div className="flex items-center gap-1.5 min-w-0 ml-0.5">
                  <div className="w-[16px] h-[16px] rounded-sm flex items-center justify-center text-[7px] font-bold text-white/70 flex-shrink-0" style={{ background: b.bg }}>{b.l}</div>
                  <span className="text-[8px] text-white/30 truncate">{t.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tracks + Ruler */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Ruler */}
          <div ref={rulerRef} className="h-[22px] flex-shrink-0 border-b border-white/6 bg-[#0e0e0e] relative cursor-pointer select-none" onMouseDown={handleRulerMD}>
            <div className="h-full relative" style={{ width: totalW }}>
              {Array.from({ length: Math.ceil(proj.duration) + 1 }).map((_, i) => (
                <div key={i} className="absolute top-0 flex flex-col items-start" style={{ left: i * pps }}>
                  <span className="text-[7px] text-white/12 leading-[22px] ml-1.5 select-none tabular-nums">{i}s</span>
                </div>
              ))}
              {Array.from({ length: Math.ceil(proj.duration) * 5 }).map((_, i) => (
                <div key={`t-${i}`} className="absolute top-0 w-px h-[10px] bg-white/4" style={{ left: ((i + 1) / 5) * pps }} />
              ))}
              {/* Markers */}
              {(proj.markers || []).map((mk) => (
                <div key={mk.id} className="absolute top-0 bottom-0" style={{ left: mk.time * pps }}>
                  <div className="w-[9px] h-[9px] rounded-full mt-[6px] ml-[-4px] shadow-lg" style={{ background: mk.color }} />
                  <div className="absolute top-0 h-full w-px opacity-20" style={{ background: mk.color, left: 4.5 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Tracks area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <div className="relative" style={{ width: totalW, minWidth: "100%" }}>
              {proj.tracks.map((t) => (
                <div key={t.id} className="h-[52px] border-b border-white/[0.02] relative transition-all"
                  style={{ opacity: t.visible ? 1 : 0.2, display: t.visible ? undefined : "none" }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                  onDrop={(e) => handleDrop(e, t.id)}
                  onClick={() => setSel(null)}
                >
                  {/* Grid */}
                  {Array.from({ length: Math.ceil(proj.duration) + 1 }).map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-white/[0.015]" style={{ left: i * pps }} />
                  ))}
                  {Array.from({ length: Math.ceil(proj.duration) * 5 }).map((_, i) => (
                    <div key={`g-${i}`} className="absolute top-0 bottom-0 w-px bg-white/[0.005]" style={{ left: ((i + 1) / 5) * pps }} />
                  ))}

                  {/* Clips */}
                  {t.clips.map((clip) => {
                    const col = clipColor(clip.type);
                    const iSel = sel?.id === clip.id && sel?.trackId === t.id;
                    const lp = clip.start * pps;
                    const wp = Math.max(12, clip.duration * pps - 1);

                    return (
                      <div key={clip.id} className={`absolute top-[3px] h-[46px] rounded-[3px] border cursor-pointer overflow-hidden transition-shadow ${iSel ? "z-10" : "hover:shadow-sm"}`}
                        style={{ left: lp, width: wp, borderColor: iSel ? "rgba(34,197,94,0.6)" : col.bd, background: col.bg }}
                        onMouseDown={(e) => handleClipMD(e, clip, t.id)}
                      >
                        {clip.type === "video" && wp > 30 && <div className="absolute inset-0 rounded-[2px] overflow-hidden"><ThS dur={clip.duration} /></div>}
                        {clip.type === "audio" && wp > 20 && <div className="absolute inset-0 flex items-center justify-center px-1"><Wv w={Math.max(16, wp - 8)} h={30} c={col.bar} /></div>}
                        {clip.type === "text" && <div className="absolute inset-0 flex items-center px-2 gap-1"><span className="text-[9px] font-bold text-amber-400/50">{clip.t || "T"}</span>{wp > 55 && <span className="text-[7px] text-white/30 truncate">{clip.name}</span>}</div>}
                        {clip.type === "sticker" && <div className="absolute inset-0 flex items-center justify-center"><span className="text-base">{clip.t || "✨"}</span></div>}
                        {clip.type === "overlay" && <div className="absolute inset-0 flex items-center px-2 gap-1"><span className="text-sm">{clip.t || "🌫️"}</span>{wp > 50 && <span className="text-[7px] text-white/30 truncate">{clip.name}</span>}</div>}

                        {clip.type === "video" && wp > 55 && (
                          <div className="absolute bottom-0.5 left-1 right-1 flex items-center justify-between pointer-events-none">
                            <span className="text-[7px] text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate max-w-[60%]">{clip.name}</span>
                            <span className="text-[6px] text-white/50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tabular-nums">{clip.duration.toFixed(1)}s</span>
                          </div>
                        )}

                        {/* Trim handles + selection glow */}
                        {iSel && <>
                          <div className="absolute left-0 top-0 bottom-0 w-[5px] cursor-col-resize bg-white/20 hover:bg-white/30 rounded-l-[2px]" />
                          <div className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize bg-white/20 hover:bg-white/30 rounded-r-[2px]" />
                          <div className="absolute inset-0 rounded-[2px] ring-1 ring-emerald-500/40 pointer-events-none shadow-sm shadow-emerald-500/10" />
                        </>}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Playhead */}
              <div className="absolute top-0 bottom-0 w-px bg-red-500/50 z-20 pointer-events-none shadow-[0_0_6px_rgba(248,113,113,0.15)]" style={{ left: ct * pps }} />
              <div className="absolute -top-[4px] w-[10px] h-[10px] bg-red-500 rounded-sm rotate-45 z-20 pointer-events-none shadow-md" style={{ left: ct * pps - 5 }} />
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
  const [proj, setProj] = useState(INITIAL);
  const [ct, setCt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [vol, setVol] = useState(80);
  const [sel, setSel] = useState(null);
  const [sTab, setSTab] = useState("media");
  const [imm, setImm] = useState([]);
  const fRef = useRef(null);
  const piRef = useRef(null);

  useEffect(() => {
    if (playing) { piRef.current = setInterval(() => { setCt((t) => t >= proj.duration ? (setPlaying(false), 0) : t + 1 / 30); }, 1000 / 30); }
    return () => clearInterval(piRef.current);
  }, [playing, proj.duration]);

  const handleImp = useCallback((files) => {
    const items = Array.from(files).map((f) => ({ id: UID(), name: f.name, type: f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "audio" : "image", file: f, url: URL.createObjectURL(f), dur: 5, thumb: f.type.startsWith("video") ? "🎬" : f.type.startsWith("audio") ? "🎵" : "🖼️" }));
    setImm((prev) => [...prev, ...items]);
  }, []);

  const handleMDrag = useCallback((e, item) => { try { e.dataTransfer.setData("application/json", JSON.stringify(item)); e.dataTransfer.effectAllowed = "copy"; } catch {} }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] text-white overflow-hidden select-none">
      <TopBar proj={proj} setProj={setProj} onImp={() => fRef.current?.click()} onExp={() => alert("Export (FFmpeg backend pending)")} ct={ct} dur={proj.duration} />

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-10 flex-shrink-0 bg-[#090909] border-r border-white/6 flex flex-col py-2 items-center">
          {Object.entries(SIDEBAR_MAP).map(([id, icon]) => (
            <SideTab key={id} icon={icon} label={id} active={sTab === id} onClick={() => setSTab(id)} />
          ))}
        </div>

        <LeftPanel tab={sTab} imm={imm} onImp={handleImp} fRef={fRef} onMDrag={handleMDrag} />
        <PreviewPanel playing={playing} setPlaying={setPlaying} ct={ct} setCt={setCt} proj={proj} vol={vol} setVol={setVol} />
        <Inspector clip={sel} />
      </div>

      <Timeline proj={proj} setProj={setProj} ct={ct} setCt={setCt} zoom={zoom} setZoom={setZoom} playing={playing} setPlaying={setPlaying} sel={sel} setSel={setSel} />

      <input ref={fRef} type="file" multiple accept="video/*,audio/*,image/*" className="hidden" onChange={(e) => { if (e.target.files.length) { handleImp(e.target.files); e.target.value = ""; } }} />
    </div>
  );
}

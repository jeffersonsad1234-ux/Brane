import React, { useMemo } from "react";

export const UID = () => Math.random().toString(36).slice(2, 9);
export const FMT = (s) => {
  if (s == null || isNaN(s)) return "00:00.00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
};
export const CLAMP = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const PPS_BASE = 80;
export const TRACK_H = 38;
export const LABEL_W = 128;

export const COLORS = {
  bg: "#0a0a0a", panel: "#0d0d0d", surface: "#111111", raised: "#151515",
  border: "rgba(255,255,255,0.05)",
  text: "rgba(255,255,255,0.7)", dim: "rgba(255,255,255,0.3)", muted: "rgba(255,255,255,0.12)",
  accent: "#3b82f6", accentBg: "rgba(59,130,246,0.1)",
  track: {
    video: { bar: "#3b82f6", bg: "rgba(59,130,246,0.12)", bd: "rgba(59,130,246,0.25)" },
    audio: { bar: "#10b981", bg: "rgba(16,185,129,0.12)", bd: "rgba(16,185,129,0.25)" },
    text: { bar: "#f59e0b", bg: "rgba(245,158,11,0.1)", bd: "rgba(245,158,11,0.2)" },
    sticker: { bar: "#a855f7", bg: "rgba(168,85,247,0.1)", bd: "rgba(168,85,247,0.2)" },
    overlay: { bar: "#ec4899", bg: "rgba(236,72,153,0.1)", bd: "rgba(236,72,153,0.2)" },
  },
};

export const S = ({ d, sz = 14, style }) => (
  <svg style={{ width: sz, height: sz, flexShrink: 0, ...style }} viewBox="0 0 24 24" fill="currentColor">
    <path d={d} />
  </svg>
);

export const I = {
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  skipB: "M6 6h2v12H6zm3.5 6l8.5 6V6z",
  skipF: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  full: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z",
  snap: "M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z",
  cut: "M3 17h2v-2H3v2zm0-4h2v-2H3v2zm0-4h2V7H3v2zm4 12h2V7H7v14zm4-4h2v-2h-2v2zm0-4h2v-2h-2v2zm12-2v2h-6v-2h6z",
  del: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  dup: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z",
  undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
  redo: "M11.5 8c-4.65 0-8.58 3.03-9.97 7.22l2.37.78c1.05-3.19 4.06-5.5 7.6-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6C16.55 9.01 14.15 8 11.5 8z",
  imp: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
  exp: "M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z",
  save: "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4z",
  keyf: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z",
  zoI: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z",
  zoO: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM7 9h5v1H7V9z",
  chD: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  ck: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  textI: "M5 4v3h5.5v12h3V7H19V4z",
  efx: "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z",
  trans: "M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.73 0-3.29-.74-4.39-1.93l-1.42 1.42C8.2 19.06 10.05 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.73 0 3.29.74 4.39 1.93l1.42-1.42C15.8 4.94 13.05 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z",
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
  memory: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 8h4v8H6z",
  doc: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  settings: "M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.59 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.59l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.59L19.14,12.94z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  ai: "M21 14v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-3m9-10v10m0 0-4-4m4 4 4-4",
  board: "M3 3h18v18H3V3zm2 2v14h14V5H5z",
  waveform: "M3 12h2v6H3zm4-4h2v14H7zm4-6h2v22h-2zm4 4h2v14h-2zm4-2h2v18h-2z",
  pal: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.55-.22-1.05-.58-1.41-.36-.36-.58-.86-.58-1.41 0-1.1.9-2 2-2h2c3.31 0 6-2.69 6-6z",
  speed: "M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44z",
  grid: "M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  fit: "M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z",
  tool: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z",
};

export function Wv({ w = 60, h = 28, c = "#22c55e" }) {
  const b = useMemo(() => Array.from({ length: 36 }, () => Math.random() * 0.7 + 0.15), []);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "1px", height: h, width: w }}>
      {b.map((s, i) => (
        <div
          key={i}
          style={{
            width: Math.max(1.5, (w - 4) / 36),
            height: `${s * 100}%`,
            borderRadius: "1px",
            background: c,
            opacity: 0.4 + s * 0.6,
          }}
        />
      ))}
    </div>
  );
}

export function ThS({ dur }) {
  const n = Math.max(3, Math.floor(dur * 4));
  const pal = ["#1e3a5f", "#1e40af", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];
  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden", borderRadius: "2px" }}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "100%",
            background: `linear-gradient(135deg, ${pal[i % pal.length]} 0%, ${pal[(i + 2) % pal.length]} 100%)`,
          }}
        />
      ))}
    </div>
  );
}

export const Rng = ({ min, max, val, onChange, cls = "", step = 1 }) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={val}
    onChange={onChange}
    style={{ width: "100%", height: "3px", accentColor: "#3b82f6", background: "rgba(255,255,255,0.06)", borderRadius: "999px", appearance: "none", cursor: "pointer", ...(cls ? {} : {}) }}
    className={`${cls}`}
  />
);

export const Tp = ({ text, ch }) => (
  <div style={{ position: "relative", display: "inline-flex" }}>
    {ch}
    <div style={{
      position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
      marginBottom: 4, padding: "2px 8px", borderRadius: 4,
      background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
      fontSize: 10, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap",
      opacity: 0, pointerEvents: "none", zIndex: 50,
      transition: "opacity 0.12s",
    }} className="cs-tooltip">{text}</div>
  </div>
);

export const Bi = ({ d, onClick, sz = 14, cls = "", tip }) => {
  const b = (
    <button
      onClick={onClick}
      style={{
        padding: 4,
        borderRadius: 4,
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "rgba(255,255,255,0.25)",
        transition: "color 0.12s, background 0.12s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      className="cs-bi-btn"
    >
      <S d={d} sz={sz} />
    </button>
  );
  return tip ? <Tp text={tip} ch={b} /> : b;
};

export const SIDEBAR_MAP = Object.entries({
  media: I.srch, audio: I.music, text: I.textI, sticker: I.star,
  transitions: I.trans, effects: I.efx, luts: I.pal, color: I.adj,
  motion: I.board, ai: I.ai, assets: I.lay, templates: I.doc,
  captions: I.cap, brand: I.memory,
});

export const MEDIA_LIB = [
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

export const EFX_CATS = [
  { id: "blur", name: "Blur", i: "🌫️" }, { id: "glow", name: "Glow", i: "✨" },
  { id: "vhs", name: "VHS", i: "📼" }, { id: "shake", name: "Shake", i: "📳" },
  { id: "rgb", name: "RGB Split", i: "🌈" }, { id: "zoom", name: "Zoom", i: "🔍" },
  { id: "cine", name: "Cinematic", i: "🎬" }, { id: "noise", name: "Noise", i: "📺" },
  { id: "film", name: "Film Grain", i: "🎞️" }, { id: "dream", name: "Dream", i: "💫" },
  { id: "glitch", name: "Glitch", i: "💥" }, { id: "mirror", name: "Mirror", i: "🪞" },
  { id: "sharp", name: "Sharpen", i: "🔪" }, { id: "bw", name: "B&W", i: "⚫" },
  { id: "vintage", name: "Vintage", i: "📷" }, { id: "chroma", name: "Chroma Key", i: "🟢" },
];

export const TRANS_LIST = [
  { id: "fade", name: "Fade", d: 0.5 }, { id: "slide", name: "Slide", d: 0.4 },
  { id: "mblur", name: "Motion Blur", d: 0.5 }, { id: "spin", name: "Spin", d: 0.6 },
  { id: "zoomT", name: "Zoom", d: 0.5 }, { id: "warp", name: "Warp", d: 0.7 },
  { id: "glitch", name: "Glitch", d: 0.3 }, { id: "wipe", name: "Wipe", d: 0.5 },
  { id: "mosaic", name: "Mosaic", d: 0.5 }, { id: "flash", name: "Flash", d: 0.2 },
  { id: "cube", name: "Cube", d: 0.6 }, { id: "page", name: "Page", d: 0.6 },
];

export const LUTS = [
  { id: "l1", name: "Cinematic" }, { id: "l2", name: "Teal/Orange" }, { id: "l3", name: "Warm" },
  { id: "l4", name: "Cool" }, { id: "l5", name: "Moody" }, { id: "l6", name: "Vibrant" },
  { id: "l7", name: "B&W" }, { id: "l8", name: "Film Stock" }, { id: "l9", name: "Vintage" },
  { id: "l10", name: "Neon" }, { id: "l11", name: "Pastel" }, { id: "l12", name: "Drama" },
];

export const TEXT_STYLES = [
  { id: "tx1", name: "Título", font: "Inter", sz: 48 },
  { id: "tx2", name: "Subtítulo", font: "Inter", sz: 30 },
  { id: "tx3", name: "Legenda", font: "Inter", sz: 22 },
  { id: "tx4", name: "CTA", font: "Inter", sz: 36, w: 700 },
  { id: "tx5", name: "Intro", font: "Playfair", sz: 50 },
  { id: "tx6", name: "Créditos", font: "Inter", sz: 18 },
  { id: "tx7", name: "Título Animado", font: "Inter", sz: 44 },
  { id: "tx8", name: "Destaque", font: "Inter", sz: 28, w: 600 },
];

export const STICKER_SET = [
  { id: "st1", e: "✨" }, { id: "st2", e: "🔥" }, { id: "st3", e: "❤️" }, { id: "st4", e: "⭐" },
  { id: "st5", e: "➡️" }, { id: "st6", e: "✅" }, { id: "st7", e: "⭕" }, { id: "st8", e: "⚡" },
  { id: "st9", e: "👑" }, { id: "st10", e: "🎯" }, { id: "st11", e: "💡" }, { id: "st12", e: "🎉" },
  { id: "st13", e: "🚀" }, { id: "st14", e: "💎" }, { id: "st15", e: "🌟" }, { id: "st16", e: "💯" },
  { id: "st17", e: "🎵" }, { id: "st18", e: "🎬" }, { id: "st19", e: "📱" }, { id: "st20", e: "💰" },
];

export const AI_TOOLS = [
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
  { id: "ai15", name: "AI Shorts", desc: "Corta para Shorts", icon: "📱" },
  { id: "ai16", name: "AI Zoom", desc: "Zoom automático", icon: "🔍" },
];

export const MOTION_PRESETS = [
  { id: "mp1", name: "Pan Left" }, { id: "mp2", name: "Pan Right" },
  { id: "mp3", name: "Zoom In" }, { id: "mp4", name: "Zoom Out" },
  { id: "mp5", name: "Tilt Up" }, { id: "mp6", name: "Tilt Down" },
  { id: "mp7", name: "Track Left" }, { id: "mp8", name: "Track Right" },
];

export const BRAND_ASSETS = [
  { id: "ba1", name: "Logo Primary.png", type: "image", thumb: "🏢" },
  { id: "ba2", name: "Logo Dark.png", type: "image", thumb: "🌙" },
  { id: "ba3", name: "Colors.ase", type: "palette", thumb: "🎨" },
  { id: "ba4", name: "Font Pack.zip", type: "font", thumb: "🔤" },
  { id: "ba5", name: "Watermark.png", type: "image", thumb: "®️" },
  { id: "ba6", name: "Pattern.png", type: "image", thumb: "🔷" },
];

export const TEMPLATES = [
  { id: "tp1", name: "Intro Animada", dur: 5, thumb: "🚀" },
  { id: "tp2", name: "Produto", dur: 15, thumb: "📦" },
  { id: "tp3", name: "Tutorial", dur: 30, thumb: "📚" },
  { id: "tp4", name: "Vlog", dur: 20, thumb: "🎥" },
  { id: "tp5", name: "Review", dur: 25, thumb: "⭐" },
  { id: "tp6", name: "Unboxing", dur: 18, thumb: "📬" },
  { id: "tp7", name: "Antes/Depois", dur: 10, thumb: "🔄" },
  { id: "tp8", name: "CTA Final", dur: 8, thumb: "🎯" },
  { id: "tp9", name: "Story Promo", dur: 15, thumb: "📱" },
  { id: "tp10", name: "Intro Podcast", dur: 10, thumb: "🎙️" },
  { id: "tp11", name: "TikTok Viral", dur: 12, thumb: "🔥" },
  { id: "tp12", name: "Gamer", dur: 20, thumb: "🎮" },
];

export const EXPORT_PRESETS = [
  { id: "tiktok", name: "TikTok", res: "1080×1920", fps: 30, bitrate: 8, icon: "🎵" },
  { id: "shorts", name: "Shorts", res: "1080×1920", fps: 30, bitrate: 8, icon: "📱" },
  { id: "reels", name: "Reels", res: "1080×1920", fps: 30, bitrate: 10, icon: "📸" },
  { id: "youtube", name: "YouTube", res: "1920×1080", fps: 60, bitrate: 16, icon: "▶️" },
  { id: "facebook", name: "Facebook", res: "1920×1080", fps: 30, bitrate: 8, icon: "📘" },
  { id: "square", name: "Square", res: "1080×1080", fps: 30, bitrate: 8, icon: "⬜" },
];

export const MK = (n, s, d, type, o = {}) => ({ id: UID(), name: n, start: s, duration: d, type, ...o });

export const INITIAL = {
  name: "Projeto", duration: 20, fps: 30, width: 1920, height: 1080,
  tracks: [
    { id: "v1", name: "Vídeo 1", type: "video", visible: true, locked: false, clips: [
      MK("Intro.mp4", 0, 5, "video", { t: "🎬" }),
      MK("Produto.mov", 5, 7, "video", { t: "📦" }),
      MK("Demo.mp4", 12, 6, "video", { t: "🎥" }),
    ]},
    { id: "v2", name: "Vídeo 2", type: "video", visible: true, locked: false, clips: [] },
    { id: "a1", name: "Áudio 1", type: "audio", visible: true, locked: false, clips: [
      MK("Trilha.mp3", 0, 18, "audio", { t: "🎵" }),
    ]},
    { id: "a2", name: "Áudio 2", type: "audio", visible: true, locked: false, clips: [
      MK("Voz.mp3", 2, 9, "audio", { t: "🎙️" }),
    ]},
    { id: "t1", name: "Textos", type: "text", visible: true, locked: false, clips: [
      MK("Título", 1.5, 4, "text", { t: "T" }),
    ]},
    { id: "s1", name: "Stickers", type: "sticker", visible: true, locked: false, clips: [
      MK("✨", 4, 3, "sticker", { t: "✨" }),
    ]},
    { id: "o1", name: "Overlays", type: "overlay", visible: true, locked: false, clips: [
      MK("Blur", 7, 2.5, "overlay", { t: "🌫️" }),
    ]},
    { id: "t2", name: "Captions", type: "text", visible: true, locked: false, clips: [] },
  ],
  markers: [
    { id: "mk1", time: 5, label: "Intro End", color: "#f59e0b" },
    { id: "mk2", time: 12, label: "Demo Start", color: "#3b82f6" },
  ],
};

export function clipColor(type) {
  return COLORS.track[type] || COLORS.track.video;
}

export function badge(type) {
  return ({
    video: { bg: "#1e40af", l: "V" },
    audio: { bg: "#166534", l: "A" },
    text: { bg: "#92400e", l: "T" },
    sticker: { bg: "#6b21a8", l: "S" },
    overlay: { bg: "#831843", l: "O" },
  })[type] || { bg: "#333", l: "?" };
}

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ─── Helpers ─── */
const UID = () => Math.random().toString(36).slice(2, 9);
const CLAMP = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const FORMAT = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); const ms = Math.floor((s % 1) * 100); return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(2, "0")}`; };
const FORMAT_SHORT = (s) => { const sec = Math.floor(s % 60); const ms = Math.floor((s % 1) * 100); return `${String(sec).padStart(2, "0")}.${String(ms).padStart(2, "0")}`; };

const PPS_BASE = 90;
const TRACK_H = 56;
const LABEL_W = 160;
const SNAP_THRESHOLD = 6;

/* ─── Initial state ─── */
const makeTrack = (id, name, type) => ({ id, name, type, visible: true, locked: false, clips: [] });
const makeClip = (name, start, duration, type, opts = {}) => ({ id: UID(), name, start, duration, type, ...opts });

const INITIAL = {
  name: "Meu Projeto",
  duration: 25,
  fps: 30,
  width: 1080,
  height: 1920,
  tracks: [
    makeTrack("v1", "Vídeo 1", "video"),
    makeTrack("v2", "Vídeo 2", "video"),
    makeTrack("a1", "Áudio 1", "audio"),
    makeTrack("a2", "Áudio 2", "audio"),
    makeTrack("t1", "Textos", "text"),
    makeTrack("s1", "Stickers", "sticker"),
    makeTrack("e1", "Overlays", "effects"),
  ],
};

/* ─── Sample data ─── */
const SAMPLE_MEDIA = [
  { id: "med1", name: "Intro.mp4", type: "video", dur: 8, thumb: "🎬", w: 1080, h: 1920 },
  { id: "med2", name: "Produto.mov", type: "video", dur: 12, thumb: "📦", w: 1080, h: 1920 },
  { id: "med3", name: "Demonstração.mp4", type: "video", dur: 15, thumb: "🎥", w: 1080, h: 1920 },
  { id: "med4", name: "Trilha.mp3", type: "audio", dur: 30, thumb: "🎵" },
  { id: "med5", name: "Voiceover.mp3", type: "audio", dur: 20, thumb: "🎙️" },
  { id: "med6", name: "Logo.png", type: "image", thumb: "🖼️" },
  { id: "med7", name: "Thumbnail.jpg", type: "image", thumb: "🌄" },
  { id: "med8", name: "B-Roll.mp4", type: "video", dur: 10, thumb: "🎞️", w: 1080, h: 1920 },
  { id: "med9", name: "Overlay.mp4", type: "video", dur: 6, thumb: "✨", w: 1080, h: 1920 },
  { id: "med10", name: "Background.jpg", type: "image", thumb: "🌌" },
];

const TEXT_TEMPLATES = [
  { id: "txt1", name: "Título Principal", font: "Inter", size: 48 },
  { id: "txt2", name: "Subtítulo", font: "Inter", size: 32 },
  { id: "txt3", name: "Legenda", font: "Inter", size: 24 },
  { id: "txt4", name: "CTA Button", font: "Inter", size: 36 },
  { id: "txt5", name: "Intro Texto", font: "Playfair", size: 52 },
  { id: "txt6", name: "Créditos", font: "Inter", size: 20 },
];

const STICKER_ITEMS = [
  { id: "st1", name: "Sparkle", emoji: "✨" }, { id: "st2", name: "Fire", emoji: "🔥" }, { id: "st3", name: "Heart", emoji: "❤️" },
  { id: "st4", name: "Star", emoji: "⭐" }, { id: "st5", name: "Arrow", emoji: "➡️" }, { id: "st6", name: "Check", emoji: "✅" },
  { id: "st7", name: "Circle", emoji: "⭕" }, { id: "st8", name: "Thunder", emoji: "⚡" }, { id: "st9", name: "Crown", emoji: "👑" },
];

const EFFECTS_LIST = [
  { id: "ef1", name: "Blur", icon: "🌫️" }, { id: "ef2", name: "VHS", icon: "📼" }, { id: "ef3", name: "Cinematic", icon: "🎬" },
  { id: "ef4", name: "RGB Split", icon: "🌈" }, { id: "ef5", name: "Glitch", icon: "💥" }, { id: "ef6", name: "Zoom Blur", icon: "🔍" },
  { id: "ef7", name: "Shake", icon: "📳" }, { id: "ef8", name: "Old Film", icon: "🎞️" }, { id: "ef9", name: "Dream", icon: "💫" },
];

const TRANSITIONS_LIST = [
  { id: "tr1", name: "Crossfade", dur: 0.5 }, { id: "tr2", name: "Fade to Black", dur: 0.5 }, { id: "tr3", name: "Slide Left", dur: 0.4 },
  { id: "tr4", name: "Slide Right", dur: 0.4 }, { id: "tr5", name: "Zoom In", dur: 0.5 }, { id: "tr6", name: "Cube", dur: 0.6 },
  { id: "tr7", name: "Wipe", dur: 0.5 }, { id: "tr8", name: "Mosaic", dur: 0.5 },
];

const FILTERS_LIST = [
  { id: "fl1", name: "Vintage" }, { id: "fl2", name: "Noir" }, { id: "fl3", name: "Pastel" }, { id: "fl4", name: "HDR" },
  { id: "fl5", name: "Drama" }, { id: "fl6", name: "Fade" }, { id: "fl7", name: "Cool" }, { id: "fl8", name: "Warm" },
];

const AI_FEATURES = [
  { id: "ai1", name: "Legenda Automática", desc: "Transcrição automática com IA" },
  { id: "ai2", name: "Remover Fundo", desc: "Chroma key inteligente" },
  { id: "ai3", name: "Auto Cortes", desc: "Detecção de silêncio" },
  { id: "ai4", name: "Auto Zoom", desc: "Zoom em falantes" },
  { id: "ai5", name: "Gerar Thumbnail", desc: "Melhor frame automático" },
  { id: "ai6", name: "Estabilizar", desc: "Correção de tremor" },
  { id: "ai7", name: "Color Grade", desc: "Correção automática de cor" },
  { id: "ai8", name: "Upgrade Resolução", desc: "4K via IA" },
  { id: "ai9", name: "Slow Motion", desc: "Interpolação de frames" },
  { id: "ai10", name: "Remover Ruído", desc: "Áudio limpo por IA" },
];

/* ─── Initial timeline clips for demo ─── */
const INITIAL_CLIPS = [
  makeClip("Intro.mp4", 0, 5, "video", { thumb: "🎬" }),
  makeClip("Produto.mov", 5, 8, "video", { thumb: "📦" }),
  makeClip("Demonstração.mp4", 13, 7, "video", { thumb: "🎥" }),
  makeClip("Trilha.mp3", 0, 2, "audio", { thumb: "🎵" }),
  makeClip("Voiceover.mp3", 2, 10, "audio", { thumb: "🎙️" }),
  makeClip("Título Principal", 2, 5, "text", { thumb: "T", font: "Inter", size: 48 }),
  makeClip("Sparkle", 5, 3, "sticker", { thumb: "✨" }),
  makeClip("Blur", 8, 2, "effects", { thumb: "🌫️" }),
];
INITIAL_CLIPS.forEach((c) => { INITIAL.tracks.find((t) => t.type === c.type)?.clips.push(c); });

/* ─── Icons ─── */
const Icon = ({ path, size = 18, viewBox = "0 0 24 24", style }) => <svg style={{ width: size, height: size, flexShrink: 0, ...style }} viewBox={viewBox} fill="currentColor"><path d={path} /></svg>;

const ICONS = {
  play: "M8 5v14l11-7z", pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z", skipBack: "M6 6h2v12H6zm3.5 6l8.5 6V6z",
  skipFwd: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  fullscreen: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z",
  snapshot: "M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
  cut: "M3 17h2v-2H3v2zm0-4h2v-2H3v2zm0-4h2V7H3v2zm4 12h2V7H7v14zm4-4h2v-2h-2v2zm0-4h2v-2h-2v2zm12-2v2h-6v-2h6z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  duplicate: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
  redo: "M11.5 8c-4.65 0-8.58 3.03-9.97 7.22l2.37.78c1.05-3.19 4.06-5.5 7.6-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6C16.55 9.01 14.15 8 11.5 8z",
  importIcon: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
  exportIcon: "M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z",
  save: "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm2-10H5V5h9v4z",
  speed: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  animation: "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z",
  keyframe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z",
  zoomIn: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM9 7h1v2h2v1h-2v2H9v-2H7V9h2V7z",
  zoomOut: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7V9z",
  chevronDown: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  chromaKey: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  snap: "M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  text: "M5 4v3h5.5v12h3V7H19V4z",
  effects: "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z",
  transitions: "M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.73 0-3.29-.74-4.39-1.93l-1.42 1.42C8.2 19.06 10.05 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.73 0 3.29.74 4.39 1.93l1.42-1.42C15.8 4.94 13.95 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z",
  filter: "M3 17c0 .55.45 1 1 1h5v-2H4c-.55 0-1 .45-1 1zM3 7c0 .55.45 1 1 1h3V6H4c-.55 0-1 .45-1 1zm5 6c0 .55.45 1 1 1h11c.55 0 1-.45 1-1s-.45-1-1-1H9c-.55 0-1 .45-1 1zM3 12c0 .55.45 1 1 1h2v-2H4c-.55 0-1 .45-1 1zm15-7h-2v2h2V5zm-6 0h-2v6h2V5zm6 4h-2v2h2V9zm-2-4h-2v2h2V5zm-6 4h-2v6h2V9z",
  adjust: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  lock: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  settings: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  logo: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  folder: "M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10H6v-2h8v2zm4-4H6v-2h12v2z",
  fav: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
};

/* ─── Waveform visualization ─── */
function Waveform({ width = 80, height = 36, color = "#22c55e" }) {
  const bars = 32;
  const segments = useMemo(() => {
    return Array.from({ length: bars }, () => Math.random() * 0.7 + 0.15);
  }, []);
  const barW = Math.max(2, (width - 4) / bars);
  return (
    <div className="flex items-end gap-px" style={{ height, width, flexShrink: 0 }}>
      {segments.slice(0, Math.floor(width / (barW + 1))).map((s, i) => (
        <div key={i} style={{ width: barW, height: `${s * 100}%`, borderRadius: "1px", background: color, opacity: 0.6 + s * 0.4 }} />
      ))}
    </div>
  );
}

/* ─── Thumbnail strip on video clip ─── */
function ThumbnailStrip({ duration, colors }) {
  const count = Math.max(4, Math.floor(duration * 4));
  const c = colors || ["#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];
  return (
    <div className="flex h-full w-full overflow-hidden rounded">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-full" style={{ background: c[i % c.length] }} />
      ))}
    </div>
  );
}

/* ─── Subcomponents ─── */

function TopBar({ project, setProject, onImport, onExport, currentTime, duration }) {
  const [nameOpen, setNameOpen] = useState(false);
  const projectNameRef = useRef(null);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(project.name);

  useEffect(() => {
    if (editingName && projectNameRef.current) projectNameRef.current.focus();
  }, [editingName]);

  const handleNameSubmit = () => {
    if (nameVal.trim()) setProject((p) => ({ ...p, name: nameVal.trim() }));
    setEditingName(false);
  };

  return (
    <div className="h-12 flex-shrink-0 bg-[#0c0c0c] border-b border-white/[0.06] flex items-center px-4 gap-2 z-30 relative">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Icon path={ICONS.logo} size={14} />
        </div>
        <span className="text-sm font-semibold text-white/80 tracking-tight">BRANPY</span>
      </div>

      <div className="w-px h-6 bg-white/[0.06]" />

      {/* Project name */}
      <div className="relative">
        {editingName ? (
          <input ref={projectNameRef} value={nameVal} onChange={(e) => setNameVal(e.target.value)} onBlur={handleNameSubmit} onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()} className="bg-white/8 border border-white/20 rounded px-2 py-0.5 text-xs text-white/70 outline-none w-36" />
        ) : (
          <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/[0.04] text-xs text-white/50 hover:text-white/70">
            <Icon path={ICONS.folder} size={14} />
            <span className="truncate max-w-[120px]">{project.name}</span>
            <Icon path={ICONS.chevronDown} size={14} />
          </button>
        )}
      </div>

      <div className="w-px h-6 bg-white/[0.06]" />

      {/* Undo / Redo */}
      <button className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white/60"><Icon path={ICONS.undo} size={16} /></button>
      <button className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white/60"><Icon path={ICONS.redo} size={16} /></button>
      <button className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white/60"><Icon path={ICONS.save} size={16} /></button>

      <div className="flex-1" />

      {/* Timeline info */}
      <div className="text-[10px] text-white/20 font-mono mr-2">{FORMAT(currentTime)} / {FORMAT(duration)}</div>

      {/* Import / Export */}
      <button onClick={onImport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 text-[11px] transition-all">
        <Icon path={ICONS.importIcon} size={15} /> Importar
      </button>
      <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-[11px] transition-all shadow-sm shadow-emerald-500/20">
        <Icon path={ICONS.exportIcon} size={15} /> Exportar
      </button>

      {/* Format selector */}
      <div className="ml-1 flex items-center gap-1 text-[10px] text-white/30 bg-white/5 rounded-lg px-2 py-1">
        <span>1080×1920</span>
        <span className="text-white/20">|</span>
        <span>30fps</span>
        <Icon path={ICONS.chevronDown} size={12} />
      </div>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white ml-1 shadow-sm cursor-pointer">J</div>
    </div>
  );
}

function SidebarTab({ id, icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full h-10 flex items-center justify-center relative ${active ? "text-emerald-400" : "text-white/25 hover:text-white/50"} transition-colors`} title={label}>
      <Icon path={icon} size={18} />
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-emerald-500" />}
    </button>
  );
}

function LeftPanel({ tab, importedFiles, onFileImport, fileInputRef, onMediaDrag }) {
  const [subtab, setSubtab] = useState("library");
  const [viewMode, setViewMode] = useState("grid"); // grid | list

  const renderContent = () => {
    switch (tab) {
      case "media": return <MediaPanel importedFiles={importedFiles} onFileImport={onFileImport} fileInputRef={fileInputRef} onMediaDrag={onMediaDrag} viewMode={viewMode} setViewMode={setViewMode} subtab={subtab} setSubtab={setSubtab} />;
      case "audio": return <AudioPanel />;
      case "text": return <TextPanel />;
      case "sticker": return <StickerPanel />;
      case "effects": return <EfxPanel />;
      case "transitions": return <TransitionsPanel />;
      case "filters": return <FiltersPanel />;
      case "adjust": return <AdjustPanel />;
      default: return null;
    }
  };

  return (
    <div className="w-60 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] flex flex-col min-h-0">
      {/* Panel header */}
      <div className="h-10 flex-shrink-0 flex items-center px-3 border-b border-white/[0.06] gap-2">
        <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest">
          {tab === "media" ? "Mídia" : tab === "audio" ? "Áudio" : tab === "text" ? "Texto" : tab === "sticker" ? "Stickers" : tab === "effects" ? "Efeitos" : tab === "transitions" ? "Transições" : tab === "filters" ? "Filtros" : tab === "adjust" ? "Ajuste" : ""}
        </span>
        {tab === "media" && (
          <div className="flex ml-auto gap-1">
            <button onClick={() => setViewMode("grid")} className={`p-1 rounded ${viewMode === "grid" ? "text-white/50 bg-white/10" : "text-white/20 hover:text-white/40"}`}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zM13 3h8v8h-8V3zm0 10h8v8h-8v-8z" /></svg>
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1 rounded ${viewMode === "list" ? "text-white/50 bg-white/10" : "text-white/20 hover:text-white/40"}`}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" /></svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {renderContent()}
      </div>
    </div>
  );
}

function MediaPanel({ importedFiles, onFileImport, fileInputRef, onMediaDrag, viewMode, subtab, setSubtab }) {
  const allMedia = [...SAMPLE_MEDIA, ...importedFiles];
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) onFileImport(e.dataTransfer.files);
  }, [onFileImport]);

  return (
    <div>
      {/* Drop area */}
      <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} className="mx-2 mt-2 mb-2 border-[1.5px] border-dashed border-white/[0.08] rounded-lg p-2.5 text-center hover:border-emerald-500/25 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="text-[9px] text-white/20">Arraste ou clique para importar</div>
      </div>

      {/* Tabs */}
      <div className="flex px-2 gap-0.5 mb-1">
        {["library", "favs", "projetos"].map((s) => (
          <button key={s} onClick={() => setSubtab(s)} className={`flex-1 text-[9px] py-1.5 rounded ${subtab === s ? "bg-white/10 text-white/50" : "text-white/20 hover:text-white/40"}`}>
            {s === "library" ? "Biblioteca" : s === "favs" ? "Favoritos" : "Projetos"}
          </button>
        ))}
      </div>

      {/* Grid / List */}
      <div className={viewMode === "grid" ? "grid grid-cols-2 gap-1 px-2 pb-3" : "flex flex-col gap-px px-1 pb-3"}>
        {allMedia.map((item) => (
          <div key={item.id} draggable onDragStart={(e) => onMediaDrag(e, item)} className={`${viewMode === "grid" ? "flex flex-col items-center p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] cursor-grab active:cursor-grabbing" : "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.04] cursor-grab active:cursor-grabbing"}`}>
            <div className={`${viewMode === "grid" ? "w-full aspect-video rounded-md flex items-center justify-center bg-black/30 text-2xl mb-1" : "w-8 h-8 rounded flex items-center justify-center bg-black/30 text-sm flex-shrink-0"}`}>
              <span>{item.thumb}</span>
            </div>
            <div className={`${viewMode === "grid" ? "text-center" : "flex-1 min-w-0"}`}>
              <div className="text-[10px] text-white/50 truncate">{item.name}</div>
              <div className="text-[8px] text-white/20">{item.dur ? `${item.dur}s` : item.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AudioPanel() {
  return (
    <div className="grid grid-cols-2 gap-1 px-2 pb-3">
      {SAMPLE_MEDIA.filter((m) => m.type === "audio").concat([
        { id: "au3", name: "Efeito Sonoro.mp3", type: "audio", dur: 3, thumb: "🔔" },
        { id: "au4", name: "Transição.wav", type: "audio", dur: 1.5, thumb: "🔊" },
        { id: "au5", name: "Ambiente.mp3", type: "audio", dur: 60, thumb: "🌿" },
        { id: "au6", name: "Bass Drop.mp3", type: "audio", dur: 4, thumb: "🎸" },
      ]).map((item) => (
        <div key={item.id} draggable className="flex flex-col items-center p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] cursor-grab active:cursor-grabbing">
          <div className="w-full aspect-video rounded-md flex items-center justify-center bg-black/30 text-2xl mb-1">{item.thumb}</div>
          <div className="text-center">
            <div className="text-[10px] text-white/50 truncate">{item.name}</div>
            <div className="text-[8px] text-white/20">{item.dur}s</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TextPanel() {
  return (
    <div className="space-y-px px-2 pb-3">
      {TEXT_TEMPLATES.map((t) => (
        <div key={t.id} draggable className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] cursor-grab active:cursor-grabbing">
          <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-sm font-bold text-white/40">{t.name[0]}</div>
          <div>
            <div className="text-[11px] text-white/50">{t.name}</div>
            <div className="text-[8px] text-white/20">{t.font} · {t.size}px</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StickerPanel() {
  return (
    <div className="grid grid-cols-3 gap-1 px-2 pb-3">
      {STICKER_ITEMS.map((s) => (
        <div key={s.id} draggable className="aspect-square rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-2xl hover:bg-white/[0.06] cursor-grab active:cursor-grabbing">{s.emoji}</div>
      ))}
    </div>
  );
}

function EfxPanel() {
  return (
    <div className="grid grid-cols-2 gap-1 px-2 pb-3">
      {EFFECTS_LIST.map((ef) => (
        <div key={ef.id} draggable className="flex flex-col items-center p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] cursor-grab active:cursor-grabbing">
          <div className="w-full aspect-video rounded-md flex items-center justify-center bg-black/30 text-xl mb-1">{ef.icon}</div>
          <div className="text-[10px] text-white/50 truncate">{ef.name}</div>
        </div>
      ))}
    </div>
  );
}

function TransitionsPanel() {
  return (
    <div className="grid grid-cols-2 gap-1 px-2 pb-3">
      {TRANSITIONS_LIST.map((tr) => (
        <div key={tr.id} draggable className="flex flex-col items-center p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer">
          <div className="w-full aspect-video rounded-md flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10 text-lg mb-1">
            <svg className="w-5 h-5 text-white/30" viewBox="0 0 24 24" fill="currentColor"><path d={ICONS.transitions} /></svg>
          </div>
          <div className="text-[10px] text-white/50">{tr.name}</div>
          <div className="text-[8px] text-white/20">{tr.dur}s</div>
        </div>
      ))}
    </div>
  );
}

function FiltersPanel() {
  const [selected, setSelected] = useState(null);
  return (
    <div className="grid grid-cols-2 gap-1 px-2 pb-3">
      {FILTERS_LIST.map((fl) => (
        <div key={fl.id} onClick={() => setSelected(fl.id)} className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer ${selected === fl.id ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"}`}>
          <div className={`w-full aspect-video rounded-md flex items-center justify-center text-xs mb-1 ${selected === fl.id ? "bg-emerald-500/20 text-emerald-400" : "bg-black/30 text-white/30"}`}>
            {selected === fl.id ? "✓" : fl.name[0]}
          </div>
          <div className="text-[10px] text-white/50">{fl.name}</div>
        </div>
      ))}
    </div>
  );
}

function AdjustPanel() {
  const [values, setValues] = useState({ bright: 0, contrast: 0, saturation: 0, highlights: 0, shadows: 0, temp: 0, tint: 0, vignette: 0, sharpen: 0 });
  const sliders = [
    { key: "bright", label: "Brilho", min: -100, max: 100 },
    { key: "contrast", label: "Contraste", min: -100, max: 100 },
    { key: "saturation", label: "Saturação", min: -100, max: 100 },
    { key: "highlights", label: "Luzes", min: -100, max: 100 },
    { key: "shadows", label: "Sombras", min: -100, max: 100 },
    { key: "temp", label: "Temperatura", min: -100, max: 100 },
    { key: "tint", label: "Matiz", min: -100, max: 100 },
    { key: "vignette", label: "Vinheta", min: 0, max: 100 },
    { key: "sharpen", label: "Nitidez", min: 0, max: 100 },
  ];

  return (
    <div className="px-3 pb-3 space-y-2">
      {sliders.map((s) => (
        <div key={s.key}>
          <div className="flex justify-between text-[10px] text-white/30 mb-1">
            <span>{s.label}</span>
            <span className="text-white/20">{values[s.key] > 0 ? "+" : ""}{values[s.key]}</span>
          </div>
          <input type="range" min={s.min} max={s.max} value={values[s.key]} onChange={(e) => setValues((v) => ({ ...v, [s.key]: parseInt(e.target.value) }))} className="w-full h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
        </div>
      ))}
      <button className="w-full text-[10px] py-1.5 rounded bg-white/5 text-white/30 hover:bg-white/10 mt-2">Resetar</button>
    </div>
  );
}

function PreviewPanel({ playing, setPlaying, currentTime, setCurrentTime, project, volume, setVolume }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);
  const containerRef = useRef(null);

  const toggleFs = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
    setFullscreen(!fullscreen);
  }, [fullscreen]);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-h-0 bg-[#070707]">
      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Canvas */}
        <div className="rounded-lg overflow-hidden shadow-2xl border border-white/[0.06] relative" style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: "center center" }}>
          <div className="bg-black" style={{ width: project.width * 0.3, height: project.height * 0.3, maxWidth: 420, maxHeight: 700, minWidth: 280, minHeight: 460, background: "linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)" }}>
            {/* Simulated video content */}
            {playing || currentTime > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Background gradient based on time */}
                <div className="absolute inset-0" style={{
                  background: `linear-gradient(135deg,
                    hsl(${(currentTime * 30) % 360}, 40%, 8%),
                    hsl(${(currentTime * 30 + 60) % 360}, 30%, 12%),
                    hsl(${(currentTime * 30 + 120) % 360}, 40%, 8%)
                  )`,
                  transition: "background 0.3s ease",
                }} />
                {/* Scene elements based on time */}
                <div className="relative z-10 text-center px-4">
                  <div className="text-3xl mb-2 opacity-20">🎬</div>
                  <div className="text-[10px] text-white/10 font-mono">{project.width}×{project.height}</div>
                  <div className="text-[10px] text-white/10 font-mono mt-1">{FORMAT(currentTime)}</div>
                  {/* Progress bar */}
                  <div className="mt-4 w-48 h-0.5 bg-white/5 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-emerald-500/40 rounded-full transition-all duration-300" style={{ width: `${(currentTime / (project.duration || 1)) * 100}%` }} />
                  </div>
                  {/* Clip label */}
                  <div className="mt-4 text-[9px] text-white/15">
                    {currentTime < 5 ? "Intro" : currentTime < 13 ? "Produto" : "Demonstração"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center mx-auto mb-3 cursor-pointer hover:border-white/20 transition-colors" onClick={() => setPlaying(true)}>
                    <Icon path={ICONS.play} size={22} style={{ color: "rgba(255,255,255,0.4)", marginLeft: 2 }} />
                  </div>
                  <div className="text-[10px] text-white/15">Clique para preview</div>
                  <div className="text-[8px] text-white/8 mt-1">{project.width}×{project.height} · {project.fps}fps</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute right-4 bottom-4 flex items-center gap-1 bg-[#0c0c0c]/80 border border-white/[0.06] rounded-lg px-2 py-1">
          <button onClick={() => setPreviewZoom((z) => Math.max(25, z - 25))} className="p-0.5 text-white/20 hover:text-white/50"><Icon path={ICONS.zoomOut} size={14} /></button>
          <span className="text-[9px] text-white/30 w-8 text-center">{previewZoom}%</span>
          <button onClick={() => setPreviewZoom((z) => Math.min(200, z + 25))} className="p-0.5 text-white/20 hover:text-white/50"><Icon path={ICONS.zoomIn} size={14} /></button>
          <div className="w-px h-3 bg-white/[0.06] mx-1" />
          <button onClick={toggleFs} className="p-0.5 text-white/20 hover:text-white/50"><Icon path={ICONS.fullscreen} size={14} /></button>
        </div>
      </div>

      {/* Playback controls */}
      <div className="h-11 flex-shrink-0 bg-[#0c0c0c] border-t border-white/[0.06] flex items-center px-4 gap-2">
        <div className="flex items-center gap-0.5">
          <button onClick={() => setCurrentTime(0)} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60"><Icon path={ICONS.skipBack} size={16} /></button>
          <button onClick={() => setPlaying(!playing)} className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white/90">
            <Icon path={playing ? ICONS.pause : ICONS.play} size={20} />
          </button>
          <button className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60"><Icon path={ICONS.skipFwd} size={16} /></button>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-mono w-14 text-right">{FORMAT(currentTime)}</span>
          <input type="range" min={0} max={project.duration} step={0.04} value={currentTime} onChange={(e) => setCurrentTime(parseFloat(e.target.value))} className="flex-1 h-1 accent-emerald-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #22c55e ${(currentTime / (project.duration || 1)) * 100}%, rgba(255,255,255,0.06) ${(currentTime / (project.duration || 1)) * 100}%)` }} />
          <span className="text-[10px] text-white/20 font-mono w-14">{FORMAT(project.duration)}</span>
        </div>

        <button className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60"><Icon path={ICONS.snapshot} size={16} /></button>

        <div className="flex items-center gap-1 ml-1">
          <Icon path={ICONS.music} size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
          <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="w-16 h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
        </div>
      </div>
    </div>
  );
}

function RightPanel({ selectedClip }) {
  const [propTab, setPropTab] = useState("video");
  const clip = selectedClip;

  const tabs = [
    { id: "video", label: "Vídeo" }, { id: "audio", label: "Áudio" },
    { id: "speed", label: "Veloc." }, { id: "anim", label: "Animação" },
    { id: "adjust", label: "Ajuste" }, { id: "ai", label: "IA" },
  ];

  const propControls = [
    { label: "Posição X", value: "0.0" }, { label: "Posição Y", value: "0.0" },
    { label: "Escala", value: "100%", type: "range", min: 1, max: 500 },
    { label: "Rotação", value: "0°", type: "range", min: -180, max: 180 },
    { label: "Opacidade", value: "100%", type: "range", min: 0, max: 100 },
    { label: "Blend", value: "Normal", isSelect: true, options: ["Normal", "Multiply", "Screen", "Overlay", "Add", "Subtract"] },
    { label: "Âncora X", value: "0.5" }, { label: "Âncora Y", value: "0.5" },
  ];

  return (
    <div className="w-64 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] flex flex-col min-h-0">
      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-white/[0.06] overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setPropTab(t.id)} className={`flex-1 text-[10px] py-2.5 whitespace-nowrap relative ${propTab === t.id ? "text-white/70" : "text-white/20 hover:text-white/40"}`}>
            {t.label}
            {propTab === t.id && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-t bg-emerald-500" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {clip ? (
          <div className="p-3 space-y-3">
            {/* Clip info */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-lg">{clip.thumb || "🎬"}</div>
              <div>
                <div className="text-[11px] text-white/60 font-medium">{clip.name}</div>
                <div className="text-[9px] text-white/20">{FORMAT(clip.start)} → {FORMAT(clip.start + clip.duration)}</div>
              </div>
            </div>

            {propTab === "video" && (
              propControls.map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between text-[10px] text-white/30 mb-1">
                    <span>{c.label}</span>
                    {c.isSelect ? null : <span className="text-white/20">{c.value}</span>}
                  </div>
                  {c.isSelect ? (
                    <select className="w-full bg-white/5 border border-white/10 rounded text-[10px] text-white/50 px-2 py-1 outline-none focus:border-white/20">
                      {c.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type="range" min={c.min || -1000} max={c.max || 1000} defaultValue={parseFloat(c.value) || 0} className="w-full h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
                  )}
                </div>
              ))
            )}

            {propTab === "audio" && (
              <>
                {[{ label: "Volume", min: 0, max: 200, val: 100 }, { label: "Fade In", min: 0, max: 5, val: 0 }, { label: "Fade Out", min: 0, max: 5, val: 0 }].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-[10px] text-white/30 mb-1"><span>{s.label}</span><span className="text-white/20">{s.val}</span></div>
                    <input type="range" min={s.min} max={s.max} defaultValue={s.val} className="w-full h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
                  </div>
                ))}
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="text-[10px] text-white/20 mb-1">Equalizador</div>
                  {[60, 200, 500, 2000, 8000, 16000].map((hz) => (
                    <div key={hz} className="flex items-center gap-2 text-[9px] text-white/20 mb-1"><span className="w-10">{hz}Hz</span><input type="range" min={-12} max={12} defaultValue={0} className="flex-1 h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" /></div>
                  ))}
                </div>
                <button className="w-full text-[10px] py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 mt-1">Remover Ruído</button>
              </>
            )}

            {propTab === "speed" && (
              <>
                <div className="flex justify-between text-[10px] text-white/30 mb-1"><span>Velocidade</span><span className="text-white/20">1.0x</span></div>
                <input type="range" min={0.1} max={8} step={0.1} defaultValue={1} className="w-full h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {["0.5x", "1x", "2x", "4x", "8x", "0.25x", "1.5x", "3x"].map((s) => (
                    <button key={s} className={`text-[10px] py-1 rounded ${s === "1x" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30 hover:bg-white/10"}`}>{s}</button>
                  ))}
                </div>
                <div className="pt-2 space-y-2">
                  <button className="w-full text-[10px] py-1.5 rounded bg-white/5 text-white/30 hover:bg-white/10">Reverter</button>
                  <button className="w-full text-[10px] py-1.5 rounded bg-white/5 text-white/30 hover:bg-white/10">Congelar Frame</button>
                </div>
              </>
            )}

            {propTab === "anim" && (
              <>
                <div className="text-[10px] text-white/20 mb-2">Entrada</div>
                <div className="grid grid-cols-3 gap-1 mb-3">
                  {["Fade", "Slide Up", "Slide Left", "Scale", "Rotate", "Bounce"].map((a) => (
                    <button key={a} className="text-[9px] py-2 rounded bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50">{a}</button>
                  ))}
                </div>
                <div className="text-[10px] text-white/20 mb-2">Saída</div>
                <div className="grid grid-cols-3 gap-1 mb-3">
                  {["Fade", "Slide Down", "Slide Right", "Scale", "Rotate", "Zoom"].map((a) => (
                    <button key={a} className="text-[9px] py-2 rounded bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50">{a}</button>
                  ))}
                </div>
                <div className="text-[10px] text-white/20 mb-2">Duração Animação</div>
                <input type="range" min={0.1} max={2} step={0.1} defaultValue={0.5} className="w-full h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
              </>
            )}

            {propTab === "adjust" && (
              <>
                {[{ label: "Brilho", min: -100, max: 100 }, { label: "Contraste", min: -100, max: 100 }, { label: "Saturação", min: -100, max: 100 }, { label: "Realce", min: -100, max: 100 }, { label: "Sombras", min: -100, max: 100 }].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-[10px] text-white/30 mb-1"><span>{s.label}</span><span className="text-white/20">0</span></div>
                    <input type="range" min={s.min} max={s.max} defaultValue={0} className="w-full h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
                  </div>
                ))}
                {/* Chroma Key */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-[10px] text-white/30 mb-2">
                    <Icon path={ICONS.chromaKey} size={14} /> Chroma Key
                  </div>
                  <div className="grid grid-cols-2 gap-1 mb-1">
                    {["Green", "Blue", "Red", "Custom"].map((c) => (
                      <button key={c} className="text-[9px] py-1 rounded bg-white/5 text-white/30 hover:bg-white/10">{c}</button>
                    ))}
                  </div>
                  <input type="range" min={0} max={100} defaultValue={50} className="w-full h-0.5 accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
                  <div className="text-[8px] text-white/20 mt-0.5">Tolerância</div>
                </div>
              </>
            )}

            {propTab === "ai" && (
              <div className="space-y-1">
                {AI_FEATURES.map((ai) => (
                  <button key={ai.id} className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] text-xs">
                    <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[10px] font-bold">AI</div>
                    <div>
                      <div className="text-[10px] text-white/50">{ai.name}</div>
                      <div className="text-[8px] text-white/20">{ai.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2">
              <Icon path={ICONS.layers} size={16} style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            <div className="text-[10px] text-white/20">Selecione um clipe na timeline</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Timeline({ project, setProject, currentTime, setCurrentTime, zoom, setZoom, playing, setPlaying, selectedClip, setSelectedClip }) {
  const timelineRef = useRef(null);
  const tracksRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [trimming, setTrimming] = useState(null);
  const [snapLines, setSnapLines] = useState([]);
  const [playheadDragging, setPlayheadDragging] = useState(false);

  const pps = PPS_BASE * (zoom / 100);
  const totalW = Math.max(project.duration * pps + 200, 2000);

  const clipColor = (type) => {
    switch (type) {
      case "video": return { bg: "rgba(37,99,235,0.2)", border: "rgba(37,99,235,0.4)", accent: "#3b82f6" };
      case "audio": return { bg: "rgba(34,197,94,0.2)", border: "rgba(34,197,94,0.4)", accent: "#22c55e" };
      case "text": return { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)", accent: "#f59e0b" };
      case "sticker": return { bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.35)", accent: "#a855f7" };
      case "effects": return { bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.35)", accent: "#ec4899" };
      default: return { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", accent: "#888" };
    }
  };

  const trackColor = (type) => {
    switch (type) {
      case "video": return "#1e40af"; case "audio": return "#166534"; case "text": return "#92400e"; case "sticker": return "#6b21a8"; case "effects": return "#831843";
      default: return "#333";
    }
  };

  /* Snap logic */
  const findSnap = useCallback((newStart, clipId, trackId) => {
    const track = project.tracks.find((t) => t.id === trackId);
    if (!track) return newStart;
    const otherClips = track.clips.filter((c) => c.id !== clipId);
    let snapped = newStart;
    let minDist = SNAP_THRESHOLD / pps;

    for (const c of otherClips) {
      for (const t of [c.start, c.start + c.duration]) {
        const dist = Math.abs(newStart - t);
        if (dist < minDist) { snapped = t; minDist = dist; }
      }
      const endDist = Math.abs(newStart + (dragging?.clip?.duration || 0) - c.start);
      if (endDist < minDist) { snapped = c.start - (dragging?.clip?.duration || 0); minDist = endDist; }
    }
    // Snap to playhead
    const phDist = Math.abs(newStart - currentTime);
    if (phDist < minDist) { snapped = currentTime; minDist = phDist; }

    return Math.max(0, snapped);
  }, [project, currentTime, pps, dragging]);

  /* Clip drag */
  const handleClipMouseDown = useCallback((e, clip, trackId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftEdge = (e.clientX - rect.left) < 8;
    const isRightEdge = (rect.right - e.clientX) < 8;

    if (isLeftEdge || isRightEdge) {
      setTrimming({
        clip, trackId, side: isLeftEdge ? "left" : "right",
        startX: e.clientX, originalStart: clip.start, originalDur: clip.duration,
      });
    } else {
      setDragging({ clip, trackId, startX: e.clientX, originalStart: clip.start });
    }
    setSelectedClip({ ...clip, trackId });
  }, [setSelectedClip]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const dx = e.clientX - dragging.startX;
      const dt = dx / pps;
      const raw = dragging.originalStart + dt;
      const snapped = findSnap(raw, dragging.clip.id, dragging.trackId);
      setProject((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === dragging.trackId
            ? { ...t, clips: t.clips.map((c) => c.id === dragging.clip.id ? { ...c, start: snapped } : c) }
            : t
        ),
      }));
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, pps, findSnap, setProject]);

  /* Trim */
  useEffect(() => {
    if (!trimming) return;
    const onMove = (e) => {
      const dx = e.clientX - trimming.startX;
      const dt = dx / pps;
      if (trimming.side === "left") {
        const newStart = Math.max(0, Math.min(trimming.originalStart + dt, trimming.originalStart + trimming.originalDur - 0.5));
        const newDur = trimming.originalDur - (newStart - trimming.originalStart);
        setProject((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.id === trimming.trackId
              ? { ...t, clips: t.clips.map((c) => c.id === trimming.clip.id ? { ...c, start: newStart, duration: Math.max(0.5, newDur) } : c) }
              : t
          ),
        }));
      } else {
        const newDur = Math.max(0.5, trimming.originalDur + dt);
        setProject((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.id === trimming.trackId
              ? { ...t, clips: t.clips.map((c) => c.id === trimming.clip.id ? { ...c, duration: newDur } : c) }
              : t
          ),
        }));
      }
    };
    const onUp = () => setTrimming(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [trimming, pps, setProject]);

  /* Playhead dragging */
  const handleRulerMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPlayheadDragging(true);
    const updateTime = (cx) => {
      const x = cx - rect.left;
      const t = Math.max(0, Math.min(project.duration, x / pps));
      setCurrentTime(t);
    };
    updateTime(e.clientX);
    const onMove = (ev) => updateTime(ev.clientX);
    const onUp = () => setPlayheadDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [pps, project.duration, setCurrentTime]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === " " || e.key === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedClip && selectedClip.trackId) {
          setProject((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t) =>
              t.id === selectedClip.trackId ? { ...t, clips: t.clips.filter((c) => c.id !== selectedClip.id) } : t
            ),
          }));
          setSelectedClip(null);
        }
      }
      if (e.key === "ArrowLeft" && e.shiftKey) { e.preventDefault(); setCurrentTime((t) => Math.max(0, t - 0.5)); }
      if (e.key === "ArrowRight" && e.shiftKey) { e.preventDefault(); setCurrentTime((t) => Math.min(project.duration, t + 0.5)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedClip, setProject, setCurrentTime, setPlaying, project.duration]);

  /* Drop on track */
  const handleTrackDrop = useCallback((e, trackId) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    const item = JSON.parse(data);
    const rect = e.currentTarget.getBoundingClientRect();
    const tlRect = timelineRef.current?.getBoundingClientRect();
    const relX = e.clientX - (tlRect?.left || 0);
    const startT = Math.max(0, relX / pps);
    const dur = item.dur || 4;
    const newClip = makeClip(item.name, startT, dur, item.type, { thumb: item.thumb });
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, newClip].sort((a, b) => a.start - b.start) } : t
      ),
    }));
    setSelectedClip({ ...newClip, trackId });
  }, [pps, setProject, setSelectedClip]);

  /* Split at playhead */
  const handleSplit = useCallback(() => {
    if (!selectedClip || !selectedClip.trackId) return;
    const { trackId, id } = selectedClip;
    setProject((prev) => {
      const track = prev.tracks.find((t) => t.id === trackId);
      if (!track) return prev;
      const clip = track.clips.find((c) => c.id === id);
      if (!clip || currentTime <= clip.start || currentTime >= clip.start + clip.duration) return prev;
      const splitT = currentTime;
      const leftDur = splitT - clip.start;
      const rightDur = clip.duration - leftDur;
      if (leftDur < 0.3 || rightDur < 0.3) return prev;
      const rightClip = { ...clip, id: UID(), start: splitT, duration: rightDur };
      return {
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === trackId
            ? { ...t, clips: [...t.clips.filter((c) => c.id !== id), { ...clip, duration: leftDur }, rightClip].sort((a, b) => a.start - b.start) }
            : t
        ),
      };
    });
  }, [selectedClip, currentTime, setProject]);

  const handleDelete = useCallback(() => {
    if (!selectedClip || !selectedClip.trackId) return;
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === selectedClip.trackId ? { ...t, clips: t.clips.filter((c) => c.id !== selectedClip.id) } : t
      ),
    }));
    setSelectedClip(null);
  }, [selectedClip, setProject, setSelectedClip]);

  const handleDuplicate = useCallback(() => {
    if (!selectedClip || !selectedClip.trackId) return;
    setProject((prev) => {
      const track = prev.tracks.find((t) => t.id === selectedClip.trackId);
      if (!track) return prev;
      const clip = track.clips.find((c) => c.id === selectedClip.id);
      if (!clip) return prev;
      const dup = { ...clip, id: UID(), start: clip.start + clip.duration + 0.5 };
      return {
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === selectedClip.trackId ? { ...t, clips: [...t.clips, dup].sort((a, b) => a.start - b.start) } : t
        ),
      };
    });
  }, [selectedClip, setProject]);

  /* Toggle track visibility */
  const toggleTrackVis = useCallback((trackId) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => t.id === trackId ? { ...t, visible: !t.visible } : t),
    }));
  }, [setProject]);

  const toggleTrackLock = useCallback((trackId) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => t.id === trackId ? { ...t, locked: !t.locked } : t),
    }));
  }, [setProject]);

  return (
    <div className="h-56 flex-shrink-0 border-t border-white/[0.06] bg-[#0a0a0a] flex flex-col">
      {/* Timeline toolbar */}
      <div className="h-9 flex-shrink-0 bg-[#0c0c0c] border-b border-white/[0.06] flex items-center px-3 gap-1 overflow-x-auto scrollbar-none">
        <button onClick={handleSplit} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${selectedClip ? "hover:bg-white/10 text-white/40 hover:text-white/70" : "text-white/15"}`}>
          <Icon path={ICONS.cut} size={13} /> Dividir
        </button>
        <div className="w-px h-4 bg-white/[0.06]" />
        <button onClick={handleDelete} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${selectedClip ? "hover:bg-white/10 text-white/40 hover:text-white/70" : "text-white/15"}`}>
          <Icon path={ICONS.trash} size={13} /> Excluir
        </button>
        <button onClick={handleDuplicate} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${selectedClip ? "hover:bg-white/10 text-white/40 hover:text-white/70" : "text-white/15"}`}>
          <Icon path={ICONS.duplicate} size={13} /> Duplicar
        </button>
        <div className="w-px h-4 bg-white/[0.06]" />
        <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 text-[10px]">
          <Icon path={ICONS.speed} size={13} /> Velocidade
        </button>
        <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 text-[10px]">
          <Icon path={ICONS.chromaKey} size={13} /> Chroma
        </button>
        <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 text-[10px]">
          <Icon path={ICONS.snapshot} size={13} /> Recorte
        </button>
        <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 text-[10px]">
          <Icon path={ICONS.text} size={13} /> Legendas
        </button>
        <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 text-[10px]">
          <Icon path={ICONS.keyframe} size={13} /> Keyframe
        </button>

        <div className="flex-1" />

        {/* Snapping toggle */}
        <button className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60">
          <Icon path={ICONS.snap} size={14} />
        </button>

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded px-1.5 py-0.5">
          <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="p-0.5 text-white/20 hover:text-white/50"><Icon path={ICONS.zoomOut} size={12} /></button>
          <span className="text-[9px] text-white/30 w-7 text-center">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(400, z + 25))} className="p-0.5 text-white/20 hover:text-white/50"><Icon path={ICONS.zoomIn} size={12} /></button>
        </div>
      </div>

      {/* Timeline body */}
      <div className="flex-1 flex min-h-0">
        {/* Track labels */}
        <div className="w-40 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] overflow-y-auto overflow-x-hidden">
          {project.tracks.map((track) => (
            <div key={track.id} className="h-14 border-b border-white/[0.03] flex items-center px-2 gap-1" style={{ opacity: track.visible ? 1 : 0.35 }}>
              <button onClick={() => toggleTrackLock(track.id)} className={`p-0.5 rounded flex-shrink-0 ${track.locked ? "text-amber-400/60" : "text-white/15 hover:text-white/30"}`}>
                <Icon path={ICONS.lock} size={11} />
              </button>
              <button onClick={() => toggleTrackVis(track.id)} className="p-0.5 rounded text-white/20 hover:text-white/40 flex-shrink-0">
                <Icon path={track.visible ? ICONS.eye : ICONS.close} size={11} />
              </button>
              <div className="flex items-center gap-1 min-w-0 ml-0.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: trackColor(track.type) }} />
                <span className="text-[9px] text-white/35 truncate">{track.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tracks + Ruler */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Ruler */}
          <div className="h-6 flex-shrink-0 border-b border-white/[0.06] bg-[#0c0c0c] relative" onMouseDown={handleRulerMouseDown}>
            <div className="h-full relative" style={{ width: totalW }}>
              {Array.from({ length: Math.ceil(project.duration) + 1 }, (_, i) => (
                <div key={i} className="absolute top-0 flex flex-col items-start" style={{ left: i * pps }}>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[8px] text-white/15 leading-6 ml-1.5 select-none">{i}s</span>
                  </div>
                  {i < Math.ceil(project.duration) && (
                    <div className="absolute top-0 -left-0 w-px h-1.5 bg-white/5" />
                  )}
                </div>
              ))}
              {Array.from({ length: Math.ceil(project.duration) * 5 + 1 }, (_, i) => (
                i % 5 !== 0 ? <div key={`tick-${i}`} className="absolute top-0 w-px h-1 bg-white/[0.03]" style={{ left: (i / 5) * pps }} /> : null
              ))}
            </div>
          </div>

          {/* Tracks area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin relative" ref={tracksRef}>
            <div className="relative" style={{ width: totalW, minWidth: "100%" }}>
              {project.tracks.map((track) => {
                const tracksTotal = project.tracks.filter((t) => t.visible).length;
                return (
                  <div
                    key={track.id}
                    className="h-14 border-b border-white/[0.03] relative transition-opacity"
                    style={{ opacity: track.visible ? 1 : 0.3, display: track.visible ? undefined : "none" }}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                    onDrop={(e) => handleTrackDrop(e, track.id)}
                    onClick={() => setSelectedClip(null)}
                  >
                    {/* Grid lines */}
                    {Array.from({ length: Math.ceil(project.duration) + 1 }, (_, i) => (
                      <div key={i} className="absolute top-0 bottom-0 w-px bg-white/[0.02]" style={{ left: i * pps }} />
                    ))}
                    {Array.from({ length: Math.ceil(project.duration) * 5 }, (_, i) => (
                      <div key={`g-${i}`} className="absolute top-0 bottom-0 w-px bg-white/[0.008]" style={{ left: ((i + 1) / 5) * pps }} />
                    ))}

                    {/* Clips */}
                    {track.clips.map((clip) => {
                      const col = clipColor(clip.type);
                      const isSelected = selectedClip?.id === clip.id && selectedClip?.trackId === track.id;
                      const leftPx = clip.start * pps;
                      const wPx = clip.duration * pps - 1;

                      return (
                        <div
                          key={clip.id}
                          className={`absolute top-[3px] h-[50px] rounded-[4px] border cursor-pointer overflow-hidden transition-shadow ${
                            isSelected ? "shadow-lg shadow-emerald-500/15 z-10" : "hover:shadow-md"
                          }`}
                          style={{
                            left: leftPx,
                            width: Math.max(8, wPx),
                            borderColor: isSelected ? "rgba(34,197,94,0.6)" : col.border,
                            background: col.bg,
                          }}
                          onMouseDown={(e) => handleClipMouseDown(e, clip, track.id)}
                        >
                          {/* Clip inner */}
                          {clip.type === "video" && wPx > 30 && (
                            <div className="absolute inset-0 rounded-[3px] overflow-hidden">
                              <ThumbnailStrip duration={clip.duration} />
                            </div>
                          )}
                          {clip.type === "audio" && wPx > 20 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Waveform width={Math.max(20, wPx - 8)} height={32} color={col.accent} />
                            </div>
                          )}
                          {clip.type === "text" && (
                            <div className="absolute inset-0 flex items-center px-2">
                              <span className="text-[10px] font-bold text-amber-400/70">{clip.thumb || "T"}</span>
                              {wPx > 60 && <span className="text-[8px] text-white/40 ml-1 truncate">{clip.name}</span>}
                            </div>
                          )}
                          {clip.type === "sticker" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg">{clip.thumb || "✨"}</span>
                            </div>
                          )}
                          {clip.type === "effects" && (
                            <div className="absolute inset-0 flex items-center px-2 gap-1">
                              <span className="text-sm">{clip.thumb || "🌫️"}</span>
                              {wPx > 50 && <span className="text-[8px] text-white/40 truncate">{clip.name}</span>}
                            </div>
                          )}

                          {/* Clip label */}
                          {clip.type === "video" && wPx > 50 && (
                            <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between">
                              <span className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate">{clip.name}</span>
                              <span className="text-[7px] text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{FORMAT_SHORT(clip.duration)}</span>
                            </div>
                          )}

                          {/* Trim handles */}
                          {isSelected && (
                            <>
                              <div className="absolute left-0 top-0 bottom-0 w-[6px] cursor-col-resize bg-white/10 hover:bg-white/20 rounded-l-[3px]" />
                              <div className="absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize bg-white/10 hover:bg-white/20 rounded-r-[3px]" />
                              {/* Selection border glow */}
                              <div className="absolute inset-0 rounded-[3px] ring-1 ring-emerald-500/30 pointer-events-none" />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Playhead line */}
              <div className="absolute top-0 bottom-0 w-px bg-red-400/60 z-20 pointer-events-none shadow-[0_0_6px_rgba(248,113,113,0.15)]" style={{ left: currentTime * pps }} />
              {/* Playhead diamond */}
              <div className="absolute -top-[5px] w-3 h-3 bg-red-400 rounded-sm rotate-45 z-20 pointer-events-none shadow-md" style={{ left: currentTime * pps - 6 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Editor ─── */
export default function VideoStudioEditor() {
  const [project, setProject] = useState(INITIAL);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [volume, setVolume] = useState(80);
  const [selectedClip, setSelectedClip] = useState(null);
  const [sidebarTab, setSidebarTab] = useState("media");
  const [importedFiles, setImportedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const playInterval = useRef(null);

  /* Playback */
  useEffect(() => {
    if (playing) {
      playInterval.current = setInterval(() => {
        setCurrentTime((t) => {
          if (t >= project.duration) { setPlaying(false); return 0; }
          return t + 1 / 30;
        });
      }, 1000 / 30);
    }
    return () => clearInterval(playInterval.current);
  }, [playing, project.duration]);

  const handleFileImport = useCallback((files) => {
    const items = Array.from(files).map((f) => ({
      id: UID(), name: f.name,
      type: f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "audio" : "image",
      file: f, url: URL.createObjectURL(f), dur: 5, thumb: f.type.startsWith("video") ? "🎬" : f.type.startsWith("audio") ? "🎵" : "🖼️",
    }));
    setImportedFiles((prev) => [...prev, ...items]);
  }, []);

  const handleMediaDrag = useCallback((e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const handleImport = useCallback(() => fileInputRef.current?.click(), []);
  const handleExport = useCallback(() => {
    // Placeholder — connects to POST /api/studio/export
    alert("Export iniciado! (Backend FFmpeg em desenvolvimento)");
  }, []);

  const handleFileChange = useCallback((e) => {
    if (e.target.files.length) { handleFileImport(e.target.files); e.target.value = ""; }
  }, [handleFileImport]);

  const sidebarIconMap = {
    media: ICONS.folder, audio: ICONS.music, text: ICONS.text, sticker: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
    effects: ICONS.effects, transitions: ICONS.transitions, filters: ICONS.filter, adjust: ICONS.adjust,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] text-white overflow-hidden">
      <TopBar project={project} setProject={setProject} onImport={handleImport} onExport={handleExport} currentTime={currentTime} duration={project.duration} />

      <div className="flex-1 flex min-h-0">
        {/* Sidebar tabs */}
        <div className="w-11 flex-shrink-0 bg-[#090909] border-r border-white/[0.06] flex flex-col py-2 items-center gap-0.5 z-10">
          {Object.entries(sidebarIconMap).map(([id, icon]) => (
            <SidebarTab key={id} id={id} icon={icon} label={id.charAt(0).toUpperCase() + id.slice(1)} active={sidebarTab === id} onClick={() => setSidebarTab(id)} />
          ))}
        </div>

        {/* Left panel */}
        <LeftPanel tab={sidebarTab} importedFiles={importedFiles} onFileImport={handleFileImport} fileInputRef={fileInputRef} onMediaDrag={handleMediaDrag} />

        {/* Center */}
        <PreviewPanel playing={playing} setPlaying={setPlaying} currentTime={currentTime} setCurrentTime={setCurrentTime} project={project} volume={volume} setVolume={setVolume} />

        {/* Right panel */}
        <RightPanel selectedClip={selectedClip} />
      </div>

      {/* Timeline */}
      <Timeline project={project} setProject={setProject} currentTime={currentTime} setCurrentTime={setCurrentTime} zoom={zoom} setZoom={setZoom} playing={playing} setPlaying={setPlaying} selectedClip={selectedClip} setSelectedClip={setSelectedClip} />

      <input ref={fileInputRef} type="file" multiple accept="video/*,audio/*,image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

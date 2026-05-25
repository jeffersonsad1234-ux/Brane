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
  border: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.92)", dim: "rgba(255,255,255,0.72)", muted: "rgba(255,255,255,0.42)",
  accent: "#3b82f6", accentBg: "rgba(59,130,246,0.12)",
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
  zoI: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM7 9h5v1H7V9z",
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
  speaker: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z",
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

export function MediaThumb({ type, name, duration, size = "normal" }) {
  const isVideo = type === "video";
  const isAudio = type === "audio";
  const isImage = type === "image" || (!isVideo && !isAudio);
  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
  }, [name]);
  const hue1 = seed;
  const hue2 = (seed + 40) % 360;

  if (isVideo) {
    return (
      <div style={{
        width: "100%", height: "100%", position: "relative",
        background: `linear-gradient(135deg, hsl(${hue1}, 30%, 14%), hsl(${hue2}, 25%, 8%))`,
        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: `repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 4px)`,
        }} />
        <div style={{
          width: 18, height: 14, borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            width: 0, height: 0, borderStyle: "solid",
            borderWidth: "4px 0 4px 7px",
            borderColor: "transparent transparent transparent rgba(255,255,255,0.2)",
            marginLeft: 2,
          }} />
        </div>
        <div style={{
          position: "absolute", bottom: 2, right: 3,
          fontSize: 12, color: "rgba(255,255,255,0.55)",
          fontFamily: "monospace", fontWeight: 500,
        }}>
          {duration ? `${duration.toFixed(1)}s` : ""}
        </div>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div style={{
        width: "100%", height: "100%", position: "relative",
        background: `linear-gradient(135deg, hsl(${hue1}, 20%, 12%), hsl(${hue2}, 15%, 8%))`,
        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 1.5, height: "60%",
          position: "relative", zIndex: 1,
        }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} style={{
              width: 2.5, height: `${15 + Math.sin(i * 0.8) * 30 + Math.random() * 20}%`,
              borderRadius: "1px 1px 0 0",
              background: `rgba(16,185,129,${0.2 + Math.sin(i * 0.5) * 0.15})`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative",
      background: `linear-gradient(135deg, hsl(${hue1}, 25%, 20%), hsl(${hue2}, 20%, 12%))`,
      overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        position: "absolute", inset: "20%",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 4, transform: "rotate(10deg)",
      }} />
      <div style={{
        position: "absolute", inset: "25%",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 4, transform: "rotate(-5deg)",
      }} />
      <div style={{
        position: "absolute", bottom: 2, right: 3,
        fontSize: 10, color: "rgba(255,255,255,0.5)",
        fontFamily: "monospace",
      }}>
        {name?.split(".").pop() || ""}
      </div>
    </div>
  );
}

export function Wv({ w = 60, h = 28, c = "#10b981" }) {
  const b = useMemo(() => Array.from({ length: 36 }, (_, i) => 0.15 + Math.sin(i * 0.3) * 0.25 + Math.random() * 0.3), []);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "1px", height: h, width: w }}>
      {b.map((s, i) => (
        <div key={i} style={{
          width: Math.max(1.5, (w - 4) / 36),
          height: `${Math.max(8, s * 100)}%`,
          borderRadius: "1px 1px 0 0",
          background: c,
          opacity: 0.3 + s * 0.5,
        }} />
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
        <div key={i} style={{
          flex: 1, height: "100%",
          background: `linear-gradient(135deg, ${pal[i % pal.length]} 0%, ${pal[(i + 2) % pal.length]} 100%)`,
        }} />
      ))}
    </div>
  );
}

export const Rng = ({ min, max, val, onChange, cls = "", step = 1 }) => (
  <input type="range" min={min} max={max} step={step} value={val} onChange={onChange}
    style={{
      width: "100%", height: 3, accentColor: "#3b82f6",
      background: "rgba(255,255,255,0.06)", borderRadius: "999px",
      appearance: "none", cursor: "pointer", outline: "none",
    }}
  />
);

export const Tp = ({ text, ch }) => (
  <div style={{ position: "relative", display: "inline-flex" }}>
    {ch}
    <div style={{
      position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
      marginBottom: 4, padding: "3px 8px", borderRadius: 4,
      background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)",
      fontSize: 12, color: "rgba(255,255,255,0.72)", whiteSpace: "nowrap",
      opacity: 0, pointerEvents: "none", zIndex: 50, transition: "opacity 0.12s",
    }} className="cs-tooltip">{text}</div>
  </div>
);

export const Bi = ({ d, onClick, sz = 14, cls = "", tip }) => {
  const b = (
    <button onClick={onClick}
      style={{
        padding: 4, borderRadius: 4, background: "none", border: "none",
        cursor: "pointer", color: "rgba(255,255,255,0.55)",
        transition: "color 0.12s, background 0.12s",
        display: "flex", alignItems: "center", justifyContent: "center",
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
  motion: I.board, backgrounds: I.grid, voice: I.speaker,
  ai: I.ai, assets: I.lay, templates: I.doc,
  captions: I.cap, brand: I.memory,
});

export const MEDIA_LIB = [
  { id: "m1", name: "Intro Animada.mp4", type: "video", dur: 6 },
  { id: "m2", name: "Produto Principal.mov", type: "video", dur: 10 },
  { id: "m3", name: "Demonstração.mp4", type: "video", dur: 12 },
  { id: "m4", name: "B-Roll Estilo.mp4", type: "video", dur: 8 },
  { id: "m5", name: "Overlay Efeitos.mp4", type: "video", dur: 5 },
  { id: "m6", name: "Transição Rápida.mp4", type: "video", dur: 3 },
  { id: "m7", name: "Slow Motion.mp4", type: "video", dur: 7 },
  { id: "m8", name: "Time Lapse.mp4", type: "video", dur: 15 },
  { id: "m9", name: "Green Screen.mp4", type: "video", dur: 9 },
  { id: "m10", name: "Split Screen.mp4", type: "video", dur: 6 },
  { id: "m11", name: "Tela Verde 2.mp4", type: "video", dur: 8 },
  { id: "m12", name: "Cinematic Open.mp4", type: "video", dur: 4 },
  { id: "m13", name: "Drone Shot.mp4", type: "video", dur: 11 },
  { id: "m14", name: "Product Reveal.mp4", type: "video", dur: 5 },
  { id: "m15", name: "Depoimento.mp4", type: "video", dur: 20 },
  { id: "m16", name: "Logo Animada.mp4", type: "video", dur: 3 },
  { id: "m17", name: "Foto Produto 1.png", type: "image" },
  { id: "m18", name: "Foto Produto 2.png", type: "image" },
  { id: "m19", name: "Background Claro.jpg", type: "image" },
  { id: "m20", name: "Background Escuro.jpg", type: "image" },
  { id: "m21", name: "Marca D'Água.png", type: "image" },
  { id: "m22", name: "Thumbnail.jpg", type: "image" },
  { id: "m23", name: "Mockup 3D.png", type: "image" },
  { id: "m24", name: "Card Promocional.png", type: "image" },
  { id: "m25", name: "Banner.png", type: "image" },
  { id: "m26", name: "Trilha Principal.mp3", type: "audio", dur: 28 },
  { id: "m27", name: "Narração.mp3", type: "audio", dur: 18 },
  { id: "m28", name: "Jingle Curto.mp3", type: "audio", dur: 6 },
  { id: "m29", name: "Soundtrack.mp3", type: "audio", dur: 32 },
  { id: "m30", name: "Podcast Clip.mp3", type: "audio", dur: 45 },
];

export const AUDIO_LIB = [
  { id: "au1", name: "Eletronic Beat", cat: "music", dur: 30 },
  { id: "au2", name: "LoFi Chill", cat: "music", dur: 45 },
  { id: "au3", name: "Hip Hop Base", cat: "music", dur: 28 },
  { id: "au4", name: "Pop Upbeat", cat: "music", dur: 22 },
  { id: "au5", name: "Cinematic Orchestral", cat: "music", dur: 35 },
  { id: "au6", name: "Jazz Lounge", cat: "music", dur: 40 },
  { id: "au7", name: "Rock Energia", cat: "music", dur: 25 },
  { id: "au8", name: "Funk Brasileiro", cat: "music", dur: 20 },
  { id: "au9", name: "Piano Melody", cat: "music", dur: 38 },
  { id: "au10", name: "Trap 808", cat: "music", dur: 26 },
  { id: "au11", name: "Clique", cat: "sfx", dur: 0.3 },
  { id: "au12", name: "Impacto", cat: "sfx", dur: 1.2 },
  { id: "au13", name: "Whoosh", cat: "sfx", dur: 0.8 },
  { id: "au14", name: "Ding", cat: "sfx", dur: 0.5 },
  { id: "au15", name: "Riser", cat: "sfx", dur: 3 },
  { id: "au16", name: "Stinger", cat: "sfx", dur: 1 },
  { id: "au17", name: "Glitch Hit", cat: "sfx", dur: 0.4 },
  { id: "au18", name: "Swoosh", cat: "sfx", dur: 0.7 },
  { id: "au19", name: "Alerta", cat: "sfx", dur: 1.5 },
  { id: "au20", name: "Confirmação", cat: "sfx", dur: 0.6 },
  { id: "au21", name: "Notificação", cat: "sfx", dur: 0.4 },
  { id: "au22", name: "Explosão", cat: "sfx", dur: 2 },
  { id: "au23", name: "Natureza", cat: "ambiance", dur: 60 },
  { id: "au24", name: "Cidade Trânsito", cat: "ambiance", dur: 45 },
  { id: "au25", name: "Escritório", cat: "ambiance", dur: 40 },
  { id: "au26", name: "Chuva", cat: "ambiance", dur: 60 },
  { id: "au27", name: "Praia", cat: "ambiance", dur: 55 },
  { id: "au28", name: "Cafeteria", cat: "ambiance", dur: 38 },
  { id: "au29", name: "Narrador Masculino", cat: "voiceover", dur: 15 },
  { id: "au30", name: "Narrador Feminino", cat: "voiceover", dur: 18 },
  { id: "au31", name: "Locução Comercial", cat: "voiceover", dur: 12 },
  { id: "au32", name: "Voz WhatsApp", cat: "voiceover", dur: 8 },
];

export const EFX_CATS = [
  { id: "blur", name: "Blur", cat: "blur" },
  { id: "glow", name: "Glow", cat: "glow" },
  { id: "vhs", name: "VHS", cat: "vhs" },
  { id: "shake", name: "Shake", cat: "shake" },
  { id: "rgb", name: "RGB Split", cat: "rgb" },
  { id: "zoom", name: "Zoom Blur", cat: "zoom" },
  { id: "cine", name: "Cinematic", cat: "cine" },
  { id: "noise", name: "Noise", cat: "noise" },
  { id: "film", name: "Film Grain", cat: "film" },
  { id: "dream", name: "Dream", cat: "dream" },
  { id: "glitch", name: "Glitch", cat: "glitch" },
  { id: "mirror", name: "Mirror", cat: "mirror" },
  { id: "sharp", name: "Sharpen", cat: "sharp" },
  { id: "bw", name: "B&W", cat: "bw" },
  { id: "vintage", name: "Vintage", cat: "vintage" },
  { id: "chroma", name: "Chroma Key", cat: "chroma" },
  { id: "neon", name: "Neon", cat: "neon" },
  { id: "sketch", name: "Sketch", cat: "sketch" },
  { id: "pixelate", name: "Pixelate", cat: "pixel" },
  { id: "halftone", name: "Halftone", cat: "halftone" },
  { id: "invert", name: "Invert", cat: "invert" },
  { id: "sepia", name: "Sepia", cat: "sepia" },
  { id: "lens", name: "Lens Flare", cat: "lens" },
  { id: "bloom", name: "Bloom", cat: "bloom" },
];

export const TRANS_LIST = [
  { id: "fade", name: "Fade", d: 0.5, v: "opacity" },
  { id: "slideL", name: "Slide Left", d: 0.4, v: "slideL" },
  { id: "slideR", name: "Slide Right", d: 0.4, v: "slideR" },
  { id: "slideUp", name: "Slide Up", d: 0.4, v: "slideUp" },
  { id: "slideD", name: "Slide Down", d: 0.4, v: "slideD" },
  { id: "zoomIn", name: "Zoom In", d: 0.5, v: "zoomIn" },
  { id: "zoomOut", name: "Zoom Out", d: 0.5, v: "zoomOut" },
  { id: "wipeL", name: "Wipe Left", d: 0.5, v: "wipeL" },
  { id: "wipeR", name: "Wipe Right", d: 0.5, v: "wipeR" },
  { id: "spin", name: "Spin", d: 0.6, v: "spin" },
  { id: "mblur", name: "Motion Blur", d: 0.5, v: "mblur" },
  { id: "glitch", name: "Glitch", d: 0.3, v: "glitch" },
  { id: "warp", name: "Warp", d: 0.7, v: "warp" },
  { id: "mosaic", name: "Mosaic", d: 0.5, v: "mosaic" },
  { id: "flash", name: "Flash", d: 0.2, v: "flash" },
  { id: "cube", name: "Cube 3D", d: 0.6, v: "cube" },
  { id: "page", name: "Page Turn", d: 0.6, v: "page" },
  { id: "radial", name: "Radial", d: 0.5, v: "radial" },
  { id: "diamond", name: "Diamond", d: 0.5, v: "diamond" },
  { id: "cross", name: "Cross Zoom", d: 0.4, v: "cross" },
];

export const LUTS = [
  { id: "l1", name: "Cinematic", g: ["#1a365d", "#2d5a27", "#d4a843", "#8b4513"] },
  { id: "l2", name: "Teal/Orange", g: ["#1a4855", "#2a6f7a", "#d4813a", "#f4a460"] },
  { id: "l3", name: "Warm Sunset", g: ["#4a1a2a", "#8b3a3a", "#d4693a", "#f4c460"] },
  { id: "l4", name: "Cool Mint", g: ["#1a3a4a", "#2a6a7a", "#5aa4a4", "#c4e4d4"] },
  { id: "l5", name: "Moody", g: ["#1a1a2a", "#2a2a4a", "#4a4a6a", "#8a8aaa"] },
  { id: "l6", name: "Vibrant", g: ["#2a1a4a", "#4a2a8a", "#d43a6a", "#f4c440"] },
  { id: "l7", name: "B&W", g: ["#1a1a1a", "#4a4a4a", "#8a8a8a", "#d4d4d4"] },
  { id: "l8", name: "Film Stock", g: ["#2a3a2a", "#4a5a3a", "#8a9a7a", "#c4b48a"] },
  { id: "l9", name: "Vintage 70s", g: ["#3a2a1a", "#6a4a2a", "#b48a5a", "#d4c48a"] },
  { id: "l10", name: "Neon Cyber", g: ["#0a0a2a", "#2a0a4a", "#d43af4", "#3af4d4"] },
  { id: "l11", name: "Pastel Dream", g: ["#4a6a8a", "#8ab4c4", "#f4c4d4", "#e4f4c4"] },
  { id: "l12", name: "Drama", g: ["#1a0a0a", "#3a1a1a", "#6a3a2a", "#b48a5a"] },
  { id: "l13", name: "Tokyo Night", g: ["#0a0a2a", "#1a1a4a", "#4a3a8a", "#d43af4"] },
  { id: "l14", name: "Tropical", g: ["#1a4a2a", "#3a8a4a", "#d4c43a", "#f48a3a"] },
  { id: "l15", name: "Faded Film", g: ["#3a3a3a", "#6a6a5a", "#a4a48a", "#d4d4b4"] },
  { id: "l16", name: "Ethereal", g: ["#2a2a4a", "#4a4a8a", "#8a8ad4", "#c4c4f4"] },
];

export const TEXT_STYLES = [
  { id: "tx1", name: "Título Principal", font: "Inter", sz: 48, w: 700, align: "center", color: "#ffffff" },
  { id: "tx2", name: "Subtítulo", font: "Inter", sz: 30, w: 500, align: "center", color: "#d4d4d4" },
  { id: "tx3", name: "Legenda", font: "Inter", sz: 22, w: 400, align: "center", color: "#e4e4e4" },
  { id: "tx4", name: "CTA Button", font: "Inter", sz: 36, w: 700, align: "center", color: "#3b82f6" },
  { id: "tx5", name: "Intro Elegante", font: "Playfair Display", sz: 50, w: 600, align: "center", color: "#ffffff" },
  { id: "tx6", name: "Créditos", font: "Inter", sz: 18, w: 300, align: "center", color: "#8a8a8a" },
  { id: "tx7", name: "Título Neon", font: "Inter", sz: 44, w: 800, align: "center", color: "#f43af4" },
  { id: "tx8", name: "Destaque Amarelo", font: "Inter", sz: 28, w: 600, align: "left", color: "#f59e0b" },
  { id: "tx9", name: "Moderno Fino", font: "Inter", sz: 40, w: 200, align: "center", color: "#ffffff" },
  { id: "tx10", name: "Gradiente Azul", font: "Inter", sz: 38, w: 700, align: "center", color: "#60a5fa", gradient: true },
  { id: "tx11", name: "Mão Escrita", font: "Caveat", sz: 42, w: 400, align: "center", color: "#ffffff" },
  { id: "tx12", name: "Número Grande", font: "Inter", sz: 72, w: 900, align: "center", color: "#ffffff" },
  { id: "tx13", name: "Tag Superior", font: "Inter", sz: 16, w: 600, align: "left", color: "#8a8a8a" },
  { id: "tx14", name: "Citação", font: "Playfair Display", sz: 32, w: 400, align: "center", color: "#d4d4d4", italic: true },
];

export const STICKER_SET = [
  { id: "st1", e: "✨", cat: "effect" }, { id: "st2", e: "🔥", cat: "effect" },
  { id: "st3", e: "❤️", cat: "emoji" }, { id: "st4", e: "⭐", cat: "emoji" },
  { id: "st5", e: "➡️", cat: "arrow" }, { id: "st6", e: "✅", cat: "ui" },
  { id: "st7", e: "⭕", cat: "ui" }, { id: "st8", e: "⚡", cat: "effect" },
  { id: "st9", e: "👑", cat: "emoji" }, { id: "st10", e: "🎯", cat: "emoji" },
  { id: "st11", e: "💡", cat: "emoji" }, { id: "st12", e: "🎉", cat: "effect" },
  { id: "st13", e: "🚀", cat: "emoji" }, { id: "st14", e: "💎", cat: "emoji" },
  { id: "st15", e: "🌟", cat: "effect" }, { id: "st16", e: "💯", cat: "emoji" },
  { id: "st17", e: "🎵", cat: "media" }, { id: "st18", e: "🎬", cat: "media" },
  { id: "st19", e: "📱", cat: "device" }, { id: "st20", e: "💰", cat: "finance" },
  { id: "st21", e: "🎨", cat: "media" }, { id: "st22", e: "📸", cat: "device" },
  { id: "st23", e: "🎤", cat: "media" }, { id: "st24", e: "🔔", cat: "ui" },
  { id: "st25", e: "📌", cat: "ui" }, { id: "st26", e: "🏆", cat: "emoji" },
  { id: "st27", e: "🛒", cat: "commerce" }, { id: "st28", e: "🎁", cat: "commerce" },
  { id: "st29", e: "🔗", cat: "ui" }, { id: "st30", e: "📊", cat: "data" },
  { id: "st31", e: "🗑️", cat: "ui" }, { id: "st32", e: "✏️", cat: "ui" },
  { id: "st33", e: "📝", cat: "ui" }, { id: "st34", e: "💬", cat: "ui" },
  { id: "st35", e: "👆", cat: "arrow" }, { id: "st36", e: "👇", cat: "arrow" },
  { id: "st37", e: "👈", cat: "arrow" }, { id: "st38", e: "👉", cat: "arrow" },
  { id: "st39", e: "❌", cat: "ui" }, { id: "st40", e: "✔️", cat: "ui" },
  { id: "st41", e: "🔄", cat: "effect" }, { id: "st42", e: "🔴", cat: "ui" },
  { id: "st43", e: "🟢", cat: "ui" }, { id: "st44", e: "🟡", cat: "ui" },
  { id: "st45", e: "🌈", cat: "effect" }, { id: "st46", e: "🎮", cat: "device" },
  { id: "st47", e: "🧠", cat: "emoji" }, { id: "st48", e: "👀", cat: "emoji" },
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
  { id: "mp1", name: "Pan Left", dir: "left" },
  { id: "mp2", name: "Pan Right", dir: "right" },
  { id: "mp3", name: "Zoom In", dir: "in" },
  { id: "mp4", name: "Zoom Out", dir: "out" },
  { id: "mp5", name: "Tilt Up", dir: "up" },
  { id: "mp6", name: "Tilt Down", dir: "down" },
  { id: "mp7", name: "Slide In Left", dir: "slideL" },
  { id: "mp8", name: "Slide In Right", dir: "slideR" },
  { id: "mp9", name: "Fade In", dir: "fade" },
  { id: "mp10", name: "Bounce", dir: "bounce" },
  { id: "mp11", name: "Scale Pulse", dir: "pulse" },
  { id: "mp12", name: "Rotate In", dir: "rotate" },
  { id: "mp13", name: "Reveal Left", dir: "revealL" },
  { id: "mp14", name: "Reveal Right", dir: "revealR" },
];

export const BACKGROUNDS = [
  { id: "bg1", name: "Solid Black", type: "solid", c: "#000000" },
  { id: "bg2", name: "Solid White", type: "solid", c: "#ffffff" },
  { id: "bg3", name: "Solid Blue", type: "solid", c: "#1a365d" },
  { id: "bg4", name: "Solid Dark Gray", type: "solid", c: "#1a1a1a" },
  { id: "bg5", name: "Solid Brand Blue", type: "solid", c: "#3b82f6" },
  { id: "bg6", name: "Solid Green", type: "solid", c: "#166534" },
  { id: "bg7", name: "Gradient Sunset", type: "gradient", c: ["#f97316", "#dc2626"] },
  { id: "bg8", name: "Gradient Ocean", type: "gradient", c: ["#1e3a5f", "#3b82f6"] },
  { id: "bg9", name: "Gradient Neon", type: "gradient", c: ["#a855f7", "#3b82f6"] },
  { id: "bg10", name: "Gradient Forest", type: "gradient", c: ["#166534", "#22c55e"] },
  { id: "bg11", name: "Gradient Midnight", type: "gradient", c: ["#0f172a", "#1e293b"] },
  { id: "bg12", name: "Gradient Warm", type: "gradient", c: ["#92400e", "#f59e0b"] },
  { id: "bg13", name: "Gradient Cyber", type: "gradient", c: ["#0a0a2a", "#d43af4"] },
  { id: "bg14", name: "Gradient Pastel", type: "gradient", c: ["#fbcfe8", "#bfdbfe"] },
  { id: "bg15", name: "Pattern Dots", type: "pattern" },
  { id: "bg16", name: "Pattern Stripes", type: "pattern" },
  { id: "bg17", name: "Pattern Grid", type: "pattern" },
  { id: "bg18", name: "Pattern Hex", type: "pattern" },
  { id: "bg19", name: "Animated Particles", type: "animated" },
  { id: "bg20", name: "Animated Gradient", type: "animated" },
  { id: "bg21", name: "Animated Stars", type: "animated" },
  { id: "bg22", name: "Abstract Flow", type: "abstract" },
];

export const VOICES = [
  { id: "v1", name: "João (Masculino)", lang: "PT-BR", gender: "M", style: "natural" },
  { id: "v2", name: "Maria (Feminino)", lang: "PT-BR", gender: "F", style: "natural" },
  { id: "v3", name: "Pedro (Locução)", lang: "PT-BR", gender: "M", style: "formal" },
  { id: "v4", name: "Ana (Suave)", lang: "PT-BR", gender: "F", style: "soft" },
  { id: "v5", name: "Lucas (Jovem)", lang: "PT-BR", gender: "M", style: "casual" },
  { id: "v6", name: "Julia (Animada)", lang: "PT-BR", gender: "F", style: "excited" },
  { id: "v7", name: "James (English)", lang: "EN-US", gender: "M", style: "natural" },
  { id: "v8", name: "Emma (English)", lang: "EN-US", gender: "F", style: "natural" },
  { id: "v9", name: "Carlos (Espanhol)", lang: "ES", gender: "M", style: "natural" },
  { id: "v10", name: "Sofia (Espanhol)", lang: "ES", gender: "F", style: "natural" },
  { id: "v11", name: "Robô 1", lang: "PT-BR", gender: "M", style: "robot" },
  { id: "v12", name: "Robô 2", lang: "PT-BR", gender: "F", style: "robot" },
];

export const CAPTION_STYLES = [
  { id: "cs1", name: "Clássico", bg: "rgba(0,0,0,0.7)", color: "#ffffff", sz: 18, font: "Inter" },
  { id: "cs2", name: "Minimalista", bg: "transparent", color: "#ffffff", sz: 16, font: "Inter" },
  { id: "cs3", name: "Neon", bg: "rgba(10,10,42,0.8)", color: "#f43af4", sz: 20, font: "Inter", glow: true },
  { id: "cs4", name: "Filme", bg: "rgba(0,0,0,0.8)", color: "#f59e0b", sz: 22, font: "Playfair Display" },
  { id: "cs5", name: "Moderno", bg: "rgba(0,0,0,0.5)", color: "#3b82f6", sz: 18, font: "Inter", w: 600 },
  { id: "cs6", name: "Gradiente", bg: "linear-gradient(90deg, #3b82f6, #a855f7)", color: "#ffffff", sz: 18, font: "Inter" },
  { id: "cs7", name: "Gamer", bg: "rgba(0,0,0,0.85)", color: "#22c55e", sz: 20, font: "Inter", w: 800 },
  { id: "cs8", name: "Elegante", bg: "transparent", color: "#d4d4d4", sz: 15, font: "Inter" },
  { id: "cs9", name: "Karaokê", bg: "rgba(0,0,0,0.6)", color: "#ffffff", sz: 22, font: "Inter", highlight: true },
  { id: "cs10", name: "TikTok", bg: "rgba(0,0,0,0.7)", color: "#ffffff", sz: 24, font: "Inter", w: 700, stroke: true },
];

export const BRAND_ASSETS = [
  { id: "ba1", name: "Logo Principal.png", type: "image" },
  { id: "ba2", name: "Logo Escuro.png", type: "image" },
  { id: "ba3", name: "Logo Branco.png", type: "image" },
  { id: "ba4", name: "Paleta Cores.ase", type: "palette" },
  { id: "ba5", name: "Fontes Pack.zip", type: "font" },
  { id: "ba6", name: "Marca D'Água.png", type: "image" },
  { id: "ba7", name: "Padrão Fundo.png", type: "image" },
  { id: "ba8", name: "Ícone App.png", type: "image" },
  { id: "ba9", name: "Banner Site.png", type: "image" },
  { id: "ba10", name: "Guia Estilo.pdf", type: "document" },
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

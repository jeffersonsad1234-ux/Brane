import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { I, S, MEDIA_LIB, AUDIO_LIB, TEXT_STYLES, STICKER_SET, TRANS_LIST, EFX_CATS, LUTS, MOTION_PRESETS, BACKGROUNDS, VOICES, CAPTION_STYLES, AI_TOOLS, BRAND_ASSETS, TEMPLATES, SLIDES, Rng, FMT, MediaThumb, UID } from "./utils";

export function SideTab({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} title={label}
      style={{
        width: "100%", height: 34, display: "flex", alignItems: "center",
        justifyContent: "center", position: "relative", border: "none",
        background: "none", cursor: "pointer",
        color: active ? "rgba(59,130,246,0.8)" : "rgba(255,255,255,0.4)",
        transition: "color 0.12s",
        fontFamily: "inherit",
      }}
      className={!active ? "cs-hover-icon" : ""}
    >
      <S d={icon} sz={17} />
      {active && <div style={{
        position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
        width: 2, height: 14, borderRadius: "0 2px 2px 0",
        background: "rgba(59,130,246,0.6)",
      }} />}
    </button>
  );
}

function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{ padding: "5px 8px 3px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        background: "rgba(255,255,255,0.05)", borderRadius: 4,
        padding: "4px 8px", border: "1px solid rgba(255,255,255,0.04)",
      }}>
        <S d={I.srch} sz={10} style={{ color: "rgba(255,255,255,0.15)" }} />
        <input value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, background: "transparent", border: "none",
            outline: "none", fontSize: 12, color: "rgba(255,255,255,0.55)",
            fontFamily: "inherit",
          }}
        />
        {value && (
          <button onClick={() => onChange("")}
            style={{
              padding: 1, border: "none", cursor: "pointer",
              background: "none", color: "rgba(255,255,255,0.25)", fontSize: 11,
              fontFamily: "inherit",
            }}
          >✕</button>
        )}
      </div>
    </div>
  );
}

function CategoryBar({ cats, active, onChange }) {
  return (
    <div style={{ display: "flex", padding: "3px 8px", gap: 3, overflowX: "auto", flexShrink: 0 }}>
      {cats.map((c) => (
        <button key={c.id} onClick={() => onChange(c.id)}
          style={{
            flexShrink: 0, fontSize: 13, padding: "3px 10px", borderRadius: 4,
            border: "none", cursor: "pointer", fontFamily: "inherit",
            background: active === c.id ? "rgba(59,130,246,0.12)" : "transparent",
            color: active === c.id ? "rgba(59,130,246,0.65)" : "rgba(255,255,255,0.42)",
            fontWeight: active === c.id ? 500 : 400,
            transition: "color 0.12s, background 0.12s",
          }}
          className={active !== c.id ? "cs-hover-soft" : ""}
        >{c.label}</button>
      ))}
    </div>
  );
}

function AssetGrid({ items, onDragStart, onClickItem, renderItem, cols = "1fr 1fr" }) {
  const [hvr, setHvr] = useState(null);
  if (items.length === 0) {
    return (
      <div style={{ padding: "20px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 20, opacity: 0.06, marginBottom: 6 }}>📂</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>No items found</div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: 5, padding: "0 8px 8px" }}>
      {items.map((item) =>
        renderItem ? renderItem(item) : (
          <div key={item.id} draggable onDragStart={(e) => onDragStart?.(e, item)}
            onMouseEnter={() => setHvr(item.id)} onMouseLeave={() => setHvr(null)}
            onClick={() => onClickItem?.(item)}
            style={{
              display: "flex", flexDirection: "column", borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.04)", cursor: onClickItem ? "pointer" : "grab",
              background: "rgba(255,255,255,0.015)", overflow: "hidden",
              transition: "background 0.12s, border-color 0.12s, transform 0.12s",
              position: "relative",
            }}
            className="cs-asset-card"
          >
            <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", overflow: "hidden" }}>
              <MediaThumb type={item.type || "video"} name={item.name} duration={item.dur} />
              {onClickItem && hvr === item.id && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(59,130,246,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "opacity 0.12s",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "white",
                    background: "rgba(59,130,246,0.5)", padding: "2px 8px",
                    borderRadius: 3, letterSpacing: "0.05em",
                  }}>ADD</span>
                </div>
              )}
            </div>
            <div style={{ padding: "4px 6px" }}>
              <div style={{
                fontSize: 13, color: "rgba(255,255,255,0.68)", fontWeight: 500,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {item.name}
              </div>
              {item.dur && (
                <div style={{
                  fontSize: 11, color: "rgba(255,255,255,0.45)",
                  fontFamily: "monospace", marginTop: 1,
                }}>
                  {item.dur.toFixed?.(1) || item.dur}s
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

const MEDIA_CATS = [
  { id: "all", label: "All" }, { id: "video", label: "Videos" },
  { id: "image", label: "Images" }, { id: "audio", label: "Audio" },
];

export function MediaPanel({ imm, onImp, fRef, onMDrag, onClickItem }) {
  const [srch, setSrch] = useState("");
  const [cat, setCat] = useState("all");
  const all = useMemo(() => [...MEDIA_LIB, ...(imm || [])], [imm]);
  const filtered = useMemo(() => {
    let items = all;
    if (cat === "video") items = items.filter((m) => m.type === "video");
    else if (cat === "image") items = items.filter((m) => m.type === "image");
    else if (cat === "audio") items = items.filter((m) => m.type === "audio");
    if (srch.trim()) items = items.filter((m) => m.name.toLowerCase().includes(srch.toLowerCase()));
    return items;
  }, [all, cat, srch]);

  return (
    <>
      <SearchBar value={srch} onChange={setSrch} placeholder="Search media..." />
      <CategoryBar cats={MEDIA_CATS} active={cat} onChange={setCat} />
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) onImp(e.dataTransfer.files); }}
        onClick={() => fRef.current?.click()}
        style={{
          margin: "0 8px 6px", border: "1px dashed rgba(255,255,255,0.06)",
          borderRadius: 4, padding: "7px 8px", textAlign: "center",
          cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.5)",
          transition: "border-color 0.12s, background 0.12s",
        }}
        className="cs-dropzone"
      >
        Drop files or click to import
      </div>
      <AssetGrid items={filtered} onDragStart={(e, item) => onMDrag(e, { ...item, type: item.type || "video" })} onClickItem={onClickItem} />
    </>
  );
}

const AUDIO_CATS = [
  { id: "all", label: "All" }, { id: "music", label: "Music" },
  { id: "sfx", label: "SFX" }, { id: "ambiance", label: "Ambiance" },
  { id: "voiceover", label: "Voiceover" },
];

function AudioWave({ cat }) {
  const pal = cat === "music" ? "#10b981" : cat === "sfx" ? "#f59e0b" : cat === "voiceover" ? "#3b82f6" : "#8b5cf6";
  const bars = useMemo(() => Array.from({ length: 32 }, (_, i) => 0.15 + Math.sin(i * 0.4) * 0.35 + Math.random() * 0.3), []);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: "60%", width: "90%" }}>
      {bars.map((s, i) => (
        <div key={i} style={{
          flex: 1, height: `${Math.max(8, s * 100)}%`,
          borderRadius: "1px 1px 0 0",
          background: pal, opacity: 0.2 + s * 0.6,
        }} />
      ))}
    </div>
  );
}

function genWav(freqs, dur, sr, type, amp) {
  try {
    const len = Math.ceil(sr * dur);
    const buf = new ArrayBuffer(44 + len * 2);
    const v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); w(8, 'WAVE');
    w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, len * 2, true);
    const nFreqs = freqs.length;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let s = 0;
      for (let f = 0; f < nFreqs; f++) {
        const fi = freqs[f];
        const wf = f === 0 ? 1 : 0.5 / f;
        if (type === "saw") s += wf * 2 * ((fi * t) % 1 - 0.5);
        else if (type === "sqr") s += wf * (Math.sin(2 * Math.PI * fi * t) > 0 ? 0.5 : -0.5);
        else if (type === "noise") s += wf * (Math.random() * 2 - 1);
        else s += wf * Math.sin(2 * Math.PI * fi * t);
      }
      s = s * (amp || 0.3) * Math.max(0, 1 - t / (dur * 1.05));
      v.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, s * 32767)), true);
    }
    const blob = new Blob([buf], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch { return null; }
}

// Sound profiles: each item ID maps to a unique set of frequencies + waveform
function soundForItem(item) {
  const i = parseInt(item.id.replace(/\D/g, "")) || 1;
  const cat = item.cat || "music";
  const sr = 44100;
  if (cat === "music") {
    const baseMap = { au1:[440,660,880], au2:[392,494,587], au3:[110,220,330], au4:[523,659,784],
      au5:[220,330,440], au6:[349,440,523], au7:[165,330,495], au8:[293,440,587],
      au9:[659,523,440,659], au10:[55,110,165] };
    const freqs = baseMap[item.id] || [300 + i * 30, 400 + i * 40, 500 + i * 50];
    const wf = i % 3 === 0 ? "saw" : i % 3 === 1 ? "sine" : "sqr";
    return { url: genWav(freqs, 2.0, sr, wf, 0.28), dur: 2.0 };
  }
  if (cat === "sfx") {
    const sfxMap = {
      au11:{f:[2000],d:0.08,w:"sine",a:0.5}, au12:{f:[100],d:0.4,w:"sine",a:0.6},
      au13:{f:[200],d:0.5,w:"saw",a:0.3}, au14:{f:[3000],d:0.2,w:"sine",a:0.4},
      au15:{f:[100,200,500,1000,2000],d:1.0,w:"sine",a:0.3}, au16:{f:[500,1000],d:0.3,w:"sqr",a:0.4},
      au17:{f:[800],d:0.15,w:"sqr",a:0.5}, au18:{f:[2000],d:0.5,w:"saw",a:0.3},
      au19:{f:[600],d:0.6,w:"sine",a:0.4}, au20:{f:[880],d:0.4,w:"sine",a:0.4},
      au21:{f:[1200],d:0.5,w:"sine",a:0.4}, au22:{f:[60,80,100],d:0.6,w:"noise",a:0.5},
    };
    const p = sfxMap[item.id] || { f:[500 + i*100], d:0.3, w:"sine", a:0.4 };
    return { url: genWav(p.f, p.d, sr, p.w, p.a), dur: p.d };
  }
  if (cat === "ambiance") {
    const freqs = [100 + i * 20, 150 + i * 30, 200 + i * 40];
    return { url: genWav(freqs, 3.0, sr, "sine", 0.15), dur: 3.0 };
  }
  if (cat === "voiceover") {
    const freqs = [250 + i * 30, 350 + i * 40];
    return { url: genWav(freqs, 1.5, sr, "sine", 0.25), dur: 1.5 };
  }
  return { url: genWav([440], 1, sr, "sine", 0.3), dur: 1 };
}

export function AudioPanel({ onClickItem }) {
  const [srch, setSrch] = useState("");
  const [cat, setCat] = useState("all");
  const [playId, setPlayId] = useState(null);
  const [errorId, setErrorId] = useState(null);
  const audioRefs = useRef({});
  const filtered = useMemo(() => {
    let items = AUDIO_LIB;
    if (cat !== "all") items = items.filter((a) => a.cat === cat);
    if (srch.trim()) items = items.filter((a) => a.name.toLowerCase().includes(srch.toLowerCase()));
    return items;
  }, [cat, srch]);
  const [hvr, setHvr] = useState(null);

  const togglePlay = (item) => {
    const existing = audioRefs.current[item.id];
    if (existing && !existing.paused) {
      existing.pause();
      existing.currentTime = 0;
      setPlayId(null);
      return;
    }
    setErrorId(null);
    const s = soundForItem(item);
    if (!s.url) { setErrorId(item.id); return; }
    const audio = new Audio(s.url);
    audio.volume = 0.4;
    audio.onended = () => { setPlayId(null); URL.revokeObjectURL(s.url); };
    audio.onerror = () => { setErrorId(item.id); setPlayId(null); URL.revokeObjectURL(s.url); };
    audio.play().then(() => {
      audioRefs.current[item.id] = audio;
      setPlayId(item.id);
    }).catch(() => {
      setErrorId(item.id);
      URL.revokeObjectURL(s.url);
    });
  };

  return (
    <>
      <SearchBar value={srch} onChange={setSrch} placeholder="Search audio..." />
      <CategoryBar cats={AUDIO_CATS} active={cat} onChange={setCat} />
      <div style={{ padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        {filtered.map((item) => (
          <div key={item.id} draggable
            onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: "audio" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
            onMouseEnter={() => setHvr(item.id)} onMouseLeave={() => setHvr(null)}
            onClick={() => onClickItem?.({ ...item, type: "audio" })}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
              borderRadius: 4, cursor: onClickItem ? "pointer" : "grab",
              background: errorId === item.id ? "rgba(239,68,68,0.04)" : hvr === item.id ? "rgba(255,255,255,0.03)" : "transparent",
              border: errorId === item.id ? "1px solid rgba(239,68,68,0.12)" : "1px solid rgba(255,255,255,0.03)",
              transition: "background 0.12s",
              position: "relative",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 4,
              background: item.cat === "music" ? "rgba(16,185,129,0.08)" : item.cat === "sfx" ? "rgba(245,158,11,0.08)" : item.cat === "voiceover" ? "rgba(59,130,246,0.08)" : "rgba(139,92,246,0.08)",
              border: `1px solid ${
                item.cat === "music" ? "rgba(16,185,129,0.12)" : item.cat === "sfx" ? "rgba(245,158,11,0.12)" : item.cat === "voiceover" ? "rgba(59,130,246,0.12)" : "rgba(139,92,246,0.12)"
              }`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
              position: "relative",
            }}>
              {errorId === item.id ? (
                <span style={{ fontSize: 12, color: "rgba(239,68,68,0.5)" }}>⚠</span>
              ) : playId === item.id ? (
                <span style={{ fontSize: 14, color: "#10b981" }}>🔊</span>
              ) : (
                <AudioWave cat={item.cat} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13, color: "rgba(255,255,255,0.68)", fontWeight: 500,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {item.name}
              </div>
              <div style={{
                fontSize: 11, color: errorId === item.id ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.35)", marginTop: 1,
                textTransform: "capitalize",
              }}>
                {errorId === item.id ? "Failed to play" : `${item.cat} · ${item.dur.toFixed?.(1) || item.dur}s`}
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); togglePlay(item); }}
              style={{
                width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer",
                background: playId === item.id ? "rgba(16,185,129,0.15)" : errorId === item.id ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                color: playId === item.id ? "#10b981" : errorId === item.id ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.3)",
                fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "inherit", flexShrink: 0, transition: "all 0.12s",
              }}
              className="cs-hover-soft"
            >{playId === item.id ? "⏹" : errorId === item.id ? "↻" : "▶"}</button>
            <span style={{
              fontSize: 10, color: "rgba(255,255,255,0.25)",
              fontFamily: "monospace",
            }}>{item.dur.toFixed?.(1) || item.dur}s</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function TextPanel({ onClickItem }) {
  return (
    <div style={{ padding: "4px 8px" }}>
      {TEXT_STYLES.map((t) => (
        <div key={t.id} draggable
          onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...t, type: "text" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
          onClick={() => onClickItem?.({ ...t, type: "text" })}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
            borderRadius: 4, cursor: onClickItem ? "pointer" : "grab",
            transition: "background 0.12s",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
          }}
          className="cs-hover-soft"
        >
          <div style={{
            width: 32, height: 32, borderRadius: 4,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "rgba(245,158,11,0.5)",
            flexShrink: 0,
          }}>{t.name[0]}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 14, color: "rgba(255,255,255,0.68)", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {t.name}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
              {t.font} · {t.sz}px{t.w ? ` · ${t.w}` : ""}{t.italic ? " · Italic" : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const STICKER_CATS = [
  { id: "all", label: "All" }, { id: "emoji", label: "Emoji" },
  { id: "arrow", label: "Arrows" }, { id: "ui", label: "UI" },
  { id: "effect", label: "Effects" }, { id: "media", label: "Media" },
];

export function StickerPanel({ onClickItem }) {
  const [cat, setCat] = useState("all");
  const filtered = useMemo(() => {
    if (cat === "all") return STICKER_SET;
    return STICKER_SET.filter((s) => s.cat === cat);
  }, [cat]);
  return (
    <>
      <CategoryBar cats={STICKER_CATS} active={cat} onChange={setCat} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, padding: "8px" }}>
        {filtered.map((s) => (
          <div key={s.id} draggable
            onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...s, type: "sticker" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
            onClick={() => onClickItem?.({ ...s, type: "sticker" })}
            style={{
              aspectRatio: "1", borderRadius: 6,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, cursor: onClickItem ? "pointer" : "grab",
              transition: "all 0.12s",
            }}
            className="cs-sticker-card"
          >{s.e}</div>
        ))}
      </div>
    </>
  );
}

function TransThumb({ v }) {
  const p = v === "opacity" || v === "fade" ? 0 : v === "slideL" ? 1 : v === "slideR" ? 2 : v === "slideUp" ? 3 : v === "slideD" ? 4 : v === "zoomIn" ? 5 : v === "zoomOut" ? 6 : v === "wipeL" ? 7 : v === "wipeR" ? 8 : v?.includes("glitch") ? 9 : v === "spin" ? 10 : v === "flash" ? 11 : v === "mblur" ? 12 : v === "cube" ? 13 : v === "page" ? 14 : v === "radial" ? 15 : v === "diamond" ? 16 : v === "warp" ? 17 : v === "mosaic" ? 18 : v === "cross" ? 19 : 0;
  return (
    <div className={`tr-thumb tr-${p}`} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", borderRadius: 2 }}>
      {p === 0 && <><div className="tr-a" style={{position:"absolute",inset:0,background:"#1a1a3a"}}/><div className="tr-b" style={{position:"absolute",inset:0,background:"#3b82f6"}}/></>}
      {p >= 1 && p <= 4 && <><div className="tr-a" style={{position:"absolute",inset:0,background:"#1a1a3a"}}/><div className="tr-b" style={{position:"absolute",inset:0,background:"#3b82f6",width:"50%"}}/></>}
      {p >= 5 && p <= 6 && <><div className="tr-a" style={{position:"absolute",inset:"10%",background:"#1a1a3a"}}/><div className="tr-b" style={{position:"absolute",inset:"10%",background:"#3b82f6"}}/></>}
      {p >= 7 && p <= 8 && <><div className="tr-a" style={{position:"absolute",inset:0,background:"#1a1a3a"}}/><div className="tr-b" style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#3b82f6,#60a5fa)",width:"60%"}}/></>}
      {p === 9 && <><div className="tr-a" style={{position:"absolute",inset:0,background:"#1a1a1a"}}/><div className="tr-b" style={{position:"absolute",inset:0,background:"#ff0040",opacity:0.6}}/><div className="tr-c" style={{position:"absolute",inset:0,background:"#00ff40",opacity:0.4}}/></>}
      {p === 10 && <div style={{position:"absolute",inset:"20%",border:"2px solid #3b82f6",borderTopColor:"transparent",borderRadius:"50%"}} className="tr-spin"/>}
      {p === 11 && <><div className="tr-a" style={{position:"absolute",inset:0,background:"#1a1a3a"}}/><div className="tr-b" style={{position:"absolute",inset:0,background:"white"}}/></>}
      {p === 12 && <><div className="tr-a" style={{position:"absolute",inset:0,background:"#1a1a3a"}}/><div className="tr-b" style={{position:"absolute",inset:0,background:"rgba(59,130,246,0.3)"}}/></>}
      {p === 13 && <div style={{position:"absolute",inset:"15%",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",borderRadius:3}} className="tr-cube"/>}
      {p === 14 && <div style={{position:"absolute",inset:"10%",width:"60%",background:"rgba(255,255,255,0.08)",borderRadius:2,border:"1px solid rgba(255,255,255,0.06)"}} className="tr-page"/>}
      {p === 15 && <div style={{position:"absolute",inset:0,background:"radial-gradient(circle,#3b82f6 0%,transparent 70%)"}} className="tr-radial"/>}
      {p === 16 && <div style={{position:"absolute",inset:"25%",background:"#3b82f6",transform:"rotate(45deg)",opacity:0.4}} className="tr-diamond"/>}
      {p === 17 && <div style={{position:"absolute",inset:0,display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,padding:2}}><div style={{background:"#3b82f6"}}/><div style={{background:"#1a1a3a"}}/><div style={{background:"#1a1a3a"}}/><div style={{background:"#3b82f6"}}/></div>}
      {p === 18 && <div style={{position:"absolute",inset:0,display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,padding:3}}><div style={{background:"hsl(0,40%,20%)"}}/><div style={{background:"hsl(90,40%,20%)"}}/><div style={{background:"hsl(180,40%,20%)"}}/><div style={{background:"hsl(270,40%,20%)"}}/></div>}
      {p === 19 && <><div className="tr-a" style={{position:"absolute",inset:0,background:"#1a1a3a"}}/><div className="tr-b" style={{position:"absolute",inset:0,background:"#3b82f6"}}/></>}
    </div>
  );
}

export function TransitionsPanel({ onClickItem }) {
  return (<><style>{`
.tr-thumb{background:#0d0d1a}
.tr-a,.tr-b,.tr-c{animation-duration:2s;animation-iteration-count:infinite;animation-timing-function:ease-in-out}
.tr-0 .tr-a{animation-name:tFdA}.tr-0 .tr-b{animation-name:tFdB;background:#3b82f6}
@keyframes tFdA{0%,100%{opacity:1}50%{opacity:0.3}}
@keyframes tFdB{0%,100%{opacity:0}50%{opacity:1}}
.tr-1 .tr-b{animation-name:tSL;width:50%}.tr-2 .tr-b{animation-name:tSR;width:50%}
@keyframes tSL{0%,100%{transform:translateX(0)}50%{transform:translateX(-50%)}}
@keyframes tSR{0%,100%{transform:translateX(0)}50%{transform:translateX(50%)}}
.tr-3 .tr-b{animation-name:tSU;width:100%;height:50%}.tr-4 .tr-b{animation-name:tSD;width:100%;height:50%}
@keyframes tSU{0%,100%{transform:translateY(0)}50%{transform:translateY(-50%)}}
@keyframes tSD{0%,100%{transform:translateY(0)}50%{transform:translateY(50%)}}
.tr-5 .tr-b{animation-name:tZI}.tr-6 .tr-b{animation-name:tZO}
@keyframes tZI{0%,100%{transform:scale(1)}50%{transform:scale(0.6)}}
@keyframes tZO{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}
.tr-7 .tr-b{animation-name:tWL}.tr-8 .tr-b{animation-name:tWR}
@keyframes tWL{0%,100%{width:0}50%{width:100%}}
@keyframes tWR{0%,100%{width:100%}50%{width:0}}
.tr-9 .tr-a{background:#0a0a0a}.tr-9 .tr-b{animation-name:tGb;opacity:0.6}.tr-9 .tr-c{animation-name:tGc;opacity:0.4}
@keyframes tGb{0%,100%{transform:translateX(0)}25%{transform:translateX(4px)}75%{transform:translateX(-3px)}}
@keyframes tGc{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(4px)}}
.tr-spin{animation:tSpin 0.8s linear infinite}
@keyframes tSpin{to{transform:rotate(360deg)}}
.tr-11 .tr-a{background:#1a1a3a}.tr-11 .tr-b{animation-name:tFl;background:white}
@keyframes tFl{0%,100%{opacity:0}30%{opacity:1}60%{opacity:0}}
.tr-12 .tr-a{background:#1a1a2a}.tr-12 .tr-b{animation-name:tMb;background:rgba(59,130,246,0.2)}
@keyframes tMb{0%,100%{transform:translateX(-20%)}50%{transform:translateX(20%)}}
.tr-cube{animation:tCube 1.5s ease-in-out infinite}
@keyframes tCube{0%,100%{transform:rotateY(0deg) rotateX(0deg)}50%{transform:rotateY(180deg) rotateX(20deg)}}
.tr-page{animation:tPage 2s ease-in-out infinite}
@keyframes tPage{0%,100%{transform:skewY(-10deg) scaleX(1)}50%{transform:skewY(10deg) scaleX(0.6)}}
.tr-radial{animation:tRadial 2s ease-in-out infinite}
@keyframes tRadial{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
.tr-diamond{animation:tDia 1.5s ease-in-out infinite}
@keyframes tDia{0%,100%{transform:rotate(45deg) scale(1);opacity:0.3}50%{transform:rotate(45deg) scale(1.5);opacity:0.6}}
.tr-17 div{animation:tWarp 1s ease-in-out infinite alternate}
@keyframes tWarp{0%{opacity:0.3}100%{opacity:1}}
.tr-18 div{animation:tMosaic 1.5s ease-in-out infinite alternate}
@keyframes tMosaic{0%{opacity:0.2}100%{opacity:0.8}}
.tr-19 .tr-a{background:#1a1a3a}.tr-19 .tr-b{animation:tCross;background:#3b82f6}
@keyframes tCross{0%,100%{transform:scale(0.3);opacity:0}50%{transform:scale(1);opacity:1}}
`}</style>
    <AssetGrid
      items={TRANS_LIST.map((tr) => ({ ...tr, type: "video", name: tr.name }))}
      onDragStart={(e, item) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: "overlay" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
      onClickItem={onClickItem}
      renderItem={(item) => (
        <div key={item.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: "overlay" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
          onClick={() => onClickItem?.({ ...item, type: "overlay" })}
          style={{
            display: "flex", flexDirection: "column", borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
            background: "rgba(255,255,255,0.015)", overflow: "hidden",
            transition: "background 0.12s",
          }}
          className="cs-asset-card"
        >
          <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", background: "#0d0d1a" }}>
            <TransThumb v={item.v} />
          </div>
          <div style={{ padding: "3px 6px" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500, textAlign: "center" }}>{item.name}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center", fontFamily: "monospace" }}>{item.d}s</div>
          </div>
        </div>
      )}
    />
    </>
  );
}

function EfThumb({ cat }) {
  const p = cat === "blur" ? 0 : cat === "glow" ? 1 : cat === "vhs" ? 2 : cat === "shake" ? 3 : cat === "glitch" ? 4 : cat === "noise" ? 5 : cat === "bw" ? 6 : cat === "vintage" ? 7 : cat === "neon" ? 8 : cat === "cine" ? 9 : cat === "mirror" ? 10 : cat === "pixel" ? 11 : cat === "dream" ? 12 : cat === "film" ? 13 : cat === "sepia" ? 14 : cat === "invert" ? 15 : cat === "sketch" ? 16 : cat === "halftone" ? 17 : cat === "chroma" ? 18 : cat === "sharp" ? 19 : cat === "rgb" ? 20 : cat === "zoom" ? 21 : cat === "lens" ? 22 : cat === "bloom" ? 23 : 0;
  return (
    <div className={`ef-thumb ef-${p}`} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", borderRadius: 2 }}>
      <div className="ef-bg" style={{ position: "absolute", inset: 0 }} />
      {p === 0 && <div className="ef-over" style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.03)"}}/>}
      {p === 1 && <div className="ef-over" style={{position:"absolute",inset:0,background:"rgba(59,130,246,0.15)"}}/>}
      {p === 2 && <><div className="ef-line" style={{position:"absolute",left:0,right:0,height:"20%",background:"rgba(255,0,64,0.3)",top:"10%"}}/><div className="ef-line" style={{position:"absolute",left:0,right:0,height:"15%",background:"rgba(0,255,64,0.2)",top:"50%"}}/></>}
      {p === 3 && <><div className="ef-line" style={{position:"absolute",left:0,right:0,height:"8%",background:"rgba(255,255,255,0.04)",top:"30%"}}/><div className="ef-line" style={{position:"absolute",left:0,right:0,height:"8%",background:"rgba(255,255,255,0.04)",top:"55%"}}/></>}
      {p === 4 && <><div className="ef-over" style={{position:"absolute",inset:0,background:"rgba(255,0,64,0.2)"}}/><div className="ef-over2" style={{position:"absolute",inset:0,background:"rgba(0,255,64,0.15)"}}/></>}
      {p === 5 && <div className="ef-over" style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.02)"}}/>}
      {p === 6 && <div className="ef-over" style={{position:"absolute",inset:0}}/>}
      {p === 7 && <div className="ef-over" style={{position:"absolute",inset:0,background:"rgba(139,90,43,0.2)"}}/>}
      {p === 8 && <><div className="ef-over" style={{position:"absolute",inset:0,background:"rgba(212,58,244,0.12)"}}/><div className="ef-over2" style={{position:"absolute",inset:0,background:"rgba(58,244,212,0.08)"}}/></>}
      {p === 9 && <><div className="ef-over" style={{position:"absolute",top:0,left:0,right:0,height:"15%",background:"rgba(0,0,0,0.3)"}}/><div className="ef-over" style={{position:"absolute",bottom:0,left:0,right:0,height:"15%",background:"rgba(0,0,0,0.3)"}}/></>}
      {p === 10 && <div className="ef-over" style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent 0%,rgba(59,130,246,0.1) 30%,transparent 70%)"}}/>}
      {p === 11 && <div style={{position:"absolute",inset:0,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1}}>{Array.from({length:16}).map((_,i)=><div key={i} style={{background:`hsl(${Math.floor(i/4)*90+i%4*20},15%,${15+i%3*8}%)`}}/>)}</div>}
      {p >= 12 && <div className="ef-over" style={{position:"absolute",inset:0}}/>}
    </div>
  );
}

export function EffectsPanel({ onClickItem }) {
  const items = useMemo(() =>
    EFX_CATS.map((ef) => ({
      ...ef, type: "video", dur: 3,
    })),
  []);
  return (<><style>{`
.ef-thumb{background:#0d0d1a}
.ef-bg{animation:efBg 3s ease-in-out infinite alternate}
@keyframes efBg{0%{background:#1a1a2a}100%{background:#2a2a4a}}
.ef-over,.ef-over2,.ef-line{animation-duration:2s;animation-iteration-count:infinite}
.ef-0 .ef-over{animation-name:efBlur;background:rgba(255,255,255,0.03)}
@keyframes efBlur{0%,100%{opacity:0.1}50%{opacity:0.5}}
.ef-1 .ef-over{animation-name:efGlow;background:rgba(59,130,246,0.15)}
@keyframes efGlow{0%,100%{opacity:0.1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.1)}}
.ef-2 .ef-line{animation-name:efVhs;background:rgba(255,0,64,0.3)}
@keyframes efVhs{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}
.ef-2 .ef-line+div{animation-name:efVhs2;background:rgba(0,255,64,0.2)}
@keyframes efVhs2{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.ef-3 .ef-line{animation-name:efShake;animation-duration:0.15s;background:rgba(255,255,255,0.04)}
@keyframes efShake{0%,100%{transform:translateX(0)}20%{transform:translateX(4px)}40%{transform:translateX(-3px)}60%{transform:translateX(2px)}80%{transform:translateX(-1px)}}
.ef-4 .ef-over{animation-name:efGlt1;background:rgba(255,0,64,0.2)}.ef-4 .ef-over2{animation-name:efGlt2;background:rgba(0,255,64,0.15)}
@keyframes efGlt1{0%,100%{transform:translateX(0)}25%{transform:translateX(5px)}75%{transform:translateX(-4px)}}
@keyframes efGlt2{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(5px)}}
.ef-5 .ef-over{animation-name:efNoise;animation-duration:0.1s;background:rgba(255,255,255,0.02)}
@keyframes efNoise{0%,100%{opacity:0.1}50%{opacity:0.4}}
.ef-6 .ef-over{animation-name:efBw;background:#888}
@keyframes efBw{0%,100%{opacity:0}50%{opacity:0.5}}
.ef-7 .ef-over{animation-name:efVin;background:rgba(139,90,43,0.2)}
@keyframes efVin{0%,100%{opacity:0.1}50%{opacity:0.5}}
.ef-8 .ef-over{animation-name:efNn1;background:rgba(212,58,244,0.12)}.ef-8 .ef-over2{animation-name:efNn2;background:rgba(58,244,212,0.08)}
@keyframes efNn1{0%,100%{opacity:0.1}50%{opacity:0.7}}
@keyframes efNn2{0%,100%{opacity:0.3}50%{opacity:0.8}}
.ef-9 .ef-over{animation-name:efCine;background:rgba(0,0,0,0.3)}
@keyframes efCine{0%,100%{opacity:0.3}50%{opacity:0.8}}
.ef-10 .ef-over{animation-name:efMir;background:linear-gradient(90deg,transparent 0%,rgba(59,130,246,0.1) 30%,transparent 70%)}
@keyframes efMir{0%,100%{transform:translateX(-30%)}50%{transform:translateX(30%)}}
.ef-11{animation:efPix 0.8s steps(4) infinite}
@keyframes efPix{0%{filter:contrast(1)}50%{filter:contrast(2)}}
.ef-12 .ef-over{animation-name:efDrm;background:rgba(74,42,106,0.15)}
@keyframes efDrm{0%,100%{opacity:0}50%{opacity:0.6}}
.ef-13 .ef-over{animation-name:efFlm;background:rgba(255,255,200,0.03)}
@keyframes efFlm{0%,100%{opacity:0}50%{opacity:0.3}}
.ef-14 .ef-over{animation-name:efSep;background:rgba(139,90,43,0.15)}
@keyframes efSep{0%,100%{opacity:0.1}50%{opacity:0.4}}
.ef-15 .ef-over{animation-name:efInv;background:white}
@keyframes efInv{0%,100%{opacity:0}50%{opacity:0.3}}
.ef-16 .ef-over{animation-name:efSk;background:white}
@keyframes efSk{0%,100%{opacity:0.4}50%{opacity:0.9}}
.ef-17 .ef-over{animation-name:efHlf;background:rgba(255,255,255,0.08)}
@keyframes efHlf{0%,100%{opacity:0.1}50%{opacity:0.5}}
.ef-18 .ef-over{animation-name:efChr;background:rgba(0,255,68,0.08)}
@keyframes efChr{0%,100%{opacity:0}50%{opacity:0.4}}
.ef-19 .ef-over{animation-name:efShrp;background:white}
@keyframes efShrp{0%,100%{opacity:0.05}50%{opacity:0.2}}
.ef-20 .ef-over{animation-name:efRgb;background:rgba(255,0,64,0.08)}.ef-20 .ef-over2{animation-name:efRgb2;background:rgba(0,64,255,0.06)}
@keyframes efRgb{0%,100%{transform:translateX(0)}50%{transform:translateX(3px)}}
@keyframes efRgb2{0%,100%{transform:translateX(0)}50%{transform:translateX(-3px)}}
.ef-21 .ef-over{animation-name:efZm;background:rgba(255,255,255,0.02)}
@keyframes efZm{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
.ef-22 .ef-over{animation-name:efLn;background:rgba(212,164,48,0.08)}
@keyframes efLn{0%,100%{opacity:0;transform:translateX(-20%)}50%{opacity:0.5;transform:translateX(20%)}}
.ef-23 .ef-over{animation-name:efBlm;background:rgba(255,255,255,0.06)}
@keyframes efBlm{0%,100%{opacity:0;transform:scale(0.8)}50%{opacity:0.6;transform:scale(1.1)}}
`}</style>
    <AssetGrid
      items={items}
      onDragStart={(e, item) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: "overlay", dur: 3 })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
      onClickItem={onClickItem}
      renderItem={(item) => (
        <div key={item.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: "overlay", dur: 3 })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
          onClick={() => onClickItem?.({ ...item, type: "overlay", dur: 3 })}
          style={{
            display: "flex", flexDirection: "column", borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
            background: "rgba(255,255,255,0.015)", overflow: "hidden",
            transition: "background 0.12s",
          }}
          className="cs-asset-card"
        >
          <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", background: "#0d0d1a" }}>
            <EfThumb cat={item.cat} />
          </div>
          <div style={{ padding: "3px 6px" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500, textAlign: "center" }}>{item.name}</div>
          </div>
        </div>
      )}
    />
    </>
  );
}

export function LUTsPanel({ onClickItem }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: "0 8px 8px" }}>
      {LUTS.map((l) => (
        <div key={l.id} onClick={() => onClickItem?.({ ...l, type: "luts" })}
          style={{
            display: "flex", flexDirection: "column", borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.04)", cursor: onClickItem ? "pointer" : "default",
            background: "rgba(255,255,255,0.015)", overflow: "hidden",
            transition: "background 0.12s",
          }} className="cs-asset-card">
          <div style={{
            width: "100%", aspectRatio: "16/9",
            background: l.g ? `linear-gradient(135deg, ${l.g[0]}, ${l.g[1]}, ${l.g[2]}, ${l.g[3]})` : `linear-gradient(135deg, hsl(${l.id.charCodeAt(1) * 30}, 30%, 15%), hsl(${l.id.charCodeAt(2) * 40}, 25%, 8%))`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <span style={{
              fontSize: 12, color: "rgba(255,255,255,0.5)",
              fontFamily: "monospace", letterSpacing: "0.15em",
              fontWeight: 600, textTransform: "uppercase",
            }}>LUT</span>
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
              background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 25%, #22c55e 50%, #3b82f6 75%, #a855f7 100%)`,
              opacity: 0.3,
            }} />
          </div>
          <div style={{ padding: "4px 6px" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", fontWeight: 500 }}>{l.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const COLOR_PRESETS = [
  { name: "Warm", temp: 25, sat: 10, exp: 5, cont: 10, vib: 15 },
  { name: "Cool", temp: -30, tint: -5, sat: 5, exp: -3, vib: 10 },
  { name: "Vibrant", sat: 40, vib: 30, cont: 20, exp: 5 },
  { name: "Moody", temp: -10, sat: -20, cont: 30, hl: -15, sh: -20 },
  { name: "Fade", sat: -30, vib: -20, cont: -10, exp: 8 },
  { name: "Drama", cont: 40, hl: -20, sh: -30, sat: 10 },
];

export function ColorPanel({ onClickItem }) {
  const [v, setV] = useState({ temp: 0, tint: 0, sat: 0, exp: 0, cont: 0, hl: 0, sh: 0, vib: 0, hue: 0 });
  return (
    <div style={{ padding: "8px 10px" }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Presets</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
          {COLOR_PRESETS.map((p) => (
            <button key={p.name} onClick={() => { setV((x) => ({ ...x, ...p })); onClickItem?.({ type: "colorPreset", ...p }); }}
              style={{
                fontSize: 10, padding: "4px 4px", borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.5)",
                fontFamily: "inherit", fontWeight: 500,
              }}
              className="cs-hover-soft"
            >{p.name}</button>
          ))}
        </div>
      </div>
      {[
        { k: "temp", label: "Temperature" }, { k: "tint", label: "Tint" },
        { k: "sat", label: "Saturation" }, { k: "vib", label: "Vibrance" },
        { k: "exp", label: "Exposure" }, { k: "cont", label: "Contrast" },
        { k: "hl", label: "Highlights" }, { k: "sh", label: "Shadows" },
        { k: "hue", label: "Hue Shift" },
      ].map((s) => (
        <div key={s.k} style={{ marginBottom: 4 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 2,
          }}>
            <span>{s.label}</span>
            <span style={{ color: "rgba(255,255,255,0.38)", fontFamily: "monospace" }}>
              {v[s.k] > 0 ? "+" : ""}{v[s.k]}
            </span>
          </div>
          <Rng min={-100} max={100} val={v[s.k]} onChange={(e) => { setV((x) => ({ ...x, [s.k]: +e.target.value })); onClickItem?.({ type: "colorAdjust", key: s.k, value: +e.target.value }); }} />
        </div>
      ))}
      <button onClick={() => { setV({ temp: 0, tint: 0, sat: 0, exp: 0, cont: 0, hl: 0, sh: 0, vib: 0, hue: 0 }); onClickItem?.({ type: "colorReset" }); }}
        style={{
          width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4, marginTop: 6,
          border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
          background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)",
          fontFamily: "inherit",
        }}
        className="cs-hover-soft"
      >Reset All</button>
    </div>
  );
}

export function MotionPanel({ onClickItem }) {
  const [hvr, setHvr] = useState(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "0 8px 8px" }}>
      {MOTION_PRESETS.map((mp) => {
        const arrow = mp.dir === "left" ? "←" : mp.dir === "right" ? "→" : mp.dir === "up" ? "↑" : mp.dir === "down" ? "↓" : mp.dir === "in" ? "⊕" : mp.dir === "out" ? "⊖" : mp.dir === "slideL" ? "⇠" : mp.dir === "slideR" ? "⇢" : mp.dir === "fade" ? "◐" : mp.dir === "bounce" ? "⇅" : mp.dir === "pulse" ? "⊙" : mp.dir === "rotate" ? "⟳" : mp.dir?.startsWith("reveal") ? "◧" : "→";
        return (
          <div key={mp.id} onClick={() => onClickItem?.({ ...mp, type: "motion" })}
            onMouseEnter={() => setHvr(mp.id)} onMouseLeave={() => setHvr(null)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 8px",
              borderRadius: 4, border: "1px solid rgba(255,255,255,0.04)",
              background: hvr === mp.id ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.015)",
              cursor: "pointer", transition: "background 0.12s",
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 3,
              background: "rgba(59,130,246,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "rgba(59,130,246,0.45)",
            }}>{arrow}</div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{mp.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BackgroundsPanel({ onClickItem }) {
  const [hvr, setHvr] = useState(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: "0 8px 8px" }}>
      {BACKGROUNDS.map((bg) => (
        <div key={bg.id} onClick={() => onClickItem?.({ ...bg, type: "background" })}
          onMouseEnter={() => setHvr(bg.id)} onMouseLeave={() => setHvr(null)}
          style={{
            display: "flex", flexDirection: "column", borderRadius: 4,
            border: hvr === bg.id ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(255,255,255,0.04)",
            cursor: "pointer", overflow: "hidden",
            transition: "border-color 0.12s, transform 0.12s",
            transform: hvr === bg.id ? "scale(1.02)" : "scale(1)",
          }}
        >
          <div style={{
            width: "100%", aspectRatio: "16/9",
            background: bg.type === "solid" ? bg.c : bg.type === "gradient" ? `linear-gradient(135deg, ${bg.c[0]}, ${bg.c[1]})` : bg.type === "pattern" ? `repeating-${bg.name.includes("Dots") ? "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)" : bg.name.includes("Stripes") ? "linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 4px)" : bg.name.includes("Hex") ? "linear-gradient(60deg, rgba(255,255,255,0.04) 25%, transparent 25%)" : "linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)"}` : bg.type === "animated" ? "linear-gradient(135deg, #0a0a2a, #1a1a4a)" : "linear-gradient(135deg, #1a1a2a, #2a2a4a)",
            backgroundSize: bg.type === "pattern" ? "12px 12px" : "100% 100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            {bg.type === "pattern" && (
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(255,255,255,0.02)",
              }} />
            )}
            {bg.type === "animated" && (
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                animation: "pulse 2s ease-in-out infinite",
              }} />
            )}
            <span style={{
              fontSize: 9, color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase", letterSpacing: "0.1em",
              fontWeight: 500, position: "absolute", bottom: 4, right: 5,
            }}>{bg.type}</span>
          </div>
          <div style={{ padding: "4px 6px" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{bg.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function VoicePanel({ onClickItem }) {
  const [srch, setSrch] = useState("");
  const [text, setText] = useState("");
  const [sel, setSel] = useState(null);
  const [cat, setCat] = useState("all");
  const [hvr, setHvr] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [speakId, setSpeakId] = useState(null);
  const VOICE_CATS = [
    { id: "all", label: "All" }, { id: "PT-BR", label: "Português" },
    { id: "EN-US", label: "English" }, { id: "ES", label: "Español" },
  ];
  const filtered = useMemo(() => {
    let items = VOICES;
    if (cat !== "all") items = items.filter((v) => v.lang === cat);
    if (srch.trim()) items = items.filter((v) => v.name.toLowerCase().includes(srch.toLowerCase()));
    return items;
  }, [cat, srch]);

  const speak = (voiceId, voiceName, lang, gender) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(voiceName || "Sample voice test");
      if (lang) u.lang = lang;
      u.rate = 0.9;
      u.pitch = gender === "F" ? 1.1 : 0.9;
      u.onend = u.onerror = () => { setSpeaking(false); setSpeakId(null); };
      window.speechSynthesis.speak(u);
      setSpeaking(true);
      setSpeakId(voiceId);
    } catch {}
  };

  const speakTTS = (txt, voiceId, lang) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      if (lang) u.lang = lang;
      u.rate = 0.9;
      u.onend = u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
      setSpeaking(true);
    } catch {}
  };

  return (
    <>
      <SearchBar value={srch} onChange={setSrch} placeholder="Search voices..." />
      <CategoryBar cats={VOICE_CATS} active={cat} onChange={setCat} />
      <div style={{ padding: "0 8px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
        {filtered.map((v) => (
          <div key={v.id} onClick={() => { setSel(v.id); onClickItem?.({ ...v, type: "voice" }); }}
            onMouseEnter={() => setHvr(v.id)} onMouseLeave={() => setHvr(null)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
              borderRadius: 4, cursor: "pointer",
              background: sel === v.id ? "rgba(16,185,129,0.06)" : hvr === v.id ? "rgba(255,255,255,0.03)" : "transparent",
              border: sel === v.id ? "1px solid rgba(16,185,129,0.12)" : "1px solid transparent",
              transition: "all 0.12s",
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: v.gender === "M" ? "rgba(59,130,246,0.08)" : "rgba(236,72,153,0.08)",
              border: `1px solid ${v.gender === "M" ? "rgba(59,130,246,0.12)" : "rgba(236,72,153,0.12)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600,
              color: v.gender === "M" ? "rgba(59,130,246,0.5)" : "rgba(236,72,153,0.5)",
              flexShrink: 0,
            }}>{v.gender}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{v.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1, textTransform: "capitalize" }}>
                {v.lang} · {v.style}
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); speak(v.id, v.name, v.lang, v.gender); }}
              style={{
                width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer",
                background: speakId === v.id ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                color: speakId === v.id ? "#10b981" : "rgba(255,255,255,0.3)",
                fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "inherit", flexShrink: 0, transition: "all 0.12s",
              }}
              className="cs-hover-soft"
            >{speakId === v.id ? "⏹" : "▶"}</button>
          </div>
        ))}
      </div>
      <div style={{ padding: "4px 8px 8px", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 4 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Text to Speech</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
          placeholder="Type text to convert to speech..."
          style={{
            width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 4, padding: "5px 8px", fontSize: 12, color: "rgba(255,255,255,0.55)",
            fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box",
          }}
        />
        <button
          onClick={() => {
            if (!text.trim() || !sel) return;
            speakTTS(text.trim(), sel, filtered.find((v) => v.id === sel)?.lang);
            onClickItem?.({ type: "tts", voiceId: sel, text: text.trim() });
          }}
          style={{
            width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4, marginTop: 4,
            border: "none", cursor: "pointer",
            background: text.trim() && sel && !speaking ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
            color: text.trim() && sel && !speaking ? "rgba(59,130,246,0.65)" : "rgba(255,255,255,0.25)",
            fontFamily: "inherit", fontWeight: 500,
          }}
          disabled={!text.trim() || !sel || speaking}
        >{speaking ? "🔊 Speaking..." : sel ? "Generate Voiceover" : "Select a voice first"}</button>
      </div>
    </>
  );
}

export function AIPanel() {
  const [proc, setProc] = useState(null);
  return (
    <div style={{ padding: "4px 8px" }}>
      {AI_TOOLS.slice(0, 10).map((ai) => (
        <button key={ai.id} onClick={() => { setProc(ai.id); setTimeout(() => setProc(null), 2000); }} disabled={proc === ai.id}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 4,
            border: "none", cursor: "pointer", background: "transparent", fontFamily: "inherit",
            width: "100%", textAlign: "left", transition: "background 0.12s",
            borderBottom: "1px solid rgba(255,255,255,0.025)",
          }}
          className="cs-hover-soft"
        >
          <div style={{
            width: 24, height: 24, borderRadius: 4,
            background: proc === ai.id ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.08)",
            border: `1px solid ${proc === ai.id ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.08)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: proc === ai.id ? "rgba(16,185,129,0.5)" : "rgba(59,130,246,0.4)",
            flexShrink: 0,
          }}>
            {proc === ai.id ? <span style={{ animation: "spin 0.8s linear infinite" }}>⏳</span> : ai.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 14, color: "rgba(255,255,255,0.68)", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {ai.name}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
              {proc === ai.id ? "Processing..." : ai.desc}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function AssetsPanel({ onClickItem }) {
  const items = useMemo(() =>
    BRAND_ASSETS.map((a) => ({ ...a, type: a.type === "image" ? "image" : "video" })),
  []);
  return <AssetGrid items={items} onClickItem={onClickItem} />;
}

export function TemplatesPanel({ onClickItem }) {
  const [hvr, setHvr] = useState(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: "0 8px 8px" }}>
      {TEMPLATES.map((t) => (
        <div key={t.id} onClick={() => onClickItem?.({ ...t, type: "template" })}
          onMouseEnter={() => setHvr(t.id)} onMouseLeave={() => setHvr(null)}
          style={{
            display: "flex", flexDirection: "column", borderRadius: 4,
            border: hvr === t.id ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(255,255,255,0.04)",
            cursor: "pointer", overflow: "hidden",
            transition: "border-color 0.12s, transform 0.12s",
            transform: hvr === t.id ? "scale(1.02)" : "scale(1)",
          }}
        >
          <div style={{
            width: "100%", aspectRatio: "16/9",
            background: t.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>{t.name[0]}</div>
            <span style={{
              position: "absolute", bottom: 4, right: 5,
              fontSize: 9, color: "rgba(255,255,255,0.4)",
              fontFamily: "monospace",
            }}>{t.dur}s</span>
          </div>
          <div style={{ padding: "4px 6px" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{t.name}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{t.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SlidesPanel({ onClickItem }) {
  const [hvr, setHvr] = useState(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: "0 8px 8px" }}>
      {SLIDES.map((s) => (
        <div key={s.id} onClick={() => onClickItem?.({ ...s, type: "slide" })}
          onMouseEnter={() => setHvr(s.id)} onMouseLeave={() => setHvr(null)}
          style={{
            display: "flex", flexDirection: "column", borderRadius: 4,
            border: hvr === s.id ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(255,255,255,0.04)",
            cursor: "pointer", overflow: "hidden",
            transition: "border-color 0.12s, transform 0.12s",
            transform: hvr === s.id ? "scale(1.02)" : "scale(1)",
          }}
        >
          <div style={{
            width: "100%", aspectRatio: "16/9",
            background: s.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <span style={{
              fontSize: 10, color: "rgba(255,255,255,0.7)",
              fontWeight: 600, textAlign: "center",
              padding: "0 8px",
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              overflow: "hidden",
              maxHeight: "80%",
            }}>{s.text}</span>
            <span style={{
              position: "absolute", bottom: 4, right: 5,
              fontSize: 9, color: "rgba(255,255,255,0.4)",
              fontFamily: "monospace",
            }}>{s.dur}s</span>
          </div>
          <div style={{ padding: "4px 6px" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{s.name}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1, textTransform: "capitalize" }}>{s.layout}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CaptionsPanel({ onClickItem }) {
  const [gen, setGen] = useState(false);
  const [hvr, setHvr] = useState(null);
  return (
    <div style={{ padding: "8px" }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Languages</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
        {[{ id: "c1", name: "Auto Detect", lang: "Auto", icon: "🌐" },
          { id: "c2", name: "Portuguese", lang: "PT-BR", icon: "🇧🇷" },
          { id: "c3", name: "English", lang: "EN", icon: "🇺🇸" },
          { id: "c4", name: "Spanish", lang: "ES", icon: "🇪🇸" },
        ].map((c) => (
          <button key={c.id} onClick={() => onClickItem?.({ ...c, type: "captionLang" })}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4,
              border: "none", cursor: "pointer", background: "transparent", fontFamily: "inherit",
              width: "100%", textAlign: "left",
              borderBottom: "1px solid rgba(255,255,255,0.025)",
            }} className="cs-hover-soft">
            <span style={{ fontSize: 16 }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.68)", fontWeight: 500 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{c.lang}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8, marginBottom: 8,
      }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Styles</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {CAPTION_STYLES.map((cs) => (
            <div key={cs.id} onClick={() => onClickItem?.({ ...cs, type: "captionStyle" })}
              onMouseEnter={() => setHvr(cs.id)} onMouseLeave={() => setHvr(null)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
                borderRadius: 4, cursor: "pointer",
                background: hvr === cs.id ? "rgba(255,255,255,0.03)" : "transparent",
                border: "1px solid rgba(255,255,255,0.03)",
                transition: "background 0.12s",
              }}
            >
              <div style={{
                flex: 1, padding: "2px 6px", borderRadius: 3,
                background: cs.bg,
                fontSize: cs.sz ? Math.min(cs.sz / 2, 11) : 10,
                color: cs.color || "#fff",
                fontWeight: cs.w || 400,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontFamily: cs.font || "Inter",
              }}>Sample Text</div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", flexShrink: 0 }}>{cs.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8 }}>
        <button onClick={() => { setGen(true); onClickItem?.({ type: "generateCaptions" }); setTimeout(() => setGen(false), 2500); }}
          style={{
            width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
            background: "rgba(59,130,246,0.08)", color: "rgba(59,130,246,0.6)",
            fontFamily: "inherit", fontWeight: 500,
          }}
          className="cs-hover-soft"
        >{gen ? "⏳ Generating..." : "Generate Captions"}</button>
      </div>
      {gen && (
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
          {["Hello and welcome!", "In this video we'll show you", "How to create amazing content"].map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.03)", borderRadius: 3,
              padding: "3px 8px", fontSize: 11, color: "rgba(255,255,255,0.45)",
            }}>
              <span style={{ color: "rgba(255,255,255,0.38)", fontFamily: "monospace", fontSize: 12 }}>{FMT(i * 2)}</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BrandPanel({ onClickItem }) {
  const [hvr, setHvr] = useState(null);
  return (
    <div style={{ padding: "8px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4,
        background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.08)",
        marginBottom: 8,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 4,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
        }}>B</div>
        <div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", fontWeight: 500 }}>BRANPY Brand</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Active kit · 10 assets</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Colors</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, marginBottom: 8 }}>
        {["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#ef4444"].map((c, i) => (
          <div key={i} onClick={() => onClickItem?.({ type: "brandColor", color: c })}
            style={{
              height: 22, borderRadius: 4, cursor: "pointer",
              background: c, border: "1px solid rgba(255,255,255,0.06)",
              transition: "transform 0.12s",
            }} className="cs-hover-scale" />
        ))}
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", borderRadius: 4,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)",
        fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 8,
      }}>
        <span style={{ fontSize: 12 }}>🔤</span>
        <span>Inter · Sans · Open Sans</span>
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Assets</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
        {BRAND_ASSETS.slice(0, 6).map((a) => (
          <div key={a.id} onClick={() => onClickItem?.({ ...a, type: "brandAsset" })}
            onMouseEnter={() => setHvr(a.id)} onMouseLeave={() => setHvr(null)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
              borderRadius: 4, cursor: "pointer",
              background: hvr === a.id ? "rgba(255,255,255,0.03)" : "transparent",
              border: "1px solid rgba(255,255,255,0.02)",
              transition: "background 0.12s",
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 3,
              background: a.type === "image" ? "rgba(59,130,246,0.08)" : a.type === "palette" ? "rgba(245,158,11,0.08)" : a.type === "font" ? "rgba(16,185,129,0.08)" : "rgba(139,92,246,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: "rgba(255,255,255,0.35)", flexShrink: 0,
            }}>{a.type === "image" ? "🖼" : a.type === "palette" ? "🎨" : a.type === "font" ? "🔤" : "📄"}</div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
          </div>
        ))}
      </div>
      <button style={{
        width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
        background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)",
        fontFamily: "inherit",
      }} className="cs-hover-soft">Edit Brand Kit</button>
    </div>
  );
}

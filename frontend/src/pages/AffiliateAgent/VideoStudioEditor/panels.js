import React, { useState, useMemo, useCallback } from "react";
import { I, S, MEDIA_LIB, AUDIO_LIB, TEXT_STYLES, STICKER_SET, TRANS_LIST, EFX_CATS, LUTS, MOTION_PRESETS, BACKGROUNDS, VOICES, CAPTION_STYLES, AI_TOOLS, BRAND_ASSETS, TEMPLATES, Rng, FMT, MediaThumb, UID } from "./utils";

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

export function AudioPanel({ onClickItem }) {
  const [srch, setSrch] = useState("");
  const [cat, setCat] = useState("all");
  const filtered = useMemo(() => {
    let items = AUDIO_LIB;
    if (cat !== "all") items = items.filter((a) => a.cat === cat);
    if (srch.trim()) items = items.filter((a) => a.name.toLowerCase().includes(srch.toLowerCase()));
    return items;
  }, [cat, srch]);
  const [hvr, setHvr] = useState(null);

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
              background: hvr === item.id ? "rgba(255,255,255,0.03)" : "transparent",
              border: "1px solid rgba(255,255,255,0.03)",
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
            }}>
              <AudioWave cat={item.cat} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13, color: "rgba(255,255,255,0.68)", fontWeight: 500,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {item.name}
              </div>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1,
                textTransform: "capitalize",
              }}>
                {item.cat} · {item.dur.toFixed?.(1) || item.dur}s
              </div>
            </div>
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
  const dir = v === "slideL" ? "to right" : v === "slideR" ? "to left" : v === "slideUp" ? "to bottom" : v === "slideD" ? "to top" : v === "wipeL" ? "to right" : v === "wipeR" ? "to left" : v === "zoomIn" ? "to right bottom" : v === "zoomOut" ? "to left top" : "to right";
  const isFade = v === "opacity" || v === "fade";
  const isGlitch = v?.includes("glitch");
  const isSpin = v === "spin";
  const isCube = v === "cube";
  const isPage = v === "page";
  const isRadial = v === "radial";
  const isDiamond = v === "diamond";
  if (isFade) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <div style={{ flex: 1, background: "#1a1a2a" }} />
        <div style={{ flex: 1, background: "linear-gradient(90deg, #1a1a2a, #2a2a4a)" }} />
        <div style={{ flex: 1, background: "#2a2a4a" }} />
      </div>
    );
  }
  if (isGlitch) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 2, padding: 4 }}>
        {[0, 1, 2].map((r) => (
          <div key={r} style={{ flex: 1, background: `#${r === 0 ? "ff0040" : r === 1 ? "00ff40" : "0040ff"}${r % 2 === 0 ? "40" : "60"}`, transform: `translateX(${(r % 2 === 0 ? 1 : -1) * 3}px)` }} />
        ))}
      </div>
    );
  }
  if (isSpin) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 18, height: 18, border: "2px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }
  if (isCube) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", perspective: 40 }}>
        <div style={{ width: 20, height: 20, background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", transform: "rotateY(45deg) rotateX(30deg)", borderRadius: 3 }} />
      </div>
    );
  }
  if (isPage) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 18, height: 22, background: "rgba(255,255,255,0.08)", borderRadius: 2, transform: "skewY(-10deg)", border: "1px solid rgba(255,255,255,0.06)" }} />
      </div>
    );
  }
  if (isRadial) {
    return (
      <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
    );
  }
  if (isDiamond) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 16, height: 16, background: "#3b82f6", transform: "rotate(45deg)", opacity: 0.4 }} />
      </div>
    );
  }
  if (v === "warp" || v === "mosaic") {
    return (
      <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: `hsl(${i * 90}, 40%, 20%)`, borderRadius: 1 }} />
        ))}
      </div>
    );
  }
  return (
    <div style={{ width: "100%", height: "100%", background: `linear-gradient(${dir}, #1a1a2a 0%, #3b82f6 50%, #2a2a4a 100%)` }} />
  );
}

export function TransitionsPanel({ onClickItem }) {
  return (
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
  );
}

function EfThumb({ cat }) {
  const pal = {
    blur: ["#1a1a2a", "#2a2a4a", "#3a3a5a"],
    glow: ["#1a1a2a", "#3b82f6", "#60a5fa"],
    vhs: ["#004040", "#ff0040", "#00ff40"],
    shake: ["#2a1a1a", "#4a2a2a", "#2a1a1a"],
    rgb: ["#ff0040", "#00ff40", "#0040ff"],
    zoom: ["#1a1a2a", "#2a2a4a", "#3a3a5a"],
    cine: ["#1a0a0a", "#2a1a1a", "#4a2a1a"],
    noise: ["#1a1a1a", "#2a2a2a", "#3a3a3a"],
    film: ["#2a2a1a", "#4a4a2a", "#3a3a1a"],
    dream: ["#1a1a2a", "#4a2a6a", "#8a4aba"],
    glitch: ["#0a0a0a", "#ff0040", "#00ff40"],
    mirror: ["#1a2a3a", "#2a4a6a", "#1a2a3a"],
    sharp: ["#0a0a0a", "#ffffff", "#0a0a0a"],
    bw: ["#1a1a1a", "#4a4a4a", "#8a8a8a"],
    vintage: ["#3a2a1a", "#6a4a2a", "#8a6a3a"],
    chroma: ["#004400", "#00ff44", "#004400"],
    neon: ["#0a0a2a", "#d43af4", "#3af4d4"],
    sketch: ["#ffffff", "#d4d4d4", "#ffffff"],
    pixel: ["#1a1a2a", "#2a2a4a", "#3a3a5a"],
    halftone: ["#ffffff", "#d4d4d4", "#8a8a8a"],
    invert: ["#ffffff", "#1a1a1a", "#ffffff"],
    sepia: ["#4a2a1a", "#8a6a3a", "#4a2a1a"],
    lens: ["#1a1a2a", "#d4a430", "#ffffff"],
    bloom: ["#1a1a1a", "#ffffff", "#d4d4f4"],
  }[cat] || ["#1a1a2a", "#2a2a4a", "#3a3a5a"];
  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      {pal.map((c, i) => (
        <div key={i} style={{ flex: 1, background: c, opacity: 0.8 - i * 0.2 }} />
      ))}
    </div>
  );
}

export function EffectsPanel({ onClickItem }) {
  const items = useMemo(() =>
    EFX_CATS.map((ef) => ({
      ...ef, type: "video", dur: 3,
    })),
  []);
  return (
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
  const [gen, setGen] = useState(null);
  const [cat, setCat] = useState("all");
  const [hvr, setHvr] = useState(null);
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

  return (
    <>
      <SearchBar value={srch} onChange={setSrch} placeholder="Search voices..." />
      <CategoryBar cats={VOICE_CATS} active={cat} onChange={setCat} />
      <div style={{ padding: "0 8px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
        {filtered.map((v) => (
          <div key={v.id} onClick={() => { setGen(v.id); onClickItem?.({ ...v, type: "voice" }); }}
            onMouseEnter={() => setHvr(v.id)} onMouseLeave={() => setHvr(null)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
              borderRadius: 4, cursor: "pointer",
              background: gen === v.id ? "rgba(16,185,129,0.06)" : hvr === v.id ? "rgba(255,255,255,0.03)" : "transparent",
              border: gen === v.id ? "1px solid rgba(16,185,129,0.12)" : "1px solid transparent",
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
            {gen === v.id && <span style={{ fontSize: 9, color: "rgba(16,185,129,0.5)" }}>⏳</span>}
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
        <button onClick={() => { if (!text.trim() || !gen) return; onClickItem?.({ type: "tts", voiceId: gen, text: text.trim() }); }}
          style={{
            width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4, marginTop: 4,
            border: "none", cursor: "pointer",
            background: text.trim() && gen ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
            color: text.trim() && gen ? "rgba(59,130,246,0.65)" : "rgba(255,255,255,0.25)",
            fontFamily: "inherit", fontWeight: 500,
          }}
          disabled={!text.trim() || !gen}
        >{gen ? "Generate Voiceover" : "Select a voice first"}</button>
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
  return (
    <AssetGrid
      items={TEMPLATES.map((t) => ({ ...t, type: "video" }))}
      onClickItem={onClickItem}
    />
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

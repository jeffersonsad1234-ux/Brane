import React, { useState, useMemo } from "react";
import { I, S, MEDIA_LIB, TEXT_STYLES, STICKER_SET, TRANS_LIST, EFX_CATS, LUTS, MOTION_PRESETS, AI_TOOLS, BRAND_ASSETS, TEMPLATES, Rng, FMT, MediaThumb } from "./utils";

export function SideTab({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} title={label}
      style={{
        width: "100%", height: 34, display: "flex", alignItems: "center",
        justifyContent: "center", position: "relative", border: "none",
        background: "none", cursor: "pointer",
        color: active ? "rgba(59,130,246,0.7)" : "rgba(255,255,255,0.28)",
        transition: "color 0.12s",
        fontFamily: "inherit",
      }}
      className={!active ? "cs-hover-icon" : ""}
    >
      <S d={icon} sz={15} />
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
            flexShrink: 0, fontSize: 11, padding: "3px 10px", borderRadius: 4,
            border: "none", cursor: "pointer", fontFamily: "inherit",
            background: active === c.id ? "rgba(59,130,246,0.12)" : "transparent",
            color: active === c.id ? "rgba(59,130,246,0.65)" : "rgba(255,255,255,0.3)",
            fontWeight: active === c.id ? 500 : 400,
            transition: "color 0.12s, background 0.12s",
          }}
          className={active !== c.id ? "cs-hover-soft" : ""}
        >{c.label}</button>
      ))}
    </div>
  );
}

function AssetGrid({ items, onDragStart, renderItem }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "20px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 20, opacity: 0.06, marginBottom: 6 }}>📂</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>No items found</div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: "0 8px 8px" }}>
      {items.map((item) =>
        renderItem ? renderItem(item) : (
          <div key={item.id} draggable onDragStart={(e) => onDragStart?.(e, item)}
            style={{
              display: "flex", flexDirection: "column", borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.04)", cursor: "grab",
              background: "rgba(255,255,255,0.015)", overflow: "hidden",
              transition: "background 0.12s, border-color 0.12s, transform 0.12s",
            }}
            className="cs-asset-card"
          >
            <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", overflow: "hidden" }}>
              {item.thumb && item.thumb.startsWith("<") ? null : item.thumb && !item.thumb.startsWith("cs-") ? null : null}
              <MediaThumb type={item.type || "video"} name={item.name} duration={item.dur} />
            </div>
            <div style={{ padding: "4px 6px" }}>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {item.name}
              </div>
              {item.dur && (
                <div style={{
                  fontSize: 10, color: "rgba(255,255,255,0.3)",
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

export function MediaPanel({ imm, onImp, fRef, onMDrag }) {
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
          cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.35)",
          transition: "border-color 0.12s, background 0.12s",
        }}
        className="cs-dropzone"
      >
        Drop files or click to import
      </div>
      <AssetGrid items={filtered} onDragStart={(e, item) => onMDrag(e, { ...item, type: item.type || "video" })} />
    </>
  );
}

const audioItems = [
  ...MEDIA_LIB.filter((m) => m.type === "audio"),
  { id: "au3", name: "SFX.mp3", dur: 3, thumb: "" },
  { id: "au4", name: "Transição.wav", dur: 1.5, thumb: "" },
  { id: "au5", name: "Ambiente.mp3", dur: 60, thumb: "" },
  { id: "au6", name: "Bass.mp3", dur: 4, thumb: "" },
  { id: "au7", name: "Clap.wav", dur: 0.3, thumb: "" },
  { id: "au8", name: "Riser.mp3", dur: 3, thumb: "" },
  { id: "au9", name: "Jingle.mp3", dur: 6, thumb: "" },
  { id: "au10", name: "Stinger.wav", dur: 1, thumb: "" },
];

export function AudioPanel() {
  return (
    <AssetGrid
      items={audioItems}
      onDragStart={(e, item) => {
        try { e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: "audio" })); e.dataTransfer.effectAllowed = "copy"; } catch {}
      }}
    />
  );
}

export function TextPanel() {
  return (
    <div style={{ padding: "4px 8px" }}>
      {TEXT_STYLES.map((t) => (
        <div key={t.id} draggable
          onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...t, type: "text" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
            borderRadius: 4, cursor: "grab", transition: "background 0.12s",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
          }}
          className="cs-hover-soft"
        >
          <div style={{
            width: 26, height: 26, borderRadius: 4,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "rgba(245,158,11,0.5)",
            flexShrink: 0,
          }}>{t.name[0]}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {t.name}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
              {t.font} · {t.sz}px{t.w ? ` · Weight ${t.w}` : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StickerPanel() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, padding: "8px" }}>
      {STICKER_SET.map((s) => (
        <div key={s.id} draggable
          onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...s, type: "sticker" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
          style={{
            aspectRatio: "1", borderRadius: 6,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, cursor: "grab", transition: "all 0.12s",
          }}
          className="cs-sticker-card"
        >{s.e}</div>
      ))}
    </div>
  );
}

export function TransitionsPanel() {
  return (
    <AssetGrid
      items={TRANS_LIST.map((tr) => ({ ...tr, thumb: "", type: "video" }))}
      onDragStart={(e, item) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: "overlay" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
    />
  );
}

export function EffectsPanel() {
  const items = useMemo(() =>
    EFX_CATS.map((ef) => ({
      ...ef, thumb: "", type: "video", dur: 3,
    })),
  []);
  return (
    <AssetGrid
      items={items}
      onDragStart={(e, item) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: "overlay", dur: 3 })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
    />
  );
}

export function LUTsPanel() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: "0 8px 8px" }}>
      {LUTS.map((l) => (
        <div key={l.id} style={{
          display: "flex", flexDirection: "column", borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
          background: "rgba(255,255,255,0.015)", overflow: "hidden",
          transition: "background 0.12s",
        }} className="cs-asset-card">
          <div style={{
            width: "100%", aspectRatio: "16/9",
            background: `linear-gradient(135deg, hsl(${l.id.charCodeAt(1) * 30}, 30%, 15%), hsl(${l.id.charCodeAt(2) * 40}, 25%, 8%))`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <span style={{
              fontSize: 10, color: "rgba(255,255,255,0.35)",
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
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{l.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ColorPanel() {
  const [v, setV] = useState({ temp: 0, tint: 0, sat: 0, exp: 0, cont: 0, hl: 0, sh: 0, vib: 0, hue: 0 });
  return (
    <div style={{ padding: "8px 10px" }}>
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
            fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 2,
          }}>
            <span>{s.label}</span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
              {v[s.k] > 0 ? "+" : ""}{v[s.k]}
            </span>
          </div>
          <Rng min={-100} max={100} val={v[s.k]} onChange={(e) => setV((x) => ({ ...x, [s.k]: +e.target.value }))} />
        </div>
      ))}
      <button style={{
        width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4, marginTop: 6,
        border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
        background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)",
        fontFamily: "inherit",
      }} className="cs-hover-soft">Reset All</button>
    </div>
  );
}

export function MotionPanel() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "0 8px 8px" }}>
      {MOTION_PRESETS.map((mp) => (
        <div key={mp.id} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 8px",
          borderRadius: 4, border: "1px solid rgba(255,255,255,0.04)",
          background: "rgba(255,255,255,0.015)", cursor: "pointer",
          transition: "background 0.12s",
        }} className="cs-asset-card">
          <div style={{
            width: 22, height: 22, borderRadius: 3,
            background: "rgba(59,130,246,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10,
          }}>↗</div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{mp.name}</span>
        </div>
      ))}
    </div>
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
              fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {ai.name}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
              {proc === ai.id ? "Processing..." : ai.desc}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function AssetsPanel() {
  const items = useMemo(() =>
    BRAND_ASSETS.map((a) => ({ ...a, type: a.type === "image" ? "image" : "video" })),
  []);
  return <AssetGrid items={items} />;
}

export function TemplatesPanel() {
  return (
    <AssetGrid
      items={TEMPLATES.map((t) => ({ ...t, type: "video" }))}
    />
  );
}

export function CaptionsPanel() {
  const [gen, setGen] = useState(false);
  return (
    <div style={{ padding: "8px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {[{ id: "c1", name: "Auto Detect", lang: "Auto", icon: "🌐" },
          { id: "c2", name: "Portuguese", lang: "PT-BR", icon: "🇧🇷" },
          { id: "c3", name: "English", lang: "EN", icon: "🇺🇸" },
          { id: "c4", name: "Spanish", lang: "ES", icon: "🇪🇸" },
        ].map((c) => (
          <button key={c.id} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4,
            border: "none", cursor: "pointer", background: "transparent", fontFamily: "inherit",
            width: "100%", textAlign: "left",
            borderBottom: "1px solid rgba(255,255,255,0.025)",
          }} className="cs-hover-soft">
            <span style={{ fontSize: 16 }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{c.name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{c.lang}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 8, paddingTop: 8 }}>
        <button onClick={() => { setGen(true); setTimeout(() => setGen(false), 2500); }}
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
              <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace", fontSize: 10 }}>{FMT(i * 2)}</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BrandPanel() {
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
          fontSize: 10, fontWeight: 700, color: "white", flexShrink: 0,
        }}>B</div>
        <div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>BRANPY Brand</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Active kit · 6 assets</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, marginBottom: 8 }}>
        {["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#ef4444"].map((c, i) => (
          <div key={i} style={{
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
      <button style={{
        width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
        background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)",
        fontFamily: "inherit",
      }} className="cs-hover-soft">Edit Brand Kit</button>
    </div>
  );
}

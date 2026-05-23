import React, { useState } from "react";
import { I, S, Rng, FMT, EFX_CATS, AI_TOOLS, LUTS } from "./utils";

const INSPECTOR_TABS = [
  { id: "transform", label: "Transform" },
  { id: "video", label: "Video" },
  { id: "audio", label: "Audio" },
  { id: "color", label: "Color" },
  { id: "effects", label: "Effects" },
  { id: "animation", label: "Animation" },
  { id: "ai", label: "AI" },
  { id: "captions", label: "Captions" },
  { id: "speed", label: "Speed" },
  { id: "keyframes", label: "Keyframes" },
];

function SliderRow({ label, value, min = -100, max = 100, step = 1, onChange, unit = "" }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 8, color: "rgba(255,255,255,0.18)", marginBottom: 2,
      }}>
        <span>{label}</span>
        <span style={{ color: "rgba(255,255,255,0.1)", fontFamily: "monospace" }}>
          {value > 0 ? "+" : ""}{value}{unit}
        </span>
      </div>
      <Rng min={min} max={max} step={step} val={value} onChange={onChange} />
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{
        fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.15)",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4,
        paddingBottom: 3, borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export default function Inspector({ clip, open, onToggle }) {
  const [tab, setTab] = useState("transform");
  const [keyframes, setKeyframes] = useState([]);
  const [kfTarget, setKfTarget] = useState("position");

  if (!clip) {
    return (
      <div style={{
        width: open ? 1 : 0, flexShrink: 0,
        borderLeft: open ? "1px solid rgba(255,255,255,0.05)" : "none",
        background: "#0d0d0d", display: "flex", flexDirection: "column", minHeight: 0,
        overflow: "hidden", transition: "width 0.15s, border 0.15s",
      }}>
        <div style={{
          height: 32, flexShrink: 0, display: "flex", alignItems: "center",
          padding: "0 8px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          justifyContent: "space-between",
        }}>
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)",
          }}>Inspector</span>
          <button onClick={onToggle}
            style={{
              padding: 3, border: "none", cursor: "pointer", background: "none",
              color: "rgba(255,255,255,0.12)", display: "flex", fontSize: 9,
              fontFamily: "inherit",
            }}
            className="cs-hover-soft"
          >{open ? "✕" : "◀"}</button>
        </div>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          opacity: open ? 1 : 0,
        }}>
          <div style={{ textAlign: "center", padding: "0 8px" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 6px",
            }}>
              <S d={I.lay} sz={13} style={{ color: "rgba(255,255,255,0.08)" }} />
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.1)" }}>Select a clip</div>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,0.06)", marginTop: 2 }}>Click on the timeline</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: open ? 240 : 0, flexShrink: 0,
      borderLeft: open ? "1px solid rgba(255,255,255,0.05)" : "none",
      background: "#0d0d0d", display: "flex", flexDirection: "column", minHeight: 0,
      overflow: "hidden", transition: "width 0.15s, border 0.15s",
      minWidth: open ? 240 : 0,
    }}>
      {/* Header */}
      <div style={{
        height: 32, flexShrink: 0, display: "flex", alignItems: "center",
        padding: "0 8px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)",
        }}>Inspector</span>
        <button onClick={onToggle}
          style={{
            padding: 3, border: "none", cursor: "pointer", background: "none",
            color: "rgba(255,255,255,0.12)", display: "flex", fontSize: 9,
            fontFamily: "inherit",
          }}
          className="cs-hover-soft"
        >✕</button>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)",
        overflowX: "auto", flexShrink: 0,
      }}>
        {INSPECTOR_TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: "0 0 auto", fontSize: 8, padding: "6px 8px",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap", position: "relative",
              background: tab === t.id ? "rgba(255,255,255,0.03)" : "transparent",
              color: tab === t.id ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)",
              transition: "color 0.1s, background 0.1s",
            }}
            className={tab !== t.id ? "cs-hover-soft" : ""}
          >
            {t.label}
            {tab === t.id && <div style={{
              position: "absolute", bottom: 0, left: "10%", right: "10%",
              height: 2, borderRadius: "1px 1px 0 0",
              background: "rgba(59,130,246,0.5)",
            }} />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden auto", padding: "8px 10px" }} className="cs-scrollbar">
        {/* Clip header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          paddingBottom: 6, marginBottom: 6,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 4,
            background: "rgba(255,255,255,0.04)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, flexShrink: 0,
          }}>
            {clip.t || "🎬"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clip.name}</div>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,0.1)", fontFamily: "monospace" }}>{FMT(clip.start)} — {FMT(clip.start + clip.duration)}</div>
          </div>
        </div>

        {tab === "transform" && (
          <>
            <Section label="Position">
              <SliderRow label="X" value={0} min={-2000} max={2000} />
              <SliderRow label="Y" value={0} min={-2000} max={2000} />
            </Section>
            <Section label="Scale & Rotate">
              <SliderRow label="Scale" value={100} min={1} max={500} unit="%" />
              <SliderRow label="Rotation" value={0} min={-180} max={180} unit="°" />
            </Section>
            <Section label="Opacity & Blur">
              <SliderRow label="Opacity" value={100} min={0} max={100} unit="%" />
              <SliderRow label="Blur" value={0} min={0} max={50} />
            </Section>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.15)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, paddingBottom: 3, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>Blend Mode</div>
              <select style={{
                width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 3, fontSize: 9, color: "rgba(255,255,255,0.35)", padding: "3px 6px",
                outline: "none", fontFamily: "inherit", cursor: "pointer",
              }}>
                {[{ v: "normal", l: "Normal" }, { v: "multiply", l: "Multiply" }, { v: "screen", l: "Screen" },
                  { v: "overlay", l: "Overlay" }, { v: "add", l: "Add" }].map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </select>
            </div>
            <Section label="Tools">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <button style={{ fontSize: 8, padding: "4px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", fontFamily: "inherit" }} className="cs-hover-soft">Chroma Key</button>
                <button style={{ fontSize: 8, padding: "4px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", fontFamily: "inherit" }} className="cs-hover-soft">Stabilize</button>
              </div>
            </Section>
          </>
        )}

        {tab === "video" && (
          <>
            <Section label="Color Correction">
              <SliderRow label="Exposure" value={0} />
              <SliderRow label="Contrast" value={0} />
              <SliderRow label="Highlights" value={0} />
              <SliderRow label="Shadows" value={0} />
            </Section>
            <Section label="Details">
              <SliderRow label="Sharpness" value={0} min={0} max={100} />
              <SliderRow label="Denoise" value={0} min={0} max={100} />
            </Section>
            <Section label="LUTs">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                {LUTS.slice(0, 6).map((l) => (
                  <button key={l.id} style={{
                    fontSize: 7, padding: "4px 4px", borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)",
                    fontFamily: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }} className="cs-hover-soft">{l.name}</button>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === "audio" && (
          <>
            <Section label="Volume">
              <SliderRow label="Volume" value={100} min={0} max={200} unit="%" />
              <SliderRow label="Fade In" value={0} min={0} max={5} unit="s" />
              <SliderRow label="Fade Out" value={0} min={0} max={5} unit="s" />
              <SliderRow label="Pan" value={0} min={-100} max={100} />
            </Section>
            <Section label="Equalizer">
              {[60, 200, 500, 2000, 8000, 16000].map((hz) => (
                <div key={hz} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 7, color: "rgba(255,255,255,0.1)", marginBottom: 2 }}>
                  <span style={{ width: 24, flexShrink: 0 }}>{hz < 1000 ? `${hz}Hz` : `${hz / 1000}k`}</span>
                  <Rng min={-12} max={12} val={0} />
                </div>
              ))}
            </Section>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, marginTop: 4 }}>
              <button style={{ fontSize: 8, padding: "4px 6px", borderRadius: 3, border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer", background: "rgba(239,68,68,0.06)", color: "rgba(239,68,68,0.5)", fontFamily: "inherit" }} className="cs-hover-soft">Denoise</button>
              <button style={{ fontSize: 8, padding: "4px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", fontFamily: "inherit" }} className="cs-hover-soft">Normalize</button>
            </div>
          </>
        )}

        {tab === "color" && (
          <>
            <Section label="Adjustments">
              <SliderRow label="Saturation" value={0} />
              <SliderRow label="Hue" value={0} />
              <SliderRow label="Temperature" value={0} min={-50} max={50} />
              <SliderRow label="Tint" value={0} min={-50} max={50} />
              <SliderRow label="Vibrance" value={0} />
            </Section>
            <Section label="Lighting">
              <SliderRow label="Whites" value={0} />
              <SliderRow label="Blacks" value={0} />
              <SliderRow label="Vignette" value={0} min={0} max={100} />
            </Section>
            <button style={{
              width: "100%", fontSize: 8, padding: "5px 8px", borderRadius: 3,
              border: "1px solid rgba(59,130,246,0.1)", cursor: "pointer",
              background: "rgba(59,130,246,0.08)", color: "rgba(59,130,246,0.5)",
              fontFamily: "inherit", marginTop: 4,
            }} className="cs-hover-soft">Auto Color Grade</button>
          </>
        )}

        {tab === "effects" && (
          <>
            <Section label="Apply Effect">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                {EFX_CATS.map((ef) => (
                  <button key={ef.id} style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "4px 6px",
                    borderRadius: 3, border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)",
                    fontSize: 8, fontFamily: "inherit",
                  }} className="cs-hover-soft">
                    <span style={{ fontSize: 10 }}>{ef.i}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ef.name}</span>
                  </button>
                ))}
              </div>
            </Section>
            <Section label="Speed Ramp">
              <SliderRow label="Speed" value={1} min={0.1} max={8} step={0.1} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4].map((s) => (
                  <button key={s} style={{
                    fontSize: 7, padding: "3px 4px", borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                    background: s === 1 ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
                    color: s === 1 ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.15)",
                    fontFamily: "inherit",
                  }} className={s !== 1 ? "cs-hover-soft" : ""}>{s}x</button>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === "animation" && (
          <>
            <Section label="Easing">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                {["Linear", "Ease In", "Ease Out", "Ease In Out", "Bounce", "Elastic"].map((e) => (
                  <button key={e} style={{
                    fontSize: 8, padding: "4px 6px", borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)",
                    fontFamily: "inherit",
                  }} className="cs-hover-soft">{e}</button>
                ))}
              </div>
            </Section>
            <Section label="Presets">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                {["Fade", "Slide Up", "Slide Down", "Slide L", "Slide R", "Scale", "Rotate", "Zoom", "Bounce"].map((a) => (
                  <button key={a} style={{
                    fontSize: 7, padding: "4px 4px", borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)",
                    fontFamily: "inherit",
                  }} className="cs-hover-soft">{a}</button>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === "ai" && (
          <Section label="AI Tools">
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {AI_TOOLS.slice(0, 8).map((ai) => (
                <button key={ai.id} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", borderRadius: 3,
                  border: "none", cursor: "pointer", background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "inherit",
                  textAlign: "left", width: "100%",
                }} className="cs-hover-soft">
                  <span style={{ fontSize: 10 }}>{ai.icon}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ai.name}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {tab === "captions" && (
          <Section label="Captions">
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[{ lang: "Auto Detect", icon: "🌐" }, { lang: "PT-BR", icon: "🇧🇷" }, { lang: "EN", icon: "🇺🇸" }].map((c) => (
                <button key={c.lang} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", borderRadius: 3,
                  border: "none", cursor: "pointer", background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "inherit",
                  textAlign: "left", width: "100%",
                }} className="cs-hover-soft">
                  <span style={{ fontSize: 10 }}>{c.icon}</span>
                  <span>{c.lang}</span>
                </button>
              ))}
            </div>
            <button style={{
              width: "100%", fontSize: 8, padding: "4px 6px", borderRadius: 3, marginTop: 4,
              border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
              background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", fontFamily: "inherit",
            }} className="cs-hover-soft">Generate Captions</button>
          </Section>
        )}

        {tab === "speed" && (
          <>
            <Section label="Speed">
              <SliderRow label="Speed" value={1} min={0.1} max={8} step={0.1} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, marginTop: 4 }}>
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4].map((s) => (
                  <button key={s} style={{
                    fontSize: 7, padding: "3px 4px", borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                    background: s === 1 ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
                    color: s === 1 ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.15)",
                    fontFamily: "inherit",
                  }} className={s !== 1 ? "cs-hover-soft" : ""}>{s}x</button>
                ))}
              </div>
            </Section>
            <Section label="Time Remap">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <button style={{ fontSize: 8, padding: "4px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", fontFamily: "inherit" }} className="cs-hover-soft">Reverse</button>
                <button style={{ fontSize: 8, padding: "4px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", fontFamily: "inherit" }} className="cs-hover-soft">Freeze Frame</button>
              </div>
            </Section>
          </>
        )}

        {tab === "keyframes" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>Keyframes</span>
              <button onClick={() => setKeyframes([...keyframes, { id: Date.now(), target: kfTarget, time: 0, value: 0 }])}
                style={{
                  fontSize: 8, padding: "2px 8px", borderRadius: 3, border: "none", cursor: "pointer",
                  background: "rgba(59,130,246,0.15)", color: "rgba(59,130,246,0.5)", fontFamily: "inherit",
                }}
                className="cs-hover-soft"
              >+ Add</button>
            </div>
            <div style={{ display: "flex", gap: 2, marginBottom: 4, flexWrap: "wrap" }}>
              {["position", "scale", "rotation", "opacity"].map((t) => (
                <button key={t} onClick={() => setKfTarget(t)}
                  style={{
                    fontSize: 7, padding: "2px 6px", borderRadius: 3, border: "none", cursor: "pointer",
                    background: kfTarget === t ? "rgba(255,255,255,0.08)" : "transparent",
                    color: kfTarget === t ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)",
                    fontFamily: "inherit",
                  }}
                >{t}</button>
              ))}
            </div>
            {keyframes.length === 0 && (
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.08)", textAlign: "center", padding: "8px 0" }}>
                No keyframes. Click "+ Add" to start.
              </div>
            )}
            {keyframes.map((kf) => (
              <div key={kf.id} style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "rgba(255,255,255,0.03)", borderRadius: 3,
                padding: "3px 6px", marginBottom: 2, fontSize: 8,
              }}>
                <span style={{ color: "rgba(255,255,255,0.25)", width: 40 }}>{kf.target}</span>
                <span style={{ color: "rgba(255,255,255,0.12)", width: 28, fontFamily: "monospace" }}>{FMT(kf.time)}</span>
                <input type="range" min={-100} max={100} value={kf.value}
                  onChange={(e) => setKeyframes(keyframes.map((k) => k.id === kf.id ? { ...k, value: +e.target.value } : k))}
                  style={{ flex: 1, height: 2, accentColor: "#3b82f6", cursor: "pointer" }}
                />
                <button onClick={() => setKeyframes(keyframes.filter((k) => k.id !== kf.id))}
                  style={{ padding: 2, border: "none", cursor: "pointer", background: "none", color: "rgba(239,68,68,0.3)", fontSize: 8, fontFamily: "inherit" }}
                >✕</button>
              </div>
            ))}
            {keyframes.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <select style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 3, fontSize: 8, color: "rgba(255,255,255,0.25)", padding: "2px 6px",
                  outline: "none", fontFamily: "inherit", cursor: "pointer",
                }}>
                  {["Linear", "Ease In", "Ease Out", "Ease In Out", "Bounce"].map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

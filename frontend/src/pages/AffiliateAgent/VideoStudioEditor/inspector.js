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
        fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 2,
      }}>
        <span>{label}</span>
        <span style={{ color: "rgba(255,255,255,0.38)", fontFamily: "monospace" }}>
          {value > 0 ? "+" : ""}{value}{unit}
        </span>
      </div>
      <Rng min={min} max={max} step={step} val={value} onChange={onChange} />
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)",
        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4,
        paddingBottom: 4, borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function applyClipEffect(clip, proj, setProj, effectData) {
  if (!clip?.trackId) return;
  setProj((prev) => ({
    ...prev,
    tracks: prev.tracks.map((t) =>
      t.id === clip.trackId
        ? { ...t, clips: t.clips.map((c) =>
            c.id === clip.id
              ? { ...c, effects: [...(c.effects || []), { id: Date.now().toString(36), ...effectData }] }
              : c
          ) }
        : t
    ),
  }));
}

function updateClipProp(clip, proj, setProj, updates) {
  if (!clip?.trackId) return;
  setProj((prev) => ({
    ...prev,
    tracks: prev.tracks.map((t) =>
      t.id === clip.trackId
        ? { ...t, clips: t.clips.map((c) => c.id === clip.id ? { ...c, ...updates } : c) }
        : t
    ),
  }));
}

export default function Inspector({ clip, open, onToggle, proj, setProj }) {
  const [tab, setTab] = useState("transform");
  const [keyframes, setKeyframes] = useState([]);
  const [kfTarget, setKfTarget] = useState("position");
  const [cutStart, setCutStart] = useState(clip ? clip.start : 0);
  const [cutEnd, setCutEnd] = useState(clip ? clip.start + clip.duration : 0);
  const [animStatus, setAnimStatus] = useState(null);

  useEffect(() => {
    if (clip) {
      setCutStart(clip.start);
      setCutEnd(clip.start + clip.duration);
    }
  }, [clip?.id, clip?.start, clip?.duration]);

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
            fontSize: 13, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)",
          }}>Inspector</span>
          <button onClick={onToggle}
            style={{
              padding: 3, border: "none", cursor: "pointer", background: "none",
              color: "rgba(255,255,255,0.4)", display: "flex", fontSize: 13,
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
              <S d={I.lay} sz={13} style={{ color: "rgba(255,255,255,0.12)" }} />
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Select a clip</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Click on the timeline</div>
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
      <div style={{
        height: 32, flexShrink: 0, display: "flex", alignItems: "center",
        padding: "0 8px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        justifyContent: "space-between",
      }}>
          <span style={{
            fontSize: 11, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)",
          }}>Inspector</span>
          <button onClick={onToggle}
            style={{
              padding: 3, border: "none", cursor: "pointer", background: "none",
              color: "rgba(255,255,255,0.3)", display: "flex", fontSize: 11,
              fontFamily: "inherit",
            }}
            className="cs-hover-soft"
          >✕</button>
      </div>

      <div style={{
        display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)",
        overflowX: "auto", flexShrink: 0,
      }}>
        {INSPECTOR_TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: "0 0 auto", fontSize: 13, padding: "6px 8px",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap", position: "relative",
              background: tab === t.id ? "rgba(255,255,255,0.03)" : "transparent",
              color: tab === t.id ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.35)",
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

      <div style={{ flex: 1, overflow: "hidden auto", padding: "8px 10px" }} className="cs-scrollbar">
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
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.78)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{clip.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{FMT(clip.start)} — {FMT(clip.start + clip.duration)}</div>
          </div>
        </div>

        {tab === "transform" && (
          <>
            <Section label="Position">
              <SliderRow label="X" value={clip.transform?.x || 0} min={-2000} max={2000} onChange={(e) => updateClipProp(clip, proj, setProj, { transform: { ...(clip.transform || {}), x: +e.target.value } })} />
              <SliderRow label="Y" value={clip.transform?.y || 0} min={-2000} max={2000} onChange={(e) => updateClipProp(clip, proj, setProj, { transform: { ...(clip.transform || {}), y: +e.target.value } })} />
            </Section>
            <Section label="Scale & Rotate">
              <SliderRow label="Scale" value={clip.transform?.scale || 100} min={1} max={500} unit="%" onChange={(e) => updateClipProp(clip, proj, setProj, { transform: { ...(clip.transform || {}), scale: +e.target.value } })} />
              <SliderRow label="Rotation" value={clip.transform?.rotation || 0} min={-180} max={180} unit="°" onChange={(e) => updateClipProp(clip, proj, setProj, { transform: { ...(clip.transform || {}), rotation: +e.target.value } })} />
            </Section>
            <Section label="Opacity & Blur">
              <SliderRow label="Opacity" value={clip.transform?.opacity ?? 100} min={0} max={100} unit="%" onChange={(e) => updateClipProp(clip, proj, setProj, { transform: { ...(clip.transform || {}), opacity: +e.target.value } })} />
              <SliderRow label="Blur" value={clip.transform?.blur || 0} min={0} max={50} onChange={(e) => updateClipProp(clip, proj, setProj, { transform: { ...(clip.transform || {}), blur: +e.target.value } })} />
            </Section>
            <div style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4,
                paddingBottom: 4, borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>Blend Mode</div>
              <select value={clip.transform?.blendMode || "normal"} onChange={(e) => updateClipProp(clip, proj, setProj, { transform: { ...(clip.transform || {}), blendMode: e.target.value } })}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 3, fontSize: 11, color: "rgba(255,255,255,0.5)", padding: "4px 6px",
                  outline: "none", fontFamily: "inherit", cursor: "pointer",
                }}
              >
                {[{ v: "normal", l: "Normal" }, { v: "multiply", l: "Multiply" }, { v: "screen", l: "Screen" },
                  { v: "overlay", l: "Overlay" }, { v: "add", l: "Add" }].map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </select>
            </div>
            <Section label="Cut">
              <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", width: 36 }}>Start:</span>
                <input type="number" min={0} max={clip.start + clip.duration} step={0.1} value={parseFloat(cutStart.toFixed(1))}
                  onChange={(e) => setCutStart(+e.target.value)}
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 3, padding: "2px 4px", fontSize: 11, color: "rgba(255,255,255,0.5)",
                    outline: "none", fontFamily: "monospace", width: 50,
                  }}
                />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", width: 36 }}>End:</span>
                <input type="number" min={cutStart + 0.3} max={proj.duration} step={0.1} value={parseFloat(cutEnd.toFixed(1))}
                  onChange={(e) => setCutEnd(+e.target.value)}
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 3, padding: "2px 4px", fontSize: 11, color: "rgba(255,255,255,0.5)",
                    outline: "none", fontFamily: "monospace", width: 50,
                  }}
                />
              </div>
              <button onClick={() => {
                const s = Math.max(0, Math.min(cutStart, clip.start + clip.duration - 0.3));
                const e = Math.max(s + 0.3, Math.min(cutEnd, proj.duration));
                if (e - s < 0.3) return;
                updateClipProp(clip, proj, setProj, { start: s, duration: e - s });
                setAnimStatus("cut");
                setTimeout(() => setAnimStatus(null), 1500);
              }}
                style={{
                  width: "100%", fontSize: 11, padding: "4px 8px", borderRadius: 3, border: "none",
                  cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
                  background: animStatus === "cut" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.12)",
                  color: animStatus === "cut" ? "rgba(16,185,129,0.6)" : "rgba(59,130,246,0.6)",
                }}
              >{animStatus === "cut" ? "✓ Cut applied" : "Apply Cut"}</button>
            </Section>
            <Section label="Tools">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <button onClick={() => applyClipEffect(clip, proj, setProj, { type: "chroma", name: "Chroma Key" })}
                  style={{
                    fontSize: 11, padding: "4px 6px", borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)",
                    fontFamily: "inherit",
                  }} className="cs-hover-soft">Chroma Key</button>
                <button onClick={() => applyClipEffect(clip, proj, setProj, { type: "shake", name: "Stabilize" })}
                  style={{
                    fontSize: 11, padding: "4px 6px", borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)",
                    fontFamily: "inherit",
                  }} className="cs-hover-soft">Stabilize</button>
              </div>
            </Section>
          </>
        )}

        {tab === "video" && (
          <>
            <Section label="Color Correction">
              <SliderRow label="Exposure" value={clip.colorAdj?.exposure || 0} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), exposure: +e.target.value } })} />
              <SliderRow label="Contrast" value={clip.colorAdj?.contrast || 0} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), contrast: +e.target.value } })} />
              <SliderRow label="Highlights" value={clip.colorAdj?.highlights || 0} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), highlights: +e.target.value } })} />
              <SliderRow label="Shadows" value={clip.colorAdj?.shadows || 0} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), shadows: +e.target.value } })} />
            </Section>
            <Section label="Details">
              <SliderRow label="Sharpness" value={clip.colorAdj?.sharpness || 0} min={0} max={100} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), sharpness: +e.target.value } })} />
              <SliderRow label="Denoise" value={clip.colorAdj?.denoise || 0} min={0} max={100} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), denoise: +e.target.value } })} />
            </Section>
            <Section label="LUTs">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                {LUTS.slice(0, 6).map((l) => (
                  <button key={l.id} onClick={() => applyClipEffect(clip, proj, setProj, { type: "luts", name: l.name, id: l.id })}
                    style={{
                      fontSize: 12, padding: "4px 4px", borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                      background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.55)",
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
              <SliderRow label="Volume" value={clip.audioAdj?.volume ?? 100} min={0} max={200} unit="%" onChange={(e) => updateClipProp(clip, proj, setProj, { audioAdj: { ...(clip.audioAdj || {}), volume: +e.target.value } })} />
              <SliderRow label="Fade In" value={clip.audioAdj?.fadeIn || 0} min={0} max={5} unit="s" onChange={(e) => updateClipProp(clip, proj, setProj, { audioAdj: { ...(clip.audioAdj || {}), fadeIn: +e.target.value } })} />
              <SliderRow label="Fade Out" value={clip.audioAdj?.fadeOut || 0} min={0} max={5} unit="s" onChange={(e) => updateClipProp(clip, proj, setProj, { audioAdj: { ...(clip.audioAdj || {}), fadeOut: +e.target.value } })} />
              <SliderRow label="Pan" value={clip.audioAdj?.pan || 0} min={-100} max={100} onChange={(e) => updateClipProp(clip, proj, setProj, { audioAdj: { ...(clip.audioAdj || {}), pan: +e.target.value } })} />
            </Section>
            <Section label="Equalizer">
              {[60, 200, 500, 2000, 8000, 16000].map((hz) => {
                const key = `eq${hz}`;
                return (
                  <div key={hz} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 12, color: "rgba(255,255,255,0.42)", marginBottom: 2,
                  }}>
                    <span style={{ width: 28, flexShrink: 0 }}>{hz < 1000 ? `${hz}Hz` : `${hz / 1000}k`}</span>
                    <Rng min={-12} max={12} val={clip.audioAdj?.[key] || 0} onChange={(e) => updateClipProp(clip, proj, setProj, { audioAdj: { ...(clip.audioAdj || {}), [key]: +e.target.value } })} />
                  </div>
                );
              })}
            </Section>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, marginTop: 4 }}>
              <button onClick={() => applyClipEffect(clip, proj, setProj, { type: "denoise", name: "Denoise" })}
                style={{
                  fontSize: 11, padding: "4px 6px", borderRadius: 3,
                  border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer",
                  background: "rgba(239,68,68,0.06)", color: "rgba(239,68,68,0.6)",
                  fontFamily: "inherit",
                }} className="cs-hover-soft">Denoise</button>
              <button onClick={() => { const v = clip.audioAdj?.volume || 100; updateClipProp(clip, proj, setProj, { audioAdj: { ...(clip.audioAdj || {}), normalized: true } }); }}
                style={{
                  fontSize: 11, padding: "4px 6px", borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                  background: clip.audioAdj?.normalized ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                  color: clip.audioAdj?.normalized ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.45)",
                  fontFamily: "inherit",
                }} className="cs-hover-soft">{clip.audioAdj?.normalized ? "✓ Normalized" : "Normalize"}</button>
            </div>
          </>
        )}

        {tab === "color" && (
          <>
            <Section label="Adjustments">
              <SliderRow label="Saturation" value={clip.colorAdj?.saturation || 0} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), saturation: +e.target.value } })} />
              <SliderRow label="Hue" value={clip.colorAdj?.hue || 0} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), hue: +e.target.value } })} />
              <SliderRow label="Temperature" value={clip.colorAdj?.temperature || 0} min={-50} max={50} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), temperature: +e.target.value } })} />
              <SliderRow label="Tint" value={clip.colorAdj?.tint || 0} min={-50} max={50} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), tint: +e.target.value } })} />
              <SliderRow label="Vibrance" value={clip.colorAdj?.vibrance || 0} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), vibrance: +e.target.value } })} />
            </Section>
            <Section label="Lighting">
              <SliderRow label="Whites" value={clip.colorAdj?.whites || 0} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), whites: +e.target.value } })} />
              <SliderRow label="Blacks" value={clip.colorAdj?.blacks || 0} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), blacks: +e.target.value } })} />
              <SliderRow label="Vignette" value={clip.colorAdj?.vignette || 0} min={0} max={100} onChange={(e) => updateClipProp(clip, proj, setProj, { colorAdj: { ...(clip.colorAdj || {}), vignette: +e.target.value } })} />
            </Section>
            <button onClick={() => {
              applyClipEffect(clip, proj, setProj, { type: "autoColor", name: "Auto Color Grade" });
              setAnimStatus("color");
              setTimeout(() => setAnimStatus(null), 1500);
            }}
              style={{
                width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 3,
                border: "1px solid rgba(59,130,246,0.1)", cursor: "pointer",
                background: animStatus === "color" ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.08)",
                color: animStatus === "color" ? "rgba(16,185,129,0.6)" : "rgba(59,130,246,0.6)",
                fontFamily: "inherit", marginTop: 4,
              }} className="cs-hover-soft">{animStatus === "color" ? "✓ Applied" : "Auto Color Grade"}</button>
          </>
        )}

        {tab === "effects" && (
          <>
            <Section label="Apply Effect">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                {EFX_CATS.map((ef) => (
                  <button key={ef.id} onClick={() => applyClipEffect(clip, proj, setProj, { type: ef.cat || ef.id, name: ef.name, id: ef.id })}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "4px 6px",
                      borderRadius: 3, border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                      background: (clip.effects || []).some((e) => (e.id || e.type) === ef.id) ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
                      color: (clip.effects || []).some((e) => (e.id || e.type) === ef.id) ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.45)",
                      fontSize: 11, fontFamily: "inherit",
                    }} className="cs-hover-soft">
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{ef.cat === "blur" ? "🌫️" : ef.cat === "glow" ? "✨" : ef.cat === "vhs" ? "📼" : ef.cat === "glitch" ? "💥" : "🎨"}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ef.name}</span>
                  </button>
                ))}
              </div>
            </Section>
            <Section label="Applied">
              {(clip.effects || []).length === 0 ? (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "4px 0" }}>No effects applied</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {(clip.effects || []).map((ef, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "rgba(255,255,255,0.03)", borderRadius: 3, padding: "2px 6px",
                      fontSize: 11, color: "rgba(255,255,255,0.5)",
                    }}>
                      <span>{(ef.asset?.name || ef.name || ef.type || "fx")}</span>
                      <button onClick={() => updateClipProp(clip, proj, setProj, { effects: (clip.effects || []).filter((_, j) => j !== i) })}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.5)", fontSize: 11, fontFamily: "inherit", padding: 0 }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
            <Section label="Speed Ramp">
              <SliderRow label="Speed" value={clip.speed ?? 1} min={0.1} max={8} step={0.1} onChange={(e) => updateClipProp(clip, proj, setProj, { speed: +e.target.value })} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, marginTop: 2 }}>
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4].map((s) => (
                  <button key={s} onClick={() => updateClipProp(clip, proj, setProj, { speed: s })}
                    style={{
                      fontSize: 11, padding: "3px 4px", borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                      background: (clip.speed || 1) === s ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
                      color: (clip.speed || 1) === s ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.38)",
                      fontFamily: "inherit",
                    }} className={(clip.speed || 1) !== s ? "cs-hover-soft" : ""}>{s}x</button>
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
                  <button key={e} onClick={() => updateClipProp(clip, proj, setProj, { easing: e.toLowerCase().replace(" ", "") })}
                    style={{
                      fontSize: 11, padding: "4px 6px", borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                      background: (clip.easing || "").toLowerCase() === e.toLowerCase().replace(" ", "") ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
                      color: (clip.easing || "").toLowerCase() === e.toLowerCase().replace(" ", "") ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.45)",
                      fontFamily: "inherit",
                    }} className="cs-hover-soft">{e}</button>
                ))}
              </div>
            </Section>
            <Section label="Presets">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                {["Fade", "Slide Up", "Slide Down", "Slide L", "Slide R", "Scale", "Rotate", "Zoom", "Bounce"].map((a) => (
                  <button key={a} onClick={() => applyClipEffect(clip, proj, setProj, { type: "animation", name: a, id: a.toLowerCase().replace(" ", "") })}
                    style={{
                      fontSize: 11, padding: "4px 4px", borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                      background: (clip.effects || []).some((e) => (e.name || e.id) === a) ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
                      color: (clip.effects || []).some((e) => (e.name || e.id) === a) ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.45)",
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
                  color: "rgba(255,255,255,0.45)", fontSize: 11, fontFamily: "inherit",
                  textAlign: "left", width: "100%",
                }} className="cs-hover-soft">
                  <span style={{ fontSize: 12 }}>{ai.icon}</span>
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
                color: "rgba(255,255,255,0.45)", fontSize: 11, fontFamily: "inherit",
                  textAlign: "left", width: "100%",
                }} className="cs-hover-soft">
                  <span style={{ fontSize: 12 }}>{c.icon}</span>
                  <span>{c.lang}</span>
                </button>
              ))}
            </div>
            <button style={{
              width: "100%", fontSize: 11, padding: "4px 6px", borderRadius: 3, marginTop: 4,
              border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
              background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", fontFamily: "inherit",
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
                    fontSize: 11, padding: "3px 4px", borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                    background: s === 1 ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
                    color: s === 1 ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.38)",
                    fontFamily: "inherit",
                  }} className={s !== 1 ? "cs-hover-soft" : ""}>{s}x</button>
                ))}
              </div>
            </Section>
            <Section label="Time Remap">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <button style={{
                  fontSize: 11, padding: "4px 6px", borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                  background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)",
                  fontFamily: "inherit",
                }} className="cs-hover-soft">Reverse</button>
                <button style={{
                  fontSize: 11, padding: "4px 6px", borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                  background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)",
                  fontFamily: "inherit",
                }} className="cs-hover-soft">Freeze Frame</button>
              </div>
            </Section>
          </>
        )}

        {tab === "keyframes" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Keyframes</span>
              <button onClick={() => setKeyframes([...keyframes, { id: Date.now(), target: kfTarget, time: 0, value: 0 }])}
                style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 3, border: "none", cursor: "pointer",
                  background: "rgba(59,130,246,0.15)", color: "rgba(59,130,246,0.6)", fontFamily: "inherit",
                }}
                className="cs-hover-soft"
              >+ Add</button>
            </div>
            <div style={{ display: "flex", gap: 2, marginBottom: 4, flexWrap: "wrap" }}>
              {["position", "scale", "rotation", "opacity"].map((t) => (
                <button key={t} onClick={() => setKfTarget(t)}
                  style={{
                    fontSize: 12, padding: "2px 6px", borderRadius: 3, border: "none", cursor: "pointer",
                    background: kfTarget === t ? "rgba(255,255,255,0.08)" : "transparent",
                    color: kfTarget === t ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)",
                    fontFamily: "inherit",
                  }}
                >{t}</button>
              ))}
            </div>
            {keyframes.length === 0 && (
              <div style={{
                fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center", padding: "8px 0",
              }}>
                No keyframes. Click "+ Add" to start.
              </div>
            )}
            {keyframes.map((kf) => (
              <div key={kf.id} style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "rgba(255,255,255,0.03)", borderRadius: 3,
                padding: "3px 6px", marginBottom: 2, fontSize: 11,
              }}>
                <span style={{ color: "rgba(255,255,255,0.45)", width: 44 }}>{kf.target}</span>
                <span style={{ color: "rgba(255,255,255,0.3)", width: 32, fontFamily: "monospace" }}>{FMT(kf.time)}</span>
                <input type="range" min={-100} max={100} value={kf.value}
                  onChange={(e) => setKeyframes(keyframes.map((k) => k.id === kf.id ? { ...k, value: +e.target.value } : k))}
                  style={{ flex: 1, height: 2, accentColor: "#3b82f6", cursor: "pointer" }}
                />
                <button onClick={() => setKeyframes(keyframes.filter((k) => k.id !== kf.id))}
                  style={{
                    padding: 2, border: "none", cursor: "pointer", background: "none",
                    color: "rgba(239,68,68,0.5)", fontSize: 11, fontFamily: "inherit",
                  }}
                >✕</button>
              </div>
            ))}
            {keyframes.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <select style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 3, fontSize: 11, color: "rgba(255,255,255,0.45)", padding: "2px 6px",
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

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { I, S, Bi, FMT, SIDEBAR_MAP, INITIAL, UID, Tp } from "./utils";
import Timeline from "./timeline";
import PreviewPanel from "./preview";
import Inspector from "./inspector";
import ExportModal from "./exportModal";
import BrandMemoryPanel from "./brandMemory";
import {
  SideTab, MediaPanel, AudioPanel, TextPanel, StickerPanel,
  TransitionsPanel, EffectsPanel, LUTsPanel, ColorPanel,
  MotionPanel, BackgroundsPanel, VoicePanel, AIPanel, AssetsPanel,
  TemplatesPanel, SlidesPanel, CaptionsPanel, BrandPanel
} from "./panels";

const WORKSPACES = [
  { id: "edit", label: "Edit", icon: I.cut },
  { id: "color", label: "Color", icon: I.adj },
  { id: "audio", label: "Audio", icon: I.music },
  { id: "motion", label: "Motion", icon: I.board },
  { id: "ai", label: "AI Edit", icon: I.ai },
  { id: "vertical", label: "Vertical", icon: I.fit },
  { id: "stream", label: "Streaming", icon: I.tool },
];

function TopBar({ proj, setProj, ct, dur, onImp, onExp, onMem, workspace, setWorkspace, setSTab }) {
  const [ed, setEd] = useState(false);
  const [nv, setNv] = useState(proj.name);
  const [sv, setSv] = useState(true);
  const [showFps, setShowFps] = useState(false);
  const [showRes, setShowRes] = useState(false);
  const [undoWip, setUndoWip] = useState(false);
  const [redoWip, setRedoWip] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (ed) ref.current?.focus(); }, [ed]);
  useEffect(() => { if (!sv) { const t = setTimeout(() => setSv(true), 600); return () => clearTimeout(t); } }, [sv]);
  useEffect(() => { const h = () => { setShowFps(false); setShowRes(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const sub = () => { if (nv.trim()) setProj((p) => ({ ...p, name: nv.trim() })); setEd(false); };
  const onWorkspace = (wid) => {
    setWorkspace(wid);
    if (wid === "edit") setSTab("media");
    else if (wid === "color") setSTab("color");
    else if (wid === "audio") setSTab("audio");
    else if (wid === "motion") setSTab("motion");
    else if (wid === "ai") setSTab("ai");
  };
  const fpsOpts = [24, 30, 60];
  const resOpts = [
    { label: "1080p", w: 1920, h: 1080 }, { label: "2K", w: 2560, h: 1440 },
    { label: "4K", w: 3840, h: 2160 }, { label: "720p", w: 1280, h: 720 },
    { label: "Vertical", w: 1080, h: 1920 },
  ];

  return (
    <div style={{
      height: 40, flexShrink: 0, background: "#0c0c0c",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      display: "flex", alignItems: "center", padding: "0 8px", gap: 4,
      zIndex: 40, userSelect: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 4,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <S d={I.play} sz={10} style={{ color: "white", marginLeft: 1 }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.82)", letterSpacing: "0.03em" }}>BRANPY</span>
      </div>
      <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.06)" }} />
      {ed ? (
        <input ref={ref} value={nv} onChange={(e) => setNv(e.target.value)}
          onBlur={sub} onKeyDown={(e) => e.key === "Enter" && sub()}
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 4, padding: "2px 8px", fontSize: 14, color: "rgba(255,255,255,0.7)",
            outline: "none", width: 120,
          }} autoFocus
        />
      ) : (
        <button onClick={() => setEd(true)}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "2px 8px",
            borderRadius: 4, border: "none", background: "none", cursor: "pointer",
            fontSize: 14, color: "rgba(255,255,255,0.65)",
          }}
          className="cs-hover-soft"
        >
          <S d={I.lay} sz={11} />
          <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.name}</span>
          <S d={I.chD} sz={10} />
        </button>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: sv ? "rgba(16,185,129,0.4)" : "rgba(251,191,36,0.5)", transition: "background 0.3s" }} />
        <span style={{ color: sv ? "rgba(16,185,129,0.65)" : "rgba(251,191,36,0.75)" }}>{sv ? "Saved" : "Saving..."}</span>
      </div>
      <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.06)", margin: "0 4px" }} />
      <Tp text={undoWip ? "✓ Em desenvolvimento" : "Undo"} ch={<button onClick={() => { setUndoWip(true); setTimeout(() => setUndoWip(false), 1500); }}
        style={{ padding: 4, borderRadius: 3, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.32)", display: "flex", fontFamily: "inherit" }}
        className="cs-hover-soft"><S d={I.undo} sz={12} /></button>} />
      <Tp text={redoWip ? "✓ Em desenvolvimento" : "Redo"} ch={<button onClick={() => { setRedoWip(true); setTimeout(() => setRedoWip(false), 1500); }}
        style={{ padding: 4, borderRadius: 3, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.32)", display: "flex", fontFamily: "inherit" }}
        className="cs-hover-soft"><S d={I.redo} sz={12} /></button>} />

      <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.06)", margin: "0 4px" }} />
      {WORKSPACES.map((ws) => (
        <button key={ws.id} onClick={() => onWorkspace(ws.id)}
          style={{
            display: "flex", alignItems: "center", gap: 3, padding: "3px 8px",
            borderRadius: 4, fontSize: 12, border: "none", cursor: "pointer",
            background: workspace === ws.id ? "rgba(59,130,246,0.12)" : "transparent",
            color: workspace === ws.id ? "rgba(59,130,246,0.7)" : "rgba(255,255,255,0.42)",
            fontFamily: "inherit", whiteSpace: "nowrap",
          }}
          className={workspace !== ws.id ? "cs-hover-soft" : ""}
        >
          <S d={ws.icon} sz={10} />
          <span>{ws.label}</span>
        </button>
      ))}

      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 4, padding: "2px 8px" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "monospace", fontWeight: 500 }}>{FMT(ct)}</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>/</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "monospace", fontWeight: 500 }}>{FMT(dur)}</span>
      </div>
      <div style={{ position: "relative" }}>
        <button onClick={(e) => { e.stopPropagation(); setShowFps(!showFps); setShowRes(false); }}
          style={{
            display: "flex", alignItems: "center", gap: 3,
            background: "rgba(255,255,255,0.03)", borderRadius: 4,
            padding: "2px 6px", fontSize: 12, color: "rgba(255,255,255,0.45)",
            border: "none", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span>{proj.fps}fps</span>
          <S d={I.chD} sz={8} />
        </button>
        {showFps && (
          <div style={{
            position: "absolute", top: "100%", right: 0, marginTop: 4,
            background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4, zIndex: 100, minWidth: 70, overflow: "hidden",
          }}>
            {fpsOpts.map((f) => (
              <div key={f} onClick={(e) => { e.stopPropagation(); setProj((p) => ({ ...p, fps: f })); setShowFps(false); }}
                style={{
                  padding: "4px 10px", fontSize: 12, cursor: "pointer",
                  background: proj.fps === f ? "rgba(59,130,246,0.12)" : "transparent",
                  color: proj.fps === f ? "rgba(59,130,246,0.65)" : "rgba(255,255,255,0.55)",
                }}
                className="cs-hover-soft"
              >{f}fps</div>
            ))}
          </div>
        )}
      </div>
      <div style={{ position: "relative" }}>
        <button onClick={(e) => { e.stopPropagation(); setShowRes(!showRes); setShowFps(false); }}
          style={{
            display: "flex", alignItems: "center", gap: 3,
            background: "rgba(255,255,255,0.03)", borderRadius: 4,
            padding: "2px 6px", fontSize: 12, color: "rgba(255,255,255,0.45)",
            border: "none", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span>{proj.width >= 3800 ? "4K" : proj.width >= 2500 ? "2K" : proj.width === 1920 && proj.height === 1080 ? "1080p" : proj.width === 1080 && proj.height === 1920 ? "Vertical" : proj.width >= 1900 ? "1080p" : "720p"}</span>
          <S d={I.chD} sz={8} />
        </button>
        {showRes && (
          <div style={{
            position: "absolute", top: "100%", right: 0, marginTop: 4,
            background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4, zIndex: 100, minWidth: 90, overflow: "hidden",
          }}>
            {resOpts.map((r) => (
              <div key={r.label} onClick={(e) => { e.stopPropagation(); setProj((p) => ({ ...p, width: r.w, height: r.h })); setShowRes(false); }}
                style={{
                  padding: "4px 10px", fontSize: 12, cursor: "pointer",
                  background: proj.width === r.w && proj.height === r.h ? "rgba(59,130,246,0.12)" : "transparent",
                  color: proj.width === r.w && proj.height === r.h ? "rgba(59,130,246,0.65)" : "rgba(255,255,255,0.55)",
                }}
                className="cs-hover-soft"
              >{r.label} <span style={{ opacity: 0.4 }}>({r.w}×{r.h})</span></div>
            ))}
          </div>
        )}
      </div>
      <button onClick={onMem}
        style={{
          display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 4,
          fontSize: 12, border: "none", cursor: "pointer", fontFamily: "inherit",
          background: "rgba(139,92,246,0.15)", color: "rgba(167,139,250,0.7)",
        }}
        className="cs-hover-soft"
      >
        <S d={I.memory} sz={10} /> Memory
      </button>
      <button onClick={onImp}
        style={{
          display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 4,
          fontSize: 12, border: "none", cursor: "pointer", fontFamily: "inherit",
          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)",
        }}
        className="cs-hover-soft"
      >
        <S d={I.imp} sz={10} />Import
      </button>
      <button onClick={onExp}
        style={{
          display: "flex", alignItems: "center", gap: 3, padding: "3px 10px", borderRadius: 4,
          fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit",
          background: "rgba(59,130,246,0.7)", color: "white",
        }}
        className="cs-hover-soft"
      >
        <S d={I.exp} sz={10} />Export
      </button>
    </div>
  );
}

const PANEL_LABELS = {
  media: "Media", audio: "Audio", text: "Text", sticker: "Stickers",
  transitions: "Transitions", effects: "Effects", luts: "LUTs", color: "Color",
  motion: "Motion", backgrounds: "Backgrounds", voice: "Voice",
  ai: "AI Tools", assets: "Assets", templates: "Templates",
  slides: "Slides", captions: "Captions", brand: "Brand Kit", memory: "Brand Memory",
};

function LeftPanel({ tab, imm, onImp, fRef, onMDrag, onClickItem }) {
  const panel = (() => {
    switch (tab) {
      case "media": return <MediaPanel imm={imm} onImp={onImp} fRef={fRef} onMDrag={onMDrag} onClickItem={onClickItem} />;
      case "audio": return <AudioPanel onClickItem={onClickItem} />;
      case "text": return <TextPanel onClickItem={onClickItem} />;
      case "sticker": return <StickerPanel onClickItem={onClickItem} />;
      case "transitions": return <TransitionsPanel onClickItem={onClickItem} />;
      case "effects": return <EffectsPanel onClickItem={onClickItem} />;
      case "luts": return <LUTsPanel onClickItem={onClickItem} />;
      case "color": return <ColorPanel onClickItem={onClickItem} />;
      case "motion": return <MotionPanel onClickItem={onClickItem} />;
      case "backgrounds": return <BackgroundsPanel onClickItem={onClickItem} />;
      case "voice": return <VoicePanel onClickItem={onClickItem} />;
      case "ai": return <AIPanel />;
      case "assets": return <AssetsPanel onClickItem={onClickItem} />;
      case "templates": return <TemplatesPanel onClickItem={onClickItem} />;
      case "slides": return <SlidesPanel onClickItem={onClickItem} />;
      case "captions": return <CaptionsPanel onClickItem={onClickItem} />;
      case "brand": return <BrandPanel onClickItem={onClickItem} />;
      default: return null;
    }
  })();

  return (
    <div style={{
      width: 240, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)",
      background: "#0d0d0d", display: "flex", flexDirection: "column", minHeight: 0,
    }}>
      <div style={{
        height: 32, flexShrink: 0, display: "flex", alignItems: "center",
        padding: "0 12px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        fontSize: 13, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)",
      }}>
        {PANEL_LABELS[tab] || "Tools"}
      </div>
      <div style={{ flex: 1, overflow: "hidden auto" }} className="cs-scrollbar">
        {panel}
      </div>
    </div>
  );
}

export default function VideoStudioEditor() {
  const [proj, setProj] = useState(INITIAL);
  const [ct, setCt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [vol, setVol] = useState(80);
  const [sel, setSel] = useState(null);
  const [sTab, setSTab] = useState("media");
  const [imm, setImm] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [memories, setMemories] = useLocalStorage("branpy_memories", []);
  const [showMemories, setShowMemories] = useState(false);
  const [workspace, setWorkspace] = useState("edit");
  const [panelOpen, setPanelOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const fRef = useRef(null);
  const piRef = useRef(null);

  // Save/load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("branpy_project");
      if (saved) {
        const parsed = JSON.parse(saved);
        setProj(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("branpy_project", JSON.stringify(proj));
    } catch {}
  }, [proj]);

  const handleNewProject = useCallback(() => {
    setProj(INITIAL);
    setImm([]);
    setCt(0);
    setSel(null);
    setPlaying(false);
    try { localStorage.removeItem("branpy_project"); } catch {}
  }, []);

  // Playback is handled by PreviewPanel via requestAnimationFrame

  const handleImp = useCallback((files) => {
    const items = Array.from(files).map((f, i) => ({
      id: UID() + i, name: f.name,
      type: f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "audio" : "image",
      file: f, url: URL.createObjectURL(f), dur: 5 + (i % 3) * 2,
    }));
    setImm((prev) => [...prev, ...items]);
  }, []);

  const handleMDrag = useCallback((e, item) => {
    try { e.dataTransfer.setData("application/json", JSON.stringify(item)); e.dataTransfer.effectAllowed = "copy"; } catch {}
  }, []);

  const handleAssetAction = useCallback((asset) => {
    if (!asset) return;
    const type = asset.type || "overlay";
    const fxTypes = ["overlay", "luts", "colorPreset", "colorAdjust", "motion", "brandColor", "voice"];
    const mediaTypes = ["video", "image", "audio", "text", "sticker", "background", "slide", "template"];
    if (sel && fxTypes.includes(type)) {
      setProj((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === sel.id
              ? { ...c, effects: [...(c.effects || []), { id: UID(), ...asset }] }
              : c
          ),
        })),
      }));
    } else {
      let trackId = "o1";
      if (type === "audio" || type === "voice" || type === "tts") trackId = "a2";
      else if (type === "text" || type === "captionStyle" || type === "captionLang") trackId = "t1";
      else if (type === "sticker") trackId = "s1";
      else if (type === "background" || type === "slide" || type === "template") trackId = "o1";
      else if (type === "video" || type === "image") trackId = "v2";
      const dur = asset.dur || (type === "background" ? 5 : 3);
      const newClip = {
        id: UID(), name: asset.name || asset.id || "Asset",
        start: ct, duration: dur, type: type,
        t: asset.e || asset.name?.[0] || "A",
        url: asset.url || null,
        src: asset.src || null,
        file: asset.file || null,
        effects: !mediaTypes.includes(type) ? [{ id: UID(), ...asset }] : [],
      };
      setProj((prev) => ({
        ...prev,
        duration: Math.max(prev.duration, ct + dur),
        tracks: prev.tracks.map((t) =>
          t.id === trackId
            ? { ...t, clips: [...t.clips, newClip].sort((a, b) => a.start - b.start) }
            : t
        ),
      }));
    }
  }, [sel, ct]);

  const handleApplyMemory = useCallback((mem) => {
    const memClip = {
      id: UID(), name: `🧠 ${mem.name}`, start: ct,
      duration: 3, type: "overlay", t: "🧠",
    };
    setProj((prev) => ({
      ...prev,
      duration: Math.max(prev.duration, ct + 3),
      tracks: prev.tracks.map((t) =>
        t.id === "o1"
          ? { ...t, clips: [...t.clips, memClip].sort((a, b) => a.start - b.start) }
          : t
      ),
    }));
  }, [ct]);

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      background: "#0a0a0a", color: "white", overflow: "hidden", userSelect: "none",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      <TopBar
        proj={proj} setProj={setProj}
        ct={ct} dur={proj.duration}
        onImp={() => fRef.current?.click()}
        onExp={() => setShowExport(true)}
        onMem={() => { setShowMemories(true); if (sTab !== "memory") setSTab("memory"); if (!panelOpen) setPanelOpen(true); }}
        workspace={workspace}
        setWorkspace={setWorkspace}
        setSTab={setSTab}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div style={{
          width: 40, flexShrink: 0, background: "#090909",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex", flexDirection: "column", paddingTop: 2,
        }}>
          {SIDEBAR_MAP.map(([id, icon]) => (
            <SideTab
              key={id}
              icon={icon}
              label={id}
              active={sTab === id}
              onClick={() => {
                if (sTab === id && panelOpen) { setPanelOpen(false); return; }
                setSTab(id);
                setShowMemories(false);
                if (!panelOpen) setPanelOpen(true);
              }}
            />
          ))}
        </div>

        {panelOpen && (
          sTab === "memory" && showMemories ? (
            <div style={{
              width: 240, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)",
              background: "#0d0d0d", display: "flex", flexDirection: "column", minHeight: 0,
            }}>
              <div style={{
                height: 32, flexShrink: 0, display: "flex", alignItems: "center",
                padding: "0 12px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: 13, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.12em", color: "rgba(255,255,255,0.42)",
              }}>
                Brand Memory
              </div>
              <div style={{ flex: 1, overflow: "hidden auto" }} className="cs-scrollbar">
                <BrandMemoryPanel
                  memories={memories}
                  setMemories={setMemories}
                  onApplyMemory={handleApplyMemory}
                />
              </div>
            </div>
          ) : (
            <LeftPanel tab={sTab} imm={imm} onImp={handleImp} fRef={fRef} onMDrag={handleMDrag} onClickItem={handleAssetAction} />
          )
        )}

        <PreviewPanel
          playing={playing}
          setPlaying={setPlaying}
          ct={ct}
          setCt={setCt}
          proj={proj}
          vol={vol}
          setVol={setVol}
        />

        <Inspector clip={sel} open={inspectorOpen} onToggle={() => setInspectorOpen(!inspectorOpen)} proj={proj} setProj={setProj} />
      </div>

      <Timeline
        proj={proj}
        setProj={setProj}
        ct={ct}
        setCt={setCt}
        zoom={zoom}
        setZoom={setZoom}
        playing={playing}
        setPlaying={setPlaying}
        sel={sel}
        setSel={setSel}
      />

      <input
        ref={fRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files.length) { handleImp(e.target.files); e.target.value = ""; }
        }}
      />

      <ExportModal open={showExport} onClose={() => setShowExport(false)} proj={proj} />

      <style>{`
        .cs-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .cs-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .cs-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
        .cs-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        .cs-hover-soft:hover { background: rgba(255,255,255,0.06) !important; }
        .cs-hover-item:hover { background: rgba(255,255,255,0.03); }
        .cs-bi-btn:hover { background: rgba(255,255,255,0.1) !important; color: rgba(255,255,255,0.55) !important; }
        .cs-tooltip { display: none; }
        [class*="group"]:hover .cs-tooltip { display: block; }
        .cs-ruler-tick { position: absolute; top: 0; height: 8px; width: 1px; background: rgba(255,255,255,0.06); }
        .cs-ruler-label { position: absolute; font-size: 11px; color: rgba(255,255,255,0.35); top: 8px; margin-left: 4px; font-family: monospace; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; cursor: pointer; border: 2px solid rgba(255,255,255,0.1); }
        input[type="range"]::-webkit-slider-runnable-track { height: 3px; background: rgba(255,255,255,0.06); border-radius: 999px; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

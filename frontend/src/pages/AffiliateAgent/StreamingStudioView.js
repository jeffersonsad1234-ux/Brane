import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const scenes = [
  { id: "main", name: "Main Scene", icon: "🎬" },
  { id: "brb", name: "BRB Scene", icon: "⏸️" },
  { id: "end", name: "End Scene", icon: "🔚" },
];

const sourceDefs = [
  { id: "camera", name: "Camera", icon: "📷" },
  { id: "screen", name: "Screen Share", icon: "🖥️" },
  { id: "overlay", name: "Overlay", icon: "✨" },
  { id: "chat", name: "Chat", icon: "💬" },
];

const audioChannels = [
  { id: "desktop", name: "Desktop Audio", icon: "🔊", color: "#3b82f6" },
  { id: "mic", name: "Mic", icon: "🎤", color: "#22c55e" },
  { id: "music", name: "Music", icon: "🎵", color: "#f59e0b" },
];

const chatUsers = ["BranBot", "StreamFan42", "PixelQueen", "DevJoe", "CryptoWizard"];
const chatMessages = [
  "Hello from Brazil! 🇧🇷",
  "Great stream today!",
  "BRANPY ecosystem is 🔥",
  "How do I get started?",
  "Loving the content!",
  "Just joined — what is this?",
  "Check out the new features!",
];

function VUMeter({ level, color }) {
  const bars = 12;
  return (
    <div className="flex items-end gap-[2px] h-4">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ height: `${Math.min(100, Math.max(4, level * (i / bars) * 1.8 + (Math.random() - 0.5) * 10))}%` }}
          transition={{ duration: 0.08 + Math.random() * 0.04, ease: "linear" }}
          className="w-[3px] rounded-t"
          style={{ background: i > bars * 0.7 ? "#ef4444" : i > bars * 0.45 ? color : `${color}60` }}
        />
      ))}
    </div>
  );
}

export default function StreamingStudioView() {
  const [activeScene, setActiveScene] = useState("main");
  const [sourceVis, setSourceVis] = useState({ camera: true, screen: true, overlay: true, chat: true });
  const [volumes, setVolumes] = useState({ desktop: 80, mic: 65, music: 40 });
  const [isLive, setIsLive] = useState(false);
  const [chatLog, setChatLog] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [transitionDir, setTransitionDir] = useState(1);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const user = chatUsers[Math.floor(Math.random() * chatUsers.length)];
      const msg = chatMessages[Math.floor(Math.random() * chatMessages.length)];
      setChatLog((prev) => [...prev.slice(-49), { id: Date.now(), user, msg }]);
    }, 2500 + Math.random() * 3500);
    return () => clearInterval(interval);
  }, [isLive]);

  const toggleSource = (id) => setSourceVis((s) => ({ ...s, [id]: !s[id] }));

  const switchScene = (id) => {
    setTransitionDir(id === "main" ? 1 : -1);
    setActiveScene(id);
  };

  const sceneLabel = scenes.find((s) => s.id === activeScene)?.name || "Main Scene";

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      {/* ── MAIN GRID ── */}
      <div className="flex-1 flex min-h-0">
        {/* ── LEFT PANEL: Scenes + Sources ── */}
        <div className="w-52 flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0c0c0c]">
          {/* Scenes */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="h-9 flex-shrink-0 flex items-center px-3 border-b border-white/[0.06]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Scenes</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <AnimatePresence mode="popLayout">
                {scenes.map((s) => (
                  <motion.button
                    key={s.id}
                    layout
                    onClick={() => switchScene(s.id)}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] transition-all ${
                      activeScene === s.id
                        ? "bg-white/[0.08] text-white/70 shadow-sm"
                        : "hover:bg-white/[0.03] text-white/35 hover:text-white/50"
                    }`}
                  >
                    <span className="text-sm">{s.icon}</span>
                    <span className="truncate">{s.name}</span>
                    {activeScene === s.id && (
                      <motion.div layoutId="sceneDot" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
          {/* Sources */}
          <div className="flex-shrink-0 border-t border-white/[0.06]">
            <div className="h-9 flex items-center px-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Sources</span>
            </div>
            <div className="px-2 pb-2 space-y-0.5">
              {sourceDefs.map((src) => (
                <div
                  key={src.id}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors group"
                >
                  <span className="text-sm">{src.icon}</span>
                  <span className="text-[10px] text-white/35 group-hover:text-white/50 flex-1 truncate">{src.name}</span>
                  <button
                    onClick={() => toggleSource(src.id)}
                    className={`p-1 rounded transition-all ${
                      sourceVis[src.id] ? "text-white/40 hover:text-white/70" : "text-white/10 hover:text-white/30"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sourceVis[src.id] ? 2 : 1.5}>
                      {sourceVis[src.id] ? (
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z" />
                      ) : (
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94 M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19 M14.12 14.12a3 3 0 11-4.24-4.24 M1 1l22 22" />
                      )}
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER: Preview ── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center p-4 relative bg-[#080808]">
            <motion.div
              key={activeScene}
              initial={{ opacity: 0, x: transitionDir * 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden border border-white/[0.06] shadow-2xl bg-gradient-to-br from-[#111] to-[#1a1a1a]"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(34,197,94,0.08) 0%, transparent 50%)" }} />
              {/* Grid overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "10% 10%" }} />

              {/* Source layers */}
              {sourceVis.camera && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-4 left-4 w-44 h-28 rounded-lg border border-white/[0.08] overflow-hidden shadow-lg bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-white/[0.06] flex items-center justify-center text-lg">📷</div>
                    <div className="text-[8px] text-white/20">Camera</div>
                  </div>
                  <div className="absolute top-1 left-1.5 flex items-center gap-1 bg-black/50 rounded px-1.5 py-0.5 text-[6px] text-white/30">Camera <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" /></div>
                </motion.div>
              )}
              {sourceVis.overlay && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-6 right-6 w-32 h-12 rounded-lg border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex items-center justify-center text-[9px] text-white/20">
                  ✨ BRANPY Overlay
                </motion.div>
              )}
              {sourceVis.screen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 rounded-xl border border-white/[0.05] bg-gradient-to-br from-[#0f0f0f] to-[#141414] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white/[0.04] flex items-center justify-center text-2xl">🖥️</div>
                    <div className="text-[10px] text-white/15">Screen Share</div>
                  </div>
                </motion.div>
              )}
              {sourceVis.chat && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-4 right-4 w-36 max-h-24 overflow-hidden rounded-lg border border-white/[0.06] bg-black/60 backdrop-blur-sm p-2">
                  <div className="text-[6px] text-white/20 mb-1 uppercase tracking-wider">Chat</div>
                  {chatLog.slice(-3).map((c) => (
                    <div key={c.id} className="text-[7px] leading-tight mb-0.5 truncate"><span className="text-emerald-400/60">{c.user}</span><span className="text-white/30">: {c.msg}</span></div>
                  ))}
                </motion.div>
              )}

              {/* Center content per scene */}
              <div className="absolute inset-0 flex items-center justify-center">
                {activeScene === "main" && (
                  <div className="text-center">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }} className="text-4xl mb-2 opacity-[0.04]">📡</motion.div>
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[11px] text-white/10 font-mono tracking-wider">BRANPY STUDIO — LIVE</motion.div>
                  </div>
                )}
                {activeScene === "brb" && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
                    <div className="text-5xl mb-3 opacity-20">⏸️</div>
                    <div className="text-lg font-bold text-white/15 tracking-widest uppercase">Be Right Back</div>
                    <div className="text-[9px] text-white/8 mt-1">Stream will resume shortly</div>
                  </motion.div>
                )}
                {activeScene === "end" && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
                    <div className="text-5xl mb-3 opacity-20">🔚</div>
                    <div className="text-lg font-bold text-white/15 tracking-widest uppercase">Stream Ended</div>
                    <div className="text-[9px] text-white/8 mt-1">Thanks for watching!</div>
                  </motion.div>
                )}
              </div>

              {/* Top bar */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <motion.div animate={{ opacity: isLive ? 1 : 0.4 }} className="flex items-center gap-1.5 bg-black/50 rounded-md px-2 py-1 border border-white/[0.06]">
                  <motion.span animate={{ scale: isLive ? [1, 1.3, 1] : 1 }} transition={{ duration: 1.2, repeat: isLive ? Infinity : 0, ease: "easeInOut" }} className="w-2 h-2 rounded-full bg-red-500 block" />
                  <span className="text-[9px] font-semibold text-white/60">{isLive ? "LIVE" : "OFF"}</span>
                </motion.div>
                <div className="bg-black/40 rounded-md px-2 py-1 text-[8px] text-white/25 font-mono border border-white/[0.04]">
                  1920×1080 · 60fps
                </div>
              </div>
              {/* Time */}
              <div className="absolute top-3 right-3 bg-black/40 rounded-md px-2 py-1 text-[8px] text-white/20 font-mono border border-white/[0.04]">
                {new Date().toLocaleTimeString()}
              </div>
              {/* Scene label */}
              <div className="absolute bottom-3 left-3 bg-black/50 rounded-md px-2 py-1 text-[8px] text-white/25 border border-white/[0.04]">
                Scene: {sceneLabel}
              </div>
              {/* Live viewer count */}
              {isLive && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-3 right-3 bg-black/50 rounded-md px-2 py-1 border border-white/[0.06] flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[8px] text-emerald-400/70 font-mono">{(Math.random() * 500 + 42).toFixed(0)} viewers</span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Chat ── */}
        <div className="w-60 flex-shrink-0 border-l border-white/[0.06] flex flex-col bg-[#0c0c0c]">
          <div className="h-9 flex-shrink-0 flex items-center px-3 border-b border-white/[0.06] justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Chat</span>
            <span className="text-[8px] text-white/15 font-mono">{chatLog.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            <AnimatePresence initial={false}>
              {chatLog.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="px-2 py-1.5 rounded-md hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-medium text-emerald-400/70">{c.user}</span>
                    <span className="text-[6px] text-white/10">now</span>
                  </div>
                  <div className="text-[10px] text-white/35 leading-snug">{c.msg}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
          <div className="flex-shrink-0 p-2 border-t border-white/[0.06]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                setChatLog((prev) => [...prev, { id: Date.now(), user: "You", msg: chatInput.trim() }]);
                setChatInput("");
              }}
              className="flex gap-1.5"
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-md px-2 py-1.5 text-[10px] text-white/40 outline-none placeholder:text-white/10 focus:border-white/[0.12] transition-colors"
              />
              <button
                type="submit"
                className="px-2 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-white/30 hover:text-white/50 transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── AUDIO MIXER ── */}
      <div className="h-20 flex-shrink-0 border-t border-white/[0.06] bg-[#0c0c0c] flex items-center px-4 gap-6">
        {audioChannels.map((ch) => (
          <div key={ch.id} className="flex items-center gap-3 flex-1 max-w-[280px]">
            <div className="flex items-center gap-2 min-w-[100px]">
              <span className="text-sm">{ch.icon}</span>
              <span className="text-[10px] text-white/35 truncate">{ch.name}</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min={0} max={100}
                value={volumes[ch.id]}
                onChange={(e) => setVolumes((v) => ({ ...v, [ch.id]: +e.target.value }))}
                className="w-20 h-[3px] accent-emerald-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-white/20 font-mono w-7 text-right tabular-nums">{volumes[ch.id]}%</span>
            </div>
            <div className="w-24">
              <VUMeter level={volumes[ch.id] / 100} color={ch.color} />
            </div>
            <div className="w-6 flex items-center justify-center">
              <button
                onClick={() => setVolumes((v) => ({ ...v, [ch.id]: v[ch.id] > 0 ? 0 : 65 }))}
                className={`text-[9px] transition-colors ${volumes[ch.id] > 0 ? "text-white/30 hover:text-white/60" : "text-red-400/60 hover:text-red-400"}`}
              >
                {volumes[ch.id] > 0 ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a7.007 7.007 0 010 13.42v2.06A9.01 9.01 0 0014 3.23z" /></svg>
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0014 8.5v2.09l2.45 2.45c.03-.18.05-.36.05-.54zM19 12c0 .82-.13 1.6-.36 2.34l1.49 1.49A8.94 8.94 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── CONTROL BAR ── */}
      <div className="h-11 flex-shrink-0 border-t border-white/[0.06] bg-[#0a0a0a] flex items-center px-4 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider uppercase transition-all ${
            isLive
              ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
          }`}
        >
          <motion.span animate={{ scale: isLive ? [1, 1.4, 1] : 1 }} transition={{ duration: 1, repeat: isLive ? Infinity : 0 }} className="w-1.5 h-1.5 rounded-full block" style={{ background: isLive ? "#ef4444" : "#22c55e" }} />
          {isLive ? "Stop Streaming" : "Start Streaming"}
        </motion.button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <div className="flex items-center gap-1.5 text-[9px] text-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
          Ready
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-[9px] text-white/10 font-mono">
          <span>⏱</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
        <motion.button
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.3 }}
          className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/25 hover:text-white/50 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94a7.07 7.07 0 000-1.88l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a6.93 6.93 0 00-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87a.48.48 0 00.12.61l2.03 1.58a7.07 7.07 0 000 1.88l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.03.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z" /></svg>
        </motion.button>
      </div>
    </div>
  );
}

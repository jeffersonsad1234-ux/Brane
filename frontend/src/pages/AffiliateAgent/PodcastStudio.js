import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const UID = () => Math.random().toString(36).slice(2, 9);

const SVG = ({ d, sz = 14, style }) => <svg style={{ width: sz, height: sz, flexShrink: 0, ...style }} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;

const I = {
  play: "M8 5v14l11-7z", pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  skipB: "M6 6h2v12H6zm3.5 6l8.5 6V6z", skipF: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  stop: "M6 6h12v12H6z", mic: "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  export: "M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z",
};

const MOCK_EPISODES = [
  { id: UID(), title: "AI Revolution 2026", date: "2026-05-20", duration: "42:15", status: "Published" },
  { id: UID(), title: "Startup Funding Secrets", date: "2026-05-18", duration: "38:42", status: "Published" },
  { id: UID(), title: "Mental Health & Tech", date: "2026-05-15", duration: "51:03", status: "Draft" },
  { id: UID(), title: "Future of Remote Work", date: "2026-05-12", duration: "45:30", status: "Published" },
];

function Waveform({ playing }) {
  const bars = useMemo(() => Array.from({ length: 48 }, () => Math.random() * 0.6 + 0.15), []);
  return (
    <div className="flex items-end gap-[2px] h-20 w-full">
      {bars.map((s, i) => (
        <motion.div key={i}
          animate={playing ? { height: [`${s * 100}%`, `${(s * 1.8) * 100}%`, `${s * 100}%`] } : { height: `${s * 100}%` }}
          transition={playing ? { duration: 0.4 + Math.random() * 0.3, repeat: Infinity, ease: "easeInOut" } : {}}
          className="flex-1 rounded-sm"
          style={{ background: playing ? "rgba(34,197,94,0.7)" : "rgba(255,255,255,0.08)", minWidth: 2 }}
        />
      ))}
    </div>
  );
}

function TransportBtn({ onClick, icon, label, active }) {
  return (
    <button onClick={onClick}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
      style={{
        background: active ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
        color: active ? "rgba(34,197,94,0.8)" : "rgba(255,255,255,0.35)",
        border: "1px solid",
        borderColor: active ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)",
      }}
      title={label}
    >
      {icon}
    </button>
  );
}

function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl border shadow-2xl flex items-center gap-2.5"
          style={{ background: "#141414", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <SVG d={I.check} sz={14} style={{ color: "rgba(34,197,94,0.8)" }} />
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PodcastStudio() {
  const [episodes, setEpisodes] = useState(MOCK_EPISODES);
  const [selectedId, setSelectedId] = useState(MOCK_EPISODES[0].id);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [timeline, setTimeline] = useState(0);
  const [title, setTitle] = useState(MOCK_EPISODES[0].title);
  const [description, setDescription] = useState("Episode description here...");
  const [tags, setTags] = useState("tech, ai, podcast");
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  }, []);

  const selected = episodes.find((e) => e.id === selectedId);

  const togglePlay = useCallback(() => {
    setPlaying((p) => !p);
    if (!playing && !recording) setRecording(false);
  }, [playing, recording]);

  const toggleRecord = useCallback(() => {
    setRecording((r) => !r);
    if (!recording) setPlaying(false);
  }, [recording]);

  const stop = useCallback(() => {
    setPlaying(false);
    setRecording(false);
  }, []);

  const rewind = useCallback(() => setTimeline((t) => Math.max(0, t - 10)), []);
  const forward = useCallback(() => setTimeline((t) => Math.min(100, t + 10)), []);

  const newEpisode = useCallback(() => {
    const ep = { id: UID(), title: "New Episode", date: new Date().toISOString().slice(0, 10), duration: "00:00", status: "Draft" };
    setEpisodes((prev) => [ep, ...prev]);
    setSelectedId(ep.id);
    setTitle(ep.title);
    setDescription("");
    setTags("");
    showToast("New draft episode created");
  }, [showToast]);

  const selectEpisode = useCallback((ep) => {
    setSelectedId(ep.id);
    setTitle(ep.title);
    setTimeline(0);
    setPlaying(false);
    setRecording(false);
  }, []);

  const handleExport = useCallback(() => {
    showToast("Episode exported successfully!");
  }, [showToast]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white select-none">
      <div className="h-10 flex-shrink-0 flex items-center px-3 gap-2 border-b border-white/[0.06] bg-[#0c0c0c]">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
          <SVG d={I.mic} sz={11} style={{ color: "rgba(255,255,255,0.8)" }} />
        </div>
        <span className="text-[11px] font-bold tracking-tight text-white/40">Podcast Studio</span>
        <div className="flex-1" />
        <button onClick={newEpisode}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
        >
          <SVG d={I.add} sz={11} />
          New Episode
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-[240px] flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] overflow-y-auto">
          {episodes.map((ep) => (
            <motion.button key={ep.id} layout
              onClick={() => selectEpisode(ep)}
              className="w-full text-left px-3 py-2.5 border-b transition-all"
              style={{
                borderColor: "rgba(255,255,255,0.03)",
                background: selectedId === ep.id ? "rgba(255,255,255,0.05)" : "transparent",
              }}
            >
              <div className="text-[11px] font-medium text-white/60 truncate">{ep.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-white/20">{ep.date}</span>
                <span className="text-[9px] text-white/20">{ep.duration}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${ep.status === "Published" ? "text-emerald-400/70 bg-emerald-500/10" : "text-yellow-400/70 bg-yellow-500/10"}`}>
                  {ep.status}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {selected && (
            <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
              <div className="rounded-xl border overflow-hidden p-4" style={{ background: "#0e0e0e", borderColor: "rgba(255,255,255,0.06)" }}>
                <Waveform playing={playing || recording} />

                <div className="mt-4">
                  <input type="range" min={0} max={100} value={timeline} onChange={(e) => setTimeline(+e.target.value)}
                    className="w-full h-[3px] accent-emerald-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-white/15 mt-1">
                    <span>{timeline}%</span>
                    <span>{selected.duration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <TransportBtn onClick={rewind} label="Rewind" icon={<SVG d={I.skipB} sz={15} />} />
                  <TransportBtn onClick={togglePlay} label={playing ? "Pause" : "Play"} active={playing}
                    icon={<SVG d={playing ? I.pause : I.play} sz={15} />}
                  />
                  <TransportBtn onClick={toggleRecord} label="Record" active={recording}
                    icon={<SVG d={I.mic} sz={14} style={{ color: recording ? "rgba(239,68,68,0.8)" : undefined }} />}
                  />
                  <TransportBtn onClick={stop} label="Stop" icon={<SVG d={I.stop} sz={14} />} />
                  <TransportBtn onClick={forward} label="Forward" icon={<SVG d={I.skipF} sz={15} />} />
                </div>
              </div>

              <button onClick={handleExport}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-medium transition-all self-start"
                style={{ background: "rgba(34,197,94,0.15)", color: "rgba(255,255,255,0.7)" }}
              >
                <SVG d={I.export} sz={12} />
                Export
              </button>
            </div>
          )}
        </div>

        <div className="w-[240px] flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Episode Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Tags</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15"
              placeholder="comma, separated, tags"
            />
          </div>
          {selected && (
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="text-[9px] text-white/20 space-y-1">
                <div className="flex justify-between"><span>Status</span><span className="text-white/40">{selected.status}</span></div>
                <div className="flex justify-between"><span>Date</span><span className="text-white/40">{selected.date}</span></div>
                <div className="flex justify-between"><span>Duration</span><span className="text-white/40">{selected.duration}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

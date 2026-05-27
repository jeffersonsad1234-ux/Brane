import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import SetupWizard from "../../core/ai/components/SetupWizard";
import { useApiKey } from "../../core/ai/hooks/useApiKey";
import { generateAudio } from "../../core/ai/services/aiToolsService";

const defaultSounds = [
  { id: "sfx1", name: "Click Pop", category: "UI", duration: 0.3, tags: ["click", "interface", "pop"], icon: "▁" },
  { id: "sfx2", name: "Notification Chime", category: "Notification", duration: 1.2, tags: ["chime", "alert", "bell"], icon: "▂" },
  { id: "sfx3", name: "Forest Ambience", category: "Ambient", duration: 30, tags: ["nature", "forest", "calm"], icon: "▄" },
  { id: "sfx4", name: "Rain Drops", category: "Ambient", duration: 45, tags: ["rain", "water", "weather"], icon: "▅" },
  { id: "sfx5", name: "Alert Siren", category: "Alert", duration: 1.8, tags: ["siren", "warning", "urgent"], icon: "▆" },
  { id: "sfx6", name: "Error Buzz", category: "Alert", duration: 0.8, tags: ["error", "buzz", "fail"], icon: "█" },
];

const categories = ["All", "UI", "Notification", "Ambient", "Alert"];

export default function SoundFXStudio() {
  const { apiKey: hfToken, hasKey, setApiKey } = useApiKey("huggingface");
  const [showWizard, setShowWizard] = useState(!hasKey);
  const [sounds, setSounds] = useLocalStorage("branpy-soundfx", defaultSounds);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(() => {
    return sounds.filter((s) => {
      const matchCat = catFilter === "All" || s.category === catFilter;
      const matchSearch = !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()) || s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [sounds, search, catFilter]);

  const handlePlay = (id) => {
    if (playingId === id) { setPlayingId(null); return; }
    setPlayingId(id);
    setTimeout(() => setPlayingId(null), 2000);
  };

  const handleGenerate = async () => {
    if (!selected?.name || generating) return;
    setGenerating(true);
    try {
      const audioData = await generateAudio(selected.name, hfToken, { duration: 4 });
      const newSound = { ...selected, id: `sfx_${Date.now()}`, duration: 4, audioData };
      setSounds((prev) => [newSound, ...prev]);
      setSelected(null);
    } catch (err) {
      console.error("Generation error:", err);
    }
    setGenerating(false);
  };

  return (
    <>
      <SetupWizard service="huggingface" open={showWizard}
        onComplete={(key) => { setApiKey(key); setShowWizard(false); }}
        onClose={() => { if (hasKey) setShowWizard(false); }} />
      <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
        <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06] gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Sound FX Studio</span>
          {!hasKey && (
            <button onClick={() => setShowWizard(true)} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1", border: "none", cursor: "pointer" }}>
              Configurar HF Token
            </button>
          )}
          <div className="flex-1" />
          <span className="text-[8px] text-white/10 font-mono">{sounds.length} sounds</span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
          {categories.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className="text-[9px] px-2.5 py-1 rounded-full"
              style={{
                background: catFilter === c ? "rgba(99,102,241,0.12)" : "transparent",
                border: `1px solid ${catFilter === c ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)"}`,
                color: catFilter === c ? "#6366f1" : "rgba(255,255,255,0.3)",
              }}
            >{c}</button>
          ))}
          <div className="flex-1" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="bg-transparent text-[10px] outline-none px-2 py-1 rounded w-24" style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }} />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filtered.map((s) => (
              <div key={s.id} onClick={() => { setSelected(s); handlePlay(s.id); }}
                className="p-3 rounded-xl cursor-pointer transition-all"
                style={{
                  background: selected?.id === s.id ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${playingId === s.id ? "rgba(16,185,129,0.3)" : selected?.id === s.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{playingId === s.id ? "🔊" : s.icon}</span>
                  <span className="text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{s.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)" }}>{s.category}</span>
                  <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.15)" }}>{s.duration}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div className="flex-shrink-0 p-3 border-t border-white/[0.06] flex items-center gap-2">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{selected.name}</span>
            <button onClick={() => handlePlay(selected.id)} className="text-[10px] px-2.5 py-1 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "none", cursor: "pointer" }}>
              {playingId === selected.id ? "⏹" : "▶"} Preview
            </button>
            <button onClick={handleGenerate} disabled={generating} className="text-[10px] px-2.5 py-1 rounded" style={{ background: generating ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.1)", color: generating ? "rgba(255,255,255,0.2)" : "#6366f1", border: "none", cursor: generating ? "not-allowed" : "pointer" }}>
              {generating ? "Gerando..." : "Gerar versão real"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

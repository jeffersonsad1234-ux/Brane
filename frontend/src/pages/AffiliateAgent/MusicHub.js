import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const genres = ["All", "Lo-fi", "Electronic", "Ambient", "Hip-Hop", "Jazz"];

const mockTracks = [
  { id: "tr1", name: "Midnight Breeze", artist: "Luna Wave", duration: "3:24", bpm: 85, genre: "Lo-fi" },
  { id: "tr2", name: "Digital Rain", artist: "Synthia", duration: "4:12", bpm: 128, genre: "Electronic" },
  { id: "tr3", name: "Ocean Depth", artist: "Aura", duration: "5:06", bpm: 72, genre: "Ambient" },
  { id: "tr4", name: "Street Pulse", artist: "MC Flow", duration: "3:48", bpm: 96, genre: "Hip-Hop" },
  { id: "tr5", name: "Blue Note Café", artist: "Miles & Keys", duration: "4:33", bpm: 112, genre: "Jazz" },
  { id: "tr6", name: "Chill Sunset", artist: "Luna Wave", duration: "2:56", bpm: 78, genre: "Lo-fi" },
  { id: "tr7", name: "Neon Grid", artist: "Synthia", duration: "5:22", bpm: 140, genre: "Electronic" },
  { id: "tr8", name: "Starlight Drift", artist: "Aura", duration: "6:14", bpm: 64, genre: "Ambient" },
];

function WaveformMini({ playing }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          animate={playing ? { height: [3 + Math.random() * 10, 3 + Math.random() * 12, 3 + Math.random() * 10] } : { height: 4 }}
          transition={{ duration: 0.4 + i * 0.04, repeat: playing ? Infinity : 0, ease: "easeInOut" }}
          className="w-[2px] rounded-full"
          style={{ background: playing ? "#22c55e" : "rgba(255,255,255,0.08)" }}
        />
      ))}
    </div>
  );
}

export default function MusicHub() {
  const [tracks, setTracks] = useLocalStorage("branpy-music", mockTracks);
  const [genre, setGenre] = useState("All");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const intervalRef = useRef(null);

  const filtered = useMemo(() => {
    return tracks.filter((t) => {
      const matchGenre = genre === "All" || t.genre === genre;
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase());
      return matchGenre && matchSearch;
    });
  }, [tracks, genre, search]);

  const currentTrack = currentIndex >= 0 && currentIndex < filtered.length ? filtered[currentIndex] : null;

  const playTrack = (id) => {
    const idx = filtered.findIndex((t) => t.id === id);
    if (idx === -1) return;
    if (playingId === id) {
      setPlayingId(null);
      setCurrentIndex(-1);
      clearInterval(intervalRef.current);
      return;
    }
    setPlayingId(id);
    setCurrentIndex(idx);
    setProgress(0);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 1.5));
    }, 200);
  };

  const nextTrack = () => {
    if (filtered.length === 0) return;
    const next = (currentIndex + 1) % filtered.length;
    playTrack(filtered[next].id);
  };

  const prevTrack = () => {
    if (filtered.length === 0) return;
    const prev = (currentIndex - 1 + filtered.length) % filtered.length;
    playTrack(filtered[prev].id);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Music Hub</span>
        <div className="flex-1" />
        <span className="text-[8px] text-white/10 font-mono">{tracks.length} tracks</span>
      </div>

      <div className="h-10 flex-shrink-0 flex items-center gap-1 px-3 border-b border-white/[0.06]">
        {genres.map((g) => (
          <button key={g} onClick={() => setGenre(g)} className={`px-2.5 py-1 rounded-lg text-[9px] transition-all ${genre === g ? "bg-white/[0.08] text-white/60" : "text-white/20 hover:text-white/40"}`}>
            {g}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <svg className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-white/10" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tracks..." className="w-36 bg-white/[0.03] border border-white/[0.06] rounded-lg pl-7 pr-2 py-1.5 text-[10px] text-white/50 outline-none placeholder:text-white/10 focus:border-white/[0.12] transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] text-white/10">No tracks found</div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <AnimatePresence initial={false}>
              {filtered.map((track) => (
                <motion.div key={track.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`p-4 rounded-xl border transition-all ${playingId === track.id ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-lg">🎵</div>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => playTrack(track.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${playingId === track.id ? "bg-emerald-500/30 text-emerald-400" : "bg-white/[0.08] hover:bg-white/[0.12] text-white/30 hover:text-white/50"}`}>
                      {playingId === track.id ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </motion.button>
                  </div>
                  <div className="text-[11px] text-white/60 truncate">{track.name}</div>
                  <div className="text-[9px] text-white/20 truncate">{track.artist}</div>
                  <div className="flex items-center justify-between mt-2">
                    <WaveformMini playing={playingId === track.id} />
                    <span className="text-[8px] text-white/15 font-mono">{track.duration}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[8px] text-white/15">
                    <span>{track.bpm} BPM</span>
                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-medium ${track.genre === "Lo-fi" ? "bg-indigo-500/15 text-indigo-400/60" : track.genre === "Electronic" ? "bg-blue-500/15 text-blue-400/60" : track.genre === "Ambient" ? "bg-emerald-500/15 text-emerald-400/60" : track.genre === "Hip-Hop" ? "bg-amber-500/15 text-amber-400/60" : "bg-rose-500/15 text-rose-400/60"}`}>
                      {track.genre}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {currentTrack && (
          <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} className="h-16 flex-shrink-0 border-t border-white/[0.06] bg-[#0d0d0d] flex items-center px-4 gap-4">
            <div className="flex items-center gap-3 w-56">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-sm flex-shrink-0">🎵</div>
              <div className="min-w-0">
                <div className="text-[11px] text-white/60 truncate">{currentTrack.name}</div>
                <div className="text-[8px] text-white/20">{currentTrack.artist}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.85 }} onClick={prevTrack} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/40 transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
              </motion.button>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => playTrack(currentTrack.id)} className="p-2 rounded-full bg-white/[0.1] hover:bg-white/[0.15] text-white/40 hover:text-white/60 transition-all">
                {playingId === currentTrack.id ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </motion.button>
              <motion.button whileTap={{ scale: 0.85 }} onClick={nextTrack} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/40 transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
              </motion.button>
            </div>

            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden cursor-pointer">
                <div className="h-full rounded-full bg-emerald-500/50 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[8px] text-white/15 font-mono w-8">{currentTrack.duration}</span>
            </div>

            <div className="flex items-center gap-2 w-32">
              <svg className="w-3.5 h-3.5 text-white/20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
              <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full h-1 appearance-none bg-white/[0.06] rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/40 [&::-webkit-slider-thumb]:cursor-pointer" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

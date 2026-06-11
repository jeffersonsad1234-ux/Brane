import React, { useState, useEffect, useCallback } from "react";
import useLiveSync from "../../hooks/useLiveSync";

const CATEGORIES = [
  { id: "ingles", name: "Ingl\u00eas", icon: "\ud83c\uddec\ud83c\udde7", backend: "Ingl\u00eas", desc: "Vocabulario, gramatica e expressoes" },
  { id: "corpo_humano", name: "Corpo Humano", icon: "\ud83e\uddec", backend: "Corpo Humano", desc: "Anatomia, fisiologia e curiosidades" },
  { id: "tecnologia", name: "Tecnologia", icon: "\ud83d\udcbb", backend: "Tecnologia", desc: "Inovacao, gadgets, programacao" },
  { id: "curiosidades", name: "Curiosidades", icon: "\ud83d\udca1", backend: "Curiosidades", desc: "Fatos surpreendentes do dia a dia" },
  { id: "misterios", name: "Mist\u00e9rios", icon: "\ud83d\udd2e", backend: "Mist\u00e9rios", desc: "Misterios e fatos incriveis" },
  { id: "cinema", name: "Cinema e S\u00e9ries", icon: "\ud83c\udfac", backend: "Cinema", desc: "Filmes, series e entretenimento" },
  { id: "games", name: "Games", icon: "\ud83c\udfae", backend: "Games", desc: "Video games, classicos, e-sports" },
  { id: "historia", name: "Hist\u00f3ria", icon: "\ud83c\udfdb\ufe0f", backend: "Hist\u00f3ria", desc: "Eventos historicos e civilizacoes" },
  { id: "geografia", name: "Geografia", icon: "\ud83c\udf0d", backend: "Geografia", desc: "Paises, capitais, clima" },
  { id: "ciencia", name: "Ci\u00eancia", icon: "\ud83d\udd2c", backend: "Ci\u00eancia", desc: "Descobertas cientificas" },
  { id: "espaco", name: "Espa\u00e7o", icon: "\ud83d\ude80", backend: "Espa\u00e7o", desc: "Astronomia e exploracao espacial" },
  { id: "animais", name: "Animais", icon: "\ud83d\udc3e", backend: "Animais", desc: "Reino animal e fauna" },
  { id: "piadas", name: "Piadas e Charadas", icon: "\ud83d\ude04", backend: "Piadas e Charadas", desc: "Humor e desafios mentais" },
  { id: "futebol", name: "Futebol", icon: "\u26bd", backend: "Esportes", desc: "Clubes, selecoes e copas" },
  { id: "musica", name: "M\u00fasica", icon: "\ud83c\udfb5", backend: "M\u00fasica", desc: "Generos, artistas e teoria musical" },
  { id: "conhecimentos_gerais", name: "Conhecimentos Gerais", icon: "\ud83d\udcda", backend: "Conhecimentos Gerais", desc: "Cultura e atualidades" },
  { id: "matematica", name: "Matem\u00e1tica", icon: "\ud83d\udd22", backend: "Matem\u00e1tica", desc: "Numeros e raciocinio logico" },
  { id: "portugues", name: "Portugu\u00eas", icon: "\ud83d\udcdd", backend: "Portugu\u00eas", desc: "Gramatica e interpretacao" },
  { id: "empreendedorismo", name: "Empreendedorismo", icon: "\ud83d\udcbc", backend: "Empreendedorismo", desc: "Negocios e startups" },
  { id: "ia", name: "Intelig\u00eancia Artificial", icon: "\ud83e\udd16", backend: "Intelig\u00eancia Artificial", desc: "ML, automacao e futuro" },
];

const MODES = [
  { id: "infinito", label: "Infinito", desc: "Perguntas sem fim", limit: 10 },
  { id: "500", label: "500", desc: "Maratona", limit: 500 },
  { id: "1000", label: "1000", desc: "Desafio", limit: 1000 },
  { id: "2000", label: "2000", desc: "Ultramaratona", limit: 2000 },
];

const BG_VARIANTS = [
  "neon", "espaco", "cidade", "cidade_noturna", "estudio",
  "particulas", "natureza", "tecnologia", "sala_gamer", "biblioteca", "futurista",
];

const VOICE_MODES = ["padrao", "mulher", "homem", "aleatorio", "alternado"];
const SPEED_MODES = ["normal", "rapida", "muito_rapida", "turbo", "extrema"];

export default function LiveStudio() {
  const liveSync = useLiveSync("admin");

  const [tabletOnline, setTabletOnline] = useState(false);
  const [voices, setVoices] = useState([]);
  const [quizStatus, setQuizStatus] = useState(null);
  const [quizActive, setQuizActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [bgVariant, setBgVariant] = useState("neon");
  const [messageText, setMessageText] = useState("");

  const [musicPlaying, setMusicPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState("");
  const [volume, setVolume] = useState(1);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [pitch, setPitch] = useState(1.2);
  const [voiceMode, setVoiceMode] = useState("padrao");
  const [speedMode, setSpeedMode] = useState("normal");

  useEffect(() => {
    liveSync.on("liveConnected", (msg) => {
      setTabletOnline(!!msg.connected);
    });
    liveSync.on("voices", (msg) => {
      if (msg.voices) setVoices(msg.voices);
    });
    liveSync.on("status", (msg) => {
      setQuizStatus(msg);
      if (msg.bgVariant) setBgVariant(msg.bgVariant);
      if (msg.volume != null) setVolume(msg.volume);
      if (msg.musicVolume != null) setMusicVolume(msg.musicVolume);
      if (msg.pitch != null) setPitch(msg.pitch);
      if (msg.speedMode) setSpeedMode(msg.speedMode);
      if (msg.voiceMode) setVoiceMode(msg.voiceMode);
      if (msg.isPlaying !== undefined) setMusicPlaying(msg.isPlaying);
      if (msg.currentTrack) setCurrentTrack(msg.currentTrack);
    });
    liveSync.on("audioState", (msg) => {});
    return () => {
      liveSync.off("liveConnected");
      liveSync.off("voices");
      liveSync.off("status");
      liveSync.off("audioState");
    };
  }, [liveSync]);

  const sendCmd = useCallback((command, extra = {}) => {
    liveSync.sendCommand(command, extra);
  }, [liveSync]);

  const startQuiz = () => {
    if (!selectedCategory || !liveSync.connected) return;
    const payload = {
      type: "SET_QUIZ_LIBRARY",
      categoryId: selectedCategory.backend,
      categoryName: selectedCategory.name,
      mode: selectedMode.id,
      questionLimit: selectedMode.limit,
      timestamp: Date.now(),
    };
    liveSync.send(payload);
    setQuizActive(true);
  };

  const changeCategory = () => {
    setQuizActive(false);
  };

  const toggleMusic = () => {
    if (musicPlaying) sendCmd("pauseMusic");
    else sendCmd("playMusic");
  };

  const speakMessage = () => {
    if (!messageText.trim()) return;
    sendCmd("speakMessage", { text: messageText.trim() });
    setMessageText("");
  };

  const brVoices = voices.filter((v) => v.lang && v.lang.startsWith("pt"));
  const phaseText = quizStatus?.phase || "—";
  const ptBrText = brVoices.length > 0 ? ` (${brVoices.length} PT-BR)` : "";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <h1 className="text-sm font-medium text-white/80">Live Studio</h1>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full ${liveSync.connected ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${liveSync.connected ? "bg-emerald-400" : "bg-red-400"}`} />
            {liveSync.connected ? "Admin Online" : "Desconectado"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 max-w-2xl mx-auto w-full">
        {/* Tablet Status */}
        <div className={`rounded-xl p-3 border ${tabletOnline ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${tabletOnline ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]"}`} />
            <span className="text-xs font-semibold text-white/70">Tablet: {tabletOnline ? "Online" : "Offline"}</span>
            <span className="text-[10px] text-white/30 ml-2">
              {tabletOnline
                ? voices.length > 0
                  ? `${voices.length} voz${voices.length !== 1 ? "es" : ""} disponíve${voices.length !== 1 ? "is" : "l"}${ptBrText}`
                  : "Conectado"
                : "Aguardando conexão do tablet..."}
            </span>
          </div>
        </div>

        {/* Category / Mode / Start (when quiz not active) */}
        {!quizActive && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Categoria</div>
            <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left p-2.5 rounded-lg border transition-all ${
                    selectedCategory?.id === cat.id
                      ? "bg-purple-500/15 border-purple-500/40"
                      : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="text-lg">{cat.icon}</div>
                  <div className="text-[11px] font-semibold text-white/70 mt-0.5">{cat.name}</div>
                  <div className="text-[9px] text-white/30 leading-tight mt-0.5">{cat.desc}</div>
                </button>
              ))}
            </div>

            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mt-1">Perguntas</div>
            <div className="flex gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m)}
                  className={`flex-1 py-2.5 rounded-lg border text-center transition-all ${
                    selectedMode?.id === m.id
                      ? "bg-cyan-500/15 border-cyan-500/40"
                      : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="text-[11px] font-semibold text-white/70">{m.label}</div>
                  <div className="text-[8px] text-white/30">{m.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={startQuiz}
              disabled={!selectedCategory || !liveSync.connected}
              className="w-full py-3 rounded-xl border-none bg-gradient-to-r from-purple-600 to-purple-800 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              Iniciar Quiz
            </button>
          </>
        )}

        {/* Active Quiz Controls */}
        {quizActive && (
          <>
            <div className="rounded-xl p-3 bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/70">
                  Quiz ativo: <strong className="text-white/90">{selectedCategory?.name || "—"}</strong>
                  <span className="text-white/30 ml-1">({selectedMode?.label})</span>
                </div>
                <button onClick={changeCategory} className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.06] text-white/50 hover:bg-white/[0.1]">
                  Trocar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => sendCmd("pause")} className="py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-amber-400 text-xs font-medium hover:bg-white/[0.08]">
                Pausar
              </button>
              <button onClick={() => sendCmd("resume")} className="py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-emerald-400 text-xs font-medium hover:bg-white/[0.08]">
                Continuar
              </button>
              <button onClick={() => sendCmd("restart")} className="py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-red-400 text-xs font-medium hover:bg-white/[0.08]">
                Reiniciar
              </button>
              <button onClick={() => sendCmd("nextQuestion")} className="py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-cyan-400 text-xs font-medium hover:bg-white/[0.08]">
                Próxima
              </button>
            </div>

            {quizStatus && (
              <div className="rounded-xl p-3 bg-purple-500/5 border border-purple-500/10 text-center">
                <span className="text-xs text-white/50">
                  Fase: <strong className="text-purple-400">{phaseText}</strong>
                  {quizStatus.currentIndex != null && (
                    <> | Pergunta: <strong className="text-white/70">#{quizStatus.currentIndex + 1}</strong></>
                  )}
                  {quizStatus.paused && (
                    <span className="text-amber-400 ml-2 font-semibold">PAUSADO</span>
                  )}
                </span>
              </div>
            )}
          </>
        )}

        {/* Fundo */}
        <details className="group" open>
          <summary className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 cursor-pointer list-none flex items-center gap-1 py-1">
            <span className="group-open:rotate-90 transition-transform text-[8px]">▸</span> Fundo
          </summary>
          <div className="pt-2 pb-1">
            <select
              value={bgVariant}
              onChange={(e) => { setBgVariant(e.target.value); sendCmd("setBackground", { variant: e.target.value }); }}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/70 text-xs outline-none"
            >
              {BG_VARIANTS.map((v) => (
                <option key={v} value={v} className="bg-[#0a0a0a]">{v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
          </div>
        </details>

        {/* Música */}
        <details className="group" open>
          <summary className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 cursor-pointer list-none flex items-center gap-1 py-1">
            <span className="group-open:rotate-90 transition-transform text-[8px]">▸</span> Música
          </summary>
          <div className="pt-2 pb-1 space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={toggleMusic} className="py-2 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white/70 text-xs text-center hover:bg-white/[0.08]">
                {musicPlaying ? "Parar" : "Tocar"}
              </button>
              <button onClick={() => sendCmd("nextMusic")} className="py-2 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white/70 text-xs text-center hover:bg-white/[0.08]">
                Próxima
              </button>
              <button onClick={() => sendCmd("randomMusic")} className="py-2 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white/70 text-xs text-center hover:bg-white/[0.08]">
                Aleatória
              </button>
            </div>
            {currentTrack && (
              <div className="text-[10px] text-white/30">Tocando: {currentTrack}</div>
            )}
            <div className="text-[10px] text-white/40">Volume da música</div>
            <input
              type="range" min="0" max="1" step="0.05" value={musicVolume}
              onChange={(e) => { const v = parseFloat(e.target.value); setMusicVolume(v); sendCmd("setMusicVolume", { volume: v }); }}
              className="w-full h-1 rounded-lg appearance-none bg-white/[0.15] outline-none accent-purple-500"
            />
          </div>
        </details>

        {/* Modo de Voz */}
        <details className="group" open>
          <summary className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 cursor-pointer list-none flex items-center gap-1 py-1">
            <span className="group-open:rotate-90 transition-transform text-[8px]">▸</span> Modo de Voz
          </summary>
          <div className="pt-2 pb-1 space-y-2">
            <div className="flex gap-1">
              {VOICE_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => { setVoiceMode(m); sendCmd("setVoiceMode", { mode: m }); }}
                  className={`flex-1 py-2 rounded-lg border text-[10px] font-medium transition-all ${
                    voiceMode === m
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                      : "bg-white/[0.04] border-white/[0.1] text-white/50 hover:bg-white/[0.08]"
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            <div className="text-[9px] text-white/30 leading-relaxed">
              {voices.length > 0 ? (
                <><strong className="text-emerald-400">{voices.length} voz{voices.length !== 1 ? "es" : ""}</strong> disponíve{voices.length !== 1 ? "is" : "l"}{ptBrText}</>
              ) : (
                "Nenhuma voz detectada"
              )}
            </div>
            <div className="flex flex-wrap gap-1 text-[9px]">
              {voices.map((v, i) => (
                <span key={i} className="inline-block bg-white/[0.06] px-1.5 py-0.5 rounded text-white/40">
                  {v.name} <span className="text-white/20">{v.lang || "?"}</span>
                </span>
              ))}
            </div>
          </div>
        </details>

        {/* Ajustes de Voz */}
        <details className="group">
          <summary className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 cursor-pointer list-none flex items-center gap-1 py-1">
            <span className="group-open:rotate-90 transition-transform text-[8px]">▸</span> Ajustes de Voz
          </summary>
          <div className="pt-2 pb-1 space-y-3">
            <div>
              <div className="text-[10px] text-white/40 mb-1">Volume da narradora</div>
              <input
                type="range" min="0" max="1" step="0.1" value={volume}
                onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); sendCmd("setVolume", { volume: v }); }}
                className="w-full h-1 rounded-lg appearance-none bg-white/[0.15] outline-none accent-purple-500"
              />
            </div>
            <div>
              <div className="text-[10px] text-white/40 mb-1">Velocidade</div>
              <div className="flex gap-1">
                {SPEED_MODES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSpeedMode(s); sendCmd("setSpeedMode", { mode: s }); }}
                    className={`flex-1 py-2 rounded-lg border text-[9px] font-medium transition-all ${
                      speedMode === s
                        ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                        : "bg-white/[0.04] border-white/[0.1] text-white/50 hover:bg-white/[0.08]"
                    }`}
                  >
                    {s === "muito_rapida" ? "M. Rápida" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 mb-1">Tom</div>
              <input
                type="range" min="0.5" max="2" step="0.1" value={pitch}
                onChange={(e) => { const v = parseFloat(e.target.value); setPitch(v); sendCmd("setPitch", { pitch: v }); }}
                className="w-full h-1 rounded-lg appearance-none bg-white/[0.15] outline-none accent-purple-500"
              />
            </div>
          </div>
        </details>

        {/* Mensagem ao vivo */}
        <details className="group" open>
          <summary className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 cursor-pointer list-none flex items-center gap-1 py-1">
            <span className="group-open:rotate-90 transition-transform text-[8px]">▸</span> Mensagem ao Vivo
          </summary>
          <div className="pt-2 pb-1">
            <div className="flex gap-1.5">
              <input
                type="text" value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") speakMessage(); }}
                placeholder="Obrigado pela rosa."
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white/70 text-xs outline-none placeholder:text-white/20"
              />
              <button onClick={speakMessage} className="px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25">
                Falar
              </button>
            </div>
          </div>
        </details>

        {/* Status do WebSocket */}
        <div className="text-center pt-2 pb-4">
          <span className="text-[9px] text-white/20 font-mono">
            WebSocket: {liveSync.connected ? "conectado" : "desconectado"}
          </span>
          <span className="text-[9px] text-white/15 ml-3">
            Porta 3002
          </span>
        </div>
      </div>
    </div>
  );
}

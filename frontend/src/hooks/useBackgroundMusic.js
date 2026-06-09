import { useState, useRef, useCallback, useEffect } from "react";

const CATEGORIES = [
  {
    name: "Relaxante",
    tracks: ["Ondas Suaves", "Brisa Leve", "Paz Interior", "Luar Serena"],
  },
  {
    name: "Educativa",
    tracks: ["Foco nos Estudos", "Mente Atenta", "Aprendizado", "Concentracao"],
  },
  {
    name: "Tecnologia",
    tracks: ["Codigo Binario", "Sistema Ativo", "Processamento", "Chip Quântico"],
  },
  {
    name: "Mistério",
    tracks: ["Sombras Profundas", "Enigma Oculto", "Segredo Antigo", "Nevoeiro"],
  },
  {
    name: "Motivacional",
    tracks: ["Vencer Desafios", "Nova Conquista", "Superacao", "Fogo Interior"],
  },
  {
    name: "Financeira",
    tracks: ["Mercado Estavel", "Investimento Seguro", "Crescimento", "Carteira Diversa"],
  },
  {
    name: "Futurista",
    tracks: ["Nova Era", "Cidade Neon", "Viagem Estelar", "Realidade Virtual"],
  },
  {
    name: "Lo-fi",
    tracks: ["Chuva Suave", "Café e Livro", "Tarde Tranquila", "Noite Urbana"],
  },
  {
    name: "Quiz Clássico",
    tracks: ["Gincana", "Desafio Final", "Sabedoria", "Campeao"],
  },
];

const ALL_TRACKS = CATEGORIES.flatMap((c) => c.tracks);

function freq(note) { return 440 * Math.pow(2, (note - 69) / 12); }
const C4 = freq(60), D4 = freq(62), E4 = freq(64), F4 = freq(65), G4 = freq(67), A4 = freq(69), B4 = freq(71), C5 = freq(72);
const Db4 = freq(61), Eb4 = freq(63), Gb4 = freq(66), Ab4 = freq(68), Bb4 = freq(70);
const D5 = freq(74), E5 = freq(76), F5 = freq(77), G5 = freq(79), A5 = freq(81);

function startTrack(ctx, masterGain, type) {
  const now = ctx.currentTime;
  const nodes = [];

  const addOsc = (f, t, gain, detune = 0) => {
    const osc = ctx.createOscillator();
    osc.type = t;
    osc.frequency.value = f;
    osc.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = gain;
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    nodes.push(osc);
    return { osc, gain: g };
  };

  const addLFO = (target, rate, amount) => {
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = rate;
    const lg = ctx.createGain();
    lg.gain.value = amount;
    lfo.connect(lg);
    lg.connect(target);
    lfo.start(now);
    nodes.push(lfo);
  };

  const addFilt = (freq, type = "lowpass") => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    masterGain.disconnect();
    masterGain.connect(f);
    f.connect(ctx.destination);
    nodes.push(f);
    return f;
  };

  const scheduleNote = (f, start, dur, gv, wave = "sine") => {
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = f;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, start);
    gn.gain.linearRampToValueAtTime(gv, start + 0.05);
    gn.gain.setValueAtTime(gv, start + dur - 0.05);
    gn.gain.linearRampToValueAtTime(0, start + dur);
    osc.connect(gn);
    gn.connect(masterGain);
    osc.start(start);
    osc.stop(start + dur);
    nodes.push(osc);
  };

  const scheduleArp = (notes, base, noteDur, gap, gv, wave = "sine", rep = null) => {
    const repeat = rep || notes.length * (noteDur + gap);
    for (let i = 0; i < 200; i++) {
      const n = notes[i % notes.length];
      const t = base + i * (noteDur + gap);
      scheduleNote(n, t, noteDur, gv, wave);
    }
  };

  const scheduleChord = (notes, start, dur, gv, wave = "sine") => {
    notes.forEach((n) => scheduleNote(n, start, dur, gv, wave));
  };

  switch (type) {
    // ── Relaxante ──
    case "Ondas Suaves": {
      addOsc(C4, "sine", 0.025); addOsc(E4, "sine", 0.02); addOsc(G4, "sine", 0.015);
      addLFO(masterGain.gain, 0.08, 0.15);
      scheduleArp([C4, G4, E4, G4], now + 1, 0.2, 0.15, 0.02, "sine");
      break;
    }
    case "Brisa Leve": {
      addOsc(D4, "sine", 0.02); addOsc(F4, "sine", 0.018); addOsc(A4, "sine", 0.015);
      addLFO(masterGain.gain, 0.06, 0.12);
      scheduleArp([D4, A4, F4, D5], now + 1, 0.25, 0.2, 0.015, "triangle");
      break;
    }
    case "Paz Interior": {
      addOsc(E4, "sine", 0.022); addOsc(G4, "sine", 0.02); addOsc(B4, "sine", 0.015);
      addLFO(masterGain.gain, 0.05, 0.1);
      scheduleArp([E4, B4, G4, E5], now + 1, 0.3, 0.25, 0.015, "triangle");
      break;
    }
    case "Luar Serena": {
      addOsc(F4, "sine", 0.02); addOsc(A4, "sine", 0.018); addOsc(C5, "sine", 0.012);
      addLFO(masterGain.gain, 0.04, 0.1);
      scheduleArp([F4, C5, A4, F5], now + 1, 0.28, 0.22, 0.012, "sine");
      break;
    }

    // ── Educativa ──
    case "Foco nos Estudos": {
      addOsc(C4, "triangle", 0.03); addOsc(E4, "triangle", 0.025);
      addLFO(masterGain.gain, 0.12, 0.1);
      scheduleArp([C4, E4, G4, C5], now + 0.5, 0.15, 0.1, 0.025, "triangle");
      break;
    }
    case "Mente Atenta": {
      addOsc(D4, "triangle", 0.028); addOsc(G4, "triangle", 0.022);
      addLFO(masterGain.gain, 0.1, 0.12);
      scheduleArp([D4, G4, A4, D5], now + 0.5, 0.12, 0.08, 0.02, "triangle");
      break;
    }
    case "Aprendizado": {
      addOsc(E4, "sine", 0.025); addOsc(A4, "sine", 0.02);
      scheduleArp([E4, A4, B4, E5], now + 0.5, 0.18, 0.12, 0.02, "sine");
      break;
    }
    case "Concentracao": {
      addOsc(F4, "sine", 0.025); addOsc(C5, "sine", 0.018);
      addLFO(masterGain.gain, 0.15, 0.08);
      scheduleArp([F4, A4, C5, A4], now + 0.5, 0.1, 0.06, 0.02, "triangle");
      break;
    }

    // ── Tecnologia ──
    case "Codigo Binario": {
      const f1 = addFilt(900);
      for (let i = 0; i < 300; i++) {
        const t = now + i * 0.18;
        const fr = [220, 330, 440, 550][i % 4];
        scheduleNote(fr, t, 0.08, 0.03, "square");
        scheduleNote(fr * 1.5, t + 0.09, 0.06, 0.015, "sawtooth");
      }
      nodes.push(f1);
      break;
    }
    case "Sistema Ativo": {
      const f2 = addFilt(1000);
      addOsc(110, "square", 0.015); addOsc(165, "square", 0.01);
      for (let i = 0; i < 300; i++) {
        const t = now + i * 0.15;
        scheduleNote(330 + (i % 5) * 110, t, 0.06, 0.025, "square");
      }
      nodes.push(f2);
      break;
    }
    case "Processamento": {
      const f3 = addFilt(850);
      addLFO(f3.frequency, 0.1, 200);
      for (let i = 0; i < 300; i++) {
        const t = now + i * 0.12;
        scheduleNote(220 * (1 + (i % 8) * 0.5), t, 0.05, 0.02, "square");
      }
      nodes.push(f3);
      break;
    }
    case "Chip Quântico": {
      const f4 = addFilt(750);
      for (let i = 0; i < 300; i++) {
        const t = now + i * 0.2;
        scheduleNote(440 + (i % 7) * 88, t, 0.07, 0.025, "sawtooth");
        scheduleNote(220 + (i % 5) * 66, t + 0.1, 0.05, 0.015, "square");
      }
      nodes.push(f4);
      break;
    }

    // ── Mistério ──
    case "Sombras Profundas": {
      addOsc(A3, "sine", 0.025); addOsc(C4, "sine", 0.02); addOsc(Eb4, "sine", 0.015);
      const fm1 = addFilt(400, "lowpass");
      addLFO(fm1.frequency, 0.05, 100);
      nodes.push(fm1);
      break;
    }
    case "Enigma Oculto": {
      addOsc(D4, "sine", 0.022); addOsc(F4, "sine", 0.018); addOsc(Ab4, "sine", 0.012);
      const fm2 = addFilt(350, "lowpass");
      addLFO(fm2.frequency, 0.03, 80);
      nodes.push(fm2);
      break;
    }
    case "Segredo Antigo": {
      addOsc(Eb4, "sine", 0.02); addOsc(G4, "sine", 0.015); addOsc(Bb4, "sine", 0.01);
      const fm3 = addFilt(300, "lowpass");
      addLFO(fm3.frequency, 0.04, 60);
      nodes.push(fm3);
      break;
    }
    case "Nevoeiro": {
      addOsc(C4, "sine", 0.018); addOsc(Db4, "sine", 0.015); addOsc(F4, "sine", 0.012);
      const fm4 = addFilt(250, "lowpass");
      addLFO(fm4.frequency, 0.02, 50);
      nodes.push(fm4);
      break;
    }

    // ── Motivacional ──
    case "Vencer Desafios": {
      addOsc(C4, "sawtooth", 0.02); addOsc(E4, "sawtooth", 0.018); addOsc(G4, "sawtooth", 0.015);
      const fm5 = addFilt(500, "lowpass");
      for (let i = 0; i < 200; i++) fm5.frequency.setValueAtTime(300 + i * 6, now + i * 0.5);
      scheduleArp([C4, E4, G4, C5, G4, E4], now + 1, 0.1, 0.05, 0.03, "triangle");
      nodes.push(fm5);
      break;
    }
    case "Nova Conquista": {
      addOsc(F4, "sawtooth", 0.02); addOsc(A4, "sawtooth", 0.015); addOsc(C5, "sawtooth", 0.012);
      const fm6 = addFilt(550, "lowpass");
      for (let i = 0; i < 200; i++) fm6.frequency.setValueAtTime(350 + i * 5, now + i * 0.4);
      scheduleArp([F4, A4, C5, A4, F4, G4], now + 1, 0.12, 0.06, 0.025, "triangle");
      nodes.push(fm6);
      break;
    }
    case "Superacao": {
      addOsc(G4, "sawtooth", 0.018); addOsc(B4, "sawtooth", 0.015); addOsc(D5, "sawtooth", 0.012);
      const fm7 = addFilt(600, "lowpass");
      for (let i = 0; i < 200; i++) fm7.frequency.setValueAtTime(400 + i * 4, now + i * 0.6);
      scheduleArp([G4, B4, D5, G5, D5, B4], now + 1, 0.08, 0.04, 0.03, "triangle");
      nodes.push(fm7);
      break;
    }
    case "Fogo Interior": {
      addOsc(A4, "sawtooth", 0.02); addOsc(C5, "sawtooth", 0.015); addOsc(E5, "sawtooth", 0.01);
      const fm8 = addFilt(650, "lowpass");
      for (let i = 0; i < 200; i++) fm8.frequency.setValueAtTime(450 + i * 3, now + i * 0.7);
      scheduleArp([A4, C5, E5, C5, A4, E4], now + 1, 0.1, 0.05, 0.02, "triangle");
      nodes.push(fm8);
      break;
    }

    // ── Financeira ──
    case "Mercado Estavel": {
      addOsc(C4, "triangle", 0.025); addOsc(G4, "triangle", 0.02);
      addLFO(masterGain.gain, 0.15, 0.08);
      scheduleArp([C4, G4, E4, G4, C4, D4], now + 0.5, 0.2, 0.15, 0.015, "triangle");
      break;
    }
    case "Investimento Seguro": {
      addOsc(D4, "triangle", 0.022); addOsc(A4, "triangle", 0.018);
      addLFO(masterGain.gain, 0.12, 0.1);
      scheduleArp([D4, A4, F4, A4, D4, E4], now + 0.5, 0.22, 0.18, 0.012, "triangle");
      break;
    }
    case "Crescimento": {
      addOsc(E4, "sine", 0.025); addOsc(G4, "sine", 0.02); addOsc(B4, "sine", 0.015);
      addLFO(masterGain.gain, 0.1, 0.12);
      scheduleArp([E4, G4, B4, E5, B4, G4], now + 0.5, 0.18, 0.12, 0.02, "sine");
      break;
    }
    case "Carteira Diversa": {
      addOsc(F4, "sine", 0.022); addOsc(A4, "sine", 0.018); addOsc(C5, "sine", 0.012);
      addLFO(masterGain.gain, 0.08, 0.1);
      scheduleArp([F4, A4, C5, F5, C5, A4], now + 0.5, 0.15, 0.1, 0.018, "sine");
      break;
    }

    // ── Futurista ──
    case "Nova Era": {
      const ff1 = addFilt(1100);
      addOsc(110, "sawtooth", 0.015);
      for (let i = 0; i < 300; i++) {
        const t = now + i * 0.16;
        scheduleNote(440 * (1 + Math.sin(i * 0.3) * 0.3), t, 0.08, 0.02, "sawtooth");
      }
      nodes.push(ff1);
      break;
    }
    case "Cidade Neon": {
      const ff2 = addFilt(1200);
      addOsc(165, "square", 0.012);
      for (let i = 0; i < 300; i++) {
        const t = now + i * 0.14;
        scheduleNote(330 * (1 + Math.sin(i * 0.2) * 0.4), t, 0.06, 0.025, "square");
      }
      nodes.push(ff2);
      break;
    }
    case "Viagem Estelar": {
      const ff3 = addFilt(950);
      for (let i = 0; i < 300; i++) {
        const t = now + i * 0.2;
        scheduleNote(220 * (1 + (i % 12) * 0.25), t, 0.1, 0.02, "sawtooth");
      }
      nodes.push(ff3);
      break;
    }
    case "Realidade Virtual": {
      const ff4 = addFilt(1050);
      addLFO(ff4.frequency, 0.08, 300);
      for (let i = 0; i < 300; i++) {
        const t = now + i * 0.18;
        scheduleNote(550 + Math.sin(i * 0.5) * 220, t, 0.07, 0.02, "square");
      }
      nodes.push(ff4);
      break;
    }

    // ── Lo-fi ──
    case "Chuva Suave": {
      addOsc(C4, "sine", 0.025, 5); addOsc(C4, "sine", 0.025, -5);
      addOsc(E4, "sine", 0.02, 3); addOsc(G4, "sine", 0.015, -3);
      addLFO(masterGain.gain, 0.1, 0.15);
      const lf1 = addFilt(1100, "lowpass");
      nodes.push(lf1);
      break;
    }
    case "Café e Livro": {
      addOsc(D4, "sine", 0.022, 4); addOsc(D4, "sine", 0.022, -4);
      addOsc(F4, "sine", 0.018, 2); addOsc(A4, "sine", 0.012, -2);
      addLFO(masterGain.gain, 0.08, 0.12);
      const lf2 = addFilt(1000, "lowpass");
      nodes.push(lf2);
      break;
    }
    case "Tarde Tranquila": {
      addOsc(E4, "sine", 0.02, 5); addOsc(E4, "sine", 0.02, -5);
      addOsc(G4, "sine", 0.015, 3); addOsc(B4, "sine", 0.01, -3);
      addLFO(masterGain.gain, 0.06, 0.1);
      const lf3 = addFilt(900, "lowpass");
      nodes.push(lf3);
      break;
    }
    case "Noite Urbana": {
      addOsc(F4, "sine", 0.02, 4); addOsc(F4, "sine", 0.02, -4);
      addOsc(A4, "sine", 0.015, 2); addOsc(C5, "sine", 0.01, -2);
      addLFO(masterGain.gain, 0.12, 0.18);
      const lf4 = addFilt(850, "lowpass");
      nodes.push(lf4);
      break;
    }

    // ── Quiz Clássico ──
    case "Gincana": {
      addOsc(C4, "triangle", 0.03); addOsc(E4, "triangle", 0.025); addOsc(G4, "triangle", 0.02);
      addLFO(masterGain.gain, 0.2, 0.2);
      scheduleArp([C4, E4, G4, C5, G4, E4, D4, F4], now + 0.5, 0.08, 0.04, 0.03, "triangle");
      break;
    }
    case "Desafio Final": {
      addOsc(F4, "triangle", 0.028); addOsc(A4, "triangle", 0.022); addOsc(C5, "triangle", 0.018);
      addLFO(masterGain.gain, 0.25, 0.22);
      scheduleArp([F4, A4, C5, F5, C5, A4, G4, Bb4], now + 0.5, 0.06, 0.03, 0.035, "triangle", 0.72);
      break;
    }
    case "Sabedoria": {
      addOsc(G4, "sine", 0.025); addOsc(B4, "sine", 0.02); addOsc(D5, "sine", 0.015);
      addLFO(masterGain.gain, 0.18, 0.15);
      scheduleArp([G4, B4, D5, G5, D5, B4, A4, C5], now + 0.5, 0.1, 0.05, 0.025, "sine");
      break;
    }
    case "Campeao": {
      addOsc(C4, "sawtooth", 0.025); addOsc(E4, "sawtooth", 0.02); addOsc(G4, "sawtooth", 0.015);
      const fc = addFilt(700, "lowpass");
      for (let i = 0; i < 200; i++) fc.frequency.setValueAtTime(500 + Math.sin(i * 0.1) * 200, now + i * 0.3);
      scheduleArp([C4, G4, E4, C5, G4, E4, D4, A4], now + 0.5, 0.07, 0.04, 0.03, "triangle");
      nodes.push(fc);
      break;
    }

    default: break;
  }

  return nodes;
}

export default function useBackgroundMusic() {
  const [currentTrack, setCurrentTrack] = useState(() => localStorage.getItem("brane_music") || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(() => parseFloat(localStorage.getItem("brane_music_vol") || "0.3"));

  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const nodesRef = useRef([]);
  const trackRef = useRef("");
  const volRef = useRef(volume);

  const stop = useCallback(() => {
    nodesRef.current.forEach((n) => {
      try { n.stop(); } catch (e) { /* already stopped */ }
    });
    nodesRef.current = [];
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      try { ctxRef.current.close(); } catch (e) { /* ignore */ }
    }
    ctxRef.current = null;
    masterGainRef.current = null;
    setIsPlaying(false);
  }, []);

  const play = useCallback((track) => {
    if (!track) { stop(); return; }
    stop();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = volRef.current;
    master.connect(ctx.destination);
    masterGainRef.current = master;
    const n = startTrack(ctx, master, track);
    nodesRef.current = n;
    trackRef.current = track;
    setCurrentTrack(track);
    setIsPlaying(true);
  }, [stop]);

  const toggle = useCallback((track) => {
    if (isPlaying && trackRef.current === track) {
      stop();
    } else {
      play(track);
      localStorage.setItem("brane_music", track);
    }
  }, [isPlaying, play, stop]);

  const setVolume = useCallback((v) => {
    const vol = Math.max(0, Math.min(1, v));
    volRef.current = vol;
    setVolumeState(vol);
    localStorage.setItem("brane_music_vol", String(vol));
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = vol;
    }
  }, []);

  const selectTrack = useCallback((track) => {
    setCurrentTrack(track);
    localStorage.setItem("brane_music", track);
    if (isPlaying) {
      play(track);
    }
  }, [isPlaying, play]);

  const nextTrack = useCallback(() => {
    const current = trackRef.current;
    const idx = ALL_TRACKS.indexOf(current);
    const next = idx >= 0 && idx < ALL_TRACKS.length - 1 ? ALL_TRACKS[idx + 1] : ALL_TRACKS[0];
    play(next);
    localStorage.setItem("brane_music", next);
  }, [play]);

  const randomTrack = useCallback(() => {
    const current = trackRef.current;
    let next;
    do {
      next = ALL_TRACKS[Math.floor(Math.random() * ALL_TRACKS.length)];
    } while (next === current && ALL_TRACKS.length > 1);
    play(next);
    localStorage.setItem("brane_music", next);
  }, [play]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    currentTrack, isPlaying, volume, setVolume,
    play, stop, toggle, selectTrack, nextTrack, randomTrack,
    tracks: ALL_TRACKS, categories: CATEGORIES,
  };
}

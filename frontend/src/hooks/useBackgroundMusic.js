import { useState, useRef, useCallback, useEffect } from "react";

const TRACKS = [
  "Alegre 1", "Alegre 2", "Alegre 3",
  "Tecnologia", "Lo-fi", "Motivacional",
  "Suspense leve", "Infantil",
];

function freq(note) { return 440 * Math.pow(2, (note - 69) / 12); }
const C4 = freq(60), E4 = freq(64), G4 = freq(67), C5 = freq(72);
const F4 = freq(65), A4 = freq(69);
const D4 = freq(62), A3 = freq(57);
const Eb4 = freq(63), Ab4 = freq(68), Bb4 = freq(70);

function startTrack(ctx, masterGain, type) {
  const now = ctx.currentTime;
  const nodes = [];

  const addOsc = (f, type, gain, detune = 0, filterFreq = null) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = f;
    osc.detune.value = detune;

    let chain = osc;
    if (filterFreq) {
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = filterFreq;
      chain.connect(filt);
      chain = filt;
    }

    const g = ctx.createGain();
    g.gain.value = gain;
    chain.connect(g);
    g.connect(masterGain);
    osc.start(now);
    nodes.push(osc);
    return { osc, gain: g };
  };

  const addLFO = (target, param, rate, amount) => {
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = rate;
    const lfoG = ctx.createGain();
    lfoG.gain.value = amount;
    lfo.connect(lfoG);
    lfoG.connect(param);
    lfo.start(now);
    nodes.push(lfo);
  };

  const scheduleNote = (freq, startTime, duration, gainVal, waveType = "sine") => {
    const osc = ctx.createOscillator();
    osc.type = waveType;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.05);
    g.gain.setValueAtTime(gainVal, startTime + duration - 0.05);
    g.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
    nodes.push(osc);
  };

  const scheduleArp = (notes, baseTime, noteDuration, gap, gainVal, waveType = "sine", repeatEvery = null) => {
    const repeat = repeatEvery || notes.length * (noteDuration + gap);
    for (let i = 0; i < 200; i++) {
      const n = notes[i % notes.length];
      const t = baseTime + i * (noteDuration + gap);
      scheduleNote(n, t, noteDuration, gainVal, waveType);
    }
  };

  switch (type) {
    case "Alegre 1": {
      addOsc(C4, "sine", 0.04);
      addOsc(E4, "sine", 0.04);
      addOsc(G4, "sine", 0.04);
      const mod = ctx.createGain(); mod.gain.value = 0.5;
      const osc2 = ctx.createOscillator(); osc2.type = "sine"; osc2.frequency.value = 0.25;
      osc2.connect(mod); mod.connect(masterGain.gain); osc2.start(now);
      nodes.push(osc2);
      scheduleArp([C4, E4, G4, C5, G4, E4], now + 0.5, 0.12, 0.06, 0.03, "triangle");
      break;
    }
    case "Alegre 2": {
      addOsc(F4, "sine", 0.04);
      addOsc(A4, "sine", 0.035);
      addOsc(C5, "sine", 0.03);
      addLFO(ctx.createOscillator(), masterGain.gain, 0.3, 0.3);
      scheduleArp([F4, A4, C5, A4, F4, G4, E4, C4], now + 0.5, 0.15, 0.08, 0.025, "triangle");
      break;
    }
    case "Alegre 3": {
      addOsc(G4, "sine", 0.045);
      addOsc(Bb4, "sine", 0.035);
      addOsc(D5, "sine", 0.03);
      addLFO(ctx.createOscillator(), masterGain.gain, 0.35, 0.25);
      scheduleArp([G4, Bb4, D5, G5, D5, Bb4, G4, D4], now + 0.5, 0.1, 0.05, 0.03, "triangle");
      break;
    }
    case "Tecnologia": {
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 800;
      masterGain.disconnect(); ctx.createGain().connect(f); f.connect(ctx.destination);
      const techG = ctx.createGain(); techG.gain.value = 0.03;
      techG.connect(f);
      nodes.push(f);
      for (let i = 0; i < 300; i++) {
        const t = now + i * 0.2;
        const fqs = [220, 330, 440, 550, 660, 880];
        const fr = fqs[i % fqs.length] * (1 + Math.sin(i * 0.5) * 0.02);
        scheduleNote(fr, t, 0.1, 0.04, "square");
        scheduleNote(fr / 2, t + 0.1, 0.08, 0.02, "sawtooth");
      }
      break;
    }
    case "Lo-fi": {
      addOsc(C4, "sine", 0.03, 5);
      addOsc(C4, "sine", 0.03, -5);
      addOsc(E4, "sine", 0.025, 3);
      addOsc(G4, "sine", 0.02, -3);
      addLFO(ctx.createOscillator(), masterGain.gain, 0.15, 0.2);
      const filt2 = ctx.createBiquadFilter(); filt2.type = "lowpass"; filt2.frequency.value = 1200;
      masterGain.disconnect(); filt2.connect(ctx.destination);
      masterGain.connect(filt2);
      nodes.push(filt2);
      break;
    }
    case "Motivacional": {
      addOsc(C4, "sawtooth", 0.02);
      addOsc(E4, "sawtooth", 0.02);
      addOsc(G4, "sawtooth", 0.02);
      addOsc(C5, "sawtooth", 0.015);
      const filt3 = ctx.createBiquadFilter(); filt3.type = "lowpass"; filt3.frequency.value = 600;
      const sweepGain = ctx.createGain(); sweepGain.gain.value = 1;
      masterGain.disconnect(); masterGain.connect(filt3); filt3.connect(ctx.destination);
      nodes.push(filt3);
      // Filter sweep
      for (let i = 0; i < 200; i++) {
        const t = now + i * 0.5;
        filt3.frequency.setValueAtTime(200 + i * 8, t);
      }
      break;
    }
    case "Suspense leve": {
      addOsc(A3, "sine", 0.03);
      addOsc(C4, "sine", 0.025);
      addOsc(Eb4, "sine", 0.02);
      addOsc(freq(65), "sine", 0.015);
      addLFO(ctx.createOscillator(), masterGain.gain, 0.08, 0.15);
      const filt4 = ctx.createBiquadFilter(); filt4.type = "lowpass"; filt4.frequency.value = 500;
      masterGain.disconnect(); masterGain.connect(filt4); filt4.connect(ctx.destination);
      nodes.push(filt4);
      // Slow filter movement
      for (let i = 0; i < 200; i++) {
        const t = now + i * 1;
        filt4.frequency.setValueAtTime(300 + Math.sin(i * 0.2) * 150, t);
      }
      break;
    }
    case "Infantil": {
      addOsc(C5, "sine", 0.03);
      addOsc(E5, "sine", 0.025);
      addOsc(G5, "sine", 0.02);
      addLFO(ctx.createOscillator(), masterGain.gain, 0.5, 0.3);
      scheduleArp([C5, E5, G5, C6, G5, E5, D5, C5], now + 0.5, 0.08, 0.04, 0.035, "triangle");
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

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { currentTrack, isPlaying, volume, setVolume, play, stop, toggle, selectTrack, tracks: TRACKS };
}

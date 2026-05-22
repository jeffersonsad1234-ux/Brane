/**
 * Voice Engine — simplified. Only background music creation kept.
 * Per-category dynamic soundtrack generation.
 */
import { getVozesDisponiveis } from "./ttsEngine";

export { getVozesDisponiveis };

export async function generateVoiceAudio(text, voiceId, onLog) {
  if (onLog) onLog('ℹ️ Voz/personagem IA: módulo futuro separado (brane-media-worker)');
  return { success: false, blob: null, voiceId, duration: 0, method: 'none', error: 'Módulo separado — não implementado no React', logs: [] };
}

// ── Per-category music generators ──

function genKick(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;
  // Kick on every beat
  if (phase < 0.05) {
    const env = Math.exp(-phase * 120);
    return Math.sin(2 * Math.PI * (80 - phase * 600) * t) * env * 0.35;
  }
  return 0;
}

function genHihat(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;
  // Hi-hat on off-beats (8th notes)
  if (phase > 0.45 && phase < 0.55) {
    return (Math.random() * 2 - 1) * Math.exp(-phase * 80) * 0.08;
  }
  return 0;
}

// ── Gamer: Heavy bass, cyberpunk synths, 150 BPM ──

function genGamerMusic(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;

  // Heavy distorted kick
  let s = genKick(sr, t, beatDur);

  // 808-style sub bass on beat 0 and 2
  if (beat % 4 === 0 || beat % 4 === 2) {
    const freq = 40 + (beat % 8) * 5;
    s += Math.sin(2 * Math.PI * freq * t) * Math.exp(-phase * 8) * 0.2;
  }

  // Cyberpunk arpeggio (fast notes)
  const arpNotes = [220, 277.18, 329.63, 440, 554.37, 659.25, 880, 1108.73];
  const arpIdx = Math.floor(beat * 2) % arpNotes.length;
  const arpEnv = Math.max(0, 1 - phase * 6);
  s += Math.sin(2 * Math.PI * arpNotes[arpIdx] * t) * arpEnv * 0.08;

  // Distorted saw wave on beat 1 and 3
  if (beat % 2 === 1) {
    const saw = 2 * ((t * 110) % 1) - 1;
    s += saw * Math.exp(-phase * 4) * 0.06;
  }

  // Noise sweep every 8 beats
  if (beat % 8 === 0 && phase < 0.1) {
    s += (Math.random() * 2 - 1) * (1 - phase * 10) * 0.04;
  }

  return s;
}

// ── Fitness / Phonk: 808 beat, cowbell, 145 BPM ──

function genFitnessMusic(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;

  let s = genKick(sr, t, beatDur);

  // 808 bass
  if (beat % 4 === 0) {
    s += Math.sin(2 * Math.PI * 55 * t) * Math.exp(-phase * 10) * 0.22;
  }
  if (beat % 4 === 2) {
    s += Math.sin(2 * Math.PI * 70 * t) * Math.exp(-phase * 8) * 0.18;
  }

  // Cowbell on beats 1 and 3
  if (Math.abs(phase - 0.5) < 0.03 || Math.abs(phase - 0.0) < 0.03) {
    s += Math.sin(2 * Math.PI * 800 * t) * Math.exp(-phase * 60) * 0.05;
  }

  // Motivational brass stabs
  if (beat % 8 === 0 && phase < 0.1) {
    s += Math.sin(2 * Math.PI * 440 * t) * (1 - phase * 10) * 0.07;
  }

  s += genHihat(sr, t, beatDur);
  return s;
}

// ── Cozinha: Clean guitar-like, soft perc, 115 BPM ──

function genCozinhaMusic(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;

  let s = genKick(sr, t, beatDur);
  s += genHihat(sr, t, beatDur);

  // Warm guitar-like pluck on beat 0 and 2
  if (beat % 2 === 0) {
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66];
    const note = notes[beat % notes.length];
    const env = Math.max(0, 1 - phase * 5) * 0.1;
    s += Math.sin(2 * Math.PI * note * t) * env;
    s += Math.sin(2 * Math.PI * note * 2 * t) * env * 0.3;
  }

  // Soft pad
  const padNotes = [261.63, 329.63, 392.00];
  for (const f of padNotes) {
    s += Math.sin(2 * Math.PI * f * t) * 0.015;
  }

  return s;
}

// ── Beleza: Dreamy pads, gentle plucks, 110 BPM ──

function genBelezaMusic(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;

  let s = genKick(sr, t, beatDur);
  // Softer kick
  if (phase < 0.05) {
    const env = Math.exp(-phase * 80);
    s += Math.sin(2 * Math.PI * (100 - phase * 400) * t) * env * 0.15;
  }

  // Dreamy pad
  const padNotes = [523.25, 659.25, 783.99, 1046.50];
  for (const f of padNotes) {
    s += Math.sin(2 * Math.PI * f * t) * 0.02;
  }

  // Gentle pluck melody
  if (beat % 2 === 0 && phase < 0.05) {
    const notes = [659.25, 783.99, 880, 783.99, 659.25, 587.33, 523.25, 587.33];
    const note = notes[Math.floor(beat / 2) % notes.length];
    const env = Math.max(0, 1 - phase * 12);
    const pluck = Math.sin(2 * Math.PI * note * t) * env * 0.07;
    s += pluck + Math.sin(2 * Math.PI * note * 2 * t) * env * 0.02;
  }

  // Sparkle on beat 1
  if (Math.abs(phase - 0.5) < 0.02) {
    s += Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-phase * 100) * 0.03;
  }

  return s;
}

// ── Pet: Cheerful, bouncy, 125 BPM ──

function genPetMusic(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;

  let s = genKick(sr, t, beatDur);

  // Bouncy synth lead — playful pattern
  if ((beat % 2 === 0 || beat % 4 === 3) && phase < 0.08) {
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 659.25, 587.33, 523.25];
    const note = notes[beat % notes.length];
    const env = Math.max(0, 1 - phase * 10);
    s += Math.sin(2 * Math.PI * note * t) * env * 0.1;
  }

  // Whistle/hum
  const humNotes = [392.00, 440, 523.25, 587.33];
  const hn = humNotes[beat % humNotes.length];
  s += Math.sin(2 * Math.PI * hn * t) * 0.025;

  s += genHihat(sr, t, beatDur);
  return s;
}

// ── Moda: Chic groove, filtered, 120 BPM ──

function genModaMusic(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;

  let s = genKick(sr, t, beatDur);

  // Groove bass
  if (beat % 4 === 0 || beat % 4 === 2) {
    s += Math.sin(2 * Math.PI * 65 * t) * Math.exp(-phase * 6) * 0.18;
  }

  // Chic pluck — filtered square
  if (beat % 2 === 0 && phase < 0.04) {
    const notes = [440, 523.25, 587.33, 659.25];
    const note = notes[Math.floor(beat / 2) % notes.length];
    const env = Math.max(0, 1 - phase * 10);
    let pluck = Math.sin(2 * Math.PI * note * t);
    pluck += Math.sin(2 * Math.PI * note * 1.5 * t) * 0.3;
    pluck += Math.sin(2 * Math.PI * note * 2 * t) * 0.1;
    s += pluck * env * 0.06;
  }

  // Clap on beat 2 and 4
  if (Math.abs(phase - 0.5) < 0.03 && (beat % 4 === 1 || beat % 4 === 3)) {
    s += (Math.random() * 2 - 1) * Math.exp(-phase * 80) * 0.07;
  }

  return s;
}

// ── Casa: Warm ambient, soft rhythm, 110 BPM ──

function genCasaMusic(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;
  let s = 0;

  // Soft kick
  if (phase < 0.05) {
    const env = Math.exp(-phase * 60);
    s += Math.sin(2 * Math.PI * (90 - phase * 300) * t) * env * 0.12;
  }

  // Warm pad
  const pad = [261.63, 293.66, 329.63, 392.00];
  for (const f of pad) {
    s += Math.sin(2 * Math.PI * f * t) * 0.02;
  }

  // Gentle Rhodes-like chords
  if (beat % 2 === 0 && phase < 0.1) {
    const chordNotes = [392.00, 523.25, 659.25];
    for (const f of chordNotes) {
      const env = Math.max(0, 1 - phase * 6);
      s += Math.sin(2 * Math.PI * f * t) * env * 0.04;
    }
  }

  // Soft shaker
  if (phase > 0.2 && phase < 0.3 || phase > 0.7 && phase < 0.8) {
    s += (Math.random() * 2 - 1) * 0.02;
  }

  return s;
}

// ── Tecnologia: Cold synths, glitchy, 135 BPM ──

function genTecnologiaMusic(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;

  let s = genKick(sr, t, beatDur);

  // Sub bass pulse
  if (beat % 4 === 0 || beat % 4 === 2) {
    s += Math.sin(2 * Math.PI * 50 * t) * Math.exp(-phase * 6) * 0.18;
  }

  // Cold arpeggio — fast, detuned
  const arpBase = 440;
  const detune = Math.sin(beat * 0.5) * 10;
  const arpNotes = [arpBase * Math.pow(2, detune / 1200), arpBase * 1.5, arpBase * 2, arpBase * 2.5];
  const arpIdx = Math.floor(beat * 3) % arpNotes.length;
  const arpEnv = Math.max(0, 1 - phase * 8);
  s += Math.sin(2 * Math.PI * arpNotes[arpIdx] * t) * arpEnv * 0.07;

  // Glitch effect — stutter on 16th notes
  const bitPhase = (t % (beatDur / 4)) / (beatDur / 4);
  if (bitPhase < 0.5) {
    s += (Math.random() * 2 - 1) * 0.015;
  }

  // Metallic ping on beat 1
  if (Math.abs(phase - 0.0) < 0.02 || Math.abs(phase - 0.5) < 0.02) {
    s += Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-phase * 80) * 0.04;
  }

  return s;
}

// ── Default: modern electronic ──

function genDefaultMusic(sr, t, beatDur) {
  const beat = Math.floor(t / beatDur);
  const phase = (t % beatDur) / beatDur;
  let s = genKick(sr, t, beatDur);
  s += genHihat(sr, t, beatDur);
  const notes = [261.63, 329.63, 392.00, 523.25];
  const note = notes[beat % notes.length];
  s += Math.sin(2 * Math.PI * note * t) * Math.max(0, 1 - phase * 4) * 0.06;
  return s;
}

// ── Factory ──

const GENERATORS = {
  gamer: genGamerMusic,
  fitness: genFitnessMusic,
  cozinha: genCozinhaMusic,
  beleza: genBelezaMusic,
  pet: genPetMusic,
  moda: genModaMusic,
  casa: genCasaMusic,
  tecnologia: genTecnologiaMusic,
};

export function createBackgroundMusic(audioCtx, durationSec, bpm = 128, category = 'default') {
  const sr = audioCtx.sampleRate;
  const total = durationSec * sr;
  const beatDur = 60 / bpm;
  const buffer = audioCtx.createBuffer(2, total, sr);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const gen = GENERATORS[category] || genDefaultMusic;

  for (let i = 0; i < total; i++) {
    const t = i / sr;
    const s = Math.max(-0.9, Math.min(0.9, gen(sr, t, beatDur)));
    left[i] = s * 0.7;
    right[i] = s * 0.7;
  }

  return buffer;
}

export function getBeatTimes(bpm, durationSec) {
  const beatDur = 60 / bpm;
  const beats = [];
  for (let t = 0; t < durationSec; t += beatDur) {
    beats.push(t);
  }
  return beats;
}

export async function createMixedAudio(audioCtx, durationSec, voiceBuffer, voiceDuration, bpm = 128, category = 'default') {
  const sr = audioCtx.sampleRate;
  const total = durationSec * sr;
  const music = createBackgroundMusic(audioCtx, durationSec, bpm, category);
  const mixed = audioCtx.createBuffer(2, total, sr);

  for (let ch = 0; ch < 2; ch++) {
    const m = music.getChannelData(ch);
    const d = mixed.getChannelData(ch);
    for (let i = 0; i < total; i++) d[i] = m[i] * 0.15;
  }

  if (voiceBuffer) {
    const len = Math.min(voiceBuffer.length, total);
    for (let ch = 0; ch < Math.min(voiceBuffer.numberOfChannels, 2); ch++) {
      const v = voiceBuffer.getChannelData(ch);
      const d = mixed.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] += v[i] * 1.0;
    }
  }

  return mixed;
}

export async function createAudioStreamWithVoice(audioCtx, durationSec, voiceBlob, voiceDuration, bpm = 128, category = 'default') {
  let voiceBuffer = null;
  let decodeError = null;

  if (voiceBlob) {
    try {
      const arrayBuffer = await voiceBlob.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      voiceBuffer = audioBuffer;
    } catch (e) {
      decodeError = e.message;
    }
  }

  const mixed = await createMixedAudio(audioCtx, durationSec, voiceBuffer, voiceDuration, bpm, category);
  const source = audioCtx.createBufferSource();
  source.buffer = mixed;
  source.loop = false;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(1, audioCtx.currentTime);

  source.connect(gain);
  const dest = audioCtx.createMediaStreamDestination();
  gain.connect(dest);

  return { source, dest, gain, decodeError };
}

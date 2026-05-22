/**
 * Voice Engine — TTS generation, background music, and audio mixing.
 * Volume: voz 100%, música 15%.
 */
import { generateTTSAudio, decodeTTSBlob, getVozesDisponiveis, speakWithWebSpeech } from "./ttsEngine";

export { getVozesDisponiveis, speakWithWebSpeech };

export async function generateVoiceAudio(text, voiceId = 'pt-BR-FranciscaNeural', onLog) {
  return generateTTSAudio(text, voiceId, onLog);
}

export function createBackgroundMusic(audioCtx, durationSec, bpm = 100) {
  const sr = audioCtx.sampleRate;
  const total = durationSec * sr;
  const beatDur = 60 / bpm;
  const buffer = audioCtx.createBuffer(2, total, sr);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < total; i++) {
    const t = i / sr;
    const beat = Math.floor(t / beatDur);
    const phase = (t % beatDur) / beatDur;

    let s = 0;
    if (beat % 4 === 0 || beat % 4 === 2) {
      s += Math.sin(2 * Math.PI * 60 * t) * Math.exp(-phase * 20) * 0.12;
    }
    if (phase < 0.5) {
      s += (Math.random() * 2 - 1) * Math.exp(-phase * 40) * 0.03;
    }
    const notes = [130.81, 146.83, 164.81, 174.61];
    const note = notes[beat % notes.length];
    s += Math.sin(2 * Math.PI * note * t) * Math.max(0, 1 - phase * 4) * 0.06;

    for (const f of [261.63, 329.63, 392.00]) {
      s += Math.sin(2 * Math.PI * f * t) * 0.01;
    }
    s = Math.max(-1, Math.min(1, s));
    left[i] = s;
    right[i] = s;
  }
  return buffer;
}

export async function createMixedAudio(audioCtx, durationSec, voiceBuffer, voiceDuration) {
  const sr = audioCtx.sampleRate;
  const total = durationSec * sr;
  const music = createBackgroundMusic(audioCtx, durationSec, 100);
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

export async function createAudioStreamWithVoice(audioCtx, durationSec, voiceBlob, voiceDuration) {
  let voiceBuffer = null;
  let decodeError = null;

  if (voiceBlob) {
    try {
      const { audioBuffer } = await decodeTTSBlob(voiceBlob);
      voiceBuffer = audioBuffer;
    } catch (e) {
      decodeError = e.message;
    }
  }

  const mixed = await createMixedAudio(audioCtx, durationSec, voiceBuffer, voiceDuration);
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

/**
 * Voice Engine — TTS voice generation + AudioContext background music.
 * Uses Edge TTS API for natural PT-BR narration.
 */
import { generateTTSAudio, decodeTTSBlob, getVozesDisponiveis } from "./ttsEngine";

export { getVozesDisponiveis };

export async function generateVoiceAudio(text, voiceId = 'pt-BR-FranciscaNeural') {
  try {
    const result = await generateTTSAudio(text, voiceId);
    return result;
  } catch (err) {
    console.warn('Edge TTS failed, using fallback:', err.message);
    return {
      success: false,
      error: err.message,
      blob: null,
      voiceId,
      duration: 0,
    };
  }
}

export function createBackgroundMusic(audioCtx, durationSec, bpm = 120) {
  const sampleRate = audioCtx.sampleRate;
  const totalSamples = durationSec * sampleRate;
  const beatDuration = 60 / bpm;

  const buffer = audioCtx.createBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const beat = Math.floor(t / beatDuration);
    const beatPhase = (t % beatDuration) / beatDuration;

    let sample = 0;
    if (beat % 4 === 0 || beat % 4 === 2) {
      const kickEnv = Math.exp(-beatPhase * 20);
      sample += Math.sin(2 * Math.PI * 60 * t) * kickEnv * 0.15;
    }

    if (beatPhase < 0.5) {
      const hiHatEnv = Math.exp(-beatPhase * 40);
      sample += (Math.random() * 2 - 1) * hiHatEnv * 0.04;
    }

    const bassNotes = [130.81, 146.83, 164.81, 174.61];
    const bassNote = bassNotes[beat % bassNotes.length];
    const bassEnv = Math.max(0, 1 - beatPhase * 4);
    sample += Math.sin(2 * Math.PI * bassNote * t) * bassEnv * 0.08;

    const chordFreqs = [261.63, 329.63, 392.00];
    for (const f of chordFreqs) {
      sample += Math.sin(2 * Math.PI * f * t) * 0.015;
    }

    left[i] = Math.max(-1, Math.min(1, sample * 0.7));
    right[i] = Math.max(-1, Math.min(1, sample * 0.7));
  }

  return buffer;
}

export async function createMixedAudio(audioCtx, durationSec, voiceBuffer, voiceDuration) {
  const sampleRate = audioCtx.sampleRate;
  const totalSamples = durationSec * sampleRate;
  const musicBuffer = createBackgroundMusic(audioCtx, durationSec, 100);

  const mixedBuffer = audioCtx.createBuffer(2, totalSamples, sampleRate);

  // Copy music into mixed buffer
  for (let ch = 0; ch < 2; ch++) {
    const musicData = musicBuffer.getChannelData(ch);
    const mixedData = mixedBuffer.getChannelData(ch);
    for (let i = 0; i < totalSamples; i++) {
      mixedData[i] = musicData[i] * 0.2;
    }
  }

  // Mix voice on top (louder than music)
  if (voiceBuffer) {
    const voiceDurationSamples = Math.min(
      voiceBuffer.length,
      voiceDuration * sampleRate,
      totalSamples
    );
    for (let ch = 0; ch < Math.min(voiceBuffer.numberOfChannels, 2); ch++) {
      const voiceData = voiceBuffer.getChannelData(ch);
      const mixedData = mixedBuffer.getChannelData(ch);
      for (let i = 0; i < voiceDurationSamples; i++) {
        mixedData[i] += voiceData[i] * 0.9;
      }
    }
  }

  return mixedBuffer;
}

export async function createAudioStreamWithVoice(audioCtx, durationSec, voiceBlob, voiceDuration) {
  let voiceBuffer = null;

  if (voiceBlob) {
    try {
      const decoded = await decodeTTSBlob(voiceBlob);
      voiceBuffer = decoded.audioBuffer;
    } catch (e) {
      console.warn('Could not decode voice audio:', e);
    }
  }

  const mixedBuffer = await createMixedAudio(audioCtx, durationSec, voiceBuffer, voiceDuration);
  const source = audioCtx.createBufferSource();
  source.buffer = mixedBuffer;
  source.loop = false;

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(1, audioCtx.currentTime);

  source.connect(gainNode);
  const dest = audioCtx.createMediaStreamDestination();
  gainNode.connect(dest);

  return { source, dest, gainNode };
}

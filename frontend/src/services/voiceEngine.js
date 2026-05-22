/**
 * Voice Engine — SpeechSynthesis for natural PT-BR narration + AudioContext background music.
 */
export function speakNarration(text, onStart, onEnd) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      resolve(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('pt'));
    if (voices.length > 0) {
      utterance.voice = voices.find(v => v.name.includes('Female') || v.name.includes('Maria')) || voices[0];
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onend = () => {
      if (onEnd) onEnd();
      resolve(true);
    };
    utterance.onerror = () => resolve(null);

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export function createBackgroundMusic(audioCtx, durationSec, bpm = 120) {
  const sampleRate = audioCtx.sampleRate;
  const totalSamples = durationSec * sampleRate;
  const beatDuration = 60 / bpm;
  const beatSamples = beatDuration * sampleRate;

  const buffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Simple lo-fi beat pattern
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const beat = Math.floor(t / beatDuration);
    const beatPhase = (t % beatDuration) / beatDuration;

    // Kick on beats 0, 2
    let sample = 0;
    if (beat % 4 === 0 || beat % 4 === 2) {
      const kickEnv = Math.exp(-beatPhase * 20);
      sample += Math.sin(2 * Math.PI * 60 * t) * kickEnv * 0.15;
    }

    // Hi-hat on 8th notes
    if (beatPhase < 0.5) {
      const hiHatEnv = Math.exp(-beatPhase * 40);
      sample += (Math.random() * 2 - 1) * hiHatEnv * 0.04;
    }

    // Bass line
    const bassNotes = [130.81, 146.83, 164.81, 174.61];
    const bassNote = bassNotes[beat % bassNotes.length];
    const bassEnv = Math.max(0, 1 - beatPhase * 4);
    sample += Math.sin(2 * Math.PI * bassNote * t) * bassEnv * 0.08;

    // Pad chord
    const chordFreqs = [261.63, 329.63, 392.00];
    for (const f of chordFreqs) {
      sample += Math.sin(2 * Math.PI * f * t) * 0.015;
    }

    data[i] = Math.max(-1, Math.min(1, sample));
  }

  return buffer;
}

export function createAudioStream(audioCtx, durationSec, bpm) {
  const musicBuffer = createBackgroundMusic(audioCtx, durationSec, bpm);
  const source = audioCtx.createBufferSource();
  source.buffer = musicBuffer;
  source.loop = false;

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 2);
  gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + durationSec - 2);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + durationSec);

  source.connect(gainNode);
  const dest = audioCtx.createMediaStreamDestination();
  gainNode.connect(dest);

  return { source, dest, gainNode };
}

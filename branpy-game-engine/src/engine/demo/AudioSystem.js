export function createAudioSystem() {
  let ctx = null;
  let masterGain = null;
  let initialized = false;
  let muted = false;
  let nodes = {};

  function init() {
    if (initialized) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.12;
    masterGain.connect(ctx.destination);
    initialized = true;
    createAmbientDrone();
    createRainAmbient();
    createNeonBuzz();
  }

  function ensureResumed() {
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function createAmbientDrone() {
    if (!ctx) return;
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 110;
    const osc3 = ctx.createOscillator();
    osc3.type = "triangle";
    osc3.frequency.value = 82.5;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 4;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 120;
    filter.Q.value = 4;
    const gain = ctx.createGain();
    gain.gain.value = 0.1;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();
    nodes.ambient = { osc1, osc2, osc3, lfo, gain, filter };
  }

  function createRainAmbient() {
    if (!ctx) return;
    const sr = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sr * 3, sr);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sr * 3; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.random();
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 5000;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
    nodes.rain = { source, filter, gain };
  }

  function createNeonBuzz() {
    if (!ctx) return;
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 7000;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 7050;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 20;
    const g1 = ctx.createGain();
    g1.gain.value = 0.003;
    const g2 = ctx.createGain();
    g2.gain.value = 0.002;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    osc1.connect(g1);
    g1.connect(masterGain);
    osc2.connect(g2);
    g2.connect(masterGain);
    osc1.start();
    osc2.start();
    lfo.start();
    nodes.neon = { osc1, osc2, lfo, g1, g2 };
  }

  function playFootstep() {
    if (!ctx || muted) return;
    ensureResumed();
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.06);
    const buffer = ctx.createBuffer(1, len, sr);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 90) * 0.25;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
  }

  function playCollect() {
    if (!ctx || muted) return;
    ensureResumed();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523, now);
    osc.frequency.exponentialRampToValueAtTime(1047, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(1568, now + 0.25);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  function toggleMute() {
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.12;
    return muted;
  }

  function isMuted() { return muted; }

  function destroy() {
    Object.values(nodes).forEach((group) => {
      Object.values(group).forEach((node) => {
        try { node.disconnect(); } catch (_) {}
        try { node.stop(); } catch (_) {}
      });
    });
    nodes = {};
    if (ctx) { ctx.close(); ctx = null; }
    initialized = false;
  }

  return { init, playFootstep, playCollect, toggleMute, isMuted, destroy };
}

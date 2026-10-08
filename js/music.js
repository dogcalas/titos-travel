// Música de fondo: un beat de reparto (reguetón cubano) sintetizado con Web Audio.
// Dembow + bajo 808 con tumbao + clave + congas + sintes oscuros. Cambia de tono y tempo por dimensión,
// y se "enfría" (filtro, tempo) cuando la Neblina gana terreno.
// Si existe ASSETS.audio.music (p. ej. assets/audio/reparto.mp3), se reproduce ese archivo en bucle en su lugar.

window.Reparto = (function () {
  let ctx, out, lp, duck;
  let playing = false;
  let nextTime = 0;
  let step = 0;
  let timer = null;
  let fileAudio = null;
  let muted = false;

  // Perfil musical por dimensión: tempo, nota raíz (MIDI) y progresión (semitonos relativos, menor).
  const PROFILES = {
    miami:     { bpm: 92,  root: 45, prog: [0, -4, 3, -2], dark: 1.0 },
    malecon:   { bpm: 96,  root: 45, prog: [0, -4, 3, -2], dark: 0.6 },
    solar:     { bpm: 98,  root: 47, prog: [0, 5, -2, 3], dark: 0.4 },
    parque:    { bpm: 100, root: 50, prog: [0, -4, 3, 5], dark: 0.3 },
    bodega:    { bpm: 97,  root: 43, prog: [0, 3, -2, 5], dark: 0.5 },
    cabana:    { bpm: 94,  root: 41, prog: [0, -4, -2, 3], dark: 0.8 },
    almendron: { bpm: 102, root: 48, prog: [0, 5, 3, -2], dark: 0.4 },
    carnaval:  { bpm: 106, root: 50, prog: [0, 3, 5, -2], dark: 0.2 },
    vinales:   { bpm: 95,  root: 45, prog: [0, -2, -4, 3], dark: 0.5 },
    ceiba:     { bpm: 90,  root: 43, prog: [0, -4, 3, -2], dark: 0.9 }
  };
  let profile = PROFILES.miami;
  let warmth = 1;

  // Patrones de 16 semicorcheas.
  const KICK  = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
  const SNARE = [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0]; // dembow
  const HAT   = [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1];
  const CLAVE = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0]; // clave 3-2
  const CONGA = [0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1];
  // Tumbao de bajo: grado del acorde (0=raíz, 7=quinta, 12=octava) o null.
  const BASS  = [0, null, null, 0, null, null, 7, null, 0, null, null, 12, null, null, 7, null];
  // Riff de sinte (intervalos sobre la raíz del acorde), null = silencio.
  const RIFF  = [12, null, 15, null, 12, null, 10, 12, null, 7, null, 10, null, 12, null, null];

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  try { muted = localStorage.getItem("tito.music.muted") === "1"; } catch (e) { /* sin storage */ }

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = muted ? 0 : 0.55;
    duck = ctx.createGain();
    lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 16000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    duck.connect(lp).connect(comp).connect(out).connect(ctx.destination);
    return true;
  }

  function noise(len) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  let noiseBuf = null;

  function env(t, a, peak, d, dest) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(dest || duck);
    return g;
  }

  function kick(t) {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    o.connect(env(t, 0.003, 1.0, 0.28));
    o.start(t); o.stop(t + 0.35);
  }

  function snare(t) {
    const n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.8;
    n.connect(bp).connect(env(t, 0.002, 0.45, 0.14));
    n.start(t); n.stop(t + 0.2);
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.08);
    o.connect(env(t, 0.002, 0.35, 0.09));
    o.start(t); o.stop(t + 0.12);
  }

  function hat(t, open) {
    const n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 7000;
    n.connect(hp).connect(env(t, 0.001, open ? 0.18 : 0.12, open ? 0.18 : 0.04));
    n.start(t); n.stop(t + 0.25);
  }

  function clave(t) {
    const o = ctx.createOscillator();
    o.frequency.value = 2300;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 2300; bp.Q.value = 10;
    o.connect(bp).connect(env(t, 0.002, 0.25, 0.08));
    o.start(t); o.stop(t + 0.1);
  }

  function conga(t, hi) {
    const o = ctx.createOscillator();
    const f = hi ? 330 : 210;
    o.frequency.setValueAtTime(f * 1.5, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
    o.connect(env(t, 0.003, 0.22, 0.22));
    o.start(t); o.stop(t + 0.3);
  }

  function bass(t, note, len) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(midi(note), t);
    const o2 = ctx.createOscillator();
    o2.type = "square";
    o2.frequency.value = midi(note);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 220;
    const g = env(t, 0.005, 0.7, len);
    o.connect(g);
    o2.connect(f).connect(env(t, 0.005, 0.12, len * 0.6));
    o.start(t); o.stop(t + len + 0.1);
    o2.start(t); o2.stop(t + len + 0.1);
  }

  function synth(t, note) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = midi(note);
    const o2 = ctx.createOscillator();
    o2.type = "sawtooth";
    o2.frequency.value = midi(note) * 1.004;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.18);
    f.Q.value = 6;
    const g = env(t, 0.004, 0.09 + 0.05 * profile.dark, 0.2);
    o.connect(f); o2.connect(f); f.connect(g);
    o.start(t); o.stop(t + 0.3);
    o2.start(t); o2.stop(t + 0.3);
  }

  // Pad oscuro sostenido por acorde.
  function pad(t, root, len) {
    [0, 3, 7].forEach((iv) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = midi(root + 12 + iv);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.045 * profile.dark + 0.015, t + len * 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t + len);
      g.connect(duck);
      o.start(t); o.stop(t + len);
    });
  }

  function scheduleStep(t, s) {
    const bar = Math.floor(s / 16);
    const i = s % 16;
    const chordRoot = profile.root + profile.prog[bar % profile.prog.length];
    const beatLen = 60 / profile.bpm / 4;

    if (KICK[i]) kick(t);
    if (SNARE[i]) snare(t);
    if (HAT[i]) hat(t, i === 7 || i === 15);
    if (CLAVE[i]) clave(t);
    if (CONGA[i] && warmth > 0.3) conga(t, i % 4 === 3);
    if (BASS[i] !== null) bass(t, chordRoot - 12 + BASS[i], beatLen * 2.5);
    if (RIFF[i] !== null && (bar % 4 >= 2 || warmth > 0.6)) synth(t, chordRoot + RIFF[i]);
    if (i === 0) pad(t, chordRoot, beatLen * 16);
  }

  function tick() {
    const lookahead = 0.15;
    const beatLen = 60 / profile.bpm / 4;
    while (nextTime < ctx.currentTime + lookahead) {
      scheduleStep(nextTime, step);
      nextTime += beatLen;
      step += 1;
    }
  }

  function start(dimKey) {
    const assets = window.ASSETS && window.ASSETS.audio;
    if (assets && assets.music) {
      if (!fileAudio) {
        fileAudio = new Audio(assets.music);
        fileAudio.loop = true;
        fileAudio.volume = muted ? 0 : 0.5;
      }
      fileAudio.play().catch(() => {});
      playing = true;
      return;
    }
    if (!ensure()) return;
    if (ctx.state === "suspended") ctx.resume();
    if (!noiseBuf) noiseBuf = noise(0.5);
    setDimension(dimKey || "miami");
    if (playing) return;
    playing = true;
    nextTime = ctx.currentTime + 0.1;
    step = 0;
    timer = setInterval(tick, 40);
  }

  function stop() {
    if (fileAudio) fileAudio.pause();
    if (timer) clearInterval(timer);
    timer = null;
    playing = false;
  }

  function setDimension(key) {
    profile = PROFILES[key] || PROFILES.miami;
  }

  // 1 = Caribe a todo color, 0 = la Neblina lo congeló todo.
  function setWarmth(w) {
    warmth = w;
    if (!ctx) return;
    const now = ctx.currentTime;
    lp.frequency.cancelScheduledValues(now);
    lp.frequency.linearRampToValueAtTime(400 + w * w * 15000, now + 1.2);
  }

  // Baja el volumen mientras habla un Guardián.
  function duckFor(seconds) {
    if (!(seconds > 0 && seconds < 120)) seconds = 4; // duration puede ser NaN/Infinity antes de cargar
    if (fileAudio) {
      fileAudio.volume = muted ? 0 : 0.15;
      setTimeout(() => { fileAudio.volume = muted ? 0 : 0.5; }, seconds * 1000);
      return;
    }
    if (!ctx) return;
    const now = ctx.currentTime;
    duck.gain.cancelScheduledValues(now);
    duck.gain.linearRampToValueAtTime(0.25, now + 0.3);
    duck.gain.setValueAtTime(0.25, now + seconds);
    duck.gain.linearRampToValueAtTime(1, now + seconds + 0.8);
  }

  function setMuted(v) {
    muted = v;
    try { localStorage.setItem("tito.music.muted", v ? "1" : "0"); } catch (e) { /* sin storage */ }
    if (fileAudio) fileAudio.volume = v ? 0 : 0.5;
    if (out) out.gain.linearRampToValueAtTime(v ? 0 : 0.55, ctx.currentTime + 0.3);
  }

  return { start, stop, setDimension, setWarmth, duckFor, setMuted, isMuted: () => muted, isPlaying: () => playing };
})();

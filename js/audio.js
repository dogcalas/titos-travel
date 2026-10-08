// Sonido sintetizado con Web Audio: clave, tambores, mar, cañonazo y tráfico.
// Si existen audios generados en assets/audio/ (ver tools/generate-assets.mjs),
// se usan para la narración; todo lo demás funciona sin archivos.

window.SoundBoard = (function () {
  let ctx = null;
  let master = null;
  let sea = null;
  let muted = false;

  try { muted = localStorage.getItem("tito.muted") === "1"; } catch (e) { /* sin storage */ }

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
    return ctx;
  }

  function resume() {
    if (ensure() && ctx.state === "suspended") ctx.resume();
  }

  function noiseBuffer(seconds, brown) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        d[i] = last * 3.5;
      } else {
        d[i] = white;
      }
    }
    return buf;
  }

  function envGain(t, attack, peak, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(master);
    return g;
  }

  // Golpe de clave: madera aguda y seca.
  function clave(t, vol) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(2500, t);
    o.frequency.exponentialRampToValueAtTime(2200, t + 0.05);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2400;
    bp.Q.value = 8;
    o.connect(bp).connect(envGain(t, 0.002, vol || 0.5, 0.09));
    o.start(t);
    o.stop(t + 0.12);
  }

  // Tumbadora / conga: tono con caída de frecuencia.
  function conga(t, freq, vol) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.04);
    o.connect(envGain(t, 0.004, vol || 0.6, 0.35));
    o.start(t);
    o.stop(t + 0.45);
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(0.05);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1500;
    n.connect(hp).connect(envGain(t, 0.001, 0.15, 0.04));
    n.start(t);
  }

  // Clave 3-2 del son.
  function claveSon(start, tempo) {
    const beat = 60 / (tempo || 108) / 2; // corcheas
    [0, 3, 6, 10, 12].forEach((step) => clave(start + step * beat, 0.45));
    return 16 * beat;
  }

  function playClave() {
    if (!ensure() || muted) return;
    claveSon(ctx.currentTime + 0.05, 112);
  }

  function playSuccess() {
    if (!ensure() || muted) return;
    const t = ctx.currentTime + 0.05;
    const len = claveSon(t, 120);
    // Tumbao de conga encima de la clave.
    const beat = len / 16;
    const pattern = [[2, 200], [3, 200], [6, 330], [7, 290], [10, 200], [11, 200], [14, 330], [15, 290]];
    pattern.forEach(([s, f]) => conga(t + s * beat, f, 0.45));
    // Acorde brillante (I mayor con 6ta) como un "¡azúcar!"
    [523.25, 659.25, 783.99, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      o.connect(envGain(t + len + i * 0.03, 0.02, 0.12, 1.4));
      o.start(t + len);
      o.stop(t + len + 1.6);
    });
  }

  // El frío del exilio: tráfico, claxon y un acorde menor que se apaga.
  function playFailure() {
    if (!ensure() || muted) return;
    const t = ctx.currentTime + 0.05;
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(3.5, true);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(300, t);
    lp.frequency.linearRampToValueAtTime(900, t + 1.5);
    lp.frequency.linearRampToValueAtTime(200, t + 3.4);
    n.connect(lp).connect(envGain(t, 0.6, 0.7, 2.8));
    n.start(t);
    // Claxon lejano.
    [349, 440].forEach((f) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      const f2 = ctx.createBiquadFilter();
      f2.type = "lowpass";
      f2.frequency.value = 1200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + 0.9);
      g.gain.linearRampToValueAtTime(0.05, t + 0.95);
      g.gain.setValueAtTime(0.05, t + 1.35);
      g.gain.linearRampToValueAtTime(0.0001, t + 1.45);
      o.connect(f2).connect(g).connect(master);
      o.start(t + 0.9);
      o.stop(t + 1.5);
    });
    // Acorde menor descendente.
    [220, 261.63, 329.63].forEach((f) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f, t + 0.3);
      o.frequency.linearRampToValueAtTime(f * 0.94, t + 3);
      o.connect(envGain(t + 0.3, 0.3, 0.08, 2.6));
      o.start(t + 0.3);
      o.stop(t + 3.3);
    });
  }

  function playCannon() {
    if (!ensure() || muted) return;
    const t = ctx.currentTime + 0.05;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 1.2);
    o.connect(envGain(t, 0.005, 1, 1.4));
    o.start(t);
    o.stop(t + 1.6);
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(2.5, true);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    n.connect(lp).connect(envGain(t, 0.005, 1, 2.2));
    n.start(t);
  }

  // Tic del temporizador en los últimos segundos.
  function playTick() {
    if (!ensure() || muted) return;
    const t = ctx.currentTime + 0.01;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = 1200;
    o.connect(envGain(t, 0.001, 0.08, 0.04));
    o.start(t);
    o.stop(t + 0.06);
  }

  function playCrack() {
    if (!ensure() || muted) return;
    const t = ctx.currentTime + 0.02;
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(0.3);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2500;
    n.connect(hp).connect(envGain(t, 0.001, 0.5, 0.25));
    n.start(t);
  }

  // Mar de fondo: ruido marrón filtrado con un vaivén lento de olas.
  function startSea() {
    if (!ensure() || sea) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(6, true);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.value = 0.12;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(lp).connect(g).connect(master);
    src.start();
    lfo.start();
    sea = { lp, g };
  }

  // La Neblina enfría el mar: menos brillo cuantas menos fichas quedan.
  function setWarmth(lives) {
    if (!sea) return;
    const now = ctx.currentTime;
    sea.lp.frequency.linearRampToValueAtTime(200 + lives * 90, now + 1.5);
  }

  function setMuted(value) {
    muted = value;
    try { localStorage.setItem("tito.muted", value ? "1" : "0"); } catch (e) { /* sin storage */ }
    if (master) master.gain.linearRampToValueAtTime(value ? 0 : 0.8, ctx.currentTime + 0.2);
  }

  return {
    resume,
    startSea,
    setWarmth,
    playClave,
    playSuccess,
    playFailure,
    playCannon,
    playCrack,
    playTick,
    setMuted,
    isMuted: () => muted
  };
})();

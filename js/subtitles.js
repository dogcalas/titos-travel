// Narración con subtítulos: reproduce las pistas de voz del narrador (si existen) y muestra
// el texto en fragmentos cortos sincronizados con el audio, con efecto de máquina de escribir.
// Sin audio, el ritmo lo marca la longitud del texto. Tap/clic = siguiente fragmento; "Saltar" = fin.

window.Subtitles = (function () {
  const ASSETS = window.ASSETS || { audio: {} };
  const MAX_CHARS = 120;
  const READ_MS_PER_CHAR = 62;
  const TYPE_MS_PER_CHAR = 16;

  let box, textEl, skipBtn, dotsEl, tapHint;
  let session = null; // { paragraphs, keys, onDone, cancelled }
  let audio = null;
  let typeTimer = null;
  let advanceTimer = null;
  let onAdvance = null;
  let onDuck = null;
  let muted = false;

  function init(opts) {
    box = document.getElementById("subtitles");
    textEl = document.getElementById("subtitle-text");
    skipBtn = document.getElementById("subtitle-skip");
    dotsEl = document.getElementById("subtitle-dots");
    tapHint = document.getElementById("subtitle-tap");
    onDuck = opts && opts.onDuck;
    skipBtn.addEventListener("click", (e) => { e.stopPropagation(); stop(true); });
    box.addEventListener("click", () => { if (onAdvance) onAdvance(); });
    document.addEventListener("keydown", (e) => {
      if (!session) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (onAdvance) onAdvance(); }
      if (e.key === "Escape") stop(true);
    });
  }

  const strip = (html) => html.replace(/<[^>]+>/g, "");

  // Divide un párrafo en frases y las agrupa en fragmentos legibles de un vistazo.
  function chunk(text) {
    const sentences = strip(text).match(/[^.!?…]+[.!?…]+["»”]?\s*|[^.!?…]+$/g) || [text];
    const out = [];
    let cur = "";
    for (const s of sentences) {
      const t = s.trim();
      if (!t) continue;
      if ((cur + " " + t).trim().length > MAX_CHARS && cur) { out.push(cur.trim()); cur = t; }
      else cur = (cur + " " + t).trim();
    }
    if (cur) out.push(cur.trim());
    // Fragmentos aún demasiado largos: partir por comas / punto y coma.
    return out.flatMap((c) => {
      if (c.length <= MAX_CHARS * 1.4) return [c];
      const parts = c.split(/(?<=[,;:—])\s+/);
      const res = []; let acc = "";
      for (const p of parts) {
        if ((acc + " " + p).trim().length > MAX_CHARS && acc) { res.push(acc.trim()); acc = p; } else acc = (acc + " " + p).trim();
      }
      if (acc) res.push(acc.trim());
      return res;
    });
  }

  function typewrite(text, done) {
    clearTimeout(typeTimer);
    textEl.textContent = "";
    textEl.classList.remove("in");
    void textEl.offsetWidth;
    textEl.classList.add("in");
    let i = 0;
    const step = () => {
      i = Math.min(text.length, i + 2);
      textEl.textContent = text.slice(0, i);
      if (i < text.length) typeTimer = setTimeout(step, TYPE_MS_PER_CHAR);
      else if (done) done();
    };
    step();
  }

  function renderDots(total, current) {
    if (total <= 1) { dotsEl.innerHTML = ""; return; }
    dotsEl.innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i < current ? "done" : i === current ? "on" : ""}"></i>`).join("");
  }

  function clipFor(key) {
    const url = key && ASSETS.audio && ASSETS.audio[key];
    return url && !muted ? url : null;
  }

  // paragraphs: textos (pueden llevar HTML); keys: clave de audio por párrafo (o null).
  function play(paragraphs, keys, onDone, opts) {
    stop(false);
    session = { paragraphs, keys: keys || [], onDone, cancelled: false, speaker: opts && opts.speaker };
    box.hidden = false;
    box.classList.toggle("speaker", Boolean(session.speaker));
    document.getElementById("subtitle-speaker").textContent = session.speaker || "";
    runParagraph(0);
  }

  function runParagraph(pi) {
    if (!session || session.cancelled) return;
    if (pi >= session.paragraphs.length) return finish();
    const chunks = chunk(session.paragraphs[pi]);
    const totalChars = chunks.reduce((a, c) => a + c.length, 0);
    const url = clipFor(session.keys[pi]);
    let ci = 0;

    const scheduleChunks = (durationMs) => {
      const showChunk = () => {
        if (!session || session.cancelled) return;
        if (ci >= chunks.length) { runParagraph(pi + 1); return; }
        const c = chunks[ci];
        renderDots(chunks.length, ci);
        typewrite(c);
        const share = durationMs * (c.length / totalChars);
        ci += 1;
        clearTimeout(advanceTimer);
        advanceTimer = setTimeout(showChunk, Math.max(900, share));
      };
      onAdvance = () => {
        // Tap: adelanta al siguiente fragmento (o párrafo). Si hay audio, también lo adelanta.
        clearTimeout(advanceTimer);
        if (audio && ci < chunks.length) {
          const consumed = chunks.slice(0, ci).reduce((a, c) => a + c.length, 0) / totalChars;
          if (isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration - 0.05, audio.duration * consumed);
        } else if (audio) { audio.pause(); }
        showChunk();
      };
      showChunk();
    };

    if (url) {
      audio = new Audio(url);
      audio.volume = 1;
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        const ms = isFinite(audio.duration) && audio.duration > 0 ? audio.duration * 1000 : totalChars * READ_MS_PER_CHAR;
        if (onDuck) onDuck(ms / 1000 + 0.5);
        scheduleChunks(ms);
      };
      audio.addEventListener("loadedmetadata", start);
      audio.addEventListener("error", start);
      audio.play().catch(start);
      setTimeout(start, 1500); // por si la metadata tarda
    } else {
      audio = null;
      scheduleChunks(totalChars * READ_MS_PER_CHAR);
    }
  }

  function finish() {
    const s = session;
    session = null;
    onAdvance = null;
    box.hidden = true;
    if (s && s.onDone) s.onDone();
  }

  function stop(callDone) {
    clearTimeout(typeTimer);
    clearTimeout(advanceTimer);
    if (audio) { audio.pause(); audio = null; }
    if (session) {
      session.cancelled = true;
      if (callDone) finish(); else { session = null; onAdvance = null; box.hidden = true; }
    }
  }

  // Muestra una línea suelta (p. ej. el resultado de una respuesta), sin audio, y la deja fija.
  function flash(text, speaker) {
    stop(false);
    box.hidden = false;
    box.classList.toggle("speaker", Boolean(speaker));
    document.getElementById("subtitle-speaker").textContent = speaker || "";
    renderDots(0, 0);
    typewrite(strip(text));
  }

  function hide() { stop(false); box.hidden = true; }
  function setMuted(v) { muted = v; if (v && audio) audio.pause(); }

  return { init, play, flash, hide, stop, setMuted, isPlaying: () => Boolean(session) };
})();

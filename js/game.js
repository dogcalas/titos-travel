// El Viaje de Tito — motor del juego.
(function () {
  "use strict";

  const N = window.NARRATIVE;
  const ASSETS = window.ASSETS || { images: {}, audio: {} };
  const SFX = window.SoundBoard;

  const MAX_LIVES = 5;
  const QUESTIONS_PER_DIMENSION = 2;
  const TOTAL_TURNS = N.dimensions.length * QUESTIONS_PER_DIMENSION;
  const DOMINO_FACES = [[1, 6], [2, 5], [3, 4], [5, 5], [6, 6]];
  const SEEN_KEY = "tito.seen";

  const $ = (id) => document.getElementById(id);
  const screens = { intro: $("screen-intro"), turn: $("screen-turn"), end: $("screen-end") };

  const state = {
    lives: MAX_LIVES,
    memories: 0,
    turn: 0,
    current: null,
    answered: false
  };

  // ---------- Utilidades ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function loadSeen() {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch (e) { return new Set(); }
  }
  function saveSeen(seen) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch (e) { /* sin storage */ }
  }

  // Elige una pregunta del nivel sin repetir entre partidas hasta agotar el nivel.
  function pickQuestion(level, usedThisGame) {
    const seen = loadSeen();
    const pool = window.QUESTIONS.filter((q) => q.lvl === level && !usedThisGame.has(q.id));
    let fresh = pool.filter((q) => !seen.has(q.id));
    if (!fresh.length) {
      pool.forEach((q) => seen.delete(q.id));
      fresh = pool;
    }
    const q = pick(fresh);
    seen.add(q.id);
    saveSeen(seen);
    return q;
  }

  function show(name) {
    Object.entries(screens).forEach(([k, el]) => { el.hidden = k !== name; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function paragraphs(container, list, stagger) {
    container.innerHTML = list.map((p, i) => `<p style="animation-delay:${(i * (stagger || 0)).toFixed(2)}s">${p}</p>`).join("");
  }

  // ---------- Escena / ambiente ----------
  function setScene(key) {
    document.body.dataset.dim = key;
    const img = ASSETS.images && ASSETS.images[key];
    const bg = $("scene-bg");
    if (img) {
      const probe = new Image();
      probe.onload = () => { if (document.body.dataset.dim === key) bg.style.backgroundImage = `linear-gradient(rgba(13,27,42,.25), rgba(13,27,42,.55)), url("${img}")`; };
      probe.src = img;
    }
    bg.style.backgroundImage = "";
  }

  function setWarmth() {
    const w = state.lives / MAX_LIVES;
    document.documentElement.style.setProperty("--warmth", w.toFixed(2));
    SFX.setWarmth(state.lives);
  }

  function flash(kind) {
    const f = $("flash");
    f.className = "";
    void f.offsetWidth;
    f.className = kind;
    if (kind === "cold") {
      document.body.classList.remove("chill");
      void document.body.offsetWidth;
      document.body.classList.add("chill");
    }
  }

  function emojiBurst() {
    const layer = $("particles");
    for (let i = 0; i < 22; i++) {
      const s = document.createElement("span");
      s.className = "particle";
      s.textContent = pick(N.successEmojis);
      s.style.left = `${Math.random() * 100}vw`;
      s.style.top = `${70 + Math.random() * 30}vh`;
      s.style.setProperty("--dx", `${(Math.random() - 0.5) * 30}vw`);
      s.style.setProperty("--rot", `${(Math.random() - 0.5) * 120}deg`);
      s.style.animationDelay = `${Math.random() * 0.5}s`;
      layer.appendChild(s);
      setTimeout(() => s.remove(), 3500);
    }
  }

  function dustFrom(el) {
    const r = el.getBoundingClientRect();
    const layer = $("particles");
    for (let i = 0; i < 26; i++) {
      const d = document.createElement("span");
      d.className = "dust";
      d.style.left = `${r.left + r.width / 2}px`;
      d.style.top = `${r.top + r.height / 2}px`;
      d.style.setProperty("--dx", `${(Math.random() - 0.5) * 120}px`);
      d.style.setProperty("--dy", `${40 + Math.random() * 160}px`);
      layer.appendChild(d);
      setTimeout(() => d.remove(), 1800);
    }
  }

  // ---------- Fichas de dominó ----------
  const PIP_LAYOUT = {
    0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
  };
  function half(n) {
    const on = new Set(PIP_LAYOUT[n]);
    let html = '<div class="half">';
    for (let i = 0; i < 9; i++) html += `<span class="pip${on.has(i) ? "" : " off"}"></span>`;
    return html + "</div>";
  }
  function renderDominoes() {
    $("dominoes").innerHTML = DOMINO_FACES.map(([a, b], i) =>
      `<div class="domino${i >= state.lives ? " lost" : ""}" data-i="${i}" title="Ficha de nácar">${half(a)}<div class="bar"></div>${half(b)}</div>`
    ).join("");
    $("dominoes").setAttribute("aria-label", `Fichas de dominó: ${state.lives} de ${MAX_LIVES}`);
  }
  const dominoEl = (i) => $("dominoes").querySelector(`[data-i="${i}"]`);

  function renderInventory() {
    $("inv-lives").textContent = `${state.lives}/${MAX_LIVES}`;
    $("inv-memories").textContent = state.memories;
  }

  // ---------- Flujo ----------
  function startIntro() {
    setScene("miami");
    paragraphs($("intro-text"), N.intro.paragraphs, 0.6);
    $("btn-start").textContent = N.intro.cta;
    $("btn-narrate").hidden = !(ASSETS.audio && ASSETS.audio.intro);
    renderDominoes();
    setWarmth();
    show("intro");
  }

  function newGame() {
    state.lives = MAX_LIVES;
    state.memories = 0;
    state.turn = 0;
    state.used = new Set();
    renderDominoes();
    renderInventory();
    setWarmth();
    nextTurn();
  }

  function nextTurn() {
    if (state.lives <= 0) return endGame(false);
    if (state.turn >= TOTAL_TURNS) return endGame(true);

    const dimIndex = Math.floor(state.turn / QUESTIONS_PER_DIMENSION);
    const dim = N.dimensions[dimIndex];
    const firstInDim = state.turn % QUESTIONS_PER_DIMENSION === 0;
    const q = pickQuestion(dim.level, state.used);
    state.used.add(q.id);
    state.current = { dim, q, options: shuffle([q.a, ...q.w]) };
    state.answered = false;

    setScene(dim.key);
    if (firstInDim) {
      if (dim.key === "cabana") SFX.playCannon(); else SFX.playClave();
    }

    $("place").textContent = `${dim.emoji} ${dim.place}`;
    $("level-badge").textContent = `Nivel ${dim.level} · ${N.levels[dim.level]}`;
    $("progress").textContent = `Recuerdo ${state.turn + 1} de ${TOTAL_TURNS}`;
    $("progress-fill").style.width = `${(state.turn / TOTAL_TURNS) * 100}%`;

    const story = (firstInDim ? dim.arrive : dim.again).slice();
    paragraphs($("story"), story, 0.35);

    $("guardian").textContent = `${dim.guardian} te desafía:`;
    $("question").textContent = q.q;
    const credit = $("credit");
    credit.hidden = !q.by;
    if (q.by) credit.textContent = `Pregunta sugerida por ${q.by}`;

    $("options").innerHTML = state.current.options.map((opt, i) =>
      `<button class="opt" type="button" data-i="${i}"><span class="key">${i + 1}</span><span>${escapeHtml(opt)}</span></button>`
    ).join("");

    $("outcome").hidden = true;
    $("btn-next").hidden = true;
    renderInventory();
    show("turn");
  }

  function answer(i) {
    if (state.answered || !state.current) return;
    state.answered = true;
    const { dim, q, options } = state.current;
    const chosen = options[i];
    const ok = chosen === q.a;

    $("options").querySelectorAll(".opt").forEach((btn, j) => {
      btn.disabled = true;
      if (options[j] === q.a) btn.classList.add("correct");
      else if (j === i) btn.classList.add("wrong");
      else btn.classList.add("dim");
    });

    const out = $("outcome");
    if (ok) {
      state.memories += 1;
      const emojis = shuffle(N.successEmojis).slice(0, 5).join(" ");
      const text = pick(N.success).replace("{win}", dim.win);
      out.className = "outcome win";
      out.innerHTML = `<p class="cine"><strong>${escapeHtml(text)}</strong></p><p class="emojis">${emojis}</p>`;
      flash("warm");
      emojiBurst();
      SFX.playSuccess();
      const el = dominoEl(Math.max(0, state.lives - 1));
      if (el) { el.classList.remove("glow"); void el.offsetWidth; el.classList.add("glow"); }
    } else {
      state.lives -= 1;
      const text = pick(N.failure).replace("{lose}", dim.lose).replace("{answer}", q.a);
      out.className = "outcome lose";
      let html = `<p>${escapeHtml(text)}</p>`;
      if (state.lives === 1) html += `<p><strong>${escapeHtml(N.lastLifeWarning)}</strong></p>`;
      out.innerHTML = html;
      flash("cold");
      SFX.playFailure();
      SFX.playCrack();
      const el = dominoEl(state.lives);
      if (el) { el.classList.add("cracked"); dustFrom(el); }
      setWarmth();
    }

    state.turn += 1;
    renderInventory();
    $("progress-fill").style.width = `${(state.turn / TOTAL_TURNS) * 100}%`;
    out.hidden = false;

    const next = $("btn-next");
    if (state.lives <= 0) next.textContent = "🌫️ La Neblina lo envuelve todo…";
    else if (state.turn >= TOTAL_TURNS) next.textContent = "🌳 Volver a casa con la semilla";
    else if (state.turn % QUESTIONS_PER_DIMENSION === 0) next.textContent = "🌀 Cruzar el siguiente portal";
    else next.textContent = "☕ Seguir en este recuerdo";
    next.hidden = false;
    setTimeout(() => {
      out.scrollIntoView({ behavior: "smooth", block: "center" });
      next.focus({ preventScroll: true });
    }, 250);
  }

  function endGame(won) {
    const data = won ? N.victory : N.defeat;
    setScene(won ? "ceiba" : "miami");
    $("end-title").textContent = data.title;
    paragraphs($("end-text"), data.paragraphs, 0.7);
    $("end-stats").textContent = `🎒 Recuerdos recuperados: ${state.memories} de ${TOTAL_TURNS} · Fichas de dominó: ${state.lives}/${MAX_LIVES}`;
    if (won) { flash("warm"); emojiBurst(); SFX.playSuccess(); } else { SFX.playFailure(); }
    state.won = won;
    show("end");
  }

  function shareText() {
    const tiles = "🁫".repeat(state.lives) + "▫️".repeat(MAX_LIVES - state.lives);
    return `☕ El Viaje de Tito: El Retorno a la Semilla\n${state.won ? "🌳 ¡Tito volvió a la semilla!" : "🌫️ La Neblina del Norte ganó esta vez."}\nRecuerdos: ${state.memories}/${TOTAL_TURNS} · Fichas: ${tiles}\n${location.href}`;
  }

  // ---------- Eventos ----------
  $("btn-start").addEventListener("click", () => {
    SFX.resume();
    SFX.startSea();
    SFX.playClave();
    newGame();
  });
  $("btn-next").addEventListener("click", nextTurn);
  $("btn-restart").addEventListener("click", () => { SFX.resume(); newGame(); });
  $("options").addEventListener("click", (e) => {
    const b = e.target.closest(".opt");
    if (b) answer(Number(b.dataset.i));
  });
  $("btn-share").addEventListener("click", async () => {
    const btn = $("btn-share");
    try {
      await navigator.clipboard.writeText(shareText());
      btn.textContent = "✅ ¡Copiado!";
    } catch (e) {
      btn.textContent = "No se pudo copiar";
    }
    setTimeout(() => { btn.textContent = "📋 Copiar resultado"; }, 2000);
  });
  $("btn-narrate").addEventListener("click", () => {
    const a = new Audio(ASSETS.audio.intro);
    a.play().catch(() => {});
  });

  const muteBtn = $("mute");
  function syncMute() {
    muteBtn.textContent = SFX.isMuted() ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-label", SFX.isMuted() ? "Activar sonido" : "Silenciar sonido");
  }
  muteBtn.addEventListener("click", () => { SFX.resume(); SFX.setMuted(!SFX.isMuted()); syncMute(); });
  syncMute();

  document.addEventListener("keydown", (e) => {
    if (screens.turn.hidden) return;
    if (!state.answered && /^[1-4]$/.test(e.key)) answer(Number(e.key) - 1);
    else if (state.answered && e.key === "Enter" && document.activeElement !== $("btn-next")) nextTurn();
  });

  startIntro();
})();

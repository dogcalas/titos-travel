// El Viaje de Tito — motor del juego (interfaz de juego: escena 3D + HUD + narración con subtítulos).
(function () {
  "use strict";

  const N = window.NARRATIVE;
  const ASSETS = window.ASSETS || { images: {}, sprites: {}, audio: {} };
  const SFX = window.SoundBoard;
  const MUSIC = window.Reparto;
  const GL = window.Scene3D;
  const SUB = window.Subtitles;
  const BOARD = window.Scoreboard;
  const FX = window.Fireworks;

  const MAX_LIVES = 5;
  const QUESTIONS_PER_DIMENSION = 2;
  const TOTAL_TURNS = N.dimensions.length * QUESTIONS_PER_DIMENSION;
  const TIME_LIMIT = 25;
  const DOMINO_FACES = [[1, 6], [2, 5], [3, 4], [5, 5], [6, 6]];
  const SEEN_KEY = "tito.seen";
  const TIMER_CIRC = 119.4;

  const $ = (id) => document.getElementById(id);
  const screens = { title: $("screen-title"), how: $("screen-how"), turn: $("screen-turn"), end: $("screen-end"), board: $("screen-board") };

  const state = {
    lives: MAX_LIVES, memories: 0, turn: 0, score: 0, streak: 0, bestStreak: 0,
    current: null, answered: false, used: new Set(), timerId: null, timeLeft: TIME_LIMIT, questionStart: 0, won: false, prevScreen: "title"
  };
  let voice = null;

  // ---------- Utilidades ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const fmt = (n) => n.toLocaleString("es");
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function loadSeen() { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch (e) { return new Set(); } }
  function saveSeen(seen) { try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch (e) { /* sin storage */ } }

  // Elige una pregunta del nivel sin repetir entre partidas hasta agotar el nivel.
  function pickQuestion(level, usedThisGame) {
    const seen = loadSeen();
    const pool = window.QUESTIONS.filter((q) => q.lvl === level && !usedThisGame.has(q.id));
    let fresh = pool.filter((q) => !seen.has(q.id));
    if (!fresh.length) { pool.forEach((q) => seen.delete(q.id)); fresh = pool; }
    const q = pick(fresh);
    seen.add(q.id);
    saveSeen(seen);
    return q;
  }

  function show(name) {
    Object.entries(screens).forEach(([k, el]) => { el.hidden = k !== name; });
    document.body.dataset.screen = name || "scene";
    $("hud").hidden = !(name === "turn" || name === null);
    document.body.classList.toggle("cinema", name === null);
  }

  // ---------- Voz de los Guardianes ----------
  function speak(key) {
    const url = ASSETS.audio && ASSETS.audio[key];
    if (!url || SFX.isMuted()) return;
    if (voice) { voice.pause(); voice = null; }
    voice = new Audio(url);
    voice.addEventListener("loadedmetadata", () => MUSIC.duckFor(voice.duration));
    voice.play().catch(() => {});
  }

  // ---------- Escena / ambiente ----------
  const DIM_COLORS = { miami: 0x1a2340, malecon: 0x1fb5a8, solar: 0xf7d774, parque: 0x6a4c93, bodega: 0xd9a55b, cabana: 0x7597de, almendron: 0xff9966, carnaval: 0xff4e50, vinales: 0x3e8e41, ceiba: 0x2d6a4f };

  function setScene(key) {
    document.body.dataset.dim = key;
    GL.setBackground(key, DIM_COLORS[key]);
    MUSIC.setDimension(key);
    const img = ASSETS.images && ASSETS.images[key];
    $("scene-bg").style.backgroundImage = img ? `url("${img}")` : "";
  }

  function setWarmth() {
    const w = state.lives / MAX_LIVES;
    document.documentElement.style.setProperty("--warmth", w.toFixed(2));
    SFX.setWarmth(state.lives);
    MUSIC.setWarmth(w);
    GL.setWarmth(w);
  }

  function flash(kind) {
    const f = $("flash");
    f.className = ""; void f.offsetWidth; f.className = kind;
    if (kind === "cold") { document.body.classList.remove("chill"); void document.body.offsetWidth; document.body.classList.add("chill"); }
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

  function floatPoints(text, bad) {
    const el = document.createElement("div");
    el.className = `float-points${bad ? " bad" : ""}`;
    el.textContent = text;
    $("float-layer").appendChild(el);
    setTimeout(() => el.remove(), 1900);
  }

  // ---------- Fichas de dominó ----------
  const PIP_LAYOUT = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function half(n) {
    const on = new Set(PIP_LAYOUT[n]);
    let html = '<div class="half">';
    for (let i = 0; i < 9; i++) html += `<span class="pip${on.has(i) ? "" : " off"}"></span>`;
    return html + "</div>";
  }
  function renderDominoes() {
    $("dominoes").innerHTML = DOMINO_FACES.map(([a, b], i) =>
      `<div class="domino${i >= state.lives ? " lost" : ""}" data-i="${i}" title="Ficha de nácar">${half(a)}<div class="bar"></div>${half(b)}</div>`).join("");
    $("dominoes").setAttribute("aria-label", `Fichas de dominó: ${state.lives} de ${MAX_LIVES}`);
  }
  const dominoEl = (i) => $("dominoes").querySelector(`[data-i="${i}"]`);

  function renderHud() {
    $("score").textContent = fmt(state.score);
    const st = $("streak");
    st.hidden = state.streak < 2;
    st.querySelector("b").textContent = state.streak;
    $("progress-fill").style.width = `${(state.turn / TOTAL_TURNS) * 100}%`;
  }

  function addScore(points) {
    state.score += points;
    const sc = $("score").parentElement;
    sc.classList.remove("bump"); void sc.offsetWidth; sc.classList.add("bump");
  }

  // ---------- Temporizador ----------
  function tickTimer() {
    state.timeLeft -= 0.25;
    renderTimer();
    if (state.timeLeft <= 0) { stopTimer(); answer(-1); }
  }
  function startTimer() {
    stopTimer();
    state.timeLeft = TIME_LIMIT;
    state.questionStart = performance.now();
    renderTimer();
    state.timerId = setInterval(tickTimer, 250);
  }
  function stopTimer() { if (state.timerId) clearInterval(state.timerId); state.timerId = null; }
  function renderTimer() {
    const t = Math.max(0, state.timeLeft);
    $("timer-text").textContent = Math.ceil(t);
    $("timer-fill").style.strokeDashoffset = (TIMER_CIRC * (1 - t / TIME_LIMIT)).toFixed(1);
    const el = $("timer");
    el.classList.toggle("warn", t <= 10 && t > 5);
    el.classList.toggle("danger", t <= 5);
    if (t <= 5 && t > 0 && Math.abs(t - Math.round(t)) < 0.01) SFX.playTick();
  }

  // ---------- Flujo ----------
  function startTitle() {
    setScene("miami");
    GL.openPortal(false);
    GL.setGuardian(null);
    GL.setTitoPose("idle");
    const caf = $("cafetera");
    if (ASSETS.sprites && ASSETS.sprites.cafetera) { caf.src = ASSETS.sprites.cafetera; caf.hidden = false; }
    const me = BOARD.getPlayer();
    if (me && !$("player-name").value) { $("player-name").value = me.name; checkName(); }
    renderDominoes();
    setWarmth();
    SUB.hide();
    show("title");
  }

  function newGame() {
    Object.assign(state, { lives: MAX_LIVES, memories: 0, turn: 0, score: 0, streak: 0, bestStreak: 0, used: new Set() });
    renderDominoes();
    renderHud();
    setWarmth();
    // Prólogo narrado sobre Miami; luego el primer portal.
    $("hud-place-emoji").textContent = "🌃";
    $("hud-place").textContent = "Miami, piso 14";
    $("hud-level").textContent = "Prólogo · La Neblina del Norte";
    show(null);
    GL.setTitoPose("idle");
    const keys = N.intro.paragraphs.map((_, i) => `n_intro_${i}`);
    SUB.play(N.intro.paragraphs, keys, () => { GL.openPortal(true); GL.setTitoPose("walk"); setTimeout(nextTurn, 900); }, {
      // Párrafo 2: el vapor de la cafetera abre el portal.
      onParagraph: (i) => { if (i === 1) setTimeout(() => GL.openPortal(true), 2500); }
    });
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
    $("continue-bar").hidden = true;

    setScene(dim.key);
    GL.openPortal(true);
    GL.setTitoPose("idle");
    GL.setGuardian(dim.key);
    $("hud-place-emoji").textContent = dim.emoji;
    $("hud-place").textContent = dim.place;
    $("hud-level").textContent = `Nivel ${dim.level} · ${N.levels[dim.level]}`;
    renderHud();
    if (firstInDim && dim.key === "cabana") SFX.playCannon();

    // El Guardián presenta su nivel con su propia voz; después, el reto.
    show(null);
    const paras = firstInDim ? dim.arrive : dim.again;
    const keys = paras.map((_, i) => `n_${dim.key}_${firstInDim ? "arrive" : "again"}_${i}`);
    SUB.play(paras, keys, () => showChallenge(dim, q, firstInDim), { speaker: dim.guardian });
  }

  function showChallenge(dim, q, firstInDim) {
    GL.openPortal(false);
    GL.setTitoPose("think");
    const avatar = $("guardian-avatar");
    const sprite = ASSETS.sprites && ASSETS.sprites[`guardian_${dim.key}`];
    avatar.hidden = !sprite;
    if (sprite) avatar.src = sprite;
    $("guardian").textContent = `${dim.guardian} te desafía`;
    $("question").textContent = q.q;
    const credit = $("credit");
    credit.hidden = !q.by;
    if (q.by) credit.textContent = `Pregunta sugerida por ${q.by}`;
    $("options").innerHTML = state.current.options.map((opt, i) =>
      `<button class="opt" type="button" data-i="${i}"><span class="key">${i + 1}</span><span>${escapeHtml(opt)}</span></button>`).join("");
    show("turn");
    startTimer();
  }

  // i = -1 cuando se acaba el tiempo.
  function answer(i) {
    if (state.answered || !state.current) return;
    state.answered = true;
    stopTimer();
    const { dim, q, options } = state.current;
    const chosen = i >= 0 ? options[i] : null;
    const ok = chosen === q.a;

    $("options").querySelectorAll(".opt").forEach((btn, j) => {
      btn.disabled = true;
      if (options[j] === q.a) btn.classList.add("correct");
      else if (j === i) btn.classList.add("wrong");
      else btn.classList.add("dim");
    });

    if (ok) {
      state.memories += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const elapsed = (performance.now() - state.questionStart) / 1000;
      const base = 100 * dim.level;
      const speed = Math.round(Math.max(0, 1 - elapsed / TIME_LIMIT) * 50 * dim.level / 3);
      const streakBonus = state.streak >= 2 ? state.streak * 15 : 0;
      const points = base + speed + streakBonus;
      addScore(points);
      floatPoints(`+${fmt(points)}${streakBonus ? `  🔥×${state.streak}` : ""}`);
      const win = dim.win.charAt(0).toUpperCase() + dim.win.slice(1);
      SUB.flash(`${win}. La ficha de nácar brilla y ancla el recuerdo.`, "Recuerdo anclado");
      FX.show(4 + Math.min(4, state.streak));
      GL.dominoGlow();
      GL.titoCelebrate();
      const el = dominoEl(Math.max(0, state.lives - 1));
      if (el) { el.classList.remove("glow"); void el.offsetWidth; el.classList.add("glow"); }
    } else {
      state.lives -= 1;
      state.streak = 0;
      const prefix = i < 0 ? "⏳ Se acabó el tiempo. " : "";
      SUB.flash(`${prefix}El frío del exilio lo invade: ${dim.lose}. Una ficha se vuelve polvo de asfalto. Era: «${q.a}».${state.lives === 1 ? " ⚠️ Última ficha." : ""}`, "La Neblina avanza");
      floatPoints("💔 ficha rota", true);
      flash("cold");
      SFX.playFailure();
      SFX.playCrack();
      GL.dominoShatter();
      GL.titoFreeze();
      const el = dominoEl(state.lives);
      if (el) { el.classList.add("cracked"); dustFrom(el); }
      setWarmth();
    }

    state.turn += 1;
    renderHud();
    const next = $("btn-next");
    if (state.lives <= 0) next.textContent = "🌫️ La Neblina lo envuelve todo…";
    else if (state.turn >= TOTAL_TURNS) next.textContent = "🌳 Volver a casa con la semilla";
    else if (state.turn % QUESTIONS_PER_DIMENSION === 0) next.textContent = "🌀 Cruzar el siguiente portal";
    else next.textContent = "☕ Seguir en este recuerdo ▸";
    setTimeout(() => { $("continue-bar").hidden = false; next.focus({ preventScroll: true }); }, 700);
  }

  async function endGame(won) {
    stopTimer();
    state.won = won;
    $("continue-bar").hidden = true;
    if (won) addScore(state.lives * 250);
    const data = won ? N.victory : N.defeat;
    setScene(won ? "ceiba" : "miami");
    GL.openPortal(won);
    GL.setGuardian(won ? "ceiba" : null);
    GL.setTitoPose(won ? "coffee" : "cold");
    if (won) FX.show(12); else SFX.playFailure();
    renderHud();

    // Epílogo narrado, luego el panel de resultados.
    show(null);
    const keys = data.paragraphs.map((_, i) => `n_${won ? "victory" : "defeat"}_${i}`);
    const submitP = BOARD.submit({ score: state.score, memories: state.memories, lives: state.lives, won });
    SUB.play(data.paragraphs, keys, async () => {
      $("end-title").textContent = data.title;
      $("end-stats").innerHTML = [
        ["Puntos", fmt(state.score)], ["Recuerdos", `${state.memories}/${TOTAL_TURNS}`],
        ["Fichas", `${state.lives}/${MAX_LIVES}`], ["Mejor racha", state.bestStreak]
      ].concat(won ? [["Bonus fichas", `+${fmt(state.lives * 250)}`]] : [])
        .map(([k, v]) => `<div class="tile"><small>${k}</small><strong>${v}</strong></div>`).join("");
      show("end");
      const rank = $("end-rank");
      rank.hidden = true;
      const res = await submitP;
      if (res && res.ok) {
        const me = BOARD.getPlayer();
        rank.hidden = false;
        rank.textContent = res.improved
          ? `🎉 ¡Nuevo récord personal, ${me.name}! ${res.rank ? `Puesto #${res.rank} del scoreboard.` : ""}`
          : `Tu mejor marca sigue siendo ${fmt(res.best.score)} puntos${res.rank ? ` (puesto #${res.rank})` : ""}.`;
      }
      renderBoard($("end-board"), await BOARD.top(10));
    });
  }

  function renderBoard(container, rows) {
    const me = BOARD.getPlayer();
    if (!rows || !rows.length) { container.innerHTML = '<p class="empty">Todavía nadie ha vuelto a la semilla. ¡Sé el primero!</p>'; return; }
    container.innerHTML = `<table><thead><tr><th>#</th><th>Jugador</th><th class="num">Puntos</th><th class="num">Recuerdos</th><th class="num">Fichas</th><th></th></tr></thead><tbody>` +
      rows.map((r) => `<tr class="${me && r.name === me.name ? "me" : ""}"><td class="rank">${r.rank}</td><td>${escapeHtml(r.name)}</td><td class="num">${fmt(r.score)}</td><td class="num">${r.memories}/${TOTAL_TURNS}</td><td class="num">${r.lives}/5</td><td>${r.won ? "🌳" : "🌫️"}</td></tr>`).join("") +
      "</tbody></table>";
  }

  async function openBoard() {
    state.prevScreen = document.body.dataset.screen;
    show("board");
    $("board").innerHTML = '<p class="empty">Cargando…</p>';
    const rows = await BOARD.top(50);
    $("board-mode").textContent = BOARD.mode() === "remote" ? "Scoreboard compartido entre todos los jugadores." : "Scoreboard local de este dispositivo.";
    renderBoard($("board"), rows);
  }

  function shareText() {
    const tiles = "🁫".repeat(state.lives) + "▫️".repeat(MAX_LIVES - state.lives);
    const me = BOARD.getPlayer();
    return `☕ El Viaje de Tito: El Retorno a la Semilla\n${me ? `${me.name}: ` : ""}${fmt(state.score)} puntos\n${state.won ? "🌳 ¡Tito volvió a la semilla!" : "🌫️ La Neblina del Norte ganó esta vez."}\nRecuerdos: ${state.memories}/${TOTAL_TURNS} · Fichas: ${tiles}\n${location.href}`;
  }

  // ---------- Nombre único ----------
  let checkTimer = null;
  async function checkName() {
    const input = $("player-name"), status = $("name-status");
    $("name-error").hidden = true;
    const clean = BOARD.cleanName(input.value);
    if (!input.value.trim()) { status.textContent = ""; return; }
    if (!clean) { status.textContent = "⚠️"; return; }
    status.textContent = "…";
    const r = await BOARD.check(clean);
    if (BOARD.cleanName(input.value) !== clean) return;
    status.textContent = r.available ? "✅" : "⛔";
    status.title = r.available ? "Nombre libre" : "Ese nombre ya está cogido";
  }

  async function startFromForm(e) {
    e.preventDefault();
    const err = $("name-error");
    const res = await BOARD.claim($("player-name").value);
    if (!res.ok) { err.textContent = res.error; err.hidden = false; $("player-name").focus(); SFX.playCrack(); return; }
    err.hidden = true;
    SFX.resume();
    SFX.startSea();
    MUSIC.start("miami");
    newGame();
  }

  // ---------- Eventos ----------
  $("player-form").addEventListener("submit", startFromForm);
  $("player-name").addEventListener("input", () => { clearTimeout(checkTimer); checkTimer = setTimeout(checkName, 350); });
  $("btn-next").addEventListener("click", () => { SUB.hide(); nextTurn(); });
  $("btn-restart").addEventListener("click", () => { SFX.resume(); MUSIC.start("miami"); newGame(); });
  $("btn-board").addEventListener("click", openBoard);
  $("btn-how").addEventListener("click", () => { state.prevScreen = "title"; show("how"); });
  document.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", () => show(state.prevScreen === "end" ? "end" : "title")));
  $("options").addEventListener("click", (e) => { const b = e.target.closest(".opt"); if (b) answer(Number(b.dataset.i)); });
  $("btn-share").addEventListener("click", async () => {
    const btn = $("btn-share");
    try { await navigator.clipboard.writeText(shareText()); btn.textContent = "✅ ¡Copiado!"; } catch (e) { btn.textContent = "No se pudo copiar"; }
    setTimeout(() => { btn.textContent = "📋 Copiar resultado"; }, 2000);
  });

  const muteBtn = $("mute");
  function syncMute() {
    muteBtn.textContent = SFX.isMuted() ? "🔇" : "🔊";
    muteBtn.classList.toggle("off", SFX.isMuted());
    muteBtn.setAttribute("aria-label", SFX.isMuted() ? "Activar efectos y voces" : "Silenciar efectos y voces");
    SUB.setMuted(SFX.isMuted());
  }
  muteBtn.addEventListener("click", () => { SFX.resume(); SFX.setMuted(!SFX.isMuted()); if (SFX.isMuted() && voice) voice.pause(); syncMute(); });
  syncMute();

  const musicBtn = $("music");
  function syncMusic() {
    musicBtn.classList.toggle("off", MUSIC.isMuted());
    musicBtn.setAttribute("aria-label", MUSIC.isMuted() ? "Activar música" : "Silenciar música");
  }
  musicBtn.addEventListener("click", () => { MUSIC.setMuted(!MUSIC.isMuted()); if (!MUSIC.isMuted() && !MUSIC.isPlaying()) MUSIC.start(document.body.dataset.dim); syncMusic(); });
  syncMusic();

  document.addEventListener("keydown", (e) => {
    if (screens.turn.hidden) return;
    if (!state.answered && /^[1-4]$/.test(e.key)) answer(Number(e.key) - 1);
    else if (state.answered && e.key === "Enter" && !$("continue-bar").hidden && document.activeElement !== $("btn-next")) { SUB.hide(); nextTurn(); }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.timerId) { stopTimer(); state.paused = true; }
    else if (state.paused && !state.answered && !screens.turn.hidden) {
      state.paused = false;
      state.questionStart = performance.now() - (TIME_LIMIT - state.timeLeft) * 1000;
      state.timerId = setInterval(tickTimer, 250);
    }
  });

  // ---------- Arranque ----------
  if (GL.init($("gl"))) document.body.classList.add("gl-on");
  FX.init();
  SUB.init({ onDuck: (s) => MUSIC.duckFor(s) });
  startTitle();
})();

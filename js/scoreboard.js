// Scoreboard con nombres únicos. Usa la API de server/index.js si está disponible;
// si el juego se sirve como estático, cae a un scoreboard local (localStorage) con la misma regla.

window.Scoreboard = (function () {
  const LOCAL_KEY = "tito.scoreboard";
  const PLAYER_KEY = "tito.player";
  let mode = null; // "remote" | "local"

  const normalize = (name) => String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

  function cleanName(raw) {
    const name = String(raw || "").replace(/\s+/g, " ").trim();
    if (name.length < 2 || name.length > 20) return null;
    if (!/^[\p{L}\p{N} _.'-]+$/u.test(name)) return null;
    return name;
  }

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); } catch (e) { return {}; }
  }
  function writeLocal(db) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(db)); } catch (e) { /* sin storage */ }
  }

  function getPlayer() {
    try { return JSON.parse(localStorage.getItem(PLAYER_KEY) || "null"); } catch (e) { return null; }
  }
  function setPlayer(p) {
    try { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); } catch (e) { /* sin storage */ }
  }

  async function detect() {
    if (mode) return mode;
    if (location.protocol === "file:") { mode = "local"; return mode; }
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      mode = r.ok && (await r.json()).ok ? "remote" : "local";
    } catch (e) {
      mode = "local";
    }
    return mode;
  }

  async function check(name) {
    const clean = cleanName(name);
    if (!clean) return { available: false, reason: "invalid" };
    if ((await detect()) === "remote") {
      try {
        const r = await fetch(`/api/players/check?name=${encodeURIComponent(clean)}`);
        return await r.json();
      } catch (e) { /* cae a local */ }
    }
    const db = readLocal();
    const me = getPlayer();
    const key = normalize(clean);
    return { available: !db[key] || (me && me.token && db[key].token === me.token) };
  }

  // Reclama el nombre. Devuelve { ok, name, token } o { ok:false, error }.
  async function claim(name) {
    const clean = cleanName(name);
    if (!clean) return { ok: false, error: "Nombre inválido: de 2 a 20 letras, números, espacios, puntos o guiones." };
    const me = getPlayer();
    const prevToken = me && normalize(me.name) === normalize(clean) ? me.token : undefined;
    if ((await detect()) === "remote") {
      try {
        const r = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: clean, token: prevToken })
        });
        const data = await r.json();
        if (!r.ok) return { ok: false, error: data.error || "No se pudo reclamar el nombre." };
        setPlayer({ name: data.name, token: data.token });
        return { ok: true, name: data.name, token: data.token, returning: data.returning };
      } catch (e) {
        mode = "local";
      }
    }
    const db = readLocal();
    const key = normalize(clean);
    if (db[key] && db[key].token !== prevToken) return { ok: false, error: "Ese nombre ya lo cogió alguien en este dispositivo. Prueba otro." };
    const token = prevToken || Math.random().toString(36).slice(2) + Date.now().toString(36);
    db[key] = db[key] || { name: clean, token, best: null, games: 0 };
    writeLocal(db);
    setPlayer({ name: clean, token });
    return { ok: true, name: clean, token, returning: Boolean(prevToken) };
  }

  async function submit(result) {
    const me = getPlayer();
    if (!me) return { ok: false };
    const payload = { name: me.name, token: me.token, ...result };
    if ((await detect()) === "remote") {
      try {
        const r = await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (r.ok) return await r.json();
      } catch (e) { mode = "local"; }
    }
    const db = readLocal();
    const key = normalize(me.name);
    const p = (db[key] = db[key] || { name: me.name, token: me.token, best: null, games: 0 });
    const entry = { score: result.score, memories: result.memories, lives: result.lives, won: result.won, at: Date.now() };
    p.games += 1;
    const improved = !p.best || entry.score > p.best.score;
    if (improved) p.best = entry;
    writeLocal(db);
    const board = await top(50);
    return { ok: true, best: p.best, improved, rank: board.findIndex((e) => e.name === me.name) + 1 || null };
  }

  async function top(limit) {
    if ((await detect()) === "remote") {
      try {
        const r = await fetch(`/api/scores?limit=${limit || 20}`, { cache: "no-store" });
        if (r.ok) return (await r.json()).scores;
      } catch (e) { mode = "local"; }
    }
    return Object.values(readLocal())
      .filter((p) => p.best)
      .sort((a, b) => b.best.score - a.best.score || a.best.at - b.best.at)
      .slice(0, limit || 20)
      .map((p, i) => ({ rank: i + 1, name: p.name, ...p.best, games: p.games }));
  }

  return { detect, check, claim, submit, top, getPlayer, cleanName, mode: () => mode };
})();

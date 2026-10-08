#!/usr/bin/env node
// Servidor del juego: sirve los archivos estáticos y expone el scoreboard compartido
// con nombres de jugador únicos. Sin dependencias (Node 18+).
//
//   node server/index.js            → http://localhost:8080
//   PORT=3000 node server/index.js
//
// Datos en server/data/scores.json. Si el juego se sirve como estático sin este servidor
// (p. ej. GitHub Pages), el cliente cae a un scoreboard local en el navegador.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "scores.json");
const PORT = Number(process.env.PORT) || 8080;
const MAX_NAME = 20;
const TOP = 50;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".csv": "text/csv; charset=utf-8"
};

// ---------- Persistencia ----------
let db = { players: {} }; // key normalizada → { name, tokenHash, best, games, updatedAt }

function load() {
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch { db = { players: {} }; }
  db.players ||= {};
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }, 200);
}

// "José  Pérez" y "jose perez" son el mismo nombre.
function normalize(name) {
  return String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
function cleanName(raw) {
  const name = String(raw || "").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > MAX_NAME) return null;
  if (!/^[\p{L}\p{N} _.'-]+$/u.test(name)) return null;
  return name;
}
const hash = (t) => crypto.createHash("sha256").update(t).digest("hex");

function leaderboard(limit) {
  return Object.values(db.players)
    .filter((p) => p.best)
    .sort((a, b) => b.best.score - a.best.score || a.best.at - b.best.at)
    .slice(0, limit)
    .map((p, i) => ({ rank: i + 1, name: p.name, ...p.best, games: p.games }));
}

// ---------- Rate limit básico por IP ----------
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 60;
}

// ---------- API ----------
function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 10000) reject(new Error("too large")); });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
  });
}

async function api(req, res, url) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (limited(ip)) return json(res, 429, { error: "Despacio, compadre. Demasiadas peticiones." });

  if (req.method === "GET" && url.pathname === "/api/health") return json(res, 200, { ok: true, players: Object.keys(db.players).length });

  if (req.method === "GET" && url.pathname === "/api/scores") {
    const limit = Math.min(TOP, Number(url.searchParams.get("limit")) || 20);
    return json(res, 200, { scores: leaderboard(limit), total: Object.keys(db.players).length });
  }

  // Comprueba si un nombre está libre (para avisar mientras se escribe).
  if (req.method === "GET" && url.pathname === "/api/players/check") {
    const name = cleanName(url.searchParams.get("name"));
    if (!name) return json(res, 200, { available: false, reason: "invalid" });
    return json(res, 200, { available: !db.players[normalize(name)] });
  }

  // Reclama un nombre. Devuelve un token secreto que identifica a ese jugador en adelante.
  if (req.method === "POST" && url.pathname === "/api/players") {
    const body = await readBody(req);
    const name = cleanName(body.name);
    if (!name) return json(res, 400, { error: "Nombre inválido: de 2 a 20 letras, números, espacios, puntos o guiones." });
    const key = normalize(name);
    const existing = db.players[key];
    if (existing) {
      // El mismo jugador (mismo token) puede volver a entrar con su nombre.
      if (body.token && hash(body.token) === existing.tokenHash) return json(res, 200, { ok: true, name: existing.name, token: body.token, returning: true });
      return json(res, 409, { error: "Ese nombre ya lo cogió otro cubano. Prueba otro." });
    }
    const token = crypto.randomBytes(18).toString("hex");
    db.players[key] = { name, tokenHash: hash(token), best: null, games: 0, createdAt: Date.now() };
    save();
    return json(res, 201, { ok: true, name, token });
  }

  if (req.method === "POST" && url.pathname === "/api/scores") {
    const body = await readBody(req);
    const name = cleanName(body.name);
    const player = name && db.players[normalize(name)];
    if (!player || !body.token || hash(body.token) !== player.tokenHash) return json(res, 403, { error: "Ese nombre no es tuyo." });
    const score = Math.max(0, Math.min(100000, Math.floor(Number(body.score) || 0)));
    const entry = {
      score,
      memories: Math.max(0, Math.min(99, Math.floor(Number(body.memories) || 0))),
      lives: Math.max(0, Math.min(5, Math.floor(Number(body.lives) || 0))),
      won: Boolean(body.won),
      at: Date.now()
    };
    player.games += 1;
    if (!player.best || score > player.best.score) player.best = entry;
    save();
    const board = leaderboard(TOP);
    const rank = board.findIndex((e) => e.name === player.name) + 1;
    return json(res, 200, { ok: true, best: player.best, rank: rank || null, improved: player.best === entry });
  }

  json(res, 404, { error: "No existe" });
}

// ---------- Estáticos ----------
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT) || file.startsWith(path.join(ROOT, "server"))) {
    res.writeHead(403); return res.end();
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end("No encontrado"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "public, max-age=300" });
    fs.createReadStream(file).pipe(res);
  });
}

load();
http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    api(req, res, url).catch((e) => json(res, 400, { error: e.message }));
  } else {
    serveStatic(req, res, url);
  }
}).listen(PORT, () => console.log(`☕ El Viaje de Tito en http://localhost:${PORT}  (scoreboard: ${DATA_FILE})`));

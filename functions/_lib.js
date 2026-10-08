// Lógica compartida del scoreboard para Cloudflare Pages Functions (KV: binding SCORES).
// Misma semántica que server/index.js: nombres únicos (sin acentos ni mayúsculas) y token por jugador.

const MAX_NAME = 20;
const TOP = 50;

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export function normalize(name) {
  return String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function cleanName(raw) {
  const name = String(raw || "").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > MAX_NAME) return null;
  if (!/^[\p{L}\p{N} _.'-]+$/u.test(name)) return null;
  return name;
}

export async function hash(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const randomToken = () => [...crypto.getRandomValues(new Uint8Array(18))].map((b) => b.toString(16).padStart(2, "0")).join("");

// Jugadores en KV: "p:<clave>" → { name, tokenHash, best, games, createdAt }.
// Ranking en KV: "board" → array ordenado de los TOP mejores (se recalcula al enviar puntuación).
export const playerKey = (name) => `p:${normalize(name)}`;

export async function getPlayer(env, name) {
  return env.SCORES.get(playerKey(name), "json");
}

export async function putPlayer(env, player) {
  await env.SCORES.put(playerKey(player.name), JSON.stringify(player));
}

export async function getBoard(env) {
  return (await env.SCORES.get("board", "json")) || [];
}

export async function updateBoard(env, player) {
  const board = (await getBoard(env)).filter((e) => normalize(e.name) !== normalize(player.name));
  if (player.best) board.push({ name: player.name, ...player.best, games: player.games });
  board.sort((a, b) => b.score - a.score || a.at - b.at);
  const top = board.slice(0, TOP);
  await env.SCORES.put("board", JSON.stringify(top));
  return top.map((e, i) => ({ rank: i + 1, ...e }));
}

export async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

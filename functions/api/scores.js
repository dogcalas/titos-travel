import { json, cleanName, getPlayer, putPlayer, getBoard, updateBoard, hash, readJson } from "../_lib.js";

export const onRequestGet = async ({ request, env }) => {
  const limit = Math.min(50, Number(new URL(request.url).searchParams.get("limit")) || 20);
  const board = (await getBoard(env)).slice(0, limit).map((e, i) => ({ rank: i + 1, ...e }));
  return json({ scores: board });
};

export const onRequestPost = async ({ request, env }) => {
  const body = await readJson(request);
  const name = cleanName(body.name);
  const player = name && (await getPlayer(env, name));
  if (!player || !body.token || (await hash(body.token)) !== player.tokenHash) return json({ error: "Ese nombre no es tuyo." }, 403);
  const score = Math.max(0, Math.min(100000, Math.floor(Number(body.score) || 0)));
  const entry = {
    score,
    memories: Math.max(0, Math.min(99, Math.floor(Number(body.memories) || 0))),
    lives: Math.max(0, Math.min(5, Math.floor(Number(body.lives) || 0))),
    won: Boolean(body.won),
    at: Date.now()
  };
  player.games = (player.games || 0) + 1;
  const improved = !player.best || score > player.best.score;
  if (improved) player.best = entry;
  await putPlayer(env, player);
  const board = await updateBoard(env, player);
  const rank = board.findIndex((e) => e.name === player.name) + 1;
  return json({ ok: true, best: player.best, rank: rank || null, improved });
};

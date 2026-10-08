import { json, cleanName, getPlayer, putPlayer, hash, randomToken, readJson } from "../../_lib.js";

// Reclama un nombre. Devuelve un token secreto que identifica a ese jugador en adelante.
export const onRequestPost = async ({ request, env }) => {
  const body = await readJson(request);
  const name = cleanName(body.name);
  if (!name) return json({ error: "Nombre inválido: de 2 a 20 letras, números, espacios, puntos o guiones." }, 400);
  const existing = await getPlayer(env, name);
  if (existing) {
    if (body.token && (await hash(body.token)) === existing.tokenHash) return json({ ok: true, name: existing.name, token: body.token, returning: true });
    return json({ error: "Ese nombre ya lo cogió otro cubano. Prueba otro." }, 409);
  }
  const token = randomToken();
  await putPlayer(env, { name, tokenHash: await hash(token), best: null, games: 0, createdAt: Date.now() });
  return json({ ok: true, name, token }, 201);
};

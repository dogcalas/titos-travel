import { json } from "../_lib.js";
export const onRequestGet = async ({ env }) => {
  if (!env.SCORES) return json({ ok: false, error: "Falta el binding KV 'SCORES'" }, 500);
  return json({ ok: true });
};

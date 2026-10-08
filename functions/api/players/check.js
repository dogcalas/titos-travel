import { json, cleanName, getPlayer } from "../../_lib.js";

export const onRequestGet = async ({ request, env }) => {
  const name = cleanName(new URL(request.url).searchParams.get("name"));
  if (!name) return json({ available: false, reason: "invalid" });
  return json({ available: !(await getPlayer(env, name)) });
};

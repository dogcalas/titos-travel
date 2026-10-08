#!/usr/bin/env node
// Genera los recursos visuales y de voz del juego con la API de Google AI (Gemini).
// La clave se usa solo aquí, en tu máquina: el juego publicado nunca la ve.
//
//   GEMINI_API_KEY=xxxx node tools/generate-assets.mjs                 # todo
//   GEMINI_API_KEY=xxxx node tools/generate-assets.mjs --only=tito     # poses de Tito
//   GEMINI_API_KEY=xxxx node tools/generate-assets.mjs --only=guardians
//   GEMINI_API_KEY=xxxx node tools/generate-assets.mjs --only=scenes
//   GEMINI_API_KEY=xxxx node tools/generate-assets.mjs --only=audio      # voces de guardianes
//   GEMINI_API_KEY=xxxx node tools/generate-assets.mjs --only=narration  # narrador (subtítulos)
//   GEMINI_API_KEY=xxxx node tools/generate-assets.mjs --only=music      # tema de reparto (Lyria)
//   ... --force   (regenera aunque el archivo ya exista)
//
// Los sprites (Tito, guardianes, cafetera) se generan sobre fondo verde en assets/raw/
// y luego `python3 tools/chroma_key.py` los recorta a PNG transparente en assets/img/.
//
// Modelos configurables:
//   GEMINI_IMAGE_MODEL (por defecto gemini-2.5-flash-image)
//   GEMINI_TTS_MODEL   (por defecto gemini-3.1-flash-tts-preview)
//   GEMINI_TTS_VOICE   (por defecto Algenib, el narrador)
//
// Requiere Node 18+ (fetch nativo).

import { mkdir, writeFile, access, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://generativelanguage.googleapis.com/v1beta/models";
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
// gemini-3.8-flash-tts lee en voz alta la instrucción de estilo; 3.1-preview y 2.5-preview la obedecen sin leerla.
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
const TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Algenib"; // narrador: voz masculina grave

const args = new Set(process.argv.slice(2));
const only = [...args].find((a) => a.startsWith("--only="))?.split("=")[1];
const force = args.has("--force");

if (!KEY) {
  console.error("Falta GEMINI_API_KEY (o GOOGLE_API_KEY). Créala en https://aistudio.google.com/apikey");
  process.exit(1);
}

const GREEN =
  " The background must be a completely flat, uniform, solid bright chroma-key green (#00FF00) with no shadows on it, " +
  "no floor, no gradient, no props, no text. Nothing in the character may be green.";
// Para Tito usamos magenta: su ropa clara recoge menos "spill" y el recorte por tono lo separa mejor.
const MAGENTA =
  " The background must be a completely flat, uniform, solid bright chroma-key magenta (#FF00FF) with no shadows on it, " +
  "no floor, no gradient, no props, no text, no vignette. Nothing in the character may be pink or magenta.";

const PIXAR = "Stylized 3D animated-film look (Pixar-like), soft studio lighting, high detail, full body visible with margin above head and below feet, centered.";

const TITO_DESC =
  "Tito: a 35-year-old Cuban man, light brown skin, short dark curly hair with a fade, slight stubble, warm expressive eyes, " +
  "wearing a fitted short-sleeve light-blue linen shirt (plain, no pockets) open over a white t-shirt, dark slim jeans, " +
  "clean white sneakers and a thin gold chain.";

// Poses de Tito. "idle" es la referencia; las demás se generan a partir de ella para mantener el personaje.
const TITO_BASE = `Full-body character design of ${TITO_DESC} Use the attached image as the exact reference for his face, hair, body, outfit and rendering style; keep them identical. ${PIXAR}`;
const TITO_POSES = {
  idle: `Full-body character design of ${TITO_DESC} Standing idle, relaxed, slight smile, facing the viewer, three-quarter view. ${PIXAR}${MAGENTA}`,
  happy: `${TITO_BASE} Pose: jumping with joy, both arms raised high, big open-mouth laugh, eyes squeezed shut with happiness, feet off the ground.${MAGENTA}`,
  cold: `${TITO_BASE} Pose: cold and sad, hugging himself with both arms, shoulders hunched, shivering, eyes downcast, mouth in a small sad line.${MAGENTA}`,
  think: `${TITO_BASE} Pose: thinking hard, one hand on his chin, eyebrows raised, looking up and to the side, slight nervous smile.${MAGENTA}`,
  walk: `${TITO_BASE} Pose: seen from behind, walking away from the viewer with determination, one foot forward, right hand slightly raised. Nothing else in the frame: no steam, no smoke, no curtain, no objects.${MAGENTA}`,
  coffee: `${TITO_BASE} Pose: holding a tiny white Cuban coffee cup near his face with both hands, eyes closed, smiling peacefully, savoring the aroma.${MAGENTA}`
};

const GUARDIANS = {
  malecon: `An old Cuban fisherman made of sea foam and turquoise water, wearing a yarey straw hat, long beard of white foam, eyes that are two sea shells, holding a fishing rod. Friendly and wise. Three-quarter view, full body. ${PIXAR}${GREEN}`,
  solar: `Mamá Inés: an elderly Afro-Cuban grandmother with a white headscarf, white blouse and a long flowered skirt, holding a cloth coffee strainer dripping coffee into a small cup, warm knowing smile, glowing golden steam around her hands. Full body. ${PIXAR}${GREEN}`,
  parque: `Pin Pón: a cute puppet boy made of painted cardboard, round pink painted cheeks, button eyes, neat combed hair, a little handkerchief in his pocket, shorts and suspenders, waving. Full body. ${PIXAR}${GREEN}`,
  bodega: `Cuco: a Cuban neighborhood shopkeeper with FOUR arms, a pencil behind each ear, a white apron over a striped shirt, one hand holding a notebook, one a scale weight, one a paper bag, one scratching his head, comic frazzled expression. Full body. ${PIXAR}${GREEN}`,
  cabana: `A colonial Spanish artilleryman from 1800s Havana in a red coat with gold trim, white trousers, black tricorn hat, big moustache, holding a burning fuse on a long stick, stern but kind face. Full body. ${PIXAR}${GREEN}`,
  almendron: `Chicho: a relaxed Cuban taxi driver in his fifties, flat cap, sunglasses pushed up on his forehead, short-sleeve patterned shirt, gold chain, big grin with a gold tooth, holding a fuzzy-covered steering wheel. Full body. ${PIXAR}${GREEN}`,
  carnaval: `A Cuban carnival "diablito" dancer: a figure in a colorful striped costume covering the whole body, a cone-shaped sack mask with embroidered eyes, little bells on the ankles, mid-dance pose floating slightly off the ground, festive. Full body. ${PIXAR}${GREEN}`,
  vinales: `A Cuban guajiro farmer from Viñales: weathered tan skin, guano palm hat, white shirt with rolled sleeves, machete at the belt, boots, smoking a cigar whose smoke curls into the shape of a small horse. Serene smile. Full body. ${PIXAR}${GREEN}`,
  ceiba: `A gentle ancient grandmother spirit whose skin and dress are made of ceiba tree bark and green leaves, roots trailing from her hem, tiny golden lights floating around her, arms open in welcome, serene face. Full body. ${PIXAR}${GREEN}`
};

const PROPS = {
  cafetera: `An old dented aluminum Italian-style moka coffee pot (cafetera cubana), slightly scratched, with thick glowing golden steam rising from the spout and swirling upwards. Object only, slightly from above. ${PIXAR}${GREEN}`,
  domino: `A single domino tile made of iridescent mother-of-pearl (nacre), the 6-6 double, black pips, glowing softly, floating at a slight angle. Object only. ${PIXAR}${GREEN}`
};

const SCENE_STYLE =
  " Cinematic magical-realism digital painting, warm Caribbean golden light, rich saturated colors, " +
  "subtle cold grey fog creeping in from one edge of the frame, nostalgic and dreamlike, wide 16:9 composition, " +
  "no people in the foreground, no text, no letters, no logos, no watermarks.";

const SCENES = {
  miami: "View from a 14th-floor apartment window in Miami at night: the I-95 highway full of red and white light trails, Brickell neon towers, a cold blue-grey tint. In the foreground inside the dark kitchen, an old aluminum moka coffee pot on a stove releases thick golden steam that swirls into a glowing portal.",
  malecon: "The Havana Malecón seawall at sunset, ocean waves frozen mid-air like curtains of green glass with tiny glowing memories inside them, old colorful colonial facades along the avenue, Morro castle lighthouse in the distance.",
  solar: "The courtyard of a colorful old Havana tenement (solar) with clotheslines crossing between balconies, laundry dancing by itself, walls peeling and repainting themselves in pink, green and canary yellow, a charcoal stove with a cloth coffee strainer, steam glowing gold.",
  parque: "A dreamy vintage Cuban amusement park at dusk, a rusty carousel with wooden horses, a ferris wheel with colored bulbs, pink cotton candy floating like clouds.",
  bodega: "Interior of an old Cuban neighborhood bodega, worn wooden counter, chalkboard price list, sacks of rice and beans, an old needle scale, cloth bags, warm afternoon light through the door.",
  cabana: "The ramparts of La Cabaña fortress in Havana at twilight, an old bronze cannon pointing over Havana bay glowing copper below, city lights turning on, torches along the wall.",
  almendron: "View through the windshield from inside a red and white 1957 Chevrolet classic car driving on an endless Cuban country road, fluffy dashboard, through the windows sugar cane fields, royal palms and a sunset beach blur past.",
  carnaval: "The Santiago de Cuba carnival at night, a street full of spinning paper lanterns (farolas), sequined costumes in motion blur, drums, confetti in the air, warm colored lights.",
  vinales: "The Viñales valley in Cuba at sunrise, limestone mogotes rising from red earth, tobacco fields and a thatched tobacco drying house, a bohío with a rocking chair on the porch, cigar smoke drawing shapes in the air.",
  ceiba: "A colossal sacred ceiba tree at the heart of Cuba, taller than skyscrapers, roots spreading across the whole island with rivers of glowing memories flowing between them, a grey silent hurricane of fog circling the tree and being pushed back by golden light."
};

const INTRO_NARRATION =
  "Lee esto como una abuela cubana cálida y misteriosa, con acento habanero, despacio y con mucha emoción: " +
  "Tito… la Neblina del Norte te está dejando sin pasado. Ya no te acuerdas cómo termina Arroz con leche, " +
  "y el cañonazo de las nueve es apenas un eco. Cruza el vapor, mi niño. Busca tus recuerdos donde los dejaste. " +
  "Llevas en el bolsillo de la guayabera cinco fichas de dominó de nácar. Cuídalas. Y no vas solo: " +
  "contigo va tu Sangre Mambisa.";

// Saludo de cada Guardián (una frase corta por dimensión).
// [estilo, frase, voz prebuilt de Gemini]
const GUARDIAN_LINES = {
  malecon: ["un viejo pescador habanero, voz ronca y cariñosa, lento", "Mucho tiempo sin venir, muchacho. A ver si todavía te acuerdas de lo que te enseñó tu abuela.", "Algenib"],
  solar: ["una abuela afrocubana dulce y firme", "Ay, mijo, siéntate. Pero antes de darte la tacita, dime una cosa.", "Gacrux"],
  parque: ["un muñeco de cartón infantil, juguetón y agudo", "¡Si no te acuerdas de esto, el parque se cierra para siempre!", "Puck"],
  bodega: ["un bodeguero habanero apurado y gritón", "¿Quién es el último? ¡Tú! Para que te despache, primero me tienes que contestar.", "Fenrir"],
  cabana: ["un artillero colonial solemne, voz de trueno", "Si el cañonazo de las nueve no suena, La Habana se queda sin cerrar las puertas. Respóndeme, y yo disparo.", "Orus"],
  almendron: ["un chofer de almendrón relajado y jodedor", "No me tires la puerta, ¿eh? Este carro camina con gasolina de recuerdos. Si no me contestas, nos quedamos botados.", "Zubenelgenubi"],
  carnaval: ["un diablito de carnaval santiaguero, rápido, riéndose", "¡La conga no para, muchacho! Pero para que tú entres, tienes que demostrar que eres de aquí.", "Sadachbia"],
  vinales: ["un guajiro pinareño pausado y sabio", "Hay cosas que solo sabe el que se crió aquí. A ver si es verdad.", "Schedar"],
  ceiba: ["una abuela ancestral, muy serena, casi un susurro", "Has llegado hasta la semilla, mi niño. Aquí hay que ser cubano de pura cepa.", "Vindemiatrix"]
};

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function callGemini(model, body, attempt = 0) {
  const res = await fetch(`${API}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify(body)
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
      return callGemini(model, body, attempt + 1);
    }
  }
  if (!res.ok) throw new Error(`${model} → HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) {
    const reason = json.candidates?.[0]?.finishReason || JSON.stringify(json).slice(0, 300);
    throw new Error(`${model} no devolvió datos binarios (${reason})`);
  }
  return part.inlineData;
}

function extFor(mime) {
  return { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[mime] || "png";
}

async function image(prompt, aspectRatio, referencePath) {
  const parts = [];
  if (referencePath) {
    const buf = await readFile(referencePath);
    parts.push({ inlineData: { mimeType: "image/png", data: buf.toString("base64") } });
  }
  parts.push({ text: prompt });
  return callGemini(IMAGE_MODEL, {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio } }
  });
}

// La API de TTS puede devolver PCM 16-bit mono crudo (audio/L16;rate=24000): lo envolvemos en WAV.
function pcmToWav(pcm, sampleRate = 24000) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function loadManifest() {
  const file = path.join(ROOT, "js", "assets-manifest.js");
  const sandbox = { window: {} };
  try { vm.runInNewContext(await readFile(file, "utf8"), sandbox); } catch { /* nuevo */ }
  const m = sandbox.window.ASSETS || {};
  m.images ||= {};
  m.sprites ||= {};
  m.audio ||= {};
  return m;
}

async function saveManifest(manifest) {
  const file = path.join(ROOT, "js", "assets-manifest.js");
  await writeFile(
    file,
    "// Generado por tools/generate-assets.mjs + tools/chroma_key.py. Vacío = el juego usa fondos y sonidos sintetizados.\n" +
      `window.ASSETS = ${JSON.stringify(manifest, null, 2)};\n`
  );
}

// Sprites: se guardan crudos (fondo verde) en assets/raw/<name>.png; chroma_key.py produce assets/img/<name>.png.
async function generateSprites(manifest, group, items, aspect, referenceKey) {
  const dir = path.join(ROOT, "assets", "raw");
  await mkdir(dir, { recursive: true });
  const ref = referenceKey ? path.join(dir, `${referenceKey}.png`) : null;
  for (const [key, prompt] of Object.entries(items)) {
    const name = group === "tito" ? `tito_${key}` : group === "guardians" ? `guardian_${key}` : key;
    const raw = path.join(dir, `${name}.png`);
    if (!force && (await exists(raw))) {
      console.log(`· ${name}: ya existe`);
      continue;
    }
    process.stdout.write(`🎭 ${name}… `);
    try {
      const useRef = ref && key !== referenceKey && (await exists(ref)) ? ref : null;
      const data = await image(prompt, aspect, useRef);
      await writeFile(raw, Buffer.from(data.data, "base64"));
      manifest.sprites[name] = `assets/img/${name}.png`;
      await saveManifest(manifest);
      console.log(`ok${useRef ? " (con referencia)" : ""}`);
    } catch (e) {
      console.log(`falló\n   ${e.message}`);
    }
  }
}

async function generateScenes(manifest) {
  const dir = path.join(ROOT, "assets", "img");
  await mkdir(dir, { recursive: true });
  for (const [key, scene] of Object.entries(SCENES)) {
    const existing = manifest.images[key];
    if (!force && existing && (await exists(path.join(ROOT, existing)))) {
      console.log(`· escena ${key}: ya existe`);
      continue;
    }
    process.stdout.write(`🎨 escena ${key}… `);
    try {
      const data = await image(scene + SCENE_STYLE, "16:9");
      const rel = `assets/img/scene_${key}.${extFor(data.mimeType)}`;
      await writeFile(path.join(ROOT, rel), Buffer.from(data.data, "base64"));
      manifest.images[key] = rel;
      await saveManifest(manifest);
      console.log(`ok → ${rel}`);
    } catch (e) {
      console.log(`falló\n   ${e.message}`);
    }
  }
}

async function tts(text, voice = TTS_VOICE) {
  const data = await callGemini(TTS_MODEL, {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
    }
  });
  const rate = Number(/rate=(\d+)/.exec(data.mimeType || "")?.[1] || 24000);
  const pcm = Buffer.from(data.data, "base64");
  return /wav/.test(data.mimeType) ? pcm : pcmToWav(pcm, rate);
}

// Narración completa de la historia (una pista por párrafo) para los subtítulos sincronizados.
const NARRATOR_STYLE = "Narra en español cubano, como un narrador de cine cálido y nostálgico, voz grave, con emoción, a ritmo ágil y natural, sin pausas largas: ";
async function narrationJobs() {
  const sandbox = { window: {} };
  vm.runInNewContext(await readFile(path.join(ROOT, "js", "narrative.js"), "utf8"), sandbox);
  const N = sandbox.window.NARRATIVE;
  const strip = (html) => html.replace(/<[^>]+>/g, "");
  // [clave, texto con instrucción de estilo, voz]
  const jobs = [];
  N.intro.paragraphs.forEach((t, i) => jobs.push([`n_intro_${i}`, NARRATOR_STYLE + strip(t), TTS_VOICE]));
  for (const d of N.dimensions) {
    const [style, , voice] = GUARDIAN_LINES[d.key];
    const asGuardian = (t) => `Habla en español cubano, en primera persona, como ${style}, con ritmo ágil y natural: ${strip(t)}`;
    d.arrive.forEach((t, i) => jobs.push([`n_${d.key}_arrive_${i}`, asGuardian(t), voice]));
    d.again.forEach((t, i) => jobs.push([`n_${d.key}_again_${i}`, asGuardian(t), voice]));
  }
  N.victory.paragraphs.forEach((t, i) => jobs.push([`n_victory_${i}`, NARRATOR_STYLE + strip(t), TTS_VOICE]));
  N.defeat.paragraphs.forEach((t, i) => jobs.push([`n_defeat_${i}`, NARRATOR_STYLE + strip(t), TTS_VOICE]));
  return jobs;
}

async function generateNarration(manifest) {
  const dir = path.join(ROOT, "assets", "audio");
  await mkdir(dir, { recursive: true });
  const jobs = await narrationJobs();
  // Pistas de narración que ya no existen en narrative.js (p. ej. tras acortar la intro).
  const valid = new Set(jobs.map(([k]) => k));
  for (const key of Object.keys(manifest.audio)) {
    if (key.startsWith("n_") && !valid.has(key)) {
      await unlink(path.join(ROOT, manifest.audio[key])).catch(() => {});
      delete manifest.audio[key];
    }
  }
  for (const [name, text, voice] of jobs) {
    const rel = `assets/audio/${name}.wav`;
    if (!force && manifest.audio[name] && (await exists(path.join(ROOT, manifest.audio[name])))) {
      console.log(`· ${name}: ya existe`);
      continue;
    }
    process.stdout.write(`🎙️  ${name}… `);
    try {
      await writeFile(path.join(ROOT, rel), await tts(text, voice));
      manifest.audio[name] = rel;
      await saveManifest(manifest);
      console.log("ok");
    } catch (e) {
      console.log(`falló\n   ${e.message}`);
    }
  }
}

async function generateAudio(manifest) {
  const dir = path.join(ROOT, "assets", "audio");
  await mkdir(dir, { recursive: true });
  // Solo la voz de la cafetera en la pantalla de título; los Guardianes narran sus propias escenas (--only=narration).
  const jobs = [["intro", INTRO_NARRATION, "Sulafat"]];
  for (const [name, text, voice] of jobs) {
    const rel = `assets/audio/${name}.wav`;
    if (!force && manifest.audio[name] && (await exists(path.join(ROOT, manifest.audio[name])))) {
      console.log(`· ${name}: ya existe`);
      continue;
    }
    process.stdout.write(`🗣️  ${name}… `);
    try {
      await writeFile(path.join(ROOT, rel), await tts(text, voice));
      manifest.audio[name] = rel;
      await saveManifest(manifest);
      console.log(`ok → ${rel}`);
    } catch (e) {
      console.log(`falló\n   ${e.message}`);
    }
  }
}

// Música de fondo con Lyria: un tema de reparto instrumental en bucle.
const MUSIC_MODEL = process.env.LYRIA_MODEL || "lyria-3.5";
const MUSIC_PROMPT =
  "Instrumental Cuban reparto / reggaetón cubano beat, 96 BPM, dembow drums, deep 808 bass with tumbao, " +
  "clave 3-2 and congas, dark minor synth stabs and a nostalgic Cuban tres melody, modern Havana street sound, " +
  "steady energy, seamless loop, no vocals, no intro, no outro.";

async function generateMusic(manifest) {
  const rel = "assets/audio/reparto.mp3";
  if (!force && manifest.audio.music && (await exists(path.join(ROOT, manifest.audio.music)))) {
    console.log("· música: ya existe");
    return;
  }
  process.stdout.write(`🎵 reparto (${MUSIC_MODEL})… `);
  try {
    const data = await callGemini(MUSIC_MODEL, {
      contents: [{ parts: [{ text: MUSIC_PROMPT }] }],
      generationConfig: { responseModalities: ["AUDIO"] }
    });
    await mkdir(path.join(ROOT, "assets", "audio"), { recursive: true });
    await writeFile(path.join(ROOT, rel), Buffer.from(data.data, "base64"));
    manifest.audio.music = rel;
    await saveManifest(manifest);
    console.log(`ok → ${rel}`);
  } catch (e) {
    console.log(`falló\n   ${e.message}`);
  }
}

const manifest = await loadManifest();
const want = (g) => !only || only === g;
if (want("tito")) await generateSprites(manifest, "tito", TITO_POSES, "3:4", "idle");
if (want("guardians")) await generateSprites(manifest, "guardians", GUARDIANS, "3:4");
if (want("props")) await generateSprites(manifest, "props", PROPS, "1:1");
if (want("scenes")) await generateScenes(manifest);
if (want("audio")) await generateAudio(manifest);
if (want("narration")) await generateNarration(manifest);
if (want("music")) await generateMusic(manifest);
console.log("Listo. Ejecuta `python3 tools/chroma_key.py` para recortar los sprites y recarga index.html.");

#!/usr/bin/env node
// Genera los fondos de cada dimensión y la narración de la intro con la API de Google AI (Gemini).
// La clave se usa solo aquí, en tu máquina: el juego publicado nunca la ve.
//
//   GEMINI_API_KEY=xxxx node tools/generate-assets.mjs            # imágenes + narración
//   GEMINI_API_KEY=xxxx node tools/generate-assets.mjs --only=images
//   GEMINI_API_KEY=xxxx node tools/generate-assets.mjs --only=audio
//   ... --force   (regenera aunque el archivo ya exista)
//
// Modelos configurables por si Google les cambia el nombre:
//   GEMINI_IMAGE_MODEL (por defecto gemini-2.5-flash-image)
//   GEMINI_TTS_MODEL   (por defecto gemini-2.5-flash-preview-tts)
//   GEMINI_TTS_VOICE   (por defecto Sulafat)
//
// Requiere Node 18+ (fetch nativo).

import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://generativelanguage.googleapis.com/v1beta/models";
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Sulafat";

const args = new Set(process.argv.slice(2));
const only = [...args].find((a) => a.startsWith("--only="))?.split("=")[1];
const force = args.has("--force");

if (!KEY) {
  console.error("Falta GEMINI_API_KEY (o GOOGLE_API_KEY). Créala en https://aistudio.google.com/apikey");
  process.exit(1);
}

const STYLE =
  "Cinematic magical-realism digital painting, warm Caribbean golden light, rich saturated colors, " +
  "subtle cold grey fog creeping in from one edge of the frame, nostalgic and dreamlike, wide 16:9 composition, " +
  "space in the center for overlaid text, no text, no letters, no logos, no watermarks.";

const IMAGES = {
  miami: "A lonely Cuban man in his thirties wearing a white guayabera, seen from behind, standing at the window of a 14th-floor apartment in Miami at night, looking at the I-95 highway full of red and white light trails and Brickell neon towers. On the kitchen stove behind him an old aluminum moka coffee pot releases thick golden steam that swirls into a glowing portal.",
  malecon: "The Havana Malecón seawall at sunset, ocean waves frozen mid-air like curtains of green glass with tiny glowing memories inside them, an old fisherman made of sea foam wearing a yarey straw hat sitting on the wall with a fishing rod whose line disappears into the clouds, Morro castle lighthouse in the distance.",
  solar: "The courtyard of a colorful old Havana tenement (solar) with clotheslines crossing between balconies, laundry dancing by itself, walls peeling and repainting themselves in pink, green and canary yellow, an elderly Afro-Cuban woman in a white headscarf brewing coffee through a cloth strainer over a charcoal stove, steam glowing gold.",
  parque: "A dreamy vintage Cuban amusement park at dusk, a rusty carousel with wooden horses, a ferris wheel with colored bulbs, pink cotton candy floating like clouds, a cute cardboard puppet boy with painted rosy cheeks and a handkerchief standing in the foreground.",
  bodega: "Interior of an old Cuban neighborhood bodega, worn wooden counter, chalkboard price list, sacks of rice and beans, an old needle scale, women with cloth bags waiting in line, a whimsical shopkeeper with four arms and a pencil behind each ear serving everyone at once, warm afternoon light through the door.",
  cabana: "The ramparts of La Cabaña fortress in Havana at twilight, a colonial artilleryman in a red coat and tricorn hat holding a burning fuse next to an old bronze cannon, Havana bay glowing copper below, city lights turning on, torches along the wall.",
  almendron: "Inside a red and white 1957 Chevrolet classic car (almendrón) driving on an endless Cuban country road, view from the back seat, fluffy dashboard and steering wheel, a driver with a cap looking through the rear-view mirror, through the windows sugar cane fields, royal palms and a sunset beach blur past.",
  carnaval: "The Santiago de Cuba carnival at night, a conga line of hundreds of dancers flowing down a street, spinning paper lanterns (farolas), sequined costumes, drums and a Chinese cornet, a playful masked diablito dancer in a striped costume with little bells on his ankles floating above the ground, confetti in the air.",
  vinales: "The Viñales valley in Cuba at sunrise, limestone mogotes rising from red earth, tobacco fields and a thatched tobacco drying house, a guajiro farmer in a guano palm hat rocking on a taburete chair on the porch of a bohío, smoking a cigar whose smoke draws a horse, a palm tree and a dancing woman in the air.",
  ceiba: "A colossal sacred ceiba tree at the heart of Cuba, taller than skyscrapers, roots spreading across the whole island with rivers of glowing memories flowing between them, the bark opening to reveal the serene wise face of an old grandmother, a grey silent hurricane of fog circling the tree and being pushed back by golden light."
};

const INTRO_NARRATION =
  "Lee esto como una abuela cubana cálida y misteriosa, con acento habanero, despacio y con mucha emoción: " +
  "Tito… la Neblina del Norte te está dejando sin pasado. Ya no te acuerdas cómo termina Arroz con leche, " +
  "y el cañonazo de las nueve es apenas un eco. Cruza el vapor, mi niño. Busca tus recuerdos donde los dejaste. " +
  "Llevas en el bolsillo de la guayabera cinco fichas de dominó de nácar. Cuídalas. Y no vas solo: " +
  "contigo va tu Sangre Mambisa.";

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function callGemini(model, body) {
  const res = await fetch(`${API}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${model} → HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error(`${model} no devolvió datos binarios: ${JSON.stringify(json).slice(0, 400)}`);
  return part.inlineData;
}

function extFor(mime) {
  return { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[mime] || "png";
}

// La API de TTS devuelve PCM 16-bit mono crudo (audio/L16;rate=24000): lo envolvemos en WAV.
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
  return sandbox.window.ASSETS || { images: {}, audio: {} };
}

async function saveManifest(manifest) {
  const file = path.join(ROOT, "js", "assets-manifest.js");
  await writeFile(
    file,
    "// Generado por tools/generate-assets.mjs. Vacío = el juego usa los fondos y sonidos sintetizados.\n" +
      `window.ASSETS = ${JSON.stringify(manifest, null, 2)};\n`
  );
}

async function generateImages(manifest) {
  const dir = path.join(ROOT, "assets", "img");
  await mkdir(dir, { recursive: true });
  for (const [key, scene] of Object.entries(IMAGES)) {
    const existing = manifest.images[key];
    if (!force && existing && (await exists(path.join(ROOT, existing)))) {
      console.log(`· ${key}: ya existe (${existing})`);
      continue;
    }
    process.stdout.write(`🎨 ${key}… `);
    try {
      const data = await callGemini(IMAGE_MODEL, {
        contents: [{ parts: [{ text: `${scene} ${STYLE}` }] }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } }
      });
      const rel = `assets/img/${key}.${extFor(data.mimeType)}`;
      await writeFile(path.join(ROOT, rel), Buffer.from(data.data, "base64"));
      manifest.images[key] = rel;
      await saveManifest(manifest);
      console.log(`ok → ${rel}`);
    } catch (e) {
      console.log(`falló\n   ${e.message}`);
    }
  }
}

async function generateAudio(manifest) {
  const dir = path.join(ROOT, "assets", "audio");
  await mkdir(dir, { recursive: true });
  const rel = "assets/audio/intro.wav";
  if (!force && manifest.audio.intro && (await exists(path.join(ROOT, rel)))) {
    console.log(`· intro: ya existe (${rel})`);
    return;
  }
  process.stdout.write("🗣️  narración de la cafetera… ");
  try {
    const data = await callGemini(TTS_MODEL, {
      contents: [{ parts: [{ text: INTRO_NARRATION }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } }
      }
    });
    const rate = Number(/rate=(\d+)/.exec(data.mimeType || "")?.[1] || 24000);
    const pcm = Buffer.from(data.data, "base64");
    const buf = /wav/.test(data.mimeType) ? pcm : pcmToWav(pcm, rate);
    await writeFile(path.join(ROOT, rel), buf);
    manifest.audio.intro = rel;
    await saveManifest(manifest);
    console.log(`ok → ${rel}`);
  } catch (e) {
    console.log(`falló\n   ${e.message}`);
  }
}

const manifest = await loadManifest();
manifest.images ||= {};
manifest.audio ||= {};
if (!only || only === "images") await generateImages(manifest);
if (!only || only === "audio") await generateAudio(manifest);
console.log("Listo. Recarga index.html para ver los recursos nuevos.");

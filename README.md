# ☕ El Viaje de Tito: El Retorno a la Semilla

Juego web de trivia inmersivo sobre cultura popular cubana. Tito, un cubano de 35 años en Miami,
siente que la **Neblina del Norte** le borra los recuerdos de la isla. Una vieja cafetera abre un portal
de vapor dorado y tú, su **Sangre Mambisa**, lo guías por nueve dimensiones de la memoria respondiendo
los retos de los Guardianes.

- **Escena 3D** (Three.js): fondos ilustrados con parallax, portal de vapor con shaders, Neblina volumétrica,
  partículas, fichas de dominó que brillan o se hacen añicos, Tito y los Guardianes como sprites.
- **Narración con voz y subtítulos** cinematográficos (letterbox, "toca para avanzar", *Saltar*): un narrador
  para el prólogo y el final, y **cada Guardián presenta su nivel con su propia voz**.
- **HUD de juego**: puntos, racha, fichas, progreso, temporizador de 25 s por pregunta.
- **Música**: beat de reparto (reguetón cubano) sintetizado con Web Audio, con tempo y tono por dimensión, que se
  "enfría" cuando la Neblina gana terreno. Opcional: `--only=music` genera un tema con **Lyria** que el juego usa
  en su lugar si está en el manifiesto.
- **Scoreboard con nombres únicos**: cada jugador reclama un nombre (sin distinguir mayúsculas ni acentos) y
  recibe un token; su mejor marca queda en el ranking.
- 1000 preguntas del Cubanómetro, complejidad 1–9 → de *Recuerdo Borroso* a *Cubano de Pura Cepa*.

## Jugar en local

Sin dependencias ni build:

```bash
node server/index.js          # http://localhost:8080 (sirve el juego + scoreboard compartido en server/data/)
```

También puedes abrir `index.html` directo o con cualquier servidor estático: el scoreboard pasa a modo local
(por dispositivo) automáticamente.

## Desplegar en Cloudflare (Pages + Functions + KV)

El repo ya trae el scoreboard como **Pages Functions** (`functions/api/*`) sobre un **KV namespace**.

1. **Crea el proyecto** en el dashboard: *Workers & Pages → Create → Pages → Connect to Git* → elige este repo.
   - Framework preset: *None*. Build command: *(vacío)*. Build output directory: `/` (la raíz).
2. **Crea el KV namespace**: *Storage & Databases → KV → Create namespace* → nombre `titos-scores`.
3. **Enlázalo al proyecto**: *Pages → tu proyecto → Settings → Bindings → Add → KV namespace*:
   - Variable name: `SCORES` · KV namespace: `titos-scores`. Guarda y vuelve a desplegar (*Deployments → Retry*).
4. Listo: `https://<proyecto>.pages.dev`. Comprueba `https://<proyecto>.pages.dev/api/health` → `{"ok":true}`.

Con la CLI en vez del dashboard:

```bash
npm i -g wrangler && wrangler login
cp wrangler.example.toml wrangler.toml
wrangler kv namespace create titos-scores          # copia el id en wrangler.toml → [[kv_namespaces]] id
wrangler pages project create titos-travel --production-branch main
wrangler pages deploy . --project-name titos-travel
```

> `wrangler.toml` está en `.gitignore` a propósito: si el repo lo incluye con un id de KV inválido,
> el despliegue desde el dashboard falla con *Error 8000022: Invalid KV namespace ID*.

Cada push a la rama de producción redespliega. Para un dominio propio: *Pages → Custom domains*.

## Base de preguntas

`data/cubanometro_preguntas.csv` (1000 preguntas, complejidad 1–9). Tras editar el CSV:

```bash
python3 tools/csv_to_js.py   # → js/questions.js
```

## Regenerar arte y voces (Google AI / Gemini)

Todo el arte (fondos, Tito en 6 poses, 9 Guardianes, cafetera, dominó) y las voces (narrador, Guardianes)
se generaron con la API de Gemini. Los scripts corren en tu máquina; la clave nunca llega al navegador.

```bash
export GEMINI_API_KEY=...
node tools/generate-assets.mjs                 # todo lo que falte (usa --force para regenerar)
node tools/generate-assets.mjs --only=tito     # tito | guardians | props | scenes | audio | narration | music
python3 tools/chroma_key.py                    # recorta los sprites de assets/raw/ → assets/img/ (Pillow)
python3 tools/optimize_images.py               # escenas → JPG, sprites a 800 px
python3 tools/wav_to_mp3.py                    # voces WAV → MP3 (pip install lameenc)
```

Modelos por defecto: `gemini-2.5-flash-image`, `gemini-3.1-flash-tts-preview` y `lyria-3.5` (configurables con
`GEMINI_IMAGE_MODEL`, `GEMINI_TTS_MODEL`, `GEMINI_TTS_VOICE`, `LYRIA_MODEL`). Imágenes y música requieren
facturación activa en Google AI Studio. Ojo: `gemini-3.8-flash-tts` lee en voz alta la instrucción de estilo;
los modelos *preview* 2.5 y 3.1 la obedecen sin leerla.

Duraciones de narración: intro < 1 min; cada Guardián habla 8–16 s por escena (~30–40 palabras).

### Música propia

Para usar tu propio tema en lugar del de Lyria, sustituye `assets/audio/reparto.mp3` (o cambia la ruta de
`audio.music` en `js/assets-manifest.js`). Usa solo música con derechos.

## Estructura

```
index.html              pantalla única (título, HUD, reto, subtítulos, final, scoreboard)
css/style.css           interfaz de juego
js/game.js              flujo, puntuación, temporizador, nombre único
js/scene3d.js           escena Three.js
js/subtitles.js         narración con subtítulos sincronizados
js/music.js             beat de reparto (Web Audio)
js/audio.js             efectos (clave, mar, cañonazo, tráfico…)
js/scoreboard.js        cliente del scoreboard (API o local)
js/narrative.js         historia, dimensiones, guardianes
js/questions.js         preguntas (generado)
js/assets-manifest.js   rutas de arte y voces (generado)
functions/              scoreboard para Cloudflare Pages Functions + KV
server/index.js         servidor Node equivalente para local/VPS
tools/                  generación de recursos
vendor/three.min.js     Three.js 0.158
```

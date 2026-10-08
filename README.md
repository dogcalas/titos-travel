# ☕ El Viaje de Tito: El Retorno a la Semilla

Juego web de trivia inmersivo sobre cultura popular cubana. Tito, un cubano de 35 años en Miami,
siente que la **Neblina del Norte** le borra los recuerdos de la isla. Una vieja cafetera abre un portal
de vapor dorado y tú, su **Sangre Mambisa**, lo guías por nueve dimensiones de la memoria respondiendo
los retos de los Guardianes.

## Jugar

Es HTML/CSS/JS puro, sin build ni dependencias. Abre `index.html` en el navegador o sírvelo con cualquier
servidor estático (GitHub Pages, Netlify, `python3 -m http.server`).

- **18 recuerdos** en 9 dimensiones (2 preguntas por dimensión), del nivel *Recuerdo Borroso* al *Cubano de Pura Cepa*.
- **5 fichas de dominó de nácar** como vidas: brillan al acertar, se vuelven polvo de asfalto al fallar.
- La neblina y el color del fondo responden a las fichas que quedan; el sonido (clave, tumbadoras, mar,
  cañonazo, tráfico) se sintetiza con Web Audio y no necesita archivos.
- Teclas `1`–`4` para responder, `Enter` para continuar. Las preguntas ya vistas no se repiten hasta agotar el nivel.

## Base de preguntas

`data/cubanometro_preguntas.csv` (1000 preguntas, complejidad 1–9). Tras editar el CSV, regenera el JS:

```bash
python3 tools/csv_to_js.py   # → js/questions.js
```

## Recursos con Google AI (opcional)

`tools/generate-assets.mjs` genera un fondo ilustrado por dimensión (Gemini imagen) y la narración de la
cafetera en la intro (Gemini TTS). Se ejecuta en tu máquina: la clave nunca llega al navegador.

```bash
GEMINI_API_KEY=... node tools/generate-assets.mjs            # imágenes + audio
GEMINI_API_KEY=... node tools/generate-assets.mjs --only=images
GEMINI_API_KEY=... node tools/generate-assets.mjs --force     # regenerar todo
```

Escribe en `assets/` y actualiza `js/assets-manifest.js`; el juego los usa automáticamente y, si no existen,
cae en los fondos degradados. Modelos y voz configurables con `GEMINI_IMAGE_MODEL`, `GEMINI_TTS_MODEL` y `GEMINI_TTS_VOICE`.

## Estructura

```
index.html            página única
css/style.css         estilos, neblina, fichas, animaciones
js/game.js            motor del juego
js/narrative.js       dimensiones, guardianes y textos cinemáticos
js/audio.js           sonidos sintetizados (Web Audio)
js/questions.js       preguntas generadas desde el CSV
js/assets-manifest.js rutas de imágenes/audio generados
tools/                csv_to_js.py, generate-assets.mjs
data/                 CSV original
```

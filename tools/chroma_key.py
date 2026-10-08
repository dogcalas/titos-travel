#!/usr/bin/env python3
"""Recorta los sprites generados sobre fondo liso (assets/raw/*.png) a PNG transparente en assets/img/.

El fondo se detecta como el color más frecuente y se elimina por crecimiento de región desde los bordes,
así funciona aunque el modelo no respete el verde pedido (p. ej. fondo gris) y sin tocar
colores parecidos dentro del personaje.

Uso: python3 tools/chroma_key.py [nombre ...]
Sin argumentos procesa todos los de assets/raw/. Requiere Pillow.
"""
import pathlib
import sys
from collections import deque

import warnings

from PIL import Image, ImageFilter

warnings.simplefilter("ignore", DeprecationWarning)

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"
OUT = ROOT / "assets" / "img"
MAX_H = 1024


def mode_color(im):
    """Color más frecuente (cuantizado): el fondo liso domina la imagen."""
    small = im.convert("RGB").resize((160, 160))
    counts = {}
    for c in small.getdata():
        k = (c[0] >> 3, c[1] >> 3, c[2] >> 3)
        counts[k] = counts.get(k, 0) + 1
    k = max(counts, key=counts.get)
    return (k[0] * 8 + 4, k[1] * 8 + 4, k[2] * 8 + 4)


def dist(c, bg):
    return max(abs(c[0] - bg[0]), abs(c[1] - bg[1]), abs(c[2] - bg[2]))


STEP = 6         # un píxel gris de viñeta no cambia más que esto respecto al vecino por el que se llegó
LUM_MARGIN = 12  # ... ni es más claro que el fondo (protege ropa blanca y gris claro)
GREY_SAT = 22    # saturación máxima de los grises de la viñeta
HARD = 18        # borde: distancia al fondo con la que el píxel sigue siendo fondo
SOFT = 60        # borde: distancia a partir de la cual el píxel es personaje opaco


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def hue(c):
    r, g, b = c[:3]
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn:
        return 0.0
    if mx == r:
        h = (g - b) / (mx - mn) % 6
    elif mx == g:
        h = (b - r) / (mx - mn) + 2
    else:
        h = (r - g) / (mx - mn) + 4
    return h * 60


def sat(c):
    return max(c[:3]) - min(c[:3])


def hue_diff(a, b):
    d = abs(a - b) % 360
    return min(d, 360 - d)


KEY_SAT = 45      # el fondo (incluso en sombra) es saturado; la ropa blanca con reflejo verde, no
KEY_HUE = 28      # grados de tolerancia de tono respecto al color de fondo
_key_hue = [0.0]


def greenish(c):
    """Mismo tono que el fondo y saturación alta: fondo seguro aunque esté en sombra, sin tocar el 'spill'."""
    return sat(c) >= KEY_SAT and hue_diff(hue(c), _key_hue[0]) <= KEY_HUE


def key_out(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    bg = mode_color(im)
    bg_lum = lum(bg)
    _key_hue[0] = hue(bg)
    alpha = bytearray(b"\xff" * (w * h))
    seen = bytearray(w * h)
    q = deque()

    def greyish(c):
        return max(c) - min(c) <= GREY_SAT and bg_lum - 45 <= lum(c) <= bg_lum + LUM_MARGIN

    def seed(x, y):
        c = px[x, y]
        if greenish(c) or greyish(c):
            q.append((x, y, c))

    for x in range(w):
        seed(x, 0); seed(x, h - 1)
    for y in range(h):
        seed(0, y); seed(w - 1, y)
    # Bolsas de fondo encerradas (entre brazos y cabeza): verde puro, muy saturado, en cualquier parte.
    for y in range(0, h):
        for x in range(0, w):
            c = px[x, y]
            if sat(c) >= 80 and hue_diff(hue(c), _key_hue[0]) <= 14:
                q.append((x, y, c))
    # Crecimiento de región desde el borde: atraviesa viñetas grises y degradados, se detiene en contornos nítidos.
    while q:
        x, y, prev = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        c = px[x, y]
        # Al verde se entra siempre; al gris de la viñeta solo por un degradado suave (nunca saltando desde el verde a la ropa).
        if not (greenish(c) or (greyish(c) and dist(c, prev) <= STEP)):
            continue
        seen[i] = 1
        alpha[i] = 0
        if x > 0: q.append((x - 1, y, c))
        if x < w - 1: q.append((x + 1, y, c))
        if y > 0: q.append((x, y - 1, c))
        if y < h - 1: q.append((x, y + 1, c))

    # Segunda pasada, relajada, solo desde el fondo ya aceptado: sombras de contacto verdosas y
    # restos de esquina. Solo píxeles con tinte verde/amarillento y no más claros que el fondo: la ropa blanca queda fuera.
    for i in range(w * h):
        if alpha[i] == 0:
            q.append((i % w, i // w, px[i % w, i // w]))
    while q:
        x, y, prev = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            j = ny * w + nx
            if alpha[j] == 0:
                continue
            c = px[nx, ny]
            tinted = sat(c) >= 28 and hue_diff(hue(c), _key_hue[0]) <= 40
            if tinted and dist(c, bg) <= 70 and lum(c) <= bg_lum + 4 and dist(c, prev) <= 12:
                alpha[j] = 0
                q.append((nx, ny, c))

    # Borde suave: píxeles opacos pegados al fondo reciben alfa según lo que se parezcan al fondo.
    soft = {}
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if alpha[i] != 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    j = ny * w + nx
                    if alpha[j] == 255 and j not in soft:
                        d = dist(px[nx, ny], bg)
                        soft[j] = 0 if d <= HARD else 255 if d >= SOFT else int(255 * (d - HARD) / (SOFT - HARD))
    for j, a in soft.items():
        alpha[j] = a

    # Marco exterior: restos de viñeta en las esquinas que no son personaje.
    FRAME = 14
    for y in range(h):
        for x in range(w):
            if x < FRAME or y < FRAME or x >= w - FRAME or y >= h - FRAME:
                alpha[y * w + x] = 0
    mask = Image.frombytes("L", (w, h), bytes(alpha)).filter(ImageFilter.GaussianBlur(0.4))
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            a = mp[x, y]
            if a < 6:
                px[x, y] = (0, 0, 0, 0)
            elif a < 255:
                r, g, b, _ = px[x, y]
                k = a / 255
                if k > 0.2:  # desvanece el tinte del fondo en el borde
                    r = int(min(255, max(0, (r - bg[0] * (1 - k)) / k)))
                    g = int(min(255, max(0, (g - bg[1] * (1 - k)) / k)))
                    b = int(min(255, max(0, (b - bg[2] * (1 - k)) / k)))
                px[x, y] = (r, g, b, a)
            else:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 255)
    return im


def trim(im: Image.Image) -> Image.Image:
    bbox = im.getchannel("A").getbbox()
    if bbox:
        pad = 8
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad))
        im = im.crop(bbox)
    if im.height > MAX_H:
        im = im.resize((round(im.width * MAX_H / im.height), MAX_H), Image.LANCZOS)
    return im


def main(names):
    OUT.mkdir(parents=True, exist_ok=True)
    files = [RAW / f"{n}.png" for n in names] if names else sorted(RAW.glob("*.png"))
    for f in files:
        if not f.exists():
            print(f"✗ {f.name}: no existe")
            continue
        im = trim(key_out(Image.open(f)))
        dst = OUT / f.name
        im.save(dst, optimize=True)
        transparent = im.getchannel("A").histogram()[0]
        print(f"✓ {f.name} → {dst.relative_to(ROOT)} {im.size} ({100 * transparent // (im.width * im.height)}% transparente)")


if __name__ == "__main__":
    main(sys.argv[1:])

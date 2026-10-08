#!/usr/bin/env python3
"""Reduce el peso de assets/img para la web y actualiza js/assets-manifest.js.

- Escenas (scene_*.png) → JPEG calidad 82, ancho máximo 1600.
- Sprites (resto de PNG) → alto máximo 800 px, PNG optimizado.

Uso: python3 tools/optimize_images.py
"""
import json
import pathlib
import re

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"
MANIFEST = ROOT / "js" / "assets-manifest.js"
SCENE_W = 1600
SPRITE_H = 800


def main():
    text = MANIFEST.read_text(encoding="utf-8")
    m = re.search(r"window\.ASSETS = (\{.*\});", text, re.S)
    manifest = json.loads(m.group(1)) if m else {"images": {}, "sprites": {}, "audio": {}}
    before = after = 0
    for f in sorted(IMG.glob("*.png")):
        before += f.stat().st_size
        im = Image.open(f)
        if f.name.startswith("scene_"):
            im = im.convert("RGB")
            if im.width > SCENE_W:
                im = im.resize((SCENE_W, round(im.height * SCENE_W / im.width)), Image.LANCZOS)
            dst = f.with_suffix(".jpg")
            im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
            f.unlink()
            for k, v in manifest["images"].items():
                if v == str(f.relative_to(ROOT)):
                    manifest["images"][k] = str(dst.relative_to(ROOT))
        else:
            if im.height > SPRITE_H:
                im = im.resize((round(im.width * SPRITE_H / im.height), SPRITE_H), Image.LANCZOS)
            dst = f
            im.save(dst, "PNG", optimize=True)
        after += dst.stat().st_size
        print(f"✓ {f.name} → {dst.name} ({dst.stat().st_size // 1024} KB)")
    MANIFEST.write_text(
        "// Generado por tools/generate-assets.mjs + tools/chroma_key.py. Vacío = el juego usa fondos y sonidos sintetizados.\n"
        f"window.ASSETS = {json.dumps(manifest, indent=2, ensure_ascii=False)};\n",
        encoding="utf-8",
    )
    print(f"Total: {before // 1024 // 1024} MB → {after // 1024 // 1024} MB")


if __name__ == "__main__":
    main()

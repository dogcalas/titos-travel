#!/usr/bin/env python3
"""Convierte los WAV de assets/audio/ a MP3 (mucho más ligeros) y actualiza js/assets-manifest.js.

Uso: python3 tools/wav_to_mp3.py      (pip install lameenc)
"""
import json
import pathlib
import re
import wave

import lameenc

ROOT = pathlib.Path(__file__).resolve().parent.parent
AUDIO = ROOT / "assets" / "audio"
MANIFEST = ROOT / "js" / "assets-manifest.js"


def convert(src: pathlib.Path) -> pathlib.Path:
    with wave.open(str(src), "rb") as w:
        ch, width, rate = w.getnchannels(), w.getsampwidth(), w.getframerate()
        pcm = w.readframes(w.getnframes())
    assert width == 2, f"{src.name}: se esperaba PCM 16-bit"
    enc = lameenc.Encoder()
    enc.set_bit_rate(64)
    enc.set_in_sample_rate(rate)
    enc.set_channels(ch)
    enc.set_quality(2)
    dst = src.with_suffix(".mp3")
    dst.write_bytes(enc.encode(pcm) + enc.flush())
    return dst


def main():
    text = MANIFEST.read_text(encoding="utf-8")
    m = re.search(r"window\.ASSETS = (\{.*\});", text, re.S)
    manifest = json.loads(m.group(1)) if m else {"images": {}, "sprites": {}, "audio": {}}
    for src in sorted(AUDIO.glob("*.wav")):
        dst = convert(src)
        rel = str(dst.relative_to(ROOT))
        for k, v in manifest.get("audio", {}).items():
            if v == str(src.relative_to(ROOT)):
                manifest["audio"][k] = rel
        src.unlink()
        print(f"✓ {src.name} → {dst.name} ({dst.stat().st_size // 1024} KB)")
    MANIFEST.write_text(
        "// Generado por tools/generate-assets.mjs + tools/chroma_key.py. Vacío = el juego usa fondos y sonidos sintetizados.\n"
        f"window.ASSETS = {json.dumps(manifest, indent=2, ensure_ascii=False)};\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

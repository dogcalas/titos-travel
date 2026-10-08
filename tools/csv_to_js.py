#!/usr/bin/env python3
"""Convierte data/cubanometro_preguntas.csv en js/questions.js (window.QUESTIONS).

Uso: python3 tools/csv_to_js.py
Se genera un .js (y no un .json) para que el juego funcione también abriendo
index.html directamente desde el disco, sin servidor.
"""
import csv
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "cubanometro_preguntas.csv"
DST = ROOT / "js" / "questions.js"


def main():
    rows = []
    with SRC.open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            wrong = [r[k].strip() for k in ("incorrecta_1", "incorrecta_2", "incorrecta_3")]
            q = {
                "id": int(r["id"]),
                "lvl": int(r["complejidad"]),
                "q": r["pregunta"].strip(),
                "a": r["respuesta_correcta"].strip(),
                "w": [w for w in wrong if w],
            }
            if r.get("sugerida", "").strip():
                q["by"] = r["sugerida"].strip()
            if q["q"] and q["a"] and len(q["w"]) == 3:
                rows.append(q)
    body = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    DST.write_text(
        "// Generado por tools/csv_to_js.py a partir de data/cubanometro_preguntas.csv. No editar a mano.\n"
        f"window.QUESTIONS = {body};\n",
        encoding="utf-8",
    )
    print(f"{len(rows)} preguntas -> {DST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

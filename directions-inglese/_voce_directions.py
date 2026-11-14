"""Genera le voci inglesi (ElevenLabs) per «Excuse me, where is…?».

Uso:
    python _voce_directions.py              # genera solo gli mp3 che mancano
    python _voce_directions.py --solo d1 d2 # rigenera alcune frasi
    python _voce_directions.py --tutte      # rigenera tutto

Le frasi stanno in js/frasi.js (sorgente unica per pagina e audio).
Voci della libreria ElevenLabs (piano Starter, novembre 2026):
  teacher = Alice (inglese britannico, chiara) — le parole del vocabolario
  tourist = Jessica (giovane, americana)       — chi chiede la strada
  local   = George (britannico, caldo)         — chi dà le indicazioni
La chiave sta in trading_system/config/secrets.toml → [api_keys].elevenlabs.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import requests

TS_ROOT = Path(r"G:\Bot di Trading\trading_system")
sys.path.insert(0, str(TS_ROOT))
from config.config_secret import get_elevenlabs_api_key  # noqa: E402

HERE = Path(__file__).resolve().parent
FRASI_JS = HERE / "js" / "frasi.js"
OUT_DIR = HERE / "audio"
MODEL = "eleven_multilingual_v2"
VOCI = {
    "teacher": "Xb7hH8MSUJpSbSDYk0k2",
    "tourist": "cgSgspJ2msm6clMCkdW9",
    "local": "JBFqnCBsd6RMkjVDRZzb",
}
# Un po' più lente del normale: la classe è all'inizio.
SETTINGS = {"stability": 0.55, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True, "speed": 0.88}


def leggi_frasi() -> dict[str, dict]:
    testo = FRASI_JS.read_text(encoding="utf-8")
    m = re.search(r"window\.FRASI\s*=\s*(\{.*\})\s*;", testo, flags=re.S)
    if not m:
        raise SystemExit("window.FRASI non trovato in frasi.js")
    return json.loads(m.group(1))


def genera(key: str, frase: dict, api_key: str) -> None:
    testo = frase["en"]
    if key.startswith("w_"):
        testo = testo[0].upper() + testo[1:] + "."
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOCI[frase['v']]}?output_format=mp3_44100_96",
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        json={"text": testo, "model_id": MODEL, "voice_settings": SETTINGS},
        timeout=120,
    )
    r.raise_for_status()
    (OUT_DIR / f"{key}.mp3").write_bytes(r.content)
    print(f"ok  {key:16} {len(r.content) // 1024:4d} KB  [{frase['v']}] {testo}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo", nargs="*", default=None, help="chiavi da rigenerare")
    ap.add_argument("--tutte", action="store_true")
    args = ap.parse_args()

    frasi = leggi_frasi()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    api_key = get_elevenlabs_api_key()
    if not api_key:
        raise SystemExit("chiave ElevenLabs assente")
    caratteri = 0
    for key, frase in frasi.items():
        file = OUT_DIR / f"{key}.mp3"
        voluta = args.tutte or (args.solo is not None and key in args.solo) or (args.solo is None and not file.exists())
        if voluta:
            genera(key, frase, api_key)
            caratteri += len(frase["en"])
    print(f"caratteri usati in questo giro: {caratteri}")
    orfani = [p.name for p in OUT_DIR.glob("*.mp3") if p.stem not in frasi]
    if orfani:
        print("mp3 senza frase (da cancellare?):", ", ".join(orfani))


if __name__ == "__main__":
    main()

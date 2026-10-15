"""Genera la voce del Prof (ElevenLabs) per le battute di js/battute-prof.js.

Uso:
    python _voce_prof.py              # genera solo gli mp3 che mancano
    python _voce_prof.py --solo vieni # rigenera una battuta
    python _voce_prof.py --tutte      # rigenera tutto

Voce: «Prof Meucci 3 AM», creata con la Voice Design di ElevenLabs il 2026-10-15
(professore siciliano sui settant'anni, bonario, un po' roco e teatrale).
La chiave sta in trading_system/config/secrets.toml → [api_keys].elevenlabs.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import requests

TS_ROOT = Path(r"G:\Bot di Trading\trading_system")
sys.path.insert(0, str(TS_ROOT))
from config.config_secret import get_elevenlabs_api_key  # noqa: E402

HERE = Path(__file__).resolve().parent
BATTUTE_JS = HERE / "js" / "battute-prof.js"
OUT_DIR = HERE / "audio" / "prof"
VOICE_ID = "Vmg0cd6vuPb1EC1tqzN9"
MODEL = "eleven_multilingual_v2"
SETTINGS = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True}


def leggi_battute() -> dict[str, str]:
    testo = BATTUTE_JS.read_text(encoding="utf-8")
    return dict(re.findall(r"^\s*(\w+):\s*'((?:[^'\\]|\\.)*)'", testo, flags=re.M))


def genera(key: str, testo: str, api_key: str) -> None:
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_96",
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        json={"text": testo, "model_id": MODEL, "voice_settings": SETTINGS, "language_code": "it"},
        timeout=120,
    )
    r.raise_for_status()
    (OUT_DIR / f"{key}.mp3").write_bytes(r.content)
    print(f"ok  {key:16} {len(r.content) // 1024:4d} KB  {testo}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo", nargs="*", default=None, help="chiavi da rigenerare")
    ap.add_argument("--tutte", action="store_true")
    args = ap.parse_args()

    battute = leggi_battute()
    if not battute:
        raise SystemExit("nessuna battuta trovata in battute-prof.js")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    api_key = get_elevenlabs_api_key()
    if not api_key:
        raise SystemExit("chiave ElevenLabs assente")

    for key, testo in battute.items():
        file = OUT_DIR / f"{key}.mp3"
        voluta = args.tutte or (args.solo is not None and key in args.solo) or (args.solo is None and not file.exists())
        if voluta:
            genera(key, testo, api_key)
    orfani = [p.name for p in OUT_DIR.glob("*.mp3") if p.stem not in battute]
    if orfani:
        print("mp3 senza battuta (da cancellare?):", ", ".join(orfani))


if __name__ == "__main__":
    main()

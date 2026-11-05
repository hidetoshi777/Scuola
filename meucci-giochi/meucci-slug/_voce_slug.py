"""Genera le voci di Meucci Slug con ElevenLabs (annunciatore arcade + Prof. Bella).

Uso:
    python _voce_slug.py              # genera solo gli mp3 che mancano
    python _voce_slug.py --solo heavy # rigenera una battuta
    python _voce_slug.py --tutte      # rigenera tutto

Le chiavi delle battute devono coincidere con quelle di slug-audio.js (VOCI).
La chiave API sta in trading_system/config/secrets.toml -> [api_keys].elevenlabs.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import requests

TS_ROOT = Path(r"G:\Bot di Trading\trading_system")
sys.path.insert(0, str(TS_ROOT))
from config.config_secret import get_elevenlabs_api_key  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT_DIR = HERE / "assets" / "voce"
MODEL = "eleven_multilingual_v2"

# Annunciatore da sala giochi: voce italiana intensa, recitata sopra le righe
ANNUNCIATORE = ("W71zT1VwIFFx3mMGH2uZ", {"stability": 0.3, "similarity_boost": 0.8, "style": 0.65, "use_speaker_boost": True})
# Il Prof: «Prof Meucci 3 AM» (Voice Design 2026-10-15), siciliano sui settant'anni, bonario e teatrale
PROF = ("Vmg0cd6vuPb1EC1tqzN9", {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True})

BATTUTE = {
    # annunciatore
    "start1": (ANNUNCIATORE, "Missione uno! Il Meucci!"),
    "start2": (ANNUNCIATORE, "Missione due! Catania!"),
    "heavy": (ANNUNCIATORE, "Heavy Concorso!"),
    "shotgun": (ANNUNCIATORE, "Shotgun Ferie!"),
    "rocket": (ANNUNCIATORE, "Ricorso respinto!"),
    "laser": (ANNUNCIATORE, "Laser del Tester!"),
    "moke": (ANNUNCIATORE, "Moke Slug!"),
    "bomb": (ANNUNCIATORE, "Decreti di esclusione!"),
    "cedolino": (ANNUNCIATORE, "Stipendio accreditato!"),
    "boss1": (ANNUNCIATORE, "Attenzione! Fotocopiatrice inceppata!"),
    "boss2": (ANNUNCIATORE, "Attenzione! L'Algoritmo delle nomine!"),
    "complete1": (ANNUNCIATORE, "Missione compiuta!"),
    "complete2": (ANNUNCIATORE, "Missione compiuta! Il ruolo è salvo!"),
    "gameover": (ANNUNCIATORE, "Game over! Graduatoria persa!"),
    # il Prof
    "prof_start1": (PROF, "Picciotti, io sono di ruolo. Fatemi passare!"),
    "prof_start2": (PROF, "Andiamo all'Ufficio Scolastico. Speriamo che sia martedì."),
    "prof_moke": (PROF, "Saliamo sulla Moke, che a piedi non ci arrivo."),
    "prof_coffee": (PROF, "Ah, un caffè. Ora sì che ragiono."),
    "prof_arancino": (PROF, "Un arancino caldo. Questa è vera tranquillità."),
    "prof_hit1": (PROF, "Ahi! Il mio punteggio!"),
    "prof_hit2": (PROF, "Ma che modi sono?"),
    "prof_hit3": (PROF, "Piano, ragazzi, piano!"),
    "prof_win1": (PROF, "Aula tre A emme. Ma la nomina dov'è?"),
    "prof_win2": (PROF, "Nomina firmata. Ora mi prendo un caffè."),
}


def genera(key: str, voce: tuple[str, dict], testo: str, api_key: str) -> None:
    voice_id, settings = voce
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_96",
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        json={"text": testo, "model_id": MODEL, "voice_settings": settings, "language_code": "it"},
        timeout=120,
    )
    r.raise_for_status()
    (OUT_DIR / f"{key}.mp3").write_bytes(r.content)
    print(f"ok  {key:14} {len(r.content) // 1024:4d} KB  {testo}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo", nargs="*", default=None, help="chiavi da rigenerare")
    ap.add_argument("--tutte", action="store_true")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    api_key = get_elevenlabs_api_key()
    if not api_key:
        raise SystemExit("chiave ElevenLabs assente")

    for key, (voce, testo) in BATTUTE.items():
        file = OUT_DIR / f"{key}.mp3"
        voluta = args.tutte or (args.solo is not None and key in args.solo) or (args.solo is None and not file.exists())
        if voluta:
            genera(key, voce, testo, api_key)
    orfani = [p.name for p in OUT_DIR.glob("*.mp3") if p.stem not in BATTUTE]
    if orfani:
        print("mp3 senza battuta (da cancellare?):", ", ".join(orfani))


if __name__ == "__main__":
    main()

"""Genera gli MP3 dalle sole battute già presenti nel gioco (pip install edge-tts)."""
import asyncio
import hashlib
import json
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent
VOICE = "it-IT-DiegoNeural"
RATE = "-5%"


def battute():
    source = (ROOT / "js/gioco-elettrico.js").read_text(encoding="utf-8")
    texts = re.findall(r"who:\s*'Prof',\s*text:\s*'([^']+)'", source)
    objectives = source.split("const OBJECTIVES = {", 1)[1].split("const STEP_ORDER", 1)[0]
    texts += re.findall(r"\[STEPS\.\w+\]:\s*'([^']+)'", objectives)
    texts.append("Segui l’obiettivo in alto.")
    return list(dict.fromkeys(texts))


async def main():
    folder = ROOT / "audio"
    folder.mkdir(exist_ok=True)
    lines = []
    for text in battute():
        file = "prof-" + hashlib.sha256(text.encode()).hexdigest()[:12] + ".mp3"
        # Pronuncia le sigle senza cambiare il testo visibile nel gioco.
        spoken = text.replace("3 AM", "terza A M").replace("premi E", "premi il tasto E")
        path = folder / file
        if not path.exists():
            pending = path.with_suffix(".part")
            await edge_tts.Communicate(spoken, VOICE, rate=RATE).save(str(pending))
            if pending.stat().st_size < 1000:
                raise RuntimeError(f"Audio vuoto: {file}")
            pending.replace(path)
        lines.append({"text": text, "spoken": spoken, "file": file})
        print(file, path.stat().st_size, flush=True)
    manifest = {"voice": VOICE, "rate": RATE, "lines": lines}
    (ROOT / "js/battute-prof.js").write_text(
        "// Generato da _genera_voce_prof.py: testo originale e pronuncia.\n"
        + "export const VOCE_PROF = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Creati {len(lines)} dialoghi del Prof.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())

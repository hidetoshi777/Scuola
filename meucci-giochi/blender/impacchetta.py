"""
Impacchetta i fotogrammi resi da veicoli.py in un'unica immagine WebP per veicolo e scrive
js/veicoli-sprite.js con le coordinate di ogni fotogramma.

    python impacchetta.py <cartella fotogrammi>

La cartella contiene una sottocartella per veicolo (moke/, auto_rossa/, ...) con 000.png, 001.png, ...
e un file ancora.txt: «x y px_per_m» del pixel dove cade l'origine del veicolo, poi gli angoli e
(facoltativo) il numero di pose del passo: il fotogramma k è l'angolo k // pose nella posa k % pose.
Ogni fotogramma viene ritagliato sul contenuto (ombra compresa): l'ancora si sposta di conseguenza.
I veicoli già presenti in js/veicoli-sprite.js e assenti dalla cartella restano com'erano, così si può
rigenerare un solo giro senza rifare gli altri.
"""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
USCITA_IMG = QUI.parent / "img" / "veicoli"
USCITA_JS = QUI.parent / "js" / "veicoli-sprite.js"
LARGHEZZA_FOGLIO = 2048


SOGLIA_OMBRA = 16   # il cielo schermato dal veicolo lascia un velo debole su tutto il fotogramma


def ritaglia(im):
    # toglie il velo lontano e riscala il resto, così l'ombra non finisce con uno scalino
    im.putalpha(im.getchannel("A").point(lambda a: max(0, round((a - SOGLIA_OMBRA) * 255 / (255 - SOGLIA_OMBRA)))))
    box = im.getchannel("A").getbbox()
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0 - 1), max(0, y0 - 1)
    x1, y1 = min(im.width, x1 + 1), min(im.height, y1 + 1)
    return im.crop((x0, y0, x1, y1)), (x0, y0)


def impacchetta(cartella):
    righe = (cartella / "ancora.txt").read_text(encoding="utf-8").split("\n")
    ax, ay, pxm = (float(x) for x in righe[0].split())
    angoli = [float(x) for x in righe[1].split()]
    pose = int(righe[2]) if len(righe) > 2 and righe[2].strip() else 1
    pezzi = []
    for k in range(len(angoli) * pose):
        im = Image.open(cartella / f"{k:03d}.png").convert("RGBA")
        pezzo, (x0, y0) = ritaglia(im)
        pezzi.append((pezzo, ax - x0, ay - y0))
    # scaffali: righe di fotogrammi affiancati, alte quanto il più alto della riga
    pos, x, y, alto = [], 0, 0, 0
    for pezzo, _, _ in pezzi:
        if x + pezzo.width > LARGHEZZA_FOGLIO:
            x, y, alto = 0, y + alto, 0
        pos.append((x, y))
        x += pezzo.width
        alto = max(alto, pezzo.height)
    foglio = Image.new("RGBA", (max(px + p.width for (px, _), (p, _, _) in zip(pos, pezzi)), y + alto), (0, 0, 0, 0))
    fotogrammi = []
    for (px, py), (pezzo, ox, oy) in zip(pos, pezzi):
        foglio.paste(pezzo, (px, py))
        fotogrammi.append([px, py, pezzo.width, pezzo.height, round(ox, 2), round(oy, 2)])
    nome = cartella.name.replace("_", "-")
    USCITA_IMG.mkdir(parents=True, exist_ok=True)
    file = USCITA_IMG / f"{nome}.webp"
    foglio.save(file, "WEBP", quality=86, alpha_quality=90, method=6)
    print(f"{nome}: {len(pezzi)} fotogrammi, foglio {foglio.width}×{foglio.height}, {file.stat().st_size / 1024:.0f} KB")
    versione = hashlib.sha1(file.read_bytes()).hexdigest()[:8]   # cambia a ogni rigenerazione: niente cache vecchie
    dati = {"img": f"img/veicoli/{nome}.webp?v={versione}", "pxm": pxm, "angoli": [round(a, 5) for a in angoli], "fotogrammi": fotogrammi}
    if pose > 1:
        dati["pose"] = pose
    return nome, dati


def main():
    radice = Path(sys.argv[1])
    dati = {}
    if USCITA_JS.exists():
        testo = USCITA_JS.read_text(encoding="utf-8")
        dati = json.loads(testo[testo.index("{"):testo.rindex("}") + 1])
    dati.update(impacchetta(c) for c in sorted(radice.iterdir()) if (c / "ancora.txt").exists())
    USCITA_JS.write_text(
        "/* Generato da blender/impacchetta.py: non modificare a mano.\n"
        " * Per ogni veicolo: foglio WebP, pixel dell'immagine ortografica per metro, angoli resi e,\n"
        " * per fotogramma, [x, y, larghezza, altezza, ancoraX, ancoraY] (l'ancora è l'origine a terra).\n"
        " * Con «pose» (chi cammina) il fotogramma k è l'angolo k // pose nella posa k % pose. */\n"
        "window.VEICOLI_SPRITE = " + json.dumps(dati, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print("scritto", USCITA_JS)


if __name__ == "__main__":
    main()

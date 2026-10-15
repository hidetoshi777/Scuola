"""
Porta i render di scena.py nel gioco: WebP ritagliati in img/ e js/scena-dati.js con camera e ritagli.

    python impacchetta.py <cartella dei render>

Tutti i PNG hanno la stessa inquadratura (1920×1200): lo sfondo resta intero, primo piano e pose
dell'ubriaco si ritagliano sul contenuto e si ricorda dove stavano (x, y del ritaglio nel fotogramma).
"""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image

QUI = Path(__file__).resolve().parent
IMG = QUI.parent / "img"
JS = QUI.parent / "js" / "scena-dati.js"


def salva(im, nome, qualita=84):
    IMG.mkdir(exist_ok=True)
    file = IMG / f"{nome}.webp"
    im.save(file, "WEBP", quality=qualita, alpha_quality=92, method=6)
    versione = hashlib.sha1(file.read_bytes()).hexdigest()[:8]
    print(f"{nome}: {im.width}×{im.height}, {file.stat().st_size / 1024:.0f} KB")
    return f"img/{nome}.webp?v={versione}"


def ritaglio(im):
    box = im.getchannel("A").point(lambda a: 255 if a > 2 else 0).getbbox()
    return im.crop(box), box[0], box[1]


def main():
    cartella = Path(sys.argv[1])
    camera = json.loads((cartella / "camera.json").read_text(encoding="utf-8"))
    dati = {"camera": camera, "strati": {}}
    sfondo = Image.open(cartella / "sfondo.png").convert("RGBA")
    dati["strati"]["sfondo"] = {"img": salva(sfondo, "sfondo", 80), "x": 0, "y": 0, "w": sfondo.width, "h": sfondo.height}
    for file in sorted(cartella.glob("*.png")):
        if file.stem == "sfondo":
            continue
        pezzo, x, y = ritaglio(Image.open(file).convert("RGBA"))
        dati["strati"][file.stem] = {"img": salva(pezzo, file.stem), "x": x, "y": y, "w": pezzo.width, "h": pezzo.height}
    JS.parent.mkdir(exist_ok=True)
    JS.write_text(
        "/* Generato da blender/impacchetta.py: non modificare a mano.\n"
        " * camera: per proiettare i punti del mondo (metri) sui pixel dello sfondo; strati: ritagli dei render. */\n"
        "window.SCENA = " + json.dumps(dati, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print("scritto", JS)


if __name__ == "__main__":
    main()

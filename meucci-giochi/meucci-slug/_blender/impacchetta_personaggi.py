"""Impacchetta i fotogrammi di personaggi.py nei fogli sprite del gioco (../assets).

    python impacchetta_personaggi.py <cartella dei render>

precari-3d.png  4×3 celle da 128 px (rese a 256 e rimpicciolite)
moke-3d.png     4 celle da 320×192 (il gioco le disegna a 148×88)
boss-3d.png     2 celle da 440×340 (il gioco le disegna a 220×170)
"""
import os
import sys
from PIL import Image

src = sys.argv[1]
dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")


def foglio(nomi, cella, colonne, out, riduci=None):
    righe = (len(nomi) + colonne - 1) // colonne
    w, h = cella
    f = Image.new("RGBA", (w * colonne, h * righe))
    for i, n in enumerate(nomi):
        im = Image.open(os.path.join(src, n + ".png")).convert("RGBA")
        if riduci:
            im = im.resize((w, h), Image.LANCZOS)
        f.alpha_composite(im, ((i % colonne) * w, (i // colonne) * h))
    p = os.path.join(dest, out)
    f.save(p, optimize=True)
    print(out, f.size, os.path.getsize(p) // 1024, "KB")


foglio([f"precari_{t}_{k}" for t in ("corridore", "cecchino", "avvocato") for k in range(4)], (128, 128), 4, "precari-3d.png", riduci=True)
foglio([f"moke_{k}" for k in range(4)], (320, 192), 4, "moke-3d.png")
foglio([f"boss_{k}" for k in range(2)], (440, 340), 2, "boss-3d.png")

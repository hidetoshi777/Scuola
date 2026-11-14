"""Dopo _blender_citta.py: converte i render PNG (file che iniziano con _) in formati leggeri per il web."""
from pathlib import Path

from PIL import Image

IMG = Path(__file__).resolve().parent / "img"

mappa = IMG / "_citta.png"
if mappa.exists():
    Image.open(mappa).convert("RGB").save(IMG / "citta.jpg", quality=84, optimize=True, progressive=True)
for f in (IMG / "posti").glob("_*.png"):
    im = Image.open(f).convert("RGBA").resize((240, 240), Image.LANCZOS)
    im.save(f.with_name(f.stem[1:] + ".webp"), quality=88, method=6)
for d in "NSEW":
    f = IMG / f"_omino-{d}.png"
    if f.exists():
        Image.open(f).convert("RGBA").resize((160, 160), Image.LANCZOS).save(IMG / f"omino-{d}.webp", quality=90, method=6)
for f in (IMG / "veicoli").glob("_*.png"):
    Image.open(f).convert("RGBA").save(f.with_name(f.stem[1:] + ".webp"), quality=88, method=6)
tot = sum(p.stat().st_size for p in list(IMG.glob("citta.jpg")) + list(IMG.glob("omino-*.webp")) + list((IMG / "posti").glob("*.webp")) + list((IMG / "veicoli").glob("*.webp")))
print("ok, peso totale", round(tot / 1024), "KB")

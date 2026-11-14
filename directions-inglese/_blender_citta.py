"""Greenford in 3D: costruisce la città del gioco in Blender e fa i render.

Lancio (Blender in background, render su GPU):
  "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b -P _blender_citta.py -- [--anteprima] [--solo mappa|posti|omino]

Uscite:
  img/citta.jpg            la mappa (sfondo del gioco)
  img/posti/<id>.png       un edificio alla volta, sfondo trasparente (icone di Studio/Home/Lab)
  img/omino-<N|E|S|W>.png  l'omino nelle 4 direzioni
  js/citta-proiezione.js   come si passa dalle coordinate della pianta (px) al disegno

Le coordinate sono le stesse di js/citta.js (pianta 700×800 px, 100 px = 1 m di Blender).
"""
import bmesh
import bpy
import json
import math
import os
import sys
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

ARGV = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ANTEPRIMA = "--anteprima" in ARGV
SOLO = ARGV[ARGV.index("--solo") + 1] if "--solo" in ARGV else "tutto"
HERE = os.path.dirname(os.path.abspath(__file__))

# ---- pianta (uguale a js/citta.js) ----
import re as _re
_PIANTA = json.loads(_re.search(r"window\.PIANTA\s*=\s*(\{.*\})\s*;",
                                open(os.path.join(HERE, "js", "pianta.js"), encoding="utf-8").read(), _re.S).group(1))
X, Y, S = _PIANTA["X"], _PIANTA["Y"], tuple(_PIANTA["S"])
COL, RIG = _PIANTA["COL"], _PIANTA["RIG"]
ISOLATI = {tuple(int(v) for v in k.split(",")): ids for k, ids in _PIANTA["isolati"].items()}
SEMAFORI = [tuple(j) for j in _PIANTA["semafori"]]
POSTI = [pid for ids in ISOLATI.values() for pid in ids]
STRADA = 0.46
TILT = math.radians(45)   # inclinazione della camera dalla verticale


def W(px, py):
    return px / 100.0, -py / 100.0


# ---------------------------------------------------------------- scena
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    bpy.data.collections.remove(c)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    try:
        prefs.compute_device_type = "OPTIX"
    except TypeError:
        prefs.compute_device_type = "CUDA"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type in ("OPTIX", "CUDA")
except Exception as e:  # noqa: BLE001
    print("GPU prefs:", e)
scene.cycles.device = "GPU"
scene.cycles.samples = 24 if ANTEPRIMA else 160
scene.cycles.use_denoising = True
try:
    scene.cycles.denoiser = "OPTIX"
except TypeError:
    pass
scene.view_settings.view_transform = "Standard"
scene.view_settings.exposure = 0.0
print("DEVICE", scene.cycles.device, bpy.context.preferences.addons["cycles"].preferences.compute_device_type)

world = bpy.data.worlds.new("cielo")
scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.78, 0.88, 1.0, 1)
bg.inputs[1].default_value = 0.85

sole = bpy.data.objects.new("sole", bpy.data.lights.new("sole", "SUN"))
sole.data.energy = 3.2
sole.data.angle = math.radians(4)
sole.rotation_euler = (math.radians(42), 0, math.radians(28))
scene.collection.objects.link(sole)

# ---------------------------------------------------------------- materiali
_MAT = {}


def M(nome, rgb, rough=0.55, emit=0.0, metal=0.0):
    k = (nome, rgb, rough, emit, metal)
    if k in _MAT:
        return _MAT[k]
    m = bpy.data.materials.new(nome)
    try:
        m.use_nodes = True
    except Exception:  # noqa: BLE001
        pass
    p = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    p.inputs["Base Color"].default_value = (*rgb, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if emit:
        p.inputs["Emission Color"].default_value = (*rgb, 1)
        p.inputs["Emission Strength"].default_value = emit
    m.diffuse_color = (*rgb, 1)
    _MAT[k] = m
    return m


def hexc(h):
    h = h.lstrip("#")
    v = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c ** 2.2 for c in v)  # sRGB -> lineare


C = {k: M(k, hexc(v), r) for k, v, r in [
    ("prato", "#6aa84f", 0.9), ("prato2", "#5d9e45", 0.9), ("asfalto", "#4a4f57", 0.85), ("marciapiede", "#d9d4c7", 0.8),
    ("cordolo", "#bfb9ab", 0.8), ("bianco", "#f6f6f2", 0.5), ("giallo", "#ffcc29", 0.45), ("vetro", "#9fd8f5", 0.15),
    ("legno", "#8a5a33", 0.7), ("tronco", "#7a5232", 0.8), ("chioma", "#3fa34d", 0.7), ("chioma2", "#5cbf4a", 0.7),
    ("grigio", "#8d939b", 0.6), ("scuro", "#2f3339", 0.6), ("rosso", "#e03a2f", 0.45), ("blu", "#2e6fd8", 0.45),
    ("verde", "#1fa055", 0.45), ("arancio", "#f08c1a", 0.5), ("mattone", "#c8553d", 0.75), ("tetto_grigio", "#5d6670", 0.6),
    ("pietra", "#e8dcc3", 0.7), ("tetto_rosso", "#b34a2c", 0.6), ("oro", "#f2c230", 0.3), ("viola", "#5b2d82", 0.5),
    ("crema", "#f5ead2", 0.6), ("menta", "#dff3e6", 0.6), ("azzurro", "#6c8fd1", 0.5), ("pelle", "#f1c27d", 0.6),
    ("acqua", "#58b6e8", 0.1), ("terra", "#c9a46a", 0.9), ("rosa", "#f4a6b8", 0.5), ("marrone", "#6b4226", 0.6),
    ("panna", "#fff4e0", 0.5), ("grigio_chiaro", "#c9cdd2", 0.6), ("cielo_vetro", "#bfe6ff", 0.1),
]}
LUCE = M("luce", hexc("#fff3b0"), 0.3, emit=4.0)
LUCE_ROSSA = M("luce_rossa", hexc("#ff3b30"), 0.3, emit=6.0)
LUCE_GIALLA = M("luce_gialla", hexc("#ffcc00"), 0.3, emit=2.0)
LUCE_VERDE = M("luce_verde", hexc("#34c759"), 0.3, emit=6.0)
NEON_VERDE = M("neon_verde", hexc("#22c55e"), 0.3, emit=3.0)
LUCE_BLU = M("luce_blu", hexc("#3b82f6"), 0.3, emit=5.0)

# ---------------------------------------------------------------- forme
CUR = scene.collection


def _link(o):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    CUR.objects.link(o)
    return o


def _fin(o, mat, bev, liscio=False):
    if mat is not None:
        o.data.materials.append(mat)
    if bev:
        m = o.modifiers.new("bev", "BEVEL")
        m.width = bev
        m.segments = 2
        m.limit_method = "ANGLE"
    if liscio:
        for p in o.data.polygons:
            p.use_smooth = True
    return _link(o)


def box(cx, cy, z0, sx, sy, sz, mat, bev=0.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, z0 + sz / 2))
    o = bpy.context.active_object
    for v in o.data.vertices:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    return _fin(o, mat, min(bev, sx / 3, sy / 3, sz / 3) if bev else 0)


def cil(cx, cy, z0, r, h, mat, n=24, asse="z"):
    if asse == "z":
        bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=h, location=(cx, cy, z0 + h / 2))
    else:  # asse x: z0 è il centro
        bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=h, location=(cx, cy, z0),
                                            rotation=(0, math.pi / 2, 0) if asse == "x" else (math.pi / 2, 0, 0))
    return _fin(bpy.context.active_object, mat, 0, liscio=True)


def sfera(cx, cy, cz, r, mat, sx=1, sy=1, sz=1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=r, location=(cx, cy, cz))
    o = bpy.context.active_object
    for v in o.data.vertices:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    return _fin(o, mat, 0, liscio=True)


def cono(cx, cy, z0, r, h, mat, n=4, r2=0.0, rot=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=n, radius1=r, radius2=r2, depth=h, location=(cx, cy, z0 + h / 2),
                                    rotation=(0, 0, rot))
    return _fin(bpy.context.active_object, mat, 0)


def mesh(verts, facce, mat, nome="mesh"):
    me = bpy.data.meshes.new(nome)
    me.from_pydata(verts, [], facce)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(nome, me)
    CUR.objects.link(o)
    if mat:
        me.materials.append(mat)
    return o


def tetto(cx, cy, z0, sx, sy, h, mat, asse="x", sp=0.05):
    sx += 2 * sp
    sy += 2 * sp
    if asse == "x":
        v = [(-sx / 2, -sy / 2, 0), (sx / 2, -sy / 2, 0), (sx / 2, sy / 2, 0), (-sx / 2, sy / 2, 0), (-sx / 2, 0, h), (sx / 2, 0, h)]
        f = [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)]
    else:
        v = [(-sx / 2, -sy / 2, 0), (sx / 2, -sy / 2, 0), (sx / 2, sy / 2, 0), (-sx / 2, sy / 2, 0), (0, -sy / 2, h), (0, sy / 2, h)]
        f = [(0, 1, 4), (2, 3, 5), (1, 2, 5, 4), (3, 0, 4, 5), (0, 3, 2, 1)]
    o = mesh([(a + cx, b + cy, c + z0) for a, b, c in v], f, mat, "tetto")
    return o


def testo(corpo, cx, cy, z, size, mat, prof=0.02, rotx=90, rotz=0):
    cu = bpy.data.curves.new("t", "FONT")
    cu.body = corpo
    cu.size = size
    cu.extrude = prof
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    o = bpy.data.objects.new("t", cu)
    o.location = (cx, cy, z)
    o.rotation_euler = (math.radians(rotx), 0, math.radians(rotz))
    cu.materials.append(mat)
    CUR.objects.link(o)
    return o


def stella(cx, cy, cz, r, mat, prof=0.02):
    v = []
    for k in range(10):
        a = math.pi / 2 + k * math.pi / 5
        rr = r if k % 2 == 0 else r * 0.45
        v.append((cx + rr * math.cos(a), cy, cz + rr * math.sin(a)))
    n = len(v)
    vv = [(x, y - prof, z) for x, y, z in v] + [(x, y, z) for x, y, z in v]
    f = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    return mesh(vv, f, mat, "stella")


def croce(cx, cy, cz, l, s, mat, prof=0.03):
    box(cx, cy, cz - l / 2, s, prof, l, mat, 0.004)
    box(cx, cy, cz - s / 2, l, prof, s, mat, 0.004)


def finestre(x0, x1, yf, zs, h, w, mat=None, telaio=True, n=None):
    """Una fila di finestre sulla facciata sud (yf = y della facciata)."""
    mat = mat or C["vetro"]
    n = n or max(1, int((x1 - x0) / (w * 1.9)))
    passo = (x1 - x0) / n
    for i in range(n):
        x = x0 + passo * (i + 0.5)
        for z in zs:
            if telaio:
                box(x, yf - 0.006, z - 0.012, w + 0.03, 0.012, h + 0.03, C["bianco"], 0.003)
            box(x, yf - 0.014, z, w, 0.012, h, mat, 0.002)


def albero(x, y, r=0.16, h=0.16, mat=None):
    cil(x, y, 0, 0.028, h + 0.02, C["tronco"], 10)
    sfera(x, y, h + r * 0.8, r, mat or C["chioma"], 1, 1, 1.05)
    sfera(x - r * 0.35, y - r * 0.3, h + r * 1.05, r * 0.55, C["chioma2"])


def lampione(x, y):
    cil(x, y, 0.03, 0.012, 0.36, C["scuro"], 8)
    box(x, y, 0.38, 0.06, 0.06, 0.03, C["scuro"], 0.005)
    sfera(x, y, 0.375, 0.022, LUCE)


def panchina(x, y, rot=False):
    if rot:
        box(x, y, 0.06, 0.05, 0.16, 0.02, C["legno"], 0.004)
        box(x + 0.025, y, 0.08, 0.012, 0.16, 0.05, C["legno"], 0.004)
    else:
        box(x, y, 0.06, 0.16, 0.05, 0.02, C["legno"], 0.004)
        box(x, y + 0.025, 0.08, 0.16, 0.012, 0.05, C["legno"], 0.004)
    box(x, y, 0.03, 0.04 if not rot else 0.03, 0.03 if not rot else 0.04, 0.03, C["scuro"], 0.003)


def auto(x, y, colore, asse="x", lung=0.36):
    lw = 0.17
    if asse == "x":
        box(x, y, 0.045, lung, lw, 0.08, colore, 0.025)
        box(x - 0.02, y, 0.115, lung * 0.55, lw * 0.92, 0.07, C["cielo_vetro"], 0.02)
        box(x - 0.02, y, 0.18, lung * 0.5, lw * 0.9, 0.012, colore, 0.006)
        for dx in (-lung * 0.32, lung * 0.32):
            for dy in (-lw / 2, lw / 2):
                cil(x + dx, y + dy, 0.045, 0.042, 0.03, C["scuro"], 14, asse="y")
    else:
        box(x, y, 0.045, lw, lung, 0.08, colore, 0.025)
        box(x, y - 0.02, 0.115, lw * 0.92, lung * 0.55, 0.07, C["cielo_vetro"], 0.02)
        box(x, y - 0.02, 0.18, lw * 0.9, lung * 0.5, 0.012, colore, 0.006)
        for dy in (-lung * 0.32, lung * 0.32):
            for dx in (-lw / 2, lw / 2):
                cil(x + dx, y + dy, 0.045, 0.042, 0.03, C["scuro"], 14, asse="x")


# ---------------------------------------------------------------- strade e lotti
def nuova_collezione(nome):
    c = bpy.data.collections.new(nome)
    scene.collection.children.link(c)
    return c


CUR = nuova_collezione("terreno")
box(3.5, -4.1, -0.05, 9.0, 10.0, 0.05, C["prato"], 0)

# strade
for x in X:
    a, b = W(x, Y[0])[1], W(x, Y[2])[1]
    box(x / 100, (a + b) / 2, 0, STRADA, abs(a - b) + STRADA, 0.012, C["asfalto"], 0)
for y in Y:
    box((X[0] + X[2]) / 200, -y / 100, 0, (X[2] - X[0]) / 100 + STRADA, STRADA, 0.012, C["asfalto"], 0)
box(S[0] / 100, -(Y[2] + 712) / 200, 0, STRADA, (712 - Y[2]) / 100, 0.012, C["asfalto"], 0)
# piazzale della stazione
box(S[0] / 100, -7.36, 0, 2.6, 0.56, 0.012, C["marciapiede"], 0)

# mezzeria tratteggiata
for x in X:
    for k in range(2):
        y0, y1 = Y[k] + 34, Y[k + 1] - 34
        n = 6
        for i in range(n):
            yy = y0 + (y1 - y0) * (i + 0.5) / n
            box(x / 100, -yy / 100, 0.012, 0.025, 0.12, 0.003, C["bianco"], 0)
for y in Y:
    for k in range(2):
        x0, x1 = X[k] + 34, X[k + 1] - 34
        n = 6
        for i in range(n):
            xx = x0 + (x1 - x0) * (i + 0.5) / n
            box(xx / 100, -y / 100, 0.012, 0.12, 0.025, 0.003, C["bianco"], 0)

# strisce pedonali: sui quattro lati del semaforo, sotto la stazione e all'incrocio sopra
def zebra(cx, cy, verso):
    for k in range(6):
        off = (k - 2.5) * 0.072
        if verso == "x":   # strisce che attraversano una strada verticale
            box(cx + off, cy, 0.012, 0.04, 0.16, 0.003, C["bianco"], 0)
        else:
            box(cx, cy + off, 0.012, 0.16, 0.04, 0.003, C["bianco"], 0)


for (jx, jy) in SEMAFORI:
    cx, cy = X[jx] / 100, -Y[jy] / 100
    zebra(cx, cy + 0.36, "x")
    zebra(cx, cy - 0.36, "x")
    zebra(cx + 0.36, cy, "y")
    zebra(cx - 0.36, cy, "y")
zebra(S[0] / 100, -6.3, "x")

# lotti: marciapiede + prato
LOTTI = {}
for c in range(4):
    for r in range(4):
        angolo = c in (0, 3) and r in (0, 3)
        x0, x1 = COL[c]
        y0, y1 = RIG[r]
        cx, cy = (x0 + x1) / 200, -(y0 + y1) / 200
        lw, ld = (x1 - x0) / 100 + 0.06, (y1 - y0) / 100 + 0.06
        if not angolo:
            box(cx, cy, 0, lw, ld, 0.03, C["marciapiede"], 0.01)
            box(cx, cy, 0.03, lw - 0.1, ld - 0.1, 0.006, C["prato2"], 0)
        LOTTI[(c, r)] = (cx, cy, lw - 0.1, ld - 0.1)

# semafori ai quattro angoli dell'incrocio centrale
def semaforo(x, y, guarda="y"):
    cil(x, y, 0.03, 0.013, 0.42, C["scuro"], 10)
    box(x, y, 0.36, 0.07, 0.06, 0.18, C["scuro"], 0.01)
    for k, m in enumerate([LUCE_ROSSA, M("off_g", hexc("#5c4a00"), 0.4), LUCE_VERDE]):
        sfera(x, y - 0.031, 0.51 - k * 0.055, 0.019, m)


for (si, sj) in SEMAFORI:
    jx, jy = X[si] / 100, -Y[sj] / 100
    for dx, dy in [(-0.3, -0.3), (0.3, -0.3), (-0.3, 0.3), (0.3, 0.3)]:
        semaforo(jx + dx, jy + dy)

# angoli: casette, alberi
def casetta(x, y, colore, tetto_c):
    box(x, y, 0.03, 0.34, 0.28, 0.24, colore)
    tetto(x, y, 0.27, 0.34, 0.28, 0.15, tetto_c, "x")
    box(x, y - 0.142, 0.03, 0.07, 0.01, 0.12, C["legno"], 0.003)
    finestre(x - 0.15, x - 0.05, y - 0.14, [0.14], 0.06, 0.06, n=1)
    finestre(x + 0.05, x + 0.15, y - 0.14, [0.14], 0.06, 0.06, n=1)


casetta(0.48, -0.55, M("c1", hexc("#ffd8a8")), C["tetto_rosso"])
# isolato vuoto a est fra High Street e King Street: due casette
casetta(6.3, -4.05, M("c4", hexc("#ffe066")), C["tetto_grigio"])
casetta(6.55, -4.75, M("c5", hexc("#b2f2bb")), C["tetto_rosso"])
albero(6.85, -4.2, 0.11)
# parcheggio a destra della stazione (isolato 2,3)
_pcx, _pcy = (COL[2][0] + COL[2][1]) / 200, -(RIG[3][0] + RIG[3][1]) / 200
box(_pcx, _pcy, 0.036, (COL[2][1] - COL[2][0]) / 100 - 0.2, (RIG[3][1] - RIG[3][0]) / 100 - 0.24, 0.004, C["asfalto"], 0)
for _k in range(7):
    box(_pcx - 0.84 + _k * 0.28, _pcy + 0.1, 0.04, 0.02, 0.4, 0.002, C["bianco"], 0)
auto(_pcx - 0.56, _pcy + 0.1, M("auto_p1", hexc("#9b5de5"), 0.35), asse="y")
auto(_pcx + 0.28, _pcy + 0.1, M("auto_p2", hexc("#f15bb5"), 0.35), asse="y")
albero(0.18, -0.25, 0.14)
albero(1.05, -0.95, 0.12)
casetta(6.45, -0.6, M("c2", hexc("#a5d8ff")), C["tetto_grigio"])
albero(6.85, -0.25, 0.13)
casetta(0.5, -6.45, M("c3", hexc("#ffc9c9")), C["tetto_rosso"])
albero(1.0, -7.1, 0.15)
albero(0.3, -7.5, 0.12)
albero(6.4, -6.35, 0.15)
albero(6.85, -6.9, 0.12)
# fermata del bus vicino all'angolo
box(6.15, -7.15, 0.0, 0.5, 0.18, 0.012, C["marciapiede"], 0)
box(6.15, -7.2, 0.012, 0.4, 0.02, 0.2, C["cielo_vetro"], 0.004)
box(6.15, -7.15, 0.21, 0.44, 0.14, 0.02, C["scuro"], 0.004)
cil(6.42, -7.08, 0.0, 0.01, 0.34, C["grigio"], 8)
cil(6.42, -7.1, 0.34, 0.05, 0.012, C["rosso"], 20, asse="y")

# lampioni lungo le strade
for (lx, ly) in [(X[0] / 100 - 0.3, -2.3), (X[0] / 100 - 0.3, -4.6), (X[1] / 100 + 0.3, -2.0), (X[2] / 100 + 0.3, -2.6),
                 (X[2] / 100 + 0.3, -4.6), (2.25, -Y[0] / 100 + 0.3), (4.5, -Y[0] / 100 + 0.3), (X[1] / 100 + 0.3, -6.2)]:
    lampione(lx, ly)

# macchine parcheggiate a bordo strada
# le macchine sulle strade e il treno NON sono nello sfondo: sono sprite che si muovono (--solo veicoli)
AUTO_COLORI = {"rossa": "#e8483b", "blu": "#3b82f6", "gialla": "#f2c230", "bianca": "#f1f3f5"}

# ---------------------------------------------------------------- stazione e binari
CUR = nuova_collezione("posto_station")
sx0, sy0 = S[0] / 100, -7.62
box(sx0, sy0, 0.0, 1.6, 0.42, 0.34, C["crema"])
tetto(sx0, sy0, 0.34, 1.6, 0.42, 0.14, C["tetto_grigio"], "x")
box(sx0, sy0 - 0.05, 0.0, 0.48, 0.4, 0.5, C["crema"])
tetto(sx0, sy0 - 0.05, 0.5, 0.48, 0.4, 0.16, C["tetto_rosso"], "y")
cil(sx0, sy0 - 0.26, 0.48, 0.075, 0.02, C["bianco"], 28, asse="y")
box(sx0, sy0 - 0.272, 0.48, 0.01, 0.006, 0.06, C["scuro"], 0)
box(sx0 + 0.018, sy0 - 0.272, 0.45, 0.04, 0.006, 0.01, C["scuro"], 0)
box(sx0, sy0 - 0.255, 0.0, 0.18, 0.02, 0.26, C["cielo_vetro"], 0.01)
finestre(sx0 - 0.75, sx0 - 0.3, sy0 - 0.21, [0.16], 0.1, 0.08, n=3)
finestre(sx0 + 0.3, sx0 + 0.75, sy0 - 0.21, [0.16], 0.1, 0.08, n=3)
# binari e treno dietro (a sud, in basso nel disegno): fanno parte del terreno, non dell'icona
CUR = bpy.data.collections["terreno"]
for dy in (-0.035, 0.035):
    box(3.5, -7.98 + dy, 0.0, 9.0, 0.012, 0.012, C["grigio"], 0)
for i in range(40):
    box(-1 + i * 0.24, -7.98, -0.004, 0.04, 0.14, 0.008, C["legno"], 0)
def treno(x0, y0):
    """Locomotiva rossa davanti (verso est) e due carrozze blu; x0 = centro del treno."""
    for k, dx in enumerate([0.53, 0.0, -0.53]):
        colr = C["rosso"] if k == 0 else C["blu"]
        box(x0 + dx, y0, 0.02, 0.5, 0.17, 0.2, colr, 0.03)
        finestre(x0 + dx - 0.2, x0 + dx + 0.2, y0 - 0.085, [0.12], 0.06, 0.06, n=3, telaio=False)
        for wx in (-0.17, 0.17):
            for wy in (-0.08, 0.08):
                cil(x0 + dx + wx, y0 + wy, 0.035, 0.03, 0.02, C["scuro"], 12, asse="y")
    box(x0 + 0.8, y0, 0.02, 0.05, 0.15, 0.12, C["scuro"], 0.01)
    sfera(x0 + 0.83, y0, 0.12, 0.022, LUCE)

# ---------------------------------------------------------------- i dodici posti
def facciata(cx, cy, lw, ld, bw, bd, avanti=0.1):
    """Centro dell'edificio messo nella parte SUD del lotto (davanti)."""
    yf = cy - ld / 2 + avanti
    return cx, yf + bd / 2, yf


def p_school(cx, cy, lw, ld):
    bw, bd = 1.12, 0.5
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.3)
    box(bx, by, 0.03, bw, bd, 0.5, C["mattone"])
    tetto(bx, by, 0.53, bw, bd, 0.16, C["tetto_grigio"], "x")
    # corpo centrale con frontone e orologio
    box(bx, by - 0.04, 0.03, 0.36, bd + 0.08, 0.62, C["mattone"])
    tetto(bx, by - 0.04, 0.65, 0.36, bd + 0.08, 0.17, C["tetto_grigio"], "y")
    cil(bx, yf - 0.085, 0.55, 0.07, 0.02, C["bianco"], 28, asse="y")
    box(bx, yf - 0.097, 0.55, 0.008, 0.006, 0.05, C["scuro"], 0)
    box(bx + 0.016, yf - 0.097, 0.53, 0.035, 0.006, 0.008, C["scuro"], 0)
    # campanella sul tetto
    box(bx, by + 0.05, 0.8, 0.12, 0.12, 0.1, C["bianco"])
    cono(bx, by + 0.05, 0.9, 0.11, 0.1, C["tetto_grigio"], 4, rot=math.pi / 4)
    finestre(bx - bw / 2 + 0.05, bx - 0.22, yf, [0.14, 0.34], 0.1, 0.09, n=3)
    finestre(bx + 0.22, bx + bw / 2 - 0.05, yf, [0.14, 0.34], 0.1, 0.09, n=3)
    box(bx, yf - 0.09, 0.03, 0.14, 0.02, 0.2, C["legno"], 0.004)
    box(bx, yf - 0.13, 0.03, 0.26, 0.1, 0.025, C["grigio_chiaro"], 0.004)
    # pennone con bandiera
    cil(bx - 0.62, yf - 0.05, 0.03, 0.008, 0.72, C["grigio_chiaro"], 8)
    box(bx - 0.56, yf - 0.05, 0.62, 0.12, 0.008, 0.08, C["blu"], 0.002)
    # lo scuolabus giallo davanti
    sbx, sby = bx + 0.25, yf - 0.24
    box(sbx, sby, 0.05, 0.62, 0.17, 0.17, C["giallo"], 0.03)
    box(sbx - 0.27, sby, 0.05, 0.1, 0.165, 0.11, C["giallo"], 0.02)
    finestre(sbx - 0.24, sbx + 0.28, sby - 0.086, [0.15], 0.06, 0.06, telaio=False, n=5)
    box(sbx, sby - 0.087, 0.1, 0.6, 0.004, 0.012, C["scuro"], 0)
    for dx in (-0.2, 0.2):
        for dy in (-0.085, 0.085):
            cil(sbx + dx, sby + dy, 0.05, 0.045, 0.03, C["scuro"], 14, asse="y")
    sfera(sbx - 0.322, sby - 0.06, 0.1, 0.015, LUCE)
    sfera(sbx - 0.322, sby + 0.06, 0.1, 0.015, LUCE)
    # scivolo e altalena
    box(bx - 0.48, by + 0.4, 0.04, 0.04, 0.3, 0.012, C["rosso"], 0.004)
    albero(cx + lw / 2 - 0.1, by + 0.35, 0.12)


def p_park(cx, cy, lw, ld):
    box(cx, cy, 0.036, 0.16, ld - 0.02, 0.004, C["terra"], 0)
    box(cx, cy, 0.036, lw - 0.02, 0.16, 0.004, C["terra"], 0)
    cil(cx, cy, 0.036, 0.22, 0.05, C["grigio_chiaro"], 32)
    cil(cx, cy, 0.05, 0.19, 0.04, C["acqua"], 32)
    cil(cx, cy, 0.05, 0.04, 0.16, C["grigio_chiaro"], 16)
    sfera(cx, cy, 0.22, 0.05, C["acqua"])
    for (dx, dy, r) in [(-0.5, 0.28, 0.17), (0.48, 0.3, 0.19), (-0.52, -0.25, 0.14), (0.52, -0.28, 0.15), (-0.2, 0.42, 0.12), (0.22, 0.43, 0.13)]:
        albero(cx + dx, cy + dy, r, 0.14 + r * 0.4)
    panchina(cx - 0.32, cy - 0.12)
    panchina(cx + 0.32, cy - 0.12)
    for (dx, dy, m) in [(-0.25, -0.38, C["rosa"]), (0.28, -0.4, C["giallo"]), (-0.6, 0.0, C["rosso"]), (0.62, 0.02, C["rosa"])]:
        for k in range(5):
            sfera(cx + dx + (k - 2) * 0.035, cy + dy + (k % 2) * 0.03, 0.06, 0.022, m)


def p_hospital(cx, cy, lw, ld):
    bw, bd = 0.98, 0.48
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.34)
    box(bx, by, 0.03, bw, bd, 0.56, C["bianco"])
    box(bx, by, 0.59, bw + 0.03, bd + 0.03, 0.035, C["grigio_chiaro"])
    finestre(bx - bw / 2 + 0.05, bx - 0.18, yf, [0.1, 0.3], 0.11, 0.09, n=2)
    finestre(bx + 0.18, bx + bw / 2 - 0.05, yf, [0.1, 0.3], 0.11, 0.09, n=2)
    # grande croce rossa sulla facciata, su pannello bianco
    box(bx, yf - 0.03, 0.3, 0.3, 0.03, 0.26, C["bianco"], 0.012)
    croce(bx, yf - 0.05, 0.43, 0.22, 0.075, C["rosso"])
    box(bx, yf - 0.02, 0.03, 0.22, 0.02, 0.17, C["cielo_vetro"], 0.003)
    box(bx, yf - 0.1, 0.2, 0.36, 0.18, 0.02, C["rosso"], 0.005)
    # ambulanza
    ax, ay = bx + 0.1, yf - 0.34
    box(ax, ay, 0.05, 0.42, 0.18, 0.2, C["bianco"], 0.03)
    box(ax - 0.25, ay, 0.05, 0.1, 0.17, 0.13, C["bianco"], 0.02)
    box(ax, ay - 0.092, 0.12, 0.4, 0.004, 0.035, C["rosso"], 0)
    croce(ax + 0.06, ay - 0.095, 0.2, 0.08, 0.025, C["rosso"], 0.006)
    box(ax - 0.12, ay, 0.25, 0.06, 0.05, 0.03, LUCE_BLU, 0.006)
    for dx in (-0.14, 0.14):
        for dy in (-0.09, 0.09):
            cil(ax + dx, ay + dy, 0.05, 0.045, 0.03, C["scuro"], 14, asse="y")


def p_church(cx, cy, lw, ld):
    bw, bd = 0.56, 0.6
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.32)
    bx -= 0.2
    box(bx, by, 0.03, bw, bd, 0.32, C["pietra"])
    tetto(bx, by, 0.35, bw, bd, 0.2, C["tetto_rosso"], "y")
    cil(bx, yf - 0.012, 0.27, 0.06, 0.02, C["azzurro"], 24, asse="y")
    cil(bx, yf - 0.02, 0.27, 0.035, 0.02, C["oro"], 24, asse="y")
    box(bx, yf - 0.012, 0.03, 0.13, 0.02, 0.15, C["marrone"], 0.006)
    cil(bx, yf - 0.012, 0.18, 0.065, 0.02, C["marrone"], 20, asse="y")
    finestre(bx - 0.26, bx - 0.16, yf, [0.12], 0.13, 0.045, mat=C["azzurro"], n=1)
    finestre(bx + 0.16, bx + 0.26, yf, [0.12], 0.13, 0.045, mat=C["azzurro"], n=1)
    # campanile con cuspide e croce, davanti
    tx, ty = bx + 0.45, yf + 0.13
    box(tx, ty, 0.03, 0.26, 0.26, 0.62, C["pietra"])
    box(tx, ty - 0.132, 0.44, 0.13, 0.01, 0.13, C["scuro"], 0.003)
    sfera(tx, ty - 0.11, 0.48, 0.04, C["oro"])
    box(tx, ty, 0.65, 0.3, 0.3, 0.03, C["pietra"])
    cono(tx, ty, 0.68, 0.19, 0.3, C["tetto_rosso"], 4, rot=math.pi / 4)
    box(tx, ty, 0.98, 0.022, 0.022, 0.16, C["oro"], 0.004)
    box(tx, ty, 1.06, 0.1, 0.022, 0.022, C["oro"], 0.004)
    box(tx, ty - 0.132, 0.2, 0.05, 0.01, 0.12, C["azzurro"], 0.003)
    albero(cx - lw / 2 + 0.12, cy + ld / 2 - 0.15, 0.11)


def p_bank(cx, cy, lw, ld):
    bw, bd = 1.08, 0.52
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.36)
    for k in range(3):
        box(bx, yf - 0.06 - k * 0.035, 0.03 + k * 0.022, bw + 0.08 - k * 0.04, 0.2 - k * 0.04, 0.022, C["grigio_chiaro"], 0.004)
    box(bx, by, 0.09, bw, bd, 0.38, C["crema"])
    for i in range(6):
        cil(bx - bw / 2 + 0.08 + i * (bw - 0.16) / 5, yf - 0.06, 0.1, 0.032, 0.31, C["bianco"], 16)
    box(bx, by - 0.03, 0.41, bw + 0.08, bd + 0.06, 0.05, C["bianco"])
    tetto(bx, yf + 0.02, 0.46, bw + 0.04, 0.18, 0.14, C["bianco"], "x", sp=0.01)
    box(bx, by + 0.06, 0.46, bw, bd - 0.14, 0.06, C["crema"])
    box(bx, yf - 0.012, 0.09, 0.16, 0.02, 0.22, C["marrone"], 0.005)
    # grande moneta d'oro con l'euro, davanti al frontone
    cil(bx, yf - 0.14, 0.5, 0.12, 0.035, C["oro"], 36, asse="y")
    testo("€", bx, yf - 0.16, 0.5, 0.18, C["marrone"], 0.012)
    box(bx + 0.42, yf - 0.01, 0.1, 0.12, 0.03, 0.17, C["scuro"], 0.006)
    box(bx + 0.42, yf - 0.028, 0.2, 0.08, 0.005, 0.05, LUCE_VERDE, 0.002)


def p_cinema(cx, cy, lw, ld):
    bw, bd = 0.98, 0.5
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.34)
    box(bx, by, 0.03, bw, bd, 0.5, C["viola"])
    box(bx, by, 0.53, bw + 0.03, bd + 0.03, 0.035, C["scuro"])
    box(bx, yf - 0.06, 0.3, bw - 0.08, 0.12, 0.15, C["scuro"], 0.01)
    for i in range(14):
        sfera(bx - bw / 2 + 0.08 + i * (bw - 0.16) / 13, yf - 0.125, 0.44, 0.014, LUCE)
        sfera(bx - bw / 2 + 0.08 + i * (bw - 0.16) / 13, yf - 0.125, 0.31, 0.014, LUCE)
    for k, m in enumerate([C["rosso"], C["blu"], C["verde"]]):
        box(bx - 0.25 + k * 0.25, yf - 0.125, 0.33, 0.18, 0.006, 0.09, m, 0.003)
    # pellicola sulla facciata, sopra l'insegna
    for dx in (-0.13, 0.13):
        cil(bx + dx, yf - 0.03, 0.62, 0.1, 0.035, C["scuro"], 32, asse="y")
        for a in range(5):
            ang = a * 2 * math.pi / 5
            cil(bx + dx + 0.055 * math.cos(ang), yf - 0.05, 0.62 + 0.055 * math.sin(ang), 0.02, 0.01, C["grigio_chiaro"], 12, asse="y")
    box(bx, yf - 0.012, 0.03, 0.36, 0.02, 0.22, C["cielo_vetro"], 0.004)
    box(bx, yf - 0.2, 0.031, 0.26, 0.38, 0.004, C["rosso"], 0)
    for dx in (-0.2, 0.2):
        cil(bx + dx, yf - 0.32, 0.03, 0.012, 0.1, C["oro"], 8)


def p_postoffice(cx, cy, lw, ld):
    bw, bd = 0.98, 0.5
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.34)
    box(bx, by, 0.03, bw, bd, 0.42, C["panna"])
    tetto(bx, by, 0.45, bw, bd, 0.15, C["tetto_rosso"], "x")
    box(bx, yf - 0.02, 0.31, bw - 0.04, 0.03, 0.1, C["rosso"], 0.008)
    box(bx, yf - 0.045, 0.21, 0.32, 0.02, 0.19, C["bianco"], 0.006)
    mesh([(bx - 0.15, yf - 0.058, 0.39), (bx + 0.15, yf - 0.058, 0.39), (bx, yf - 0.058, 0.29),
          (bx - 0.15, yf - 0.062, 0.39), (bx + 0.15, yf - 0.062, 0.39), (bx, yf - 0.062, 0.29)],
         [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)], C["rosso"], "busta")
    box(bx, yf - 0.012, 0.03, 0.15, 0.02, 0.17, C["marrone"], 0.005)
    finestre(bx - bw / 2 + 0.06, bx - 0.2, yf, [0.1], 0.12, 0.1, n=2)
    finestre(bx + 0.2, bx + bw / 2 - 0.06, yf, [0.1], 0.12, 0.1, n=2)
    px, py = bx + 0.3, yf - 0.22
    cil(px, py, 0.03, 0.07, 0.3, C["rosso"], 24)
    sfera(px, py, 0.33, 0.07, C["rosso"], 1, 1, 0.5)
    box(px, py - 0.068, 0.24, 0.07, 0.01, 0.015, C["scuro"], 0)
    cil(px, py, 0.03, 0.085, 0.03, C["scuro"], 24)


def p_supermarket(cx, cy, lw, ld):
    bw, bd = 1.2, 0.5
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.42)
    box(bx, by, 0.03, bw, bd, 0.36, C["bianco"])
    box(bx, by, 0.39, bw + 0.02, bd + 0.02, 0.045, C["arancio"])
    box(bx, yf - 0.01, 0.05, bw - 0.1, 0.02, 0.2, C["cielo_vetro"], 0.004)
    for i in range(7):
        box(bx - bw / 2 + 0.08 + i * (bw - 0.16) / 6, yf - 0.02, 0.05, 0.015, 0.02, 0.2, C["grigio_chiaro"], 0)
    for i in range(12):
        m = C["arancio"] if i % 2 == 0 else C["bianco"]
        x = bx - bw / 2 + 0.05 + (i + 0.5) * (bw - 0.1) / 12
        mesh([(x - 0.05, yf, 0.3), (x + 0.05, yf, 0.3), (x + 0.05, yf - 0.15, 0.25), (x - 0.05, yf - 0.15, 0.25)],
             [(0, 1, 2, 3)], m, "tenda")
    # insegna col carrello, sulla facciata sopra la tenda
    sx_, sz_ = bx, 0.43
    box(sx_, yf - 0.02, 0.31, 0.44, 0.03, 0.18, C["arancio"], 0.015)
    for (x1, z1, x2, z2) in [(-0.14, 0.1, -0.09, 0.1), (-0.09, 0.1, -0.055, 0.0), (-0.055, 0.0, 0.1, 0.0),
                             (0.1, 0.0, 0.13, 0.07), (0.13, 0.07, -0.075, 0.07)]:
        dx, dz = x2 - x1, z2 - z1
        lun = math.hypot(dx, dz)
        o = box(sx_ + (x1 + x2) / 2, yf - 0.04, sz_ + (z1 + z2) / 2 - 0.01 - 0.06, lun + 0.02, 0.01, 0.02, C["bianco"], 0.003)
        o.rotation_euler = (0, -math.atan2(dz, dx), 0)
    cil(sx_ - 0.035, yf - 0.04, sz_ - 0.1, 0.018, 0.01, C["bianco"], 16, asse="y")
    cil(sx_ + 0.085, yf - 0.04, sz_ - 0.1, 0.018, 0.01, C["bianco"], 16, asse="y")
    for k in range(3):
        x = bx - 0.48 + k * 0.1
        box(x, yf - 0.28, 0.08, 0.08, 0.12, 0.07, C["grigio"], 0.004)
    for k, m in enumerate([C["rosso"], C["arancio"], C["verde"], C["giallo"]]):
        x = bx + 0.15 + k * 0.1
        box(x, yf - 0.24, 0.03, 0.09, 0.09, 0.05, C["legno"], 0.004)
        for j in range(3):
            sfera(x - 0.025 + j * 0.025, yf - 0.24, 0.085, 0.018, m)


def p_pharmacy(cx, cy, lw, ld):
    bw, bd = 1.0, 0.5
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.36)
    box(bx, by, 0.03, bw, bd, 0.42, C["menta"])
    box(bx, by, 0.45, bw + 0.03, bd + 0.03, 0.035, C["verde"])
    box(bx, yf - 0.012, 0.03, 0.2, 0.02, 0.2, C["cielo_vetro"], 0.004)
    finestre(bx - bw / 2 + 0.06, bx - 0.16, yf, [0.07], 0.18, 0.13, n=2)
    finestre(bx + 0.16, bx + bw / 2 - 0.06, yf, [0.07], 0.18, 0.13, n=2)
    # grande croce verde luminosa sulla facciata e a bandiera
    box(bx, yf - 0.03, 0.24, 0.3, 0.04, 0.26, C["bianco"], 0.015)
    croce(bx, yf - 0.06, 0.37, 0.24, 0.085, NEON_VERDE, 0.03)
    box(bx + bw / 2 + 0.01, yf - 0.16, 0.24, 0.025, 0.14, 0.14, C["bianco"], 0.006)
    croce(bx + bw / 2 - 0.004, yf - 0.16, 0.31, 0.1, 0.035, NEON_VERDE, 0.01)
    box(bx + bw / 2 + 0.01, yf - 0.06, 0.3, 0.012, 0.08, 0.012, C["grigio"], 0)


def p_restaurant(cx, cy, lw, ld):
    bw, bd = 0.98, 0.48
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.42)
    box(bx, by, 0.03, bw, bd, 0.4, M("rist", hexc("#f3d9b1")))
    tetto(bx, by, 0.43, bw, bd, 0.14, C["tetto_rosso"], "x")
    box(bx, yf - 0.012, 0.03, 0.16, 0.02, 0.2, C["marrone"], 0.005)
    finestre(bx - bw / 2 + 0.06, bx - 0.12, yf, [0.08], 0.15, 0.12, n=2)
    finestre(bx + 0.12, bx + bw / 2 - 0.06, yf, [0.08], 0.15, 0.12, n=2)
    for i in range(10):
        m = C["rosso"] if i % 2 == 0 else C["bianco"]
        x = bx - bw / 2 + 0.04 + (i + 0.5) * (bw - 0.08) / 10
        mesh([(x - 0.046, yf, 0.28), (x + 0.046, yf, 0.28), (x + 0.046, yf - 0.15, 0.23), (x - 0.046, yf - 0.15, 0.23)],
             [(0, 1, 2, 3)], m, "tenda")
    # piatto con forchetta e coltello sull'insegna
    box(bx, yf - 0.02, 0.31, 0.42, 0.02, 0.1, C["scuro"], 0.008)
    cil(bx, yf - 0.035, 0.36, 0.04, 0.008, C["bianco"], 24, asse="y")
    box(bx - 0.08, yf - 0.035, 0.36, 0.01, 0.008, 0.07, C["grigio_chiaro"], 0)
    box(bx + 0.08, yf - 0.035, 0.36, 0.01, 0.008, 0.07, C["grigio_chiaro"], 0)
    for k, x in enumerate([bx - 0.28, bx + 0.28]):
        y = yf - 0.27
        cil(x, y, 0.03, 0.06, 0.012, C["bianco"], 20)
        cil(x, y, 0.03, 0.008, 0.11, C["grigio"], 6)
        cil(x, y, 0.13, 0.08, 0.01, C["bianco"], 20)
        cil(x, y, 0.13, 0.006, 0.18, C["grigio"], 6)
        cono(x, y, 0.28, 0.15, 0.06, C["rosso"] if k == 0 else C["verde"], 16)
        for d in (-0.1, 0.1):
            box(x + d, y, 0.03, 0.05, 0.05, 0.07, C["legno"], 0.004)
    cil(bx - bw / 2 + 0.06, yf - 0.06, 0.5, 0.045, 0.05, C["bianco"], 16)
    sfera(bx - bw / 2 + 0.06, yf - 0.06, 0.57, 0.058, C["bianco"])


def p_cafe(cx, cy, lw, ld):
    bw, bd = 0.92, 0.38
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.16)
    bx -= 0.15
    box(bx, by, 0.03, bw, bd, 0.32, M("cafe_m", hexc("#e9cfa9")))
    box(bx, by, 0.35, bw + 0.02, bd + 0.02, 0.035, C["marrone"])
    box(bx, yf - 0.012, 0.03, 0.15, 0.02, 0.2, C["marrone"], 0.005)
    finestre(bx - bw / 2 + 0.06, bx - 0.12, yf, [0.07], 0.15, 0.13, n=2)
    finestre(bx + 0.12, bx + bw / 2 - 0.06, yf, [0.07], 0.15, 0.13, n=2)
    mesh([(bx - bw / 2, yf, 0.27), (bx + bw / 2, yf, 0.27), (bx + bw / 2, yf - 0.14, 0.22), (bx - bw / 2, yf - 0.14, 0.22)],
         [(0, 1, 2, 3)], C["marrone"], "tenda")
    # tazzina gigante sul tetto, verso il davanti
    tx, ty = bx, yf + 0.12
    cil(tx, ty, 0.385, 0.16, 0.018, C["bianco"], 32)
    cil(tx, ty, 0.4, 0.1, 0.16, C["bianco"], 32)
    cil(tx, ty, 0.555, 0.09, 0.008, C["marrone"], 32)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.055, minor_radius=0.016, location=(tx + 0.115, ty, 0.48), rotation=(math.pi / 2, 0, 0))
    _fin(bpy.context.active_object, C["bianco"], 0, liscio=True)
    for k in range(3):
        sfera(tx - 0.04 + k * 0.04, ty, 0.62 + (k % 2) * 0.04, 0.02, M("vapore", hexc("#ffffff"), 0.9))
    for x in (bx - 0.25, bx + 0.25, cx + lw / 2 - 0.2):
        y = yf - 0.22
        cil(x, y, 0.03, 0.006, 0.1, C["scuro"], 6)
        cil(x, y, 0.13, 0.06, 0.01, C["bianco"], 18)
        cil(x, y, 0.14, 0.012, 0.02, C["bianco"], 10)
        for d in (-0.08, 0.08):
            box(x + d, y, 0.03, 0.04, 0.04, 0.07, C["scuro"], 0.004)


def p_hotel(cx, cy, lw, ld):
    bw, bd = 0.8, 0.36
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.16)
    bx += 0.12
    box(bx, by, 0.03, bw, bd, 0.56, C["azzurro"])
    box(bx, by, 0.59, bw + 0.03, bd + 0.03, 0.035, C["scuro"])
    for z in (0.26, 0.4):
        finestre(bx - bw / 2 + 0.05, bx + bw / 2 - 0.05, yf, [z], 0.09, 0.09, mat=M("fin_calda", hexc("#ffe8a3"), 0.3, emit=0.6), n=4)
    box(bx, yf - 0.1, 0.21, 0.42, 0.2, 0.022, C["oro"], 0.006)
    for dx in (-0.18, 0.18):
        cil(bx + dx, yf - 0.18, 0.03, 0.01, 0.18, C["oro"], 8)
    box(bx, yf - 0.012, 0.03, 0.2, 0.02, 0.17, C["cielo_vetro"], 0.004)
    box(bx, yf - 0.15, 0.031, 0.12, 0.3, 0.004, C["rosso"], 0)
    # tre stelle d'oro sull'insegna in alto sulla facciata
    box(bx, yf - 0.02, 0.5, 0.5, 0.03, 0.14, C["scuro"], 0.01)
    for k in range(3):
        stella(bx - 0.14 + k * 0.14, yf - 0.04, 0.57, 0.05, C["oro"])
    albero(bx - bw / 2 - 0.16, yf + 0.05, 0.11)


def p_library(cx, cy, lw, ld):
    bw, bd = 0.9, 0.5
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.36)
    box(bx, by, 0.03, bw, bd, 0.42, M("bib", hexc("#e7d8c4")))
    box(bx, by, 0.45, bw + 0.03, bd + 0.03, 0.04, M("viola_scuro", hexc("#6741d9"), 0.5))
    box(bx, yf - 0.05, 0.03, 0.36, 0.1, 0.03, C["grigio_chiaro"], 0.005)
    box(bx, yf - 0.012, 0.06, 0.14, 0.02, 0.2, C["marrone"], 0.005)
    for dx in (-0.12, 0.12):
        cil(bx + dx, yf - 0.06, 0.06, 0.025, 0.24, C["bianco"], 14)
    finestre(bx - bw / 2 + 0.05, bx - 0.2, yf, [0.12], 0.14, 0.08, n=1)
    finestre(bx + 0.2, bx + bw / 2 - 0.05, yf, [0.12], 0.14, 0.08, n=1)
    # libro aperto gigante sulla facciata
    box(bx, yf - 0.02, 0.3, 0.42, 0.03, 0.14, M("viola_scuro", hexc("#6741d9"), 0.5), 0.01)
    for s in (-1, 1):
        o = box(bx + s * 0.075, yf - 0.05, 0.31, 0.15, 0.012, 0.11, C["bianco"], 0.003)
        o.rotation_euler = (0, 0, s * 0.35)
        for k in range(3):
            box(bx + s * 0.075, yf - 0.06, 0.34 + k * 0.022, 0.1, 0.004, 0.006, C["grigio"], 0)
    # pila di libri colorati davanti
    for k, m in enumerate([C["rosso"], C["blu"], C["giallo"], C["verde"]]):
        box(bx + 0.33, yf - 0.16, 0.03 + k * 0.035, 0.14 - k * 0.012, 0.1, 0.03, m, 0.004)


def p_bakery(cx, cy, lw, ld):
    bw, bd = 0.9, 0.48
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.36)
    box(bx, by, 0.03, bw, bd, 0.4, M("forno", hexc("#fff0c2")))
    tetto(bx, by, 0.43, bw, bd, 0.14, C["tetto_rosso"], "x")
    box(bx, yf - 0.012, 0.03, 0.15, 0.02, 0.2, C["marrone"], 0.005)
    finestre(bx - bw / 2 + 0.05, bx - 0.12, yf, [0.07], 0.15, 0.14, n=1)
    finestre(bx + 0.12, bx + bw / 2 - 0.05, yf, [0.07], 0.15, 0.14, n=1)
    for i in range(9):
        m = C["giallo"] if i % 2 == 0 else C["bianco"]
        x = bx - bw / 2 + 0.04 + (i + 0.5) * (bw - 0.08) / 9
        mesh([(x - 0.046, yf, 0.28), (x + 0.046, yf, 0.28), (x + 0.046, yf - 0.14, 0.23), (x - 0.046, yf - 0.14, 0.23)],
             [(0, 1, 2, 3)], m, "tenda")
    # pagnotta e cornetto giganti sull'insegna
    box(bx, yf - 0.02, 0.31, 0.46, 0.03, 0.12, C["marrone"], 0.01)
    sfera(bx - 0.08, yf - 0.06, 0.375, 0.09, M("pane", hexc("#d08a3c"), 0.6), 1.0, 0.6, 0.55)
    for k in range(3):
        box(bx - 0.13 + k * 0.05, yf - 0.115, 0.39, 0.012, 0.006, 0.05, M("taglio", hexc("#f6e7c8"), 0.6), 0)
    for k, (dx, r) in enumerate([(0.06, 0.035), (0.11, 0.045), (0.16, 0.035)]):
        sfera(bx + dx, yf - 0.06, 0.37, r, M("cornetto", hexc("#e0a04a"), 0.5), 1, 0.7, 0.8)
    # vetrina col pane
    for k in range(4):
        sfera(bx - 0.3 + k * 0.05, yf - 0.03, 0.12, 0.022, M("pane", hexc("#d08a3c"), 0.6), 1.3, 0.8, 0.8)


def p_police(cx, cy, lw, ld):
    bw, bd = 0.9, 0.5
    bx, by, yf = facciata(cx, cy, lw, ld, bw, bd, 0.36)
    box(bx, by, 0.03, bw, bd, 0.46, M("pol", hexc("#d0dcf0")))
    box(bx, by, 0.49, bw + 0.03, bd + 0.03, 0.04, M("blu_pol", hexc("#1c3f8f"), 0.5))
    box(bx, yf - 0.02, 0.33, bw - 0.04, 0.03, 0.1, M("blu_pol", hexc("#1c3f8f"), 0.5), 0.008)
    # distintivo (stella d'oro) e lampada blu
    cil(bx, yf - 0.04, 0.38, 0.075, 0.02, M("blu_pol", hexc("#1c3f8f"), 0.5), 24, asse="y")
    stella(bx, yf - 0.055, 0.38, 0.06, C["oro"])
    box(bx, by - 0.1, 0.53, 0.05, 0.05, 0.06, C["scuro"], 0.005)
    sfera(bx, by - 0.1, 0.62, 0.045, LUCE_BLU)
    box(bx, yf - 0.012, 0.03, 0.15, 0.02, 0.2, M("blu_pol", hexc("#1c3f8f"), 0.5), 0.005)
    finestre(bx - bw / 2 + 0.05, bx - 0.12, yf, [0.1], 0.13, 0.08, n=1)
    finestre(bx + 0.12, bx + bw / 2 - 0.05, yf, [0.1], 0.13, 0.08, n=1)
    # macchina della polizia
    ax, ay = bx, yf - 0.3
    box(ax, ay, 0.045, 0.36, 0.17, 0.08, C["bianco"], 0.025)
    box(ax, ay - 0.086, 0.07, 0.34, 0.004, 0.03, M("blu_pol", hexc("#1c3f8f"), 0.5), 0)
    box(ax - 0.02, ay, 0.115, 0.2, 0.156, 0.07, C["cielo_vetro"], 0.02)
    box(ax - 0.02, ay, 0.18, 0.18, 0.15, 0.012, C["bianco"], 0.006)
    box(ax - 0.02, ay, 0.195, 0.1, 0.05, 0.025, LUCE_BLU, 0.006)
    for dx in (-0.115, 0.115):
        for dy in (-0.085, 0.085):
            cil(ax + dx, ay + dy, 0.045, 0.042, 0.03, C["scuro"], 14, asse="y")


BUILD = {k: globals()["p_" + k] for k in POSTI}
for (c, r), ids in ISOLATI.items():
    lcx, lcy, llw, lld = LOTTI[(c, r)]
    n = len(ids)
    sw = llw / n
    for k, pid in enumerate(ids):
        scx = lcx - llw / 2 + sw * (k + 0.5)
        CUR = nuova_collezione("posto_" + pid)
        BUILD[pid](scx, lcy, sw if n > 1 else llw, lld)
        objs = list(CUR.objects)
        bpy.context.view_layer.update()
        pts = [o_.matrix_world @ Vector(v) for o_ in objs if o_.type in ("MESH", "FONT") for v in o_.bound_box]
        minx, maxx, miny = min(p.x for p in pts), max(p.x for p in pts), min(p.y for p in pts)
        s = min(1.0, (sw - (0.05 if n > 1 else 0.02)) / (maxx - minx))
        if s < 0.995 or n > 1:
            perno_b = bpy.data.objects.new("perno_" + pid, None)
            perno_b.location = ((minx + maxx) / 2, miny, 0.03)
            CUR.objects.link(perno_b)
            bpy.context.view_layer.update()
            for o_ in objs:
                o_.parent = perno_b
                o_.matrix_parent_inverse = perno_b.matrix_world.inverted()
            sz = min(1.0, s * 1.4)  # più stretto che basso: in fila restano riconoscibili
            perno_b.scale = (s, sz, sz)
            perno_b.location = (scx, lcy - lld / 2 + 0.05, 0.03)
            print("SCALA", pid, round(s, 2))

# ---------------------------------------------------------------- camera
cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.type = "ORTHO"
cam.data.clip_end = 200

up = Vector((0, math.cos(TILT), math.sin(TILT)))
fwd = Vector((0, math.sin(TILT), -math.cos(TILT)))


def inquadra(u_c, v_c, larg, alt, ris_w):
    cam.rotation_euler = (TILT, 0, 0)
    cam.location = Vector((u_c, 0, 0)) + up * v_c - fwd * 40
    cam.data.ortho_scale = max(larg, alt)
    cam.data.sensor_fit = "AUTO"
    scene.render.resolution_x = ris_w
    scene.render.resolution_y = int(round(ris_w * alt / larg))
    scene.render.resolution_percentage = 100


def proietta(px, py, z=0.0):
    wx, wy = W(px, py)
    co = world_to_camera_view(scene, cam, Vector((wx, wy, z)))
    return co.x * scene.render.resolution_x, (1 - co.y) * scene.render.resolution_y


def mostra_solo(colls):
    for c in bpy.data.collections:
        c.hide_render = c.name not in colls


def render(path, trasparente=False):
    scene.render.film_transparent = trasparente
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA" if trasparente else "RGB"
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("RENDER", path)


os.makedirs(os.path.join(HERE, "img", "posti"), exist_ok=True)

# --- la mappa
if SOLO in ("tutto", "mappa"):
    mostra_solo([c.name for c in bpy.data.collections])
    # inquadratura calcolata: tutto quello che sta sopra il prato, larghezza fissa 7,2 m
    vs = [(o_.matrix_world @ Vector(v)).dot(up) for o_ in bpy.data.objects
          if o_.type in ("MESH", "FONT") and o_.dimensions.x < 8.5 for v in o_.bound_box]
    v0, v1 = min(vs) - 0.06, max(vs) + 0.06
    LARG, ALT = 7.2, v1 - v0
    inquadra(3.5, (v0 + v1) / 2, LARG, ALT, 900 if ANTEPRIMA else 1600)
    render(os.path.join(HERE, "img", "_citta.png"))
    # proiezione: px pianta -> pixel dell'immagine, scalati a un viewBox largo 720
    k = 720 / scene.render.resolution_x
    o = proietta(0, 0)
    ax = (proietta(100, 0)[0] - o[0]) * k
    ay = (proietta(0, 100)[1] - o[1]) * k
    az = (proietta(0, 0, 1.0)[1] - o[1]) * k
    dati = {"w": 720, "h": round(scene.render.resolution_y * k, 2), "ox": round(o[0] * k, 3), "oy": round(o[1] * k, 3),
            "ax": round(ax / 100, 6), "ay": round(ay / 100, 6), "az": round(az, 4)}
    # altezza (in m) di ogni posto, per le zone cliccabili
    alt = {}
    for c in bpy.data.collections:
        if c.name.startswith("posto_"):
            zs = [(o_.matrix_world @ Vector(v)).z for o_ in c.objects if o_.type in ("MESH", "FONT") for v in o_.bound_box]
            alt[c.name[6:]] = round(max(zs) if zs else 0.5, 3)
    dati["altezze"] = alt
    with open(os.path.join(HERE, "js", "citta-proiezione.js"), "w", encoding="utf-8") as f:
        f.write("/* Generato da _blender_citta.py: pianta (px) -> disegno della città (viewBox). Non modificare a mano. */\n")
        f.write("window.CITTA_PROIEZIONE = " + json.dumps(dati) + ";\n")
    print("PROIEZIONE", dati)

# --- un edificio alla volta (icone)
if SOLO in ("tutto", "posti"):
    ombra = None
    CUR = nuova_collezione("ombra")
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0.031))
    ombra = _link(bpy.context.active_object)
    ombra.is_shadow_catcher = True
    for pid in POSTI + ["station"]:
        coll = bpy.data.collections["posto_" + pid]
        mostra_solo(["posto_" + pid, "ombra"])
        pts = [o_.matrix_world @ Vector(v) for o_ in coll.objects if o_.type in ("MESH", "FONT") for v in o_.bound_box]
        us = [p.x for p in pts]
        vs = [p.dot(up) for p in pts]
        u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
        lato = max(u1 - u0, v1 - v0) * 1.08
        inquadra((u0 + u1) / 2, (v0 + v1) / 2, lato, lato, 160 if ANTEPRIMA else 360)
        render(os.path.join(HERE, "img", "posti", "_" + pid + ".png"), trasparente=True)
    # semaforo da solo
    CUR = nuova_collezione("posto_lights")
    semaforo(10, 10)
    mostra_solo(["posto_lights", "ombra"])
    inquadra(10, 10 * math.cos(TILT) + 0.3 * math.sin(TILT), 0.5, 0.5, 160 if ANTEPRIMA else 360)
    render(os.path.join(HERE, "img", "posti", "_lights.png"), trasparente=True)

# --- macchine (4 colori x 4 direzioni) e treno, da animare nel gioco
if SOLO in ("tutto", "veicoli"):
    os.makedirs(os.path.join(HERE, "img", "veicoli"), exist_ok=True)
    CUR = nuova_collezione("ombra3")
    bpy.ops.mesh.primitive_plane_add(size=12, location=(40, 40, 0.0))
    o3 = _link(bpy.context.active_object)
    o3.is_shadow_catcher = True
    for nome, colore in AUTO_COLORI.items():
        CUR = nuova_collezione("auto_" + nome)
        auto(40, 40, M("auto_" + nome, hexc(colore), 0.35))
        objs = list(CUR.objects)
        perno_a = bpy.data.objects.new("perno_auto", None)
        perno_a.location = (40, 40, 0)
        CUR.objects.link(perno_a)
        bpy.context.view_layer.update()
        for o_ in objs:
            o_.parent = perno_a
            o_.matrix_parent_inverse = perno_a.matrix_world.inverted()
        mostra_solo(["auto_" + nome, "ombra3"])
        # il cofano (parte senza abitacolo) è verso +x: E = verso est
        for d, rz in [("E", 0), ("W", math.pi), ("N", math.pi / 2), ("S", -math.pi / 2)]:
            perno_a.rotation_euler = (0, 0, rz)
            bpy.context.view_layer.update()
            inquadra(40, 40 * math.cos(TILT) + 0.1 * math.sin(TILT), 0.5, 0.5, 64 if ANTEPRIMA else 128)
            render(os.path.join(HERE, "img", "veicoli", f"_auto-{nome}-{d}.png"), trasparente=True)
    CUR = nuova_collezione("treno")
    treno(50, 50)
    CUR2 = nuova_collezione("ombra4")
    CUR = CUR2
    bpy.ops.mesh.primitive_plane_add(size=12, location=(50, 50, 0.0))
    o4 = _link(bpy.context.active_object)
    o4.is_shadow_catcher = True
    mostra_solo(["treno", "ombra4"])
    inquadra(50.03, 50 * math.cos(TILT) + 0.12 * math.sin(TILT), 1.9, 0.5, 190 if ANTEPRIMA else 380)
    render(os.path.join(HERE, "img", "veicoli", "_treno.png"), trasparente=True)

# --- l'omino nelle quattro direzioni
if SOLO in ("tutto", "omino"):
    CUR = nuova_collezione("omino")
    ox, oy = 20, 20
    parti = []
    giacca, zaino, berretto = C["blu"], C["arancio"], C["rosso"]
    parti.append(box(ox - 0.035, oy, 0.0, 0.05, 0.06, 0.16, M("jeans", hexc("#2b4a7a"), 0.7), 0.02))
    parti.append(box(ox + 0.035, oy, 0.0, 0.05, 0.06, 0.16, M("jeans", hexc("#2b4a7a"), 0.7), 0.02))
    parti.append(box(ox - 0.035, oy - 0.01, 0.0, 0.055, 0.09, 0.035, C["bianco"], 0.012))
    parti.append(box(ox + 0.035, oy - 0.01, 0.0, 0.055, 0.09, 0.035, C["bianco"], 0.012))
    parti.append(box(ox, oy, 0.15, 0.17, 0.1, 0.17, giacca, 0.04))
    parti.append(box(ox - 0.1, oy, 0.17, 0.045, 0.06, 0.14, giacca, 0.02))
    parti.append(box(ox + 0.1, oy, 0.17, 0.045, 0.06, 0.14, giacca, 0.02))
    parti.append(sfera(ox - 0.1, oy, 0.16, 0.026, C["pelle"]))
    parti.append(sfera(ox + 0.1, oy, 0.16, 0.026, C["pelle"]))
    parti.append(box(ox, oy + 0.08, 0.17, 0.14, 0.07, 0.16, zaino, 0.03))
    parti.append(sfera(ox, oy, 0.4, 0.085, C["pelle"]))
    parti.append(sfera(ox, oy + 0.005, 0.44, 0.088, berretto, 1, 1, 0.65))
    parti.append(box(ox, oy - 0.08, 0.425, 0.12, 0.08, 0.015, berretto, 0.006))
    parti.append(sfera(ox - 0.03, oy - 0.078, 0.405, 0.012, C["scuro"]))
    parti.append(sfera(ox + 0.03, oy - 0.078, 0.405, 0.012, C["scuro"]))
    parti.append(box(ox, oy - 0.083, 0.365, 0.04, 0.005, 0.008, M("bocca", hexc("#a0412d"), 0.6), 0))
    perno = bpy.data.objects.new("perno", None)
    perno.location = (ox, oy, 0)
    CUR.objects.link(perno)
    bpy.context.view_layer.update()
    for p in parti:
        p.parent = perno
        p.matrix_parent_inverse = perno.matrix_world.inverted()
    CUR2 = CUR
    CUR = nuova_collezione("ombra2")
    bpy.ops.mesh.primitive_plane_add(size=6, location=(ox, oy, 0.0))
    o2 = _link(bpy.context.active_object)
    o2.is_shadow_catcher = True
    mostra_solo(["omino", "ombra2"])
    # S = guarda verso la camera (giù nel disegno), N = di spalle
    for d, rz in [("S", 0), ("N", math.pi), ("E", math.pi / 2), ("W", -math.pi / 2)]:
        perno.rotation_euler = (0, 0, rz)
        bpy.context.view_layer.update()
        inquadra(ox, oy * math.cos(TILT) + 0.24 * math.sin(TILT) - 0.02, 0.62, 0.62, 128 if ANTEPRIMA else 256)
        render(os.path.join(HERE, "img", "_omino-" + d + ".png"), trasparente=True)

print("FATTO")

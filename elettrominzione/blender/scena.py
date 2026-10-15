"""
Elettrominzione (da una straordinaria idea dell'Ing. Rosario Leotta): personaggio e scena resi in Blender per il gioco.

Si esegue dentro Blender 5.2 (sempre su GPU). Unità in metri, Z in alto. Il gioco è di lato:
la camera guarda lungo +Y, quindi il piano dell'azione è y = 0 e l'asse X va verso destra.
L'ubriaco guarda verso +X; di lui si vede il fianco destro (lato -Y).
"""
import math
import os

import bmesh
import bpy
from mathutils import Matrix, Vector


# ---------------------------------------------------------------- colori e materiali

def srgb(hexa):
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(lin(int(hexa[i:i + 2], 16)) for i in (1, 3, 5))


def materiale(nome, colore, rugosita=0.5, metallo=0.0, vernice=0.0, emissione=0.0, alfa=1.0, trasmissione=0.0, sss=0.0):
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    rgba = (*srgb(colore), 1.0)
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rugosita
    b.inputs["Metallic"].default_value = metallo
    b.inputs["Coat Weight"].default_value = vernice
    b.inputs["Alpha"].default_value = alfa
    b.inputs["Transmission Weight"].default_value = trasmissione
    b.inputs["Subsurface Weight"].default_value = sss
    if emissione:
        b.inputs["Emission Color"].default_value = rgba
        b.inputs["Emission Strength"].default_value = emissione
    m.diffuse_color = rgba
    return m


# ---------------------------------------------------------------- primitive

def _oggetto(nome, bm, mat, genitore, liscio=False):
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    if liscio:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(nome, me)
    if mat:
        me.materials.append(mat)
    (genitore.users_collection[0] if genitore else bpy.context.scene.collection).objects.link(ob)
    if genitore:
        ob.parent = genitore
    return ob


def smussa(ob, larghezza, segmenti=2, angolo=40):
    md = ob.modifiers.new("Smusso", "BEVEL")
    md.width = larghezza
    md.segments = segmenti
    md.limit_method = "ANGLE"
    md.angle_limit = math.radians(angolo)
    return ob


def liscia(ob, livelli=2):
    ob.modifiers.new("Liscio", "SUBSURF").levels = livelli
    ob.modifiers["Liscio"].render_levels = livelli
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


def scatola(nome, x0, x1, y0, y1, z0, z1, mat, genitore, smusso=0.0, segmenti=2):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector(((x0 + x1) / 2 + v.co.x * (x1 - x0), (y0 + y1) / 2 + v.co.y * (y1 - y0), (z0 + z1) / 2 + v.co.z * (z1 - z0)))
    ob = _oggetto(nome, bm, mat, genitore)
    return smussa(ob, smusso, segmenti) if smusso else ob


def sfera(nome, centro, raggi, mat, genitore, suddivisioni=3):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=suddivisioni, radius=1.0)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(centro) @ Matrix.Diagonal((*raggi, 1.0)), verts=bm.verts)
    return _oggetto(nome, bm, mat, genitore, liscio=True)


def cilindro(nome, centro, raggio, lunghezza, asse, mat, genitore, lati=32, smusso=0.0, raggio2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=lati, radius1=raggio, radius2=raggio if raggio2 is None else raggio2, depth=lunghezza)
    rot = {"x": Matrix.Rotation(math.pi / 2, 4, "Y"), "y": Matrix.Rotation(math.pi / 2, 4, "X"), "z": Matrix.Identity(4)}[asse]
    bmesh.ops.transform(bm, matrix=Matrix.Translation(centro) @ rot, verts=bm.verts)
    ob = _oggetto(nome, bm, mat, genitore, liscio=True)
    return smussa(ob, smusso, 3, 60) if smusso else ob


def tubo(nome, punti, raggio, mat, genitore, raggi=None, liscio=True):
    """Tubo morbido lungo i punti; raggi[i] (facoltativo) lo rastrema punto per punto."""
    curva = bpy.data.curves.new(nome, "CURVE")
    curva.dimensions = "3D"
    curva.bevel_depth = raggio
    curva.bevel_resolution = 4
    curva.use_fill_caps = True
    sp = curva.splines.new("NURBS" if liscio and len(punti) > 2 else "POLY")
    sp.points.add(len(punti) - 1)
    for i, (p, c) in enumerate(zip(sp.points, punti)):
        p.co = (*c, 1.0)
        p.radius = 1.0 if raggi is None else raggi[i] / raggio
    if sp.type == "NURBS":
        sp.use_endpoint_u = True
        sp.order_u = 3
        curva.resolution_u = 12
    ob = bpy.data.objects.new(nome, curva)
    curva.materials.append(mat)
    (genitore.users_collection[0] if genitore else bpy.context.scene.collection).objects.link(ob)
    if genitore:
        ob.parent = genitore
    return ob


def radice(nome):
    vecchio = bpy.data.objects.get(nome)
    if vecchio:
        for figlio in list(vecchio.children_recursive):
            bpy.data.objects.remove(figlio, do_unlink=True)
        bpy.data.objects.remove(vecchio, do_unlink=True)
    ob = bpy.data.objects.new(nome, None)
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ---------------------------------------------------------------- l'ubriaco

# Dove esce il getto, in coordinate del personaggio (piedi all'origine, guarda verso +X)
ORIGINE_GETTO = (0.235, 0.0, 0.85)
ABBASSA = 0.08   # busto più basso: gambe da cartone


def ubriaco(posa="normale"):
    """Canottiera, coppola, naso rosso, bottiglia di birra nella sinistra.
    posa: "normale" (mano destra davanti, birra alzata) o "folgorato" (braccia in alto, rigido)."""
    R = radice("Ubriaco " + posa)
    PELLE = materiale("Pelle", "#e2a882", rugosita=0.55, sss=0.15)
    NASO = materiale("Naso", "#d6524a", rugosita=0.4, sss=0.2)
    CANOTTA = materiale("Canottiera", "#efece2", rugosita=0.8)
    JEANS = materiale("Jeans", "#3e5d8f", rugosita=0.85)
    SCARPE = materiale("Scarpe", "#4a2f22", rugosita=0.5)
    COPPOLA = materiale("Coppola", "#6d5a45", rugosita=0.9)
    OCCHI = materiale("Occhi", "#1d1d1d", rugosita=0.3)
    BARBA = materiale("Barba", "#5a4a3d", rugosita=0.9)
    VETRO = materiale("Bottiglia", "#5b3a12", rugosita=0.08, trasmissione=0.4)
    ETICHETTA = materiale("Etichetta", "#e8c547", rugosita=0.5)
    CINTURA = materiale("Cintura", "#2b2320", rugosita=0.5)

    # gambe un po' larghe, per stare in piedi
    for s in (1, -1):
        y = s * 0.11
        scatola(f"scarpa {s}", -0.07, 0.21, y - 0.055, y + 0.055, 0.0, 0.09, SCARPE, R, smusso=0.035, segmenti=3)
        tubo(f"gamba {s}", [(0.02, y, 0.08), (0.04, y, 0.42), (0.0, y * 0.9, 0.8)], 0.085, JEANS, R, raggi=[0.075, 0.085, 0.1])
    # bacino e pancia da birra sotto la canottiera
    sfera("bacino", (0.0, 0.0, 0.9), (0.15, 0.19, 0.11), JEANS, R)
    scatola("cintura", -0.13, 0.14, -0.185, 0.185, 0.92, 0.96, CINTURA, R, smusso=0.03, segmenti=3)
    sfera("torace", (-0.02, 0.0, 1.28), (0.15, 0.2, 0.2), CANOTTA, R)
    sfera("pancia", (0.07, 0.0, 1.1), (0.2, 0.2, 0.2), CANOTTA, R)
    # spalle e collo
    for s in (1, -1):
        sfera(f"spalla {s}", (-0.02, s * 0.2, 1.39), (0.07, 0.07, 0.06), PELLE, R)
    cilindro("collo", Vector((0.0, 0.0, 1.48)), 0.055, 0.1, "z", PELLE, R)
    # testa: faccia un po' larga, naso rosso, occhi socchiusi, barba di tre giorni
    sfera("testa", (0.02, 0.0, 1.6), (0.12, 0.115, 0.13), PELLE, R)
    sfera("naso", (0.135, 0.0, 1.585), (0.04, 0.035, 0.035), NASO, R)
    sfera("barba", (0.05, 0.0, 1.52), (0.09, 0.105, 0.06), BARBA, R)
    for s in (1, -1):
        sfera(f"occhio {s}", (0.115, s * 0.05, 1.625), (0.012, 0.018, 0.007), OCCHI, R)
        sfera(f"orecchio {s}", (0.0, s * 0.115, 1.6), (0.025, 0.012, 0.035), PELLE, R)
        tubo(f"sopracciglio {s}", [(0.105, s * 0.075, 1.65), (0.12, s * 0.03, 1.645)], 0.008, BARBA, R, liscio=False)
    # coppola siciliana, visiera in avanti
    folgorato = posa == "folgorato"
    coppola = sfera("coppola", (0.0, 0.0, 1.69), (0.13, 0.125, 0.05), COPPOLA, R)
    visiera = scatola("visiera", 0.07, 0.19, -0.1, 0.1, 1.675, 1.69, COPPOLA, R, smusso=0.006)
    if folgorato:
        # la coppola salta via
        for ob in (coppola, visiera):
            ob.matrix_world = Matrix.Translation((-0.05, 0, 0.18)) @ Matrix.Rotation(math.radians(-25), 4, "Y") @ ob.matrix_world
        # capelli dritti
        for k in range(9):
            a = (k - 4) * 0.28
            tubo(f"capello {k}", [(0.02 + 0.08 * math.sin(a), 0.03 * (k % 3 - 1), 1.7), (0.02 + 0.2 * math.sin(a), 0.05 * (k % 3 - 1), 1.7 + 0.2 * math.cos(a))],
                 0.012, BARBA, R, raggi=[0.014, 0.003], liscio=False)

    # braccia: la destra (quella verso di noi) davanti al bacino, la sinistra alza la birra
    if posa == "beve":
        destra = [(-0.02, -0.21, 1.38), (0.06, -0.25, 1.13), (0.19, -0.1, 0.96)]
        sinistra = [(-0.02, 0.21, 1.38), (0.2, 0.22, 1.42), (0.2, 0.08, 1.6)]
    elif not folgorato:
        destra = [(-0.02, -0.21, 1.38), (0.06, -0.25, 1.13), (0.19, -0.1, 0.96)]
        sinistra = [(-0.02, 0.21, 1.38), (0.14, 0.3, 1.3), (0.24, 0.22, 1.5)]
    else:
        destra = [(-0.02, -0.21, 1.38), (0.05, -0.36, 1.62), (0.1, -0.42, 1.92)]
        sinistra = [(-0.02, 0.21, 1.38), (0.02, 0.36, 1.64), (0.06, 0.42, 1.94)]
    for nome, pts in (("braccio destro", destra), ("braccio sinistro", sinistra)):
        tubo(nome, pts, 0.05, PELLE, R, raggi=[0.058, 0.048, 0.04])
        sfera("mano " + nome[8:], pts[-1], (0.045, 0.04, 0.05), PELLE, R)
    # due ciuffi dietro le orecchie: è stempiato, non calvo
    for s in (1, -1):
        sfera(f"ciuffo {s}", (-0.06, s * 0.1, 1.6), (0.06, 0.03, 0.05), BARBA, R)
    # bottiglia nella sinistra (nel folgorato vola via)
    mano = Vector(sinistra[-1])
    bott = mano + (Vector((0.02, 0.0, 0.08)) if not folgorato else Vector((0.25, 0.1, 0.25)))
    pezzi = [cilindro("bottiglia", bott, 0.033, 0.16, "z", VETRO, R, lati=24),
             cilindro("collo bottiglia", bott + Vector((0, 0, 0.12)), 0.03, 0.09, "z", VETRO, R, lati=16, raggio2=0.012),
             cilindro("etichetta", bott + Vector((0, 0, -0.01)), 0.0335, 0.07, "z", ETICHETTA, R, lati=24)]
    if posa == "beve":
        # bottiglia inclinata col collo in bocca
        giro = Matrix.Translation(mano) @ Matrix.Rotation(math.radians(-115), 4, "Y") @ Matrix.Translation(-mano)
        for ob in pezzi:
            ob.matrix_world = Matrix.Translation((0.03, 0, -0.02)) @ giro @ ob.matrix_world
    # tutto quello che sta sopra le gambe scende di ABBASSA
    for ob in R.children:
        if not ob.name.startswith(("scarpa", "gamba")):
            ob.matrix_world = Matrix.Translation((0, 0, -ABBASSA)) @ ob.matrix_world
    return R


# ---------------------------------------------------------------- la scena: ponte, fiume, alta tensione

Z_PONTE = 7.0                      # piano di calpestio del ponte
PARAPETTO = (0.32, 0.56, 0.72)     # x interno, x esterno, altezza sul piano
# conduttori della linea (x, z) nel piano dell'azione y=0: tre fasi parallele al ponte, più in basso
CONDUTTORI = [(1.9, 5.15), (3.1, 5.4), (4.3, 5.15)]
POS_UBRIACO = (0.0, 0.0, Z_PONTE + 0.12)   # in piedi sul marciapiede
TAGLIO_PRIMO_PIANO = 0.35


def ponte():
    R = radice("Ponte")
    PIETRA = materiale("Pietra", "#b59a78", rugosita=0.9)
    PIETRA2 = materiale("Pietra scura", "#8f775b", rugosita=0.9)
    ASFALTO = materiale("Asfalto", "#5d5a57", rugosita=0.95)
    CORNICE = materiale("Cornice", "#cdb897", rugosita=0.8)
    x0, x1 = -4.6, PARAPETTO[1]
    # corpo del ponte: muro pieno fino all'acqua, con gli archi scavati (lungo Y)
    impalcato = scatola("impalcato", x0, x1, -12, 42, -0.5, Z_PONTE, PIETRA, R, smusso=0.04)
    for yc in (-8.5, 4.5, 17.5, 30.5):
        arco = cilindro(f"arco {yc}", Vector(((x0 + x1) / 2, yc, 0.8)), 5.2, 8, "x", None, R, lati=64)
        arco.hide_render = True
        arco.display_type = "WIRE"
        md = impalcato.modifiers.new(f"arco {yc}", "BOOLEAN")
        md.object = arco
        md.solver = "EXACT"
        impalcato.modifiers.move(len(impalcato.modifiers) - 1, 0)
        # ghiera in pietra più scura attorno all'arco
        ghiera = cilindro(f"ghiera {yc}", Vector((x1 + 0.02, yc, 0.8)), 5.6, 0.08, "x", PIETRA2, R, lati=64)
        foro = cilindro(f"foro ghiera {yc}", Vector((x1 + 0.02, yc, 0.8)), 5.2, 0.4, "x", None, R, lati=64)
        foro.hide_render = True
        foro.display_type = "WIRE"
        md = ghiera.modifiers.new("foro", "BOOLEAN")
        md.object = foro
        md.solver = "EXACT"
    # strada, marciapiede, cornice e parapetto
    scatola("strada", x0 + 0.5, PARAPETTO[0] - 0.9, -12, 42, Z_PONTE, Z_PONTE + 0.02, ASFALTO, R)
    scatola("marciapiede", PARAPETTO[0] - 0.9, PARAPETTO[0], -12, 42, Z_PONTE, Z_PONTE + 0.12, CORNICE, R, smusso=0.02)
    scatola("cornice", x1 - 0.05, x1 + 0.12, -12, 42, Z_PONTE - 0.25, Z_PONTE - 0.05, CORNICE, R, smusso=0.02)
    # il parapetto è in due tratti: quello vicino (y < TAGLIO_PRIMO_PIANO) copre l'ubriaco e va nel primo piano
    for nome, ya, yb in (("vicino", -12, TAGLIO_PRIMO_PIANO), ("lontano", TAGLIO_PRIMO_PIANO, 42)):
        scatola("parapetto " + nome, PARAPETTO[0], x1, ya, yb, Z_PONTE, Z_PONTE + PARAPETTO[2], PIETRA, R, smusso=0.03)
        scatola("copertina " + nome, PARAPETTO[0] - 0.03, x1 + 0.03, ya, yb, Z_PONTE + PARAPETTO[2], Z_PONTE + PARAPETTO[2] + 0.07, CORNICE, R, smusso=0.02)
    scatola("parapetto sinistro", x0, x0 + 0.24, -12, 42, Z_PONTE, Z_PONTE + PARAPETTO[2], PIETRA, R, smusso=0.03)
    # lampione d'epoca poco dietro l'ubriaco
    GHISA = materiale("Ghisa", "#2a2c2e", rugosita=0.45, metallo=0.7)
    LUCE = materiale("Lampione", "#ffe6a8", rugosita=0.2, emissione=4.0)
    yl = 3.2
    cilindro("palo lampione", Vector((0.44, yl, Z_PONTE + 2.2)), 0.06, 3.0, "z", GHISA, R, lati=16)
    cilindro("base lampione", Vector((0.44, yl, Z_PONTE + 0.95)), 0.12, 0.5, "z", GHISA, R, lati=16)
    sfera("lanterna", (0.44, yl, Z_PONTE + 3.85), (0.16, 0.16, 0.22), LUCE, R)
    cilindro("cappello lampione", Vector((0.44, yl, Z_PONTE + 4.1)), 0.2, 0.06, "z", GHISA, R, lati=16, raggio2=0.05)
    return R


def fiume():
    R = radice("Fiume")
    ACQUA = materiale("Acqua", "#2f6f7e", rugosita=0.06, vernice=0.6)
    ERBA = materiale("Erba", "#6d8f3d", rugosita=0.95)
    TERRA = materiale("Sponda", "#8b7355", rugosita=0.95)
    scatola("acqua", -40, 60, -20, 80, -0.6, 0.0, ACQUA, R)
    # sponda lontana e colline dietro
    scatola("sponda", -40, 60, 45, 90, -0.6, 1.2, TERRA, R, smusso=0.3)
    scatola("prato", -40, 60, 47, 90, 1.2, 1.35, ERBA, R, smusso=0.1)
    for k, (x, y, r) in enumerate(((-18, 60, 7), (4, 70, 9), (26, 62, 8), (44, 74, 10))):
        sfera(f"collina {k}", (x, y, 0), (r * 2.2, r, r * 0.7), ERBA, R)
    # alberi sulla sponda
    TRONCO = materiale("Tronco", "#5b4332", rugosita=0.9)
    CHIOMA = materiale("Chioma", "#4f7a34", rugosita=0.9)
    for k, (x, y, h) in enumerate(((-9, 50, 3.2), (-2, 52, 4.0), (10, 49, 3.5), (17, 53, 4.4), (24, 50, 3.0))):
        cilindro(f"tronco {k}", Vector((x, y, 1.3 + h / 2)), 0.18, h, "z", TRONCO, R, lati=10)
        sfera(f"chioma {k}", (x, y, 1.3 + h + 0.6), (1.4, 1.4, 1.6), CHIOMA, R, suddivisioni=2)
    return R


def traliccio(nome, y, genitore, acciaio):
    """Traliccio dell'alta tensione a delta, alla distanza y lungo la linea."""
    xm = sum(x for x, _ in CONDUTTORI) / 3
    base, cima = 0.0, 7.2
    legs = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            legs.append(((xm + sx * 1.4, y + sy * 1.4, base), (xm + sx * 0.45, y + sy * 0.45, cima)))
    for k, (a, b) in enumerate(legs):
        tubo(f"{nome} gamba {k}", [a, b], 0.06, acciaio, genitore, liscio=False)
    # crociere
    for t0, t1 in ((0.0, 0.25), (0.25, 0.5), (0.5, 0.75), (0.75, 1.0)):
        for i in range(4):
            a0, a1 = legs[i], legs[(i + 1) % 4 if i < 3 else 0]
            p = lambda leg, t: tuple(leg[0][j] + (leg[1][j] - leg[0][j]) * t for j in range(3))
            tubo(f"{nome} croce {t0} {i}", [p(a0, t0), p(a1, t1)], 0.03, acciaio, genitore, liscio=False)
    # mensole per le tre fasi, un po' sopra i conduttori
    for k, (x, z) in enumerate(CONDUTTORI):
        zm = z + 1.6
        tubo(f"{nome} mensola {k}", [(xm, y, zm + 0.3), (x, y, zm)], 0.05, acciaio, genitore, liscio=False)
    tubo(f"{nome} trave", [(CONDUTTORI[0][0], y, CONDUTTORI[0][1] + 1.6), (CONDUTTORI[2][0], y, CONDUTTORI[2][1] + 1.6)], 0.06, acciaio, genitore, liscio=False)
    tubo(f"{nome} cima", [(xm, y, cima), (xm, y, cima + 1.6)], 0.05, acciaio, genitore, liscio=False)


def linea():
    """Tre conduttori tesi fra due tralicci, con catene di isolatori; al punto y=0 passano da CONDUTTORI."""
    R = radice("Linea")
    ACCIAIO = materiale("Acciaio traliccio", "#8d949a", rugosita=0.4, metallo=0.8)
    CAVO = materiale("Cavo", "#3a3d40", rugosita=0.35, metallo=0.9)
    ISOL = materiale("Isolatore", "#6e8f9e", rugosita=0.1, vernice=1.0)
    ya, yb = -26.0, 30.0
    for nome, y in (("traliccio vicino", ya), ("traliccio lontano", yb)):
        traliccio(nome, y, R, ACCIAIO)
    for k, (x, z) in enumerate(CONDUTTORI):
        # catenaria: a y=0 il cavo passa esattamente da (x, z)
        freccia = 1.2
        def zc(y):
            u = (y - (ya + yb) / 2) / ((yb - ya) / 2)
            return z + freccia * (u * u - ((0 - (ya + yb) / 2) / ((yb - ya) / 2)) ** 2)
        pts = [(x, y, zc(y)) for y in [ya + (yb - ya) * i / 24 for i in range(25)]]
        tubo(f"conduttore {k}", pts, 0.022, CAVO, R, liscio=False)
        for y in (ya, yb):
            ztop = zc(y)
            tubo(f"isolatore {k} {y}", [(x, y, ztop), (x, y, ztop + 1.6)], 0.012, ACCIAIO, R, liscio=False)
            for j in range(8):
                cilindro(f"disco {k} {y} {j}", Vector((x, y, ztop + 0.2 + j * 0.17)), 0.11, 0.035, "z", ISOL, R, lati=16)
    return R


# ---------------------------------------------------------------- camera, luce, render

# Camera prospettica dritta lungo il ponte (+Y), un po' a destra e sopra: il ponte fugge a sinistra,
# i cavi corrono paralleli verso lo stesso punto di fuga. Il getto sta nel piano y = 0.
CAMERA_POS = (2.4, -4.6, 8.3)
CAMERA_BECCHEGGIO = -12.0   # gradi, verso il basso
CAMERA_LENTE = 22.0         # mm su sensore largo 36
RISOLUZIONE = (1920, 1200)


def prepara_scena():
    sc = bpy.data.scenes.get("Elettrominzione") or bpy.data.scenes.new("Elettrominzione")
    bpy.context.window.scene = sc
    sc.render.engine = "CYCLES"
    sc.cycles.device = "GPU"          # sempre GPU (OptiX)
    sc.cycles.samples = 128
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "AgX"
    sc.render.resolution_x, sc.render.resolution_y = RISOLUZIONE
    sc.render.resolution_percentage = 100
    mondo = bpy.data.worlds.get("El cielo") or bpy.data.worlds.new("El cielo")
    mondo.use_nodes = True
    bg = next(n for n in mondo.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (*srgb("#f2b98a"), 1)     # cielo del tramonto, riflesso caldo
    bg.inputs["Strength"].default_value = 0.7
    sc.world = mondo
    sole = bpy.data.objects.get("El sole")
    if not sole:
        sole = bpy.data.objects.new("El sole", bpy.data.lights.new("El sole", "SUN"))
    if sole.name not in sc.collection.objects:
        sc.collection.objects.link(sole)
    sole.data.energy = 3.2
    sole.data.color = srgb("#ffd2a0")
    sole.data.angle = math.radians(3)
    sole.rotation_euler = Vector((-0.75, -0.45, 0.42)).normalized().to_track_quat("Z", "Y").to_euler()
    cam = bpy.data.objects.get("El camera")
    if not cam:
        cam = bpy.data.objects.new("El camera", bpy.data.cameras.new("El camera"))
    if cam.name not in sc.collection.objects:
        sc.collection.objects.link(cam)
    cam.data.type = "PERSP"
    cam.data.lens = CAMERA_LENTE
    cam.data.sensor_fit = "HORIZONTAL"
    cam.data.sensor_width = 36
    cam.data.clip_start = 0.1
    cam.data.clip_end = 400
    cam.location = CAMERA_POS
    cam.rotation_euler = (math.radians(90 + CAMERA_BECCHEGGIO), 0, 0)
    sc.camera = cam
    return sc


def costruisci():
    sc = prepara_scena()
    ponte()
    fiume()
    linea()
    for posa in ("normale", "beve", "folgorato"):
        u = ubriaco(posa)
        u.matrix_world = Matrix.Translation(POS_UBRIACO)
    return sc


def _mostra(solo=None, nascondi_nomi=()):
    """Rende visibili solo le radici in `solo` (tutte se None), a parte i tagli booleani."""
    sc = bpy.context.scene
    for r in [o for o in sc.objects if o.parent is None and o.type == "EMPTY"]:
        on = solo is None or r.name in solo
        for c in [r] + list(r.children_recursive):
            if c.display_type == "WIRE":
                continue
            c.hide_render = not on or c.name in nascondi_nomi


def rendi_tutto(cartella, campioni=160):
    """sfondo.png, primo-piano.png, ubriaco-<posa>.png e camera.json, tutti alla stessa inquadratura."""
    import json
    os.makedirs(cartella, exist_ok=True)
    sc = bpy.context.scene
    sc.cycles.samples = campioni
    pose = [o.name for o in sc.objects if o.parent is None and o.name.startswith("Ubriaco ")]
    # sfondo: tutto tranne l'ubriaco
    _mostra({"Ponte", "Fiume", "Linea"})
    sc.render.filepath = os.path.join(cartella, "sfondo.png")
    bpy.ops.render.render(write_still=True)
    # primo piano: solo il tratto di parapetto davanti all'ubriaco
    ponte_ob = bpy.data.objects["Ponte"]
    tieni = {"parapetto vicino", "copertina vicino"}
    _mostra({"Ponte"}, nascondi_nomi={c.name for c in ponte_ob.children_recursive if c.name not in tieni})
    sc.render.filepath = os.path.join(cartella, "primo-piano.png")
    bpy.ops.render.render(write_still=True)
    # l'ubriaco nelle sue pose, da solo; il parapetto lo ritaglia il gioco col primo piano
    for nome in pose:
        _mostra({nome})
        sc.render.filepath = os.path.join(cartella, nome.lower().replace(" ", "-") + ".png")
        bpy.ops.render.render(write_still=True)
    _mostra()
    # la camera, per proiettare nel gioco i punti del mondo sui pixel dello sfondo
    cam = sc.camera
    m = cam.matrix_world.inverted()
    dati = {
        "larghezza": sc.render.resolution_x, "altezza": sc.render.resolution_y,
        "focale_px": cam.data.lens / cam.data.sensor_width * sc.render.resolution_x,
        "mondo_camera": [list(m[i]) for i in range(3)],
        "piedi": list(POS_UBRIACO), "origine_getto": [POS_UBRIACO[i] + ORIGINE_GETTO[i] for i in range(3)],
        "parapetto": {"x0": PARAPETTO[0], "x1": PARAPETTO[1], "cima": Z_PONTE + PARAPETTO[2] + 0.07},
        "muro_ponte_x": PARAPETTO[1] + 0.12, "z_ponte": Z_PONTE,
        "conduttori": [list(c) for c in CONDUTTORI],
    }
    with open(os.path.join(cartella, "camera.json"), "w", encoding="utf-8") as f:
        json.dump(dati, f, indent=1)
    return dati

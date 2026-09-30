"""
Veicoli del gioco «Parcheggia la Moke», modellati in Blender e resi come sprite.

Si esegue dentro Blender (testato su 5.2): costruisce la Moke e l'utilitaria in una scena a parte,
«Veicoli», senza toccare le altre scene del file. Le coordinate seguono il gioco:
X = u (lungo la facciata), Y = -v (il gioco ha v verso chi guarda, sinistrorso), Z in alto,
origine al centro dell'impronta a terra, muso verso +X.

La camera è ortografica e guarda lungo la direzione ricavata dal righello del gioco
(vettori A, B e ALTEZZA_PX in js/parcheggio.js): il nucleo di quella proiezione è la direzione
di vista, il resto è una trasformazione 2D che il gioco applica quando disegna lo sprite.

Per rigenerare gli sprite (dal server MCP di Blender o dalla console Python di Blender):
    import importlib.util, sys
    spec = importlib.util.spec_from_file_location("veicoli", r"<repo>/meucci-giochi/blender/veicoli.py")
    V = importlib.util.module_from_spec(spec); spec.loader.exec_module(V)
    V.costruisci()
    V.rendi(r"<cartella temporanea>", "moke", 0, 16)   # ... 16-32, 32-48, 48-64, poi le auto
e fuori da Blender: python impacchetta.py <cartella temporanea>
La Moke è quella del plesso (Mini Moke portoghese azzurro petrolio, foto del 2026-09-30).
"""
import math
import bmesh
import bpy
from mathutils import Matrix, Vector

SCENA = "Veicoli"

# Direzione verso chi guarda e assi dell'immagine, già in coordinate Blender (vedi docstring)
VISTA = Vector((0.44858574, -0.84541187, 0.28991311))
ASSE_X = Vector((0.88334908, 0.46871569, 0.0))
ASSE_Y = Vector((-0.13588682, 0.25609448, 0.95705297))
# Verso il sole: da sinistra e un po' da dietro, come le ombre dei paletti nel disegno
SOLE = Vector((-0.62, -0.18, 0.76)).normalized()


# ---------------------------------------------------------------- materiali

def materiale(nome, colore, rugosita=0.5, metallo=0.0, vernice=0.0, emissione=0.0, alfa=1.0, trasmissione=0.0):
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    rgba = (*colore, 1.0)
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = rugosita
    bsdf.inputs["Metallic"].default_value = metallo
    bsdf.inputs["Coat Weight"].default_value = vernice
    bsdf.inputs["Coat Roughness"].default_value = 0.08
    bsdf.inputs["Alpha"].default_value = alfa
    bsdf.inputs["Transmission Weight"].default_value = trasmissione
    if emissione:
        bsdf.inputs["Emission Color"].default_value = rgba
        bsdf.inputs["Emission Strength"].default_value = emissione
    m.diffuse_color = rgba
    return m


def srgb(hexa):
    """#rrggbb → colore lineare, come lo vuole Blender."""
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(lin(int(hexa[i:i + 2], 16)) for i in (1, 3, 5))


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
    bpy.context.scene.collection.objects.link(ob) if genitore is None else genitore.users_collection[0].objects.link(ob)
    if genitore is not None:
        ob.parent = genitore
    return ob


def smussa(ob, larghezza, segmenti=2, angolo=40):
    if larghezza <= 0:
        return ob
    md = ob.modifiers.new("Smusso", "BEVEL")
    md.width = larghezza
    md.segments = segmenti
    md.limit_method = "ANGLE"
    md.angle_limit = math.radians(angolo)
    md.harden_normals = False
    return ob


def scatola(nome, x0, x1, y0, y1, z0, z1, mat, genitore, smusso=0.0, segmenti=2):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector(((x0 + x1) / 2 + v.co.x * (x1 - x0), (y0 + y1) / 2 + v.co.y * (y1 - y0), (z0 + z1) / 2 + v.co.z * (z1 - z0)))
    ob = _oggetto(nome, bm, mat, genitore)
    return smussa(ob, smusso, segmenti)


def prisma(nome, profilo, y0, y1, mat, genitore, smusso=0.0, segmenti=2):
    """Profilo laterale [(x, z), ...] estruso fra y0 e y1."""
    bm = bmesh.new()
    a = [bm.verts.new((x, y0, z)) for x, z in profilo]
    b = [bm.verts.new((x, y1, z)) for x, z in profilo]
    bm.faces.new(a[::-1])
    bm.faces.new(b)
    n = len(profilo)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = _oggetto(nome, bm, mat, genitore)
    return smussa(ob, smusso, segmenti)


def cilindro(nome, centro, raggio, lunghezza, asse, mat, genitore, lati=32, smusso=0.0, segmenti=3, liscio=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=lati, radius1=raggio, radius2=raggio, depth=lunghezza)
    rot = {"x": Matrix.Rotation(math.pi / 2, 4, "Y"), "y": Matrix.Rotation(math.pi / 2, 4, "X"), "z": Matrix.Identity(4)}[asse]
    bmesh.ops.transform(bm, matrix=Matrix.Translation(centro) @ rot, verts=bm.verts)
    ob = _oggetto(nome, bm, mat, genitore, liscio)
    if smusso:
        smussa(ob, smusso, segmenti, angolo=60)
    return ob


def tubo(nome, punti, raggio, mat, genitore, lati=12):
    """Tubo che passa per i punti dati (angoli vivi), per telai e paraurti."""
    curva = bpy.data.curves.new(nome, "CURVE")
    curva.dimensions = "3D"
    curva.bevel_depth = raggio
    curva.bevel_resolution = 3
    sp = curva.splines.new("POLY")
    sp.points.add(len(punti) - 1)
    for p, c in zip(sp.points, punti):
        p.co = (*c, 1.0)
    ob = bpy.data.objects.new(nome, curva)
    curva.materials.append(mat)
    genitore.users_collection[0].objects.link(ob)
    ob.parent = genitore
    return ob


def taglia(ob, cutter, operazione="DIFFERENCE"):
    cutter.hide_render = True
    cutter.display_type = "WIRE"
    cutter.hide_viewport = True
    md = ob.modifiers.new("Taglio " + cutter.name, "BOOLEAN")
    md.object = cutter
    md.operation = operazione
    md.solver = "EXACT"
    # il booleano deve stare prima dello smusso
    for i, m in enumerate(ob.modifiers):
        if m.type == "BEVEL":
            ob.modifiers.move(len(ob.modifiers) - 1, i)
            break
    return md


def ruota(nome, x, y, raggio, larghezza, cerchio, genitore, lato=1, cz=None):
    """Pneumatico, cerchio e mozzo; lato=+1 se la faccia esterna guarda +Y."""
    cz = raggio if cz is None else cz
    gomma = mat_gomma()
    cilindro(nome + " gomma", Vector((x, y, cz)), raggio, larghezza, "y", gomma, genitore, lati=40, smusso=raggio * 0.32, segmenti=4)
    fuori = y + lato * (larghezza / 2 - 0.004)
    cilindro(nome + " cerchio", Vector((x, fuori, cz)), raggio * 0.62, 0.03, "y", cerchio, genitore, lati=32, smusso=0.012)
    cilindro(nome + " mozzo", Vector((x, fuori + lato * 0.018, cz)), raggio * 0.2, 0.03, "y", mat_cromo(), genitore, lati=20, smusso=0.01)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        cilindro(nome + f" bullone {k}", Vector((x + math.cos(a) * raggio * 0.33, fuori + lato * 0.02, cz + math.sin(a) * raggio * 0.33)),
                 0.012, 0.02, "y", mat_cromo(), genitore, lati=8)


def mat_gomma():
    return materiale("Gomma", srgb("#1c1d20"), rugosita=0.85)


def mat_cromo():
    return materiale("Cromo", srgb("#c9ccd0"), rugosita=0.22, metallo=1.0)


def radice(nome):
    """Empty che fa da origine del veicolo; tutti i pezzi ne sono figli."""
    vecchio = bpy.data.objects.get(nome)
    if vecchio:
        for figlio in list(vecchio.children_recursive):
            bpy.data.objects.remove(figlio, do_unlink=True)
        bpy.data.objects.remove(vecchio, do_unlink=True)
    ob = bpy.data.objects.new(nome, None)
    ob.empty_display_type = "ARROWS"
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ---------------------------------------------------------------- la Moke

MOKE_VERNICE = "#1f6e8e"   # azzurro petrolio della Moke del Meucci (foto del 2026-09-30)


def moke(vernice=MOKE_VERNICE, fasi=("scocca", "frontale", "ruote", "interno", "capote")):
    """Mini Moke classica (serie portoghese anni '80), come quella del plesso: 3,05 × 1,30 m di scocca,
    passo 2,03, capote grigia aperta sui lati e dietro, sedili blu, bull bar bianco. Muso verso +X, guida a sinistra (+Y).
    `fasi` permette di costruirla a pezzi per trovare in fretta quello che non va."""
    R = radice("Moke")
    C = materiale("Moke carrozzeria", srgb(vernice), rugosita=0.38, vernice=0.5)
    SCURO = materiale("Moke interno", srgb("#23282e"), rugosita=0.7)
    BIANCO = materiale("Bianco tubi", srgb("#f1f1ec"), rugosita=0.3, vernice=0.4)
    CERCHIO = materiale("Cerchi", srgb("#d9dcdc"), rugosita=0.35, metallo=0.4)
    SEDILE = materiale("Sedili", srgb("#2a58a6"), rugosita=0.6)
    TELA = materiale("Capote", srgb("#a9b0b0"), rugosita=0.9)
    TELAIO = materiale("Telaio vetro", srgb("#9ea5aa"), rugosita=0.35, metallo=0.7)
    VETRO = materiale("Vetro", srgb("#cfe8f2"), rugosita=0.05, alfa=0.22)
    FARO = materiale("Faro", srgb("#fff4d8"), rugosita=0.1, emissione=0.5)
    FRECCIA = materiale("Freccia", srgb("#f08a24"), rugosita=0.3, emissione=0.3)
    STOP = materiale("Stop", srgb("#c62828"), rugosita=0.3, emissione=0.3)
    GRIGLIA = materiale("Griglia", srgb("#2a2e33"), rugosita=0.5)
    TARGA = materiale("Targa", srgb("#f4f4f0"), rugosita=0.5)
    NERO = materiale("Targa scritte", srgb("#1c1c1c"), rugosita=0.5)

    L2, W2 = 1.52, 0.65              # mezza lunghezza e mezza larghezza della scocca
    PASSO, RR, CZ = 1.015, 0.28, 0.28
    CARR = 0.6                       # mezza carreggiata: le ruote sporgono un filo dai fianchi
    DAV, DIE = 0.5, -1.36            # abitacolo fra il parabrezza e il pannello posteriore
    ZC = 0.82                        # quota del cofano

    if "scocca" in fasi:
        # vasca: cassoni laterali fino a metà altezza, pannello posteriore pieno
        vasca = scatola("Moke vasca", -L2, 1.3, -W2, W2, 0.22, 0.62, C, R, smusso=0.02)
        taglia(vasca, scatola("Moke taglio abitacolo", DIE, DAV, -0.47, 0.47, 0.34, 1.2, None, R))
        # cofano stretto con i parafanghi piatti che sporgono ai lati (le frecce stanno sotto)
        prisma("Moke cofano", [(DAV - 0.03, 0.42), (L2, 0.42), (L2, ZC - 0.04), (L2 - 0.1, ZC), (DAV - 0.03, ZC + 0.04)], -0.46, 0.46, C, R, smusso=0.05, segmenti=3)
        prisma("Moke frontale", [(L2 - 0.06, 0.3), (L2, 0.3), (L2, 0.8), (L2 - 0.06, 0.8)], -W2, W2, C, R, smusso=0.01)
        for s in (1, -1):
            parafango = prisma(f"Moke parafango {s}", [(DAV, 0.66), (L2, 0.66), (L2, 0.72), (DAV, 0.72)],
                               s * 0.45 if s > 0 else -0.74, 0.74 if s > 0 else -0.45, C, R, smusso=0.015)
            taglia(parafango, cilindro(f"Moke taglio parafango {s}", Vector((DAV + 0.02, s * 0.6, 0.72)), 0.14, 0.4, "y", None, R, lati=24))
            fianco = scatola(f"Moke fianco cofano {s}", DAV, L2 - 0.05, s * 0.46 - 0.012, s * 0.46 + 0.012, 0.36, 0.7, C, R)
            taglia(fianco, cilindro(f"Moke arco cofano {s}", Vector((PASSO, s * 0.5, CZ)), 0.34, 0.3, "y", None, R, lati=40))
        # passaruota posteriori e anteriori tagliati sui cassoni
        for sx, nome in ((PASSO, "ant"), (-PASSO, "post")):
            for s in (1, -1):
                taglia(vasca, cilindro(f"Moke arco {nome} {s}", Vector((sx, s * 0.6, CZ)), 0.34, 0.26, "y", None, R, lati=40))
        # formelle in rilievo sui cassoni
        for s in (1, -1):
            for k, (x0, x1) in enumerate(((-0.62, -0.1), (-0.02, 0.5))):
                scatola(f"Moke formella {s} {k}", x0, x1, s * W2 - 0.008, s * W2 + 0.008, 0.32, 0.54, C, R, smusso=0.006)
        scatola("Moke pianale", DIE, DAV, -0.47, 0.47, 0.28, 0.35, SCURO, R)
        # pannello dietro il cofano che sale fino al parabrezza, come sulla foto
        scatola("Moke paratia", DAV - 0.06, DAV, -W2, W2, 0.6, 0.88, C, R, smusso=0.015)

    if "frontale" in fasi:
        # griglia a lamelle orizzontali con la cornice chiara
        scatola("Moke cornice griglia", L2 - 0.01, L2 + 0.02, -0.28, 0.28, 0.36, 0.66, mat_cromo(), R, smusso=0.02)
        scatola("Moke griglia", L2 + 0.005, L2 + 0.025, -0.25, 0.25, 0.38, 0.64, GRIGLIA, R)
        for k in range(7):
            z = 0.395 + k * 0.034
            scatola(f"Moke lamella {k}", L2 + 0.02, L2 + 0.035, -0.24, 0.24, z, z + 0.014, BIANCO, R, smusso=0.004)
        # stemma MOKE sopra la griglia
        scatola("Moke stemma", L2 + 0.002, L2 + 0.014, -0.15, 0.15, 0.7, 0.75, NERO, R, smusso=0.004)
        for s in (1, -1):
            cilindro(f"Moke ghiera faro {s}", Vector((L2 + 0.02, s * 0.42, 0.63)), 0.115, 0.07, "x", mat_cromo(), R, lati=32, smusso=0.015)
            cilindro(f"Moke faro {s}", Vector((L2 + 0.052, s * 0.42, 0.63)), 0.095, 0.01, "x", FARO, R, lati=32)
            # frecce rettangolari arancioni sotto i parafanghi
            scatola(f"Moke freccia {s}", L2 - 0.02, L2 + 0.03, s * 0.6 - 0.07, s * 0.6 + 0.07, 0.56, 0.62, FRECCIA, R, smusso=0.012)
            cilindro(f"Moke stop {s}", Vector((-L2 - 0.01, s * 0.56, 0.52)), 0.05, 0.03, "x", STOP, R, lati=20, smusso=0.006)
            cilindro(f"Moke retro freccia {s}", Vector((-L2 - 0.01, s * 0.56, 0.4)), 0.035, 0.03, "x", FRECCIA, R, lati=16)
        # bull bar bianco: traversa bassa con i risvolti e l'arco sopra la griglia
        xb = L2 + 0.13
        tubo("Moke paraurti", [(xb - 0.14, -0.66, 0.33), (xb, -0.62, 0.33), (xb, 0.62, 0.33), (xb - 0.14, 0.66, 0.33)], 0.03, BIANCO, R)
        tubo("Moke arco bull bar", [(xb, -0.36, 0.33), (xb, -0.36, 0.55), (xb, -0.24, 0.64), (xb, 0.24, 0.64), (xb, 0.36, 0.55), (xb, 0.36, 0.33)], 0.026, BIANCO, R)
        for s in (1, -1):
            tubo(f"Moke attacco bull bar {s}", [(L2, s * 0.3, 0.33), (xb, s * 0.3, 0.33)], 0.02, BIANCO, R)
        tubo("Moke paraurti dietro", [(-L2 + 0.1, -0.66, 0.3), (-L2 - 0.06, -0.62, 0.3), (-L2 - 0.06, 0.62, 0.3), (-L2 + 0.1, 0.66, 0.3)], 0.026, BIANCO, R)
        # targa CT sul paraurti
        scatola("Moke targa", xb + 0.03, xb + 0.045, -0.2, 0.2, 0.2, 0.3, TARGA, R, smusso=0.004)
        scatola("Moke targa scritta", xb + 0.044, xb + 0.047, -0.16, 0.17, 0.23, 0.27, NERO, R)

    if "ruote" in fasi:
        for sx in (PASSO, -PASSO):
            for s in (1, -1):
                ruota(f"Moke ruota {sx:+.1f}{s:+d}", sx, s * CARR, RR, 0.17, CERCHIO, R, lato=s, cz=CZ)
        scorta = Vector((-L2 - 0.08, 0.0, 0.6))
        cilindro("Moke scorta gomma", scorta, 0.27, 0.16, "x", mat_gomma(), R, lati=40, smusso=0.08, segmenti=4)
        cilindro("Moke scorta cerchio", scorta + Vector((-0.07, 0, 0)), 0.165, 0.03, "x", CERCHIO, R, lati=32, smusso=0.01)
        cilindro("Moke scorta mozzo", scorta + Vector((-0.09, 0, 0)), 0.05, 0.03, "x", mat_cromo(), R, lati=20, smusso=0.008)

    if "interno" in fasi:
        # sedili blu a guscio, due davanti e il divanetto dietro
        for s in (1, -1):
            y0, y1 = (0.04, 0.44) if s > 0 else (-0.44, -0.04)
            scatola(f"Moke seduta {s}", -0.32, 0.1, y0, y1, 0.35, 0.52, SEDILE, R, smusso=0.05, segmenti=3)
            prisma(f"Moke schienale {s}", [(-0.47, 0.48), (-0.32, 0.48), (-0.38, 1.05), (-0.52, 1.05)], y0 + 0.02, y1 - 0.02, SEDILE, R, smusso=0.05, segmenti=3)
        scatola("Moke divanetto", -1.16, -0.8, -0.46, 0.46, 0.35, 0.54, SEDILE, R, smusso=0.05, segmenti=3)
        prisma("Moke schienale dietro", [(-1.33, 0.5), (-1.2, 0.5), (-1.24, 0.95), (-1.36, 0.95)], -0.46, 0.46, SEDILE, R, smusso=0.05, segmenti=3)
        scatola("Moke cruscotto", DAV - 0.16, DAV - 0.06, -0.47, 0.47, 0.72, 0.86, SCURO, R, smusso=0.02)
        tubo("Moke piantone", [(DAV - 0.1, 0.24, 0.8), (0.18, 0.24, 0.98)], 0.02, SCURO, R)
        tubo("Moke volante", [(0.18 + 0.15 * math.sin(math.radians(28)) * math.cos(a), 0.24 + 0.17 * math.sin(a), 0.98 + 0.15 * math.cos(math.radians(28)) * math.cos(a))
                              for a in [k * math.pi / 12 for k in range(25)]], 0.014, SCURO, R)

    if "capote" in fasi:
        # parabrezza col telaio grigio, due tergicristalli, specchietto sul montante
        zt = 1.36
        tubo("Moke telaio parabrezza", [(DAV - 0.02, -0.64, 0.87), (DAV - 0.06, -0.64, zt), (DAV - 0.06, 0.64, zt), (DAV - 0.02, 0.64, 0.87), (DAV - 0.02, -0.64, 0.87)], 0.022, TELAIO, R)
        prisma("Moke parabrezza", [(DAV - 0.025, 0.88), (DAV - 0.015, 0.88), (DAV - 0.055, zt - 0.02), (DAV - 0.065, zt - 0.02)], -0.62, 0.62, VETRO, R)
        for y in (-0.3, 0.12):
            tubo(f"Moke tergi {y}", [(DAV - 0.01, y, 0.9), (DAV - 0.035, y + 0.3, 1.02)], 0.008, SCURO, R)
        tubo("Moke braccio specchio", [(DAV - 0.03, 0.64, 1.05), (DAV - 0.04, 0.8, 1.07)], 0.01, TELAIO, R)
        scatola("Moke specchio", DAV - 0.07, DAV - 0.03, 0.76, 0.9, 1.0, 1.16, SCURO, R, smusso=0.015)
        # capote grigia aperta: solo il tetto di tela, retto da due archi; niente fiancate né telo dietro
        prisma("Moke capote", [(-L2 + 0.02, 1.34), (DAV - 0.04, zt - 0.01), (DAV - 0.02, zt + 0.05), (DAV - 0.2, zt + 0.09), (-1.3, zt + 0.1), (-L2, zt + 0.05)],
               -0.67, 0.67, TELA, R, smusso=0.035, segmenti=3)
        for x in (-0.62, -1.44):
            tubo(f"Moke arco {x}", [(x, -0.66, 0.62), (x, -0.66, zt + 0.02), (x, 0.66, zt + 0.02), (x, 0.66, 0.62)], 0.018, TELAIO, R)
    return R


# ---------------------------------------------------------------- l'utilitaria

def utilitaria(nome="Utilitaria", vernice="#c0392b"):
    """Utilitaria a due volumi e cinque porte, come le due auto disegnate nel piazzale:
    3,94 × 1,72 × 1,50 m, passo 2,5. Muso verso +X."""
    R = radice(nome)
    C = materiale(nome + " carrozzeria", srgb(vernice), rugosita=0.28, vernice=0.9)
    VETRI = materiale("Auto vetri", srgb("#1b252e"), rugosita=0.06, vernice=1.0)
    NERO = materiale("Plastica nera", srgb("#1f2125"), rugosita=0.6)
    CERCHIO = materiale("Cerchi lega", srgb("#b9bec3"), rugosita=0.28, metallo=0.9)
    FARO = materiale("Auto faro", srgb("#c9d3db"), rugosita=0.06, metallo=0.6, emissione=0.1)
    STOP = materiale("Auto fanale", srgb("#b3202a"), rugosita=0.2, emissione=0.2)
    TARGA = materiale("Targa", srgb("#f4f4f0"), rugosita=0.5)

    L2, W2, PASSO, RR = 1.97, 0.86, 1.25, 0.31
    ZB_ANT, ZB_POST = 0.93, 1.0          # linea di cintura davanti e dietro
    XA, XP = 0.95, -1.86                 # dove l'abitacolo poggia sul corpo
    XT_A, XT_P, ZT = 0.02, -1.74, 1.49   # tetto
    WB, WT = 0.8, 0.66                   # mezza larghezza dell'abitacolo in basso e in alto

    # corpo basso: muso arrotondato, cofano spiovente, cintura che sale verso la coda
    corpo = prisma(nome + " corpo", [(-L2, 0.34), (L2 - 0.1, 0.34), (L2, 0.46), (L2, 0.6), (L2 - 0.14, 0.76), (XA, ZB_ANT),
                                      (XP, ZB_POST), (-L2 + 0.03, 0.96), (-L2, 0.56)], -W2, W2, C, R, smusso=0.12, segmenti=5)
    for sx in (PASSO, -PASSO):
        for s in (1, -1):
            taglia(corpo, cilindro(nome + f" arco {sx:+.0f}{s:+d}", Vector((sx, s * 0.82, RR)), 0.37, 0.3, "y", None, R, lati=40))

    # abitacolo in tinta: tronco rastremato, i vetri ci stanno sopra come lastre
    bm = bmesh.new()
    quattro = [(XA, WB, ZB_ANT), (XP, WB, ZB_POST), (XT_P, WT, ZT), (XT_A, WT, ZT)]
    vv = [(bm.verts.new((x, -w, z)), bm.verts.new((x, w, z))) for x, w, z in quattro]
    for i in range(4):
        a, b = vv[i], vv[(i + 1) % 4]
        bm.faces.new((a[0], b[0], b[1], a[1]))
    bm.faces.new([v[0] for v in vv][::-1])
    bm.faces.new([v[1] for v in vv])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    serra = _oggetto(nome + " abitacolo", bm, C, R)
    smussa(serra, 0.07, 4)

    def punto(t_x, t_z, lato):
        """Punto sul fianco dell'abitacolo: t_z=0 cintura, 1 tetto; t_x=0 davanti, 1 dietro."""
        xb = XA + (XP - XA) * t_x
        xt = XT_A + (XT_P - XT_A) * t_x
        zb = ZB_ANT + (ZB_POST - ZB_ANT) * t_x
        return Vector((xb + (xt - xb) * t_z, lato * (WB + (WT - WB) * t_z + 0.006), zb + (ZT - zb) * t_z))

    def lastra(nome_l, pts, mat):
        bm = bmesh.new()
        bm.faces.new([bm.verts.new(p) for p in pts])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return _oggetto(nome_l, bm, mat, R)

    for s in (1, -1):
        # finestrini laterali: il vetro davanti e dietro, montante B nero in mezzo
        a = [punto(0.07, 0.1, s), punto(0.47, 0.1, s), punto(0.47, 0.86, s), punto(0.27, 0.86, s)]
        b = [punto(0.51, 0.1, s), punto(0.93, 0.1, s), punto(0.95, 0.8, s), punto(0.51, 0.86, s)]
        lastra(nome + f" vetro ant {s}", a, VETRI)
        lastra(nome + f" vetro post {s}", b, VETRI)
        lastra(nome + f" montante B {s}", [punto(0.47, 0.1, s), punto(0.51, 0.1, s), punto(0.51, 0.86, s), punto(0.47, 0.86, s)], NERO)

    def fronte(t_y, t_z, verso):
        """Punto sul parabrezza (verso=+1) o sul lunotto (verso=-1)."""
        if verso > 0:
            b, t = Vector((XA, WB, ZB_ANT)), Vector((XT_A, WT, ZT))
        else:
            b, t = Vector((XP, WB, ZB_POST)), Vector((XT_P, WT, ZT))
        p = b + (t - b) * t_z
        n = Vector((t.z - b.z, 0, -(t.x - b.x))).normalized() * verso
        if n.z < 0:
            n = -n
        return Vector((p.x, p.y * t_y, p.z)) + n * 0.006

    lastra(nome + " parabrezza", [fronte(-0.86, 0.06, 1), fronte(0.86, 0.06, 1), fronte(0.84, 0.9, 1), fronte(-0.84, 0.9, 1)], VETRI)
    lastra(nome + " lunotto", [fronte(-0.78, 0.22, -1), fronte(0.78, 0.22, -1), fronte(0.76, 0.88, -1), fronte(-0.76, 0.88, -1)], VETRI)

    # muso: griglia nera, fari affilati sugli spigoli, targa
    scatola(nome + " griglia", L2 - 0.03, L2 + 0.012, -0.42, 0.42, 0.4, 0.54, NERO, R, smusso=0.03)
    scatola(nome + " fascia bassa", -L2 - 0.01, L2 + 0.01, -W2 - 0.005, W2 + 0.005, 0.3, 0.36, NERO, R, smusso=0.02)
    for s in (1, -1):
        prisma(nome + f" faro {s}", [(L2 - 0.2, 0.7), (L2 - 0.1, 0.66), (L2 + 0.004, 0.6), (L2 + 0.004, 0.66), (L2 - 0.08, 0.75), (L2 - 0.22, 0.79)],
               s * 0.44 if s > 0 else -0.84, 0.84 if s > 0 else -0.44, FARO, R, smusso=0.02)
        # fanali verticali ai lati del portellone
        scatola(nome + f" fanale {s}", -L2 - 0.004, -L2 + 0.1, s * 0.73 - 0.12, s * 0.73 + 0.12, 0.66, 0.92, STOP, R, smusso=0.03)
        scatola(nome + f" specchietto {s}", 0.72, 0.88, s * 0.9 - 0.08, s * 0.9 + 0.08, 0.95, 1.07, C, R, smusso=0.03)
        for x in (0.12, -0.86):
            scatola(nome + f" maniglia {x} {s}", x, x + 0.13, s * (W2 + 0.004) - 0.01, s * (W2 + 0.004) + 0.01, 0.84, 0.86, NERO, R)
        for x in (-0.3, -1.3):
            scatola(nome + f" giunta {x} {s}", x, x + 0.008, s * (W2 + 0.002) - 0.004, s * (W2 + 0.002) + 0.004, 0.42, 0.9, NERO, R)
    scatola(nome + " targa ant", L2 + 0.012, L2 + 0.022, -0.26, 0.26, 0.37, 0.48, TARGA, R)
    scatola(nome + " targa post", -L2 - 0.022, -L2 - 0.012, -0.26, 0.26, 0.5, 0.61, TARGA, R)
    scatola(nome + " pianale", -1.75, 1.75, -0.72, 0.72, 0.22, 0.34, NERO, R)
    for sx in (PASSO, -PASSO):
        for s in (1, -1):
            ruota(nome + f" ruota {sx:+.0f}{s:+d}", sx, s * 0.74, RR, 0.2, CERCHIO, R, lato=s)
    return R


# ---------------------------------------------------------------- scena, luce, camera

def prepara_scena():
    sc = bpy.data.scenes.get(SCENA) or bpy.data.scenes.new(SCENA)
    bpy.context.window.scene = sc
    sc.render.engine = "CYCLES"
    # GPU se nelle Preferenze ce n'è una attiva (qui OptiX: ~0,7 s a fotogramma contro 6,4 della CPU)
    cp = bpy.context.preferences.addons["cycles"].preferences
    if cp.compute_device_type != "NONE" and any(d.use and d.type != "CPU" for d in cp.devices):
        sc.cycles.device = "GPU"
    sc.cycles.samples = 96
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.cycles.film_transparent_glass = False
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "AgX"
    try:
        sc.view_settings.look = "AgX - Base Contrast"
    except TypeError:
        pass
    sc.unit_settings.system = "METRIC"

    mondo = bpy.data.worlds.get("Veicoli cielo") or bpy.data.worlds.new("Veicoli cielo")
    mondo.use_nodes = True
    sfondo = next(n for n in mondo.node_tree.nodes if n.type == "BACKGROUND")
    sfondo.inputs["Color"].default_value = (*srgb("#a9c8e0"), 1)
    sfondo.inputs["Strength"].default_value = 0.9
    sc.world = mondo

    sole = bpy.data.objects.get("Sole")
    if not sole:
        sole = bpy.data.objects.new("Sole", bpy.data.lights.new("Sole", "SUN"))
        sc.collection.objects.link(sole)
    sole.data.energy = 3.6
    sole.data.color = srgb("#fff0d6")
    sole.data.angle = math.radians(6)
    sole.rotation_euler = SOLE.to_track_quat("Z", "Y").to_euler()

    terra = bpy.data.objects.get("Terra ombre")
    if not terra:
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=12)
        terra = _oggetto("Terra ombre", bm, None, None)
        if terra.name not in sc.collection.objects:
            pass
    terra.is_shadow_catcher = True
    # sempre orizzontale e non selezionabile: un clic nel viewport non deve poterla spostare
    terra.matrix_world = Matrix.Identity(4)
    terra.hide_select = True

    cam = bpy.data.objects.get("Camera sprite")
    if not cam:
        cam = bpy.data.objects.new("Camera sprite", bpy.data.cameras.new("Camera sprite"))
        sc.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    base = Matrix((ASSE_X, ASSE_Y, VISTA)).transposed()
    cam.matrix_world = Matrix.Translation(VISTA * 30) @ base.to_4x4()
    cam.data.clip_start = 1
    cam.data.clip_end = 80
    sc.camera = cam
    return sc


def inquadra(sc, larghezza_m, altezza_m, px_per_m, centro=(0.0, 0.0)):
    """Fotogramma di larghezza_m × altezza_m metri (nel piano dell'immagine) centrato sull'origine,
    spostato di centro=(dx, dy) metri lungo gli assi dell'immagine."""
    cam = sc.camera
    sc.render.resolution_x = round(larghezza_m * px_per_m)
    sc.render.resolution_y = round(altezza_m * px_per_m)
    sc.render.resolution_percentage = 100
    cam.data.ortho_scale = max(larghezza_m, altezza_m)
    cam.data.sensor_fit = "AUTO"
    base = Matrix((ASSE_X, ASSE_Y, VISTA)).transposed()
    o = ASSE_X * centro[0] + ASSE_Y * centro[1]
    cam.matrix_world = Matrix.Translation(o + VISTA * 30) @ base.to_4x4()


# ---------------------------------------------------------------- sprite

# Cosa si rende per il gioco: cartella, veicolo, tinta (None = quella del modello), angoli del gioco
# (radianti, a=0 muso verso +u, a cresce verso chi guarda) e fotogramma (larghezza, altezza, centro x, y
# in metri sul piano dell'immagine: contiene veicolo e ombra in ogni direzione). Le auto parcheggiate
# servono solo negli angoli dei livelli (LIVELLI in js/parcheggio.js).
GIRI = [
    ("moke", "Moke", None, [2 * math.pi * k / 64 for k in range(64)], (4.8, 2.6, 0.55, 0.65)),
    ("auto_rossa", "Utilitaria", "#d91e1e", [-math.pi / 2], (5.4, 2.8, 0.45, 0.65)),
    ("auto_bianca", "Utilitaria", "#e9ecef", [math.pi / 2], (5.4, 2.8, 0.45, 0.65)),
    ("auto_blu", "Utilitaria", "#2d5d8a", [-0.51], (5.4, 2.8, 0.45, 0.65)),
]
PX_PER_M = 96


def costruisci():
    """Scena, luce, camera e i due modelli."""
    sc = prepara_scena()
    moke()
    utilitaria("Utilitaria")
    return sc


def rendi(cartella, nome, da=0, a=None, campioni=64):
    """Rende i fotogrammi da..a (esclusa) del giro `nome` in <cartella>/<nome>/000.png, 001.png, ...
    e scrive ancora.txt («x y px_per_m» del pixel dove cade l'origine, poi gli angoli).
    A pezzi, perché ogni fotogramma prende qualche secondo e il collegamento MCP non deve restare
    bloccato troppo a lungo. Poi: python impacchetta.py <cartella>."""
    import os
    _, veicolo, tinta, angoli, (lx, ly, cx, cy) = next(g for g in GIRI if g[0] == nome)
    sc = bpy.context.scene
    ob = bpy.data.objects[veicolo]
    inquadra(sc, lx, ly, PX_PER_M, (cx, cy))
    sc.cycles.samples = campioni
    for radice_v in [o for o in sc.objects if o.parent is None and o.type == "EMPTY"]:
        mostra = radice_v == ob
        radice_v.hide_render = not mostra
        for figlio in radice_v.children_recursive:
            if figlio.display_type != "WIRE":   # le forme dei tagli booleani restano sempre nascoste
                figlio.hide_render = not mostra
    if tinta:
        bsdf = next(n for n in bpy.data.materials[veicolo + " carrozzeria"].node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        bsdf.inputs["Base Color"].default_value = (*srgb(tinta), 1.0)
    dir_giro = os.path.join(cartella, nome)
    os.makedirs(dir_giro, exist_ok=True)
    for k in range(da, len(angoli) if a is None else a):
        ob.rotation_euler = (0, 0, -angoli[k])   # il gioco è sinistrorso: v verso chi guarda = -Y
        sc.render.filepath = os.path.join(dir_giro, f"{k:03d}.png")
        bpy.ops.render.render(write_still=True)
    ob.rotation_euler = (0, 0, 0)
    # scala effettiva: la risoluzione è arrotondata, ortho_scale copre il lato più lungo
    r = max(sc.render.resolution_x, sc.render.resolution_y) / sc.camera.data.ortho_scale
    ax = sc.render.resolution_x / 2 - cx * r
    ay = sc.render.resolution_y / 2 + cy * r
    with open(os.path.join(dir_giro, "ancora.txt"), "w", encoding="utf-8") as f:
        f.write(f"{ax} {ay} {r}\n" + " ".join(repr(x) for x in angoli) + "\n")

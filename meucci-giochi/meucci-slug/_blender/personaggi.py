"""
Personaggi di Meucci Slug resi in Blender Cycles, nello stile cartoon 3D del foglio del Prof.

    blender -b --python-exit-code 1 -P personaggi.py -- --cosa precari --out <cartella>
    blender -b --python-exit-code 1 -P personaggi.py -- --cosa moke    --out <cartella>
    blender -b --python-exit-code 1 -P personaggi.py -- --cosa boss    --out <cartella>
poi: python impacchetta_personaggi.py <cartella>  (fogli in ../assets)

Ogni fotogramma si rende al doppio della cella del gioco e si rimpicciolisce impacchettando.
Precari: 4 pose × 3 righe (corridore, cecchino, avvocato), muso verso destra come nel gioco.
Moke: la Mini Moke vera del plesso (../../blender/veicoli.py) con la mitragliatrice sul roll-bar,
4 pose (ferma, spara, sperona, danneggiata). Boss: fotocopiatrice cingolata col Super-Ricorrista, 2 pose.
"""
import bpy, math, os, sys, importlib.util
from mathutils import Vector, Matrix

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, QUI)
import scenari as S  # noqa: E402  (helper di geometria, materiali e GPU)

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
COSA = argv[argv.index("--cosa") + 1] if "--cosa" in argv else "precari"
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.join(QUI, "out_personaggi")

col, box, cil, sfera, tubo = S.col, S.box, S.cil, S.sfera, S.tubo
PELLE = "#f1c4a0"


# ------------------------------------------------------------------ montaggio a pezzi con perno

def pezzo(ob, genitore, perno=(0, 0, 0)):
    """Il pezzo è costruito con il perno nell'origine: lo si sposta sul perno e lo si appende al genitore."""
    ob.parent = genitore
    ob.location = perno
    return ob


def radice(nome):
    r = bpy.data.objects.new(nome, None)
    bpy.context.scene.collection.objects.link(r)
    return r


def faccia(R, testa_z, r, disperato=True, occhiali=False):
    """Occhi, pupille, sopracciglia, naso e bocca sul lato +X della testa."""
    BIANCO = col("Occhio", "#ffffff", rough=0.2)
    NERO = col("Pupilla", "#111111", rough=0.2)
    for s in (-1, 1):
        e = sfera((r * 0.83, s * r * 0.36, testa_z + r * 0.12), r * 0.25, BIANCO, scala=(0.55, 1, 1.15))
        pezzo(e, R)
        p = sfera((r * 0.97, s * r * 0.34, testa_z + r * 0.1), r * 0.11, NERO)
        pezzo(p, R)
        ci = box(-r * 0.07, r * 0.07, -r * 0.2, r * 0.2, -r * 0.04, r * 0.04, col("Ciglio", "#2a1a12"))
        pezzo(ci, R, (r * 0.86, s * r * 0.36, testa_z + r * 0.46))
        ci.rotation_euler = (s * math.radians(18 if disperato else -8), 0, 0)
        if occhiali:
            g = tubo([(r * 0.98, s * r * 0.36 + r * 0.27 * math.cos(a), testa_z + r * 0.12 + r * 0.3 * math.sin(a)) for a in [k * math.pi / 8 for k in range(17)]], 0.008, col("Montatura", "#1a1a1a", metal=0.6, rough=0.3))
            pezzo(g, R)
    pezzo(sfera((r * 1.0, 0, testa_z - r * 0.12), r * 0.17, col("Naso", "#e8a888", rough=0.5)), R)
    bocca = sfera((r * 0.86, 0, testa_z - r * 0.5), r * 0.22, col("Bocca", "#5a1a1a", rough=0.4), scala=(0.45, 1.1, 0.7 if disperato else 0.3))
    pezzo(bocca, R)
    if disperato:
        pezzo(sfera((r * 0.93, 0, testa_z - r * 0.38), r * 0.12, col("Denti", "#ffffff"), scala=(0.4, 1.4, 0.4)), R)


def gamba(R, s, anca_z, lung, mat_pant, mat_scarpa):
    g = cil((0, 0, -lung), 0.055, lung, "z", mat_pant, lati=14)
    pezzo(g, R, (0, s * 0.075, anca_z))
    sc = box(-0.06, 0.12, -0.055, 0.055, -lung - 0.03, -lung + 0.045, mat_scarpa, bev=0.025)
    sc.parent = g
    return g


def braccio(R, s, spalla, lung, mat_manica, pelle=True):
    b = cil((0, 0, -lung), 0.045, lung, "z", mat_manica, lati=12)
    pezzo(b, R, spalla)
    if pelle:
        m = sfera((0, 0, -lung - 0.02), 0.05, col("Pelle", PELLE, rough=0.55))
        m.parent = b
    return b


# ------------------------------------------------------------------ i tre precari

def corridore():
    R = radice("Corridore")
    GIACCA = col("Giacca blu", "#22356b", rough=0.6)
    PANT = col("Pantaloni blu", "#1b2850", rough=0.7)
    SCARPE = col("Scarpe", "#141414", rough=0.35, coat=0.6)
    PELLE_M = col("Pelle", PELLE, rough=0.55)
    parti = {}
    parti["gs"] = gamba(R, 1, 0.36, 0.3, PANT, SCARPE)
    parti["gd"] = gamba(R, -1, 0.36, 0.3, PANT, SCARPE)
    busto = box(-0.11, 0.11, -0.15, 0.15, 0.33, 0.68, GIACCA, bev=0.05)
    pezzo(busto, R)
    pezzo(box(0.1, 0.118, -0.045, 0.045, 0.5, 0.67, col("Camicia", "#f4f4f0")), R)
    pezzo(box(0.115, 0.125, -0.018, 0.018, 0.47, 0.66, col("Cravatta", "#c1121f", rough=0.4)), R)
    parti["bs"] = braccio(R, 1, (0, 0.18, 0.65), 0.27, GIACCA)
    parti["bd"] = braccio(R, -1, (0, -0.18, 0.65), 0.27, GIACCA)
    # diploma arrotolato nella mano davanti (lato camera)
    d = cil((0.0, -0.12, -0.3), 0.035, 0.24, "y", col("Pergamena", "#f6f0dc", rough=0.7))
    d.parent = parti["bd"]
    nastro = cil((0.0, -0.01, -0.3), 0.04, 0.025, "y", col("Nastro", "#c1121f", rough=0.4))
    nastro.parent = parti["bd"]
    # foglio della domanda nell'altra mano
    f = box(0.02, 0.2, -0.005, 0.005, -0.38, -0.24, col("Foglio", "#ffffff", rough=0.8))
    f.parent = parti["bs"]
    pezzo(cil((0, 0, 0.66), 0.05, 0.06, "z", PELLE_M), R)
    tz, r = 0.92, 0.22
    pezzo(sfera((0, 0, tz), r, PELLE_M, seg=32), R)
    pezzo(sfera((-0.06, 0, tz + 0.04), r * 0.98, col("Capelli neri", "#1b1410", rough=0.7), seg=32, scala=(0.95, 1.04, 1.0)), R)
    faccia(R, tz, r, disperato=True)
    # tocco da laureato
    NERO = col("Tocco", "#141418", rough=0.5)
    pezzo(cil((-0.02, 0, tz + 0.15), 0.16, 0.08, "z", NERO), R)
    t = box(-0.2, 0.2, -0.2, 0.2, -0.01, 0.01, NERO, bev=0.005)
    pezzo(t, R, (-0.02, 0, tz + 0.24))
    t.rotation_euler = (0, math.radians(-8), math.radians(45))
    pezzo(tubo([(-0.02, 0, tz + 0.26), (-0.15, -0.14, tz + 0.25), (-0.17, -0.16, tz + 0.06)], 0.01, col("Nappa", "#2563eb", rough=0.5)), R)
    pezzo(sfera((-0.17, -0.16, tz + 0.04), 0.03, col("Nappa", "#2563eb", rough=0.5)), R)
    # goccia di sudore
    pezzo(sfera((0.1, -0.2, tz + 0.14), 0.025, col("Sudore", "#7dd3fc", rough=0.05, trasm=0.3), scala=(0.7, 0.7, 1.3)), R)
    parti["busto_oggetti"] = [o for o in R.children]
    return R, parti


def cecchino():
    R = radice("Cecchino")
    GIACCA = col("Giaccone", "#7a5230", rough=0.7)
    PANT = col("Pantaloni grigi", "#3b3d42", rough=0.75)
    SCARPE = col("Anfibi", "#2a1d14", rough=0.5)
    PELLE_M = col("Pelle", PELLE, rough=0.55)
    parti = {}
    parti["gs"] = gamba(R, 1, 0.36, 0.3, PANT, SCARPE)
    parti["gd"] = gamba(R, -1, 0.36, 0.3, PANT, SCARPE)
    pezzo(box(-0.12, 0.12, -0.16, 0.16, 0.32, 0.68, GIACCA, bev=0.05), R)
    pezzo(box(-0.13, 0.13, -0.17, 0.17, 0.4, 0.43, col("Cintura", "#2a1d14")), R)
    pezzo(cil((0, 0, 0.66), 0.05, 0.06, "z", PELLE_M), R)
    tz, r = 0.92, 0.22
    pezzo(sfera((0, 0, tz), r, PELLE_M, seg=32), R)
    pezzo(sfera((-0.07, 0, tz + 0.02), r * 0.95, col("Capelli castani", "#5a3a22", rough=0.7), seg=32, scala=(0.9, 1.05, 0.95)), R)
    faccia(R, tz, r, disperato=False)
    # berretto
    pezzo(sfera((-0.02, 0, tz + 0.1), r * 0.98, col("Berretto", "#556b2f", rough=0.7), seg=24, scala=(1, 1, 0.6)), R)
    pezzo(box(0.08, 0.3, -0.12, 0.12, tz + 0.1, tz + 0.13, col("Berretto", "#556b2f", rough=0.7), bev=0.02), R)
    # bazooka in spalla, dal lato della camera
    baz = radice("Bazooka")
    baz.parent = R
    baz.location = (0.05, -0.2, 0.72)
    VERDE = col("Bazooka", "#2f6b2e", rough=0.45, coat=0.3)
    GIALLO = col("Bande bazooka", "#e0b000", rough=0.4)
    for o in (cil((-0.3, 0, 0), 0.075, 0.78, "x", VERDE, lati=24),
              cil((-0.32, 0, 0), 0.085, 0.07, "x", GIALLO, lati=24),
              cil((0.41, 0, 0), 0.085, 0.07, "x", GIALLO, lati=24),
              cil((0.47, 0, 0), 0.062, 0.02, "x", col("Bocca bazooka", "#111111"), lati=20),
              box(-0.02, 0.06, -0.02, 0.02, -0.18, -0.05, col("Impugnatura", "#1a1a1a")),
              box(0.05, 0.16, -0.03, 0.03, 0.07, 0.12, col("Mirino", "#1a1a1a"))):
        o.parent = baz
    parti["bazooka"] = baz
    # braccia che reggono il bazooka
    parti["bd"] = braccio(R, -1, (0, -0.19, 0.64), 0.24, GIACCA)
    parti["bs"] = braccio(R, 1, (0, 0.19, 0.64), 0.24, GIACCA)
    parti["bd"].rotation_euler = (0, math.radians(-80), 0)
    parti["bs"].rotation_euler = (math.radians(-35), math.radians(-70), 0)
    # vampa e fumo (accesi solo nelle pose di sparo)
    vampa = [cil((0.48, 0, 0), 0.11, 0.28, "x", col("Vampa", "#ff8a10", emis=6.0, emis_hex="#ff9a20"), lati=16, r2=0.0),
             sfera((0.5, 0, 0), 0.09, col("Vampa centro", "#ffd060", emis=10.0))]
    fumo = [sfera((-0.45 - k * 0.12, 0.02 * k, 0.03 * k), 0.08 + k * 0.03, col("Fumo", "#b8b4ae", rough=1.0)) for k in range(3)]
    for o in vampa + fumo:
        o.parent = baz
    parti["vampa"], parti["fumo"] = vampa, fumo
    return R, parti


def avvocato():
    R = radice("Avvocato")
    TOGA = col("Toga", "#16161c", rough=0.55, coat=0.2)
    PANT = col("Pantaloni scuri", "#26262c", rough=0.7)
    SCARPE = col("Scarpe", "#141414", rough=0.35, coat=0.6)
    PELLE_M = col("Pelle", PELLE, rough=0.55)
    parti = {}
    parti["gs"] = gamba(R, 1, 0.3, 0.25, PANT, SCARPE)
    parti["gd"] = gamba(R, -1, 0.3, 0.25, PANT, SCARPE)
    pezzo(cil((0, 0, 0.22), 0.2, 0.48, "z", TOGA, lati=28, r2=0.15), R)
    pezzo(box(0.13, 0.15, -0.05, 0.05, 0.5, 0.66, col("Facciole", "#ffffff", rough=0.6)), R)
    pezzo(box(0.149, 0.152, -0.002, 0.002, 0.5, 0.64, col("Riga facciole", "#c9c9c9")), R)
    pezzo(cil((0, 0, 0.66), 0.05, 0.06, "z", PELLE_M), R)
    tz, r = 0.92, 0.22
    pezzo(sfera((0, 0, tz), r, PELLE_M, seg=32), R)
    GRIGIO = col("Capelli grigi", "#c9c9cc", rough=0.8)
    for s in (-1, 1):
        pezzo(sfera((-0.05, s * 0.17, tz + 0.02), 0.11, GRIGIO, scala=(1.2, 0.6, 1.0)), R)
    pezzo(sfera((-0.13, 0, tz + 0.05), 0.15, GRIGIO, scala=(0.7, 1.3, 1.0)), R)
    faccia(R, tz, r, disperato=False, occhiali=True)
    # baffi grigi
    pezzo(sfera((0.2, 0, tz - 0.06), 0.06, GRIGIO, scala=(0.5, 1.6, 0.5)), R)
    parti["bd"] = braccio(R, -1, (0, -0.19, 0.64), 0.26, TOGA)
    parti["bs"] = braccio(R, 1, (0, 0.19, 0.64), 0.26, TOGA)
    parti["bd"].rotation_euler = (0, math.radians(-75), 0)
    # stendardo-scudo rosso con l'oro, retto davanti
    sc = radice("Stendardo")
    sc.parent = R
    sc.location = (0.3, -0.06, 0.5)
    ROSSO = col("Stendardo", "#b3141c", rough=0.6)
    ORO = col("Oro", "#e2b23a", rough=0.3, metal=0.9)
    import bmesh
    bm = bmesh.new()
    prof = [(-0.2, 0.24), (0.2, 0.24), (0.2, -0.16), (0.0, -0.3), (-0.2, -0.16)]
    a = [bm.verts.new((0.0, y, z)) for y, z in prof]
    b = [bm.verts.new((0.035, y, z)) for y, z in prof]
    bm.faces.new(a[::-1])
    bm.faces.new(b)
    for i in range(5):
        j = (i + 1) % 5
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    S._ob("stendardo", bm, ROSSO, bev=0.006).parent = sc
    tubo([(0.04, y, z) for y, z in prof + [prof[0]]], 0.016, ORO).parent = sc
    box(0.035, 0.05, -0.08, 0.08, -0.03, 0.13, ORO, bev=0.004).parent = sc
    box(0.045, 0.055, -0.05, 0.05, 0.0, 0.1, ROSSO).parent = sc
    cil((-0.02, -0.24, 0.26), 0.012, 0.48, "y", ORO).parent = sc
    parti["scudo"] = sc
    # valigetta nell'altra mano
    v = box(-0.12, 0.12, -0.04, 0.04, -0.46, -0.28, col("Valigetta", "#6b4226", rough=0.4, coat=0.4), bev=0.02)
    v.parent = parti["bs"]
    return R, parti


# ------------------------------------------------------------------ luci e camera

def studio(larg, alt, centro_z, px_x, px_y, elev=6.0, centro_x=0.0):
    sc = bpy.context.scene
    sc.render.film_transparent = True
    sc.render.resolution_x = px_x
    sc.render.resolution_y = px_y
    sc.render.resolution_percentage = 100
    w = bpy.data.worlds.new("Studio")
    w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (*S.srgb("#9aa6b8"), 1)
    bg.inputs["Strength"].default_value = 0.55
    sc.world = w
    S.sole(42, 35, 3.2, "#fff1de", angolo=4)
    S.luce_area((-3, -3, 2.5), 3, 3, 300, "#c7d8ff", rot=(math.radians(60), 0, math.radians(-45)))
    S.luce_area((-1.5, 3, 2.0), 2, 2, 260, "#ffe2c4", rot=(math.radians(-60), 0, math.radians(200)))
    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    sc.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = max(larg, alt)
    cam.data.sensor_fit = "AUTO"
    e = math.radians(elev)
    d = Vector((0, math.cos(e), -math.sin(e)))
    u = Vector((0, math.sin(e), math.cos(e)))
    rot = Matrix((Vector((1, 0, 0)), u, -d)).transposed()
    cam.matrix_world = Matrix.Translation(Vector((centro_x, 0, 0)) + u * centro_z - d * 20) @ rot.to_4x4()
    cam.data.clip_end = 60
    sc.camera = cam
    return sc


def rendi(nome):
    sc = bpy.context.scene
    sc.render.filepath = os.path.join(OUT, nome + ".png")
    bpy.ops.render.render(write_still=True)


def nascondi(oggetti, si):
    for o in oggetti:
        o.hide_render = si
        for c in o.children_recursive:
            c.hide_render = si


# ------------------------------------------------------------------ precari

def fai_precari():
    # cella del gioco 64 px per ~1,3 unità; si rende a 256 px (4×) per l'antialias
    sc = studio(1.3, 1.3, 0.62, 256, 256)
    sc.cycles.samples = 64
    tipi = [("corridore", corridore), ("cecchino", cecchino), ("avvocato", avvocato)]
    costruiti = []
    for nome, f in tipi:
        R, parti = f()
        R.rotation_euler = (0, 0, math.radians(-30))
        costruiti.append((nome, R, parti))
    passo = [(32, 6, 0.0), (8, -8, 0.02), (-32, 6, 0.0), (-8, -8, 0.02)]
    for nome, R, parti in costruiti:
        for altro in costruiti:
            nascondi([altro[1]], altro[1] is not R)
        for k in range(4):
            if nome == "cecchino":
                parti["gs"].rotation_euler = (0, math.radians(18), 0)
                parti["gd"].rotation_euler = (0, math.radians(-16), 0)
                spara = k >= 2
                R.location = (0, 0, -0.012 if k % 2 else 0.0)
                parti["bazooka"].location = (0.05 - (0.05 if spara else 0.0), -0.2, 0.72)
                nascondi(parti["vampa"], not spara)
                nascondi(parti["fumo"], not spara)
                if spara:
                    for o in parti["vampa"]:
                        o.scale = (1.0 + 0.35 * (k - 2),) * 3
            else:
                g, b, bob = passo[k]
                parti["gs"].rotation_euler = (0, math.radians(g), 0)
                parti["gd"].rotation_euler = (0, math.radians(-g), 0)
                if nome == "corridore":
                    parti["bs"].rotation_euler = (0, math.radians(-g * 1.1), 0)
                    parti["bd"].rotation_euler = (0, math.radians(g * 1.1 - 20), 0)
                    R.rotation_euler = (0, math.radians(8), math.radians(-30))
                else:
                    parti["bs"].rotation_euler = (0, math.radians(-g * 0.6), 0)
                R.location = (0, 0, bob)
            rendi(f"precari_{nome}_{k}")


# ------------------------------------------------------------------ Moke armata

def fai_moke():
    spec = importlib.util.spec_from_file_location("veicoli", os.path.join(QUI, "..", "..", "blender", "veicoli.py"))
    V = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(V)
    # cella 160×96 del gioco = 4,2 × 2,52 m; le ruote toccano a 89/96 dell'altezza; si rende 2×
    sc = studio(4.2, 2.52, 2.52 * (89 / 96 - 0.5), 320, 192, elev=8, centro_x=0.05)
    sc.cycles.samples = 96
    M = V.moke()
    # mitragliatrice binata sul roll-bar e bandierina rossa
    GUN = col("Canna", "#1d2024", metal=0.8, rough=0.3)
    arma = radice("Arma")
    arma.location = (-0.62, 0, 1.55)
    for o in (box(-0.25, 0.25, -0.12, 0.12, 0.0, 0.18, GUN, bev=0.02),
              cil((0.2, -0.05, 0.11), 0.035, 0.75, "x", GUN, lati=12),
              cil((0.2, 0.05, 0.11), 0.035, 0.75, "x", GUN, lati=12),
              box(-0.1, 0.1, -0.2, -0.12, -0.1, 0.12, col("Caricatore", "#5a6b2e", rough=0.6)),
              cil((0, 0, -0.18), 0.05, 0.2, "z", GUN)):
        o.parent = arma
    vampa = [cil((0.95, 0, 0.11), 0.16, 0.45, "x", col("Vampa", "#ff8a10", emis=6.0, emis_hex="#ff9a20"), lati=16, r2=0.0),
             sfera((0.97, 0, 0.11), 0.1, col("Vampa centro", "#ffd060", emis=10.0))]
    for o in vampa:
        o.parent = arma
    tubo([(-1.45, 0.55, 0.6), (-1.45, 0.55, 2.2)], 0.012, col("Asta bandiera", "#c9ccd0", metal=0.9, rough=0.2))
    import bmesh
    bm = bmesh.new()
    vv = [bm.verts.new(v) for v in ((-1.45, 0.55, 2.2), (-1.0, 0.5, 2.08), (-1.45, 0.55, 1.95))]
    bm.faces.new(vv)
    S._ob("bandierina", bm, col("Bandierina", "#d62828", rough=0.6))
    # targa "DI RUOLO"
    fumo = [sfera((1.0 + k * 0.15, -0.1 + 0.05 * k, 1.0 + k * 0.25), 0.18 + k * 0.08, col("Fumo nero", "#3a3a3a", rough=1.0)) for k in range(4)]
    polvere = [sfera((-1.7 - k * 0.25, -0.3, 0.2 + k * 0.08), 0.18 + k * 0.07, col("Polvere", "#c9b79a", rough=1.0)) for k in range(4)]
    M.rotation_euler = (0, 0, math.radians(-14))
    arma.rotation_euler = (0, 0, math.radians(-14))
    pose = ["ferma", "spara", "sperona", "danneggiata"]
    for k, nome in enumerate(pose):
        nascondi(vampa, nome != "spara")
        nascondi(fumo, nome != "danneggiata")
        nascondi(polvere, nome != "sperona")
        M.rotation_euler = (0, math.radians(-3 if nome == "sperona" else 0), math.radians(-14))
        rendi(f"moke_{k}")


# ------------------------------------------------------------------ boss: fotocopiatrice cingolata

def fai_boss():
    # cella 220×170 (il gioco la disegna con la base a 165/170); si rende 2×
    sc = studio(4.4, 3.4, 3.4 * (165 / 170 - 0.5), 440, 340, elev=8)
    sc.cycles.samples = 96
    B = radice("Boss")
    GRIGIO = col("Scocca copiatrice", "#d9d6cc", rough=0.35, coat=0.4)
    SCURO = col("Plastica scura", "#2b2f36", rough=0.45)
    CING = col("Cingolo", "#1c1e22", rough=0.7)
    for o in (box(-1.6, 1.6, -0.8, 0.8, 0.0, 0.55, CING, bev=0.12),):
        o.parent = B
    for k in range(6):
        c = cil((-1.35 + k * 0.54, -0.82, 0.28), 0.24, 0.06, "y", col("Ruota cingolo", "#50555e", metal=0.6, rough=0.4), lati=24)
        c.parent = B
        cil((-1.35 + k * 0.54, -0.86, 0.28), 0.08, 0.04, "y", SCURO, lati=16).parent = B
    for k in range(22):
        box(-1.65 + k * 0.155, -1.58 + k * 0.155, -0.85, -0.8, 0.5, 0.58, CING).parent = B
    box(-1.3, 1.3, -0.65, 0.65, 0.55, 2.2, GRIGIO, bev=0.06).parent = B
    box(-1.32, 1.32, -0.67, 0.67, 1.05, 1.08, col("Fuga", "#9a978e")).parent = B
    box(-1.1, 1.1, -0.55, 0.55, 2.2, 2.45, SCURO, bev=0.04).parent = B
    box(-0.5, 0.5, -0.45, 0.45, 2.45, 2.5, col("Vetro piano", "#7fc8e0", rough=0.05, emis=0.8)).parent = B
    # vassoi della carta che sporgono a destra
    for k in range(2):
        v = box(1.3, 1.95, -0.45, 0.45, 1.3 + k * 0.35, 1.34 + k * 0.35, col("Vassoio", "#b9b6ae", rough=0.4))
        v.rotation_euler = (0, math.radians(-14), 0)
        v.parent = B
        box(1.32, 1.85, -0.4, 0.4, 1.34 + k * 0.35, 1.37 + k * 0.35, col("Carta", "#ffffff", rough=0.8)).parent = B
    # griglia, strisce di pericolo, display
    for k in range(6):
        box(-1.1, -0.45, -0.67, -0.65, 0.9 + k * 0.17, 0.95 + k * 0.17, SCURO).parent = B
    for k in range(6):
        st = box(-0.2 + k * 0.17, -0.12 + k * 0.17, -0.67, -0.65, 0.75, 1.0, col("Pericolo giallo", "#f2c200", rough=0.5))
        st.rotation_euler = (0, math.radians(25), 0)
        st.parent = B
    box(-0.3, 0.75, -0.66, -0.64, 0.73, 1.02, col("Pericolo nero", "#111111")).parent = B
    disp = box(-0.3, 0.9, -0.67, -0.65, 1.35, 1.85, col("Cornice display", "#111111"), bev=0.02)
    disp.parent = B
    schermo_err = box(-0.25, 0.85, -0.68, -0.67, 1.4, 1.8, col("Display nero", "#140404", emis=0.3))
    schermo_blocco = box(-0.25, 0.85, -0.68, -0.67, 1.4, 1.8, col("Display rosso", "#b31414", emis=3.0))
    t_err = S.scritta("ERR-04", 0.3, -0.69, 1.6, 0.26, col("LED rosso", "#ff3b30", emis=14.0), font=S.FONT_MONO, estrudi=0.0)
    t_blocco = S.scritta("BLOCCO!", 0.3, -0.69, 1.6, 0.24, col("Bianco insegna", "#ffffff", emis=6.0), estrudi=0.0)
    spia = sfera((1.05, -0.66, 1.6), 0.06, col("Spia gialla", "#ffd000", emis=10.0))
    spia2 = sfera((1.05, -0.66, 1.6), 0.06, col("Spia rossa", "#ff2020", emis=14.0))
    for o in (schermo_err, schermo_blocco, t_err, t_blocco, spia, spia2):
        o.parent = B
    # comignolo da cui esce il toner
    cil((-1.0, 0.2, 2.45), 0.12, 0.6, "z", SCURO).parent = B
    cil((-1.0, 0.2, 3.0), 0.18, 0.12, "z", SCURO, r2=0.22).parent = B
    # il Super-Ricorrista seduto in cima col megafono
    R, parti = avvocato()
    nascondi([parti["scudo"]], True)
    R.parent = B
    R.location = (0.2, 0.0, 2.5)
    R.scale = (1.1, 1.1, 1.1)
    R.rotation_euler = (0, 0, math.radians(-25))
    parti["gs"].rotation_euler = (0, math.radians(80), 0)
    parti["gd"].rotation_euler = (0, math.radians(80), 0)
    meg = cil((0.0, 0, 0), 0.05, 0.35, "x", col("Megafono", "#d62828", rough=0.4), lati=20, r2=0.15)
    meg.parent = parti["bd"]
    meg.location = (0.0, 0.0, -0.28)
    meg.rotation_euler = (0, math.radians(80), 0)
    scan = box(-0.55, -0.35, -0.7, -0.66, 0.6, 2.15, col("Raggio scanner", "#38bdf8", emis=12.0))
    scan.parent = B
    B.rotation_euler = (0, 0, math.radians(-12))
    B.scale = (0.84, 0.84, 0.84)
    for k in range(2):
        attacco = k == 1
        nascondi([schermo_err, t_err, spia], attacco)
        nascondi([schermo_blocco, t_blocco, spia2, scan], not attacco)
        rendi(f"boss_{k}")


def main():
    S.pulisci()
    os.makedirs(OUT, exist_ok=True)
    {"precari": fai_precari, "moke": fai_moke, "boss": fai_boss}[COSA]()


if __name__ == "__main__":
    main()

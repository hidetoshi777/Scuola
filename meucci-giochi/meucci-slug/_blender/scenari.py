"""
Scenari di Meucci Slug resi in Blender Cycles (come i fondali di Patty).

Si lancia da riga di comando, senza interfaccia:
    blender -b --python-exit-code 1 -P scenari.py -- --livello 1 --strato scena   --out <cartella>
    blender -b --python-exit-code 1 -P scenari.py -- --livello 1 --strato fondale --out <cartella>
Opzioni: --scala 1.5 (pixel del render per pixel del gioco), --campioni 96, --tex <cartella texture Poly Haven>.

Strato «scena»: la striscia del livello (4400 × 540 px del gioco), camera ortografica inclinata di TH
verso il basso, 1 metro = PPM px. Gli oggetti calpestabili stanno nel piano d'azione (y = 0) con il
piano di calpestio alla quota esatta della piattaforma del gioco (LEVELn_PLATFORMS in slug-game.js):
se cambiano le piattaforme nel JS, vanno cambiate anche qui e il render va rifatto.
Il cielo è trasparente: dietro c'è lo strato «fondale».

Strato «fondale»: Etna e città lontana con camera prospettica, largo W + (STAGE - W) * FAR_F px.
Scrive anche <out>/fondale<n>.json con il pixel della cima dell'Etna (fumo e lava li anima il gioco).

Texture e cieli: Poly Haven (CC0), scaricati da scarica_tex.py fuori dal repo.
"""
import bpy, bmesh, math, os, sys, json, random
from mathutils import Vector, Matrix

# ------------------------------------------------------------------ parametri
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(nome, default):
    return argv[argv.index(nome) + 1] if nome in argv else default
LIVELLO = int(arg("--livello", "1"))
STRATO = arg("--strato", "scena")
OUT = arg("--out", os.path.join(os.path.dirname(__file__), "out"))
SCALA = float(arg("--scala", "1.5"))
CAMPIONI = int(arg("--campioni", "96"))
TEX = arg("--tex", r"G:\Progetti_Blender\Meucci_Slug\tex")
BOZZA = "--bozza" in argv
SALVA_BLEND = "--blend" in argv

W, H = 960, 540
STAGE = 4400
FLOOR_Y = 440
PPM = 40.0                    # px del gioco per metro
TH = math.radians(9)          # inclinazione della camera verso il basso
FAR_F = 0.12                  # parallasse del fondale
FONT = r"C:\Windows\Fonts\arialbd.ttf"
FONT_IMPACT = r"C:\Windows\Fonts\impact.ttf"
FONT_MONO = r"C:\Windows\Fonts\consolab.ttf"

rnd = random.Random(LIVELLO * 101 + (7 if STRATO == "fondale" else 0))


def gx(px):
    """x del gioco (px) → metri."""
    return px / PPM


def gz(y):
    """y del gioco di un piano calpestabile nel piano d'azione → quota in metri."""
    return (FLOOR_Y - y) / PPM / math.cos(TH)


# ------------------------------------------------------------------ scena

def pulisci():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for tipo in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = tipo
        except TypeError:
            continue
        prefs.get_devices()
        gpu = [d for d in prefs.devices if d.type == tipo]
        if gpu:
            for d in prefs.devices:
                d.use = d.type == tipo
            break
    else:
        raise SystemExit("Nessuna GPU OptiX/CUDA: non rendo su CPU")
    sc.cycles.device = "GPU"
    sc.cycles.samples = 24 if BOZZA else CAMPIONI
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.view_settings.view_transform = "AgX"
    try:
        sc.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.image_settings.color_depth = "8"
    return sc


def srgb(hexa):
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(lin(int(hexa[i:i + 2], 16)) for i in (1, 3, 5))


_mat_cache = {}


def col(nome, hexa, rough=0.5, metal=0.0, emis=0.0, emis_hex=None, alpha=1.0, coat=0.0, trasm=0.0):
    if nome in _mat_cache:
        return _mat_cache[nome]
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*srgb(hexa), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Alpha"].default_value = alpha
    b.inputs["Transmission Weight"].default_value = trasm
    if emis:
        b.inputs["Emission Color"].default_value = (*srgb(emis_hex or hexa), 1)
        b.inputs["Emission Strength"].default_value = emis
    _mat_cache[nome] = m
    return m


def tex(nome, tid, metri=2.0, tinta=None, fac=0.0, rough_add=0.0, metal=0.0, nor=1.0, emis=0.0, emis_hex=None):
    """Materiale da texture Poly Haven proiettata a cubo in coordinate oggetto (= mondo: gli oggetti
    nascono con i vertici già in coordinate mondo), una ripetizione ogni `metri`."""
    if nome in _mat_cache:
        return _mat_cache[nome]
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    b = next(n for n in N if n.type == "BSDF_PRINCIPLED")
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / metri,) * 3
    L.new(tc.outputs["Object"], mp.inputs["Vector"])

    def img(suffisso, colore):
        p = os.path.join(TEX, f"{tid}_{suffisso}.jpg")
        if not os.path.exists(p):
            return None
        n = N.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(p, check_existing=True)
        n.image.colorspace_settings.name = "sRGB" if colore else "Non-Color"
        n.projection = "BOX"
        n.projection_blend = 0.25
        L.new(mp.outputs["Vector"], n.inputs["Vector"])
        return n

    d = img("diff", True)
    out = d.outputs["Color"]
    if tinta:
        mix = N.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = fac
        L.new(out, mix.inputs["A"])
        mix.inputs["B"].default_value = (*srgb(tinta), 1)
        out = mix.outputs["Result"]
    L.new(out, b.inputs["Base Color"])
    r = img("rough", False)
    if r:
        if rough_add:
            ma = N.new("ShaderNodeMath")
            ma.operation = "ADD"
            ma.use_clamp = True
            ma.inputs[1].default_value = rough_add
            L.new(r.outputs["Color"], ma.inputs[0])
            L.new(ma.outputs[0], b.inputs["Roughness"])
        else:
            L.new(r.outputs["Color"], b.inputs["Roughness"])
    nm = img("nor", False)
    if nm:
        nn = N.new("ShaderNodeNormalMap")
        nn.inputs["Strength"].default_value = nor
        L.new(nm.outputs["Color"], nn.inputs["Color"])
        L.new(nn.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Metallic"].default_value = metal
    if emis:
        b.inputs["Emission Color"].default_value = (*srgb(emis_hex), 1)
        b.inputs["Emission Strength"].default_value = emis
    _mat_cache[nome] = m
    return m


def _ob(nome, bm, mat, bev=0.0, liscio=False, camera=True, ombra=True):
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    if liscio:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(nome, me)
    if mat:
        me.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    if bev:
        mo = ob.modifiers.new("smusso", "BEVEL")
        mo.width = bev
        mo.segments = 2
        mo.limit_method = "ANGLE"
    ob.visible_camera = camera
    ob.visible_shadow = ombra
    return ob


def box(x0, x1, y0, y1, z0, z1, mat, bev=0.0, nome="box", **kw):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co = Vector((x0 + (v.co.x + 0.5) * (x1 - x0), y0 + (v.co.y + 0.5) * (y1 - y0), z0 + (v.co.z + 0.5) * (z1 - z0)))
    return _ob(nome, bm, mat, bev, **kw)


def cil(c, r, h, asse, mat, lati=24, nome="cil", r2=None, liscio=True, **kw):
    """Cilindro (o tronco di cono con r2) con la base nel punto c, lungo l'asse 'x'|'y'|'z'."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=lati, radius1=r, radius2=r if r2 is None else r2, depth=h)
    rot = {"z": Matrix.Identity(3), "x": Matrix.Rotation(math.pi / 2, 3, "Y"), "y": Matrix.Rotation(-math.pi / 2, 3, "X")}[asse]
    for v in bm.verts:
        v.co = rot @ (v.co + Vector((0, 0, h / 2))) + Vector(c)
    return _ob(nome, bm, mat, liscio=liscio, **kw)


def sfera(c, r, mat, seg=24, nome="sfera", scala=(1, 1, 1), **kw):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    for v in bm.verts:
        v.co = Vector((v.co.x * scala[0], v.co.y * scala[1], v.co.z * scala[2])) + Vector(c)
    return _ob(nome, bm, mat, liscio=True, **kw)


def tubo(punti, r, mat, lati=10, nome="tubo"):
    cu = bpy.data.curves.new(nome, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 2
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(punti) - 1)
    for p, q in zip(sp.points, punti):
        p.co = (*q, 1)
    ob = bpy.data.objects.new(nome, cu)
    cu.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def scritta(testo, x, y, z, size, mat, font=FONT, allinea="CENTER", estrudi=0.01, ruota=(90, 0, 0), nome="scritta"):
    """Testo rivolto verso la camera (faccia verso -Y), x = centro (o sinistra con allinea='LEFT')."""
    cu = bpy.data.curves.new(nome, "FONT")
    cu.body = testo
    cu.size = size
    cu.extrude = estrudi
    cu.align_x = allinea
    cu.align_y = "CENTER"
    try:
        cu.font = bpy.data.fonts.load(font, check_existing=True)
    except Exception:
        pass
    ob = bpy.data.objects.new(nome, cu)
    ob.location = (x, y, z)
    ob.rotation_euler = tuple(math.radians(a) for a in ruota)
    cu.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def luce_area(c, sx, sy, energia, hexa="#ffffff", rot=(0, 0, 0), nome="area"):
    l = bpy.data.lights.new(nome, "AREA")
    l.shape = "RECTANGLE"
    l.size, l.size_y = sx, sy
    l.energy = energia
    l.color = srgb(hexa)
    ob = bpy.data.objects.new(nome, l)
    ob.location = c
    ob.rotation_euler = rot
    bpy.context.scene.collection.objects.link(ob)
    return ob


def luce_punto(c, energia, hexa="#ffd9a0", raggio=0.15, nome="punto"):
    l = bpy.data.lights.new(nome, "POINT")
    l.energy = energia
    l.color = srgb(hexa)
    l.shadow_soft_size = raggio
    ob = bpy.data.objects.new(nome, l)
    ob.location = c
    bpy.context.scene.collection.objects.link(ob)
    return ob


def sole(elev, azim, energia, hexa, angolo=2.0):
    """azim: 0 = luce che arriva da davanti (dalla camera, -Y), 90 = da destra (+X)."""
    l = bpy.data.lights.new("Sole", "SUN")
    l.energy = energia
    l.color = srgb(hexa)
    l.angle = math.radians(angolo)
    ob = bpy.data.objects.new("Sole", l)
    e, a = math.radians(elev), math.radians(azim)
    verso_sole = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    ob.rotation_euler = verso_sole.to_track_quat("Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(ob)
    return ob


def mondo_cielo(elev, azim, forza=1.0, visibile=True, sole_disco=True):
    sc = bpy.context.scene
    w = bpy.data.worlds.new("Cielo")
    w.use_nodes = True
    N, L = w.node_tree.nodes, w.node_tree.links
    bg = next(n for n in N if n.type == "BACKGROUND")
    sk = N.new("ShaderNodeTexSky")
    for t in ("MULTIPLE_SCATTERING", "NISHITA", "HOSEK_WILKIE"):
        try:
            sk.sky_type = t
            break
        except TypeError:
            continue
    try:
        sk.sun_elevation = math.radians(elev)
        sk.sun_rotation = math.radians(azim)
        sk.sun_disc = sole_disco
        sk.altitude = 30
    except AttributeError:
        pass
    L.new(sk.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = forza
    sc.world = w
    return w


def mondo_hdri(nome, forza=1.0, rot=0.0):
    sc = bpy.context.scene
    w = bpy.data.worlds.new("HDRI")
    w.use_nodes = True
    N, L = w.node_tree.nodes, w.node_tree.links
    bg = next(n for n in N if n.type == "BACKGROUND")
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value = (0, 0, math.radians(rot))
    env = N.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(os.path.join(TEX, nome + ".hdr"))
    L.new(tc.outputs["Generated"], mp.inputs["Vector"])
    L.new(mp.outputs["Vector"], env.inputs["Vector"])
    L.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = forza
    sc.world = w
    return w


def camera_scena(sc):
    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    sc.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = STAGE / PPM
    cam.data.clip_start = 1
    cam.data.clip_end = 400
    d = Vector((0, math.cos(TH), -math.sin(TH)))
    u = Vector((0, math.sin(TH), math.cos(TH)))
    r = Vector((1, 0, 0))
    rot = Matrix((r, u, -d)).transposed()
    xc = STAGE / 2 / PPM
    vc = (FLOOR_Y - H / 2) / PPM
    cam.matrix_world = Matrix.Translation(r * xc + u * vc - d * 120) @ rot.to_4x4()
    sc.camera = cam
    sc.render.resolution_x = round(STAGE * SCALA)
    sc.render.resolution_y = round(H * SCALA)
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    return cam


def bloccaluce(x0, x1, y0, y1, z0, z1):
    """Parete invisibile alla camera che però fa ombra: chiude gli interni tagliati."""
    return box(x0, x1, y0, y1, z0, z1, col("Blocco", "#000000"), nome="bloccaluce", camera=False)


# ------------------------------------------------------------------ pezzi comuni

def tetto(x0, x1, z, y0, y1, notte=False):
    """Copertura piana vista di taglio: parapetto, condizionatori, antenne, pannelli solari."""
    PAR = tex("Parapetto" + (" notte" if notte else ""), "concrete_wall_008", 2.0, tinta="#b8b0a2" if not notte else "#7d808a", fac=0.35)
    box(x0, x1, y1 - 0.3, y1, z, z + 0.9, PAR, bev=0.02)
    box(x0, x1, y0, y0 + 0.25, z, z + 0.6, PAR, bev=0.02)
    box(x0 - 0.1, x1, y0 - 0.05, y1 + 0.05, z + 0.9, z + 0.98, tex("Copertina", "white_sandstone_blocks_02", 2.0, tinta="#e9e2d2", fac=0.3))
    BIANCO = col("Condizionatore", "#e4e6e2", rough=0.4)
    GRIGL = col("Griglia condiz", "#5a5f66", metal=0.6, rough=0.4)
    x = x0 + 3.0
    while x < x1 - 3:
        r = rnd.random()
        if r < 0.45:
            box(x, x + 1.0, 1.2, 2.0, z, z + 0.8, BIANCO, bev=0.03)
            cil((x + 0.5, 1.18, z + 0.4), 0.3, 0.02, "y", GRIGL, lati=24)
        elif r < 0.7:
            for k in range(3):
                box(x + k * 1.1, x + k * 1.1 + 1.0, 0.0, 2.4, z + 0.3, z + 0.35, col("Pannello solare", "#1b2a4a", rough=0.15, metal=0.5))
        elif r < 0.82:
            cil((x + 0.3, 2.4, z), 0.025, 3.0, "z", GRIGL, lati=6)
            for k in range(4):
                cil((x - 0.1, 2.4, z + 2.0 + k * 0.25), 0.012, 0.8 - k * 0.12, "x", GRIGL, lati=4)
        x += rnd.uniform(4.0, 8.0)


def mondo_notte(forza=1.0, stelle=True):
    """Cielo notturno a nodi: gradiente blu, alone caldo della città all'orizzonte, stelle."""
    sc = bpy.context.scene
    w = bpy.data.worlds.new("Notte")
    w.use_nodes = True
    N, L = w.node_tree.nodes, w.node_tree.links
    bg = next(n for n in N if n.type == "BACKGROUND")
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Generated"], sep.inputs["Vector"])
    ramp = N.new("ShaderNodeValToRGB")
    mr = N.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -0.05
    mr.inputs["From Max"].default_value = 0.6
    L.new(sep.outputs["Z"], mr.inputs["Value"])
    L.new(mr.outputs["Result"], ramp.inputs["Fac"])
    e = ramp.color_ramp.elements
    e[0].color = (*srgb("#4a2c3a"), 1)
    e[1].color = (*srgb("#03050f"), 1)
    m = e.new(0.12)
    m.color = (*srgb("#1a2142"), 1)
    out = ramp.outputs["Color"]
    if stelle:
        vor = N.new("ShaderNodeTexVoronoi")
        vor.inputs["Scale"].default_value = 260
        L.new(tc.outputs["Generated"], vor.inputs["Vector"])
        st = N.new("ShaderNodeMapRange")
        st.inputs["From Min"].default_value = 0.06
        st.inputs["From Max"].default_value = 0.0
        st.inputs["To Max"].default_value = 3.0
        L.new(vor.outputs["Distance"], st.inputs["Value"])
        alto = N.new("ShaderNodeMath")
        alto.operation = "MULTIPLY"
        L.new(st.outputs["Result"], alto.inputs[0])
        L.new(mr.outputs["Result"], alto.inputs[1])
        add = N.new("ShaderNodeMix")
        add.data_type = "RGBA"
        add.blend_type = "ADD"
        add.inputs["Factor"].default_value = 1.0
        L.new(out, add.inputs["A"])
        L.new(alto.outputs[0], add.inputs["B"])
        out = add.outputs["Result"]
    L.new(out, bg.inputs["Color"])
    bg.inputs["Strength"].default_value = forza
    sc.world = w
    return w


def foschia(hexa, forza, distanza):
    """Prospettiva aerea: ogni materiale sfuma verso il colore del cielo con la distanza dalla camera."""
    for m in bpy.data.materials:
        if not m.node_tree:
            continue
        nt = m.node_tree
        out = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None)
        if not out or not out.inputs["Surface"].links:
            continue
        src = out.inputs["Surface"].links[0].from_socket
        cd = nt.nodes.new("ShaderNodeCameraData")
        mul = nt.nodes.new("ShaderNodeMath")
        mul.operation = "MULTIPLY"
        mul.inputs[1].default_value = -1.0 / distanza
        nt.links.new(cd.outputs["View Distance"], mul.inputs[0])
        ex = nt.nodes.new("ShaderNodeMath")
        ex.operation = "EXPONENT"
        nt.links.new(mul.outputs[0], ex.inputs[0])
        inv = nt.nodes.new("ShaderNodeMath")
        inv.operation = "SUBTRACT"
        inv.inputs[0].default_value = 1.0
        nt.links.new(ex.outputs[0], inv.inputs[1])
        em = nt.nodes.new("ShaderNodeEmission")
        em.inputs["Color"].default_value = (*srgb(hexa), 1)
        em.inputs["Strength"].default_value = forza
        mix = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(inv.outputs[0], mix.inputs[0])
        nt.links.new(src, mix.inputs[1])
        nt.links.new(em.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], out.inputs["Surface"])



def banco_scuola(x, y, z, larg=0.9, prof=0.55, alto=0.76, ruota_su=False):
    LEGNO = tex("Piano banco", "wood_table_001", 1.2, tinta="#e8c896", fac=0.4)
    MET = col("Tubo banco", "#5a6470", rough=0.35, metal=0.8)
    box(x - larg / 2, x + larg / 2, y - prof / 2, y + prof / 2, z + alto - 0.035, z + alto, LEGNO, bev=0.008)
    box(x - larg / 2 + 0.03, x + larg / 2 - 0.03, y - prof / 2 + 0.05, y + prof / 2 - 0.05, z + alto - 0.14, z + alto - 0.035, col("Cassetto banco", "#3c4450", rough=0.6), bev=0.005)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cil((x + sx * (larg / 2 - 0.05), y + sy * (prof / 2 - 0.05), z), 0.018, alto - 0.035, "z", MET, lati=10)


def sedia(x, y, z, colore="#1f4fa8", verso=1):
    PLAST = col("Sedia " + colore, colore, rough=0.4, coat=0.3)
    MET = col("Tubo banco", "#5a6470", rough=0.35, metal=0.8)
    box(x - 0.22, x + 0.22, y - 0.22, y + 0.22, z + 0.43, z + 0.47, PLAST, bev=0.02)
    box(x - 0.22, x + 0.22, y + verso * 0.2, y + verso * 0.24, z + 0.5, z + 0.85, PLAST, bev=0.02)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cil((x + sx * 0.19, y + sy * 0.19, z), 0.012, 0.45, "z", MET, lati=8)


def palma(x, y, alt, piega=0.0, z=0.0):
    TRONCO = col("Tronco palma", "#6b5238", rough=0.9)
    FOGLIA = col("Foglia palma", "#2f5a2a", rough=0.6)
    seg = 10
    pts = []
    for k in range(seg + 1):
        t = k / seg
        pts.append(Vector((x + piega * t * t, y, z + alt * t)))
    for k in range(seg):
        a, b = pts[k], pts[k + 1]
        r = 0.22 - 0.07 * (k / seg)
        cil(tuple(a), r, (b - a).length + 0.02, "z", TRONCO, lati=10, r2=r * 0.85, nome="tronco")
    top = pts[-1]
    for k in range(13):
        ang = 2 * math.pi * k / 13 + rnd.uniform(-0.2, 0.2)
        lun = rnd.uniform(2.2, 3.2)
        dx, dy = math.cos(ang), math.sin(ang)
        bm = bmesh.new()
        n = 8
        vs = []
        for i in range(n + 1):
            t = i / n
            cx = top.x + dx * lun * t
            cy = top.y + dy * lun * t
            cz = top.z + 0.6 * math.sin(t * math.pi * 0.7) - 1.6 * t * t
            w_ = 0.42 * math.sin(math.pi * min(1, t * 1.15 + 0.05))
            px, py = -dy * w_, dx * w_
            vs.append((bm.verts.new((cx + px, cy + py, cz - 0.08 * t)), bm.verts.new((cx - px, cy - py, cz - 0.08 * t)), bm.verts.new((cx, cy, cz + 0.06))))
        for i in range(n):
            a, b = vs[i], vs[i + 1]
            bm.faces.new((a[0], b[0], b[2], a[2]))
            bm.faces.new((a[2], b[2], b[1], a[1]))
        _ob("fronda", bm, FOGLIA, liscio=True)
    sfera(tuple(top), 0.3, TRONCO, nome="cuore palma")


def lampione(x, y, z=0.0, alt=4.5, luce=0.0, hexa="#ffc47a"):
    MET = col("Ghisa", "#23272c", rough=0.45, metal=0.7)
    cil((x, y, z), 0.09, alt, "z", MET, lati=12, r2=0.06)
    cil((x, y, z), 0.16, 0.5, "z", MET, lati=12)
    tubo([(x, y, z + alt), (x + 0.5, y, z + alt + 0.25), (x + 0.75, y, z + alt + 0.1)], 0.035, MET)
    vetro = col("Lanterna " + hexa, hexa, rough=0.3, emis=8.0 if luce else 0.0)
    cil((x + 0.75, y, z + alt - 0.35), 0.15, 0.4, "z", vetro, lati=8, r2=0.2)
    if luce:
        luce_punto((x + 0.75, y - 0.3, z + alt - 0.5), luce, hexa, 0.2)


def finestra_facciata(x, y, z, larg, alt, vetro, cornice, persiane=None, aperta=0.0):
    box(x - larg / 2 - 0.12, x + larg / 2 + 0.12, y - 0.06, y, z - 0.12, z + alt + 0.12, cornice, bev=0.01)
    box(x - larg / 2, x + larg / 2, y - 0.02, y + 0.05, z, z + alt, vetro)
    box(x - larg / 2 - 0.18, x + larg / 2 + 0.18, y - 0.22, y, z - 0.2, z - 0.1, cornice, bev=0.01)
    if persiane:
        for s in (-1, 1):
            if s > 0 and aperta < 0.5:
                pass
            box(x + s * (larg / 2 + 0.02), x + s * (larg / 2 + 0.02 + larg / 2), y - 0.1, y - 0.06, z, z + alt, persiane, bev=0.01)


# ------------------------------------------------------------------ MISSIONE 1: piattaforme

def p_banchi(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    n = max(2, round((x1 - x0) / 0.95))
    passo = (x1 - x0) / n
    hl = top / 2
    for strato in range(2):
        for i in range(n):
            cx = x0 + passo * (i + 0.5) + (0.04 if strato else 0)
            banco_scuola(cx, 0.0, strato * hl, larg=passo * 0.97, prof=1.1, alto=hl)
    # sedie blu buttate davanti e sopra
    sedia(x0 + 0.4, -1.2, 0, verso=-1)
    sedia(x1 - 0.2, -0.9, 0, colore="#c0392b", verso=1)


def p_muretto(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    LAVA = tex("Pietra lavica", "stone_wall", 1.6, tinta="#4a4a52", fac=0.75, nor=1.4)
    BIANCO = tex("Copertina", "white_sandstone_blocks_02", 2.0, tinta="#e9e2d2", fac=0.3)
    box(x0, x1, -0.55, 0.55, 0, top - 0.16, LAVA, bev=0.02)
    box(x0 - 0.08, x1 + 0.08, -0.65, 0.65, top - 0.16, top, BIANCO, bev=0.02)
    rosa = col("Graffito rosa", "#ff4fa3", rough=0.6, emis=0.4)
    s = scritta("W IL RUOLO", (x0 + x1) / 2, -0.56, top * 0.45, 0.55, rosa, font=FONT_IMPACT, estrudi=0.0)
    s.rotation_euler = (math.radians(90), math.radians(-6), 0)
    erba = col("Erbacce", "#4d6b2a", rough=0.8)
    for k in range(8):
        cx = rnd.uniform(x0, x1)
        cil((cx, -0.62, 0), 0.05, rnd.uniform(0.15, 0.35), "z", erba, lati=5, r2=0.0)


def p_ponteggio(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    TUBO = col("Tubo ponteggio", "#9aa3ab", rough=0.3, metal=0.9)
    GIUNTO = col("Giunto", "#c79a2b", rough=0.4, metal=0.8)
    ASSE = tex("Tavola", "wood_floor", 1.5, tinta="#c49a5a", fac=0.3)
    ys = (-0.6, 0.6)
    xs = [x0 + 0.1, (x0 + x1) / 2, x1 - 0.1]
    for x in xs:
        for y in ys:
            cil((x, y, 0), 0.03, top, "z", TUBO, lati=10)
            box(x - 0.12, x + 0.12, y - 0.12, y + 0.12, 0, 0.02, GIUNTO)
    for z in (top * 0.5, top - 0.1):
        for y in ys:
            cil((x0, y, z), 0.028, x1 - x0, "x", TUBO, lati=8)
            for x in xs:
                sfera((x, y, z), 0.05, GIUNTO)
    tubo([(xs[0], -0.6, 0.1), (xs[1], -0.6, top * 0.5)], 0.025, TUBO)
    tubo([(xs[1], -0.6, top * 0.5), (xs[2], -0.6, top - 0.1)], 0.025, TUBO)
    for k in range(4):
        box(x0 - 0.05, x1 + 0.05, -0.7 + k * 0.35, -0.7 + k * 0.35 + 0.32, top - 0.05, top, ASSE, bev=0.01)
    # transenna bianco-rossa davanti
    for k in range(int((x1 - x0) / 0.5)):
        box(x0 + k * 0.5, x0 + k * 0.5 + 0.5, -1.0, -0.96, 0.55, 0.75, col("Transenna R" if k % 2 else "Transenna B", "#d62828" if k % 2 else "#f4f4f4", rough=0.4))
    for x in (x0 + 0.1, x1 - 0.1):
        box(x - 0.04, x + 0.04, -1.02, -0.94, 0, 0.8, col("Piede transenna", "#d62828"))
    # cartello del cantiere
    cx = (x0 + x1) / 2
    box(cx - 1.25, cx + 1.25, -0.68, -0.64, top * 0.55, top * 0.55 + 0.9, col("Cartello bianco", "#f6f3ea", rough=0.5), bev=0.01)
    box(cx - 1.25, cx + 1.25, -0.69, -0.67, top * 0.55 + 0.72, top * 0.55 + 0.9, col("Fascia blu", "#123a8c"))
    nero = col("Inchiostro", "#141414")
    scritta("CANTIERE PNRR", cx, -0.7, top * 0.55 + 0.5, 0.26, nero, estrudi=0.0)
    scritta("FINE LAVORI: MAI", cx, -0.7, top * 0.55 + 0.2, 0.2, col("Rosso scritta", "#c1121f"), estrudi=0.0)


def p_container(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    LAM = tex("Container", "rusty_corrugated_iron", 2.0, tinta="#c2461c", fac=0.55, metal=0.4, nor=1.6)
    box(x0, x1, -1.2, 1.2, 0, top, LAM, bev=0.03)
    tel = col("Telaio container", "#7a2a12", rough=0.5, metal=0.6)
    for x in (x0, x1 - 0.15):
        box(x, x + 0.15, -1.25, 1.25, 0, top, tel)
    box(x0, x1, -1.25, 1.25, top - 0.15, top, tel)
    box(x0, x1, -1.25, 1.25, 0, 0.15, tel)
    bianco = col("Vernice bianca", "#f0ede4", rough=0.6)
    scritta("MIM", x0 + 0.5, -1.22, top - 0.8, 0.9, bianco, font=FONT_IMPACT, allinea="LEFT", estrudi=0.0)
    for k, t in enumerate(("ARREDI DISMESSI", "BANCHI A ROTELLE", "LOTTO 2020")):
        scritta(t, x0 + 0.5, -1.22, top - 1.45 - k * 0.38, 0.27, bianco, font=FONT_MONO, allinea="LEFT", estrudi=0.0)
    # un banco a rotelle abbandonato davanti
    gial = col("Banco rotelle", "#e0e4e8", rough=0.4)
    box(x1 - 1.6, x1 - 0.8, -1.9, -1.4, 0.7, 0.74, gial, bev=0.01)
    cil((x1 - 1.2, -1.65, 0.05), 0.03, 0.65, "z", col("Tubo banco", "#5a6470", rough=0.35, metal=0.8))
    for k in range(5):
        a = 2 * math.pi * k / 5
        sfera((x1 - 1.2 + 0.3 * math.cos(a), -1.65 + 0.3 * math.sin(a), 0.05), 0.05, col("Ruota", "#1c1c1c"))


def p_cattedra(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    LEGNO = tex("Cattedra", "wood_table_001", 1.4, tinta="#8b5a2b", fac=0.5)
    PRED = tex("Predella", "wood_floor", 1.8, tinta="#6b4a2e", fac=0.4)
    hp = min(0.35, top * 0.25)
    box(x0 - 0.3, x1 + 0.3, -1.3, 1.3, 0, hp, PRED, bev=0.02)
    box(x0, x1, -0.7, 0.7, top - 0.08, top, LEGNO, bev=0.015)
    box(x0 + 0.05, x1 - 0.05, -0.62, -0.56, hp, top - 0.08, LEGNO, bev=0.01)  # pannello davanti
    for x in (x0 + 0.05, x1 - 0.55):
        box(x, x + 0.5, -0.6, 0.6, hp, top - 0.08, LEGNO, bev=0.01)
    # registro, penne e una tazzina
    box(x0 + 0.5, x0 + 1.0, -0.2, 0.15, top, top + 0.05, col("Registro", "#7b1e1e", rough=0.6), bev=0.005)
    cil((x1 - 0.6, 0.1, top), 0.05, 0.07, "z", col("Tazzina", "#f5f5f0", rough=0.2))
    sedia(x0 + (x1 - x0) * 0.6, 0.95, hp, colore="#2a2a2a", verso=1)


def p_distributore(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    m = (x0 + x1) / 2
    for k, (a, b, colore) in enumerate(((x0, m - 0.03, "#8c1d1d"), (m + 0.03, x1, "#1d3f8c"))):
        corpo = col("Distributore " + colore, colore, rough=0.35, coat=0.6)
        box(a, b, -0.45, 0.45, 0, top, corpo, bev=0.04)
        # vetrina illuminata
        vx0, vx1 = a + 0.12, b - 0.55
        box(vx0, vx1, -0.47, -0.44, 0.9, top - 0.25, col("Vetrina", "#dfe9ff", rough=0.05, emis=1.4, emis_hex="#eef4ff"))
        righe = 5
        for r in range(righe):
            z = 1.0 + r * (top - 1.4) / righe
            box(vx0, vx1, -0.49, -0.47, z - 0.03, z, col("Ripiano", "#6c7480", metal=0.6))
            n = int((vx1 - vx0) / 0.18)
            for i in range(n):
                c = ["#e63946", "#f4a261", "#2a9d8f", "#ffd166", "#8338ec", "#3a86ff"][(i + r + k) % 6]
                box(vx0 + 0.04 + i * 0.18, vx0 + 0.16 + i * 0.18, -0.5, -0.47, z, z + 0.22, col("Snack " + c, c, rough=0.4))
        # pulsantiera
        box(b - 0.5, b - 0.1, -0.48, -0.45, top * 0.45, top - 0.4, col("Pulsantiera", "#1b1f24", rough=0.4))
        box(b - 0.45, b - 0.15, -0.5, -0.48, top - 0.75, top - 0.55, col("Display", "#20e070", emis=3.0))
        box(a + 0.12, b - 0.1, -0.5, -0.45, 0.25, 0.6, col("Sportello", "#111418", rough=0.3))
    scritta("CAFFÈ", (x0 + m) / 2, -0.47, top - 0.12, 0.16, col("Bianco insegna", "#ffffff", emis=2.0), estrudi=0.0)
    scritta("SNACK", (m + x1) / 2, -0.47, top - 0.12, 0.16, col("Bianco insegna", "#ffffff", emis=2.0), estrudi=0.0)


def p_armadietti(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    MET = tex("Armadietto", "painted_metal_shutter", 1.0, tinta="#5d7a99", fac=0.6, metal=0.5)
    n = max(3, round((x1 - x0) / 0.6))
    w_ = (x1 - x0) / n
    file_ = 2
    hz = top / file_
    for r in range(file_):
        for i in range(n):
            a = x0 + i * w_
            box(a + 0.01, a + w_ - 0.01, -0.4, 0.4, r * hz + 0.01, (r + 1) * hz - 0.01, MET, bev=0.015)
            for s in range(5):
                z = (r + 1) * hz - 0.25 - s * 0.06
                box(a + 0.15, a + w_ - 0.15, -0.42, -0.4, z, z + 0.025, col("Feritoia", "#1d2733"))
            box(a + w_ - 0.15, a + w_ - 0.1, -0.44, -0.4, r * hz + hz * 0.45, r * hz + hz * 0.55, col("Maniglia", "#c9ccd0", metal=1, rough=0.2))
    # un armadietto aperto con i libri
    box(x0, x1, -0.42, 0.42, top - 0.02, top, col("Bordo armadietti", "#3f566e", metal=0.5))


def p_gradino(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    PIE = tex("Gradino", "terrazzo_tiles", 1.0, tinta="#d9d4c7", fac=0.25)
    box(x0, x1 + 0.3, -1.6, 1.6, 0, top, PIE, bev=0.01)
    box(x0, x1 + 0.3, -1.62, 1.62, top - 0.04, top, col("Paraspigolo", "#3b3f45", metal=0.6), bev=0.005)


def p_pianerottolo(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    PIE = tex("Gradino", "terrazzo_tiles", 1.0, tinta="#d9d4c7", fac=0.25)
    box(x0, x1, -1.6, 1.6, 0, top, PIE, bev=0.01)
    RING = col("Ringhiera", "#2c3e50", metal=0.7, rough=0.3)
    # corrimano che segue la scala, dietro
    tubo([(gx(3110), 1.5, gz(405) + 0.9), (x0, 1.5, top + 0.9), (x1, 1.5, top + 0.9)], 0.03, RING)
    for x in [gx(3110) + k * 0.3 for k in range(int((x1 - gx(3110)) / 0.3) + 1)]:
        zb = top if x > x0 else gz(405) + (gz(300) - gz(405)) * (x - gx(3110)) / (x0 - gx(3110))
        cil((x, 1.5, min(top, zb)), 0.012, 0.9, "z", RING, lati=6)
    # cartello verso l'aula 3 AM
    cart = col("Cartello verde", "#1b7a3c", rough=0.4, emis=0.5)
    box(x0 - 0.2, x0 + 2.3, 1.55, 1.6, top + 1.9, top + 2.4, cart, bev=0.01)
    scritta("AULA 3 AM ↑", x0 + 1.05, 1.54, top + 2.15, 0.28, col("Bianco insegna", "#ffffff", emis=2.0), estrudi=0.0)


def p_faldoni(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    PALL = tex("Bancale", "wood_floor", 1.2, tinta="#b08850", fac=0.4)
    box(x0, x1, -0.6, 0.6, 0, 0.15, PALL, bev=0.01)
    colori = ["#1f4e8c", "#8c1f1f", "#2e7d32", "#c9a227", "#5e3a8c", "#3d3d3d", "#c25e1f"]
    n = max(2, int((x1 - x0) / 0.38))
    w_ = (x1 - x0) / n
    z = 0.15
    hstrato = 0.36
    strati = max(1, round((top - 0.15) / hstrato))
    hs = (top - 0.15) / strati
    for s in range(strati):
        for i in range(n):
            c = colori[(i * 3 + s * 5) % len(colori)]
            a = x0 + i * w_ + rnd.uniform(-0.02, 0.02)
            box(a + 0.01, a + w_ - 0.01, -0.55, 0.55, z + s * hs, z + (s + 1) * hs - 0.005, col("Faldone " + c, c, rough=0.75), bev=0.01)
            box(a + w_ * 0.3, a + w_ * 0.7, -0.57, -0.55, z + s * hs + hs * 0.3, z + s * hs + hs * 0.7, col("Etichetta", "#efe9d8"))


PIATTAFORME_1 = [
    dict(x=380, y=350, w=140, t=p_banchi), dict(x=620, y=310, w=180, t=p_muretto),
    dict(x=920, y=340, w=160, t=p_ponteggio), dict(x=1200, y=310, w=200, t=p_container),
    dict(x=1750, y=360, w=160, t=p_cattedra), dict(x=2020, y=310, w=150, t=p_distributore),
    dict(x=2280, y=350, w=180, t=p_banchi), dict(x=2540, y=290, w=200, t=p_armadietti),
    dict(x=2850, y=340, w=190, t=p_cattedra),
    dict(x=3110, y=405, w=42, t=p_gradino), dict(x=3150, y=370, w=42, t=p_gradino),
    dict(x=3190, y=335, w=42, t=p_gradino), dict(x=3230, y=300, w=100, t=p_pianerottolo),
    dict(x=3640, y=360, w=170, t=p_faldoni), dict(x=3830, y=320, w=90, t=p_faldoni),
]


# ------------------------------------------------------------------ MISSIONE 1: ambiente

def ambiente_1():
    X_IN = gx(1600)        # inizia l'edificio tagliato (corridoio)
    X_ARCH = gx(3600)      # archivio
    X_END = gx(STAGE) + 2
    ASF = tex("Asfalto", "asphalt_02", 4.0, tinta="#4a4850", fac=0.55)
    box(-3, X_IN, -40, 13.0, -0.2, 0, ASF, nome="asfalto")
    # strisce del parcheggio e posto riservato (Moke a x = 1480)
    giallo = col("Striscia gialla", "#e8b923", rough=0.6)
    for x in (gx(1400), gx(1560)):
        box(x - 0.06, x + 0.06, -3.2, 1.8, 0, 0.005, giallo)
    box(gx(1400), gx(1560), -3.2, -3.08, 0, 0.005, giallo)
    scritta("RISERVATO PROF. BELLA · DI RUOLO", gx(1480), -2.4, 0.008, 0.32, giallo, ruota=(0, 0, 0), estrudi=0.0)
    # tombino
    cil((gx(520), -2.4, -0.01), 0.45, 0.03, "z", tex("Ghisa tombino", "metal_plate", 0.8, tinta="#3a3a3a", fac=0.7, metal=0.8), lati=32)
    # marciapiede e muretto di cinta con la cancellata
    MARC = tex("Marciapiede", "concrete_floor_02", 2.0, tinta="#c9c4b8", fac=0.3)
    box(-3, gx(1080), 5.0, 7.0, 0, 0.15, MARC)
    INT = tex("Intonaco muretto", "grey_plaster", 2.0, tinta="#d8cdb8", fac=0.35)
    box(-3, gx(1080), 6.0, 6.5, 0, 0.9, INT, bev=0.02)
    box(-3, gx(1080), 5.95, 6.55, 0.9, 1.0, tex("Copertina", "white_sandstone_blocks_02", 2.0, tinta="#e9e2d2", fac=0.3), bev=0.01)
    FERRO = col("Ferro battuto", "#1d2024", rough=0.4, metal=0.8)
    x = -3.0
    while x < gx(1080):
        cil((x, 6.25, 1.0), 0.02, 1.6, "z", FERRO, lati=6)
        sfera((x, 6.25, 2.62), 0.04, FERRO, seg=8)
        x += 0.16
    for z in (1.15, 2.4):
        cil((-3, 6.25, z), 0.025, gx(1080) + 3, "x", FERRO, lati=6)
    # pilastri del cancello con la targa
    for xp in (gx(30), gx(150)):
        box(xp - 0.35, xp + 0.35, 5.8, 6.7, 0, 3.0, INT, bev=0.03)
        box(xp - 0.42, xp + 0.42, 5.7, 6.8, 3.0, 3.15, tex("Copertina", "white_sandstone_blocks_02", 2.0, tinta="#e9e2d2", fac=0.3), bev=0.02)
    targa = col("Targa ottone", "#c9a24a", rough=0.3, metal=0.9)
    box(gx(30) - 0.3, gx(30) + 0.3, 5.75, 5.8, 1.6, 2.1, targa, bev=0.005)
    scritta("I.T. MEUCCI", gx(30), 5.74, 1.93, 0.1, col("Inchiostro", "#141414"), estrudi=0.0)
    scritta("ACIREALE", gx(30), 5.74, 1.78, 0.08, col("Inchiostro", "#141414"), estrudi=0.0)
    # palme in aiuola dietro la cancellata e davanti
    for (xp, alt, piega, y) in ((gx(240), 6.0, 0.6, 8.0), (gx(560), 5.0, -0.5, 9.0), (gx(1010), 6.4, 0.4, 8.5), (gx(120), 4.8, 0.3, 14), (gx(800), 5.4, -0.3, 16)):
        palma(xp, y, alt, piega)
    # strada e palazzi di Acireale dietro
    box(-3, gx(1100), 7.0, 13.0, -0.05, 0.002, tex("Strada", "asphalt_02", 4.0, tinta="#3a3940", fac=0.5))
    SIEPE = tex("Siepe", "leafy_grass", 1.2, tinta="#3f6b32", fac=0.6)
    box(-3, gx(1080), 7.2, 8.2, 0, 1.4, SIEPE, bev=0.25)
    for k, (xa, c) in enumerate(((gx(330), "#c0392b"), (gx(700), "#e9ecef"), (gx(960), "#2d5d8a"))):
        car = col("Auto " + c, c, rough=0.25, coat=0.9)
        box(xa, xa + 4.0, 9.5, 11.2, 0.35, 1.05, car, bev=0.15)
        box(xa + 0.9, xa + 3.0, 9.6, 11.1, 1.05, 1.6, col("Vetri auto", "#1b252e", rough=0.06), bev=0.12)
        for xw in (xa + 0.8, xa + 3.2):
            cil((xw, 9.45, 0.33), 0.33, 0.2, "y", col("Gomma", "#1a1a1c", rough=0.85), lati=20)
    # ---- facciata del Meucci (1080 - 1600)
    xf0, xf1 = gx(1080), X_IN
    GIALLO = tex("Intonaco Meucci", "yellow_plaster", 3.0, tinta="#e6c46a", fac=0.5)
    box(xf0, xf1 + 0.5, 3.0, 20, 0, 9.6, GIALLO, bev=0.04)
    box(xf0 - 0.2, xf1 + 0.5, 2.7, 20, 9.6, 10.0, tex("Cornicione", "white_sandstone_blocks_02", 2.0, tinta="#efe6d0", fac=0.3))
    box(xf0, xf1 + 0.5, 2.9, 3.0, 0, 0.8, tex("Zoccolo", "stone_wall", 1.6, tinta="#55545a", fac=0.7))
    vetro = col("Vetro Meucci", "#25313d", rough=0.06, metal=0.2)
    acceso = col("Finestra accesa Meucci", "#ffd28a", emis=4.0)
    for pz, zz in enumerate((1.5, 5.1)):
        for fx in range(4):
            xx = xf0 + 1.6 + fx * 3.0
            finestra_facciata(xx, 2.98, zz, 1.6, 2.2, acceso if (fx + pz) % 3 == 0 else vetro, col("Cornice pietra", "#efe6d0", rough=0.7), persiane=col("Persiana verde", "#2f5d3a", rough=0.6))
    # insegna al neon
    pann = col("Pannello insegna", "#0d1420", rough=0.4)
    box(xf0 + 0.6, xf1 - 0.4, 2.6, 2.8, 7.6, 8.7, pann, bev=0.03)
    neon = col("Neon azzurro", "#38bdf8", emis=14.0)
    scritta("ISTITUTO TECNICO MEUCCI", (xf0 + xf1) / 2 + 0.1, 2.55, 8.15, 0.62, neon, font=FONT_IMPACT, estrudi=0.02)
    luce_area(((xf0 + xf1) / 2, 1.6, 8.1), 9, 0.8, 120, "#38bdf8", rot=(math.radians(90), 0, 0))
    # bandiere
    for k, cols in enumerate((("#009246", "#f1f2f1", "#ce2b37"), ("#003399", "#003399", "#003399"))):
        xp = xf0 + 1.2 + k * 1.1
        cil((xp, 2.5, 7.0), 0.03, 3.6, "z", col("Asta", "#c9ccd0", metal=1, rough=0.2), lati=8)
        for i, c in enumerate(cols):
            bm = bmesh.new()
            vv = []
            for j in range(9):
                t = j / 8
                xx = xp + 0.4 * i + 0.4 * t
                yy = 2.5 - 0.12 * math.sin((i + t) * 2.2)
                vv.append((bm.verts.new((xx, yy, 10.55)), bm.verts.new((xx, yy, 9.75))))
            for j in range(8):
                bm.faces.new((vv[j][0], vv[j + 1][0], vv[j + 1][1], vv[j][1]))
            _ob("bandiera", bm, col("Bandiera " + c, c, rough=0.8), liscio=True)
        if k == 1:
            for s in range(12):
                a = 2 * math.pi * s / 12
                sfera((xp + 0.6 + 0.22 * math.cos(a), 2.4, 10.15 + 0.22 * math.sin(a)), 0.03, col("Stella", "#ffcc00", emis=1.0), seg=6)
    # pensilina d'ingresso
    box(xf1 - 3.4, xf1 + 0.2, -0.5, 3.0, 3.4, 3.6, col("Pensilina", "#b8b2a6", rough=0.5), bev=0.02)
    for xp in (xf1 - 3.2, xf1 - 0.1):
        cil((xp, -0.3, 0), 0.08, 3.4, "z", col("Pilastro pensilina", "#e9e5dc"), lati=16)

    # ---- edificio tagliato: corridoio (1600-3600) e archivio (3600-4400)
    TER = tex("Graniglia", "terrazzo_tiles", 1.6, tinta="#d9d2c4", fac=0.2)
    PARQ = tex("Parquet", "wood_floor", 2.2, tinta="#a0703d", fac=0.25)
    box(X_IN, X_ARCH, -40, 3.2, -0.2, 0, TER, nome="pavimento corridoio")
    box(X_ARCH, X_END, -40, 3.2, -0.2, 0, PARQ, nome="parquet")
    MURO = tex("Muro corridoio", "plastered_wall_02", 2.5, tinta="#efe7d6", fac=0.25)
    ZOCC = col("Zoccolatura", "#6f8f8a", rough=0.5)
    ZH = 7.4                       # soffitto
    box(X_IN, X_END, 3.2, 3.6, 0, ZH + 0.7, MURO, nome="muro di fondo")
    box(X_IN, X_ARCH, 3.18, 3.2, 0, 1.4, ZOCC)
    # solaio tagliato (sezione) e piano di sopra buio
    SOL = tex("Solaio", "concrete_wall_008", 2.0, tinta="#9a958c", fac=0.3)
    box(X_IN - 0.4, X_END, -1.6, 3.6, ZH, ZH + 0.7, SOL, nome="solaio")
    box(X_IN - 0.4, X_IN + 0.4, -1.6, 3.6, 0, ZH, MURO, nome="muro testata")
    bloccaluce(X_IN - 0.4, X_END, -40, -1.6, ZH, ZH + 0.7)
    bloccaluce(X_IN - 0.5, X_END, -30, -29, 0, ZH)
    bloccaluce(X_IN - 0.6, X_IN - 0.4, -40, 3.6, 0, ZH + 0.7)
    bloccaluce(X_IN - 0.4, X_END, -40, 3.6, ZH + 0.7, ZH + 0.8)
    tetto(X_IN - 0.4, X_END, ZH + 0.7, -1.6, 3.6)
    # porte delle aule lungo il corridoio
    PORTA = tex("Porta aula", "wood_table_001", 1.4, tinta="#7a4b26", fac=0.5)
    TELAIO = col("Telaio porta", "#59636e", metal=0.5, rough=0.4)
    targ = col("Targhetta", "#f2efe6")
    inch = col("Inchiostro", "#141414")
    for k, (px_, nome) in enumerate(((1690, "1 AM"), (2195, "2 AM"), (2480, "BIDELLI"), (2790, "AULA DOCENTI"), (3070, "PRESIDENZA"))):
        x = gx(px_)
        box(x - 0.65, x + 0.65, 3.05, 3.2, 0, 2.5, TELAIO, bev=0.01)
        box(x - 0.55, x + 0.55, 3.0, 3.1, 0, 2.4, PORTA, bev=0.01)
        sfera((x + 0.42, 2.98, 1.1), 0.05, col("Pomolo", "#d4d4d4", metal=1, rough=0.2))
        box(x - 0.45, x + 0.45, 3.0, 3.03, 2.6, 2.95, targ)
        scritta(nome, x, 2.99, 2.775, 0.18, inch, estrudi=0.0)
    # bacheche, estintore, termosifoni, sedie rosse, orologio
    for xx in (gx(1950), gx(2660), gx(2980)):
        box(xx - 1.0, xx + 1.0, 3.1, 3.2, 1.6, 2.8, tex("Sughero", "wood_floor", 0.6, tinta="#b98a52", fac=0.6), bev=0.02)
        for k in range(5):
            c = ["#ffffff", "#fff3a8", "#cfe8ff", "#ffd1dc", "#e8ffd1"][k]
            fx = xx - 0.8 + rnd.random() * 1.3
            fz = 1.75 + rnd.random() * 0.7
            box(fx, fx + 0.3, 3.08, 3.1, fz, fz + 0.4, col("Foglio " + c, c, rough=0.8))
    for xx in (gx(1880), gx(2400), gx(2930)):
        cil((xx, 2.95, 0.3), 0.11, 0.55, "z", col("Estintore", "#c1121f", rough=0.3, coat=0.5), lati=16)
        box(xx - 0.2, xx + 0.2, 3.05, 3.1, 1.1, 1.4, col("Cartello estintore", "#c1121f", emis=0.6))
    for xx in (gx(1820), gx(2330), gx(2720)):
        for k in range(9):
            box(xx + k * 0.13, xx + k * 0.13 + 0.09, 2.95, 3.12, 0.15, 0.85, col("Termosifone", "#e9e7e1", rough=0.35, metal=0.3), bev=0.01)
    for k in range(4):
        sedia(gx(2105) + k * 0.55, 2.6, 0, colore="#b3261e", verso=1)
    cil((gx(2600), 3.05, 3.6), 0.3, 0.06, "y", col("Orologio", "#f8f8f4", emis=0.3), lati=32)
    # neon a soffitto
    for xx in [X_IN + 2.5 + k * 5.0 for k in range(int((X_ARCH - X_IN - 2) / 5.0))]:
        box(xx - 1.2, xx + 1.2, 0.6, 1.0, ZH - 0.12, ZH, col("Plafoniera", "#d9dde2", metal=0.4))
        box(xx - 1.1, xx + 1.1, 0.65, 0.95, ZH - 0.15, ZH - 0.12, col("Neon bianco", "#f2f7ff", emis=10.0))
        luce_area((xx, 0.8, ZH - 0.2), 2.4, 0.5, 260, "#eef3ff")
    luce_area(((X_IN + X_ARCH) / 2, -6, 5.0), 40, 8, 1600, "#fff1dc", rot=(math.radians(60), 0, 0))
    # striscione d'ingresso
    STR = col("Striscione", "#f4f1e8", rough=0.8)
    box(X_IN + 0.5, X_IN + 9.5, 3.0, 3.05, 5.2, 6.4, STR)
    scritta("ENTRATA CORRIDOIO MEUCCI", X_IN + 5.0, 2.98, 6.0, 0.4, col("Rosso scritta", "#c1121f"), estrudi=0.0)
    scritta("ZONA DI RUOLO · VIETATO AI 60 CFU", X_IN + 5.0, 2.98, 5.5, 0.3, col("Blu scritta", "#123a8c"), estrudi=0.0)

    # ---- archivio GPS
    box(X_ARCH - 0.5, X_ARCH + 0.5, -1.6, 3.4, 0, ZH, tex("Pilastro", "concrete_wall_008", 2.0, tinta="#c9c2b4", fac=0.3), bev=0.03)
    SCAF = col("Scaffale", "#4b5560", metal=0.6, rough=0.4)
    colori = ["#1f4e8c", "#8c1f1f", "#2e7d32", "#c9a227", "#5e3a8c", "#3d3d3d", "#c25e1f", "#2a6f97"]
    xs = X_ARCH + 1.0
    while xs < X_END - 2:
        for zz in (0.3, 1.5, 2.7, 3.9, 5.1):
            box(xs, xs + 2.8, 2.4, 3.2, zz - 0.05, zz, SCAF)
            xx = xs + 0.05
            while xx < xs + 2.7:
                ww = rnd.uniform(0.08, 0.13)
                hh = rnd.uniform(0.85, 1.05)
                c = colori[rnd.randrange(len(colori))]
                box(xx, xx + ww - 0.01, 2.5, 3.15, zz, zz + hh, col("Faldone " + c, c, rough=0.75))
                xx += ww
        for xp in (xs, xs + 2.8):
            box(xp - 0.04, xp + 0.04, 2.4, 3.2, 0, 6.2, SCAF)
        xs += 3.2
    TAP = tex("Tappeto rosso", "linoleum_brown", 1.0, tinta="#9b1c1c", fac=0.85)
    box(X_ARCH + 0.5, X_END, -2.4, 1.4, 0, 0.02, TAP)
    for xx in (X_ARCH + 4, X_ARCH + 10, X_ARCH + 16):
        tubo([(xx, 0.8, ZH), (xx, 0.8, ZH - 1.6)], 0.01, col("Cavo", "#111111"))
        cil((xx, 0.8, ZH - 1.9), 0.4, 0.3, "z", col("Paralume", "#2d5a3d", rough=0.3, metal=0.4), lati=24, r2=0.08)
        sfera((xx, 0.8, ZH - 1.9), 0.1, col("Lampadina", "#ffd79a", emis=20.0))
        luce_punto((xx, 0.8, ZH - 2.1), 450, "#ffcf8a", 0.15)
    ins = col("Insegna archivio", "#2b0e0e", rough=0.4)
    box(X_ARCH + 1.0, X_ARCH + 16.0, 3.0, 3.1, ZH - 1.0, ZH - 0.3, ins, bev=0.02)
    scritta("ARCHIVIO GPS · UFFICIO DEL SUPER-RICORRISTA", X_ARCH + 8.5, 2.98, ZH - 0.65, 0.38, col("Oro insegna", "#ffcf5a", emis=6.0), estrudi=0.0)


# ------------------------------------------------------------------ MISSIONE 2: piattaforme

def p_arance(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    LEGNO = tex("Cassetta", "wood_floor", 0.8, tinta="#b98a4e", fac=0.4)
    ARANCIA = col("Arancia", "#f2700f", rough=0.55, coat=0.2)
    FOGLIA = col("Fogliolina", "#2f6b2a", rough=0.6)
    file_ = max(2, round(top / 0.55))
    hs = top / file_
    n = max(2, round((x1 - x0) / 0.95))
    w_ = (x1 - x0) / n
    for r in range(file_):
        for i in range(n):
            a = x0 + i * w_ + (0.05 if r % 2 else 0)
            z0 = r * hs
            box(a + 0.02, a + w_ - 0.02, -0.5, 0.5, z0, z0 + 0.05, LEGNO)
            for y in (-0.5, 0.46):
                for zz in (z0 + 0.08, z0 + hs - 0.14):
                    box(a + 0.02, a + w_ - 0.02, y, y + 0.04, zz, zz + 0.09, LEGNO)
            for x in (a + 0.02, a + w_ - 0.06):
                box(x, x + 0.04, -0.5, 0.5, z0, z0 + hs - 0.02, LEGNO)
            # arance che si vedono fra le stecche
            k = 0
            for xx in [a + 0.14 + j * 0.2 for j in range(int((w_ - 0.2) / 0.2))]:
                for yy in (-0.32, -0.08, 0.16, 0.36):
                    sfera((xx + rnd.uniform(-0.03, 0.03), yy, z0 + 0.15 + rnd.uniform(0, 0.04)), 0.095, ARANCIA, seg=12)
                    if r == file_ - 1 and rnd.random() < 0.3:
                        sfera((xx, yy, z0 + hs - 0.02), 0.09, ARANCIA, seg=12)
                    k += 1
            if r == 0:
                box(a + 0.15, a + w_ - 0.15, -0.53, -0.51, z0 + hs * 0.35, z0 + hs * 0.65, col("Etichetta arance", "#f6e7b0"))
                scritta("ARANCE", (a + a + w_) / 2, -0.535, z0 + hs * 0.5, 0.11, col("Rosso scritta", "#c1121f"), estrudi=0.0)
    for k in range(4):
        sfera((x0 + rnd.uniform(0, x1 - x0), -0.9 - rnd.random() * 0.6, 0.095), 0.095, ARANCIA, seg=12)
        sfera((x0 + rnd.uniform(0, x1 - x0), -0.9, 0.0), 0.04, FOGLIA, seg=6, scala=(1.6, 0.6, 0.3))


def p_chiosco(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    VERDE = col("Chiosco verde", "#1f5d3a", rough=0.35, coat=0.5)
    GHISA = col("Ghisa chiosco", "#173a26", rough=0.4, metal=0.6)
    MARMO = tex("Marmo banco", "white_sandstone_blocks_02", 1.0, tinta="#f1ece2", fac=0.2)
    box(x0 + 0.3, x1 - 0.3, -1.0, 1.0, 0, 1.15, VERDE, bev=0.03)
    box(x0 + 0.2, x1 - 0.2, -1.1, 1.1, 1.15, 1.25, MARMO, bev=0.02)
    for x in (x0 + 0.35, x1 - 0.35):
        for y in (-0.95, 0.95):
            cil((x, y, 1.25), 0.05, top - 1.9, "z", GHISA, lati=12)
    # cupoletta / tetto
    box(x0, x1, -1.3, 1.3, top - 0.65, top - 0.1, VERDE, bev=0.08)
    box(x0 - 0.1, x1 + 0.1, -1.4, 1.4, top - 0.1, top, col("Tetto chiosco", "#173a26", rough=0.4, metal=0.3), bev=0.03)
    box(x0 + 0.1, x1 - 0.1, -1.32, -1.3, top - 0.6, top - 0.15, col("Fascia insegna", "#f6efd9", emis=1.5, emis_hex="#fff2c8"))
    scritta("SELTZ · LIMONE E SALE", (x0 + x1) / 2, -1.34, top - 0.37, 0.24, col("Verde scritta", "#0f3d22"), estrudi=0.0)
    # bottiglie, limoni e la lampadina
    for k in range(8):
        cil((x0 + 0.6 + k * 0.3, 0.6, 1.25), 0.06, 0.32, "z", col("Sciroppo " + str(k % 3), ["#c1121f", "#f4a261", "#7cb518"][k % 3], rough=0.1, trasm=0.4), lati=12)
    for k in range(6):
        sfera((x0 + 0.8 + k * 0.25, -0.6, 1.33), 0.08, col("Limone", "#f4d03f", rough=0.5), seg=10, scala=(1.2, 1, 1))
    sfera(((x0 + x1) / 2, 0, top - 0.75), 0.1, col("Lampadina chiosco", "#ffe2a8", emis=25.0))
    luce_punto(((x0 + x1) / 2, -0.4, top - 0.9), 260, "#ffd28a", 0.1)


def p_autobus(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    BIANCO = col("Bus bianco", "#eef0ee", rough=0.3, coat=0.8)
    ARANCIO = col("Bus arancio", "#ea6a12", rough=0.3, coat=0.8)
    VETRO = col("Bus vetro", "#203040", rough=0.05, metal=0.3)
    INT = col("Bus interno acceso", "#ffe0a8", emis=2.0)
    zb = 0.45
    box(x0, x1, -1.25, 1.25, zb, top, BIANCO, bev=0.12)
    box(x0 - 0.02, x1 + 0.02, -1.27, -1.2, zb + 0.55, zb + 0.85, ARANCIO)
    # finestrini con l'interno acceso dietro
    n = 5
    for i in range(n):
        a = x0 + 1.4 + i * (x1 - x0 - 2.2) / n
        b = a + (x1 - x0 - 2.2) / n - 0.15
        box(a, b, -1.27, -1.2, zb + 1.1, top - 0.35, VETRO)
        box(a + 0.05, b - 0.05, -1.0, -0.95, zb + 1.15, top - 0.4, INT)
        if i % 2 == 0:
            sfera(((a + b) / 2, -0.6, zb + 1.35), 0.2, col("Passeggero", "#2a2a33", rough=0.7))
    box(x0 + 0.05, x0 + 1.2, -1.27, -1.2, zb + 0.9, top - 0.3, VETRO)  # porta anteriore
    box(x1 - 0.05, x1 + 0.03, -1.1, 1.1, zb + 1.0, top - 0.3, VETRO)    # parabrezza
    box(x0 + 0.1, x0 + 1.8, -1.28, -1.26, top - 0.3, top - 0.08, col("Display bus", "#111111"))
    scritta("1-4 · CENTRO", x0 + 0.95, -1.29, top - 0.19, 0.13, col("LED arancio", "#ffa21f", emis=8.0), font=FONT_MONO, estrudi=0.0)
    scritta("AMTS", x1 - 2.5, -1.29, zb + 0.35 + 0.35, 0.36, col("Blu AMTS", "#123a8c"), font=FONT_IMPACT, estrudi=0.0)
    for xw in (x0 + 1.5, x1 - 1.6):
        cil((xw, -1.32, 0.48), 0.48, 0.32, "y", col("Gomma", "#1a1a1c", rough=0.85), lati=32)
        cil((xw, -1.34, 0.48), 0.28, 0.05, "y", col("Cerchio bus", "#b8bcc2", metal=0.8, rough=0.3), lati=24)
    box(x1 - 0.02, x1 + 0.05, -1.05, -0.7, zb + 0.4, zb + 0.6, col("Faro bus", "#fff4d8", emis=8.0))
    box(x1 - 0.02, x1 + 0.05, 0.7, 1.05, zb + 0.4, zb + 0.6, col("Faro bus", "#fff4d8", emis=8.0))
    box(x0 + 0.3, x1 - 0.3, -1.0, 1.0, top, top + 0.2, col("Clima bus", "#d7dbdf", rough=0.4))


def p_panca(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    SED = col("Seduta attesa", "#2f6fa8", rough=0.35, coat=0.3)
    MET = col("Trave panca", "#9aa3ab", metal=0.9, rough=0.3)
    cil((x0, 0.0, top * 0.55), 0.04, x1 - x0, "x", MET, lati=10)
    n = max(3, round((x1 - x0) / 0.55))
    for i in range(n):
        a = x0 + i * (x1 - x0) / n
        b = a + (x1 - x0) / n - 0.05
        box(a, b, -0.3, 0.3, top - 0.06, top, SED, bev=0.03)
        box(a, b, 0.25, 0.32, top, top + 0.5, SED, bev=0.03)
    for x in (x0 + 0.2, x1 - 0.2):
        box(x - 0.04, x + 0.04, -0.25, 0.25, 0, top * 0.55, MET)


def p_bancone(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    LEG = tex("Bancone", "wood_table_001", 1.4, tinta="#c8b493", fac=0.4)
    box(x0, x1, -0.6, 0.6, 0, top - 0.06, LEG, bev=0.02)
    box(x0 - 0.1, x1 + 0.1, -0.7, 0.7, top - 0.06, top, col("Piano bancone", "#3d3f44", rough=0.3), bev=0.01)
    vetro = col("Plexiglass", "#e8f4ff", rough=0.02, trasm=1.0)
    box(x0 + 0.1, x1 - 0.1, 0.45, 0.5, top, top + 1.1, vetro)
    box(x0, x1, -0.62, -0.6, top * 0.55, top * 0.8, col("Fascia sportello", "#123a8c"))
    scritta("SPORTELLO 2", (x0 + x1) / 2, -0.63, top * 0.675, 0.28, col("Bianco insegna", "#ffffff", emis=1.0), estrudi=0.0)
    box(x0 + 1.0, x0 + 1.5, 0.0, 0.3, top, top + 0.35, col("Monitor", "#1a1a1a", rough=0.3))
    box(x0 + 1.03, x0 + 1.47, -0.01, 0.0, top + 0.05, top + 0.32, col("Schermo blu", "#3a7bd5", emis=3.0))


def p_schedari(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    MET = tex("Schedario", "painted_metal_shutter", 1.0, tinta="#8e979f", fac=0.6, metal=0.6)
    n = max(2, round((x1 - x0) / 0.8))
    w_ = (x1 - x0) / n
    for i in range(n):
        a = x0 + i * w_
        box(a + 0.01, a + w_ - 0.01, -0.5, 0.5, 0, top, MET, bev=0.02)
        cass = max(3, round(top / 0.55))
        for c in range(cass):
            z = c * top / cass
            box(a + 0.06, a + w_ - 0.06, -0.52, -0.5, z + 0.04, z + top / cass - 0.04, col("Cassetto", "#7b848c", metal=0.6, rough=0.35), bev=0.005)
            box(a + w_ / 2 - 0.12, a + w_ / 2 + 0.12, -0.56, -0.52, z + top / cass * 0.6, z + top / cass * 0.68, col("Maniglia", "#c9ccd0", metal=1, rough=0.2))
            box(a + w_ / 2 - 0.1, a + w_ / 2 + 0.1, -0.53, -0.52, z + top / cass * 0.3, z + top / cass * 0.45, col("Etichetta", "#efe9d8"))


def p_pec(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    CARTA = col("Carta", "#f4f2ec", rough=0.85)
    CARTA2 = col("Carta gialla", "#efe4c4", rough=0.85)
    SPAGO = col("Spago", "#8a6a3a", rough=0.9)
    n = max(2, round((x1 - x0) / 0.6))
    w_ = (x1 - x0) / n
    for i in range(n):
        a = x0 + i * w_
        z = 0
        k = 0
        while z < top - 0.01:
            h = min(rnd.uniform(0.22, 0.36), top - z)
            dx = rnd.uniform(-0.04, 0.04)
            box(a + 0.03 + dx, a + w_ - 0.03 + dx, -0.4, 0.4, z, z + h, CARTA if k % 2 == 0 else CARTA2, bev=0.01)
            box(a + w_ / 2 - 0.02 + dx, a + w_ / 2 + 0.02 + dx, -0.42, 0.42, z, z + h + 0.002, SPAGO)
            z += h
            k += 1
        box(a + 0.15, a + w_ - 0.15, -0.42, -0.41, top * 0.5, top * 0.5 + 0.22, col("Timbro PEC", "#c1121f", emis=0.3))
        scritta("PEC", a + w_ / 2, -0.43, top * 0.5 + 0.11, 0.14, col("Bianco insegna", "#ffffff", emis=1.0), estrudi=0.0)


def p_soppalco(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    ACC = col("Acciaio soppalco", "#3e4a56", metal=0.8, rough=0.35)
    GRIGL = tex("Grigliato", "metal_plate", 0.8, tinta="#7d8790", fac=0.5, metal=0.8)
    box(x0, x1, -1.2, 1.2, top - 0.25, top, GRIGL, bev=0.01)
    box(x0, x1, -1.25, -1.2, top - 0.45, top, ACC)
    for x in (x0 + 0.2, (x0 + x1) / 2, x1 - 0.2):
        box(x - 0.1, x + 0.1, 0.9, 1.1, 0, top - 0.25, ACC)
    RING = col("Ringhiera gialla", "#e0b000", rough=0.4, metal=0.5)
    tubo([(x0, 1.15, top + 1.0), (x1, 1.15, top + 1.0)], 0.03, RING)
    for x in [x0 + k * 0.5 for k in range(int((x1 - x0) / 0.5) + 1)]:
        cil((x, 1.15, top), 0.02, 1.0, "z", RING, lati=8)
    box(x0 + 0.5, x0 + 4.0, -1.27, -1.25, top - 0.42, top - 0.05, col("Cartello soppalco", "#f6f3ea"))
    scritta("ARCHIVIO PEC NON LETTE", x0 + 2.25, -1.28, top - 0.235, 0.17, col("Rosso scritta", "#c1121f"), estrudi=0.0)
    # faldoni sul soppalco, dietro
    for k in range(8):
        c = ["#1f4e8c", "#8c1f1f", "#2e7d32", "#c9a227"][k % 4]
        box(x0 + 0.5 + k * 0.4, x0 + 0.85 + k * 0.4, 0.4, 1.0, top, top + 0.8, col("Faldone " + c, c, rough=0.75), bev=0.01)


def p_rack(p):
    x0, x1, top = gx(p["x"]), gx(p["x"] + p["w"]), gz(p["y"])
    NERO = col("Rack", "#14171c", metal=0.6, rough=0.35)
    box(x0, x1, -0.6, 0.6, 0, top, NERO, bev=0.02)
    grid = col("Porta rack", "#22272e", metal=0.7, rough=0.4)
    box(x0 + 0.05, x1 - 0.05, -0.62, -0.6, 0.1, top - 0.1, grid)
    for z in [0.25 + k * 0.18 for k in range(int((top - 0.4) / 0.18))]:
        box(x0 + 0.15, x1 - 0.15, -0.64, -0.62, z, z + 0.12, col("Server", "#2d333b", metal=0.5, rough=0.4))
        for j in range(int((x1 - x0 - 0.4) / 0.12)):
            if rnd.random() < 0.55:
                c = rnd.choice(["#22d3ee", "#22c55e", "#22c55e", "#f59e0b", "#3b82f6"])
                box(x0 + 0.2 + j * 0.12, x0 + 0.24 + j * 0.12, -0.65, -0.64, z + 0.04, z + 0.08, col("LED " + c, c, emis=9.0))


PIATTAFORME_2 = [
    dict(x=430, y=375, w=120, t=p_arance), dict(x=620, y=320, w=150, t=p_chiosco),
    dict(x=1050, y=330, w=300, t=p_autobus), dict(x=1470, y=370, w=120, t=p_arance),
    dict(x=1850, y=404, w=180, t=p_panca), dict(x=2080, y=340, w=200, t=p_bancone),
    dict(x=2400, y=310, w=140, t=p_schedari), dict(x=2640, y=360, w=180, t=p_pec),
    dict(x=3000, y=250, w=260, t=p_soppalco), dict(x=3320, y=360, w=120, t=p_schedari),
    dict(x=3640, y=360, w=120, t=p_rack), dict(x=3830, y=320, w=90, t=p_rack),
]


def liotru(x, y):
    LAVA = tex("Lava liotru", "volcanic_rock_tiles", 1.0, tinta="#3a3a40", fac=0.8)
    BASALTO = col("Basalto lucido", "#24262b", rough=0.35)
    MARMO = tex("Marmo fontana", "white_sandstone_blocks_02", 1.2, tinta="#f2ede2", fac=0.2)
    # vasca e basamento
    cil((x, y, 0), 2.6, 0.6, "z", MARMO, lati=40)
    cil((x, y, 0.45), 2.4, 0.12, "z", col("Acqua", "#3d6f8a", rough=0.05, trasm=0.6), lati=40)
    box(x - 0.9, x + 0.9, y - 0.9, y + 0.9, 0.6, 2.6, MARMO, bev=0.05)
    box(x - 1.05, x + 1.05, y - 1.05, y + 1.05, 2.6, 2.8, MARMO, bev=0.03)
    # elefante
    z0 = 2.8
    sfera((x, y, z0 + 1.0), 1.0, BASALTO, scala=(1.35, 0.8, 0.8), nome="corpo elefante")
    sfera((x + 1.25, y, z0 + 1.35), 0.55, BASALTO, nome="testa elefante")
    for sx in (-0.75, 0.75):
        for sy in (-0.4, 0.4):
            cil((x + sx, y + sy, z0), 0.24, 0.9, "z", BASALTO, lati=16)
    tubo([(x + 1.65, y, z0 + 1.2), (x + 1.85, y, z0 + 0.7), (x + 1.8, y, z0 + 0.35), (x + 1.95, y, z0 + 0.25)], 0.12, BASALTO)
    for sy in (-0.42, 0.42):
        sfera((x + 1.1, y + sy, z0 + 1.45), 0.4, BASALTO, scala=(0.3, 1.0, 1.1), nome="orecchio")
    tubo([(x + 1.55, y - 0.2, z0 + 1.05), (x + 1.85, y - 0.25, z0 + 1.0)], 0.04, col("Zanna", "#f2efe6"))
    # gualdrappa e obelisco
    box(x - 0.6, x + 0.6, y - 0.82, y + 0.82, z0 + 1.6, z0 + 1.8, MARMO)
    cil((x, y, z0 + 1.8), 0.35, 0.3, "z", MARMO, lati=4)
    cil((x, y, z0 + 2.1), 0.26, 4.0, "z", LAVA, lati=4, r2=0.12, liscio=False)
    sfera((x, y, z0 + 6.2), 0.16, col("Globo ottone", "#c9a24a", metal=1, rough=0.25))
    tubo([(x, y, z0 + 6.3), (x, y, z0 + 6.9)], 0.02, col("Globo ottone", "#c9a24a", metal=1, rough=0.25))
    tubo([(x - 0.15, y, z0 + 6.7), (x + 0.15, y, z0 + 6.7)], 0.02, col("Globo ottone", "#c9a24a", metal=1, rough=0.25))
    luce_area((x, y - 3, 1.0), 2, 1, 300, "#ffd8a0", rot=(math.radians(-70), 0, 0))


def duomo(x0, x1, y):
    PIETRA = tex("Pietra Duomo", "white_sandstone_blocks_02", 2.0, tinta="#efe4cf", fac=0.25)
    LAVA = tex("Lava Duomo", "volcanic_rock_tiles", 1.4, tinta="#3c3c44", fac=0.8)
    xc = (x0 + x1) / 2
    box(x0, x1, y, y + 10, 0, 11, PIETRA, bev=0.05)
    box(x0 + 3, x1 - 3, y - 0.2, y + 10, 11, 18.5, PIETRA, bev=0.05)
    # timpano
    bm = bmesh.new()
    a = [bm.verts.new(v) for v in ((x0 + 2.6, y - 0.4, 18.5), (x1 - 2.6, y - 0.4, 18.5), (xc, y - 0.4, 21.5), (x0 + 2.6, y + 2, 18.5), (x1 - 2.6, y + 2, 18.5), (xc, y + 2, 21.5))]
    bm.faces.new((a[0], a[1], a[2]))
    bm.faces.new((a[3], a[5], a[4]))
    bm.faces.new((a[0], a[3], a[4], a[1]))
    bm.faces.new((a[1], a[4], a[5], a[2]))
    bm.faces.new((a[2], a[5], a[3], a[0]))
    _ob("timpano", bm, PIETRA)
    # colonne in granito e cornicioni
    for k in range(6):
        xx = x0 + 1.2 + k * (x1 - x0 - 2.4) / 5
        cil((xx, y - 0.5, 0.6), 0.45, 9.6, "z", col("Granito colonne", "#b9b2a6", rough=0.3), lati=24)
        box(xx - 0.6, xx + 0.6, y - 1.1, y + 0.1, 0, 0.6, PIETRA)
        box(xx - 0.6, xx + 0.6, y - 1.1, y + 0.1, 10.2, 10.6, PIETRA)
    box(x0 - 0.3, x1 + 0.3, y - 1.2, y, 10.6, 11.2, PIETRA, bev=0.03)
    for k in range(4):
        xx = x0 + 3.8 + k * (x1 - x0 - 7.6) / 3
        cil((xx, y - 0.4, 11.2), 0.32, 7.0, "z", col("Granito colonne", "#b9b2a6", rough=0.3), lati=20)
    box(x0 + 2.6, x1 - 2.6, y - 0.8, y, 18.2, 18.6, PIETRA)
    # portale con le porte di bronzo e il rosone
    box(xc - 1.6, xc + 1.6, y - 0.15, y, 0, 5.5, LAVA)
    box(xc - 1.2, xc + 1.2, y - 0.2, y - 0.1, 0, 4.8, col("Bronzo porta", "#5a3d1e", metal=0.7, rough=0.4))
    cil((xc, y - 0.3, 14.3), 1.3, 0.2, "y", LAVA, lati=40)
    cil((xc, y - 0.35, 14.3), 1.0, 0.1, "y", col("Rosone", "#ffcf7a", emis=4.0), lati=40)
    # cupola dietro
    cil((xc, y + 16, 11), 5.5, 8, "z", PIETRA, lati=48)
    sfera((xc, y + 16, 19), 5.5, tex("Cupola", "clay_roof_tiles", 1.6, tinta="#7d8a8f", fac=0.6), seg=48, scala=(1, 1, 0.9))
    cil((xc, y + 16, 23.8), 1.0, 2.2, "z", PIETRA, lati=24)
    sfera((xc, y + 16, 26.2), 0.9, PIETRA, seg=24)
    # campanile a destra
    box(x1 + 1, x1 + 6, y + 4, y + 9, 0, 28, PIETRA, bev=0.05)
    for zz in (16, 22):
        box(x1 + 2.2, x1 + 4.8, y + 3.9, y + 4.0, zz, zz + 3.5, col("Vano campana", "#1a1410"))
    cil((x1 + 3.5, y + 6.5, 28), 2.0, 5.0, "z", PIETRA, lati=8, r2=0.2, liscio=False)
    # luce di facciata dal basso (proiettori)
    for xx in (x0 + 2, xc, x1 - 2):
        luce_area((xx, y - 6, 0.5), 2.5, 1.0, 2500, "#ffcf8a", rot=(math.radians(-62), 0, 0))


def ambiente_2():
    X_UF = gx(1300)
    X_IN = gx(1700)
    X_SRV = gx(3500)
    X_END = gx(STAGE) + 2
    BAS = tex("Basolato lavico", "volcanic_rock_tiles", 2.2, tinta="#55545c", fac=0.6, nor=1.2)
    box(-3, X_IN, -40, 34, -0.2, 0, BAS, nome="basolato")
    # balaustra bassa della piazza
    MARMO = tex("Marmo balaustra", "white_sandstone_blocks_02", 1.2, tinta="#f2ede2", fac=0.2)
    box(-3, gx(1300), 6.5, 7.0, 0, 0.2, MARMO)
    box(-3, gx(1300), 6.45, 7.05, 0.95, 1.1, MARMO, bev=0.02)
    x = -3.0
    while x < gx(1300):
        cil((x, 6.75, 0.2), 0.09, 0.75, "z", MARMO, lati=12, r2=0.06)
        x += 0.32
    liotru(gx(880) / 1.0 + 0.0, 10.0)
    n0 = len(bpy.context.scene.objects)
    duomo(gx(120), gx(720), 22.0)
    perno = Vector(((gx(120) + gx(720)) / 2, 22.0, 0))
    S_ = Matrix.Translation(perno) @ Matrix.Scale(0.52, 4) @ Matrix.Translation(-perno)
    for o in list(bpy.context.scene.objects)[n0:]:
        o.matrix_world = S_ @ o.matrix_world
        if o.type == "LIGHT":
            o.data.energy *= 0.6
    # palazzi barocchi ai lati della piazza
    for (a, b, c) in ((gx(-40), gx(120), "#d9c7a6"), (gx(1000), gx(1300), "#cdb89a")):
        intonaco = tex("Palazzo " + c, "yellow_plaster", 3.0, tinta=c, fac=0.6)
        box(a, b, 16, 30, 0, 16, intonaco, bev=0.05)
        for pz in range(4):
            for fx in range(int((b - a - 1) / 2.4)):
                xx = a + 1.4 + fx * 2.4
                acc = rnd.random() < 0.45
                finestra_facciata(xx, 15.98, 1.6 + pz * 3.6, 1.1, 2.2, col("Finestra accesa", "#ffb35c", emis=6.0) if acc else col("Vetro notte", "#0e141c", rough=0.08), col("Cornice lava", "#3c3c44", rough=0.6))
    for xx in (gx(60), gx(400), gx(760), gx(1180)):
        lampione(xx, 5.5, 0, 4.8, luce=1400, hexa="#ffbf70")
    luce_area((gx(800), -10, 6.0), 40, 6, 2600, "#a9c0ff", rot=(math.radians(55), 0, 0))
    for xx in (gx(250), gx(900), gx(1400)):
        luce_punto((xx, -2.5, 5.5), 1600, "#ffc27a", 0.4)
    # ---- facciata dell'Ufficio Scolastico (1300 - 1700)
    CEM = tex("Cemento ufficio", "concrete_wall_008", 2.5, tinta="#8e959d", fac=0.4)
    box(X_UF, X_IN + 0.5, 3.0, 20, 0, 14, CEM, bev=0.04)
    for pz in range(4):
        for fx in range(3):
            xx = X_UF + 1.6 + fx * 2.8
            zz = 1.2 + pz * 3.3
            acc = (pz + fx) % 2 == 0
            box(xx - 1.1, xx + 1.1, 2.97, 3.02, zz, zz + 2.0, col("Finestra ufficio", "#8fd0ff", emis=3.0) if acc else col("Vetro notte", "#0e141c", rough=0.08))
            box(xx - 1.2, xx + 1.2, 2.9, 3.0, zz - 0.1, zz, col("Davanzale", "#d6d0c4"))
    box(X_UF + 0.3, X_IN - 0.2, 2.6, 2.85, 11.1, 12.1, col("Pannello insegna", "#0d1420", rough=0.4), bev=0.03)
    scritta("UFFICIO SCOLASTICO · CATANIA", (X_UF + X_IN) / 2, 2.57, 11.6, 0.52, col("Neon ciano", "#22d3ee", emis=14.0), font=FONT_IMPACT, estrudi=0.02)
    luce_area(((X_UF + X_IN) / 2, 1.4, 11.5), 9, 0.8, 140, "#22d3ee", rot=(math.radians(90), 0, 0))
    box(X_IN - 3.4, X_IN + 0.2, -0.5, 3.0, 3.4, 3.6, col("Pensilina", "#6f7680", rough=0.5), bev=0.02)

    # ---- interno ufficio e sala server (edificio tagliato)
    LINO = tex("Linoleum", "linoleum_brown", 1.6, tinta="#b9b4a6", fac=0.5)
    PAV = tex("Pavimento flottante", "metal_plate", 0.6, tinta="#5d6670", fac=0.5, metal=0.5)
    box(X_IN, X_SRV, -40, 3.2, -0.2, 0, LINO)
    box(X_SRV, X_END, -40, 3.2, -0.2, 0, PAV)
    MURO = tex("Muro ufficio", "grey_plaster", 2.5, tinta="#d9dbd5", fac=0.35)
    ZH = 7.8
    box(X_IN, X_END, 3.2, 3.6, 0, ZH + 0.7, MURO)
    SOL = tex("Solaio", "concrete_wall_008", 2.0, tinta="#9a958c", fac=0.3)
    box(X_IN - 0.4, X_END, -1.6, 3.6, ZH, ZH + 0.7, SOL)
    box(X_IN - 0.4, X_IN + 0.4, -1.6, 3.6, 0, ZH, MURO)
    bloccaluce(X_IN - 0.4, X_END, -40, -1.6, ZH, ZH + 0.7)
    bloccaluce(X_IN - 0.5, X_END, -30, -29, 0, ZH)
    bloccaluce(X_IN - 0.6, X_IN - 0.4, -40, 3.6, 0, ZH + 0.7)
    bloccaluce(X_IN - 0.4, X_END, -40, 3.6, ZH + 0.7, ZH + 0.8)
    tetto(X_IN - 0.4, X_END, ZH + 0.7, -1.6, 3.6, notte=True)
    # eliminacode
    x = gx(1772) + 1.4
    box(x - 1.6, x + 1.6, 3.05, 3.2, 3.0, 4.6, col("Display eliminacode", "#101010", rough=0.3), bev=0.03)
    led = col("LED rosso", "#ff3b30", emis=12.0)
    scritta("SERVIAMO  A 0001", x, 3.03, 4.1, 0.3, led, font=FONT_MONO, estrudi=0.0)
    scritta("IL TUO:   A 1100", x, 3.03, 3.5, 0.3, led, font=FONT_MONO, estrudi=0.0)
    box(x - 0.3, x + 0.3, 2.7, 3.1, 0, 1.4, col("Totem ticket", "#c9ccd0", metal=0.5, rough=0.3), bev=0.03)
    # cartello appeso dello sportello
    x = gx(2180)
    tubo([(x - 1.2, 0.5, ZH), (x - 1.2, 0.5, 6.2)], 0.008, col("Cavo", "#111111"))
    tubo([(x + 1.2, 0.5, ZH), (x + 1.2, 0.5, 6.2)], 0.008, col("Cavo", "#111111"))
    box(x - 1.6, x + 1.6, 0.45, 0.55, 5.4, 6.2, col("Cartello sportello", "#123a8c", rough=0.4), bev=0.02)
    scritta("SPORTELLO GPS", x, 0.44, 5.95, 0.28, col("Bianco insegna", "#ffffff", emis=2.0), estrudi=0.0)
    scritta("CHIUSO", x, 0.44, 5.6, 0.22, col("LED rosso", "#ff3b30", emis=12.0), estrudi=0.0)
    # avviso in bacheca
    x = gx(2680)
    box(x - 1.1, x + 1.1, 3.1, 3.2, 3.0, 4.8, tex("Sughero", "wood_floor", 0.6, tinta="#b98a52", fac=0.6), bev=0.02)
    box(x - 0.9, x + 0.9, 3.08, 3.1, 3.15, 4.65, col("Foglio avviso", "#fbfaf4", rough=0.8))
    inch = col("Inchiostro", "#141414")
    scritta("AVVISO", x, 3.07, 4.4, 0.2, col("Rosso scritta", "#c1121f"), estrudi=0.0)
    for k, t in enumerate(("LA GRADUATORIA È", "STATA PUBBLICATA", "...E RITIRATA")):
        scritta(t, x, 3.07, 4.0 - k * 0.28, 0.14, inch, estrudi=0.0)
    # vano ascensore (la pedana la disegna il gioco)
    xa0, xa1 = gx(2895), gx(2995)
    box(xa0 - 0.3, xa1 + 0.3, 2.6, 3.2, 0, ZH, col("Vano ascensore", "#2a3038", metal=0.4, rough=0.5))
    box(xa0, xa1, 2.55, 2.6, 0, ZH, col("Fondo vano", "#12161b", rough=0.6))
    for xx in (xa0 + 0.25, xa1 - 0.25):
        cil((xx, 2.5, 0), 0.03, ZH, "z", col("Guida ascensore", "#94a3b8", metal=0.9, rough=0.25))
    box(xa0 + 0.1, xa1 - 0.1, 2.54, 2.55, ZH - 1.2, ZH - 0.6, col("Targa portata", "#f6f3ea"))
    scritta("PORTATA MAX: 1 DOCENTE DI RUOLO", (xa0 + xa1) / 2, 2.53, ZH - 0.9, 0.09, inch, estrudi=0.0)
    # sedie d'attesa, piante, distributore acqua
    for k in range(5):
        sedia(gx(1735) + k * 0.6, 2.5, 0, colore="#2f6fa8", verso=1)
    for xx in (gx(2050), gx(2580), gx(3290)):
        cil((xx, 2.5, 0), 0.25, 0.5, "z", col("Vaso", "#c96f3b", rough=0.6), lati=20, r2=0.3)
        for k in range(9):
            a = 2 * math.pi * k / 9
            tubo([(xx, 2.5, 0.5), (xx + 0.5 * math.cos(a), 2.5 + 0.3 * math.sin(a), 1.3 + rnd.random() * 0.4)], 0.05, col("Foglia ficus", "#2f6b2a", rough=0.6))
    # neon a soffitto
    for xx in [X_IN + 2.5 + k * 5.0 for k in range(int((X_SRV - X_IN - 2) / 5.0))]:
        box(xx - 1.2, xx + 1.2, 0.6, 1.0, ZH - 0.12, ZH, col("Plafoniera", "#d9dde2", metal=0.4))
        box(xx - 1.1, xx + 1.1, 0.65, 0.95, ZH - 0.15, ZH - 0.12, col("Neon freddo", "#e8f0ff", emis=10.0))
        luce_area((xx, 0.8, ZH - 0.2), 2.4, 0.5, 240, "#e1ecff")
    luce_area(((X_IN + X_SRV) / 2, -6, 5.0), 40, 8, 1100, "#e8eeff", rot=(math.radians(60), 0, 0))
    # ---- sala server
    box(X_SRV - 0.5, X_SRV + 0.5, -1.6, 3.4, 0, ZH, tex("Pilastro", "concrete_wall_008", 2.0, tinta="#8c929a", fac=0.3), bev=0.03)
    xr = X_SRV + 1.2
    n0 = len(bpy.context.scene.objects)
    while xr < X_END - 1.5:
        p_rack(dict(x=xr * PPM, y=FLOOR_Y - 6.2 * PPM * math.cos(TH), w=1.0 * PPM))
        xr += 1.15
    sposta_rack_in_fondo(n0)
    box(X_SRV + 1.0, X_END - 1, 2.0, 2.1, ZH - 0.6, ZH - 0.4, col("Canalina", "#e0b000", rough=0.4))
    box(X_SRV + 1.0, X_SRV + 16.0, 3.0, 3.1, ZH - 1.0, ZH - 0.3, col("Pannello server", "#06140c", rough=0.4), bev=0.02)
    scritta("SALA SERVER · ALGORITMO NOMINE GPS", X_SRV + 8.5, 2.98, ZH - 0.65, 0.38, col("Verde terminale", "#22c55e", emis=10.0), font=FONT_MONO, estrudi=0.0)
    for xx in [X_SRV + 3 + k * 6 for k in range(4)]:
        box(xx - 1.2, xx + 1.2, 0.6, 1.0, ZH - 0.12, ZH, col("Plafoniera", "#d9dde2", metal=0.4))
        box(xx - 1.1, xx + 1.1, 0.65, 0.95, ZH - 0.15, ZH - 0.12, col("Neon blu", "#9cc8ff", emis=8.0))
        luce_area((xx, 0.8, ZH - 0.2), 2.4, 0.5, 200, "#8ab8ff")
    luce_area(((X_SRV + X_END) / 2, -6, 4.0), 20, 6, 500, "#7aa7ff", rot=(math.radians(60), 0, 0))


def sposta_rack_in_fondo(da_indice):
    """I rack di contorno della sala server, nati nel piano d'azione, vanno contro il muro."""
    for o in list(bpy.context.scene.objects)[da_indice:]:
        if o.type in ("MESH", "FONT", "CURVE"):
            o.location.y += 1.9


# ------------------------------------------------------------------ fondale (Etna e città)

def fondale(livello):
    sc = bpy.context.scene
    notte = livello == 2
    larg = round(W + (STAGE - W) * FAR_F)
    sc.render.resolution_x = round(larg * SCALA)
    sc.render.resolution_y = round(H * SCALA)
    sc.render.film_transparent = False
    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    sc.collection.objects.link(cam)
    cam.data.lens_unit = "FOV"
    cam.data.sensor_fit = "HORIZONTAL"
    cam.data.angle = math.radians(64)
    cam.data.clip_start = 5
    cam.data.clip_end = 200000
    cam.location = (0, 0, 60)
    cam.rotation_euler = (math.radians(90 + 3.0), 0, 0)
    sc.camera = cam
    # Etna: cono con le pendici a gobbe, a ~28 km
    ey = 28000
    ex = -2600 if livello == 1 else -5200
    bm = bmesh.new()
    n = 160
    R = 22000
    verts = {}
    for i in range(n + 1):
        for j in range(n + 1):
            xx = -R + 2 * R * i / n
            yy = -R + 2 * R * j / n
            r = math.hypot(xx, yy)
            h = 3300 * max(0.0, 1 - r / R) ** 1.55
            h += 120 * math.sin(xx / 1300) * math.cos(yy / 1700) * (1 - min(1, r / R))
            if r < 900:
                h -= (900 - r) * 0.35       # cratere
            # Montagnola e coni laterali
            for (cx, cy, hh, rr) in ((4200, -2500, 380, 1800), (-6500, -1500, 260, 1500), (9000, 2000, 300, 2200)):
                d = math.hypot(xx - cx, yy - cy)
                if d < rr:
                    h += hh * (1 - d / rr) ** 1.4
            verts[i, j] = bm.verts.new((ex + xx, ey + yy, h))
    for i in range(n):
        for j in range(n):
            bm.faces.new((verts[i, j], verts[i + 1, j], verts[i + 1, j + 1], verts[i, j + 1]))
    etna = _ob("Etna", bm, None, liscio=True)
    m = bpy.data.materials.new("Etna")
    m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    b = next(x for x in N if x.type == "BSDF_PRINCIPLED")
    tc = N.new("ShaderNodeTexCoord")
    sx = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Object"], sx.inputs["Vector"])
    noise = N.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 0.0012
    noise.inputs["Detail"].default_value = 8
    L.new(tc.outputs["Object"], noise.inputs["Vector"])
    add = N.new("ShaderNodeMath")
    add.operation = "MULTIPLY_ADD"
    L.new(noise.outputs["Fac"], add.inputs[0])
    add.inputs[1].default_value = 700
    L.new(sx.outputs["Z"], add.inputs[2])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "LINEAR"
    mapr = N.new("ShaderNodeMapRange")
    mapr.inputs["From Min"].default_value = 0
    mapr.inputs["From Max"].default_value = 4000
    L.new(add.outputs[0], mapr.inputs["Value"])
    L.new(mapr.outputs["Result"], ramp.inputs["Fac"])
    els = ramp.color_ramp.elements
    els[0].position = 0.0
    els[0].color = (*srgb("#2e3a24" if not notte else "#151a14"), 1)
    els[1].position = 0.55
    els[1].color = (*srgb("#4a3a33" if not notte else "#211a1a"), 1)
    e = els.new(0.64)
    e.color = (*srgb("#5a4c48" if not notte else "#2a2428"), 1)
    e = els.new(0.70)
    e.color = (*srgb("#f4f1ee"), 1)
    L.new(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.85
    etna.data.materials.append(m)
    # colata di lava (di notte) sul fianco
    if notte:
        lava = col("Lava", "#ff5a14", emis=60.0, emis_hex="#ff6a1a")
        for k, (dx, giri) in enumerate(((-300, 1.0), (700, 0.7))):
            pts = []
            for i in range(40):
                t = i / 39
                xx = ex + dx * t + 260 * math.sin(t * 9 * giri + k)
                yy = ey - 400 - t * 12000 * giri
                r = math.hypot(xx - ex, yy - ey)
                hh = 3300 * max(0.0, 1 - r / R) ** 1.55 + 40
                pts.append((xx, yy, hh))
            tubo(pts, 90 - k * 30, lava)
        sfera((ex, ey, 3150), 500, col("Bocca", "#ff7a2a", emis=80.0), seg=16, scala=(1, 1, 0.3))
    # cima, per il fumo del gioco
    cima = Vector((ex + 150, ey - 300, 3350))
    # pianura, costa e città (palazzi bassi a distanza crescente)
    terra = col("Campagna", "#3d4a2c" if not notte else "#0c0f0b", rough=0.9)
    box(-60000, 60000, 300, 60000, -5, 0, terra, nome="pianura")
    palette = ["#e3c08a", "#d99a6a", "#cdb894", "#efdcb2", "#b8805e", "#e6d1a6"] if not notte else ["#4a4250", "#3d3848", "#524858"]
    acceso = col("Finestre città", "#ffb35c", emis=6.0 if not notte else 18.0)
    for fila, (y0, scala_b) in enumerate(((320, 1.0), (700, 1.6), (1400, 2.6), (2600, 4.0))):
        xx = -y0 * 1.1 - 200
        while xx < y0 * 1.1 + 200:
            lb = rnd.uniform(14, 26) * scala_b
            hb = rnd.uniform(9, 22) * (1 + 0.15 * fila)
            c = palette[rnd.randrange(len(palette))]
            box(xx, xx + lb * 0.92, y0, y0 + lb, 0, hb, col("Città " + c, c, rough=0.8), nome="palazzo")
            box(xx - 0.5, xx + lb * 0.92 + 0.5, y0 - 0.5, y0 + lb + 0.5, hb, hb + 1.2, col("Tetto città", "#9b4a32" if not notte else "#2a2228", rough=0.8))
            if rnd.random() < (0.35 if not notte else 0.8):
                for k in range(rnd.randint(2, 6)):
                    fx = xx + rnd.uniform(2, lb * 0.85)
                    fz = rnd.uniform(2, hb - 3)
                    box(fx, fx + 1.4 * scala_b, y0 - 0.1, y0, fz, fz + 1.6, acceso)
            if rnd.random() < 0.08:
                cupx = xx + lb * 0.45
                sfera((cupx, y0 + lb / 2, hb + 2), lb * 0.25, col("Cupola città", "#6d7d86" if not notte else "#2c3238", rough=0.5), scala=(1, 1, 1.1))
                cil((cupx, y0 + lb / 2, hb + 2 + lb * 0.25), 1.0 * scala_b, 4 * scala_b, "z", col("Città #efdcb2", "#efdcb2"))
            if rnd.random() < 0.05 and fila < 2:
                palma(xx + lb / 2, y0 - 6, 10 * scala_b, 0.5)
            xx += lb
    if notte:
        luna = col("Luna", "#fff4d6", emis=30.0)
        sfera((5200, 30000, 6800), 380, luna, seg=32)
        mondo_notte(1.0)
        sole(20, 200, 0.5, "#9db4ff")
        foschia("#1c1d33", 0.5, 30000)
    else:
        mondo_cielo(1.2, 9, forza=0.4)
        sole(1.5, 171, 3.0, "#ff8a40")
        foschia("#e7a98a", 1.3, 26000)
    sc.view_settings.exposure = 0.0 if not notte else 0.4
    # pixel della cima nel fondale (coordinate del gioco, non del render)
    from bpy_extras.object_utils import world_to_camera_view
    bpy.context.view_layer.update()
    v = world_to_camera_view(sc, cam, cima)
    return {"etna_x": round(v.x * larg, 1), "etna_y": round((1 - v.y) * H, 1), "larghezza": larg, "far_f": FAR_F}


# ------------------------------------------------------------------ main

def scena(livello):
    sc = bpy.context.scene
    camera_scena(sc)
    if livello == 1:
        mondo_cielo(9, 200, forza=0.1)
        sole(11, 38, 4.2, "#ffb070", angolo=1.5)
        sc.view_settings.exposure = -0.2
        ambiente_1()
        for p in PIATTAFORME_1:
            p["t"](p)
    else:
        mondo_notte(0.6, stelle=False)
        sole(30, -30, 0.25, "#9db4ff", angolo=1.0)
        n0 = len(bpy.context.scene.objects)
        ambiente_2()
        for p in PIATTAFORME_2:
            p["t"](p)
        sc.view_settings.exposure = 0.3


def main():
    sc = pulisci()
    os.makedirs(OUT, exist_ok=True)
    if STRATO == "scena":
        scena(LIVELLO)
        nome = f"scena{LIVELLO}"
    else:
        info = fondale(LIVELLO)
        nome = f"fondale{LIVELLO}"
        with open(os.path.join(OUT, nome + ".json"), "w") as f:
            json.dump(info, f)
        print("FONDALE", info)
    if SALVA_BLEND:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, nome + ".blend"))
    sc.render.filepath = os.path.join(OUT, nome + ".png")
    bpy.ops.render.render(write_still=True)
    print("RESO", sc.render.filepath)


if __name__ == "__main__":
    main()

/**
 * Caso 1 · Circuito interrotto
 * Missione didattica nell'aula 3 AM (Plesso Meucci).
 * Livello terra-terra: sicurezza → strumenti → diagnosi → collaudo.
 *
 * Prof e oggetti sono modelli procedurali (niente asset esterni) e vengono
 * appoggiati sulle superfici vere del GLB con un raggio verso il basso
 * (attachWorld), così non fluttuano né sprofondano nei banchi.
 */

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BATTUTE_PROF } from './battute-prof.js';

// Prof: "Cartoon Teacher Model" di eduardolira (Sketchfab, CC-BY 4.0), riscalato
// in Blender a 1,6 m senza la sua animazione. Le pose le facciamo noi sulle ossa.
const PROF_URL = new URL('../models/prof.glb', import.meta.url).href;
const PROF_SCALE = 0.78;

// Voce del Prof: mp3 generati con ElevenLabs da _voce_prof.py (voce «Prof Meucci 3 AM»)
const VOCE_URL = new URL('../audio/prof/', import.meta.url).href;
const VOCE_KEY = 'meucci3d-voce';
const profLine = (key) => ({ who: 'Prof', text: BATTUTE_PROF[key], voce: key }); // 1,6 m nel file → ~1,25 m in aula, meno ingombrante
const PROF_BONES = {
  spine: 'Bone_39',
  head: 'Bone.001_4',
  armNeg: ['Bone.003_19', 'Bone.004_18'], // braccio sul lato −x (la destra del Prof)
  armPos: ['Bone.007_35', 'Bone.008_34']  // braccio sul lato +x
};

export const STEPS = {
  INTRO: 'intro',
  TALK_PROF: 'talk_prof',
  POWER_OFF: 'power_off',
  GET_TESTER: 'get_tester',
  GET_FUSE: 'get_fuse',
  REPAIR: 'repair',
  REWIRE: 'rewire',
  POWER_ON: 'power_on',
  COLLAUDO: 'collaudo',
  WIN: 'win'
};

const OBJECTIVES = {
  [STEPS.INTRO]: 'Entra in aula 3 AM e parla col Prof, accanto alla cattedra sotto la TV.',
  [STEPS.TALK_PROF]: 'Avvicinati al Prof e usa il tasto azione per parlare.',
  [STEPS.POWER_OFF]: 'Prima regola: togli tensione. Vai al quadretto vicino alla porta.',
  [STEPS.GET_TESTER]: 'Prendi il tester sul banco vicino alle finestre.',
  [STEPS.GET_FUSE]: 'Prendi il fusibile di ricambio sul banco in fondo.',
  [STEPS.REPAIR]: 'Torna al banco di lavoro vicino alla cattedra e ripara.',
  [STEPS.REWIRE]: 'Il guasto era nella spina: rifalla al banco di lavoro.',
  [STEPS.POWER_ON]: 'Riattacca la corrente al quadretto.',
  [STEPS.COLLAUDO]: 'Collaudo: avvicinati alla TV e accendila.',
  [STEPS.WIN]: 'Missione compiuta! Guarda i titoli di coda in TV.'
};

const STEP_ORDER = Object.values(STEPS);
const stepAtLeast = (step, min) => STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf(min);
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function createElectricGame({ THREE, scene, b2t, ui }) {
  const state = {
    step: STEPS.INTRO,
    powerOn: true,
    hasTester: false,
    hasFuse: false,
    repaired: false,
    rewired: false,
    talked: false,
    repairMeasured: false,
    repairReplaced: false,
    markers: [],
    pulse: 0
  };

  const tmp = new THREE.Vector3();
  let world = null;

  // ---------------------------------------------------------------------------
  // Helper di modellazione
  // ---------------------------------------------------------------------------
  const mat = (color, opts = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...opts });

  function part(geo, material, x = 0, y = 0, z = 0, parent = null) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }

  function tube(points, radius, material, parent) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return part(new THREE.TubeGeometry(curve, 24, radius, 6, false), material, 0, 0, 0, parent);
  }

  function canvasTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { tex, ctx, canvas: c };
  }

  // Raggio verso il basso sul GLB: quota della superficie sotto (bx, by) Blender
  const ray = new THREE.Raycaster();
  const DOWN = new THREE.Vector3(0, -1, 0);
  function surfaceY(bx, by, fallback) {
    if (!world) return fallback;
    ray.set(new THREE.Vector3(bx, 1.6, -by), DOWN);
    ray.far = 2.2;
    const hits = ray.intersectObject(world, true);
    return hits.length ? hits[0].point.y : fallback;
  }

  // ---------------------------------------------------------------------------
  // Prof
  // ---------------------------------------------------------------------------
  function buildProf() {
    const root = new THREE.Group();
    const skin = mat(0xe3b28c, { roughness: 0.75 });
    const coat = mat(0x2c4a6e, { roughness: 0.82 });
    const shirt = mat(0xf1f5f9, { roughness: 0.7 });
    const trousers = mat(0x3b4048, { roughness: 0.85 });
    const shoe = mat(0x1a1a1e, { roughness: 0.4 });
    const hair = mat(0xa8adb5, { roughness: 0.95 });
    const dark = mat(0x161618, { roughness: 0.35 });
    const tieMat = mat(0xa61b1b, { roughness: 0.55 });
    const metal = mat(0x2a2a2e, { roughness: 0.3, metalness: 0.6 });

    // Gambe e scarpe
    for (const s of [-1, 1]) {
      part(new THREE.CapsuleGeometry(0.068, 0.62, 6, 14), trousers, s * 0.095, 0.47, 0, root);
      part(new RoundedBoxGeometry(0.11, 0.08, 0.27, 3, 0.035), shoe, s * 0.095, 0.04, 0.045, root);
    }

    // Parte alta in un gruppo unico, per il respiro
    const upper = new THREE.Group();
    root.add(upper);

    const pelvis = part(new THREE.CylinderGeometry(0.16, 0.17, 0.14, 20), trousers, 0, 0.88, 0, upper);
    pelvis.scale.z = 0.75;
    const belt = part(new THREE.CylinderGeometry(0.163, 0.163, 0.035, 20), dark, 0, 0.94, 0, upper);
    belt.scale.z = 0.75;

    const torso = part(new THREE.CylinderGeometry(0.172, 0.155, 0.52, 20), shirt, 0, 1.2, 0, upper);
    torso.scale.z = 0.72;

    // Camice aperto davanti (spicchio mancante centrato su +z)
    const coatGap = 0.42;
    const coatBody = part(
      new THREE.CylinderGeometry(0.186, 0.215, 0.82, 28, 1, true, coatGap, Math.PI * 2 - coatGap * 2),
      new THREE.MeshStandardMaterial({ color: 0x2c4a6e, roughness: 0.82, side: THREE.DoubleSide }),
      0, 1.05, 0, upper
    );
    coatBody.scale.z = 0.78;
    const shoulders = part(new THREE.SphereGeometry(0.19, 24, 12), coat, 0, 1.43, 0, upper);
    shoulders.scale.set(1.22, 0.42, 0.78);

    // Taschino con penne + cartellino
    const pocket = part(new THREE.BoxGeometry(0.07, 0.08, 0.008), coat, 0.105, 1.27, 0.124, upper);
    pocket.rotation.y = 0.62;
    const penRed = part(new THREE.CylinderGeometry(0.0045, 0.0045, 0.05, 8), mat(0xdc2626), 0.095, 1.315, 0.13, upper);
    const penBlue = part(new THREE.CylinderGeometry(0.0045, 0.0045, 0.05, 8), mat(0x1d4ed8), 0.112, 1.315, 0.125, upper);
    penRed.rotation.y = penBlue.rotation.y = 0.62;
    const badge = part(new THREE.BoxGeometry(0.055, 0.035, 0.004), mat(0xffffff, { roughness: 0.4 }), -0.105, 1.3, 0.126, upper);
    badge.rotation.y = -0.62;

    // Colletto e cravatta
    part(new THREE.CylinderGeometry(0.06, 0.078, 0.05, 16, 1, true), shirt, 0, 1.485, 0, upper);
    part(new THREE.BoxGeometry(0.03, 0.03, 0.02), tieMat, 0, 1.44, 0.122, upper);
    const tieBlade = part(new THREE.CylinderGeometry(0.018, 0.034, 0.27, 4), tieMat, 0, 1.285, 0.125, upper);
    tieBlade.rotation.y = Math.PI / 4;
    tieBlade.scale.z = 0.25;

    // Collo e testa
    part(new THREE.CylinderGeometry(0.046, 0.05, 0.08, 14), skin, 0, 1.505, 0, upper);
    const head = new THREE.Group();
    head.position.y = 1.53;
    upper.add(head);

    const skull = part(new THREE.SphereGeometry(0.105, 28, 20), skin, 0, 0.11, 0, head);
    skull.scale.set(0.92, 1.12, 1.0);

    // Capelli grigi ai lati e dietro, stempiato sopra
    const hairGeo = new THREE.SphereGeometry(
      0.11, 28, 16,
      Math.PI / 2 + 0.95, Math.PI * 2 - 1.9,
      0.42, 1.25
    );
    const hairMesh = part(hairGeo, hair, 0, 0.11, -0.004, head);
    hairMesh.scale.set(0.95, 1.12, 1.0);

    for (const s of [-1, 1]) {
      // orecchie
      const ear = part(new THREE.SphereGeometry(0.024, 12, 10), skin, s * 0.097, 0.108, -0.005, head);
      ear.scale.set(0.45, 1, 0.75);
      // occhi
      part(new THREE.SphereGeometry(0.015, 12, 10), mat(0xffffff, { roughness: 0.3 }), s * 0.036, 0.125, 0.087, head);
      part(new THREE.SphereGeometry(0.008, 10, 8), dark, s * 0.036, 0.125, 0.1, head);
      // sopracciglia
      const brow = part(new THREE.BoxGeometry(0.034, 0.007, 0.01), hair, s * 0.037, 0.153, 0.094, head);
      brow.rotation.z = -s * 0.12;
      // occhiali
      part(new THREE.TorusGeometry(0.023, 0.0032, 8, 22), metal, s * 0.036, 0.125, 0.103, head);
      const temple = part(new THREE.BoxGeometry(0.003, 0.003, 0.1), metal, s * 0.09, 0.127, 0.055, head);
      temple.rotation.y = -s * 0.12;
    }
    const bridge = part(new THREE.CylinderGeometry(0.0025, 0.0025, 0.026, 6), metal, 0, 0.128, 0.104, head);
    bridge.rotation.z = Math.PI / 2;

    const nose = part(new THREE.ConeGeometry(0.016, 0.045, 10), skin, 0, 0.1, 0.108, head);
    nose.rotation.x = Math.PI / 2;
    const moustache = part(new RoundedBoxGeometry(0.062, 0.016, 0.016, 2, 0.006), hair, 0, 0.073, 0.098, head);
    moustache.rotation.x = 0.15;
    const mouth = part(new THREE.BoxGeometry(0.034, 0.008, 0.01), mat(0x5b1f1f, { roughness: 0.5 }), 0, 0.054, 0.095, head);

    // Braccia (perno alla spalla, perno al gomito)
    const arms = {};
    for (const [name, s] of [['left', -1], ['right', 1]]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(s * 0.215, 1.42, 0);
      upper.add(shoulder);
      part(new THREE.CapsuleGeometry(0.052, 0.24, 6, 12), coat, 0, -0.15, 0, shoulder);
      const elbow = new THREE.Group();
      elbow.position.y = -0.3;
      shoulder.add(elbow);
      part(new THREE.CapsuleGeometry(0.046, 0.2, 6, 12), coat, 0, -0.13, 0, elbow);
      part(new THREE.CylinderGeometry(0.044, 0.044, 0.03, 12), shirt, 0, -0.255, 0, elbow);
      const hand = part(new THREE.SphereGeometry(0.044, 14, 12), skin, 0, -0.3, 0.005, elbow);
      hand.scale.set(0.8, 1.15, 0.55);
      shoulder.rotation.z = s * 0.1;
      elbow.rotation.x = -0.25;
      arms[name] = { shoulder, elbow, side: s };
    }

    return { root, upper, head, mouth, arms };
  }

  // ---------------------------------------------------------------------------
  // Tester (multimetro), sdraiato: display verso l'alto, origine sul piano
  // ---------------------------------------------------------------------------
  function buildTester() {
    const g = new THREE.Group();
    const yellow = mat(0xf5c518, { roughness: 0.65 });
    const face = mat(0x26262b, { roughness: 0.5 });
    const black = mat(0x111114, { roughness: 0.45 });
    const red = mat(0xc81e1e, { roughness: 0.45 });
    const steel = mat(0xc8ccd2, { roughness: 0.25, metalness: 0.9 });

    part(new RoundedBoxGeometry(0.095, 0.04, 0.18, 3, 0.013), yellow, 0, 0.02, 0, g);
    part(new RoundedBoxGeometry(0.076, 0.01, 0.152, 2, 0.004), face, 0, 0.038, 0, g);

    const lcd = canvasTexture(128, 64, () => {});
    const lcdMesh = part(
      new THREE.PlaneGeometry(0.062, 0.031),
      new THREE.MeshBasicMaterial({ map: lcd.tex, toneMapped: false }),
      0, 0.0436, -0.046, g
    );
    lcdMesh.rotation.x = -Math.PI / 2;
    lcdMesh.castShadow = false;

    function setReading(text, lit = true) {
      const { ctx, canvas } = lcd;
      ctx.fillStyle = lit ? '#b9c8a4' : '#7d8873';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (text) {
        ctx.fillStyle = '#1d2418';
        ctx.font = 'bold 34px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
      }
      lcd.tex.needsUpdate = true;
    }
    setReading('', false);

    // Selettore rotativo con indice bianco, sul simbolo Ω
    const dial = new THREE.Group();
    dial.position.set(0, 0.044, 0.014);
    g.add(dial);
    part(new THREE.CylinderGeometry(0.023, 0.025, 0.012, 28), black, 0, 0, 0, dial);
    part(new THREE.BoxGeometry(0.004, 0.004, 0.02), mat(0xffffff), 0, 0.007, -0.009, dial);
    dial.rotation.y = 0.6;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const dot = part(
        new THREE.CylinderGeometry(0.0025, 0.0025, 0.002, 8),
        mat(i === 2 ? 0x22c55e : 0xe5e7eb),
        Math.sin(a) * 0.032, 0.0435, 0.014 + Math.cos(a) * 0.032, g
      );
      dot.castShadow = false;
    }

    // Boccole e puntali con i cavi
    const jacks = [[-0.022, black], [0, black], [0.022, red]];
    for (const [x, m] of jacks) part(new THREE.CylinderGeometry(0.006, 0.006, 0.006, 12), m, x, 0.044, 0.068, g);

    function probe(x, m, cableFrom) {
      const p = new THREE.Group();
      p.position.set(x, 0.007, 0.0);
      g.add(p);
      const handle = part(new THREE.CylinderGeometry(0.0065, 0.0065, 0.1, 12), m, 0, 0, 0, p);
      handle.rotation.x = Math.PI / 2;
      const guard = part(new THREE.CylinderGeometry(0.01, 0.01, 0.004, 12), m, 0, 0, -0.045, p);
      guard.rotation.x = Math.PI / 2;
      const tip = part(new THREE.ConeGeometry(0.003, 0.03, 8), steel, 0, 0, -0.065, p);
      tip.rotation.x = -Math.PI / 2;
      tube(
        [cableFrom, [cableFrom[0] + 0.01, 0.03, 0.11], [x - 0.01, 0.006, 0.12], [x, 0.007, 0.05]],
        0.0028, m, g
      );
    }
    probe(0.085, red, [0.022, 0.047, 0.07]);
    probe(0.108, black, [0, 0.047, 0.07]);

    return { group: g, setReading };
  }

  // ---------------------------------------------------------------------------
  // Fusibile a cartuccia (asse lungo x). blown = filo spezzato e vetro annerito
  // ---------------------------------------------------------------------------
  function buildFuse(blown) {
    const g = new THREE.Group();
    const steel = mat(0xd4d7dc, { roughness: 0.22, metalness: 0.95 });
    const glass = new THREE.MeshStandardMaterial({
      color: blown ? 0x4b3b2f : 0xe0f2fe,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: blown ? 0.75 : 0.35,
      depthWrite: false
    });
    const body = part(new THREE.CylinderGeometry(0.0095, 0.0095, 0.05, 16), glass, 0, 0, 0, g);
    body.rotation.z = Math.PI / 2;
    body.castShadow = false;
    for (const s of [-1, 1]) {
      const cap = part(new THREE.CylinderGeometry(0.0105, 0.0105, 0.012, 16), steel, s * 0.029, 0, 0, g);
      cap.rotation.z = Math.PI / 2;
    }
    const wireMat = mat(blown ? 0x1f1f1f : 0xe5e7eb, { metalness: 0.8, roughness: 0.3 });
    if (blown) {
      for (const s of [-1, 1]) {
        const w = part(new THREE.CylinderGeometry(0.0011, 0.0011, 0.016, 6), wireMat, s * 0.015, 0, 0, g);
        w.rotation.z = Math.PI / 2;
      }
    } else {
      const w = part(new THREE.CylinderGeometry(0.0011, 0.0011, 0.05, 6), wireMat, 0, 0, 0, g);
      w.rotation.z = Math.PI / 2;
    }
    return g;
  }

  // Scatolina dei fusibili di ricambio, con un fusibile appoggiato sopra
  function buildFuseBox() {
    const g = new THREE.Group();
    part(new RoundedBoxGeometry(0.1, 0.032, 0.065, 2, 0.004), mat(0xb91c1c, { roughness: 0.7 }), 0, 0.016, 0, g);
    const label = canvasTexture(128, 80, (ctx, w, h) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FUSIBILI', w / 2, 34);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 26px Arial, sans-serif';
      ctx.fillText('5x20  2A', w / 2, 66);
    });
    const lab = part(new THREE.PlaneGeometry(0.084, 0.05), new THREE.MeshStandardMaterial({ map: label.tex, roughness: 0.6 }), 0, 0.0325, 0, g);
    lab.rotation.x = -Math.PI / 2;
    lab.castShadow = false;
    const spare = buildFuse(false);
    spare.scale.setScalar(1.5);
    spare.position.set(0.02, 0.012, 0.06);
    spare.rotation.y = 0.4;
    g.add(spare);
    return g;
  }

  // ---------------------------------------------------------------------------
  // Quadretto con interruttore generale (montato sul muro accanto alla porta)
  // ---------------------------------------------------------------------------
  function buildPanel() {
    const g = new THREE.Group();
    const grey = mat(0xd9dde3, { roughness: 0.55 });
    const white = mat(0xf8fafc, { roughness: 0.45 });
    part(new RoundedBoxGeometry(0.18, 0.24, 0.07, 3, 0.012), grey, 0, 0, 0.035, g);
    // finestra dei moduli
    part(new THREE.BoxGeometry(0.15, 0.1, 0.01), mat(0x9aa3ad, { roughness: 0.6 }), 0, -0.02, 0.071, g);
    // modulo magnetotermico
    part(new THREE.BoxGeometry(0.05, 0.085, 0.03), white, -0.03, -0.02, 0.085, g);
    part(new THREE.BoxGeometry(0.05, 0.085, 0.03), white, 0.03, -0.02, 0.085, g);
    const lever = new THREE.Group();
    lever.position.set(-0.03, -0.02, 0.1);
    g.add(lever);
    part(new RoundedBoxGeometry(0.03, 0.04, 0.016, 2, 0.004), mat(0x1e3a8a, { roughness: 0.4 }), 0, 0.02, 0, lever);
    const lever2 = part(new RoundedBoxGeometry(0.03, 0.04, 0.016, 2, 0.004), mat(0x1e3a8a, { roughness: 0.4 }), 0.03, 0.0, 0.1, g);
    lever2.rotation.x = -0.5;
    lever2.position.y = -0.002;
    const led = part(
      new THREE.SphereGeometry(0.006, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 2 }),
      0.06, 0.075, 0.072, g
    );
    // cartello di pericolo
    const sign = canvasTexture(128, 112, (ctx) => {
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(64, 8);
      ctx.lineTo(122, 104);
      ctx.lineTo(6, 104);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(72, 34);
      ctx.lineTo(50, 72);
      ctx.lineTo(64, 72);
      ctx.lineTo(56, 98);
      ctx.lineTo(80, 60);
      ctx.lineTo(66, 60);
      ctx.closePath();
      ctx.fill();
    });
    const s = part(
      new THREE.PlaneGeometry(0.05, 0.044),
      new THREE.MeshStandardMaterial({ map: sign.tex, transparent: true, roughness: 0.5 }),
      -0.035, 0.075, 0.0705, g
    );
    s.castShadow = false;
    // canalina che sale
    part(new THREE.BoxGeometry(0.03, 0.5, 0.02), grey, 0.0, 0.37, 0.01, g);
    return { group: g, lever, led };
  }

  // ---------------------------------------------------------------------------
  // Banco di lavoro: tavoletta con portafusibile, morsettiera e lampada di prova
  // ---------------------------------------------------------------------------
  function buildPlug(burnt) {
    const g = new THREE.Group();
    const body = mat(burnt ? 0xcfc6b6 : 0xf5f5f4, { roughness: 0.5 });
    part(new RoundedBoxGeometry(0.04, 0.026, 0.055, 2, 0.008), body, 0, 0.013, 0, g);
    const steel = mat(0xcbd5e1, { metalness: 0.9, roughness: 0.25 });
    for (const x of [-0.011, 0, 0.011]) {
      const pin = part(new THREE.CylinderGeometry(0.0022, 0.0022, 0.022, 8), steel, x, 0.013, -0.037, g);
      pin.rotation.x = Math.PI / 2;
    }
    tube([[0, 0.013, 0.027], [0.01, 0.008, 0.06], [0.05, 0.004, 0.08], [0.09, 0.004, 0.07]], 0.0035, mat(0x334155), g);
    if (burnt) {
      const scorch = part(new THREE.SphereGeometry(0.016, 12, 8), mat(0x1c1917, { roughness: 1 }), 0.004, 0.022, 0.016, g);
      scorch.scale.set(1, 0.35, 1.1);
    }
    return g;
  }

  function buildBench() {
    const g = new THREE.Group();
    const wood = mat(0xb4895a, { roughness: 0.8 });
    const black = mat(0x1c1c20, { roughness: 0.5 });
    const brass = mat(0xc9a227, { roughness: 0.3, metalness: 0.9 });
    const cableBlue = mat(0x2563eb, { roughness: 0.5 });
    const cableBrown = mat(0x7c4a1e, { roughness: 0.5 });

    part(new RoundedBoxGeometry(0.42, 0.02, 0.26, 2, 0.005), wood, 0, 0.01, 0, g);

    // portafusibile frontale
    part(new THREE.BoxGeometry(0.1, 0.018, 0.034), black, -0.08, 0.029, 0.07, g);
    for (const s of [-1, 1]) {
      part(new THREE.BoxGeometry(0.008, 0.022, 0.026), brass, -0.08 + s * 0.029, 0.047, 0.07, g);
    }
    const fuseSlot = new THREE.Vector3(-0.08, 0.052, 0.07);
    const blownFuse = buildFuse(true);
    blownFuse.position.copy(fuseSlot);
    g.add(blownFuse);
    const newFuse = buildFuse(false);
    newFuse.position.copy(fuseSlot);
    newFuse.visible = false;
    g.add(newFuse);

    // morsettiera
    part(new THREE.BoxGeometry(0.075, 0.022, 0.03), mat(0x6b7280, { roughness: 0.6 }), 0.07, 0.031, 0.07, g);
    for (let i = -1; i <= 1; i++) {
      part(new THREE.CylinderGeometry(0.005, 0.005, 0.006, 10), brass, 0.07 + i * 0.022, 0.044, 0.07, g);
    }

    // lampada di prova
    const lamp = new THREE.Group();
    lamp.position.set(0.12, 0.02, -0.07);
    g.add(lamp);
    part(new THREE.CylinderGeometry(0.045, 0.055, 0.02, 20), black, 0, 0.01, 0, lamp);
    const arm = part(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 8), mat(0x9ca3af, { metalness: 0.7, roughness: 0.3 }), -0.02, 0.11, 0, lamp);
    arm.rotation.z = 0.2;
    const shade = part(
      new THREE.ConeGeometry(0.05, 0.06, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.5, side: THREE.DoubleSide }),
      -0.06, 0.2, 0, lamp
    );
    shade.rotation.z = 0.5;
    const bulb = part(
      new THREE.SphereGeometry(0.022, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xe5e7eb, emissive: 0x000000, emissiveIntensity: 0, roughness: 0.2 }),
      -0.067, 0.18, 0, lamp
    );
    bulb.castShadow = false;
    const lampLight = new THREE.PointLight(0xfde68a, 0, 2.8, 2);
    lampLight.position.copy(bulb.position);
    lamp.add(lampLight);

    // cavi: portafusibile → morsettiera → lampada, e linea che va verso la TV
    tube([[-0.05, 0.03, 0.07], [0, 0.03, 0.05], [0.04, 0.03, 0.07]], 0.0035, cableBrown, g);
    tube([[0.09, 0.03, 0.06], [0.12, 0.024, 0.0], [0.12, 0.024, -0.05]], 0.0035, cableBlue, g);
    tube([[-0.12, 0.03, 0.07], [-0.17, 0.024, 0.02], [-0.18, 0.022, -0.12], [-0.2, 0.0, -0.14]], 0.0035, cableBrown, g);

    // spina della TV: quella vecchia annerita dal cortocircuito, quella rifatta
    const oldPlug = buildPlug(true);
    const newPlug = buildPlug(false);
    [oldPlug, newPlug].forEach((pl) => {
      pl.position.set(-0.02, 0.02, -0.06);
      pl.rotation.y = 0.5;
      g.add(pl);
    });
    newPlug.visible = false;

    return { group: g, blownFuse, newFuse, bulb, lampLight, oldPlug, newPlug };
  }

  // ---------------------------------------------------------------------------
  // Scena: oggetti e punti (coordinate Blender → three con b2t)
  // ---------------------------------------------------------------------------
  const SPOTS = {
    // fra la cattedra e le finestre, sotto la TV: fuori dal passaggio
    prof: { bx: -10.3, by: 3.9, fallback: 0 },
    tester: { bx: -9.5, by: 0.92, fallback: 0.72 },
    fuse: { bx: -6.4, by: -0.4, fallback: 0.72 },
    bench: { bx: -7.27, by: 3.58, fallback: 0.72 },
    tv: { bx: -9.5, by: 3.55, fallback: 0 }
  };
  const PANEL_POS = b2t(-4.102, 2.22, 1.3);

  // profRoot porta posizione e rotazione; dentro c'è il modello GLB
  // (o, se non si carica, il Prof procedurale di riserva)
  const profRoot = new THREE.Group();
  profRoot.position.copy(b2t(SPOTS.prof.bx, SPOTS.prof.by, SPOTS.prof.fallback));
  profRoot.rotation.y = 0.9; // all'inizio guarda verso i banchi
  profRoot.scale.setScalar(PROF_SCALE);
  scene.add(profRoot);
  const prof = buildProf();
  profRoot.add(prof.root);

  let profRig = null;
  new GLTFLoader().load(
    PROF_URL,
    (gltf) => {
      const model = gltf.scene;
      const bones = {};
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          o.frustumCulled = false; // le sfere di bound degli skinned mesh di Sketchfab sono inaffidabili
        }
        if (o.isBone) bones[o.name.replace(/[^A-Za-z0-9_]/g, '')] = o;
      });
      // GLTFLoader toglie i punti dai nomi ("Bone.001_4" → "Bone001_4")
      const bone = (n) => bones[n.replace(/[^A-Za-z0-9_]/g, '')];
      const rig = {
        model,
        spine: bone(PROF_BONES.spine),
        head: bone(PROF_BONES.head),
        armNeg: PROF_BONES.armNeg.map(bone),
        armPos: PROF_BONES.armPos.map(bone)
      };
      const all = [rig.spine, rig.head, ...rig.armNeg, ...rig.armPos];
      if (all.some((b) => !b)) {
        console.warn('[prof.glb] ossa mancanti, resto sul Prof procedurale', Object.keys(bones));
        return;
      }
      rig.base = all.map((b) => [b, b.quaternion.clone()]);
      profRoot.add(model);
      prof.root.visible = false;
      profRig = rig;
    },
    undefined,
    (err) => console.warn('[prof.glb] non caricato, resto sul Prof procedurale', err)
  );

  const deskTester = buildTester();
  deskTester.group.rotation.y = -0.5;
  scene.add(deskTester.group);

  const fuseBox = buildFuseBox();
  fuseBox.rotation.y = 0.3;
  scene.add(fuseBox);

  const panel = buildPanel();
  panel.group.position.copy(PANEL_POS);
  panel.group.rotation.y = -Math.PI / 2; // la faccia (+z locale) guarda dentro l'aula (−x Blender)
  scene.add(panel.group);

  const bench = buildBench();
  scene.add(bench.group);
  const { bulb, lampLight } = bench;

  // Il tester portato al banco compare sul banco accanto
  const benchTester = buildTester();
  benchTester.group.position.set(0.45, 0, 0.02);
  benchTester.group.rotation.y = 0.35;
  benchTester.group.visible = false;
  bench.group.add(benchTester.group);
  // Il fusibile bruciato, una volta tolto, resta sdraiato sulla tavoletta
  const oldFuseSpot = new THREE.Vector3(-0.15, 0.03, -0.06);

  const homes = {}; // posizione di riposo degli oggetti raccoglibili

  function placeObjects() {
    const put = (obj, key) => {
      const s = SPOTS[key];
      obj.position.copy(b2t(s.bx, s.by, surfaceY(s.bx, s.by, s.fallback)));
    };
    put(profRoot, 'prof');
    put(deskTester.group, 'tester');
    put(fuseBox, 'fuse');
    put(bench.group, 'bench');
    homes.tester = deskTester.group.position.clone();
    homes.fuse = fuseBox.position.clone();
    placeMarkers();
  }

  // ---------------------------------------------------------------------------
  // Marker: freccia che rimbalza sopra l'oggetto + anello a terra
  // ---------------------------------------------------------------------------
  // Grafica ridotta: niente luci sui segnalini (restano emissivi e si vedono lo stesso)
  let markerLights = true;
  function setQuality(q) {
    markerLights = q === 'alta';
    state.markers.forEach((m) => { m.light.visible = markerLights; });
  }

  function makeMarker(id, color, label, { anchor, offset = 0, radius = 2.4, ring = true, ringScale = 1, arrowY = 0.32 }) {
    const group = new THREE.Group();
    group.userData = { id, label, radius, active: false };

    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.13, 18),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.35 })
    );
    arrow.rotation.x = Math.PI;
    arrow.position.y = arrowY;
    group.add(arrow);

    let ringMesh = null;
    if (ring) {
      ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.2 * ringScale, 0.26 * ringScale, 40),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
      );
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.004;
      group.add(ringMesh);
    }

    const light = new THREE.PointLight(color, 0.9, 2.6, 2);
    light.visible = markerLights;
    light.position.y = arrowY;
    group.add(light);

    scene.add(group);
    state.markers.push({ id, group, arrow, ring: ringMesh, light, anchor, offset, arrowY });
    return group;
  }

  makeMarker('prof', 0x38bdf8, 'Parla col Prof', { anchor: profRoot, radius: 3.0, ringScale: 1.7, arrowY: 1.6 });
  makeMarker('switch', 0xfbbf24, 'Interruttore generale', { anchor: panel.group, radius: 2.2, ring: false, arrowY: 0.24 });
  makeMarker('tester', 0x34d399, 'Prendi il tester', { anchor: deskTester.group, radius: 2.3 });
  makeMarker('fuse', 0xf472b6, 'Prendi il fusibile', { anchor: fuseBox, radius: 2.3 });
  makeMarker('bench', 0xa78bfa, 'Banco di lavoro', { anchor: bench.group, radius: 2.5, ringScale: 1.4 });
  makeMarker('tv', 0x60a5fa, 'Collaudo TV', { anchor: null, radius: 2.6, ringScale: 1.6, arrowY: 1.0 });

  function placeMarkers() {
    for (const m of state.markers) {
      if (m.anchor) {
        m.anchor.getWorldPosition(m.group.position);
      } else if (m.id === 'tv') {
        const s = SPOTS.tv;
        m.group.position.copy(b2t(s.bx, s.by, surfaceY(s.bx, s.by, s.fallback)));
      }
    }
  }
  placeObjects();

  // ---------------------------------------------------------------------------
  // Stato visivo
  // ---------------------------------------------------------------------------
  const pickups = []; // animazioni di raccolta in corso
  let leverTarget = 0.45;
  let speaker = null;

  function pickUp(obj) {
    pickups.push({ obj, t: 0, from: obj.position.clone() });
  }

  function setSwitch(on) {
    leverTarget = on ? 0.45 : Math.PI - 0.45;
    panel.led.material.color.setHex(on ? 0x22c55e : 0xef4444);
    panel.led.material.emissive.setHex(on ? 0x22c55e : 0xef4444);
  }

  function refreshLamp() {
    const lit = state.repaired && state.powerOn;
    const strong = state.step === STEPS.WIN;
    bulb.material.emissive.setHex(lit ? 0xfde68a : 0x000000);
    bulb.material.emissiveIntensity = lit ? (strong ? 1.6 : 1.0) : 0;
    lampLight.intensity = lit ? (strong ? 1.6 : 0.9) : 0;
    lampLight.visible = lit; // una luce spenta costa comunque in ogni pixel
  }

  function refreshProps() {
    benchTester.group.visible = state.hasTester && stepAtLeast(state.step, STEPS.REPAIR);
    if (!state.repairMeasured) benchTester.setReading('', false);
    else if (!state.repairReplaced) benchTester.setReading('OL');
    else benchTester.setReading('0.2Ω');

    bench.newFuse.visible = state.repairReplaced;
    bench.oldPlug.visible = !state.rewired;
    bench.newPlug.visible = state.rewired;
    if (state.repairReplaced) {
      bench.blownFuse.position.copy(oldFuseSpot);
      bench.blownFuse.rotation.y = 0.8;
    } else {
      bench.blownFuse.position.set(-0.08, 0.052, 0.07);
      bench.blownFuse.rotation.y = 0;
    }
    refreshLamp();
  }

  function setStep(next) {
    state.step = next;
    ui.setObjective(OBJECTIVES[next] || '');
    ui.setInventory({
      tester: state.hasTester,
      fuse: state.hasFuse,
      powerOn: state.powerOn,
      repaired: state.rewired
    });
    refreshMarkers();
    refreshProps();
  }

  function refreshMarkers() {
    const active = {
      prof: state.step === STEPS.INTRO || state.step === STEPS.TALK_PROF,
      switch: state.step === STEPS.POWER_OFF || state.step === STEPS.POWER_ON,
      tester: state.step === STEPS.GET_TESTER && !state.hasTester,
      fuse: state.step === STEPS.GET_FUSE && !state.hasFuse,
      bench: (state.step === STEPS.REPAIR && !state.repaired) || (state.step === STEPS.REWIRE && !state.rewired),
      tv: state.step === STEPS.COLLAUDO
    };
    state.markers.forEach((m) => {
      const on = !!active[m.id];
      m.group.visible = on;
      m.group.userData.active = on;
    });
  }

  function nearestActive(camPos) {
    let best = null;
    let bestDist = Infinity;
    for (const m of state.markers) {
      if (!m.group.userData.active) continue;
      m.group.getWorldPosition(tmp);
      const d = camPos.distanceTo(tmp);
      const r = m.group.userData.radius || 2.4;
      if (d < r && d < bestDist) {
        bestDist = d;
        best = m;
      }
    }
    return best ? { marker: best, dist: bestDist } : null;
  }

  function updatePrompt(camPos) {
    const hit = nearestActive(camPos);
    if (!hit) {
      ui.setPrompt(false, '');
      return null;
    }
    ui.setPrompt(true, hit.marker.group.userData.label);
    return hit.marker;
  }

  const DIALOGUES = {
    first: [
      { who: 'Tu', text: 'Prof, la TV non dà segni di vita!' },
      profLine('panico'),
      profLine('stacca')
    ],
    powerOff: [profLine('tensioneTolta')],
    tester: [{ who: 'Tu', text: 'Tester preso. Serve anche il fusibile di ricambio.' }],
    fuse: [{ who: 'Tu', text: 'Fusibile trovato. Torno al banco di lavoro.' }],
    repaired: [profLine('causa'), profLine('rifaiSpina')],
    rewired: [profLine('spinaFatta')],
    powerOn: [profLine('correnteOk')],
    tvBroken: [profLine('ancoraNiente')],
    needPowerOff: [profLine('aspetta')]
  };

  // ---- Voce -----------------------------------------------------------------
  let voiceOn = true;
  try { voiceOn = localStorage.getItem(VOCE_KEY) !== 'off'; } catch (_) { /* storage bloccato */ }
  let voice = null;      // Audio della battuta in corso
  let voiceBlocked = null; // battuta fermata dal blocco dell'autoplay: riparte al primo tocco
  let voiceTimer = 0;

  function stopVoice() {
    clearTimeout(voiceTimer);
    if (voice) { voice.pause(); voice = null; }
    voiceBlocked = null;
  }

  function playVoice(key, delayMs = 0) {
    stopVoice();
    if (!key || !voiceOn) return;
    const a = new Audio(VOCE_URL + key + '.mp3');
    voice = a;
    const go = () => a.play().catch(() => { if (voice === a) voiceBlocked = a; });
    if (delayMs) voiceTimer = setTimeout(go, delayMs);
    else go();
  }

  // Il browser non fa parlare la pagina prima di un gesto: la battuta d'apertura parte al primo tocco
  const unlockVoice = () => {
    if (voiceBlocked && voiceBlocked === voice) voiceBlocked.play().catch(() => {});
    voiceBlocked = null;
  };
  window.addEventListener('pointerdown', unlockVoice, true);
  window.addEventListener('keydown', unlockVoice, true);

  function voicePlaying() {
    return !!(voice && !voice.paused && !voice.ended);
  }

  function setVoice(on) {
    voiceOn = on;
    try { localStorage.setItem(VOCE_KEY, on ? 'on' : 'off'); } catch (_) { /* storage bloccato */ }
    if (!on) stopVoice();
  }

  let dialogueQueue = [];
  let dialogueOpen = false;

  function showDialogue(lines, onDone) {
    dialogueQueue = lines.slice();
    dialogueOpen = true;
    const advance = () => {
      if (!dialogueQueue.length) {
        dialogueOpen = false;
        speaker = null;
        stopVoice();
        ui.hideDialogue();
        if (onDone) onDone();
        return;
      }
      const line = dialogueQueue.shift();
      speaker = line.who;
      if (line.voce) playVoice(line.voce);
      else stopVoice();
      ui.showDialogue(line.who, line.text, advance);
    };
    advance();
  }

  function interact(camPos) {
    if (dialogueOpen) {
      ui.clickDialogueContinue();
      return { kind: 'dialogue' };
    }

    const hit = nearestActive(camPos);
    if (!hit) return null;
    const id = hit.marker.id;

    if (id === 'prof') {
      if (!state.talked) {
        state.talked = true;
        showDialogue(DIALOGUES.first, () => setStep(STEPS.POWER_OFF));
        return { kind: 'talk' };
      }
      showDialogue([{ who: 'Prof', text: OBJECTIVES[state.step] || 'Segui l’obiettivo in alto.' }]);
      return { kind: 'talk' };
    }

    if (id === 'switch') {
      if (state.step === STEPS.POWER_OFF) {
        state.powerOn = false;
        setSwitch(false);
        ui.setPowerVisual(false);
        showDialogue(DIALOGUES.powerOff, () => setStep(STEPS.GET_TESTER));
        return { kind: 'switch' };
      }
      if (state.step === STEPS.POWER_ON) {
        state.powerOn = true;
        setSwitch(true);
        ui.setPowerVisual(true);
        refreshLamp();
        showDialogue(DIALOGUES.powerOn, () => setStep(STEPS.COLLAUDO));
        return { kind: 'switch' };
      }
    }

    if (id === 'tester' && state.step === STEPS.GET_TESTER) {
      state.hasTester = true;
      pickUp(deskTester.group);
      showDialogue(DIALOGUES.tester, () => setStep(STEPS.GET_FUSE));
      return { kind: 'pickup' };
    }

    if (id === 'fuse' && state.step === STEPS.GET_FUSE) {
      state.hasFuse = true;
      pickUp(fuseBox);
      showDialogue(DIALOGUES.fuse, () => setStep(STEPS.REPAIR));
      return { kind: 'pickup' };
    }

    if (id === 'bench' && state.step === STEPS.REPAIR) {
      if (state.powerOn) {
        showDialogue(DIALOGUES.needPowerOff);
        return { kind: 'blocked' };
      }
      ui.openRepair({
        hasTester: state.hasTester,
        hasFuse: state.hasFuse,
        measured: state.repairMeasured,
        replaced: state.repairReplaced,
        onMeasure: () => {
          state.repairMeasured = true;
          refreshProps();
          ui.updateRepair(state);
        },
        onReplace: () => {
          if (!state.repairMeasured) return;
          if (!state.hasFuse) return;
          state.repairReplaced = true;
          state.repaired = true;
          refreshProps();
          ui.updateRepair(state);
          ui.closeRepair();
          showDialogue(DIALOGUES.repaired, () => setStep(STEPS.REWIRE));
        },
        onClose: () => ui.closeRepair()
      });
      return { kind: 'repair' };
    }

    if (id === 'bench' && state.step === STEPS.REWIRE) {
      if (state.powerOn) {
        showDialogue(DIALOGUES.needPowerOff);
        return { kind: 'blocked' };
      }
      ui.openPlug({
        done: state.rewired,
        onDone: () => {
          state.rewired = true;
          refreshProps();
          ui.closeRepair();
          showDialogue(DIALOGUES.rewired, () => setStep(STEPS.POWER_ON));
        },
        onClose: () => ui.closeRepair()
      });
      return { kind: 'repair' };
    }

    if (id === 'tv' && state.step === STEPS.COLLAUDO) {
      return { kind: 'tv-ready' };
    }

    return null;
  }

  /** La TV si accende solo a collaudo (o dopo vittoria). */
  function canBootTV() {
    return state.repaired && state.rewired && state.powerOn && (state.step === STEPS.COLLAUDO || state.step === STEPS.WIN);
  }

  function onTVBlocked() {
    showDialogue(DIALOGUES.tvBroken);
  }

  function onTVSuccessBoot() {
    if (state.step === STEPS.COLLAUDO) {
      setStep(STEPS.WIN);
      playVoice('evviva', 1600); // dopo la fanfara della TV
    }
  }

  // ---------------------------------------------------------------------------
  // Animazione
  // ---------------------------------------------------------------------------
  // Ruota un osso attorno a un asse espresso nel riferimento del Prof (profRoot),
  // qualunque sia il riferimento locale dell'osso (che nei file Sketchfab è imprevedibile).
  const qParent = new THREE.Quaternion();
  const qBone = new THREE.Quaternion();
  const qRot = new THREE.Quaternion();
  const qRoot = new THREE.Quaternion();
  const axisW = new THREE.Vector3();
  const AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
  function turnBone(bone, axis, angle) {
    if (!angle) return;
    profRoot.getWorldQuaternion(qRoot);
    axisW.copy(AX[axis]).applyQuaternion(qRoot);
    bone.parent.getWorldQuaternion(qParent);
    bone.getWorldQuaternion(qBone);
    qRot.setFromAxisAngle(axisW, angle);
    bone.quaternion.copy(qParent.invert().multiply(qRot.multiply(qBone)));
    bone.updateMatrixWorld(true);
  }

  // Valori morbidi della posa GLB (si inseguono i bersagli con un lerp)
  const pose = { headYaw: 0, pitch: 0, talk: 0, cheer: 0 };

  function poseGlb(t, lerpK, headYaw, pitch, talking, cheering) {
    const r = profRig;
    pose.headYaw += (headYaw - pose.headYaw) * lerpK;
    pose.pitch += (pitch - pose.pitch) * lerpK;
    pose.talk += ((talking ? 1 : 0) - pose.talk) * lerpK;
    pose.cheer += ((cheering ? 1 : 0) - pose.cheer) * lerpK;

    for (const [b, q] of r.base) b.quaternion.copy(q);
    profRoot.updateMatrixWorld(true);

    // Busto: respiro e leggero dondolio
    turnBone(r.spine, 'z', Math.sin(t * 1.3) * 0.025);
    turnBone(r.spine, 'x', Math.sin(t * 2.6) * 0.012 + pose.talk * Math.sin(t * 3.4) * 0.03);

    // Testa: segue il giocatore, annuisce mentre parla
    turnBone(r.head, 'y', pose.headYaw);
    turnBone(r.head, 'x', -pose.pitch + pose.talk * Math.sin(t * 5.2) * 0.07);

    // Braccia: dalla T-pose giù lungo i fianchi; esultando, su al cielo
    // esultando le braccia vanno quasi dritte in su: larghe di lato entravano nella finestra
    const wiggle = Math.sin(t * 9) * 0.12 * pose.cheer;
    const down = 1.2 * (1 - pose.cheer) - (1.32 + wiggle) * pose.cheer;
    const [negUp, negLow] = r.armNeg;
    const [posUp, posLow] = r.armPos;
    turnBone(negUp, 'z', down);
    turnBone(posUp, 'z', -down);
    turnBone(negUp, 'x', -0.18 - pose.talk * (0.9 + Math.sin(t * 3.4) * 0.25));
    turnBone(posUp, 'x', -0.18);
    turnBone(negLow, 'x', -0.25 - pose.talk * (0.7 + Math.sin(t * 3.4 + 1) * 0.3));
    turnBone(posLow, 'x', -0.25);

    // Saltelli di gioia
    r.model.position.y = pose.cheer * Math.abs(Math.sin(t * 6)) * 0.16;
  }

  function animateProf(dt, camPos) {
    const t = state.pulse;
    const lerpK = 1 - Math.exp(-dt * 6);

    // Si gira verso il giocatore quando è vicino
    profRoot.getWorldPosition(tmp);
    const dx = camPos.x - tmp.x;
    const dz = camPos.z - tmp.z;
    const horiz = Math.hypot(dx, dz);
    const targetYaw = Math.atan2(dx, dz);
    if (horiz < 7) {
      const diff = wrapAngle(targetYaw - profRoot.rotation.y);
      profRoot.rotation.y += diff * (1 - Math.exp(-dt * 1.8));
    }
    const headYaw = horiz < 9 ? clamp(wrapAngle(targetYaw - profRoot.rotation.y), -0.75, 0.75) : 0;
    const headY = tmp.y + (profRig ? 1.3 : 1.67) * PROF_SCALE;
    const pitch = horiz < 9 ? clamp(Math.atan2(camPos.y - headY, Math.max(horiz, 0.3)), -0.35, 0.35) : 0;

    // parla mentre la sua voce suona; senza voce, mentre la sua battuta è a schermo
    const talking = voicePlaying() || (!voice && dialogueOpen && speaker === 'Prof');
    const cheering = state.step === STEPS.WIN;

    if (profRig) {
      poseGlb(t, lerpK, headYaw, pitch, talking, cheering);
      return;
    }

    // --- Prof procedurale di riserva ---
    prof.upper.position.y = Math.sin(t * 1.6) * 0.004;
    const nod = talking ? Math.sin(t * 5.2) * 0.05 : 0;

    prof.head.rotation.y += (headYaw - prof.head.rotation.y) * lerpK;
    prof.head.rotation.x += (-pitch + nod - prof.head.rotation.x) * lerpK;
    prof.mouth.scale.y = talking ? 1 + 2.2 * Math.abs(Math.sin(t * 13)) : 1;

    const { left, right } = prof.arms;
    let lS = { x: 0, z: -0.1 }, lE = -0.25;
    let rS = { x: 0, z: 0.1 }, rE = -0.25;
    if (cheering) {
      const b = Math.sin(t * 8) * 0.15;
      lS = { x: 0, z: -2.6 - b };
      rS = { x: 0, z: 2.6 + b };
      lE = rE = -0.3;
      prof.upper.position.y += Math.abs(Math.sin(t * 8)) * 0.02;
    } else if (talking) {
      rS = { x: -0.75 - Math.sin(t * 3.4) * 0.22, z: 0.25 };
      rE = -1.1 - Math.sin(t * 3.4 + 1) * 0.25;
      lS = { x: -0.15, z: -0.12 };
      lE = -0.5;
    }
    left.shoulder.rotation.x += (lS.x - left.shoulder.rotation.x) * lerpK;
    left.shoulder.rotation.z += (lS.z - left.shoulder.rotation.z) * lerpK;
    right.shoulder.rotation.x += (rS.x - right.shoulder.rotation.x) * lerpK;
    right.shoulder.rotation.z += (rS.z - right.shoulder.rotation.z) * lerpK;
    left.elbow.rotation.x += (lE - left.elbow.rotation.x) * lerpK;
    right.elbow.rotation.x += (rE - right.elbow.rotation.x) * lerpK;
  }

  function tick(dt, camPos) {
    state.pulse += dt;
    const wave = 0.5 + 0.5 * Math.sin(state.pulse * 3.2);
    state.markers.forEach((m) => {
      if (!m.group.visible) return;
      m.arrow.position.y = m.arrowY + wave * 0.08;
      m.arrow.rotation.y += dt * 1.5;
      m.arrow.material.emissiveIntensity = 0.8 + wave * 0.9;
      m.light.intensity = 0.5 + wave * 0.8;
      if (m.ring) m.ring.scale.setScalar(0.92 + wave * 0.12);
    });

    // Raccolta: l'oggetto sale, gira e sparisce in mezzo secondo
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.t = Math.min(1, p.t + dt / 0.55);
      const k = p.t;
      p.obj.position.set(p.from.x, p.from.y + 0.35 * Math.sin(k * Math.PI * 0.5), p.from.z);
      p.obj.rotation.y += dt * 9;
      p.obj.scale.setScalar(Math.max(0.001, 1 - k * k));
      if (p.t >= 1) {
        p.obj.visible = false;
        pickups.splice(i, 1);
      }
    }

    // Leva del quadretto
    panel.lever.rotation.x += (leverTarget - panel.lever.rotation.x) * (1 - Math.exp(-dt * 14));

    animateProf(dt, camPos);
    updatePrompt(camPos);
  }

  function restoreProp(obj, home) {
    obj.visible = true;
    obj.scale.setScalar(1);
    if (home) obj.position.copy(home);
  }

  function reset() {
    state.step = STEPS.INTRO;
    state.powerOn = true;
    state.hasTester = false;
    state.hasFuse = false;
    state.repaired = false;
    state.rewired = false;
    state.talked = false;
    state.repairMeasured = false;
    state.repairReplaced = false;
    dialogueOpen = false;
    dialogueQueue = [];
    speaker = null;
    stopVoice();
    pickups.length = 0;
    restoreProp(deskTester.group, homes.tester);
    deskTester.group.rotation.y = -0.5;
    restoreProp(fuseBox, homes.fuse);
    fuseBox.rotation.y = 0.3;
    setSwitch(true);
    refreshProps();
    ui.hideDialogue();
    ui.closeRepair();
    ui.hideWin();
    ui.setPowerVisual(true);
    setStep(STEPS.TALK_PROF);
    showDialogue([profLine('benvenuto'), profLine('vieni')]);
  }

  /** Da chiamare quando il GLB è in scena: appoggia oggetti e Prof sulle superfici vere. */
  function attachWorld(root) {
    world = root;
    world.updateMatrixWorld(true);
    placeObjects();
  }

  refreshMarkers();
  refreshProps();

  return {
    state,
    reset,
    interact,
    canBootTV,
    onTVBlocked,
    onTVSuccessBoot,
    tick,
    nearestActive,
    attachWorld,
    colliders: [{ obj: profRoot, r: 0.42 * PROF_SCALE }], // il Prof blocca la camera come un cilindro
    setQuality,
    setVoice,
    isVoiceOn: () => voiceOn,
    STEPS
  };
}

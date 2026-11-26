// Singola fonte di verità geometrica del tavolo Flipper di Patty (piano XZ: W=10, H=18)

export const TABLE = {
  width: 10,
  height: 18,
  halfW: 5,
  halfH: 9,
  ballRadius: 0.21,
  shooterDividerX: 4.12,
  shooterLaneCenterX: 4.54,
  plungerRestZ: 7.75,
  drainZ: 8.65,
  // Centro orizzontale dell'area giocabile attiva [-4.85, +4.12]
  playCenterX: -0.365,
};

function buildUpperArchSegments() {
  const segs = [];
  // Arco superiore ellittico che collega (-4.85, -4.6) -> (0.04, -8.68) -> (4.92, -4.6)
  // così la pallina lanciata dal canale destro gira fluida verso l'alto e scende sulle corsie P-A-T.
  const cx = 0.04;
  const cz = -4.6;
  const rx = 4.88;
  const rz = 4.08;
  const steps = 22;
  for (let i = 0; i < steps; i++) {
    const a0 = Math.PI + (i / steps) * Math.PI;
    const a1 = Math.PI + ((i + 1) / steps) * Math.PI;
    segs.push({
      x1: cx + Math.cos(a0) * rx,
      z1: cz + Math.sin(a0) * rz,
      x2: cx + Math.cos(a1) * rx,
      z2: cz + Math.sin(a1) * rz,
      restitution: 0.65,
      kind: 'arch',
    });
  }
  return segs;
}

export const WALL_SEGMENTS = [
  ...buildUpperArchSegments(),
  // Parete sinistra esterna
  { x1: -4.84, z1: -4.6, x2: -4.84, z2: 6.25, restitution: 0.6, kind: 'wall' },
  // Imbuto inferiore sinistro verso drain
  { x1: -4.84, z1: 6.25, x2: -1.45, z2: 8.55, restitution: 0.5, kind: 'wall' },
  // Parete destra esterna (canale di lancio)
  { x1: 4.92, z1: -4.6, x2: 4.92, z2: 8.35, restitution: 0.55, kind: 'wall' },
  // Fondo canale di lancio
  { x1: 4.12, z1: 8.35, x2: 4.92, z2: 8.35, restitution: 0.3, kind: 'wall' },
  // Divisorio tra area di gioco e canale di lancio
  { x1: 4.12, z1: -4.85, x2: 4.12, z2: 8.35, restitution: 0.6, kind: 'divider' },
  // Imbuto inferiore destro verso drain (dal muro interno a destra)
  { x1: 4.12, z1: 6.25, x2: 0.72, z2: 8.55, restitution: 0.5, kind: 'wall' },

  // Guide interne Inlane -> Flipper Sinistro
  { x1: -4.08, z1: 3.3, x2: -4.08, z2: 5.15, restitution: 0.5, kind: 'rail' },
  { x1: -4.08, z1: 5.15, x2: -1.96, z2: 6.32, restitution: 0.45, kind: 'rail' },

  // Guide interne Inlane -> Flipper Destro
  { x1: 3.35, z1: 3.3, x2: 3.35, z2: 5.15, restitution: 0.5, kind: 'rail' },
  { x1: 3.35, z1: 5.15, x2: 1.23, z2: 6.32, restitution: 0.45, kind: 'rail' },

  // Divisori verticali delle corsie P-A-T in alto (sotto i medaglioni P-A-T)
  { x1: -1.85, z1: -6.45, x2: -1.85, z2: -5.25, restitution: 0.6, kind: 'laneWall' },
  { x1: -0.85, z1: -6.55, x2: -0.85, z2: -5.25, restitution: 0.6, kind: 'laneWall' },
  { x1: 0.15, z1: -6.55, x2: 0.15, z2: -5.25, restitution: 0.6, kind: 'laneWall' },
  { x1: 1.15, z1: -6.45, x2: 1.15, z2: -5.25, restitution: 0.6, kind: 'laneWall' },

  // Deflettore curvo orbit destro (guida il giro intorno alla zona bumper)
  { x1: 2.38, z1: -6.35, x2: 2.98, z2: -5.45, restitution: 0.65, kind: 'rail' },
  { x1: 2.98, z1: -5.45, x2: 3.12, z2: -3.55, restitution: 0.65, kind: 'rail' },
  { x1: 3.12, z1: -3.55, x2: 2.75, z2: -2.05, restitution: 0.65, kind: 'rail' },

  // Sponda laterale sinistra dietro i Drop Target (protezione morbida)
  { x1: -4.84, z1: -4.6, x2: -4.55, z2: -4.15, restitution: 0.6, kind: 'rail' },
];

// Gate unidirezionale all'uscita della shooter lane: lascia uscire la pallina (vz < 0),
// le impedisce di rientrare nel canale una volta in gioco.
export const ONE_WAY_GATE = {
  x1: 4.12,
  z1: -4.85,
  x2: 4.88,
  z2: -5.45,
};

export const FLIPPERS = [
  {
    id: 'left',
    pivotX: -1.92,
    pivotZ: 6.32,
    length: 1.24,
    radiusBase: 0.15,
    radiusTip: 0.10,
    restAngle: 0.44,    // +25 deg verso il basso a destra
    activeAngle: -0.50, // -28.6 deg verso l'alto
    side: 1,
  },
  {
    id: 'right',
    pivotX: 1.19,
    pivotZ: 6.32,
    length: 1.24,
    radiusBase: 0.15,
    radiusTip: 0.10,
    restAngle: Math.PI - 0.44,
    activeAngle: Math.PI + 0.50,
    side: -1,
  },
];

export const BUMPERS = [
  { id: 'elefantino', label: 'Elefantino', x: -0.35, z: -3.85, r: 0.55, score: 250, impulse: 9.8, color: 0xff3ea5 },
  { id: 'biscotto', label: 'Biscotto', x: -1.68, z: -2.25, r: 0.49, score: 150, impulse: 9.0, color: 0xffbe3b },
  { id: 'ciotola', label: 'Ciotola', x: 1.02, z: -2.25, r: 0.49, score: 150, impulse: 9.0, color: 0x4fd1c5 },
];

// Slingshot triangolari: il lato attivo (kicker) è quello rivolto verso il centro-alto
export const SLINGSHOTS = [
  {
    id: 'sling-left',
    vertices: [
      { x: -3.48, z: 3.15 },
      { x: -3.48, z: 4.78 },
      { x: -2.32, z: 5.28 },
    ],
    // Lato attivo: da (-3.48, 3.15) a (-2.32, 5.28)
    kicker: { x1: -3.48, z1: 3.15, x2: -2.32, z2: 5.28, nx: 0.88, nz: -0.47, impulse: 9.6, score: 100 },
  },
  {
    id: 'sling-right',
    vertices: [
      { x: 2.75, z: 3.15 },
      { x: 2.75, z: 4.78 },
      { x: 1.59, z: 5.28 },
    ],
    // Lato attivo: da (2.75, 3.15) a (1.59, 5.28)
    kicker: { x1: 2.75, z1: 3.15, x2: 1.59, z2: 5.28, nx: -0.88, nz: -0.47, impulse: 9.6, score: 100 },
  },
];

export const ROLLOVERS = [
  { id: 'P', x: -1.35, z: -5.85, r: 0.28 },
  { id: 'A', x: -0.35, z: -5.95, r: 0.28 },
  { id: 'T', x: 0.65, z: -5.85, r: 0.28 },
];

// 3 Drop Target sulla sinistra ("Biscotti Cucina")
export const DROP_TARGETS = [
  { id: 0, x1: -4.46, z1: -3.65, x2: -4.32, z2: -2.95, score: 300 },
  { id: 1, x1: -4.32, z1: -2.65, x2: -4.18, z2: -1.95, score: 300 },
  { id: 2, x1: -4.18, z1: -1.65, x2: -4.04, z2: -0.95, score: 300 },
];

// Sensore Spinner nell'orbit destro ("Giro in Giardino")
export const ORBIT_SPINNER = {
  x: 3.58,
  z: -3.75,
  r: 0.42,
  score: 350,
};

// Posizione del piedistallo 3D di Patty seduta nell'angolo alto sinistro fuori dall'arco giocabile
export const PATTY_STATUE_SPOT = {
  x: -3.95,
  y: 0.36,
  z: -7.85,
  targetHeight: 2.58,
  yaw: 0.34,
  pitch: 0.0,
};

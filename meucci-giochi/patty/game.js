/* Patty: Avventura a Casa di Silvia — 2.5D Cycles Platformer */

const WORLD_W = 1600;
const WORLD_H = 900;
const VIEW_W = 1280;
const VIEW_H = 720;
const CAM_ZOOM = 1.0;
const VIS_W = VIEW_W / CAM_ZOOM;
const VIS_H = VIEW_H / CAM_ZOOM;

const SPRITE_CELL = 256;
// Baseline padding inside each 256x256 frame (grounded paws sit at y = 240/256)
const SPRITE_FOOT_RATIO = 240 / 256;

// Frame indices inside assets/props_sprites.png (1536x256)
const PROP = {
  ELEFANTINO: 0,
  BEE: 1,
  ROOMBA: 2,
  BALL: 3,
  BONE: 4,
  BOWL: 5,
};

const STAGES = [
  {
    id: 0,
    name: "1. Vialetto d'Ingresso",
    bgSrc: "assets/bg_01_vialetto.webp",
    pattyDrawSize: 230,
    sunSkew: 0.28,
    spawn: { x: 110, y: 755 },
    groundY: 755,
    sunBeams: [
      { x: 320, w: 190, angle: 0.24, alpha: 0.14 },
      { x: 960, w: 230, angle: 0.24, alpha: 0.16 },
    ],
    platforms: [
      { x: 840, y: 635, w: 230, label: "Cordolo" },
      { x: 865, y: 575, w: 505, label: "Portico" },
      { x: 110, y: 495, w: 270, label: "Ramo d'ulivo" },
      { x: 220, y: 350, w: 290, label: "Chioma dell'ulivo" },
      { x: 1190, y: 470, w: 330, label: "Siepe" },
    ],
    treats: [
      { x: 250, y: 700 },
      { x: 430, y: 660 },
      { x: 610, y: 700 },
      { x: 235, y: 445 },
      { x: 345, y: 445 },
      { x: 930, y: 585 },
      { x: 1050, y: 525 },
      { x: 1180, y: 525 },
      { x: 1320, y: 415 },
      { x: 1430, y: 415 },
    ],
    elefantino: { x: 360, y: 295 },
    hazards: [
      { type: "ball", x: 540, y: 755, minX: 340, maxX: 790, speed: 155 },
      { type: "bee", x: 1140, y: 430, minX: 920, maxX: 1410, speed: 125 },
    ],
    goal: { x: 1475, y: 755, label: "Verso Casa" },
  },
  {
    id: 1,
    name: "2. Salotto e Scala",
    bgSrc: "assets/bg_02_soggiorno.webp",
    pattyDrawSize: 248,
    sunSkew: 0.26,
    spawn: { x: 115, y: 785 },
    groundY: 785,
    sunBeams: [
      { x: 420, w: 260, angle: 0.22, alpha: 0.2 },
      { x: 890, w: 170, angle: 0.12, alpha: 0.14 },
    ],
    platforms: [
      { x: 50, y: 655, w: 430, label: "Pouf maculato" },
      { x: 465, y: 645, w: 590, label: "Divano a righe" },
      { x: 485, y: 495, w: 545, label: "Schienale divano" },
      { x: 1125, y: 615, w: 135, label: "Pouf marrone" },
      { x: 990, y: 540, w: 145, label: "Gradino" },
      { x: 1115, y: 435, w: 160, label: "Gradino" },
      { x: 1220, y: 335, w: 170, label: "Scala alta" },
      { x: 830, y: 345, w: 125, label: "Lampada" },
    ],
    treats: [
      { x: 200, y: 600 },
      { x: 350, y: 600 },
      { x: 580, y: 590 },
      { x: 760, y: 590 },
      { x: 640, y: 440 },
      { x: 890, y: 290 },
      { x: 1060, y: 485 },
      { x: 1190, y: 380 },
      { x: 1195, y: 725 },
      { x: 1380, y: 725 },
    ],
    elefantino: { x: 1305, y: 280 },
    hazards: [
      { type: "roomba", x: 620, y: 785, minX: 250, maxX: 980, speed: 145 },
      { type: "ball", x: 1250, y: 785, minX: 1020, maxX: 1440, speed: 170 },
    ],
    goal: { x: 1495, y: 785, label: "Verso la Cucina" },
  },
  {
    id: 2,
    name: "3. Cucina con Penisola",
    bgSrc: "assets/bg_03_cucina.webp",
    pattyDrawSize: 256,
    sunSkew: -0.32,
    minX: 435,
    spawn: { x: 465, y: 765 },
    groundY: 765,
    sunBeams: [
      { x: 1180, w: 320, angle: -0.25, alpha: 0.22 },
      { x: 760, w: 190, angle: -0.2, alpha: 0.11 },
    ],
    platforms: [
      { x: 400, y: 482, w: 260, label: "Piano lavello" },
      { x: 660, y: 482, w: 480, label: "Penisola in marmo" },
      { x: 470, y: 318, w: 315, label: "Pensile piatti" },
      { x: 485, y: 195, w: 310, label: "Anta aperta" },
      { x: 1365, y: 605, w: 220, label: "Bracciolo divano" },
    ],
    treats: [
      { x: 615, y: 700 },
      { x: 790, y: 700 },
      { x: 515, y: 428 },
      { x: 740, y: 428 },
      { x: 920, y: 428 },
      { x: 1065, y: 428 },
      { x: 560, y: 145 },
      { x: 710, y: 145 },
      { x: 1220, y: 700 },
      { x: 1460, y: 550 },
    ],
    elefantino: { x: 635, y: 264 },
    hazards: [
      { type: "roomba", x: 880, y: 765, minX: 540, maxX: 1180, speed: 165 },
      { type: "bee", x: 900, y: 380, minX: 640, maxX: 1140, speed: 140 },
    ],
    goal: { x: 1315, y: 765, label: "Verso il Giardino" },
  },
  {
    id: 3,
    name: "4. Patio e Giardino",
    bgSrc: "assets/bg_04_giardino.webp",
    pattyDrawSize: 230,
    sunSkew: 0.28,
    spawn: { x: 105, y: 710 },
    groundY: 710,
    sunBeams: [
      { x: 340, w: 220, angle: 0.22, alpha: 0.16 },
      { x: 1040, w: 260, angle: 0.22, alpha: 0.18 },
    ],
    platforms: [
      { x: 245, y: 598, w: 1200, label: "Patio" },
      { x: 485, y: 530, w: 80, label: "Sedia" },
      { x: 565, y: 512, w: 85, label: "Tavolino" },
      { x: 650, y: 530, w: 80, label: "Sedia" },
      { x: 415, y: 455, w: 355, label: "Davanzale" },
      { x: 10, y: 430, w: 360, label: "Siepe" },
      { x: 160, y: 265, w: 1180, label: "Tettoia" },
    ],
    treats: [
      { x: 190, y: 375 },
      { x: 380, y: 545 },
      { x: 525, y: 475 },
      { x: 608, y: 458 },
      { x: 690, y: 475 },
      { x: 575, y: 400 },
      { x: 430, y: 210 },
      { x: 605, y: 210 },
      { x: 960, y: 210 },
      { x: 1160, y: 545 },
    ],
    elefantino: { x: 785, y: 210 },
    hazards: [
      { type: "bee", x: 560, y: 385, minX: 340, maxX: 880, speed: 150 },
      { type: "ball", x: 980, y: 598, minX: 740, maxX: 1320, speed: 175 },
      { type: "bee", x: 1100, y: 225, minX: 820, maxX: 1310, speed: 135 },
    ],
    goal: { x: 1415, y: 598, label: "Ciotola Finale!" },
  },
];

// --- Procedural Web Audio + Real Bark SFX ---
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.barkBuffer = null;
    this.barkRawPromise = null;
    this.barkFallbackAudio = null;
    this.decodingBark = false;
  }

  preloadBark() {
    if (!this.barkRawPromise && typeof fetch === "function") {
      this.barkRawPromise = fetch("assets/patty_bark.mp3")
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .catch(() => null);
    }
    if (!this.barkFallbackAudio && typeof Audio !== "undefined") {
      this.barkFallbackAudio = new Audio("assets/patty_bark.mp3");
      this.barkFallbackAudio.preload = "auto";
    }
  }

  ensureCtx() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.barkBuffer && !this.decodingBark) {
      this.decodingBark = true;
      this.preloadBark();
      if (this.barkRawPromise) {
        this.barkRawPromise
          .then((ab) => (ab && this.ctx ? this.ctx.decodeAudioData(ab.slice(0)) : null))
          .then((decoded) => {
            if (decoded) this.barkBuffer = decoded;
          })
          .catch(() => {})
          .finally(() => {
            this.decodingBark = false;
          });
      }
    }
    return this.ctx;
  }

  tone(freqStart, freqEnd, duration, type = "sine", gainVal = 0.12, delay = 0) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + duration);
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(gainVal, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  jump(isDouble) {
    if (isDouble) {
      this.tone(420, 760, 0.14, "triangle", 0.12);
    } else {
      this.tone(280, 560, 0.13, "triangle", 0.11);
    }
  }

  bark() {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (ctx && this.barkBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.barkBuffer;
      src.playbackRate.value = 0.96 + Math.random() * 0.08;
      const g = ctx.createGain();
      g.gain.value = 0.85;
      src.connect(g);
      g.connect(ctx.destination);
      src.start();
      return;
    }
    if (this.barkFallbackAudio) {
      try {
        this.barkFallbackAudio.currentTime = 0;
        this.barkFallbackAudio.volume = 0.85;
        this.barkFallbackAudio.play().catch(() => {});
        return;
      } catch (_) {}
    }
    this.tone(240, 140, 0.06, "sine", 0.08);
  }

  treat(combo) {
    const base = 523.25 * Math.pow(1.06, Math.min(combo, 10));
    this.tone(base, base * 1.25, 0.12, "sine", 0.13);
  }

  elefantino() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.tone(f, f * 1.03, 0.16, "triangle", 0.14, i * 0.075);
    });
  }

  hurt() {
    this.tone(240, 110, 0.22, "sawtooth", 0.12);
  }

  win() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      this.tone(f, f, 0.2, "triangle", 0.14, i * 0.09);
    });
  }
}

const sfx = new SoundFX();

// --- DOM Elements ---
const stageEl = document.getElementById("game-stage");
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hudStageName = document.getElementById("hud-stage-name");
const hudHearts = document.getElementById("hud-hearts");
const hudTreats = document.getElementById("hud-treats");
const hudElefantino = document.getElementById("hud-elefantino");
const elefantinoStat = hudElefantino.closest(".elefantino-stat");
const btnMute = document.getElementById("btn-mute");
const btnFs = document.getElementById("btn-fs");
const fsExitBtn = document.getElementById("fs-exit");
const btnPause = document.getElementById("btn-pause");
const btnStageMenu = document.getElementById("btn-stage-menu");

const menuDialog = document.getElementById("menu-dialog");
const pauseDialog = document.getElementById("pause-dialog");
const victoryDialog = document.getElementById("victory-dialog");
const victoryBadge = document.getElementById("victory-badge");
const victoryTitle = document.getElementById("victory-title");
const victorySummary = document.getElementById("victory-summary");
const btnVictoryNext = document.getElementById("btn-victory-next");

// --- Asset Loading & Pre-baked Silhouette Shadow Strip ---
let pattyShadowStrip = null;

const assets = {
  sprite: new Image(),
  props: new Image(),
  bgs: new Map(),
};

assets.sprite.onload = () => {
  const off = document.createElement("canvas");
  off.width = assets.sprite.naturalWidth;
  off.height = assets.sprite.naturalHeight;
  const octx = off.getContext("2d");
  octx.drawImage(assets.sprite, 0, 0);
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = "#161210";
  octx.fillRect(0, 0, off.width, off.height);
  pattyShadowStrip = off;
};
assets.sprite.src = "assets/patty_sprites.png?v=4";
assets.props.src = "assets/props_sprites.png?v=4";

for (const s of STAGES) {
  const img = new Image();
  img.src = s.bgSrc;
  assets.bgs.set(s.id, img);
}

// --- Game State ---
const keys = new Set();
let selectedStartStage = 0;
let currentStageIdx = 0;
let paused = true;
let stageCleared = false;
let animFrameId = null;
let lastTimestamp = 0;
let elapsedTime = 0;
let visibilityPaused = false;

const dustMotes = Array.from({ length: 34 }, () => ({
  x: Math.random() * WORLD_W,
  y: Math.random() * WORLD_H * 0.88,
  r: 1.5 + Math.random() * 2.6,
  vx: -10 + Math.random() * 20,
  vy: -8 + Math.random() * 14,
  phase: Math.random() * Math.PI * 2,
}));

const state = {
  camX: 0,
  camY: 0,
  hearts: 3,
  combo: 0,
  treatsCollected: 0,
  elefantinoFound: false,
  totalTreatsAcrossRun: 0,
  totalElefantiniAcrossRun: 0,
  particles: [],
  shockwaves: [],
  treats: [],
  elefantino: null,
  hazards: [],
  patty: {
    x: 110,
    y: 755,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: false,
    jumpsUsed: 0,
    coyoteTimer: 0,
    jumpBuffer: 0,
    animTimer: 0,
    invulnTimer: 0,
    barkCooldown: 0,
    barkAnimTimer: 0,
    squashX: 1,
    squashY: 1,
    currentPlatform: null,
  },
};

function loadStage(idx) {
  currentStageIdx = ((idx % STAGES.length) + STAGES.length) % STAGES.length;
  const cfg = STAGES[currentStageIdx];
  stageCleared = false;
  state.hearts = 3;
  state.combo = 0;
  state.treatsCollected = 0;
  state.elefantinoFound = false;
  state.particles = [];
  state.shockwaves = [];

  state.treats = cfg.treats.map((t, i) => ({
    x: t.x,
    y: t.y,
    collected: false,
    phase: i * 0.7,
  }));
  state.elefantino = {
    x: cfg.elefantino.x,
    y: cfg.elefantino.y,
    collected: false,
  };
  state.hazards = cfg.hazards.map((h, i) => ({
    ...h,
    dir: i % 2 === 0 ? 1 : -1,
    stunTimer: 0,
    phase: i * 1.3,
  }));

  Object.assign(state.patty, {
    x: cfg.spawn.x,
    y: cfg.spawn.y,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    jumpsUsed: 0,
    coyoteTimer: 0,
    jumpBuffer: 0,
    animTimer: 0,
    invulnTimer: 0,
    barkCooldown: 0,
    barkAnimTimer: 0,
    squashX: 1,
    squashY: 1,
    currentPlatform: null,
  });

  state.camX = Math.max(0, Math.min(WORLD_W - VIS_W, state.patty.x - VIS_W * 0.36));
  state.camY = Math.max(0, Math.min(WORLD_H - VIS_H, state.patty.y - VIS_H * 0.72));
  updateHUD();
  syncStageChips();
}

function updateHUD() {
  const cfg = STAGES[currentStageIdx];
  hudStageName.textContent = cfg.name;
  hudHearts.textContent = "❤️".repeat(state.hearts) + "🤍".repeat(Math.max(0, 3 - state.hearts));
  hudTreats.textContent = `${state.treatsCollected} / ${state.treats.length}`;
  hudElefantino.textContent = state.elefantinoFound ? "1 / 1" : "0 / 1";
  elefantinoStat.classList.toggle("is-found", state.elefantinoFound);
}

function syncStageChips() {
  document.querySelectorAll(".stage-chip").forEach((btn) => {
    const id = Number(btn.dataset.stage);
    const active = menuDialog.open ? id === selectedStartStage : id === currentStageIdx;
    btn.classList.toggle("is-active", active);
  });
}

function spawnBurst(x, y, color, count = 12, speed = 170) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const sp = speed * (0.45 + Math.random() * 0.7);
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 45,
      r: 2.5 + Math.random() * 3.5,
      life: 0.45 + Math.random() * 0.25,
      maxLife: 0.7,
      color,
    });
  }
}

function triggerJump() {
  const p = state.patty;
  const canGroundJump = p.grounded || p.coyoteTimer > 0;
  if (canGroundJump) {
    p.vy = -805;
    p.grounded = false;
    p.coyoteTimer = 0;
    p.jumpsUsed = 1;
    p.squashX = 0.84;
    p.squashY = 1.18;
    spawnBurst(p.x, p.y, "rgba(255,244,214,0.85)", 7, 110);
    sfx.jump(false);
    return true;
  }
  if (p.jumpsUsed < 2) {
    p.vy = -725;
    p.jumpsUsed = 2;
    p.squashX = 0.86;
    p.squashY = 1.16;
    spawnBurst(p.x, p.y - 24, "#fde68a", 9, 130);
    sfx.jump(true);
    return true;
  }
  return false;
}

function triggerBark() {
  const p = state.patty;
  if (p.barkCooldown > 0 || paused || pausedByRotation()) return;
  p.barkCooldown = 0.55;
  p.barkAnimTimer = 0.26;
  p.squashX = 1.15;
  p.squashY = 0.88;
  sfx.bark();
  state.shockwaves.push({
    x: p.x + p.facing * 56,
    y: p.y - STAGES[currentStageIdx].pattyDrawSize * 0.48,
    facing: p.facing,
    r: 18,
    maxR: 255,
    life: 0.36,
    maxLife: 0.36,
  });

  for (const h of state.hazards) {
    const dx = h.x - p.x;
    const dy = h.y - (p.y - 44);
    if (Math.hypot(dx, dy) < 265) {
      h.stunTimer = 2.6;
      spawnBurst(h.x, h.y - 18, "#f472b6", 10, 145);
    }
  }
}

function handleKeyDown(e) {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
    if (!menuDialog.open && !pauseDialog.open && !victoryDialog.open) {
      e.preventDefault();
    }
  }

  if ((e.code === "KeyP" || e.code === "Escape") && !menuDialog.open && !victoryDialog.open) {
    if (!pauseDialog.open) {
      openPauseDialog();
    }
    return;
  }

  if (paused) return;

  if (!keys.has(e.code)) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      state.patty.jumpBuffer = 0.12;
    } else if (e.code === "KeyB" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
      triggerBark();
    }
  }
  keys.add(e.code);
}

function handleKeyUp(e) {
  keys.delete(e.code);
  if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && state.patty.vy < -280) {
    state.patty.vy *= 0.56;
  }
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

document.querySelectorAll(".touch-btn").forEach((btn) => {
  const code = btn.dataset.key;
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (paused) return;
    if (code === "Space") state.patty.jumpBuffer = 0.12;
    else if (code === "KeyB") triggerBark();
    else keys.add(code);
  });
  const release = () => keys.delete(code);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("pointerleave", release);
});

// --- Dialogs (native <dialog> best practices) ---
function openPauseDialog() {
  paused = true;
  keys.clear();
  syncStageChips();
  if (!pauseDialog.open) pauseDialog.showModal();
}

function openVictoryDialog() {
  paused = true;
  stageCleared = true;
  keys.clear();
  sfx.win();
  state.totalTreatsAcrossRun += state.treatsCollected;
  if (state.elefantinoFound) state.totalElefantiniAcrossRun += 1;

  const isLast = currentStageIdx === STAGES.length - 1;
  victoryBadge.textContent = isLast ? "Casa Esplorata!" : "Stanza Completata!";
  victoryTitle.textContent = isLast ? "Gran Festa per Patty!" : "Brava Patty!";
  victorySummary.textContent = isLast
    ? `Hai completato tutte le stanze di Casa di Silvia raccogliendo ${state.treatsCollected}/${state.treats.length} biscotti qui e l'Elefantino Fucsia: ${state.elefantinoFound ? "trovato!" : "ancora nascosto"}.`
    : `Hai raccolto ${state.treatsCollected}/${state.treats.length} biscotti dorati${state.elefantinoFound ? " e anche l'Elefantino Fucsia!" : "."}`;
  btnVictoryNext.textContent = isLast ? "Ricomincia dal Vialetto" : "Prossima stanza";
  if (!victoryDialog.open) victoryDialog.showModal();
}

menuDialog.addEventListener("close", () => {
  const choice = menuDialog.returnValue;
  menuDialog.returnValue = "";
  if (choice === "play") {
    loadStage(selectedStartStage);
    paused = false;
    sfx.ensureCtx();
  } else {
    paused = false;
  }
});

pauseDialog.addEventListener("close", () => {
  const choice = pauseDialog.returnValue;
  pauseDialog.returnValue = "";
  if (choice === "restart") {
    loadStage(currentStageIdx);
  }
  paused = false;
});

victoryDialog.addEventListener("close", () => {
  const choice = victoryDialog.returnValue;
  victoryDialog.returnValue = "";
  if (choice === "next") {
    const nextIdx = (currentStageIdx + 1) % STAGES.length;
    if (nextIdx === 0) {
      state.totalTreatsAcrossRun = 0;
      state.totalElefantiniAcrossRun = 0;
    }
    loadStage(nextIdx);
  } else {
    loadStage(currentStageIdx);
  }
  paused = false;
});

document.querySelectorAll("#menu-dialog .stage-chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedStartStage = Number(btn.dataset.stage);
    syncStageChips();
  });
});

document.querySelectorAll("#pause-stage-picker .stage-chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    loadStage(Number(btn.dataset.stage));
    pauseDialog.close("resume");
  });
});

const portraitMedia = window.matchMedia("(orientation: portrait)");
const isTouchDevice = () => window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
let fsActive = false;
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const pausedByRotation = () => fsActive && portraitMedia.matches;

function setFsUi(on) {
  fsActive = on;
  stageEl.classList.toggle("is-fs", on);
}

function enterFullscreen() {
  if (fsActive) return;
  setFsUi(true);
  const rootEl = document.documentElement;
  const req = rootEl.requestFullscreen || rootEl.webkitRequestFullscreen;
  if (!req) return;
  try {
    Promise.resolve(req.call(rootEl, { navigationUI: "hide" }))
      .then(() => screen.orientation?.lock?.("landscape"))
      .catch(() => {});
  } catch (_) {}
}

function exitFullscreen() {
  setFsUi(false);
  try {
    screen.orientation?.unlock?.();
  } catch (_) {}
  if (fsElement()) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    exit?.call(document);
  }
}

["fullscreenchange", "webkitfullscreenchange"].forEach((ev) => {
  document.addEventListener(ev, () => {
    if (!fsElement() && fsActive) setFsUi(false);
  });
});

menuDialog.querySelector('button[value="play"]')?.addEventListener("click", () => {
  sfx.ensureCtx();
  if (isTouchDevice()) enterFullscreen();
});

btnPause.addEventListener("click", openPauseDialog);
btnStageMenu.addEventListener("click", openPauseDialog);
btnFs?.addEventListener("click", () => (fsActive ? exitFullscreen() : enterFullscreen()));
fsExitBtn?.addEventListener("click", exitFullscreen);
btnMute.addEventListener("click", () => {
  sfx.muted = !sfx.muted;
  btnMute.textContent = sfx.muted ? "🔇" : "🔊";
});

// --- Efficient Background Processing (modern-web-guidance) ---
function handleVisibilityPause(shouldPause) {
  visibilityPaused = shouldPause;
  if (visibilityPaused && animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  } else if (!visibilityPaused && animFrameId === null) {
    lastTimestamp = 0;
    animFrameId = requestAnimationFrame(loop);
  }
}

stageEl.addEventListener("contentvisibilityautostatechange", (event) => {
  handleVisibilityPause(event.skipped);
});

if (!("contentVisibility" in document.documentElement.style)) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        handleVisibilityPause(!entry.isIntersecting);
      }
    },
    { rootMargin: "200px" }
  );
  observer.observe(stageEl);
}

document.addEventListener("visibilitychange", () => {
  handleVisibilityPause(document.hidden);
});

// --- Simulation Step ---
function update(dt) {
  elapsedTime += dt;

  for (const m of dustMotes) {
    m.x += m.vx * dt;
    m.y += m.vy * dt + Math.sin(elapsedTime * 1.4 + m.phase) * 6 * dt;
    if (m.x < 0) m.x += WORLD_W;
    if (m.x > WORLD_W) m.x -= WORLD_W;
    if (m.y < 30) m.y = WORLD_H * 0.82;
    if (m.y > WORLD_H * 0.88) m.y = 40;
  }

  if (paused || stageCleared || pausedByRotation()) return;

  const cfg = STAGES[currentStageIdx];
  const p = state.patty;

  p.invulnTimer = Math.max(0, p.invulnTimer - dt);
  p.barkCooldown = Math.max(0, p.barkCooldown - dt);
  p.barkAnimTimer = Math.max(0, p.barkAnimTimer - dt);
  p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
  p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);

  const moveLeft = keys.has("ArrowLeft") || keys.has("KeyA");
  const moveRight = keys.has("ArrowRight") || keys.has("KeyD");
  const dir = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
  const maxSpeed = 435;
  const accel = p.grounded ? 2750 : 1950;
  const targetVx = dir * maxSpeed;

  if (p.vx < targetVx) {
    p.vx = Math.min(targetVx, p.vx + accel * dt);
  } else if (p.vx > targetVx) {
    p.vx = Math.max(targetVx, p.vx - accel * dt);
  }

  if (dir !== 0) p.facing = dir;

  if (p.jumpBuffer > 0 && triggerJump()) {
    p.jumpBuffer = 0;
  }

  const prevY = p.y;
  p.vy = Math.min(1150, p.vy + 1950 * dt);
  const minX = cfg.minX ?? 54;
  const maxX = cfg.maxX ?? WORLD_W - 54;
  const nextX = p.x + p.vx * dt;
  if (nextX <= minX) {
    p.x = minX;
    if (p.vx < 0) p.vx = 0;
  } else if (nextX >= maxX) {
    p.x = maxX;
    if (p.vx > 0) p.vx = 0;
  } else {
    p.x = nextX;
  }
  p.y += p.vy * dt;

  let landed = false;
  p.currentPlatform = null;

  if (p.vy >= 0) {
    for (const plat of cfg.platforms) {
      if (p.x >= plat.x - 18 && p.x <= plat.x + plat.w + 18) {
        if (prevY <= plat.y + 8 && p.y >= plat.y) {
          p.y = plat.y;
          p.vy = 0;
          landed = true;
          p.currentPlatform = plat;
          break;
        }
      }
    }
  }

  if (!landed && p.y >= cfg.groundY) {
    p.y = cfg.groundY;
    p.vy = 0;
    landed = true;
  }

  if (landed) {
    if (!p.grounded) {
      p.squashX = 1.16;
      p.squashY = 0.85;
      spawnBurst(p.x, p.y, "rgba(255,240,205,0.7)", 5, 95);
    }
    p.grounded = true;
    p.jumpsUsed = 0;
    p.coyoteTimer = 0.1;
  } else {
    p.grounded = false;
  }

  p.squashX += (1 - p.squashX) * Math.min(1, dt * 14);
  p.squashY += (1 - p.squashY) * Math.min(1, dt * 14);

  if (p.grounded && Math.abs(p.vx) > 30) {
    p.animTimer += dt * (Math.abs(p.vx) / 36);
  } else {
    p.animTimer = 0;
  }

  // Smooth wide 2.5D camera pan with gentle look-ahead
  const lookAhead = p.facing * 35;
  const targetCamX = Math.max(0, Math.min(WORLD_W - VIS_W, p.x + lookAhead - VIS_W * 0.45));
  const targetCamY = Math.max(0, Math.min(WORLD_H - VIS_H, p.y - VIS_H * 0.72));
  state.camX += (targetCamX - state.camX) * Math.min(1, dt * 6.5);
  state.camY += (targetCamY - state.camY) * Math.min(1, dt * 5.0);

  // Collect treats
  const pattyMidY = p.y - cfg.pattyDrawSize * 0.36;
  for (const t of state.treats) {
    if (!t.collected && Math.hypot(t.x - p.x, t.y - pattyMidY) < 72) {
      t.collected = true;
      state.treatsCollected += 1;
      state.combo += 1;
      spawnBurst(t.x, t.y, "#fcd34d", 14, 195);
      sfx.treat(state.combo);
      updateHUD();
    }
  }

  // Collect Elefantino Fucsia
  if (
    state.elefantino &&
    !state.elefantino.collected &&
    Math.hypot(state.elefantino.x - p.x, state.elefantino.y - pattyMidY) < 78
  ) {
    state.elefantino.collected = true;
    state.elefantinoFound = true;
    spawnBurst(state.elefantino.x, state.elefantino.y, "#f472b6", 24, 240);
    sfx.elefantino();
    updateHUD();
  }

  // Hazards patrol & collision
  for (const h of state.hazards) {
    if (h.stunTimer > 0) {
      h.stunTimer = Math.max(0, h.stunTimer - dt);
      continue;
    }
    h.x += h.dir * h.speed * dt;
    if (h.x <= h.minX) {
      h.x = h.minX;
      h.dir = 1;
    } else if (h.x >= h.maxX) {
      h.x = h.maxX;
      h.dir = -1;
    }

    const hy = h.type === "bee" ? h.y + Math.sin(elapsedTime * 5 + h.phase) * 14 : h.y - 26;
    if (p.invulnTimer <= 0 && Math.hypot(h.x - p.x, hy - pattyMidY) < 56) {
      state.hearts -= 1;
      state.combo = 0;
      p.invulnTimer = 1.4;
      p.vy = -440;
      p.vx = (p.x < h.x ? -1 : 1) * 280;
      spawnBurst(p.x, pattyMidY, "#fb7185", 14, 190);
      sfx.hurt();
      updateHUD();
      if (state.hearts <= 0) {
        loadStage(currentStageIdx);
        return;
      }
    }
  }

  // Particles & shockwaves
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.life -= dt;
    if (pt.life <= 0) {
      state.particles.splice(i, 1);
      continue;
    }
    pt.vy += 420 * dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
  }

  for (let i = state.shockwaves.length - 1; i >= 0; i--) {
    const sw = state.shockwaves[i];
    sw.life -= dt;
    if (sw.life <= 0) {
      state.shockwaves.splice(i, 1);
      continue;
    }
    const progress = 1 - sw.life / sw.maxLife;
    sw.r = 24 + (sw.maxR - 24) * progress;
  }

  if (Math.hypot(cfg.goal.x - p.x, cfg.goal.y - p.y) < 82) {
    openVictoryDialog();
  }
}

// --- Rendering Helpers ---
function findNearestSurfaceBelow(x, y, cfg) {
  let bestY = cfg.groundY;
  for (const plat of cfg.platforms) {
    if (x >= plat.x - 16 && x <= plat.x + plat.w + 16 && plat.y >= y - 4) {
      if (plat.y < bestY) bestY = plat.y;
    }
  }
  return bestY;
}

function drawSoftRadialShadow(cx, cy, rx, ry, maxAlpha) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / Math.max(1, rx));
  const grad = ctx.createRadialGradient(0, 0, rx * 0.12, 0, 0, rx);
  grad.addColorStop(0, `rgba(12, 10, 9, ${maxAlpha.toFixed(3)})`);
  grad.addColorStop(0.6, `rgba(12, 10, 9, ${(maxAlpha * 0.45).toFixed(3)})`);
  grad.addColorStop(1, "rgba(12, 10, 9, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPropSprite(frameIdx, cx, cy, drawSize, flipX = 1, rot = 0) {
  if (!assets.props.complete || assets.props.naturalWidth === 0) return false;
  ctx.save();
  ctx.translate(cx, cy);
  if (rot !== 0) ctx.rotate(rot);
  if (flipX !== 1) ctx.scale(flipX, 1);
  ctx.drawImage(
    assets.props,
    frameIdx * SPRITE_CELL,
    0,
    SPRITE_CELL,
    SPRITE_CELL,
    -drawSize * 0.5,
    -drawSize * 0.5,
    drawSize,
    drawSize
  );
  ctx.restore();
  return true;
}

function drawPlatformLedge(plat, isActive, isNear) {
  const h = 6;
  const baseAlpha = isActive ? 0.82 : isNear ? 0.70 : 0.56;
  ctx.save();

  // Soft subtle contact shadow gradient directly beneath the edge
  const shGrad = ctx.createLinearGradient(0, plat.y + 3, 0, plat.y + 11);
  shGrad.addColorStop(0, "rgba(10, 12, 16, 0.28)");
  shGrad.addColorStop(1, "rgba(10, 12, 16, 0)");
  ctx.fillStyle = shGrad;
  ctx.fillRect(plat.x + 2, plat.y + 3, Math.max(0, plat.w - 4), 8);

  // Slim translucent sunlit ivory-gold ledge with soft horizontal fade at tips
  const barGrad = ctx.createLinearGradient(plat.x, 0, plat.x + plat.w, 0);
  barGrad.addColorStop(0, "rgba(255, 246, 218, 0.12)");
  barGrad.addColorStop(0.08, `rgba(255, 246, 218, ${baseAlpha})`);
  barGrad.addColorStop(0.92, `rgba(255, 246, 218, ${baseAlpha})`);
  barGrad.addColorStop(1, "rgba(255, 246, 218, 0.12)");

  if (isActive || isNear) {
    ctx.shadowColor = isActive ? "rgba(253, 224, 71, 0.72)" : "rgba(255, 244, 200, 0.45)";
    ctx.shadowBlur = 10;
  }

  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(plat.x, plat.y, plat.w, h, 3);
  ctx.fill();

  // Crisp thin top rim highlight fading gently at ends
  ctx.shadowBlur = 0;
  const rimGrad = ctx.createLinearGradient(plat.x, 0, plat.x + plat.w, 0);
  rimGrad.addColorStop(0, "rgba(255, 252, 240, 0.15)");
  rimGrad.addColorStop(0.08, "rgba(255, 252, 240, 0.85)");
  rimGrad.addColorStop(0.92, "rgba(255, 252, 240, 0.85)");
  rimGrad.addColorStop(1, "rgba(255, 252, 240, 0.15)");
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(plat.x + 3, plat.y + 1);
  ctx.lineTo(plat.x + plat.w - 3, plat.y + 1);
  ctx.stroke();

  // Subtle rounded end-dots marking exact platform bounds
  ctx.fillStyle = "rgba(255, 244, 200, 0.75)";
  ctx.beginPath();
  ctx.arc(plat.x + 3, plat.y + 3, 2.5, 0, Math.PI * 2);
  ctx.arc(plat.x + plat.w - 3, plat.y + 3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBone(x, y, bob) {
  ctx.save();
  ctx.shadowColor = "rgba(252, 211, 77, 0.78)";
  ctx.shadowBlur = 18;
  const rot = Math.sin(elapsedTime * 2.5 + x * 0.01) * 0.14;
  drawPropSprite(PROP.BONE, x, y + bob, 74, 1, rot);
  ctx.restore();
}

function drawElefantino(x, y, bob) {
  ctx.save();
  const grad = ctx.createRadialGradient(x, y + bob, 8, x, y + bob, 60);
  grad.addColorStop(0, "rgba(244, 114, 182, 0.52)");
  grad.addColorStop(1, "rgba(244, 114, 182, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y + bob, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "rgba(244, 114, 182, 0.85)";
  ctx.shadowBlur = 20;
  const tilt = Math.sin(elapsedTime * 2.2) * 0.08;
  drawPropSprite(PROP.ELEFANTINO, x, y + bob, 108, 1, tilt);
  ctx.restore();
}

function drawHazard(h, cfg) {
  ctx.save();
  if (h.stunTimer > 0) ctx.globalAlpha = 0.55;

  if (h.type === "bee") {
    const by = h.y + Math.sin(elapsedTime * 5 + h.phase) * 14;
    const surfY = findNearestSurfaceBelow(h.x, by, cfg);
    const alt = Math.max(0, surfY - by);
    drawSoftRadialShadow(h.x, surfY + 2, Math.max(14, 32 - alt * 0.05), 8, Math.max(0.08, 0.25 - alt / 700));
    drawPropSprite(PROP.BEE, h.x, by, 92, h.dir >= 0 ? 1 : -1, Math.sin(elapsedTime * 9) * 0.06);
  } else if (h.type === "roomba") {
    const jitter = h.stunTimer > 0 ? Math.sin(elapsedTime * 38) * 3 : 0;
    drawSoftRadialShadow(h.x, h.y + 3, 56, 13, 0.42);
    // Center Roomba disc cleanly onto floor line
    drawPropSprite(PROP.ROOMBA, h.x + jitter, h.y - 31, 122, h.dir >= 0 ? 1 : -1, 0);
  } else {
    const bounce = Math.abs(Math.sin(elapsedTime * 4.5 + h.phase)) * 28;
    const scale = Math.max(0.45, 1 - bounce / 80);
    drawSoftRadialShadow(h.x, h.y + 2, 28 * scale, 7 * scale, 0.36 * scale);
    drawPropSprite(PROP.BALL, h.x, h.y - 28 - bounce, 68, 1, elapsedTime * 6 * h.dir);
  }

  if (h.stunTimer > 0) {
    ctx.globalAlpha = 0.9;
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillStyle = "#f9a8d4";
    ctx.textAlign = "center";
    ctx.fillText("✦ ✦", h.x, h.y - 74);
  }
  ctx.restore();
}

function drawGoal(goal) {
  ctx.save();
  const pulse = 1 + Math.sin(elapsedTime * 3.5) * 0.08;

  const grad = ctx.createRadialGradient(goal.x, goal.y - 28, 10, goal.x, goal.y - 28, 86 * pulse);
  grad.addColorStop(0, "rgba(250, 204, 21, 0.52)");
  grad.addColorStop(1, "rgba(250, 204, 21, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(goal.x, goal.y - 28, 86 * pulse, 0, Math.PI * 2);
  ctx.fill();

  drawSoftRadialShadow(goal.x, goal.y + 2, 58, 13, 0.42);
  drawPropSprite(PROP.BOWL, goal.x, goal.y - 38, 126, 1, 0);

  // Crisp readable pill label above the bowl
  ctx.font = "700 13px system-ui, sans-serif";
  const textW = ctx.measureText(goal.label).width;
  const pillW = textW + 18;
  ctx.fillStyle = "rgba(18, 22, 29, 0.85)";
  ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(goal.x - pillW / 2, goal.y - 114, pillW, 24, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fef3c7";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(goal.label, goal.x, goal.y - 102);
  ctx.restore();
}

function drawPattyProjectedShadow(p, cfg, frameIdx, shadowY) {
  const alt = Math.max(0, shadowY - p.y);
  const shadowScale = Math.max(0.42, 1 - alt / 340);
  const shadowAlpha = Math.max(0.08, 0.34 - alt / 420);
  const drawS = cfg.pattyDrawSize;
  const footOffset = drawS * SPRITE_FOOT_RATIO;
  const sx = frameIdx * SPRITE_CELL;

  // Soft ambient contact pool right under paws when close to surface
  if (alt < 45) {
    const nearFactor = 1 - alt / 45;
    drawSoftRadialShadow(p.x, shadowY + 2, drawS * 0.28, 7, 0.24 * nearFactor);
  }

  // Projected animated silhouette shadow with soft penumbra blur
  if (pattyShadowStrip) {
    ctx.save();
    ctx.globalAlpha = shadowAlpha;
    const blurPx = (3.5 + alt * 0.045).toFixed(1);
    ctx.filter = `blur(${blurPx}px)`;
    ctx.translate(p.x + alt * cfg.sunSkew * 0.28, shadowY + 2);
    ctx.transform(1, 0, cfg.sunSkew, -0.24, 0, 0);
    ctx.scale(p.facing * p.squashX * shadowScale, 1);
    ctx.drawImage(
      pattyShadowStrip,
      sx,
      0,
      SPRITE_CELL,
      SPRITE_CELL,
      -drawS * 0.5,
      -footOffset,
      drawS,
      drawS
    );
    ctx.restore();
  }
}

function render() {
  const cfg = STAGES[currentStageIdx];
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  ctx.save();
  ctx.scale(CAM_ZOOM, CAM_ZOOM);
  ctx.translate(-state.camX, -state.camY);

  // 1. Cycles Path-Traced Background
  const bg = assets.bgs.get(cfg.id);
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, WORLD_W, WORLD_H);
  } else {
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }

  // 2. Tactile 2.5D Platform Ledges
  const p = state.patty;
  for (const plat of cfg.platforms) {
    const isActive = p.currentPlatform === plat;
    const isNear = Math.abs(p.x - (plat.x + plat.w * 0.5)) < plat.w * 0.65 && Math.abs(p.y - plat.y) < 160;
    drawPlatformLedge(plat, isActive, isNear);
  }

  // 4. Goal & Collectibles
  drawGoal(cfg.goal);
  for (const t of state.treats) {
    if (!t.collected) {
      drawBone(t.x, t.y, Math.sin(elapsedTime * 3.4 + t.phase) * 6);
    }
  }
  if (state.elefantino && !state.elefantino.collected) {
    drawElefantino(state.elefantino.x, state.elefantino.y, Math.sin(elapsedTime * 2.8) * 7);
  }

  // 5. Hazards
  for (const h of state.hazards) {
    drawHazard(h, cfg);
  }

  // 6. Determine Patty's current sprite frame & project silhouette shadow
  let frameIdx = 0;
  if (!p.grounded) {
    frameIdx = p.vy < 0 ? 4 : 5;
  } else if (p.barkAnimTimer > 0.12) {
    frameIdx = 4;
  } else if (Math.abs(p.vx) > 35) {
    frameIdx = 1 + (Math.floor(p.animTimer) % 3);
  }

  const shadowY = findNearestSurfaceBelow(p.x, p.y, cfg);
  drawPattyProjectedShadow(p, cfg, frameIdx, shadowY);

  // 7. Patty Animated Sprite
  if (assets.sprite.complete && assets.sprite.naturalWidth > 0) {
    const drawS = cfg.pattyDrawSize;
    const blinkHide = p.invulnTimer > 0 && Math.floor(p.invulnTimer * 14) % 2 === 0;
    if (!blinkHide) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.facing * p.squashX, p.squashY);
      if (p.barkAnimTimer > 0) {
        ctx.rotate(-0.13 * (p.barkAnimTimer / 0.26));
      }
      const sx = frameIdx * SPRITE_CELL;
      const footOffset = drawS * SPRITE_FOOT_RATIO;
      ctx.drawImage(
        assets.sprite,
        sx,
        0,
        SPRITE_CELL,
        SPRITE_CELL,
        -drawS * 0.5,
        -footOffset,
        drawS,
        drawS
      );
      ctx.restore();
    }
  }

  // 8. Expressive Comic Sound-Arcs ))) & Particles
  for (const sw of state.shockwaves) {
    const progress = 1 - sw.life / sw.maxLife;
    const baseAlpha = Math.max(0, sw.life / sw.maxLife);
    ctx.save();
    ctx.translate(sw.x, sw.y);
    ctx.scale(sw.facing || 1, 1);
    ctx.lineCap = "round";
    for (let ring = 0; ring < 3; ring++) {
      const delay = ring * 0.16;
      const localP = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
      if (localP <= 0) continue;
      const arcR = 16 + localP * 54 + ring * 12;
      const alpha = baseAlpha * (1 - ring * 0.2);
      ctx.strokeStyle = `rgba(255, 245, 205, ${(alpha * 0.92).toFixed(3)})`;
      ctx.lineWidth = 4.2 - ring * 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, arcR, -0.58, 0.58);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const pt of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 9. Real-time 2D Volumetric Sunbeams & Floating Dust Motes
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const beam of cfg.sunBeams) {
    const sway = Math.sin(elapsedTime * 0.65 + beam.x * 0.01) * 18;
    const grad = ctx.createLinearGradient(beam.x, 0, beam.x + beam.angle * WORLD_H, WORLD_H);
    grad.addColorStop(0, `rgba(255, 232, 165, ${beam.alpha})`);
    grad.addColorStop(1, "rgba(255, 232, 165, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(beam.x + sway, 0);
    ctx.lineTo(beam.x + beam.w + sway, 0);
    ctx.lineTo(beam.x + beam.w + beam.angle * WORLD_H + sway, WORLD_H);
    ctx.lineTo(beam.x + beam.angle * WORLD_H + sway, WORLD_H);
    ctx.closePath();
    ctx.fill();
  }

  for (const m of dustMotes) {
    const a = 0.25 + 0.3 * Math.sin(elapsedTime * 2 + m.phase);
    ctx.fillStyle = `rgba(255, 240, 190, ${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

function loop(timestamp) {
  if (visibilityPaused) {
    animFrameId = null;
    return;
  }
  if (!lastTimestamp) lastTimestamp = timestamp;
  const dt = Math.min(0.033, Math.max(0.001, (timestamp - lastTimestamp) / 1000));
  lastTimestamp = timestamp;

  update(dt);
  render();
  animFrameId = requestAnimationFrame(loop);
}

// Init
sfx.preloadBark();
loadStage(0);
menuDialog.showModal();
animFrameId = requestAnimationFrame(loop);


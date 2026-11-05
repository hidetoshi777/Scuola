/* Meucci Slug - Operazione Ruolo 1.100
   Core Arcade Run & Gun Engine (HTML5 Canvas 60 FPS)
   Prof. Rossano Bella vs. 1.100 Precari delle GPS
*/
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const canvas = $('slug-canvas');
  const ctx = canvas.getContext('2d');
  const W = 960, H = 540;
  canvas.width = W; canvas.height = H;

  // Audio helper shorthand
  const audio = window.MeucciSlugAudio;

  // Sprite Sheets Asset Loader
  const sprites = {
    prof: new Image(),
    moke: new Image(),
    precari: new Image(),
    boss: new Image(),
    items: new Image()
  };
  sprites.prof.src = 'assets/prof-sheet.png';
  sprites.moke.src = 'assets/moke-slug.png';
  sprites.precari.src = 'assets/precari-sheet.png';
  sprites.boss.src = 'assets/boss-copier.png';
  sprites.items.src = 'assets/items-sheet.png';

  // Input State
  const input = {
    left: false, right: false, up: false, down: false,
    jump: false, fire: false, bomb: false, enter: false,
    jumpPressed: false, firePressed: false, bombPressed: false, enterPressed: false
  };

  // Screen shake
  let screenShake = 0;

  // Game States: 'title', 'playing', 'paused', 'victory', 'gameover'
  let state = 'title';
  let score = 0;
  let scalzati = 0;
  const TOTAL_PRECARI = 1100;

  // Stage geometry
  const STAGE_LENGTH = 4400;
  const FLOOR_Y = 440;

  // Camera
  const camera = { x: 0, y: 0 };

  // Platforms in the stage: [{x, y, w, h, type}]
  // y = piano calpestabile; ogni oggetto e' disegnato da y fino a terra
  const LEVEL1_PLATFORMS = [
    // Courtyard (0 - 1600)
    { x: 380, y: 350, w: 140, h: 18, type: 'banchi' },
    { x: 620, y: 310, w: 180, h: 18, type: 'muretto' },
    { x: 920, y: 340, w: 160, h: 18, type: 'ponteggio' },
    { x: 1200, y: 310, w: 200, h: 18, type: 'container' },

    // Indoor corridor (1600 - 3600)
    { x: 1750, y: 360, w: 160, h: 18, type: 'cattedra' },
    { x: 2020, y: 310, w: 150, h: 18, type: 'distributore' },
    { x: 2280, y: 350, w: 180, h: 18, type: 'banchi' },
    { x: 2540, y: 290, w: 200, h: 18, type: 'armadietti' },
    { x: 2850, y: 340, w: 190, h: 18, type: 'cattedra' },
    { x: 3110, y: 405, w: 42, h: 18, type: 'gradino' },
    { x: 3150, y: 370, w: 42, h: 18, type: 'gradino' },
    { x: 3190, y: 335, w: 42, h: 18, type: 'gradino' },
    { x: 3230, y: 300, w: 100, h: 18, type: 'pianerottolo' },

    // Boss arena (3600 - 4400)
    { x: 3640, y: 360, w: 170, h: 18, type: 'faldoni' },
    { x: 3830, y: 320, w: 90, h: 18, type: 'faldoni' }
  ];
  let platforms = LEVEL1_PLATFORMS;

  // ---------- Scenografia pre-renderizzata (una volta sola) ----------
  const FAR_F = 0.08, MID_F = 0.3;
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function rng(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function drawPalm(g, x, baseY, h, lean) {
    g.strokeStyle = '#3b2a22';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(x, baseY);
    g.quadraticCurveTo(x + lean * 0.4, baseY - h * 0.5, x + lean, baseY - h);
    g.stroke();
    const tx = x + lean, ty = baseY - h;
    g.strokeStyle = '#21452c';
    g.lineWidth = 4;
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI + (k / 8) * Math.PI;
      const len = 34 + (k % 3) * 8;
      g.beginPath();
      g.moveTo(tx, ty);
      g.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 - 10,
        tx + Math.cos(a) * len, ty + Math.sin(a) * len * 0.4 + 14);
      g.stroke();
    }
    g.fillStyle = '#4a3326';
    g.beginPath(); g.arc(tx, ty + 3, 5, 0, Math.PI * 2); g.fill();
  }

  // Strato lontano: Etna innevata e colline
  const ETNA = { x: 560, y: 150 };
  function buildFar1() {
    const w = Math.ceil(W + (STAGE_LENGTH - W) * FAR_F) + 40;
    const c = mkCanvas(w, FLOOR_Y), g = c.getContext('2d');
    const etna = g.createLinearGradient(0, ETNA.y, 0, 380);
    etna.addColorStop(0, '#4b2c52');
    etna.addColorStop(1, '#7a3a55');
    g.fillStyle = etna;
    g.beginPath();
    g.moveTo(-120, 390);
    g.quadraticCurveTo(250, 300, ETNA.x - 46, ETNA.y + 10);
    g.lineTo(ETNA.x - 18, ETNA.y);
    g.lineTo(ETNA.x + 22, ETNA.y + 3);
    g.lineTo(ETNA.x + 48, ETNA.y + 12);
    g.quadraticCurveTo(ETNA.x + 120, ETNA.y + 50, ETNA.x + 170, ETNA.y + 70);
    g.quadraticCurveTo(ETNA.x + 190, ETNA.y + 60, ETNA.x + 210, ETNA.y + 78); // Montagnola
    g.quadraticCurveTo(ETNA.x + 420, 300, w + 60, 390);
    g.closePath();
    g.fill();
    // neve in cima
    g.fillStyle = 'rgba(248, 222, 230, 0.85)';
    g.beginPath();
    g.moveTo(ETNA.x - 46, ETNA.y + 10);
    g.lineTo(ETNA.x - 18, ETNA.y);
    g.lineTo(ETNA.x + 22, ETNA.y + 3);
    g.lineTo(ETNA.x + 48, ETNA.y + 12);
    g.lineTo(ETNA.x + 92, ETNA.y + 34);
    g.lineTo(ETNA.x + 60, ETNA.y + 30);
    g.lineTo(ETNA.x + 42, ETNA.y + 46);
    g.lineTo(ETNA.x + 18, ETNA.y + 28);
    g.lineTo(ETNA.x - 6, ETNA.y + 50);
    g.lineTo(ETNA.x - 30, ETNA.y + 30);
    g.lineTo(ETNA.x - 62, ETNA.y + 44);
    g.lineTo(ETNA.x - 90, ETNA.y + 36);
    g.closePath();
    g.fill();
    // colate e creste
    g.strokeStyle = 'rgba(40, 20, 45, 0.35)';
    g.lineWidth = 2;
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      g.moveTo(ETNA.x - 30 + k * 14, ETNA.y + 40);
      g.quadraticCurveTo(ETNA.x - 80 + k * 40, ETNA.y + 120, ETNA.x - 160 + k * 70, 330);
      g.stroke();
    }
    // colline davanti
    g.fillStyle = '#5e2c4a';
    g.beginPath();
    g.moveTo(0, FLOOR_Y);
    for (let x = 0; x <= w; x += 40) g.lineTo(x, 340 + Math.sin(x * 0.011) * 14 + Math.sin(x * 0.027) * 7);
    g.lineTo(w, FLOOR_Y);
    g.closePath();
    g.fill();
    return c;
  }

  // Strato medio: profilo di Acireale (palazzi diversi, Duomo, palme)
  function buildMid1() {
    const w = Math.ceil(W + (STAGE_LENGTH - W) * MID_F) + 60;
    const c = mkCanvas(w, FLOOR_Y), g = c.getContext('2d');
    const rnd = rng(1100);
    const lit = [];
    const pal = ['#c58a52', '#c98478', '#d8c49a', '#a8a29a', '#b86a45', '#d1a76a', '#9fa88c', '#e0b98a'];

    function palazzo(x, w, h, col) {
      const y = FLOOR_Y - h;
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(x + w - 7, y, 7, h);
      const roof = rnd();
      if (roof < 0.35) {
        g.fillStyle = '#8f3b2a';
        g.beginPath();
        g.moveTo(x - 5, y);
        g.lineTo(x + w * (0.35 + rnd() * 0.3), y - 16 - rnd() * 12);
        g.lineTo(x + w + 5, y);
        g.closePath();
        g.fill();
      } else if (roof < 0.75) {
        g.fillStyle = 'rgba(255,255,255,0.22)';
        g.fillRect(x - 3, y - 4, w + 6, 5);
        g.strokeStyle = '#3a2a2a';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x, y - 12); g.lineTo(x + w, y - 12);
        for (let rx = x; rx <= x + w; rx += 6) { g.moveTo(rx, y - 12); g.lineTo(rx, y - 4); }
        g.stroke();
      } else {
        g.fillStyle = 'rgba(255,255,255,0.18)';
        g.fillRect(x - 3, y - 3, w + 6, 4);
        g.strokeStyle = '#2b2230';
        g.lineWidth = 2;
        const ax = x + 10 + rnd() * (w - 20);
        g.beginPath();
        g.moveTo(ax, y - 3); g.lineTo(ax, y - 26);
        g.moveTo(ax - 9, y - 20); g.lineTo(ax + 9, y - 20);
        g.moveTo(ax - 6, y - 14); g.lineTo(ax + 6, y - 14);
        g.stroke();
      }
      const arched = rnd() < 0.4;
      const balconies = rnd() < 0.6;
      const cols = Math.max(2, Math.floor((w - 14) / 24));
      const colW = (w - 14) / cols;
      const rows = Math.max(2, Math.floor((h - 26) / 34));
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          const ww = 11, wh = 19;
          const wx = x + 7 + k * colW + (colW - ww) / 2;
          const wy = y + 12 + r * 34;
          const s = rnd();
          if (s < 0.3) lit.push([wx, wy, ww, wh, arched]);
          g.fillStyle = s < 0.3 ? '#2b2230' : s < 0.7 ? '#3d5c43' : '#2b2230';
          if (arched) {
            g.beginPath();
            g.moveTo(wx, wy + wh); g.lineTo(wx, wy + 5);
            g.arc(wx + ww / 2, wy + 5, ww / 2, Math.PI, 0);
            g.lineTo(wx + ww, wy + wh);
            g.closePath();
            g.fill();
          } else {
            g.fillRect(wx, wy, ww, wh);
          }
          if (balconies && r < rows - 1 && r % 2 === 0) {
            g.fillStyle = '#2a2026';
            g.fillRect(wx - 4, wy + wh, ww + 8, 2);
            g.fillRect(wx - 4, wy + wh - 6, 1, 6);
            g.fillRect(wx + ww + 3, wy + wh - 6, 1, 6);
            g.fillRect(wx - 4, wy + wh - 6, ww + 8, 1);
          }
        }
      }
    }

    function duomo(x) {
      const base = FLOOR_Y;
      g.fillStyle = '#d9c7a0';
      // cupola dietro
      g.beginPath(); g.arc(x + 115, base - 175, 42, Math.PI, 0); g.fill();
      g.fillRect(x + 73, base - 178, 84, 20);
      g.fillRect(x + 108, base - 238, 14, 22);
      g.beginPath(); g.moveTo(x + 104, base - 238); g.lineTo(x + 115, base - 256); g.lineTo(x + 126, base - 238); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 2;
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + 115 + k * 16, base - 175); g.quadraticCurveTo(x + 115 + k * 6, base - 210, x + 115, base - 217); g.stroke(); }
      // facciata
      g.fillStyle = '#e2d3ad';
      g.fillRect(x + 45, base - 160, 140, 160);
      g.beginPath(); g.moveTo(x + 40, base - 160); g.lineTo(x + 115, base - 196); g.lineTo(x + 190, base - 160); g.fill();
      // campanili con guglie
      [x + 12, x + 186].forEach(tx => {
        g.fillStyle = '#d4c197';
        g.fillRect(tx, base - 225, 34, 225);
        g.fillStyle = '#2b2230';
        g.fillRect(tx + 10, base - 210, 14, 22);
        g.fillRect(tx + 10, base - 160, 14, 18);
        g.fillStyle = '#4f7a6a';
        g.beginPath(); g.moveTo(tx - 2, base - 225); g.lineTo(tx + 17, base - 292); g.lineTo(tx + 36, base - 225); g.fill();
        g.strokeStyle = '#2b2230'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(tx + 17, base - 292); g.lineTo(tx + 17, base - 304); g.moveTo(tx + 12, base - 299); g.lineTo(tx + 22, base - 299); g.stroke();
      });
      // rosone e portale
      g.fillStyle = '#2b2230';
      g.beginPath(); g.arc(x + 115, base - 130, 14, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(x + 97, base); g.lineTo(x + 97, base - 52); g.arc(x + 115, base - 52, 18, Math.PI, 0); g.lineTo(x + 133, base); g.fill();
      lit.push([x + 108, base - 137, 14, 14, false]);
    }

    let x = -30, i = 0;
    while (x < w) {
      if (i === 4) { duomo(x); x += 236; i++; continue; }
      if (rnd() < 0.22) { drawPalm(g, x + 14, FLOOR_Y, 140 + rnd() * 50, (rnd() - 0.5) * 30); x += 22; }
      const bw = 70 + Math.floor(rnd() * 120);
      const bh = 100 + Math.floor(rnd() * 140);
      palazzo(x, bw, bh, pal[Math.floor(rnd() * pal.length)]);
      x += bw + (rnd() < 0.3 ? 4 + rnd() * 18 : 0);
      i++;
    }
    // foschia del tramonto sui palazzi
    const hz = g.createLinearGradient(0, 120, 0, FLOOR_Y);
    hz.addColorStop(0, 'rgba(60, 20, 75, 0.62)');
    hz.addColorStop(1, 'rgba(120, 40, 50, 0.48)');
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = hz;
    g.fillRect(0, 0, w, FLOOR_Y);
    g.globalCompositeOperation = 'source-over';
    // finestre accese dopo la foschia
    g.fillStyle = '#ffd27a';
    lit.forEach(([wx, wy, ww, wh, arched]) => {
      if (arched) {
        g.beginPath();
        g.moveTo(wx, wy + wh); g.lineTo(wx, wy + 5);
        g.arc(wx + ww / 2, wy + 5, ww / 2, Math.PI, 0);
        g.lineTo(wx + ww, wy + wh);
        g.closePath();
        g.fill();
      } else {
        g.fillRect(wx, wy, ww, wh);
      }
    });
    return c;
  }

  // ---------- Oggetti calpestabili ----------
  const F = FLOOR_Y;
  function topEdge(g, x, y, w, col) {
    g.fillStyle = col;
    g.fillRect(x, y, w, 2);
  }

  const PLATFORM_DRAW = {
    // Barricata di banchi di scuola: due file di banchi impilati
    banchi(g, p) {
      const rowH = (F - p.y) / 2;
      const n = Math.max(2, Math.round(p.w / 70));
      const dw = p.w / n;
      for (let r = 0; r < 2; r++) {
        const top = p.y + r * rowH;
        for (let i = 0; i < n; i++) {
          const dx = p.x + i * dw;
          g.fillStyle = '#2f6fb5';
          g.fillRect(dx + 5, top + 7, 4, rowH - 7);
          g.fillRect(dx + dw - 9, top + 7, 4, rowH - 7);
          g.fillRect(dx + 5, top + rowH - 9, dw - 10, 3);
          g.fillStyle = '#1b2433';
          g.fillRect(dx + 10, top + 8, dw - 20, 8);
          g.fillStyle = '#ead2a4';
          g.fillRect(dx + 1, top, dw - 2, 6);
          g.fillStyle = '#93622f';
          g.fillRect(dx + 1, top + 5, dw - 2, 2);
        }
      }
      // sedia appoggiata di fianco
      const sx = p.x + p.w - 6;
      g.fillStyle = '#2f6fb5';
      g.fillRect(sx, F - 26, 3, 26);
      g.fillRect(sx + 20, F - 26, 3, 26);
      g.fillRect(sx + 20, F - 52, 3, 26);
      g.fillStyle = '#ead2a4';
      g.fillRect(sx - 2, F - 28, 26, 4);
      g.fillRect(sx + 16, F - 54, 8, 16);
      // quaderno sul banco in cima
      g.fillStyle = '#f8fafc';
      g.fillRect(p.x + 14, p.y - 2, 18, 2);
      topEdge(g, p.x, p.y, p.w, '#fff7e0');
    },

    // Muretto in pietra lavica con copertina chiara
    muretto(g, p) {
      const rnd = rng(p.x);
      g.fillStyle = '#3f3d45';
      g.fillRect(p.x, p.y + 8, p.w, F - p.y - 8);
      for (let ry = p.y + 10, row = 0; ry < F; ry += 17, row++) {
        let rx = p.x + (row % 2 ? -12 : 0);
        while (rx < p.x + p.w) {
          const sw = 22 + rnd() * 22;
          const x0 = Math.max(p.x + 1, rx + 1), x1 = Math.min(p.x + p.w - 1, rx + sw - 1);
          if (x1 > x0) {
            const v = 58 + Math.floor(rnd() * 22);
            g.fillStyle = `rgb(${v},${v - 2},${v + 6})`;
            g.fillRect(x0, ry + 1, x1 - x0, Math.min(15, F - ry - 1));
          }
          rx += sw;
        }
      }
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(p.x, p.y + 9, p.w, 5);
      g.fillStyle = '#b3ada6';
      g.fillRect(p.x - 6, p.y, p.w + 12, 10);
      topEdge(g, p.x - 6, p.y, p.w + 12, '#e7e2dc');
      g.save();
      g.translate(p.x + 30, p.y + 66);
      g.rotate(-0.07);
      g.fillStyle = '#f472b6';
      g.font = '900 17px ui-monospace, monospace';
      g.fillText('W IL RUOLO', 0, 0);
      g.restore();
      g.strokeStyle = '#3f6b35';
      g.lineWidth = 2;
      for (let k = 0; k < 7; k++) {
        const gx = p.x + 8 + k * (p.w / 7);
        g.beginPath(); g.moveTo(gx, F); g.lineTo(gx - 4, F - 10); g.moveTo(gx, F); g.lineTo(gx + 3, F - 8); g.stroke();
      }
    },

    // Ponteggio del cantiere con transenna bianco-rossa
    ponteggio(g, p) {
      const mid = p.y + (F - p.y) / 2;
      g.strokeStyle = '#9ca3af';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(p.x + 6, p.y + 8); g.lineTo(p.x + p.w - 6, mid);
      g.moveTo(p.x + p.w - 6, p.y + 8); g.lineTo(p.x + 6, mid);
      g.stroke();
      g.fillStyle = '#a8b0bd';
      [p.x + 3, p.x + p.w / 2 - 2, p.x + p.w - 8].forEach(tx => g.fillRect(tx, p.y, 5, F - p.y));
      g.fillRect(p.x, mid, p.w, 4);
      // transenna in basso
      const tx0 = p.x + 10, tw = p.w - 20, ty = F - 44;
      g.save();
      g.beginPath(); g.rect(tx0, ty, tw, 14); g.clip();
      for (let s = -20; s < tw + 20; s += 16) {
        g.fillStyle = (s / 16) % 2 === 0 ? '#dc2626' : '#f8fafc';
        g.beginPath();
        g.moveTo(tx0 + s, ty + 14); g.lineTo(tx0 + s + 8, ty); g.lineTo(tx0 + s + 16, ty); g.lineTo(tx0 + s + 8, ty + 14);
        g.fill();
      }
      g.restore();
      g.fillStyle = '#e5e7eb';
      g.fillRect(tx0 + 4, ty + 14, 3, 30);
      g.fillRect(tx0 + tw - 7, ty + 14, 3, 30);
      // cartello cantiere
      g.fillStyle = '#fefce8';
      g.fillRect(p.x + p.w / 2 - 44, p.y + 14, 88, 28);
      g.strokeStyle = '#dc2626'; g.lineWidth = 2;
      g.strokeRect(p.x + p.w / 2 - 44, p.y + 14, 88, 28);
      g.fillStyle = '#b91c1c';
      g.font = '900 10px ui-monospace, monospace';
      g.textAlign = 'center';
      g.fillText('CANTIERE PNRR', p.x + p.w / 2, p.y + 26);
      g.font = '700 8px ui-monospace, monospace';
      g.fillStyle = '#1f2937';
      g.fillText('FINE LAVORI: MAI', p.x + p.w / 2, p.y + 37);
      g.textAlign = 'left';
      // tavolato in cima
      g.fillStyle = '#c4884a';
      g.fillRect(p.x - 4, p.y, p.w + 8, 8);
      g.fillStyle = '#8a5a2b';
      for (let k = p.x + 30; k < p.x + p.w; k += 40) g.fillRect(k, p.y, 2, 8);
      topEdge(g, p.x - 4, p.y, p.w + 8, '#f5c98a');
    },

    // Container dei banchi a rotelle dismessi
    container(g, p) {
      const h = F - p.y;
      g.fillStyle = '#9a3412';
      g.fillRect(p.x, p.y, p.w, h);
      g.fillStyle = 'rgba(0,0,0,0.2)';
      for (let x = p.x + 10; x < p.x + p.w - 10; x += 8) g.fillRect(x, p.y + 8, 3, h - 16);
      g.fillStyle = '#6c220c';
      g.fillRect(p.x, p.y, p.w, 7);
      g.fillRect(p.x, F - 8, p.w, 8);
      g.fillRect(p.x, p.y, 8, h);
      g.fillRect(p.x + p.w - 8, p.y, 8, h);
      g.fillStyle = '#d4d4d8';
      g.fillRect(p.x + p.w - 40, p.y + 10, 3, h - 20);
      g.fillRect(p.x + p.w - 24, p.y + 10, 3, h - 20);
      g.fillRect(p.x + p.w - 44, p.y + h / 2, 12, 4);
      g.fillRect(p.x + p.w - 28, p.y + h / 2, 12, 4);
      g.fillStyle = '#fde68a';
      g.font = '900 22px ui-monospace, monospace';
      g.fillText('MIM', p.x + 18, p.y + 42);
      g.font = '700 10px ui-monospace, monospace';
      g.fillText('ARREDI DISMESSI', p.x + 18, p.y + 60);
      g.fillText('BANCHI A ROTELLE', p.x + 18, p.y + 74);
      g.fillText('LOTTO 2020', p.x + 18, p.y + 88);
      topEdge(g, p.x, p.y, p.w, '#fdba74');
    },

    // Cattedra sulla predella
    cattedra(g, p) {
      g.fillStyle = '#5a3a1f';
      g.fillRect(p.x - 14, F - 16, p.w + 28, 16);
      g.fillStyle = '#8b5a2b';
      g.fillRect(p.x - 14, F - 16, p.w + 28, 3);
      g.fillStyle = '#7a4a22';
      g.fillRect(p.x, p.y + 8, p.w, F - 16 - p.y - 8);
      g.strokeStyle = '#4e2d12';
      g.lineWidth = 2;
      g.strokeRect(p.x + 10, p.y + 18, p.w - 20, F - 16 - p.y - 30);
      g.fillStyle = '#4e2d12';
      g.fillRect(p.x + 10, p.y + 12, p.w - 20, 2);
      g.fillStyle = '#facc15';
      g.fillRect(p.x + p.w / 2 - 6, p.y + 22, 12, 3);
      g.fillStyle = '#a86a34';
      g.fillRect(p.x - 5, p.y, p.w + 10, 8);
      topEdge(g, p.x - 5, p.y, p.w + 10, '#e0a96a');
      // registro, fogli e tazza
      g.fillStyle = '#1e3a8a';
      g.fillRect(p.x + 12, p.y - 5, 28, 5);
      g.fillStyle = '#f8fafc';
      g.fillRect(p.x + p.w - 46, p.y - 3, 24, 3);
      g.fillStyle = '#e2e8f0';
      g.fillRect(p.x + p.w - 16, p.y - 9, 8, 9);
    },

    // Due distributori automatici affiancati
    distributore(g, p) {
      const rnd = rng(p.x);
      const mw = p.w / 2;
      [['#b91c1c', 'SNACK'], ['#111827', 'CAFFÈ 0,60€']].forEach(([col, txt], k) => {
        const mx = p.x + k * mw;
        g.fillStyle = col;
        g.fillRect(mx + 1, p.y, mw - 2, F - p.y);
        g.fillStyle = 'rgba(255,255,255,0.12)';
        g.fillRect(mx + 1, p.y, 3, F - p.y);
        g.fillStyle = '#f8fafc';
        g.font = '900 8px ui-monospace, monospace';
        g.fillText(txt, mx + 6, p.y + 13);
        const gx = mx + 6, gy = p.y + 20, gw = mw * 0.62, gh = (F - p.y) * 0.58;
        g.fillStyle = '#0b1220';
        g.fillRect(gx, gy, gw, gh);
        if (k === 0) {
          for (let sy = gy + 6; sy < gy + gh - 6; sy += 16) {
            for (let sx = gx + 4; sx < gx + gw - 8; sx += 10) {
              g.fillStyle = ['#facc15', '#22c55e', '#f97316', '#38bdf8', '#e11d48'][Math.floor(rnd() * 5)];
              g.fillRect(sx, sy, 7, 10);
            }
            g.fillStyle = '#475569';
            g.fillRect(gx + 2, sy + 11, gw - 4, 2);
          }
        } else {
          g.fillStyle = '#7c4a21';
          g.beginPath(); g.arc(gx + gw / 2, gy + gh / 2, gw * 0.3, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#f8fafc';
          g.fillRect(gx + gw / 2 - 7, gy + gh / 2 - 4, 14, 12);
        }
        g.fillStyle = 'rgba(147, 197, 253, 0.15)';
        g.fillRect(gx, gy, gw, gh);
        g.fillStyle = '#94a3b8';
        for (let r = 0; r < 4; r++) for (let c2 = 0; c2 < 2; c2++) g.fillRect(gx + gw + 4 + c2 * 7, gy + 10 + r * 9, 5, 5);
        g.fillStyle = '#020617';
        g.fillRect(mx + 8, F - 26, mw - 18, 14);
      });
      topEdge(g, p.x, p.y, p.w, '#fca5a5');
    },

    // Fila di armadietti metallici
    armadietti(g, p) {
      const n = Math.round(p.w / 40);
      const dw = p.w / n;
      g.fillStyle = '#334155';
      g.fillRect(p.x, p.y, p.w, F - p.y);
      for (let i = 0; i < n; i++) {
        const dx = p.x + i * dw;
        const open = i === 2;
        g.fillStyle = open ? '#0f172a' : ['#5b7290', '#4f6684'][i % 2];
        g.fillRect(dx + 2, p.y + 6, dw - 4, F - p.y - 14);
        if (open) {
          g.fillStyle = '#f8fafc';
          g.fillRect(dx + 8, p.y + 50, 16, 20);
          g.fillStyle = '#5b7290';
          g.fillRect(dx + dw - 10, p.y + 6, 8, F - p.y - 14);
          continue;
        }
        g.fillStyle = '#1e293b';
        for (let v = 0; v < 4; v++) g.fillRect(dx + 9, p.y + 16 + v * 5, dw - 18, 2);
        g.fillStyle = '#e2e8f0';
        g.fillRect(dx + dw - 11, p.y + 70, 4, 14);
        g.fillStyle = '#f8fafc';
        g.fillRect(dx + 10, p.y + 44, 14, 8);
        g.fillStyle = '#111827';
        g.font = '700 7px ui-monospace, monospace';
        g.fillText(String(11 + i), dx + 12, p.y + 51);
      }
      g.fillStyle = '#94a3b8';
      g.fillRect(p.x - 2, p.y, p.w + 4, 6);
      topEdge(g, p.x - 2, p.y, p.w + 4, '#e2e8f0');
    },

    // Gradini delle scale
    gradino(g, p) {
      g.fillStyle = '#9aa3b2';
      g.fillRect(p.x, p.y + 6, p.w + 2, F - p.y - 6);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(p.x, p.y + 6, p.w + 2, 3);
      g.fillStyle = '#e5e7eb';
      g.fillRect(p.x - 3, p.y, p.w + 5, 6);
      topEdge(g, p.x - 3, p.y, p.w + 5, '#ffffff');
    },

    pianerottolo(g, p) {
      PLATFORM_DRAW.gradino(g, p);
      // corrimano lungo la rampa
      g.strokeStyle = '#78350f';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(3112, 405 - 36);
      g.lineTo(p.x, p.y - 36);
      g.lineTo(p.x + p.w, p.y - 36);
      g.stroke();
      g.strokeStyle = '#64748b';
      g.lineWidth = 2;
      [[3130, 405], [3170, 370], [3210, 335], [p.x + 20, p.y], [p.x + 60, p.y], [p.x + p.w - 4, p.y]].forEach(([bx, by]) => {
        g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by - 36); g.stroke();
      });
      // cartello aula
      g.fillStyle = '#166534';
      g.fillRect(p.x + 4, p.y - 96, 92, 30);
      g.strokeStyle = '#f8fafc'; g.lineWidth = 2;
      g.strokeRect(p.x + 7, p.y - 93, 86, 24);
      g.fillStyle = '#f8fafc';
      g.font = '900 13px ui-monospace, monospace';
      g.fillText('AULA 3 AM ↑', p.x + 11, p.y - 76);
    },

    // Pila di faldoni dell'archivio GPS
    faldoni(g, p) {
      const rnd = rng(p.x);
      const labels = ['GPS', 'TAR', 'RICORSI', 'MAD', 'ESPOSTI', '2019', 'DIFFIDE', 'PUNTEGGI'];
      const rows = Math.max(2, Math.round((F - p.y) / 26));
      const rh = (F - p.y) / rows;
      for (let r = 0; r < rows; r++) {
        const by = p.y + r * rh;
        let bx = p.x + (r % 2 ? -8 : 0);
        while (bx < p.x + p.w - 4) {
          const bw = Math.min(44, p.x + p.w - bx);
          const x0 = Math.max(p.x, bx);
          g.fillStyle = rnd() < 0.5 ? '#b7863f' : '#a87532';
          g.fillRect(x0, by, bx + bw - x0 - 1, rh - 1);
          g.fillStyle = 'rgba(0,0,0,0.25)';
          g.fillRect(x0, by + rh - 4, bx + bw - x0 - 1, 3);
          if (bx + bw - x0 > 30) {
            g.fillStyle = '#f8fafc';
            g.fillRect(x0 + 5, by + 7, 30, 10);
            g.fillStyle = '#7f1d1d';
            g.font = '700 7px ui-monospace, monospace';
            g.fillText(labels[Math.floor(rnd() * labels.length)], x0 + 7, by + 15);
          }
          bx += bw;
        }
      }
      topEdge(g, p.x, p.y, p.w, '#f3d39b');
    }
  };

  // Missione 1, sfondo del livello (spazio mondo): cortile, facciata, corridoio, archivio
  function paintBack1(g, rnd) {

    // --- CORTILE (0 - 1080) ---
    drawPalm(g, 240, F - 10, 210, 18);
    drawPalm(g, 560, F - 10, 170, -14);
    drawPalm(g, 1010, F - 10, 230, 10);
    // cancellata con muretto basso di fondo
    g.fillStyle = '#2a2830';
    g.fillRect(0, F - 22, 1090, 22);
    g.fillStyle = '#35333b';
    for (let x = 0; x < 1090; x += 36) g.fillRect(x + 1, F - 21, 34, 9);
    g.fillStyle = '#16171d';
    g.fillRect(0, F - 94, 1090, 3);
    g.fillRect(0, F - 56, 1090, 3);
    for (let x = 8; x < 1090; x += 13) {
      g.fillRect(x, F - 96, 3, 74);
      g.beginPath(); g.moveTo(x - 2, F - 96); g.lineTo(x + 1.5, F - 104); g.lineTo(x + 5, F - 96); g.fill();
    }
    // pilastri del cancello con targa
    [6, 150].forEach(px => {
      g.fillStyle = '#4a4650';
      g.fillRect(px, F - 130, 26, 130);
      g.fillStyle = '#6b6672';
      g.fillRect(px - 3, F - 134, 32, 8);
    });
    g.fillStyle = '#f8fafc';
    g.fillRect(36, F - 128, 108, 30);
    g.strokeStyle = '#1e3a8a'; g.lineWidth = 2;
    g.strokeRect(38, F - 126, 104, 26);
    g.fillStyle = '#1e3a8a';
    g.font = '900 11px ui-monospace, monospace';
    g.fillText('I.T. MEUCCI', 52, F - 114);
    g.font = '700 8px ui-monospace, monospace';
    g.fillText('ACIREALE', 68, F - 104);

    // --- FACCIATA DEL MEUCCI (1080 - 1600) ---
    const fx = 1080, fw = 520, fy = 70;
    g.fillStyle = '#b99067';
    g.fillRect(fx, fy, fw, F - fy);
    g.fillStyle = 'rgba(0,0,0,0.15)';
    g.fillRect(fx, fy, 10, F - fy);
    g.fillStyle = '#d8b88f';
    g.fillRect(fx - 8, fy - 10, fw + 8, 12);
    g.fillRect(fx, 165, fw, 4);
    g.fillRect(fx, 245, fw, 4);
    g.fillRect(fx, 325, fw, 4);
    g.fillStyle = '#3a3640';
    g.fillRect(fx, F - 30, fw, 30);
    for (let row = 0; row < 3; row++) {
      for (let wx = fx + 28; wx < fx + fw - 40; wx += 66) {
        const wy = 112 + row * 80;
        const on = rnd() < 0.45;
        g.fillStyle = on ? '#ffd27a' : '#2b2632';
        g.fillRect(wx, wy, 26, 44);
        g.fillStyle = '#3f5e45';
        g.fillRect(wx - 9, wy, 8, 44);
        g.fillRect(wx + 27, wy, 8, 44);
        g.fillStyle = '#e8d3b4';
        g.fillRect(wx - 10, wy + 44, 46, 4);
        g.fillStyle = on ? 'rgba(60,40,20,0.5)' : 'rgba(255,255,255,0.08)';
        g.fillRect(wx + 12, wy, 2, 44);
      }
    }
    for (let wx = fx + 28; wx < fx + fw - 40; wx += 66) {
      g.fillStyle = '#2b2632';
      g.fillRect(wx, 352, 26, 38);
      g.fillStyle = '#16171d';
      for (let b = 0; b < 4; b++) g.fillRect(wx + 3 + b * 7, 352, 2, 38);
    }
    // bandiere
    [[fx + 210, ['#15803d', '#f8fafc', '#dc2626']], [fx + 260, ['#1d4ed8', '#1d4ed8', '#1d4ed8']]].forEach(([px, cols]) => {
      g.fillStyle = '#d4d4d8';
      g.fillRect(px, fy - 58, 3, 50);
      cols.forEach((col, k) => { g.fillStyle = col; g.fillRect(px + 3 + k * 10, fy - 56, 10, 20); });
    });
    g.fillStyle = '#facc15';
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2;
      g.fillRect(fx + 278 + Math.cos(a) * 6, fy - 47 + Math.sin(a) * 6, 2, 2);
    }
    // stipite dell'ingresso al corridoio
    g.fillStyle = '#d8b88f';
    g.fillRect(1592, fy - 10, 26, F - fy + 10 - 160);
    g.fillRect(1592, F - 160, 8, 160);

    // --- CORRIDOIO (1600 - 3600) ---
    const cx0 = 1600, cx1 = 3600;
    const wallTop = 36, wainscot = F - 120;
    g.fillStyle = '#c4b896';
    g.fillRect(cx0, wallTop, cx1 - cx0, wainscot - wallTop);
    g.fillStyle = '#3f6e57';
    g.fillRect(cx0, wainscot, cx1 - cx0, F - wainscot);
    g.fillStyle = '#2c5141';
    g.fillRect(cx0, wainscot, cx1 - cx0, 4);
    g.fillStyle = '#1f2a24';
    g.fillRect(cx0, F - 8, cx1 - cx0, 8);
    g.fillStyle = '#23262f';
    g.fillRect(cx0, 0, cx1 - cx0 + 800, wallTop);
    // ombra sotto il soffitto
    const sh = g.createLinearGradient(0, wallTop, 0, wallTop + 40);
    sh.addColorStop(0, 'rgba(0,0,0,0.3)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh;
    g.fillRect(cx0, wallTop, cx1 - cx0, 40);

    function finestra(x, y, w, h) {
      const sky = g.createLinearGradient(0, y, 0, y + h);
      sky.addColorStop(0, '#3b1d4a');
      sky.addColorStop(0.6, '#c2410c');
      sky.addColorStop(1, '#f59e0b');
      g.fillStyle = sky;
      g.fillRect(x, y, w, h);
      g.fillStyle = '#2a1a2e';
      g.fillRect(x, y + h - 26, w * 0.4, 26);
      g.fillRect(x + w * 0.55, y + h - 38, w * 0.3, 38);
      g.fillStyle = '#eef0f2';
      g.fillRect(x - 5, y - 5, w + 10, 5);
      g.fillRect(x - 5, y + h, w + 10, 6);
      g.fillRect(x - 5, y, 5, h);
      g.fillRect(x + w, y, 5, h);
      g.fillRect(x + w / 2 - 2, y, 4, h);
      g.fillRect(x, y + h * 0.38, w, 3);
    }
    function porta(x, label) {
      const top = F - 160;
      g.fillStyle = '#3f2a1a';
      g.fillRect(x - 6, top - 6, 82, 158);
      g.fillStyle = '#8b5e34';
      g.fillRect(x, top, 70, 152);
      g.strokeStyle = '#6b4423'; g.lineWidth = 2;
      g.strokeRect(x + 8, top + 62, 54, 80);
      g.fillStyle = '#9ec5e0';
      g.fillRect(x + 12, top + 14, 46, 36);
      g.fillStyle = '#3f2a1a';
      g.fillRect(x + 34, top + 14, 2, 36);
      g.fillStyle = '#facc15';
      g.fillRect(x + 56, top + 84, 9, 3);
      g.fillStyle = '#f8fafc';
      g.fillRect(x - 6, top - 30, 82, 18);
      g.strokeStyle = '#1e3a8a'; g.lineWidth = 1;
      g.strokeRect(x - 6, top - 30, 82, 18);
      g.fillStyle = '#1e3a8a';
      g.font = '900 9px ui-monospace, monospace';
      g.textAlign = 'center';
      g.fillText(label, x + 35, top - 18);
      g.textAlign = 'left';
    }
    function bacheca(x, y, title) {
      g.fillStyle = '#5b3a1e';
      g.fillRect(x - 5, y - 5, 160, 100);
      g.fillStyle = '#b07a43';
      g.fillRect(x, y, 150, 90);
      g.fillStyle = '#7f1d1d';
      g.fillRect(x, y, 150, 16);
      g.fillStyle = '#f8fafc';
      g.font = '900 9px ui-monospace, monospace';
      g.fillText(title, x + 6, y + 11);
      for (let k = 0; k < 5; k++) {
        const px = x + 8 + k * 28, py = y + 24 + (k % 2) * 10;
        g.save();
        g.translate(px + 11, py + 15);
        g.rotate((rnd() - 0.5) * 0.25);
        g.fillStyle = '#f8fafc';
        g.fillRect(-11, -15, 22, 30);
        g.fillStyle = '#94a3b8';
        for (let l = 0; l < 5; l++) g.fillRect(-8, -10 + l * 5, 16, 1);
        g.fillStyle = '#dc2626';
        g.beginPath(); g.arc(0, -13, 2, 0, Math.PI * 2); g.fill();
        g.restore();
      }
    }
    // neon sul soffitto
    for (let x = cx0 + 160; x < cx1; x += 420) {
      const glow = g.createRadialGradient(x + 30, wallTop, 4, x + 30, wallTop + 20, 120);
      glow.addColorStop(0, 'rgba(255,255,230,0.35)');
      glow.addColorStop(1, 'rgba(255,255,230,0)');
      g.fillStyle = glow;
      g.fillRect(x - 90, wallTop, 240, 140);
      g.fillStyle = '#f8fafc';
      g.fillRect(x, wallTop - 4, 60, 6);
    }
    // pochi elementi, distanziati: il corridoio deve restare leggibile
    finestra(1720, 84, 96, 110);
    porta(2186, '2 BM');
    bacheca(2300, 100, 'GRADUATORIE GPS');
    finestra(2620, 84, 96, 110);
    porta(2760, 'PRESIDENZA');
    finestra(2990, 84, 96, 110);
    porta(3420, 'SEGRETERIA');

    // --- ARCHIVIO GPS (3600 - 4400) ---
    g.fillStyle = '#2b2620';
    g.fillRect(cx1, wallTop, STAGE_LENGTH - cx1, F - wallTop);
    g.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = cx1; x < STAGE_LENGTH; x += 24) g.fillRect(x, wallTop, 2, F - wallTop);
    for (let sx = cx1 + 30; sx < STAGE_LENGTH - 20; sx += 140) {
      g.fillStyle = '#3f3f46';
      g.fillRect(sx, 110, 120, F - 120);
      for (let sy = 120; sy < F - 20; sy += 58) {
        let bx = sx + 6;
        while (bx < sx + 112) {
          const bw = 7 + Math.floor(rnd() * 6);
          g.fillStyle = ['#1d4ed8', '#b91c1c', '#15803d', '#ca8a04', '#6b21a8', '#e2e8f0'][Math.floor(rnd() * 6)];
          g.fillRect(bx, sy + 8 + Math.floor(rnd() * 8), bw - 1, 42);
          bx += bw;
        }
        g.fillStyle = '#52525b';
        g.fillRect(sx, sy + 50, 120, 6);
      }
    }
    g.fillStyle = 'rgba(12, 8, 14, 0.72)';
    g.fillRect(cx1, wallTop, STAGE_LENGTH - cx1, F - wallTop);
    // pilastro di separazione
    g.fillStyle = '#c9bea4';
    g.fillRect(cx1 - 14, wallTop, 28, F - wallTop);
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(cx1 + 6, wallTop, 8, F - wallTop);
    // lampade appese
    [3760, 4060, 4300].forEach(lx => {
      g.strokeStyle = '#111827'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(lx, wallTop); g.lineTo(lx, 110); g.stroke();
      g.fillStyle = '#334155';
      g.beginPath(); g.moveTo(lx - 16, 122); g.lineTo(lx, 108); g.lineTo(lx + 16, 122); g.fill();
      const cone = g.createLinearGradient(0, 122, 0, F);
      cone.addColorStop(0, 'rgba(253, 224, 71, 0.22)');
      cone.addColorStop(1, 'rgba(253, 224, 71, 0)');
      g.fillStyle = cone;
      g.beginPath(); g.moveTo(lx - 14, 122); g.lineTo(lx + 14, 122); g.lineTo(lx + 120, F); g.lineTo(lx - 120, F); g.fill();
    });

  }

  function paintFloor1(g, rnd) {
    const cx0 = 1600, cx1 = 3600;
    const asph = g.createLinearGradient(0, F, 0, H);
    asph.addColorStop(0, '#4b505a');
    asph.addColorStop(1, '#15181e');
    g.fillStyle = asph;
    g.fillRect(0, F, cx0, H - F);
    g.fillStyle = '#9097a1';
    g.fillRect(0, F, cx0, 3);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1;
    for (let k = 0; k < 14; k++) {
      let x = rnd() * cx0, y = F + 12 + rnd() * 70;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 4; s++) { x += 6 + rnd() * 14; y += (rnd() - 0.5) * 8; g.lineTo(x, y); }
      g.stroke();
    }
    // tombino
    g.fillStyle = '#2a2d33';
    g.fillRect(760, F + 40, 60, 20);
    g.fillStyle = '#4b5059';
    for (let k = 0; k < 6; k++) g.fillRect(764 + k * 9, F + 43, 5, 14);
    // l'unico posto riservato, dove e' parcheggiata la Moke
    g.strokeStyle = '#eab308'; g.lineWidth = 4;
    g.beginPath();
    g.moveTo(1390, F + 8); g.lineTo(1378, F + 84);
    g.moveTo(1572, F + 8); g.lineTo(1584, F + 84);
    g.moveTo(1378, F + 84); g.lineTo(1584, F + 84);
    g.stroke();
    g.fillStyle = '#fde047';
    g.font = '900 13px ui-monospace, monospace';
    g.textAlign = 'center';
    g.fillText('RISERVATO PROF. BELLA', 1481, F + 50);
    g.font = '700 10px ui-monospace, monospace';
    g.fillStyle = '#e2e8f0';
    g.fillText('DI RUOLO', 1481, F + 66);
    g.textAlign = 'left';
    // graniglia del corridoio
    for (let ty = F, row = 0; ty < H; ty += 25, row++) {
      for (let tx = cx0, col = 0; tx < cx1; tx += 48, col++) {
        g.fillStyle = (row + col) % 2 ? '#5f6573' : '#4c515e';
        g.fillRect(tx, ty, 48, 25);
      }
    }
    for (let k = 0; k < 1400; k++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)';
      g.fillRect(cx0 + rnd() * (cx1 - cx0), F + rnd() * (H - F), 2, 2);
    }
    const depth = g.createLinearGradient(0, F, 0, H);
    depth.addColorStop(0, 'rgba(0,0,0,0)');
    depth.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = depth;
    g.fillRect(cx0, F, STAGE_LENGTH - cx0, H - F);
    // parquet e tappeto rosso dell'archivio
    g.fillStyle = '#3b2a1d';
    g.fillRect(cx1, F, STAGE_LENGTH - cx1, H - F);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    for (let ty = F + 12; ty < H; ty += 12) g.fillRect(cx1, ty, STAGE_LENGTH - cx1, 1);
    g.fillStyle = '#8f1d1d';
    g.fillRect(cx1, F + 8, STAGE_LENGTH - cx1, 40);
    g.fillStyle = '#facc15';
    g.fillRect(cx1, F + 8, STAGE_LENGTH - cx1, 2);
    g.fillRect(cx1, F + 46, STAGE_LENGTH - cx1, 2);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(cx1, F + 48, STAGE_LENGTH - cx1, H - F - 48);

  }

  function paintSigns1(g) {
    // insegna dell'archivio
    g.fillStyle = '#7f1d1d';
    g.fillRect(3660, 52, 560, 40);
    g.strokeStyle = '#facc15'; g.lineWidth = 3;
    g.strokeRect(3660, 52, 560, 40);
    g.fillStyle = '#facc15';
    g.font = '900 17px ui-monospace, monospace';
    g.fillText('ARCHIVIO GPS · UFFICIO DEL SUPER-RICORRISTA', 3676, 78);
    // striscione d'ingresso al corridoio
    g.fillStyle = '#1e3a8a';
    g.fillRect(1580, F - 220, 280, 48);
    g.strokeStyle = '#facc15'; g.lineWidth = 3;
    g.strokeRect(1580, F - 220, 280, 48);
    g.fillStyle = '#ffffff';
    g.font = '900 15px ui-monospace, monospace';
    g.fillText('ENTRATA CORRIDOIO MEUCCI', 1600, F - 198);
    g.fillStyle = '#facc15';
    g.font = '700 11px ui-monospace, monospace';
    g.fillText('ZONA DI RUOLO · VIETATO AI 60 CFU', 1605, F - 182);

  }

  // Strato del livello: sfondo attenuato, pavimento, insegne, oggetti calpestabili col contorno
  function buildStage(lv) {
    const c = mkCanvas(STAGE_LENGTH, H), g = c.getContext('2d');
    const rnd = rng(lv.seed);
    lv.paintBack(g, rnd);
    // lo sfondo si attenua: cio' su cui si sale deve staccare
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = lv.dim;
    g.fillRect(0, 0, STAGE_LENGTH, F);
    g.globalCompositeOperation = 'source-over';
    lv.paintFloor(g, rnd);
    lv.paintSigns(g);
    const solid = lv.platforms.filter(p => !p.moving);
    solid.forEach(p => {
      g.fillStyle = 'rgba(0,0,0,0.4)';
      g.beginPath();
      g.ellipse(p.x + p.w / 2, F + 4, p.w / 2 + 12, 7, 0, 0, Math.PI * 2);
      g.fill();
    });
    // oggetti su un foglio a parte, poi contorno scuro da cartone animato
    const o = mkCanvas(STAGE_LENGTH, H), og = o.getContext('2d');
    solid.forEach(p => PLATFORM_DRAW[p.type](og, p));
    const sil = mkCanvas(STAGE_LENGTH, H), sg = sil.getContext('2d');
    sg.drawImage(o, 0, 0);
    sg.globalCompositeOperation = 'source-in';
    sg.fillStyle = '#05070c';
    sg.fillRect(0, 0, STAGE_LENGTH, H);
    [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([dx, dy]) => g.drawImage(sil, dx, dy));
    g.drawImage(o, 0, 0);
    return c;
  }

  // ================= MISSIONE 2: CATANIA DI NOTTE =================
  const LEVEL2_PLATFORMS = [
    // Piazza Duomo (0 - 1700)
    { x: 430, y: 375, w: 120, h: 18, type: 'arance' },
    { x: 620, y: 320, w: 150, h: 18, type: 'chiosco' },
    { x: 1050, y: 330, w: 300, h: 18, type: 'autobus' },
    { x: 1470, y: 370, w: 120, h: 18, type: 'arance' },
    // Ufficio Scolastico (1700 - 3500)
    { x: 1850, y: 404, w: 180, h: 18, type: 'panca' },
    { x: 2080, y: 340, w: 200, h: 18, type: 'bancone' },
    { x: 2400, y: 310, w: 140, h: 18, type: 'schedari' },
    { x: 2640, y: 360, w: 180, h: 18, type: 'pec' },
    { x: 2900, y: 410, w: 90, h: 18, type: 'ascensore', moving: { min: 250, max: 410, speed: 75 }, dir: -1 },
    { x: 3000, y: 250, w: 260, h: 18, type: 'soppalco' },
    { x: 3320, y: 360, w: 120, h: 18, type: 'schedari' },
    // Sala server (3500 - 4400)
    { x: 3640, y: 360, w: 120, h: 18, type: 'rack' },
    { x: 3830, y: 320, w: 90, h: 18, type: 'rack' }
  ];

  Object.assign(PLATFORM_DRAW, {
    // Cassette di arance rosse impilate
    arance(g, p) {
      const rows = Math.max(2, Math.round((F - p.y) / 24));
      const rh = (F - p.y) / rows;
      const n = Math.max(2, Math.round(p.w / 40));
      const cw = p.w / n;
      for (let r = 0; r < rows; r++) {
        for (let i = 0; i < n; i++) {
          const x = p.x + i * cw, y = p.y + r * rh;
          g.fillStyle = '#5a3a1e';
          g.fillRect(x + 1, y, cw - 2, rh - 1);
          for (let k = 0; k < 3; k++) {
            g.fillStyle = '#f97316';
            g.beginPath(); g.arc(x + 8 + k * (cw - 16) / 2, y + 8, 6, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#fdba74';
            g.fillRect(x + 6 + k * (cw - 16) / 2, y + 5, 2, 2);
          }
          g.fillStyle = '#c08a4f';
          g.fillRect(x + 1, y + rh * 0.45, cw - 2, rh * 0.55 - 1);
          g.fillStyle = '#8a5a2b';
          g.fillRect(x + 1, y + rh * 0.72, cw - 2, 2);
          g.fillStyle = '#a8743d';
          g.fillRect(x + 1, y, 4, rh - 1);
          g.fillRect(x + cw - 5, y, 4, rh - 1);
          g.fillStyle = '#d9a066';
          g.fillRect(x + 1, y, cw - 2, 3);
        }
      }
      g.fillStyle = '#fef3c7';
      g.fillRect(p.x + 6, F - rh * 0.5, 44, 9);
      g.fillStyle = '#b91c1c';
      g.font = '900 7px ui-monospace, monospace';
      g.fillText('ARANCE', p.x + 10, F - rh * 0.5 + 7);
      topEdge(g, p.x, p.y, p.w, '#fde7c2');
    },

    // Chiosco catanese di seltz, limone e sale
    chiosco(g, p) {
      const h = F - p.y;
      g.fillStyle = '#1f6f43';
      g.fillRect(p.x + 4, p.y + 34, p.w - 8, h - 34);
      g.fillStyle = '#0f2a1c';
      g.fillRect(p.x + 14, p.y + 40, p.w - 28, 30);
      for (let bx = p.x + 20, k = 0; bx < p.x + p.w - 22; bx += 12, k++) {
        g.fillStyle = ['#fde047', '#a3e635', '#fca5a5'][k % 3];
        g.fillRect(bx, p.y + 52, 6, 16);
        g.fillRect(bx + 2, p.y + 47, 2, 5);
      }
      g.fillStyle = '#d6d3d1';
      g.fillRect(p.x + 8, p.y + 70, p.w - 16, 5);
      g.strokeStyle = '#14532d';
      g.lineWidth = 2;
      const pw = (p.w - 32) / 2;
      g.strokeRect(p.x + 12, p.y + 84, pw, h - 94);
      g.strokeRect(p.x + 20 + pw, p.y + 84, pw, h - 94);
      g.fillStyle = '#fef3c7';
      g.fillRect(p.x, p.y + 16, p.w, 18);
      g.fillStyle = '#b91c1c';
      g.font = '900 9px ui-monospace, monospace';
      g.textAlign = 'center';
      g.fillText('SELTZ · LIMONE E SALE', p.x + p.w / 2, p.y + 29);
      g.textAlign = 'left';
      g.fillStyle = '#14532d';
      g.fillRect(p.x - 10, p.y, p.w + 20, 10);
      g.fillStyle = '#166534';
      g.fillRect(p.x - 6, p.y + 10, p.w + 12, 6);
      topEdge(g, p.x - 10, p.y, p.w + 20, '#4ade80');
    },

    // Autobus urbano parcheggiato (si sale sul tetto)
    autobus(g, p) {
      const h = F - p.y;
      g.fillStyle = '#e2e8f0';
      g.fillRect(p.x, p.y, p.w, h - 20);
      g.fillStyle = '#1e3a5f';
      g.fillRect(p.x + 4, p.y + 12, 34, 46);
      for (let wx = p.x + 48, k = 0; wx < p.x + p.w - 30; wx += 46, k++) {
        if (k === 2) continue;
        g.fillStyle = '#f5d98a';
        g.fillRect(wx, p.y + 14, 38, 32);
        if (k % 2 === 0) {
          g.fillStyle = '#1f2937';
          g.beginPath(); g.arc(wx + 19, p.y + 34, 7, 0, Math.PI * 2); g.fill();
          g.fillRect(wx + 11, p.y + 39, 16, 7);
        }
      }
      g.fillStyle = '#334155';
      g.fillRect(p.x + 141, p.y + 12, 34, h - 34);
      g.fillStyle = '#94a3b8';
      g.fillRect(p.x + 157, p.y + 12, 2, h - 34);
      g.fillStyle = '#ea580c';
      g.fillRect(p.x, p.y + h - 50, p.w, 12);
      g.fillStyle = '#c2410c';
      g.fillRect(p.x, p.y + h - 38, p.w, 5);
      g.fillStyle = '#111827';
      g.fillRect(p.x + 4, p.y + 2, 74, 9);
      g.fillStyle = '#f59e0b';
      g.font = '700 7px ui-monospace, monospace';
      g.fillText('1-4 · CENTRO', p.x + 8, p.y + 9);
      g.fillStyle = '#ea580c';
      g.font = '900 13px ui-monospace, monospace';
      g.fillText('AMTS', p.x + 200, p.y + h - 56);
      [p.x + 64, p.x + p.w - 64].forEach(wx => {
        g.fillStyle = '#0b0f17';
        g.beginPath(); g.arc(wx, F - 14, 17, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#94a3b8';
        g.beginPath(); g.arc(wx, F - 14, 7, 0, Math.PI * 2); g.fill();
      });
      topEdge(g, p.x, p.y, p.w, '#ffffff');
    },

    // Panca della sala d'attesa
    panca(g, p) {
      g.fillStyle = '#475569';
      [p.x + 10, p.x + p.w / 2 - 2, p.x + p.w - 15].forEach(lx => g.fillRect(lx, p.y + 8, 5, F - p.y - 8));
      g.fillStyle = '#64748b';
      g.fillRect(p.x, p.y + 7, p.w, 4);
      const n = 5, sw = p.w / n;
      for (let k = 0; k < n; k++) {
        g.fillStyle = '#2563eb';
        g.fillRect(p.x + k * sw + 2, p.y, sw - 4, 7);
      }
      topEdge(g, p.x, p.y, p.w, '#93c5fd');
    },

    // Bancone dello sportello
    bancone(g, p) {
      const h = F - p.y;
      g.fillStyle = '#7c5a3c';
      g.fillRect(p.x, p.y + 8, p.w, h - 8);
      const pw = (p.w - 20) / 3;
      g.fillStyle = '#6b4b30';
      for (let k = 0; k < 3; k++) g.fillRect(p.x + 10 + k * pw + 4, p.y + 34, pw - 8, h - 50);
      g.fillStyle = '#3f2a1a';
      g.fillRect(p.x, F - 8, p.w, 8);
      g.fillStyle = '#fef3c7';
      g.fillRect(p.x + p.w / 2 - 38, p.y + 14, 76, 14);
      g.fillStyle = '#1f2937';
      g.font = '900 8px ui-monospace, monospace';
      g.textAlign = 'center';
      g.fillText('SPORTELLO 2', p.x + p.w / 2, p.y + 24);
      g.textAlign = 'left';
      g.fillStyle = '#d6d3d1';
      g.fillRect(p.x - 6, p.y, p.w + 12, 8);
      g.fillStyle = '#f8fafc';
      g.fillRect(p.x + p.w - 44, p.y - 3, 26, 3);
      g.fillStyle = '#facc15';
      g.beginPath(); g.arc(p.x + 22, p.y, 5, Math.PI, 0); g.fill();
      topEdge(g, p.x - 6, p.y, p.w + 12, '#ffffff');
    },

    // Schedari metallici a cassetti
    schedari(g, p) {
      const n = Math.max(1, Math.round(p.w / 70));
      const dw = p.w / n;
      for (let i = 0; i < n; i++) {
        const dx = p.x + i * dw;
        g.fillStyle = '#8f8a84';
        g.fillRect(dx + 1, p.y, dw - 2, F - p.y);
        const dh = (F - p.y - 8) / 4;
        for (let j = 0; j < 4; j++) {
          const dy = p.y + 6 + j * dh;
          g.fillStyle = '#c9c4bc';
          g.fillRect(dx + 5, dy, dw - 10, dh - 4);
          g.fillStyle = '#f8fafc';
          g.fillRect(dx + dw / 2 - 9, dy + 5, 18, 6);
          g.fillStyle = '#57534e';
          g.fillRect(dx + dw / 2 - 7, dy + dh / 2 + 2, 14, 3);
        }
      }
      topEdge(g, p.x, p.y, p.w, '#f5f5f4');
    },

    // Pile di PEC stampate
    pec(g, p) {
      const n = 3, sw = p.w / n;
      for (let i = 0; i < n; i++) {
        const sx = p.x + i * sw;
        g.fillStyle = '#f1f5f9';
        g.fillRect(sx + 3, p.y, sw - 6, F - p.y);
        g.fillStyle = '#cbd5e1';
        for (let y = p.y + 4; y < F; y += 4) g.fillRect(sx + 3, y, sw - 6, 1);
        g.fillStyle = '#dc2626';
        g.fillRect(sx + sw / 2 - 2, p.y, 4, F - p.y);
        g.save();
        g.translate(sx + sw / 2, p.y + (F - p.y) / 2);
        g.rotate(-0.15);
        g.fillStyle = '#f1f5f9';
        g.fillRect(-20, -9, 40, 18);
        g.strokeStyle = '#dc2626';
        g.lineWidth = 2;
        g.strokeRect(-20, -9, 40, 18);
        g.fillStyle = '#dc2626';
        g.font = '900 11px ui-monospace, monospace';
        g.textAlign = 'center';
        g.fillText('PEC', 0, 4);
        g.textAlign = 'left';
        g.restore();
      }
      topEdge(g, p.x, p.y, p.w, '#ffffff');
    },

    // Pedana dell'ascensore (si muove: disegnata a ogni frame)
    ascensore(g, p) {
      g.strokeStyle = '#94a3b8';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(p.x + 10, 36); g.lineTo(p.x + 10, p.y);
      g.moveTo(p.x + p.w - 10, 36); g.lineTo(p.x + p.w - 10, p.y);
      g.stroke();
      g.fillStyle = '#05070c';
      g.fillRect(p.x - 3, p.y - 3, p.w + 6, 20);
      g.fillStyle = '#64748b';
      g.fillRect(p.x, p.y, p.w, 14);
      g.save();
      g.beginPath(); g.rect(p.x, p.y + 8, p.w, 6); g.clip();
      for (let s = -8; s < p.w + 8; s += 12) {
        g.fillStyle = '#facc15';
        g.beginPath();
        g.moveTo(p.x + s, p.y + 14); g.lineTo(p.x + s + 6, p.y + 8); g.lineTo(p.x + s + 12, p.y + 8); g.lineTo(p.x + s + 6, p.y + 14);
        g.fill();
      }
      g.restore();
      topEdge(g, p.x, p.y, p.w, '#e2e8f0');
    },

    // Soppalco in acciaio (ci si arriva solo con l'ascensore)
    soppalco(g, p) {
      g.fillStyle = '#475569';
      g.fillRect(p.x + 6, p.y + 14, 10, F - p.y - 14);
      g.fillRect(p.x + p.w - 16, p.y + 14, 10, F - p.y - 14);
      g.strokeStyle = '#475569';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(p.x + 16, p.y + 64); g.lineTo(p.x + 56, p.y + 14);
      g.moveTo(p.x + p.w - 16, p.y + 64); g.lineTo(p.x + p.w - 56, p.y + 14);
      g.stroke();
      g.strokeStyle = '#94a3b8';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(p.x + p.w / 2 - 50, p.y + 14); g.lineTo(p.x + p.w / 2 - 50, p.y + 32);
      g.moveTo(p.x + p.w / 2 + 50, p.y + 14); g.lineTo(p.x + p.w / 2 + 50, p.y + 32);
      g.stroke();
      g.fillStyle = '#fef3c7';
      g.fillRect(p.x + p.w / 2 - 64, p.y + 32, 128, 18);
      g.fillStyle = '#7f1d1d';
      g.font = '900 8px ui-monospace, monospace';
      g.textAlign = 'center';
      g.fillText('ARCHIVIO PEC NON LETTE', p.x + p.w / 2, p.y + 44);
      g.textAlign = 'left';
      g.fillStyle = '#64748b';
      g.fillRect(p.x - 4, p.y, p.w + 8, 14);
      g.fillStyle = '#334155';
      g.fillRect(p.x - 4, p.y + 10, p.w + 8, 4);
      topEdge(g, p.x - 4, p.y, p.w + 8, '#cbd5e1');
    },

    // Armadio server
    rack(g, p) {
      const rnd = rng(p.x);
      g.fillStyle = '#64748b';
      g.fillRect(p.x, p.y, p.w, F - p.y);
      g.fillStyle = '#273449';
      g.fillRect(p.x + 6, p.y + 8, p.w - 12, F - p.y - 16);
      for (let y = p.y + 14; y < F - 14; y += 10) {
        g.fillStyle = '#475569';
        g.fillRect(p.x + 10, y, p.w - 20, 6);
        g.fillStyle = rnd() < 0.5 ? '#22c55e' : rnd() < 0.5 ? '#38bdf8' : '#f59e0b';
        g.fillRect(p.x + p.w - 18, y + 2, 3, 2);
      }
      g.fillStyle = '#cbd5e1';
      g.fillRect(p.x - 2, p.y, p.w + 4, 5);
      topEdge(g, p.x - 2, p.y, p.w + 4, '#f1f5f9');
    }
  });

  // Strato lontano: l'Etna di notte con la colata
  const ETNA2 = { x: 420, y: 168 };
  function buildFar2() {
    const w = Math.ceil(W + (STAGE_LENGTH - W) * FAR_F) + 40;
    const c = mkCanvas(w, FLOOR_Y), g = c.getContext('2d');
    const rnd = rng(77);
    const grd = g.createLinearGradient(0, ETNA2.y, 0, 380);
    grd.addColorStop(0, '#3a2b5c');
    grd.addColorStop(1, '#2c2148');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(-120, 390);
    g.quadraticCurveTo(160, 300, ETNA2.x - 40, ETNA2.y + 8);
    g.lineTo(ETNA2.x - 14, ETNA2.y);
    g.lineTo(ETNA2.x + 18, ETNA2.y + 2);
    g.lineTo(ETNA2.x + 42, ETNA2.y + 10);
    g.quadraticCurveTo(ETNA2.x + 320, 290, w + 60, 390);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(200, 210, 240, 0.4)';
    g.beginPath();
    g.moveTo(ETNA2.x - 40, ETNA2.y + 8);
    g.lineTo(ETNA2.x - 14, ETNA2.y);
    g.lineTo(ETNA2.x + 18, ETNA2.y + 2);
    g.lineTo(ETNA2.x + 42, ETNA2.y + 10);
    g.lineTo(ETNA2.x + 80, ETNA2.y + 30);
    g.lineTo(ETNA2.x + 40, ETNA2.y + 36);
    g.lineTo(ETNA2.x + 10, ETNA2.y + 24);
    g.lineTo(ETNA2.x - 20, ETNA2.y + 40);
    g.lineTo(ETNA2.x - 70, ETNA2.y + 32);
    g.closePath();
    g.fill();
    g.save();
    g.shadowColor = '#f97316';
    g.shadowBlur = 12;
    g.strokeStyle = '#ea580c';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(ETNA2.x + 8, ETNA2.y + 4);
    g.lineTo(ETNA2.x + 26, ETNA2.y + 46);
    g.lineTo(ETNA2.x + 18, ETNA2.y + 84);
    g.lineTo(ETNA2.x + 46, ETNA2.y + 128);
    g.lineTo(ETNA2.x + 40, ETNA2.y + 150);
    g.stroke();
    g.strokeStyle = '#fde047';
    g.lineWidth = 1;
    g.stroke();
    g.restore();
    g.fillStyle = '#1c1430';
    g.beginPath();
    g.moveTo(0, FLOOR_Y);
    for (let x = 0; x <= w; x += 40) g.lineTo(x, 345 + Math.sin(x * 0.013) * 12 + Math.sin(x * 0.031) * 6);
    g.lineTo(w, FLOOR_Y);
    g.closePath();
    g.fill();
    // luci dei paesi sulle pendici
    for (let k = 0; k < 220; k++) {
      g.fillStyle = `rgba(252, 211, 77, ${0.35 + rnd() * 0.5})`;
      g.fillRect(rnd() * w, 352 + rnd() * 60, rnd() < 0.2 ? 2 : 1, 1);
    }
    return c;
  }

  // Strato medio: Catania barocca in pietra lavica, con le cupole
  function buildMid2() {
    const w = Math.ceil(W + (STAGE_LENGTH - W) * MID_F) + 60;
    const c = mkCanvas(w, FLOOR_Y), g = c.getContext('2d');
    const rnd = rng(95);
    const lit = [];
    const pal = ['#4a4954', '#55535e', '#3f3e48', '#5e5a63', '#4f4a58'];

    function palazzo(x, bw, bh, col) {
      const y = FLOOR_Y - bh;
      g.fillStyle = col;
      g.fillRect(x, y, bw, bh);
      g.fillStyle = '#b9b2a6';
      g.fillRect(x - 3, y, bw + 6, 5);
      g.fillRect(x, y, 4, bh);
      g.fillRect(x + bw - 4, y, 4, bh);
      if (rnd() < 0.4) {
        g.beginPath();
        g.moveTo(x + bw * 0.28, y);
        g.quadraticCurveTo(x + bw / 2, y - 24, x + bw * 0.72, y);
        g.closePath();
        g.fill();
      }
      const cols = Math.max(2, Math.floor((bw - 14) / 24));
      const colW = (bw - 14) / cols;
      const rows = Math.max(2, Math.floor((bh - 26) / 36));
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          const ww = 10, wh = 18;
          const wx = x + 7 + k * colW + (colW - ww) / 2;
          const wy = y + 14 + r * 36;
          g.fillStyle = '#b9b2a6';
          g.fillRect(wx - 2, wy - 4, ww + 4, wh + 6);
          const on = rnd() < 0.28;
          g.fillStyle = '#1c1a24';
          g.fillRect(wx, wy, ww, wh);
          if (on) lit.push([wx, wy, ww, wh]);
          if (r % 2 === 0 && r < rows - 1) {
            g.fillStyle = '#16141c';
            g.fillRect(wx - 4, wy + wh + 2, ww + 8, 2);
          }
        }
      }
    }
    function cupola(cx, r, bodyH) {
      const base = FLOOR_Y;
      g.fillStyle = '#5d5866';
      g.fillRect(cx - r - 14, base - bodyH, (r + 14) * 2, bodyH);
      g.fillStyle = '#b9b2a6';
      g.fillRect(cx - r - 18, base - bodyH - 4, (r + 18) * 2, 6);
      g.fillStyle = '#6e6878';
      g.fillRect(cx - r - 4, base - bodyH - 18, (r + 4) * 2, 14);
      g.fillStyle = '#7a7486';
      g.beginPath(); g.arc(cx, base - bodyH - 18, r, Math.PI, 0); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)';
      g.lineWidth = 2;
      for (let k = -2; k <= 2; k++) {
        g.beginPath();
        g.moveTo(cx + k * r * 0.36, base - bodyH - 18);
        g.quadraticCurveTo(cx + k * r * 0.14, base - bodyH - 18 - r * 0.8, cx, base - bodyH - 18 - r);
        g.stroke();
      }
      g.fillStyle = '#6e6878';
      g.fillRect(cx - 5, base - bodyH - 18 - r - 16, 10, 16);
      g.beginPath();
      g.moveTo(cx - 7, base - bodyH - 18 - r - 16); g.lineTo(cx, base - bodyH - 18 - r - 28); g.lineTo(cx + 7, base - bodyH - 18 - r - 16);
      g.fill();
      for (let k = -1; k <= 1; k++) lit.push([cx + k * 18 - 3, base - bodyH - 15, 6, 8]);
      g.fillStyle = '#1c1a24';
      g.beginPath(); g.arc(cx, base - bodyH + 40, 12, 0, Math.PI * 2); g.fill();
    }
    function campanile(x) {
      const base = FLOOR_Y;
      g.fillStyle = '#56515f';
      g.fillRect(x, base - 230, 34, 230);
      g.fillStyle = '#b9b2a6';
      [base - 230, base - 160, base - 90].forEach(y => g.fillRect(x - 3, y, 40, 4));
      g.fillStyle = '#1c1a24';
      g.fillRect(x + 10, base - 214, 14, 26);
      g.fillRect(x + 10, base - 146, 14, 20);
      g.fillStyle = '#6e6878';
      g.beginPath(); g.arc(x + 17, base - 230, 17, Math.PI, 0); g.fill();
      g.fillRect(x + 15, base - 262, 4, 16);
    }

    let x = -30, i = 0;
    while (x < w) {
      if (i === 3) { cupola(x + 100, 48, 150); x += 210; i++; continue; }
      if (i === 7) { campanile(x + 8); x += 54; i++; continue; }
      if (i === 11) { cupola(x + 80, 36, 125); x += 170; i++; continue; }
      const bw = 70 + Math.floor(rnd() * 110);
      const bh = 100 + Math.floor(rnd() * 120);
      palazzo(x, bw, bh, pal[Math.floor(rnd() * pal.length)]);
      x += bw + (rnd() < 0.25 ? 4 + rnd() * 14 : 0);
      i++;
    }
    const hz = g.createLinearGradient(0, 100, 0, FLOOR_Y);
    hz.addColorStop(0, 'rgba(8, 12, 36, 0.6)');
    hz.addColorStop(1, 'rgba(30, 20, 55, 0.5)');
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = hz;
    g.fillRect(0, 0, c.width, FLOOR_Y);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#e9b949';
    lit.forEach(([wx, wy, ww, wh]) => g.fillRect(wx, wy, ww, wh));
    return c;
  }

  // u Liotru: l'elefante di pietra lavica con l'obelisco
  function drawLiotru(g, x) {
    const b = F;
    g.fillStyle = '#b8b1a4';
    g.fillRect(x - 84, b - 30, 168, 6);
    g.fillStyle = '#d6d0c4';
    g.fillRect(x - 80, b - 24, 160, 24);
    g.fillStyle = 'rgba(125, 211, 252, 0.55)';
    g.fillRect(x - 74, b - 22, 148, 5);
    g.fillStyle = '#e2dccf';
    g.fillRect(x - 34, b - 86, 68, 56);
    g.fillStyle = '#b8b1a4';
    g.fillRect(x - 40, b - 92, 80, 8);
    g.fillRect(x - 38, b - 34, 76, 6);
    g.strokeStyle = 'rgba(186, 230, 253, 0.7)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 34, b - 62); g.quadraticCurveTo(x - 56, b - 66, x - 64, b - 26);
    g.moveTo(x + 34, b - 62); g.quadraticCurveTo(x + 56, b - 66, x + 64, b - 26);
    g.stroke();
    g.fillStyle = '#1e1c24';
    g.beginPath(); g.ellipse(x, b - 112, 34, 18, 0, 0, Math.PI * 2); g.fill();
    [-26, -8, 8, 20].forEach(lx => g.fillRect(x + lx, b - 104, 10, 14));
    g.beginPath(); g.arc(x + 32, b - 120, 13, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a2730';
    g.beginPath(); g.ellipse(x + 26, b - 118, 7, 11, 0.3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#1e1c24';
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(x + 42, b - 116); g.quadraticCurveTo(x + 56, b - 104, x + 48, b - 92); g.stroke();
    g.strokeStyle = '#f1f5f9';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(x + 40, b - 110); g.lineTo(x + 48, b - 104); g.stroke();
    g.fillStyle = '#e2dccf';
    g.fillRect(x - 14, b - 129, 28, 9);
    g.fillStyle = '#3d3846';
    g.beginPath();
    g.moveTo(x - 9, b - 128); g.lineTo(x - 4, b - 300); g.lineTo(x + 4, b - 300); g.lineTo(x + 9, b - 128);
    g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x - 4, b - 300); g.lineTo(x, b - 310); g.lineTo(x + 4, b - 300); g.fill();
    g.fillStyle = 'rgba(220, 210, 190, 0.35)';
    for (let y = b - 290; y < b - 140; y += 12) g.fillRect(x - 3, y, 6, 2);
    g.fillStyle = '#d4a017';
    g.beginPath(); g.arc(x, b - 317, 6, 0, Math.PI * 2); g.fill();
    g.fillRect(x - 1, b - 334, 2, 12);
    g.fillRect(x - 5, b - 330, 10, 2);
  }

  function paintBack2(g, rnd) {
    // --- PIAZZA DUOMO (0 - 1300) ---
    const pw = 380, py0 = 90;
    g.fillStyle = '#3c3a44';
    g.fillRect(0, py0, pw, F - py0);
    g.fillStyle = '#c9c2b5';
    g.fillRect(0, py0 - 10, pw + 8, 12);
    [0, 126, 252, 372].forEach(lx => g.fillRect(lx, py0, 8, F - py0));
    for (let row = 0; row < 3; row++) {
      for (let wx = 34; wx < pw - 30; wx += 62) {
        const wy = 124 + row * 88;
        g.fillStyle = '#c9c2b5';
        g.fillRect(wx - 4, wy - 8, 34, 60);
        g.fillStyle = rnd() < 0.4 ? '#e9b949' : '#1c1a24';
        g.fillRect(wx, wy, 26, 50);
        g.fillStyle = '#111017';
        g.fillRect(wx - 8, wy + 50, 42, 3);
        for (let bx = wx - 8; bx < wx + 34; bx += 6) g.fillRect(bx, wy + 40, 1, 10);
      }
    }
    g.fillStyle = '#16141c';
    g.beginPath(); g.moveTo(160, F); g.lineTo(160, F - 70); g.arc(190, F - 70, 30, Math.PI, 0); g.lineTo(220, F); g.fill();
    // balaustra bassa della piazza
    g.fillStyle = '#8f897f';
    g.fillRect(pw, F - 12, 1300 - pw, 12);
    g.fillRect(pw, F - 46, 1300 - pw, 6);
    for (let bx = pw + 6; bx < 1300; bx += 14) {
      g.beginPath();
      g.ellipse(bx, F - 26, 4, 13, 0, 0, Math.PI * 2);
      g.fill();
    }
    drawLiotru(g, 880);

    // --- UFFICIO SCOLASTICO (1300 - 1700) ---
    const ux = 1300, uw = 400, uy = 110;
    g.fillStyle = '#6b7280';
    g.fillRect(ux, uy, uw, F - uy);
    g.fillStyle = '#5b616b';
    for (let x = ux + 50; x < ux + uw; x += 50) g.fillRect(x, uy, 2, F - uy);
    g.fillStyle = '#9ca3af';
    g.fillRect(ux - 6, uy - 8, uw + 6, 10);
    for (let row = 0; row < 4; row++) {
      const wy = 152 + row * 62;
      g.fillStyle = '#1e2a44';
      g.fillRect(ux + 16, wy, uw - 32, 34);
      for (let sx = ux + 16; sx < ux + uw - 40; sx += 40) {
        if (rnd() < 0.35) {
          g.fillStyle = 'rgba(147, 197, 253, 0.8)';
          g.fillRect(sx + 2, wy + 3, 36, 28);
        }
        g.fillStyle = '#9ca3af';
        g.fillRect(sx, wy, 2, 34);
      }
    }
    g.fillStyle = '#9ca3af';
    g.fillRect(ux + 300, uy - 34, 3, 26);
    g.beginPath(); g.ellipse(ux + 302, uy - 36, 12, 7, -0.4, 0, Math.PI * 2); g.fill();

    // --- INTERNO UFFICIO (1700 - 3500) ---
    const ox0 = 1700, ox1 = 3500, wallTop = 36;
    g.fillStyle = '#1a1f2b';
    g.fillRect(ox0, 0, STAGE_LENGTH - ox0, wallTop);
    g.fillStyle = '#8e9aab';
    g.fillRect(ox0, wallTop, ox1 - ox0, F - 110 - wallTop);
    g.fillStyle = '#56657a';
    g.fillRect(ox0, F - 110, ox1 - ox0, 110);
    g.fillStyle = '#3b4656';
    g.fillRect(ox0, F - 110, ox1 - ox0, 4);
    g.fillRect(ox0, F - 8, ox1 - ox0, 8);
    g.fillStyle = '#9ca3af';
    g.fillRect(ox0 - 10, wallTop, 22, F - wallTop);
    for (let x = ox0 + 140; x < ox1; x += 380) {
      const glow = g.createRadialGradient(x + 40, wallTop, 4, x + 40, wallTop + 30, 130);
      glow.addColorStop(0, 'rgba(224, 242, 254, 0.35)');
      glow.addColorStop(1, 'rgba(224, 242, 254, 0)');
      g.fillStyle = glow;
      g.fillRect(x - 90, wallTop, 260, 150);
      g.fillStyle = '#e0f2fe';
      g.fillRect(x, wallTop - 4, 80, 6);
    }
    // eliminacode
    g.fillStyle = '#0b0f17';
    g.fillRect(1760, 92, 170, 62);
    g.strokeStyle = '#475569'; g.lineWidth = 3;
    g.strokeRect(1760, 92, 170, 62);
    g.fillStyle = '#ef4444';
    g.font = '900 13px ui-monospace, monospace';
    g.fillText('SERVIAMO  A 0001', 1772, 116);
    g.fillStyle = '#fbbf24';
    g.fillText('IL TUO:   A 1100', 1772, 140);
    // cartello dello sportello, appeso al soffitto
    g.strokeStyle = '#334155'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(2140, wallTop); g.lineTo(2140, 150); g.moveTo(2220, wallTop); g.lineTo(2220, 150); g.stroke();
    g.fillStyle = '#1e3a8a';
    g.fillRect(2110, 150, 140, 26);
    g.fillStyle = '#f8fafc';
    g.font = '900 11px ui-monospace, monospace';
    g.textAlign = 'center';
    g.fillText('SPORTELLO GPS', 2180, 168);
    g.fillStyle = '#dc2626';
    g.fillRect(2150, 182, 60, 16);
    g.fillStyle = '#f8fafc';
    g.font = '900 9px ui-monospace, monospace';
    g.fillText('CHIUSO', 2180, 194);
    g.textAlign = 'left';
    // avviso in bacheca
    g.fillStyle = '#f8fafc';
    g.fillRect(2610, 104, 130, 74);
    g.fillStyle = '#dc2626';
    g.font = '900 11px ui-monospace, monospace';
    g.fillText('AVVISO', 2648, 122);
    g.fillStyle = '#1f2937';
    g.font = '700 8px ui-monospace, monospace';
    g.fillText('LA GRADUATORIA È', 2622, 142);
    g.fillText('STATA PUBBLICATA', 2622, 154);
    g.fillText('...E RITIRATA', 2622, 166);
    // vano ascensore
    g.fillStyle = '#2a3140';
    g.fillRect(2888, wallTop, 114, F - wallTop);
    g.fillStyle = '#94a3b8';
    g.fillRect(2892, wallTop, 3, F - wallTop);
    g.fillRect(2995, wallTop, 3, F - wallTop);
    g.fillStyle = '#facc15';
    g.fillRect(2894, 60, 102, 24);
    g.fillStyle = '#111827';
    g.font = '900 7px ui-monospace, monospace';
    g.fillText('PORTATA MAX:', 2902, 70);
    g.fillText('1 DOCENTE DI RUOLO', 2902, 80);

    // --- SALA SERVER (3500 - 4400) ---
    g.fillStyle = '#18213a';
    g.fillRect(ox1, wallTop, STAGE_LENGTH - ox1, F - wallTop);
    for (let sx = ox1 + 40; sx < STAGE_LENGTH - 40; sx += 120) {
      g.fillStyle = '#111a2e';
      g.fillRect(sx, 120, 90, F - 130);
      for (let y = 130; y < F - 20; y += 9) {
        g.fillStyle = '#1b263d';
        g.fillRect(sx + 6, y, 78, 5);
        if (rnd() < 0.6) {
          g.fillStyle = rnd() < 0.5 ? '#22c55e' : rnd() < 0.5 ? '#38bdf8' : '#f59e0b';
          g.fillRect(sx + 70, y + 1, 3, 2);
        }
      }
    }
    g.fillStyle = '#1f2937';
    g.fillRect(ox1, 96, STAGE_LENGTH - ox1, 8);
    g.strokeStyle = '#334155';
    g.lineWidth = 3;
    for (let x = ox1 + 20; x < STAGE_LENGTH; x += 90) {
      g.beginPath(); g.moveTo(x, 104); g.quadraticCurveTo(x + 45, 130, x + 90, 104); g.stroke();
    }
    g.fillStyle = 'rgba(5, 8, 18, 0.3)';
    g.fillRect(ox1, 104, STAGE_LENGTH - ox1, F - 104);
    g.fillStyle = '#4b5563';
    g.fillRect(ox1 - 14, wallTop, 28, F - wallTop);
  }

  function paintFloor2(g, rnd) {
    // basolato lavico della piazza
    g.fillStyle = '#26252c';
    g.fillRect(0, F, 1700, H - F);
    for (let ty = F + 3, row = 0, rh = 20; ty < H; ty += rh, row++, rh += 3) {
      let x = -rnd() * 40;
      while (x < 1700) {
        const sw = 50 + rnd() * 40;
        const v = 40 + Math.floor(rnd() * 12);
        g.fillStyle = `rgb(${v},${v},${v + 6})`;
        g.fillRect(x + 1, ty + 1, sw - 2, rh - 2);
        x += sw;
      }
    }
    g.fillStyle = '#6b6872';
    g.fillRect(0, F, 1700, 3);
    // linoleum dell'ufficio
    g.fillStyle = '#3f4a5a';
    g.fillRect(1700, F, 1800, H - F);
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 1700; x < 3500; x += 90) g.fillRect(x, F, 2, H - F);
    for (let k = 0; k < 600; k++) {
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(1700 + rnd() * 1800, F + rnd() * (H - F), 2, 2);
    }
    // pavimento flottante della sala server
    g.fillStyle = '#1c2333';
    g.fillRect(3500, F, 900, H - F);
    g.fillStyle = '#2b3447';
    for (let x = 3500; x < STAGE_LENGTH; x += 60) g.fillRect(x, F, 2, H - F);
    for (let y = F; y < H; y += 30) g.fillRect(3500, y, 900, 2);
    const depth = g.createLinearGradient(0, F, 0, H);
    depth.addColorStop(0, 'rgba(0,0,0,0)');
    depth.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = depth;
    g.fillRect(0, F, STAGE_LENGTH, H - F);
  }

  function paintSigns2(g) {
    g.fillStyle = '#1e293b';
    g.fillRect(1680, F - 232, 300, 50);
    g.strokeStyle = '#38bdf8'; g.lineWidth = 3;
    g.strokeRect(1680, F - 232, 300, 50);
    g.fillStyle = '#ffffff';
    g.font = '900 14px ui-monospace, monospace';
    g.fillText('UFFICIO SCOLASTICO DI CATANIA', 1694, F - 210);
    g.fillStyle = '#38bdf8';
    g.font = '700 10px ui-monospace, monospace';
    g.fillText('SPORTELLO APERTO: MARTEDÌ 9:00-9:05', 1694, F - 193);
    g.fillStyle = '#0b1220';
    g.fillRect(3600, 46, 600, 40);
    g.strokeStyle = '#22c55e'; g.lineWidth = 3;
    g.strokeRect(3600, 46, 600, 40);
    g.fillStyle = '#22c55e';
    g.font = '900 17px ui-monospace, monospace';
    g.fillText('SALA SERVER · ALGORITMO NOMINE GPS', 3640, 72);
  }

  // ---------- Effetti a ogni frame, per livello ----------
  function drawSky1(c) {
    const sky = c.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#0c1022');
    sky.addColorStop(0.35, '#35183f');
    sky.addColorStop(0.65, '#c2410c');
    sky.addColorStop(0.88, '#f59e0b');
    sky.addColorStop(1, '#fde047');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);
    const cloudOffset = (Date.now() * 0.006) % 1400;
    c.fillStyle = 'rgba(255, 196, 170, 0.16)';
    for (let cx = -400 + cloudOffset, k = 0; cx < W + 400; cx += 470, k++) {
      const cy = 70 + (k % 3) * 38;
      c.beginPath();
      c.ellipse(cx, cy, 150, 9, 0, 0, Math.PI * 2);
      c.ellipse(cx + 70, cy + 12, 110, 7, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  function drawFarFx1(c, farX) {
    const now = Date.now() / 1000;
    for (let k = 0; k < 10; k++) {
      const t = (now * 0.04 + k / 10) % 1;
      c.fillStyle = `rgba(80, 60, 85, ${0.4 * (1 - t)})`;
      c.beginPath();
      c.arc(farX + ETNA.x + 8 + t * 230, ETNA.y - 8 - t * 110 + Math.sin(t * 6 + k) * 6, 8 + t * 40, 0, Math.PI * 2);
      c.fill();
    }
  }
  function drawWorldFx1(c) {
    const flicker = Math.sin(Date.now() * 0.02) > -0.8;
    c.fillStyle = '#0f172a';
    c.fillRect(1150, 78, 380, 26);
    c.fillStyle = flicker ? '#38bdf8' : '#0369a1';
    c.font = '900 15px ui-monospace, monospace';
    c.fillText('⚡ ISTITUTO TECNICO MEUCCI ⚡', 1196, 97);
  }

  const STARS = (() => {
    const r = rng(2026);
    return Array.from({ length: 110 }, () => [r() * W, r() * 250, r() < 0.15 ? 2 : 1, r() * 6]);
  })();
  function drawSky2(c) {
    const sky = c.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#030617');
    sky.addColorStop(0.5, '#0b1736');
    sky.addColorStop(0.85, '#2a1f4d');
    sky.addColorStop(1, '#4a2a48');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);
    const t = Date.now() / 1000;
    STARS.forEach(([x, y, s, ph]) => {
      c.fillStyle = `rgba(255, 255, 240, ${0.45 + 0.4 * Math.sin(t * 1.5 + ph)})`;
      c.fillRect(x, y, s, s);
    });
    const glow = c.createRadialGradient(800, 78, 10, 800, 78, 80);
    glow.addColorStop(0, 'rgba(254, 243, 199, 0.35)');
    glow.addColorStop(1, 'rgba(254, 243, 199, 0)');
    c.fillStyle = glow;
    c.fillRect(700, 0, 200, 170);
    c.fillStyle = '#fef3c7';
    c.beginPath(); c.arc(800, 78, 24, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(180, 160, 120, 0.35)';
    c.beginPath(); c.arc(792, 72, 5, 0, Math.PI * 2); c.arc(808, 86, 4, 0, Math.PI * 2); c.fill();
  }
  function drawFarFx2(c, farX) {
    const t = Date.now() / 1000;
    const cx = farX + ETNA2.x + 2, cy = ETNA2.y + 2;
    const pulse = 0.35 + 0.15 * Math.sin(t * 2.2);
    const glow = c.createRadialGradient(cx, cy, 2, cx, cy, 70);
    glow.addColorStop(0, `rgba(253, 186, 116, ${pulse + 0.3})`);
    glow.addColorStop(0.4, `rgba(234, 88, 12, ${pulse})`);
    glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
    c.fillStyle = glow;
    c.fillRect(cx - 80, cy - 80, 160, 160);
    for (let k = 0; k < 9; k++) {
      const s = (t * 0.035 + k / 9) % 1;
      c.fillStyle = `rgba(120, 50, 55, ${0.45 * (1 - s)})`;
      c.beginPath();
      c.arc(cx + 6 + s * 200, cy - 10 - s * 100 + Math.sin(s * 6 + k) * 6, 8 + s * 36, 0, Math.PI * 2);
      c.fill();
    }
  }
  function drawWorldFx2(c) {
    const flicker = Math.sin(Date.now() * 0.017) > -0.85;
    c.fillStyle = '#0f172a';
    c.fillRect(1316, 116, 368, 26);
    c.fillStyle = flicker ? '#22d3ee' : '#0e7490';
    c.font = '900 14px ui-monospace, monospace';
    c.fillText('UFFICIO SCOLASTICO · CATANIA', 1384, 134);
  }

  // ---------- Boss ----------
  function drawBossCopier(c) {
    if (sprites.boss.complete && sprites.boss.naturalWidth > 0) {
      const isFiring = boss.state === 'attack' || (boss.phase % 2 > 1.2);
      c.drawImage(sprites.boss, (isFiring ? 1 : 0) * 220, 0, 220, 170, -110, -165, 220, 170);
      const scanOffset = Math.sin(Date.now() * 0.008) * 45;
      c.fillStyle = 'rgba(56, 189, 248, 0.2)';
      c.fillRect(-60 + scanOffset, -150, 25, 140);
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 2;
      c.strokeRect(-60 + scanOffset, -150, 25, 140);
    } else {
      c.fillStyle = '#1e293b';
      c.fillRect(-boss.w / 2, -boss.h, boss.w, boss.h);
      c.strokeStyle = '#ef4444';
      c.lineWidth = 4;
      c.strokeRect(-boss.w / 2, -boss.h, boss.w, boss.h);
    }
  }
  function attackCopier() {
    boss.attackTimer = 2.6;
    screenShake = 10;
    audio?.play('shotgun');
    // Volley of paper and toner missiles
    for (let k = -2; k <= 2; k++) {
      enemyBullets.push({
        x: boss.x - 70, y: boss.y - 75 + k * 16,
        vx: -320 - Math.random() * 80,
        vy: k * 45,
        life: 2.5
      });
    }
    // Spawn 2 desperate runner precari
    spawnEnemy(boss.x - 40, 'runner');
    spawnEnemy(boss.x - 80, 'runner');
  }

  // L'Algoritmo delle nomine: un server con la faccia
  function drawBossAlgoritmo(c) {
    const t = Date.now() / 1000;
    const hurt = boss.health < boss.maxHealth / 2;
    c.strokeStyle = '#1e293b';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(-96, -20); c.quadraticCurveTo(-130, -4, -170, 0);
    c.moveTo(96, -30); c.quadraticCurveTo(130, -6, 180, 0);
    c.stroke();
    c.fillStyle = '#05070c';
    c.fillRect(-106, -206, 212, 208);
    c.fillStyle = '#64748b';
    c.fillRect(-103, -203, 206, 205);
    c.fillStyle = '#111827';
    c.fillRect(-100, -200, 200, 200);
    c.fillStyle = '#1f2937';
    c.fillRect(-100, -200, 200, 8);
    c.fillStyle = hurt && Math.random() < 0.15 ? '#450a0a' : '#020617';
    c.fillRect(-80, -186, 160, 72);
    c.strokeStyle = hurt ? '#f87171' : '#22d3ee';
    c.lineWidth = 2;
    c.strokeRect(-80, -186, 160, 72);
    const blink = (t % 3) < 0.12;
    c.fillStyle = hurt ? '#f87171' : '#22d3ee';
    if (blink) {
      c.fillRect(-52, -166, 30, 3);
      c.fillRect(22, -166, 30, 3);
    } else {
      c.fillRect(-52, -172, 30, 16);
      c.fillRect(22, -172, 30, 16);
      const look = Math.max(-8, Math.min(8, (player.x - boss.x) / 50));
      c.fillStyle = '#020617';
      c.fillRect(-41 + look, -168, 8, 8);
      c.fillRect(33 + look, -168, 8, 8);
    }
    c.save();
    c.beginPath(); c.rect(-76, -146, 152, 26); c.clip();
    c.fillStyle = '#22c55e';
    c.font = '700 11px ui-monospace, monospace';
    const msg = 'ERRORE 404: CATTEDRA NON TROVATA · NOMINA ANNULLATA · RIPROVARE NEL 2031 · ';
    const mw = c.measureText(msg).width;
    c.fillText(msg + msg, -76 - ((t * 60) % mw), -128);
    c.restore();
    for (let r = 0; r < 6; r++) {
      const y = -104 + r * 15;
      c.fillStyle = '#1e293b';
      c.fillRect(-86, y, 172, 11);
      for (let k = 0; k < 10; k++) {
        const on = Math.sin(t * 6 + k * 1.7 + r * 2.3) > 0.2;
        c.fillStyle = on ? (k % 3 ? '#22c55e' : '#f59e0b') : '#0b1220';
        c.fillRect(-80 + k * 16, y + 4, 6, 3);
      }
    }
    c.fillStyle = '#94a3b8';
    c.font = '900 8px ui-monospace, monospace';
    c.fillText('MIM · SISTEMA NOMINE GPS v1.100', -84, -8);
    const on = Math.floor(t * 4) % 2 === 0;
    c.fillStyle = on ? '#ef4444' : '#7f1d1d';
    c.beginPath(); c.arc(0, -204, 9, Math.PI, 0); c.fill();
  }
  function attackAlgoritmo() {
    boss.attackTimer = 2.2;
    const pat = boss.attackCount++ % 4;
    if (pat === 0 || pat === 2) {
      // raffica di nomine sbagliate, ad arco
      audio?.play('shotgun');
      screenShake = 8;
      for (let k = 0; k < 3; k++) {
        enemyBullets.push({ x: boss.x - 100, y: boss.y - 160 + k * 30, vx: -260 - k * 50, vy: -120 + k * 50, life: 3 });
      }
    } else if (pat === 1) {
      // pioggia di nomine dal soffitto, sopra il Prof
      audio?.play('rocket');
      addText('PIOGGIA DI NOMINE!', player.x - 80, 175, '#f87171');
      for (let k = -2; k <= 2; k++) {
        enemyBullets.push({ x: player.x + k * 70, y: 50 - Math.abs(k) * 14, vx: 0, vy: 30, life: 5, kind: 'sheet', rot: Math.random() * 6 });
      }
    } else {
      spawnEnemy(boss.x - 130, 'shielder');
      spawnEnemy(boss.x - 160, 'runner');
    }
  }

  // ---------- Tabella dei livelli ----------
  const LEVELS = [
    {
      id: 1, seed: 42, platforms: LEVEL1_PLATFORMS,
      mokeX: 1480, arenaX: 3600, target: 550,
      dim: 'rgba(12, 8, 28, 0.36)',
      buildFar: buildFar1, buildMid: buildMid1,
      paintBack: paintBack1, paintFloor: paintFloor1, paintSigns: paintSigns1,
      drawSky: drawSky1, drawFarFx: drawFarFx1, drawWorldFx: drawWorldFx1,
      intro: 'MISSIONE 1: IL MEUCCI',
      runners: [450, 3500, 190, 90], shielders: [1100, 3400, 550], noSniper: ['gradino'],
      pickups: [
        { x: 550, y: FLOOR_Y - 25, type: 'heavy', label: 'H' },
        { x: 1050, y: FLOOR_Y - 25, type: 'coffee', label: '☕' },
        { x: 1850, y: 320, type: 'shotgun', label: 'S' },
        { x: 2350, y: FLOOR_Y - 25, type: 'rocket', label: 'R' },
        { x: 2750, y: 250, type: 'laser', label: 'L' },
        { x: 3300, y: FLOOR_Y - 25, type: 'bomb', label: 'BOMBE' },
        { x: 3500, y: FLOOR_Y - 25, type: 'cedolino', label: 'NoiPA' }
      ],
      boss: { x: 4050, w: 220, h: 180, hp: 1600, name: '⚠ FOTOCOPIATRICE INCEPPATA & SUPER-RICORRISTA', draw: drawBossCopier, attack: attackCopier },
      win: {
        title: 'MISSIONE 1 COMPLETA!',
        text: "Sei arrivato all'aula 3 AM... ma l'Algoritmo delle nomine ha annullato la tua presa di servizio. Prossima fermata: l'Ufficio Scolastico di Catania!",
        next: 1
      }
    },
    {
      id: 2, seed: 7, platforms: LEVEL2_PLATFORMS,
      mokeX: 260, arenaX: 3500, target: TOTAL_PRECARI,
      dim: 'rgba(6, 10, 30, 0.4)',
      buildFar: buildFar2, buildMid: buildMid2,
      paintBack: paintBack2, paintFloor: paintFloor2, paintSigns: paintSigns2,
      drawSky: drawSky2, drawFarFx: drawFarFx2, drawWorldFx: drawWorldFx2,
      intro: 'MISSIONE 2: CATANIA',
      runners: [450, 3400, 165, 80], shielders: [900, 3300, 450], noSniper: ['ascensore'],
      pickups: [
        { x: 520, y: FLOOR_Y - 25, type: 'heavy', label: 'H' },
        { x: 1000, y: FLOOR_Y - 25, type: 'arancino', label: '' },
        { x: 1290, y: 300, type: 'shotgun', label: 'S' },
        { x: 2180, y: 310, type: 'laser', label: 'L' },
        { x: 2720, y: FLOOR_Y - 25, type: 'arancino', label: '' },
        { x: 3130, y: 220, type: 'rocket', label: 'R' },
        { x: 3380, y: FLOOR_Y - 25, type: 'bomb', label: 'BOMBE' },
        { x: 3460, y: FLOOR_Y - 25, type: 'cedolino', label: 'NoiPA' }
      ],
      boss: { x: 4080, w: 200, h: 200, hp: 2000, name: "⚠ L'ALGORITMO DELLE NOMINE", draw: drawBossAlgoritmo, attack: attackAlgoritmo },
      win: {
        title: 'MISSION COMPLETE!',
        text: "L'Algoritmo è spento e la nomina è firmata: tutti i 1.100 precari sono stati scalzati. Il posto fisso è tuo!",
        next: null
      }
    }
  ];
  let level = LEVELS[0];
  const layerCache = {};
  function layersOf(lv) {
    if (!layerCache[lv.id]) {
      layerCache[lv.id] = { far: lv.buildFar(), mid: lv.buildMid(), stage: buildStage(lv) };
    }
    return layerCache[lv.id];
  }

  // Weapons Definition
  const WEAPONS = {
    stamp: { name: 'TIMBRO DI RUOLO', ammo: Infinity, delay: 0.16, damage: 25, color: '#ef4444', speed: 820 },
    heavy: { name: 'HEAVY CONCORSO', ammo: 150, delay: 0.08, damage: 32, color: '#facc15', speed: 950 },
    shotgun: { name: 'SHOTGUN FERIE', ammo: 30, delay: 0.55, damage: 85, color: '#ffffff', speed: 750 },
    rocket: { name: 'RICORSO RESPINTO', ammo: 20, delay: 0.38, damage: 130, color: '#fb923c', speed: 580 },
    laser: { name: 'LASER DEL TESTER', ammo: 80, delay: 0.1, damage: 45, color: '#38bdf8', speed: 1100 }
  };

  // Player Object
  const player = {
    x: 100, y: FLOOR_Y, vx: 0, vy: 0,
    w: 36, h: 62,
    dir: 1, // 1: right, -1: left
    aimX: 1, aimY: 0, // Aim vector
    grounded: true,
    crouch: false,
    health: 100, maxHealth: 100,
    weapon: 'stamp',
    ammo: Infinity,
    bombs: 10,
    fireTimer: 0,
    invincibleTimer: 0,
    inVehicle: false,
    onPlat: null,
    phase: 0
  };

  // Moke Slug Vehicle Object
  const moke = {
    x: 1480, y: FLOOR_Y, vx: 0, vy: 0,
    w: 120, h: 64,
    dir: 1,
    aimAngle: 0,
    health: 250, maxHealth: 250,
    active: false,
    occupied: false,
    cannonTimer: 0
  };

  // Boss Object
  const boss = {
    x: 4050, y: FLOOR_Y, // y = base dei cingoli, a terra
    w: 220, h: 180,
    health: 1600, maxHealth: 1600,
    attackTimer: 2,
    state: 'idle',
    phase: 0,
    attackCount: 0,
    defeated: false
  };

  // Arrays for dynamic entities
  let bullets = [];
  let enemyBullets = [];
  let enemies = [];
  let pickups = [];
  let particles = [];
  let floatingTexts = [];

  // Spawn Enemy
  function spawnEnemy(x, type = 'runner') {
    enemies.push({
      x, y: FLOOR_Y, vx: 0, vy: 0,
      w: 34, h: 56,
      type, // 'runner', 'sniper', 'shielder'
      health: type === 'shielder' ? 70 : type === 'sniper' ? 45 : 30,
      maxHealth: type === 'shielder' ? 70 : type === 'sniper' ? 45 : 30,
      dir: -1,
      cooldown: Math.random() * 2,
      phase: Math.random() * 10
    });
  }

  // Populate Stage Enemies
  function initEnemies() {
    enemies = [];
    // Runners
    const [r0, r1, rStep, rJit] = level.runners;
    for (let x = r0; x < r1; x += rStep + Math.random() * rJit) {
      spawnEnemy(x, 'runner');
    }
    // Snipers on platforms
    // y = piedi del nemico, quindi va posato sul piano dell'oggetto
    platforms.forEach(p => {
      if (p.x < level.arenaX && !level.noSniper.includes(p.type)) {
        enemies.push({
          x: p.x + p.w / 2, y: p.y, vx: 0, vy: 0,
          w: 34, h: 56,
          type: 'sniper',
          health: 40, maxHealth: 40,
          dir: -1,
          cooldown: 1 + Math.random() * 2,
          phase: 0
        });
      }
    });
    // Shielders
    const [s0, s1, sStep] = level.shielders;
    for (let x = s0; x < s1; x += sStep) {
      spawnEnemy(x, 'shielder');
    }

    // Pickups scattered
    pickups = level.pickups.map(p => ({ ...p }));
  }

  // Floating text feedback (+500, TIMBRATO!)
  function addText(text, x, y, color = '#facc15') {
    floatingTexts.push({ text, x, y, vy: -50, life: 1, color });
  }

  // Particle Effects
  function addExplosion(x, y, count = 16, isBig = false) {
    audio?.play('explosion');
    screenShake = Math.max(screenShake, isBig ? 14 : 7);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * (isBig ? 320 : 180);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        color: ['#facc15', '#ef4444', '#f97316', '#ffffff'][Math.floor(Math.random() * 4)],
        rad: 3 + Math.random() * (isBig ? 8 : 4),
        type: 'spark'
      });
    }
    // Flying paper sheets
    for (let i = 0; i < (isBig ? 12 : 5); i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 160,
        vy: -80 - Math.random() * 140,
        life: 1.2, maxLife: 1.2,
        rot: Math.random() * 6,
        vrot: (Math.random() - 0.5) * 8,
        w: 10, h: 14,
        color: '#ffffff',
        type: 'paper'
      });
    }
  }

  // Avvio di una missione (carry = si prosegue dalla missione prima con punti e armi)
  function startLevel(idx, carry = false) {
    level = LEVELS[idx];
    platforms = level.platforms;
    platforms.forEach(p => { if (p.moving) { p.y = p.moving.max; p.dir = -1; } });
    layersOf(level);

    player.x = 100; player.y = FLOOR_Y; player.vx = 0; player.vy = 0;
    player.health = player.maxHealth;
    if (!carry) {
      player.weapon = 'stamp';
      player.ammo = Infinity;
      player.bombs = 10;
      score = 0;
    }
    player.inVehicle = false;
    player.onPlat = null;
    player.invincibleTimer = 0;

    moke.x = level.mokeX; moke.y = FLOOR_Y; moke.vx = 0; moke.vy = 0;
    moke.health = moke.maxHealth; moke.occupied = false;

    const bc = level.boss;
    boss.x = bc.x; boss.y = FLOOR_Y; boss.w = bc.w; boss.h = bc.h;
    boss.maxHealth = bc.hp; boss.health = bc.hp;
    boss.attackTimer = 2; boss.attackCount = 0; boss.phase = 0;
    boss.defeated = false;
    boss.announced = false;

    scalzati = idx === 0 ? 0 : LEVELS[idx - 1].target;
    bullets = [];
    enemyBullets = [];
    particles = [];
    floatingTexts = [];
    initEnemies();
    camera.x = 0;
    state = 'playing';
    addText(level.intro, 130, 200, '#d9f482');
    floatingTexts[floatingTexts.length - 1].life = 2.2;

    $('game-over-screen').classList.add('hidden');
    $('victory-screen').classList.add('hidden');
    $('title-screen').classList.add('hidden');

    audio?.announce('start' + level.id);
    audio?.startMusic();
  }

  function showVictory() {
    const win = level.win;
    state = 'victory';
    $('victory-title').textContent = win.title;
    $('victory-text').textContent = win.text;
    $('victory-score').textContent = score.toLocaleString('it-IT');
    $('victory-next-btn').style.display = win.next == null ? 'none' : '';
    $('victory-restart-btn').textContent = win.next == null ? '★ GIOCA ANCORA' : '↺ DALLA MISSIONE 1';
    $('victory-screen').classList.remove('hidden');
  }

  // Input listeners
  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    audio?.arm();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = true;
    if (e.code === 'KeyK' || e.code === 'KeyX' || e.code === 'Space') { input.jump = true; input.jumpPressed = true; }
    if (e.code === 'KeyJ' || e.code === 'KeyZ' || e.code === 'Enter') { input.fire = true; input.firePressed = true; }
    if (e.code === 'KeyL' || e.code === 'KeyC') { input.bomb = true; input.bombPressed = true; }
    if (e.code === 'KeyE') { input.enter = true; input.enterPressed = true; }
    if (e.code === 'KeyP') togglePause();
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = false;
    if (e.code === 'KeyK' || e.code === 'KeyX' || e.code === 'Space') input.jump = false;
    if (e.code === 'KeyJ' || e.code === 'KeyZ' || e.code === 'Enter') input.fire = false;
    if (e.code === 'KeyL' || e.code === 'KeyC') input.bomb = false;
    if (e.code === 'KeyE') input.enter = false;
  });

  // Touch button listeners for mobile
  function bindTouch(id, keyProp) {
    const el = $(id);
    if (!el) return;
    const start = e => {
      e.preventDefault();
      audio?.arm();
      input[keyProp] = true;
      if (keyProp + 'Pressed' in input) input[keyProp + 'Pressed'] = true;
      el.classList.add('pressed');
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    };
    const end = e => {
      e.preventDefault();
      input[keyProp] = false;
      el.classList.remove('pressed');
    };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
  }

  bindTouch('dpad-left', 'left');
  bindTouch('dpad-right', 'right');
  bindTouch('dpad-up', 'up');
  bindTouch('dpad-down', 'down');
  bindTouch('btn-jump', 'jump');
  bindTouch('btn-fire', 'fire');
  bindTouch('btn-bomb', 'bomb');
  bindTouch('btn-moke', 'enter');

  // Gamepad polling
  function pollGamepad() {
    const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
    const tag = $('gamepad-status');
    if (gp) {
      if (tag) {
        tag.textContent = '🎮 Gamepad Connesso';
        tag.classList.add('connected');
      }
      const deadzone = 0.3;
      input.left = gp.axes[0] < -deadzone || gp.buttons[14]?.pressed;
      input.right = gp.axes[0] > deadzone || gp.buttons[15]?.pressed;
      input.up = gp.axes[1] < -deadzone || gp.buttons[12]?.pressed;
      input.down = gp.axes[1] > deadzone || gp.buttons[13]?.pressed;

      const jumpBtn = gp.buttons[0]?.pressed; // A
      if (jumpBtn && !input.jump) input.jumpPressed = true;
      input.jump = jumpBtn;

      const fireBtn = gp.buttons[2]?.pressed; // X
      if (fireBtn && !input.fire) input.firePressed = true;
      input.fire = fireBtn;

      const bombBtn = gp.buttons[1]?.pressed; // B
      if (bombBtn && !input.bomb) input.bombPressed = true;
      input.bomb = bombBtn;

      const enterBtn = gp.buttons[3]?.pressed; // Y
      if (enterBtn && !input.enter) input.enterPressed = true;
      input.enter = enterBtn;
    } else if (tag && tag.classList.contains('connected')) {
      tag.textContent = '🎮 Gamepad: Non rilevato';
      tag.classList.remove('connected');
    }
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      $('pause-btn').textContent = '▶ Riprendi';
    } else if (state === 'paused') {
      state = 'playing';
      $('pause-btn').textContent = 'Pausa';
    }
  }

  // Shoot Weapon
  function playerShoot() {
    const w = WEAPONS[player.weapon];
    if (player.ammo <= 0) {
      player.weapon = 'stamp';
      player.ammo = Infinity;
    }

    let sx = player.x + player.dir * 22;
    let sy = player.y - 32;
    if (player.crouch) sy += 16;

    // Calculate bullet trajectory based on aiming
    let vx = player.dir * w.speed;
    let vy = 0;
    if (input.up) {
      if (input.left || input.right) {
        vx = player.dir * w.speed * 0.707;
        vy = -w.speed * 0.707;
      } else {
        vx = 0;
        vy = -w.speed;
        sx = player.x;
        sy = player.y - 56;
      }
    } else if (input.down && !player.grounded) {
      vx = 0;
      vy = w.speed;
      sx = player.x;
      sy = player.y;
    }

    if (player.weapon === 'shotgun') {
      audio?.play('shotgun');
      screenShake = Math.max(screenShake, 8);
      for (let i = -2; i <= 2; i++) {
        const spreadAngle = Math.atan2(vy, vx) + (i * 0.08);
        bullets.push({
          x: sx, y: sy,
          vx: Math.cos(spreadAngle) * w.speed,
          vy: Math.sin(spreadAngle) * w.speed,
          damage: w.damage,
          color: w.color,
          type: 'shotgun',
          life: 0.35
        });
      }
    } else if (player.weapon === 'rocket') {
      audio?.play('rocket');
      bullets.push({
        x: sx, y: sy,
        vx: vx * 0.5, vy: vy * 0.5,
        targetVx: vx, targetVy: vy,
        damage: w.damage,
        color: w.color,
        type: 'rocket',
        life: 2.2
      });
    } else {
      audio?.play(player.weapon === 'heavy' ? 'heavy' : 'shoot');
      bullets.push({
        x: sx, y: sy,
        vx, vy,
        damage: w.damage,
        color: w.color,
        type: player.weapon,
        life: 1.2
      });
    }

    if (player.ammo !== Infinity) player.ammo--;
  }

  // Moke Vehicle Shooting
  function mokeShoot() {
    audio?.play('heavy');
    screenShake = Math.max(screenShake, 6);
    const sx = moke.x + moke.dir * 45;
    const sy = moke.y - 45;
    bullets.push({
      x: sx, y: sy - 8,
      vx: moke.dir * 1050, vy: -50,
      damage: 42,
      color: '#facc15',
      type: 'heavy',
      life: 1.0
    });
    bullets.push({
      x: sx, y: sy + 8,
      vx: moke.dir * 1050, vy: 50,
      damage: 42,
      color: '#facc15',
      type: 'heavy',
      life: 1.0
    });
  }

  // Throw Decree Bomb
  function throwBomb() {
    if (player.bombs <= 0) return;
    player.bombs--;
    audio?.play('jump');
    bullets.push({
      x: player.x,
      y: player.y - 36,
      vx: player.dir * 280,
      vy: -340,
      damage: 280,
      color: '#ef4444',
      type: 'bomb',
      life: 0.95
    });
  }

  // Update loop
  function update(dt) {
    if (state !== 'playing') return;

    screenShake = Math.max(0, screenShake - dt * 18);

    // Piattaforme mobili (ascensore)
    platforms.forEach(p => {
      if (!p.moving) return;
      p.y += p.moving.speed * p.dir * dt;
      if (p.y < p.moving.min) { p.y = p.moving.min; p.dir = 1; }
      if (p.y > p.moving.max) { p.y = p.moving.max; p.dir = -1; }
    });

    // Moke Vehicle Interaction
    const distToMoke = Math.hypot(player.x - moke.x, player.y - moke.y);
    if (input.enterPressed) {
      if (!player.inVehicle && distToMoke < 85) {
        player.inVehicle = true;
        moke.occupied = true;
        audio?.announce('moke');
        audio?.play('horn');
        addText('MOKE SLUG ATTIVO!', moke.x, moke.y - 80, '#10b981');
      } else if (player.inVehicle) {
        player.inVehicle = false;
        moke.occupied = false;
        player.y = moke.y - 70;
        player.vy = -250;
      }
    }

    if (player.inVehicle) {
      // DRIVE MOKE SLUG
      moke.vx = 0;
      if (input.left) { moke.vx = -240; moke.dir = -1; }
      if (input.right) { moke.vx = 260; moke.dir = 1; }
      if (input.jumpPressed && moke.y >= FLOOR_Y - 2) {
        moke.vy = -420;
        audio?.play('jump');
      }
      moke.vy += 980 * dt;
      moke.x += moke.vx * dt;
      moke.y += moke.vy * dt;
      if (moke.y > FLOOR_Y) { moke.y = FLOOR_Y; moke.vy = 0; }
      moke.x = Math.max(60, Math.min(STAGE_LENGTH - 60, moke.x));

      player.x = moke.x;
      player.y = moke.y - 20;

      // Moke Fire
      moke.cannonTimer -= dt;
      if (input.fire && moke.cannonTimer <= 0) {
        mokeShoot();
        moke.cannonTimer = 0.08;
      }

      // Moke Crushing enemies on ramming
      enemies.forEach(en => {
        if (Math.abs(en.x - moke.x) < 70 && Math.abs(en.y - moke.y) < 50) {
          en.health -= 150;
        }
      });
    } else {
      // ON FOOT PROF. BELLA
      player.vx = 0;
      player.crouch = input.down && player.grounded;

      if (!player.crouch) {
        if (input.left) { player.vx = -210; player.dir = -1; player.phase += dt * 14; }
        if (input.right) { player.vx = 210; player.dir = 1; player.phase += dt * 14; }
      }

      // Jump
      if (input.jumpPressed && player.grounded) {
        player.vy = -480;
        player.grounded = false;
        audio?.play('jump');
      }

      // Chi sta sull'ascensore si muove con lui
      if (player.onPlat && player.onPlat.moving && player.vy >= 0) player.y = player.onPlat.y;

      // Gravity & Move
      player.vy += 1150 * dt;
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Platform Collisions
      player.grounded = false;
      player.onPlat = null;
      if (player.y >= FLOOR_Y) {
        player.y = FLOOR_Y;
        player.vy = 0;
        player.grounded = true;
      } else {
        platforms.forEach(p => {
          if (player.vy >= 0 &&
              player.x + 16 > p.x && player.x - 16 < p.x + p.w &&
              player.y >= p.y && player.y - player.vy * dt <= p.y + 12) {
            player.y = p.y;
            player.vy = 0;
            player.grounded = true;
            player.onPlat = p;
          }
        });
      }
      player.x = Math.max(30, Math.min(STAGE_LENGTH - 30, player.x));

      // Shooting
      player.fireTimer -= dt;
      if (input.fire && player.fireTimer <= 0) {
        playerShoot();
        player.fireTimer = WEAPONS[player.weapon].delay;
      }

      // Bomb Throw
      if (input.bombPressed) {
        throwBomb();
      }
    }

    // Reset single frame presses
    input.jumpPressed = false;
    input.firePressed = false;
    input.bombPressed = false;
    input.enterPressed = false;

    // Camera follow player smoothly
    const targetCamX = player.x - W * 0.38;
    camera.x = Math.max(0, Math.min(STAGE_LENGTH - W, targetCamX));

    // Update Player Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt;
      if (b.type === 'bomb') {
        b.vy += 700 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y >= FLOOR_Y) {
          b.life = 0;
          addExplosion(b.x, b.y, 28, true);
          // Area of effect damage
          enemies.forEach(en => {
            if (Math.hypot(en.x - b.x, en.y - b.y) < 140) {
              en.health -= b.damage;
            }
          });
          if (Math.hypot(boss.x - b.x, boss.y - boss.h / 2 - b.y) < 180) boss.health -= b.damage;
        }
      } else if (b.type === 'rocket') {
        b.vx += (b.targetVx - b.vx) * 4 * dt;
        b.vy += (b.targetVy - b.vy) * 4 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        // Smoke puff
        if (Math.random() < 0.4) {
          particles.push({
            x: b.x, y: b.y, vx: -b.vx * 0.1, vy: -20, life: 0.3, maxLife: 0.3, color: '#94a3b8', rad: 4, type: 'smoke'
          });
        }
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }

      // Bullet hit enemy
      enemies.forEach(en => {
        if (Math.abs(b.x - en.x) < en.w / 2 + 10 && Math.abs(b.y - (en.y - en.h / 2)) < en.h / 2) {
          if (en.type === 'shielder' && (b.vx > 0 && en.dir < 0) && b.type !== 'bomb') {
            // Blocked by shield!
            b.life = 0;
            audio?.play('hit');
            addText('BLOCCATO AL TAR!', en.x, en.y - 65, '#94a3b8');
          } else {
            en.health -= b.damage;
            b.life = 0;
            audio?.play('hit');
            particles.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 80, vy: -50, life: 0.2, maxLife: 0.2, color: '#ef4444', rad: 3, type: 'spark' });
          }
        }
      });

      // Bullet hit boss
      if (!boss.defeated && Math.abs(b.x - boss.x) < boss.w / 2 && Math.abs(b.y - (boss.y - boss.h / 2)) < boss.h / 2) {
        boss.health -= b.damage;
        b.life = 0;
        audio?.play('hit');
      }

      if (b.life <= 0) bullets.splice(i, 1);
    }

    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const en = enemies[i];
      en.phase += dt * 8;
      const distToPlayer = player.x - en.x;
      en.dir = distToPlayer > 0 ? 1 : -1;

      if (en.type === 'runner') {
        // Run towards player
        en.vx = en.dir * 125;
        en.x += en.vx * dt;
        // Melee attack if close
        if (Math.abs(distToPlayer) < 32 && Math.abs(player.y - en.y) < 40) {
          if (player.invincibleTimer <= 0) {
            player.health -= 18;
            player.invincibleTimer = 1.0;
            audio?.play('hit');
            addText('-18 TRANQUILLITÀ', player.x, player.y - 70, '#ef4444');
            audio?.announce('hit');
          }
        }
      } else if (en.type === 'sniper') {
        en.cooldown -= dt;
        if (en.cooldown <= 0 && Math.abs(distToPlayer) < 650) {
          en.cooldown = 2.2 + Math.random();
          // Throw paper airplane / preference sheet
          enemyBullets.push({
            x: en.x, y: en.y - 28,
            vx: en.dir * 280, vy: -110,
            life: 2.2
          });
          audio?.play('shoot');
        }
      }

      // Check Enemy Death
      if (en.health <= 0) {
        addExplosion(en.x, en.y - 28, 12);
        score += en.type === 'shielder' ? 300 : en.type === 'sniper' ? 200 : 100;
        scalzati++;
        addText('+ ' + (en.type === 'shielder' ? 'RICORSO RESPINTO!' : 'SCALZATO!'), en.x, en.y - 50, '#d9f482');
        enemies.splice(i, 1);
      }
    }

    // Update Enemy Bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const eb = enemyBullets[i];
      eb.vy += 120 * dt;
      eb.x += eb.vx * dt;
      eb.y += eb.vy * dt;
      eb.life -= dt;
      if (eb.rot !== undefined) eb.rot += dt * 3;
      if (eb.y > FLOOR_Y + 6) eb.life = 0;

      // Hit player
      if (Math.hypot(eb.x - player.x, eb.y - (player.y - 30)) < 30) {
        if (!player.inVehicle && player.invincibleTimer <= 0) {
          player.health -= 15;
          player.invincibleTimer = 1.0;
          audio?.play('hit');
          addText('-15 PUNTI', player.x, player.y - 65, '#ef4444');
          audio?.announce('hit');
        }
        eb.life = 0;
      }
      if (eb.life <= 0) enemyBullets.splice(i, 1);
    }

    // Update Boss Fight
    if (player.x > level.arenaX - 150 && !boss.defeated) {
      if (!boss.announced) { boss.announced = true; audio?.announce('boss' + level.id); }
      boss.phase += dt * 3;
      boss.attackTimer -= dt;
      if (boss.attackTimer <= 0) level.boss.attack();

      if (boss.health <= 0) {
        boss.defeated = true;
        addExplosion(boss.x, boss.y - boss.h / 2, 48, true);
        score += 5000;
        scalzati = level.target;
        audio?.announce('complete' + level.id);
        setTimeout(showVictory, 1800);
      }
    }

    // Pickups Interaction
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      if (Math.hypot(player.x - p.x, (player.y - 30) - p.y) < 45) {
        audio?.play('pickup');
        if (p.type === 'coffee' || p.type === 'arancino') {
          player.health = Math.min(player.maxHealth, player.health + 30);
          score += 500;
          addText(p.type === 'arancino' ? 'ARANCINO! +30 TRANQUILLITÀ' : '+30 TRANQUILLITÀ ☕', player.x, player.y - 70, '#d9f482');
          audio?.announce(p.type);
        } else if (p.type === 'cedolino') {
          score += 2000;
          addText('STIPENDIO ACCREDITATO! +2000', player.x, player.y - 70, '#facc15');
          audio?.announce('cedolino');
        } else if (p.type === 'bomb') {
          player.bombs += 5;
          addText('+5 DECRETI ESCLUSIONE', player.x, player.y - 70, '#ef4444');
          audio?.announce('bomb');
        } else {
          player.weapon = p.type;
          player.ammo = WEAPONS[p.type].ammo;
          audio?.announce(p.type);
          addText(WEAPONS[p.type].name + '!', player.x, player.y - 70, '#facc15');
        }
        pickups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.type === 'paper') {
        pt.rot += pt.vrot * dt;
        pt.vy += 70 * dt;
      }
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // Floating text updates
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Invincibility countdown
    if (player.invincibleTimer > 0) player.invincibleTimer -= dt;

    // Check Player Death
    if (player.health <= 0) {
      state = 'gameover';
      audio?.announce('gameover');
      $('gameover-score').textContent = score.toLocaleString('it-IT');
      $('game-over-screen').classList.remove('hidden');
    }

    // Update HTML HUD
    $('hud-score').textContent = score.toLocaleString('it-IT');
    $('hud-health').style.width = Math.max(0, player.health) + '%';
    $('hud-weapon').textContent = WEAPONS[player.weapon].name;
    $('hud-ammo').textContent = player.ammo === Infinity ? '∞' : player.ammo;
    $('hud-bombs').textContent = player.bombs;
    $('hud-scalzati').textContent = Math.min(TOTAL_PRECARI, scalzati) + ' / ' + TOTAL_PRECARI;
  }

  // Draw Parallax & Stage
  function draw() {
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Apply Screen Shake
    if (screenShake > 0) {
      const dx = (Math.random() - 0.5) * screenShake;
      const dy = (Math.random() - 0.5) * screenShake;
      ctx.translate(dx, dy);
    }

    // 1. CIELO del livello
    const L = layersOf(level);
    level.drawSky(ctx);

    // 2. STRATO LONTANO (Etna)
    const farX = -camera.x * FAR_F;
    ctx.drawImage(L.far, Math.round(farX), 0);
    level.drawFarFx(ctx, farX);

    // 3. STRATO MEDIO (la citta')
    ctx.drawImage(L.mid, Math.round(-camera.x * MID_F), 0);

    // 4. MAIN ACTION LAYER (Camera space)
    ctx.save();
    ctx.translate(-camera.x, 0);

    // Scenografia del livello (pre-renderizzata), con margine per lo scuotimento
    const sx0 = Math.max(0, Math.floor(camera.x) - 20);
    const sw = Math.min(STAGE_LENGTH - sx0, W + 40);
    ctx.drawImage(L.stage, sx0, 0, sw, H, sx0, 0, sw, H);
    level.drawWorldFx(ctx);
    platforms.forEach(p => { if (p.moving) PLATFORM_DRAW[p.type](ctx, p); });

    // Draw Pickups (Using items-sheet.png)
    pickups.forEach(p => {
      const bob = Math.sin(Date.now() * 0.007 + p.x) * 5;
      const py = p.y + bob;

      // Golden pulsing glow
      ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.beginPath();
      ctx.arc(p.x, py, 22, 0, Math.PI * 2);
      ctx.fill();

      if (p.type === 'arancino') {
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(p.x, py - 18);
        ctx.quadraticCurveTo(p.x + 17, py + 4, p.x, py + 14);
        ctx.quadraticCurveTo(p.x - 17, py + 4, p.x, py - 18);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        for (let k = 0; k < 6; k++) ctx.fillRect(p.x - 8 + (k % 3) * 6, py - 4 + Math.floor(k / 3) * 7, 2, 2);
        return;
      }
      let itemIndex = 0;
      if (p.type === 'heavy') itemIndex = 0;
      else if (p.type === 'shotgun') itemIndex = 1;
      else if (p.type === 'rocket') itemIndex = 2;
      else if (p.type === 'laser') itemIndex = 3;
      else if (p.type === 'cedolino') itemIndex = 4;
      else if (p.type === 'coffee') itemIndex = 5;

      if (sprites.items.complete && sprites.items.naturalWidth > 0) {
        ctx.drawImage(sprites.items, itemIndex * 36, 0, 36, 36, p.x - 18, py - 18, 36, 36);
      } else {
        // Fallback
        ctx.fillStyle = p.type === 'coffee' ? '#78350f' : p.type === 'cedolino' ? '#047857' : '#d97706';
        ctx.fillRect(p.x - 16, py - 16, 32, 28);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 16, py - 16, 32, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x, py + 3);
        ctx.textAlign = 'left';
      }
    });

    // Draw Moke Slug Vehicle (Using moke-slug.png)
    if (!moke.occupied) {
      // Prompt banner above Moke
      ctx.fillStyle = '#d9f482';
      ctx.font = '900 12px ui-monospace, monospace';
      ctx.fillText('▼ PREMI [E] PER SALIRE SULLA MOKE SLUG', moke.x - 110, moke.y - 88);
    }

    ctx.save();
    ctx.translate(moke.x, moke.y);
    ctx.scale(moke.dir, 1);

    // Ground Shadow under Moke
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 58, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (sprites.moke.complete && sprites.moke.naturalWidth > 0) {
      // Determine Moke frame: 0: normal, 1: firing, 2: ramming, 3: damaged
      let mokeFrame = 0;
      if (moke.health < 40) mokeFrame = 3;
      else if (Math.abs(moke.vx) > 260) mokeFrame = 2;
      else if (moke.occupied && input.fire) mokeFrame = 1;

      ctx.drawImage(sprites.moke, mokeFrame * 160, 0, 160, 96, -74, -82, 148, 88);
    } else {
      // Procedural Fallback
      ctx.fillStyle = '#065f46';
      ctx.fillRect(-55, -45, 110, 38);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(-25, -70, 60, 28);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(15, -64, 45, 8);
      ctx.fillRect(15, -52, 45, 8);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-35, -4, 16, 0, Math.PI * 2);
      ctx.arc(35, -4, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw Enemies (Precari using precari-sheet.png)
    enemies.forEach(en => {
      ctx.save();
      ctx.translate(en.x, en.y);
      ctx.scale(en.dir, 1);

      // Shadow under enemy feet
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (sprites.precari.complete && sprites.precari.naturalWidth > 0) {
        // Archetype row: Runner=0, Sniper=1, Shielder=2
        const row = en.type === 'runner' ? 0 : en.type === 'sniper' ? 1 : 2;
        let col = 0;
        if (en.type === 'runner') {
          col = Math.floor(en.phase) % 4;
        } else if (en.type === 'sniper') {
          col = (en.shootTimer < 0.25 ? 2 : 0) + (Math.floor(en.phase) % 2);
        } else { // shielder
          col = Math.floor(en.phase) % 4;
        }
        ctx.drawImage(sprites.precari, col * 64, row * 64, 64, 64, -30, -58, 60, 60);
      } else {
        // Fallback
        const stride = Math.sin(en.phase) * 6;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-4, -12); ctx.lineTo(-6 - stride, 0);
        ctx.moveTo(4, -12); ctx.lineTo(6 + stride, 0);
        ctx.stroke();
        ctx.fillStyle = en.type === 'shielder' ? '#1e3a5f' : en.type === 'sniper' ? '#7c2d12' : '#be185d';
        ctx.fillRect(-10, -42, 20, 30);
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(0, -48, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw Boss (La Fotocopiatrice & Il Super-Ricorrista using boss-copier.png)
    if (!boss.defeated) {
      ctx.save();
      ctx.translate(boss.x, boss.y);

      // Boss Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 95, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      level.boss.draw(ctx);

      // Boss HP Bar with Arcade Metal Frame
      const hpRatio = Math.max(0, boss.health / boss.maxHealth);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-112, -boss.h - 22, 224, 18);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(-112, -boss.h - 22, 224, 18);
      // Red fill
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-110, -boss.h - 20, 220 * hpRatio, 14);
      // Boss Name Plaque
      ctx.fillStyle = '#fde047';
      ctx.font = '900 11px ui-monospace, monospace';
      ctx.fillText(level.boss.name, -105, -boss.h - 27);

      ctx.restore();
    }

    // Draw Player (Prof. Bella using prof-sheet.png from Blender 3D)
    if (!player.inVehicle) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.dir, 1);

      // Flash when invincible
      const isVisible = player.invincibleTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0;

      if (isVisible) {
        // Ground Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (sprites.prof.complete && sprites.prof.naturalWidth > 0) {
          let col = 0, row = 0;
          if (player.grounded) {
            if (Math.abs(player.vx) > 10) {
              // Run cycle (Row 0, cols 0-7)
              row = 0;
              col = Math.floor(player.phase) % 8;
            } else {
              // Idle / Shooting
              row = 1;
              if (player.fireTimer > 0.04) {
                col = 7; // Muzzle flash
              } else {
                col = Math.floor(Date.now() / 250) % 4; // Idle 0-3
              }
            }
          } else {
            // Jump in air
            row = 1;
            col = player.vy < 0 ? 4 : 5; // Jump Up or Jump Down
          }

          // Draw 128x128 sprite centered over player feet
          ctx.drawImage(sprites.prof, col * 128, row * 128, 128, 128, -42, -74, 84, 84);
        } else {
          // Fallback
          const stride = player.crouch ? 0 : Math.sin(player.phase) * 6;
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(-4, -14); ctx.lineTo(-6 - stride, 0);
          ctx.moveTo(4, -14); ctx.lineTo(6 + stride, 0);
          ctx.stroke();
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(-12, -46, 24, 32);
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -58, 11, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Dynamic Bullets & Explosions (Additive Lighting)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Player Bullets
    bullets.forEach(b => {
      ctx.fillStyle = b.color;
      if (b.type === 'bomb') {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.stroke();
      } else if (b.type === 'rocket') {
        ctx.fillRect(b.x - 14, b.y - 6, 28, 12);
        // Rocket exhaust plume
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(b.x - 22, b.y - 3, 8, 6);
      } else if (b.type === 'laser') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(b.x - 24, b.y - 4, 48, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x - 18, b.y - 2, 36, 4);
      } else {
        // Heavy Machine Gun / Timbro bullet with arcade glow
        ctx.fillRect(b.x - 8, b.y - 4, 16, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x - 4, b.y - 2, 8, 4);
      }
    });

    // Enemy Paper Bullets
    enemyBullets.forEach(eb => {
      if (eb.kind === 'sheet') {
        ctx.save();
        ctx.translate(eb.x, eb.y);
        ctx.rotate(Math.sin(eb.rot) * 0.6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-11, -14, 22, 28);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-6, 4, 12, 6);
        ctx.restore();
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(eb.x - 10, eb.y);
      ctx.lineTo(eb.x + 10, eb.y - 5);
      ctx.lineTo(eb.x + 10, eb.y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(eb.x - 2, eb.y - 2, 6, 4); // Red official stamp
    });

    ctx.restore(); // Exit lighter mode

    // Draw Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      if (p.type === 'paper') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Floating Texts
    floatingTexts.forEach(ft => {
      ctx.fillStyle = ft.color;
      ctx.font = '900 14px ui-monospace, monospace';
      ctx.fillText(ft.text, ft.x, ft.y);
    });

    ctx.restore(); // Exit camera space

    // 5. STAGE BOUNDARY WARNING OR GO ARROW
    if (state === 'playing' && Math.floor(Date.now() / 300) % 2 === 0) {
      if (enemies.length === 0 && player.x < level.arenaX) {
        ctx.fillStyle = '#d9f482';
        ctx.font = '900 24px ui-monospace, monospace';
        ctx.fillText('AVANTI! ▶▶', W - 180, 140);
      }
    }

    ctx.restore(); // Exit screen shake
  }

  // Animation Loop
  let lastTime = performance.now();
  function gameLoop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    pollGamepad();
    if (!pausedByRotation()) update(dt);
    draw();

    requestAnimationFrame(gameLoop);
  }

  // ---------- Schermo intero in orizzontale ----------
  const playArea = $('play-area');
  const portrait = window.matchMedia('(orientation: portrait)');
  let fsActive = false;
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  function fsUi(on) {
    fsActive = on;
    playArea?.classList.toggle('is-fs', on);
    document.body.classList.toggle('fs-lock', on);
    $('fs-btn').textContent = on ? '⛶ Esci da schermo intero' : '⛶ Schermo intero';
  }
  function enterFullscreen() {
    if (fsActive || !playArea) return;
    fsUi(true);
    // dove l'API c'e' (Android, PC, iPad) si va a pieno schermo e si blocca l'orizzontale;
    // sull'iPhone resta il pieno schermo della pagina e l'invito a girare il telefono
    const req = playArea.requestFullscreen || playArea.webkitRequestFullscreen;
    if (!req) return;
    try {
      Promise.resolve(req.call(playArea, { navigationUI: 'hide' }))
        .then(() => screen.orientation?.lock?.('landscape'))
        .catch(() => {});
    } catch (_) {}
  }
  function exitFullscreen() {
    fsUi(false);
    try { screen.orientation?.unlock?.(); } catch (_) {}
    if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => {
    if (!fsElement() && fsActive) fsUi(false);
  }));
  const pausedByRotation = () => fsActive && portrait.matches;

  // Setup Button Events
  $('start-btn')?.addEventListener('click', () => { audio?.arm(); enterFullscreen(); startLevel(0); });
  $('start2-btn')?.addEventListener('click', () => { audio?.arm(); enterFullscreen(); startLevel(1); });
  $('restart-btn')?.addEventListener('click', () => { audio?.arm(); enterFullscreen(); startLevel(LEVELS.indexOf(level)); });
  $('victory-next-btn')?.addEventListener('click', () => { audio?.arm(); enterFullscreen(); startLevel(level.win.next, true); });
  $('victory-restart-btn')?.addEventListener('click', () => { audio?.arm(); enterFullscreen(); startLevel(0); });
  $('fs-btn')?.addEventListener('click', () => (fsActive ? exitFullscreen() : enterFullscreen()));
  $('fs-exit')?.addEventListener('click', exitFullscreen);
  $('pause-btn')?.addEventListener('click', togglePause);

  $('sound-btn')?.addEventListener('click', () => {
    const isMuted = audio?.toggleMute();
    $('sound-btn').textContent = isMuted ? '♫ Suoni: Spenti' : '♫ Suoni: Attivi';
  });

  $('crt-btn')?.addEventListener('click', () => {
    $('crt-overlay').classList.toggle('crt-active');
    const on = $('crt-overlay').classList.contains('crt-active');
    $('crt-btn').textContent = on ? '📺 CRT: Attivo' : '📺 CRT: Spento';
  });

  // Start loop on initial state; la Missione 2 si prepara in sottofondo
  requestAnimationFrame(gameLoop);
  setTimeout(() => layersOf(LEVELS[1]), 1200);
})();

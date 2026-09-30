/*
 * Puzzle del Meucci: pezzi a incastro disegnati su canvas, trascinabili col dito o col mouse.
 * Le posizioni sono in pixel dell'immagine (1200 × 900) rispetto all'angolo della tavola,
 * così girando il telefono tutto si riadatta senza perdere i pezzi già messi.
 */
(function () {
  "use strict";

  const IMG_W = 1200, IMG_H = 900;
  const tavolo = document.getElementById("tavolo");
  const tavola = document.getElementById("tavola");
  const ui = {
    stato: document.getElementById("stato"),
    tempo: document.getElementById("tempo"),
    posati: document.getElementById("posati"),
    esito: document.getElementById("esito"),
    testo: document.getElementById("esito-testo"),
    sbirciata: document.getElementById("sbirciata"),
  };

  const img = new Image();
  img.src = "img/puzzle.jpg?v=1";

  let cols = 4, rows = 3, pw, ph, S, pad;
  let pezzi = [], z = 10, inizio = 0, fine = 0, timer = 0;
  let sc = 1, bx = 0, by = 0, zona = null;

  /* ---------- forma dei pezzi ---------- */

  // Profilo della linguetta lungo un lato: [lungo il lato (0..1), verso l'esterno (× S)]
  const PROFILO = [
    ["L", 0.34, 0],
    ["C", 0.40, 0.00, 0.42, 0.06, 0.39, 0.11],
    ["C", 0.35, 0.18, 0.40, 0.25, 0.50, 0.25],
    ["C", 0.60, 0.25, 0.65, 0.18, 0.61, 0.11],
    ["C", 0.58, 0.06, 0.60, 0.00, 0.66, 0.00],
    ["L", 1, 0],
  ];

  function lato(q, x0, y0, x1, y1, segno) {
    const dx = x1 - x0, dy = y1 - y0;
    const nx = dy === 0 ? 0 : Math.sign(dy), ny = dx === 0 ? 0 : -Math.sign(dx); // normale esterna
    const P = (t, h) => [x0 + dx * t + nx * h * S * segno, y0 + dy * t + ny * h * S * segno];
    if (!segno) { q.lineTo(x1, y1); return; }
    for (const p of PROFILO) {
      if (p[0] === "L") q.lineTo(...P(p[1], p[2]));
      else q.bezierCurveTo(...P(p[1], p[2]), ...P(p[3], p[4]), ...P(p[5], p[6]));
    }
  }

  function tracciato(q, p) {
    q.beginPath();
    q.moveTo(0, 0);
    lato(q, 0, 0, pw, 0, p.lati[0]);
    lato(q, pw, 0, pw, ph, p.lati[1]);
    lato(q, pw, ph, 0, ph, p.lati[2]);
    lato(q, 0, ph, 0, 0, p.lati[3]);
    q.closePath();
  }

  function disegnaPezzo(p) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const k = sc * dpr;
    const cv = p.el;
    cv.width = Math.ceil((pw + 2 * pad) * k);
    cv.height = Math.ceil((ph + 2 * pad) * k);
    cv.style.width = (pw + 2 * pad) * sc + "px";
    cv.style.height = (ph + 2 * pad) * sc + "px";
    const q = cv.getContext("2d");
    q.setTransform(k, 0, 0, k, pad * k, pad * k);
    tracciato(q, p);
    q.save();
    q.clip();
    q.drawImage(img, -p.c * pw, -p.r * ph);
    q.restore();
    // bordo in rilievo: luce in alto a sinistra, ombra in basso a destra
    q.lineWidth = 2.2 / sc;
    q.strokeStyle = "rgb(0 0 0 / 35%)";
    q.save(); q.translate(0.8 / sc, 0.8 / sc); tracciato(q, p); q.stroke(); q.restore();
    q.strokeStyle = "rgb(255 255 255 / 45%)";
    q.lineWidth = 1.2 / sc;
    tracciato(q, p); q.stroke();
  }

  /* ---------- partita ---------- */

  function nuovaPartita(griglia) {
    [cols, rows] = griglia.split("x").map(Number);
    pw = IMG_W / cols; ph = IMG_H / rows; S = Math.min(pw, ph); pad = 0.28 * S;
    document.querySelectorAll("[data-griglia]").forEach((b) => b.classList.toggle("attiva", b.dataset.griglia === griglia));
    try { localStorage.setItem("meucci-puzzle-griglia", griglia); } catch (e) { /* facoltativo */ }

    const oriz = [], vert = [];
    const moneta = () => (Math.random() < 0.5 ? 1 : -1);
    for (let r = 0; r < rows; r++) { oriz.push([]); vert.push([]); for (let c = 0; c < cols; c++) { oriz[r].push(moneta()); vert[r].push(moneta()); } }

    pezzi.forEach((p) => p.el.remove());
    pezzi = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lati = [
          r === 0 ? 0 : -oriz[r][c],        // sopra
          c === cols - 1 ? 0 : vert[r][c + 1], // destra
          r === rows - 1 ? 0 : oriz[r + 1][c], // sotto
          c === 0 ? 0 : -vert[r][c],        // sinistra
        ];
        const el = document.createElement("canvas");
        el.className = "pezzo";
        el.dataset.r = r;
        el.dataset.c = c;
        tavolo.appendChild(el);
        pezzi.push({ r, c, lati, el, x: 0, y: 0, posato: false });
      }
    }
    inizio = 0; fine = 0;
    ui.esito.hidden = true;
    ui.stato.textContent = cols * rows + " pezzi";
    impagina(true);
    aggiorna();
  }

  /* ---------- impaginazione ---------- */

  function impagina(mescola) {
    const r = tavolo.getBoundingClientRect();
    const w = r.width, h = r.height, m = 12;
    const verticale = h > w * 1.05;
    let bw;
    if (verticale) bw = Math.min(w - 2 * m, (h * 0.5) * IMG_W / IMG_H);
    else bw = Math.min((w * 0.6) - m, (h - 2 * m) * IMG_W / IMG_H);
    sc = bw / IMG_W;
    const bh = IMG_H * sc;
    bx = verticale ? (w - bw) / 2 : m;
    by = m;
    Object.assign(tavola.style, { left: bx + "px", top: by + "px", width: bw + "px", height: bh + "px" });
    Object.assign(ui.sbirciata.style, { left: bx + "px", top: by + "px", width: bw + "px", height: bh + "px" });
    // zona dove sparpagliare i pezzi, in pixel dell'immagine rispetto alla tavola
    zona = verticale
      ? { x0: -bx / sc, x1: (w - bx) / sc, y0: IMG_H + m / sc, y1: (h - by) / sc }
      : { x0: IMG_W + m / sc, x1: (w - bx) / sc, y0: -by / sc, y1: (h - by) / sc };
    pezzi.forEach((p) => {
      disegnaPezzo(p);
      if (p.posato) { p.x = p.c * pw; p.y = p.r * ph; }
      else if (mescola || fuori(p)) sparpaglia(p);
      posiziona(p);
    });
  }

  function sparpaglia(p) {
    const lw = pw + 2 * pad, lh = ph + 2 * pad;
    const xmin = zona.x0 + pad, xmax = Math.max(xmin, zona.x1 - lw + pad);
    const ymin = zona.y0 + pad, ymax = Math.max(ymin, zona.y1 - lh + pad);
    p.x = xmin + Math.random() * (xmax - xmin);
    p.y = ymin + Math.random() * (ymax - ymin);
    p.el.style.zIndex = ++z;
  }

  function fuori(p) {
    const r = tavolo.getBoundingClientRect();
    const sx = bx + p.x * sc, sy = by + p.y * sc;
    return sx < -pw * sc * 0.5 || sy < -ph * sc * 0.5 || sx > r.width - pw * sc * 0.5 || sy > r.height - ph * sc * 0.5;
  }

  function posiziona(p) {
    p.el.style.transform = `translate(${bx + (p.x - pad) * sc}px, ${by + (p.y - pad) * sc}px)`;
    p.el.classList.toggle("posato", p.posato);
  }

  /* ---------- trascinamento ---------- */

  let presa = null;

  function pezzoSotto(cx, cy) {
    const r = tavolo.getBoundingClientRect();
    const x = cx - r.left, y = cy - r.top;
    const liberi = pezzi.filter((p) => !p.posato).sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex));
    for (const p of liberi) {
      const lx = x - (bx + (p.x - pad) * sc), ly = y - (by + (p.y - pad) * sc);
      if (lx < 0 || ly < 0 || lx >= (pw + 2 * pad) * sc || ly >= (ph + 2 * pad) * sc) continue;
      const k = p.el.width / ((pw + 2 * pad) * sc);
      const a = p.el.getContext("2d").getImageData(Math.floor(lx * k), Math.floor(ly * k), 1, 1).data[3];
      if (a > 20) return { p, dx: x / sc - p.x, dy: y / sc - p.y };
    }
    return null;
  }

  tavolo.addEventListener("pointerdown", (e) => {
    if (!ui.esito.hidden) return;
    const trovato = pezzoSotto(e.clientX, e.clientY);
    if (!trovato) return;
    e.preventDefault();
    presa = trovato;
    presa.p.el.style.zIndex = ++z;
    presa.p.el.classList.add("preso");
    tavolo.setPointerCapture(e.pointerId);
    if (!inizio) inizio = performance.now();
  });

  tavolo.addEventListener("pointermove", (e) => {
    if (!presa) return;
    const r = tavolo.getBoundingClientRect();
    presa.p.x = (e.clientX - r.left) / sc - presa.dx;
    presa.p.y = (e.clientY - r.top) / sc - presa.dy;
    posiziona(presa.p);
  });

  function lascia() {
    if (!presa) return;
    const p = presa.p;
    p.el.classList.remove("preso");
    const tx = p.c * pw, ty = p.r * ph;
    if (Math.hypot(p.x - tx, p.y - ty) < 0.24 * S) {
      p.x = tx; p.y = ty; p.posato = true;
      p.el.style.zIndex = 1;
      p.el.classList.add("scatto");
      setTimeout(() => p.el.classList.remove("scatto"), 300);
      try { navigator.vibrate && navigator.vibrate(15); } catch (e) { /* facoltativo */ }
    }
    posiziona(p);
    presa = null;
    aggiorna();
    if (pezzi.every((q) => q.posato)) completato();
  }
  tavolo.addEventListener("pointerup", lascia);
  tavolo.addEventListener("pointercancel", lascia);

  /* ---------- tempo e fine ---------- */

  function mmss(ms) {
    const s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function aggiorna() {
    const n = pezzi.filter((p) => p.posato).length;
    ui.posati.textContent = n + "/" + pezzi.length;
    ui.tempo.textContent = mmss(inizio ? (fine || performance.now()) - inizio : 0);
  }

  function completato() {
    fine = performance.now();
    const ms = fine - inizio;
    const chiave = "meucci-puzzle-record-" + cols + "x" + rows;
    let record = null;
    try { record = Number(localStorage.getItem(chiave)) || null; } catch (e) { /* facoltativo */ }
    const nuovo = !record || ms < record;
    if (nuovo) try { localStorage.setItem(chiave, Math.round(ms)); } catch (e) { /* facoltativo */ }
    ui.testo.textContent = pezzi.length + " pezzi in " + mmss(ms) + "." + (nuovo ? (record ? " Nuovo record!" : "") : " Il tuo record è " + mmss(record) + ".");
    setTimeout(() => { ui.esito.hidden = false; }, 450);
  }

  /* ---------- comandi ---------- */

  document.querySelectorAll("[data-griglia]").forEach((b) => b.addEventListener("click", () => nuovaPartita(b.dataset.griglia)));
  document.getElementById("ancora").addEventListener("click", () => nuovaPartita(cols + "x" + rows));
  document.getElementById("guarda").addEventListener("click", () => { ui.esito.hidden = true; });
  const sbircia = document.getElementById("sbircia");
  const mostra = (s) => { ui.sbirciata.hidden = !s; sbircia.classList.toggle("attiva", s); };
  sbircia.addEventListener("pointerdown", () => mostra(true));
  ["pointerup", "pointerleave", "pointercancel"].forEach((t) => sbircia.addEventListener(t, () => mostra(false)));

  let attesa = 0;
  window.addEventListener("resize", () => { clearTimeout(attesa); attesa = setTimeout(() => impagina(false), 120); });
  setInterval(aggiorna, 500);

  function parti() {
    let g = "4x3";
    try { g = localStorage.getItem("meucci-puzzle-griglia") || g; } catch (e) { /* facoltativo */ }
    nuovaPartita(/^\d+x\d+$/.test(g) ? g : "4x3");
  }
  if (img.complete && img.naturalWidth) parti(); else img.addEventListener("load", parti);
})();

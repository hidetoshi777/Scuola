/*
 * Parcheggia la Moke nel posto riservato del plesso Meucci, sulla vista isometrica del widget.
 *
 * Il piazzale ha coordinate a terra in metri: u lungo la facciata (verso destra), v verso chi guarda.
 * Il righello sono le strisce gialle dell'immagine: da lì escono i due vettori che portano un punto
 * a terra sui pixel del disegno (A per un metro lungo u, B per un metro lungo v). L'altezza sale di
 * ALTEZZA_PX pixel al metro. La Moke e le auto sono modellini 3D proiettati allo stesso modo:
 * così restano coerenti con la scena in qualunque direzione girino.
 */
(function () {
  "use strict";

  const O = [495, 444];                   // angolo delle strisce gialle vicino alla scuola (u=0, v=0)
  const A = [23.5577, 3.5577];            // pixel per metro lungo u
  const B = [-12.5, 8.4];                 // pixel per metro lungo v
  const ALTEZZA_PX = 30;                  // pixel per metro in altezza
  const IMG_W = 1100, IMG_H = 619;

  const LUNG = 3.1, LARG = 1.55;          // la Moke
  const PASSO = 2.05, STERZO_MAX = 0.62, V_AVANTI = 3.0, V_RETRO = 1.7;

  const cv = document.getElementById("piazzale");
  const g = cv.getContext("2d");
  const ui = {
    livello: document.getElementById("livello-nome"),
    tempo: document.getElementById("tempo"),
    urti: document.getElementById("urti"),
    suggerimento: document.getElementById("suggerimento"),
    esito: document.getElementById("esito"),
    stelle: document.getElementById("esito-stelle"),
    titolo: document.getElementById("esito-titolo"),
    testo: document.getElementById("esito-testo"),
    riprova: document.getElementById("riprova"),
    prossimo: document.getElementById("prossimo"),
  };

  const scena = new Image();
  scena.src = "../professionale/admin/img/meucci-isometrica.png?v=2";

  /* ---------- il piazzale (metri a terra) ---------- */

  // Bordo percorribile: base dell'ala, marciapiede d'ingresso, aiuola a destra, cordolo davanti
  const BORDO = [[-2.8, -0.2], [-1.64, -1.09], [9.2, -3.06], [17.35, -4.49], [17.8, -3.25], [18.54, 2.15], [18.71, 4.46], [-1.82, 16.0], [-2.58, 15.14]];
  const DIPINTE = [[10.2, -3.9, 13.1, 1.6], [14.1, -4.3, 16.9, 1.8]];     // le due auto del disegno
  const PALETTI = [{ u: 8.13, v: 3.52, img: [642.5, 502.5, 457] }, { u: 10.55, v: 3.69, img: [697.5, 512.5, 463] }];
  const POSTI = [[0.05, 0.05, 2.65, 5.15], [2.75, 0.05, 5.15, 5.15]];    // le due metà gialle

  const LIVELLI = [
    {
      nome: "Livello 1 · Il posto è libero",
      obiettivo: 0, retro: false, extra: [],
      partenza: { u: 12.8, v: 5.4, a: Math.PI },
      suggerimento: "Porta la Moke nel posto giallo col disabile, muso verso la scuola.",
      par: 20,
    },
    {
      nome: "Livello 2 · Accanto ai paletti",
      obiettivo: 1, retro: false,
      extra: [{ u: 1.35, v: 2.7, a: -Math.PI / 2, colore: "#c0392b" }],
      partenza: { u: 13.2, v: 5.3, a: Math.PI },
      suggerimento: "Il primo posto è occupato: infilati nell'altro, tra l'auto rossa e i paletti.",
      par: 24,
    },
    {
      nome: "Livello 3 · In retromarcia",
      obiettivo: 0, retro: true,
      extra: [{ u: -1.45, v: 9.2, a: Math.PI / 2, colore: "#e9ecef" }, { u: 4.2, v: 11.0, a: -0.51, colore: "#2d5d8a" }],
      partenza: { u: 9.5, v: 6.6, a: 0 },
      suggerimento: "Stavolta entra in retromarcia: la Moke deve guardare verso il piazzale.",
      par: 32,
    },
  ];

  let lv = 0, auto, extra, rettangoli, tempo, urti, fermoDa, finito, lampo;
  const premuti = new Set();

  function preparaLivello(i) {
    lv = i;
    const L = LIVELLI[lv];
    auto = { u: L.partenza.u, v: L.partenza.v, a: L.partenza.a, vel: 0, sterzo: 0 };
    extra = L.extra.map((e) => ({ ...e, l: 4.0, w: 1.75 }));
    rettangoli = DIPINTE.map(([u0, v0, u1, v1]) => ({ u0, v0, u1, v1 }));
    tempo = 0; urti = 0; fermoDa = 0; finito = false; lampo = 0;
    ui.livello.textContent = L.nome;
    ui.suggerimento.textContent = L.suggerimento;
    ui.suggerimento.classList.remove("sparito");
    clearTimeout(preparaLivello.t);
    preparaLivello.t = setTimeout(() => ui.suggerimento.classList.add("sparito"), 5000);
    ui.esito.hidden = true;
    premuti.clear();
    aggiornaDati();
  }

  /* ---------- geometria a terra ---------- */

  function spigoli(c, l, w) {
    const cs = Math.cos(c.a), sn = Math.sin(c.a), hl = l / 2, hw = w / 2;
    return [[hl, hw], [hl, -hw], [-hl, -hw], [-hl, hw]].map(([f, r]) => [c.u + f * cs - r * sn, c.v + f * sn + r * cs]);
  }

  function separati(p, q) {
    // SAT fra due poligoni convessi
    for (const poli of [p, q]) {
      for (let i = 0; i < poli.length; i++) {
        const [x0, y0] = poli[i], [x1, y1] = poli[(i + 1) % poli.length];
        const ax = y0 - y1, ay = x1 - x0;
        let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
        for (const [x, y] of p) { const d = x * ax + y * ay; a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
        for (const [x, y] of q) { const d = x * ax + y * ay; b0 = Math.min(b0, d); b1 = Math.max(b1, d); }
        if (a1 <= b0 || b1 <= a0) return true;
      }
    }
    return false;
  }

  function dentroPoligono([x, y], poli) {
    let dentro = false;
    for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
      const [xi, yi] = poli[i], [xj, yj] = poli[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  }

  function urta(c) {
    const pts = spigoli(c, LUNG, LARG);
    // spigoli e metà dei lati devono stare dentro il piazzale
    const campioni = pts.concat(pts.map((p, i) => [(p[0] + pts[(i + 1) % 4][0]) / 2, (p[1] + pts[(i + 1) % 4][1]) / 2]));
    if (!campioni.every((p) => dentroPoligono(p, BORDO))) return true;
    for (const r of rettangoli) if (!separati(pts, [[r.u0, r.v0], [r.u1, r.v0], [r.u1, r.v1], [r.u0, r.v1]])) return true;
    for (const e of extra) if (!separati(pts, spigoli(e, e.l, e.w))) return true;
    const cs = Math.cos(c.a), sn = Math.sin(c.a);
    for (const p of PALETTI) {
      const du = p.u - c.u, dv = p.v - c.v;
      const f = du * cs + dv * sn, r = -du * sn + dv * cs;
      const cf = Math.max(-LUNG / 2, Math.min(LUNG / 2, f)), cr = Math.max(-LARG / 2, Math.min(LARG / 2, r));
      if ((f - cf) ** 2 + (r - cr) ** 2 < 0.2 * 0.2) return true;
    }
    return false;
  }

  const angolo = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  /* ---------- simulazione ---------- */

  function passo(dt) {
    if (finito) return;
    tempo += dt;
    const sx = premuti.has("sinistra"), dx = premuti.has("destra");
    const av = premuti.has("avanti"), re = premuti.has("indietro");
    const vuoiSterzo = sx && !dx ? -STERZO_MAX : dx && !sx ? STERZO_MAX : 0;
    const vs = vuoiSterzo === 0 ? 3.2 : 2.2;
    auto.sterzo += Math.max(-vs * dt, Math.min(vs * dt, vuoiSterzo - auto.sterzo));
    const vuoiVel = av && !re ? V_AVANTI : re && !av ? -V_RETRO : 0;
    const acc = vuoiVel === 0 ? 5.5 : (auto.vel !== 0 && Math.sign(vuoiVel) !== Math.sign(auto.vel) ? 7 : 2.6);
    auto.vel += Math.max(-acc * dt, Math.min(acc * dt, vuoiVel - auto.vel));

    const prima = { ...auto };
    auto.a += (auto.vel / PASSO) * Math.tan(auto.sterzo) * dt;
    auto.u += auto.vel * Math.cos(auto.a) * dt;
    auto.v += auto.vel * Math.sin(auto.a) * dt;
    if (urta(auto)) {
      Object.assign(auto, prima);
      if (Math.abs(auto.vel) > 0.25) { urti++; lampo = 0.35; try { navigator.vibrate && navigator.vibrate(60); } catch (e) { /* facoltativo */ } }
      auto.vel = -auto.vel * 0.25;
    }
    if (lampo > 0) lampo -= dt;

    const L = LIVELLI[lv];
    const [u0, v0, u1, v1] = POSTI[L.obiettivo];
    const dentro = spigoli(auto, LUNG, LARG).every(([u, v]) => u > u0 - 0.05 && u < u1 + 0.05 && v > v0 - 0.05 && v < v1 + 0.05);
    const verso = L.retro ? Math.PI / 2 : -Math.PI / 2;
    if (dentro && Math.abs(angolo(auto.a - verso)) < 0.22 && Math.abs(auto.vel) < 0.08) {
      fermoDa += dt;
      if (fermoDa > 0.7) vittoria();
    } else fermoDa = 0;
    aggiornaDati();
  }

  function aggiornaDati() {
    ui.tempo.textContent = tempo.toFixed(1).replace(".", ",") + " s";
    ui.urti.textContent = urti === 1 ? "1 urto" : urti + " urti";
  }

  function vittoria() {
    finito = true;
    const L = LIVELLI[lv];
    const stelle = urti === 0 && tempo <= L.par ? 3 : urti <= 1 ? 2 : 1;
    ui.stelle.textContent = "★".repeat(stelle) + "☆".repeat(3 - stelle);
    ui.titolo.textContent = stelle === 3 ? "Parcheggio perfetto!" : "Parcheggiata!";
    ui.testo.textContent = "In " + tempo.toFixed(1).replace(".", ",") + " secondi, " +
      (urti === 0 ? "senza toccare niente." : urti === 1 ? "con un urto." : "con " + urti + " urti.") +
      (stelle < 3 && urti === 0 ? " Per tre stelle: sotto i " + L.par + " secondi." : "");
    ui.prossimo.textContent = lv < LIVELLI.length - 1 ? "Livello successivo" : "Ricomincia dal primo";
    premuti.clear();
    ui.esito.hidden = false;
  }

  ui.riprova.addEventListener("click", () => preparaLivello(lv));
  ui.prossimo.addEventListener("click", () => preparaLivello((lv + 1) % LIVELLI.length));

  /* ---------- proiezione ---------- */

  // punto a terra (u, v) alla quota z (metri) → pixel dell'immagine
  const P = (u, v, z = 0) => [O[0] + u * A[0] + v * B[0], O[1] + u * A[1] + v * B[1] - z * ALTEZZA_PX];
  const poligono = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };

  function sfuma(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => Math.round(Math.min(255, x * k)));
    return `rgb(${c[0]} ${c[1]} ${c[2]})`;
  }

  /*
   * Modellini 3D: ogni veicolo è un elenco di facce in coordinate locali (f avanti, r a destra, z in alto).
   * Si proiettano col piano del disegno, si ordinano dal fondo verso chi guarda (algoritmo del pittore)
   * e si colorano con la luce da sinistra, come nell'illustrazione.
   */
  const LUCE = (() => { const l = [-0.62, 0.18, 0.76], n = Math.hypot(...l); return l.map((x) => x / n); })();
  const OCCHIO = (() => { const l = [0.24, 0.62, 0.75], n = Math.hypot(...l); return l.map((x) => x / n); })();

  function faccia(punti, colore, opz = {}) { return { punti, colore, alfa: opz.alfa ?? 1, bias: opz.bias || 0, piatto: !!opz.piatto }; }

  function scatola(m, f0, f1, r0, r1, z0, z1, colore, bias = 0) {
    const v = (f, r, z) => [f, r, z], o = { bias };
    m.push(
      faccia([v(f1, r0, z0), v(f1, r1, z0), v(f1, r1, z1), v(f1, r0, z1)], colore, o),
      faccia([v(f0, r0, z0), v(f0, r0, z1), v(f0, r1, z1), v(f0, r1, z0)], colore, o),
      faccia([v(f0, r1, z0), v(f0, r1, z1), v(f1, r1, z1), v(f1, r1, z0)], colore, o),
      faccia([v(f0, r0, z0), v(f1, r0, z0), v(f1, r0, z1), v(f0, r0, z1)], colore, o),
      faccia([v(f0, r0, z1), v(f1, r0, z1), v(f1, r1, z1), v(f0, r1, z1)], colore, o),
    );
  }

  // Profilo laterale (f, z) estruso fra r0 e r1; colori[i] per la fascia che parte dal punto i
  function estrudi(m, profilo, r0, r1, fianco, colori) {
    m.push(faccia(profilo.map(([f, z]) => [f, r0, z]), fianco));
    m.push(faccia(profilo.map(([f, z]) => [f, r1, z]), fianco));
    profilo.forEach(([f, z], i) => {
      const [g2, z2] = profilo[(i + 1) % profilo.length];
      if (colori[i]) m.push(faccia([[f, r0, z], [g2, r0, z2], [g2, r1, z2], [f, r1, z]], colori[i]));
    });
  }

  // Ruota (asse lungo r o lungo f): battistrada, fianco e cerchio bianco
  function ruota(m, asse, cf, cr, cz, raggio, mezza, cerchio, lati = 12) {
    const P3 = (a, s, t) => (asse === "r" ? [cf + Math.cos(a) * t, cr + s, cz + Math.sin(a) * t] : [cf + s, cr + Math.cos(a) * t, cz + Math.sin(a) * t]);
    for (let i = 0; i < lati; i++) {
      const a0 = (i / lati) * 2 * Math.PI, a1 = ((i + 1) / lati) * 2 * Math.PI;
      m.push(faccia([P3(a0, -mezza, raggio), P3(a1, -mezza, raggio), P3(a1, mezza, raggio), P3(a0, mezza, raggio)], "#1b1d21"));
    }
    [-mezza, mezza].forEach((s) => {
      const giro = (t) => Array.from({ length: lati }, (_, i) => P3((i / lati) * 2 * Math.PI, s, t));
      m.push(faccia(giro(raggio), "#23262b"));
      m.push(faccia(giro(raggio * 0.64), cerchio, { bias: 0.004, piatto: true }));
      m.push(faccia(giro(raggio * 0.2), "#6d737a", { bias: 0.008, piatto: true }));
    });
  }

  function disco(m, cf, cr, cz, raggio, colore, bias) {
    m.push(faccia(Array.from({ length: 10 }, (_, i) => [cf, cr + Math.cos((i / 10) * 2 * Math.PI) * raggio, cz + Math.sin((i / 10) * 2 * Math.PI) * raggio]), colore, { bias, piatto: true }));
  }

  const MOKE = (() => {
    const m = [], T = "#1f6f86", L2 = LUNG / 2, W2 = LARG / 2;
    // ruote sotto il cassone, cerchi bianchi come nelle foto
    [[1.02, 1], [1.02, -1], [-1.02, 1], [-1.02, -1]].forEach(([f, s]) => ruota(m, "r", f, s * (W2 - 0.14), 0.31, 0.31, 0.12, "#eceeec"));
    // cassone: fianchi piatti, cofano e pianale dell'abitacolo scuro
    estrudi(m, [[-L2 + 0.05, 0.3], [-L2 + 0.05, 0.8], [0.5, 0.8], [0.62, 0.86], [L2 - 0.14, 0.86], [L2 - 0.05, 0.8], [L2 - 0.05, 0.3]],
      -W2 + 0.05, W2 - 0.05, T, [T, "#2a3740", T, T, T, T, "#16505f"]);
    // longheroni laterali, un filo più scuri
    [1, -1].forEach((s) => scatola(m, -L2 + 0.25, L2 - 0.3, s > 0 ? W2 - 0.05 : -W2, s > 0 ? W2 : -W2 + 0.05, 0.3, 0.66, "#1a6278"));
    // griglia, fari, frecce
    m.push(faccia([[L2 - 0.04, -0.3, 0.38], [L2 - 0.04, 0.3, 0.38], [L2 - 0.04, 0.3, 0.64], [L2 - 0.04, -0.3, 0.64]], "#b9bec2", { bias: 0.004, piatto: true }));
    for (let k = 0; k < 4; k++) m.push(faccia([[L2 - 0.035, -0.27, 0.42 + k * 0.06], [L2 - 0.035, 0.27, 0.42 + k * 0.06], [L2 - 0.035, 0.27, 0.45 + k * 0.06], [L2 - 0.035, -0.27, 0.45 + k * 0.06]], "#3b4046", { bias: 0.008, piatto: true }));
    [1, -1].forEach((s) => {
      disco(m, L2 - 0.035, s * 0.5, 0.66, 0.12, "#c9ccd0", 0.004);
      disco(m, L2 - 0.03, s * 0.5, 0.66, 0.085, "#fff6d6", 0.008);
      m.push(faccia([[L2 - 0.035, s * 0.62, 0.46], [L2 - 0.035, s * 0.72, 0.46], [L2 - 0.035, s * 0.72, 0.53], [L2 - 0.035, s * 0.62, 0.53]], "#f29a2e", { bias: 0.006, piatto: true }));
      m.push(faccia([[-L2 + 0.045, s * 0.55, 0.6], [-L2 + 0.045, s * 0.68, 0.6], [-L2 + 0.045, s * 0.68, 0.7], [-L2 + 0.045, s * 0.55, 0.7]], "#c0392b", { bias: 0.006, piatto: true }));
    });
    // paraurti tubolare bianco
    const B = "#f1f2ef";
    scatola(m, L2, L2 + 0.08, -W2 + 0.05, W2 - 0.05, 0.33, 0.41, B);
    scatola(m, L2, L2 + 0.08, -0.38, 0.38, 0.6, 0.67, B);
    [1, -1].forEach((s) => {
      scatola(m, L2, L2 + 0.08, s * 0.38 - 0.04, s * 0.38 + 0.04, 0.33, 0.67, B);
      scatola(m, L2 - 0.12, L2 + 0.08, s > 0 ? W2 - 0.12 : -W2 + 0.05, s > 0 ? W2 - 0.05 : -W2 + 0.12, 0.33, 0.41, B);
    });
    // sedili blu
    const S = "#2f74bf";
    [1, -1].forEach((s) => {
      const ra = s > 0 ? 0.08 : -0.62, rb = s > 0 ? 0.62 : -0.08;
      scatola(m, -0.25, 0.2, ra, rb, 0.8, 0.98, S);
      scatola(m, -0.4, -0.25, ra, rb, 0.8, 1.3, S);
    });
    scatola(m, -1.25, -0.8, -0.62, 0.62, 0.8, 0.95, S);
    scatola(m, -1.4, -1.27, -0.62, 0.62, 0.8, 1.2, S);
    // parabrezza col telaio
    m.push(faccia([[0.52, -W2 + 0.06, 0.86], [0.52, W2 - 0.06, 0.86], [0.52, W2 - 0.06, 1.35], [0.52, -W2 + 0.06, 1.35]], "#bfe3f2", { alfa: 0.35 }));
    scatola(m, 0.49, 0.55, -W2 + 0.03, W2 - 0.03, 1.33, 1.38, "#aeb4b8");
    [1, -1].forEach((s) => scatola(m, 0.49, 0.55, s > 0 ? W2 - 0.08 : -W2 + 0.03, s > 0 ? W2 - 0.03 : -W2 + 0.08, 0.86, 1.36, "#aeb4b8"));
    // capote di tela: tetto, chiusa dietro, aperta sui lati davanti
    const C = "#d5d9dc";
    scatola(m, -L2 + 0.02, 0.55, -W2 + 0.01, W2 - 0.01, 1.36, 1.45, C, 1);
    m.push(faccia([[-L2 + 0.25, -0.01, 1.4505], [0.5, -0.01, 1.4505], [0.5, 0.01, 1.4505], [-L2 + 0.25, 0.01, 1.4505]], "#b9bec2", { bias: 1.01, piatto: true }));
    scatola(m, -L2 + 0.02, -L2 + 0.06, -W2 + 0.02, W2 - 0.02, 0.8, 1.36, "#c3c8cb");
    [1, -1].forEach((s) => {
      scatola(m, -L2 + 0.02, -0.95, s > 0 ? W2 - 0.04 : -W2 + 0.01, s > 0 ? W2 - 0.01 : -W2 + 0.04, 0.8, 1.36, "#c3c8cb");
      scatola(m, -0.95, -0.89, s > 0 ? W2 - 0.05 : -W2 + 0.01, s > 0 ? W2 - 0.01 : -W2 + 0.05, 0.8, 1.36, "#eceeec");
    });
    // ruota di scorta dietro
    ruota(m, "f", -L2 - 0.08, 0, 0.72, 0.29, 0.09, "#eceeec");
    return m;
  })();

  function modelloAuto(colore) {
    const m = [], L2 = 2.0, W2 = 0.87, V = "#27313b";
    [[1.3, 1], [1.3, -1], [-1.3, 1], [-1.3, -1]].forEach(([f, s]) => ruota(m, "r", f, s * (W2 - 0.14), 0.33, 0.33, 0.12, "#aab0b6"));
    estrudi(m, [[-L2, 0.32], [-L2, 0.86], [-1.45, 0.94], [-0.95, 1.36], [0.45, 1.38], [1.15, 0.95], [L2 - 0.05, 0.84], [L2, 0.32]],
      -W2, W2, colore, [colore, colore, V, colore, V, colore, colore, sfuma(colore, 0.7)]);
    [1, -1].forEach((s) => {
      m.push(faccia([[-1.28, s * (W2 + 0.002), 0.97], [-0.9, s * (W2 + 0.002), 1.3], [0.42, s * (W2 + 0.002), 1.32], [1.02, s * (W2 + 0.002), 0.97]], V, { bias: 0.004, piatto: true }));
      disco(m, L2 + 0.002, s * 0.62, 0.7, 0.11, "#fff6d6", 0.006);
      m.push(faccia([[-L2 - 0.002, s * 0.5, 0.64], [-L2 - 0.002, s * 0.78, 0.64], [-L2 - 0.002, s * 0.78, 0.76], [-L2 - 0.002, s * 0.5, 0.76]], "#c0392b", { bias: 0.006, piatto: true }));
    });
    return m;
  }

  function ombra(c, l, w) {
    const pts = spigoli({ ...c, u: c.u + 0.3, v: c.v + 0.12 }, l + 0.25, w + 0.25).map(([u, v]) => P(u, v));
    poligono(pts);
    g.fillStyle = "rgb(20 22 30 / 32%)";
    g.fill();
  }

  function disegnaModello(c, facce) {
    const cs = Math.cos(c.a), sn = Math.sin(c.a);
    const mondo = ([f, r, z]) => [c.u + f * cs - r * sn, c.v + f * sn + r * cs, z];
    const lista = facce.map((fc) => {
      const w = fc.punti.map(mondo);
      // normale della faccia, girata verso chi guarda
      const [a, b, d] = [w[0], w[1], w[2]];
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const ln = Math.hypot(...n) || 1;
      n = n.map((x) => x / ln);
      const verso = n[0] * OCCHIO[0] + n[1] * OCCHIO[1] + n[2] * OCCHIO[2];
      if (verso < 0) n = n.map((x) => -x);
      const luce = 0.58 + 0.42 * Math.max(0, n[0] * LUCE[0] + n[1] * LUCE[1] + n[2] * LUCE[2]);
      let prof = 0;
      w.forEach((p) => { prof += p[0] * OCCHIO[0] + p[1] * OCCHIO[1] + p[2] * OCCHIO[2]; });
      return { w, prof: prof / w.length + fc.bias, fc, luce };
    });
    lista.sort((x, y) => x.prof - y.prof);
    lista.forEach(({ w, fc, luce }) => {
      poligono(w.map(([u, v, z]) => P(u, v, z)));
      g.globalAlpha = fc.alfa;
      g.fillStyle = fc.piatto ? fc.colore : sfuma(fc.colore, luce);
      g.fill();
      if (fc.alfa === 1 && !fc.piatto) { g.lineWidth = 0.35; g.strokeStyle = g.fillStyle; g.stroke(); }
    });
    g.globalAlpha = 1;
  }

  function disegnaMoke(c) {
    ombra(c, LUNG, LARG);
    disegnaModello(c, MOKE);
  }

  const modelli = {};
  function disegnaAuto(e) {
    ombra(e, e.l, e.w);
    disegnaModello(e, modelli[e.colore] || (modelli[e.colore] = modelloAuto(e.colore)));
  }

  /* ---------- ritagli che stanno davanti alla Moke ---------- */

  const ritagli = [];
  function preparaRitagli() {
    // I paletti del disegno vanno ridisegnati sopra la Moke quando lei ci passa dietro
    PALETTI.forEach((p) => {
      const [x, yb, yt] = p.img;
      const x0 = Math.floor(x - 8), y0 = Math.floor(yt - 2), w = 16, h = Math.ceil(yb - yt + 3);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const q = c.getContext("2d");
      q.drawImage(scena, x0, y0, w, h, 0, 0, w, h);
      const d = q.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        const lum = 0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2];
        if (lum > 72) d.data[i + 3] = 0;       // resta solo il paletto scuro
      }
      q.putImageData(d, 0, 0);
      ritagli.push({ c, x0, y0, prof: yb, palo: p });
    });
  }

  /* ---------- disegno ---------- */

  let dpr = 1, zoom = 1, camX = 700, camY = 480;

  function adatta() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    zoom = Math.min(r.width / 390, r.height / 290);
  }
  window.addEventListener("resize", adatta);

  function disegna(t) {
    const W = cv.width, H = cv.height, k = zoom * dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const cielo = g.createLinearGradient(0, 0, 0, H);
    cielo.addColorStop(0, "#5aa7d8"); cielo.addColorStop(1, "#b9dcef");
    g.fillStyle = cielo;
    g.fillRect(0, 0, W, H);

    // la telecamera segue la Moke senza uscire dal disegno
    const [mx, my] = P(auto.u, auto.v);
    const vw = W / k, vh = H / k;
    const tx = Math.max(vw / 2, Math.min(IMG_W - vw / 2, mx)), ty = Math.max(vh / 2, Math.min(598 - vh / 2, my - 20));
    camX += (tx - camX) * 0.12; camY += (ty - camY) * 0.12;
    if (vw >= IMG_W) camX = IMG_W / 2;
    g.setTransform(k, 0, 0, k, W / 2 - camX * k, H / 2 - camY * k);
    // la strada sotto il cordolo, al posto del vuoto trasparente dell'immagine
    g.fillStyle = "#3a3e44";
    g.fillRect(-2000, 530, 5000, 2000);
    if (scena.naturalWidth) g.drawImage(scena, 0, 0);

    const L = LIVELLI[lv];
    // il posto da raggiungere pulsa, con la sagoma della Moke nella posa giusta
    const [u0, v0, u1, v1] = POSTI[L.obiettivo];
    const pulsa = 0.5 + 0.5 * Math.sin(t / 320);
    poligono([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]);
    g.fillStyle = fermoDa > 0 ? "rgb(109 202 138 / 35%)" : `rgb(255 214 90 / ${0.12 + 0.18 * pulsa})`;
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = fermoDa > 0 ? "rgb(109 202 138)" : `rgb(255 214 90 / ${0.5 + 0.5 * pulsa})`;
    g.stroke();
    const posa = { u: (u0 + u1) / 2, v: (v0 + v1) / 2 + 0.3, a: L.retro ? Math.PI / 2 : -Math.PI / 2 };
    poligono(spigoli(posa, LUNG, LARG).map(([u, v]) => P(u, v)));
    g.setLineDash([4, 4]); g.strokeStyle = "rgb(255 255 255 / 70%)"; g.lineWidth = 1.5; g.stroke(); g.setLineDash([]);
    // freccia: dove guarda il muso
    const cs = Math.cos(posa.a), sn = Math.sin(posa.a);
    const punta = P(posa.u + cs * 1.2, posa.v + sn * 1.2), coda = P(posa.u - cs * 0.6, posa.v - sn * 0.6);
    g.beginPath(); g.moveTo(...coda); g.lineTo(...punta); g.strokeStyle = "rgb(255 255 255 / 80%)"; g.lineWidth = 2; g.stroke();

    // Moke, auto in più e paletti in ordine di profondità (chi è più in basso sta davanti)
    const cose = [{ prof: P(auto.u, auto.v)[1], fai: () => disegnaMoke(auto) }];
    extra.forEach((e) => cose.push({ prof: P(e.u, e.v)[1], fai: () => disegnaAuto(e) }));
    ritagli.forEach((r) => cose.push({ prof: r.prof, fai: () => g.drawImage(r.c, r.x0, r.y0), paletto: true }));
    cose.sort((a, b) => a.prof - b.prof);
    // i paletti che stanno dietro sono già nel disegno: si ridisegnano solo se qualcosa gli passa dietro
    let dietro = false;
    cose.forEach((x) => { if (!x.paletto) { x.fai(); dietro = true; } else if (dietro) x.fai(); });

    g.setTransform(1, 0, 0, 1, 0, 0);
    if (lampo > 0) { g.fillStyle = `rgb(224 85 85 / ${lampo})`; g.fillRect(0, 0, W, H); }
  }

  let t0 = 0;
  function ciclo(t) {
    const dt = t0 ? Math.min(0.05, (t - t0) / 1000) : 0;
    t0 = t;
    passo(dt);
    disegna(t);
    requestAnimationFrame(ciclo);
  }

  /* ---------- comandi ---------- */

  document.querySelectorAll("[data-tasto]").forEach((b) => {
    const k = b.dataset.tasto;
    const giu = (e) => { e.preventDefault(); if (!finito) premuti.add(k); b.classList.add("premuto"); };
    const su = (e) => { e.preventDefault(); premuti.delete(k); b.classList.remove("premuto"); };
    b.addEventListener("pointerdown", (e) => { b.setPointerCapture(e.pointerId); giu(e); });
    b.addEventListener("pointerup", su);
    b.addEventListener("pointercancel", su);
    b.addEventListener("lostpointercapture", su);
    b.addEventListener("contextmenu", (e) => e.preventDefault());
  });
  const TASTI = { ArrowLeft: "sinistra", a: "sinistra", ArrowRight: "destra", d: "destra", ArrowUp: "avanti", w: "avanti", ArrowDown: "indietro", s: "indietro" };
  window.addEventListener("keydown", (e) => { const k = TASTI[e.key]; if (k && !finito) { premuti.add(k); e.preventDefault(); } });
  window.addEventListener("keyup", (e) => { const k = TASTI[e.key]; if (k) premuti.delete(k); });
  window.addEventListener("blur", () => premuti.clear());

  // accesso per le prove automatiche (nessun effetto sul gioco)
  window.__parcheggio = {
    stato: () => ({ ...auto, finito, urti }),
    metti: (u, v, a) => { Object.assign(auto, { u, v, a, vel: 0, sterzo: 0 }); return !urta(auto); },
    urta: (u, v, a) => urta({ u, v, a }),
  };

  function parti() {
    preparaRitagli();
    adatta();
    preparaLivello(0);
    const [mx, my] = P(auto.u, auto.v);
    camX = mx; camY = my;
    requestAnimationFrame(ciclo);
  }
  if (scena.complete && scena.naturalWidth) parti(); else scena.addEventListener("load", parti);
})();

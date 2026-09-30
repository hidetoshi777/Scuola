/*
 * Parcheggia la Moke nel posto riservato davanti al plesso Meucci.
 * Il piazzale è in metri (24 × 32, y verso il basso); il disegno scala per stare nello schermo.
 * Guida: modello a bicicletta (sterzo sulle ruote anteriori), comandi a pressione continua.
 */
(function () {
  "use strict";

  const W = 24, H = 32;
  const AUTO_L = 3.0, AUTO_W = 3.0 * 160 / 303; // proporzioni dello sprite
  const PASSO = 2.05;                            // interasse
  const STERZO_MAX = 0.62;                       // ~35°
  const V_AVANTI = 3.2, V_RETRO = 1.8;           // m/s

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

  const sprite = new Image();
  sprite.src = "img/moke.png?v=1";

  /* ---------- il piazzale ---------- */

  const rett = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });
  const EDIFICIO = [
    { r: rett(0, 0, 6.5, 16), tetto: "#c9785e", bordo: "#e8dcc2" },   // ala perpendicolare
    { r: rett(6.5, 0, 17, 5.5), tetto: "#9a9893", bordo: "#d6cfc2" },  // corpo d'ingresso
    { r: rett(17, 0, 24, 7), tetto: "#8f8a84", bordo: "#b7b1a6" },     // blocco a destra
  ];
  const MARCIAPIEDI = [rett(6.5, 5.5, 17, 6.5), rett(6.5, 6.5, 7.6, 16)];
  const AIUOLE = [rett(22.6, 8, 24, 32), rett(0, 16, 6.5, 32), rett(6.5, 29.3, 8.3, 32)];
  const ALBERI = [[23.3, 10.5, 1.3], [23.3, 17, 1.4], [23.3, 24, 1.3], [2.5, 19, 1.6], [4.8, 24.5, 1.5], [2.2, 29.5, 1.4], [7.4, 30.6, 0.9]];
  const DISABILI = [rett(8.0, 6.5, 11.3, 11.5), rett(12.8, 6.5, 16.1, 11.5)];
  const STRISCE = rett(11.3, 6.5, 12.8, 11.5);
  const POSTI = [rett(17.4, 7, 19.9, 12), rett(19.9, 7, 22.4, 12),
    rett(12.2, 26, 14.7, 31), rett(14.7, 26, 17.2, 31), rett(17.2, 26, 19.7, 31), rett(19.7, 26, 22.2, 31)];
  const PALETTI = [[16.75, 7.2], [16.75, 11.1]];

  // Auto parcheggiate: d = indice del posto disabili, p = indice di un posto normale
  const LIVELLI = [
    {
      nome: "Livello 1 · Il posto è libero",
      obiettivo: 0, retro: false,
      parcheggiate: [{ p: 3, colore: "#e9ecef" }, { p: 1, colore: "#3c434c" }],
      partenza: { x: 10.2, y: 24, a: -Math.PI / 2 },
      suggerimento: "Porta la Moke nel posto giallo, muso verso la scuola.",
      par: 18,
    },
    {
      nome: "Livello 2 · Tra le auto",
      obiettivo: 1, retro: false,
      parcheggiate: [{ d: 0, colore: "#e9ecef" }, { p: 0, colore: "#3c434c" }, { p: 1, colore: "#b23b35" }, { p: 4, colore: "#2d5d8a" }],
      partenza: { x: 9.5, y: 25, a: -Math.PI / 2 },
      suggerimento: "L'altro posto è occupato: infilati in quello libero senza toccare niente.",
      par: 22,
    },
    {
      nome: "Livello 3 · In retromarcia",
      obiettivo: 0, retro: true,
      parcheggiate: [{ d: 1, colore: "#e9ecef" }, { p: 0, colore: "#3c434c" }, { p: 2, colore: "#7b8a3a" }, { p: 3, colore: "#e0a526" }, { p: 5, colore: "#5a5f66" }],
      partenza: { x: 18.5, y: 20, a: -Math.PI },
      suggerimento: "Stavolta entra in retromarcia: la Moke deve guardare verso il piazzale.",
      par: 30,
    },
  ];

  let lv = 0;
  let auto, ostacoli, parcheggiate, tempo, urti, fermoDa, finito, lampo;
  const premuti = new Set();

  function preparaLivello(i) {
    lv = i;
    const L = LIVELLI[lv];
    auto = { x: L.partenza.x, y: L.partenza.y, a: L.partenza.a, v: 0, sterzo: 0 };
    parcheggiate = L.parcheggiate.map((q) => {
      const b = q.d !== undefined ? DISABILI[q.d] : POSTI[q.p];
      return { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 + (b.y0 > 20 ? -0.1 : 0.1), w: 1.8, l: 4.2, colore: q.colore };
    });
    ostacoli = [];
    EDIFICIO.forEach((e) => ostacoli.push(e.r));
    MARCIAPIEDI.forEach((r) => ostacoli.push(r));
    AIUOLE.forEach((r) => ostacoli.push(r));
    parcheggiate.forEach((c) => ostacoli.push(rett(c.x - c.w / 2, c.y - c.l / 2, c.x + c.w / 2, c.y + c.l / 2)));
    tempo = 0; urti = 0; fermoDa = 0; finito = false; lampo = 0;
    ui.livello.textContent = L.nome;
    ui.suggerimento.textContent = L.suggerimento;
    ui.suggerimento.classList.remove("sparito");
    clearTimeout(preparaLivello.t);
    preparaLivello.t = setTimeout(() => ui.suggerimento.classList.add("sparito"), 4500);
    ui.esito.hidden = true;
    aggiornaDati();
  }

  /* ---------- geometria ---------- */

  function spigoli(c) {
    const cs = Math.cos(c.a), sn = Math.sin(c.a);
    const hl = AUTO_L / 2, hw = AUTO_W / 2;
    return [[hl, hw], [hl, -hw], [-hl, -hw], [-hl, hw]].map(([u, w]) => [c.x + u * cs - w * sn, c.y + u * sn + w * cs]);
  }

  function urtaRett(pts, r) {
    // SAT fra il rettangolo ruotato dell'auto e un rettangolo allineato
    const assi = [[1, 0], [0, 1], [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]], [pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]]];
    const rp = [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]];
    for (const [ax, ay] of assi) {
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (const [x, y] of pts) { const d = x * ax + y * ay; a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
      for (const [x, y] of rp) { const d = x * ax + y * ay; b0 = Math.min(b0, d); b1 = Math.max(b1, d); }
      if (a1 <= b0 || b1 <= a0) return false;
    }
    return true;
  }

  function urtaPaletto(c, [px, py], rag) {
    const cs = Math.cos(c.a), sn = Math.sin(c.a);
    const dx = px - c.x, dy = py - c.y;
    const u = dx * cs + dy * sn, w = -dx * sn + dy * cs;
    const cu = Math.max(-AUTO_L / 2, Math.min(AUTO_L / 2, u));
    const cw = Math.max(-AUTO_W / 2, Math.min(AUTO_W / 2, w));
    return (u - cu) ** 2 + (w - cw) ** 2 < rag * rag;
  }

  function urta(c) {
    const pts = spigoli(c);
    for (const [x, y] of pts) if (x < 0 || x > W || y < 0 || y > H) return true;
    if (ostacoli.some((r) => urtaRett(pts, r))) return true;
    return PALETTI.some((p) => urtaPaletto(c, p, 0.16));
  }

  function dentro(c, b) {
    return spigoli(c).every(([x, y]) => x > b.x0 - 0.04 && x < b.x1 + 0.04 && y > b.y0 - 0.04 && y < b.y1 + 0.04);
  }

  function angolo(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }

  /* ---------- simulazione ---------- */

  function passo(dt) {
    if (finito) return;
    tempo += dt;
    const sx = premuti.has("sinistra"), dx = premuti.has("destra");
    const av = premuti.has("avanti"), re = premuti.has("indietro");
    const obiettivoSterzo = sx && !dx ? -STERZO_MAX : dx && !sx ? STERZO_MAX : 0;
    const vel = obiettivoSterzo === 0 ? 3.2 : 2.2;
    auto.sterzo += Math.max(-vel * dt, Math.min(vel * dt, obiettivoSterzo - auto.sterzo));

    const vObiettivo = av && !re ? V_AVANTI : re && !av ? -V_RETRO : 0;
    const acc = vObiettivo === 0 ? 5.5 : (Math.sign(vObiettivo) !== Math.sign(auto.v) && auto.v !== 0 ? 7 : 2.6);
    auto.v += Math.max(-acc * dt, Math.min(acc * dt, vObiettivo - auto.v));

    const prima = { ...auto };
    auto.a += (auto.v / PASSO) * Math.tan(auto.sterzo) * dt;
    auto.x += auto.v * Math.cos(auto.a) * dt;
    auto.y += auto.v * Math.sin(auto.a) * dt;
    if (urta(auto)) {
      Object.assign(auto, prima);
      if (Math.abs(auto.v) > 0.25) { urti++; lampo = 0.35; vibra(); }
      auto.v = -auto.v * 0.25;
    }
    if (lampo > 0) lampo -= dt;

    const L = LIVELLI[lv];
    const verso = L.retro ? Math.PI / 2 : -Math.PI / 2;
    const allineata = Math.abs(angolo(auto.a - verso)) < 0.21;
    if (dentro(auto, DISABILI[L.obiettivo]) && allineata && Math.abs(auto.v) < 0.08) {
      fermoDa += dt;
      if (fermoDa > 0.7) vittoria();
    } else fermoDa = 0;
    aggiornaDati();
  }

  function vibra() { try { navigator.vibrate && navigator.vibrate(60); } catch (e) { /* facoltativo */ } }

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
    ui.testo.textContent = "In " + tempo.toFixed(1).replace(".", ",") + " secondi, " + (urti === 0 ? "senza toccare niente." : urti === 1 ? "con un urto." : "con " + urti + " urti.") +
      (stelle < 3 && urti === 0 ? " Per tre stelle: sotto i " + L.par + " secondi." : "");
    ui.prossimo.textContent = lv < LIVELLI.length - 1 ? "Livello successivo" : "Ricomincia dal primo";
    try {
      const k = "meucci-parcheggio-" + lv;
      const prima = Number(localStorage.getItem(k)) || 0;
      if (stelle > prima) localStorage.setItem(k, stelle);
    } catch (e) { /* facoltativo */ }
    premuti.clear();
    ui.esito.hidden = false;
  }

  ui.riprova.addEventListener("click", () => preparaLivello(lv));
  ui.prossimo.addEventListener("click", () => preparaLivello((lv + 1) % LIVELLI.length));

  /* ---------- disegno ---------- */

  let scala = 20, ox = 0, oy = 0, dpr = 1, asfalto = null;

  function adatta() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    scala = Math.min(r.width / W, r.height / H) * dpr;
    ox = (cv.width - W * scala) / 2;
    oy = (cv.height - H * scala) / 2;
    asfalto = null;
  }
  window.addEventListener("resize", adatta);

  const X = (m) => ox + m * scala;
  const Y = (m) => oy + m * scala;
  const S = (m) => m * scala;

  function rettangolo(r, colore) { g.fillStyle = colore; g.fillRect(X(r.x0), Y(r.y0), S(r.x1 - r.x0), S(r.y1 - r.y0)); }

  // Le parti ferme (asfalto, segnaletica, aiuole, tetti) si disegnano una volta sola
  function fondo() {
    const c = document.createElement("canvas");
    c.width = cv.width; c.height = cv.height;
    disegnaFondo(c.getContext("2d"));
    asfalto = c;
  }

  function disegnaFondo(q) {
    q.fillStyle = "#0d131b";
    q.fillRect(0, 0, q.canvas.width, q.canvas.height);
    q.fillStyle = "#5d6166";
    q.fillRect(X(0), Y(0), S(W), S(H));
    // grana dell'asfalto
    let seme = 7;
    const caso = () => ((seme = (seme * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2600; i++) {
      q.fillStyle = caso() < 0.5 ? "rgb(255 255 255 / 5%)" : "rgb(0 0 0 / 7%)";
      const s = S(0.05 + caso() * 0.1);
      q.fillRect(X(caso() * W), Y(caso() * H), s, s);
    }
    // posti normali: linee bianche
    q.strokeStyle = "#e9e7e2"; q.lineWidth = Math.max(1.5, S(0.1));
    POSTI.forEach((b) => {
      q.beginPath();
      if (b.y0 > 20) { q.moveTo(X(b.x0), Y(b.y1)); q.lineTo(X(b.x0), Y(b.y0)); q.lineTo(X(b.x1), Y(b.y0)); q.lineTo(X(b.x1), Y(b.y1)); }
      else { q.moveTo(X(b.x0), Y(b.y0)); q.lineTo(X(b.x0), Y(b.y1)); q.lineTo(X(b.x1), Y(b.y1)); q.lineTo(X(b.x1), Y(b.y0)); }
      q.stroke();
    });
    // posti disabili: bordo giallo, simbolo e zona tratteggiata
    q.strokeStyle = "#e8c13c"; q.fillStyle = "rgb(232 193 60 / 12%)";
    DISABILI.forEach((b) => {
      q.fillRect(X(b.x0), Y(b.y0), S(b.x1 - b.x0), S(b.y1 - b.y0));
      q.strokeRect(X(b.x0), Y(b.y0), S(b.x1 - b.x0), S(b.y1 - b.y0));
      simboloDisabili(q, (b.x0 + b.x1) / 2, b.y1 - 1.5, 1.1);
    });
    q.save();
    q.beginPath(); q.rect(X(STRISCE.x0), Y(STRISCE.y0), S(STRISCE.x1 - STRISCE.x0), S(STRISCE.y1 - STRISCE.y0)); q.clip();
    q.strokeStyle = "#e8c13c";
    for (let t = -2; t < 8; t += 0.6) { q.beginPath(); q.moveTo(X(STRISCE.x0), Y(STRISCE.y0 + t)); q.lineTo(X(STRISCE.x1), Y(STRISCE.y0 + t + 1.5)); q.stroke(); }
    q.restore();
    // marciapiedi
    MARCIAPIEDI.forEach((r) => {
      q.fillStyle = "#b8b1a4"; q.fillRect(X(r.x0), Y(r.y0), S(r.x1 - r.x0), S(r.y1 - r.y0));
      q.strokeStyle = "#9c968a"; q.lineWidth = Math.max(1, S(0.06)); q.strokeRect(X(r.x0), Y(r.y0), S(r.x1 - r.x0), S(r.y1 - r.y0));
    });
    // aiuole con cordolo
    AIUOLE.forEach((r) => {
      q.fillStyle = "#c9c3b7"; q.fillRect(X(r.x0), Y(r.y0), S(r.x1 - r.x0), S(r.y1 - r.y0));
      q.fillStyle = "#6f9a4b"; q.fillRect(X(r.x0 + 0.2), Y(r.y0 + 0.2), S(r.x1 - r.x0 - 0.4), S(r.y1 - r.y0 - 0.4));
    });
    // tetti del plesso
    EDIFICIO.forEach((e) => {
      const r = e.r;
      q.fillStyle = e.bordo; q.fillRect(X(r.x0), Y(r.y0), S(r.x1 - r.x0), S(r.y1 - r.y0));
      q.fillStyle = e.tetto; q.fillRect(X(r.x0 + 0.35), Y(r.y0 + 0.35), S(r.x1 - r.x0 - 0.7), S(r.y1 - r.y0 - 0.7));
      q.fillStyle = "rgb(0 0 0 / 18%)"; q.fillRect(X(r.x0), Y(r.y1 - 0.25), S(r.x1 - r.x0), S(0.25));
    });
    // impianti sul tetto e parabola, come nell'illustrazione
    [[2, 3], [4.2, 7], [2.5, 11], [9.5, 2], [14, 2.8], [20, 2.5], [22, 5]].forEach(([x, y]) => {
      q.fillStyle = "#dcdad4"; q.fillRect(X(x), Y(y), S(0.9), S(0.7));
      q.fillStyle = "#aaa79f"; q.fillRect(X(x + 0.15), Y(y + 0.15), S(0.6), S(0.4));
    });
    q.fillStyle = "#f2f2f0"; q.beginPath(); q.arc(X(1.6), Y(14.6), S(0.55), 0, 7); q.fill();
    q.strokeStyle = "#bdbdbd"; q.lineWidth = Math.max(1, S(0.06)); q.stroke();
    // vetrata d'ingresso: una fascia chiara sul tetto del corpo centrale
    q.fillStyle = "rgb(219 228 218 / 55%)"; q.fillRect(X(7.2), Y(4.6), S(9.1), S(0.5));
    // alberi
    ALBERI.forEach(([x, y, r]) => {
      q.fillStyle = "rgb(0 0 0 / 22%)"; q.beginPath(); q.arc(X(x + 0.35), Y(y + 0.35), S(r), 0, 7); q.fill();
      q.fillStyle = "#3f6a2f"; q.beginPath(); q.arc(X(x), Y(y), S(r), 0, 7); q.fill();
      q.fillStyle = "#5b8b3e"; q.beginPath(); q.arc(X(x - r * 0.2), Y(y - r * 0.2), S(r * 0.7), 0, 7); q.fill();
      q.fillStyle = "#7fae57"; q.beginPath(); q.arc(X(x - r * 0.35), Y(y - r * 0.35), S(r * 0.35), 0, 7); q.fill();
    });
  }

  function simboloDisabili(q, x, y, s) {
    q.save();
    q.fillStyle = "#e8c13c"; q.strokeStyle = "#e8c13c";
    q.lineWidth = Math.max(1.5, S(0.12 * s)); q.lineCap = "round";
    q.beginPath(); q.arc(X(x - 0.05 * s), Y(y - 0.55 * s), S(0.12 * s), 0, 7); q.fill();
    q.beginPath(); q.moveTo(X(x - 0.1 * s), Y(y - 0.35 * s)); q.lineTo(X(x - 0.1 * s), Y(y + 0.05 * s)); q.lineTo(X(x + 0.3 * s), Y(y + 0.05 * s)); q.lineTo(X(x + 0.42 * s), Y(y + 0.45 * s)); q.stroke();
    q.beginPath(); q.arc(X(x - 0.1 * s), Y(y + 0.25 * s), S(0.36 * s), -0.4, Math.PI * 1.25); q.stroke();
    q.restore();
  }

  function autoParcheggiata(c) {
    g.save();
    g.translate(X(c.x), Y(c.y));
    const w = S(c.w), l = S(c.l);
    g.fillStyle = "rgb(0 0 0 / 25%)"; tondo(-w / 2 + S(0.12), -l / 2 + S(0.15), w, l, S(0.45)); g.fill();
    g.fillStyle = c.colore; tondo(-w / 2, -l / 2, w, l, S(0.45)); g.fill();
    g.strokeStyle = "rgb(0 0 0 / 25%)"; g.lineWidth = Math.max(1, S(0.05)); g.stroke();
    g.fillStyle = "#2b3440"; tondo(-w / 2 + S(0.18), -l / 2 + S(0.95), w - S(0.36), S(0.75), S(0.2)); g.fill();
    tondo(-w / 2 + S(0.22), l / 2 - S(1.25), w - S(0.44), S(0.55), S(0.18)); g.fill();
    g.fillStyle = "rgb(255 255 255 / 18%)"; tondo(-w / 2 + S(0.22), -l / 2 + S(1.75), w - S(0.44), S(1.9), S(0.2)); g.fill();
    g.restore();
  }

  function tondo(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

  function disegnaAuto(c, alfa) {
    g.save();
    g.globalAlpha = alfa;
    g.translate(X(c.x), Y(c.y));
    g.rotate(c.a + Math.PI / 2);
    if (alfa === 1) { g.fillStyle = "rgb(0 0 0 / 28%)"; tondo(-S(AUTO_W) / 2 + S(0.14), -S(AUTO_L) / 2 + S(0.16), S(AUTO_W), S(AUTO_L), S(0.3)); g.fill(); }
    if (sprite.complete && sprite.naturalWidth) g.drawImage(sprite, -S(AUTO_W) / 2, -S(AUTO_L) / 2, S(AUTO_W), S(AUTO_L));
    else { g.fillStyle = "#1f6f86"; g.fillRect(-S(AUTO_W) / 2, -S(AUTO_L) / 2, S(AUTO_W), S(AUTO_L)); }
    g.restore();
  }

  let t0 = 0;
  function disegna(t) {
    if (!asfalto) fondo();
    g.drawImage(asfalto, 0, 0);
    const L = LIVELLI[lv];
    const b = DISABILI[L.obiettivo];
    // il posto da raggiungere pulsa, con la Moke "fantasma" nella posa giusta
    const pulsa = 0.5 + 0.5 * Math.sin(t / 320);
    g.strokeStyle = `rgb(255 214 90 / ${0.45 + 0.5 * pulsa})`;
    g.lineWidth = Math.max(2, S(0.14 + 0.06 * pulsa));
    g.strokeRect(X(b.x0), Y(b.y0), S(b.x1 - b.x0), S(b.y1 - b.y0));
    disegnaAuto({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 + 0.3, a: L.retro ? Math.PI / 2 : -Math.PI / 2 }, 0.16);
    parcheggiate.forEach(autoParcheggiata);
    // paletti
    PALETTI.forEach(([x, y]) => {
      g.fillStyle = "rgb(0 0 0 / 30%)"; g.beginPath(); g.arc(X(x + 0.08), Y(y + 0.08), S(0.2), 0, 7); g.fill();
      g.fillStyle = "#2d3138"; g.beginPath(); g.arc(X(x), Y(y), S(0.17), 0, 7); g.fill();
      g.fillStyle = "#6b7280"; g.beginPath(); g.arc(X(x - 0.04), Y(y - 0.04), S(0.07), 0, 7); g.fill();
    });
    disegnaAuto(auto, 1);
    // quasi fatto: il bordo diventa verde mentre si aspetta il fermo
    if (fermoDa > 0) {
      g.strokeStyle = "rgb(109 202 138 / 90%)"; g.lineWidth = Math.max(3, S(0.2));
      g.strokeRect(X(b.x0), Y(b.y0), S(b.x1 - b.x0), S(b.y1 - b.y0));
    }
    if (lampo > 0) { g.fillStyle = `rgb(224 85 85 / ${lampo})`; g.fillRect(0, 0, cv.width, cv.height); }
  }

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

  adatta();
  preparaLivello(0);
  requestAnimationFrame(ciclo);
})();

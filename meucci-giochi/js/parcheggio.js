/*
 * Parcheggia la Moke nel posto riservato del plesso Meucci, sulla vista isometrica del widget.
 *
 * Il piazzale ha coordinate a terra in metri: u lungo la facciata (verso destra), v verso chi guarda.
 * Il righello sono le strisce gialle dell'immagine: da lì escono i due vettori che portano un punto
 * a terra sui pixel del disegno (A per un metro lungo u, B per un metro lungo v). L'altezza sale di
 * ALTEZZA_PX pixel al metro. La Moke e le auto sono sprite resi in Blender (cartella blender/) con
 * una camera ortografica che guarda lungo la stessa direzione del disegno: il gioco li porta sulla
 * scena con la sola deformazione 2D che resta della proiezione, così combaciano in ogni direzione.
 */
(function () {
  "use strict";

  const O = [495, 444];                   // angolo delle strisce gialle vicino alla scuola (u=0, v=0)
  const A = [23.5577, 3.5577];            // pixel per metro lungo u
  const B = [-12.5, 8.4];                 // pixel per metro lungo v
  const ALTEZZA_PX = 30;                  // pixel per metro in altezza
  const IMG_W = 1100, IMG_H = 619;

  const LUNG = 3.4, LARG = 1.5;           // la Moke, bull bar e ruota di scorta compresi
  const PASSO = 2.03, STERZO_MAX = 0.62, V_AVANTI = 3.0, V_RETRO = 1.7;

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
  const SPRITE = {};
  Object.entries(window.VEICOLI_SPRITE).forEach(([nome, d]) => {
    SPRITE[nome] = new Image();
    SPRITE[nome].src = d.img;
  });

  /* ---------- il piazzale (metri a terra) ---------- */

  // Bordo percorribile: base dell'ala, marciapiede d'ingresso, aiuola a destra, cordolo davanti
  const BORDO = [[-2.8, -0.2], [-1.64, -1.09], [9.2, -3.06], [17.35, -4.49], [17.8, -3.25], [18.54, 2.15], [18.71, 4.46], [-1.82, 16.0], [-2.58, 15.14]];
  const DIPINTE = [[10.2, -3.9, 13.1, 1.6], [14.1, -4.3, 16.9, 1.8]];     // le due auto del disegno
  const PALETTI = [{ u: 8.13, v: 3.52, img: [642.5, 502.5, 457] }, { u: 10.55, v: 3.69, img: [697.5, 512.5, 463] }];
  const POSTI = [[0.05, 0.05, 2.65, 5.15], [2.75, 0.05, 5.15, 5.15]];    // le due metà gialle

  // Livello 4: il giro delle auto in cerca di posto. Entrano dalla strada a destra, passano davanti
  // ai posti e riescono a sinistra; l'ultimo tratto, sulla strada fuori dall'inquadratura, chiude il giro.
  const GIRO_AUTO = [[24, 12], [17.5, 7.6], [13, 7.2], [7, 7.3], [4, 8.6], [2.2, 11], [1.0, 15], [-2, 20]];
  const AUTO_L = 3.95, AUTO_W = 1.75;
  // Livello 5: gli alunni escono dalle porte a vetri e dalla porta sotto la pensilina e vanno in strada
  const PORTE = [{ u: 5.2, v: -5.2, ogni: [1.4, 2.8] }, { u: -2.6, v: -5.2, ogni: [3.0, 5.0] }];
  const R_ALUNNO = 0.25;
  const FRONTE = (u) => 4.46 + ((18.71 - u) / 20.53) * 11.54;   // v del cordolo davanti, lungo u

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
      extra: [{ u: 1.35, v: 2.7, a: -Math.PI / 2, veicolo: "auto-rossa" }],
      partenza: { u: 13.2, v: 5.3, a: Math.PI },
      suggerimento: "Il primo posto è occupato: infilati nell'altro, tra l'auto rossa e i paletti.",
      par: 24,
    },
    {
      nome: "Livello 3 · In retromarcia",
      obiettivo: 0, retro: true,
      // gli sprite delle auto sono resi solo negli angoli usati qui: se ne cambi uno, rigenera (blender/)
      extra: [{ u: -1.45, v: 9.2, a: Math.PI / 2, veicolo: "auto-bianca" }, { u: 4.2, v: 11.0, a: -0.51, veicolo: "auto-blu" }],
      partenza: { u: 9.5, v: 6.6, a: 0 },
      suggerimento: "Stavolta entra in retromarcia: la Moke deve guardare verso il piazzale.",
      par: 32,
    },
    {
      nome: "Livello 4 · L'ora di punta",
      obiettivo: 0, retro: false, extra: [],
      traffico: [{ veicolo: "auto-gialla", vel: 3.4 }, { veicolo: "auto-grigia", vel: 2.9 }, { veicolo: "auto-gialla", vel: 3.7 }],
      partenza: { u: 15.8, v: 3.3, a: Math.PI },
      suggerimento: "Le auto girano per il piazzale in cerca di posto: non tagliargli la strada. Muso verso la scuola.",
      par: 34,
    },
    {
      nome: "Livello 5 · Suona la campanella",
      obiettivo: 1, retro: true, alunni: true,
      extra: [{ u: 1.35, v: 2.7, a: -Math.PI / 2, veicolo: "auto-rossa" }],
      partenza: { u: 13.2, v: 5.3, a: Math.PI },
      suggerimento: "È l'uscita: entra in retromarcia accanto ai paletti. Se sfiori un ragazzo si ricomincia!",
      par: 45,
    },
  ];

  let lv = 0, auto, extra, rettangoli, tempo, urti, fermoDa, finito, lampo, mobili = [], alunni = [], prossimoAlunno;
  const premuti = new Set();

  function preparaLivello(i) {
    lv = i;
    const L = LIVELLI[lv];
    auto = { u: L.partenza.u, v: L.partenza.v, a: L.partenza.a, vel: 0, sterzo: 0 };
    extra = L.extra.map((e) => ({ ...e, l: 3.95, w: 1.75 }));
    rettangoli = DIPINTE.map(([u0, v0, u1, v1]) => ({ u0, v0, u1, v1 }));
    tempo = 0; urti = 0; fermoDa = 0; finito = false; lampo = 0;
    // auto in movimento distribuite lungo il giro, la prima già dentro il piazzale
    const giro = percorso();
    mobili = (L.traffico || []).map((m, i) => ({ ...m, vmax: m.vel, vel: m.vel, s: (0.18 + i / L.traffico.length) * giro.lung, attesa: 0 }));
    mobili.forEach((m) => Object.assign(m, posaSul(m.s)));
    alunni = [];
    semeAlunni = 7;
    prossimoAlunno = PORTE.map(() => 0);
    ui.prossimo.hidden = false;
    if (L.alunni) for (let k = 0; k < 90; k++) muoviAlunni(0.1);   // l'uscita è già cominciata
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
    for (const m of mobili) if (!separati(pts, spigoli(m, AUTO_L, AUTO_W))) return true;
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

  // distanza di un punto a terra dalla sagoma di un veicolo (0 se ci sta dentro)
  function distanzaDa(c, l, w, u, v) {
    const cs = Math.cos(c.a), sn = Math.sin(c.a), du = u - c.u, dv = v - c.v;
    const f = du * cs + dv * sn, r = -du * sn + dv * cs;
    return Math.hypot(Math.max(0, Math.abs(f) - l / 2), Math.max(0, Math.abs(r) - w / 2));
  }

  /* ---------- le auto che girano (livello 4) ---------- */

  // il giro smussato (tre passate di Chaikin) con le lunghezze progressive
  const percorso = () => percorso.p || (percorso.p = (() => {
    let pts = GIRO_AUTO;
    for (let k = 0; k < 3; k++) {
      pts = pts.flatMap((p, i) => {
        const q = pts[(i + 1) % pts.length];
        return [[0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]];
      });
    }
    const cum = [0];
    for (let i = 1; i <= pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i % pts.length][0] - pts[i - 1][0], pts[i % pts.length][1] - pts[i - 1][1]));
    return { pts, cum, lung: cum[pts.length] };
  })());

  function puntoSul(s) {
    const { pts, cum, lung } = percorso();
    s = ((s % lung) + lung) % lung;
    let i = 0;
    while (cum[i + 1] < s) i++;
    const t = (s - cum[i]) / (cum[i + 1] - cum[i]), p = pts[i], q = pts[(i + 1) % pts.length];
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  }

  // il centro dell'auto sta sul giro, il muso guarda il punto un po' più avanti
  function posaSul(s) {
    const [u, v] = puntoSul(s), [u2, v2] = puntoSul(s + 1.2), [u0, v0] = puntoSul(s - 1.2);
    return { u, v, a: Math.atan2(v2 - v0, u2 - u0) };
  }

  function muoviAuto(dt) {
    const sagomaMoke = spigoli(auto, LUNG + 0.2, LARG + 0.2), lung = percorso().lung;
    for (const m of mobili) {
      // guarda avanti quanto gli serve per fermarsi: se c'è la Moke o l'auto davanti, frena
      const serve = 0.5 + (m.vel * m.vel) / (2 * 6);
      let ostacolo = null;
      for (let d = 0.3; d <= serve + 0.01 && !ostacolo; d += 0.3) {
        const sag = spigoli(posaSul(m.s + d), AUTO_L, AUTO_W);
        if (!separati(sag, sagomaMoke)) ostacolo = "moke";
        else if (mobili.some((o) => o !== m && (((o.s - m.s) % lung) + lung) % lung < 8 && !separati(sag, spigoli(o, AUTO_L, AUTO_W)))) ostacolo = "auto";
      }
      const vuoi = ostacolo ? 0 : m.vmax;
      m.vel += Math.max(-7 * dt, Math.min(2.4 * dt, vuoi - m.vel));
      const dopo = posaSul(m.s + m.vel * dt);
      if (!separati(spigoli(dopo, AUTO_L, AUTO_W), spigoli(auto, LUNG, LARG))) {
        // la Moke gli è sbucata davanti troppo vicino: tamponamento
        if (m.vel > 0.8) colpo();
        m.vel = 0;
      } else {
        m.s += m.vel * dt;
        Object.assign(m, dopo);
      }
      m.attesa = ostacolo === "moke" && m.vel < 0.3 ? m.attesa + dt : 0;
    }
  }

  /* ---------- gli alunni che escono (livello 5) ---------- */

  let semeAlunni = 7;
  const caso = () => (semeAlunni = (semeAlunni * 16807) % 2147483647) / 2147483647;
  const tra = ([a, b]) => a + (b - a) * caso();

  function nuovoAlunno(porta) {
    const P0 = PORTE[porta];
    const dest = porta === 0 ? tra([4.5, 13]) : tra([2.5, 7]);
    const tappe = porta === 0
      ? [[tra([5.8, 7.6]), -2.1]]
      : [[-1.5, -1.3], [tra([-1.2, -0.6]), tra([4.5, 7.5])]];
    tappe.push([dest, FRONTE(dest) + 5.5]);
    alunni.push({
      u: P0.u + tra([-0.4, 0.4]), v: P0.v, a: Math.PI / 2, tappe, vel: tra([1.05, 1.45]),
      veicolo: "alunno-" + "abcd"[Math.floor(caso() * 4)], strada: 0, fermo: true, comparsa: 0,
    });
  }

  // un punto dove un alunno può stare: fuori dalla Moke (con un passo di margine) e dalle auto ferme
  function libero(u, v) {
    if (distanzaDa(auto, LUNG, LARG, u, v) < R_ALUNNO + 0.35) return false;
    for (const e of extra) if (distanzaDa(e, e.l, e.w, u, v) < R_ALUNNO + 0.1) return false;
    for (const r of rettangoli) if (u > r.u0 - R_ALUNNO && u < r.u1 + R_ALUNNO && v > r.v0 - R_ALUNNO && v < r.v1 + R_ALUNNO) return false;
    return true;
  }

  function muoviAlunni(dt) {
    PORTE.forEach((p, i) => {
      prossimoAlunno[i] -= dt;
      if (prossimoAlunno[i] <= 0 && alunni.length < 18) { nuovoAlunno(i); prossimoAlunno[i] = tra(p.ogni); }
    });
    for (const al of alunni) {
      al.comparsa = Math.min(1, al.comparsa + dt * 3);
      const [tu, tv] = al.tappe[0];
      if (Math.hypot(tu - al.u, tv - al.v) < 0.5 && al.tappe.length > 1) al.tappe.shift();
      const dir = Math.atan2(al.tappe[0][1] - al.v, al.tappe[0][0] - al.u);
      // dritti verso la tappa; se c'è la Moke di mezzo la aggirano, e se non si passa aspettano
      al.fermo = true;
      for (const dx of [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5, 2.3, -2.3]) {
        const a = dir + dx, cu = Math.cos(a), cv = Math.sin(a);
        if (libero(al.u + cu * 0.6, al.v + cv * 0.6) && libero(al.u + cu * al.vel * dt, al.v + cv * al.vel * dt)) {
          al.u += cu * al.vel * dt; al.v += cv * al.vel * dt;
          al.a = a; al.strada += al.vel * dt; al.fermo = false;
          break;
        }
      }
    }
    alunni = alunni.filter((al) => al.tappe.length > 1 || al.v < al.tappe[0][1] - 0.3);
  }

  function colpo() {
    urti++; lampo = 0.35;
    try { navigator.vibrate && navigator.vibrate(60); } catch (e) { /* facoltativo */ }
  }

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
      if (Math.abs(auto.vel) > 0.25) colpo();
      auto.vel = -auto.vel * 0.25;
    }
    // chi sfiora un alunno con la Moke in movimento ricomincia il livello
    if (Math.abs(auto.vel) > 0.05 && alunni.some((al) => distanzaDa(auto, LUNG, LARG, al.u, al.v) < R_ALUNNO)) {
      lampo = 0.5;
      try { navigator.vibrate && navigator.vibrate([80, 60, 80]); } catch (e) { /* facoltativo */ }
      return sconfitta();
    }
    if (mobili.length) muoviAuto(dt);
    if (LIVELLI[lv].alunni) muoviAlunni(dt);

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

  function sconfitta() {
    finito = true;
    ui.stelle.textContent = "✋";
    ui.titolo.textContent = "Attento ai ragazzi!";
    ui.testo.textContent = "Hai sfiorato un alunno che usciva da scuola. Vai piano, aspetta che passino e riprova.";
    ui.prossimo.hidden = true;
    premuti.clear();
    ui.esito.hidden = false;
  }

  ui.riprova.addEventListener("click", () => preparaLivello(lv));
  ui.prossimo.addEventListener("click", () => preparaLivello((lv + 1) % LIVELLI.length));

  /* ---------- proiezione ---------- */

  // punto a terra (u, v) alla quota z (metri) → pixel dell'immagine
  const P = (u, v, z = 0) => [O[0] + u * A[0] + v * B[0], O[1] + u * A[1] + v * B[1] - z * ALTEZZA_PX];
  const poligono = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };

  /*
   * Veicoli: sprite resi in Blender con una camera ortografica che guarda lungo la direzione del disegno
   * (il nucleo della proiezione P). Quel che resta di P è una trasformazione 2D, W_ORTO, che porta i metri
   * dell'immagine ortografica (x a destra, y in basso) sui pixel del disegno. Le stesse direzioni sono
   * scritte in blender/veicoli.py: se cambi A, B o ALTEZZA_PX, gli sprite vanno rigenerati.
   */
  const W_ORTO = (() => {
    const px = [A[0], B[0], 0], py = [A[1], B[1], -ALTEZZA_PX];
    const croce = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const scal = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const unit = (a) => { const n = Math.hypot(...a); return a.map((x) => x / n); };
    let d = unit(croce(px, py));
    if (d[2] < 0) d = d.map((x) => -x);                     // verso chi guarda, dall'alto
    let e1 = unit(croce([0, 0, 1], d));
    if (scal(px, e1) < 0) e1 = e1.map((x) => -x);           // asse x dell'immagine: verso destra
    let e2 = croce(d, e1);
    if (e2[2] < 0) e2 = e2.map((x) => -x);                  // asse y dell'immagine: in alto
    const giu = e2.map((x) => -x);
    return [scal(px, e1), scal(py, e1), scal(px, giu), scal(py, giu)];
  })();

  function disegnaVeicolo(nome, c, posa = 0) {
    const d = window.VEICOLI_SPRITE[nome];
    // il fotogramma reso con l'angolo più vicino (e, per chi cammina, nella posa del passo)
    let k = 0, meglio = Infinity;
    d.angoli.forEach((a, i) => { const s = Math.abs(angolo(c.a - a)); if (s < meglio) { meglio = s; k = i; } });
    const [x, y, w, h, ox, oy] = d.fotogrammi[k * (d.pose || 1) + posa];
    const [sx, sy] = P(c.u, c.v);
    const s = 1 / d.pxm;
    g.save();
    g.transform(W_ORTO[0] * s, W_ORTO[1] * s, W_ORTO[2] * s, W_ORTO[3] * s, sx, sy);
    g.imageSmoothingQuality = "high";
    g.drawImage(SPRITE[nome], x, y, w, h, -ox, -oy, w, h);
    g.restore();
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
    const cose = [{ prof: P(auto.u, auto.v)[1], fai: () => disegnaVeicolo("moke", auto) }];
    extra.forEach((e) => cose.push({ prof: P(e.u, e.v)[1], fai: () => disegnaVeicolo(e.veicolo, e) }));
    mobili.forEach((m) => cose.push({ prof: P(m.u, m.v)[1], fai: () => disegnaVeicolo(m.veicolo, m) }));
    alunni.forEach((al) => cose.push({
      prof: P(al.u, al.v)[1],
      fai: () => {
        // passo: gambe unite, sinistra avanti, unite, destra avanti; fermo a gambe unite
        const posa = al.fermo ? 0 : [0, 1, 0, 2][Math.floor(al.strada / 0.34) % 4];
        g.globalAlpha = al.comparsa;
        disegnaVeicolo(al.veicolo, al, posa);
        g.globalAlpha = 1;
      },
    }));
    ritagli.forEach((r) => cose.push({ prof: r.prof, fai: () => g.drawImage(r.c, r.x0, r.y0), paletto: true }));
    cose.sort((a, b) => a.prof - b.prof);
    // i paletti che stanno dietro sono già nel disegno: si ridisegnano solo se qualcosa gli passa dietro
    let dietro = false;
    cose.forEach((x) => { if (!x.paletto) { x.fai(); dietro = true; } else if (dietro) x.fai(); });

    // chi aspetta la Moke suona il clacson
    mobili.forEach((m) => {
      if (m.attesa < 0.5 || Math.floor(m.attesa * 2.5) % 2) return;
      const [x, y] = P(m.u, m.v, 2.1);
      g.font = "800 10px 'DM Sans', sans-serif";
      const w = g.measureText("Biip!").width + 10;
      g.fillStyle = "rgb(255 255 255 / 92%)";
      g.beginPath(); g.roundRect(x - w / 2, y - 16, w, 15, 6); g.fill();
      g.fillStyle = "#c0392b"; g.textAlign = "center"; g.fillText("Biip!", x, y - 5);
    });

    g.setTransform(1, 0, 0, 1, 0, 0);
    if (lampo > 0) { g.fillStyle = `rgb(224 85 85 / ${lampo})`; g.fillRect(0, 0, W, H); }
  }

  let t0 = 0;
  function ciclo(t) {
    const dt = t0 ? Math.min(0.05, (t - t0) / 1000) : 0;
    t0 = t;
    passo(dt);
    if (lampo > 0) lampo -= dt;   // qui, perché a partita finita la simulazione si ferma
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
    livello: (i) => preparaLivello(i),
    mondo: () => ({ mobili: mobili.map((m) => ({ u: m.u, v: m.v, a: m.a, vel: m.vel })), alunni: alunni.map((a) => ({ u: a.u, v: a.v, fermo: a.fermo })) }),
  };

  function parti() {
    preparaRitagli();
    adatta();
    preparaLivello(0);
    const [mx, my] = P(auto.u, auto.v);
    camX = mx; camY = my;
    requestAnimationFrame(ciclo);
  }
  // si parte quando il piazzale e tutti gli sprite sono caricati
  const pronta = (im) => new Promise((ok) => {
    if (im.complete && im.naturalWidth) ok();
    else { im.addEventListener("load", ok, { once: true }); im.addEventListener("error", ok, { once: true }); }
  });
  Promise.all([scena, ...Object.values(SPRITE)].map(pronta)).then(parti);
})();

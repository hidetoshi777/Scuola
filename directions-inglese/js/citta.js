/* =========================================================
   Greenford: la città del gioco (pianta in js/pianta.js).
   Strade a griglia 3×3 incroci (i, j = 0..2) più Station Road che
   scende fino alla stazione (punto S, omino rivolto a nord).
   Ogni edificio si affaccia su uno o più tratti di strada:
   - la strada a SUD del suo isolato (la facciata);
   - la strada a OVEST se è il primo della fila, a EST se è l'ultimo;
   - per l'isolato in basso (riga 3), King Street e Station Road.
   «It's on the left/right» = edifici affacciati sull'ULTIMO tratto
   percorso, da quel lato (il posto che vedi mentre cammini).
   Sulla mappa NON ci sono i nomi dei posti (decisione del Prof.: troppo facile):
   il nome compare solo come conferma, su un posto trovato o toccato per sbaglio.
   ========================================================= */
(function () {
  const PI = window.PIANTA;
  const X = PI.X, Y = PI.Y;
  const S = { x: PI.S[0], y: PI.S[1] };
  const COL = PI.COL, RIG = PI.RIG;

  /* edificio -> { c, r, k, n } */
  const EDIFICI = {};
  Object.entries(PI.isolati).forEach(([cr, ids]) => {
    const [c, r] = cr.split(",").map(Number);
    ids.forEach((id, k) => { EDIFICI[id] = { c, r, k, n: ids.length }; });
  });

  /* tratti di strada: "v<i>r<r>" verticale (fra Y[r-1] e Y[r]; r = 3 è il tratto della stazione),
     "h<j>c<c>" orizzontale (fra X[c-1] e X[c]) */
  function tratti(id) {
    const { c, r, k, n } = EDIFICI[id];
    const t = [];
    const interna = c >= 1 && c <= 2;
    if (r <= 2 && interna) t.push(`h${r}c${c}`);
    if (r === 3 && interna) t.push(`h2c${c}`);
    const righeV = r >= 1 && r <= 2;
    if (k === 0 && c >= 1 && (righeV || (r === 3 && c === 2))) t.push(`v${c - 1}r${r}`);
    if (k === n - 1 && c <= 2 && (righeV || (r === 3 && c === 1))) t.push(`v${c}r${r}`);
    return t;
  }
  const TRATTI = {};
  Object.keys(EDIFICI).forEach((id) => { TRATTI[id] = tratti(id); });

  /* Le indicazioni dei livelli 2 e 3: mosse attese + lato finale (verificati per simulazione).
     F = vai dritto fino all'incrocio, L/R = gira e cammina fino all'incrocio dopo. */
  const PUZZLE = [
    { id: "hotel", mosse: "F", lato: "left", liv: 1 },
    { id: "bakery", mosse: "FF", lato: "left", liv: 1 },
    { id: "pharmacy", mosse: "FF", lato: "right", liv: 1 },
    { id: "supermarket", mosse: "FL", lato: "right", liv: 1 },
    { id: "restaurant", mosse: "FR", lato: "left", liv: 1 },
    { id: "library", mosse: "FFF", lato: "left", liv: 2 },
    { id: "bank", mosse: "FFF", lato: "right", liv: 2 },
    { id: "cafe", mosse: "FFR", lato: "left", liv: 2 },
    { id: "cinema", mosse: "FFR", lato: "left", liv: 2 },
    { id: "church", mosse: "FFL", lato: "right", liv: 2 },
    { id: "police", mosse: "FFRL", lato: "right", liv: 3 },
    { id: "postoffice", mosse: "FLR", lato: "left", liv: 3 },
    { id: "hospital", mosse: "FFLR", lato: "left", liv: 3 },
    { id: "school", mosse: "FFFL", lato: "right", liv: 3 },
    { id: "park", mosse: "FFFR", lato: "left", liv: 3 },
  ];

  const DIR = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const SX = { N: "W", W: "S", S: "E", E: "N" };
  const DX = { N: "E", E: "S", S: "W", W: "N" };
  const ANGOLO = { N: 0, E: 90, S: 180, W: 270 };

  const punto = (p) => (p === "S" ? S : { x: X[p[0]], y: Y[p[1]] });

  function passo(st, m) {
    const dir = m === "F" ? st.dir : m === "L" ? SX[st.dir] : DX[st.dir];
    let to = null;
    if (st.pos === "S") {
      if (dir === "N") to = [1, 2];
    } else {
      const [i, j] = st.pos;
      if (i === 1 && j === 2 && dir === "S") to = "S";
      else {
        const ni = i + DIR[dir][0], nj = j + DIR[dir][1];
        if (ni >= 0 && ni <= 2 && nj >= 0 && nj <= 2) to = [ni, nj];
      }
    }
    if (!to) return null;
    return { pos: to, dir, ultimo: { a: st.pos, b: to, dir } };
  }

  /* Gli edifici a sinistra o a destra dell'ultimo tratto percorso (elenco). */
  function postiAlLato(seg, lato) {
    if (!seg) return [];
    const a = seg.a === "S" ? [1, 3] : seg.a, b = seg.b === "S" ? [1, 3] : seg.b;
    if (a[0] === b[0]) {
      const i = a[0], r = Math.max(a[1], b[1]);
      const chiave = `v${i}r${r}`;
      const [sx, dx] = seg.dir === "N" ? [i, i + 1] : [i + 1, i];
      return Object.keys(EDIFICI).filter((id) => TRATTI[id].includes(chiave) && EDIFICI[id].c === (lato === "left" ? sx : dx));
    }
    const j = a[1], c = Math.max(a[0], b[0]);
    const chiave = `h${j}c${c}`;
    const [sx, dx] = seg.dir === "E" ? [j, j + 1] : [j + 1, j];
    return Object.keys(EDIFICI).filter((id) => TRATTI[id].includes(chiave) && EDIFICI[id].r === (lato === "left" ? sx : dx));
  }

  function simula(mosse, lato) {
    let st = { pos: "S", dir: "N", ultimo: null };
    const passi = [];
    for (let k = 0; k < mosse.length; k += 1) {
      const nuovo = passo(st, mosse[k]);
      if (!nuovo) return { ok: false, err: "noroad", passo: k, passi };
      st = nuovo;
      passi.push(st);
    }
    if (!st.ultimo) return { ok: false, err: "nomove", passi };
    return { ok: true, posti: lato ? postiAlLato(st.ultimo, lato) : [], passi, stato: st };
  }

  function percorsoMinimo(target) {
    const coda = [{ st: { pos: "S", dir: "N", ultimo: null }, m: "" }];
    const visti = new Set();
    while (coda.length) {
      const { st, m } = coda.shift();
      if (st.ultimo) {
        for (const lato of ["left", "right"]) if (postiAlLato(st.ultimo, lato).includes(target)) return { mosse: m, lato };
      }
      if (m.length > 6) continue;
      for (const mv of "FLR") {
        const n = passo(st, mv);
        if (!n) continue;
        const k = JSON.stringify([n.pos, n.dir]);
        if (visti.has(k)) continue;
        visti.add(k);
        coda.push({ st: n, m: m + mv });
      }
    }
    return null;
  }

  /* ---------------- Disegno ----------------
     Sfondo = render 3D di Blender (img/citta.jpg, da _blender_citta.py).
     Sopra, in SVG: nomi delle vie, zone cliccabili, scia, omino. */
  const PR = window.CITTA_PROIEZIONE || { w: 720, h: 620, ox: 10, oy: 44, ax: 1, ay: 0.7071, az: -70.71 };
  const P = (x, y, z) => ({ x: PR.ox + PR.ax * x, y: PR.oy + PR.ay * y + PR.az * (z || 0) });
  const DIRS = ["N", "E", "S", "W"];
  const SPRITE = 96;
  const PIEDI = 0.741;
  const BASE = () => window.ICONE_BASE || "";

  /* dove scrivere il nome di ogni via: un tratto per via, lontano dai semafori */
  const VIE_ETICHETTE = [
    { k: "h0", x: (X[0] + X[1]) / 2, y: Y[0] },
    { k: "h1", x: (X[1] + X[2]) / 2 - 20, y: Y[1] },
    { k: "h2", x: (X[0] + X[1]) / 2 - 10, y: Y[2] },
    { k: "v0", x: X[0], y: (Y[1] + Y[2]) / 2 },
    { k: "v1", x: X[1], y: (Y[0] + Y[1]) / 2 },
    { k: "v2", x: X[2], y: (Y[1] + Y[2]) / 2 + 10 },
  ];

  function vie() {
    return VIE_ETICHETTE.map((v) => {
      const p = P(v.x, v.y);
      const rot = v.vert || v.k[0] === "v" ? ` transform="rotate(-90 ${p.x} ${p.y})"` : "";
      return `<text class="via" x="${p.x}" y="${p.y + 6}" text-anchor="middle"${rot}>${PI.vie[v.k]}</text>`;
    }).join("");
  }

  function zone() {
    let s = "";
    Object.entries(EDIFICI).forEach(([id, { c, r, k, n }]) => {
      const p = window.POSTO(id);
      const larg = (COL[c][1] - COL[c][0]) / n;
      const x0 = COL[c][0] + larg * k, x1 = x0 + larg;
      const a = P(x0, RIG[r][0]), b = P(x1, RIG[r][1]);
      const top = r === 0 ? 4 : a.y - 2;
      const cx = (a.x + b.x) / 2;
      const ly = a.y + 16;
      const lt = Math.max(56, p.en.length * 10.6 + 16);
      s += `<g class="posto" data-posto="${id}" tabindex="0" role="button" aria-label="Edificio">
        <rect class="zona" x="${a.x + 2}" y="${top}" width="${b.x - a.x - 4}" height="${b.y - top}" rx="8"/>
        <g class="nome">
          <rect class="targa" x="${cx - lt / 2}" y="${ly - 13}" width="${lt}" height="25" rx="7"/>
          <text class="en" x="${cx}" y="${ly + 5}" text-anchor="middle">${p.en}</text>
        </g>
      </g>`;
    });
    return s;
  }

  function omino() {
    return `<g class="omino" id="omino">
      <polygon class="freccia" points="0,0 0,0 0,0"/>
      <g class="aiuto-lati">
        <g class="tag-lato tag-left"><rect x="-30" y="-13" width="60" height="24" rx="12"/><text y="5" text-anchor="middle">left</text></g>
        <g class="tag-lato tag-right"><rect x="-33" y="-13" width="66" height="24" rx="12"/><text y="5" text-anchor="middle">right</text></g>
      </g>
      <image class="sprite" href="${BASE()}img/omino-N.webp" width="${SPRITE}" height="${SPRITE}"/>
      <g class="qui"><rect x="-58" y="${-SPRITE * PIEDI - 26}" width="116" height="22" rx="11"/><text y="${-SPRITE * PIEDI - 10}" text-anchor="middle">YOU ARE HERE</text></g>
    </g>`;
  }

  /* ---------------- Traffico: solo decorazione ----------------
     Macchine e treno sono sprite di Blender (img/veicoli/). Si guida a SINISTRA (città inglese).
     Ogni giro passa per incroci adiacenti; ai semafori ogni tanto la macchina si ferma. */
  const CORSIA = 11;
  const AUTO_LATO = 52;                     /* lato dello sprite (0,5 m) */
  const TRENO = { w: 190, h: 50, y: 798, vel: 24, attesa: 5 };
  const GIRI = [
    { col: "rossa", vel: 30, parte: 0.0, nodi: [[0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2]] },
    { col: "bianca", vel: 24, parte: 0.45, nodi: [[2, 2], [2, 1], [2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [1, 2]] },
    { col: "blu", vel: 26, parte: 0.2, nodi: [[1, 1], [2, 1], [2, 0], [1, 0]] },
    { col: "gialla", vel: 27, parte: 0.7, nodi: [[0, 1], [1, 1], [1, 2], [0, 2]] },
  ];
  const SEM = new Set(PI.semafori.map((s) => s.join(",")));

  function percorsoAuto(nodi) {
    const n = nodi.length;
    const dir = (a, b) => [Math.sign(X[b[0]] - X[a[0]]), Math.sign(Y[b[1]] - Y[a[1]])];
    const pts = nodi.map((nd, k) => {
      const din = dir(nodi[(k - 1 + n) % n], nd), dout = dir(nd, nodi[(k + 1) % n]);
      const nin = [din[1], -din[0]], nout = [dout[1], -dout[0]];
      const dritto = din[0] === dout[0] && din[1] === dout[1];
      const ox = dritto ? nin[0] : nin[0] + nout[0], oy = dritto ? nin[1] : nin[1] + nout[1];
      return { x: X[nd[0]] + ox * CORSIA, y: Y[nd[1]] + oy * CORSIA, sem: SEM.has(nd.join(",")), jx: X[nd[0]], jy: Y[nd[1]] };
    });
    const segs = pts.map((p, k) => {
      const q = pts[(k + 1) % n];
      const dx = q.x - p.x, dy = q.y - p.y;
      const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "E" : "W") : (dy > 0 ? "S" : "N");
      return { p, q, len: Math.hypot(dx, dy), d };
    });
    return segs;
  }

  function avviaTraffico(svg, animato) {
    const strato = svg.querySelector(".traffico");
    const auto = GIRI.map((g) => {
      const segs = percorsoAuto(g.nodi);
      const tot = segs.reduce((s, x) => s + x.len, 0);
      let k = 0, t = g.parte * tot;
      while (t >= segs[k].len) { t -= segs[k].len; k = (k + 1) % segs.length; }
      const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
      img.setAttribute("width", AUTO_LATO);
      img.setAttribute("height", AUTO_LATO);
      strato.appendChild(img);
      return { g, segs, k, t, pausa: 0, img, dir: "" };
    });
    const treno = document.createElementNS("http://www.w3.org/2000/svg", "image");
    treno.setAttribute("href", `${BASE()}img/veicoli/treno.webp`);
    treno.setAttribute("width", TRENO.w);
    treno.setAttribute("height", TRENO.h);
    strato.appendChild(treno);
    let tx = 120, tAttesa = 0;

    const posAuto = (a) => {
      const s = a.segs[a.k];
      const f = s.len ? a.t / s.len : 0;
      return { x: s.p.x + (s.q.x - s.p.x) * f, y: s.p.y + (s.q.y - s.p.y) * f, d: s.d };
    };
    const VERSO = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
    /* c'è un'altra macchina davanti, nella stessa direzione, troppo vicina? */
    const bloccata = (a) => {
      const me = posAuto(a), v = VERSO[me.d];
      return auto.some((b) => {
        if (b === a) return false;
        const o = posAuto(b);
        if (o.d !== me.d) return false;
        const dx = o.x - me.x, dy = o.y - me.y;
        const avanti = dx * v[0] + dy * v[1], lato = Math.abs(dx * v[1] - dy * v[0]);
        return avanti > 0 && avanti < 58 && lato < 8;
      }) || incrocioOccupato(a, me);
    };
    /* un incrocio alla volta: chi arriva aspetta che sia libero.
       Gli incroci distano 190+ unità e la zona è 40: nessuno può tenerne due, quindi niente stalli. */
    const ZONA = 40;
    const occupante = new Map();
    const incrocioOccupato = (a, me) => {
      occupante.forEach((chi, chiave) => {
        if (chi !== a) return;
        const [jx, jy] = chiave.split(",").map(Number);
        if (Math.hypot(jx - me.x, jy - me.y) > ZONA) occupante.delete(chiave);
      });
      const q = a.segs[a.k].q;
      if (Math.hypot(q.jx - me.x, q.jy - me.y) > ZONA) return false;
      const chiave = q.jx + "," + q.jy;
      const chi = occupante.get(chiave);
      if (chi && chi !== a) return true;
      occupante.set(chiave, a);
      return false;
    };
    const disegnaAuto = (a) => {
      const s = a.segs[a.k];
      const f = s.len ? a.t / s.len : 0;
      const p = P(s.p.x + (s.q.x - s.p.x) * f, s.p.y + (s.q.y - s.p.y) * f, 0.1);
      if (a.dir !== s.d) { a.img.setAttribute("href", `${BASE()}img/veicoli/auto-${a.g.col}-${s.d}.webp`); a.dir = s.d; }
      a.img.setAttribute("x", p.x - AUTO_LATO / 2);
      a.img.setAttribute("y", p.y - AUTO_LATO / 2);
    };
    const disegnaTreno = () => {
      const p = P(tx, TRENO.y, 0.12);
      treno.setAttribute("x", p.x - TRENO.w / 2);
      treno.setAttribute("y", p.y - TRENO.h / 2);
    };
    auto.forEach(disegnaAuto);
    disegnaTreno();
    if (!animato) return;

    let prima = performance.now();
    const tick = (ora) => {
      if (!svg.isConnected) return;
      const dt = Math.min(0.1, (ora - prima) / 1000);
      prima = ora;
      auto.forEach((a) => {
        if (a.pausa > 0) { a.pausa -= dt; return; }
        if (bloccata(a)) return;
        a.t += a.g.vel * dt;
        while (a.t >= a.segs[a.k].len) {
          a.t -= a.segs[a.k].len;
          a.k = (a.k + 1) % a.segs.length;
          if (a.segs[a.k].p.sem && Math.random() < 0.5) { a.pausa = 1.4 + Math.random(); a.t = 0; break; }
        }
        disegnaAuto(a);
      });
      if (tAttesa > 0) tAttesa -= dt;
      else {
        tx += TRENO.vel * dt;
        if (tx > PR.w + TRENO.w) { tx = -TRENO.w; tAttesa = TRENO.attesa; }
      }
      disegnaTreno();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function crea(contenitore, opzioni) {
    const opt = Object.assign({ aiuto: true, onPosto: null, traffico: true }, opzioni || {});
    contenitore.innerHTML = `<svg class="mappa senza-nomi" viewBox="0 0 ${PR.w} ${PR.h}" role="img" aria-label="Mappa della città di Greenford">
      <image href="${BASE()}img/citta.jpg" x="0" y="0" width="${PR.w}" height="${PR.h}" preserveAspectRatio="none"/>
      <g class="traffico" aria-hidden="true"></g>
      <g class="vie">${vie()}</g>
      <g class="scia" id="scia"></g>
      ${zone()}
      ${omino()}
    </svg>`;
    const svg = contenitore.querySelector("svg");
    const om = svg.querySelector("#omino");
    const sprite = om.querySelector(".sprite");
    const freccia = om.querySelector(".freccia");
    const scia = svg.querySelector("#scia");
    let st = { pos: "S", dir: "N", ultimo: null };
    let xy = { ...S };
    let ang = 0;
    let passoAnim = 0;

    DIRS.forEach((d) => { const i = new Image(); i.src = `${BASE()}img/omino-${d}.webp`; });

    const disegna = () => {
      const p = P(xy.x, xy.y);
      const salto = passoAnim ? Math.abs(Math.sin(passoAnim)) * 5 : 0;
      om.setAttribute("transform", `translate(${p.x} ${p.y})`);
      const posa = DIRS[((Math.round(ang / 90) % 4) + 4) % 4];
      if (sprite.dataset.posa !== posa) { sprite.setAttribute("href", `${BASE()}img/omino-${posa}.webp`); sprite.dataset.posa = posa; }
      sprite.setAttribute("x", -SPRITE / 2);
      sprite.setAttribute("y", -SPRITE * PIEDI - salto);
      const rad = (ang * Math.PI) / 180;
      const avanti = { x: Math.sin(rad), y: -Math.cos(rad) }, lato = { x: Math.cos(rad), y: Math.sin(rad) };
      const pt = (f, l) => { const q = P(xy.x + avanti.x * f + lato.x * l, xy.y + avanti.y * f + lato.y * l); return `${q.x - p.x},${q.y - p.y}`; };
      freccia.setAttribute("points", `${pt(58, 0)} ${pt(36, 16)} ${pt(36, -16)}`);
      const sx = -Math.cos(rad), sy = -Math.sin(rad);
      const q1 = P(xy.x + sx * 64, xy.y + sy * 64, 0.28), q2 = P(xy.x - sx * 64, xy.y - sy * 64, 0.28);
      om.querySelector(".tag-left").setAttribute("transform", `translate(${q1.x - p.x} ${q1.y - p.y})`);
      om.querySelector(".tag-right").setAttribute("transform", `translate(${q2.x - p.x} ${q2.y - p.y})`);
    };
    disegna();

    svg.classList.toggle("senza-aiuto", !opt.aiuto);
    avviaTraffico(svg, opt.traffico && !document.body.classList.contains("reduced-motion"));

    svg.querySelectorAll(".posto").forEach((g) => {
      const scegli = () => opt.onPosto && opt.onPosto(g.dataset.posto, g);
      g.addEventListener("click", scegli);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); scegli(); } });
    });

    const veloce = () => document.body.classList.contains("reduced-motion");

    function anima(da, a, ang0, ang1, ms) {
      return new Promise((resolve) => {
        if (veloce()) { xy = { ...a }; ang = ang1; passoAnim = 0; disegna(); resolve(); return; }
        let d = ang1 - ang0;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        const t0 = performance.now();
        const rot = d === 0 ? 0 : 0.25;
        const muove = da.x !== a.x || da.y !== a.y;
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          if (k < rot) {
            ang = ang0 + d * (k / rot);
            xy = { ...da };
            passoAnim = 0;
          } else {
            ang = ang0 + d;
            const q = (k - rot) / (1 - rot);
            const e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
            xy = { x: da.x + (a.x - da.x) * e, y: da.y + (a.y - da.y) * e };
            passoAnim = muove && k < 1 ? q * Math.PI * 6 : 0;
          }
          disegna();
          if (k < 1) requestAnimationFrame(tick);
          else { passoAnim = 0; disegna(); resolve(); }
        };
        requestAnimationFrame(tick);
      });
    }

    const api = {
      get stato() { return st; },
      reset() {
        st = { pos: "S", dir: "N", ultimo: null };
        xy = { ...S }; ang = 0; passoAnim = 0;
        scia.innerHTML = "";
        svg.classList.remove("in-cammino");
        svg.querySelectorAll(".posto").forEach((g) => g.classList.remove("giusto", "sbagliato", "trovato", "meta", "lampeggia"));
        disegna();
      },
      async muovi(m) {
        const n = passo(st, m);
        if (!n) { await api.trema(); return { ok: false, err: "noroad" }; }
        const da = punto(st.pos), a = punto(n.pos);
        const p1 = P(da.x, da.y), p2 = P(a.x, a.y);
        scia.insertAdjacentHTML("beforeend", `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"/>`);
        svg.classList.add("in-cammino");
        await anima(da, a, ang, ANGOLO[n.dir], 1000);
        st = n;
        return { ok: true };
      },
      trema() {
        return new Promise((r) => {
          om.classList.remove("trema");
          void om.getBBox();
          om.classList.add("trema");
          setTimeout(() => { om.classList.remove("trema"); r(); }, 520);
        });
      },
      postiAlLato(lato) { return postiAlLato(st.ultimo, lato); },
      evidenzia(id, cls) {
        const g = svg.querySelector(`.posto[data-posto="${id}"]`);
        if (g) g.classList.add(cls);
        return g;
      },
      togli(id, cls) {
        const g = svg.querySelector(`.posto[data-posto="${id}"]`);
        if (g) g.classList.remove(cls);
      },
      nomi() { /* i nomi dei posti non si mostrano mai: compaiono solo su trovato/sbagliato/giusto */ },
      aiuto(v) { svg.classList.toggle("senza-aiuto", !v); },
      svg,
    };
    return api;
  }

  window.CITTA = { crea, simula, percorsoMinimo, postiAlLato, PUZZLE, EDIFICI, TRATTI, passo };
})();

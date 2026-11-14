/* =========================================================
   Greenford: la città del gioco.
   Strade a griglia 3×3 incroci (i, j = 0..2) più un tratto in basso
   che parte dalla stazione (punto S, omino rivolto a nord).
   I posti stanno negli «isolati» (colonna c 0..3, riga r 0..3).
   Regola per «It's on the left/right»: conta il lato dell'ULTIMO
   tratto di strada percorso (il posto che vedi mentre cammini).
   ========================================================= */
(function () {
  const X = [152, 350, 548];
  const Y = [150, 350, 550];
  const S = { x: 350, y: 668 };
  const W = 700, H = 800, STRADA = 46;

  const COL = [[6, 126], [176, 326], [374, 524], [574, 694]];
  const RIG = [[6, 124], [176, 326], [374, 524], [576, 690]];

  /* posto -> isolato [c, r] */
  const POSTI_MAPPA = {
    school: [1, 0], park: [2, 0],
    hospital: [0, 1], church: [1, 1], bank: [2, 1], cinema: [3, 1],
    postoffice: [0, 2], supermarket: [1, 2], pharmacy: [2, 2], restaurant: [3, 2],
    cafe: [1, 3], hotel: [2, 3],
  };
  const AREA_POSTO = {};
  Object.entries(POSTI_MAPPA).forEach(([id, [c, r]]) => { AREA_POSTO[c + "," + r] = id; });

  /* Le indicazioni dei livello 2: mosse attese + lato finale.
     F = Go straight on (fino all'incrocio), L/R = gira e cammina fino all'incrocio dopo. */
  const PUZZLE = [
    { id: "cafe", mosse: "F", lato: "left", liv: 1 },
    { id: "hotel", mosse: "F", lato: "right", liv: 1 },
    { id: "supermarket", mosse: "FL", lato: "right", liv: 1 },
    { id: "pharmacy", mosse: "FR", lato: "left", liv: 1 },
    { id: "church", mosse: "FFF", lato: "left", liv: 2 },
    { id: "bank", mosse: "FFR", lato: "left", liv: 2 },
    { id: "postoffice", mosse: "FLR", lato: "left", liv: 2 },
    { id: "restaurant", mosse: "FRL", lato: "right", liv: 2 },
    { id: "hospital", mosse: "FFLR", lato: "left", liv: 3 },
    { id: "cinema", mosse: "FFRL", lato: "right", liv: 3 },
    { id: "school", mosse: "FFFL", lato: "right", liv: 3 },
    { id: "park", mosse: "FFFR", lato: "left", liv: 3 },
  ];

  const DIR = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const SX = { N: "W", W: "S", S: "E", E: "N" };
  const DX = { N: "E", E: "S", S: "W", W: "N" };
  const ANGOLO = { N: 0, E: 90, S: 180, W: 270 };

  const punto = (p) => (p === "S" ? S : { x: X[p[0]], y: Y[p[1]] });

  /* Un passo. Ritorna il nuovo stato oppure null se lì non c'è strada. */
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

  /* Il posto a sinistra o a destra dell'ultimo tratto percorso. */
  function postoAlLato(seg, lato) {
    if (!seg) return null;
    const a = seg.a === "S" ? [1, 3] : seg.a, b = seg.b === "S" ? [1, 3] : seg.b;
    let ovest, est, nord, sud, aree;
    if (a[0] === b[0]) {
      const i = a[0], r = Math.max(a[1], b[1]);
      ovest = [i, r]; est = [i + 1, r];
      aree = seg.dir === "N" ? { left: ovest, right: est } : { left: est, right: ovest };
    } else {
      const j = a[1], c = Math.max(a[0], b[0]);
      nord = [c, j]; sud = [c, j + 1];
      aree = seg.dir === "E" ? { left: nord, right: sud } : { left: sud, right: nord };
    }
    const ar = aree[lato];
    return AREA_POSTO[ar[0] + "," + ar[1]] || null;
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
    return { ok: true, posto: lato ? postoAlLato(st.ultimo, lato) : null, passi, stato: st };
  }

  /* Il programma più corto per arrivare a un posto (per i suggerimenti). */
  function percorsoMinimo(target) {
    const coda = [{ st: { pos: "S", dir: "N", ultimo: null }, m: "" }];
    const visti = new Set();
    while (coda.length) {
      const { st, m } = coda.shift();
      if (st.ultimo) {
        for (const lato of ["left", "right"]) if (postoAlLato(st.ultimo, lato) === target) return { mosse: m, lato };
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

  /* ---------------- Disegno ---------------- */
  const NS = "http://www.w3.org/2000/svg";

  function strade() {
    let s = "";
    const seg = (x1, y1, x2, y2) => {
      s += `<line class="marciapiede" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${STRADA + 14}" stroke-linecap="square"/>`;
    };
    const asf = (x1, y1, x2, y2) => {
      s += `<line class="asfalto" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${STRADA}" stroke-linecap="square"/>`;
    };
    const mez = (x1, y1, x2, y2) => {
      s += `<line class="mezzeria" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    };
    const tutti = [];
    X.forEach((x) => tutti.push([x, Y[0], x, Y[2]]));
    Y.forEach((y) => tutti.push([X[0], y, X[2], y]));
    tutti.push([S.x, Y[2], S.x, 712]);
    tutti.forEach((t) => seg(...t));
    tutti.forEach((t) => asf(...t));
    /* mezzeria a tratti, interrotta agli incroci */
    X.forEach((x) => { for (let k = 0; k < 2; k += 1) mez(x, Y[k] + 30, x, Y[k + 1] - 30); });
    Y.forEach((y) => { for (let k = 0; k < 2; k += 1) mez(X[k] + 30, y, X[k + 1] - 30, y); });
    mez(S.x, Y[2] + 30, S.x, 604);
    /* strisce pedonali sul tratto della stazione */
    for (let k = 0; k < 5; k += 1) s += `<rect class="zebra" x="${S.x - 20 + k * 8.8}" y="618" width="5.5" height="24"/>`;
    return s;
  }

  function decorazioni() {
    const albero = (x, y, r) => `<g class="albero"><circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.5}" class="luce"/></g>`;
    const casa = (x, y, c) => `<g class="casetta"><rect x="${x - 13}" y="${y - 6}" width="26" height="20" rx="2" fill="${c}"/><path d="M${x - 16} ${y - 4} L${x} ${y - 18} L${x + 16} ${y - 4} Z" fill="#7a4b33"/><rect x="${x - 3}" y="${y + 5}" width="6" height="9" fill="#5b3a24"/></g>`;
    return [
      albero(34, 36, 18), albero(86, 78, 15), albero(32, 104, 11),
      casa(612, 44, "#f1c27d"), casa(662, 94, "#a5d8ff"), albero(664, 32, 12),
      casa(42, 622, "#ffc9c9"), albero(92, 680, 15), albero(34, 742, 13), casa(90, 770, "#d0bfff"),
      `<use href="#ic-busstop" x="600" y="596" width="58" height="58"/>`,
      albero(660, 700, 15), albero(614, 752, 12), albero(672, 772, 10),
      `<use href="#ic-lights" x="376" y="284" width="42" height="42" class="semaforo"/>`,
      `<use href="#ic-lights" x="282" y="376" width="42" height="42" class="semaforo"/>`,
    ].join("");
  }

  function isolati() {
    let s = "";
    for (let c = 0; c < 4; c += 1) {
      for (let r = 0; r < 4; r += 1) {
        const [x1, x2] = COL[c], [y1, y2] = RIG[r];
        const angolo = (c === 0 || c === 3) && (r === 0 || r === 3);
        if (angolo) continue;
        s += `<rect class="isolato" x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="10"/>`;
      }
    }
    return s;
  }

  function posti() {
    let s = "";
    Object.entries(POSTI_MAPPA).forEach(([id, [c, r]]) => {
      const p = window.POSTO(id);
      const [x1, x2] = COL[c], [y1, y2] = RIG[r];
      const w = x2 - x1, h = y2 - y1;
      const cx = (x1 + x2) / 2;
      const stretto = w < 140;
      /* nelle colonne strette i nomi di due parole vanno su due righe */
      const righe = stretto && p.en.includes(" ") ? p.en.split(" ") : [p.en];
      const fs = stretto ? 21 : 24;
      const alto = righe.length * (fs + 1) + 20;
      const size = r === 0 || r === 3 ? 62 : stretto ? 70 - (righe.length - 1) * 12 : 92;
      const iy = y1 + (h - size - alto) / 2;
      const itTxt = p.it;
      s += `<g class="posto" data-posto="${id}" tabindex="0" role="button" aria-label="${p.en}, ${p.it}">
        <rect class="zona" x="${x1}" y="${y1}" width="${w}" height="${h}" rx="10"/>
        <use href="#ic-${id}" x="${cx - size / 2}" y="${iy}" width="${size}" height="${size}"/>
        <g class="nome">
          ${righe.map((t, k) => `<text class="en" x="${cx}" y="${iy + size + fs - 2 + k * (fs + 1)}" text-anchor="middle" font-size="${fs}">${t}</text>`).join("")}
          <text class="it" x="${cx}" y="${iy + size + alto - 2}" text-anchor="middle">${itTxt}</text>
        </g>
      </g>`;
    });
    /* la stazione: punto di partenza */
    s += `<g class="stazione">
      <use href="#ic-station" x="${S.x - 40}" y="712" width="80" height="80"/>
      <text class="en" x="${S.x + 48}" y="752" font-size="20">train station</text>
      <text class="it" x="${S.x + 48}" y="772">stazione</text>
    </g>`;
    return s;
  }

  function omino() {
    return `<g class="omino" id="omino">
      <g class="aiuto-lati">
        <g class="tag-lato tag-left"><rect x="-32" y="-14" width="64" height="26" rx="13"/><text y="5" text-anchor="middle">left</text></g>
        <g class="tag-lato tag-right"><rect x="-35" y="-14" width="70" height="26" rx="13"/><text y="5" text-anchor="middle">right</text></g>
      </g>
      <g class="freccia"><path d="M0 -46 L14 -28 L-14 -28 Z"/></g>
      <ellipse cx="0" cy="22" rx="17" ry="6" class="ombra"/>
      <g class="corpo" transform="scale(1.3)">
        <rect x="-11" y="-6" width="9" height="15" rx="3" fill="#f08c00"/>
        <rect x="-7" y="-8" width="14" height="18" rx="5" fill="#1c7ed6"/>
        <rect x="-6" y="9" width="5" height="9" rx="2" fill="#343a40"/><rect x="1" y="9" width="5" height="9" rx="2" fill="#343a40"/>
        <circle cx="0" cy="-15" r="8" fill="#f1c27d"/>
        <path d="M-8 -17 Q0 -27 8 -17 Q4 -21 -8 -17 Z" fill="#5c3b1e"/>
        <circle cx="-2.6" cy="-15" r="1.1" fill="#222"/><circle cx="2.6" cy="-15" r="1.1" fill="#222"/>
      </g>
      <g class="qui"><rect x="-56" y="-62" width="112" height="22" rx="11"/><text y="-46" text-anchor="middle">YOU ARE HERE</text></g>
    </g>`;
  }

  function crea(contenitore, opzioni) {
    const opt = Object.assign({ nomi: true, aiuto: true, onPosto: null }, opzioni || {});
    contenitore.innerHTML = `<svg class="mappa" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mappa della città di Greenford">
      <rect class="prato" x="0" y="0" width="${W}" height="${H}" rx="18"/>
      ${isolati()}${strade()}${decorazioni()}${posti()}
      <g class="scia" id="scia"></g>
      ${omino()}
    </svg>`;
    const svg = contenitore.querySelector("svg");
    const om = svg.querySelector("#omino");
    const scia = svg.querySelector("#scia");
    let st = { pos: "S", dir: "N", ultimo: null };
    let xy = { ...S };
    let ang = 0;

    const disegna = () => {
      om.setAttribute("transform", `translate(${xy.x} ${xy.y})`);
      om.querySelector(".freccia").setAttribute("transform", `rotate(${ang})`);
      /* i cartellini left/right restano dritti ma si mettono ai lati veri dell'omino */
      const rad = (ang * Math.PI) / 180;
      const sx = -Math.cos(rad), sy = -Math.sin(rad); /* sinistra dell'omino */
      om.querySelector(".tag-left").setAttribute("transform", `translate(${sx * 62} ${sy * 58 - 4})`);
      om.querySelector(".tag-right").setAttribute("transform", `translate(${-sx * 66} ${-sy * 58 - 4})`);
    };
    disegna();

    svg.classList.toggle("senza-nomi", !opt.nomi);
    svg.classList.toggle("senza-aiuto", !opt.aiuto);

    svg.querySelectorAll(".posto").forEach((g) => {
      const scegli = () => opt.onPosto && opt.onPosto(g.dataset.posto, g);
      g.addEventListener("click", scegli);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); scegli(); } });
    });

    const veloce = () => document.body.classList.contains("reduced-motion");

    function anima(da, a, ang0, ang1, ms) {
      return new Promise((resolve) => {
        if (veloce()) { xy = { ...a }; ang = ang1; disegna(); resolve(); return; }
        let d = ang1 - ang0;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        const t0 = performance.now();
        const rot = d === 0 ? 0 : 0.3;
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          if (k < rot) {
            ang = ang0 + d * (k / rot);
            xy = { ...da };
          } else {
            ang = ang0 + d;
            const q = (k - rot) / (1 - rot);
            const e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
            xy = { x: da.x + (a.x - da.x) * e, y: da.y + (a.y - da.y) * e };
          }
          disegna();
          if (k < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    }

    const api = {
      get stato() { return st; },
      reset() {
        st = { pos: "S", dir: "N", ultimo: null };
        xy = { ...S }; ang = 0;
        scia.innerHTML = "";
        svg.classList.remove("in-cammino");
        svg.querySelectorAll(".posto").forEach((g) => g.classList.remove("giusto", "sbagliato", "trovato", "meta", "lampeggia"));
        disegna();
      },
      /* Prova una mossa: {ok:false} se non c'è strada (l'omino trema). */
      async muovi(m) {
        const n = passo(st, m);
        if (!n) { await api.trema(); return { ok: false, err: "noroad" }; }
        const da = punto(st.pos), a = punto(n.pos);
        scia.insertAdjacentHTML("beforeend", `<line x1="${da.x}" y1="${da.y}" x2="${a.x}" y2="${a.y}"/>`);
        svg.classList.add("in-cammino");
        await anima(da, a, ang, ANGOLO[n.dir], 900);
        st = n;
        return { ok: true };
      },
      async gira(m) {
        /* solo rotazione, per mostrare dove guarderebbe (usato per «no road») */
        const dir = m === "L" ? SX[st.dir] : DX[st.dir];
        await anima(xy, xy, ang, ANGOLO[dir], 350);
        await attendi(250);
        await anima(xy, xy, ang, ANGOLO[st.dir], 300);
      },
      trema() {
        return new Promise((r) => {
          om.classList.remove("trema");
          void om.getBBox();
          om.classList.add("trema");
          setTimeout(() => { om.classList.remove("trema"); r(); }, 520);
        });
      },
      postoAlLato(lato) { return postoAlLato(st.ultimo, lato); },
      evidenzia(id, cls) {
        const g = svg.querySelector(`.posto[data-posto="${id}"]`);
        if (g) g.classList.add(cls);
        return g;
      },
      togli(id, cls) {
        const g = svg.querySelector(`.posto[data-posto="${id}"]`);
        if (g) g.classList.remove(cls);
      },
      nomi(v) { svg.classList.toggle("senza-nomi", !v); },
      aiuto(v) { svg.classList.toggle("senza-aiuto", !v); },
      svg,
    };
    return api;
  }

  window.CITTA = { crea, simula, percorsoMinimo, postoAlLato, PUZZLE, POSTI_MAPPA, passo };
})();

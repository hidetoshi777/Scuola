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

  /* ---------------- Disegno ----------------
     Sfondo = render 3D di Blender (img/citta.jpg, da _blender_citta.py).
     Sopra, in SVG: zone cliccabili, targhe coi nomi, scia, omino.
     CITTA_PROIEZIONE porta un punto della pianta (px) sul disegno. */
  const PR = window.CITTA_PROIEZIONE || { w: 720, h: 620, ox: 10, oy: 44, ax: 1, ay: 0.7071, az: -70.71 };
  const P = (x, y, z) => ({ x: PR.ox + PR.ax * x, y: PR.oy + PR.ay * y + PR.az * (z || 0) });
  const DIRS = ["N", "E", "S", "W"];
  const SPRITE = 96;       /* lato dello sprite dell'omino nel disegno */
  const PIEDI = 0.741;     /* dove stanno i piedi nello sprite (frazione dall'alto) */

  function zone() {
    let s = "";
    Object.entries(POSTI_MAPPA).forEach(([id, [c, r]]) => {
      const p = window.POSTO(id);
      const a = P(COL[c][0], RIG[r][0]), b = P(COL[c][1], RIG[r][1]);
      const top = r === 0 ? 4 : a.y - 4;
      const cx = (a.x + b.x) / 2;
      const ly = a.y + 18;
      const larg = Math.max(64, p.en.length * 12.5 + 22);
      s += `<g class="posto" data-posto="${id}" tabindex="0" role="button" aria-label="${p.en}, ${p.it}">
        <rect class="zona" x="${a.x}" y="${top}" width="${b.x - a.x}" height="${b.y - top}" rx="10"/>
        <g class="nome">
          <rect class="targa" x="${cx - larg / 2}" y="${ly - 15}" width="${larg}" height="28" rx="8"/>
          <text class="en" x="${cx}" y="${ly + 6}" text-anchor="middle">${p.en}</text>
          <text class="it" x="${cx}" y="${ly + 29}" text-anchor="middle">${p.it}</text>
        </g>
      </g>`;
    });
    const st = P(S.x, 742);
    s += `<g class="stazione"><rect class="targa" x="${st.x + 64}" y="${st.y - 34}" width="118" height="24" rx="7"/>
      <text class="en" x="${st.x + 123}" y="${st.y - 16}" text-anchor="middle" style="font-size:16px">train station</text></g>`;
    return s;
  }

  function omino() {
    return `<g class="omino" id="omino">
      <polygon class="freccia" points="0,0 0,0 0,0"/>
      <g class="aiuto-lati">
        <g class="tag-lato tag-left"><rect x="-30" y="-13" width="60" height="24" rx="12"/><text y="5" text-anchor="middle">left</text></g>
        <g class="tag-lato tag-right"><rect x="-33" y="-13" width="66" height="24" rx="12"/><text y="5" text-anchor="middle">right</text></g>
      </g>
      <image class="sprite" href="${window.ICONE_BASE || ""}img/omino-N.webp" width="${SPRITE}" height="${SPRITE}"/>
      <g class="qui"><rect x="-58" y="${-SPRITE * PIEDI - 26}" width="116" height="22" rx="11"/><text y="${-SPRITE * PIEDI - 10}" text-anchor="middle">YOU ARE HERE</text></g>
    </g>`;
  }

  function crea(contenitore, opzioni) {
    const opt = Object.assign({ nomi: true, aiuto: true, onPosto: null }, opzioni || {});
    contenitore.innerHTML = `<svg class="mappa" viewBox="0 0 ${PR.w} ${PR.h}" role="img" aria-label="Mappa della città di Greenford">
      <image href="${window.ICONE_BASE || ""}img/citta.jpg" x="0" y="0" width="${PR.w}" height="${PR.h}" preserveAspectRatio="none"/>
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
    let passo_anim = 0;

    /* precarica le quattro pose, così il cambio di direzione non lampeggia */
    DIRS.forEach((d) => { const i = new Image(); i.src = `${window.ICONE_BASE || ""}img/omino-${d}.webp`; });

    const disegna = () => {
      const p = P(xy.x, xy.y);
      const salto = passo_anim ? Math.abs(Math.sin(passo_anim)) * 5 : 0;
      om.setAttribute("transform", `translate(${p.x} ${p.y})`);
      const posa = DIRS[((Math.round(ang / 90) % 4) + 4) % 4];
      if (sprite.dataset.posa !== posa) { sprite.setAttribute("href", `${window.ICONE_BASE || ""}img/omino-${posa}.webp`); sprite.dataset.posa = posa; }
      sprite.setAttribute("x", -SPRITE / 2);
      sprite.setAttribute("y", -SPRITE * PIEDI - salto);
      /* freccia a terra davanti all'omino (nella pianta, poi schiacciata dalla prospettiva) */
      const rad = (ang * Math.PI) / 180;
      const avanti = { x: Math.sin(rad), y: -Math.cos(rad) }, lato = { x: Math.cos(rad), y: Math.sin(rad) };
      const pt = (f, l) => { const q = P(xy.x + avanti.x * f + lato.x * l, xy.y + avanti.y * f + lato.y * l); return `${q.x - p.x},${q.y - p.y}`; };
      freccia.setAttribute("points", `${pt(58, 0)} ${pt(36, 16)} ${pt(36, -16)}`);
      /* cartellini left/right ai lati veri dell'omino, all'altezza della vita */
      const sx = -Math.cos(rad), sy = -Math.sin(rad);
      const q1 = P(xy.x + sx * 64, xy.y + sy * 64, 0.28), q2 = P(xy.x - sx * 64, xy.y - sy * 64, 0.28);
      om.querySelector(".tag-left").setAttribute("transform", `translate(${q1.x - p.x} ${q1.y - p.y})`);
      om.querySelector(".tag-right").setAttribute("transform", `translate(${q2.x - p.x} ${q2.y - p.y})`);
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
        if (veloce()) { xy = { ...a }; ang = ang1; passo_anim = 0; disegna(); resolve(); return; }
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
            passo_anim = 0;
          } else {
            ang = ang0 + d;
            const q = (k - rot) / (1 - rot);
            const e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
            xy = { x: da.x + (a.x - da.x) * e, y: da.y + (a.y - da.y) * e };
            passo_anim = muove && k < 1 ? q * Math.PI * 6 : 0;
          }
          disegna();
          if (k < 1) requestAnimationFrame(tick);
          else { passo_anim = 0; disegna(); resolve(); }
        };
        requestAnimationFrame(tick);
      });
    }

    const api = {
      get stato() { return st; },
      reset() {
        st = { pos: "S", dir: "N", ultimo: null };
        xy = { ...S }; ang = 0; passo_anim = 0;
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

(function () {
  "use strict";

  const host = document.getElementById("diagramma-host");
  if (!host) {
    return;
  }

  const rho = 0.0175;
  const uStart = 230;
  const barMaxH = 72;
  const barBaseY = 196;

  const els = {
    L: document.getElementById("inp-L"),
    S: document.getElementById("inp-S"),
    I: document.getElementById("inp-I"),
    outL: document.getElementById("out-L"),
    outS: document.getElementById("out-S"),
    outI: document.getElementById("out-I"),
    readR: document.getElementById("read-R"),
    readDelta: document.getElementById("read-delta"),
    readEnd: document.getElementById("read-end"),
    live: document.getElementById("grafico-live"),
    lab: document.getElementById("volt-lab"),
  };

  function fmtNum(n, digits) {
    return n.toLocaleString("it-IT", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function calc() {
    const L = Number(els.L?.value || 50);
    const S = Number(els.S?.value || 2.5);
    const I = Number(els.I?.value || 10);
    const R = (rho * L) / S;
    const delta = R * I;
    const uEnd = Math.max(0, uStart - delta);
    const dropPct = Math.min(100, (delta / uStart) * 100);
    return { L, S, I, R, delta, uEnd, dropPct };
  }

  function selfCheck() {
    const cases = [
      { L: 40, S: 2.5, I: 16, delta: 4.48, tol: 0.02 },
      { L: 15, S: 2, I: 28, delta: 3.68, tol: 0.05 },
      { L: 50, S: 2.5, I: 10, delta: 3.5, tol: 0.02 },
    ];
    cases.forEach((c) => {
      const R = (rho * c.L) / c.S;
      const delta = R * c.I;
      if (Math.abs(delta - c.delta) > c.tol) {
        console.warn("[scheda] controllo formula:", c, "ottenuto", delta);
      }
    });
  }

  function buildSvgMarkup(data) {
    const { L, S, I, delta, uEnd } = data;
    const hStart = barMaxH;
    const hEnd = Math.max(12, (uEnd / uStart) * barMaxH);
    const thick = 7 + ((S - 1.5) / 4.5) * 8;
    const cableX = 96;
    const cableLen = 88 + (L / 150) * 120;
    const cableY = 148;
    const startBarX = 36;
    const endBarX = 382;
    const yStartTop = barBaseY - hStart;
    const yEndTop = barBaseY - hEnd;
    const midX = 220;
    const aria = `Diagramma cavo: ${uStart} volt all'inizio, ${fmtNum(uEnd, 1)} volt al carico, caduta ${fmtNum(delta, 1)} volt`;

    return `
<svg xmlns="http://www.w3.org/2000/svg" class="volt-svg" viewBox="0 0 440 300" role="img" aria-label="${aria}">
  <defs>
    <linearGradient id="cableCopper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d4a574"/>
      <stop offset="50%" stop-color="#b87333"/>
      <stop offset="100%" stop-color="#8b5a2b"/>
    </linearGradient>
    <marker id="arrowI" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="#2dd4bf"/>
    </marker>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M16 0H0V16" fill="none" stroke="#1e2836" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="440" height="300" rx="12" fill="#0d1219"/>
  <rect x="0" y="0" width="440" height="300" fill="url(#grid)" opacity="0.6"/>

  <text x="${midX}" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="#eef3fa">Tensione lungo il cavo</text>
  <text x="${midX}" y="42" text-anchor="middle" font-size="11" font-weight="700" fill="#a78bfa">differenza ≈ ${fmtNum(delta, 1)} V</text>

  <rect x="12" y="54" width="72" height="40" rx="6" fill="#151c28" stroke="#5b8def" stroke-width="2"/>
  <text x="48" y="70" text-anchor="middle" font-size="9" fill="#8b9cb0">Sorgente</text>
  <text x="48" y="86" text-anchor="middle" font-size="13" font-weight="800" fill="#5b8def">${uStart} V</text>

  <rect x="356" y="54" width="72" height="40" rx="6" fill="#151c28" stroke="#f0b429" stroke-width="2"/>
  <circle cx="392" cy="68" r="8" fill="#f0b429" opacity="0.35"/>
  <circle cx="392" cy="68" r="4" fill="#f0b429" filter="url(#glow)"/>
  <text x="392" y="86" text-anchor="middle" font-size="9" fill="#8b9cb0">Carico</text>

  <text x="${startBarX + 11}" y="108" text-anchor="middle" font-size="10" font-weight="700" fill="#eef3fa">Inizio</text>
  <text x="${endBarX + 11}" y="108" text-anchor="middle" font-size="10" font-weight="700" fill="#eef3fa">${fmtNum(uEnd, 1)} V</text>

  <path d="M ${startBarX + 22} ${yStartTop} L ${endBarX} ${yEndTop}" fill="none" stroke="#a78bfa" stroke-width="1.4" stroke-dasharray="4 3"/>

  <rect x="${startBarX}" y="${yStartTop}" width="22" height="${hStart}" rx="4" fill="#5b8def"/>
  <rect x="${endBarX}" y="${yEndTop}" width="22" height="${hEnd}" rx="4" fill="#f0b429"/>

  <text x="${midX}" y="124" text-anchor="middle" font-size="10" fill="#d4a574">L = ${L} m · S = ${fmtNum(S, 1)} mm²</text>
  <rect x="${cableX}" y="${cableY - thick / 2}" width="${cableLen}" height="${thick}" rx="${thick / 2}" fill="url(#cableCopper)" stroke="#6b4423" stroke-width="1"/>
  <rect x="${cableX + cableLen * 0.38}" y="${cableY - thick / 2 - 3}" width="${Math.max(28, cableLen * 0.24)}" height="${thick + 6}" rx="4" fill="none" stroke="#f0b429" stroke-width="1.5" stroke-dasharray="5 3"/>

  <text x="${midX}" y="178" text-anchor="middle" font-size="11" font-weight="700" fill="#f0b429">ΔU ≈ ${fmtNum(delta, 1)} V persi</text>
  <line x1="${cableX + 10}" y1="196" x2="${cableX + cableLen - 10}" y2="196" stroke="#2dd4bf" stroke-width="2" marker-end="url(#arrowI)"/>
  <text x="${midX}" y="216" text-anchor="middle" font-size="10" fill="#2dd4bf">Corrente I = ${I} A</text>
  <text x="${midX}" y="286" text-anchor="middle" font-size="9" fill="#8b9cb0">Colonne = tensione · più L o I, o S piccola → barra ambra più bassa</text>
</svg>`;
  }

  function draw() {
    const data = calc();
    const { L, S, I, R, delta, uEnd, dropPct } = data;

    if (els.outL) els.outL.textContent = `${L} m`;
    if (els.outS) els.outS.textContent = `${fmtNum(S, 1)} mm²`;
    if (els.outI) els.outI.textContent = `${I} A`;
    if (els.readR) els.readR.textContent = `${fmtNum(R, 2)} Ω`;
    if (els.readDelta) els.readDelta.textContent = `${fmtNum(delta, 1)} V`;
    if (els.readEnd) els.readEnd.textContent = `${fmtNum(uEnd, 1)} V`;

    if (els.lab) {
      els.lab.style.setProperty("--drop-pct", String(dropPct));
    }

    if (els.live) {
      els.live.textContent =
        `Cavo ${L} metri, sezione ${fmtNum(S, 1)} millimetri quadrati, corrente ${I} ampere. ` +
        `Caduta ${fmtNum(delta, 1)} volt, tensione al carico ${fmtNum(uEnd, 1)} volt.`;
    }

    host.innerHTML = buildSvgMarkup(data);
  }

  selfCheck();

  ["input", "change"].forEach((ev) => {
    [els.L, els.S, els.I].forEach((el) => {
      el?.addEventListener(ev, draw);
    });
  });

  draw();
})();

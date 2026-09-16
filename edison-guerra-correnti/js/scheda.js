(function () {
  "use strict";

  const svg = document.getElementById("diagramma-cavo");
  if (!svg) {
    return;
  }

  const rho = 0.0175;
  const uStart = 230;
  const barMaxH = 88;
  const barBaseY = 168;

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

  function draw() {
    const { L, S, I, R, delta, uEnd, dropPct } = calc();

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

    const hStart = barMaxH;
    const hEnd = (uEnd / uStart) * barMaxH;
    const cableX = 108;
    const cableY = 118;
    const thick = 6 + ((S - 1.5) / 4.5) * 10;
    const cableLen = 50 + (L / 150) * 155;

    const startBarX = 24;
    const endBarX = cableX + cableLen + 24;
    const loadX = Math.min(endBarX + 30, 352);
    const yStartTop = barBaseY - hStart;
    const yEndTop = barBaseY - hEnd;

    svg.setAttribute(
      "aria-label",
      `Diagramma cavo: ${uStart} volt all'inizio, ${fmtNum(uEnd, 1)} volt al carico, caduta ${fmtNum(delta, 1)} volt`
    );

    svg.innerHTML = `
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
      </defs>

      <rect x="0" y="0" width="420" height="260" rx="12" fill="#0d1219"/>
      <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M16 0H0V16" fill="none" stroke="#1e2836" stroke-width="0.5"/>
      </pattern>
      <rect x="0" y="0" width="420" height="260" fill="url(#grid)" opacity="0.6"/>

      <text x="210" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="#eef3fa">Tensione lungo il cavo</text>

      <!-- Sorgente -->
      <rect x="18" y="72" width="56" height="52" rx="6" fill="#151c28" stroke="#5b8def" stroke-width="2"/>
      <text x="46" y="94" text-anchor="middle" font-size="9" fill="#8b9cb0">Sorgente</text>
      <text x="46" y="112" text-anchor="middle" font-size="13" font-weight="800" fill="#5b8def">${uStart} V</text>

      <!-- Barra inizio -->
      <rect x="${startBarX}" y="${yStartTop}" width="22" height="${hStart}" rx="4" fill="#5b8def"/>
      <text x="${startBarX + 11}" y="${yStartTop - 6}" text-anchor="middle" font-size="9" fill="#eef3fa">Inizio</text>

      <!-- Cavo -->
      <rect x="${cableX}" y="${cableY - thick / 2}" width="${cableLen}" height="${thick}" rx="${thick / 2}" fill="url(#cableCopper)" stroke="#6b4423" stroke-width="1"/>
      <text x="${cableX + cableLen / 2}" y="${cableY - thick / 2 - 8}" text-anchor="middle" font-size="10" fill="#d4a574">L = ${L} m · S = ${fmtNum(S, 1)} mm²</text>

      <!-- Zona caduta sul cavo -->
      <rect x="${cableX + cableLen * 0.35}" y="${cableY - thick / 2 - 2}" width="${Math.max(24, cableLen * 0.3)}" height="${thick + 4}" rx="4" fill="none" stroke="#f0b429" stroke-width="2" stroke-dasharray="5 3" opacity="0.9"/>
      <text x="${cableX + cableLen * 0.5}" y="${cableY + thick + 18}" text-anchor="middle" font-size="10" font-weight="700" fill="#f0b429">ΔU ≈ ${fmtNum(delta, 1)} V persi</text>

      <!-- Corrente I -->
      <line x1="${cableX + 8}" y1="${cableY + thick + 10}" x2="${cableX + cableLen - 8}" y2="${cableY + thick + 10}" stroke="#2dd4bf" stroke-width="2" marker-end="url(#arrowI)"/>
      <text x="${cableX + cableLen / 2}" y="${cableY + thick + 28}" text-anchor="middle" font-size="9" fill="#2dd4bf">Corrente I = ${I} A</text>

      <!-- Carico -->
      <rect x="${loadX}" y="78" width="48" height="44" rx="6" fill="#151c28" stroke="#f0b429" stroke-width="2"/>
      <circle cx="${loadX + 24}" cy="96" r="10" fill="#f0b429" opacity="0.35"/>
      <circle cx="${loadX + 24}" cy="96" r="5" fill="#f0b429" filter="url(#glow)"/>
      <text x="${loadX + 24}" y="118" text-anchor="middle" font-size="8" fill="#8b9cb0">Carico</text>

      <!-- Barra fine -->
      <rect x="${endBarX}" y="${yEndTop}" width="22" height="${hEnd}" rx="4" fill="#f0b429"/>
      <text x="${endBarX + 11}" y="${yEndTop - 6}" text-anchor="middle" font-size="9" fill="#eef3fa">${fmtNum(uEnd, 1)} V</text>

      <!-- Ponte caduta tra barre -->
      <path d="M ${startBarX + 22} ${yStartTop + 8} L ${endBarX - 4} ${yEndTop + 8}" fill="none" stroke="#a78bfa" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="${(startBarX + endBarX) / 2}" y="${Math.min(yStartTop, yEndTop) - 14}" text-anchor="middle" font-size="9" fill="#a78bfa">differenza ≈ ${fmtNum(delta, 1)} V</text>

      <text x="210" y="248" text-anchor="middle" font-size="9" fill="#8b9cb0">Colonne = tensione · più L o I, o S piccola → barra ambra più bassa</text>
    `;
  }

  selfCheck();

  ["input", "change"].forEach((ev) => {
    [els.L, els.S, els.I].forEach((el) => {
      el?.addEventListener(ev, draw);
    });
  });

  draw();
})();

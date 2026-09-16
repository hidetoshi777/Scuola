(function () {
  "use strict";

  const svg = document.getElementById("grafico-cavo");
  if (!svg) {
    return;
  }

  const rho = 0.0175;
  const uStart = 230;

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
    return { L, S, I, R, delta, uEnd };
  }

  /** Verifica interna (valori noti dalla scheda). */
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
    const { L, S, I, R, delta, uEnd } = calc();

    if (els.outL) els.outL.textContent = `${L} m`;
    if (els.outS) els.outS.textContent = `${fmtNum(S, 1)} mm²`;
    if (els.outI) els.outI.textContent = `${I} A`;
    if (els.readR) els.readR.textContent = `${fmtNum(R, 2)} Ω`;
    if (els.readDelta) els.readDelta.textContent = `${fmtNum(delta, 1)} V`;
    if (els.readEnd) els.readEnd.textContent = `${fmtNum(uEnd, 1)} V`;

    if (els.live) {
      els.live.textContent =
        `L ${L} metri, sezione ${fmtNum(S, 1)} millimetri quadrati, corrente ${I} ampere. ` +
        `Resistenza ${fmtNum(R, 2)} ohm, caduta ${fmtNum(delta, 1)} volt, tensione a fine cavo ${fmtNum(uEnd, 1)} volt.`;
    }

    const w = 360;
    const h = 172;
    const pad = { l: 12, r: 12, t: 26, b: 36 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    const y = (u) => pad.t + plotH * (1 - u / uStart);

    const x0 = pad.l;
    const x1 = pad.l + plotW;
    const y0 = y(uStart);
    const y1 = y(uEnd);

    const pts = [];
    const steps = 24;
    for (let i = 0; i <= steps; i += 1) {
      const x = x0 + (plotW * i) / steps;
      const frac = i / steps;
      const u = uStart - delta * frac;
      pts.push(`${x.toFixed(1)},${y(u).toFixed(1)}`);
    }

    const gap = Math.abs(y0 - y1);
    let startLabelY = y0 - 8;
    let endLabelY = y1 + 14;
    if (gap < 18) {
      startLabelY = pad.t - 6;
      endLabelY = y1 + 16;
    }

    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute(
      "aria-label",
      `Grafico: tensione iniziale ${uStart} volt, caduta ${fmtNum(delta, 1)} volt, tensione finale ${fmtNum(uEnd, 1)} volt su ${L} metri di cavo`
    );

    svg.innerHTML = `
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#5b8def"/>
          <stop offset="100%" stop-color="#f0b429"/>
        </linearGradient>
      </defs>
      <rect x="${x0}" y="${pad.t}" width="${plotW}" height="${plotH}" fill="none" stroke="var(--wire, #2a3544)" stroke-width="1"/>
      <text x="${w / 2}" y="14" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">Caduta ΔU ≈ ${fmtNum(delta, 1)} V</text>
      <polyline points="${pts.join(" ")}" fill="none" stroke="url(#lineGrad)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${x0}" cy="${y0.toFixed(1)}" r="4" fill="#5b8def"/>
      <circle cx="${x1}" cy="${y1.toFixed(1)}" r="4" fill="#f0b429"/>
      <text x="${x0 + 8}" y="${startLabelY}" font-size="10" fill="currentColor">${uStart} V · inizio</text>
      <text x="${x1 - 8}" y="${endLabelY}" text-anchor="end" font-size="10" fill="currentColor">${fmtNum(uEnd, 1)} V · fine</text>
      <text x="${w / 2}" y="${h - 8}" text-anchor="middle" font-size="10" fill="currentColor">L = ${L} m (andata del cavo)</text>
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

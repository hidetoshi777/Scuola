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
  };

  function calc() {
    const L = Number(els.L?.value || 50);
    const S = Number(els.S?.value || 2.5);
    const I = Number(els.I?.value || 10);
    const R = (rho * L) / S;
    const delta = R * I;
    const uEnd = Math.max(0, uStart - delta);
    return { L, S, I, R, delta, uEnd };
  }

  function draw() {
    const { L, R, delta, uEnd } = calc();

    if (els.outL) els.outL.textContent = `${L} m`;
    if (els.outS) els.outS.textContent = `${Number(els.S?.value).toFixed(1)} mm²`;
    if (els.outI) els.outI.textContent = `${Number(els.I?.value)} A`;
    if (els.readR) els.readR.textContent = `${R.toFixed(2)} Ω`;
    if (els.readDelta) els.readDelta.textContent = `${delta.toFixed(1)} V`;
    if (els.readEnd) els.readEnd.textContent = `${uEnd.toFixed(1)} V`;

    const w = 360;
    const h = 160;
    const pad = { l: 42, r: 16, t: 18, b: 36 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    const y = (u) => pad.t + plotH * (1 - u / uStart);

    const pts = [];
    const steps = 24;
    for (let i = 0; i <= steps; i += 1) {
      const x = pad.l + (plotW * i) / steps;
      const frac = i / steps;
      const u = uStart - delta * frac;
      pts.push(`${x.toFixed(1)},${y(u).toFixed(1)}`);
    }

    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.innerHTML = `
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#5b8def"/>
          <stop offset="100%" stop-color="#f0b429"/>
        </linearGradient>
      </defs>
      <rect x="${pad.l}" y="${pad.t}" width="${plotW}" height="${plotH}" fill="none" stroke="var(--wire, #2a3544)" stroke-width="1"/>
      <text x="${pad.l - 4}" y="${y(uStart) + 4}" text-anchor="end" font-size="10" fill="currentColor">${uStart} V</text>
      <text x="${pad.l - 4}" y="${y(uEnd) + 4}" text-anchor="end" font-size="10" fill="currentColor">${uEnd.toFixed(0)} V</text>
      <polyline points="${pts.join(" ")}" fill="none" stroke="url(#lineGrad)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${pad.l}" cy="${y(uStart)}" r="4" fill="#5b8def"/>
      <circle cx="${pad.l + plotW}" cy="${y(uEnd)}" r="4" fill="#f0b429"/>
      <text x="${pad.l + plotW / 2}" y="${h - 8}" text-anchor="middle" font-size="10" fill="currentColor">L = ${L} m (andata del cavo)</text>
      <text x="${pad.l + plotW / 2}" y="${pad.t - 4}" text-anchor="middle" font-size="10" fill="currentColor">Caduta ΔU ≈ ${delta.toFixed(1)} V</text>
    `;
  }

  ["input", "change"].forEach((ev) => {
    [els.L, els.S, els.I].forEach((el) => {
      el?.addEventListener(ev, draw);
    });
  });

  draw();
})();

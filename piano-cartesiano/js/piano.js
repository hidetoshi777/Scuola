(function (global) {
  const MIN = -5;
  const MAX = 5;
  const VB = 240;
  const PAD = 30;
  const SPAN = MAX - MIN;
  const INNER = VB - PAD * 2;
  const NS = "http://www.w3.org/2000/svg";

  const PUNTI_CLASSE = [
    { id: "A", x: 3, y: 2, colore: "#f08a3a" },
    { id: "B", x: -1, y: 5, colore: "#e4572e" },
    { id: "C", x: -3, y: -1, colore: "#3dba7a" },
    { id: "D", x: 2, y: -4, colore: "#3ec3d8" },
  ];

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach((key) => {
      node.setAttribute(key, String(attrs[key]));
    });
    if (parent) parent.appendChild(node);
    return node;
  }

  function toSvg(x, y) {
    return {
      x: PAD + ((x - MIN) / SPAN) * INNER,
      y: VB - PAD - ((y - MIN) / SPAN) * INNER,
    };
  }

  function fromSvg(sx, sy) {
    const x = MIN + ((sx - PAD) / INNER) * SPAN;
    const y = MIN + ((VB - PAD - sy) / INNER) * SPAN;
    return {
      x: Math.max(MIN, Math.min(MAX, Math.round(x))),
      y: Math.max(MIN, Math.min(MAX, Math.round(y))),
    };
  }

  function fmt(x, y) {
    return "(" + x + ", " + y + ")";
  }

  function segniDi(x, y) {
    const sx = x > 0 ? "+" : x < 0 ? "−" : "0";
    const sy = y > 0 ? "+" : y < 0 ? "−" : "0";
    return "(" + sx + ", " + sy + ")";
  }

  function quadrante(x, y) {
    if (x === 0 && y === 0) {
      return { id: "O", nome: "origine", segni: "(0, 0)" };
    }
    if (x === 0) {
      return { id: "Y", nome: "sull’asse Y", segni: "(0, y)" };
    }
    if (y === 0) {
      return { id: "X", nome: "sull’asse X", segni: "(x, 0)" };
    }
    if (x > 0 && y > 0) {
      return { id: "I", nome: "1° quadrante", segni: "(+, +)" };
    }
    if (x < 0 && y > 0) {
      return { id: "II", nome: "2° quadrante", segni: "(−, +)" };
    }
    if (x < 0 && y < 0) {
      return { id: "III", nome: "3° quadrante", segni: "(−, −)" };
    }
    return { id: "IV", nome: "4° quadrante", segni: "(+, −)" };
  }

  function passoX(x) {
    if (x > 0) return x === 1 ? "1 passo a destra" : x + " passi a destra";
    if (x < 0) {
      const n = Math.abs(x);
      return n === 1 ? "1 passo a sinistra" : n + " passi a sinistra";
    }
    return "su X resti a 0";
  }

  function passoY(y) {
    if (y > 0) return y === 1 ? "1 passo in alto" : y + " passi in alto";
    if (y < 0) {
      const n = Math.abs(y);
      return n === 1 ? "1 passo in basso" : n + " passi in basso";
    }
    return "su Y resti a 0";
  }

  function guida(x, y) {
    return "Prima X: " + passoX(x) + ". Poi Y: " + passoY(y) + ".";
  }

  function crea(host, options) {
    const opts = options || {};
    if (!host) return null;

    const interactive = opts.interactive !== false;
    const withPawn = opts.pawn !== false;
    const showQuadrants = opts.quadrants !== false;
    const reduceMotion =
      document.body.classList.contains("reduced-motion") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    host.innerHTML = "";
    host.classList.add("piano-host");

    const svg = el("svg", {
      class: "piano-svg",
      viewBox: "0 0 " + VB + " " + VB,
      role: "img",
      "aria-label": opts.label || "Piano cartesiano da −5 a 5",
    });
    host.appendChild(svg);

    const defs = el("defs", {}, svg);
    const marker = el(
      "marker",
      {
        id: "freccia-" + Math.random().toString(36).slice(2, 7),
        viewBox: "0 0 10 10",
        refX: "8",
        refY: "5",
        markerWidth: "7",
        markerHeight: "7",
        orient: "auto-start-reverse",
      },
      defs
    );
    el("path", { d: "M 0 1.2 L 10 5 L 0 8.8 Z", fill: "currentColor" }, marker);
    const markerId = marker.getAttribute("id");

    const o = toSvg(0, 0);
    const xMin = toSvg(MIN, 0);
    const xMax = toSvg(MAX, 0);
    const yMin = toSvg(0, MIN);
    const yMax = toSvg(0, MAX);

    if (showQuadrants) {
      const q = [
        { x: o.x, y: yMax.y, w: xMax.x - o.x, h: o.y - yMax.y, cls: "q1" },
        { x: xMin.x, y: yMax.y, w: o.x - xMin.x, h: o.y - yMax.y, cls: "q2" },
        { x: xMin.x, y: o.y, w: o.x - xMin.x, h: yMin.y - o.y, cls: "q3" },
        { x: o.x, y: o.y, w: xMax.x - o.x, h: yMin.y - o.y, cls: "q4" },
      ];
      q.forEach((rect) => {
        el(
          "rect",
          {
            class: "piano-q piano-q--" + rect.cls,
            x: rect.x,
            y: rect.y,
            width: Math.max(0, rect.w),
            height: Math.max(0, rect.h),
          },
          svg
        );
      });
    }

    for (let n = MIN; n <= MAX; n += 1) {
      const vx = toSvg(n, 0);
      const hy = toSvg(0, n);
      el(
        "line",
        {
          class: "piano-grid" + (n === 0 ? " is-asse" : ""),
          x1: vx.x,
          y1: toSvg(0, MIN).y,
          x2: vx.x,
          y2: toSvg(0, MAX).y,
        },
        svg
      );
      el(
        "line",
        {
          class: "piano-grid" + (n === 0 ? " is-asse" : ""),
          x1: toSvg(MIN, 0).x,
          y1: hy.y,
          x2: toSvg(MAX, 0).x,
          y2: hy.y,
        },
        svg
      );
    }

    el(
      "line",
      {
        class: "piano-asse piano-asse-x",
        x1: xMin.x,
        y1: o.y,
        x2: xMax.x + 6,
        y2: o.y,
        "marker-end": "url(#" + markerId + ")",
      },
      svg
    );
    el(
      "line",
      {
        class: "piano-asse piano-asse-y",
        x1: o.x,
        y1: yMin.y,
        x2: o.x,
        y2: yMax.y - 6,
        "marker-end": "url(#" + markerId + ")",
      },
      svg
    );

    el("text", { class: "piano-label-asse piano-label-x", x: xMax.x + 10, y: o.y - 7 }, svg).textContent =
      "X";
    el("text", { class: "piano-label-asse piano-label-y", x: o.x + 8, y: yMax.y + 4 }, svg).textContent =
      "Y";

    for (let n = MIN; n <= MAX; n += 1) {
      if (n === 0) continue;
      const px = toSvg(n, 0);
      const py = toSvg(0, n);
      el("text", { class: "piano-tick", x: px.x, y: o.y + 12, "text-anchor": "middle" }, svg).textContent =
        String(n);
      el(
        "text",
        { class: "piano-tick", x: o.x - 7, y: py.y + 3, "text-anchor": "end" },
        svg
      ).textContent = String(n);
    }
    el("text", { class: "piano-origine", x: o.x - 7, y: o.y + 12, "text-anchor": "end" }, svg).textContent =
      "O";

    const pins = el("g", { class: "piano-pins" }, svg);
    const ghost = el(
      "circle",
      { class: "piano-ghost", r: "5", cx: o.x, cy: o.y, visibility: "hidden" },
      svg
    );
    const targetMark = el(
      "circle",
      { class: "piano-target", r: "7", cx: o.x, cy: o.y, visibility: "hidden" },
      svg
    );

    let pawn = null;
    if (withPawn) {
      pawn = el("g", { class: "piano-pawn", transform: "translate(" + o.x + " " + o.y + ")" }, svg);
      el("circle", { class: "piano-pawn-ring", r: "9", cx: "0", cy: "0" }, pawn);
      el("circle", { class: "piano-pawn-head", r: "3.2", cx: "0", cy: "-2.4" }, pawn);
      el("path", { class: "piano-pawn-body", d: "M -3.4 1.4 Q 0 6.6 3.4 1.4" }, pawn);
    }

    const state = {
      x: 0,
      y: 0,
      busy: false,
      onPick: typeof opts.onPick === "function" ? opts.onPick : null,
      onMove: typeof opts.onMove === "function" ? opts.onMove : null,
    };

    function pawnAt() {
      return toSvg(state.x, state.y);
    }

    function placePawn(sx, sy) {
      if (!pawn) return;
      pawn.setAttribute("transform", "translate(" + sx + " " + sy + ")");
    }

    function animatePawn(from, to, ms) {
      return new Promise((resolve) => {
        if (!pawn || reduceMotion || ms <= 0) {
          placePawn(to.x, to.y);
          resolve();
          return;
        }
        const t0 = performance.now();
        function frame(now) {
          const u = Math.min(1, (now - t0) / ms);
          placePawn(from.x + (to.x - from.x) * u, from.y + (to.y - from.y) * u);
          if (u < 1) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
    }

    function setPawn(x, y, instant) {
      const dest = toSvg(x, y);
      const from = pawnAt();
      state.x = x;
      state.y = y;
      if (!pawn) {
        if (state.onMove) state.onMove(x, y);
        return Promise.resolve();
      }
      if (instant) {
        placePawn(dest.x, dest.y);
        if (state.onMove) state.onMove(x, y);
        return Promise.resolve();
      }
      state.busy = true;
      return animatePawn(from, dest, 280).then(() => {
        state.busy = false;
        if (state.onMove) state.onMove(x, y);
      });
    }

    function walkTo(x, y) {
      if (!pawn || reduceMotion) {
        return setPawn(x, y, true);
      }
      state.busy = true;
      const start = pawnAt();
      const mid = toSvg(x, state.y);
      const end = toSvg(x, y);
      return animatePawn(start, mid, 420)
        .then(() => animatePawn(mid, end, 420))
        .then(() => {
          state.x = x;
          state.y = y;
          state.busy = false;
          if (state.onMove) state.onMove(x, y);
        });
    }

    function step(dx, dy) {
      if (state.busy) return { x: state.x, y: state.y };
      const nx = Math.max(MIN, Math.min(MAX, state.x + dx));
      const ny = Math.max(MIN, Math.min(MAX, state.y + dy));
      setPawn(nx, ny, false);
      return { x: nx, y: ny };
    }

    function clientToPoint(event) {
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: state.x, y: state.y };
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const p = pt.matrixTransform(ctm.inverse());
      return fromSvg(p.x, p.y);
    }

    function mostraPunti(lista) {
      pins.innerHTML = "";
      (lista || []).forEach((punto) => {
        const p = toSvg(punto.x, punto.y);
        const g = el("g", { class: "piano-pin", "data-id": punto.id || "" }, pins);
        el(
          "circle",
          {
            class: "piano-pin-dot",
            cx: p.x,
            cy: p.y,
            r: "5.5",
            fill: punto.colore || "#f4d35e",
          },
          g
        );
        const label = el(
          "text",
          {
            class: "piano-pin-id",
            x: p.x,
            y: p.y - 9,
            "text-anchor": "middle",
          },
          g
        );
        label.textContent = punto.id || "";
      });
    }

    function nascondiPunti() {
      pins.innerHTML = "";
    }

    function setTarget(x, y, visibile) {
      if (!visibile) {
        targetMark.setAttribute("visibility", "hidden");
        return;
      }
      const p = toSvg(x, y);
      targetMark.setAttribute("cx", p.x);
      targetMark.setAttribute("cy", p.y);
      targetMark.setAttribute("visibility", "visible");
    }

    function flash(ok) {
      host.classList.remove("is-ok", "is-ko");
      host.classList.add(ok ? "is-ok" : "is-ko");
      window.setTimeout(() => host.classList.remove("is-ok", "is-ko"), 700);
    }

    if (interactive) {
      svg.addEventListener("pointermove", (event) => {
        if (state.busy) return;
        const p = clientToPoint(event);
        const s = toSvg(p.x, p.y);
        ghost.setAttribute("cx", s.x);
        ghost.setAttribute("cy", s.y);
        ghost.setAttribute("visibility", "visible");
      });
      svg.addEventListener("pointerleave", () => {
        ghost.setAttribute("visibility", "hidden");
      });
      svg.addEventListener("click", (event) => {
        if (state.busy) return;
        const p = clientToPoint(event);
        if (state.onPick) state.onPick(p.x, p.y);
      });
    }

    setPawn(0, 0, true);

    return {
      svg,
      state,
      setPawn,
      walkTo,
      step,
      mostraPunti,
      nascondiPunti,
      setTarget,
      flash,
      fmt,
      guida,
      quadrante,
      min: MIN,
      max: MAX,
    };
  }

  global.PianoCartesiano = {
    MIN,
    MAX,
    PUNTI_CLASSE,
    fmt,
    segniDi,
    quadrante,
    passoX,
    passoY,
    guida,
    crea,
  };
})(window);

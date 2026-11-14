(function () {
  const captions = [
    "Tavola 1 · Luigi XIV si proclama Re Sole («Lo Stato sono io») e controlla i nobili a Versailles.",
    "Tavola 2 · I tre ordini dell’Antico Regime (2% contro 98%) e il lume della ragione nell’Illuminismo.",
    "Tavola 3 · Montesquieu separa i tre poteri; Voltaire difende la tolleranza; Rousseau afferma la sovranità del popolo.",
    "Tavola 4 · Cesare Beccaria contro tortura e pena di morte; nel 1786 la Toscana è il primo Stato ad abolirle.",
  ];

  const pages = Array.from(document.querySelectorAll(".fumetto-page"));
  const statusNum = document.getElementById("fumetto-num");
  const caption = document.getElementById("fumetto-caption");
  const prevBtn = document.getElementById("fumetto-prev");
  const nextBtn = document.getElementById("fumetto-next");
  const dotsWrap = document.getElementById("fumetto-dots");
  const viewport = document.getElementById("fumetto-viewport");
  if (!pages.length || !viewport || !prevBtn || !nextBtn || !dotsWrap) return;

  let index = 0;
  let busy = false;
  const total = pages.length;
  const reduceMotion =
    document.body.classList.contains("reduced-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const zoom = window.FumettoZoom ? window.FumettoZoom.attach(viewport) : null;

  function makeFsButton(className, label, text) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = className;
    btn.setAttribute("aria-label", label);
    btn.textContent = text;
    ["pointerdown", "touchstart", "touchend"].forEach((ev) => {
      btn.addEventListener(ev, (event) => event.stopPropagation(), { passive: true });
    });
    viewport.appendChild(btn);
    return btn;
  }

  const fsPrev = makeFsButton("fumetto-fs-arrow fumetto-fs-arrow--prev", "Tavola precedente", "‹");
  const fsNext = makeFsButton("fumetto-fs-arrow fumetto-fs-arrow--next", "Tavola successiva", "›");
  const fsClose = makeFsButton("fumetto-fs-close", "Esci da schermo intero", "✕");
  fsPrev.addEventListener("click", (event) => {
    event.stopPropagation();
    go(index - 1);
  });
  fsNext.addEventListener("click", (event) => {
    event.stopPropagation();
    go(index + 1);
  });
  fsClose.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFullscreen();
  });

  pages.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "fumetto-dot";
    dot.setAttribute("aria-label", "Vai alla tavola " + (i + 1));
    dot.addEventListener("click", () => go(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.querySelectorAll(".fumetto-dot"));

  function syncChrome() {
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    if (statusNum) statusNum.textContent = String(index + 1);
    if (caption) caption.textContent = captions[index] || "";
    prevBtn.disabled = index === 0 || busy;
    nextBtn.disabled = index === total - 1 || busy;
    fsPrev.disabled = index === 0 || busy;
    fsNext.disabled = index === total - 1 || busy;
  }

  function settle(next) {
    if (zoom) zoom.reset();
    pages.forEach((page, i) => {
      const active = i === next;
      page.classList.toggle("is-active", active);
      page.setAttribute("aria-hidden", active ? "false" : "true");
    });
    index = next;
    busy = false;
    syncChrome();
  }

  function go(next) {
    const target = Math.max(0, Math.min(total - 1, next));
    if (target === index || busy) return;
    if (zoom && zoom.isZoomed()) zoom.reset();
    if (reduceMotion) {
      settle(target);
      return;
    }
    busy = true;
    syncChrome();
    window.setTimeout(() => settle(target), 110);
  }

  prevBtn.addEventListener("click", () => go(index - 1));
  nextBtn.addEventListener("click", () => go(index + 1));

  document.addEventListener("keydown", (event) => {
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      go(index - 1);
    }
  });

  let startX = 0;
  let startY = 0;
  viewport.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length > 1) return;
      const t = event.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
    },
    { passive: true }
  );
  const stage = document.getElementById("fumetto-stage");
  const fullBtn = document.getElementById("fumetto-fullscreen");

  function stageIsFullscreen() {
    const el = document.fullscreenElement || document.webkitFullscreenElement;
    return el === stage || (stage && stage.classList.contains("is-immersive"));
  }

  function isRotatedPortrait() {
    return stageIsFullscreen() && window.matchMedia("(orientation: portrait) and (max-width: 900px)").matches;
  }

  function lockLandscape() {
    try {
      if (screen.orientation && typeof screen.orientation.lock === "function") {
        const p = screen.orientation.lock("landscape");
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    } catch (err) {
      /* ignore */
    }
  }

  function unlockOrientation() {
    try {
      if (screen.orientation && typeof screen.orientation.unlock === "function") {
        screen.orientation.unlock();
      }
    } catch (err) {
      /* ignore */
    }
  }

  viewport.addEventListener(
    "touchend",
    (event) => {
      if (zoom && zoom.blocksNav()) return;
      if (event.touches.length > 0) return;
      const t = event.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const rotated = isRotatedPortrait();
      const primary = rotated ? dy : dx;
      const secondary = rotated ? dx : dy;
      if (Math.abs(primary) < 40 || Math.abs(primary) < Math.abs(secondary)) return;
      if (primary < 0) go(index + 1);
      else go(index - 1);
    },
    { passive: true }
  );

  viewport.addEventListener("click", (event) => {
    if (busy) return;
    if (zoom && zoom.blocksNav()) return;
    const rect = viewport.getBoundingClientRect();
    const ratio = isRotatedPortrait()
      ? (event.clientY - rect.top) / rect.height
      : (event.clientX - rect.left) / rect.width;
    if (ratio > 0.66) go(index + 1);
    else if (ratio < 0.33) go(index - 1);
  });

  function setImmersive(on) {
    if (!stage) return;
    stage.classList.toggle("is-immersive", on);
    document.documentElement.classList.toggle("fumetto-immersive-lock", on);
    document.body.classList.toggle("fumetto-immersive-lock", on);
    if (on) lockLandscape();
    else unlockOrientation();
  }

  function syncFullscreenLabel() {
    if (!fullBtn) return;
    const on = stageIsFullscreen();
    fullBtn.setAttribute("aria-pressed", String(on));
    fullBtn.textContent = on ? "Esci" : "Schermo intero";
  }

  async function toggleFullscreen() {
    if (!stage) return;
    if (zoom && zoom.isZoomed()) zoom.reset();
    try {
      if (stage.classList.contains("is-immersive")) {
        setImmersive(false);
      } else if (document.fullscreenElement === stage || document.webkitFullscreenElement === stage) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        unlockOrientation();
      } else if (stage.requestFullscreen && document.fullscreenEnabled !== false) {
        await stage.requestFullscreen();
        lockLandscape();
      } else if (stage.webkitRequestFullscreen) {
        stage.webkitRequestFullscreen();
        lockLandscape();
        window.setTimeout(() => {
          if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            setImmersive(true);
            syncFullscreenLabel();
          }
        }, 120);
      } else {
        setImmersive(true);
      }
    } catch (err) {
      setImmersive(true);
    }
    syncFullscreenLabel();
  }

  if (fullBtn) {
    fullBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFullscreen();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && stage && stage.classList.contains("is-immersive")) {
      setImmersive(false);
      syncFullscreenLabel();
    }
  });
  function handleFullscreenChange() {
    if (zoom && zoom.isZoomed()) zoom.reset();
    if (stageIsFullscreen()) lockLandscape();
    else unlockOrientation();
    syncFullscreenLabel();
  }
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

  syncChrome();
})();

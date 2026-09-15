(function () {
  const captions = [
    "Tavola 1 — Tre pezzi della stessa forma: ghisa, acciaio, alluminio. Pesano tutti uguale?",
    "Tavola 2 — Peso specifico = massa ÷ volume. Stesso volume, massa diversa.",
    "Tavola 3 — Alluminio leggero, acciaio resistente, ghisa fragile ma buona in fusione.",
    "Tavola 4 — Il peso dipende dalla quantità; il peso specifico è una proprietà del materiale.",
  ];

  const pages = Array.from(document.querySelectorAll(".fumetto-page"));
  const statusNum = document.getElementById("fumetto-num");
  const caption = document.getElementById("fumetto-caption");
  const prevBtn = document.getElementById("fumetto-prev");
  const nextBtn = document.getElementById("fumetto-next");
  const dotsWrap = document.getElementById("fumetto-dots");
  const viewport = document.getElementById("fumetto-viewport");
  if (!pages.length || !viewport) return;

  let index = 0;
  let busy = false;
  const total = pages.length;
  const reduceMotion =
    document.body.classList.contains("reduced-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const zoom = window.FumettoZoom ? window.FumettoZoom.attach(viewport) : null;

  pages.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "fumetto-dot";
    dot.setAttribute("aria-label", `Vai alla tavola ${i + 1}`);
    dot.addEventListener("click", () => go(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.querySelectorAll(".fumetto-dot"));

  function clearFlipClasses(page) {
    page.classList.remove(
      "is-flip-out-next",
      "is-flip-in-next",
      "is-flip-out-prev",
      "is-flip-in-prev"
    );
  }

  function syncChrome() {
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    if (statusNum) statusNum.textContent = String(index + 1);
    if (caption) caption.textContent = captions[index] || "";
    prevBtn.disabled = index === 0 || busy;
    nextBtn.disabled = index === total - 1 || busy;
  }

  function settle(next) {
    if (zoom) zoom.reset();
    pages.forEach((page, i) => {
      clearFlipClasses(page);
      const active = i === next;
      page.classList.toggle("is-active", active);
      page.setAttribute("aria-hidden", active ? "false" : "true");
    });
    index = next;
    busy = false;
    syncChrome();
  }

  function go(next, forcedDir) {
    const target = Math.max(0, Math.min(total - 1, next));
    if (target === index || busy) return;
    if (zoom && zoom.isZoomed()) zoom.reset();
    const dir = forcedDir != null ? forcedDir : target > index ? 1 : -1;

    if (reduceMotion) {
      settle(target);
      return;
    }

    busy = true;
    const out = pages[index];
    const inn = pages[target];
    clearFlipClasses(out);
    clearFlipClasses(inn);
    out.classList.add(dir > 0 ? "is-flip-out-next" : "is-flip-out-prev");
    inn.classList.add(dir > 0 ? "is-flip-in-next" : "is-flip-in-prev");
    inn.classList.add("is-active");
    inn.setAttribute("aria-hidden", "false");
    out.setAttribute("aria-hidden", "true");

    const onEnd = (e) => {
      if (e.target !== out && e.target !== inn) return;
      out.removeEventListener("animationend", onEnd);
      inn.removeEventListener("animationend", onEnd);
      settle(target);
    };
    out.addEventListener("animationend", onEnd);
    inn.addEventListener("animationend", onEnd);
    syncChrome();
  }

  prevBtn.addEventListener("click", () => go(index - 1));
  nextBtn.addEventListener("click", () => go(index + 1));

  let touchStartX = 0;
  viewport.addEventListener(
    "touchstart",
    (e) => {
      if (zoom && zoom.isZoomed()) return;
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  viewport.addEventListener(
    "touchend",
    (e) => {
      if (zoom && zoom.isZoomed()) return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) go(index + 1);
      else go(index - 1);
    },
    { passive: true }
  );

  const stage = document.getElementById("fumetto-stage");
  const fullBtn = document.getElementById("fumetto-fullscreen");
  if (fullBtn && stage) {
    const immersive = () => {
      stage.classList.add("is-immersive");
      document.body.classList.add("fumetto-immersive-lock");
      fullBtn.setAttribute("aria-pressed", "true");
      fullBtn.textContent = "Esci";
    };
    const exitImmersive = () => {
      stage.classList.remove("is-immersive");
      document.body.classList.remove("fumetto-immersive-lock");
      fullBtn.setAttribute("aria-pressed", "false");
      fullBtn.textContent = "Schermo intero";
    };
    fullBtn.addEventListener("click", () => {
      if (stage.classList.contains("is-immersive")) {
        if (document.fullscreenElement) document.exitFullscreen();
        exitImmersive();
        return;
      }
      if (stage.requestFullscreen) {
        stage.requestFullscreen().then(immersive).catch(immersive);
      } else {
        immersive();
      }
    });
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && stage.classList.contains("is-immersive")) {
        exitImmersive();
      }
    });
  }

  syncChrome();
})();

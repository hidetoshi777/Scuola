/**
 * Stampa di TUTTO il fumetto (tutte le tavole), accanto a Schermo intero.
 * Su ogni tavola stampata compare in piccolo: Realizzato dal Prof. Rossano Bella.
 * Uso: bottone #fumetto-print + questo script su ogni fumetto.html.
 */
(function () {
  const STYLE_ID = "fumetto-print-style";
  const CREDITO = "Realizzato dal Prof. Rossano Bella";

  function ensurePrintCss() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
.fumetto-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

/* Layout lineare di tutte le tavole prima/durante la stampa */
body.fumetto-print-all .fumetto-intro,
body.fumetto-print-all .fumetto-toolbar,
body.fumetto-print-all .fumetto-controls,
body.fumetto-print-all .fumetto-hint,
body.fumetto-print-all .fumetto-caption,
body.fumetto-print-all .hero-actions {
  display: none !important;
}
body.fumetto-print-all .fumetto-viewport {
  position: static !important;
  width: 100% !important;
  max-width: 42rem !important;
  max-height: none !important;
  height: auto !important;
  aspect-ratio: auto !important;
  overflow: visible !important;
  border: 0 !important;
  margin-inline: auto !important;
  perspective: none !important;
}
body.fumetto-print-all .fumetto-page {
  position: static !important;
  inset: auto !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  transform: none !important;
  filter: none !important;
  animation: none !important;
  display: block !important;
  margin: 0 0 1.25rem !important;
}
body.fumetto-print-all .fumetto-page img {
  width: 100% !important;
  height: auto !important;
  max-height: none !important;
  object-fit: contain !important;
}
body.fumetto-print-all .fumetto-page::after {
  content: "${CREDITO}";
  display: block;
  margin-top: 0.35rem;
  font-family: system-ui, sans-serif;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #666;
  text-align: right;
}

@media print {
  @page { margin: 8mm; }
  html, body {
    background: #fff !important;
    color: #000 !important;
    height: auto !important;
    overflow: visible !important;
  }
  body.fumetto-immersive-lock,
  html.fumetto-immersive-lock {
    overflow: visible !important;
    height: auto !important;
  }
  .skip-link,
  header,
  footer,
  .site-footer,
  .chiusura,
  .codex-bar,
  .lane-bar,
  .topbar,
  .fumetto-intro,
  .fumetto-toolbar,
  .fumetto-controls,
  .fumetto-hint,
  .fumetto-caption,
  .hero-actions,
  .btn,
  nav {
    display: none !important;
  }
  .shell,
  .fumetto-main,
  .fumetto-reader,
  #fumetto-stage,
  .fumetto-reader.is-immersive {
    position: static !important;
    inset: auto !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
    background: transparent !important;
    overflow: visible !important;
  }
  .fumetto-viewport {
    position: static !important;
    width: 100% !important;
    max-width: none !important;
    max-height: none !important;
    height: auto !important;
    aspect-ratio: auto !important;
    overflow: visible !important;
    border: 0 !important;
    background: transparent !important;
    perspective: none !important;
    touch-action: auto !important;
  }
  .fumetto-page {
    position: static !important;
    inset: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
    transform: none !important;
    filter: none !important;
    animation: none !important;
    display: block !important;
    page-break-after: always;
    break-after: page;
    margin: 0 0 4mm !important;
  }
  .fumetto-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .fumetto-page img {
    width: 100% !important;
    height: auto !important;
    max-height: 250mm;
    object-fit: contain !important;
    background: transparent !important;
  }
  .fumetto-page::after {
    content: "${CREDITO}";
    display: block !important;
    margin-top: 2.5mm;
    font-family: system-ui, sans-serif;
    font-size: 7.5pt;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: #555 !important;
    text-align: right;
  }
}
`;
    document.head.appendChild(style);
  }

  function loadImage(img) {
    if (!img) return Promise.resolve();
    img.loading = "eager";
    img.setAttribute("fetchpriority", "high");
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      if (img.dataset.src && !img.src) img.src = img.dataset.src;
      else if (img.src) img.src = img.src;
    });
  }

  function prepareAllPages() {
    const pages = Array.from(document.querySelectorAll(".fumetto-page"));
    const restored = [];
    pages.forEach((page) => {
      restored.push({
        page,
        hidden: page.getAttribute("aria-hidden"),
        active: page.classList.contains("is-active"),
      });
      page.classList.add("is-active");
      page.removeAttribute("aria-hidden");
    });
    document.body.classList.add("fumetto-print-all");
    return restored;
  }

  function restorePages(restored) {
    document.body.classList.remove("fumetto-print-all");
    if (!restored) return;
    restored.forEach((item) => {
      item.page.classList.toggle("is-active", item.active);
      if (item.hidden == null) item.page.removeAttribute("aria-hidden");
      else item.page.setAttribute("aria-hidden", item.hidden);
    });
  }

  async function printAll() {
    const imgs = Array.from(document.querySelectorAll(".fumetto-page img"));
    const restored = prepareAllPages();
    try {
      await Promise.all(imgs.map(loadImage));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const cleanup = () => {
        restorePages(restored);
        window.removeEventListener("afterprint", cleanup);
      };
      window.addEventListener("afterprint", cleanup);
      window.print();
      setTimeout(cleanup, 2000);
    } catch (err) {
      restorePages(restored);
    }
  }

  function wirePrint() {
    ensurePrintCss();
    const btn = document.getElementById("fumetto-print");
    if (!btn || btn.dataset.printBound === "1") return;
    btn.dataset.printBound = "1";
    btn.setAttribute("aria-label", "Stampa tutto il fumetto");
    if (!btn.textContent.trim() || btn.textContent.trim() === "Stampa") {
      btn.textContent = "Stampa tutto";
    }
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      printAll();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wirePrint);
  } else {
    wirePrint();
  }
})();

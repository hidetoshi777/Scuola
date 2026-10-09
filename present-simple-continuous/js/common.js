(function () {
  const KEY = "tema-present-simple-continuous";
  const root = document.documentElement;
  const stored = localStorage.getItem(KEY);
  root.dataset.theme = stored === "light" || stored === "dark" ? stored : "dark";

  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    const syncLabel = () => {
      const light = root.dataset.theme === "light";
      toggle.setAttribute("aria-pressed", String(light));
      toggle.textContent = light ? "Scuro" : "Chiaro";
      toggle.setAttribute("aria-label", light ? "Passa al tema scuro" : "Passa al tema chiaro");
      const meta = document.getElementById("color-scheme");
      if (meta) meta.content = root.dataset.theme;
    };
    syncLabel();
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      localStorage.setItem(KEY, root.dataset.theme);
      syncLabel();
    });
  }

  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".tabbar a[href]").forEach((link) => {
    if (link.getAttribute("href") === here) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  /* Il timbro in testata: l'ora di ADESSO (right now). */
  const timbro = document.querySelector("[data-timbro]");
  if (timbro) {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      timbro.textContent = "NOW " + hh + ":" + mm;
    };
    tick();
    setInterval(tick, 15000);
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("reduced-motion");
  }

  window.mescola = function mescola(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  };

  /* Confronto risposte: ignora maiuscole, spazi doppi, apostrofi tipografici. */
  window.normalizza = function normalizza(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[’‘`´']/g, "")
      .replace(/[.!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  if (!window.ScuolaAccess) {
    const s = document.createElement("script");
    s.src = "../js/access-track.js?v=7";
    s.defer = true;
    document.head.appendChild(s);
  }
})();

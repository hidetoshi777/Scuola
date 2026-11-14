(function () {
  const KEY = "tema-directions";
  const root = document.documentElement;
  const stored = (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
  root.dataset.theme = stored === "light" || stored === "dark" ? stored : "dark";

  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    const sync = () => {
      const light = root.dataset.theme === "light";
      toggle.setAttribute("aria-pressed", String(light));
      toggle.textContent = light ? "☾ Scuro" : "☀ Chiaro";
      toggle.setAttribute("aria-label", light ? "Passa al tema scuro" : "Passa al tema chiaro");
      const meta = document.getElementById("color-scheme");
      if (meta) meta.content = root.dataset.theme;
    };
    sync();
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      try { localStorage.setItem(KEY, root.dataset.theme); } catch (e) { /* niente */ }
      sync();
    });
  }

  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".cartelli a[href]").forEach((a) => {
    if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  /* ---------- Voce: un solo audio alla volta ---------- */
  let corrente = null;
  let lento = false;
  const Voce = {
    get lento() { return lento; },
    set lento(v) { lento = !!v; },
    stop() {
      if (corrente) { corrente.pause(); corrente = null; }
    },
    /* Riproduce una chiave di FRASI. Ritorna una Promise che si risolve a fine audio
       (anche se l'audio fallisce, così un gioco non resta bloccato). */
    play(key) {
      Voce.stop();
      return new Promise((resolve) => {
        const a = new Audio("audio/" + key + ".mp3");
        a.playbackRate = lento ? 0.75 : 1;
        a.preservesPitch = true;
        corrente = a;
        let fatto = false;
        let timer = null;
        const fine = () => { if (!fatto) { fatto = true; clearTimeout(timer); resolve(); } };
        /* rete di sicurezza: se il browser non suona, non si aspetta più della clip */
        timer = setTimeout(fine, 6000);
        a.addEventListener("loadedmetadata", () => {
          if (!isFinite(a.duration)) return;
          clearTimeout(timer);
          timer = setTimeout(fine, (a.duration / a.playbackRate) * 1000 + 900);
        });
        a.addEventListener("ended", fine);
        a.addEventListener("error", () => setTimeout(fine, 400));
        a.play().catch(() => setTimeout(fine, 400));
      });
    },
    async sequenza(keys, pausa) {
      for (const k of keys) {
        await Voce.play(k);
        await attendi(pausa == null ? 250 : pausa);
      }
    },
  };
  window.Voce = Voce;

  const attendi = (ms) => new Promise((r) => setTimeout(r, ms));
  window.attendi = attendi;

  /* Bottoni 🔊 dichiarativi: <button data-voce="w_bank"> */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-voce]");
    if (!b) return;
    e.preventDefault();
    const keys = b.dataset.voce.split(/\s+/);
    b.classList.add("suona");
    Voce.sequenza(keys, 350).then(() => b.classList.remove("suona"));
  });

  window.mescola = function mescola(lista) {
    const c = lista.slice();
    for (let i = c.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
  };

  /* I posti: nome inglese e italiano presi da FRASI (sorgente unica). */
  const F = window.FRASI || {};
  const posto = (id) => ({ id, en: (F["w_" + id] || {}).en || id, it: (F["w_" + id] || {}).it || "" });
  window.POSTO = posto;

  /* Disegna un'icona: <svg class="ico-posto"><use href="#ic-ID"></svg> */
  window.icona = function icona(id, cls) {
    return `<svg class="${cls || "ico-posto"}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#ic-${id}"/></svg>`;
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("reduced-motion");
  }

  if (!window.ScuolaAccess) {
    const s = document.createElement("script");
    s.src = "../js/access-track.js?v=7";
    s.defer = true;
    document.head.appendChild(s);
  }
})();

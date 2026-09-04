(function () {
  const root = document.documentElement;
  const KEY = "tema-manzoni-promessi";
  const stored = localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") {
    root.dataset.theme = stored;
  } else {
    root.dataset.theme = "dark";
  }

  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    const syncLabel = () => {
      const light = root.dataset.theme === "light";
      toggle.setAttribute("aria-pressed", String(light));
      toggle.textContent = light ? "Tema scuro" : "Tema chiaro";
    };
    syncLabel();
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      localStorage.setItem(KEY, root.dataset.theme);
      syncLabel();
    });
  }

  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === here || (here === "" && href === "index.html")) {
      link.setAttribute("aria-current", "page");
    }
  });

  const menoMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (menoMovimento) {
    document.body.classList.add("reduced-motion");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const bersagli = document.querySelectorAll(".reveal");
    if (!bersagli.length) return;
    if (menoMovimento || !("IntersectionObserver" in window)) {
      bersagli.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const osservatore = new IntersectionObserver(
      (voci) => {
        voci.forEach((voce) => {
          if (voce.isIntersecting) {
            voce.target.classList.add("is-visible");
            osservatore.unobserve(voce.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    bersagli.forEach((el) => osservatore.observe(el));
  });

  window.AudioUi = {
    enabled: true,
    beep(kind) {
      if (!this.enabled) return;
      try {
        const ctx = this._ctx || (this._ctx = new (window.AudioContext || window.webkitAudioContext)());
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = kind === "ok" ? 540 : kind === "win" ? 720 : kind === "page" ? 280 : 180;
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === "win" ? 0.4 : 0.15));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (kind === "win" ? 0.42 : 0.16));
      } catch (err) {
        this.enabled = false;
      }
    },
  };

  window.mescola = function mescola(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  };

  window.Progressi = {
    _chiave: "progressi-manzoni-promessi",
    leggi() {
      try {
        return JSON.parse(localStorage.getItem(this._chiave)) || {};
      } catch (err) {
        return {};
      }
    },
    scrivi(dati) {
      try {
        localStorage.setItem(this._chiave, JSON.stringify(dati));
      } catch (err) {
        /* ignore */
      }
    },
    registra(categoria, giusto) {
      const dati = this.leggi();
      const voce = dati[categoria] || { giusti: 0, totali: 0 };
      voce.totali += 1;
      if (giusto) voce.giusti += 1;
      dati[categoria] = voce;
      this.scrivi(dati);
    },
  };
})();

(function () {
  const root = document.documentElement;
  const stored = localStorage.getItem("tema-grammatica");
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
      localStorage.setItem("tema-grammatica", root.dataset.theme);
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

  // Comparsa progressiva dei blocchi allo scorrimento.
  document.addEventListener("DOMContentLoaded", () => {
    const bersagli = document.querySelectorAll(".reveal");
    if (!bersagli.length) {
      return;
    }
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
})();

/* Suono: due note brevi, volutamente sobrie. */
window.AudioUi = {
  enabled: true,
  beep(kind) {
    if (!this.enabled) {
      return;
    }
    try {
      const ctx = this._ctx || (this._ctx = new (window.AudioContext || window.webkitAudioContext)());
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = kind === "ok" ? 620 : kind === "win" ? 830 : 190;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === "win" ? 0.4 : 0.16));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (kind === "win" ? 0.42 : 0.18));
    } catch (err) {
      this.enabled = false;
    }
  },
};

/* Progressi salvati sul dispositivo: nessun dato lascia il browser. */
window.Progressi = {
  _chiave: "progressi-grammatica",

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
      /* spazio esaurito o navigazione privata: si continua senza salvare */
    }
  },

  /* Registra un tentativo su una categoria, per sapere dove si sbaglia di più. */
  registra(categoria, giusto) {
    const dati = this.leggi();
    const voce = dati[categoria] || { giusti: 0, totali: 0 };
    voce.totali += 1;
    if (giusto) {
      voce.giusti += 1;
    }
    dati[categoria] = voce;
    this.scrivi(dati);
  },

  /* Categoria con la percentuale di successo più bassa (almeno 3 tentativi). */
  puntoDebole() {
    const dati = this.leggi();
    let peggiore = null;
    Object.keys(dati).forEach((id) => {
      const v = dati[id];
      if (v.totali < 3) {
        return;
      }
      const quota = v.giusti / v.totali;
      if (!peggiore || quota < peggiore.quota) {
        peggiore = { id, quota, ...v };
      }
    });
    return peggiore;
  },

  azzera() {
    this.scrivi({});
  },
};

/* Mescola una copia dell'array, senza toccare l'originale. */
window.mescola = function mescola(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

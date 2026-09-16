(function () {
  const KEY = "tema-presentazioni-inglese";
  const root = document.documentElement;
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
      toggle.textContent = light ? "Scuro" : "Chiaro";
      toggle.setAttribute("aria-label", light ? "Passa al tema scuro" : "Passa al tema chiaro");
    };
    syncLabel();
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      localStorage.setItem(KEY, root.dataset.theme);
      syncLabel();
    });
  }

  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".hello-nav a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === here || (here === "" && href === "index.html")) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const menoMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (menoMovimento) document.body.classList.add("reduced-motion");

  window.mescola = function mescola(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  };

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

  if (!window.ScuolaAccess) {
    const s = document.createElement("script");
    s.src = "../js/access-track.js?v=2";
    s.defer = true;
    document.head.appendChild(s);
  }
})();

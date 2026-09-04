(function () {
  const root = document.documentElement;
  const stored = localStorage.getItem("tema-nazismo-fumetto");
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
      localStorage.setItem("tema-nazismo-fumetto", root.dataset.theme);
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

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("reduced-motion");
  }

  /* Sonoro leggero: click e note sobrie, senza file esterni. */
  window.AudioUi = {
    enabled: localStorage.getItem("audio-nazismo-fumetto") !== "off",
    beep(kind) {
      if (!this.enabled) {
        return;
      }
      try {
        const ctx = this._ctx || (this._ctx = new (window.AudioContext || window.webkitAudioContext)());
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        const osc = ctx.createOscillator();
        osc.type = kind === "page" ? "sine" : "triangle";
        const freq = kind === "ok" ? 520 : kind === "page" ? 240 : kind === "choice" ? 360 : 190;
        osc.frequency.setValueAtTime(freq, now);
        if (kind === "page") {
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
        }
        gain.gain.setValueAtTime(kind === "page" ? 0.03 : 0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "page" ? 0.28 : 0.12));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } catch (err) {
        this.enabled = false;
      }
    },
    setEnabled(on) {
      this.enabled = on;
      try {
        localStorage.setItem("audio-nazismo-fumetto", on ? "on" : "off");
      } catch (err) {
        /* ignore */
      }
    },
  };

  const audioToggle = document.querySelector("[data-audio-toggle]");
  if (audioToggle && window.AudioUi) {
    const syncAudio = () => {
      audioToggle.setAttribute("aria-pressed", String(window.AudioUi.enabled));
      audioToggle.textContent = window.AudioUi.enabled ? "Suono: acceso" : "Suono: spento";
    };
    syncAudio();
    audioToggle.addEventListener("click", () => {
      window.AudioUi.setEnabled(!window.AudioUi.enabled);
      syncAudio();
      if (window.AudioUi.enabled) {
        window.AudioUi.beep("ok");
      }
    });
  }
})();

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

  /* Sonoro leggero sintetico: più effetti, nessun file esterno. */
  window.AudioUi = {
    enabled: localStorage.getItem("audio-nazismo-fumetto") !== "off",
    _tone(ctx, { type = "sine", freq = 220, freqEnd, start = 0, dur = 0.2, vol = 0.04 }) {
      const now = ctx.currentTime + start;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1800;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 40), now + dur);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    },
    _noise(ctx, { start = 0, dur = 0.18, vol = 0.02 }) {
      const now = ctx.currentTime + start;
      const len = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 900;
      filter.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + dur + 0.02);
    },
    beep(kind) {
      if (!this.enabled) {
        return;
      }
      try {
        const ctx = this._ctx || (this._ctx = new (window.AudioContext || window.webkitAudioContext)());
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        switch (kind) {
          case "page":
            this._noise(ctx, { dur: 0.16, vol: 0.018 });
            this._tone(ctx, { type: "sine", freq: 260, freqEnd: 140, dur: 0.28, vol: 0.028 });
            break;
          case "scene":
            this._noise(ctx, { dur: 0.22, vol: 0.02 });
            this._tone(ctx, { type: "triangle", freq: 180, freqEnd: 110, dur: 0.35, vol: 0.03 });
            this._tone(ctx, { type: "sine", freq: 320, freqEnd: 240, start: 0.05, dur: 0.25, vol: 0.016 });
            break;
          case "choice":
            this._tone(ctx, { type: "triangle", freq: 420, freqEnd: 520, dur: 0.1, vol: 0.04 });
            this._tone(ctx, { type: "sine", freq: 620, start: 0.06, dur: 0.08, vol: 0.02 });
            break;
          case "ok":
            this._tone(ctx, { type: "sine", freq: 480, dur: 0.1, vol: 0.035 });
            this._tone(ctx, { type: "sine", freq: 640, start: 0.08, dur: 0.14, vol: 0.03 });
            break;
          case "bad":
            this._tone(ctx, { type: "triangle", freq: 220, freqEnd: 140, dur: 0.22, vol: 0.035 });
            break;
          case "type":
            this._tone(ctx, { type: "square", freq: 700, dur: 0.035, vol: 0.012 });
            break;
          case "epilogue":
            this._tone(ctx, { type: "sine", freq: 392, dur: 0.35, vol: 0.03 });
            this._tone(ctx, { type: "sine", freq: 494, start: 0.12, dur: 0.4, vol: 0.028 });
            this._tone(ctx, { type: "sine", freq: 587, start: 0.24, dur: 0.5, vol: 0.024 });
            break;
          case "somber":
            this._tone(ctx, { type: "sine", freq: 160, freqEnd: 110, dur: 0.55, vol: 0.03 });
            this._tone(ctx, { type: "triangle", freq: 220, freqEnd: 160, start: 0.08, dur: 0.45, vol: 0.018 });
            break;
          case "warm":
            this._tone(ctx, { type: "sine", freq: 330, dur: 0.3, vol: 0.025 });
            this._tone(ctx, { type: "sine", freq: 415, start: 0.1, dur: 0.35, vol: 0.022 });
            break;
          default:
            this._tone(ctx, { type: "triangle", freq: 300, dur: 0.12, vol: 0.03 });
        }
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

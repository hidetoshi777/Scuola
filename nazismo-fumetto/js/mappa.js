(function () {
  const steps = [
    {
      year: "1937",
      title: "Germania prima dell’espansione",
      text: "Sulla mappa reale dell’Europa, il Reich è ancora nei confini di Versailles. L’espansione territoriale vera inizia nel 1938.",
      core: ["DE"],
      annex: [],
      occ: [],
      adv: [],
    },
    {
      year: "1938",
      title: "Anschluss: l’Austria",
      text: "Marzo 1938: l’Austria viene annessa. È il primo grande cambiamento di carta: un intero Stato sparisce nel Reich.",
      core: ["DE"],
      annex: ["AT"],
      occ: [],
      adv: [],
    },
    {
      year: "1938",
      title: "Sudeti (Cecoslovacchia)",
      text: "Autunno 1938: con gli accordi di Monaco Hitler ottiene i Sudeti. Qui evidenziamo la Cecoslovacchia (oggi Cechia + Slovacchia), sotto pressione e smembramento.",
      core: ["DE"],
      annex: ["AT"],
      occ: ["CZ", "SK"],
      adv: [],
    },
    {
      year: "1939",
      title: "Boemia e Moravia",
      text: "Marzo 1939: la Cechia diventa Protettorato; la Slovacchia un satellite. La politica delle «annessioni pacifiche» è finita.",
      core: ["DE"],
      annex: ["AT", "CZ"],
      occ: ["SK"],
      adv: [],
    },
    {
      year: "1939",
      title: "Invasione della Polonia",
      text: "1° settembre 1939: invasione della Polonia e inizio della Seconda guerra mondiale. L’occupazione militare diventa il metodo principale.",
      core: ["DE"],
      annex: ["AT", "CZ"],
      occ: ["SK", "PL"],
      adv: [],
    },
    {
      year: "1940",
      title: "Europa occidentale",
      text: "1940: Danimarca, Norvegia, Paesi Bassi, Belgio, Lussemburgo e gran parte della Francia. In pochi mesi il centro-ovest europeo è sotto controllo nazista.",
      core: ["DE"],
      annex: ["AT", "CZ"],
      occ: ["SK", "PL", "DK", "NO", "NL", "BE", "LU", "FR"],
      adv: [],
    },
    {
      year: "1941",
      title: "Balcani e Barbarossa",
      text: "1941: campagna nei Balcani, poi attacco all’URSS. Qui compaiono Grecia e Jugoslavia (Stati odierni) e l’avanzata su Baltico, Bielorussia e Ucraina.",
      core: ["DE"],
      annex: ["AT", "CZ"],
      occ: [
        "SK",
        "PL",
        "DK",
        "NO",
        "NL",
        "BE",
        "LU",
        "FR",
        "SI",
        "HR",
        "BA",
        "RS",
        "ME",
        "MK",
        "AL",
        "GR",
        "EE",
        "LV",
        "LT",
      ],
      adv: ["BY", "UA"],
    },
    {
      year: "1942",
      title: "Massima espansione",
      text: "Intorno al 1942 il sistema di controllo (occupazione + alleati/satelliti come Ungheria, Romania, Bulgaria) tocca il punto più ampio. Poi inizia il ripiegamento.",
      core: ["DE"],
      annex: ["AT", "CZ", "HU"],
      occ: [
        "SK",
        "PL",
        "DK",
        "NO",
        "NL",
        "BE",
        "LU",
        "FR",
        "SI",
        "HR",
        "BA",
        "RS",
        "ME",
        "MK",
        "AL",
        "GR",
        "EE",
        "LV",
        "LT",
        "RO",
        "BG",
      ],
      adv: ["BY", "UA"],
    },
  ];

  const host = document.getElementById("mappa-svg-host");
  const yearEl = document.getElementById("mappa-year");
  const titleEl = document.getElementById("mappa-title-step");
  const textEl = document.getElementById("mappa-text");
  const stepLabel = document.getElementById("mappa-step-label");
  const slider = document.getElementById("mappa-slider");
  const playBtn = document.getElementById("mappa-play");
  const prevBtn = document.getElementById("mappa-prev");
  const nextBtn = document.getElementById("mappa-next");

  if (!host || !slider) {
    return;
  }

  let index = 0;
  let playing = false;
  let timer = null;
  let paths = [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const labelNames = {
    DE: "Germania",
    AT: "Austria",
    PL: "Polonia",
    FR: "Francia",
    IT: "Italia",
    GB: "GB",
    ES: "Spagna",
    RU: "URSS",
  };

  function clearClasses(path) {
    path.classList.remove("is-core", "is-annex", "is-occ", "is-adv", "is-flash");
  }

  function applyStep(i, animate) {
    index = i;
    const step = steps[i];
    yearEl.textContent = step.year;
    titleEl.textContent = step.title;
    textEl.textContent = step.text;
    stepLabel.textContent = `Passo ${i + 1} di ${steps.length}`;
    slider.value = String(i);

    const sets = {
      "is-core": new Set(step.core),
      "is-annex": new Set(step.annex),
      "is-occ": new Set(step.occ),
      "is-adv": new Set(step.adv),
    };

    paths.forEach((path) => {
      const iso = path.getAttribute("data-iso");
      const prev = path.className.baseVal || "";
      clearClasses(path);
      let next = null;
      Object.keys(sets).forEach((cls) => {
        if (sets[cls].has(iso)) {
          next = cls;
        }
      });
      if (next) {
        path.classList.add(next);
        if (animate && !prev.includes(next)) {
          path.classList.add("is-flash");
        }
      }
    });

    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === steps.length - 1;
    if (window.AudioUi) {
      window.AudioUi.beep(i === 0 ? "page" : i === steps.length - 1 ? "somber" : "scene");
    }
  }

  function stopPlay() {
    playing = false;
    playBtn.textContent = "▶ Play";
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startPlay() {
    playing = true;
    playBtn.textContent = "⏸ Pausa";
    timer = window.setInterval(() => {
      if (index >= steps.length - 1) {
        stopPlay();
        return;
      }
      applyStep(index + 1, !reduceMotion);
    }, reduceMotion ? 2200 : 1700);
  }

  function addLabels(svg) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "labels");
    g.setAttribute("fill", "#d5deea");
    g.setAttribute("font-family", "Sora, sans-serif");
    g.setAttribute("font-size", "12");
    g.setAttribute("pointer-events", "none");
    Object.keys(labelNames).forEach((iso) => {
      const path = svg.querySelector(`#c-${iso}`);
      if (!path || !path.getBBox) {
        return;
      }
      try {
        const b = path.getBBox();
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", String(b.x + b.width / 2));
        t.setAttribute("y", String(b.y + b.height / 2));
        t.setAttribute("text-anchor", "middle");
        t.textContent = labelNames[iso];
        g.appendChild(t);
      } catch (err) {
        /* ignore */
      }
    });
    svg.appendChild(g);
  }

  fetch("img/europe-real.svg")
    .then((r) => r.text())
    .then((svgText) => {
      host.innerHTML = svgText;
      const svg = host.querySelector("svg");
      if (!svg) {
        throw new Error("SVG mancante");
      }
      svg.classList.add("mappa-svg");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Mappa reale dell’Europa con espansione tedesca animata");
      paths = Array.from(svg.querySelectorAll(".lands path"));
      addLabels(svg);

      playBtn.addEventListener("click", () => {
        if (playing) {
          stopPlay();
          return;
        }
        if (index >= steps.length - 1) {
          applyStep(0, false);
        }
        startPlay();
      });
      prevBtn.addEventListener("click", () => {
        stopPlay();
        applyStep(Math.max(0, index - 1), !reduceMotion);
      });
      nextBtn.addEventListener("click", () => {
        stopPlay();
        applyStep(Math.min(steps.length - 1, index + 1), !reduceMotion);
      });
      slider.addEventListener("input", () => {
        stopPlay();
        applyStep(Number(slider.value), !reduceMotion);
      });

      applyStep(0, false);
    })
    .catch(() => {
      host.innerHTML = "<p class='live'>Impossibile caricare la mappa dell’Europa.</p>";
    });
})();

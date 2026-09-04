(function () {
  const steps = [
    {
      year: "1937",
      title: "Germania prima dell’espansione",
      text: "I confini sono ancora quelli dell’Europa di Versailles. Il regime è già dittatoriale, ma la conquista territoriale vera inizia dopo.",
      core: ["r-germany"],
      annex: [],
      occ: [],
      adv: [],
    },
    {
      year: "1938",
      title: "Anschluss: l’Austria",
      text: "Marzo 1938: l’Austria viene annessa al Reich. È il primo grande salto oltre i confini: Europa inizia a cambiare carta.",
      core: ["r-germany"],
      annex: ["r-austria"],
      occ: [],
      adv: [],
    },
    {
      year: "1938",
      title: "Sudeti",
      text: "Autunno 1938: a Monaco le democrazie europee cedono i Sudeti. Hitler ottiene territorio senza ancora una guerra generale.",
      core: ["r-germany"],
      annex: ["r-austria", "r-sudeten"],
      occ: [],
      adv: [],
    },
    {
      year: "1939",
      title: "Boemia e Moravia",
      text: "Marzo 1939: sparisce la Cecoslovacchia indipendente. Nasce il Protettorato di Boemia e Moravia. La maschera «pacifica» cade.",
      core: ["r-germany"],
      annex: ["r-austria", "r-sudeten", "r-czech"],
      occ: [],
      adv: [],
    },
    {
      year: "1939",
      title: "Invasione della Polonia",
      text: "1° settembre 1939: scoppia la Seconda guerra mondiale. La Polonia viene invasa e smembrata. L’occupazione militare diventa metodo.",
      core: ["r-germany"],
      annex: ["r-austria", "r-sudeten", "r-czech"],
      occ: ["r-poland"],
      adv: [],
    },
    {
      year: "1940",
      title: "Europa occidentale",
      text: "1940: Danimarca, Norvegia, Paesi Bassi, Belgio e gran parte della Francia cadono in pochi mesi. Il Reich domina il centro-ovest europeo.",
      core: ["r-germany"],
      annex: ["r-austria", "r-sudeten", "r-czech"],
      occ: ["r-poland", "r-denmark", "r-norway", "r-netherlands", "r-belgium", "r-france"],
      adv: [],
    },
    {
      year: "1941",
      title: "Balcani e attacco all’URSS",
      text: "1941: campagna nei Balcani, poi Operazione Barbarossa contro l’Unione Sovietica. La guerra diventa continentale e di sterminio.",
      core: ["r-germany"],
      annex: ["r-austria", "r-sudeten", "r-czech"],
      occ: [
        "r-poland",
        "r-denmark",
        "r-norway",
        "r-netherlands",
        "r-belgium",
        "r-france",
        "r-yugoslavia",
        "r-greece",
        "r-baltic",
      ],
      adv: ["r-ussr-west"],
    },
    {
      year: "1942",
      title: "Massima espansione",
      text: "Intorno al 1942 il controllo nazista tocca il punto più ampio. Poi la marea inizia a ritirarsi: Stalingrado e la controffensiva alleata cambieranno tutto.",
      core: ["r-germany"],
      annex: ["r-austria", "r-sudeten", "r-czech", "r-hungary"],
      occ: [
        "r-poland",
        "r-denmark",
        "r-norway",
        "r-netherlands",
        "r-belgium",
        "r-france",
        "r-yugoslavia",
        "r-greece",
        "r-baltic",
        "r-romania",
        "r-bulgaria",
        "r-north-africa",
      ],
      adv: ["r-ussr-west"],
    },
  ];

  const yearEl = document.getElementById("mappa-year");
  const titleEl = document.getElementById("mappa-title-step");
  const textEl = document.getElementById("mappa-text");
  const stepLabel = document.getElementById("mappa-step-label");
  const slider = document.getElementById("mappa-slider");
  const playBtn = document.getElementById("mappa-play");
  const prevBtn = document.getElementById("mappa-prev");
  const nextBtn = document.getElementById("mappa-next");
  const paths = Array.from(document.querySelectorAll(".mappa-svg .lands path"));

  if (!yearEl || !slider || !paths.length) {
    return;
  }

  let index = 0;
  let playing = false;
  let timer = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const map = {
      "is-core": new Set(step.core),
      "is-annex": new Set(step.annex),
      "is-occ": new Set(step.occ),
      "is-adv": new Set(step.adv),
    };

    paths.forEach((path) => {
      const before = path.className.baseVal || path.getAttribute("class") || "";
      clearClasses(path);
      let next = null;
      Object.keys(map).forEach((cls) => {
        if (map[cls].has(path.id)) {
          next = cls;
        }
      });
      if (next) {
        path.classList.add(next);
        if (animate && !before.includes(next.replace("is-", ""))) {
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
})();

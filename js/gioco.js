document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro-gioco");
  const partita = document.getElementById("partita");
  const domanda = document.getElementById("domanda");
  const opzioni = document.getElementById("opzioni");
  const feedback = document.getElementById("feedback");
  const avanti = document.getElementById("avanti");
  const globoBox = document.getElementById("globo-box");
  const canvas = document.getElementById("globo-gioco");
  const numProva = document.getElementById("num-prova");
  const totProve = document.getElementById("tot-prove");
  const punteggioEl = document.getElementById("punteggio");
  const barra = document.getElementById("barra");
  const dialog = document.getElementById("fine-dialogo");
  const stelle = document.getElementById("stelle");
  const fineTesto = document.getElementById("fine-testo");
  const suonoBtn = document.getElementById("suono");

  const prove = [
    {
      type: "quiz",
      q: "Che cos’è la rotazione della Terra?",
      options: [
        "Il giro della Terra intorno al Sole",
        "Il giro della Terra su se stessa",
        "Il movimento della Luna intorno alla Terra",
        "Il movimento delle nuvole",
      ],
      correct: 1,
      explain: "La rotazione è il moto della Terra intorno al proprio asse, come una trottola.",
    },
    {
      type: "quiz",
      q: "Quanto dura, circa, una rotazione completa?",
      options: ["1 ora", "24 ore", "7 giorni", "365 giorni"],
      correct: 1,
      explain: "Un giro completo dura circa 24 ore: è la durata del giorno.",
    },
    {
      type: "quiz",
      q: "In quale direzione ruota la Terra?",
      options: ["Da est verso ovest", "Da ovest verso est", "Dal basso verso l’alto", "Solo di notte"],
      correct: 1,
      explain: "La Terra ruota da ovest verso est. Per questo il Sole sembra sorgere a est.",
    },
    {
      type: "quiz",
      q: "Qual è la conseguenza principale della rotazione?",
      options: ["Le stagioni", "Le maree", "Il giorno e la notte", "I terremoti"],
      correct: 2,
      explain: "Mentre la Terra gira, i luoghi passano dalla luce del Sole all’ombra: giorno e notte.",
    },
    {
      type: "daynight",
      q: "Guarda il globo. A Roma, in questa posizione, è giorno o notte?",
      city: "roma",
      rotation: 0.6,
      explain: "Roma è di giorno se si trova nella metà illuminata, di notte se è in ombra.",
    },
    {
      type: "quiz",
      q: "Perché vediamo il Sole muoversi nel cielo durante il giorno?",
      options: [
        "Perché il Sole gira intorno alla Terra in 24 ore",
        "Perché è un moto apparente: siamo noi a ruotare",
        "Perché il cielo ruota da solo",
        "Perché le nuvole lo spingono",
      ],
      correct: 1,
      explain: "Si chiama moto apparente: il Sole sembra spostarsi da est a ovest, ma a muoversi è la Terra.",
    },
    {
      type: "pick",
      q: "Tocca le città dove, in questa posizione, è NOTTE. Poi conferma.",
      rotation: 1.2,
      explain: "Le città nella metà in ombra sono di notte; quelle illuminate dal Sole sono di giorno.",
    },
    {
      type: "quiz",
      q: "Che differenza c’è tra rotazione e rivoluzione?",
      options: [
        "Sono la stessa cosa",
        "La rotazione è intorno all’asse, la rivoluzione intorno al Sole",
        "La rivoluzione dura 24 ore",
        "La rotazione causa le stagioni",
      ],
      correct: 1,
      explain: "Rotazione = giro su se stessa (giorno e notte). Rivoluzione = giro intorno al Sole (anno e stagioni).",
    },
    {
      type: "daynight",
      q: "Guarda Tokyo sul globo. In questa posizione è giorno o notte?",
      city: "tokyo",
      rotation: 2.4,
      explain: "Tokyo è lontana da Roma: quando da una parte è giorno, dall’altra può essere notte.",
    },
    {
      type: "quiz",
      q: "Il Sole sorge a…",
      options: ["Nord", "Sud", "Est", "Ovest"],
      correct: 2,
      explain: "Sorge a est e tramonta a ovest, perché la Terra ruota verso est.",
    },
    {
      type: "pick",
      q: "Tocca le città dove è GIORNO. Poi conferma.",
      rotation: 3.5,
      explain: "Cerca i puntini nella metà chiara, quella colpita dalla luce del Sole.",
    },
    {
      type: "quiz",
      q: "Quale moto dura circa un anno?",
      options: ["La rotazione", "La rivoluzione", "Il moto apparente del Sole in un giorno", "Il vento"],
      correct: 1,
      explain: "La rivoluzione intorno al Sole dura circa 365 giorni, cioè un anno.",
    },
  ];

  let index = 0;
  let score = 0;
  let locked = false;
  let globe = null;
  totProve.textContent = String(prove.length);

  suonoBtn?.addEventListener("click", () => {
    AudioUi.enabled = !AudioUi.enabled;
    suonoBtn.setAttribute("aria-pressed", String(AudioUi.enabled));
    suonoBtn.textContent = AudioUi.enabled ? "Suono: acceso" : "Suono: spento";
  });

  document.getElementById("inizia")?.addEventListener("click", start);
  avanti?.addEventListener("click", () => {
    index += 1;
    if (index >= prove.length) {
      finish();
    } else {
      show();
    }
  });
  document.getElementById("stampa")?.addEventListener("click", () => window.print());
  dialog?.addEventListener("close", () => {
    if (dialog.returnValue === "replay") {
      start();
    }
  });

  function start() {
    index = 0;
    score = 0;
    intro.hidden = true;
    partita.hidden = false;
    show();
  }

  function show() {
    locked = false;
    avanti.hidden = true;
    feedback.textContent = "";
    opzioni.replaceChildren();
    const item = prove[index];
    domanda.textContent = item.q;
    numProva.textContent = String(index + 1);
    punteggioEl.textContent = String(score);
    barra.style.width = `${(index / prove.length) * 100}%`;

    if (item.type === "quiz") {
      globoBox.hidden = true;
      destroyGlobe();
      item.options.forEach((label, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = `${i + 1}. ${label}`;
        btn.addEventListener("click", () => gradeQuiz(i));
        opzioni.append(btn);
      });
    } else if (item.type === "daynight") {
      setupGlobe(item);
      ["Giorno", "Notte"].forEach((label) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = label;
        btn.addEventListener("click", () => gradeDayNight(label === "Giorno"));
        opzioni.append(btn);
      });
    } else {
      setupGlobe(item);
      const picks = document.createElement("div");
      picks.className = "city-pick";
      Terra.CITIES.forEach((city) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = city.name;
        btn.dataset.id = city.id;
        btn.setAttribute("aria-pressed", "false");
        btn.addEventListener("click", () => {
          const pressed = btn.getAttribute("aria-pressed") === "true";
          btn.setAttribute("aria-pressed", String(!pressed));
        });
        picks.append(btn);
      });
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "btn btn-primary";
      confirm.textContent = "Conferma";
      confirm.addEventListener("click", () => gradePick(picks, item));
      opzioni.append(picks, confirm);
    }
  }

  function setupGlobe(item) {
    globoBox.hidden = false;
    destroyGlobe();
    globe = Terra.create(canvas, {
      autoRotate: false,
      interactive: false,
      highlight: item.city || "roma",
      rotation: item.rotation,
    });
    globe.setRotation(item.rotation);
  }

  function destroyGlobe() {
    if (globe) {
      globe.destroy();
      globe = null;
    }
  }

  function gradeQuiz(choice) {
    if (locked) {
      return;
    }
    locked = true;
    const item = prove[index];
    const buttons = [...opzioni.querySelectorAll("button")];
    buttons.forEach((btn, i) => {
      if (i === item.correct) {
        btn.classList.add("is-correct");
      }
      if (i === choice && choice !== item.correct) {
        btn.classList.add("is-wrong");
      }
    });
    settle(choice === item.correct, item.explain);
  }

  function gradeDayNight(saidDay) {
    if (locked) {
      return;
    }
    locked = true;
    const item = prove[index];
    const city = Terra.CITIES.find((c) => c.id === item.city);
    const actualDay = Terra.isDay(city.lat, city.lon, item.rotation);
    [...opzioni.querySelectorAll("button")].forEach((btn) => {
      const isDayBtn = btn.textContent === "Giorno";
      if (isDayBtn === actualDay) {
        btn.classList.add("is-correct");
      }
      if (isDayBtn === saidDay && saidDay !== actualDay) {
        btn.classList.add("is-wrong");
      }
    });
    settle(saidDay === actualDay, `${item.explain} In questa posizione a ${city.name} è ${actualDay ? "giorno" : "notte"}.`);
  }

  function gradePick(picks, item) {
    if (locked) {
      return;
    }
    locked = true;
    const selected = [...picks.querySelectorAll("[aria-pressed='true']")].map((btn) => btn.dataset.id);
    const wantNight = item.q.includes("NOTTE");
    const correctIds = Terra.CITIES.filter((city) => Terra.isDay(city.lat, city.lon, item.rotation) !== wantNight).map(
      (city) => city.id,
    );
    const same =
      selected.length === correctIds.length && selected.every((id) => correctIds.includes(id));
    settle(same, `${item.explain} Risposta corretta: ${correctIds.map(idToName).join(", ")}.`);
  }

  function idToName(id) {
    return Terra.CITIES.find((city) => city.id === id)?.name || id;
  }

  function settle(ok, text) {
    if (ok) {
      score += 1;
      AudioUi.beep("ok");
      feedback.textContent = `Bravo! ${text}`;
    } else {
      AudioUi.beep("bad");
      feedback.textContent = `Quasi: ${text}`;
    }
    punteggioEl.textContent = String(score);
    avanti.hidden = false;
    avanti.focus();
  }

  function finish() {
    destroyGlobe();
    partita.hidden = true;
    intro.hidden = false;
    barra.style.width = "100%";
    const stars = score >= 11 ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0;
    stelle.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    const title =
      stars === 3 ? "Esperto della rotazione" : stars === 2 ? "Ottimo lavoro" : stars === 1 ? "Buon inizio" : "Riprova: stai imparando";
    document.getElementById("fine-titolo").textContent = title;
    fineTesto.textContent = `Hai risposto bene a ${score} prove su ${prove.length}.`;
    if (stars === 3) {
      AudioUi.beep("win");
    }
    dialog.showModal();
  }
});

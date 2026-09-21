(function () {
  /** Filo mancante → circuito aperto */
  const wires = {
    w1: true,
    w2: true,
    w3: true,
    w4: true,
  };

  let switchClosed = false;

  const bulbEl = document.getElementById("game-bulb");
  const msgEl = document.getElementById("game-msg");
  const switchBtn = document.getElementById("game-switch");
  const wireBtns = document.querySelectorAll("[data-wire]");
  const schemaPaths = document.querySelectorAll(".schema-wire");

  function allWiresOn() {
    return wires.w1 && wires.w2 && wires.w3 && wires.w4;
  }

  function circuitClosed() {
    return allWiresOn() && switchClosed;
  }

  function updateSchema() {
    schemaPaths.forEach((path) => {
      const id = path.getAttribute("data-seg");
      const on = id === "sw" ? switchClosed : wires[id];
      path.classList.toggle("seg-off", !on);
      path.classList.toggle("seg-on", on);
    });
  }

  function diagnose() {
    if (!wires.w1 || !wires.w2 || !wires.w3 || !wires.w4) {
      const missing = [];
      if (!wires.w1) missing.push("filo generatore → interruttore");
      if (!wires.w2) missing.push("filo interruttore → lampadina");
      if (!wires.w3) missing.push("filo lampadina → generatore");
      if (!wires.w4) missing.push("filo di ritorno al polo −");
      return {
        ok: false,
        text: "Circuito aperto: manca " + (missing.length === 1 ? missing[0] + "." : "almeno un filo (" + missing.join("; ") + ")."),
      };
    }
    if (!switchClosed) {
      return { ok: false, text: "Interruttore aperto (OFF): la corrente non passa. Chiudi l’interruttore." };
    }
    return { ok: true, text: "Circuito chiuso e interruttore ON: la lampadina può accendersi!" };
  }

  function refresh() {
    wireBtns.forEach((btn) => {
      const key = btn.getAttribute("data-wire");
      const on = wires[key];
      btn.classList.toggle("is-on", on);
      btn.classList.toggle("is-off", !on);
      btn.setAttribute("aria-pressed", String(on));
      btn.textContent = on ? btn.dataset.labelOn : btn.dataset.labelOff;
    });

    switchBtn.classList.toggle("closed", switchClosed);
    switchBtn.classList.toggle("open", !switchClosed);
    switchBtn.setAttribute("aria-pressed", String(switchClosed));
    switchBtn.textContent = switchClosed ? "Interruttore ON (chiuso)" : "Interruttore OFF (aperto)";

    const diag = diagnose();
    msgEl.textContent = diag.text;
    msgEl.classList.toggle("ok", diag.ok);
    msgEl.classList.toggle("err", !diag.ok);

    if (bulbEl) {
      bulbEl.classList.toggle("is-on", circuitClosed());
      bulbEl.setAttribute("aria-label", circuitClosed() ? "Lampadina accesa" : "Lampadina spenta");
    }
    updateSchema();
  }

  wireBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-wire");
      wires[key] = !wires[key];
      refresh();
    });
  });

  if (switchBtn) {
    switchBtn.addEventListener("click", () => {
      switchClosed = !switchClosed;
      refresh();
    });
  }

  /**
   * @param {string} selector
   * @param {string} attr
   * @param {string} correctValue
   * @param {HTMLElement | null} feedbackEl
   * @param {string} okMsg
   * @param {string} errMsg
   */
  function bindQuiz(selector, attr, correctValue, feedbackEl, okMsg, errMsg) {
    const btns = document.querySelectorAll(selector);
    let done = false;
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (done) return;
        const picked = btn.getAttribute(attr);
        const correct = picked === correctValue;
        btns.forEach((b) => {
          b.disabled = true;
          if (b.getAttribute(attr) === correctValue) b.classList.add("correct");
          else if (b === btn && !correct) b.classList.add("wrong");
        });
        done = true;
        if (feedbackEl) feedbackEl.textContent = correct ? okMsg : errMsg;
      });
    });
  }

  bindQuiz(
    "[data-quiz-r-def]",
    "data-quiz-r-def",
    "ostacolo",
    document.getElementById("quiz-r-def-feedback"),
    "Esatto: R misura quanto il materiale ostacola la corrente (unità ohm).",
    "No: i poli +/− stanno sul generatore; R dipende da materiale, lunghezza e sezione."
  );

  bindQuiz(
    "[data-quiz-r-fatt]",
    "data-quiz-r-fatt",
    "tre",
    document.getElementById("quiz-r-fatt-feedback"),
    "Giusto: materiale, lunghezza e sezione (vedi poster).",
    "Il colore del cavo non decide la resistenza."
  );

  bindQuiz(
    "[data-quiz-ohm-i]",
    "data-quiz-ohm-i",
    "2",
    document.getElementById("quiz-ohm-i-feedback"),
    "Corretto: I = V / R = 12 / 6 = 2 A.",
    "Usa I = V ÷ R con V = 12 V e R = 6 Ω."
  );

  bindQuiz(
    "[data-quiz-ohm-form]",
    "data-quiz-ohm-form",
    "vri",
    document.getElementById("quiz-ohm-form-feedback"),
    "Sì: legge di Ohm → V = R × I (tensione = resistenza × corrente).",
    "La legge corretta è V = R × I; per I usi I = V / R."
  );

  bindQuiz(
    "[data-quiz-poli]",
    "data-quiz-poli",
    "falso",
    document.getElementById("quiz-poli-feedback"),
    "Giusto: + e − sono i poli del generatore. La lunghezza del filo riguarda la resistenza R, non il segno.",
    "Falso non è «vero»: il polo − sta sul generatore, non sul filo più lungo."
  );

  bindQuiz(
    "[data-quiz-r]",
    "data-quiz-r",
    "aumenta",
    document.getElementById("quiz-r-feedback"),
    "Esatto: filo più lungo (a pari sezione e materiale) → di solito resistenza R più alta → corrente più debole.",
    "No: più lunghezza → più resistenza. I poli +/− non dipendono da quanto è lungo il filo."
  );

  bindQuiz(
    "[data-quiz-parti]",
    "data-quiz-parti",
    "filamento",
    document.getElementById("quiz-parti-feedback"),
    "Esatto: il filamento di tungsteno diventa incandescente e fa luce (vedi scheda).",
    "No: vetro e attacco conducono o fissano, ma la luce viene dal filamento."
  );

  bindQuiz(
    "[data-quiz]",
    "data-quiz",
    "fem",
    document.getElementById("quiz-feedback"),
    "Esatto: E indica la tensione (forza elettromotrice) del generatore — «spinge» le cariche nel circuito chiuso.",
    "Riprova sulla scheda: E non è la lampadina né «solo corrente», è la tensione / FEM del generatore."
  );

  refresh();
})();

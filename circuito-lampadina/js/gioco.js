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

  /* Quiz E */
  const quizBtns = document.querySelectorAll("[data-quiz]");
  const quizFeedback = document.getElementById("quiz-feedback");
  let quizDone = false;

  quizBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (quizDone) return;
      const correct = btn.getAttribute("data-quiz") === "fem";
      quizBtns.forEach((b) => {
        b.disabled = true;
        if (b.getAttribute("data-quiz") === "fem") b.classList.add("correct");
        else if (b === btn && !correct) b.classList.add("wrong");
      });
      quizDone = true;
      if (quizFeedback) {
        quizFeedback.textContent = correct
          ? "Esatto: E indica la tensione (forza elettromotrice) del generatore — «spinge» le cariche nel circuito chiuso."
          : "Riprova sulla scheda: E non è la lampadina né «solo corrente», è la tensione / FEM del generatore.";
      }
    });
  });

  refresh();
})();

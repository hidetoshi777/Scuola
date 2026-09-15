(function () {
  const MATERIALI = {
    acciaio: { label: "Acciaio", valori: { "kg/m3": 7850, "kg/dm3": 7.85, "g/cm3": 7.85 } },
    alluminio: { label: "Alluminio", valori: { "kg/m3": 2700, "kg/dm3": 2.7, "g/cm3": 2.7 } },
    ghisa: { label: "Ghisa", valori: { "kg/m3": 7200, "kg/dm3": 7.2, "g/cm3": 7.2 } },
  };

  const UNITA = [
    { id: "kg/m3", label: "kg/m³" },
    { id: "kg/dm3", label: "kg/dm³" },
    { id: "g/cm3", label: "g/cm³" },
  ];

  const TOLLERANZA = 0.015;
  const QUASI_TOLLERANZA = 0.06;

  const elMateriale = document.getElementById("dens-materiale");
  const elUnita = document.getElementById("dens-unita");
  const elValore = document.getElementById("dens-valore");
  const elFeedback = document.getElementById("dens-feedback");
  const elAiuto = document.getElementById("dens-aiuto");
  const btnControlla = document.getElementById("dens-controlla");
  const btnProssima = document.getElementById("dens-prossima");
  const btnAllenamento = document.getElementById("dens-allenamento");
  const elPunteggio = document.getElementById("dens-punteggio");
  const elSerie = document.getElementById("dens-serie");
  const elDomanda = document.getElementById("dens-domanda");

  if (!elMateriale || !elUnita || !elValore || !btnControlla) return;

  let materialeCorrente = "acciaio";
  let unitaCorrente = "kg/dm3";
  let allenamento = true;
  let tentativiSbagliati = 0;
  let punteggio = 0;
  let serie = 0;
  let bloccato = false;

  function parseNumero(raw) {
    const s = String(raw).trim().replace(/\s/g, "").replace(",", ".");
    if (s === "") return NaN;
    return Number(s);
  }

  function atteso() {
    return MATERIALI[materialeCorrente].valori[unitaCorrente];
  }

  function formatoAtteso(n, unitId) {
    if (unitId === "kg/m3") return Math.round(n).toString();
    return String(n).replace(".", ",");
  }

  function aggiornaDomanda() {
    const mat = MATERIALI[materialeCorrente];
    const uni = UNITA.find((u) => u.id === unitaCorrente);
    if (elDomanda) {
      elDomanda.textContent = `Quanto vale il peso specifico tipico del ${mat.label}? (in ${uni ? uni.label : ""})`;
    }
    syncScelte();
  }

  function syncScelte() {
    elMateriale.querySelectorAll("[data-mat]").forEach((btn) => {
      const on = btn.getAttribute("data-mat") === materialeCorrente;
      btn.setAttribute("aria-pressed", String(on));
    });
    elUnita.querySelectorAll("[data-unit]").forEach((btn) => {
      const on = btn.getAttribute("data-unit") === unitaCorrente;
      btn.setAttribute("aria-pressed", String(on));
    });
    if (btnAllenamento) btnAllenamento.setAttribute("aria-pressed", String(allenamento));
  }

  function randomRound() {
    const mats = Object.keys(MATERIALI);
    materialeCorrente = mats[Math.floor(Math.random() * mats.length)];
    unitaCorrente = UNITA[Math.floor(Math.random() * UNITA.length)].id;
    tentativiSbagliati = 0;
    bloccato = false;
    elValore.value = "";
    elFeedback.textContent = "";
    elFeedback.className = "dens-feedback";
    if (elAiuto) {
      elAiuto.hidden = true;
      elAiuto.textContent = "";
    }
    if (btnProssima) btnProssima.hidden = true;
    aggiornaDomanda();
    elValore.focus();
  }

  function mostraAiuto() {
    if (!elAiuto) return;
    const att = atteso();
    const mat = MATERIALI[materialeCorrente].label;
    let testo = "";
    if (unitaCorrente === "kg/m3") {
      testo = `Ordine di grandezza: migliaia di kg per m³. Per ${mat} pensa a circa ${Math.round(att / 100) * 100} kg/m³.`;
    } else {
      testo = `In kg/dm³ e g/cm³ il numero è uguale. Per ${mat} è circa ${formatoAtteso(att, unitaCorrente)}.`;
    }
    elAiuto.textContent = testo;
    elAiuto.hidden = false;
  }

  function valuta() {
    const inserito = parseNumero(elValore.value);
    const att = atteso();
    if (Number.isNaN(inserito)) {
      elFeedback.textContent = "Scrivi un numero (virgola o punto).";
      elFeedback.className = "dens-feedback is-warn";
      return;
    }
    const diff = Math.abs(inserito - att) / att;
    if (diff <= TOLLERANZA) {
      elFeedback.textContent = "Corretto!";
      elFeedback.className = "dens-feedback is-ok";
      punteggio += 1;
      serie += 1;
      bloccato = true;
      if (btnProssima) btnProssima.hidden = false;
      aggiornaScore();
      return;
    }
    if (diff <= QUASI_TOLLERANZA) {
      elFeedback.textContent = `Quasi! Il valore tipico è circa ${formatoAtteso(att, unitaCorrente)}.`;
      elFeedback.className = "dens-feedback is-near";
      tentativiSbagliati += 1;
    } else {
      elFeedback.textContent = "Non coincide. Rileggi la scheda o prova un altro ordine di grandezza.";
      elFeedback.className = "dens-feedback is-ko";
      tentativiSbagliati += 1;
      serie = 0;
      aggiornaScore();
    }
    if (tentativiSbagliati >= 2) mostraAiuto();
  }

  function aggiornaScore() {
    if (elPunteggio) elPunteggio.textContent = String(punteggio);
    if (elSerie) elSerie.textContent = String(serie);
  }

  elMateriale.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mat]");
    if (!btn || allenamento) return;
    materialeCorrente = btn.getAttribute("data-mat");
    tentativiSbagliati = 0;
    bloccato = false;
    elFeedback.textContent = "";
    if (elAiuto) elAiuto.hidden = true;
    if (btnProssima) btnProssima.hidden = true;
    aggiornaDomanda();
  });

  elUnita.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-unit]");
    if (!btn || allenamento) return;
    unitaCorrente = btn.getAttribute("data-unit");
    tentativiSbagliati = 0;
    bloccato = false;
    elFeedback.textContent = "";
    if (elAiuto) elAiuto.hidden = true;
    if (btnProssima) btnProssima.hidden = true;
    aggiornaDomanda();
  });

  if (btnAllenamento) {
    btnAllenamento.addEventListener("click", () => {
      allenamento = !allenamento;
      elMateriale.classList.toggle("is-locked", allenamento);
      elUnita.classList.toggle("is-locked", allenamento);
      if (allenamento) randomRound();
      else syncScelte();
    });
  }

  btnControlla.addEventListener("click", () => {
    if (bloccato) return;
    valuta();
  });

  elValore.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!bloccato) valuta();
    }
  });

  if (btnProssima) {
    btnProssima.addEventListener("click", () => {
      if (allenamento) randomRound();
      else {
        bloccato = false;
        tentativiSbagliati = 0;
        elValore.value = "";
        elFeedback.textContent = "";
        if (elAiuto) elAiuto.hidden = true;
        btnProssima.hidden = true;
        elValore.focus();
      }
    });
  }

  elMateriale.classList.add("is-locked");
  elUnita.classList.add("is-locked");

  aggiornaScore();
  randomRound();
})();

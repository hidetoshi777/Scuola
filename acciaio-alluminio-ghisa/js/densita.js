(function () {
  /** Densità tipiche in kg/m³ (valori indicativi). kg/dm³ e g/cm³ = valore ÷ 1000. */
  const MATERIALI = {
    acciaio: { label: "Acciaio", kgM3: 7850 },
    ghisa: { label: "Ghisa", kgM3: 7200 },
    rame: { label: "Rame", kgM3: 8960 },
    ottone: { label: "Ottone", kgM3: 8500 },
    alluminio: { label: "Alluminio", kgM3: 2700 },
    titanio: { label: "Titanio", kgM3: 4500 },
    piombo: { label: "Piombo", kgM3: 11340 },
    zinco: { label: "Zinco", kgM3: 7140 },
    nichel: { label: "Nichel", kgM3: 8900 },
    vetro: { label: "Vetro", kgM3: 2500 },
    pvc: { label: "PVC", kgM3: 1400 },
    acqua: { label: "Acqua (riferimento)", kgM3: 1000 },
  };

  const UNITA = [
    { id: "kg/m3", label: "kg/m³" },
    { id: "kg/dm3", label: "kg/dm³" },
    { id: "g/cm3", label: "g/cm³" },
  ];

  const TOLLERANZA = 0.015;
  const QUASI_TOLLERANZA = 0.06;

  const elMateriale = document.getElementById("dens-materiale");
  const elMaterialeChips = document.getElementById("dens-materiale-chips");
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
  const elSchedinaList = document.getElementById("dens-schedina-list");
  const elSchedina = document.getElementById("dens-schedina");

  if (!elMateriale || !elMaterialeChips || !elUnita || !elValore || !btnControlla) return;

  let materialeCorrente = "acciaio";
  let unitaCorrente = "kg/dm3";
  let allenamento = false;
  let tentativiSbagliati = 0;
  let punteggio = 0;
  let serie = 0;
  let bloccato = false;

  function parseNumero(raw) {
    const s = String(raw).trim().replace(/\s/g, "").replace(",", ".");
    if (s === "") return NaN;
    return Number(s);
  }

  function kgM3Corrente() {
    return MATERIALI[materialeCorrente].kgM3;
  }

  function atteso() {
    const base = kgM3Corrente();
    if (unitaCorrente === "kg/m3") return base;
    return base / 1000;
  }

  function formatoAtteso(n, unitId) {
    if (unitId === "kg/m3") return Math.round(n).toString();
    const rounded = Math.round(n * 100) / 100;
    return String(rounded).replace(".", ",");
  }

  function labelUnita(unitId) {
    const u = UNITA.find((x) => x.id === unitId);
    return u ? u.label : "";
  }

  function resetRound() {
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
  }

  function aggiornaDomanda() {
    const mat = MATERIALI[materialeCorrente];
    if (elDomanda) {
      elDomanda.textContent = `Quanto vale γ per ${mat.label}? Rispondi in ${labelUnita(unitaCorrente)} usando la schedina (proporzioni).`;
    }
    syncScelte();
    evidenziaSchedina();
  }

  function evidenziaSchedina() {
    if (!elSchedinaList) return;
    elSchedinaList.querySelectorAll("[data-sched-mat]").forEach((li) => {
      const on = li.getAttribute("data-sched-mat") === materialeCorrente;
      li.classList.toggle("is-current", on);
    });
  }

  function syncScelte() {
    elMaterialeChips.querySelectorAll("[data-mat]").forEach((btn) => {
      const on = btn.getAttribute("data-mat") === materialeCorrente;
      btn.setAttribute("aria-pressed", String(on));
    });
    elUnita.querySelectorAll("[data-unit]").forEach((btn) => {
      const on = btn.getAttribute("data-unit") === unitaCorrente;
      btn.setAttribute("aria-pressed", String(on));
    });
    if (btnAllenamento) btnAllenamento.setAttribute("aria-pressed", String(allenamento));
    elMateriale.classList.toggle("is-locked", allenamento);
    elUnita.classList.toggle("is-locked", allenamento);
  }

  function randomRound() {
    const mats = Object.keys(MATERIALI);
    materialeCorrente = mats[Math.floor(Math.random() * mats.length)];
    unitaCorrente = UNITA[Math.floor(Math.random() * UNITA.length)].id;
    resetRound();
    aggiornaDomanda();
    elValore.focus();
  }

  function aiutoProporzioni() {
    const base = kgM3Corrente();
    const mat = MATERIALI[materialeCorrente].label;
    if (unitaCorrente === "kg/m3") {
      return `Schedina: ${mat} = ${base} kg/m³. Stai già nell’unità giusta.`;
    }
    const div = base / 1000;
    return `Schedina: ${base} kg/m³ per ${mat}. Per ${labelUnita(unitaCorrente)} dividi per 1000 → ${formatoAtteso(div, unitaCorrente)}.`;
  }

  function erroreProporzione(inserito, att) {
    const base = kgM3Corrente();
    if (unitaCorrente !== "kg/m3" && Math.abs(inserito - base) / base < 0.08) {
      return "Sembra il valore in kg/m³. Per kg/dm³ o g/cm³ dividi per 1000.";
    }
    if (unitaCorrente === "kg/m3" && Math.abs(inserito - base / 1000) / (base / 1000) < 0.08) {
      return "Hai usato kg/dm³ o g/cm³. In kg/m³ moltiplica per 1000 (o leggi direttamente la schedina).";
    }
    if (Math.abs(inserito - att) / att <= QUASI_TOLLERANZA) {
      return `Quasi. Da ${base} kg/m³: ${aiutoProporzioni()}`;
    }
    return `Rileggi la schedina e fai le proporzioni. ${aiutoProporzioni()}`;
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
    const msg = erroreProporzione(inserito, att);
    if (diff <= QUASI_TOLLERANZA) {
      elFeedback.textContent = msg;
      elFeedback.className = "dens-feedback is-near";
      tentativiSbagliati += 1;
    } else {
      elFeedback.textContent = msg;
      elFeedback.className = "dens-feedback is-ko";
      tentativiSbagliati += 1;
      serie = 0;
      aggiornaScore();
    }
    if (tentativiSbagliati >= 2 && elAiuto) {
      elAiuto.textContent = aiutoProporzioni();
      elAiuto.hidden = false;
    }
  }

  function aggiornaScore() {
    if (elPunteggio) elPunteggio.textContent = String(punteggio);
    if (elSerie) elSerie.textContent = String(serie);
  }

  function buildMaterialeChips() {
    elMaterialeChips.innerHTML = "";
    Object.keys(MATERIALI).forEach((id) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dens-chip";
      btn.setAttribute("data-mat", id);
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = MATERIALI[id].label.replace(" (riferimento)", "");
      elMaterialeChips.appendChild(btn);
    });
  }

  function buildSchedina() {
    if (!elSchedinaList) return;
    elSchedinaList.innerHTML = "";
    Object.keys(MATERIALI).forEach((id) => {
      const li = document.createElement("li");
      li.setAttribute("data-sched-mat", id);
      const m = MATERIALI[id];
      li.innerHTML = `<span class="dens-sched-name">${m.label}</span><span class="dens-sched-val">${m.kgM3} kg/m³</span>`;
      elSchedinaList.appendChild(li);
    });
  }

  elMaterialeChips.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mat]");
    if (!btn || allenamento) return;
    materialeCorrente = btn.getAttribute("data-mat");
    resetRound();
    aggiornaDomanda();
  });

  elUnita.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-unit]");
    if (!btn || allenamento) return;
    unitaCorrente = btn.getAttribute("data-unit");
    resetRound();
    aggiornaDomanda();
  });

  if (btnAllenamento) {
    btnAllenamento.addEventListener("click", () => {
      allenamento = !allenamento;
      syncScelte();
      if (allenamento) randomRound();
      else aggiornaDomanda();
    });
  }

  if (elSchedina) {
    const toggle = elSchedina.querySelector(".dens-schedina-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const collapsed = elSchedina.classList.toggle("is-collapsed");
        toggle.setAttribute("aria-expanded", String(!collapsed));
        toggle.textContent = collapsed ? "Mostra" : "Nascondi";
      });
    }
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
        resetRound();
        elValore.focus();
      }
    });
  }

  buildMaterialeChips();
  buildSchedina();
  aggiornaScore();
  aggiornaDomanda();
  elValore.focus();
})();

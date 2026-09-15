(function () {
  const domande = [
    {
      testo: "Tre cubetti hanno lo stesso volume (10 cm³). Quale ha la massa maggiore?",
      risposte: ["Alluminio", "Acciaio", "Ghisa", "Pesano tutti uguale"],
      giusta: 1,
      nota: "A parità di volume vince il materiale con peso specifico più alto (acciaio ≈ 7,8 kg/dm³).",
    },
    {
      testo: "Il peso specifico è…",
      risposte: [
        "La forza con cui la Terra attira un corpo",
        "Massa divisa volume (proprietà del materiale)",
        "Sempre uguale per tutti i metalli",
        "Il peso di 1 kg di materiale",
      ],
      giusta: 1,
      nota: "Peso specifico γ = m/V, espresso in kg/dm³ (o g/cm³).",
    },
    {
      testo: "Un blocco di alluminio e uno di acciaio della stessa massa: quale ha volume maggiore?",
      risposte: ["Acciaio", "Alluminio", "Uguali", "Ghisa"],
      giusta: 1,
      nota: "L’alluminio è meno denso: a parità di massa occupa più spazio.",
    },
    {
      testo: "La ghisa è spesso usata per…",
      risposte: ["Fuso in stampi (getti)", "Solo fili sottili", "Motori leggeri", "Vetri"],
      giusta: 0,
      nota: "Si fonde e si versa in stampi; è fragile se colpita.",
    },
    {
      testo: "Peso (in newton) e peso specifico (kg/dm³) sono la stessa cosa?",
      risposte: ["Sì", "No"],
      giusta: 1,
      nota: "Il peso dipende da quantità e gravità; il peso specifico no.",
    },
  ];

  let ordine = window.mescola ? window.mescola([...domande]) : domande;
  let step = 0;
  let punti = 0;

  const testoEl = document.getElementById("quiz-testo");
  const opzioniEl = document.getElementById("quiz-opzioni");
  const feedbackEl = document.getElementById("quiz-feedback");
  const avantiBtn = document.getElementById("quiz-avanti");
  const punteggioEl = document.getElementById("quiz-punteggio");
  const fineEl = document.getElementById("quiz-fine");

  if (!testoEl || !opzioniEl) return;

  function render() {
    if (step >= ordine.length) {
      testoEl.textContent = "Fine!";
      opzioniEl.innerHTML = "";
      feedbackEl.textContent = `Hai ${punti} su ${ordine.length} risposte corrette. Ripassa la scheda se serve.`;
      if (punteggioEl) punteggioEl.textContent = `${punti}/${ordine.length}`;
      if (fineEl) fineEl.hidden = false;
      if (avantiBtn) avantiBtn.hidden = true;
      return;
    }
    const d = ordine[step];
    testoEl.textContent = d.testo;
    opzioniEl.innerHTML = "";
    feedbackEl.textContent = "";
    if (avantiBtn) avantiBtn.hidden = true;
    if (fineEl) fineEl.hidden = true;
    if (punteggioEl) punteggioEl.textContent = `${punti}/${step}`;

    d.risposte.forEach((r, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-opt";
      btn.textContent = r;
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        opzioniEl.querySelectorAll("button").forEach((b) => {
          b.disabled = true;
        });
        const ok = i === d.giusta;
        if (ok) {
          punti += 1;
          btn.classList.add("is-ok");
          feedbackEl.textContent = "Giusto! " + d.nota;
        } else {
          btn.classList.add("is-ko");
          const giustaBtn = opzioniEl.querySelectorAll("button")[d.giusta];
          if (giustaBtn) giustaBtn.classList.add("is-ok");
          feedbackEl.textContent = "Rivedi: " + d.nota;
        }
        if (punteggioEl) punteggioEl.textContent = `${punti}/${step + 1}`;
        if (avantiBtn) avantiBtn.hidden = false;
      });
      opzioniEl.appendChild(btn);
    });
  }

  if (avantiBtn) {
    avantiBtn.addEventListener("click", () => {
      step += 1;
      render();
    });
  }

  const restart = document.getElementById("quiz-restart");
  if (restart) {
    restart.addEventListener("click", () => {
      step = 0;
      punti = 0;
      ordine = window.mescola ? window.mescola([...domande]) : domande;
      render();
    });
  }

  render();
})();

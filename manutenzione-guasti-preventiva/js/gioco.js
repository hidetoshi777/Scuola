(function () {
  const casi = [
    {
      testo: "Un motore elettrico fuma, è molto rumoroso e non gira bene. Cosa fai per primo?",
      giusta: "correttivo",
      nota: "È un guasto palese: serve un intervento correttivo immediato (fermare, mettere in sicurezza, riparare).",
    },
    {
      testo: "Il piano di manutenzione dice: controllo olio e lubrificazione ogni mese. È la settimana prevista.",
      giusta: "preventiva",
      nota: "È manutenzione preventiva programmata: meglio farla in tempo che aspettare il guasto.",
    },
    {
      testo: "La macchina funziona, ma il filtro è vecchio e non c’è protezione sulla cinghia esposta.",
      giusta: "miglioramento",
      nota: "Non è solo «aggiustare»: filtro nuovo e protezione sono un miglioramento dell’impianto.",
    },
    {
      testo: "Stesso cuscinetto si rompe ogni due mesi, sempre nello stesso punto.",
      giusta: "preventiva",
      nota: "Guasto frequente e prevedibile: conviene analizzare la causa e programmare controlli / revisioni preventive.",
    },
    {
      testo: "Dopo un temporale, un quadro elettrico ha preso acqua e non parte più.",
      giusta: "correttivo",
      nota: "Evento imprevedibile: prima la messa in sicurezza, poi riparazione correttiva.",
    },
    {
      testo: "Il manuale chiede di serrare le viti e controllare l’allineamento ogni 500 ore di lavoro.",
      giusta: "preventiva",
      nota: "Seguire il piano del costruttore è manutenzione preventiva.",
    },
    {
      testo: "Vuoi sostituire un interruttore standard con uno più robusto e aggiungere etichette chiare sul quadro.",
      giusta: "miglioramento",
      nota: "Piccoli upgrade aumentano sicurezza e chiarezza: è un intervento di miglioramento.",
    },
    {
      testo: "Vibrazione strana ma nessun fumo: il tecnico sospetta un cuscinetto usurato prima del collasso.",
      giusta: "preventiva",
      nota: "Guasto ancora nascosto: meglio ispezionare e intervenire in preventiva che fermare tutto dopo.",
    },
  ];

  const etichette = {
    correttivo: "Riparare ora (correttivo)",
    preventiva: "Programmare manutenzione preventiva",
    miglioramento: "Migliorare l’impianto (upgrade)",
  };

  let ordine = window.mescola ? window.mescola([...casi]) : casi;
  let step = 0;
  let punti = 0;

  const caseEl = document.getElementById("game-case");
  const choicesEl = document.getElementById("game-choices");
  const feedbackEl = document.getElementById("game-feedback");
  const scoreEl = document.getElementById("game-score");
  const fineEl = document.getElementById("game-fine");
  const restartBtn = document.getElementById("game-restart");

  if (!caseEl || !choicesEl) return;

  function render() {
    if (step >= ordine.length) {
      caseEl.textContent = "Hai finito tutti i casi!";
      choicesEl.innerHTML = "";
      feedbackEl.textContent =
        "Punteggio: " + punti + " su " + ordine.length + ". Rileggi scheda o fumetto se qualcosa non è chiaro.";
      if (scoreEl) scoreEl.textContent = punti + "/" + ordine.length;
      if (fineEl) fineEl.hidden = false;
      return;
    }

    const c = ordine[step];
    caseEl.textContent = c.testo;
    feedbackEl.textContent = "";
    if (fineEl) fineEl.hidden = true;
    if (scoreEl) scoreEl.textContent = "Caso " + (step + 1) + " di " + ordine.length + " · " + punti + " punti";

    choicesEl.innerHTML = "";
    const keys = window.mescola ? window.mescola(["correttivo", "preventiva", "miglioramento"]) : Object.keys(etichette);

    keys.forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "game-choice";
      btn.textContent = etichette[key];
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        choicesEl.querySelectorAll("button").forEach((b) => {
          b.disabled = true;
        });
        const ok = key === c.giusta;
        if (ok) {
          punti += 1;
          btn.classList.add("is-ok");
          feedbackEl.textContent = "Giusto! " + c.nota;
        } else {
          btn.classList.add("is-ko");
          choicesEl.querySelectorAll("button").forEach((b) => {
            if (b.textContent === etichette[c.giusta]) b.classList.add("is-ok");
          });
          feedbackEl.textContent = "Rivedi: " + c.nota;
        }
        window.setTimeout(() => {
          step += 1;
          render();
        }, ok ? 1200 : 2200);
      });
      choicesEl.appendChild(btn);
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      ordine = window.mescola ? window.mescola([...casi]) : casi;
      step = 0;
      punti = 0;
      render();
    });
  }

  render();
})();

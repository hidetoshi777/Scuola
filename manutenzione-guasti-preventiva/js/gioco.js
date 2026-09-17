(function () {
  /** @typedef {{ tipo: string, badge: string, testo: string, opzioni: { id: string, label: string }[], giusta: string, nota: string }} Caso */

  /** @type {Caso[]} */
  const casi = [
    {
      tipo: "intervento",
      badge: "Scegli l’intervento",
      testo: "Un motore elettrico fuma, è molto rumoroso e non gira bene. Cosa fai per primo?",
      opzioni: [
        { id: "correttivo", label: "Riparare ora (correttivo)" },
        { id: "preventiva", label: "Programmare manutenzione preventiva" },
        { id: "miglioramento", label: "Migliorare l’impianto (upgrade)" },
      ],
      giusta: "correttivo",
      nota: "Guasto palese: fermare, mettere in sicurezza e riparare.",
    },
    {
      tipo: "intervento",
      badge: "Scegli l’intervento",
      testo: "Il filtro è vecchio e manca la protezione sulla cinghia, ma la macchina gira ancora.",
      opzioni: [
        { id: "correttivo", label: "Riparare ora (correttivo)" },
        { id: "preventiva", label: "Programmare manutenzione preventiva" },
        { id: "miglioramento", label: "Migliorare l’impianto (upgrade)" },
      ],
      giusta: "miglioramento",
      nota: "Filtro nuovo e protezione = miglioramento, non solo «aggiustare quando si rompe».",
    },
    {
      tipo: "manutenzione",
      badge: "Tipo di manutenzione",
      testo: "Ogni settimana pulisci il banco, lubrifici le guide e sostituisci i filtri secondo il piano.",
      opzioni: [
        { id: "ordinaria", label: "Manutenzione ordinaria" },
        { id: "straordinaria", label: "Manutenzione straordinaria" },
        { id: "preventiva", label: "Manutenzione preventiva" },
      ],
      giusta: "ordinaria",
      nota: "Pulizia e lubrificazione programmate sono tipiche dell’ordinaria.",
    },
    {
      tipo: "manutenzione",
      badge: "Tipo di manutenzione",
      testo: "Il riduttore è esploso di notte: la linea è ferma e serve sostituire l’ingranaggio.",
      opzioni: [
        { id: "ordinaria", label: "Manutenzione ordinaria" },
        { id: "straordinaria", label: "Manutenzione straordinaria" },
        { id: "preventiva", label: "Manutenzione preventiva" },
      ],
      giusta: "straordinaria",
      nota: "Intervento dopo il guasto, non pianificato: straordinaria (correttiva).",
    },
    {
      tipo: "manutenzione",
      badge: "Tipo di manutenzione",
      testo: "Ogni 500 ore controlli cuscinetti, serraggi e allineamento come da manuale del costruttore.",
      opzioni: [
        { id: "ordinaria", label: "Manutenzione ordinaria" },
        { id: "straordinaria", label: "Manutenzione straordinaria" },
        { id: "preventiva", label: "Manutenzione preventiva" },
      ],
      giusta: "preventiva",
      nota: "Controlli pianificati per evitare guasti = preventiva.",
    },
    {
      tipo: "strumento",
      badge: "Prima cosa fare",
      testo: "Arrivi al banco: vedi olio sul pavimento, una cinghia scura di fuliggine e una vite del supporto molto allentata.",
      opzioni: [
        { id: "occhio", label: "Ispezione visiva (occhio nudo) — osserva e annota" },
        { id: "multimetro", label: "Multimetro subito" },
        { id: "termocamera", label: "Termocamera subito" },
        { id: "isolamento", label: "Tester isolamento subito" },
      ],
      giusta: "occhio",
      nota: "Perdite, usura e allentamenti si vedono: prima ispezioni con l’occhio nudo, poi misuri se serve.",
    },
    {
      tipo: "strumento",
      badge: "Prima cosa fare",
      testo: "La macchina si è fermata: sul quadro c’è una spia rossa accesa e senti odore di bruciato leggero.",
      opzioni: [
        { id: "occhio", label: "Guardare spie, cavi e quadro (ispezione visiva)" },
        { id: "manometro", label: "Manometro" },
        { id: "stetoscopio", label: "Stetoscopio meccanico" },
        { id: "vibrazioni", label: "Analizzatore vibrazioni" },
      ],
      giusta: "occhio",
      nota: "Spie, odori e stato del quadro: prima osservi in sicurezza, poi scegli lo strumento giusto.",
    },
    {
      tipo: "strumento",
      badge: "Strumento giusto",
      testo: "Sospetti un corto o una tensione assente su un motore trifase nel quadro.",
      opzioni: [
        { id: "multimetro", label: "Multimetro" },
        { id: "termocamera", label: "Termocamera" },
        { id: "stetoscopio", label: "Stetoscopio meccanico" },
        { id: "manometro", label: "Manometro" },
      ],
      giusta: "multimetro",
      nota: "Tensioni, correnti e continuità: multimetro (o pinza amperometrica per la corrente).",
    },
    {
      tipo: "strumento",
      badge: "Strumento giusto",
      testo: "Il motore sembra caldo in un punto preciso ma non vedi fumo né perdite.",
      opzioni: [
        { id: "multimetro", label: "Multimetro" },
        { id: "termocamera", label: "Termocamera" },
        { id: "stetoscopio", label: "Stetoscopio meccanico" },
        { id: "vibrazioni", label: "Analizzatore vibrazioni" },
      ],
      giusta: "termocamera",
      nota: "Surriscaldamento localizzato (es. cuscinetto caldo): termocamera.",
    },
    {
      tipo: "strumento",
      badge: "Strumento giusto",
      testo: "Senti un rumore metallico interno che cambia con i giri del motore.",
      opzioni: [
        { id: "multimetro", label: "Multimetro" },
        { id: "termocamera", label: "Termocamera" },
        { id: "stetoscopio", label: "Stetoscopio meccanico" },
        { id: "isolamento", label: "Tester isolamento" },
      ],
      giusta: "stetoscopio",
      nota: "Rumori interni anomali: stetoscopio meccanico (o analisi vibrazioni).",
    },
    {
      tipo: "strumento",
      badge: "Strumento giusto",
      testo: "L’impianto idraulico ha pressione instabile: vuoi verificare la pressione in bar.",
      opzioni: [
        { id: "multimetro", label: "Multimetro" },
        { id: "manometro", label: "Manometro" },
        { id: "termocamera", label: "Termocamera" },
        { id: "isolamento", label: "Tester isolamento" },
      ],
      giusta: "manometro",
      nota: "Pressione fluidi/gas: manometro collegato al punto giusto.",
    },
    {
      tipo: "strumento",
      badge: "Strumento giusto",
      testo: "Prima di rimettere in servizio un motore, devi controllare l’isolamento dei avvolgimenti.",
      opzioni: [
        { id: "multimetro", label: "Multimetro" },
        { id: "isolamento", label: "Tester isolamento (megger)" },
        { id: "stetoscopio", label: "Stetoscopio meccanico" },
        { id: "vibrazioni", label: "Analizzatore vibrazioni" },
      ],
      giusta: "isolamento",
      nota: "Resistenza di isolamento in megaohm: tester dedicato.",
    },
    {
      tipo: "checklist",
      badge: "Checklist",
      testo: "Su un CNC riavviato dopo un fermo lungo: cosa NON puoi saltare?",
      opzioni: [
        { id: "solo_lub", label: "Solo lubrificare e partire" },
        { id: "sicurezze", label: "Verificare sicurezze, protezioni e finecorsa" },
        { id: "niente", label: "Nessun controllo se ieri funzionava" },
      ],
      giusta: "sicurezze",
      nota: "Sistemi complessi: checklist con sicurezze, protezioni, software/PLC prima del ciclo.",
    },
    {
      tipo: "checklist",
      badge: "Checklist",
      testo: "Checklist macchina elettromeccanica: quale voce serve per evitare usura prematura degli assi?",
      opzioni: [
        { id: "allineamento", label: "Allineamento assi e gioco meccanico" },
        { id: "solo_pulizia", label: "Solo pulizia esterna" },
        { id: "colore", label: "Verniciare il telaio" },
      ],
      giusta: "allineamento",
      nota: "Allineamento, lubrificazione e tenute sono voci tipiche della checklist.",
    },
    {
      tipo: "checklist",
      badge: "Checklist",
      testo: "Quadro + motore: prima della messa in tensione, cosa controlli sulla checklist?",
      opzioni: [
        { id: "serraggi", label: "Serraggi, morsetti e collegamenti a terra" },
        { id: "solo_spia", label: "Solo se la spia è verde" },
        { id: "niente_etichette", label: "Togliere le etichette per pulire" },
      ],
      giusta: "serraggi",
      nota: "Componenti elettromeccanici, serraggi e registrazioni: voci standard della checklist.",
    },
    {
      tipo: "checklist",
      badge: "Sostituzione sicura",
      testo: "Il cuscinetto è da cambiare. Il capo chiede di finire in fretta. Cosa fai?",
      opzioni: [
        { id: "sicura", label: "Fermo, LOTO, DPI, ricambio corretto e checklist" },
        { id: "fretta", label: "Smonto subito senza bloccare l’alimentazione" },
        { id: "ricambio", label: "Metto un cuscinetto simile ma non dello stesso codice" },
      ],
      giusta: "sicura",
      nota: "Sostituzione corretta: sicurezza prima, ricambio idoneo, procedura senza fretta (vedi tavola 6 del fumetto).",
    },
    {
      tipo: "intervento",
      badge: "Scegli l’intervento",
      testo: "Il piano dice: controllo olio e lubrificazione questa settimana.",
      opzioni: [
        { id: "correttivo", label: "Riparare ora (correttivo)" },
        { id: "preventiva", label: "Programmare manutenzione preventiva" },
        { id: "miglioramento", label: "Migliorare l’impianto (upgrade)" },
      ],
      giusta: "preventiva",
      nota: "Intervento pianificato per evitare guasti.",
    },
  ];

  let ordine = window.mescola ? window.mescola([...casi]) : casi;
  let step = 0;
  let punti = 0;

  const badgeEl = document.getElementById("game-badge");
  const caseEl = document.getElementById("game-case");
  const choicesEl = document.getElementById("game-choices");
  const feedbackEl = document.getElementById("game-feedback");
  const scoreEl = document.getElementById("game-score");
  const fineEl = document.getElementById("game-fine");
  const restartBtn = document.getElementById("game-restart");

  if (!caseEl || !choicesEl) return;

  function labelGiusta(c) {
    const hit = c.opzioni.find((o) => o.id === c.giusta);
    return hit ? hit.label : "";
  }

  function render() {
    if (step >= ordine.length) {
      if (badgeEl) badgeEl.textContent = "Fine";
      caseEl.textContent = "Hai finito tutti i casi!";
      choicesEl.innerHTML = "";
      feedbackEl.textContent =
        "Punteggio: " + punti + " su " + ordine.length + ". Rileggi scheda o fumetto se serve.";
      if (scoreEl) scoreEl.textContent = punti + "/" + ordine.length;
      if (fineEl) fineEl.hidden = false;
      return;
    }

    const c = ordine[step];
    if (badgeEl) badgeEl.textContent = c.badge;
    caseEl.textContent = c.testo;
    feedbackEl.textContent = "";
    if (fineEl) fineEl.hidden = true;
    if (scoreEl) {
      scoreEl.textContent = "Caso " + (step + 1) + " di " + ordine.length + " · " + punti + " punti";
    }

    choicesEl.innerHTML = "";
    const opts = window.mescola ? window.mescola(c.opzioni.slice()) : c.opzioni;

    opts.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "game-choice";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        choicesEl.querySelectorAll("button").forEach((b) => {
          b.disabled = true;
        });
        const ok = opt.id === c.giusta;
        if (ok) {
          punti += 1;
          btn.classList.add("is-ok");
          feedbackEl.textContent = "Giusto! " + c.nota;
        } else {
          btn.classList.add("is-ko");
          choicesEl.querySelectorAll("button").forEach((b) => {
            if (b.textContent === labelGiusta(c)) b.classList.add("is-ok");
          });
          feedbackEl.textContent = "Rivedi: " + c.nota;
        }
        window.setTimeout(
          () => {
            step += 1;
            render();
          },
          ok ? 1200 : 2200
        );
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

document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro-gioco");
  const partita = document.getElementById("partita");
  const domanda = document.getElementById("domanda");
  const opzioni = document.getElementById("opzioni");
  const feedback = document.getElementById("feedback");
  const avanti = document.getElementById("avanti");
  const numProva = document.getElementById("num-prova");
  const totProve = document.getElementById("tot-prove");
  const punteggioEl = document.getElementById("punteggio");
  const serieEl = document.getElementById("serie");
  const barra = document.getElementById("barra");
  const timerBar = document.getElementById("timer-bar");
  const timerFill = document.getElementById("timer-fill");
  const dialog = document.getElementById("fine-dialogo");
  const stelle = document.getElementById("stelle");
  const fineTesto = document.getElementById("fine-testo");
  const fineDettaglio = document.getElementById("fine-dettaglio");
  const suonoBtn = document.getElementById("suono");
  const tempoBtn = document.getElementById("tempo");

  if (!window.Grammatica) {
    return;
  }

  const G = window.Grammatica;
  const PER_PARTITA = 12;
  const SECONDI = 25;

  let prove = [];
  let index = 0;
  let score = 0;
  let serie = 0;
  let serieMax = 0;
  let locked = false;
  let errori = [];
  let aTempo = true;
  let tickId = null;
  let restano = SECONDI;

  totProve.textContent = String(PER_PARTITA);

  suonoBtn?.addEventListener("click", () => {
    AudioUi.enabled = !AudioUi.enabled;
    suonoBtn.setAttribute("aria-pressed", String(AudioUi.enabled));
    suonoBtn.textContent = AudioUi.enabled ? "Suono: acceso" : "Suono: spento";
  });

  tempoBtn?.addEventListener("click", () => {
    aTempo = !aTempo;
    tempoBtn.setAttribute("aria-pressed", String(aTempo));
    tempoBtn.textContent = aTempo ? "A tempo: sì" : "A tempo: no";
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
    prove = mescola(G.proveGioco).slice(0, PER_PARTITA);
    index = 0;
    score = 0;
    serie = 0;
    serieMax = 0;
    errori = [];
    intro.hidden = true;
    partita.hidden = false;
    totProve.textContent = String(prove.length);
    show();
    partita.scrollIntoView({ block: "start" });
  }

  function show() {
    fermaTimer();
    locked = false;
    avanti.hidden = true;
    feedback.textContent = "";
    opzioni.replaceChildren();

    const item = prove[index];
    domanda.textContent = item.q;
    numProva.textContent = String(index + 1);
    punteggioEl.textContent = String(score);
    if (serieEl) serieEl.textContent = String(serie);
    barra.style.width = `${(index / prove.length) * 100}%`;

    // Le opzioni vengono mescolate: l'indice corretto va ricalcolato.
    const ordine = mescola(item.options.map((testo, i) => ({ testo, i })));
    ordine.forEach(({ testo, i }, posizione) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = `${posizione + 1}. ${testo}`;
      btn.dataset.originale = String(i);
      btn.addEventListener("click", () => grade(i, item));
      opzioni.append(btn);
    });

    if (aTempo) {
      avviaTimer(item);
    } else if (timerBar) {
      timerBar.hidden = true;
    }
  }

  function avviaTimer(item) {
    if (!timerBar || !timerFill) {
      return;
    }
    timerBar.hidden = false;
    timerBar.classList.remove("is-low");
    restano = SECONDI;
    timerFill.style.width = "100%";
    tickId = setInterval(() => {
      restano -= 0.1;
      const quota = Math.max(0, restano / SECONDI);
      timerFill.style.width = `${quota * 100}%`;
      timerBar.classList.toggle("is-low", quota < 0.25);
      if (restano <= 0) {
        fermaTimer();
        grade(-1, item);
      }
    }, 100);
  }

  function fermaTimer() {
    if (tickId) {
      clearInterval(tickId);
      tickId = null;
    }
  }

  function grade(choice, item) {
    if (locked) {
      return;
    }
    locked = true;
    fermaTimer();

    const buttons = [...opzioni.querySelectorAll("button")];
    buttons.forEach((btn) => {
      btn.disabled = true;
      const originale = Number(btn.dataset.originale);
      if (originale === item.correct) {
        btn.classList.add("is-correct");
      }
      if (originale === choice && choice !== item.correct) {
        btn.classList.add("is-wrong");
      }
    });

    const giusto = choice === item.correct;
    if (giusto) {
      score += 1;
      serie += 1;
      serieMax = Math.max(serieMax, serie);
      AudioUi.beep("ok");
      feedback.textContent = serie >= 3 ? `Serie di ${serie}. ${item.explain}` : item.explain;
    } else {
      serie = 0;
      AudioUi.beep("bad");
      errori.push({ q: item.q, giusta: item.options[item.correct], explain: item.explain });
      feedback.textContent = choice === -1 ? `Tempo scaduto. ${item.explain}` : item.explain;
    }

    Progressi.registra(item.tag, giusto);
    punteggioEl.textContent = String(score);
    if (serieEl) serieEl.textContent = String(serie);
    avanti.hidden = false;
    avanti.textContent = index + 1 >= prove.length ? "Vedi il risultato" : "Prova successiva";
    avanti.focus();
  }

  function finish() {
    fermaTimer();
    partita.hidden = true;
    intro.hidden = false;
    barra.style.width = "100%";

    const stars = score >= prove.length - 1 ? 3 : score >= Math.ceil(prove.length * 0.7) ? 2 : score >= Math.ceil(prove.length * 0.45) ? 1 : 0;
    stelle.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);

    const titolo =
      stars === 3 ? "Padronanza delle parti invariabili" : stars === 2 ? "Buona preparazione" : stars === 1 ? "Base da consolidare" : "Da ripassare";
    document.getElementById("fine-titolo").textContent = titolo;
    fineTesto.textContent = `${score} risposte corrette su ${prove.length}. Serie migliore: ${serieMax}.`;

    if (fineDettaglio) {
      fineDettaglio.replaceChildren();

      const dati = Progressi.leggi();
      const griglia = document.createElement("div");
      griglia.className = "stat-grid";
      G.categorie.forEach((cat) => {
        const v = dati[cat.id];
        if (!v || !v.totali) {
          return;
        }
        const box = document.createElement("div");
        box.className = `stat tipo-${cat.id}`;
        box.innerHTML =
          `<p class="stat-label">${cat.nome}</p>` +
          `<p class="stat-value">${Math.round((v.giusti / v.totali) * 100)}%</p>`;
        griglia.append(box);
      });
      if (griglia.childElementCount) {
        const h = document.createElement("h3");
        h.textContent = "Come vai per categoria";
        fineDettaglio.append(h, griglia);
      }

      if (errori.length) {
        const h = document.createElement("h3");
        h.textContent = `Da rivedere (${errori.length})`;
        const lista = document.createElement("ul");
        lista.className = "review-list";
        errori.forEach((e) => {
          const li = document.createElement("li");
          li.className = "review-item";
          li.innerHTML = `<strong>${e.q}</strong><span>Risposta corretta: ${e.giusta}. ${e.explain}</span>`;
          lista.append(li);
        });
        fineDettaglio.append(h, lista);
      }
    }

    if (stars === 3) {
      AudioUi.beep("win");
    }
    dialog.showModal();
  }
});

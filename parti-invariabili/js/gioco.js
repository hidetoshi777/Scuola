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
  const barra = document.getElementById("barra");
  const dialog = document.getElementById("fine-dialogo");
  const stelle = document.getElementById("stelle");
  const fineTesto = document.getElementById("fine-testo");
  const suonoBtn = document.getElementById("suono");

  if (!window.Grammatica) {
    return;
  }

  const prove = Grammatica.proveGioco;
  let index = 0;
  let score = 0;
  let locked = false;
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
    partita.scrollIntoView({ block: "start" });
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
    item.options.forEach((label, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = `${i + 1}. ${label}`;
      btn.addEventListener("click", () => grade(i, item));
      opzioni.append(btn);
    });
  }

  function grade(choice, item) {
    if (locked) {
      return;
    }
    locked = true;
    const buttons = [...opzioni.querySelectorAll("button")];
    buttons.forEach((btn, i) => {
      if (i === item.correct) {
        btn.classList.add("is-correct");
      }
      if (i === choice && choice !== item.correct) {
        btn.classList.add("is-wrong");
      }
    });
    if (choice === item.correct) {
      score += 1;
      AudioUi.beep("ok");
      feedback.textContent = `Bravo! ${item.explain}`;
    } else {
      AudioUi.beep("bad");
      feedback.textContent = `Quasi: ${item.explain}`;
    }
    punteggioEl.textContent = String(score);
    avanti.hidden = false;
    avanti.focus();
  }

  function finish() {
    partita.hidden = true;
    intro.hidden = false;
    barra.style.width = "100%";
    const stars = score >= 11 ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0;
    stelle.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    const title =
      stars === 3 ? "Esperto delle parti invariabili" : stars === 2 ? "Ottimo lavoro" : stars === 1 ? "Buon inizio" : "Riprova: stai imparando";
    document.getElementById("fine-titolo").textContent = title;
    fineTesto.textContent = `Hai risposto bene a ${score} prove su ${prove.length}.`;
    if (stars === 3) {
      AudioUi.beep("win");
    }
    dialog.showModal();
  }
});

(function () {
  const data = window.ManzoniData;
  if (!data) return;

  const startBox = document.getElementById("gioco-start");
  const playBox = document.getElementById("gioco-play");
  const endBox = document.getElementById("gioco-end");
  const qNum = document.getElementById("q-num");
  const qTot = document.getElementById("q-tot");
  const qScore = document.getElementById("q-score");
  const qBar = document.getElementById("q-bar");
  const qText = document.getElementById("q-text");
  const qChoices = document.getElementById("q-choices");
  const qFeedback = document.getElementById("q-feedback");
  const btnNext = document.getElementById("btn-next");
  const endSummary = document.getElementById("end-summary");
  const endTip = document.getElementById("end-tip");

  let deck = [];
  let index = 0;
  let score = 0;
  const temiSbagliati = {};

  function show(which) {
    startBox.hidden = which !== "start";
    playBox.hidden = which !== "play";
    endBox.hidden = which !== "end";
  }

  function start() {
    deck = window.mescola(data.quiz);
    index = 0;
    score = 0;
    Object.keys(temiSbagliati).forEach((k) => delete temiSbagliati[k]);
    qTot.textContent = String(deck.length);
    show("play");
    renderQuestion();
  }

  function renderQuestion() {
    const item = deck[index];
    qNum.textContent = String(index + 1);
    qScore.textContent = String(score);
    qBar.style.width = `${(index / deck.length) * 100}%`;
    qText.textContent = item.q;
    qFeedback.hidden = true;
    btnNext.hidden = true;
    qChoices.innerHTML = "";

    item.choices.forEach((label, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.addEventListener("click", () => answer(i));
      qChoices.appendChild(btn);
    });
  }

  function answer(choice) {
    const item = deck[index];
    const buttons = [...qChoices.querySelectorAll("button")];
    buttons.forEach((b) => {
      b.disabled = true;
    });
    const ok = choice === item.correct;
    buttons[choice].classList.add(ok ? "is-ok" : "is-bad");
    buttons[item.correct].classList.add("is-ok");
    qFeedback.hidden = false;
    qFeedback.className = `feedback ${ok ? "ok" : "bad"}`;
    if (ok) {
      score += 1;
      qFeedback.textContent = "Giusto.";
      if (window.AudioUi) window.AudioUi.beep("ok");
    } else {
      temiSbagliati[item.tema] = (temiSbagliati[item.tema] || 0) + 1;
      qFeedback.textContent = `No: la risposta corretta è «${item.choices[item.correct]}».`;
      if (window.AudioUi) window.AudioUi.beep("bad");
    }
    if (window.Progressi) window.Progressi.registra(item.tema, ok);
    qScore.textContent = String(score);
    btnNext.hidden = false;
    btnNext.textContent = index + 1 >= deck.length ? "Vedi l’esito" : "Domanda successiva";
  }

  function next() {
    if (index + 1 >= deck.length) {
      finish();
      return;
    }
    index += 1;
    renderQuestion();
  }

  function finish() {
    qBar.style.width = "100%";
    show("end");
    endSummary.textContent = `Hai totalizzato ${score} su ${deck.length}.`;
    const temi = Object.entries(temiSbagliati).sort((a, b) => b[1] - a[1]);
    if (!temi.length) {
      endTip.textContent = "Nessun tema debole: puoi passare al laboratorio o ripassare le slide Canva.";
    } else {
      const mappa = {
        lingua: "questione della lingua",
        opere: "le tre opere",
        romanzo: "romanzo storico / espediente",
        provvidenza: "Provvidenza e peste",
        personaggi: "i personaggi",
      };
      endTip.textContent = `Da ripassare soprattutto: ${mappa[temi[0][0]] || temi[0][0]}.`;
    }
    if (window.AudioUi) window.AudioUi.beep(score >= deck.length * 0.7 ? "win" : "page");
  }

  document.getElementById("btn-start").addEventListener("click", start);
  document.getElementById("btn-retry").addEventListener("click", start);
  btnNext.addEventListener("click", next);
})();

(function () {
  const data = window.KantData;
  const stops = data && data.passeggiata;
  if (!stops || !stops.length) return;

  const map = document.getElementById("city-map");
  const meta = document.getElementById("stop-meta");
  const title = document.getElementById("stop-title");
  const question = document.getElementById("stop-question");
  const list = document.getElementById("choice-list");
  const feedback = document.getElementById("stop-feedback");
  const nextBtn = document.getElementById("btn-next");
  const endBox = document.getElementById("gioco-end");
  const endText = document.getElementById("end-text");
  const hudStop = document.getElementById("hud-stop");
  const hudTotal = document.getElementById("hud-total");
  const hudScore = document.getElementById("hud-score");
  const card = document.getElementById("stop-card");
  const stage = document.getElementById("stop-stage");
  const stopImg = document.getElementById("stop-img");

  let index = 0;
  let score = 0;
  let answered = false;
  const pins = [];

  hudTotal.textContent = String(stops.length);

  stops.forEach((stop, i) => {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "map-pin";
    pin.textContent = stop.pin || String(i + 1);
    pin.style.left = `${stop.x}%`;
    pin.style.top = `${stop.y}%`;
    pin.setAttribute("aria-label", stop.luogo);
    pin.tabIndex = -1;
    map.appendChild(pin);
    pins.push(pin);
  });

  function renderMap() {
    pins.forEach((pin, i) => {
      pin.classList.remove("is-done", "is-current", "is-locked");
      if (i < index) pin.classList.add("is-done");
      else if (i === index) pin.classList.add("is-current");
      else pin.classList.add("is-locked");
    });
  }

  function showStop() {
    const stop = stops[index];
    answered = false;
    endBox.hidden = true;
    stage.hidden = false;
    card.hidden = false;
    nextBtn.hidden = true;
    feedback.hidden = true;
    feedback.className = "feedback";
    hudStop.textContent = String(index + 1);
    hudScore.textContent = String(score);
    meta.textContent = stop.tipo === "morale" ? "Dilemma morale" : "Domanda di ripasso";
    title.textContent = stop.luogo;
    question.textContent = stop.domanda;
    if (stopImg && stop.img) {
      stopImg.src = stop.img;
      stopImg.alt = `Scena: ${stop.luogo}`;
    }
    list.innerHTML = "";

    const opzioni = window.mescola ? window.mescola(stop.opzioni) : stop.opzioni;
    opzioni.forEach((op) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = op.t;
      btn.addEventListener("click", () => onAnswer(op, btn));
      li.appendChild(btn);
      list.appendChild(li);
    });
    renderMap();
  }

  function onAnswer(op, btn) {
    if (answered) return;
    answered = true;
    const buttons = Array.from(list.querySelectorAll("button"));
    buttons.forEach((b) => {
      b.disabled = true;
    });

    if (op.ok) {
      score += 1;
      btn.classList.add("is-ok");
      feedback.className = "feedback is-ok";
      feedback.textContent = `Giusto. ${stops[index].spiegazione}`;
      if (window.AudioUi) window.AudioUi.beep("ok");
    } else {
      btn.classList.add("is-bad");
      const corretta = stops[index].opzioni.find((x) => x.ok);
      buttons.forEach((b) => {
        if (b.textContent === corretta.t) b.classList.add("is-ok");
      });
      feedback.className = "feedback is-bad";
      feedback.textContent = `Non proprio. ${stops[index].spiegazione}`;
      if (window.AudioUi) window.AudioUi.beep("err");
    }

    feedback.hidden = false;
    hudScore.textContent = String(score);
    nextBtn.hidden = false;
    nextBtn.textContent = index === stops.length - 1 ? "Vedi il risultato" : "Fermata successiva →";
  }

  function goNext() {
    if (index >= stops.length - 1) {
      finish();
      return;
    }
    index += 1;
    showStop();
    if (window.AudioUi) window.AudioUi.beep("page");
  }

  function finish() {
    stage.hidden = true;
    endBox.hidden = false;
    renderMap();
    const totale = stops.length;
    endText.textContent =
      score === totale
        ? `Punteggio ${score}/${totale}. La ragion pratica applaude: cielo e dovere sono a posto.`
        : `Punteggio ${score}/${totale}. Rileggi Imparare o il fumetto sulle fermate incerte, poi rifai il giro.`;
    if (window.AudioUi) window.AudioUi.beep(score === totale ? "win" : "page");
  }

  function restart() {
    index = 0;
    score = 0;
    showStop();
  }

  document.getElementById("btn-next").addEventListener("click", goNext);
  document.getElementById("btn-restart").addEventListener("click", restart);
  document.getElementById("btn-again").addEventListener("click", restart);

  showStop();
})();

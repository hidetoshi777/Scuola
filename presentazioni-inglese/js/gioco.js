(function () {
  const stops = [
    {
      luogo: "Ciao",
      domanda: "Come si dice «Ciao!» in inglese?",
      x: 20,
      y: 78,
      spiegazione: "Hello! (va bene anche Hi!).",
      opzioni: [
        { t: "Hello!", ok: true },
        { t: "Goodbye!", ok: false },
        { t: "Please!", ok: false },
      ],
    },
    {
      luogo: "Il nome",
      domanda: "Come si dice «Mi chiamo…»?",
      x: 30,
      y: 58,
      spiegazione: "My name is… Poi metti il tuo nome.",
      opzioni: [
        { t: "My name is…", ok: true },
        { t: "How are you?", ok: false },
        { t: "Thank you.", ok: false },
      ],
    },
    {
      luogo: "Come stai",
      domanda: "Qualcuno chiede: How are you? Tu cosa rispondi?",
      x: 44,
      y: 46,
      spiegazione: "I’m fine, thanks. Poi puoi dire And you?",
      opzioni: [
        { t: "I’m fine, thanks.", ok: true },
        { t: "My name is Nico.", ok: false },
        { t: "Good night.", ok: false },
      ],
    },
    {
      luogo: "Piacere",
      domanda: "Come si dice «Piacere!»?",
      x: 38,
      y: 26,
      spiegazione: "Nice to meet you!",
      opzioni: [
        { t: "Nice to meet you!", ok: true },
        { t: "See you!", ok: false },
        { t: "I’m sorry.", ok: false },
      ],
    },
    {
      luogo: "Cantante",
      domanda: "Come si dice «Il mio cantante preferito è…»?",
      x: 62,
      y: 46,
      spiegazione: "My favourite singer is… Poi il nome (es. Vasco).",
      opzioni: [
        { t: "My favourite singer is…", ok: true },
        { t: "My favourite colour is…", ok: false },
        { t: "I am a singer.", ok: false },
      ],
    },
    {
      luogo: "Tempo libero",
      domanda: "Come si dice «Nel tempo libero mi piace…»?",
      x: 78,
      y: 24,
      spiegazione: "In my free time I like… Poi cosa ti piace (es. football).",
      opzioni: [
        { t: "In my free time I like…", ok: true },
        { t: "I like school.", ok: false },
        { t: "See you tomorrow.", ok: false },
      ],
    },
  ];

  const map = document.getElementById("yard-map");
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
  if (!map || !stops.length) return;

  let index = 0;
  let score = 0;
  let answered = false;
  const pins = [];

  hudTotal.textContent = String(stops.length);

  stops.forEach((stop, i) => {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "yard-pin";
    pin.textContent = String(i + 1);
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
    meta.textContent = `Tappa ${index + 1}`;
    title.textContent = stop.luogo;
    question.textContent = stop.domanda;
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
      feedback.textContent = `No. ${stops[index].spiegazione}`;
      if (window.AudioUi) window.AudioUi.beep("err");
    }

    feedback.hidden = false;
    hudScore.textContent = String(score);
    nextBtn.hidden = false;
    nextBtn.textContent = index === stops.length - 1 ? "Vedi il risultato" : "Tappa successiva →";
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
        ? `Punteggio ${score}/${totale}. Ora dillo tu: Hello! My name is… My favourite singer is… In my free time I like…`
        : `Punteggio ${score}/${totale}. Riguarda il fumetto e rifai il cortile.`;
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

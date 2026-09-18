(function () {
  const O = window.Orologio;
  if (!O) return;

  const TIMES = [
    { h: 8, m: 0 },
    { h: 10, m: 30 },
    { h: 3, m: 15 },
    { h: 4, m: 45 },
    { h: 2, m: 0 },
    { h: 7, m: 30 },
    { h: 11, m: 15 },
    { h: 9, m: 45 },
  ];

  const host = document.getElementById("game-clock");
  const digital = document.getElementById("clock-digital");
  const meta = document.getElementById("stop-meta");
  const help = document.getElementById("stop-help");
  const list = document.getElementById("choice-list");
  const feedback = document.getElementById("stop-feedback");
  const nextBtn = document.getElementById("btn-next");
  const endBox = document.getElementById("gioco-end");
  const endText = document.getElementById("end-text");
  const hudStop = document.getElementById("hud-stop");
  const hudTotal = document.getElementById("hud-total");
  const hudScore = document.getElementById("hud-score");
  const card = document.getElementById("ask-card");
  const dotsWrap = document.getElementById("dots-ora");
  if (!host || !list) return;

  let svgRoot = null;
  let index = 0;
  let score = 0;
  let answered = false;

  hudTotal.textContent = String(TIMES.length);

  TIMES.forEach(() => {
    const d = document.createElement("span");
    dotsWrap.appendChild(d);
  });
  const dots = Array.from(dotsWrap.children);

  function unique(list) {
    return [...new Set(list)];
  }

  function opzioni(h, m) {
    const ok = O.frase(h, m).en;
    const nextH = O.wrapHour(h + 1);
    const prevH = O.wrapHour(h - 1);
    const pool = unique(
      [
        O.frase(h, 0).en,
        O.frase(h, 15).en,
        O.frase(h, 30).en,
        O.frase(h, 45).en,
        O.frase(nextH, m).en,
        O.frase(prevH, m).en,
        O.frase(h, m === 15 ? 45 : 15).en,
      ].filter((t) => t !== ok)
    );
    const mescolate = window.mescola ? window.mescola(pool) : pool;
    const scelte = mescolate.slice(0, 2).map((t) => ({ t, ok: false }));
    scelte.push({ t: ok, ok: true });
    return window.mescola ? window.mescola(scelte) : scelte;
  }

  function renderDots() {
    dots.forEach((dot, i) => {
      dot.classList.remove("is-now", "is-done");
      if (i < index) dot.classList.add("is-done");
      else if (i === index) dot.classList.add("is-now");
    });
  }

  function showStop() {
    const t = TIMES[index];
    answered = false;
    endBox.hidden = true;
    card.hidden = false;
    nextBtn.hidden = true;
    feedback.hidden = true;
    feedback.className = "feedback";
    digital.hidden = true;
    digital.textContent = "";
    hudStop.textContent = String(index + 1);
    hudScore.textContent = String(score);
    meta.textContent = "Orologio " + (index + 1);
    help.textContent = "Scegli una frase.";

    if (!svgRoot) {
      svgRoot = O.mount(host, t.h, t.m);
    } else {
      O.setHands(svgRoot, t.h, t.m);
    }

    list.innerHTML = "";
    opzioni(t.h, t.m).forEach((op) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = op.t;
      btn.addEventListener("click", () => onAnswer(op, btn));
      li.appendChild(btn);
      list.appendChild(li);
    });
    renderDots();
  }

  function onAnswer(op, btn) {
    if (answered) return;
    answered = true;
    const t = TIMES[index];
    const frase = O.frase(t.h, t.m);
    const buttons = Array.from(list.querySelectorAll("button"));
    buttons.forEach((b) => {
      b.disabled = true;
    });

    digital.hidden = false;
    digital.textContent = O.digitale(t.h, t.m);

    if (op.ok) {
      score += 1;
      btn.classList.add("is-ok");
      feedback.className = "feedback is-ok";
      feedback.textContent = "Giusto. " + frase.it;
      if (window.AudioUi) window.AudioUi.beep("ok");
    } else {
      btn.classList.add("is-bad");
      buttons.forEach((b) => {
        if (b.textContent === frase.en) b.classList.add("is-ok");
      });
      feedback.className = "feedback is-bad";
      feedback.textContent = "No. " + frase.en + " → " + frase.it;
      if (window.AudioUi) window.AudioUi.beep("err");
    }

    feedback.hidden = false;
    hudScore.textContent = String(score);
    nextBtn.hidden = false;
    nextBtn.textContent = index === TIMES.length - 1 ? "Vedi il risultato" : "Orologio successivo →";
  }

  function goNext() {
    if (index >= TIMES.length - 1) {
      finish();
      return;
    }
    index += 1;
    showStop();
    if (window.AudioUi) window.AudioUi.beep("page");
  }

  function finish() {
    card.hidden = true;
    endBox.hidden = false;
    renderDots();
    const totale = TIMES.length;
    endText.textContent =
      score === totale
        ? "Punteggio " + score + "/" + totale + ". Ora dillo tu: What time is it? It’s eight o’clock."
        : "Punteggio " + score + "/" + totale + ". Riguarda il fumetto e rifai gli 8 orologi.";
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

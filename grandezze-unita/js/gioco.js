(function () {
  const TAPPE = [
    {
      titolo: "Disco 1 · Banco",
      q: "Una grandezza fisica è…",
      scelte: [
        { t: "una cosa che puoi misurare", ok: true },
        { t: "un disegno sul muro", ok: false },
        { t: "solo il numero 5", ok: false },
      ],
      hint: "Se la misuri, è una grandezza.",
    },
    {
      titolo: "Disco 2 · Metro",
      q: "Scrivi 80. Manca qualcosa. Cosa?",
      scelte: [
        { t: "l’unità (cm, m…)", ok: true },
        { t: "un colore", ok: false },
        { t: "il nome del maestro", ok: false },
      ],
      hint: "Numero e unità sempre insieme.",
    },
    {
      titolo: "Disco 3 · Tre basi",
      q: "Quali sono le tre grandezze fondamentali di questa lezione?",
      scelte: [
        { t: "lunghezza, massa, tempo (m, kg, s)", ok: true },
        { t: "area, volume, velocità", ok: false },
        { t: "rosso, verde, blu", ok: false },
      ],
      hint: "Le tre che misuri con metro, bilancia, orologio.",
    },
    {
      titolo: "Disco 4 · Lamiera",
      q: "L’area di una lamiera si misura in…",
      scelte: [
        { t: "m²", ok: true },
        { t: "kg", ok: false },
        { t: "s", ok: false },
      ],
      hint: "Lunghezza × larghezza. Unità derivata.",
    },
    {
      titolo: "Disco 5 · Scooter",
      q: "Lo scooter fa 100 m in 10 s. Quanto vale v?",
      scelte: [
        { t: "10 m/s", ok: true },
        { t: "100 m/s", ok: false },
        { t: "10 kg", ok: false },
      ],
      hint: "v = s / t → 100 / 10.",
    },
  ];

  /* Pad positions from the courtyard map (percent of the image). */
  const PINS = [
    { x: 32.2, y: 81.5 },
    { x: 39.4, y: 51.2 },
    { x: 57.6, y: 62.8 },
    { x: 73.2, y: 48.5 },
    { x: 76.4, y: 22.4 },
  ];

  const mappa = document.getElementById("mappa");
  const tappaBox = document.getElementById("tappa");
  const endBox = document.getElementById("gioco-end");
  const meta = document.getElementById("tappa-meta");
  const titolo = document.getElementById("tappa-titolo");
  const domanda = document.getElementById("tappa-q");
  const scelte = document.getElementById("scelte");
  const msg = document.getElementById("tappa-msg");
  const btnNext = document.getElementById("btn-next");
  const hudStop = document.getElementById("hud-stop");
  const hudScore = document.getElementById("hud-score");
  const endText = document.getElementById("end-text");
  if (!mappa || !tappaBox) return;

  let index = 0;
  let score = 0;
  let answered = false;
  const giaPunto = new Array(TAPPE.length).fill(false);
  const pins = [];

  PINS.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pin";
    b.textContent = String(i + 1);
    b.style.left = p.x + "%";
    b.style.top = p.y + "%";
    b.setAttribute("aria-label", "Tappa " + (i + 1));
    b.addEventListener("click", () => {
      if (i <= index) mostra(i);
    });
    mappa.appendChild(b);
    pins.push(b);
  });

  function mostra(i) {
    index = i;
    answered = false;
    endBox.hidden = true;
    tappaBox.hidden = false;
    const t = TAPPE[i];
    meta.textContent = "Tappa " + (i + 1) + " di 5";
    titolo.textContent = t.titolo;
    domanda.textContent = t.q;
    msg.textContent = "";
    msg.className = "feedback";
    btnNext.hidden = true;
    hudStop.textContent = String(i + 1);
    scelte.innerHTML = "";
    t.scelte.forEach((s) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = s.t;
      b.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        if (s.ok) {
          if (!giaPunto[i]) {
            score += 1;
            giaPunto[i] = true;
            hudScore.textContent = String(score);
          }
          b.classList.add("is-ok");
          msg.textContent = "Giusto. " + t.hint;
          msg.className = "feedback is-ok";
        } else {
          b.classList.add("is-ko");
          const giusta = t.scelte.find((x) => x.ok);
          msg.textContent = "No. " + (giusta ? giusta.t + ". " : "") + t.hint;
          msg.className = "feedback is-ko";
          Array.from(scelte.querySelectorAll("button")).forEach((btn, k) => {
            if (t.scelte[k].ok) btn.classList.add("is-ok");
          });
        }
        btnNext.hidden = false;
        btnNext.textContent = i === TAPPE.length - 1 ? "Vedi il risultato" : "Tappa successiva →";
      });
      li.appendChild(b);
      scelte.appendChild(li);
    });
    pins.forEach((b, k) => {
      b.classList.toggle("is-now", k === i);
      b.classList.toggle("is-done", k < i);
      b.disabled = k > i;
    });
  }

  function fine() {
    tappaBox.hidden = true;
    endBox.hidden = false;
    pins.forEach((b) => {
      b.classList.remove("is-now");
      b.classList.add("is-done");
    });
    endText.textContent =
      score === TAPPE.length
        ? "5 su 5. Numero e unità: li hai tenuti insieme."
        : score + " su 5. Ripassa lo Studio e rifai il nastro.";
  }

  btnNext.addEventListener("click", () => {
    if (index >= TAPPE.length - 1) fine();
    else mostra(index + 1);
  });

  function restart() {
    index = 0;
    score = 0;
    giaPunto.fill(false);
    hudScore.textContent = "0";
    endBox.hidden = true;
    tappaBox.hidden = false;
    mostra(0);
  }

  document.getElementById("btn-restart").addEventListener("click", restart);
  document.getElementById("btn-again").addEventListener("click", restart);
  mostra(0);
})();

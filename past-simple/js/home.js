(function () {
  /* Stessa persona, stesso verbo: OGGI (present simple) o IERI (past simple). */
  const COPPIE = [
    {
      sempre: ["Tony <mark class=\"s\">repairs</mark> motorbikes every day.", "Tony ripara moto ogni giorno.", "every day → abitudine: present simple. Tony = he → repairs."],
      adesso: ["Yesterday Tony <mark class=\"c\">repaired</mark> a motorbike.", "Ieri Tony ha riparato una moto.", "yesterday → passato finito: repair + ed."],
    },
    {
      sempre: ["We <mark class=\"s\">go</mark> to the market on Saturdays.", "Andiamo al mercato il sabato.", "on Saturdays → abitudine: go."],
      adesso: ["Last Saturday we <mark class=\"c\">went</mark> to the market.", "Sabato scorso siamo andati al mercato.", "go → went: verbo irregolare, da imparare."],
    },
    {
      sempre: ["I <mark class=\"s\">am</mark> at home today.", "Oggi sono a casa.", "today → presente: am."],
      adesso: ["Yesterday I <mark class=\"c\">was</mark> at home.", "Ieri ero a casa.", "be → was / were. I → was."],
    },
    {
      sempre: ["She <mark class=\"s\">doesn’t play</mark> football on Sundays.", "La domenica non gioca a calcio.", "doesn’t + verbo base."],
      adesso: ["She <mark class=\"c\">didn’t play</mark> football yesterday.", "Ieri non ha giocato a calcio.", "didn’t + verbo base (play, non played)."],
    },
    {
      sempre: ["<mark class=\"s\">Do</mark> you <mark class=\"s\">watch</mark> TV every evening?", "Guardi la TV ogni sera?", "Domanda del presente: Do + watch."],
      adesso: ["<mark class=\"c\">Did</mark> you <mark class=\"c\">watch</mark> TV last night?", "Hai guardato la TV ieri sera?", "Domanda del passato: Did + watch (base). Risposta: Yes, I did."],
    },
  ];

  const out = document.getElementById("frase-viva");
  const leva = Array.from(document.querySelectorAll(".leva [data-modo]"));
  const altra = document.getElementById("altra-frase");
  if (!out || !leva.length) return;

  let modo = "sempre";
  let i = 0;

  function render() {
    const [en, it, perche] = COPPIE[i][modo];
    out.innerHTML =
      '<span class="en">' + en + "</span>" +
      '<span class="it">' + it + "</span>" +
      '<span class="perche">' + perche + "</span>";
    out.classList.toggle("is-adesso", modo === "adesso");
    leva.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === modo)));
  }

  leva.forEach((b) =>
    b.addEventListener("click", () => {
      modo = b.dataset.modo;
      render();
    })
  );
  if (altra)
    altra.addEventListener("click", () => {
      i = (i + 1) % COPPIE.length;
      render();
    });
  render();
})();

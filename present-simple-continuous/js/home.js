(function () {
  /* Stessa persona, stesso verbo: SEMPRE (simple) o ADESSO (continuous). */
  const COPPIE = [
    {
      sempre: ["Salvo <mark class=\"s\">cleans</mark> the filters every month.", "Salvo pulisce i filtri ogni mese.", "every month → succede sempre: present simple. Salvo = he → cleans."],
      adesso: ["Look! Salvo <mark class=\"c\">is cleaning</mark> the filters.", "Guarda! Salvo sta pulendo i filtri.", "Look! → succede adesso: is + cleaning."],
    },
    {
      sempre: ["Nico <mark class=\"s\">checks</mark> the tools every morning.", "Nico controlla gli attrezzi ogni mattina.", "every morning → abitudine: he checks."],
      adesso: ["Nico <mark class=\"c\">is checking</mark> the tools right now.", "Nico sta controllando gli attrezzi in questo momento.", "right now → in corso: is checking."],
    },
    {
      sempre: ["I <mark class=\"s\">repair</mark> air conditioners.", "Riparo condizionatori (è il mio lavoro).", "È il mio lavoro, sempre: I repair."],
      adesso: ["I<mark class=\"c\">’m repairing</mark> an air conditioner at the moment.", "Sto riparando un condizionatore in questo momento.", "at the moment → I am (I’m) + repairing."],
    },
    {
      sempre: ["We <mark class=\"s\">don’t work</mark> on Sundays.", "La domenica non lavoriamo.", "on Sundays → abitudine. Negativa: don’t + work."],
      adesso: ["We <mark class=\"c\">aren’t working</mark> today.", "Oggi non stiamo lavorando.", "today → adesso. Negativa: aren’t + working."],
    },
    {
      sempre: ["<mark class=\"s\">Does</mark> Rita <mark class=\"s\">test</mark> the gas every week?", "Rita controlla il gas ogni settimana?", "Domanda del simple: Does + test (senza -s)."],
      adesso: ["<mark class=\"c\">Is</mark> Rita <mark class=\"c\">testing</mark> the gas now?", "Rita sta controllando il gas adesso?", "Domanda del continuous: Is + testing."],
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

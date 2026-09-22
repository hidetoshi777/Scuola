(function () {
  const data = window.BAROCCO;
  const board = document.getElementById("gioco-board");
  const card = document.getElementById("gioco-card");
  if (!data || !board || !card) return;

  const tappe = [
    {
      pin: "tesauro",
      titolo: "Torino",
      q: "Tesauro dice che la metafora è come…",
      opzioni: ["un cannocchiale", "un secchio", "una fiaba"],
      ok: 0,
      perche: "La metafora fa vedere lontano, come un cannocchiale.",
    },
    {
      pin: "chiabrera",
      titolo: "Savona",
      q: "Chiabrera cerca…",
      opzioni: ["un ritmo più pulito", "solo meraviglia a ogni costo", "fiabe in napoletano"],
      ok: 0,
      perche: "Chiabrera vuole un verso più pulito, meno gonfio.",
    },
    {
      pin: "tassoni",
      titolo: "Modena",
      q: "La secchia rapita è…",
      opzioni: ["un poema buffo su un secchio", "un trattato di Galileo", "una fiaba di Basile"],
      ok: 0,
      perche: "Tassoni racconta una guerra tra Modena e Bologna per un secchio.",
    },
    {
      pin: "galileo",
      titolo: "Pisa",
      q: "Galileo, nello stesso secolo, vuole…",
      opzioni: ["spiegare con chiarezza", "stupire come Marino", "fare una guerra per un secchio"],
      ok: 0,
      perche: "Galileo non è un poeta barocco: scrive per spiegare.",
    },
    {
      pin: "napoli",
      titolo: "Napoli · Marino",
      q: "Per Marino lo scopo del poeta è…",
      opzioni: ["la meraviglia", "la chiarezza scientifica", "nascondere le metafore"],
      ok: 0,
      perche: "«È del poeta il fin la meraviglia»: stupire.",
    },
    {
      pin: "napoli",
      titolo: "Napoli · Basile",
      q: "Lo cunto de li cunti di Basile sono…",
      opzioni: ["fiabe del Seicento", "un poema eroico", "lettere di Galileo"],
      ok: 0,
      perche: "Basile scrive fiabe. Anche Cenerentola arriva da lì.",
    },
  ];

  let passo = 0;
  let blocco = false;

  data.pins.forEach((pin, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gioco-pin";
    btn.style.left = pin.left;
    btn.style.top = pin.top;
    btn.dataset.id = pin.id;
    btn.textContent = String(i + 1);
    btn.setAttribute("aria-label", pin.label);
    btn.disabled = true;
    btn.addEventListener("click", () => {
      if (tappe[passo] && tappe[passo].pin === pin.id) mostraDomanda();
    });
    board.appendChild(btn);
  });

  function syncPins() {
    const pinOra = tappe[passo] && tappe[passo].pin;
    const fatti = new Set(tappe.slice(0, passo).map((t) => t.pin));
    document.querySelectorAll(".gioco-pin").forEach((btn) => {
      const id = btn.dataset.id;
      btn.classList.toggle("is-here", id === pinOra);
      btn.classList.toggle("is-done", fatti.has(id) && id !== pinOra);
      btn.disabled = id !== pinOra;
    });
  }

  function mostraDomanda() {
    const t = tappe[passo];
    if (!t) return;
    blocco = false;
    const coppie = t.opzioni.map((testo, i) => ({ testo, i }));
    window.mescola(coppie);
    card.innerHTML =
      "<p class=\"kicker\">Tappa " +
      (passo + 1) +
      " di " +
      tappe.length +
      "</p><h2>" +
      t.titolo +
      "</h2><p>" +
      t.q +
      '</p><div class="gioco-opzioni" id="gioco-opzioni"></div><p class="gioco-feedback" id="gioco-feedback" aria-live="polite"></p>';
    const wrap = document.getElementById("gioco-opzioni");
    coppie.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = c.testo;
      b.addEventListener("click", () => rispondi(c.i, b, wrap));
      wrap.appendChild(b);
    });
    syncPins();
  }

  function rispondi(scelta, btn, wrap) {
    if (blocco) return;
    const t = tappe[passo];
    const feedback = document.getElementById("gioco-feedback");
    if (scelta === t.ok) {
      blocco = true;
      btn.classList.add("is-ok");
      wrap.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
      });
      feedback.textContent = "Giusto. " + t.perche;
      const next = document.createElement("button");
      next.type = "button";
      next.className = "btn btn-primary gioco-next";
      if (passo === tappe.length - 1) {
        next.textContent = "Vedi il riepilogo";
        next.addEventListener("click", fine);
      } else {
        next.textContent = "Città successiva";
        next.addEventListener("click", () => {
          passo += 1;
          mostraDomanda();
        });
      }
      card.appendChild(next);
    } else {
      btn.classList.add("is-no");
      btn.disabled = true;
      feedback.textContent = "No. Prova un’altra risposta.";
    }
  }

  function fine() {
    document.querySelectorAll(".gioco-pin").forEach((btn) => {
      btn.classList.add("is-done");
      btn.classList.remove("is-here");
      btn.disabled = true;
    });
    card.innerHTML =
      "<h2>Fatto</h2><p>Barocco italiano = Seicento. Il poeta vuole stupire.</p><ul>" +
      "<li>Marino e Basile: Napoli</li>" +
      "<li>Tassoni: Modena</li>" +
      "<li>Chiabrera: Savona</li>" +
      "<li>Tesauro: Torino</li>" +
      "<li>Galileo: Pisa — spiega, non stupisce</li>" +
      "</ul><p><a class=\"btn btn-primary\" href=\"scheda.html\">Torna alla scheda</a></p>";
  }

  mostraDomanda();
})();

(function () {
  /* Tre livelli. Ogni carta va nella cassetta "s" (OGGI / present simple) o "c" (IERI / past simple).
     Livello 3: le cassette mostrano due forme del verbo; "s" è sempre la forma del presente. */
  const LIVELLI = [
    {
      nome: "Parole spia",
      etichette: null,
      carte: [
        { en: "today", it: "oggi", ok: "s", why: "oggi → present simple" },
        { en: "every day", it: "ogni giorno", ok: "s", why: "abitudine → present simple" },
        { en: "always", it: "sempre", ok: "s", why: "abitudine → present simple" },
        { en: "usually", it: "di solito", ok: "s", why: "abitudine → present simple" },
        { en: "on Mondays", it: "il lunedì", ok: "s", why: "ogni lunedì → present simple" },
        { en: "every morning", it: "ogni mattina", ok: "s", why: "routine → present simple" },
        { en: "now", it: "adesso", ok: "s", why: "adesso non è passato" },
        { en: "every Sunday", it: "ogni domenica", ok: "s", why: "abitudine → present simple" },
        { en: "yesterday", it: "ieri", ok: "c", why: "ieri → past simple" },
        { en: "last week", it: "la settimana scorsa", ok: "c", why: "finita → past simple" },
        { en: "two days ago", it: "due giorni fa", ok: "c", why: "ago → past simple" },
        { en: "in 2020", it: "nel 2020", ok: "c", why: "anno passato → past simple" },
        { en: "last night", it: "ieri sera", ok: "c", why: "last + tempo → past simple" },
        { en: "last Saturday", it: "sabato scorso", ok: "c", why: "last + tempo → past simple" },
        { en: "a week ago", it: "una settimana fa", ok: "c", why: "ago → past simple" },
        { en: "yesterday morning", it: "ieri mattina", ok: "c", why: "yesterday → past simple" },
        { en: "last year", it: "l’anno scorso", ok: "c", why: "last + tempo → past simple" },
        { en: "three years ago", it: "tre anni fa", ok: "c", why: "ago → past simple" },
      ],
    },
    {
      nome: "Frasi",
      etichette: null,
      carte: [
        { en: "Tony repairs motorbikes.", it: "Tony ripara moto.", ok: "s", why: "repairs = presente" },
        { en: "I go to the gym every day.", it: "Vado in palestra ogni giorno.", ok: "s", why: "go + every day = presente" },
        { en: "She doesn’t watch TV.", it: "Non guarda la TV.", ok: "s", why: "doesn’t = presente" },
        { en: "Do you play football?", it: "Giochi a calcio?", ok: "s", why: "Do = presente" },
        { en: "We are at school today.", it: "Oggi siamo a scuola.", ok: "s", why: "are = presente" },
        { en: "He buys a helmet every year.", it: "Compra un casco ogni anno.", ok: "s", why: "buys = presente" },
        { en: "The workshop opens at 8.", it: "L’officina apre alle 8.", ok: "s", why: "opens = presente" },
        { en: "Tony repaired a motorbike.", it: "Tony ha riparato una moto.", ok: "c", why: "repaired = passato (-ed)" },
        { en: "I went to the market.", it: "Sono andato al mercato.", ok: "c", why: "went = passato di go" },
        { en: "She didn’t watch TV.", it: "Non ha guardato la TV.", ok: "c", why: "didn’t = passato" },
        { en: "Did you play football?", it: "Hai giocato a calcio?", ok: "c", why: "Did = passato" },
        { en: "We were at school.", it: "Eravamo a scuola.", ok: "c", why: "were = passato di be" },
        { en: "He bought a new helmet.", it: "Ha comprato un casco nuovo.", ok: "c", why: "bought = passato di buy" },
        { en: "I saw an old motorbike.", it: "Ho visto una vecchia moto.", ok: "c", why: "saw = passato di see" },
        { en: "They came home late.", it: "Sono tornati a casa tardi.", ok: "c", why: "came = passato di come" },
        { en: "Anna was at the beach.", it: "Anna era al mare.", ok: "c", why: "was = passato di be" },
      ],
    },
    {
      nome: "Scegli il verbo",
      etichette: true,
      carte: [
        { en: "Yesterday I ___ a motorbike.", it: "repair = riparare", s: "repair", c: "repaired", ok: "c", why: "yesterday → repaired" },
        { en: "Tony ___ football every Sunday.", it: "play = giocare", s: "plays", c: "played", ok: "s", why: "every Sunday → plays" },
        { en: "Last week we ___ to the beach.", it: "go = andare", s: "go", c: "went", ok: "c", why: "last week → went" },
        { en: "She ___ a new helmet two days ago.", it: "buy = comprare", s: "buys", c: "bought", ok: "c", why: "ago → bought" },
        { en: "I ___ at home today.", it: "today = oggi", s: "am", c: "was", ok: "s", why: "today → am" },
        { en: "They ___ tired last night.", it: "tired = stanchi", s: "are", c: "were", ok: "c", why: "last night → were" },
        { en: "We ___ lunch at one o’clock yesterday.", it: "have = avere / fare", s: "have", c: "had", ok: "c", why: "yesterday → had" },
        { en: "He ___ English every Monday.", it: "study = studiare", s: "studies", c: "studied", ok: "s", why: "every Monday → studies" },
        { en: "Yesterday I ___ a photo of the bike.", it: "take = fare (una foto)", s: "take", c: "took", ok: "c", why: "yesterday → took" },
        { en: "In 2020 they ___ in Rome.", it: "live = abitare", s: "live", c: "lived", ok: "c", why: "in 2020 → lived" },
        { en: "Anna ___ the engine every day.", it: "clean = pulire", s: "cleans", c: "cleaned", ok: "s", why: "every day → cleans" },
        { en: "Yesterday it ___ cold.", it: "cold = freddo", s: "is", c: "was", ok: "c", why: "yesterday → was" },
        { en: "Last Saturday I ___ an old bike.", it: "see = vedere", s: "see", c: "saw", ok: "c", why: "last Saturday → saw" },
        { en: "We ___ home late last night.", it: "come = venire / tornare", s: "come", c: "came", ok: "c", why: "last night → came" },
      ],
    },
  ];

  const PER_TURNO = 12;
  const DURATA = 90;

  const el = (id) => document.getElementById(id);
  const carta = el("carta");
  const cartaEn = el("carta-en");
  const cartaIt = el("carta-it");
  const cassaS = el("cassa-s");
  const cassaC = el("cassa-c");
  const spiega = el("spiega");
  const fine = el("fine");
  const btnVia = el("btn-via");
  const barra = el("barra");
  const livelliBtn = Array.from(document.querySelectorAll("[data-livello]"));
  if (!carta || !cassaS || !cassaC) return;

  let livello = 0;
  let mazzo = [];
  let idx = 0;
  let punti = 0;
  let serie = 0;
  let nS = 0;
  let nC = 0;
  let errori = [];
  let tempo = DURATA;
  let timer = null;
  let attivo = false;
  let bloccato = false;
  let turno = 0;

  function scegliLivello(n) {
    livello = n;
    livelliBtn.forEach((b) => {
      const on = Number(b.dataset.livello) === n;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("btn-blu", on);
    });
    ferma();
    reset();
  }

  function reset() {
    turno += 1;
    attivo = false;
    idx = 0; punti = 0; serie = 0; nS = 0; nC = 0; errori = [];
    tempo = DURATA;
    el("hud-n").textContent = "1";
    el("hud-punti").textContent = "0";
    el("hud-serie").textContent = "0";
    el("hud-tempo").textContent = String(DURATA);
    barra.style.width = "100%";
    el("cassa-s-n").textContent = "0";
    el("cassa-c-n").textContent = "0";
    el("cassa-s-label").textContent = "OGGI";
    el("cassa-c-label").textContent = "IERI";
    el("cassa-s-sub").textContent = "present simple";
    el("cassa-c-sub").textContent = "past simple";
    cassaS.disabled = true;
    cassaC.disabled = true;
    cartaEn.textContent = "Premi «Via!»";
    cartaIt.textContent = "Livello " + (livello + 1) + ": " + LIVELLI[livello].nome + ". Con la tastiera: ← e →.";
    spiega.textContent = "";
    spiega.className = "spiega";
    fine.hidden = true;
    btnVia.hidden = false;
    carta.classList.remove("vola-s", "vola-c", "scuoti");
  }

  function ferma() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function via() {
    reset();
    const L = LIVELLI[livello];
    mazzo = window.mescola(L.carte).slice(0, Math.min(PER_TURNO, L.carte.length));
    el("hud-tot").textContent = String(mazzo.length);
    attivo = true;
    btnVia.hidden = true;
    cassaS.disabled = false;
    cassaC.disabled = false;
    mostra();
    timer = setInterval(() => {
      tempo -= 1;
      el("hud-tempo").textContent = String(Math.max(0, tempo));
      barra.style.width = Math.max(0, (tempo / DURATA) * 100) + "%";
      if (tempo <= 0) chiudi(true);
    }, 1000);
  }

  function mostra() {
    const k = mazzo[idx];
    carta.classList.remove("vola-s", "vola-c", "scuoti");
    cartaEn.textContent = k.en;
    cartaIt.textContent = k.it;
    el("hud-n").textContent = String(idx + 1);
    if (LIVELLI[livello].etichette) {
      el("cassa-s-label").textContent = k.s;
      el("cassa-c-label").textContent = k.c;
      el("cassa-s-sub").textContent = "present";
      el("cassa-c-sub").textContent = "past";
    }
    bloccato = false;
  }

  function metti(dove) {
    if (!attivo || bloccato) return;
    bloccato = true;
    const k = mazzo[idx];
    const giusto = k.ok === dove;
    if (giusto) {
      serie += 1;
      punti += 1 + (serie >= 3 ? 1 : 0);
      if (dove === "s") nS += 1; else nC += 1;
      el("cassa-s-n").textContent = String(nS);
      el("cassa-c-n").textContent = String(nC);
      spiega.textContent = "Giusto! " + k.why + (serie >= 3 ? " · serie +1" : "");
      spiega.className = "spiega is-ok";
      carta.classList.add(dove === "s" ? "vola-s" : "vola-c");
    } else {
      serie = 0;
      errori.push(k);
      const giusta = LIVELLI[livello].etichette ? (k.ok === "s" ? k.s : k.c) : k.ok === "s" ? "OGGI" : "IERI";
      spiega.textContent = "No: " + giusta + ". " + k.why;
      spiega.className = "spiega is-ko";
      carta.classList.add("scuoti");
    }
    el("hud-punti").textContent = String(punti);
    el("hud-serie").textContent = String(serie);
    const attesa = giusto ? 450 : 1300;
    const t = turno;
    setTimeout(() => {
      if (t !== turno) return;
      idx += 1;
      if (idx >= mazzo.length) chiudi(false);
      else if (attivo) mostra();
    }, attesa);
  }

  function chiudi(scaduto) {
    if (!attivo) return;
    attivo = false;
    ferma();
    cassaS.disabled = true;
    cassaC.disabled = true;
    const fatte = Math.min(idx, mazzo.length);
    el("fine-titolo").textContent = scaduto ? "Tempo finito!" : "Fine turno";
    el("fine-testo").textContent =
      "Carte messe: " + fatte + " su " + mazzo.length + " · errori: " + errori.length + " · punti: " + punti +
      (errori.length === 0 && !scaduto ? ". Perfetto! Prova il livello successivo." : ".");
    const rip = el("fine-ripasso");
    rip.innerHTML = "";
    if (errori.length) {
      const h = document.createElement("p");
      h.innerHTML = "<strong>Da ripassare:</strong>";
      const ul = document.createElement("ul");
      ul.className = "ripasso";
      errori.forEach((k) => {
        const li = document.createElement("li");
        const giusta = LIVELLI[livello].etichette ? (k.ok === "s" ? k.s : k.c) : k.ok === "s" ? "OGGI" : "IERI";
        li.innerHTML = '<span class="en"></span> → <strong></strong> · <span class="it"></span>';
        li.children[0].textContent = k.en;
        li.children[1].textContent = giusta;
        li.children[2].textContent = k.why;
        ul.appendChild(li);
      });
      rip.appendChild(h);
      rip.appendChild(ul);
    }
    fine.hidden = false;
    carta.classList.remove("vola-s", "vola-c", "scuoti");
    cartaEn.textContent = scaduto ? "Tempo scaduto" : "Cassette piene!";
    cartaIt.textContent = "Guarda il riepilogo qui sotto.";
  }

  cassaS.addEventListener("click", () => metti("s"));
  cassaC.addEventListener("click", () => metti("c"));
  btnVia.addEventListener("click", via);
  el("btn-ancora").addEventListener("click", via);
  livelliBtn.forEach((b) => b.addEventListener("click", () => scegliLivello(Number(b.dataset.livello))));
  document.addEventListener("keydown", (e) => {
    if (!attivo) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); metti("s"); }
    else if (e.key === "ArrowRight") { e.preventDefault(); metti("c"); }
  });

  scegliLivello(0);
})();

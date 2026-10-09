(function () {
  /* Tre livelli. Ogni carta va nella cassetta "s" (SEMPRE / simple) o "c" (ADESSO / continuous).
     Livello 3: le cassette mostrano due forme del verbo; "s" è sempre la forma simple. */
  const LIVELLI = [
    {
      nome: "Parole spia",
      etichette: null,
      carte: [
        { en: "every day", it: "ogni giorno", ok: "s", why: "si ripete → simple" },
        { en: "always", it: "sempre", ok: "s", why: "abitudine → simple" },
        { en: "usually", it: "di solito", ok: "s", why: "abitudine → simple" },
        { en: "never", it: "mai", ok: "s", why: "frequenza → simple" },
        { en: "on Mondays", it: "il lunedì", ok: "s", why: "ogni lunedì → simple" },
        { en: "once a week", it: "una volta a settimana", ok: "s", why: "frequenza → simple" },
        { en: "every morning", it: "ogni mattina", ok: "s", why: "routine → simple" },
        { en: "sometimes", it: "a volte", ok: "s", why: "frequenza → simple" },
        { en: "at the weekend", it: "nel fine settimana", ok: "s", why: "abitudine → simple" },
        { en: "often", it: "spesso", ok: "s", why: "frequenza → simple" },
        { en: "now", it: "adesso", ok: "c", why: "in corso → continuous" },
        { en: "right now", it: "proprio adesso", ok: "c", why: "in corso → continuous" },
        { en: "at the moment", it: "in questo momento", ok: "c", why: "in corso → continuous" },
        { en: "Look!", it: "Guarda!", ok: "c", why: "succede davanti a te → continuous" },
        { en: "Listen!", it: "Ascolta!", ok: "c", why: "succede adesso → continuous" },
        { en: "this week", it: "questa settimana", ok: "c", why: "periodo temporaneo → continuous" },
        { en: "these days", it: "in questi giorni", ok: "c", why: "periodo temporaneo → continuous" },
        { en: "at present", it: "attualmente", ok: "c", why: "in corso → continuous" },
      ],
    },
    {
      nome: "Frasi",
      etichette: null,
      carte: [
        { en: "Salvo starts work at 8.", it: "Salvo comincia a lavorare alle 8.", ok: "s", why: "starts = simple (abitudine)" },
        { en: "He checks his e-mails every morning.", it: "Controlla le e-mail ogni mattina.", ok: "s", why: "checks = simple" },
        { en: "Water boils at 100 °C.", it: "L’acqua bolle a 100 °C.", ok: "s", why: "fatto sempre vero → simple" },
        { en: "The workshop opens at 8:00.", it: "L’officina apre alle 8.", ok: "s", why: "orario → simple" },
        { en: "I need a screwdriver.", it: "Mi serve un cacciavite.", ok: "s", why: "need = simple (verbo di stato)" },
        { en: "Rita doesn’t work at the weekend.", it: "Rita non lavora nel fine settimana.", ok: "s", why: "doesn’t work = simple" },
        { en: "Do you clean your tools every day?", it: "Pulisci gli attrezzi ogni giorno?", ok: "s", why: "Do … clean = simple" },
        { en: "My uncle works for a heating company.", it: "Mio zio lavora per una ditta di riscaldamento.", ok: "s", why: "works = simple (lavoro stabile)" },
        { en: "Look! Salvo is cleaning the filter.", it: "Guarda! Salvo sta pulendo il filtro.", ok: "c", why: "is cleaning = continuous" },
        { en: "Rita is testing the gas pressure.", it: "Rita sta controllando la pressione del gas.", ok: "c", why: "is testing = continuous" },
        { en: "I’m changing a tyre right now.", it: "Sto cambiando una gomma proprio adesso.", ok: "c", why: "’m changing = continuous" },
        { en: "Are you listening to me?", it: "Mi stai ascoltando?", ok: "c", why: "Are … listening = continuous" },
        { en: "This week we’re working in a hotel.", it: "Questa settimana lavoriamo in un hotel.", ok: "c", why: "’re working = continuous" },
        { en: "Listen! The engine is making a strange noise.", it: "Ascolta! Il motore fa un rumore strano.", ok: "c", why: "is making = continuous" },
        { en: "Nico isn’t wearing his gloves.", it: "Nico non sta indossando i guanti.", ok: "c", why: "isn’t wearing = continuous" },
        { en: "What are you doing?", it: "Cosa stai facendo?", ok: "c", why: "are … doing = continuous" },
      ],
    },
    {
      nome: "Scegli il verbo",
      etichette: true,
      carte: [
        { en: "Look! Nico ___ the floor.", it: "floor = pavimento", s: "cleans", c: "is cleaning", ok: "c", why: "Look! → is cleaning" },
        { en: "Salvo ___ his van every day.", it: "van = furgone", s: "drives", c: "is driving", ok: "s", why: "every day → drives" },
        { en: "Shh! The boss ___ on the phone.", it: "Shh! = Silenzio! · boss = capo", s: "talks", c: "is talking", ok: "c", why: "Shh! → is talking" },
        { en: "I ___ a new drill.", it: "drill = trapano", s: "need", c: "am needing", ok: "s", why: "need: verbo di stato, niente -ing" },
        { en: "The bus ___ at 7:15.", it: "leave = partire", s: "leaves", c: "is leaving", ok: "s", why: "orario fisso → leaves" },
        { en: "This week we ___ a hotel in Taormina.", it: "service = fare la manutenzione", s: "service", c: "are servicing", ok: "c", why: "this week → are servicing" },
        { en: "Rita usually ___ at 8.", it: "start = cominciare", s: "starts", c: "is starting", ok: "s", why: "usually → starts" },
        { en: "Water ___ at 100 °C.", it: "boil = bollire", s: "boils", c: "is boiling", ok: "s", why: "fatto sempre vero → boils" },
        { en: "Right now I ___ the fuse box.", it: "fuse box = quadro elettrico", s: "check", c: "am checking", ok: "c", why: "right now → am checking" },
        { en: "He ___ the answer.", it: "know = sapere", s: "knows", c: "is knowing", ok: "s", why: "know: verbo di stato" },
        { en: "At the moment they ___ lunch.", it: "have lunch = pranzare", s: "have", c: "are having", ok: "c", why: "have lunch è un’azione → are having" },
        { en: "My cousin ___ in a factory in Catania.", it: "cousin = cugino · factory = fabbrica", s: "works", c: "is working", ok: "s", why: "lavoro stabile → works" },
        { en: "Listen! The engine ___ a strange noise.", it: "engine = motore · noise = rumore", s: "makes", c: "is making", ok: "c", why: "Listen! → is making" },
        { en: "Electricians always ___ safety gloves.", it: "wear = indossare · gloves = guanti", s: "wear", c: "are wearing", ok: "s", why: "always → wear" },
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
    el("cassa-s-label").textContent = "SEMPRE";
    el("cassa-c-label").textContent = "ADESSO";
    el("cassa-s-sub").textContent = "present simple";
    el("cassa-c-sub").textContent = "present continuous";
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
      el("cassa-s-sub").textContent = "simple";
      el("cassa-c-sub").textContent = "continuous";
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
      const giusta = LIVELLI[livello].etichette ? (k.ok === "s" ? k.s : k.c) : k.ok === "s" ? "SEMPRE" : "ADESSO";
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
        const giusta = LIVELLI[livello].etichette ? (k.ok === "s" ? k.s : k.c) : k.ok === "s" ? "SEMPRE" : "ADESSO";
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

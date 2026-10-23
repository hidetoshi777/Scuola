(function () {
  const norm = window.normalizza;
  const mescola = window.mescola;

  /* ============ 1. Costruisci il verbo ============ */
  const SOGGETTI = [
    { id: "I", label: "I", tipo: "I" },
    { id: "you", label: "you", tipo: "plur" },
    { id: "he", label: "he (Tony)", tipo: "3" },
    { id: "she", label: "she (Anna)", tipo: "3" },
    { id: "it", label: "it (the bike)", tipo: "3" },
    { id: "we", label: "we", tipo: "plur" },
    { id: "they", label: "they", tipo: "plur" },
  ];
  const VERBI = [
    ["repair", "the motorbike"], ["work", "in the workshop"], ["clean", "the engine"], ["check", "the brakes"],
    ["fix", "the lights"], ["play", "football"], ["watch", "a film"], ["stop", "the engine"],
    ["study", "English"], ["use", "the drill"], ["go", "to the market"], ["have", "lunch"],
    ["do", "the job"], ["see", "an old bike"], ["make", "a cake"], ["take", "a photo"],
    ["buy", "a helmet"], ["come", "home late"], ["be", "at home"],
  ];
  const IRREGOLARI = { go: "went", have: "had", do: "did", see: "saw", make: "made", take: "took", buy: "bought", come: "came" };
  const RADDOPPIA = { stop: "stopped", plan: "planned" };

  function terza(v) {
    if (v === "have") return ["has", "irregolare: have → has"];
    if (/(s|sh|ch|x|o)$/.test(v)) return [v + "es", "finisce in -" + v.match(/(sh|ch|s|x|o)$/)[1] + " → + es"];
    if (/[^aeiou]y$/.test(v)) return [v.slice(0, -1) + "ies", "consonante + y → ies"];
    return [v + "s", "he / she / it → + s"];
  }
  function passato(v) {
    if (IRREGOLARI[v]) return [IRREGOLARI[v], "verbo irregolare: " + v + " → " + IRREGOLARI[v] + " (da imparare)"];
    if (RADDOPPIA[v]) return [RADDOPPIA[v], "verbo corto: raddoppia la consonante (" + v + " → " + RADDOPPIA[v] + ")"];
    if (/[^aeiou]y$/.test(v)) return [v.slice(0, -1) + "ied", "consonante + y → ied"];
    if (/e$/.test(v)) return [v + "d", "finisce in -e: aggiungi solo -d"];
    return [v + "ed", "verbo regolare: + ed"];
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  const selS = document.getElementById("c-sogg");
  const selV = document.getElementById("c-verbo");
  const selF = document.getElementById("c-forma");
  const cOut = document.getElementById("c-out");
  const levaLab = Array.from(document.querySelectorAll("#costruisci .leva [data-modo]"));
  let modoLab = "adesso";

  if (selS && selV && selF && cOut) {
    SOGGETTI.forEach((s) => selS.add(new Option(s.label, s.id)));
    VERBI.forEach(([v]) => selV.add(new Option(v, v)));
    selS.value = "he";
    selV.value = "repair";

    const renderC = () => {
      const s = SOGGETTI.find((x) => x.id === selS.value);
      const [v, obj] = VERBI.find((x) => x[0] === selV.value);
      const f = selF.value;
      let frase = "";
      let regola = "";
      if (modoLab === "sempre") {
        const tempo = "every day";
        if (v === "be") {
          const be = s.tipo === "I" ? "am" : s.tipo === "3" ? "is" : "are";
          const neg = s.tipo === "I" ? "am not" : s.tipo === "3" ? "isn’t" : "aren’t";
          if (f === "+") { frase = cap(s.id) + " <mark class=\"s\">" + be + "</mark> " + obj + " " + tempo + "."; regola = "be al presente: am / is / are."; }
          else if (f === "-") { frase = cap(s.id) + " <mark class=\"s\">" + neg + "</mark> " + obj + " " + tempo + "."; regola = "am / is / are + not."; }
          else { frase = "<mark class=\"s\">" + cap(be) + "</mark> " + s.id + " " + obj + " " + tempo + "?"; regola = "Con be la domanda si fa girando le parole."; }
        } else if (f === "+") {
          if (s.tipo === "3") {
            const [t, r] = terza(v);
            frase = cap(s.id) + " <mark class=\"s\">" + t + "</mark> " + obj + " " + tempo + ".";
            regola = r + ".";
          } else {
            frase = cap(s.id) + " <mark class=\"s\">" + v + "</mark> " + obj + " " + tempo + ".";
            regola = "Con " + s.id + " il verbo resta uguale.";
          }
        } else if (f === "-") {
          const aux = s.tipo === "3" ? "doesn’t" : "don’t";
          frase = cap(s.id) + " <mark class=\"s\">" + aux + " " + v + "</mark> " + obj + " " + tempo + ".";
          regola = aux + " + verbo base.";
        } else {
          const aux = s.tipo === "3" ? "Does" : "Do";
          frase = "<mark class=\"s\">" + aux + "</mark> " + s.id + " <mark class=\"s\">" + v + "</mark> " + obj + " " + tempo + "?";
          regola = aux + " + soggetto + verbo base.";
        }
        regola = "OGGI → present simple. " + regola;
      } else {
        const tempo = "yesterday";
        if (v === "be") {
          const was = s.tipo === "plur" ? "were" : "was";
          if (f === "+") { frase = cap(s.id) + " <mark class=\"c\">" + was + "</mark> " + obj + " " + tempo + "."; regola = "be al passato: I / he / she / it → was; you / we / they → were."; }
          else if (f === "-") { frase = cap(s.id) + " <mark class=\"c\">" + was + "n’t</mark> " + obj + " " + tempo + "."; regola = was + " + not = " + was + "n’t. Niente didn’t con be."; }
          else { frase = "<mark class=\"c\">" + cap(was) + "</mark> " + s.id + " " + obj + " " + tempo + "?"; regola = "Con be non serve Did: si gira " + was + " + soggetto."; }
        } else {
          const [p, r] = passato(v);
          if (f === "+") {
            frase = cap(s.id) + " <mark class=\"c\">" + p + "</mark> " + obj + " " + tempo + ".";
            regola = r + ". Vale per tutti i soggetti: nessuna -s.";
          } else if (f === "-") {
            frase = cap(s.id) + " <mark class=\"c\">didn’t " + v + "</mark> " + obj + " " + tempo + ".";
            regola = "didn’t + verbo base (" + v + ", non " + p + ").";
          } else {
            frase = "<mark class=\"c\">Did</mark> " + s.id + " <mark class=\"c\">" + v + "</mark> " + obj + " " + tempo + "?";
            regola = "Did + soggetto + verbo base (" + v + ", non " + p + "). Risposta: Yes, " + (s.id === "I" ? "I" : s.id) + " did.";
          }
        }
        regola = "IERI → past simple. " + regola;
      }
      cOut.innerHTML = '<span class="en">' + frase + '</span><span class="regola">' + regola + "</span>";
      cOut.classList.toggle("is-adesso", modoLab === "adesso");
      levaLab.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === modoLab)));
    };
    [selS, selV, selF].forEach((el) => el.addEventListener("change", renderC));
    levaLab.forEach((b) => b.addEventListener("click", () => { modoLab = b.dataset.modo; renderC(); }));
    renderC();
  }

  /* ============ helper scelta multipla immediata ============ */
  function sceltaImmediata(listaId, puntiId, items) {
    const lista = document.getElementById(listaId);
    const punti = document.getElementById(puntiId);
    if (!lista) return;
    let fatte = 0;
    let giuste = 0;
    items.forEach((it) => {
      const li = document.createElement("li");
      if (it.q) {
        const p = document.createElement("p");
        p.className = "frase";
        p.innerHTML = '<span class="en">' + it.q + "</span>";
        li.appendChild(p);
      }
      const box = document.createElement("div");
      box.className = "opzioni";
      const esito = document.createElement("p");
      esito.className = "esito";
      let chiusa = false;
      mescola(it.opts).forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.textContent = o;
        b.addEventListener("click", () => {
          if (chiusa) return;
          chiusa = true;
          fatte += 1;
          const ok = o === it.ok;
          if (ok) giuste += 1;
          b.classList.add(ok ? "is-ok" : "is-ko");
          Array.from(box.children).forEach((x) => { if (x.textContent === it.ok) x.classList.add("is-ok"); });
          esito.textContent = (ok ? "Giusto. " : "No: " + it.ok + ". ") + it.why;
          esito.className = "esito " + (ok ? "is-ok" : "is-ko");
          if (punti) punti.textContent = giuste + " giuste su " + fatte + (fatte === items.length ? " · finito!" : "");
        });
        box.appendChild(b);
      });
      li.appendChild(box);
      li.appendChild(esito);
      lista.appendChild(li);
    });
  }

  /* ============ 2. Scegli la forma ============ */
  sceltaImmediata("scegli-lista", "scegli-punti", [
    { q: "Yesterday I ___ a motorbike.", opts: ["repair", "repaired"], ok: "repaired", why: "yesterday → passato: repair + ed." },
    { q: "Last week we ___ to the beach.", opts: ["go", "went"], ok: "went", why: "go → went (irregolare)." },
    { q: "She ___ a new helmet two days ago.", opts: ["buys", "bought"], ok: "bought", why: "ago → passato. buy → bought." },
    { q: "Tony ___ the engine every day.", opts: ["cleans", "cleaned"], ok: "cleans", why: "every day → presente. he → cleans." },
    { q: "I ___ at home yesterday.", opts: ["was", "were"], ok: "was", why: "I → was." },
    { q: "They ___ tired last night.", opts: ["was", "were"], ok: "were", why: "they → were." },
    { q: "He didn’t ___ football.", opts: ["play", "played"], ok: "play", why: "dopo didn’t il verbo torna base." },
    { q: "Did you ___ the film?", opts: ["see", "saw"], ok: "see", why: "dopo Did il verbo torna base." },
    { q: "In 2020 I ___ English at school.", opts: ["study", "studied"], ok: "studied", why: "in 2020 → passato. study → studied." },
    { q: "We ___ lunch at one o’clock yesterday.", opts: ["have", "had"], ok: "had", why: "yesterday → passato. have → had." },
  ]);

  /* ============ 3. Completa ============ */
  const COMPLETA = [
    { pre: "Yesterday I", verbo: "repair", post: "a motorbike.", ok: ["repaired"], why: "yesterday → repair + ed" },
    { pre: "Last week Anna", verbo: "go", post: "to the sea.", ok: ["went"], why: "irregolare: go → went" },
    { pre: "We", verbo: "be", post: "at school two days ago.", ok: ["were"], why: "we → were" },
    { pre: "He", verbo: "buy", post: "a helmet on Saturday.", ok: ["bought"], why: "irregolare: buy → bought" },
    { pre: "I", verbo: "not play", post: "football yesterday.", ok: ["didn't play", "did not play"], why: "didn’t + verbo base" },
    { pre: "Tony", verbo: "not go", post: "to school on Sunday.", ok: ["didn't go", "did not go"], why: "didn’t + verbo base" },
    { pre: "She", verbo: "take", post: "a photo last week.", ok: ["took"], why: "irregolare: take → took" },
    { pre: "They", verbo: "work", post: "all morning.", ok: ["worked"], why: "regolare: work + ed" },
    { pre: "It", verbo: "be", post: "cold yesterday.", ok: ["was"], why: "it → was" },
    { pre: "My cousin", verbo: "study", post: "English in 2019.", ok: ["studied"], why: "consonante + y → ied" },
  ];
  const cLista = document.getElementById("completa-lista");
  const cInputs = [];
  if (cLista) {
    COMPLETA.forEach((it, k) => {
      const li = document.createElement("li");
      const id = "cmp-" + k;
      li.innerHTML =
        '<p class="frase"><label for="' + id + '"><span class="en">' + it.pre + " ____ " + it.post +
        '</span> <span class="verbo">(' + it.verbo + ")</span></label></p>" +
        '<div class="riga-input"><input type="text" id="' + id + '" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
        '<p class="esito"></p>';
      cLista.appendChild(li);
      cInputs.push([li.querySelector("input"), li.querySelector(".esito"), it]);
    });
    document.getElementById("completa-check").addEventListener("click", () => {
      let g = 0;
      cInputs.forEach(([inp, es, it]) => {
        const v = norm(inp.value);
        const ok = it.ok.some((a) => norm(a) === v);
        if (ok) g += 1;
        inp.classList.toggle("is-ok", ok);
        inp.classList.toggle("is-ko", !ok);
        es.textContent = v === "" ? "Scrivi il verbo." : ok ? "Giusto." : "Non ancora. Suggerimento: " + it.why.split(";")[0] + ".";
        es.className = "esito " + (ok ? "is-ok" : "is-ko");
      });
      document.getElementById("completa-punti").textContent = g + " giuste su " + COMPLETA.length + ".";
    });
    document.getElementById("completa-sol").addEventListener("click", () => {
      cInputs.forEach(([inp, es, it]) => {
        es.textContent = "Soluzione: " + it.ok[0].replace("'", "’") + " — " + it.why + ".";
        es.className = "esito";
      });
    });
  }

  /* ============ 4. Trova l'errore ============ */
  sceltaImmediata("errore-lista", "errore-punti", [
    { opts: ["I goed to the market.", "I went to the market."], ok: "I went to the market.", why: "go è irregolare: went." },
    { opts: ["She didn’t went home.", "She didn’t go home."], ok: "She didn’t go home.", why: "dopo didn’t il verbo è base." },
    { opts: ["Did you played football?", "Did you play football?"], ok: "Did you play football?", why: "dopo Did il verbo è base." },
    { opts: ["We was at school.", "We were at school."], ok: "We were at school.", why: "we → were." },
    { opts: ["He buyed a helmet.", "He bought a helmet."], ok: "He bought a helmet.", why: "buy è irregolare: bought." },
    { opts: ["I didn’t repaired the bike.", "I didn’t repair the bike."], ok: "I didn’t repair the bike.", why: "didn’t + verbo base." },
    { opts: ["Yesterday I am at home.", "Yesterday I was at home."], ok: "Yesterday I was at home.", why: "yesterday → was." },
    { opts: ["They studyed English.", "They studied English."], ok: "They studied English.", why: "study → studied (y → ied)." },
  ]);

  /* ============ 5. Lettura ============ */
  const btnVerbi = document.getElementById("mostra-verbi");
  if (btnVerbi) {
    btnVerbi.addEventListener("click", () => {
      const on = btnVerbi.getAttribute("aria-pressed") !== "true";
      btnVerbi.setAttribute("aria-pressed", String(on));
      btnVerbi.textContent = on ? "Togli i colori" : "Colora i verbi";
      document.querySelectorAll("#testo-tony [data-t]").forEach((el) => {
        el.classList.toggle(el.dataset.t === "s" ? "s-hl" : "c-hl", on);
      });
    });
  }
  sceltaImmediata("vf-lista", "vf-punti", [
    { q: "Tony was in the workshop on Saturday morning.", opts: ["True", "False"], ok: "True", why: "Tony was in the workshop all morning." },
    { q: "He repaired a motorbike.", opts: ["True", "False"], ok: "True", why: "He repaired an old motorbike." },
    { q: "He bought a new jacket.", opts: ["True", "False"], ok: "False", why: "He bought a new helmet." },
    { q: "He took a photo of an old motorbike.", opts: ["True", "False"], ok: "True", why: "He saw an old motorbike and took a photo." },
    { q: "He played football on Saturday.", opts: ["True", "False"], ok: "False", why: "He didn’t play football." },
    { q: "On Sunday he had lunch with his friends.", opts: ["True", "False"], ok: "False", why: "He had lunch with his family." },
  ]);

  /* ============ Prova finale (20 punti) ============ */
  const PROVA = [
    // A. Scegli
    { q: "Yesterday Marco ___ a motorbike.", opts: ["repaired", "repairs", "repair"], ok: "repaired", why: "yesterday → passato" },
    { q: "We ___ at the workshop two days ago.", opts: ["was", "were", "are"], ok: "were", why: "we → were" },
    { q: "Last week I ___ to the sea.", opts: ["went", "goed", "go"], ok: "went", why: "go → went" },
    { q: "She ___ a new helmet last Saturday.", opts: ["buyed", "bought", "buys"], ok: "bought", why: "buy → bought" },
    { q: "In 2020 they ___ English.", opts: ["study", "studied", "studyed"], ok: "studied", why: "study → studied" },
    { q: "Tony usually ___ the oil every Monday.", opts: ["checks", "checked", "check"], ok: "checks", why: "every Monday → presente; he → checks" },
    // B. Completa
    { q: "I ___ tired yesterday.", opts: ["was", "were", "am"], ok: "was", why: "I → was" },
    { q: "He didn’t ___ football.", opts: ["play", "played", "plays"], ok: "play", why: "didn’t + verbo base" },
    { q: "___ you watch the film last night?", opts: ["Did", "Do", "Were"], ok: "Did", why: "domanda al passato: Did" },
    { q: "They ___ a photo two days ago.", opts: ["took", "taked", "take"], ok: "took", why: "take → took" },
    { q: "We didn’t ___ home late.", opts: ["come", "came", "comes"], ok: "come", why: "didn’t + verbo base" },
    { q: "My brother ___ in Rome in 2019.", opts: ["was", "were", "is"], ok: "was", why: "he → was" },
    // C. Frase giusta
    { q: "Quale frase è giusta?", opts: ["He didn’t went home.", "He didn’t go home.", "He not go home."], ok: "He didn’t go home.", why: "didn’t + verbo base" },
    { q: "Quale frase è giusta?", opts: ["Did she played tennis?", "Did she play tennis?", "Do she play tennis?"], ok: "Did she play tennis?", why: "Did + verbo base" },
    { q: "Quale frase è giusta?", opts: ["I stoped the engine.", "I stopped the engine.", "I stoping the engine."], ok: "I stopped the engine.", why: "stop → stopped" },
    { q: "Quale frase è giusta?", opts: ["We was happy.", "We were happy.", "We weres happy."], ok: "We were happy.", why: "we → were" },
    // D. Trasforma
    { q: "I played football. → forma negativa (−)", opts: ["I didn’t play football.", "I didn’t played football.", "I not played football."], ok: "I didn’t play football.", why: "didn’t + verbo base" },
    { q: "You saw the film. → domanda (?)", opts: ["Did you see the film?", "Did you saw the film?", "Saw you the film?"], ok: "Did you see the film?", why: "Did + verbo base" },
    { q: "Anna was at home. → forma negativa (−)", opts: ["Anna wasn’t at home.", "Anna didn’t was at home.", "Anna weren’t at home."], ok: "Anna wasn’t at home.", why: "con be: wasn’t" },
    { q: "They bought a bike. → domanda (?)", opts: ["Did they buy a bike?", "Did they bought a bike?", "Were they buy a bike?"], ok: "Did they buy a bike?", why: "Did + verbo base" },
  ];
  const VOTI = [[20, 10], [18, 9], [16, 8], [14, 7], [12, 6], [10, 5], [8, 4], [0, 3]];
  const pLista = document.getElementById("prova-lista");
  const pVoto = document.getElementById("prova-voto");
  const pConsegna = document.getElementById("prova-consegna");
  const pRifai = document.getElementById("prova-rifai");
  let risposte = [];

  function costruisciProva() {
    if (!pLista) return;
    pLista.innerHTML = "";
    risposte = new Array(PROVA.length).fill(null);
    pVoto.hidden = true;
    pConsegna.hidden = false;
    pRifai.hidden = true;
    PROVA.forEach((it, k) => {
      const li = document.createElement("li");
      li.innerHTML = '<p class="frase"><span class="en">' + it.q + "</span></p>";
      const box = document.createElement("div");
      box.className = "opzioni";
      mescola(it.opts).forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.textContent = o;
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", () => {
          if (!pRifai.hidden) return;
          risposte[k] = o;
          Array.from(box.children).forEach((x) => {
            const sel = x === b;
            x.setAttribute("aria-pressed", String(sel));
            x.classList.toggle("btn-blu", sel);
          });
        });
        box.appendChild(b);
      });
      const es = document.createElement("p");
      es.className = "esito";
      li.appendChild(box);
      li.appendChild(es);
      pLista.appendChild(li);
    });
  }

  if (pConsegna) {
    pConsegna.addEventListener("click", () => {
      const mancano = risposte.filter((r) => r === null).length;
      if (mancano > 0 && !window.confirm("Mancano " + mancano + " risposte. Consegni lo stesso?")) return;
      let punti = 0;
      Array.from(pLista.children).forEach((li, k) => {
        const it = PROVA[k];
        const ok = risposte[k] === it.ok;
        if (ok) punti += 1;
        const box = li.querySelector(".opzioni");
        Array.from(box.children).forEach((x) => {
          x.classList.remove("btn-blu");
          if (x.textContent === it.ok) x.classList.add("is-ok");
          else if (x.textContent === risposte[k]) x.classList.add("is-ko");
        });
        const es = li.querySelector(".esito");
        es.textContent = ok ? "Giusto." : "Giusta: " + it.ok + " (" + it.why + ").";
        es.className = "esito " + (ok ? "is-ok" : "is-ko");
      });
      const voto = VOTI.find(([min]) => punti >= min)[1];
      pVoto.hidden = false;
      pVoto.textContent = "Punteggio: " + punti + " / 20 · Voto: " + voto + (punti >= 12 ? " · Bene!" : " · Ripassa lo Studio e rifai la prova.");
      pConsegna.hidden = true;
      pRifai.hidden = false;
      pVoto.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    pRifai.addEventListener("click", () => {
      costruisciProva();
      pLista.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    costruisciProva();
  }
})();

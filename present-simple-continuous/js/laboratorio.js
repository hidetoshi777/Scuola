(function () {
  const norm = window.normalizza;
  const mescola = window.mescola;

  /* ============ 1. Costruisci il verbo ============ */
  const SOGGETTI = [
    { id: "I", label: "I", tipo: "I" },
    { id: "you", label: "you", tipo: "plur" },
    { id: "he", label: "he (Salvo)", tipo: "3" },
    { id: "she", label: "she (Rita)", tipo: "3" },
    { id: "it", label: "it (the robot)", tipo: "3" },
    { id: "we", label: "we", tipo: "plur" },
    { id: "they", label: "they", tipo: "plur" },
  ];
  const VERBI = [
    ["work", "in the workshop"], ["check", "the tools"], ["repair", "the van"], ["clean", "the filters"],
    ["fix", "the pipe"], ["wash", "the car"], ["go", "to work"], ["do", "the job"],
    ["study", "English"], ["carry", "the toolbox"], ["play", "football"], ["have", "lunch"],
    ["make", "a noise"], ["use", "the drill"], ["change", "the oil"], ["drive", "the van"],
    ["stop", "the machine"], ["cut", "the cable"], ["weld", "the frame"], ["test", "the engine"],
  ];
  const RADDOPPIA = { stop: "stopping", cut: "cutting", run: "running", plan: "planning", sit: "sitting" };

  function terza(v) {
    if (v === "have") return ["has", "irregolare: have → has"];
    if (/(s|sh|ch|x|o)$/.test(v)) return [v + "es", "finisce in -" + v.match(/(sh|ch|s|x|o)$/)[1] + " → + es"];
    if (/[^aeiou]y$/.test(v)) return [v.slice(0, -1) + "ies", "consonante + y → ies"];
    return [v + "s", "he / she / it → + s"];
  }
  function ing(v) {
    if (RADDOPPIA[v]) return [RADDOPPIA[v], "verbo corto: raddoppia la consonante (" + v + " → " + RADDOPPIA[v] + ")"];
    if (/ie$/.test(v)) return [v.slice(0, -2) + "ying", "ie → ying"];
    if (/[^e]e$/.test(v)) return [v.slice(0, -1) + "ing", "finisce in -e: togli la e e aggiungi -ing"];
    return [v + "ing", "+ ing"];
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  const selS = document.getElementById("c-sogg");
  const selV = document.getElementById("c-verbo");
  const selF = document.getElementById("c-forma");
  const cOut = document.getElementById("c-out");
  const levaLab = Array.from(document.querySelectorAll("#costruisci .leva [data-modo]"));
  let modoLab = "sempre";

  if (selS && selV && selF && cOut) {
    SOGGETTI.forEach((s) => selS.add(new Option(s.label, s.id)));
    VERBI.forEach(([v]) => selV.add(new Option(v, v)));
    selS.value = "he";
    selV.value = "fix";

    const renderC = () => {
      const s = SOGGETTI.find((x) => x.id === selS.value);
      const [v, obj] = VERBI.find((x) => x[0] === selV.value);
      const f = selF.value;
      let frase = "";
      let regola = "";
      if (modoLab === "sempre") {
        const tempo = "every day";
        if (f === "+") {
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
          regola = aux + " + verbo base" + (s.tipo === "3" ? " (niente -s: la s è già in does)." : ".");
        } else {
          const aux = s.tipo === "3" ? "Does" : "Do";
          frase = "<mark class=\"s\">" + aux + "</mark> " + s.id + " <mark class=\"s\">" + v + "</mark> " + obj + " " + tempo + "?";
          regola = aux + " + soggetto + verbo base" + (s.tipo === "3" ? " (niente -s)." : ".");
        }
        regola = "SEMPRE → present simple. " + regola;
      } else {
        const tempo = "right now";
        const be = s.tipo === "I" ? "am" : s.tipo === "3" ? "is" : "are";
        const neg = s.tipo === "I" ? "’m not" : s.tipo === "3" ? " isn’t" : " aren’t";
        const contr = s.tipo === "I" ? "’m" : s.tipo === "3" ? "’s" : "’re";
        const [g, r] = ing(v);
        if (f === "+") {
          frase = cap(s.id) + " <mark class=\"c\">" + be + " " + g + "</mark> " + obj + " " + tempo + ".";
          regola = be + " + -ing (anche " + cap(s.id) + contr + " " + g + "). Spelling: " + r + ".";
        } else if (f === "-") {
          frase = cap(s.id) + "<mark class=\"c\">" + neg + " " + g + "</mark> " + obj + " " + tempo + ".";
          regola = be + " + not + -ing. Spelling: " + r + ".";
        } else {
          frase = "<mark class=\"c\">" + cap(be) + "</mark> " + s.id + " <mark class=\"c\">" + g + "</mark> " + obj + " " + tempo + "?";
          regola = cap(be) + " + soggetto + -ing. Spelling: " + r + ".";
        }
        regola = "ADESSO → present continuous. " + regola;
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
    { q: "Marco usually ___ the oil level every morning.", opts: ["checks", "is checking"], ok: "checks", why: "usually, every morning → abitudine." },
    { q: "Be quiet! The teacher ___ the new circuit.", opts: ["explains", "is explaining"], ok: "is explaining", why: "Be quiet! → succede adesso." },
    { q: "Water ___ at 100 °C.", opts: ["boils", "is boiling"], ok: "boils", why: "Fatto sempre vero → simple." },
    { q: "Look! The technician ___ the lift.", opts: ["repairs", "is repairing"], ok: "is repairing", why: "Look! → adesso." },
    { q: "I ___ this wiring diagram.", opts: ["don’t understand", "am not understanding"], ok: "don’t understand", why: "understand è un verbo di stato: niente -ing." },
    { q: "This week we ___ in the school workshop.", opts: ["work", "are working"], ok: "are working", why: "this week → periodo, cosa temporanea." },
    { q: "The bus to Catania ___ at 7:15 every day.", opts: ["leaves", "is leaving"], ok: "leaves", why: "Orario fisso → simple." },
    { q: "“What ___ at the moment?” – “I’m changing a tyre.”", opts: ["do you do", "are you doing"], ok: "are you doing", why: "at the moment → cosa stai facendo adesso." },
    { q: "My brother ___ a new motorbike.", opts: ["wants", "is wanting"], ok: "wants", why: "want è un verbo di stato." },
    { q: "Electricians always ___ safety gloves.", opts: ["wear", "are wearing"], ok: "wear", why: "always → abitudine." },
  ]);

  /* ============ 3. Completa ============ */
  const COMPLETA = [
    { pre: "Luca", verbo: "fix", post: "bikes in his free time.", ok: ["fixes"], why: "abitudine; fix → fixes" },
    { pre: "Right now, the mechanic", verbo: "change", post: "the brake pads.", ok: ["is changing", "'s changing"], why: "right now → is changing" },
    { pre: "Sorry, the drill", verbo: "not work", post: "at the moment.", ok: ["isn't working", "is not working", "'s not working"], why: "at the moment → isn’t working" },
    { pre: "Our English lesson", verbo: "start", post: "at 9 o’clock on Mondays.", ok: ["starts"], why: "orario fisso → starts" },
    { pre: "Listen! Somebody", verbo: "use", post: "the compressor.", ok: ["is using", "'s using"], why: "Listen! → is using (use → using)" },
    { pre: "Giulia", verbo: "study", post: "for her test this week.", ok: ["is studying", "'s studying"], why: "this week → is studying" },
    { pre: "My dad", verbo: "not drink", post: "coffee in the evening.", ok: ["doesn't drink", "does not drink"], why: "abitudine; negativa: doesn’t drink" },
    { pre: "A good technician", verbo: "know", post: "how to read a manual.", ok: ["knows"], why: "know è di stato → knows" },
    { pre: "The technician", verbo: "repair", post: "the boiler right now.", ok: ["is repairing", "'s repairing"], why: "right now → is repairing" },
    { pre: "She", verbo: "go", post: "to the gym twice a week.", ok: ["goes"], why: "twice a week → goes" },
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
    { opts: ["She work in a garage.", "She works in a garage."], ok: "She works in a garage.", why: "she → works, con la -s." },
    { opts: ["I’m knowing the answer.", "I know the answer."], ok: "I know the answer.", why: "know è di stato: niente -ing." },
    { opts: ["He doesn’t fixes computers.", "He doesn’t fix computers."], ok: "He doesn’t fix computers.", why: "dopo doesn’t il verbo è base." },
    { opts: ["Every Friday we are testing the fire alarm.", "Every Friday we test the fire alarm."], ok: "Every Friday we test the fire alarm.", why: "every Friday → abitudine, simple." },
    { opts: ["Paolo is studing for his exam.", "Paolo is studying for his exam."], ok: "Paolo is studying for his exam.", why: "study → studying (la y resta)." },
    { opts: ["Does your sister works on Saturdays?", "Does your sister work on Saturdays?"], ok: "Does your sister work on Saturdays?", why: "dopo does il verbo è base." },
    { opts: ["The boys is waiting for the bus.", "The boys are waiting for the bus."], ok: "The boys are waiting for the bus.", why: "the boys = they → are." },
    { opts: ["At the moment I write an e-mail.", "At the moment I’m writing an e-mail."], ok: "At the moment I’m writing an e-mail.", why: "at the moment → continuous; write → writing." },
  ]);

  /* ============ 5. Lettura ============ */
  const btnVerbi = document.getElementById("mostra-verbi");
  if (btnVerbi) {
    btnVerbi.addEventListener("click", () => {
      const on = btnVerbi.getAttribute("aria-pressed") !== "true";
      btnVerbi.setAttribute("aria-pressed", String(on));
      btnVerbi.textContent = on ? "Togli i colori" : "Colora i verbi";
      document.querySelectorAll("#testo-salvo [data-t]").forEach((el) => {
        el.classList.toggle(el.dataset.t === "s" ? "s-hl" : "c-hl", on);
      });
    });
  }
  sceltaImmediata("vf-lista", "vf-punti", [
    { q: "Salvo lives in Taormina.", opts: ["True", "False"], ok: "False", why: "He lives in Acireale. A Taormina lavora solo questa settimana." },
    { q: "He usually starts work at 8 o’clock.", opts: ["True", "False"], ok: "True", why: "He usually starts work at 8 o’clock." },
    { q: "He works every Saturday.", opts: ["True", "False"], ok: "False", why: "He doesn’t work at the weekend." },
    { q: "This week he is visiting customers.", opts: ["True", "False"], ok: "False", why: "He isn’t visiting customers: he is working in a hotel." },
    { q: "Right now he is cleaning the filters.", opts: ["True", "False"], ok: "True", why: "Right now he is cleaning the filters." },
    { q: "Rita is repairing the van.", opts: ["True", "False"], ok: "False", why: "Rita is testing the gas pressure." },
  ]);

  /* ============ Prova finale (20 punti) ============ */
  const PROVA = [
    // A. Choose
    { q: "My cousin ___ in a factory in Catania. He likes his job.", opts: ["works", "is working"], ok: "works", why: "lavoro stabile → simple" },
    { q: "Shh! The boss ___ on the phone.", opts: ["talks", "is talking"], ok: "is talking", why: "Shh! → adesso" },
    { q: "I ___ a screwdriver, please.", opts: ["need", "am needing"], ok: "need", why: "need è di stato" },
    { q: "Trains to Messina ___ every hour.", opts: ["leave", "are leaving"], ok: "leave", why: "orario → simple" },
    { q: "Today Marco ___ his work overalls.", opts: ["doesn’t wear", "isn’t wearing"], ok: "isn’t wearing", why: "today → adesso, oggi" },
    { q: "How often ___ your tools?", opts: ["do you clean", "are you cleaning"], ok: "do you clean", why: "how often → abitudine" },
    // B. Complete
    { q: "The technician ___ the boiler right now.", opts: ["repairs", "is repairing"], ok: "is repairing", why: "right now → continuous" },
    { q: "She ___ to the gym twice a week.", opts: ["goes", "is going", "go"], ok: "goes", why: "twice a week → simple; go → goes" },
    { q: "___ your father ___ a truck for work?", opts: ["Does … drive", "Does … drives", "Is … drive"], ok: "Does … drive", why: "domanda del simple: Does + verbo base" },
    { q: "We ___ lunch at school on Fridays.", opts: ["don’t have", "doesn’t have", "aren’t have"], ok: "don’t have", why: "on Fridays → simple; we → don’t" },
    { q: "Look! Those men ___ the electricity pole.", opts: ["climb", "are climbing", "is climbing"], ok: "are climbing", why: "Look! → adesso; those men → are" },
    { q: "Metal ___ when it gets hot.", opts: ["expands", "is expanding"], ok: "expands", why: "fatto sempre vero → simple" },
    // C. Correct sentence
    { q: "Quale frase è giusta?", opts: ["He always forget his keys.", "He always forgets his keys.", "He always forgetting his keys."], ok: "He always forgets his keys.", why: "he → forgets" },
    { q: "Quale frase è giusta?", opts: ["I’m not believing you.", "I don’t believe you.", "I not believe you."], ok: "I don’t believe you.", why: "believe è di stato" },
    { q: "Quale frase è giusta?", opts: ["What does Sara doing now?", "What is Sara doing now?", "What Sara is doing now?"], ok: "What is Sara doing now?", why: "now → is + doing" },
    { q: "Quale frase è giusta?", opts: ["They are stoping the machine.", "They are stopping the machine.", "They stopping the machine."], ok: "They are stopping the machine.", why: "stop → stopping" },
    // D. Transform
    { q: "The robot moves the boxes. → forma negativa (−)", opts: ["The robot doesn’t move the boxes.", "The robot doesn’t moves the boxes.", "The robot isn’t move the boxes."], ok: "The robot doesn’t move the boxes.", why: "doesn’t + verbo base" },
    { q: "You are listening to me. → domanda (?)", opts: ["Do you listening to me?", "Are you listening to me?", "You are listening to me?"], ok: "Are you listening to me?", why: "Are + soggetto + -ing" },
    { q: "Mario fixes the lights. → domanda (?)", opts: ["Does Mario fix the lights?", "Does Mario fixes the lights?", "Is Mario fix the lights?"], ok: "Does Mario fix the lights?", why: "Does + verbo base" },
    { q: "I am using the drill. → forma negativa (−)", opts: ["I don’t using the drill.", "I’m not using the drill.", "I not am using the drill."], ok: "I’m not using the drill.", why: "am + not + -ing" },
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

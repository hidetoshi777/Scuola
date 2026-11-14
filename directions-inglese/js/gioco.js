/* Gioco: tre livelli sulla mappa di Greenford.
   1 Trova il posto (ascolta la parola, tocca l'edificio: nomi nascosti)
   2 Segui la strada (il passante dà le indicazioni, tu guidi l'omino)
   3 Aiuta il turista (componi tu le indicazioni, l'omino le esegue) */
(function () {
  const $ = (id) => document.getElementById(id);
  const F = window.FRASI;
  const C = window.CITTA;
  const V = window.Voce;

  const mappa = C.crea($("mappa"), { nomi: true, aiuto: true, onPosto: (id) => toccaPosto(id) });

  const MOSSA = {
    F: { en: "Go straight on", it: "vai dritto", clip: "c_straight" },
    L: { en: "Turn left", it: "gira a sinistra", clip: "c_left" },
    R: { en: "Turn right", it: "gira a destra", clip: "c_right" },
  };
  const LATO = {
    left: { en: "It’s on the left", it: "è a sinistra", clip: "c_onleft" },
    right: { en: "It’s on the right", it: "è a destra", clip: "c_onright" },
  };
  const SPIEGA = {
    1: "Senti la domanda e tocca il posto giusto sulla mappa. I nomi sono nascosti: guarda le icone.",
    2: "Chiedi la strada e ascolta la risposta. Poi guida l’omino con le frecce, un incrocio alla volta.",
    3: "Un turista ti chiede la strada. Componi le indicazioni con le frecce e premi «Go!»: l’omino le segue.",
  };

  let livello = 1;
  let turni = [], n = 0, punti = 0;
  let occupato = false;
  /* stato del turno */
  let T = null;

  const msg = (testo, tipo) => { const m = $("msg"); m.textContent = testo; m.className = "messaggio" + (tipo ? " " + tipo : ""); };
  const posto = (id) => window.POSTO(id);

  function nuvola(tipo, chi, key, extraIt) {
    const f = F[key];
    return `<div class="nuvola ${tipo}"><button type="button" class="voce" data-voce="${key}" aria-label="Ascolta"></button><p><span class="chi">${chi}</span><span class="en">${f.en}</span><span class="traduzione"${$("btn-it").getAttribute("aria-pressed") === "true" || extraIt ? "" : " hidden"}><br>${f.it}</span></p></div>`;
  }

  function mostraPad(cosa) {
    $("pad").hidden = cosa.nessuno === true;
    $("riga-mosse").hidden = !cosa.mosse;
    $("riga-lati").hidden = !cosa.lati;
    $("riga-prog").hidden = !cosa.prog;
    $("riga-next").hidden = !cosa.next;
    $("programma").hidden = !cosa.programma;
  }
  function abilita(sel, v) { document.querySelectorAll(sel).forEach((b) => { b.disabled = !v; }); }

  /* ---------------- avvio livello ---------------- */
  function avvia(liv) {
    livello = liv;
    document.querySelectorAll("[data-livello]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.livello === liv)));
    $("spiega-livello").textContent = SPIEGA[liv];
    $("fine").hidden = true;
    $("campo").hidden = false;
    punti = 0; n = 0;
    const ids = Object.keys(C.POSTI_MAPPA);
    if (liv === 1) turni = window.mescola(ids).slice(0, 8);
    else if (liv === 2) {
      const per = (k) => window.mescola(C.PUZZLE.filter((p) => p.liv === k)).slice(0, 2);
      turni = [...per(1), ...per(2), ...per(3)];
    } else turni = window.mescola(ids.filter((id) => id !== "cafe" && id !== "hotel")).slice(0, 5);
    $("hud-tot").textContent = turni.length;
    mappa.nomi(liv !== 1);
    mappa.svg.querySelectorAll(".posto").forEach((g) => g.classList.remove("trovato"));
    turno();
  }

  function aggiornaHud() {
    $("hud-n").textContent = Math.min(n + 1, turni.length);
    $("hud-punti").textContent = punti;
  }

  function turno() {
    V.stop();
    occupato = false;
    if (n >= turni.length) { fine(); return; }
    aggiornaHud();
    mappa.reset();
    if (livello === 1) {
      mappa.svg.querySelectorAll(".posto").forEach((g) => { if (turni.slice(0, n).includes(g.dataset.posto)) g.classList.add("trovato"); });
    }
    const t = turni[n];
    if (livello === 1) {
      T = { id: t, errori: 0 };
      $("dialogo").innerHTML = nuvola("turista", "Turista", "q_" + t);
      mostraPad({ nessuno: true });
      msg("Tocca il posto sulla mappa.");
      T.audio = ["q_" + t];
    } else if (livello === 2) {
      T = { id: t.id, mosse: t.mosse, lato: t.lato, k: 0, errori: 0, fase: "mosse" };
      $("dialogo").innerHTML = nuvola("turista", "Tu", "q_" + t.id) + nuvola("passante", "Passante", "a_" + t.id);
      mostraPad({ mosse: true, lati: true });
      abilita("#riga-mosse button", true);
      abilita("#riga-lati button", false);
      msg("Ascolta e guida l’omino. Primo incrocio: cosa fai?");
      T.audio = ["q_" + t.id, "a_" + t.id];
    } else {
      T = { id: t, prog: [], tentativi: 0 };
      $("dialogo").innerHTML = nuvola("turista", "Turista", "q_" + t);
      mostraPad({ mosse: true, lati: true, prog: true, programma: true });
      disegnaProgramma();
      msg("Componi la strada: frecce in ordine, poi «on the left» o «on the right».");
      T.audio = ["q_" + t];
    }
    V.sequenza(T.audio, 300);
  }

  /* ---------------- livello 1 ---------------- */
  function toccaPosto(id) {
    if (livello !== 1 || !T || occupato) return;
    const p = posto(id);
    if (id === T.id) {
      occupato = true;
      mappa.evidenzia(id, "trovato");
      const guadagno = Math.max(2, 10 - 3 * T.errori);
      punti += T.errori >= 3 ? 0 : guadagno;
      aggiornaHud();
      msg(`✓ Yes! The ${p.en} = ${p.it}.`, "ok");
      V.play("w_" + id).then(() => setTimeout(() => { n += 1; turno(); }, 700));
      return;
    }
    T.errori += 1;
    const g = mappa.evidenzia(id, "sbagliato");
    setTimeout(() => g && g.classList.remove("sbagliato"), 1500);
    if (T.errori >= 3) {
      const q = posto(T.id);
      msg(`✗ This is the ${p.en} (${p.it}). The ${q.en} è quello che lampeggia.`, "ko");
      mappa.evidenzia(T.id, "lampeggia");
    } else {
      msg(`✗ No, this is the ${p.en} (${p.it}). Riprova!`, "ko");
    }
    V.play("w_" + id);
  }

  /* ---------------- livello 2 ---------------- */
  async function mossaGuidata(m) {
    if (occupato || T.fase !== "mosse") return;
    const attesa = T.mosse[T.k];
    occupato = true;
    if (m === attesa) {
      await mappa.muovi(m);
      T.k += 1;
      if (T.k >= T.mosse.length) {
        T.fase = "lato";
        abilita("#riga-mosse button", false);
        abilita("#riga-lati button", true);
        msg(`Sei arrivato! The ${posto(T.id).en}: is it on the left or on the right?`);
      } else {
        msg(`✓ ${MOSSA[m].en}. E adesso?`, "ok");
      }
    } else {
      T.errori += 1;
      const possibile = C.passo(mappa.stato, m);
      if (!possibile) {
        await mappa.trema();
        msg(`✗ Qui non si può: ${m === "F" ? "davanti non c’è strada" : m === "L" ? "a sinistra non c’è strada" : "a destra non c’è strada"}. Riascolta.`, "ko");
      } else {
        await mappa.trema();
        msg("✗ No, non è questa la strada. Riascolta le indicazioni.", "ko");
      }
      if (T.errori >= 2) mostraTraduzione(true);
      if (T.errori >= 3) msg(`Aiuto: adesso devi fare «${MOSSA[attesa].en}» (${MOSSA[attesa].it}).`, "ko");
    }
    occupato = false;
  }

  async function latoGuidato(lato) {
    if (occupato || T.fase !== "lato") return;
    occupato = true;
    if (lato === T.lato) {
      T.fase = "fatto";
      abilita("#riga-lati button", false);
      mappa.evidenzia(T.id, "giusto");
      const guadagno = Math.max(2, 10 - 2 * T.errori);
      punti += guadagno;
      aggiornaHud();
      msg(`✓ Yes! The ${posto(T.id).en} is on your ${lato}. +${guadagno}`, "ok");
      await V.sequenza(["t_thanks", "l_welcome"], 200);
      mostraPad({ next: true });
    } else {
      T.errori += 1;
      await mappa.trema();
      const altro = mappa.postoAlLato(lato);
      msg(`✗ No: ${altro ? `on the ${lato} c’è the ${posto(altro).en}` : "lì non c’è niente"}. Guarda i cartellini left / right dell’omino.`, "ko");
    }
    occupato = false;
  }

  /* ---------------- livello 3 ---------------- */
  function disegnaProgramma(attivo) {
    const box = $("programma");
    if (!T.prog.length) {
      box.innerHTML = '<span class="vuoto">Le tue indicazioni: tocca le frecce qui sotto.</span>';
    } else {
      box.innerHTML = T.prog.map((x, i) => {
        const d = MOSSA[x] || LATO[x];
        return `<span class="chip ${x}${attivo === i ? " attivo" : ""}">${d.en}</span>`;
      }).join("");
    }
    const ultimo = T.prog[T.prog.length - 1];
    const chiuso = ultimo === "left" || ultimo === "right";
    const mosse = T.prog.filter((x) => MOSSA[x]).length;
    abilita("#riga-mosse button", !chiuso && T.prog.length < 7 && !occupato);
    abilita("#riga-lati button", !chiuso && mosse > 0 && !occupato);
    $("btn-vai").disabled = !chiuso || occupato;
    $("btn-cancella").disabled = !T.prog.length || occupato;
  }

  function aggiungi(x) {
    if (occupato) return;
    T.prog.push(x);
    V.play((MOSSA[x] || LATO[x]).clip);
    disegnaProgramma();
  }

  async function esegui() {
    if (occupato) return;
    occupato = true;
    disegnaProgramma();
    mappa.reset();
    $("mappa").scrollIntoView({ block: "nearest", behavior: "smooth" });
    const mosse = T.prog.filter((x) => MOSSA[x]);
    const lato = T.prog[T.prog.length - 1];
    for (let i = 0; i < mosse.length; i += 1) {
      disegnaProgramma(i);
      await V.play(MOSSA[mosse[i]].clip);
      const r = await mappa.muovi(mosse[i]);
      if (!r.ok) {
        T.tentativi += 1;
        await V.play("t_noroad");
        msg(`✗ «${MOSSA[mosse[i]].en}»: qui non c’è una strada! Correggi le indicazioni e riprova.`, "ko");
        await attendi(800);
        mappa.reset();
        occupato = false;
        aiutoSeServe();
        disegnaProgramma();
        return;
      }
    }
    disegnaProgramma(T.prog.length - 1);
    await V.play(LATO[lato].clip);
    const trovato = mappa.postoAlLato(lato);
    if (trovato === T.id) {
      mappa.evidenzia(T.id, "giusto");
      const guadagno = T.tentativi === 0 ? 10 : T.tentativi === 1 ? 6 : 3;
      punti += guadagno;
      aggiornaHud();
      msg(`✓ The tourist is at the ${posto(T.id).en}! +${guadagno}`, "ok");
      await V.sequenza(["t_thanks2", "l_welcome"], 200);
      occupato = false;
      mostraPad({ next: true, programma: true });
      return;
    }
    T.tentativi += 1;
    if (trovato) mappa.evidenzia(trovato, "sbagliato");
    await V.play("t_wrong");
    msg(`✗ Lì c’è ${trovato ? `the ${posto(trovato).en} (${posto(trovato).it})` : "solo un prato"}, non the ${posto(T.id).en}. Correggi e riprova.`, "ko");
    await attendi(900);
    if (trovato) mappa.togli(trovato, "sbagliato");
    mappa.reset();
    occupato = false;
    aiutoSeServe();
    disegnaProgramma();
  }

  function aiutoSeServe() {
    if (T.tentativi < 2) return;
    const s = C.percorsoMinimo(T.id);
    if (!s) return;
    const parole = [...s.mosse].map((m) => MOSSA[m].en).join(", ") + ". " + LATO[s.lato].en + ".";
    msg(`Un aiuto: ${parole}`, "ko");
  }

  /* ---------------- fine round ---------------- */
  function fine() {
    V.stop();
    const max = turni.length * 10;
    const pct = punti / max;
    $("campo").hidden = true;
    $("fine").hidden = false;
    $("stelle").textContent = pct >= 0.85 ? "★★★" : pct >= 0.6 ? "★★☆" : "★☆☆";
    $("fine-titolo").textContent = pct >= 0.6 ? "Well done!" : "Good try!";
    $("fine-testo").textContent = `Hai fatto ${punti} punti su ${max}.` + (livello < 3 ? " Prova il livello successivo!" : " Sai dare le indicazioni in inglese!");
    $("btn-livello-dopo").hidden = livello === 3;
    $("fine").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function mostraTraduzione(v) {
    $("btn-it").setAttribute("aria-pressed", String(v));
    document.querySelectorAll("#dialogo .traduzione").forEach((t) => { t.hidden = !v; });
  }

  /* ---------------- comandi ---------------- */
  document.querySelectorAll("[data-livello]").forEach((b) => b.addEventListener("click", () => avvia(+b.dataset.livello)));
  document.querySelectorAll("[data-mossa]").forEach((b) => b.addEventListener("click", () => {
    if (livello === 2) mossaGuidata(b.dataset.mossa);
    else if (livello === 3) aggiungi(b.dataset.mossa);
  }));
  document.querySelectorAll("[data-lato]").forEach((b) => b.addEventListener("click", () => {
    if (livello === 2) latoGuidato(b.dataset.lato);
    else if (livello === 3) aggiungi(b.dataset.lato);
  }));
  $("btn-cancella").addEventListener("click", () => { if (!occupato) { T.prog.pop(); disegnaProgramma(); } });
  $("btn-vai").addEventListener("click", esegui);
  $("btn-next").addEventListener("click", () => { n += 1; turno(); });
  $("btn-ascolta").addEventListener("click", () => { if (T) V.sequenza(T.audio, 300); });
  $("btn-lento").addEventListener("click", (e) => {
    V.lento = !V.lento;
    e.currentTarget.setAttribute("aria-pressed", String(V.lento));
    if (T) V.sequenza(T.audio, 300);
  });
  $("btn-it").addEventListener("click", (e) => mostraTraduzione(e.currentTarget.getAttribute("aria-pressed") !== "true"));
  $("btn-aiuto").addEventListener("click", (e) => {
    const v = e.currentTarget.getAttribute("aria-pressed") !== "true";
    e.currentTarget.setAttribute("aria-pressed", String(v));
    mappa.aiuto(v);
  });
  $("btn-ancora").addEventListener("click", () => avvia(livello));
  $("btn-livello-dopo").addEventListener("click", () => avvia(Math.min(3, livello + 1)));

  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    const k = { ArrowUp: "F", ArrowLeft: "L", ArrowRight: "R" }[e.key];
    if (!k || livello === 1 || !T) return;
    e.preventDefault();
    if (livello === 2) {
      if (T.fase === "lato") { if (k !== "F") latoGuidato(k === "L" ? "left" : "right"); }
      else mossaGuidata(k);
    } else if (!$("riga-mosse").querySelector("button").disabled) aggiungi(k);
  });

  avvia(1);
})();

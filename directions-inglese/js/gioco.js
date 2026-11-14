/* Gioco: quattro livelli sulla mappa di Greenford, dal più facile.
   1 Le parole    — senti «where is the bank?» e tocchi l'edificio (nomi nascosti)
   2 Dove arrivi? — senti la strada (senza il nome del posto) e tocchi dove arrivi; poi l'omino cammina
   3 Guida l'omino — senti la strada e guidi l'omino con le frecce, un incrocio alla volta
   4 Sfida        — un turista chiede: componi tu la strada con le frecce, l'omino la segue */
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
  const SPIEGA = {
    1: "Ascolta la domanda. Tocca il posto giusto sulla mappa.",
    2: "Ascolta la strada. Dove arrivi? Tocca il posto. Parti sempre dalla stazione, in basso.",
    3: "Ascolta la strada. Guida l’omino con le frecce, un incrocio alla volta.",
    4: "Un turista ti chiede la strada. Metti in fila le frecce e premi «Go!».",
  };
  const NTURNI = { 1: 8, 2: 6, 3: 6, 4: 5 };

  let livello = 1;
  let turni = [], n = 0, punti = 0;
  let occupato = false;
  let T = null;
  /* cambia a ogni livello/turno: le azioni in sospeso di prima si annullano */
  let gen = 0;

  const msg = (testo, tipo) => { const m = $("msg"); m.textContent = testo; m.className = "messaggio" + (tipo ? " " + tipo : ""); };
  const posto = (id) => window.POSTO(id);
  const puzzle = (id) => C.PUZZLE.find((p) => p.id === id);

  function nuvola(tipo, chi, key) {
    const f = F[key];
    const it = $("btn-it").getAttribute("aria-pressed") === "true";
    return `<div class="nuvola ${tipo}"><button type="button" class="voce" data-voce="${key}" aria-label="Ascolta"></button><p><span class="chi">${chi}</span><span class="en">${f.en}</span><span class="traduzione"${it ? "" : " hidden"}><br>${f.it}</span></p></div>`;
  }

  function mostraPad(cosa) {
    $("pannello-giu").hidden = !cosa.mosse && !cosa.next;
    $("riga-mosse").hidden = !cosa.mosse;
    $("riga-prog").hidden = !cosa.prog;
    $("riga-next").hidden = !cosa.next;
    $("programma").hidden = !cosa.programma;
  }
  function abilita(sel, v) { document.querySelectorAll(sel).forEach((b) => { b.disabled = !v; }); }

  /* ---------------- avvio livello ---------------- */
  function avvia(liv) {
    gen += 1;
    livello = liv;
    document.querySelectorAll("[data-livello]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.livello === liv)));
    $("spiega-livello").textContent = SPIEGA[liv];
    $("fine").hidden = true;
    $("campo").hidden = false;
    punti = 0; n = 0;
    const ids = Object.keys(C.POSTI_MAPPA);
    if (liv === 1) turni = window.mescola(ids);
    else if (liv === 4) turni = window.mescola(ids.filter((id) => id !== "cafe" && id !== "hotel"));
    else {
      /* prima i percorsi corti, poi i lunghi */
      const per = (k) => window.mescola(C.PUZZLE.filter((p) => p.liv === k).map((p) => p.id));
      turni = [...per(1).slice(0, 2), ...per(2).slice(0, 2), ...per(3).slice(0, 2)];
    }
    turni = turni.slice(0, NTURNI[liv]);
    $("hud-tot").textContent = turni.length;
    mappa.nomi(liv !== 1);
    mappa.aiuto(liv >= 3 && $("btn-aiuto").getAttribute("aria-pressed") === "true");
    $("btn-aiuto").hidden = liv < 3;
    turno();
  }

  function aggiornaHud() {
    $("hud-n").textContent = Math.min(n + 1, turni.length);
    $("hud-punti").textContent = punti;
  }

  function turno() {
    gen += 1;
    V.stop();
    occupato = false;
    if (n >= turni.length) { fine(); return; }
    aggiornaHud();
    mappa.reset();
    const id = turni[n];
    T = { id, errori: 0, k: 0, prog: [], mosse: (puzzle(id) || {}).mosse };
    if (livello === 1) {
      mappa.svg.querySelectorAll(".posto").forEach((g) => { if (turni.slice(0, n).includes(g.dataset.posto)) g.classList.add("trovato"); });
      $("dialogo").innerHTML = nuvola("turista", "Turista", "q_" + id);
      mostraPad({});
      msg("Tocca il posto sulla mappa.");
      T.audio = ["q_" + id];
    } else if (livello === 2) {
      $("dialogo").innerHTML = nuvola("passante", "Passante", "a_" + id);
      mostraPad({});
      msg("Dove arrivi? Tocca il posto.");
      T.audio = ["a_" + id];
    } else if (livello === 3) {
      $("dialogo").innerHTML = nuvola("turista", "Tu", "q_" + id) + nuvola("passante", "Passante", "a_" + id);
      mostraPad({ mosse: true });
      abilita("#riga-mosse button", true);
      msg("Guida l’omino. Primo incrocio: cosa fai?");
      T.audio = ["q_" + id, "a_" + id];
    } else {
      $("dialogo").innerHTML = nuvola("turista", "Turista", "q_" + id);
      mappa.evidenzia(id, "meta");
      mostraPad({ mosse: true, prog: true, programma: true });
      disegnaProgramma();
      msg(`Porta il turista al posto giallo: the ${posto(id).en}.`);
      T.audio = ["q_" + id];
    }
    V.sequenza(T.audio, 300);
  }

  async function arrivato(guadagno, clipGrazie) {
    mappa.evidenzia(T.id, "giusto");
    punti += guadagno;
    aggiornaHud();
    await V.sequenza([clipGrazie || "t_thanks", "l_welcome"], 200);
  }

  /* ---------------- livelli 1 e 2: tocca il posto ---------------- */
  async function toccaPosto(id) {
    if ((livello !== 1 && livello !== 2) || !T || occupato) return;
    const p = posto(id);
    const g = gen;
    if (id === T.id) {
      occupato = true;
      if (livello === 1) {
        mappa.evidenzia(id, "trovato");
        punti += T.errori >= 3 ? 0 : Math.max(2, 10 - 3 * T.errori);
        aggiornaHud();
        msg(`✓ Yes! The ${p.en} = ${p.it}.`, "ok");
        await V.play("w_" + id);
        setTimeout(() => { if (g === gen) { n += 1; turno(); } }, 600);
        return;
      }
      msg(`✓ Yes! The ${p.en}. Guarda l’omino…`, "ok");
      mappa.evidenzia(id, "meta");
      for (const m of T.mosse) { await mappa.muovi(m); if (g !== gen) return; }
      mappa.togli(id, "meta");
      await arrivato(Math.max(2, 10 - 3 * T.errori));
      msg(`✓ The ${p.en} (${p.it})! +${Math.max(2, 10 - 3 * T.errori)}`, "ok");
      mostraPad({ next: true });
      occupato = false;
      return;
    }
    T.errori += 1;
    const sb = mappa.evidenzia(id, "sbagliato");
    setTimeout(() => sb && sb.classList.remove("sbagliato"), 1500);
    V.play("w_" + id);
    if (livello === 1) {
      if (T.errori >= 3) {
        msg(`✗ This is the ${p.en} (${p.it}). Il posto giusto lampeggia.`, "ko");
        mappa.evidenzia(T.id, "lampeggia");
      } else msg(`✗ No, this is the ${p.en} (${p.it}). Riprova!`, "ko");
      return;
    }
    if (T.errori === 2) {
      occupato = true;
      msg(`✗ No, this is the ${p.en}. Aiuto: guarda dove va l’omino.`, "ko");
      mostraTraduzione(true);
      for (const m of T.mosse) { await mappa.muovi(m); if (g !== gen) return; }
      msg("Adesso tocca il posto (guarda anche «opposite»).");
      occupato = false;
    } else {
      msg(`✗ No, this is the ${p.en} (${p.it}). Riascolta e riprova!`, "ko");
    }
  }

  /* ---------------- livello 3: guida l'omino ---------------- */
  async function mossaGuidata(m) {
    if (occupato || !T.mosse || T.k >= T.mosse.length) return;
    const attesa = T.mosse[T.k];
    const g = gen;
    occupato = true;
    if (m === attesa) {
      await mappa.muovi(m);
      if (g !== gen) return;
      T.k += 1;
      if (T.k >= T.mosse.length) {
        abilita("#riga-mosse button", false);
        const guadagno = Math.max(2, 10 - 2 * T.errori);
        msg(`✓ Here it is: the ${posto(T.id).en}! +${guadagno}`, "ok");
        await arrivato(guadagno);
        mostraPad({ next: true });
      } else {
        msg(`✓ ${MOSSA[m].en}. E adesso?`, "ok");
      }
    } else {
      T.errori += 1;
      await mappa.trema();
      if (!C.passo(mappa.stato, m)) msg("✗ Lì non c’è una strada. Riascolta.", "ko");
      else msg("✗ No, non è questa la strada. Riascolta.", "ko");
      if (T.errori >= 2) mostraTraduzione(true);
      if (T.errori >= 3) msg(`Aiuto: adesso «${MOSSA[attesa].en}» (${MOSSA[attesa].it}).`, "ko");
    }
    occupato = false;
  }

  /* ---------------- livello 4: componi la strada ---------------- */
  function disegnaProgramma(attivo) {
    const box = $("programma");
    box.innerHTML = T.prog.length
      ? T.prog.map((x, i) => `<span class="chip ${x}${attivo === i ? " attivo" : ""}">${MOSSA[x].en}</span>`).join("")
      : '<span class="vuoto">La tua strada: tocca le frecce qui sotto.</span>';
    abilita("#riga-mosse button", T.prog.length < 6 && !occupato);
    $("btn-vai").disabled = !T.prog.length || occupato;
    $("btn-cancella").disabled = !T.prog.length || occupato;
  }

  function aggiungi(x) {
    if (occupato) return;
    T.prog.push(x);
    V.play(MOSSA[x].clip);
    disegnaProgramma();
  }

  async function esegui() {
    if (occupato || !T.prog.length) return;
    occupato = true;
    disegnaProgramma();
    mappa.reset();
    mappa.evidenzia(T.id, "meta");
    $("mappa").scrollIntoView({ block: "nearest", behavior: "smooth" });
    const g = gen;
    for (let i = 0; i < T.prog.length; i += 1) {
      disegnaProgramma(i);
      await V.play(MOSSA[T.prog[i]].clip);
      if (g !== gen) return;
      const r = await mappa.muovi(T.prog[i]);
      if (g !== gen) return;
      if (!r.ok) {
        T.errori += 1;
        await V.play("t_noroad");
        msg(`✗ «${MOSSA[T.prog[i]].en}»: lì non c’è una strada! Cambia le frecce e riprova.`, "ko");
        await attendi(700);
        return riprova();
      }
    }
    const lato = mappa.postoAlLato("left") === T.id ? "left" : mappa.postoAlLato("right") === T.id ? "right" : null;
    if (lato) {
      mappa.togli(T.id, "meta");
      await V.play(lato === "left" ? "c_onleft" : "c_onright");
      const guadagno = T.errori === 0 ? 10 : T.errori === 1 ? 6 : 3;
      msg(`✓ The tourist is at the ${posto(T.id).en}! It’s on the ${lato}. +${guadagno}`, "ok");
      await arrivato(guadagno, "t_thanks2");
      occupato = false;
      mostraPad({ next: true, programma: true });
      return;
    }
    T.errori += 1;
    await V.play("t_wrong");
    msg(`✗ Il turista non è arrivato al posto giallo. Cambia le frecce e riprova.`, "ko");
    await attendi(800);
    riprova();
  }

  function riprova() {
    mappa.reset();
    mappa.evidenzia(T.id, "meta");
    occupato = false;
    if (T.errori >= 2) {
      const s = C.percorsoMinimo(T.id);
      if (s) msg("Un aiuto: " + [...s.mosse].map((m) => MOSSA[m].en).join(", ") + ".", "ko");
    }
    disegnaProgramma();
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
    $("fine-testo").textContent = `Hai fatto ${punti} punti su ${max}.` + (livello < 4 ? " Prova il livello dopo!" : " Sai dare la strada in inglese!");
    $("btn-livello-dopo").hidden = livello === 4;
    $("fine").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function mostraTraduzione(v) {
    $("btn-it").setAttribute("aria-pressed", String(v));
    document.querySelectorAll("#dialogo .traduzione").forEach((t) => { t.hidden = !v; });
  }

  /* ---------------- comandi ---------------- */
  document.querySelectorAll("[data-livello]").forEach((b) => b.addEventListener("click", () => avvia(+b.dataset.livello)));
  document.querySelectorAll("[data-mossa]").forEach((b) => b.addEventListener("click", () => {
    if (livello === 3) mossaGuidata(b.dataset.mossa);
    else if (livello === 4) aggiungi(b.dataset.mossa);
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
  $("btn-livello-dopo").addEventListener("click", () => avvia(Math.min(4, livello + 1)));

  document.addEventListener("keydown", (e) => {
    const k = { ArrowUp: "F", ArrowLeft: "L", ArrowRight: "R" }[e.key];
    if (!k || livello < 3 || !T) return;
    e.preventDefault();
    if (livello === 3) mossaGuidata(k);
    else if (!$("riga-mosse").querySelector("button").disabled) aggiungi(k);
  });

  avvia(1);
})();

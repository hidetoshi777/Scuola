document.addEventListener("DOMContentLoaded", () => {
  const area = document.getElementById("lab-area");
  const feedback = document.getElementById("lab-feedback");
  const puntiEl = document.getElementById("lab-punteggio");
  const totaleEl = document.getElementById("lab-totale");
  const serieEl = document.getElementById("lab-serie");
  const barra = document.getElementById("lab-barra");
  const modeBar = document.getElementById("mode-bar");
  const ricomincia = document.getElementById("lab-reset");

  if (!area || !window.Grammatica) {
    return;
  }

  const G = window.Grammatica;

  const modalita = {
    smistamento: { nome: "Smistamento", avvia: avviaSmistamento },
    cloze: { nome: "Completa la frase", avvia: avviaCloze },
    intruso: { nome: "Trova l’intruso", avvia: avviaIntruso },
    analisi: { nome: "Analizza la frase", avvia: avviaAnalisi },
  };

  let punti = 0;
  let totale = 0;
  let serie = 0;
  let serieMax = 0;
  let indice = 0;
  // Riferimento alla funzione che disegna la prova corrente della modalità attiva:
  // il pulsante «avanti» richiama questa, non l'avvio della modalità, altrimenti
  // la serie verrebbe rimescolata a ogni passo.
  let mostraProva = null;

  modeBar?.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-modo]");
    if (btn) {
      cambiaModo(btn.dataset.modo);
    }
  });

  ricomincia?.addEventListener("click", () => {
    const attivo = modeBar?.querySelector('button[aria-pressed="true"]');
    cambiaModo(attivo?.dataset.modo || "smistamento");
  });

  cambiaModo("smistamento");

  function cambiaModo(id) {
    modeBar?.querySelectorAll("button[data-modo]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.modo === id));
    });
    punti = 0;
    serie = 0;
    serieMax = 0;
    indice = 0;
    mostraProva = null;
    area.replaceChildren();
    if (feedback) {
      feedback.textContent = "";
    }
    (modalita[id] || modalita.smistamento).avvia();
    aggiornaHud();
  }

  function aggiornaHud() {
    if (puntiEl) puntiEl.textContent = String(punti);
    if (totaleEl) totaleEl.textContent = String(totale);
    if (serieEl) serieEl.textContent = String(serie);
    if (barra) barra.style.width = `${totale ? (indice / totale) * 100 : 0}%`;
  }

  function segna(giusto, categoria) {
    if (giusto) {
      punti += 1;
      serie += 1;
      serieMax = Math.max(serieMax, serie);
      AudioUi.beep("ok");
    } else {
      serie = 0;
      AudioUi.beep("bad");
    }
    if (categoria) {
      Progressi.registra(categoria, giusto);
    }
    aggiornaHud();
  }

  function dillo(testo) {
    if (feedback) {
      feedback.textContent = testo;
    }
  }

  function fine(titolo) {
    const box = document.createElement("div");
    box.className = "panel lab-done";
    const quota = totale ? Math.round((punti / totale) * 100) : 0;
    box.innerHTML =
      `<h2>${titolo}</h2>` +
      `<p>Punteggio: <strong>${punti} / ${totale}</strong> (${quota}%). Serie migliore: <strong>${serieMax}</strong>.</p>`;
    const debole = Progressi.puntoDebole();
    if (debole && debole.quota < 0.7) {
      const p = document.createElement("p");
      p.className = "ex-explain";
      p.textContent = `Su cui insistere: ${G.nomeCategoria(debole.id).toLowerCase()} — ${debole.giusti} su ${debole.totali} corrette finora.`;
      box.append(p);
    }
    const azioni = document.createElement("div");
    azioni.className = "inline-actions";
    const rifai = document.createElement("button");
    rifai.type = "button";
    rifai.className = "btn btn-primary";
    rifai.textContent = "Rifai questa serie";
    rifai.addEventListener("click", () => ricomincia?.click());
    azioni.append(rifai);
    box.append(azioni);
    area.replaceChildren(box);
    dillo("Serie completata.");
    if (punti === totale) {
      AudioUi.beep("win");
    }
  }

  /* ---------- 1. smistamento: parola singola nei quattro contenitori ---------- */

  function avviaSmistamento() {
    const parole = mescola(G.paroleLab).slice(0, 16);
    totale = parole.length;

    const layout = document.createElement("div");
    layout.className = "lab-layout";
    const mazzo = document.createElement("div");
    mazzo.className = "mazzo panel";
    mazzo.setAttribute("aria-live", "polite");
    const buckets = document.createElement("div");
    buckets.className = "bucket-grid";
    layout.append(mazzo, buckets);
    area.replaceChildren(layout);

    G.categorie.forEach((cat, i) => {
      const zona = document.createElement("div");
      zona.className = "bucket";
      zona.dataset.tipo = cat.id;
      zona.innerHTML = `<h3>${i + 1}. ${cat.nome}</h3><div class="bucket-drop" aria-label="Zona ${cat.nome}"></div>`;
      zona.querySelector(".bucket-drop").addEventListener("click", () => classifica(cat.id));
      buckets.append(zona);
    });

    mostra();

    function mostra() {
      mazzo.replaceChildren();
      if (indice >= parole.length) {
        fine("Smistamento completato");
        return;
      }
      const item = parole[indice];
      const carta = document.createElement("div");
      carta.className = "word-card";
      carta.textContent = item.parola;
      carta.tabIndex = 0;
      carta.addEventListener("keydown", (ev) => {
        if (ev.key >= "1" && ev.key <= "4") {
          const cat = G.categorie[Number(ev.key) - 1];
          if (cat) {
            classifica(cat.id);
          }
        }
      });
      mazzo.append(carta);
      dillo(`Parola ${indice + 1} di ${parole.length}. Scegli la categoria (tasti 1–4).`);
      carta.focus();
      aggiornaHud();
    }

    function classifica(tipo) {
      const item = parole[indice];
      if (!item) {
        return;
      }
      const giusto = item.tipo === tipo;
      const zona = buckets.querySelector(`[data-tipo="${item.tipo}"] .bucket-drop`);
      if (zona) {
        const tag = document.createElement("span");
        tag.className = `placed ${giusto ? "is-ok" : "is-bad"}`;
        tag.textContent = item.parola;
        zona.append(tag);
      }
      segna(giusto, item.tipo);
      dillo(
        giusto
          ? `Esatto: «${item.parola}» è ${G.nomeCategoria(item.tipo).toLowerCase()} ${item.sotto}.`
          : `No: «${item.parola}» è ${G.nomeCategoria(item.tipo).toLowerCase()} ${item.sotto}, non ${G.nomeCategoria(tipo).toLowerCase()}.`
      );
      indice += 1;
      mostra();
    }
  }

  /* ---------- 2. cloze: la parola mancante nella frase ---------- */

  function avviaCloze() {
    const prove = mescola(G.cloze);
    totale = prove.length;
    mostraProva = mostra;
    mostra();

    function mostra() {
      if (indice >= prove.length) {
        fine("Completamento terminato");
        return;
      }
      const prova = prove[indice];
      const box = document.createElement("div");
      box.className = "exercise panel";

      const frase = document.createElement("p");
      frase.className = "ex-frase";
      const buco = document.createElement("span");
      buco.className = "ex-blank";
      buco.textContent = "?";
      frase.append(prova.frase[0], buco, prova.frase[1]);

      const scelte = document.createElement("div");
      scelte.className = "ex-choices";
      const spiega = document.createElement("p");
      spiega.className = "ex-explain";

      const ordine = mescola(prova.scelte.map((testo, i) => ({ testo, i })));
      ordine.forEach(({ testo, i }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = testo;
        btn.addEventListener("click", () => rispondi(btn, i, prova, buco, scelte, spiega));
        scelte.append(btn);
      });

      box.append(frase, scelte, spiega);
      area.replaceChildren(box);
      dillo(`Frase ${indice + 1} di ${prove.length}. Quale parola completa il senso?`);
      aggiornaHud();
    }

    function rispondi(btn, scelto, prova, buco, scelte, spiega) {
      const giusto = scelto === prova.correct;
      scelte.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
        if (b.textContent === prova.scelte[prova.correct]) {
          b.classList.add("is-correct");
        }
      });
      if (!giusto) {
        btn.classList.add("is-wrong");
      }
      buco.textContent = prova.scelte[prova.correct];
      buco.classList.add("is-filled", `tipo-${prova.tipo}`);
      spiega.textContent = `${prova.scelte[prova.correct]} — ${prova.spiega}`;
      segna(giusto, prova.tipo);
      dillo(giusto ? "Corretto." : "Non è quella: leggi la spiegazione.");
      avanti(spiega);
    }
  }

  /* ---------- 3. intruso: la parola di categoria diversa ---------- */

  function avviaIntruso() {
    const prove = mescola(G.intrusi);
    totale = prove.length;
    mostraProva = mostra;
    mostra();

    function mostra() {
      if (indice >= prove.length) {
        fine("Caccia all’intruso terminata");
        return;
      }
      const prova = prove[indice];
      const box = document.createElement("div");
      box.className = "exercise panel";

      const titolo = document.createElement("p");
      titolo.className = "ex-frase";
      titolo.textContent = `Tre parole sono ${prova.altri}. Qual è l’intrusa?`;

      const griglia = document.createElement("div");
      griglia.className = "intruso-grid";
      const spiega = document.createElement("p");
      spiega.className = "ex-explain";

      prova.parole.forEach((parola, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = parola;
        btn.addEventListener("click", () => rispondi(btn, i, prova, griglia, spiega));
        griglia.append(btn);
      });

      box.append(titolo, griglia, spiega);
      area.replaceChildren(box);
      dillo(`Gruppo ${indice + 1} di ${prove.length}.`);
      aggiornaHud();
    }

    function rispondi(btn, scelto, prova, griglia, spiega) {
      const giusto = scelto === prova.intruso;
      griglia.querySelectorAll("button").forEach((b, i) => {
        b.disabled = true;
        if (i === prova.intruso) {
          b.classList.add("is-correct");
        }
      });
      if (!giusto) {
        btn.classList.add("is-wrong");
      }
      spiega.textContent = prova.spiega;
      segna(giusto, prova.tipo);
      dillo(giusto ? "Intruso trovato." : "Quello no: guarda la spiegazione.");
      avanti(spiega);
    }
  }

  /* ---------- 4. analisi: trova tutte le invariabili della frase ---------- */

  function avviaAnalisi() {
    const frasi = mescola(G.frasiAnalisi);
    totale = frasi.reduce((n, f) => n + f.filter((t) => t.tipo).length, 0);
    let fraseIdx = 0;
    mostra();

    function mostra() {
      if (fraseIdx >= frasi.length) {
        fine("Analisi completata");
        return;
      }
      const pezzi = frasi[fraseIdx];
      const daTrovare = pezzi.filter((t) => t.tipo).length;
      let trovate = 0;

      const box = document.createElement("div");
      box.className = "exercise panel";

      const istruzione = document.createElement("p");
      istruzione.className = "kicker";
      istruzione.textContent = `Frase ${fraseIdx + 1} di ${frasi.length} — clicca le parti invariabili`;

      const frase = document.createElement("p");
      frase.className = "analisi-frase";
      const spiega = document.createElement("p");
      spiega.className = "ex-explain";

      pezzi.forEach((pezzo) => {
        if (!pezzo.tipo) {
          frase.append(pezzo.testo);
          return;
        }
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "an-token";
        btn.textContent = pezzo.testo;
        btn.addEventListener("click", () => {
          if (btn.classList.contains("is-found")) {
            return;
          }
          btn.classList.add("is-found", `tipo-${pezzo.tipo}`);
          btn.disabled = true;
          trovate += 1;
          indice += 1;
          segna(true, pezzo.tipo);
          spiega.textContent = `«${pezzo.testo}» — ${G.nomeCategoria(pezzo.tipo).toLowerCase()}: ${G.categoria(pezzo.tipo).breve}`;
          dillo(`Trovate ${trovate} di ${daTrovare}.`);
          if (trovate === daTrovare) {
            avantiFrase(spiega);
          }
        });
        frase.append(btn);
      });

      // Le parole variabili sono cliccabili ma segnalano l'errore.
      const errore = document.createElement("p");
      errore.className = "live";
      frase.addEventListener("click", (ev) => {
        if (ev.target === frase) {
          errore.textContent = "Quella parola cambia forma: non è invariabile.";
        }
      });

      const salta = document.createElement("button");
      salta.type = "button";
      salta.className = "btn btn-secondary";
      salta.textContent = "Mostra le rimanenti";
      salta.addEventListener("click", () => {
        frase.querySelectorAll(".an-token:not(.is-found)").forEach((t) => {
          t.classList.add("is-missed");
          t.disabled = true;
        });
        avantiFrase(spiega);
      });

      const azioni = document.createElement("div");
      azioni.className = "inline-actions";
      azioni.append(salta);

      box.append(istruzione, frase, spiega, errore, azioni);
      area.replaceChildren(box);
      dillo(`Da trovare: ${daTrovare} parti invariabili.`);
      aggiornaHud();
    }

    function avantiFrase(dopo) {
      fraseIdx += 1;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary";
      btn.textContent = fraseIdx >= frasi.length ? "Vedi il risultato" : "Frase successiva";
      btn.addEventListener("click", mostra);
      dopo.after(btn);
      btn.focus();
    }
  }

  /* Pulsante «avanti» condiviso da cloze e intruso. */
  function avanti(dopo) {
    indice += 1;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primary";
    btn.textContent = indice >= totale ? "Vedi il risultato" : "Prova successiva";
    btn.addEventListener("click", () => {
      if (mostraProva) {
        mostraProva();
      }
    });
    dopo.after(btn);
    btn.focus();
    aggiornaHud();
  }
});

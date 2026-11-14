/* Laboratorio: quattro esercizi a risposta chiusa (una sola risposta giusta).
   Gli stessi item sono controllati da _qa_jev_run.py. */
(function () {
  const ES_POSTI = [
    { id: "pharmacy", op: ["pharmacy", "police", "park"] },
    { id: "church", op: ["school", "church", "cinema"] },
    { id: "hospital", op: ["hotel", "hospital", "library"] },
    { id: "bank", op: ["bank", "bakery", "busstop"] },
    { id: "postoffice", op: ["supermarket", "postoffice", "museum"] },
    { id: "station", op: ["station", "police", "lights"] },
    { id: "lights", op: ["zebra", "crossroads", "lights"] },
    { id: "cafe", op: ["restaurant", "cafe", "hotel"] },
  ];

  const NOMI_FRECCIA = { F: "dritto", L: "gira a sinistra", R: "gira a destra", left: "è a sinistra", right: "è a destra" };
  const CLASSE_FRECCIA = { F: "dritto", L: "sx", R: "dx", left: "sx", right: "dx" };
  const ES_FRECCE = [
    { k: "c_straight", ok: "F" },
    { k: "c_left", ok: "L" },
    { k: "c_onright", ok: "right" },
    { k: "c_right", ok: "R" },
    { k: "l_first", ok: "L" },
    { k: "c_onleft", ok: "left" },
    { k: "l_second", ok: "R" },
    { k: "l_yourleft", ok: "left" },
  ];

  const ES_DOVE = [
    { scena: "bank,pharmacy*,|,,", frase: "The pharmacy is ___ the bank.", ok: "next to" },
    { scena: ",church,|,school*,", frase: "The school is ___ the church.", ok: "opposite" },
    { scena: "cafe,hotel*,cinema|,,", frase: "The hotel is ___ the café and the cinema.", ok: "between" },
    { scena: ",supermarket,|,postoffice*,", frase: "The post office is ___ the supermarket.", ok: "opposite" },
    { scena: "hospital,park*,|,,", frase: "The park is ___ the hospital.", ok: "next to" },
    { scena: "bank,church*,school|,,", frase: "The church is ___ the bank and the school.", ok: "between" },
  ];

  const ES_DIALOGO = [
    { frase: "___ me, where is the bank?", op: ["Excuse", "Thank", "Please"], ok: "Excuse", it: "Scusi, dov’è la banca?" },
    { frase: "Go ___ on.", op: ["straight", "street", "stop"], ok: "straight", it: "Vai dritto." },
    { frase: "Turn ___.", aiuto: "L", op: ["left", "right", "straight"], ok: "left", it: "Gira a sinistra." },
    { frase: "Take the ___ right.", aiuto: "2ª", op: ["first", "second", "third"], ok: "second", it: "Prendi la seconda a destra." },
    { frase: "It’s ___ the left.", op: ["on", "in", "of"], ok: "on", it: "È a sinistra." },
    { frase: "Is there a pharmacy ___ here?", op: ["near", "next", "far"], ok: "near", it: "C’è una farmacia qui vicino?" },
    { frase: "Thank you! — You’re ___!", op: ["welcome", "please", "sorry"], ok: "welcome", it: "Grazie! — Prego!" },
  ];

  const TOT = ES_POSTI.length + ES_FRECCE.length + ES_DOVE.length + ES_DIALOGO.length;
  let punti = 0, fatte = 0;
  const barra = document.getElementById("punteggio-lab");
  const aggiorna = () => {
    barra.textContent = `Punti ${punti} · risposte ${fatte} / ${TOT}`;
    if (fatte === TOT) fine();
  };

  /* Una domanda: bottoni, una sola giusta. onFatto(giusta) dopo la prima risposta. */
  function domanda(el, opzioni, giusta, render, dopo, fisso) {
    const box = el.querySelector(".opzioni");
    const esito = el.querySelector(".esito");
    let risposto = false;
    (fisso ? opzioni : window.mescola(opzioni)).forEach((op) => {
      const b = document.createElement("button");
      b.type = "button";
      render(b, op);
      b.addEventListener("click", () => {
        if (risposto) return;
        risposto = true;
        fatte += 1;
        const ok = op === giusta;
        if (ok) punti += 1;
        b.classList.add(ok ? "giusta" : "errata");
        box.querySelectorAll("button").forEach((x) => { if (x.dataset.op === giusta) x.classList.add("giusta"); x.disabled = x !== b && x.dataset.op !== giusta; });
        esito.className = "esito " + (ok ? "ok" : "ko");
        if (dopo) dopo(ok, esito);
        aggiorna();
      });
      b.dataset.op = op;
      box.appendChild(b);
    });
  }

  const scena = (spec) => {
    const [su, giu] = spec.split("|").map((r) => r.split(","));
    const fila = (r) => `<div class="fila">${r.map((x) => {
      const meta = x.endsWith("*");
      const id = x.replace("*", "");
      if (!id) return '<div class="lotto"></div>';
      return `<div class="lotto${meta ? " meta" : ""}">${window.icona(id)}<small>${window.POSTO(id).en}</small></div>`;
    }).join("")}</div>`;
    return `<div class="scena">${fila(su)}<div class="via"></div>${fila(giu)}</div>`;
  };

  function costruisci() {
    punti = 0; fatte = 0;
    document.getElementById("fine-lab").hidden = true;

    const e1 = document.getElementById("es-posti");
    e1.innerHTML = "";
    window.mescola(ES_POSTI).forEach((it, n) => {
      const d = document.createElement("div");
      d.className = "domanda-lab";
      d.innerHTML = `<div class="testa">${window.icona(it.id)}<p>${n + 1}. What is it?</p></div><div class="opzioni"></div><p class="esito" aria-live="polite"></p>`;
      e1.appendChild(d);
      domanda(d, it.op, it.id, (b, op) => { b.textContent = window.POSTO(op).en; }, (ok, esito) => {
        const p = window.POSTO(it.id);
        esito.textContent = (ok ? "✓ Yes! " : "✗ No. ") + `It’s the ${p.en} = ${p.it}.`;
        window.Voce.play("w_" + it.id);
      });
    });

    const e2 = document.getElementById("es-frecce");
    e2.innerHTML = "";
    window.mescola(ES_FRECCE).forEach((it, n) => {
      const f = window.FRASI[it.k];
      const d = document.createElement("div");
      d.className = "domanda-lab";
      d.innerHTML = `<div class="testa"><button type="button" class="voce" data-voce="${it.k}" aria-label="Ascolta la frase"></button><p>${n + 1}. <span class="testo-nascosto" hidden>${f.en}</span></p><button type="button" class="btn leggi" style="min-height:36px;padding:4px 10px">Leggi</button></div><div class="opzioni"></div><p class="esito" aria-live="polite"></p>`;
      e2.appendChild(d);
      const nascosto = d.querySelector(".testo-nascosto");
      d.querySelector(".leggi").addEventListener("click", (ev) => { nascosto.hidden = false; ev.currentTarget.remove(); });
      domanda(d, ["L", "F", "R", "left", "right"], it.ok, (b, op) => {
        b.classList.add(CLASSE_FRECCIA[op]);
        b.innerHTML = window.FRECCE[op] + `<span>${NOMI_FRECCIA[op]}</span>`;
        b.setAttribute("aria-label", NOMI_FRECCIA[op]);
      }, (ok, esito) => {
        nascosto.hidden = false;
        const l = d.querySelector(".leggi");
        if (l) l.remove();
        esito.textContent = (ok ? "✓ Right! " : "✗ No. ") + `${f.en} = ${f.it}`;
      }, true);
    });

    const e3 = document.getElementById("es-dove");
    e3.innerHTML = "";
    window.mescola(ES_DOVE).forEach((it, n) => {
      const d = document.createElement("div");
      d.className = "domanda-lab";
      d.innerHTML = `${scena(it.scena)}<p><strong>${n + 1}.</strong> <span class="en">${it.frase.replace("___", '<span class="buco">?</span>')}</span></p><div class="opzioni"></div><p class="esito" aria-live="polite"></p>`;
      e3.appendChild(d);
      domanda(d, ["next to", "opposite", "between"], it.ok, (b, op) => { b.textContent = op; }, (ok, esito) => {
        d.querySelector(".buco").textContent = it.ok;
        const it2 = { "next to": "accanto a", opposite: "di fronte a", between: "tra" }[it.ok];
        esito.textContent = (ok ? "✓ Yes! " : "✗ No. ") + `${it.ok} = ${it2}.`;
      });
    });

    const e4 = document.getElementById("es-dialogo");
    e4.innerHTML = "";
    ES_DIALOGO.forEach((it, n) => {
      const d = document.createElement("div");
      d.className = "domanda-lab";
      const aiuto = it.aiuto === "L" ? `<span class="sx" style="display:inline-block;width:34px;vertical-align:middle">${window.FRECCE.L}</span>` : it.aiuto ? `<span class="pill" style="background:var(--yellow);color:#111;border-radius:8px;padding:2px 8px;font-weight:800">${it.aiuto}</span>` : "";
      d.innerHTML = `<p><strong>${n + 1}.</strong> ${aiuto} <span class="en">${it.frase.replace("___", '<span class="buco">?</span>')}</span></p><div class="opzioni"></div><p class="esito" aria-live="polite"></p>`;
      e4.appendChild(d);
      domanda(d, it.op, it.ok, (b, op) => { b.textContent = op; }, (ok, esito) => {
        d.querySelector(".buco").textContent = it.ok;
        esito.textContent = (ok ? "✓ Yes! " : "✗ No. ") + it.it;
      });
    });
    aggiorna();
  }

  function fine() {
    const box = document.getElementById("fine-lab");
    box.hidden = false;
    const pct = punti / TOT;
    document.getElementById("stelle-lab").textContent = pct >= 0.9 ? "★★★" : pct >= 0.65 ? "★★☆" : "★☆☆";
    document.getElementById("fine-lab-testo").textContent =
      `Hai fatto ${punti} punti su ${TOT}. ` + (pct >= 0.65 ? "Sei pronto per la mappa di Greenford!" : "Ripassa lo Studio e riprova.");
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  document.getElementById("rifai-lab").addEventListener("click", () => { costruisci(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  costruisci();
})();

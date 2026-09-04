(function () {
  const bank = [
    {
      q: "Hitler diventa cancelliere nel 1933 soprattutto grazie a…",
      options: [
        { t: "Un percorso elettorale e alleanze, poi smantella la democrazia", ok: true },
        { t: "Una marcia armata identica a quella di Mussolini", ok: false },
        { t: "Un referendum mondiale obbligatorio", ok: false },
      ],
      why: "A differenza della Marcia su Roma, Hitler entra dal sistema politico e poi lo distrugge dall’interno.",
    },
    {
      q: "La crisi del 1929, da sola…",
      options: [
        { t: "Spiega tutto il Nazismo senza altri fattori", ok: false },
        { t: "È terreno fertile, ma servono anche propaganda, violenza e scelte politiche", ok: true },
        { t: "Non ha avuto effetti in Germania", ok: false },
      ],
      why: "Altri Paesi vissero la Depressione senza diventare dittature razziste.",
    },
    {
      q: "Le leggi di Norimberga (1935)…",
      options: [
        { t: "Restituiscono diritti agli ebrei", ok: false },
        { t: "Escludono gli ebrei dalla cittadinanza piena e legalizzano la discriminazione", ok: true },
        { t: "Riguardano solo l’edilizia scolastica", ok: false },
      ],
      why: "Sono un passaggio chiave dall’odio sociale all’odio di Stato.",
    },
    {
      q: "Campi di sterminio e di concentramento…",
      options: [
        { t: "Sono esattamente la stessa cosa", ok: false },
        { t: "Gli sterminio sono pensati per uccidere in massa; i concentramento per detenere e sfruttare con violenza", ok: true },
        { t: "Esistevano solo in Italia", ok: false },
      ],
      why: "Dachau ≠ Treblinka: funzioni diverse, entrambi crimini.",
    },
    {
      q: "Il Lebensraum indica…",
      options: [
        { t: "Un programma culturale di teatro", ok: false },
        { t: "L’idea di conquistare «spazio vitale» a Est", ok: true },
        { t: "Un trattato di pace del 1919", ok: false },
      ],
      why: "È parte del programma aggressivo legato a Mein Kampf.",
    },
    {
      q: "Studiare il Nazismo oggi serve soprattutto a…",
      options: [
        { t: "Ammirare l’efficienza militare", ok: false },
        { t: "Riconoscere odio legalizzato, propaganda e silenzi comodi", ok: true },
        { t: "Imparare a vincere le elezioni a ogni costo", ok: false },
      ],
      why: "È educazione civica e memoria, non nostalgia.",
    },
  ];

  const box = document.getElementById("lab-box");
  const startBtn = document.getElementById("lab-start");
  if (!box || !startBtn) {
    return;
  }

  let i = 0;
  let score = 0;
  let ordine = [];

  function mescola(lista) {
    const copia = [...lista];
    for (let a = copia.length - 1; a > 0; a -= 1) {
      const b = Math.floor(Math.random() * (a + 1));
      [copia[a], copia[b]] = [copia[b], copia[a]];
    }
    return copia;
  }

  function renderDomanda() {
    const item = ordine[i];
    box.replaceChildren();

    const h = document.createElement("h2");
    h.textContent = `Domanda ${i + 1} di ${ordine.length}`;
    const p = document.createElement("p");
    p.className = "lab-q";
    p.textContent = item.q;
    const opts = document.createElement("div");
    opts.className = "lab-options";

    mescola(item.options).forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-secondary lab-opt";
      btn.textContent = opt.t;
      btn.addEventListener("click", () => rispondi(opt, item, opts));
      opts.appendChild(btn);
    });

    const live = document.createElement("p");
    live.className = "live";
    live.id = "lab-live";
    live.setAttribute("aria-live", "polite");

    box.append(h, p, opts, live);
  }

  function rispondi(opt, item, opts) {
    opts.querySelectorAll("button").forEach((b) => {
      b.disabled = true;
    });
    const live = document.getElementById("lab-live");
    if (opt.ok) {
      score += 1;
      if (window.AudioUi) {
        window.AudioUi.beep("ok");
      }
      if (live) {
        live.textContent = `Corretto. ${item.why}`;
      }
    } else {
      if (window.AudioUi) {
        window.AudioUi.beep("bad");
      }
      if (live) {
        live.textContent = `Non proprio. ${item.why}`;
      }
    }

    const next = document.createElement("button");
    next.type = "button";
    next.className = "btn btn-primary";
    next.textContent = i + 1 < ordine.length ? "Avanti" : "Risultato";
    next.addEventListener("click", () => {
      i += 1;
      if (i < ordine.length) {
        renderDomanda();
      } else {
        fine();
      }
    });
    box.appendChild(next);
  }

  function fine() {
    box.replaceChildren();
    const h = document.createElement("h2");
    h.textContent = "Laboratorio completato";
    const p = document.createElement("p");
    p.textContent = `Hai risposto bene a ${score} domande su ${ordine.length}.`;
    const a = document.createElement("a");
    a.className = "btn btn-primary";
    a.href = "gioco.html";
    a.textContent = "Ritorna alla storia a fumetto";
    const again = document.createElement("button");
    again.type = "button";
    again.className = "btn btn-secondary";
    again.textContent = "Ripeti il laboratorio";
    again.addEventListener("click", avvia);
    const actions = document.createElement("div");
    actions.className = "hero-actions";
    actions.append(a, again);
    box.append(h, p, actions);
  }

  function avvia() {
    i = 0;
    score = 0;
    ordine = mescola(bank);
    startBtn.hidden = true;
    renderDomanda();
  }

  startBtn.addEventListener("click", avvia);
})();

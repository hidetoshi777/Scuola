/**
 * Avvisi nuovi lavori sul raccoglitore professionale.
 * Sito statico: il controllo avviene all’apertura della pagina (e via SW se attivo).
 * Filtro: terza e/o quarta (annoProf).
 */
(function () {
  const STORAGE_KEY = "prof-novita-v1";
  const root = document.getElementById("prof-novita");
  if (!root) return;

  const statoEl = root.querySelector("[data-novita-stato]");
  const btn = root.querySelector("[data-novita-toggle]");
  const check3 = root.querySelector('[data-novita-anno="3"]');
  const check4 = root.querySelector('[data-novita-anno="4"]');

  function defaultPrefs() {
    return { enabled: false, anni: [3, 4], knownIds: [] };
  }

  function leggi() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultPrefs();
      const obj = JSON.parse(raw);
      return {
        enabled: !!obj.enabled,
        anni: Array.isArray(obj.anni)
          ? obj.anni.map(Number).filter(function (n) {
              return n === 3 || n === 4;
            })
          : [3, 4],
        knownIds: Array.isArray(obj.knownIds)
          ? obj.knownIds.map(String)
          : [],
      };
    } catch (err) {
      return defaultPrefs();
    }
  }

  function salva(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }

  function elencoLavori() {
    if (typeof window.attivitaProfessionale === "function") {
      return window.attivitaProfessionale().map(function (a) {
        const id = String(a.url || "")
          .replace(/^\//, "")
          .replace(/\/$/, "");
        return {
          id: id,
          titolo: a.titolo || id,
          annoProf: a.annoProf,
          url: a.url,
          materia: a.materia || "",
        };
      });
    }
    return [];
  }

  function idsPerAnni(anni) {
    return elencoLavori()
      .filter(function (a) {
        return anni.indexOf(Number(a.annoProf)) !== -1;
      })
      .map(function (a) {
        return a.id;
      });
  }

  function syncCheckbox(prefs) {
    if (check3) check3.checked = prefs.anni.indexOf(3) !== -1;
    if (check4) check4.checked = prefs.anni.indexOf(4) !== -1;
  }

  function anniDaCheckbox() {
    const anni = [];
    if (check3 && check3.checked) anni.push(3);
    if (check4 && check4.checked) anni.push(4);
    return anni;
  }

  function aggiornaUi(prefs) {
    syncCheckbox(prefs);
    if (!btn) return;
    const supportati = "Notification" in window;
    if (!supportati) {
      btn.disabled = true;
      btn.textContent = "Avvisi non disponibili";
      if (statoEl) {
        statoEl.textContent =
          "Questo browser non supporta gli avvisi. Prova Chrome o Safari aggiornato.";
      }
      return;
    }
    btn.disabled = false;
    if (prefs.enabled && Notification.permission === "granted") {
      btn.textContent = "Disattiva avvisi";
      btn.dataset.azione = "off";
      const parti = [];
      if (prefs.anni.indexOf(3) !== -1) parti.push("3ª");
      if (prefs.anni.indexOf(4) !== -1) parti.push("4ª");
      if (statoEl) {
        statoEl.textContent =
          "Avvisi attivi per " +
          (parti.join(" e ") || "nessuna classe") +
          ". Controlliamo i nuovi lavori quando apri questa pagina.";
      }
    } else {
      btn.textContent = "Attiva avvisi";
      btn.dataset.azione = "on";
      if (statoEl) {
        if (Notification.permission === "denied") {
          statoEl.textContent =
            "Permesso negato dal browser. Riattivalo nelle impostazioni del sito, poi riprova.";
        } else {
          statoEl.textContent =
            "Scegli 3ª e/o 4ª, poi attiva. Ti avvisiamo se esce un lavoro nuovo.";
        }
      }
    }
  }

  async function registraSw() {
    if (!("serviceWorker" in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register("./sw.js?v=1", {
        scope: "./",
      });
      return reg;
    } catch (err) {
      return null;
    }
  }

  async function mostraAvviso(item) {
    const anno = Number(item.annoProf) === 3 ? "3ª" : "4ª";
    const title = "Nuovo lavoro · " + anno;
    const body = item.titolo || item.id;
    const url = "../" + String(item.url || item.id + "/").replace(/^\//, "");
    const reg =
      "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistration("./")
        : null;
    if (reg && reg.showNotification) {
      await reg.showNotification(title, {
        body: body,
        icon: "../favicon.svg",
        badge: "../favicon.svg",
        tag: "prof-novita-" + item.id,
        data: { url: url },
      });
      return;
    }
    if (Notification.permission === "granted") {
      const n = new Notification(title, {
        body: body,
        icon: "../favicon.svg",
        tag: "prof-novita-" + item.id,
      });
      n.onclick = function () {
        window.focus();
        location.href = url;
        n.close();
      };
    }
  }

  async function controllaNuovi(prefs, options) {
    const opts = options || {};
    if (!prefs.enabled || Notification.permission !== "granted") return prefs;
    if (!prefs.anni.length) return prefs;

    const lista = elencoLavori().filter(function (a) {
      return prefs.anni.indexOf(Number(a.annoProf)) !== -1;
    });
    const known = new Set(prefs.knownIds || []);
    const nuovi = lista.filter(function (a) {
      return a.id && !known.has(a.id);
    });

    if (opts.silenzioso) {
      lista.forEach(function (a) {
        known.add(a.id);
      });
      prefs.knownIds = Array.from(known);
      salva(prefs);
      return prefs;
    }

    for (let i = 0; i < nuovi.length; i += 1) {
      await mostraAvviso(nuovi[i]);
      known.add(nuovi[i].id);
    }
    prefs.knownIds = Array.from(known);
    salva(prefs);

    const reg =
      "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistration("./")
        : null;
    if (reg && reg.active) {
      reg.active.postMessage({ type: "check-feed", prefs: prefs });
    }
    return prefs;
  }

  async function attiva() {
    const anni = anniDaCheckbox();
    if (!anni.length) {
      if (statoEl) {
        statoEl.textContent = "Seleziona almeno terza o quarta.";
      }
      return;
    }
    if (!("Notification" in window)) {
      aggiornaUi(leggi());
      return;
    }
    let perm = Notification.permission;
    if (perm !== "granted") {
      perm = await Notification.requestPermission();
    }
    if (perm !== "granted") {
      aggiornaUi(leggi());
      return;
    }
    await registraSw();
    const prefs = leggi();
    prefs.enabled = true;
    prefs.anni = anni;
    /* Baseline: i lavori già presenti non generano avviso. */
    prefs.knownIds = idsPerAnni(anni);
    salva(prefs);
    aggiornaUi(prefs);
    if (statoEl) {
      statoEl.textContent =
        "Avvisi attivi. I lavori già in elenco non ti verranno segnalati; solo quelli nuovi.";
    }
  }

  function disattiva() {
    const prefs = leggi();
    prefs.enabled = false;
    salva(prefs);
    aggiornaUi(prefs);
  }

  function onAnniChange() {
    const prefs = leggi();
    const anni = anniDaCheckbox();
    prefs.anni = anni;
    if (prefs.enabled) {
      /* Nuove classi selezionate: marca i lavori attuali come già visti. */
      const known = new Set(prefs.knownIds || []);
      idsPerAnni(anni).forEach(function (id) {
        known.add(id);
      });
      prefs.knownIds = Array.from(known);
    }
    salva(prefs);
    aggiornaUi(prefs);
  }

  if (btn) {
    btn.addEventListener("click", function () {
      const prefs = leggi();
      if (prefs.enabled && Notification.permission === "granted") {
        disattiva();
      } else {
        attiva();
      }
    });
  }
  if (check3) check3.addEventListener("change", onAnniChange);
  if (check4) check4.addEventListener("change", onAnniChange);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", function (event) {
      const data = event.data || {};
      if (data.type === "novita-known-update" && Array.isArray(data.knownIds)) {
        const prefs = leggi();
        prefs.knownIds = data.knownIds.map(String);
        salva(prefs);
      }
    });
  }

  async function avvia() {
    let prefs = leggi();
    aggiornaUi(prefs);
    if (prefs.enabled && Notification.permission === "granted") {
      await registraSw();
      prefs = await controllaNuovi(prefs, { silenzioso: false });
      aggiornaUi(prefs);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", avvia);
  } else {
    avvia();
  }
})();

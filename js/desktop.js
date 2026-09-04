/* =========================================================
   Lo scaffale: costruzione della pagina.

   Ogni lavoro diventa un DORSO. Due misure lo descrivono:
   - lo SPESSORE viene dal numero di pagine (dato reale);
   - l'ALTEZZA viene da un'impronta calcolata sull'ID del design,
     quindi è sempre la stessa per lo stesso lavoro ma varia fra
     un lavoro e l'altro: serve a far sembrare uno scaffale vero
     invece di un pettine. Non vuol dire niente, e non è scritta
     da nessuna parte come se lo volesse dire.
   ========================================================= */

(function () {
  const root = document.documentElement;
  const CHIAVE_TEMA = "tema-scaffale";

  /* ---------------- Tema ---------------- */

  const salvato = localStorage.getItem(CHIAVE_TEMA);
  root.dataset.theme = salvato === "dark" || salvato === "light" ? salvato : "light";

  const interruttore = document.querySelector("[data-tema]");
  if (interruttore) {
    const aggiornaEtichetta = () => {
      const scuro = root.dataset.theme === "dark";
      interruttore.setAttribute("aria-pressed", String(scuro));
      interruttore.textContent = scuro ? "Carta" : "Lavagna";
    };
    aggiornaEtichetta();
    interruttore.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(CHIAVE_TEMA, root.dataset.theme);
      aggiornaEtichetta();
    });
  }

  /* ---------------- Utilità ---------------- */

  function esc(testo) {
    return String(testo)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Impronta stabile: stesso ID, stesso numero, sempre. */
  function impronta(testo) {
    let h = 2166136261;
    for (let i = 0; i < testo.length; i += 1) {
      h ^= testo.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const spessore = (pp) => Math.round(21 + Math.min(pp, 30) * 1.15);
  /* Frazione del ripiano, non pixel: il CSS la moltiplica per --riga. */
  const altezzaDorso = (id) => (0.84 + (impronta(id) % 33) / 200).toFixed(3);
  const inclinazione = (id) => -9 + (impronta(id + "s") % 17);

  function adesivo(simbolo, materia, id) {
    return (
      '<span class="adesivo" aria-hidden="true" style="--tinta: var(--c-' + materia + ');' +
      " --tinta-adesivo: var(--a-" + materia + "); --rot: " + inclinazione(id || simbolo) + 'deg">' +
      '<svg viewBox="0 0 40 40"><use href="#' + simbolo + '"></use></svg></span>'
    );
  }

  const chiaviMaterie = Object.keys(window.MATERIE);
  const lavoriDi = (materia) => window.CANVA.filter((v) => v.materia === materia);

  /* ---------------- La fascia d'apertura ---------------- */

  function costruisciFascia() {
    const contenitore = document.getElementById("fascia-dorsi");
    if (!contenitore) return;

    /* I lavori in fila, raggruppati per materia: la fascia mostra
       anche le proporzioni fra un ripiano e l'altro. */
    const ordinati = [];
    chiaviMaterie.forEach((m) => ordinati.push(...lavoriDi(m)));

    contenitore.innerHTML = ordinati
      .map((v) => {
        const h = Math.round(24 + Math.min(v.pp, 29) * 2.2);
        return (
          '<span class="fascia-dorso" style="--tinta: var(--c-' + v.materia + ');' +
          " --h: " + h + 'px" title="' + esc(v.titolo) + '"></span>'
        );
      })
      .join("");

    const pagine = window.CANVA.reduce((somma, v) => somma + (Number(v.pp) || 0), 0);
    document.getElementById("fascia-conto").textContent = window.CANVA.length;
    document.getElementById("fascia-pagine").textContent = pagine.toLocaleString("it-IT");
    document.getElementById("fascia-materie").textContent = chiaviMaterie.length;
  }

  /* ---------------- Le cartelline ---------------- */

  function costruisciCartelline() {
    const contenitore = document.getElementById("cartelliera");
    if (!contenitore) return;

    contenitore.innerHTML = window.ATTIVITA_WEB.map((a, i) => {
      const altri = (a.extra || [])
        .map((e) => '<a href="' + esc(e.url) + '">' + esc(e.label) + "</a>")
        .join("");
      return (
        '<article class="cartellina entra" style="--tinta: var(--c-' + a.tinta + '); --i: ' + i + '">' +
        '<div class="cartellina-testa">' +
        '<span class="cartellina-dove">' + esc(a.materia) + " · " + esc(a.classe) + "</span>" +
        adesivo(a.adesivo, a.tinta, a.titolo) +
        "</div>" +
        '<h3><a href="' + esc(a.url) + '">' + esc(a.titolo) + "</a></h3>" +
        "<p>" + esc(a.descrizione) + "</p>" +
        (altri ? '<div class="cartellina-altro">' + altri + "</div>" : "") +
        "</article>"
      );
    }).join("");
  }

  /* ---------------- I ripiani ---------------- */

  function costruisciRipiani() {
    const contenitore = document.getElementById("ripiani");
    if (!contenitore) return;

    contenitore.innerHTML = chiaviMaterie
      .map((chiave) => {
        const info = window.MATERIE[chiave];
        const lavori = lavoriDi(chiave);
        const dorsi = lavori
          .map(function (v, i) {
            const etichetta = v.titolo + " — " + info.label + ", " + v.pp + " pagine";
            return (
              '<button type="button" class="dorso entra" data-id="' + esc(v.id) + '"' +
              ' style="--tinta: var(--c-' + chiave + "); --sp: " + spessore(v.pp) + "px;" +
              " --h: " + altezzaDorso(v.id) + "; --i: " + Math.min(i, 18) + '"' +
              ' aria-label="' + esc(etichetta) + '" title="' + esc(etichetta) + '">' +
              '<span class="dorso-corpo"><span class="dorso-titolo">' + esc(v.titolo) + "</span></span>" +
              "</button>"
            );
          })
          .join("");

        return (
          '<section class="ripiano" data-materia="' + chiave + '" style="--tinta: var(--c-' + chiave + ')">' +
          '<div class="ripiano-testa">' +
          adesivo(info.adesivo, chiave, chiave) +
          "<h3>" + esc(info.label) + "</h3>" +
          '<span class="ripiano-conto" data-conto>' + lavori.length + " lavori</span>" +
          '<span class="ripiano-riga" aria-hidden="true"></span>' +
          "</div>" +
          '<div class="ripiano-dorsi">' + dorsi + "</div>" +
          "</section>"
        );
      })
      .join("");
  }

  /* ---------------- Ricerca ---------------- */

  function collegaRicerca() {
    const campo = document.getElementById("cerca");
    const esito = document.getElementById("esito");
    const ripiani = Array.from(document.querySelectorAll(".ripiano"));
    if (!campo || !ripiani.length) return;

    function filtra() {
      const cerca = campo.value.trim().toLowerCase();
      let visibili = 0;

      ripiani.forEach((ripiano) => {
        let rimasti = 0;
        ripiano.querySelectorAll(".dorso").forEach((dorso) => {
          const titolo = (dorso.getAttribute("aria-label") || "").toLowerCase();
          const passa = !cerca || titolo.includes(cerca);
          dorso.hidden = !passa;
          if (passa) rimasti += 1;
        });
        ripiano.hidden = rimasti === 0;
        ripiano.querySelector("[data-conto]").textContent =
          rimasti + (rimasti === 1 ? " lavoro" : " lavori");
        visibili += rimasti;
      });

      if (!cerca) {
        esito.textContent = "";
      } else if (visibili === 0) {
        esito.textContent = "Nessun titolo contiene « " + campo.value.trim() + " ». Prova con una parola sola.";
      } else {
        esito.textContent = visibili === 1 ? "Un lavoro trovato." : visibili + " lavori trovati.";
      }
    }

    campo.addEventListener("input", filtra);
  }

  /* ---------------- La scheda del volume ---------------- */

  function collegaScheda() {
    const scheda = document.getElementById("scheda");
    if (!scheda || typeof scheda.showModal !== "function") return;

    const perId = {};
    window.CANVA.forEach((v) => { perId[v.id] = v; });

    document.getElementById("ripiani").addEventListener("click", (ev) => {
      const dorso = ev.target.closest(".dorso");
      if (!dorso) return;
      const v = perId[dorso.dataset.id];
      if (!v) return;

      const info = window.MATERIE[v.materia];
      scheda.style.setProperty("--tinta", "var(--c-" + v.materia + ")");
      document.getElementById("scheda-adesivo").outerHTML =
        adesivo(info.adesivo, v.materia, v.id).replace(
          'class="adesivo"',
          'class="adesivo scheda-adesivo" id="scheda-adesivo"'
        );
      document.getElementById("scheda-materia").textContent = info.label;
      document.getElementById("scheda-dati").textContent =
        v.pp + (v.pp === 1 ? " pagina" : " pagine") + (v.periodo ? " · " + v.periodo : "");
      document.getElementById("scheda-titolo").textContent = v.titolo;
      document.getElementById("scheda-link").href = canvaLink(v.id);

      /* L'anteprima resta nascosta finché l'immagine non è arrivata davvero:
         i lavori aggiunti dopo l'ultima ricognizione non hanno il file, e
         un riquadro vuoto sarebbe peggio di nessun riquadro. */
      const cornice = document.getElementById("scheda-anteprima");
      const img = document.getElementById("scheda-img");
      cornice.hidden = true;
      img.onload = () => { cornice.hidden = false; };
      img.onerror = () => { cornice.hidden = true; };
      img.alt = "Prima pagina di « " + v.titolo + " »";
      img.src = "img/canva/" + v.id + ".jpg";

      scheda.showModal();
    });

    scheda.addEventListener("click", (ev) => {
      if (ev.target.closest("[data-chiudi]") || ev.target === scheda) scheda.close();
    });
  }

  /* ---------------- Avvio ---------------- */

  document.addEventListener("DOMContentLoaded", () => {
    costruisciFascia();
    costruisciCartelline();
    costruisciRipiani();
    collegaRicerca();
    collegaScheda();
  });
})();

(function () {
  const root = document.body;
  const CHIAVE = "tema-prof-hub";
  const griglia = document.getElementById("prof-griglia");
  const filtri = document.getElementById("prof-filtri");
  const esito = document.getElementById("prof-esito");
  const themeBtn = document.querySelector("[data-prof-theme]");

  function esc(testo) {
    return String(testo)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function elenco() {
    if (typeof window.attivitaProfessionale === "function") {
      return window.attivitaProfessionale();
    }
    return (window.ATTIVITA_WEB || []).filter((a) => a.annoProf === 3 || a.annoProf === 4);
  }

  function labelAnno(n) {
    return n === 3 ? "Terza professionale" : "Quarta professionale";
  }

  function dataPubblicazione(valore) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valore || "")) return null;
    const data = new Date(valore + "T00:00:00Z");
    if (Number.isNaN(data.getTime())) return null;
    return {
      iso: valore,
      label: new Intl.DateTimeFormat("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(data),
    };
  }

  function costruisciGriglia() {
    if (!griglia) return;
    const attivita = elenco();
    if (!attivita.length) return;

    griglia.innerHTML = attivita
      .map((a, i) => {
        const anno = a.annoProf;
        const pubblicato = dataPubblicazione(a.pubblicato);
        const bollinoClass = anno === 4 ? " prof-bollino--4" : "";
        const href = "../" + a.url.replace(/^\//, "");
        const copertina = a.copertina ? "../" + a.copertina.replace(/^\//, "") : "";
        const cover = copertina
          ? '<figure class="prof-card-cover"><img src="' +
            esc(copertina) +
            '" alt="" width="1200" height="630" loading="' +
            (i === 0 ? "eager" : "lazy") +
            '"></figure>'
          : "";
        return (
          '<article class="prof-card" data-materia="' +
          esc(a.materia) +
          '" data-anno="' +
          esc(String(anno)) +
          '">' +
          '<a class="prof-card-link" href="' +
          esc(href) +
          '">' +
          '<span class="prof-bollino' +
          bollinoClass +
          '" title="' +
          esc(labelAnno(anno)) +
          '" aria-label="' +
          esc(labelAnno(anno)) +
          '">' +
          esc(String(anno)) +
          "</span>" +
          cover +
          '<div class="prof-card-body">' +
          '<p class="prof-card-meta">' +
          esc(a.materia) +
          " · " +
          esc(labelAnno(anno)) +
          "</p>" +
          (pubblicato
            ? '<p class="prof-card-data">Pubblicato il <time datetime="' +
              esc(pubblicato.iso) +
              '">' +
              esc(pubblicato.label) +
              "</time></p>"
            : "") +
          "<h2>" +
          esc(a.titolo) +
          "</h2>" +
          "<p>" +
          esc(a.descrizione) +
          "</p>" +
          "</div></a></article>"
        );
      })
      .join("");

    costruisciFiltriDaGriglia();
    applicaFiltro("");
  }

  function costruisciFiltriDaGriglia() {
    if (!filtri || !griglia) return;
    const materie = [];
    const viste = new Set();
    griglia.querySelectorAll(".prof-card").forEach((card) => {
      const m = card.dataset.materia;
      if (!m || viste.has(m)) return;
      viste.add(m);
      materie.push(m);
    });
    materie.sort((a, b) => a.localeCompare(b, "it"));

    filtri.innerHTML =
      '<button type="button" class="prof-filtro is-on" data-materia="" aria-pressed="true">Tutte</button>' +
      materie
        .map(
          (m) =>
            '<button type="button" class="prof-filtro" data-materia="' +
            esc(m) +
            '" aria-pressed="false">' +
            esc(m) +
            "</button>"
        )
        .join("");
  }

  function applicaFiltro(materia) {
    if (!griglia) return;
    let visibili = 0;
    griglia.querySelectorAll(".prof-card").forEach((card) => {
      const ok = !materia || card.dataset.materia === materia;
      card.hidden = !ok;
      if (ok) visibili += 1;
    });
    if (esito) {
      if (!materia) {
        esito.textContent =
          visibili === 1 ? "1 lavoro" : visibili + " lavori";
      } else if (visibili === 0) {
        esito.textContent = "Nessun lavoro per «" + materia + "»";
      } else if (visibili === 1) {
        esito.textContent = "1 lavoro · " + materia;
      } else {
        esito.textContent = visibili + " lavori · " + materia;
      }
    }
  }

  if (filtri) {
    filtri.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".prof-filtro");
      if (!btn || !filtri.contains(btn)) return;
      const materia = btn.dataset.materia || "";
      filtri.querySelectorAll(".prof-filtro").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      applicaFiltro(materia);
    });
  }

  if (themeBtn) {
    const salvato = localStorage.getItem(CHIAVE);
    const tema = salvato === "light" || salvato === "dark" ? salvato : "dark";
    root.dataset.theme = tema;
    const aggiorna = () => {
      const light = root.dataset.theme === "light";
      themeBtn.setAttribute("aria-pressed", String(!light));
      themeBtn.textContent = light ? "Tema scuro" : "Tema chiaro";
    };
    aggiorna();
    themeBtn.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(CHIAVE, root.dataset.theme);
      aggiorna();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    costruisciGriglia();
  });
})();

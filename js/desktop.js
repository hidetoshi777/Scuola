(function () {
  const root = document.documentElement;
  const stored = localStorage.getItem("tema-desktop");
  root.dataset.theme = stored === "light" || stored === "dark" ? stored : "dark";

  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    const syncLabel = () => {
      const light = root.dataset.theme === "light";
      toggle.setAttribute("aria-pressed", String(light));
      toggle.textContent = light ? "Tema scuro" : "Tema chiaro";
    };
    syncLabel();
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      localStorage.setItem("tema-desktop", root.dataset.theme);
      syncLabel();
    });
  }

  function renderAttivita() {
    const contenitore = document.querySelector("#griglia-attivita");
    if (!contenitore) return;
    contenitore.innerHTML = window.ATTIVITA_WEB.map((a) => {
      const badge = a.stato === "live" ? '<span class="badge badge-live">Online</span>' : '<span class="badge badge-wip">In lavorazione</span>';
      const extra = (a.extra || [])
        .map((e) => `<a class="link-extra" href="${e.url}">${e.label}</a>`)
        .join("");
      return `
        <article class="card card-attivita">
          <div class="card-top">
            <span class="kicker">${a.materia} · ${a.classe}</span>
            ${badge}
          </div>
          <h3>${a.titolo}</h3>
          <p>${a.descrizione}</p>
          <a class="btn btn-secondary" href="${a.url}">Apri</a>
          ${extra ? `<div class="extra-row">${extra}</div>` : ""}
        </article>`;
    }).join("");
  }

  function contaPerMateria() {
    const conteggi = {};
    window.CANVA.forEach((v) => {
      conteggi[v.materia] = (conteggi[v.materia] || 0) + 1;
    });
    return conteggi;
  }

  function renderChip() {
    const contenitore = document.querySelector("#chip-materie");
    if (!contenitore) return;
    const conteggi = contaPerMateria();
    const totale = window.CANVA.length;
    let html = `<button type="button" class="chip is-active" data-materia="tutte">Tutti <span>${totale}</span></button>`;
    Object.keys(window.MATERIE).forEach((chiave) => {
      const info = window.MATERIE[chiave];
      const n = conteggi[chiave] || 0;
      if (!n) return;
      html += `<button type="button" class="chip" data-materia="${chiave}">${info.icona} ${info.label} <span>${n}</span></button>`;
    });
    contenitore.innerHTML = html;
  }

  function cardCanva(v) {
    const info = window.MATERIE[v.materia];
    const periodo = v.periodo ? `<span class="card-periodo">${v.periodo}</span>` : "";
    return `
      <article class="card card-canva" data-materia="${v.materia}" data-titolo="${v.titolo.toLowerCase()}">
        <div class="card-top">
          <span class="materia-tag">${info.icona} ${info.label}</span>
          <span class="pp-tag">${v.pp} pag.</span>
        </div>
        <h3>${v.titolo}</h3>
        ${periodo}
        <a class="btn btn-canva" href="${canvaLink(v.id)}" target="_blank" rel="noopener">Apri su Canva</a>
      </article>`;
  }

  function renderGriglia(filtroMateria, filtroTesto) {
    const contenitore = document.querySelector("#griglia-canva");
    const contatore = document.querySelector("#contatore-risultati");
    if (!contenitore) return;
    const testo = (filtroTesto || "").trim().toLowerCase();
    const risultati = window.CANVA.filter((v) => {
      const passaMateria = filtroMateria === "tutte" || v.materia === filtroMateria;
      const passaTesto = !testo || v.titolo.toLowerCase().includes(testo);
      return passaMateria && passaTesto;
    });
    contenitore.innerHTML = risultati.length
      ? risultati.map(cardCanva).join("")
      : '<p class="nessun-risultato">Nessun lavoro trovato con questi filtri.</p>';
    if (contatore) {
      contatore.textContent = `${risultati.length} di ${window.CANVA.length} lavori`;
    }
  }

  function collegaFiltri() {
    const barra = document.querySelector("#ricerca-canva");
    const chip = document.querySelector("#chip-materie");
    let materiaAttiva = "tutte";

    const aggiorna = () => renderGriglia(materiaAttiva, barra ? barra.value : "");

    if (chip) {
      chip.addEventListener("click", (ev) => {
        const bottone = ev.target.closest("[data-materia]");
        if (!bottone) return;
        chip.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
        bottone.classList.add("is-active");
        materiaAttiva = bottone.dataset.materia;
        aggiorna();
      });
    }
    if (barra) {
      barra.addEventListener("input", aggiorna);
    }
    aggiorna();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderAttivita();
    renderChip();
    collegaFiltri();
  });
})();

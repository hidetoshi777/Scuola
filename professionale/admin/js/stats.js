(function () {
  if (!window.ProfAdminAuth || !window.ProfAdminAuth.require()) return;

  const lista = document.getElementById("stats-lista");
  const totaleEl = document.getElementById("stats-totale");
  const statoEl = document.getElementById("stats-stato");
  const refreshBtn = document.querySelector("[data-admin-refresh]");

  function esc(t) {
    return String(t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function carica() {
    if (!window.ScuolaAccess) {
      if (statoEl) statoEl.textContent = "Modulo contatore non caricato.";
      return;
    }
    if (statoEl) statoEl.textContent = "Aggiorno i numeri…";
    if (lista) lista.innerHTML = "";

    const pagine = window.ScuolaAccess.catalogoPagine();
    const risultati = await Promise.all(
      pagine.map(async function (p) {
        const views = await window.ScuolaAccess.fetchViews(p.path);
        return { titolo: p.titolo, path: p.path, gruppo: p.gruppo, views: views };
      })
    );

    risultati.sort(function (a, b) {
      return b.views - a.views || a.titolo.localeCompare(b.titolo, "it");
    });

    const totale = risultati.reduce(function (s, r) {
      return s + r.views;
    }, 0);

    if (totaleEl) {
      totaleEl.textContent =
        totale === 1 ? "1 visita in totale" : totale + " visite in totale";
    }

    if (lista) {
      if (!risultati.length) {
        lista.innerHTML = "<li class='admin-empty'>Nessuna pagina in elenco.</li>";
      } else {
        lista.innerHTML = risultati
          .map(function (r) {
            return (
              "<li class='admin-riga'>" +
              "<div class='admin-riga-testo'>" +
              "<strong>" +
              esc(r.titolo) +
              "</strong>" +
              "<span class='admin-meta'>" +
              esc(r.gruppo) +
              " · " +
              esc(r.path) +
              "</span>" +
              "</div>" +
              "<span class='admin-num' aria-label='" +
              esc(String(r.views)) +
              " visite'>" +
              esc(String(r.views)) +
              "</span>" +
              "</li>"
            );
          })
          .join("");
      }
    }

    if (statoEl) {
      const ora = new Date();
      statoEl.textContent =
        "Aggiornato alle " +
        ora.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) +
        " · " +
        risultati.length +
        " pagine";
    }
  }

  if (refreshBtn) refreshBtn.addEventListener("click", carica);
  carica();
})();

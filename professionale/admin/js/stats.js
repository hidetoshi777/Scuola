(function () {
  if (!window.ProfAdminAuth || !window.ProfAdminAuth.require()) return;

  const lista = document.getElementById("stats-lista");
  const totaleEl = document.getElementById("stats-totale");
  const totale24El = document.getElementById("stats-totale-24h");
  const lastEl = document.getElementById("stats-ultima");
  const statoEl = document.getElementById("stats-stato");
  const refreshBtn = document.querySelector("[data-admin-refresh]");

  function esc(t) {
    return String(t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatQuando(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("it-IT", {
      timeZone: (window.ScuolaAccess && window.ScuolaAccess.TZ) || "Europe/Rome",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function carica() {
    if (!window.ScuolaAccess) {
      if (statoEl) statoEl.textContent = "Modulo contatore non caricato.";
      return;
    }
    if (statoEl) statoEl.textContent = "Aggiorno i numeri…";
    if (lista) lista.innerHTML = "";
    if (refreshBtn) refreshBtn.disabled = true;

    try {
      const pagine = window.ScuolaAccess.catalogoPagine();
      const [risultati, lastOverall] = await Promise.all([
        Promise.all(
          pagine.map(async function (p) {
            const [views, views24h, lastSeen] = await Promise.all([
              window.ScuolaAccess.fetchViews(p.path),
              window.ScuolaAccess.fetchViews24h(p.path),
              window.ScuolaAccess.fetchLastSeen(p.path),
            ]);
            return {
              titolo: p.titolo,
              path: p.path,
              gruppo: p.gruppo,
              views: views,
              views24h: views24h,
              lastSeen: lastSeen,
            };
          })
        ),
        window.ScuolaAccess.fetchLastSeenOverall(),
      ]);

      risultati.sort(function (a, b) {
      return (
        b.views24h - a.views24h ||
        b.views - a.views ||
        a.titolo.localeCompare(b.titolo, "it")
      );
    });

      const totale = risultati.reduce(function (s, r) {
      return s + r.views;
    }, 0);
      const totale24 = risultati.reduce(function (s, r) {
      return s + r.views24h;
    }, 0);

      if (totaleEl) {
      totaleEl.textContent =
        totale === 1 ? "1 visita in totale" : totale + " visite in totale";
    }
      if (totale24El) {
      totale24El.textContent =
        totale24 === 1
          ? "1 visita nelle ultime 24 ore"
          : totale24 + " visite nelle ultime 24 ore";
    }
      if (lastEl) {
      lastEl.textContent = "Ultima visita (sito): " + formatQuando(lastOverall);
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
              "<span class='admin-meta'>Ultima visita: " +
              esc(formatQuando(r.lastSeen)) +
              "</span>" +
              "</div>" +
              "<div class='admin-nums'>" +
              "<span class='admin-num' title='Ultime 24 ore'>" +
              "<span class='admin-num-label'>24h</span>" +
              esc(String(r.views24h)) +
              "</span>" +
              "<span class='admin-num admin-num--muted' title='Totale'>" +
              "<span class='admin-num-label'>tot</span>" +
              esc(String(r.views)) +
              "</span>" +
              "</div>" +
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
          " pagine · fasce orarie Europe/Rome";
      }
    } catch (error) {
      if (statoEl) {
        statoEl.textContent = "Il servizio statistiche non risponde. Riprova tra poco.";
      }
      if (lista) {
        lista.innerHTML = "<li class='admin-empty'>Numeri temporaneamente non disponibili.</li>";
      }
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  if (refreshBtn) refreshBtn.addEventListener("click", carica);
  carica();
})();

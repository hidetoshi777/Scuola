(function () {
  if (!window.ProfAdminAuth || !window.ProfAdminAuth.require()) return;

  const segnaleEl = document.getElementById("stats-segnale");
  const ultimaEl = document.getElementById("stats-ultima");
  const paginaEl = document.getElementById("stats-pagina");
  const statoEl = document.getElementById("stats-stato");
  const refreshBtn = document.querySelector("[data-admin-refresh]");
  const DAY_MS = 24 * 60 * 60 * 1000;

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

  function entro24ore(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    return Date.now() - d.getTime() <= DAY_MS;
  }

  function titoloDaPath(path) {
    if (!path || !window.ScuolaAccess) return null;
    const normalizzato = window.ScuolaAccess.normalizePath(path);
    const catalogo =
      typeof window.ScuolaAccess.catalogoPagine === "function"
        ? window.ScuolaAccess.catalogoPagine()
        : [];
    for (let i = 0; i < catalogo.length; i += 1) {
      if (catalogo[i].path === normalizzato) return catalogo[i].titolo;
    }
    const lista = window.ATTIVITA_WEB || [];
    for (let j = 0; j < lista.length; j += 1) {
      const a = lista[j];
      const base = String(a.url || "")
        .replace(/^\//, "")
        .replace(/\/$/, "");
      if (!base) continue;
      if (window.ScuolaAccess.normalizePath("/Scuola/" + base) === normalizzato) {
        return a.titolo || base;
      }
      const extras = a.extra || [];
      for (let k = 0; k < extras.length; k += 1) {
        const u = String(extras[k].url || "").replace(/^\//, "");
        if (!u) continue;
        if (window.ScuolaAccess.normalizePath("/Scuola/" + u) === normalizzato) {
          return (a.titolo || base) + " · " + (extras[k].label || u);
        }
      }
    }
    return normalizzato
      .replace(/^\/Scuola\//, "")
      .replace(/\//g, " · ");
  }

  async function carica() {
    if (!window.ScuolaAccess || typeof window.ScuolaAccess.fetchLastSeenOverall !== "function") {
      if (statoEl) statoEl.textContent = "Modulo contatore non caricato.";
      return;
    }
    if (statoEl) statoEl.textContent = "Controllo…";
    if (refreshBtn) refreshBtn.disabled = true;
    if (segnaleEl) {
      segnaleEl.textContent = "—";
      segnaleEl.dataset.stato = "attesa";
    }

    try {
      const lastOverall = await window.ScuolaAccess.fetchLastSeenOverall();
      const at = lastOverall && lastOverall.at;
      const path = lastOverall && lastOverall.path;
      const presente = !!at && entro24ore(at);
      const titolo = titoloDaPath(path);

      if (segnaleEl) {
        if (!at) {
          segnaleEl.textContent = "Nessuna visita registrata ancora";
          segnaleEl.dataset.stato = "no";
        } else if (presente) {
          segnaleEl.textContent = "Sì — qualcuno è entrato nelle ultime 24 ore";
          segnaleEl.dataset.stato = "si";
        } else {
          segnaleEl.textContent = "No — nessuna visita nelle ultime 24 ore";
          segnaleEl.dataset.stato = "no";
        }
      }

      if (ultimaEl) {
        ultimaEl.textContent = at
          ? "Ultima visita: " + formatQuando(at)
          : "Ultima visita: —";
      }

      if (paginaEl) {
        if (titolo) {
          paginaEl.textContent = "Pagina: " + titolo;
          paginaEl.hidden = false;
        } else if (at) {
          paginaEl.textContent =
            "Pagina: non ancora nota (si aggiorna dalla prossima visita)";
          paginaEl.hidden = false;
        } else {
          paginaEl.textContent = "";
          paginaEl.hidden = true;
        }
      }

      if (statoEl) {
        const ora = new Date();
        statoEl.textContent =
          "Aggiornato alle " +
          ora.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) +
          " · un solo controllo remoto";
      }
    } catch (error) {
      if (segnaleEl) {
        segnaleEl.textContent = "Controllo non riuscito";
        segnaleEl.dataset.stato = "errore";
      }
      if (ultimaEl) ultimaEl.textContent = "Ultima visita: —";
      if (paginaEl) {
        paginaEl.textContent = "";
        paginaEl.hidden = true;
      }
      if (statoEl) {
        statoEl.textContent = "Il servizio non risponde. Riprova tra poco.";
      }
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  if (refreshBtn) refreshBtn.addEventListener("click", carica);
  carica();
})();

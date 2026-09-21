(function () {
  if (!window.ProfAdminAuth || !window.ProfAdminAuth.require()) return;

  const segnaleEl = document.getElementById("stats-segnale");
  const ultimaEl = document.getElementById("stats-ultima");
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
      const presente = !!lastOverall && entro24ore(lastOverall);

      if (segnaleEl) {
        if (!lastOverall) {
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
        ultimaEl.textContent = lastOverall
          ? "Ultima visita (sito): " + formatQuando(lastOverall)
          : "Ultima visita (sito): —";
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
      if (ultimaEl) ultimaEl.textContent = "Ultima visita (sito): —";
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

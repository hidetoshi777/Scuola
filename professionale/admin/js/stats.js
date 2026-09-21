(function () {
  if (!window.ProfAdminAuth || !window.ProfAdminAuth.require()) return;

  const lista = document.getElementById("stats-lista");
  const totaleEl = document.getElementById("stats-totale");
  const totale24El = document.getElementById("stats-totale-24h");
  const lastEl = document.getElementById("stats-ultima");
  const statoEl = document.getElementById("stats-stato");
  const refreshBtn = document.querySelector("[data-admin-refresh]");
  const PAGE_BATCH = 3;

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

  function valoreNumero(value) {
    return Number.isFinite(value) ? value : null;
  }

  function testoTotale(valori, periodo) {
    const noti = valori.filter(function (n) {
      return Number.isFinite(n);
    });
    if (!noti.length) {
      return periodo === "in totale"
        ? "Totale visite non disponibile"
        : "Visite nelle ultime 24 ore non disponibili";
    }
    const totale = noti.reduce(function (sum, n) {
      return sum + n;
    }, 0);
    const mancanti = valori.length - noti.length;
    if (mancanti) {
      return totale + "+ visite " + periodo + " · " + mancanti + " ancora in carico";
    }
    if (periodo === "in totale") {
      return totale === 1 ? "1 visita in totale" : totale + " visite in totale";
    }
    return totale === 1
      ? "1 visita nelle ultime 24 ore"
      : totale + " visite nelle ultime 24 ore";
  }

  function mapInBatches(items, batchSize, mapper, onProgress) {
    const out = [];
    let index = 0;

    function next() {
      if (index >= items.length) return Promise.resolve(out);
      const slice = items.slice(index, index + batchSize);
      index += batchSize;
      if (onProgress) onProgress(Math.min(index, items.length), items.length);
      return Promise.all(slice.map(mapper)).then(function (part) {
        out.push.apply(out, part);
        return next();
      });
    }

    return next();
  }

  function renderLista(risultati) {
    if (!lista) return;
    if (!risultati.length) {
      lista.innerHTML = "<li class='admin-empty'>Nessuna pagina in elenco.</li>";
      return;
    }
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
          esc(r.views24h === null ? "—" : String(r.views24h)) +
          "</span>" +
          "<span class='admin-num admin-num--muted' title='Totale'>" +
          "<span class='admin-num-label'>tot</span>" +
          esc(r.views === null ? "—" : String(r.views)) +
          "</span>" +
          "</div>" +
          "</li>"
        );
      })
      .join("");
  }

  function aggiornaRiepilogo(risultati, lastOverall) {
    const valoriTotali = risultati.map(function (r) {
      return r.views;
    });
    const valori24h = risultati.map(function (r) {
      return r.views24h;
    });
    if (totaleEl) totaleEl.textContent = testoTotale(valoriTotali, "in totale");
    if (totale24El) totale24El.textContent = testoTotale(valori24h, "nelle ultime 24 ore");
    if (lastEl) {
      lastEl.textContent = "Ultima visita (sito): " + formatQuando(lastOverall);
    }
  }

  async function carica() {
    if (!window.ScuolaAccess) {
      if (statoEl) statoEl.textContent = "Modulo contatore non caricato.";
      return;
    }
    if (statoEl) statoEl.textContent = "Aggiorno i numeri (poc’a poco, per non sovraccaricare il servizio)…";
    if (lista) lista.innerHTML = "";
    if (refreshBtn) refreshBtn.disabled = true;

    try {
      const pagine = window.ScuolaAccess.catalogoPagine();
      const lastOverallPromise = window.ScuolaAccess.fetchLastSeenOverall();

      const risultati = await mapInBatches(
        pagine,
        PAGE_BATCH,
        async function (p) {
          const [views, views24h, lastSeen] = await Promise.all([
            window.ScuolaAccess.fetchViews(p.path),
            window.ScuolaAccess.fetchViews24h(p.path),
            window.ScuolaAccess.fetchLastSeen(p.path),
          ]);
          return {
            titolo: p.titolo,
            path: p.path,
            gruppo: p.gruppo,
            views: valoreNumero(views),
            views24h: valoreNumero(views24h),
            lastSeen: lastSeen,
          };
        },
        function (fatti, totale) {
          if (statoEl) {
            statoEl.textContent =
              "Carico " + fatti + " / " + totale + " pagine…";
          }
        }
      );

      const lastOverall = await lastOverallPromise;

      risultati.sort(function (a, b) {
        return (
          (b.views24h === null ? -1 : b.views24h) -
            (a.views24h === null ? -1 : a.views24h) ||
          (b.views === null ? -1 : b.views) -
            (a.views === null ? -1 : a.views) ||
          a.titolo.localeCompare(b.titolo, "it")
        );
      });

      aggiornaRiepilogo(risultati, lastOverall);
      renderLista(risultati);

      if (statoEl) {
        const ora = new Date();
        const mancanti = risultati.filter(function (r) {
          return r.views === null || r.views24h === null;
        }).length;
        if (mancanti) {
          statoEl.textContent =
            "Aggiornato alle " +
            ora.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) +
            " · " +
            mancanti +
            " pagine ancora incomplete (il servizio esterno ha saltato qualche risposta). Premi Aggiorna.";
        } else {
          statoEl.textContent =
            "Aggiornato alle " +
            ora.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) +
            " · " +
            risultati.length +
            " pagine · fasce orarie Europe/Rome";
        }
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

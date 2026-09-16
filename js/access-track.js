/**
 * Contatore visite (remoto) per il raccoglitore professionale.
 * Backend: Page Views API (https://page-views-api.ratneshc.com) — gratis, senza account.
 * Le visite restano sul server remoto (non solo localStorage) e si vedono da admin/.
 */
(function () {
  const API = "https://page-views-api.ratneshc.com/api/v1";
  const SITE = "hidetoshi777.github.io";
  const REPO_BASE = "/Scuola";
  const SKIP_RE = /\/professionale\/admin(\/|$)/i;

  function normalizePath(pathname) {
    let p = String(pathname || "/").split("?")[0].split("#")[0];
    p = p.replace(/\/index\.html$/i, "/");
    p = p.replace(/\/{2,}/g, "/");
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    if (!p) p = "/";
    if (p === REPO_BASE || p.indexOf(REPO_BASE + "/") === 0) return p;
    if (p === "/") return REPO_BASE;
    return REPO_BASE + (p.charAt(0) === "/" ? p : "/" + p);
  }

  function trackPath(path) {
    const p = normalizePath(path);
    if (SKIP_RE.test(p)) return Promise.resolve(null);
    const url =
      API +
      "/track?site=" +
      encodeURIComponent(SITE) +
      "&path=" +
      encodeURIComponent(p);
    return fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      keepalive: true,
      cache: "no-store",
    }).catch(function () {
      return null;
    });
  }

  function fetchViews(path) {
    const p = normalizePath(path);
    const url =
      API +
      "/views?site=" +
      encodeURIComponent(SITE) +
      "&path=" +
      encodeURIComponent(p);
    return fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
    })
      .then(function (r) {
        return r.ok ? r.json() : { views: 0 };
      })
      .then(function (data) {
        return Number(data && data.views) || 0;
      })
      .catch(function () {
        return 0;
      });
  }

  /** Pagine da mostrare nel pannello admin (hub + attività con annoProf). */
  function catalogoPagine() {
    const items = [
      {
        id: "hub",
        titolo: "Raccoglitore professionale",
        path: REPO_BASE + "/professionale",
        gruppo: "Hub",
      },
    ];
    const lista =
      typeof window.attivitaProfessionale === "function"
        ? window.attivitaProfessionale()
        : (window.ATTIVITA_WEB || []).filter(function (a) {
            return a.annoProf === 3 || a.annoProf === 4;
          });

    lista.forEach(function (a) {
      const base = String(a.url || "").replace(/^\//, "").replace(/\/$/, "");
      if (!base) return;
      items.push({
        id: base,
        titolo: a.titolo || base,
        path: REPO_BASE + "/" + base,
        gruppo: (a.materia || "Attività") + (a.annoProf ? " · " + a.annoProf + "ª" : ""),
      });
      (a.extra || []).forEach(function (ex) {
        const u = String(ex.url || "").replace(/^\//, "").replace(/\/$/, "");
        if (!u) return;
        items.push({
          id: u,
          titolo: (a.titolo || base) + " · " + (ex.label || u),
          path: REPO_BASE + "/" + u.replace(/\.html$/i, "").replace(/\/$/, ""),
          pathRaw: REPO_BASE + "/" + u,
          gruppo: a.materia || "Attività",
        });
      });
    });

    // Dedup by path (prefer pathRaw for .html extras)
    const seen = new Set();
    return items
      .map(function (it) {
        const path = normalizePath(it.pathRaw || it.path);
        return {
          id: it.id,
          titolo: it.titolo,
          path: path,
          gruppo: it.gruppo,
        };
      })
      .filter(function (it) {
        if (seen.has(it.path)) return false;
        seen.add(it.path);
        return true;
      });
  }

  window.ScuolaAccess = {
    SITE: SITE,
    REPO_BASE: REPO_BASE,
    normalizePath: normalizePath,
    trackPath: trackPath,
    fetchViews: fetchViews,
    catalogoPagine: catalogoPagine,
    trackHere: function () {
      return trackPath(location.pathname);
    },
  };

  // Auto-track (salta admin)
  if (!SKIP_RE.test(normalizePath(location.pathname))) {
    if (document.readyState === "complete") {
      trackPath(location.pathname);
    } else {
      window.addEventListener("load", function () {
        trackPath(location.pathname);
      });
    }
  }
})();

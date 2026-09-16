/**
 * Contatore visite (remoto) per il raccoglitore professionale.
 *
 * - Totali: Page Views API (https://page-views-api.ratneshc.com) — gratis, senza account.
 * - Ultime 24 ore: stessi contatori, con bucket orari Europe/Rome (`…/__h/YYYYMMDDHH`).
 * - Ultima visita: timestamp ISO su keyval.org (remoto, cross-device; chiave pubblica ma opaca).
 *
 * L’API Page Views non espone timestamp né breakdown giornaliero nativo.
 */
(function () {
  const API = "https://page-views-api.ratneshc.com/api/v1";
  const SITE = "hidetoshi777.github.io";
  const REPO_BASE = "/Scuola";
  const SKIP_RE = /\/professionale\/admin(\/|$)/i;
  const KEYVAL = "https://api.keyval.org";
  const TZ = "Europe/Rome";

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

  function romeParts(date) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    });
    const parts = {};
    fmt.formatToParts(date).forEach(function (p) {
      if (p.type !== "literal") parts[p.type] = p.value;
    });
    return parts;
  }

  /** Chiave oraria Europe/Rome: YYYYMMDDHH */
  function hourStamp(date) {
    const p = romeParts(date || new Date());
    return p.year + p.month + p.day + p.hour;
  }

  function hourPath(pagePath, date) {
    return normalizePath(pagePath) + "/__h/" + hourStamp(date);
  }

  function last24HourStamps(now) {
    const stamps = [];
    const base = now ? new Date(now.getTime()) : new Date();
    for (let i = 0; i < 24; i += 1) {
      stamps.push(hourStamp(new Date(base.getTime() - i * 60 * 60 * 1000)));
    }
    return stamps;
  }

  function lastSeenKey(pagePath) {
    const slug = normalizePath(pagePath)
      .replace(/^\//, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return ("scuola-v1-ls-" + (slug || "root")).slice(0, 100);
  }

  const LAST_SEEN_OVERALL_KEY = "scuola-v1-ls-overall";

  function trackUrl(path) {
    return (
      API +
      "/track?site=" +
      encodeURIComponent(SITE) +
      "&path=" +
      encodeURIComponent(path)
    );
  }

  function viewsUrl(path) {
    return (
      API +
      "/views?site=" +
      encodeURIComponent(SITE) +
      "&path=" +
      encodeURIComponent(path)
    );
  }

  function ping(url) {
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
    return fetch(viewsUrl(p), {
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

  function fetchViews24h(path) {
    const base = normalizePath(path);
    const stamps = last24HourStamps(new Date());
    return Promise.all(
      stamps.map(function (stamp) {
        return fetchViews(base + "/__h/" + stamp);
      })
    ).then(function (counts) {
      return counts.reduce(function (sum, n) {
        return sum + n;
      }, 0);
    });
  }

  function readKeyval(key) {
    return fetch(KEYVAL + "/get/" + encodeURIComponent(key), {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (!data || data.status !== "SUCCESS" || !data.val) return null;
        return String(data.val);
      })
      .catch(function () {
        return null;
      });
  }

  function writeKeyval(key, value) {
    const url =
      KEYVAL +
      "/set/" +
      encodeURIComponent(key) +
      "/" +
      encodeURIComponent(String(value).slice(0, 300));
    return ping(url);
  }

  function fetchLastSeen(path) {
    return readKeyval(lastSeenKey(path));
  }

  function fetchLastSeenOverall() {
    return readKeyval(LAST_SEEN_OVERALL_KEY);
  }

  function recordLastSeen(path) {
    const iso = new Date().toISOString();
    return Promise.all([
      writeKeyval(lastSeenKey(path), iso),
      writeKeyval(LAST_SEEN_OVERALL_KEY, iso),
    ]);
  }

  function trackPath(path) {
    const p = normalizePath(path);
    if (SKIP_RE.test(p)) return Promise.resolve(null);
    const hour = hourPath(p, new Date());
    return Promise.all([ping(trackUrl(p)), ping(trackUrl(hour)), recordLastSeen(p)]);
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
    TZ: TZ,
    normalizePath: normalizePath,
    trackPath: trackPath,
    fetchViews: fetchViews,
    fetchViews24h: fetchViews24h,
    fetchLastSeen: fetchLastSeen,
    fetchLastSeenOverall: fetchLastSeenOverall,
    catalogoPagine: catalogoPagine,
    trackHere: function () {
      return trackPath(location.pathname);
    },
  };

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

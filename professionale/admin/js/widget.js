(function () {
  const widgetEl = document.querySelector(".school-clock");
  const tempEl = document.getElementById("w-temp");
  const condEl = document.getElementById("w-cond");
  const detEl = document.getElementById("w-det");
  const dataEl = document.getElementById("w-data");
  if (!widgetEl || !tempEl) return;

  // Stile scelto nell'app Android (?stile=...): stessi disegni del widget nativo.
  // scontornato = l'edificio cambia, il cielo animato resta; intera = scena con sfondo proprio.
  const STILI = {
    acquerello: { tipo: "scontornato" },
    mattoncini: { tipo: "scontornato" },
    progetto: { tipo: "intera", contrasto: 1.45, notturna: false, fondo: "#0a3173" },
    cyberpunk: { tipo: "intera", contrasto: 1, notturna: true, fondo: "#08081a" },
  };
  const nomeStile = new URLSearchParams(location.search).get("stile");
  const stile = STILI[nomeStile] || null;
  if (stile) {
    widgetEl.dataset.stile = nomeStile;
    const src = "img/stili/" + nomeStile + ".webp?v=1";
    if (stile.tipo === "scontornato") {
      widgetEl.querySelector(".school-clock__scene img").src = src;
    } else {
      widgetEl.dataset.scena = "intera";
      widgetEl.style.setProperty("--scena-img", 'url("' + src + '")');
      widgetEl.style.setProperty("--scena-fondo", stile.fondo);
    }
  }

  // Come nel widget nativo: contrasto dello stile, poi la luce della sera e il buio della notte
  function filtroScena(period) {
    if (!stile || stile.tipo !== "intera") return;
    const parti = [];
    if (stile.contrasto !== 1) parti.push("contrast(" + stile.contrasto + ")");
    if (!stile.notturna && period === "sera") parti.push("brightness(0.85) sepia(0.15)");
    if (!stile.notturna && period === "notte") parti.push("brightness(0.65) saturate(0.85)");
    widgetEl.style.setProperty("--scena-filtro", parti.length ? parti.join(" ") : "none");
  }

  const zone = "Europe/Rome";
  const weatherUrl =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=37.61&longitude=15.16" +
    "&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m" +
    "&daily=temperature_2m_max,temperature_2m_min" +
    "&timezone=Europe%2FRome&forecast_days=1";
  const cacheKey = "scuola-meteo-meucci-widget-v1";
  const hourFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", hourCycle: "h23" });
  const dateFormatter = new Intl.DateTimeFormat("it-IT", { timeZone: zone, weekday: "long", day: "numeric", month: "long" });
  const hmFormatter = new Intl.DateTimeFormat("it-IT", { timeZone: zone, hour: "2-digit", minute: "2-digit" });

  // Stesse fasce e stesse categorie del widget in stats.html (js/school-clock.js)
  function periodFor(hour) {
    if (hour >= 5 && hour < 12) return "mattina";
    if (hour >= 12 && hour < 18) return "giorno";
    if (hour >= 18 && hour < 21) return "sera";
    return "notte";
  }

  function weatherFor(code) {
    if (code === 0) return { id: "sereno", label: "Sereno" };
    if (code === 1 || code === 2) return { id: "variabile", label: "Poco nuvoloso" };
    if (code === 3) return { id: "nuvoloso", label: "Nuvoloso" };
    if (code === 45 || code === 48) return { id: "nebbia", label: "Nebbia" };
    if (code >= 51 && code <= 57) return { id: "pioggia", label: "Pioviggine" };
    if (code >= 61 && code <= 67) return { id: "pioggia", label: "Pioggia" };
    if (code >= 71 && code <= 77) return { id: "neve", label: "Neve" };
    if (code >= 80 && code <= 82) return { id: "pioggia", label: "Rovesci" };
    if (code >= 85 && code <= 86) return { id: "neve", label: "Rovesci di neve" };
    if (code >= 95) return { id: "temporale", label: "Temporale" };
    return { id: "variabile", label: "Meteo variabile" };
  }

  function render(payload) {
    const cur = payload && payload.current;
    if (!cur || !Number.isFinite(cur.temperature_2m)) return false;
    const weather = weatherFor(Number(cur.weather_code));
    const wind = Math.round(Number(cur.wind_speed_10m) || 0);
    const gusts = Math.round(Number(cur.wind_gusts_10m) || 0);
    widgetEl.dataset.weather = weather.id;
    widgetEl.dataset.windy = wind >= 20 || gusts >= 35 ? "true" : "false";
    tempEl.textContent = Math.round(cur.temperature_2m) + "°";
    condEl.textContent = weather.label;
    const d = payload.daily;
    const minmax = d && d.temperature_2m_min
      ? "min " + Math.round(d.temperature_2m_min[0]) + "° · max " + Math.round(d.temperature_2m_max[0]) + "° · "
      : "";
    detEl.textContent = minmax + "vento " + wind + " km/h";
    return true;
  }

  function stamp(now, cached) {
    dataEl.textContent = dateFormatter.format(now) + " · agg. " + hmFormatter.format(now) + (cached ? " (ultimo dato)" : "");
  }

  async function update() {
    const now = new Date();
    widgetEl.dataset.period = periodFor(Number(hourFormatter.format(now)));
    filtroScena(widgetEl.dataset.period);
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 8000);
    try {
      const response = await fetch(weatherUrl, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error("Meteo non disponibile");
      const payload = await response.json();
      if (!render(payload)) throw new Error("Dati meteo incompleti");
      stamp(now, false);
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), payload: payload }));
      } catch (error) {
        // senza cache il widget funziona lo stesso
      }
    } catch (error) {
      let cached = null;
      try {
        cached = JSON.parse(localStorage.getItem(cacheKey));
      } catch (e) {
        cached = null;
      }
      if (cached && Date.now() - cached.savedAt < 6 * 3600 * 1000 && render(cached.payload)) {
        stamp(new Date(cached.savedAt), true);
      } else {
        condEl.textContent = "Meteo non disponibile";
        stamp(now, false);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  update();
  // Se l'app tiene la pagina aperta invece di fotografarla, si aggiorna da sola
  setInterval(update, 10 * 60 * 1000);
})();

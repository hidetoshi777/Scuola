(function () {
  const timeEl = document.getElementById("school-clock-time");
  const dateEl = document.getElementById("school-clock-date");
  const weatherEl = document.getElementById("school-clock-weather");
  const widgetEl = document.querySelector(".school-clock");
  if (!timeEl || !dateEl || !weatherEl || !widgetEl) return;

  const zone = "Europe/Rome";
  const weatherUrl =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=37.61&longitude=15.16" +
    "&current=temperature_2m,apparent_temperature,weather_code,is_day,precipitation,wind_speed_10m,wind_gusts_10m" +
    "&timezone=Europe%2FRome";
  const weatherCacheKey = "scuola-meteo-meucci-v1";
  let currentPeriod = "";
  let currentWeatherLabel = "";
  const timeFormatter = new Intl.DateTimeFormat("it-IT", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const dateFormatter = new Intl.DateTimeFormat("it-IT", {
    timeZone: zone,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    hourCycle: "h23",
  });

  function periodFor(hour) {
    if (hour >= 5 && hour < 12) {
      return { id: "mattina", label: "Mattina" };
    }
    if (hour >= 12 && hour < 18) {
      return { id: "giorno", label: "Giorno" };
    }
    if (hour >= 18 && hour < 21) {
      return { id: "sera", label: "Sera" };
    }
    return { id: "notte", label: "Notte" };
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

  function updateAccessibleLabel() {
    let label = "Ora locale del plesso Meucci";
    if (currentPeriod) label += " · " + currentPeriod;
    if (currentWeatherLabel) label += " · " + currentWeatherLabel;
    widgetEl.setAttribute("aria-label", label);
  }

  function renderWeather(data, cached) {
    if (!data || !Number.isFinite(data.temperature_2m)) return false;
    const weather = weatherFor(Number(data.weather_code));
    const temperature = Math.round(data.temperature_2m);
    const wind = Math.round(Number(data.wind_speed_10m) || 0);
    const gusts = Math.round(Number(data.wind_gusts_10m) || 0);
    const windy = wind >= 20 || gusts >= 35;

    widgetEl.dataset.weather = weather.id;
    widgetEl.dataset.windy = windy ? "true" : "false";
    currentWeatherLabel = weather.label + ", " + temperature + " gradi";
    weatherEl.textContent =
      temperature + " °C · " + weather.label + " · vento " + wind + " km/h" +
      (cached ? " · ultimo dato" : "");
    updateAccessibleLabel();
    return true;
  }

  function readCachedWeather() {
    try {
      const cached = JSON.parse(localStorage.getItem(weatherCacheKey));
      if (!cached || !cached.savedAt || !cached.current) return null;
      if (Date.now() - cached.savedAt > 6 * 60 * 60 * 1000) return null;
      return cached.current;
    } catch (error) {
      return null;
    }
  }

  async function updateWeather() {
    const controller = new AbortController();
    const timeout = window.setTimeout(function () {
      controller.abort();
    }, 8000);

    try {
      const response = await fetch(weatherUrl, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Meteo non disponibile");
      const payload = await response.json();
      if (!renderWeather(payload.current, false)) throw new Error("Dati meteo incompleti");
      try {
        localStorage.setItem(
          weatherCacheKey,
          JSON.stringify({ savedAt: Date.now(), current: payload.current })
        );
      } catch (error) {
        // Il meteo resta utilizzabile anche se la cache del browser è disattivata.
      }
    } catch (error) {
      const cached = readCachedWeather();
      if (!renderWeather(cached, true)) {
        weatherEl.textContent = "Meteo non disponibile · riprovo tra poco";
        delete widgetEl.dataset.weather;
        delete widgetEl.dataset.windy;
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function updateClock() {
    const now = new Date();
    timeEl.textContent = timeFormatter.format(now);
    timeEl.dateTime = now.toISOString();
    dateEl.textContent = dateFormatter.format(now) + " · Europe/Rome";
    const hour = Number(hourFormatter.format(now));
    const period = periodFor(hour);
    if (widgetEl.dataset.period !== period.id) {
      widgetEl.dataset.period = period.id;
      currentPeriod = period.label;
      updateAccessibleLabel();
    }
  }

  updateClock();
  updateWeather();
  window.setInterval(updateClock, 1000);
  window.setInterval(updateWeather, 15 * 60 * 1000);
})();

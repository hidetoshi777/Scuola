(function () {
  const timeEl = document.getElementById("school-clock-time");
  const dateEl = document.getElementById("school-clock-date");
  const periodEl = document.getElementById("school-clock-period");
  const widgetEl = document.querySelector(".school-clock");
  if (!timeEl || !dateEl || !periodEl || !widgetEl) return;

  const zone = "Europe/Rome";
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
    if (hour >= 5 && hour < 9) {
      return { id: "mattina-presto", label: "Mattina presto", icon: "◜" };
    }
    if (hour >= 9 && hour < 14) {
      return { id: "mezzogiorno", label: "Mezzogiorno", icon: "☀" };
    }
    if (hour >= 14 && hour < 18) {
      return { id: "pomeriggio", label: "Pomeriggio", icon: "◒" };
    }
    if (hour >= 18 && hour < 22) {
      return { id: "sera", label: "Sera", icon: "◝" };
    }
    return { id: "notte", label: "Notte", icon: "☾" };
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
      periodEl.textContent = period.icon + " " + period.label;
      widgetEl.setAttribute(
        "aria-label",
        "Ora locale del plesso Meucci · " + period.label
      );
    }
  }

  updateClock();
  window.setInterval(updateClock, 1000);
})();

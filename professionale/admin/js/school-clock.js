(function () {
  const timeEl = document.getElementById("school-clock-time");
  const dateEl = document.getElementById("school-clock-date");
  if (!timeEl || !dateEl) return;

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

  function updateClock() {
    const now = new Date();
    timeEl.textContent = timeFormatter.format(now);
    timeEl.dateTime = now.toISOString();
    dateEl.textContent = dateFormatter.format(now) + " · Europe/Rome";
  }

  updateClock();
  window.setInterval(updateClock, 1000);
})();

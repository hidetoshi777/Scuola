document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("globo-lezione");
  const stato = document.getElementById("stato-roma");
  const asse = document.getElementById("asse");
  const inclinazione = document.getElementById("inclinazione");
  if (!canvas || !window.Terra) {
    return;
  }

  const globe = Terra.create(canvas, {
    autoRotate: true,
    speed: 0.2,
    showAxis: true,
    highlight: "roma",
    onChange(info) {
      const roma = info.cities.find((city) => city.id === "roma");
      if (!roma || !stato) {
        return;
      }
      stato.textContent = roma.day
        ? `A Roma, in questo momento simulato, è giorno (${Terra.formatHour(roma.hour)}).`
        : `A Roma, in questo momento simulato, è notte (${Terra.formatHour(roma.hour)}).`;
    },
  });

  asse?.addEventListener("change", () => globe.setAxis(asse.checked));
  inclinazione?.addEventListener("change", () => globe.setTilt(inclinazione.checked));
});

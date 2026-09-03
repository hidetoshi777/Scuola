document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("globo-lab");
  const lista = document.getElementById("lista-citta");
  const oraRoma = document.getElementById("ora-roma");
  const ora = document.getElementById("ora");
  const pausa = document.getElementById("pausa");
  const velocita = document.getElementById("velocita");
  const citta = document.getElementById("citta");
  const spiegazione = document.getElementById("spiegazione");
  if (!canvas || !window.Terra) {
    return;
  }

  let updatingSlider = false;

  const globe = Terra.create(canvas, {
    autoRotate: true,
    speed: Number(velocita.value),
    highlight: "roma",
    onChange(info) {
      render(info);
    },
  });

  function render(info) {
    const roma = info.cities.find((city) => city.id === "roma");
    if (roma && oraRoma) {
      oraRoma.textContent = Terra.formatHour(roma.hour);
    }
    if (ora && roma && !updatingSlider) {
      ora.value = String(Math.round(roma.hour * 4) / 4);
    }
    if (lista) {
      lista.replaceChildren(
        ...info.cities.map((city) => {
          const li = document.createElement("li");
          const name = document.createElement("span");
          name.textContent = city.name;
          const meta = document.createElement("span");
          const badge = document.createElement("span");
          badge.className = city.day ? "badge badge-day" : "badge badge-night";
          badge.textContent = city.day ? "Giorno" : "Notte";
          meta.append(Terra.formatHour(city.hour), " ", badge);
          li.append(name, meta);
          return li;
        }),
      );
    }
    const focus = info.cities.find((city) => city.id === (citta?.value || "roma"));
    if (focus && spiegazione) {
      spiegazione.textContent = focus.day
        ? `${focus.name} è nella metà illuminata dal Sole: lì è giorno.`
        : `${focus.name} è nella metà in ombra: lì è notte.`;
    }
  }

  pausa?.addEventListener("change", () => {
    globe.setAutoRotate(!pausa.checked);
  });
  velocita?.addEventListener("input", () => {
    globe.setSpeed(Number(velocita.value));
  });
  citta?.addEventListener("change", () => {
    globe.setHighlight(citta.value);
    render(globe.snapshot());
  });
  ora?.addEventListener("input", () => {
    updatingSlider = true;
    pausa.checked = true;
    globe.setAutoRotate(false);
    const targetHour = Number(ora.value);
    const roma = Terra.CITIES.find((city) => city.id === "roma");
    let best = 0;
    let bestDiff = 24;
    for (let step = 0; step < 360; step += 1) {
      const rot = (step * Math.PI) / 180;
      const hour = Terra.solarHour(roma.lat, roma.lon, rot);
      const diff = Math.min(Math.abs(hour - targetHour), 24 - Math.abs(hour - targetHour));
      if (diff < bestDiff) {
        bestDiff = diff;
        best = rot;
      }
    }
    globe.setRotation(best);
    updatingSlider = false;
  });

  render(globe.snapshot());
});

(function () {
  const fatti = {
    m: "Lunghezza. Unità: metro (m). Quanto è lungo il pezzo.",
    kg: "Massa. Unità: chilogrammo (kg). Quanta materia c’è.",
    s: "Tempo. Unità: secondo (s). Quanto dura.",
  };

  const msg = document.getElementById("gancio-msg");
  const bottoni = Array.from(document.querySelectorAll(".gancio[data-kind]"));
  if (!msg || !bottoni.length) return;

  bottoni.forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.kind;
      bottoni.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      msg.textContent = fatti[kind] || "";
    });
  });
})();

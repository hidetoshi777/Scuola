(function () {
  const P = window.PianoCartesiano;
  if (!P) return;

  const host = document.getElementById("piano-home");
  const msg = document.getElementById("home-msg");
  const list = document.getElementById("pin-list");
  if (!host) return;

  const piano = P.crea(host, {
    label: "Piano cartesiano con A, B, C e D",
    onPick(x, y) {
      const noto = P.PUNTI_CLASSE.find((p) => p.x === x && p.y === y);
      piano.walkTo(x, y);
      if (msg) {
        msg.className = "feedback";
        msg.textContent = noto
          ? "Qui c’è " + noto.id + " = " + P.fmt(x, y) + "."
          : "Qui saresti " + P.fmt(x, y) + " · " + P.quadrante(x, y).nome + ".";
      }
    },
  });

  piano.mostraPunti(P.PUNTI_CLASSE);

  list?.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-id]");
    if (!btn) return;
    const punto = P.PUNTI_CLASSE.find((p) => p.id === btn.dataset.id);
    if (!punto) return;
    list.querySelectorAll("button").forEach((b) => b.classList.toggle("is-on", b === btn));
    piano.setPawn(0, 0, true).then(() => piano.walkTo(punto.x, punto.y));
    if (msg) {
      msg.className = "feedback";
      msg.textContent =
        punto.id +
        " = " +
        P.fmt(punto.x, punto.y) +
        ". " +
        P.guida(punto.x, punto.y);
    }
    if (window.AudioUi) window.AudioUi.beep("page");
  });
})();

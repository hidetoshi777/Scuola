(function () {
  const P = window.PianoCartesiano;
  if (!P) return;

  const assi = document.getElementById("piano-assi");
  if (assi) {
    const p = P.crea(assi, {
      label: "Assi X e Y con origine O",
      interactive: false,
    });
    p.setPawn(0, 0, true);
  }

  const camminaHost = document.getElementById("piano-cammina");
  const camminaMsg = document.getElementById("cammina-msg");
  const btnA = document.getElementById("btn-cammina-a");
  let pianoCammina = null;
  if (camminaHost) {
    pianoCammina = P.crea(camminaHost, {
      label: "Cammino verso A (3, 2)",
      interactive: false,
    });
    pianoCammina.mostraPunti([P.PUNTI_CLASSE[0]]);
    pianoCammina.setPawn(0, 0, true);
  }
  btnA?.addEventListener("click", () => {
    if (!pianoCammina) return;
    pianoCammina.setPawn(0, 0, true).then(() => pianoCammina.walkTo(3, 2));
    if (camminaMsg) {
      camminaMsg.className = "feedback is-ok";
      camminaMsg.textContent = "Prima 3 a destra. Poi 2 in alto. Sei su A (3, 2).";
    }
    if (window.AudioUi) window.AudioUi.beep("ok");
  });

  const lezioneHost = document.getElementById("piano-lezione");
  const lezioneMsg = document.getElementById("lezione-msg");
  const lezioneList = document.getElementById("lezione-list");
  if (!lezioneHost) return;

  const pianoLezione = P.crea(lezioneHost, {
    label: "I quattro punti della lezione",
    interactive: false,
  });
  pianoLezione.mostraPunti(P.PUNTI_CLASSE);

  lezioneList?.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-id]");
    if (!btn) return;
    const punto = P.PUNTI_CLASSE.find((p) => p.id === btn.dataset.id);
    if (!punto) return;
    lezioneList.querySelectorAll("button").forEach((b) => b.classList.toggle("is-on", b === btn));
    pianoLezione.setPawn(0, 0, true).then(() => pianoLezione.walkTo(punto.x, punto.y));
    const q = P.quadrante(punto.x, punto.y);
    if (lezioneMsg) {
      lezioneMsg.className = "feedback";
      lezioneMsg.textContent =
        punto.id +
        " = " +
        P.fmt(punto.x, punto.y) +
        " · " +
        q.nome +
        " " +
        q.segni +
        ". " +
        P.guida(punto.x, punto.y);
    }
    if (window.AudioUi) window.AudioUi.beep("page");
  });
})();

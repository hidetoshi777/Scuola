(function () {
  const P = window.PianoCartesiano;
  if (!P) return;

  const host = document.getElementById("piano-lab");
  const coord = document.getElementById("lab-coord");
  const meta = document.getElementById("lab-meta");
  const hint = document.getElementById("lab-hint");
  const pos = document.getElementById("lab-pos");
  const msg = document.getElementById("lab-msg");
  const end = document.getElementById("lab-end");
  const ticket = document.getElementById("lab-ticket");
  if (!host) return;

  const tappe = P.PUNTI_CLASSE.slice();
  let i = 0;
  const fatti = [];

  const piano = P.crea(host, {
    label: "Laboratorio: cammina sul piano",
    interactive: false,
    onMove(x, y) {
      if (pos) pos.textContent = P.fmt(x, y);
    },
  });

  function mostraTappa() {
    const t = tappe[i];
    if (ticket) ticket.hidden = false;
    if (end) end.hidden = true;
    if (meta) meta.textContent = "Punto " + (i + 1) + " di " + tappe.length;
    if (coord) coord.textContent = t.id + " = " + P.fmt(t.x, t.y);
    if (hint) hint.textContent = P.guida(t.x, t.y);
    if (msg) {
      msg.className = "feedback";
      msg.textContent = "";
    }
    piano.mostraPunti(fatti);
    piano.setTarget(t.x, t.y, false);
    piano.setPawn(0, 0, true);
  }

  function fine() {
    if (ticket) ticket.hidden = true;
    if (end) end.hidden = false;
    piano.mostraPunti(P.PUNTI_CLASSE);
    piano.setPawn(0, 0, true);
    if (window.AudioUi) window.AudioUi.beep("win");
  }

  mostraTappa();

  document.querySelectorAll(".pad [data-dx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dx = Number(btn.dataset.dx);
      const dy = Number(btn.dataset.dy);
      piano.step(dx, dy);
      if (window.AudioUi) window.AudioUi.beep("page");
    });
  });

  document.getElementById("lab-reset")?.addEventListener("click", () => {
    piano.setPawn(0, 0, true);
    if (msg) {
      msg.className = "feedback";
      msg.textContent = "Di nuovo in O. Riparti.";
    }
  });

  document.getElementById("lab-ci")?.addEventListener("click", () => {
    const t = tappe[i];
    const ok = piano.state.x === t.x && piano.state.y === t.y;
    piano.flash(ok);
    if (ok) {
      fatti.push(t);
      if (msg) {
        msg.className = "feedback is-ok";
        msg.textContent = "Ci sei. Questo è " + t.id + ".";
      }
      if (window.AudioUi) window.AudioUi.beep("ok");
      i += 1;
      window.setTimeout(() => {
        if (i >= tappe.length) fine();
        else mostraTappa();
      }, 700);
    } else {
      if (msg) {
        msg.className = "feedback is-ko";
        msg.textContent =
          "Non ancora. Sei in " +
          P.fmt(piano.state.x, piano.state.y) +
          ". " +
          P.guida(t.x, t.y);
      }
      if (window.AudioUi) window.AudioUi.beep("ko");
    }
  });

  document.getElementById("lab-again")?.addEventListener("click", () => {
    i = 0;
    fatti.length = 0;
    mostraTappa();
  });

  document.addEventListener("keydown", (event) => {
    if (end && !end.hidden) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      piano.step(0, 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      piano.step(0, -1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      piano.step(-1, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      piano.step(1, 0);
    } else if (event.key === "Enter") {
      document.getElementById("lab-ci")?.click();
    }
  });
})();

(function () {
  const P = window.PianoCartesiano;
  if (!P) return;

  const host = document.getElementById("piano-gioco");
  const coordEl = document.getElementById("game-coord");
  const meta = document.getElementById("game-meta");
  const help = document.getElementById("game-help");
  const msg = document.getElementById("game-msg");
  const nextBtn = document.getElementById("btn-next");
  const endBox = document.getElementById("gioco-end");
  const endText = document.getElementById("end-text");
  const hudStop = document.getElementById("hud-stop");
  const hudTotal = document.getElementById("hud-total");
  const hudScore = document.getElementById("hud-score");
  const ticket = document.getElementById("game-ticket");
  const choiceList = document.getElementById("choice-list");
  if (!host) return;

  const EXTRA = [
    { x: 4, y: 1 },
    { x: -2, y: 3 },
    { x: -4, y: -2 },
    { x: 1, y: -3 },
    { x: 0, y: 4 },
    { x: 5, y: -1 },
    { x: -5, y: 2 },
    { x: 2, y: 0 },
  ];

  function mazzo() {
    const classe = P.PUNTI_CLASSE.map((p) => ({
      tipo: "colloca",
      x: p.x,
      y: p.y,
      nome: p.id,
    }));
    const altri = (window.mescola ? window.mescola(EXTRA) : EXTRA).slice(0, 2).map((p) => ({
      tipo: "colloca",
      x: p.x,
      y: p.y,
    }));
    const qPunto = P.PUNTI_CLASSE[2];
    const leggi = P.PUNTI_CLASSE[1];
    const mix = window.mescola
      ? window.mescola(classe.concat(altri))
      : classe.concat(altri);
    mix.push({ tipo: "quadrante", x: qPunto.x, y: qPunto.y, nome: qPunto.id });
    mix.push({ tipo: "leggi", x: leggi.x, y: leggi.y, nome: leggi.id });
    return mix;
  }

  let tappe = mazzo();
  let index = 0;
  let score = 0;
  let tentativi = 0;
  let answered = false;

  hudTotal.textContent = String(tappe.length);

  const piano = P.crea(host, {
    label: "Gioco: collocati sul piano",
    onPick(x, y) {
      const t = tappe[index];
      if (!t || answered || t.tipo !== "colloca") return;
      provaColloca(x, y);
    },
  });

  function setHud() {
    hudStop.textContent = String(Math.min(index + 1, tappe.length));
    hudScore.textContent = String(score);
  }

  function mostraColloca(t) {
    piano.nascondiPunti();
    piano.setTarget(t.x, t.y, false);
    piano.setPawn(0, 0, true);
    host.hidden = false;
    if (choiceList) {
      choiceList.hidden = true;
      choiceList.innerHTML = "";
    }
    if (meta) meta.textContent = t.nome ? "Collocati su " + t.nome : "Collocati qui";
    if (coordEl) coordEl.textContent = P.fmt(t.x, t.y);
    if (help) help.textContent = "Tocca la casella sul piano.";
  }

  function mostraQuadrante(t) {
    piano.mostraPunti([{ id: t.nome || "?", x: t.x, y: t.y, colore: "#f08a3a" }]);
    piano.setPawn(t.x, t.y, true);
    host.hidden = false;
    if (meta) meta.textContent = "In quale stanza?";
    if (coordEl) coordEl.textContent = (t.nome ? t.nome + " = " : "") + P.fmt(t.x, t.y);
    if (help) help.textContent = "Guarda i segni di X e di Y.";
    const ok = P.quadrante(t.x, t.y);
    const opzioni = [
      { id: "I", testo: "1° · (+, +)" },
      { id: "II", testo: "2° · (−, +)" },
      { id: "III", testo: "3° · (−, −)" },
      { id: "IV", testo: "4° · (+, −)" },
    ];
    renderScelte(
      opzioni.map((o) => ({ testo: o.testo, ok: o.id === ok.id }))
    );
  }

  function mostraLeggi(t) {
    piano.mostraPunti([{ id: t.nome || "P", x: t.x, y: t.y, colore: "#e4572e" }]);
    piano.setPawn(t.x, t.y, true);
    host.hidden = false;
    if (meta) meta.textContent = "Che punto è?";
    if (coordEl) coordEl.textContent = t.nome || "P";
    if (help) help.textContent = "Scegli la coppia giusta.";
    const ok = P.fmt(t.x, t.y);
    const decoy = [
      P.fmt(t.y, t.x),
      P.fmt(-t.x, t.y),
      P.fmt(t.x, -t.y),
    ].filter((s) => s !== ok);
    const unique = [...new Set(decoy)].slice(0, 2);
    const scelte = unique.map((s) => ({ testo: s, ok: false }));
    scelte.push({ testo: ok, ok: true });
    renderScelte(window.mescola ? window.mescola(scelte) : scelte);
  }

  function renderScelte(scelte) {
    if (!choiceList) return;
    choiceList.hidden = false;
    choiceList.innerHTML = "";
    scelte.forEach((s) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = s.testo;
      btn.addEventListener("click", () => {
        if (answered) return;
        risponde(s.ok, s.testo);
      });
      li.appendChild(btn);
      choiceList.appendChild(li);
    });
  }

  function provaColloca(x, y) {
    const t = tappe[index];
    tentativi += 1;
    const ok = x === t.x && y === t.y;
    piano.flash(ok);
    if (ok) {
      piano.walkTo(x, y);
      chiudiTappa(true, "Ci sei. " + P.fmt(x, y) + ".");
    } else {
      piano.setPawn(x, y, false);
      if (msg) {
        msg.className = "feedback is-ko";
        msg.textContent =
          "Lì è " +
          P.fmt(x, y) +
          ". Serve " +
          P.fmt(t.x, t.y) +
          ". " +
          P.guida(t.x, t.y);
      }
      if (window.AudioUi) window.AudioUi.beep("ko");
      if (tentativi >= 2) {
        piano.setTarget(t.x, t.y, true);
        chiudiTappa(false, "Guarda il cerchio verde. " + P.guida(t.x, t.y));
      }
    }
  }

  function risponde(ok, testo) {
    const t = tappe[index];
    tentativi += 1;
    if (ok) {
      chiudiTappa(true, "Giusto. " + testo + ".");
    } else if (tentativi >= 2) {
      const soluzione =
        t.tipo === "quadrante"
          ? P.quadrante(t.x, t.y).nome + " " + P.quadrante(t.x, t.y).segni
          : P.fmt(t.x, t.y);
      chiudiTappa(false, "Era " + soluzione + ".");
    } else if (msg) {
      msg.className = "feedback is-ko";
      msg.textContent = "No. Guarda di nuovo X e Y.";
      if (window.AudioUi) window.AudioUi.beep("ko");
    }
  }

  function chiudiTappa(ok, testo) {
    answered = true;
    if (ok) {
      score += tentativi === 1 ? 2 : 1;
      if (window.AudioUi) window.AudioUi.beep("ok");
    } else if (window.AudioUi) {
      window.AudioUi.beep("ko");
    }
    setHud();
    if (msg) {
      msg.className = "feedback " + (ok ? "is-ok" : "is-ko");
      msg.textContent = testo;
    }
    if (nextBtn) nextBtn.hidden = false;
  }

  function mostraTappa() {
    answered = false;
    tentativi = 0;
    if (msg) {
      msg.className = "feedback";
      msg.textContent = "";
    }
    if (nextBtn) nextBtn.hidden = true;
    if (endBox) endBox.hidden = true;
    if (ticket) ticket.hidden = false;
    setHud();
    const t = tappe[index];
    if (t.tipo === "quadrante") mostraQuadrante(t);
    else if (t.tipo === "leggi") mostraLeggi(t);
    else mostraColloca(t);
  }

  function fine() {
    if (ticket) ticket.hidden = true;
    if (choiceList) choiceList.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
    if (endBox) endBox.hidden = false;
    const max = tappe.length * 2;
    if (endText) {
      endText.textContent =
        "Hai " + score + " punti su " + max + ". Prima X, poi Y.";
    }
    if (window.AudioUi) window.AudioUi.beep("win");
  }

  function ricomincia() {
    tappe = mazzo();
    hudTotal.textContent = String(tappe.length);
    index = 0;
    score = 0;
    mostraTappa();
  }

  nextBtn?.addEventListener("click", () => {
    index += 1;
    if (index >= tappe.length) fine();
    else mostraTappa();
  });
  document.getElementById("btn-restart")?.addEventListener("click", ricomincia);
  document.getElementById("btn-again")?.addEventListener("click", ricomincia);

  mostraTappa();
})();

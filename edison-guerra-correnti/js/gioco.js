(function () {
  "use strict";

  const W = 400;
  const H = 500;
  const DURATION = 75;

  const LEVELS = [
    {
      title: "Menlo Park",
      intro:
        "Come nel film: nel laboratorio di Menlo Park Edison cerca una lampadina che resti accesa a lungo. Raccogli lampadine e brevetti!",
      target: 10,
      spawnMs: 780,
      badRatio: 0.28,
      quiz: {
        testo: "Dove Edison perfeziona la lampadina che «dura» nel film?",
        risposte: ["Menlo Park", "Chicago 1893", "Londra", "Parigi"],
        giusta: 0,
        nota: "Menlo Park (New Jersey) è il laboratorio mostrato nel film.",
      },
    },
    {
      title: "Manhattan in CC",
      intro:
        "Illuminare Manhattan con corrente continua (CC): J.P. Morgan sostiene il progetto. Raccogli investimenti (monete) e lampadine, evita i blackout!",
      target: 12,
      spawnMs: 720,
      badRatio: 0.32,
      quiz: {
        testo: "Chi finanzia e sostiene Edison nell'illuminare New York nel film?",
        risposte: ["J.P. Morgan", "Westinghouse", "Tesla", "Radetzky"],
        giusta: 0,
        nota: "Morgan crede nel sistema a corrente continua di Edison.",
      },
    },
    {
      title: "Guerra delle correnti",
      intro:
        "Westinghouse propone una collaborazione; Edison rifiuta. Nasce la rivalità: raccogli brevetti e schiva le scintille di cattiva pubblicità.",
      target: 12,
      spawnMs: 680,
      badRatio: 0.36,
      quiz: {
        testo: "Cosa succede quando Westinghouse propone di collaborare?",
        risposte: [
          "Edison accetta subito",
          "Edison rifiuta e la rivalità diventa «guerra delle correnti»",
          "Tesla torna da Edison",
          "Si spegne tutta Manhattan",
        ],
        giusta: 1,
        nota: "Il rifiuto alimenta la competizione CC vs CA.",
      },
    },
    {
      title: "Tesla e corrente alternata",
      intro:
        "Nikola Tesla lavora per Edison, poi se ne va: promessa non mantenuta. Passa a Westinghouse con la corrente alternata (CA), che viaggia lontano.",
      target: 14,
      spawnMs: 640,
      badRatio: 0.38,
      quiz: {
        testo: "Nel film, perché la corrente alternata (CA) è importante e come la presenta Edison?",
        risposte: [
          "La CA non serve a nulla",
          "La CA copre lunghe distanze; Edison la descrive pericolosa (anche con campagna mediatica)",
          "La CA funziona solo a Menlo Park",
          "Edison inventa la CA",
        ],
        giusta: 1,
        nota: "Tesla con Westinghouse usa la CA; Edison attacca con la stampa (nel film, senza scene violente).",
      },
    },
    {
      title: "Chicago 1893",
      intro:
        "Esposizione universale di Chicago 1893: Westinghouse e Tesla «vincono» l'appalto per illuminare la fiera. Raccogli luce fino al traguardo!",
      target: 15,
      spawnMs: 600,
      badRatio: 0.34,
      quiz: {
        testo: "Chi ottiene l'illuminazione dell'Esposizione di Chicago 1893 nel film?",
        risposte: [
          "Solo Edison in CC",
          "Westinghouse e Tesla (CA)",
          "Nessuno — resta al buio",
          "Solo gas",
        ],
        giusta: 1,
        nota: "La vittoria di Westinghouse/Tesla è una svolta nella guerra delle correnti.",
      },
    },
    {
      title: "Kinetoscopio",
      intro:
        "Dopo la guerra delle correnti Edison si concentra sul kinetoscopio — il cinema nascente. Raccogli pellicole e lampadine per chiudere in positivo!",
      target: 14,
      spawnMs: 620,
      badRatio: 0.3,
      quiz: {
        testo: "Su cosa si concentra Edison verso la fine del film?",
        risposte: ["Solo sulla sedia elettrica", "Sul kinetoscopio (immagini in movimento)", "Sul vapore", "Sulle automobili"],
        giusta: 1,
        nota: "Il kinetoscopio è la sua nuova frontiera tecnologica.",
      },
    },
  ];

  const LEARN_ALL = [
    "Edison a Menlo Park cerca una luce che duri.",
    "Manhattan in CC con il sostegno di J.P. Morgan.",
    "Rifiuto a Westinghouse → guerra delle correnti.",
    "Tesla passa alla CA con Westinghouse; la CA copre lunghe distanze.",
    "Edison attacca la CA anche con campagna mediatica (nel film, senza violenza).",
    "Chicago 1893: Westinghouse e Tesla illuminano la fiera.",
    "Edison si dedica poi al kinetoscopio.",
  ];

  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  const hudLevel = document.getElementById("hud-level");
  const hudScore = document.getElementById("hud-score");
  const hudTime = document.getElementById("hud-time");
  const hudTarget = document.getElementById("hud-target");
  const hudEnergy = document.getElementById("hud-energy");

  const panelIntro = document.getElementById("panel-intro");
  const panelEnd = document.getElementById("panel-end");
  const introTitle = document.getElementById("intro-title");
  const introText = document.getElementById("intro-text");
  const btnStart = document.getElementById("btn-start");
  const btnPause = document.getElementById("btn-pause");
  const btnNext = document.getElementById("btn-next-level");
  const btnRetry = document.getElementById("btn-retry");
  const endTitle = document.getElementById("end-title");
  const endText = document.getElementById("end-text");
  const learnList = document.getElementById("learn-list");

  const quizOverlay = document.getElementById("quiz-overlay");
  const quizText = document.getElementById("quiz-text");
  const quizOptions = document.getElementById("quiz-options");
  const quizFeedback = document.getElementById("quiz-feedback");
  const quizContinue = document.getElementById("quiz-continue");

  let levelIndex = 0;
  let score = 0;
  let totalScore = 0;
  let levelScoreAdded = false;
  let energy = 100;
  let timeLeft = DURATION;
  let playing = false;
  let paused = false;
  let lastTs = 0;
  let spawnAcc = 0;
  let entities = [];
  let quizPending = false;
  let quizAnswered = false;

  const player = {
    x: W / 2,
    y: H - 52,
    r: 20,
    vx: 0,
    speed: 260,
  };

  const keys = { left: false, right: false };

  function levelCfg() {
    return LEVELS[levelIndex];
  }

  function syncHud() {
    const cfg = levelCfg();
    if (hudLevel) hudLevel.textContent = String(levelIndex + 1);
    if (hudScore) hudScore.textContent = String(score);
    if (hudTime) hudTime.textContent = String(Math.ceil(timeLeft));
    if (hudTarget) hudTarget.textContent = String(cfg.target);
    if (hudEnergy) hudEnergy.style.width = `${Math.max(0, Math.min(100, energy))}%`;
  }

  function showIntro() {
    const cfg = levelCfg();
    if (panelEnd) panelEnd.hidden = true;
    if (panelIntro) panelIntro.hidden = false;
    if (introTitle) introTitle.textContent = cfg.title;
    if (introText) introText.textContent = cfg.intro;
    if (btnPause) btnPause.hidden = true;
    playing = false;
    paused = false;
  }

  function resetLevelRun() {
    const cfg = levelCfg();
    score = 0;
    energy = 100;
    timeLeft = DURATION;
    entities = [];
    spawnAcc = 0;
    player.x = W / 2;
    quizPending = false;
    quizAnswered = false;
    levelScoreAdded = false;
    if (quizOverlay) quizOverlay.hidden = true;
    syncHud();
  }

  function spawnEntity() {
    const cfg = levelCfg();
    const bad = Math.random() < cfg.badRatio;
    const margin = 24;
    const x = margin + Math.random() * (W - margin * 2);
    let kind = "bulb";
    if (bad) kind = Math.random() < 0.55 ? "blackout" : "spark";
    else if (levelIndex === 1 && Math.random() < 0.35) kind = "coin";
    else if (levelIndex === 5 && Math.random() < 0.3) kind = "film";
    else if (Math.random() < 0.25) kind = "patent";

    entities.push({
      x,
      y: -20,
      vy: 90 + levelIndex * 12 + Math.random() * 40,
      r: kind === "blackout" ? 22 : 16,
      kind,
    });
  }

  function hit(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + b.r;
  }

  function onCollect(kind) {
    if (kind === "bulb") {
      score += 2;
      energy = Math.min(100, energy + 4);
    } else if (kind === "patent") {
      score += 3;
      energy = Math.min(100, energy + 2);
    } else if (kind === "coin") {
      score += 2;
    } else if (kind === "film") {
      score += 3;
    }
    syncHud();
  }

  function onBad(kind) {
    energy -= kind === "blackout" ? 18 : 12;
    syncHud();
    if (energy <= 0) failLevel("Energia esaurita: troppi blackout o scintille di cattiva pubblicità.");
  }

  function update(dt) {
    if (!playing || paused || quizPending) return;

    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      finishRun();
      return;
    }

    if (keys.left) player.vx = -player.speed;
    else if (keys.right) player.vx = player.speed;
    else player.vx = 0;

    player.x += player.vx * dt;
    player.x = Math.max(player.r + 8, Math.min(W - player.r - 8, player.x));

    const cfg = levelCfg();
    spawnAcc += dt * 1000;
    if (spawnAcc >= cfg.spawnMs) {
      spawnAcc = 0;
      spawnEntity();
    }

    for (let i = entities.length - 1; i >= 0; i -= 1) {
      const e = entities[i];
      e.y += e.vy * dt;
      if (e.y > H + 30) {
        entities.splice(i, 1);
        continue;
      }
      if (hit(player, e)) {
        if (e.kind === "blackout" || e.kind === "spark") onBad(e.kind);
        else onCollect(e.kind);
        entities.splice(i, 1);
      }
    }

    syncHud();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0c1220");
    g.addColorStop(1, "#060910");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(240, 180, 41, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      const y = ((performance.now() / 40 + i * 80) % (H + 80)) - 40;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + 20);
      ctx.stroke();
    }
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    const grd = ctx.createRadialGradient(-4, -4, 2, 0, 0, player.r);
    grd.addColorStop(0, "#fff8dc");
    grd.addColorStop(0.5, "#f0b429");
    grd.addColorStop(1, "#a67c00");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 11px Archivo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LUCE", 0, 4);
    ctx.restore();
  }

  function drawEntity(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.kind === "bulb") {
      ctx.fillStyle = "#f5c842";
      ctx.beginPath();
      ctx.arc(0, -2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8a939e";
      ctx.fillRect(-6, 6, 12, 8);
    } else if (e.kind === "patent") {
      ctx.fillStyle = "#5b8def";
      ctx.fillRect(-12, -14, 24, 28);
      ctx.fillStyle = "#eef3fa";
      ctx.font = "9px sans-serif";
      ctx.fillText("BREV", 0, 2);
    } else if (e.kind === "coin") {
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === "film") {
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(-14, -10, 28, 20);
      ctx.fillStyle = "#fff";
      for (let i = -8; i <= 8; i += 4) ctx.fillRect(i, -6, 2, 12);
    } else if (e.kind === "blackout") {
      ctx.fillStyle = "rgba(10, 12, 20, 0.92)";
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.stroke();
    } else if (e.kind === "spark") {
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(10, 10);
      ctx.moveTo(10, -10);
      ctx.lineTo(-10, 10);
      ctx.stroke();
      ctx.fillStyle = "#fca5a5";
      ctx.font = "8px sans-serif";
      ctx.fillText("PR", 0, 14);
    }
    ctx.restore();
  }

  function draw() {
    drawBackground();
    entities.forEach(drawEntity);
    drawPlayer();

    if (paused) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#eef3fa";
      ctx.font = "bold 22px Archivo, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Pausa", W / 2, H / 2);
    }
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function finishRun() {
    playing = false;
    const cfg = levelCfg();
    if (score >= cfg.target && energy > 0) {
      showQuiz();
    } else if (energy <= 0) {
      /* already failed */
    } else {
      failLevel(`Obiettivo non raggiunto: servivano almeno ${cfg.target} punti.`);
    }
  }

  function failLevel(msg) {
    playing = false;
    paused = false;
    if (panelIntro) panelIntro.hidden = true;
    if (panelEnd) panelEnd.hidden = false;
    if (endTitle) endTitle.textContent = "Riprova";
    if (endText) endText.textContent = msg;
    if (learnList) learnList.innerHTML = "";
    if (btnNext) btnNext.hidden = true;
    if (btnPause) btnPause.hidden = true;
  }

  function showQuiz() {
    quizPending = true;
    quizAnswered = false;
    const q = levelCfg().quiz;
    if (quizOverlay) quizOverlay.hidden = false;
    if (quizText) quizText.textContent = q.testo;
    if (quizFeedback) quizFeedback.textContent = "";
    if (quizContinue) quizContinue.hidden = true;
    if (quizOptions) {
      quizOptions.innerHTML = "";
      q.risposte.forEach((r, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-opt";
        btn.textContent = r;
        btn.addEventListener("click", () => {
          if (quizAnswered) return;
          quizAnswered = true;
          quizOptions.querySelectorAll("button").forEach((b) => {
            b.disabled = true;
          });
          const ok = i === q.giusta;
          if (ok) {
            btn.classList.add("is-ok");
            score += 5;
            if (quizFeedback) quizFeedback.textContent = "Bonus +5! " + q.nota;
          } else {
            btn.classList.add("is-ko");
            const right = quizOptions.querySelectorAll("button")[q.giusta];
            if (right) right.classList.add("is-ok");
            if (quizFeedback) quizFeedback.textContent = q.nota;
          }
          syncHud();
          if (quizContinue) quizContinue.hidden = false;
        });
        quizOptions.appendChild(btn);
      });
    }
  }

  function completeLevel() {
    quizPending = false;
    if (!levelScoreAdded) {
      totalScore += score;
      levelScoreAdded = true;
    }
    if (quizOverlay) quizOverlay.hidden = true;
    if (panelIntro) panelIntro.hidden = true;
    if (panelEnd) panelEnd.hidden = false;
    const cfg = levelCfg();
    if (endTitle) endTitle.textContent = cfg.title + " — fatto!";
    if (endText) {
      endText.textContent = `Hai totalizzato ${score} punti in questa missione. Punteggio complessivo: ${totalScore}.`;
    }
    if (learnList) {
      learnList.innerHTML = LEARN_ALL.slice(0, levelIndex + 1)
        .map((t) => `<li>${t}</li>`)
        .join("");
    }
    if (btnNext) {
      btnNext.hidden = levelIndex >= LEVELS.length - 1;
      btnNext.textContent = levelIndex >= LEVELS.length - 1 ? "" : "Missione successiva";
    }
    if (levelIndex >= LEVELS.length - 1) {
      if (endTitle) endTitle.textContent = "Tutte le missioni completate!";
      if (endText) {
        endText.textContent =
          `Punteggio finale: ${totalScore}. Hai ripassato il film Edison — L'uomo che illuminò il mondo.`;
      }
      if (learnList) {
        learnList.innerHTML = LEARN_ALL.map((t) => `<li>${t}</li>`).join("");
      }
    }
    if (btnPause) btnPause.hidden = true;
  }

  function startLevelRun() {
    resetLevelRun();
    if (panelIntro) panelIntro.hidden = true;
    if (panelEnd) panelEnd.hidden = true;
    playing = true;
    paused = false;
    if (btnPause) {
      btnPause.hidden = false;
      btnPause.textContent = "Pausa";
    }
  }

  if (btnStart) {
    btnStart.addEventListener("click", startLevelRun);
  }

  if (btnPause) {
    btnPause.addEventListener("click", () => {
      if (!playing) return;
      paused = !paused;
      btnPause.textContent = paused ? "Riprendi" : "Pausa";
    });
  }

  if (quizContinue) {
    quizContinue.addEventListener("click", completeLevel);
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      levelIndex += 1;
      showIntro();
    });
  }

  if (btnRetry) {
    btnRetry.addEventListener("click", () => {
      showIntro();
    });
  }

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") keys.left = true;
    if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") keys.right = true;
  });

  window.addEventListener("keyup", (ev) => {
    if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") keys.left = false;
    if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") keys.right = false;
  });

  const touchLeft = document.getElementById("touch-left");
  const touchRight = document.getElementById("touch-right");

  function bindTouch(el, side) {
    if (!el) return;
    const on = () => {
      keys[side] = true;
    };
    const off = () => {
      keys[side] = false;
    };
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      on();
    });
    el.addEventListener("pointerup", off);
    el.addEventListener("pointerleave", off);
    el.addEventListener("pointercancel", off);
  }
  bindTouch(touchLeft, "left");
  bindTouch(touchRight, "right");

  showIntro();
  syncHud();
  requestAnimationFrame(loop);
})();

(function () {
  "use strict";

  const W = 400;
  const H = 500;
  const DURATION = 85;
  const PLAYER_Y = H - 48;
  const PLAYER_H = 88;
  const PLAYER_W = 52;

  const ICON_META = {
    bulb: { col: 0, row: 0, cols: 4, label: "lampadina", good: true },
    patent: { col: 1, row: 0, cols: 4, label: "brevetto", good: true },
    coin: { col: 2, row: 0, cols: 4, label: "moneta Morgan", good: true },
    blackout: { col: 3, row: 0, cols: 4, label: "blackout", good: false },
    pr: { col: 0, row: 1, cols: 3, label: "PR", good: false },
    ac: { col: 1, row: 1, cols: 3, label: "CA", good: true },
    cc: { col: 2, row: 1, cols: 3, label: "CC", good: true },
  };

  const LEVELS = [
    {
      title: "Menlo Park",
      bg: "menlo",
      art: "img/hero-menlo.png",
      objective: { type: "bulb", count: 10, text: "Accendi 10 lampadine nel laboratorio" },
      intro:
        "Come nel film: a Menlo Park Edison cerca un filamento che resti acceso. Raccogli le lampadine che cadono dai banchi!",
      didattica:
        "La lampadina converte energia elettrica in luce (e un po' di calore). Edison prova filamenti finché la luce resta accesa a lungo.",
      spawnGood: ["bulb", "bulb", "bulb", "patent"],
      quiz: {
        testo: "Dove Edison perfeziona la lampadina che «dura» nel film?",
        risposte: ["Menlo Park", "Chicago 1893", "Londra", "Parigi"],
        giusta: 0,
        nota: "Menlo Park (New Jersey) è il laboratorio del film.",
      },
    },
    {
      title: "Manhattan in CC",
      bg: "manhattan",
      art: "img/bg-manhattan.png",
      objective: { type: "bulb", count: 12, text: "Accendi 12 lampioni a Manhattan (corrente continua)" },
      intro:
        "Illuminare Manhattan con la CC: J.P. Morgan sostiene il progetto. Raccogli lampadine; le monete M danno energia extra.",
      didattica:
        "CC = corrente continua: elettroni vanno sempre nello stesso verso. L'icona batteria nel gioco la ricorda. Utile in città, ma sulle lunghe distanze perde efficacia.",
      spawnGood: ["bulb", "bulb", "coin", "cc"],
      quiz: {
        testo: "Chi finanzia Edison per illuminare New York nel film?",
        risposte: ["J.P. Morgan", "Westinghouse", "Tesla", "Radetzky"],
        giusta: 0,
        nota: "Morgan crede nel sistema a corrente continua.",
      },
    },
    {
      title: "Guerra delle correnti",
      bg: "manhattan",
      art: "img/bg-manhattan.png",
      objective: { type: "patent", count: 8, text: "Raccogli 8 brevetti — Westinghouse ha proposto di collaborare, Edison rifiuta" },
      intro:
        "Westinghouse propone di collaborare; Edison rifiuta. Nasce la rivalità: raccogli brevetti e schiva i giornali PR!",
      didattica:
        "Il brevetto tutela un'invenzione. Nel film la «guerra» non è solo tecnica: anche soldi, stampa e fama (icona PR = campagna mediatica).",
      spawnGood: ["patent", "patent", "bulb", "cc"],
      quiz: {
        testo: "Cosa succede quando Westinghouse propone di collaborare?",
        risposte: [
          "Edison accetta",
          "Edison rifiuta — nasce la guerra delle correnti",
          "Tesla torna da Edison",
          "Si spegne tutta Manhattan",
        ],
        giusta: 1,
        nota: "Il rifiuto alimenta la competizione CC vs CA.",
      },
    },
    {
      title: "Tesla e la CA",
      bg: "rivals",
      art: "img/npc-westinghouse-tesla.png",
      objective: { type: "ac", count: 7, text: "Raccogli 7 fulmini CA — Tesla lascia Edison e passa a Westinghouse" },
      intro:
        "Nikola Tesla se ne va: promessa non mantenuta. Con Westinghouse sviluppa la corrente alternata. Raccogli i fulmini CA!",
      didattica:
        "CA = corrente alternata: cambia direzione molte volte al secondo (50 Hz in Italia oggi). Con trasformatori si alza la tensione e si perde meno energia sui cavi lunghi.",
      spawnGood: ["ac", "ac", "patent", "bulb"],
      quiz: {
        testo: "Perché la CA è importante nel film e come la presenta Edison?",
        risposte: [
          "Non serve a nulla",
          "Copre lunghe distanze; Edison la descrive pericolosa (campagna mediatica)",
          "Funziona solo a Menlo Park",
          "Edison inventa la CA",
        ],
        giusta: 1,
        nota: "Tesla con Westinghouse usa la CA; Edison attacca con la stampa.",
      },
    },
    {
      title: "Chicago 1893",
      bg: "chicago",
      art: "img/bg-chicago.png",
      objective: { type: "bulb", count: 15, text: "Porta 15 lampadine all'Esposizione di Chicago" },
      intro:
        "Esposizione universale 1893: Westinghouse e Tesla vincono l'illuminazione. Tu porti luce fino alla fiera — raccogli lampadine!",
      didattica:
        "L'Expo di Chicago è un appalto reale nel film: vincere significa dimostrare quale sistema elettrico è più adatto a illuminare un'intera fiera.",
      spawnGood: ["bulb", "bulb", "ac", "coin"],
      quiz: {
        testo: "Chi ottiene l'illuminazione dell'Esposizione di Chicago 1893?",
        risposte: ["Solo Edison in CC", "Westinghouse e Tesla (CA)", "Nessuno", "Solo gas"],
        giusta: 1,
        nota: "È la svolta della guerra delle correnti nel film.",
      },
    },
    {
      title: "Kinetoscopio",
      bg: "menlo",
      art: "img/hero-menlo.png",
      objective: { type: "patent", count: 10, text: "Raccogli 10 brevetti per il kinetoscopio di Edison" },
      intro:
        "Edison si concentra sul kinetoscopio — immagini in movimento. Raccogli brevetti e lampadine, chiudi in positivo!",
      didattica:
        "Il kinetoscopio è un primissimo apparecchio per vedere immagini in sequenza: altra invenzione di Edison dopo il duello CC/CA.",
      spawnGood: ["patent", "patent", "bulb", "cc"],
      quiz: {
        testo: "Su cosa si concentra Edison verso la fine del film?",
        risposte: ["Solo sulla sedia elettrica", "Sul kinetoscopio", "Sul vapore", "Sulle auto"],
        giusta: 1,
        nota: "Il kinetoscopio è la nuova frontiera tecnologica.",
      },
    },
  ];

  const LEARN_ALL = [
    "Menlo Park: filamento che dura — energia elettrica → luce.",
    "Manhattan: CC e finanziamento (Morgan); lampioni in corrente continua.",
    "Guerra delle correnti: brevetti, rivalità, campagna mediatica (PR).",
    "Tesla + Westinghouse: CA e trasporto dell'energia a distanza.",
    "Chicago 1893: appalto Expo vinto da sistema Westinghouse/Tesla.",
    "Kinetoscopio: Edison verso il cinema, oltre la lampadina.",
  ];

  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  const imgs = {};
  const paths = {
    player: "img/player.png",
    icons: "img/icons-collect.png",
    menlo: "img/hero-menlo.png",
    manhattan: "img/bg-manhattan.png",
    chicago: "img/bg-chicago.png",
    rivals: "img/npc-westinghouse-tesla.png",
  };

  let assetsReady = false;
  let levelIndex = 0;
  let score = 0;
  let totalScore = 0;
  let objCount = 0;
  let energy = 100;
  let timeLeft = DURATION;
  let playing = false;
  let paused = false;
  let quizPending = false;
  let lastTs = 0;
  let spawnAcc = 0;
  let entities = [];
  let floats = [];
  let sparks = [];
  let levelScoreAdded = false;

  const player = { x: W / 2, speed: 240 };
  const keys = { left: false, right: false };

  const hudLevel = document.getElementById("hud-level");
  const hudScore = document.getElementById("hud-score");
  const hudTime = document.getElementById("hud-time");
  const hudGoal = document.getElementById("hud-goal");
  const hudObjFill = document.getElementById("hud-obj-fill");
  const hudObjCount = document.getElementById("hud-obj-count");
  const hudObjIcon = document.getElementById("hud-obj-icon");
  const hudEnergy = document.getElementById("hud-energy");
  const loadingEl = document.getElementById("canvas-loading");
  const tutorial = document.getElementById("tutorial");
  const tutorialGo = document.getElementById("tutorial-go");

  function loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imgs[key] = img;
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function iconRect(type) {
    const m = ICON_META[type];
    const sheet = imgs.icons;
    if (!sheet || !m) return null;
    const cols = m.cols;
    const rowH = sheet.height / 2;
    const sw = sheet.width / cols;
    return { sx: m.col * sw, sy: m.row * rowH, sw, sh: rowH };
  }

  function drawIcon(type, x, y, size) {
    const r = iconRect(type);
    if (!r) return;
    ctx.drawImage(imgs.icons, r.sx, r.sy, r.sw, r.sh, x - size / 2, y - size / 2, size, size);
  }

  function drawBg(bgKey) {
    const img = imgs[bgKey];
    if (!img) return;
    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.fillStyle = "rgba(5, 8, 18, 0.42)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, H - 110, W, 110);
  }

  function drawPlayer() {
    const img = imgs.player;
    if (!img) return;
    const scale = PLAYER_H / img.height;
    const dw = img.width * scale;
    const dh = PLAYER_H;
    ctx.drawImage(img, player.x - dw / 2, PLAYER_Y - dh, dw, dh);
  }

  function drawCanvasHud() {
    const cfg = levelCfg();
    const obj = cfg.objective;
    const pct = Math.min(100, (objCount / obj.count) * 100);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(8, 8, W - 16, 36);
    ctx.strokeStyle = "rgba(240,180,41,0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, W - 16, 36);
    ctx.fillStyle = "#eef3fa";
    ctx.font = "bold 11px Archivo, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(obj.text, 16, 26);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(16, 32, W - 32, 6);
    ctx.fillStyle = "#f0b429";
    ctx.fillRect(16, 32, ((W - 32) * pct) / 100, 6);
  }

  function levelCfg() {
    return LEVELS[levelIndex];
  }

  function setHudIconPos(type) {
    if (!hudObjIcon) return;
    const m = ICON_META[type];
    if (!m) return;
    const cols = m.cols;
    const xPct = cols <= 1 ? 0 : (m.col / (cols - 1)) * 100;
    const yPct = m.row === 0 ? 0 : 100;
    hudObjIcon.style.width = cols * 100 + "%";
    hudObjIcon.style.height = "200%";
    hudObjIcon.style.objectPosition = xPct + "% " + yPct + "%";
  }

  function syncHud() {
    const cfg = levelCfg();
    const obj = cfg.objective;
    if (hudLevel) hudLevel.textContent = String(levelIndex + 1);
    if (hudScore) hudScore.textContent = String(score);
    if (hudTime) hudTime.textContent = String(Math.ceil(timeLeft));
    if (hudGoal) hudGoal.textContent = obj.text;
    if (hudObjCount) hudObjCount.textContent = `${objCount}/${obj.count}`;
    if (hudObjFill) hudObjFill.style.width = `${Math.min(100, (objCount / obj.count) * 100)}%`;
    if (hudEnergy) hudEnergy.style.width = `${Math.max(0, energy)}%`;
    setHudIconPos(obj.type);
  }

  function showIntro() {
    const cfg = levelCfg();
    const panelIntro = document.getElementById("panel-intro");
    const panelEnd = document.getElementById("panel-end");
    const introTitle = document.getElementById("intro-title");
    const introText = document.getElementById("intro-text");
    const introObjective = document.getElementById("intro-objective");
    const introDidactic = document.getElementById("intro-didactic");
    const introArt = document.getElementById("intro-art");
    const btnPause = document.getElementById("btn-pause");

    if (panelEnd) panelEnd.hidden = true;
    if (panelIntro) panelIntro.hidden = false;
    if (introTitle) introTitle.textContent = cfg.title;
    if (introText) introText.textContent = cfg.intro;
    if (introObjective) introObjective.textContent = "Obiettivo: " + cfg.objective.text;
    if (introDidactic) {
      introDidactic.textContent = cfg.didattica ? "In classe: " + cfg.didattica : "";
      introDidactic.hidden = !cfg.didattica;
    }
    if (introArt) introArt.src = cfg.art;
    if (btnPause) btnPause.hidden = true;
    playing = false;
    syncHud();
  }

  function resetRun() {
    const cfg = levelCfg();
    score = 0;
    objCount = 0;
    energy = 100;
    timeLeft = DURATION;
    entities = [];
    floats = [];
    sparks = [];
    spawnAcc = 0;
    player.x = W / 2;
    quizPending = false;
    levelScoreAdded = false;
    syncHud();
  }

  function pickSpawnKind() {
    const cfg = levelCfg();
    const bad = Math.random() < 0.22 + levelIndex * 0.02;
    if (bad) return Math.random() < 0.55 ? "blackout" : "pr";
    const pool = cfg.spawnGood;
    const objType = cfg.objective.type;
    if (Math.random() < 0.62) return objType;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function spawnEntity() {
    const kind = pickSpawnKind();
    const margin = 28;
    entities.push({
      kind,
      x: margin + Math.random() * (W - margin * 2),
      y: -24,
      vy: 95 + levelIndex * 8 + Math.random() * 35,
      size: kind === "blackout" ? 44 : 38,
    });
  }

  function addFloat(text, x, y) {
    floats.push({ text, x, y, life: 1.1 });
  }

  function addSparks(x, y, color) {
    for (let i = 0; i < 6; i += 1) {
      const a = Math.random() * Math.PI * 2;
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * (40 + Math.random() * 80),
        vy: Math.sin(a) * (40 + Math.random() * 80),
        life: 0.35 + Math.random() * 0.25,
        color,
      });
    }
  }

  function beep(ok) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g);
      g.connect(ac.destination);
      o.frequency.value = ok ? 660 : 220;
      g.gain.value = 0.06;
      o.start();
      o.stop(ac.currentTime + 0.08);
    } catch (e) {
      /* optional */
    }
  }

  function onCollect(ent) {
    const cfg = levelCfg();
    const meta = ICON_META[ent.kind];
    if (ent.kind === cfg.objective.type) {
      objCount += 1;
      score += 4;
      addFloat("+1 " + meta.label + "!", ent.x, ent.y);
      addSparks(ent.x, ent.y, "#f0b429");
      beep(true);
      if (objCount >= cfg.objective.count) winLevel();
    } else if (meta && meta.good) {
      score += 2;
      energy = Math.min(100, energy + 5);
      addFloat("+" + meta.label, ent.x, ent.y);
      addSparks(ent.x, ent.y, "#2dd4bf");
      beep(true);
    }
    syncHud();
  }

  function onBad(ent) {
    energy -= ent.kind === "blackout" ? 20 : 14;
    addFloat("Attenzione!", ent.x, ent.y);
    addSparks(ent.x, ent.y, "#f87171");
    beep(false);
    syncHud();
    if (energy <= 0) failLevel("Energia finita: troppe nubi blackout o troppa cattiva pubblicità (PR).");
  }

  function hitPlayer(ent) {
    const dy = Math.abs(ent.y - (PLAYER_Y - PLAYER_H / 2));
    if (dy > PLAYER_H / 2 + ent.size) return false;
    return Math.abs(ent.x - player.x) < PLAYER_W / 2 + ent.size * 0.45;
  }

  function update(dt) {
    if (!playing || paused || quizPending || !assetsReady) return;

    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      failLevel("Tempo scaduto! Raccogli più velocemente l'obiettivo della missione.");
      return;
    }

    if (keys.left) player.x -= player.speed * dt;
    if (keys.right) player.x += player.speed * dt;
    player.x = Math.max(PLAYER_W, Math.min(W - PLAYER_W, player.x));

    spawnAcc += dt * 1000;
    const interval = Math.max(480, 760 - levelIndex * 35);
    if (spawnAcc >= interval) {
      spawnAcc = 0;
      spawnEntity();
    }

    for (let i = entities.length - 1; i >= 0; i -= 1) {
      const e = entities[i];
      e.y += e.vy * dt;
      if (e.y > H + 40) {
        entities.splice(i, 1);
        continue;
      }
      if (hitPlayer(e)) {
        const meta = ICON_META[e.kind];
        if (meta && meta.good) onCollect(e);
        else onBad(e);
        entities.splice(i, 1);
      }
    }

    floats.forEach((f) => {
      f.y -= 28 * dt;
      f.life -= dt;
    });
    floats = floats.filter((f) => f.life > 0);

    sparks.forEach((s) => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
    });
    sparks = sparks.filter((s) => s.life > 0);

    syncHud();
  }

  function drawFloats() {
    floats.forEach((f) => {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = "#fff8dc";
      ctx.font = "bold 13px Archivo, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
  }

  function drawSparks() {
    sparks.forEach((s) => {
      ctx.globalAlpha = Math.max(0, s.life * 2);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function draw() {
    if (!assetsReady) return;
    const cfg = levelCfg();
    drawBg(cfg.bg);
    entities.forEach((e) => drawIcon(e.kind, e.x, e.y, e.size));
    drawPlayer();
    drawCanvasHud();
    drawSparks();
    drawFloats();
    if (paused) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
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

  function winLevel() {
    playing = false;
    showQuiz();
  }

  function failLevel(msg) {
    playing = false;
    const panelIntro = document.getElementById("panel-intro");
    const panelEnd = document.getElementById("panel-end");
    const endTitle = document.getElementById("end-title");
    const endText = document.getElementById("end-text");
    const learnList = document.getElementById("learn-list");
    const endDidactic = document.getElementById("end-didactic");
    const learnKicker = document.getElementById("learn-kicker");
    const btnNext = document.getElementById("btn-next-level");
    const btnPause = document.getElementById("btn-pause");
    if (panelIntro) panelIntro.hidden = true;
    if (panelEnd) panelEnd.hidden = false;
    if (endTitle) endTitle.textContent = "Riprova";
    if (endText) endText.textContent = msg;
    if (learnList) learnList.innerHTML = "";
    if (endDidactic) endDidactic.hidden = true;
    if (learnKicker) learnKicker.hidden = true;
    if (btnNext) btnNext.hidden = true;
    if (btnPause) btnPause.hidden = true;
  }

  function showQuiz() {
    quizPending = true;
    const q = levelCfg().quiz;
    const quizOverlay = document.getElementById("quiz-overlay");
    const quizText = document.getElementById("quiz-text");
    const quizOptions = document.getElementById("quiz-options");
    const quizFeedback = document.getElementById("quiz-feedback");
    const quizContinue = document.getElementById("quiz-continue");
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
    const quizOverlay = document.getElementById("quiz-overlay");
    if (quizOverlay) quizOverlay.hidden = true;
    const panelIntro = document.getElementById("panel-intro");
    const panelEnd = document.getElementById("panel-end");
    const endTitle = document.getElementById("end-title");
    const endText = document.getElementById("end-text");
    const learnList = document.getElementById("learn-list");
    const endDidactic = document.getElementById("end-didactic");
    const learnKicker = document.getElementById("learn-kicker");
    const btnNext = document.getElementById("btn-next-level");
    const btnPause = document.getElementById("btn-pause");
    const cfg = levelCfg();

    if (panelIntro) panelIntro.hidden = true;
    if (panelEnd) panelEnd.hidden = false;
    if (endTitle) endTitle.textContent = cfg.title + " — completata!";
    if (endText) {
      endText.textContent = `Obiettivo raggiunto! Punti missione: ${score}. Totale: ${totalScore}.`;
    }
    if (endDidactic) {
      endDidactic.textContent = cfg.didattica ? "Ripasso tecnologie: " + cfg.didattica : "";
      endDidactic.hidden = !cfg.didattica;
    }
    if (learnKicker) learnKicker.hidden = false;
    if (learnList) {
      learnList.innerHTML = LEARN_ALL.slice(0, levelIndex + 1)
        .map((t) => `<li>${t}</li>`)
        .join("");
    }
    if (btnNext) btnNext.hidden = levelIndex >= LEVELS.length - 1;
    if (levelIndex >= LEVELS.length - 1) {
      if (endTitle) endTitle.textContent = "Tutte le missioni completate!";
      if (endText) {
        endText.textContent = `Hai finito il film in gioco. Punteggio finale: ${totalScore}.`;
      }
      if (learnList) learnList.innerHTML = LEARN_ALL.map((t) => `<li>${t}</li>`).join("");
    }
    if (btnPause) btnPause.hidden = true;
  }

  function startRun() {
    resetRun();
    const panelIntro = document.getElementById("panel-intro");
    const panelEnd = document.getElementById("panel-end");
    const btnPause = document.getElementById("btn-pause");
    if (panelIntro) panelIntro.hidden = true;
    if (panelEnd) panelEnd.hidden = true;
    playing = true;
    paused = false;
    if (btnPause) {
      btnPause.hidden = false;
      btnPause.textContent = "Pausa";
    }
  }

  Promise.all(Object.keys(paths).map((k) => loadImage(k, paths[k])))
    .then(() => {
      assetsReady = true;
      if (loadingEl) loadingEl.hidden = true;
      if (tutorial) tutorial.hidden = false;
      showIntro();
      syncHud();
    })
    .catch(() => {
      if (loadingEl) loadingEl.textContent = "Errore caricamento immagini. Ricarica la pagina.";
    });

  const btnStart = document.getElementById("btn-start");
  const btnPause = document.getElementById("btn-pause");
  const btnNext = document.getElementById("btn-next-level");
  const btnRetry = document.getElementById("btn-retry");
  const quizContinue = document.getElementById("quiz-continue");

  if (tutorialGo) {
    tutorialGo.addEventListener("click", () => {
      if (tutorial) tutorial.hidden = true;
      showIntro();
    });
  }

  if (btnStart) btnStart.addEventListener("click", startRun);
  if (btnPause) {
    btnPause.addEventListener("click", () => {
      if (!playing) return;
      paused = !paused;
      btnPause.textContent = paused ? "Riprendi" : "Pausa";
    });
  }
  if (quizContinue) quizContinue.addEventListener("click", completeLevel);
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      levelIndex += 1;
      showIntro();
    });
  }
  if (btnRetry) btnRetry.addEventListener("click", showIntro);

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") keys.left = true;
    if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") keys.right = true;
  });
  window.addEventListener("keyup", (ev) => {
    if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") keys.left = false;
    if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") keys.right = false;
  });

  function bindTouch(id, side) {
    const el = document.getElementById(id);
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
  bindTouch("touch-left", "left");
  bindTouch("touch-right", "right");

  requestAnimationFrame(loop);
})();

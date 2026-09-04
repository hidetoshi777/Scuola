(function () {
  const canvas = document.getElementById("arcade");
  const overlayStart = document.getElementById("overlay-start");
  const overlayEnd = document.getElementById("overlay-end");
  const endTitle = document.getElementById("end-title");
  const endText = document.getElementById("end-text");
  const hudScore = document.getElementById("hud-score");
  const hudLives = document.getElementById("hud-lives");
  const hudPages = document.getElementById("hud-pages");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const state = {
    running: false,
    score: 0,
    lives: 3,
    pages: 0,
    t: 0,
    spawn: 0,
    pageSpawn: 0,
    player: { x: W / 2, y: H - 58, w: 36, h: 28, speed: 4.2 },
    bullets: [],
    enemies: [],
    pickups: [],
    keys: { left: false, right: false, fire: false },
    fireCool: 0,
    flash: 0,
  };

  function reset() {
    state.score = 0;
    state.lives = 3;
    state.pages = 0;
    state.t = 0;
    state.spawn = 0;
    state.pageSpawn = 0;
    state.bullets = [];
    state.enemies = [];
    state.pickups = [];
    state.fireCool = 0;
    state.flash = 0;
    state.player.x = W / 2;
    syncHud();
  }

  function syncHud() {
    hudScore.textContent = String(state.score);
    hudLives.textContent = "♥".repeat(state.lives) || "—";
    hudPages.textContent = String(state.pages);
  }

  function start() {
    reset();
    state.running = true;
    overlayStart.hidden = true;
    overlayEnd.hidden = true;
    if (window.AudioUi) window.AudioUi.beep("ok");
    requestAnimationFrame(loop);
  }

  function gameOver(win) {
    state.running = false;
    overlayEnd.hidden = false;
    endTitle.textContent = win ? "Manoscritto salvo!" : "I Bravi ti hanno preso";
    endText.textContent = win
      ? `Hai raccolto ${state.pages} fogli e totalizzato ${state.score} punti. La Provvidenza apprezza.`
      : `Punteggio ${state.score}. Riprova: più fogli, meno paura.`;
    if (window.AudioUi) window.AudioUi.beep(win ? "win" : "bad");
  }

  function fire() {
    if (state.fireCool > 0) return;
    state.fireCool = 12;
    state.bullets.push({
      x: state.player.x,
      y: state.player.y - 16,
      r: 5,
      vy: -7.5,
    });
    if (window.AudioUi) window.AudioUi.beep("page");
  }

  function spawnEnemy() {
    const lane = 40 + Math.random() * (W - 80);
    state.enemies.push({
      x: lane,
      y: -30,
      w: 34,
      h: 30,
      vy: 1.4 + Math.random() * 1.2 + state.t * 0.00035,
      hp: 1,
    });
  }

  function spawnPage() {
    state.pickups.push({
      x: 30 + Math.random() * (W - 60),
      y: -20,
      w: 22,
      h: 28,
      vy: 1.6,
    });
  }

  function hit(a, b) {
    return (
      a.x - (a.w || a.r * 2) / 2 < b.x + (b.w || b.r * 2) / 2 &&
      a.x + (a.w || a.r * 2) / 2 > b.x - (b.w || b.r * 2) / 2 &&
      a.y - (a.h || a.r * 2) / 2 < b.y + (b.h || b.r * 2) / 2 &&
      a.y + (a.h || a.r * 2) / 2 > b.y - (b.h || b.r * 2) / 2
    );
  }

  function update() {
    state.t += 1;
    if (state.fireCool > 0) state.fireCool -= 1;
    if (state.flash > 0) state.flash -= 1;

    const p = state.player;
    if (state.keys.left) p.x -= p.speed;
    if (state.keys.right) p.x += p.speed;
    p.x = Math.max(24, Math.min(W - 24, p.x));
    if (state.keys.fire) fire();

    state.spawn -= 1;
    if (state.spawn <= 0) {
      spawnEnemy();
      state.spawn = Math.max(28, 70 - state.t * 0.02);
    }
    state.pageSpawn -= 1;
    if (state.pageSpawn <= 0) {
      spawnPage();
      state.pageSpawn = 110 + Math.random() * 60;
    }

    state.bullets.forEach((b) => {
      b.y += b.vy;
    });
    state.bullets = state.bullets.filter((b) => b.y > -20);

    state.enemies.forEach((e) => {
      e.y += e.vy;
    });
    state.pickups.forEach((u) => {
      u.y += u.vy;
    });

    // bullets vs enemies
    state.bullets.forEach((b) => {
      state.enemies.forEach((e) => {
        if (e.dead) return;
        if (Math.hypot(b.x - e.x, b.y - e.y) < 22) {
          e.dead = true;
          b.dead = true;
          state.score += 10;
          if (window.AudioUi) window.AudioUi.beep("ok");
        }
      });
    });
    state.bullets = state.bullets.filter((b) => !b.dead);
    state.enemies = state.enemies.filter((e) => {
      if (e.dead) return false;
      if (e.y > H + 40) {
        state.lives -= 1;
        state.flash = 18;
        syncHud();
        if (window.AudioUi) window.AudioUi.beep("bad");
        if (state.lives <= 0) gameOver(false);
        return false;
      }
      if (hit({ x: p.x, y: p.y, w: p.w, h: p.h }, e)) {
        state.lives -= 1;
        state.flash = 18;
        syncHud();
        if (window.AudioUi) window.AudioUi.beep("bad");
        if (state.lives <= 0) gameOver(false);
        return false;
      }
      return true;
    });

    state.pickups = state.pickups.filter((u) => {
      if (u.y > H + 30) return false;
      if (hit({ x: p.x, y: p.y, w: p.w, h: p.h }, u)) {
        state.pages += 1;
        state.score += 25;
        syncHud();
        if (window.AudioUi) window.AudioUi.beep("win");
        if (state.pages >= 8) gameOver(true);
        return false;
      }
      return true;
    });

    syncHud();
  }

  function drawPlayer(x, y) {
    ctx.save();
    ctx.translate(x, y);
    // body
    ctx.fillStyle = "#c9a06a";
    ctx.fillRect(-10, -6, 20, 18);
    // jacket
    ctx.fillStyle = "#5a3d2b";
    ctx.fillRect(-12, 0, 24, 16);
    // head
    ctx.beginPath();
    ctx.fillStyle = "#e6c8a8";
    ctx.arc(0, -12, 9, 0, Math.PI * 2);
    ctx.fill();
    // ink quill
    ctx.strokeStyle = "#e6dcc6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.lineTo(18, -18);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = "#6b2a2a";
    ctx.fillRect(-14, -8, 28, 22);
    ctx.fillStyle = "#2a1810";
    ctx.fillRect(-16, -14, 32, 10);
    ctx.fillStyle = "#d4b090";
    ctx.beginPath();
    ctx.arc(0, -18, 7, 0, Math.PI * 2);
    ctx.fill();
    // menace eyes
    ctx.fillStyle = "#ffd76a";
    ctx.fillRect(-4, -20, 3, 3);
    ctx.fillRect(2, -20, 3, 3);
    ctx.restore();
  }

  function drawPage(u) {
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.fillStyle = "#e6dcc6";
    ctx.fillRect(-10, -14, 20, 26);
    ctx.strokeStyle = "#8a7a58";
    ctx.strokeRect(-10, -14, 20, 26);
    ctx.strokeStyle = "#b09a70";
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-6, -8 + i * 5);
      ctx.lineTo(6, -8 + i * 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // mist bands
    ctx.fillStyle = "rgba(126,184,178,0.06)";
    for (let i = 0; i < 6; i += 1) {
      const y = ((state.t * 1.2 + i * 90) % (H + 40)) - 20;
      ctx.fillRect(0, y, W, 18);
    }

    // ground strip
    ctx.fillStyle = "rgba(201,162,39,0.12)";
    ctx.fillRect(0, H - 36, W, 36);

    state.pickups.forEach(drawPage);
    state.enemies.forEach(drawEnemy);
    state.bullets.forEach((b) => {
      ctx.beginPath();
      ctx.fillStyle = "#1a1a1a";
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "rgba(126,184,178,0.5)";
      ctx.arc(b.x, b.y, b.r + 3, 0, Math.PI * 2);
      ctx.fill();
    });
    drawPlayer(state.player.x, state.player.y);

    if (state.flash > 0) {
      ctx.fillStyle = `rgba(155,58,58,${0.25 * (state.flash / 18)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function loop() {
    if (!state.running) {
      draw();
      return;
    }
    update();
    draw();
    if (state.running) requestAnimationFrame(loop);
  }

  // input
  const setKey = (key, on) => {
    state.keys[key] = on;
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") {
      e.preventDefault();
      setKey("left", true);
    }
    if (e.key === "ArrowRight" || e.key === "d") {
      e.preventDefault();
      setKey("right", true);
    }
    if (e.key === " " || e.key === "ArrowUp") {
      e.preventDefault();
      setKey("fire", true);
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") setKey("left", false);
    if (e.key === "ArrowRight" || e.key === "d") setKey("right", false);
    if (e.key === " " || e.key === "ArrowUp") setKey("fire", false);
  });

  function bindHold(btn, key) {
    const down = (e) => {
      e.preventDefault();
      btn.classList.add("is-down");
      setKey(key, true);
    };
    const up = (e) => {
      e.preventDefault();
      btn.classList.remove("is-down");
      setKey(key, false);
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("pointercancel", up);
  }

  bindHold(document.getElementById("btn-left"), "left");
  bindHold(document.getElementById("btn-right"), "right");
  bindHold(document.getElementById("btn-fire"), "fire");

  document.getElementById("btn-start").addEventListener("click", start);
  document.getElementById("btn-retry").addEventListener("click", start);

  draw();
})();

/* Meucci Slug - Operazione Ruolo 1.100
   Core Arcade Run & Gun Engine (HTML5 Canvas 60 FPS)
   Prof. Rossano Bella vs. 1.100 Precari delle GPS
*/
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const canvas = $('slug-canvas');
  const ctx = canvas.getContext('2d');
  const W = 960, H = 540;
  canvas.width = W; canvas.height = H;

  // Audio helper shorthand
  const audio = window.MeucciSlugAudio;

  // Input State
  const input = {
    left: false, right: false, up: false, down: false,
    jump: false, fire: false, bomb: false, enter: false,
    jumpPressed: false, firePressed: false, bombPressed: false, enterPressed: false
  };

  // Screen shake
  let screenShake = 0;

  // Game States: 'title', 'playing', 'paused', 'victory', 'gameover'
  let state = 'title';
  let score = 0;
  let scalzati = 0;
  const TOTAL_PRECARI = 1100;

  // Stage geometry
  const STAGE_LENGTH = 4400;
  const FLOOR_Y = 440;

  // Camera
  const camera = { x: 0, y: 0 };

  // Parallax background clouds & smoke
  const volcanoSmoke = Array.from({ length: 8 }, (_, i) => ({
    x: 480 + i * 25,
    y: 190 - i * 18,
    rad: 16 + i * 7,
    phase: Math.random() * 10
  }));

  // Platforms in the stage: [{x, y, w, h, type}]
  const platforms = [
    // Courtyard benches and barriers (0 - 1500)
    { x: 380, y: 350, w: 140, h: 18, label: 'BANCO' },
    { x: 620, y: 310, w: 180, h: 18, label: 'MURETTO' },
    { x: 920, y: 340, w: 160, h: 18, label: 'TRANSENNA' },
    { x: 1200, y: 310, w: 200, h: 18, label: 'CONTAINER' },

    // Indoor corridor lockers, stairs and desks (1600 - 3400)
    { x: 1750, y: 360, w: 160, h: 18, label: 'CATTEDRA' },
    { x: 2020, y: 310, w: 150, h: 18, label: 'DISTRIBUTORE' },
    { x: 2280, y: 350, w: 180, h: 18, label: 'BANCO' },
    { x: 2540, y: 290, w: 200, h: 18, label: 'ARMADIETTI' },
    { x: 2850, y: 340, w: 190, h: 18, label: 'CATTEDRA' },
    { x: 3120, y: 300, w: 180, h: 18, label: 'SCALE 3 AM' },

    // Boss arena platforms (3600 - 4400)
    { x: 3650, y: 360, w: 180, h: 18, label: 'LAVAGNA' },
    { x: 4100, y: 340, w: 200, h: 18, label: 'PILASTRO' }
  ];

  // Weapons Definition
  const WEAPONS = {
    stamp: { name: 'TIMBRO DI RUOLO', ammo: Infinity, delay: 0.16, damage: 25, color: '#ef4444', speed: 820 },
    heavy: { name: 'HEAVY CONCORSO', ammo: 150, delay: 0.08, damage: 32, color: '#facc15', speed: 950 },
    shotgun: { name: 'SHOTGUN FERIE', ammo: 30, delay: 0.55, damage: 85, color: '#ffffff', speed: 750 },
    rocket: { name: 'RICORSO RESPINTO', ammo: 20, delay: 0.38, damage: 130, color: '#fb923c', speed: 580 },
    laser: { name: 'LASER DEL TESTER', ammo: 80, delay: 0.1, damage: 45, color: '#38bdf8', speed: 1100 }
  };

  // Player Object
  const player = {
    x: 100, y: FLOOR_Y, vx: 0, vy: 0,
    w: 36, h: 62,
    dir: 1, // 1: right, -1: left
    aimX: 1, aimY: 0, // Aim vector
    grounded: true,
    crouch: false,
    health: 100, maxHealth: 100,
    weapon: 'stamp',
    ammo: Infinity,
    bombs: 10,
    fireTimer: 0,
    invincibleTimer: 0,
    inVehicle: false,
    phase: 0
  };

  // Moke Slug Vehicle Object
  const moke = {
    x: 1480, y: FLOOR_Y, vx: 0, vy: 0,
    w: 120, h: 64,
    dir: 1,
    aimAngle: 0,
    health: 250, maxHealth: 250,
    active: false,
    occupied: false,
    cannonTimer: 0
  };

  // Boss Object
  const boss = {
    x: 4050, y: FLOOR_Y - 140,
    w: 220, h: 180,
    health: 1600, maxHealth: 1600,
    attackTimer: 2,
    state: 'idle',
    phase: 0,
    defeated: false
  };

  // Arrays for dynamic entities
  let bullets = [];
  let enemyBullets = [];
  let enemies = [];
  let pickups = [];
  let particles = [];
  let floatingTexts = [];

  // Spawn Enemy
  function spawnEnemy(x, type = 'runner') {
    enemies.push({
      x, y: FLOOR_Y, vx: 0, vy: 0,
      w: 34, h: 56,
      type, // 'runner', 'sniper', 'shielder'
      health: type === 'shielder' ? 70 : type === 'sniper' ? 45 : 30,
      maxHealth: type === 'shielder' ? 70 : type === 'sniper' ? 45 : 30,
      dir: -1,
      cooldown: Math.random() * 2,
      phase: Math.random() * 10
    });
  }

  // Populate Stage Enemies
  function initEnemies() {
    enemies = [];
    // Runners
    for (let x = 450; x < 3500; x += 190 + Math.random() * 90) {
      spawnEnemy(x, 'runner');
    }
    // Snipers on platforms
    platforms.forEach(p => {
      if (p.x < 3600) {
        enemies.push({
          x: p.x + p.w / 2, y: p.y - 56, vx: 0, vy: 0,
          w: 34, h: 56,
          type: 'sniper',
          health: 40, maxHealth: 40,
          dir: -1,
          cooldown: 1 + Math.random() * 2,
          phase: 0
        });
      }
    });
    // Shielders
    for (let x = 1100; x < 3400; x += 550) {
      spawnEnemy(x, 'shielder');
    }

    // Pickups scattered
    pickups = [
      { x: 550, y: FLOOR_Y - 25, type: 'heavy', label: 'H' },
      { x: 1050, y: FLOOR_Y - 25, type: 'coffee', label: '☕' },
      { x: 1850, y: 320, type: 'shotgun', label: 'S' },
      { x: 2350, y: FLOOR_Y - 25, type: 'rocket', label: 'R' },
      { x: 2750, y: 250, type: 'laser', label: 'L' },
      { x: 3300, y: FLOOR_Y - 25, type: 'bomb', label: 'BOMBE' },
      { x: 3500, y: FLOOR_Y - 25, type: 'cedolino', label: 'NoiPA' }
    ];
  }

  // Floating text feedback (+500, TIMBRATO!)
  function addText(text, x, y, color = '#facc15') {
    floatingTexts.push({ text, x, y, vy: -50, life: 1, color });
  }

  // Particle Effects
  function addExplosion(x, y, count = 16, isBig = false) {
    audio?.play('explosion');
    screenShake = Math.max(screenShake, isBig ? 14 : 7);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * (isBig ? 320 : 180);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        color: ['#facc15', '#ef4444', '#f97316', '#ffffff'][Math.floor(Math.random() * 4)],
        rad: 3 + Math.random() * (isBig ? 8 : 4),
        type: 'spark'
      });
    }
    // Flying paper sheets
    for (let i = 0; i < (isBig ? 12 : 5); i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 160,
        vy: -80 - Math.random() * 140,
        life: 1.2, maxLife: 1.2,
        rot: Math.random() * 6,
        vrot: (Math.random() - 0.5) * 8,
        w: 10, h: 14,
        color: '#ffffff',
        type: 'paper'
      });
    }
  }

  // Reset Game
  function resetGame() {
    player.x = 100; player.y = FLOOR_Y; player.vx = 0; player.vy = 0;
    player.health = player.maxHealth;
    player.weapon = 'stamp';
    player.ammo = Infinity;
    player.bombs = 10;
    player.inVehicle = false;
    player.invincibleTimer = 0;

    moke.x = 1480; moke.y = FLOOR_Y; moke.vx = 0; moke.vy = 0;
    moke.health = moke.maxHealth; moke.occupied = false;

    boss.x = 4050; boss.health = boss.maxHealth; boss.defeated = false;

    score = 0;
    scalzati = 0;
    bullets = [];
    enemyBullets = [];
    particles = [];
    floatingTexts = [];
    initEnemies();
    camera.x = 0;
    state = 'playing';

    $('game-over-screen').classList.add('hidden');
    $('victory-screen').classList.add('hidden');
    $('title-screen').classList.add('hidden');

    audio?.announce('start');
    audio?.startMusic();
  }

  // Input listeners
  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    audio?.arm();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = true;
    if (e.code === 'KeyK' || e.code === 'KeyX' || e.code === 'Space') { input.jump = true; input.jumpPressed = true; }
    if (e.code === 'KeyJ' || e.code === 'KeyZ' || e.code === 'Enter') { input.fire = true; input.firePressed = true; }
    if (e.code === 'KeyL' || e.code === 'KeyC') { input.bomb = true; input.bombPressed = true; }
    if (e.code === 'KeyE') { input.enter = true; input.enterPressed = true; }
    if (e.code === 'KeyP') togglePause();
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = false;
    if (e.code === 'KeyK' || e.code === 'KeyX' || e.code === 'Space') input.jump = false;
    if (e.code === 'KeyJ' || e.code === 'KeyZ' || e.code === 'Enter') input.fire = false;
    if (e.code === 'KeyL' || e.code === 'KeyC') input.bomb = false;
    if (e.code === 'KeyE') input.enter = false;
  });

  // Touch button listeners for mobile
  function bindTouch(id, keyProp) {
    const el = $(id);
    if (!el) return;
    const start = e => {
      e.preventDefault();
      audio?.arm();
      input[keyProp] = true;
      if (keyProp + 'Pressed' in input) input[keyProp + 'Pressed'] = true;
      el.classList.add('pressed');
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    };
    const end = e => {
      e.preventDefault();
      input[keyProp] = false;
      el.classList.remove('pressed');
    };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
  }

  bindTouch('dpad-left', 'left');
  bindTouch('dpad-right', 'right');
  bindTouch('dpad-up', 'up');
  bindTouch('dpad-down', 'down');
  bindTouch('btn-jump', 'jump');
  bindTouch('btn-fire', 'fire');
  bindTouch('btn-bomb', 'bomb');
  bindTouch('btn-moke', 'enter');

  // Gamepad polling
  function pollGamepad() {
    const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
    const tag = $('gamepad-status');
    if (gp) {
      if (tag) {
        tag.textContent = '🎮 Gamepad Connesso';
        tag.classList.add('connected');
      }
      const deadzone = 0.3;
      input.left = gp.axes[0] < -deadzone || gp.buttons[14]?.pressed;
      input.right = gp.axes[0] > deadzone || gp.buttons[15]?.pressed;
      input.up = gp.axes[1] < -deadzone || gp.buttons[12]?.pressed;
      input.down = gp.axes[1] > deadzone || gp.buttons[13]?.pressed;

      const jumpBtn = gp.buttons[0]?.pressed; // A
      if (jumpBtn && !input.jump) input.jumpPressed = true;
      input.jump = jumpBtn;

      const fireBtn = gp.buttons[2]?.pressed; // X
      if (fireBtn && !input.fire) input.firePressed = true;
      input.fire = fireBtn;

      const bombBtn = gp.buttons[1]?.pressed; // B
      if (bombBtn && !input.bomb) input.bombPressed = true;
      input.bomb = bombBtn;

      const enterBtn = gp.buttons[3]?.pressed; // Y
      if (enterBtn && !input.enter) input.enterPressed = true;
      input.enter = enterBtn;
    } else if (tag && tag.classList.contains('connected')) {
      tag.textContent = '🎮 Gamepad: Non rilevato';
      tag.classList.remove('connected');
    }
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      $('pause-btn').textContent = '▶ Riprendi';
    } else if (state === 'paused') {
      state = 'playing';
      $('pause-btn').textContent = 'Pausa';
    }
  }

  // Shoot Weapon
  function playerShoot() {
    const w = WEAPONS[player.weapon];
    if (player.ammo <= 0) {
      player.weapon = 'stamp';
      player.ammo = Infinity;
    }

    let sx = player.x + player.dir * 22;
    let sy = player.y - 32;
    if (player.crouch) sy += 16;

    // Calculate bullet trajectory based on aiming
    let vx = player.dir * w.speed;
    let vy = 0;
    if (input.up) {
      if (input.left || input.right) {
        vx = player.dir * w.speed * 0.707;
        vy = -w.speed * 0.707;
      } else {
        vx = 0;
        vy = -w.speed;
        sx = player.x;
        sy = player.y - 56;
      }
    } else if (input.down && !player.grounded) {
      vx = 0;
      vy = w.speed;
      sx = player.x;
      sy = player.y;
    }

    if (player.weapon === 'shotgun') {
      audio?.play('shotgun');
      screenShake = Math.max(screenShake, 8);
      for (let i = -2; i <= 2; i++) {
        const spreadAngle = Math.atan2(vy, vx) + (i * 0.08);
        bullets.push({
          x: sx, y: sy,
          vx: Math.cos(spreadAngle) * w.speed,
          vy: Math.sin(spreadAngle) * w.speed,
          damage: w.damage,
          color: w.color,
          type: 'shotgun',
          life: 0.35
        });
      }
    } else if (player.weapon === 'rocket') {
      audio?.play('rocket');
      bullets.push({
        x: sx, y: sy,
        vx: vx * 0.5, vy: vy * 0.5,
        targetVx: vx, targetVy: vy,
        damage: w.damage,
        color: w.color,
        type: 'rocket',
        life: 2.2
      });
    } else {
      audio?.play(player.weapon === 'heavy' ? 'heavy' : 'shoot');
      bullets.push({
        x: sx, y: sy,
        vx, vy,
        damage: w.damage,
        color: w.color,
        type: player.weapon,
        life: 1.2
      });
    }

    if (player.ammo !== Infinity) player.ammo--;
  }

  // Moke Vehicle Shooting
  function mokeShoot() {
    audio?.play('heavy');
    screenShake = Math.max(screenShake, 6);
    const sx = moke.x + moke.dir * 45;
    const sy = moke.y - 45;
    bullets.push({
      x: sx, y: sy - 8,
      vx: moke.dir * 1050, vy: -50,
      damage: 42,
      color: '#facc15',
      type: 'heavy',
      life: 1.0
    });
    bullets.push({
      x: sx, y: sy + 8,
      vx: moke.dir * 1050, vy: 50,
      damage: 42,
      color: '#facc15',
      type: 'heavy',
      life: 1.0
    });
  }

  // Throw Decree Bomb
  function throwBomb() {
    if (player.bombs <= 0) return;
    player.bombs--;
    audio?.play('jump');
    bullets.push({
      x: player.x,
      y: player.y - 36,
      vx: player.dir * 280,
      vy: -340,
      damage: 280,
      color: '#ef4444',
      type: 'bomb',
      life: 0.95
    });
  }

  // Update loop
  function update(dt) {
    if (state !== 'playing') return;

    screenShake = Math.max(0, screenShake - dt * 18);

    // Moke Vehicle Interaction
    const distToMoke = Math.hypot(player.x - moke.x, player.y - moke.y);
    if (input.enterPressed) {
      if (!player.inVehicle && distToMoke < 85) {
        player.inVehicle = true;
        moke.occupied = true;
        audio?.announce('moke');
        audio?.play('horn');
        addText('MOKE SLUG ATTIVO!', moke.x, moke.y - 80, '#10b981');
      } else if (player.inVehicle) {
        player.inVehicle = false;
        moke.occupied = false;
        player.y = moke.y - 70;
        player.vy = -250;
      }
    }

    if (player.inVehicle) {
      // DRIVE MOKE SLUG
      moke.vx = 0;
      if (input.left) { moke.vx = -240; moke.dir = -1; }
      if (input.right) { moke.vx = 260; moke.dir = 1; }
      if (input.jumpPressed && moke.y >= FLOOR_Y - 2) {
        moke.vy = -420;
        audio?.play('jump');
      }
      moke.vy += 980 * dt;
      moke.x += moke.vx * dt;
      moke.y += moke.vy * dt;
      if (moke.y > FLOOR_Y) { moke.y = FLOOR_Y; moke.vy = 0; }
      moke.x = Math.max(60, Math.min(STAGE_LENGTH - 60, moke.x));

      player.x = moke.x;
      player.y = moke.y - 20;

      // Moke Fire
      moke.cannonTimer -= dt;
      if (input.fire && moke.cannonTimer <= 0) {
        mokeShoot();
        moke.cannonTimer = 0.08;
      }

      // Moke Crushing enemies on ramming
      enemies.forEach(en => {
        if (Math.abs(en.x - moke.x) < 70 && Math.abs(en.y - moke.y) < 50) {
          en.health -= 150;
        }
      });
    } else {
      // ON FOOT PROF. BELLA
      player.vx = 0;
      player.crouch = input.down && player.grounded;

      if (!player.crouch) {
        if (input.left) { player.vx = -210; player.dir = -1; player.phase += dt * 14; }
        if (input.right) { player.vx = 210; player.dir = 1; player.phase += dt * 14; }
      }

      // Jump
      if (input.jumpPressed && player.grounded) {
        player.vy = -480;
        player.grounded = false;
        audio?.play('jump');
      }

      // Gravity & Move
      player.vy += 1150 * dt;
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Platform Collisions
      player.grounded = false;
      if (player.y >= FLOOR_Y) {
        player.y = FLOOR_Y;
        player.vy = 0;
        player.grounded = true;
      } else {
        platforms.forEach(p => {
          if (player.vy >= 0 &&
              player.x + 16 > p.x && player.x - 16 < p.x + p.w &&
              player.y >= p.y && player.y - player.vy * dt <= p.y + 12) {
            player.y = p.y;
            player.vy = 0;
            player.grounded = true;
          }
        });
      }
      player.x = Math.max(30, Math.min(STAGE_LENGTH - 30, player.x));

      // Shooting
      player.fireTimer -= dt;
      if (input.fire && player.fireTimer <= 0) {
        playerShoot();
        player.fireTimer = WEAPONS[player.weapon].delay;
      }

      // Bomb Throw
      if (input.bombPressed) {
        throwBomb();
      }
    }

    // Reset single frame presses
    input.jumpPressed = false;
    input.firePressed = false;
    input.bombPressed = false;
    input.enterPressed = false;

    // Camera follow player smoothly
    const targetCamX = player.x - W * 0.38;
    camera.x = Math.max(0, Math.min(STAGE_LENGTH - W, targetCamX));

    // Update Player Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt;
      if (b.type === 'bomb') {
        b.vy += 700 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y >= FLOOR_Y) {
          b.life = 0;
          addExplosion(b.x, b.y, 28, true);
          // Area of effect damage
          enemies.forEach(en => {
            if (Math.hypot(en.x - b.x, en.y - b.y) < 140) {
              en.health -= b.damage;
            }
          });
          if (Math.hypot(boss.x - b.x, boss.y - b.y) < 180) boss.health -= b.damage;
        }
      } else if (b.type === 'rocket') {
        b.vx += (b.targetVx - b.vx) * 4 * dt;
        b.vy += (b.targetVy - b.vy) * 4 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        // Smoke puff
        if (Math.random() < 0.4) {
          particles.push({
            x: b.x, y: b.y, vx: -b.vx * 0.1, vy: -20, life: 0.3, maxLife: 0.3, color: '#94a3b8', rad: 4, type: 'smoke'
          });
        }
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }

      // Bullet hit enemy
      enemies.forEach(en => {
        if (Math.abs(b.x - en.x) < en.w / 2 + 10 && Math.abs(b.y - (en.y - en.h / 2)) < en.h / 2) {
          if (en.type === 'shielder' && (b.vx > 0 && en.dir < 0) && b.type !== 'bomb') {
            // Blocked by shield!
            b.life = 0;
            audio?.play('hit');
            addText('BLOCCATO AL TAR!', en.x, en.y - 65, '#94a3b8');
          } else {
            en.health -= b.damage;
            b.life = 0;
            audio?.play('hit');
            particles.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 80, vy: -50, life: 0.2, maxLife: 0.2, color: '#ef4444', rad: 3, type: 'spark' });
          }
        }
      });

      // Bullet hit boss
      if (!boss.defeated && Math.abs(b.x - boss.x) < boss.w / 2 && Math.abs(b.y - boss.y) < boss.h / 2) {
        boss.health -= b.damage;
        b.life = 0;
        audio?.play('hit');
      }

      if (b.life <= 0) bullets.splice(i, 1);
    }

    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const en = enemies[i];
      en.phase += dt * 8;
      const distToPlayer = player.x - en.x;
      en.dir = distToPlayer > 0 ? 1 : -1;

      if (en.type === 'runner') {
        // Run towards player
        en.vx = en.dir * 125;
        en.x += en.vx * dt;
        // Melee attack if close
        if (Math.abs(distToPlayer) < 32 && Math.abs(player.y - en.y) < 40) {
          if (player.invincibleTimer <= 0) {
            player.health -= 18;
            player.invincibleTimer = 1.0;
            audio?.play('hit');
            addText('-18 TRANQUILLITÀ', player.x, player.y - 70, '#ef4444');
          }
        }
      } else if (en.type === 'sniper') {
        en.cooldown -= dt;
        if (en.cooldown <= 0 && Math.abs(distToPlayer) < 650) {
          en.cooldown = 2.2 + Math.random();
          // Throw paper airplane / preference sheet
          enemyBullets.push({
            x: en.x, y: en.y - 28,
            vx: en.dir * 280, vy: -110,
            life: 2.2
          });
          audio?.play('shoot');
        }
      }

      // Check Enemy Death
      if (en.health <= 0) {
        addExplosion(en.x, en.y - 28, 12);
        score += en.type === 'shielder' ? 300 : en.type === 'sniper' ? 200 : 100;
        scalzati++;
        addText('+ ' + (en.type === 'shielder' ? 'RICORSO RESPINTO!' : 'SCALZATO!'), en.x, en.y - 50, '#d9f482');
        enemies.splice(i, 1);
      }
    }

    // Update Enemy Bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const eb = enemyBullets[i];
      eb.vy += 120 * dt;
      eb.x += eb.vx * dt;
      eb.y += eb.vy * dt;
      eb.life -= dt;

      // Hit player
      if (Math.hypot(eb.x - player.x, eb.y - (player.y - 30)) < 30) {
        if (!player.inVehicle && player.invincibleTimer <= 0) {
          player.health -= 15;
          player.invincibleTimer = 1.0;
          audio?.play('hit');
          addText('-15 PUNTI', player.x, player.y - 65, '#ef4444');
        }
        eb.life = 0;
      }
      if (eb.life <= 0) enemyBullets.splice(i, 1);
    }

    // Update Boss Fight
    if (player.x > 3450 && !boss.defeated) {
      boss.phase += dt * 3;
      boss.attackTimer -= dt;
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 2.6;
        screenShake = 10;
        audio?.play('shotgun');
        // Volley of paper and toner missiles
        for (let k = -2; k <= 2; k++) {
          enemyBullets.push({
            x: boss.x - 70, y: boss.y + k * 20,
            vx: -320 - Math.random() * 80,
            vy: k * 70,
            life: 2.5
          });
        }
        // Spawn 2 desperate runner precari
        spawnEnemy(boss.x - 40, 'runner');
        spawnEnemy(boss.x - 80, 'runner');
      }

      if (boss.health <= 0) {
        boss.defeated = true;
        addExplosion(boss.x, boss.y, 48, true);
        score += 5000;
        scalzati = TOTAL_PRECARI;
        audio?.announce('complete');
        setTimeout(() => {
          state = 'victory';
          $('victory-score').textContent = score.toLocaleString('it-IT');
          $('victory-screen').classList.remove('hidden');
        }, 1800);
      }
    }

    // Pickups Interaction
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      if (Math.hypot(player.x - p.x, (player.y - 30) - p.y) < 45) {
        audio?.play('pickup');
        if (p.type === 'coffee') {
          player.health = Math.min(player.maxHealth, player.health + 30);
          score += 500;
          addText('+30 TRANQUILLITÀ ☕', player.x, player.y - 70, '#d9f482');
        } else if (p.type === 'cedolino') {
          score += 2000;
          addText('STIPENDIO ACCREDITATO! +2000', player.x, player.y - 70, '#facc15');
        } else if (p.type === 'bomb') {
          player.bombs += 5;
          addText('+5 DECRETI ESCLUSIONE', player.x, player.y - 70, '#ef4444');
        } else {
          player.weapon = p.type;
          player.ammo = WEAPONS[p.type].ammo;
          audio?.announce(p.type);
          addText(WEAPONS[p.type].name + '!', player.x, player.y - 70, '#facc15');
        }
        pickups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.type === 'paper') {
        pt.rot += pt.vrot * dt;
        pt.vy += 70 * dt;
      }
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // Floating text updates
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Invincibility countdown
    if (player.invincibleTimer > 0) player.invincibleTimer -= dt;

    // Check Player Death
    if (player.health <= 0) {
      state = 'gameover';
      audio?.announce('gameover');
      $('gameover-score').textContent = score.toLocaleString('it-IT');
      $('game-over-screen').classList.remove('hidden');
    }

    // Update HTML HUD
    $('hud-score').textContent = score.toLocaleString('it-IT');
    $('hud-health').style.width = Math.max(0, player.health) + '%';
    $('hud-weapon').textContent = WEAPONS[player.weapon].name;
    $('hud-ammo').textContent = player.ammo === Infinity ? '∞' : player.ammo;
    $('hud-bombs').textContent = player.bombs;
    $('hud-scalzati').textContent = Math.min(TOTAL_PRECARI, scalzati) + ' / ' + TOTAL_PRECARI;
  }

  // Draw Parallax & Stage
  function draw() {
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Apply Screen Shake
    if (screenShake > 0) {
      const dx = (Math.random() - 0.5) * screenShake;
      const dy = (Math.random() - 0.5) * screenShake;
      ctx.translate(dx, dy);
    }

    // 1. SKY & SUNSET
    const sky = ctx.createLinearGradient(0, 0, 0, 380);
    sky.addColorStop(0, '#1a1f33');
    sky.addColorStop(0.55, '#c25838');
    sky.addColorStop(1, '#facc15');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 2. PARALLAX LAYER 1: MT. ETNA (Slowest)
    const etnaOffset = (camera.x * 0.12) % W;
    ctx.fillStyle = '#42253b';
    ctx.beginPath();
    ctx.moveTo(-200 - etnaOffset, 390);
    ctx.lineTo(250 - etnaOffset, 160);
    ctx.lineTo(340 - etnaOffset, 160);
    ctx.lineTo(750 - etnaOffset, 390);
    ctx.fill();

    // Etna volcanic smoke
    volcanoSmoke.forEach((sm, i) => {
      const sx = sm.x - etnaOffset;
      const sy = sm.y + Math.sin(Date.now() * 0.002 + sm.phase) * 6;
      ctx.fillStyle = 'rgba(75, 45, 65, 0.75)';
      ctx.beginPath();
      ctx.arc(sx, sy, sm.rad, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. PARALLAX LAYER 2: MEUCCI BUILDINGS & FENCES (Medium)
    const bldgOffset = (camera.x * 0.35) % 600;
    for (let bx = -200 - bldgOffset; bx < W + 600; bx += 320) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx, 240, 280, 160);
      // Windows
      ctx.fillStyle = '#fef08a';
      for (let wx = bx + 20; wx < bx + 260; wx += 45) {
        for (let wy = 260; wy < 380; wy += 35) {
          ctx.fillRect(wx, wy, 26, 18);
        }
      }
    }

    // 4. MAIN ACTION LAYER (Camera space)
    ctx.save();
    ctx.translate(-camera.x, 0);

    // Floor (Asfalto piazzale & linoleum corridoio)
    const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
    floorGrad.addColorStop(0, '#334155');
    floorGrad.addColorStop(0.15, '#1e293b');
    floorGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, FLOOR_Y, STAGE_LENGTH, H - FLOOR_Y);

    // Floor lines & parking yellow spots in courtyard
    for (let px = 100; px < 1600; px += 240) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 5;
      ctx.strokeRect(px, FLOOR_Y + 12, 160, 60);
      ctx.fillStyle = '#facc15';
      ctx.font = '900 13px ui-monospace, monospace';
      ctx.fillText('RISERVATO PROF. BELLA', px + 8, FLOOR_Y + 36);
    }

    // School hallway floor transition (x > 1600)
    for (let tx = 1600; tx < STAGE_LENGTH; tx += 48) {
      ctx.fillStyle = (tx / 48) % 2 === 0 ? '#38485e' : '#273547';
      ctx.fillRect(tx, FLOOR_Y, 48, 12);
    }

    // Draw Platforms
    platforms.forEach((p, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#475569' : '#334155';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      // Legs / supports
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x + 8, p.y + p.h, 8, FLOOR_Y - (p.y + p.h));
      ctx.fillRect(p.x + p.w - 16, p.y + p.h, 8, FLOOR_Y - (p.y + p.h));
      // Platform label
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '700 9px ui-monospace, monospace';
      ctx.fillText(p.label, p.x + 10, p.y + 12);
    });

    // Draw Pickups
    pickups.forEach(p => {
      const bob = Math.sin(Date.now() * 0.006 + p.x) * 5;
      ctx.fillStyle = p.type === 'coffee' ? '#78350f' : p.type === 'cedolino' ? '#047857' : '#d97706';
      ctx.fillRect(p.x - 16, p.y - 16 + bob, 32, 28);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 16, p.y - 16 + bob, 32, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, p.x, p.y + 3 + bob);
      ctx.textAlign = 'left';
    });

    // Draw Moke Vehicle
    if (!moke.occupied) {
      // Prompt above Moke
      ctx.fillStyle = '#d9f482';
      ctx.font = '900 11px ui-monospace, monospace';
      ctx.fillText('▼ PREMI [E] PER SALIRE SULLA MOKE', moke.x - 90, moke.y - 75);
    }
    // Moke Body
    ctx.save();
    ctx.translate(moke.x, moke.y);
    ctx.scale(moke.dir, 1);
    ctx.fillStyle = '#065f46';
    ctx.fillRect(-55, -45, 110, 38);
    // Rollbar
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(-25, -70, 60, 28);
    // Cannons
    ctx.fillStyle = '#64748b';
    ctx.fillRect(15, -64, 45, 8);
    ctx.fillRect(15, -52, 45, 8);
    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-35, -4, 16, 0, Math.PI * 2);
    ctx.arc(35, -4, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Headlight beam if moving
    ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
    ctx.beginPath();
    ctx.moveTo(55, -35);
    ctx.lineTo(240, -60);
    ctx.lineTo(240, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw Enemies (Precari)
    enemies.forEach(en => {
      ctx.save();
      ctx.translate(en.x, en.y);
      ctx.scale(en.dir, 1);
      const stride = Math.sin(en.phase) * 6;

      // Legs
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-4, -12); ctx.lineTo(-6 - stride, 0);
      ctx.moveTo(4, -12); ctx.lineTo(6 + stride, 0);
      ctx.stroke();

      // Body (Suit or cardigan)
      ctx.fillStyle = en.type === 'shielder' ? '#1e3a5f' : en.type === 'sniper' ? '#7c2d12' : '#be185d';
      ctx.fillRect(-10, -42, 20, 30);

      // Head
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(0, -48, 10, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-8, -58, 16, 6);

      // Shield or Item
      if (en.type === 'shielder') {
        // Giant legal shield
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(8, -50, 16, 50);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, -50, 16, 50);
        ctx.fillStyle = '#dc2626';
        ctx.font = '900 8px ui-monospace, monospace';
        ctx.fillText('TAR', 11, -25);
      } else {
        // Holding 60 CFU sheet waving in hand
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, -36 - stride, 12, 16);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, -36 - stride, 12, 16);
      }
      ctx.restore();
    });

    // Draw Boss (La Fotocopiatrice & Il Super Ricorrista)
    if (!boss.defeated) {
      ctx.save();
      ctx.translate(boss.x, boss.y);
      // Boss Chassis
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-boss.w / 2, -boss.h / 2, boss.w, boss.h);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.strokeRect(-boss.w / 2, -boss.h / 2, boss.w, boss.h);
      // Glass Scanner Bed (glowing cyan)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(-boss.w / 2 + 20, -boss.h / 2 + 15, boss.w - 40, 30);
      // Piston Stamp Arm
      const pY = Math.sin(boss.phase) * 20;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-40, -boss.h / 2 - 40 + pY, 80, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 14px ui-monospace, monospace';
      ctx.fillText('RICORSO TAR GIGANTE', -75, -boss.h / 2 - 50);

      // Boss HP Bar
      const hpRatio = Math.max(0, boss.health / boss.maxHealth);
      ctx.fillStyle = '#000';
      ctx.fillRect(-100, -boss.h / 2 - 25, 200, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-100, -boss.h / 2 - 25, 200 * hpRatio, 10);
      ctx.restore();
    }

    // Draw Player (Prof. Bella)
    if (!player.inVehicle) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.dir, 1);

      // Flash when invincible
      if (player.invincibleTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
        const stride = player.crouch ? 0 : Math.sin(player.phase) * 6;

        // Legs
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        if (player.crouch) {
          ctx.moveTo(-6, -8); ctx.lineTo(-14, 0);
          ctx.moveTo(6, -8); ctx.lineTo(14, 0);
        } else {
          ctx.moveTo(-4, -14); ctx.lineTo(-6 - stride, 0);
          ctx.moveTo(4, -14); ctx.lineTo(6 + stride, 0);
        }
        ctx.stroke();

        // Shoes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-12 - stride, -4, 10, 5);
        ctx.fillRect(4 + stride, -4, 10, 5);

        // Body (Giacca blu con camicia e cravatta rossa)
        const bodyH = player.crouch ? 22 : 32;
        const bodyY = player.crouch ? -32 : -46;
        ctx.fillStyle = '#1d4ed8'; // Giacca blu
        ctx.fillRect(-12, bodyY, 24, bodyH);
        ctx.fillStyle = '#f8fafc'; // Camicia
        ctx.fillRect(-4, bodyY, 8, bodyH - 8);
        ctx.fillStyle = '#dc2626'; // Cravatta rossa
        ctx.fillRect(-2, bodyY + 4, 4, 14);

        // Head
        const headY = player.crouch ? -44 : -58;
        ctx.fillStyle = '#fed7aa'; // Carnagione
        ctx.beginPath();
        ctx.arc(0, headY, 11, 0, Math.PI * 2);
        ctx.fill();

        // Occhiali da prof
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(2, headY - 4, 7, 6);

        // Capelli
        ctx.fillStyle = '#475569';
        ctx.fillRect(-8, headY - 12, 16, 5);

        // Arm holding weapon / Timbro del Ruolo
        ctx.fillStyle = '#dc2626'; // Red stamp
        let armX = 12, armY = player.crouch ? -24 : -34;
        if (input.up) { armX = 4; armY = -68; }
        ctx.fillRect(armX, armY, 14, 14);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(armX, armY, 14, 14);
      }
      ctx.restore();
    }

    // Draw Bullets
    bullets.forEach(b => {
      ctx.fillStyle = b.color;
      if (b.type === 'bomb') {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else if (b.type === 'rocket') {
        ctx.fillRect(b.x - 12, b.y - 5, 24, 10);
      } else {
        ctx.fillRect(b.x - 6, b.y - 3, 12, 6);
      }
    });

    // Draw Enemy Bullets
    enemyBullets.forEach(eb => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(eb.x - 8, eb.y);
      ctx.lineTo(eb.x + 8, eb.y - 4);
      ctx.lineTo(eb.x + 8, eb.y + 4);
      ctx.closePath();
      ctx.fill();
    });

    // Draw Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      if (p.type === 'paper') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Floating Texts
    floatingTexts.forEach(ft => {
      ctx.fillStyle = ft.color;
      ctx.font = '900 13px ui-monospace, monospace';
      ctx.fillText(ft.text, ft.x, ft.y);
    });

    ctx.restore(); // Exit camera space

    // 5. STAGE BOUNDARY WARNING OR GO ARROW
    if (state === 'playing' && Math.floor(Date.now() / 300) % 2 === 0) {
      if (enemies.length === 0 && player.x < 3600) {
        ctx.fillStyle = '#d9f482';
        ctx.font = '900 24px ui-monospace, monospace';
        ctx.fillText('AVANTI! ▶▶', W - 180, 140);
      }
    }

    ctx.restore(); // Exit screen shake
  }

  // Animation Loop
  let lastTime = performance.now();
  function gameLoop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    pollGamepad();
    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
  }

  // Setup Button Events
  $('start-btn')?.addEventListener('click', () => { audio?.arm(); resetGame(); });
  $('restart-btn')?.addEventListener('click', () => { audio?.arm(); resetGame(); });
  $('victory-restart-btn')?.addEventListener('click', () => { audio?.arm(); resetGame(); });
  $('pause-btn')?.addEventListener('click', togglePause);

  $('sound-btn')?.addEventListener('click', () => {
    const isMuted = audio?.toggleMute();
    $('sound-btn').textContent = isMuted ? '♫ Suoni: Spenti' : '♫ Suoni: Attivi';
  });

  $('crt-btn')?.addEventListener('click', () => {
    $('crt-overlay').classList.toggle('crt-active');
    const on = $('crt-overlay').classList.contains('crt-active');
    $('crt-btn').textContent = on ? '📺 CRT: Attivo' : '📺 CRT: Spento';
  });

  // Start loop on initial state
  requestAnimationFrame(gameLoop);
})();

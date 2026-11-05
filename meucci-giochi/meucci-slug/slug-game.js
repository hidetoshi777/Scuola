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

  // Sprite Sheets Asset Loader
  const sprites = {
    prof: new Image(),
    moke: new Image(),
    precari: new Image(),
    boss: new Image(),
    items: new Image()
  };
  sprites.prof.src = 'assets/prof-sheet.png';
  sprites.moke.src = 'assets/moke-slug.png';
  sprites.precari.src = 'assets/precari-sheet.png';
  sprites.boss.src = 'assets/boss-copier.png';
  sprites.items.src = 'assets/items-sheet.png';

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

    // 1. SKY & SUNSET GRADIENT (Arcade Warm Glow)
    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#0c1022');
    sky.addColorStop(0.35, '#35183f');
    sky.addColorStop(0.65, '#c2410c');
    sky.addColorStop(0.88, '#f59e0b');
    sky.addColorStop(1, '#fde047');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Arcade Clouds drifting
    const cloudOffset = (Date.now() * 0.015) % W;
    ctx.fillStyle = 'rgba(254, 215, 170, 0.25)';
    for (let cx = -200 + cloudOffset; cx < W + 400; cx += 280) {
      ctx.beginPath();
      ctx.arc(cx, 110, 38, 0, Math.PI * 2);
      ctx.arc(cx + 35, 95, 48, 0, Math.PI * 2);
      ctx.arc(cx + 75, 105, 36, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. PARALLAX LAYER 1: PINETA & SILHOUETTE DI ROMA (Far - 0.12x)
    const farOffset = (camera.x * 0.12) % 400;
    ctx.fillStyle = '#26122d';
    for (let px = -200 - farOffset; px < W + 400; px += 180) {
      // Umbrella pine trees (Pini marittimi di Ostia/Casal Palocco)
      ctx.fillRect(px + 45, 230, 8, 140);
      ctx.beginPath();
      ctx.ellipse(px + 49, 230, 45, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Distant school dome / roofs
    ctx.fillStyle = '#371c3b';
    ctx.beginPath();
    ctx.moveTo(0, 370);
    ctx.lineTo(160, 260);
    ctx.lineTo(260, 260);
    ctx.lineTo(420, 370);
    ctx.fill();

    // 3. PARALLAX LAYER 2: MEUCCI FACADE & CAMPUS GATES (Medium - 0.35x)
    const bldgOffset = (camera.x * 0.35) % 640;
    for (let bx = -240 - bldgOffset; bx < W + 640; bx += 320) {
      // Building block
      ctx.fillStyle = '#1e2438';
      ctx.fillRect(bx, 210, 290, 190);
      ctx.fillStyle = '#2d3752';
      ctx.fillRect(bx + 10, 215, 270, 15); // Roof trim

      // Illuminated classroom windows with silhouettes
      for (let wx = bx + 22; wx < bx + 270; wx += 52) {
        for (let wy = 245; wy < 380; wy += 42) {
          ctx.fillStyle = (wx + wy) % 7 === 0 ? '#fbbf24' : '#fef08a';
          ctx.fillRect(wx, wy, 34, 24);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.strokeRect(wx, wy, 34, 24);
          // Window cross
          ctx.beginPath();
          ctx.moveTo(wx + 17, wy); ctx.lineTo(wx + 17, wy + 24);
          ctx.moveTo(wx, wy + 12); ctx.lineTo(wx + 34, wy + 12);
          ctx.stroke();
        }
      }

      // Neon sign on main facade
      if (bx > 100 && bx < 500) {
        const flicker = Math.sin(Date.now() * 0.02) > -0.8;
        ctx.fillStyle = flicker ? '#38bdf8' : '#0369a1';
        ctx.font = '900 13px ui-monospace, monospace';
        ctx.fillText('⚡ ISTITUTO TECNICO MEUCCI ⚡', bx + 35, 226);
      }
    }

    // 4. MAIN ACTION LAYER (Camera space)
    ctx.save();
    ctx.translate(-camera.x, 0);

    // Floor Base (Piazzale in asfalto & Linoleum corridoio)
    const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
    floorGrad.addColorStop(0, '#334155');
    floorGrad.addColorStop(0.08, '#1e293b');
    floorGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, FLOOR_Y, STAGE_LENGTH, H - FLOOR_Y);

    // Courtyard yellow parking stalls "RISERVATO PROF. BELLA" (0 - 1600)
    for (let px = 80; px < 1600; px += 260) {
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 4;
      ctx.strokeRect(px, FLOOR_Y + 14, 180, 64);
      // Stencil text
      ctx.fillStyle = '#fde047';
      ctx.font = '900 12px ui-monospace, monospace';
      ctx.fillText('POSTO RUOLO 1.100', px + 12, FLOOR_Y + 38);
      ctx.font = '700 10px ui-monospace, monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('RISERVATO PROF. BELLA', px + 12, FLOOR_Y + 56);
      // Streetlamp casting warm cone of light
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px - 20, FLOOR_Y - 140, 6, 140);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(px - 17, FLOOR_Y - 140, 7, 0, Math.PI * 2);
      ctx.fill();
      // Light cone
      ctx.fillStyle = 'rgba(254, 240, 138, 0.07)';
      ctx.beginPath();
      ctx.moveTo(px - 17, FLOOR_Y - 135);
      ctx.lineTo(px + 90, FLOOR_Y);
      ctx.lineTo(px - 120, FLOOR_Y);
      ctx.closePath();
      ctx.fill();
    }

    // Entrance Gate Banner at x = 1600
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(1580, FLOOR_Y - 220, 280, 48);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(1580, FLOOR_Y - 220, 280, 48);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 15px ui-monospace, monospace';
    ctx.fillText('ENTRATA CORRIDOIO MEUCCI', 1600, FLOOR_Y - 198);
    ctx.fillStyle = '#facc15';
    ctx.font = '700 11px ui-monospace, monospace';
    ctx.fillText('ZONA DI RUOLO · VIETATO AI 60 CFU', 1605, FLOOR_Y - 182);

    // School hallway checker floor (x > 1600)
    for (let tx = 1600; tx < STAGE_LENGTH; tx += 48) {
      ctx.fillStyle = (tx / 48) % 2 === 0 ? '#38485e' : '#233044';
      ctx.fillRect(tx, FLOOR_Y, 48, 14);
      // Hallway wall lockers in background
      if (tx < 3500) {
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(tx, FLOOR_Y - 110, 44, 96);
        ctx.strokeStyle = '#172554';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, FLOOR_Y - 110, 44, 96);
        // Locker vent slits
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(tx + 12, FLOOR_Y - 100, 20, 3);
        ctx.fillRect(tx + 12, FLOOR_Y - 94, 20, 3);
        ctx.fillRect(tx + 12, FLOOR_Y - 88, 20, 3);
      }
    }

    // Boss Arena Arch & Red Carpet (x > 3600)
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(3600, FLOOR_Y + 2, 800, 12);
    ctx.fillStyle = '#facc15';
    ctx.font = '900 18px ui-monospace, monospace';
    ctx.fillText('ARCHIVIO GPS · UFFICIO DEL SUPER-RICORRISTA', 3650, FLOOR_Y - 210);

    // Draw Platforms (Classroom Desks & Metallic Catwalks)
    platforms.forEach((p, idx) => {
      // Desk / platform surface
      const woodGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      woodGrad.addColorStop(0, '#b45309');
      woodGrad.addColorStop(0.3, '#d97706');
      woodGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // Yellow hazard edge
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // Steel legs reaching floor
      ctx.fillStyle = '#334155';
      ctx.fillRect(p.x + 8, p.y + p.h, 7, FLOOR_Y - (p.y + p.h));
      ctx.fillRect(p.x + p.w - 15, p.y + p.h, 7, FLOOR_Y - (p.y + p.h));

      // Label plaque
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p.x + 10, p.y + 3, p.w - 20, p.h - 6);
      ctx.fillStyle = '#fde047';
      ctx.font = '900 9px ui-monospace, monospace';
      ctx.fillText(p.label, p.x + 16, p.y + 12);
    });

    // Draw Pickups (Using items-sheet.png)
    pickups.forEach(p => {
      const bob = Math.sin(Date.now() * 0.007 + p.x) * 5;
      const py = p.y + bob;

      // Golden pulsing glow
      ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.beginPath();
      ctx.arc(p.x, py, 22, 0, Math.PI * 2);
      ctx.fill();

      let itemIndex = 0;
      if (p.type === 'heavy') itemIndex = 0;
      else if (p.type === 'shotgun') itemIndex = 1;
      else if (p.type === 'rocket') itemIndex = 2;
      else if (p.type === 'laser') itemIndex = 3;
      else if (p.type === 'cedolino') itemIndex = 4;
      else if (p.type === 'coffee') itemIndex = 5;

      if (sprites.items.complete && sprites.items.naturalWidth > 0) {
        ctx.drawImage(sprites.items, itemIndex * 36, 0, 36, 36, p.x - 18, py - 18, 36, 36);
      } else {
        // Fallback
        ctx.fillStyle = p.type === 'coffee' ? '#78350f' : p.type === 'cedolino' ? '#047857' : '#d97706';
        ctx.fillRect(p.x - 16, py - 16, 32, 28);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 16, py - 16, 32, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x, py + 3);
        ctx.textAlign = 'left';
      }
    });

    // Draw Moke Slug Vehicle (Using moke-slug.png)
    if (!moke.occupied) {
      // Prompt banner above Moke
      ctx.fillStyle = '#d9f482';
      ctx.font = '900 12px ui-monospace, monospace';
      ctx.fillText('▼ PREMI [E] PER SALIRE SULLA MOKE SLUG', moke.x - 110, moke.y - 88);
    }

    ctx.save();
    ctx.translate(moke.x, moke.y);
    ctx.scale(moke.dir, 1);

    // Ground Shadow under Moke
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 58, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (sprites.moke.complete && sprites.moke.naturalWidth > 0) {
      // Determine Moke frame: 0: normal, 1: firing, 2: ramming, 3: damaged
      let mokeFrame = 0;
      if (moke.health < 40) mokeFrame = 3;
      else if (Math.abs(moke.vx) > 260) mokeFrame = 2;
      else if (moke.occupied && input.fire) mokeFrame = 1;

      ctx.drawImage(sprites.moke, mokeFrame * 160, 0, 160, 96, -74, -82, 148, 88);
    } else {
      // Procedural Fallback
      ctx.fillStyle = '#065f46';
      ctx.fillRect(-55, -45, 110, 38);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(-25, -70, 60, 28);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(15, -64, 45, 8);
      ctx.fillRect(15, -52, 45, 8);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-35, -4, 16, 0, Math.PI * 2);
      ctx.arc(35, -4, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw Enemies (Precari using precari-sheet.png)
    enemies.forEach(en => {
      ctx.save();
      ctx.translate(en.x, en.y);
      ctx.scale(en.dir, 1);

      // Shadow under enemy feet
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (sprites.precari.complete && sprites.precari.naturalWidth > 0) {
        // Archetype row: Runner=0, Sniper=1, Shielder=2
        const row = en.type === 'runner' ? 0 : en.type === 'sniper' ? 1 : 2;
        let col = 0;
        if (en.type === 'runner') {
          col = Math.floor(en.phase) % 4;
        } else if (en.type === 'sniper') {
          col = (en.shootTimer < 0.25 ? 2 : 0) + (Math.floor(en.phase) % 2);
        } else { // shielder
          col = Math.floor(en.phase) % 4;
        }
        ctx.drawImage(sprites.precari, col * 64, row * 64, 64, 64, -30, -58, 60, 60);
      } else {
        // Fallback
        const stride = Math.sin(en.phase) * 6;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-4, -12); ctx.lineTo(-6 - stride, 0);
        ctx.moveTo(4, -12); ctx.lineTo(6 + stride, 0);
        ctx.stroke();
        ctx.fillStyle = en.type === 'shielder' ? '#1e3a5f' : en.type === 'sniper' ? '#7c2d12' : '#be185d';
        ctx.fillRect(-10, -42, 20, 30);
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(0, -48, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw Boss (La Fotocopiatrice & Il Super-Ricorrista using boss-copier.png)
    if (!boss.defeated) {
      ctx.save();
      ctx.translate(boss.x, boss.y);

      // Boss Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 95, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      if (sprites.boss.complete && sprites.boss.naturalWidth > 0) {
        const isFiring = boss.state === 'attack' || (boss.phase % 2 > 1.2);
        const col = isFiring ? 1 : 0;
        ctx.drawImage(sprites.boss, col * 220, 0, 220, 170, -110, -165, 220, 170);

        // Pulsing Cyan Scanner Laser Beam
        const scanOffset = Math.sin(Date.now() * 0.008) * 45;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fillRect(-60 + scanOffset, -150, 25, 150);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(-60 + scanOffset, -150, 25, 150);
      } else {
        // Fallback
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-boss.w / 2, -boss.h / 2, boss.w, boss.h);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.strokeRect(-boss.w / 2, -boss.h / 2, boss.w, boss.h);
      }

      // Boss HP Bar with Arcade Metal Frame
      const hpRatio = Math.max(0, boss.health / boss.maxHealth);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-112, -boss.h / 2 - 40, 224, 18);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(-112, -boss.h / 2 - 40, 224, 18);
      // Red fill
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-110, -boss.h / 2 - 38, 220 * hpRatio, 14);
      // Boss Name Plaque
      ctx.fillStyle = '#fde047';
      ctx.font = '900 11px ui-monospace, monospace';
      ctx.fillText('⚠ FOTOCOPIATRICE INCEPPATA & SUPER-RICORRISTA', -105, -boss.h / 2 - 45);

      ctx.restore();
    }

    // Draw Player (Prof. Bella using prof-sheet.png from Blender 3D)
    if (!player.inVehicle) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.dir, 1);

      // Flash when invincible
      const isVisible = player.invincibleTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0;

      if (isVisible) {
        // Ground Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (sprites.prof.complete && sprites.prof.naturalWidth > 0) {
          let col = 0, row = 0;
          if (player.grounded) {
            if (Math.abs(player.vx) > 10) {
              // Run cycle (Row 0, cols 0-7)
              row = 0;
              col = Math.floor(player.phase) % 8;
            } else {
              // Idle / Shooting
              row = 1;
              if (player.fireTimer > 0.04) {
                col = 7; // Muzzle flash
              } else {
                col = Math.floor(Date.now() / 250) % 4; // Idle 0-3
              }
            }
          } else {
            // Jump in air
            row = 1;
            col = player.vy < 0 ? 4 : 5; // Jump Up or Jump Down
          }

          // Draw 128x128 sprite centered over player feet
          ctx.drawImage(sprites.prof, col * 128, row * 128, 128, 128, -42, -74, 84, 84);
        } else {
          // Fallback
          const stride = player.crouch ? 0 : Math.sin(player.phase) * 6;
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(-4, -14); ctx.lineTo(-6 - stride, 0);
          ctx.moveTo(4, -14); ctx.lineTo(6 + stride, 0);
          ctx.stroke();
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(-12, -46, 24, 32);
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -58, 11, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Dynamic Bullets & Explosions (Additive Lighting)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Player Bullets
    bullets.forEach(b => {
      ctx.fillStyle = b.color;
      if (b.type === 'bomb') {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.stroke();
      } else if (b.type === 'rocket') {
        ctx.fillRect(b.x - 14, b.y - 6, 28, 12);
        // Rocket exhaust plume
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(b.x - 22, b.y - 3, 8, 6);
      } else if (b.type === 'laser') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(b.x - 24, b.y - 4, 48, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x - 18, b.y - 2, 36, 4);
      } else {
        // Heavy Machine Gun / Timbro bullet with arcade glow
        ctx.fillRect(b.x - 8, b.y - 4, 16, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x - 4, b.y - 2, 8, 4);
      }
    });

    // Enemy Paper Bullets
    enemyBullets.forEach(eb => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(eb.x - 10, eb.y);
      ctx.lineTo(eb.x + 10, eb.y - 5);
      ctx.lineTo(eb.x + 10, eb.y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(eb.x - 2, eb.y - 2, 6, 4); // Red official stamp
    });

    ctx.restore(); // Exit lighter mode

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
      ctx.font = '900 14px ui-monospace, monospace';
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

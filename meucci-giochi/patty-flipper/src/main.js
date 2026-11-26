import { PinballPhysics } from './physics.js';
import { PinballScene3D } from './scene3d.js';
import { PinballAudio } from './audio.js';

const STORE_KEY = 'patty-pinball-best:v1';

const canvas = document.getElementById('pinball-canvas');
const stageEl = document.getElementById('game-stage');
const hudScore = document.getElementById('hud-score');
const hudMult = document.getElementById('hud-mult');
const hudBalls = document.getElementById('hud-balls');
const hudFever = document.getElementById('hud-fever');
const hudBallSave = document.getElementById('hud-ballsave');
const calloutEl = document.getElementById('callout');
const floatingPopups = document.getElementById('floating-popups');
const plungerMeter = document.getElementById('plunger-meter');
const plungerFill = document.getElementById('plunger-fill');
const startBest = document.getElementById('start-best');
const gameoverSummary = document.getElementById('gameover-summary');

const patLeds = [
  document.getElementById('led-P'),
  document.getElementById('led-A'),
  document.getElementById('led-T'),
];
const biscuitLeds = [
  document.getElementById('led-B0'),
  document.getElementById('led-B1'),
  document.getElementById('led-B2'),
];

const startDialog = document.getElementById('start-dialog');
const pauseDialog = document.getElementById('pause-dialog');
const gameoverDialog = document.getElementById('gameover-dialog');

const btnMute = document.getElementById('btn-mute');
const btnFs = document.getElementById('btn-fs');
const btnPause = document.getElementById('btn-pause');
const touchLeft = document.getElementById('touch-left');
const touchRight = document.getElementById('touch-right');
const touchLaunch = document.getElementById('touch-launch');
const touchNudge = document.getElementById('touch-nudge');

const sim = new PinballPhysics();
const scene3d = new PinballScene3D(canvas);
const audio = new PinballAudio();

try {
  sim.highScore = Number(localStorage.getItem(STORE_KEY)) || 0;
} catch {}
startBest.textContent = sim.highScore.toLocaleString('it-IT');

let calloutTimer = null;
function showCallout(text) {
  calloutEl.textContent = text;
  calloutEl.classList.add('is-visible');
  clearTimeout(calloutTimer);
  calloutTimer = setTimeout(() => calloutEl.classList.remove('is-visible'), 1250);
}

function spawnScorePopup(x, z, text, color = '#fff6c9') {
  if (!floatingPopups) return;
  const pt = scene3d.projectToScreen(x, 0.6, z);
  const el = document.createElement('span');
  el.className = 'score-popup';
  el.textContent = text;
  el.style.left = `${Math.round(pt.x)}px`;
  el.style.top = `${Math.round(pt.y)}px`;
  el.style.color = color;
  floatingPopups.appendChild(el);
  if (floatingPopups.childElementCount > 10) {
    floatingPopups.firstElementChild?.remove();
  }
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function saveHighScore() {
  try {
    localStorage.setItem(STORE_KEY, String(sim.highScore));
  } catch {}
}

function startNewMatch() {
  audio.unlock();
  sim.startMatch();
  showCallout('Tira la molla e lancia!');
  updateHud();
}

function pauseMatch() {
  if (sim.phase !== 'playing') return;
  sim.phase = 'paused';
  sim.setFlipper('left', false);
  sim.setFlipper('right', false);
  if (!pauseDialog.open) pauseDialog.showModal();
}

function openGameOver() {
  saveHighScore();
  gameoverSummary.textContent = `Hai totalizzato ${sim.score.toLocaleString('it-IT')} punti (Record: ${sim.highScore.toLocaleString('it-IT')}).`;
  if (!gameoverDialog.open) gameoverDialog.showModal();
}

// Listener native <dialog> con reset di returnValue per modern-web-guidance
startDialog.addEventListener('close', () => {
  const choice = startDialog.returnValue;
  startDialog.returnValue = '';
  if (choice === 'play' || sim.phase === 'title') {
    startNewMatch();
  }
});

pauseDialog.addEventListener('close', () => {
  const choice = pauseDialog.returnValue;
  pauseDialog.returnValue = '';
  if (choice === 'restart') {
    startNewMatch();
  } else if (sim.phase === 'paused') {
    sim.phase = 'playing';
  }
});

gameoverDialog.addEventListener('close', () => {
  const choice = gameoverDialog.returnValue;
  gameoverDialog.returnValue = '';
  if (choice === 'replay' || sim.phase === 'gameover') {
    startNewMatch();
  }
});

// Input tastiera
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA', 'KeyZ', 'ShiftLeft']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD', 'Slash', 'ShiftRight']);
const LAUNCH_KEYS = new Set(['Space', 'ArrowDown', 'Enter']);

window.addEventListener('keydown', e => {
  if (LEFT_KEYS.has(e.code) || RIGHT_KEYS.has(e.code) || LAUNCH_KEYS.has(e.code) || ['ArrowUp', 'KeyW', 'KeyT'].includes(e.code)) {
    e.preventDefault();
  }
  audio.unlock();

  if (e.repeat) return;

  if (sim.phase === 'title' && (e.code === 'Space' || e.code === 'Enter')) {
    if (startDialog.open) startDialog.close('play');
    else startNewMatch();
    return;
  }

  if (e.code === 'KeyP') {
    if (sim.phase === 'playing') pauseMatch();
    else if (sim.phase === 'paused' && pauseDialog.open) pauseDialog.close('resume');
    return;
  }

  if (e.code === 'KeyR' && sim.phase !== 'title') {
    if (pauseDialog.open) pauseDialog.close('restart');
    else if (gameoverDialog.open) gameoverDialog.close('replay');
    else startNewMatch();
    return;
  }

  if (sim.phase !== 'playing') return;

  if (LEFT_KEYS.has(e.code)) {
    sim.setFlipper('left', true);
    touchLeft.classList.add('is-active');
  }
  if (RIGHT_KEYS.has(e.code)) {
    sim.setFlipper('right', true);
    touchRight.classList.add('is-active');
  }
  if (LAUNCH_KEYS.has(e.code) && sim.ball.inShooter) {
    sim.setPlungerCharge(true);
    touchLaunch.classList.add('is-active');
  }
  if (e.code === 'KeyT' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    sim.nudge(0);
  }
});

window.addEventListener('keyup', e => {
  if (LEFT_KEYS.has(e.code)) {
    sim.setFlipper('left', false);
    touchLeft.classList.remove('is-active');
  }
  if (RIGHT_KEYS.has(e.code)) {
    sim.setFlipper('right', false);
    touchRight.classList.remove('is-active');
  }
  if (LAUNCH_KEYS.has(e.code)) {
    sim.setPlungerCharge(false);
    touchLaunch.classList.remove('is-active');
  }
});

window.addEventListener('blur', () => {
  sim.setFlipper('left', false);
  sim.setFlipper('right', false);
  sim.setPlungerCharge(false);
});

// Controlli Touch / Pointer
function bindHold(el, onDown, onUp) {
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    audio.unlock();
    el.classList.add('is-active');
    onDown();
  });
  const release = () => {
    el.classList.remove('is-active');
    onUp();
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', release);
}

bindHold(touchLeft, () => sim.setFlipper('left', true), () => sim.setFlipper('left', false));
bindHold(touchRight, () => sim.setFlipper('right', true), () => sim.setFlipper('right', false));
bindHold(touchLaunch, () => sim.setPlungerCharge(true), () => sim.setPlungerCharge(false));

touchNudge.addEventListener('click', () => {
  audio.unlock();
  sim.nudge(0);
});

// Tap diretto sul lato destro/sinistro del canvas per giocare comodamente anche senza premere esattamente i bottoni
canvas.addEventListener('pointerdown', e => {
  if (sim.phase !== 'playing') return;
  audio.unlock();
  if (sim.ball.inShooter) {
    sim.setPlungerCharge(true);
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
  if (relX < 0.5) sim.setFlipper('left', true);
  else sim.setFlipper('right', true);
});
window.addEventListener('pointerup', () => {
  if (sim.plungerCharging) sim.setPlungerCharge(false);
  sim.setFlipper('left', false);
  sim.setFlipper('right', false);
});

btnMute.addEventListener('click', () => {
  audio.unlock();
  audio.setMuted(!audio.muted);
  btnMute.textContent = audio.muted ? '🔇' : '🔊';
});

btnPause.addEventListener('click', pauseMatch);

btnFs.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
});

window.addEventListener('resize', () => scene3d.resize());

function handleEvents(events) {
  for (const ev of events) {
    if (ev.type === 'flipper') audio.flipper();
    else if (ev.type === 'flipperHit') {
      audio.flipperHit();
      scene3d.spawnSparks(ev.x, ev.z, 0xfff3c4, 6);
    } else if (ev.type === 'bumper') {
      audio.bumper(ev.combo);
      const colors = [0xff3ea5, 0xffbe3b, 0x4fd1c5];
      scene3d.spawnSparks(ev.x, ev.z, colors[ev.index] ?? 0xffbe3b, 12);
      spawnScorePopup(ev.x, ev.z, `+${ev.points}`, ev.index === 0 ? '#ff9ee0' : '#ffe494');
      if (ev.combo >= 3) {
        scene3d.triggerPattyJump(0.65);
        showCallout(`${ev.label} ×${ev.combo}! +${ev.points}`);
      }
    } else if (ev.type === 'slingshot') {
      audio.slingshot();
      scene3d.spawnSparks(ev.x, ev.z, 0xff9f2e, 8);
      spawnScorePopup(ev.x, ev.z, `+${ev.points}`, '#ffb86b');
    } else if (ev.type === 'launch') {
      audio.launch(ev.power);
      scene3d.spawnSparks(ev.x, ev.z, 0x4fd1c5, 10);
      showCallout('In gioco!');
    } else if (ev.type === 'rollover') {
      audio.rollover(ev.index);
      scene3d.spawnSparks(ev.x, ev.z, 0xffbe3b, 6);
      spawnScorePopup(ev.x, ev.z, `${ev.letter} +${ev.points}`, '#ffe066');
    } else if (ev.type === 'multiplierUp') {
      audio.multiplierUp();
      scene3d.triggerPattyJump(0.95);
      scene3d.spawnSparks(ev.x, ev.z, 0xffbe3b, 16);
      showCallout(`P-A-T! Moltiplicatore ${ev.multiplier}× (+${ev.points})`);
    } else if (ev.type === 'dropTarget') {
      audio.dropTarget();
      scene3d.spawnSparks(ev.x, ev.z, 0xffd166, 9);
      spawnScorePopup(ev.x, ev.z, `+${ev.points}`, '#ffd166');
      showCallout(`Biscotto! +${ev.points}`);
    } else if (ev.type === 'feverStart') {
      audio.feverStart();
      scene3d.triggerPattyJump(1.25);
      scene3d.spawnSparks(ev.x, ev.z, 0xff3ea5, 22);
      spawnScorePopup(ev.x, ev.z, 'FEVER 2×!', '#ff70c8');
      showCallout('ELEFANTINO FEVER 2×!');
    } else if (ev.type === 'spinner') {
      audio.spinner();
      scene3d.spawnSparks(ev.x, ev.z, 0x4fd1c5, 8);
      spawnScorePopup(ev.x, ev.z, `+${ev.points}`, '#81f0e6');
    } else if (ev.type === 'ballSave') {
      audio.ballSave();
      scene3d.triggerPattyJump(0.9);
      showCallout('ZAMPA SALVA! Rilancio!');
    } else if (ev.type === 'nudge') {
      showCallout('Occhio al TILT!');
    } else if (ev.type === 'tilt') {
      audio.tilt();
      showCallout('TILT! Flipper bloccati!');
    } else if (ev.type === 'drain') {
      audio.drain();
      showCallout(`Palline rimaste: ${ev.ballsLeft}`);
    } else if (ev.type === 'gameover') {
      audio.drain();
      openGameOver();
    }
  }
}

function updateHud() {
  hudScore.textContent = sim.score.toLocaleString('it-IT').padStart(6, '0');
  hudMult.textContent = `${sim.multiplier}×`;
  hudBalls.textContent = '●'.repeat(Math.max(0, sim.ballsLeft)) + '○'.repeat(Math.max(0, 3 - sim.ballsLeft));
  hudFever.hidden = sim.feverTime <= 0;
  hudBallSave.hidden = !(sim.ballSaveTime > 0 && !sim.ball.inShooter);

  plungerMeter.hidden = !(sim.phase === 'playing' && sim.ball.inShooter);
  plungerFill.style.height = `${Math.round(sim.plungerPower * 100)}%`;

  for (let i = 0; i < 3; i++) {
    patLeds[i].classList.toggle('is-lit', sim.rolloverLit[i]);
    biscuitLeds[i].classList.toggle('is-lit', sim.dropDown[i]);
  }
}

// Loop principale
let lastTime = performance.now();
let frameTick = 0;
function loop(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
  lastTime = now;

  if (sim.phase === 'playing') {
    frameTick += 1;
    const events = sim.step(dt);
    if (events.length) {
      handleEvents(events);
      saveHighScore();
    }
    updateHud();
  }

  scene3d.render(sim, dt, now / 1000);
  requestAnimationFrame(loop);
}

// Contratto OpenGame QA & playtesting
window.__omGame = {
  start() {
    if (startDialog.open) startDialog.close('play');
    else if (sim.phase !== 'playing') startNewMatch();
  },
  getState() {
    return {
      phase: sim.phase,
      running: sim.phase === 'playing',
      tick: frameTick,
      selfId: 'player-1',
      players: {
        'player-1': {
          x: Number(sim.ball.x.toFixed(3)),
          z: Number(sim.ball.z.toFixed(3)),
          connected: true,
        },
      },
      score: sim.score,
      highScore: sim.highScore,
      ballsLeft: sim.ballsLeft,
      multiplier: sim.multiplier,
      feverTime: Number(sim.feverTime.toFixed(2)),
      ball: {
        x: Number(sim.ball.x.toFixed(3)),
        z: Number(sim.ball.z.toFixed(3)),
        vx: Number(sim.ball.vx.toFixed(3)),
        vz: Number(sim.ball.vz.toFixed(3)),
        inShooter: sim.ball.inShooter,
      },
      rollovers: [...sim.rolloverLit],
      dropDown: [...sim.dropDown],
      pattyLoaded: scene3d.pattyLoaded,
      toysLoaded: scene3d.toysLoaded,
      cabinetLoaded: scene3d.cabinetLoaded,
      ready: scene3d.pattyLoaded && scene3d.toysLoaded && scene3d.cabinetLoaded,
      result: sim.phase === 'gameover' ? 'ended' : null,
    };
  },
  getStats() {
    return {
      tick: frameTick,
      score: sim.score,
      highScore: sim.highScore,
      bumperHits: sim.bumperHits,
      comboMax: sim.comboMax,
      feverCount: sim.feverCount,
      ballsPlayed: sim.ballsPlayed,
      pattyLoaded: scene3d.pattyLoaded,
    };
  },
  sendAction(action) {
    if (!action || typeof action !== 'object') return false;
    if (action.type === 'start') {
      if (startDialog.open) startDialog.close('play');
      else if (sim.phase !== 'playing') startNewMatch();
      return true;
    }
    if (action.type === 'restart') {
      if (pauseDialog.open) pauseDialog.close('restart');
      else if (gameoverDialog.open) gameoverDialog.close('replay');
      else startNewMatch();
      return true;
    }
    if (action.type === 'launch') {
      if (sim.phase !== 'playing') this.sendAction({ type: 'start' });
      return sim.launchBall(action.power ?? 0.9);
    }
    if (action.type === 'flipLeft') {
      sim.setFlipper('left', action.down ?? true);
      return true;
    }
    if (action.type === 'flipRight') {
      sim.setFlipper('right', action.down ?? true);
      return true;
    }
    return false;
  },
  runSelfTests() {
    const tests = [];
    const probe = new PinballPhysics();
    probe.startMatch();

    // 1. Lancio dal plunger entra nel playfield
    const launched = probe.launchBall(0.92);
    for (let i = 0; i < 180; i++) probe.step(1 / 60);
    tests.push({
      name: 'launchEntersPlayfield',
      passed: launched && !probe.ball.inShooter,
      expected: 'inShooter === false within 3s of launch',
      actual: { launched, inShooter: probe.ball.inShooter, x: probe.ball.x, z: probe.ball.z },
    });

    // 2. Collisione bumper incrementa score e respinge
    const pBumper = new PinballPhysics();
    pBumper.startMatch();
    pBumper.ball.inShooter = false;
    pBumper.ball.x = -0.35;
    pBumper.ball.z = -3.15;
    pBumper.ball.vx = 0;
    pBumper.ball.vz = -6.0;
    for (let i = 0; i < 20; i++) pBumper.step(1 / 60);
    tests.push({
      name: 'bumperScoresAndRebounds',
      passed: pBumper.score >= 250 && pBumper.bumperHits >= 1,
      expected: 'score >= 250 and bumperHits >= 1',
      actual: { score: pBumper.score, bumperHits: pBumper.bumperHits },
    });

    // 3. Flipper colpisce pallina verso l'alto
    const pFlip = new PinballPhysics();
    pFlip.startMatch();
    pFlip.ball.inShooter = false;
    pFlip.ball.x = -1.15;
    pFlip.ball.z = 6.22;
    pFlip.ball.vx = 0;
    pFlip.ball.vz = 3.0;
    pFlip.setFlipper('left', true);
    let minVz = 99;
    for (let i = 0; i < 15; i++) {
      pFlip.step(1 / 60);
      minVz = Math.min(minVz, pFlip.ball.vz);
    }
    tests.push({
      name: 'flipperHitsUpward',
      passed: minVz < -3.5,
      expected: 'ball velocity vz < -3.5 after flipper strike',
      actual: { minVz: Number(minVz.toFixed(2)) },
    });

    // 4. Abbattimento 3 drop target attiva Elefantino Fever
    const pDrop = new PinballPhysics();
    pDrop.startMatch();
    pDrop.ball.inShooter = false;
    pDrop.dropDown = [true, true, false];
    pDrop.ball.x = -3.8;
    pDrop.ball.z = -1.3;
    pDrop.ball.vx = -6.0;
    pDrop.ball.vz = 0;
    for (let i = 0; i < 25; i++) pDrop.step(1 / 60);
    tests.push({
      name: 'dropTargetsTriggerFever',
      passed: pDrop.feverTime > 0 && pDrop.feverCount === 1,
      expected: 'feverTime > 0 and feverCount === 1',
      actual: { feverTime: pDrop.feverTime, feverCount: pDrop.feverCount },
    });

    // 5. Drain senza ball-save decrementa ballsLeft
    const pDrain = new PinballPhysics();
    pDrain.startMatch();
    pDrain.ball.inShooter = false;
    pDrain.ballSaveTime = 0;
    pDrain.ball.x = -0.35;
    pDrain.ball.z = 8.7;
    pDrain.ball.vz = 5;
    pDrain.step(1 / 60);
    tests.push({
      name: 'drainDecrementsBallsLeft',
      passed: pDrain.ballsLeft === 2,
      expected: 'ballsLeft === 2',
      actual: { ballsLeft: pDrain.ballsLeft },
    });

    return tests;
  },
};

updateHud();
const params = new URLSearchParams(window.location.search);
if (params.has('autostart')) {
  startNewMatch();
  // Lancia automaticamente in modalità autostart/cover così la pallina è subito viva sul tavolo
  sim.launchBall(0.88);
} else {
  startDialog.showModal();
}

requestAnimationFrame(loop);

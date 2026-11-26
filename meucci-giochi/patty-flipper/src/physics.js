import {
  TABLE,
  WALL_SEGMENTS,
  ONE_WAY_GATE,
  FLIPPERS,
  BUMPERS,
  SLINGSHOTS,
  ROLLOVERS,
  DROP_TARGETS,
  ORBIT_SPINNER,
} from './table-layout.js';

const GRAVITY_Z = 13.8;
const MAX_SPEED = 24.5;
const SUBSTEPS = 8;
const FLIPPER_UP_SPEED = 24.0;
const FLIPPER_DOWN_SPEED = 15.0;
const BALL_SAVE_DURATION = 8.0;
const FEVER_DURATION = 15.0;

export class PinballPhysics {
  constructor() {
    this.highScore = 0;
    this.resetMatch();
  }

  resetMatch() {
    this.phase = 'title'; // 'title' | 'playing' | 'paused' | 'gameover'
    this.score = 0;
    this.ballsLeft = 3;
    this.ballsPlayed = 1;
    this.multiplier = 1;
    this.feverTime = 0;
    this.feverCount = 0;
    this.ballSaveTime = 0;
    this.bumperHits = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboMax = 0;

    this.rolloverLit = [false, false, false];
    this.dropDown = [false, false, false];
    this.bumperFlash = [0, 0, 0];
    this.slingFlash = [0, 0];
    this.spinnerAngle = 0;
    this.spinnerCooldown = 0;
    this.rolloverCooldown = [0, 0, 0];

    this.leftPressed = false;
    this.rightPressed = false;
    this.flipperAngles = FLIPPERS.map(f => f.restAngle);
    this.flipperOmegas = [0, 0];

    this.plungerCharging = false;
    this.plungerPower = 0;
    this.nudgeCount = 0;
    this.nudgeWindow = 0;
    this.tiltTime = 0;
    this.shake = 0;

    this.events = [];
    this.spawnBall();
  }

  spawnBall() {
    this.ball = {
      x: TABLE.shooterLaneCenterX,
      z: TABLE.plungerRestZ - TABLE.ballRadius - 0.08,
      vx: 0,
      vz: 0,
      inShooter: true,
    };
    this.plungerCharging = false;
    this.plungerPower = 0;
    this.ballSaveTime = 0;
    this.tiltTime = 0;
    this.nudgeCount = 0;
  }

  startMatch() {
    this.resetMatch();
    this.phase = 'playing';
  }

  setFlipper(side, down) {
    const prev = side === 'left' ? this.leftPressed : this.rightPressed;
    if (side === 'left') this.leftPressed = Boolean(down);
    else this.rightPressed = Boolean(down);

    if (this.phase === 'playing' && !prev && down && this.tiltTime <= 0) {
      this.events.push({ type: 'flipper', side });
      // Lane-change sulle corsie P-A-T come nei veri flipper
      this.rotateRollovers(side === 'left' ? -1 : 1);
    }
  }

  rotateRollovers(dir) {
    const lit = this.rolloverLit;
    if (dir > 0) {
      this.rolloverLit = [lit[2], lit[0], lit[1]];
    } else {
      this.rolloverLit = [lit[1], lit[2], lit[0]];
    }
  }

  setPlungerCharge(charging) {
    if (this.phase !== 'playing') return;
    if (!this.ball.inShooter) return;
    if (charging) {
      this.plungerCharging = true;
    } else if (this.plungerCharging) {
      const power = Math.max(0.32, this.plungerPower);
      this.plungerCharging = false;
      this.plungerPower = 0;
      this.launchBall(power);
    }
  }

  launchBall(power = 0.85) {
    if (!this.ball.inShooter) return false;
    const p = Math.max(0.25, Math.min(1.0, power));
    this.ball.vz = -(16.5 + p * 14.5);
    this.ball.vx = (Math.random() - 0.5) * 0.12;
    this.ballSaveTime = BALL_SAVE_DURATION;
    this.events.push({ type: 'launch', power: p, x: this.ball.x, z: this.ball.z });
    return true;
  }

  nudge(dirX = 0) {
    if (this.phase !== 'playing' || this.ball.inShooter || this.tiltTime > 0) return false;
    if (this.nudgeWindow <= 0) this.nudgeCount = 0;
    this.nudgeCount += 1;
    this.nudgeWindow = 2.5;
    this.shake = Math.min(1, this.shake + 0.55);

    if (this.nudgeCount >= 3) {
      this.tiltTime = 2.8;
      this.leftPressed = false;
      this.rightPressed = false;
      this.events.push({ type: 'tilt', x: this.ball.x, z: this.ball.z });
      return true;
    }

    this.ball.vx += dirX * 1.9 + (Math.random() - 0.5) * 0.8;
    this.ball.vz -= 2.1;
    this.events.push({ type: 'nudge', x: this.ball.x, z: this.ball.z });
    return true;
  }

  addScore(basePoints) {
    const feverMult = this.feverTime > 0 ? 2 : 1;
    const total = Math.round(basePoints * this.multiplier * feverMult);
    this.score += total;
    if (this.score > this.highScore) this.highScore = this.score;
    return total;
  }

  step(dt) {
    this.events.length = 0;
    if (this.phase !== 'playing') return this.events;

    const clampedDt = Math.min(dt, 1 / 30);

    // Timer di stato
    if (this.feverTime > 0) this.feverTime = Math.max(0, this.feverTime - clampedDt);
    if (this.ballSaveTime > 0 && !this.ball.inShooter) {
      this.ballSaveTime = Math.max(0, this.ballSaveTime - clampedDt);
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= clampedDt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.nudgeWindow > 0) this.nudgeWindow = Math.max(0, this.nudgeWindow - clampedDt);
    if (this.tiltTime > 0) this.tiltTime = Math.max(0, this.tiltTime - clampedDt);
    if (this.spinnerCooldown > 0) this.spinnerCooldown = Math.max(0, this.spinnerCooldown - clampedDt);
    for (let i = 0; i < 3; i++) {
      this.bumperFlash[i] = Math.max(0, this.bumperFlash[i] - clampedDt * 4.5);
      this.rolloverCooldown[i] = Math.max(0, this.rolloverCooldown[i] - clampedDt);
    }
    for (let i = 0; i < 2; i++) {
      this.slingFlash[i] = Math.max(0, this.slingFlash[i] - clampedDt * 5.0);
    }
    this.shake = Math.max(0, this.shake - clampedDt * 3.5);
    this.spinnerAngle += clampedDt * (this.spinnerCooldown > 0 ? 22 : 1.5);

    if (this.plungerCharging && this.ball.inShooter) {
      this.plungerPower = Math.min(1, this.plungerPower + clampedDt * 1.15);
    }

    const subDt = clampedDt / SUBSTEPS;
    for (let s = 0; s < SUBSTEPS; s++) {
      this.stepSub(subDt);
    }

    return this.events;
  }

  stepSub(dt) {
    const ball = this.ball;
    const r = TABLE.ballRadius;

    // Aggiorna angoli flipper
    for (let i = 0; i < FLIPPERS.length; i++) {
      const f = FLIPPERS[i];
      const active = this.tiltTime <= 0 && (i === 0 ? this.leftPressed : this.rightPressed);
      const target = active ? f.activeAngle : f.restAngle;
      const diff = target - this.flipperAngles[i];
      const maxRate = active ? FLIPPER_UP_SPEED : FLIPPER_DOWN_SPEED;
      const stepAng = Math.sign(diff) * Math.min(Math.abs(diff), maxRate * dt);
      this.flipperOmegas[i] = dt > 0 ? stepAng / dt : 0;
      this.flipperAngles[i] += stepAng;
    }

    // In shooter lane a riposo sulla molla
    const plungerTopZ = TABLE.plungerRestZ + this.plungerPower * 0.72 - r;
    if (ball.inShooter && ball.z >= plungerTopZ - 0.01 && ball.vz >= 0) {
      ball.z = plungerTopZ;
      ball.vz = 0;
      ball.vx *= 0.85;
      ball.x = Math.max(TABLE.shooterDividerX + r + 0.02, Math.min(4.92 - r - 0.02, ball.x));
      return;
    }

    // Integrazione velocità & posizione
    ball.vz += GRAVITY_Z * dt;
    const damp = Math.pow(0.992, dt * 60);
    ball.vx *= damp;
    ball.vz *= damp;

    const speed = Math.hypot(ball.vx, ball.vz);
    if (speed > MAX_SPEED) {
      const k = MAX_SPEED / speed;
      ball.vx *= k;
      ball.vz *= k;
    }

    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;

    if (ball.inShooter && ball.x < TABLE.shooterDividerX - r * 0.5) {
      ball.inShooter = false;
    }

    // Pareti & guide statiche
    for (let i = 0; i < WALL_SEGMENTS.length; i++) {
      const seg = WALL_SEGMENTS[i];
      this.collideSegment(seg.x1, seg.z1, seg.x2, seg.z2, 0.04, seg.restitution);
    }

    // Gate unidirezionale sulla shooter lane
    if (!ball.inShooter) {
      this.collideSegment(ONE_WAY_GATE.x1, ONE_WAY_GATE.z1, ONE_WAY_GATE.x2, ONE_WAY_GATE.z2, 0.04, 0.55);
    }

    // Slingshot (triangoli con kicker su un lato)
    for (let i = 0; i < SLINGSHOTS.length; i++) {
      const sl = SLINGSHOTS[i];
      const v = sl.vertices;
      const k = sl.kicker;
      if (this.collideSegment(k.x1, k.z1, k.x2, k.z2, 0.06, 0.9)) {
        if (this.tiltTime <= 0) {
          ball.vx += k.nx * k.impulse;
          ball.vz += k.nz * k.impulse;
          this.slingFlash[i] = 1;
          const pts = this.addScore(k.score);
          this.events.push({ type: 'slingshot', index: i, points: pts, x: ball.x, z: ball.z });
        }
      }
      this.collideSegment(v[0].x, v[0].z, v[1].x, v[1].z, 0.05, 0.55);
      this.collideSegment(v[1].x, v[1].z, v[2].x, v[2].z, 0.05, 0.55);
    }

    // Drop target ("Biscotti Cucina")
    for (let i = 0; i < DROP_TARGETS.length; i++) {
      if (this.dropDown[i]) continue;
      const t = DROP_TARGETS[i];
      if (this.collideSegment(t.x1, t.z1, t.x2, t.z2, 0.08, 0.8)) {
        this.dropDown[i] = true;
        const pts = this.addScore(t.score);
        this.events.push({ type: 'dropTarget', index: i, points: pts, x: ball.x, z: ball.z });
        if (this.dropDown.every(Boolean)) {
          this.feverTime = FEVER_DURATION;
          this.feverCount += 1;
          const bonus = this.addScore(1500);
          this.dropDown = [false, false, false];
          this.events.push({ type: 'feverStart', points: bonus, x: ball.x, z: ball.z });
        }
      }
    }

    // Pop Bumper
    for (let i = 0; i < BUMPERS.length; i++) {
      const b = BUMPERS[i];
      const dx = ball.x - b.x;
      const dz = ball.z - b.z;
      const dist = Math.hypot(dx, dz);
      const minD = r + b.r;
      if (dist < minD && dist > 1e-6) {
        const nx = dx / dist;
        const nz = dz / dist;
        ball.x = b.x + nx * (minD + 0.01);
        ball.z = b.z + nz * (minD + 0.01);
        if (this.tiltTime <= 0) {
          const kick = b.impulse + Math.random() * 0.8;
          ball.vx = nx * kick;
          ball.vz = nz * kick;
          this.bumperFlash[i] = 1;
          this.bumperHits += 1;
          this.combo += 1;
          this.comboTimer = 2.6;
          if (this.combo > this.comboMax) this.comboMax = this.combo;
          this.shake = Math.min(1, this.shake + 0.25);
          const pts = this.addScore(b.score + Math.min(this.combo, 8) * 25);
          this.events.push({ type: 'bumper', index: i, label: b.label, points: pts, combo: this.combo, x: b.x, z: b.z });
        } else {
          const vn = ball.vx * nx + ball.vz * nz;
          if (vn < 0) {
            ball.vx -= 1.4 * vn * nx;
            ball.vz -= 1.4 * vn * nz;
          }
        }
      }
    }

    // Flipper (capsula rastremata rotante con contributo tangenziale)
    for (let i = 0; i < FLIPPERS.length; i++) {
      this.collideFlipper(i);
    }

    // Rollover P-A-T
    for (let i = 0; i < ROLLOVERS.length; i++) {
      if (this.rolloverCooldown[i] > 0) continue;
      const ro = ROLLOVERS[i];
      if (Math.hypot(ball.x - ro.x, ball.z - ro.z) < ro.r + r * 0.5) {
        this.rolloverCooldown[i] = 0.65;
        if (!this.rolloverLit[i]) {
          this.rolloverLit[i] = true;
          const pts = this.addScore(150);
          this.events.push({ type: 'rollover', index: i, letter: ro.id, points: pts, x: ro.x, z: ro.z });
          if (this.rolloverLit.every(Boolean)) {
            this.multiplier = Math.min(5, this.multiplier + 1);
            this.rolloverLit = [false, false, false];
            const bonus = this.addScore(500);
            this.events.push({ type: 'multiplierUp', multiplier: this.multiplier, points: bonus, x: ro.x, z: ro.z });
          }
        }
      }
    }

    // Orbit Spinner destro
    if (this.spinnerCooldown <= 0 && !ball.inShooter) {
      const distSp = Math.hypot(ball.x - ORBIT_SPINNER.x, ball.z - ORBIT_SPINNER.z);
      if (distSp < ORBIT_SPINNER.r && Math.hypot(ball.vx, ball.vz) > 4.0) {
        this.spinnerCooldown = 0.7;
        const pts = this.addScore(ORBIT_SPINNER.score);
        this.events.push({ type: 'spinner', points: pts, x: ORBIT_SPINNER.x, z: ORBIT_SPINNER.z });
      }
    }

    // Drain
    if (ball.z > TABLE.drainZ) {
      if (this.ballSaveTime > 0) {
        this.spawnBall();
        this.launchBall(0.88);
        this.ballSaveTime = 0;
        this.events.push({ type: 'ballSave' });
      } else {
        this.ballsLeft -= 1;
        if (this.ballsLeft <= 0) {
          this.phase = 'gameover';
          this.events.push({ type: 'gameover', score: this.score });
        } else {
          this.ballsPlayed += 1;
          this.multiplier = 1;
          this.combo = 0;
          this.spawnBall();
          this.events.push({ type: 'drain', ballsLeft: this.ballsLeft });
        }
      }
    }
  }

  collideSegment(x1, z1, x2, z2, thickness, restitution) {
    const ball = this.ball;
    const vx = x2 - x1;
    const vz = z2 - z1;
    const len2 = vx * vx + vz * vz;
    if (len2 < 1e-8) return false;

    const t = Math.max(0, Math.min(1, ((ball.x - x1) * vx + (ball.z - z1) * vz) / len2));
    const cx = x1 + vx * t;
    const cz = z1 + vz * t;
    const dx = ball.x - cx;
    const dz = ball.z - cz;
    const dist = Math.hypot(dx, dz);
    const minD = TABLE.ballRadius + thickness;

    if (dist < minD && dist > 1e-6) {
      const nx = dx / dist;
      const nz = dz / dist;
      ball.x = cx + nx * (minD + 0.002);
      ball.z = cz + nz * (minD + 0.002);

      const vn = ball.vx * nx + ball.vz * nz;
      if (vn < 0) {
        ball.vx -= (1 + restitution) * vn * nx;
        ball.vz -= (1 + restitution) * vn * nz;
        return true;
      }
    }
    return false;
  }

  collideFlipper(idx) {
    const f = FLIPPERS[idx];
    const ang = this.flipperAngles[idx];
    const omega = this.flipperOmegas[idx];
    const tipX = f.pivotX + Math.cos(ang) * f.length;
    const tipZ = f.pivotZ + Math.sin(ang) * f.length;

    const vx = tipX - f.pivotX;
    const vz = tipZ - f.pivotZ;
    const len2 = vx * vx + vz * vz;
    const t = Math.max(0, Math.min(1, ((this.ball.x - f.pivotX) * vx + (this.ball.z - f.pivotZ) * vz) / len2));

    const cx = f.pivotX + vx * t;
    const cz = f.pivotZ + vz * t;
    const flipR = f.radiusBase * (1 - t) + f.radiusTip * t;
    const minD = TABLE.ballRadius + flipR;

    const dx = this.ball.x - cx;
    const dz = this.ball.z - cz;
    const dist = Math.hypot(dx, dz);

    if (dist < minD && dist > 1e-6) {
      const nx = dx / dist;
      const nz = dz / dist;
      this.ball.x = cx + nx * (minD + 0.005);
      this.ball.z = cz + nz * (minD + 0.005);

      // Velocità del punto di contatto sul flipper dovuta alla rotazione: v = omega x r
      const rx = cx - f.pivotX;
      const rz = cz - f.pivotZ;
      const surfVx = -omega * rz;
      const surfVz = omega * rx;

      const relVx = this.ball.vx - surfVx;
      const relVz = this.ball.vz - surfVz;
      const relVn = relVx * nx + relVz * nz;

      if (relVn < 0) {
        const restitution = Math.abs(omega) > 1 ? 0.65 : 0.42;
        this.ball.vx -= (1 + restitution) * relVn * nx;
        this.ball.vz -= (1 + restitution) * relVn * nz;
        // Leggera spinta extra sui colpi attivi per tiri puliti verso l'alto
        if (Math.abs(omega) > 5 && nz < -0.15) {
          this.ball.vx += surfVx * 0.25;
          this.ball.vz += surfVz * 0.25;
          this.events.push({ type: 'flipperHit', side: f.id, x: cx, z: cz });
        }
      }
    }
  }
}

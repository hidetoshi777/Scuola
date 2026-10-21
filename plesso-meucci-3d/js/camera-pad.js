/**
 * Camera "a piedi" con collisioni + pad Xbox 360 (Gamepad API, mapping standard).
 *
 * - modo 'walk': occhi a EYE metri dal pavimento, sguardo yaw/pitch,
 *   collisioni orizzontali a raggi contro muri, banchi, Prof (raggio RADIUS);
 * - modo 'orbit': OrbitControls libera, solo per la vista dall'alto.
 *   Appena ci si muove si torna in piedi dove si era.
 */

const EYE = 1.6;
const RADIUS = 0.28;
const BODY_MIN = 0.12; // sotto: battiscopa, adesivi a terra
const BODY_MAX = 1.75; // sopra: lampade, canaline, condizionatore
const NON_BLOCKING = /Floor|Ceiling|Neon|Outside_|Sticker|Beam/;

export function createWalkRig({ THREE, camera, controls, dom }) {
  const rig = {
    mode: 'walk',
    yaw: 0,
    pitch: 0,
    floorY: 0,
    boxes: [],
    cylinders: [],
    floors: [],
    fly: null,
    savedWalk: null,
    turnVel: 0,
    tiltVel: 0
  };
  // sguardo trascinato col mouse/dito non ancora applicato (vedi update)
  const pendingLook = { x: 0, y: 0 };

  function stopLookMotion() {
    pendingLook.x = pendingLook.y = 0;
    rig.turnVel = rig.tiltVel = 0;
  }

  const ray = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const DOWN = new THREE.Vector3(0, -1, 0);
  const tmpDir = new THREE.Vector3();

  controls.enabled = false;
  camera.rotation.order = 'YXZ';

  function meshesOf(root, filter) {
    const out = [];
    root.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name || (o.parent ? o.parent.name : '');
      if (filter(n)) out.push(o);
    });
    return out;
  }

  /**
   * world = GLB; extra = oggetti che bloccano come un cilindro (es. il Prof).
   * Ogni mesh bloccante diventa la sua scatola d'ingombro (AABB): un banco
   * blocca tutto, anche fra le gambe e all'altezza del piano sottile.
   */
  function setWorld(world, extra = []) {
    world.updateMatrixWorld(true);
    rig.boxes = meshesOf(world, (n) => !NON_BLOCKING.test(n))
      .map((m) => new THREE.Box3().setFromObject(m))
      .filter((b) => !b.isEmpty());
    rig.cylinders = extra.map((e) => (e.isObject3D ? { obj: e, r: 0.3 } : e));
    rig.floors = meshesOf(world, (n) => /Floor/.test(n));
    snapToFloor();
  }

  function isShown(o) {
    for (let p = o; p; p = p.parent) if (!p.visible) return false;
    return true;
  }

  function firstHit(list) {
    const hits = ray.intersectObjects(list, false);
    for (const h of hits) if (isShown(h.object)) return h;
    return null;
  }

  function snapToFloor() {
    if (!rig.floors.length) return;
    origin.set(camera.position.x, camera.position.y + 0.2, camera.position.z);
    ray.set(origin, DOWN);
    ray.far = 4;
    const hit = firstHit(rig.floors);
    if (hit) rig.floorY = hit.point.y;
  }

  // Il cerchio del giocatore (x, z) tocca qualcosa all'altezza del corpo?
  // `skip` = ostacoli in cui si è già dentro (es. dopo un salto di tappa): si può uscirne.
  const tmpPos = new THREE.Vector3();
  function blockers(x, z) {
    const lo = rig.floorY + BODY_MIN;
    const hi = rig.floorY + BODY_MAX;
    const out = [];
    for (const b of rig.boxes) {
      if (b.max.y < lo || b.min.y > hi) continue;
      const cx = Math.max(b.min.x, Math.min(x, b.max.x));
      const cz = Math.max(b.min.z, Math.min(z, b.max.z));
      if ((x - cx) ** 2 + (z - cz) ** 2 < RADIUS * RADIUS) out.push(b);
    }
    for (const c of rig.cylinders) {
      if (!c.obj.visible) continue;
      c.obj.getWorldPosition(tmpPos);
      if ((x - tmpPos.x) ** 2 + (z - tmpPos.z) ** 2 < (RADIUS + c.r) ** 2) out.push(c);
    }
    return out;
  }

  function collides(x, z, skip) {
    return blockers(x, z).some((b) => !skip.includes(b));
  }

  // Si avanza a piccoli passi, un asse alla volta: contro un muro si scivola lungo il muro
  function moveWithCollisions(mx, mz) {
    const steps = Math.max(1, Math.ceil(Math.hypot(mx, mz) / 0.05));
    const sx = mx / steps;
    const sz = mz / steps;
    const p = camera.position;
    const skip = blockers(p.x, p.z);
    for (let i = 0; i < steps; i++) {
      if (sx && !collides(p.x + sx, p.z, skip)) p.x += sx;
      if (sz && !collides(p.x, p.z + sz, skip)) p.z += sz;
    }
  }

  function applyLook() {
    rig.pitch = Math.max(-1.35, Math.min(1.35, rig.pitch));
    camera.rotation.set(rig.pitch, rig.yaw, 0, 'YXZ');
  }

  function lookFrom(pos, target) {
    tmpDir.subVectors(target, pos).normalize();
    return { yaw: Math.atan2(-tmpDir.x, -tmpDir.z), pitch: Math.asin(tmpDir.y) };
  }

  function setPose(pos, target) {
    stopLookMotion();
    camera.position.copy(pos);
    const { yaw, pitch } = lookFrom(pos, target);
    rig.yaw = yaw;
    rig.pitch = pitch;
    applyLook();
    snapToFloor();
  }

  /** Volo animato verso una tappa; orbit=true per la vista dall'alto. */
  function flyTo(pos, target, orbit = false) {
    stopLookMotion();
    // parti dall'orientamento reale della camera (in orbita lo decide OrbitControls)
    camera.getWorldDirection(tmpDir);
    rig.yaw = Math.atan2(-tmpDir.x, -tmpDir.z);
    rig.pitch = Math.asin(Math.max(-1, Math.min(1, tmpDir.y)));
    if (orbit && rig.mode === 'walk') {
      rig.savedWalk = { pos: camera.position.clone(), yaw: rig.yaw, pitch: rig.pitch };
      controls.target.copy(camera.position).addScaledVector(tmpDir, 3);
    }
    const look = lookFrom(pos, target);
    rig.fly = {
      t: 0,
      orbit,
      startPos: camera.position.clone(),
      endPos: pos.clone(),
      startYaw: rig.yaw,
      startPitch: rig.pitch,
      endYaw: rig.yaw + Math.atan2(Math.sin(look.yaw - rig.yaw), Math.cos(look.yaw - rig.yaw)),
      endPitch: look.pitch,
      startTarget: controls.target.clone(),
      endTarget: target.clone()
    };
    rig.mode = orbit ? 'orbit' : 'walk';
    controls.enabled = false;
  }

  function backToWalk() {
    if (rig.mode !== 'orbit' || !rig.savedWalk) {
      rig.mode = 'walk';
      controls.enabled = false;
      return;
    }
    const s = rig.savedWalk;
    const fwd = new THREE.Vector3(-Math.sin(s.yaw), Math.sin(s.pitch), -Math.cos(s.yaw));
    flyTo(s.pos, s.pos.clone().add(fwd), false);
  }

  function lookDelta(dx, dy) {
    if (rig.mode !== 'walk' || rig.fly) return;
    rig.yaw -= dx;
    rig.pitch -= dy;
    applyLook();
  }

  // Trascinamento sul canvas = guardarsi intorno (mouse e touch)
  let drag = null;
  dom.addEventListener('pointerdown', (e) => {
    if (rig.mode !== 'walk') return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  dom.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    // Non si gira subito: il mouse arriva a una cadenza sua (2 o 3 letture per fotogramma)
    // e applicarlo qui dava passi irregolari. Si accumula e update() lo distribuisce.
    if (rig.mode === 'walk' && !rig.fly) {
      const k = e.pointerType === 'touch' ? 0.006 : 0.0042;
      pendingLook.x += (e.clientX - drag.x) * k;
      pendingLook.y += (e.clientY - drag.y) * k;
    }
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  const endDrag = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
  dom.addEventListener('pointerup', endDrag);
  dom.addEventListener('pointercancel', endDrag);
  dom.addEventListener('pointerleave', endDrag);

  /**
   * input: { strafe, forward } in [-1,1], run bool, turn/tilt in rad/s
   */
  function update(dt, input) {
    const moving = Math.abs(input.strafe) + Math.abs(input.forward) > 0.01;

    if (rig.fly) {
      if (moving && !rig.fly.orbit) {
        rig.fly = null; // il giocatore prende il controllo
      } else {
        const f = rig.fly;
        f.t = Math.min(1, f.t + dt * 1.8);
        const k = 1 - Math.pow(1 - f.t, 3);
        camera.position.lerpVectors(f.startPos, f.endPos, k);
        if (f.orbit) {
          controls.target.lerpVectors(f.startTarget, f.endTarget, k);
          camera.lookAt(controls.target);
        } else {
          rig.yaw = f.startYaw + (f.endYaw - f.startYaw) * k;
          rig.pitch = f.startPitch + (f.endPitch - f.startPitch) * k;
          applyLook();
        }
        if (f.t >= 1) {
          rig.fly = null;
          if (f.orbit) controls.enabled = true;
          else snapToFloor();
        }
        return;
      }
    }

    if (rig.mode === 'orbit') {
      if (moving) backToWalk();
      else controls.update();
      return;
    }

    // Frecce e levetta: la rotazione parte e si ferma in ~0,1 s invece che di colpo
    const kTurn = 1 - Math.exp(-dt / 0.08);
    rig.turnVel += ((input.turn || 0) - rig.turnVel) * kTurn;
    rig.tiltVel += ((input.tilt || 0) - rig.tiltVel) * kTurn;
    if (Math.abs(rig.turnVel) < 1e-3 && !input.turn) rig.turnVel = 0;
    if (Math.abs(rig.tiltVel) < 1e-3 && !input.tilt) rig.tiltVel = 0;
    // Trascinamento: ogni fotogramma recupera la stessa quota del residuo (~40 ms di
    // ritardo), così a mano costante la vista gira di passi uguali
    let dYaw = rig.turnVel * dt;
    let dPitch = rig.tiltVel * dt;
    if (pendingLook.x || pendingLook.y) {
      const kLook = 1 - Math.exp(-dt / 0.04);
      const lx = pendingLook.x * kLook;
      const ly = pendingLook.y * kLook;
      pendingLook.x -= lx;
      pendingLook.y -= ly;
      if (Math.abs(pendingLook.x) < 1e-5) pendingLook.x = 0;
      if (Math.abs(pendingLook.y) < 1e-5) pendingLook.y = 0;
      dYaw += lx;
      dPitch += ly;
    }
    if (dYaw || dPitch) {
      rig.yaw -= dYaw;
      rig.pitch -= dPitch;
      applyLook();
    }

    if (moving) {
      const speed = input.run ? 4.6 : 2.4;
      const sin = Math.sin(rig.yaw);
      const cos = Math.cos(rig.yaw);
      // avanti = (-sin, -cos), destra = (cos, -sin)
      let mx = (-sin * input.forward + cos * input.strafe) * speed * dt;
      let mz = (-cos * input.forward - sin * input.strafe) * speed * dt;
      const len = Math.hypot(mx, mz);
      const maxStep = speed * dt;
      if (len > maxStep) { mx *= maxStep / len; mz *= maxStep / len; }
      moveWithCollisions(mx, mz);
      snapToFloor();
    }

    // altezza degli occhi morbida (gradini, scalini del pavimento)
    const eyeY = rig.floorY + EYE;
    camera.position.y += (eyeY - camera.position.y) * Math.min(1, dt * 10);
  }

  applyLook();
  return { rig, setWorld, setPose, flyTo, backToWalk, lookDelta, update };
}

// -----------------------------------------------------------------------------
// Pad Xbox 360 (mapping "standard" del browser)
// -----------------------------------------------------------------------------
export const PAD = {
  A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7,
  BACK: 8, START: 9, L3: 10, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15
};

function deadzone(x, y, dz = 0.2) {
  const m = Math.hypot(x, y);
  if (m < dz) return [0, 0];
  const s = Math.min(1, (m - dz) / (1 - dz)) / m;
  return [x * s, y * s];
}

export function createXboxPad({ onPress, onConnect, onDisconnect }) {
  let index = null;
  let prev = [];

  window.addEventListener('gamepadconnected', (e) => {
    index = e.gamepad.index;
    prev = [];
    if (onConnect) onConnect(e.gamepad);
  });
  window.addEventListener('gamepaddisconnected', (e) => {
    if (e.gamepad.index !== index) return;
    index = null;
    if (onDisconnect) onDisconnect();
  });

  function current() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (index !== null && pads[index]) return pads[index];
    // alcuni browser non emettono 'gamepadconnected' finché non si preme un tasto
    for (const p of pads) {
      if (p && p.connected) {
        if (index === null && onConnect) onConnect(p);
        index = p.index;
        return p;
      }
    }
    return null;
  }

  /** Da chiamare ogni frame: restituisce assi e lancia onPress sui fronti di salita. */
  function poll() {
    const gp = current();
    if (!gp) return null;
    const pressed = gp.buttons.map((b) => b.pressed || b.value > 0.5);
    pressed.forEach((p, i) => {
      if (p && !prev[i] && onPress) onPress(i, gp);
    });
    prev = pressed;

    const [lx, ly] = deadzone(gp.axes[0] || 0, gp.axes[1] || 0);
    const [rx, ry] = deadzone(gp.axes[2] || 0, gp.axes[3] || 0, 0.16);
    let strafe = lx;
    let forward = -ly;
    if (pressed[PAD.UP]) forward = 1;
    if (pressed[PAD.DOWN]) forward = -1;
    if (pressed[PAD.LEFT]) strafe = -1;
    if (pressed[PAD.RIGHT]) strafe = 1;

    return {
      strafe,
      forward,
      // curva quadratica: precisione al centro, velocità a fondo corsa
      turn: Math.sign(rx) * rx * rx * 2.8,
      tilt: Math.sign(ry) * ry * ry * 1.9,
      run: pressed[PAD.L3] || (gp.buttons[PAD.LT] && gp.buttons[PAD.LT].value > 0.3)
    };
  }

  function rumble(strong = 0.35, weak = 0.6, ms = 120) {
    const gp = current();
    const act = gp && gp.vibrationActuator;
    if (act && act.playEffect) {
      act.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch(() => {});
    }
  }

  return { poll, rumble, isConnected: () => index !== null };
}

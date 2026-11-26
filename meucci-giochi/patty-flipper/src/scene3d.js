import * as THREE from '../vendor/three.module.min.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
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
  PATTY_STATUE_SPOT,
} from './table-layout.js';

export class PinballScene3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.pattyLoaded = false;
    this.pattyAnchor = null;
    this.pattyBaseY = PATTY_STATUE_SPOT.y + 0.24;
    this.pattyJumpTimer = 0;
    this.pattyJumpStrength = 0;
    this.particles = [];
    this.onPattyLoaded = null;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.24;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x140c07);
    this.scene.fog = new THREE.FogExp2(0x140c07, 0.012);

    this.camera = new THREE.PerspectiveCamera(44, 9 / 16, 0.5, 80);

    this.setupEnvironmentAndLights();
    this.buildCabinetAndPlayfield();
    this.buildDynamicTableParts();
    this.loadPattyStatue();
    this.resize();
  }

  setupEnvironmentAndLights() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x2a1a10);

    const panelMat1 = new THREE.MeshBasicMaterial({ color: 0xfff3d6 });
    const panel1 = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), panelMat1);
    panel1.position.set(0, 14, 0);
    panel1.rotation.x = Math.PI / 2;
    envScene.add(panel1);

    const stripMat = new THREE.MeshBasicMaterial({ color: 0xff6ec7 });
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(14, 3), stripMat);
    strip.position.set(-8, 8, -4);
    strip.lookAt(0, 0, 0);
    envScene.add(strip);

    const strip2 = new THREE.Mesh(new THREE.PlaneGeometry(14, 3), new THREE.MeshBasicMaterial({ color: 0x7ce8ff }));
    strip2.position.set(8, 8, 2);
    strip2.lookAt(0, 0, 0);
    envScene.add(strip2);

    this.scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0xfff4e0, 0x5c3721, 1.25);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4df, 1.55);
    keyLight.position.set(5.5, 16, 8.5);
    keyLight.castShadow = true;
    keyLight.shadow.bias = -0.002;
    keyLight.shadow.normalBias = 0.04;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 4;
    keyLight.shadow.camera.far = 36;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 11;
    keyLight.shadow.camera.bottom = -11;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff84c8, 0.75);
    rimLight.position.set(-7, 9, -9);
    this.scene.add(rimLight);

    // Luce frontale dedicata sulla statuina 3D di Patty per far risaltare occhi, ciuffo e petto bianco
    this.pattySpot = new THREE.SpotLight(0xfff8eb, 6.5, 18, 0.65, 0.55, 1);
    this.pattySpot.position.set(-1.4, 5.2, -3.2);
    this.pattySpot.target.position.set(PATTY_STATUE_SPOT.x, PATTY_STATUE_SPOT.y + 0.9, PATTY_STATUE_SPOT.z);
    this.scene.add(this.pattySpot);
    this.scene.add(this.pattySpot.target);

    this.pattyFill = new THREE.PointLight(0xffe8cc, 2.2, 7.5, 1.2);
    this.pattyFill.position.set(PATTY_STATUE_SPOT.x + 1.35, PATTY_STATUE_SPOT.y + 1.4, PATTY_STATUE_SPOT.z + 1.8);
    this.scene.add(this.pattyFill);

    this.feverLight = new THREE.PointLight(0xff3ea5, 0, 18);
    this.feverLight.position.set(-0.35, 3.8, -1.5);
    this.scene.add(this.feverLight);
  }

  buildCabinetAndPlayfield() {
    // Piano di gioco con texture illustrata
    const texLoader = new THREE.TextureLoader();
    const playfieldTex = texLoader.load('./assets/playfield_art.webp');
    playfieldTex.colorSpace = THREE.SRGBColorSpace;
    playfieldTex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    const pfMat = new THREE.MeshStandardMaterial({
      map: playfieldTex,
      roughness: 0.34,
      metalness: 0.04,
    });
    const pfMesh = new THREE.Mesh(new THREE.PlaneGeometry(TABLE.width, TABLE.height), pfMat);
    pfMesh.rotation.x = -Math.PI / 2;
    pfMesh.receiveShadow = true;
    this.scene.add(pfMesh);

    // Scocca in legno noce sotto e attorno al playfield
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x422313, roughness: 0.52, metalness: 0.08 });
    const baseBox = new THREE.Mesh(new THREE.BoxGeometry(11.1, 0.8, 19.1), woodMat);
    baseBox.position.set(0, -0.42, 0);
    this.scene.add(baseBox);

    const sideHeight = 0.85;
    const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.42, sideHeight, 19.1), woodMat);
    leftTrim.position.set(-5.21, 0.25, 0);
    this.scene.add(leftTrim);

    const rightTrim = new THREE.Mesh(new THREE.BoxGeometry(0.42, sideHeight, 19.1), woodMat);
    rightTrim.position.set(5.21, 0.25, 0);
    this.scene.add(rightTrim);

    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(10.84, sideHeight, 0.42), woodMat);
    topTrim.position.set(0, 0.25, -9.25);
    this.scene.add(topTrim);

    const bottomTrim = new THREE.Mesh(new THREE.BoxGeometry(10.84, 0.65, 0.48), woodMat);
    bottomTrim.position.set(0, 0.15, 9.25);
    this.scene.add(bottomTrim);

    // Guide metalliche/ottone corrispondenti esattamente a WALL_SEGMENTS
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xe6b55a,
      roughness: 0.24,
      metalness: 0.85,
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xd9e6ec,
      roughness: 0.18,
      metalness: 0.88,
    });

    for (const seg of WALL_SEGMENTS) {
      const dx = seg.x2 - seg.x1;
      const dz = seg.z2 - seg.z1;
      const len = Math.hypot(dx, dz);
      if (len < 0.01) continue;
      const h = seg.kind === 'arch' || seg.kind === 'wall' ? 0.46 : 0.32;
      const thick = seg.kind === 'laneWall' ? 0.09 : 0.11;
      const mat = seg.kind === 'rail' ? railMat : brassMat;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, h, thick), mat);
      mesh.position.set((seg.x1 + seg.x2) / 2, h / 2, (seg.z1 + seg.z2) / 2);
      mesh.rotation.y = -Math.atan2(dz, dx);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    // Gate unidirezionale visivo all'uscita shooter lane
    const gdx = ONE_WAY_GATE.x2 - ONE_WAY_GATE.x1;
    const gdz = ONE_WAY_GATE.z2 - ONE_WAY_GATE.z1;
    const gateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(Math.hypot(gdx, gdz), 0.14, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.2, metalness: 0.9, transparent: true, opacity: 0.72 }),
    );
    gateMesh.position.set((ONE_WAY_GATE.x1 + ONE_WAY_GATE.x2) / 2, 0.34, (ONE_WAY_GATE.z1 + ONE_WAY_GATE.z2) / 2);
    gateMesh.rotation.y = -Math.atan2(gdz, gdx);
    this.scene.add(gateMesh);

    // Piedistallo dorato per la statuina 3D di Patty in alto a sinistra
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(PATTY_STATUE_SPOT.x, 0, PATTY_STATUE_SPOT.z);
    const pedBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.08, 0.26, 28),
      woodMat,
    );
    pedBase.position.y = 0.13;
    pedBase.receiveShadow = true;
    pedestalGroup.add(pedBase);

    const pedGold = new THREE.Mesh(
      new THREE.CylinderGeometry(0.86, 0.90, 0.12, 28),
      brassMat,
    );
    pedGold.position.y = 0.31;
    pedestalGroup.add(pedGold);

    const ringLed = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.035, 10, 32),
      new THREE.MeshStandardMaterial({ color: 0xff3ea5, emissive: 0xff3ea5, emissiveIntensity: 0.9 }),
    );
    ringLed.rotation.x = Math.PI / 2;
    ringLed.position.y = 0.38;
    this.pattyRingLed = ringLed;
    pedestalGroup.add(ringLed);

    this.scene.add(pedestalGroup);
  }

  buildDynamicTableParts() {
    // Pallina cromata lucente
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xf6fbff,
      metalness: 0.96,
      roughness: 0.08,
      envMapIntensity: 1.5,
    });
    this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(TABLE.ballRadius, 28, 20), ballMat);
    this.ballMesh.castShadow = true;
    this.ballMesh.position.set(TABLE.shooterLaneCenterX, TABLE.ballRadius, TABLE.plungerRestZ - TABLE.ballRadius);
    this.scene.add(this.ballMesh);

    // Asta e molla Plunger
    this.plungerGroup = new THREE.Group();
    this.plungerGroup.position.set(TABLE.shooterLaneCenterX, 0.2, TABLE.plungerRestZ);
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.9, 14),
      new THREE.MeshStandardMaterial({ color: 0xd9e1e8, metalness: 0.9, roughness: 0.2 }),
    );
    rod.rotation.x = Math.PI / 2;
    rod.position.z = 0.45;
    const tip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0xff3ea5, roughness: 0.35 }),
    );
    tip.rotation.x = Math.PI / 2;
    this.plungerGroup.add(rod, tip);
    this.scene.add(this.plungerGroup);

    // 2 Flipper 3D
    this.flipperGroups = FLIPPERS.map(f => {
      const group = new THREE.Group();
      group.position.set(f.pivotX, 0.18, f.pivotZ);

      const paddleMat = new THREE.MeshStandardMaterial({
        color: 0xfff5de,
        roughness: 0.25,
        metalness: 0.12,
      });
      const rubberMat = new THREE.MeshStandardMaterial({
        color: 0xff3ea5,
        roughness: 0.42,
        emissive: 0x450929,
      });

      const baseCyl = new THREE.Mesh(new THREE.CylinderGeometry(f.radiusBase, f.radiusBase, 0.28, 18), rubberMat);
      const tipCyl = new THREE.Mesh(new THREE.CylinderGeometry(f.radiusTip, f.radiusTip, 0.28, 16), rubberMat);
      tipCyl.position.x = f.length;

      const body = new THREE.Mesh(new THREE.BoxGeometry(f.length, 0.24, f.radiusBase * 1.45), paddleMat);
      body.position.x = f.length / 2;
      body.castShadow = true;

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 14), new THREE.MeshStandardMaterial({ color: 0xffbe3b, metalness: 0.85, roughness: 0.2 }));

      group.add(baseCyl, tipCyl, body, cap);
      group.rotation.y = -f.restAngle;
      this.scene.add(group);
      return group;
    });

    // 3 Pop Bumper 3D con anelli LED emissivi
    this.bumperGroups = BUMPERS.map((b, idx) => {
      const g = new THREE.Group();
      g.position.set(b.x, 0, b.z);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(b.r * 0.72, b.r * 0.84, 0.32, 24),
        new THREE.MeshStandardMaterial({ color: 0x261710, roughness: 0.4 }),
      );
      base.position.y = 0.16;

      const ringMat = new THREE.MeshStandardMaterial({
        color: b.color,
        emissive: b.color,
        emissiveIntensity: 0.75,
        roughness: 0.25,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(b.r * 0.9, 0.075, 12, 28), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.24;

      const capMat = new THREE.MeshStandardMaterial({
        color: b.color,
        emissive: b.color,
        emissiveIntensity: 0.28,
        roughness: 0.22,
        metalness: 0.18,
      });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(b.r * 0.96, b.r * 0.78, 0.2, 24), capMat);
      cap.position.y = 0.42;
      cap.castShadow = true;

      g.add(base, ring, cap);

      // Dettaglio orecchie Elefantino sul bumper centrale
      if (idx === 0) {
        const earGeo = new THREE.SphereGeometry(0.18, 14, 12);
        const earL = new THREE.Mesh(earGeo, capMat);
        earL.scale.set(0.8, 0.35, 1.1);
        earL.position.set(-0.36, 0.54, -0.05);
        const earR = earL.clone();
        earR.position.x = 0.36;
        g.add(earL, earR);
      }

      const light = new THREE.PointLight(b.color, 0.4, 3.8);
      light.position.y = 0.75;
      g.add(light);

      this.scene.add(g);
      return { group: g, ringMat, capMat, light };
    });

    // 2 Slingshot 3D
    this.slingMeshes = SLINGSHOTS.map(sl => {
      const v = sl.vertices;
      const shape = new THREE.Shape();
      shape.moveTo(v[0].x, -v[0].z);
      shape.lineTo(v[1].x, -v[1].z);
      shape.lineTo(v[2].x, -v[2].z);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff9f2e,
        emissive: 0xff3ea5,
        emissiveIntensity: 0.2,
        roughness: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      this.scene.add(mesh);
      return { mesh, mat };
    });

    // 3 Rollover LED P-A-T
    this.rolloverLeds = ROLLOVERS.map(ro => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x4a3320,
        emissive: 0xffbe3b,
        emissiveIntensity: 0.12,
      });
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(ro.r * 0.72, ro.r * 0.72, 0.03, 20), mat);
      disc.position.set(ro.x, 0.015, ro.z);
      this.scene.add(disc);
      return mat;
    });

    // 3 Drop Target ("Biscotti Cucina")
    this.dropMeshes = DROP_TARGETS.map(t => {
      const dx = t.x2 - t.x1;
      const dz = t.z2 - t.z1;
      const len = Math.hypot(dx, dz);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xff8c1a,
        emissiveIntensity: 0.35,
        roughness: 0.28,
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, 0.42, 0.14), mat);
      mesh.position.set((t.x1 + t.x2) / 2, 0.21, (t.z1 + t.z2) / 2);
      mesh.rotation.y = -Math.atan2(dz, dx);
      mesh.castShadow = true;
      this.scene.add(mesh);
      return mesh;
    });

    // Spinner nell'orbit destro
    this.spinnerPivot = new THREE.Group();
    this.spinnerPivot.position.set(ORBIT_SPINNER.x, 0.42, ORBIT_SPINNER.z);
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.34, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x4fd1c5, emissive: 0x165e57, metalness: 0.65, roughness: 0.25 }),
    );
    this.spinnerPivot.add(blade);
    this.scene.add(this.spinnerPivot);

    // Pool particelle 3D per esplosioni scintille
    const sparkGeo = new THREE.SphereGeometry(0.055, 6, 6);
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: 0xffbe3b }));
      m.visible = false;
      this.scene.add(m);
      this.particles.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0 });
    }
  }

  loadPattyStatue() {
    const loader = new GLTFLoader();
    loader.load(
      './assets/Patty_HF_3D.glb',
      gltf => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const scale = PATTY_STATUE_SPOT.targetHeight / Math.max(size.y, 0.001);
        model.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);

        model.position.x -= scaledCenter.x;
        model.position.z -= scaledCenter.z;
        model.position.y -= scaledBox.min.y;

        model.traverse(obj => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = false;
            if (obj.material) {
              const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
              for (const m of mats) {
                m.metalness = 0.04;
                m.roughness = 0.82;
                m.metalnessMap = null;
                m.envMapIntensity = 0.9;
                m.needsUpdate = true;
              }
            }
          }
        });

        const anchor = new THREE.Group();
        anchor.position.set(PATTY_STATUE_SPOT.x, this.pattyBaseY, PATTY_STATUE_SPOT.z);
        anchor.rotation.y = PATTY_STATUE_SPOT.yaw;
        anchor.add(model);

        this.scene.add(anchor);
        this.pattyAnchor = anchor;
        this.pattyLoaded = true;
        this.onPattyLoaded?.();
      },
      undefined,
      () => {
        // Il gioco rimane giocabile anche se il modello 3D non è ancora pronto
      },
    );
  }

  triggerPattyJump(strength = 1) {
    this.pattyJumpTimer = 0.55;
    this.pattyJumpStrength = Math.max(this.pattyJumpStrength, strength);
  }

  spawnSparks(x, z, colorHex = 0xffbe3b, count = 10) {
    let spawned = 0;
    for (const p of this.particles) {
      if (p.life > 0) continue;
      const a = Math.random() * Math.PI * 2;
      const spd = 2.5 + Math.random() * 4.5;
      p.mesh.position.set(x, 0.25, z);
      p.mesh.material.color.setHex(colorHex);
      p.mesh.visible = true;
      p.vx = Math.cos(a) * spd;
      p.vy = 2.0 + Math.random() * 3.5;
      p.vz = Math.sin(a) * spd;
      p.life = 0.45 + Math.random() * 0.25;
      spawned++;
      if (spawned >= count) break;
    }
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    this.camera.aspect = aspect;
    // Compensa aspect stretti su smartphone così tutta la larghezza del mobile rimane visibile
    const zoomFactor = aspect < 0.62 ? 0.62 / Math.max(0.42, aspect) : 1.0;
    this.camera.fov = Math.min(58, 44 * zoomFactor);
    this.camera.updateProjectionMatrix();
  }

  render(sim, dt, nowSec) {
    // Posizione pallina 3D
    this.ballMesh.position.set(sim.ball.x, TABLE.ballRadius, sim.ball.z);

    // Molla plunger
    this.plungerGroup.position.z = TABLE.plungerRestZ + sim.plungerPower * 0.72;

    // Flipper 3D
    for (let i = 0; i < this.flipperGroups.length; i++) {
      this.flipperGroups[i].rotation.y = -sim.flipperAngles[i];
    }

    // Pop bumper pulse
    for (let i = 0; i < this.bumperGroups.length; i++) {
      const f = sim.bumperFlash[i];
      const bg = this.bumperGroups[i];
      bg.group.scale.setScalar(1 + f * 0.16);
      bg.ringMat.emissiveIntensity = 0.6 + f * 2.2 + (sim.feverTime > 0 ? 0.45 : 0);
      bg.capMat.emissiveIntensity = 0.22 + f * 1.3;
      bg.light.intensity = 0.35 + f * 2.8;
    }

    // Slingshot flash
    for (let i = 0; i < this.slingMeshes.length; i++) {
      this.slingMeshes[i].mat.emissiveIntensity = 0.15 + sim.slingFlash[i] * 2.2;
    }

    // Rollover LEDs P-A-T
    for (let i = 0; i < this.rolloverLeds.length; i++) {
      this.rolloverLeds[i].emissiveIntensity = sim.rolloverLit[i] ? 2.2 : 0.12;
    }

    // Drop Targets scendono nel piano quando abbattuti
    for (let i = 0; i < this.dropMeshes.length; i++) {
      const targetY = sim.dropDown[i] ? -0.18 : 0.21;
      this.dropMeshes[i].position.y += (targetY - this.dropMeshes[i].position.y) * Math.min(1, dt * 18);
    }

    // Spinner
    this.spinnerPivot.rotation.x = sim.spinnerAngle;

    // Luce Elefantino Fever
    if (sim.feverTime > 0) {
      this.feverLight.intensity = 1.6 + Math.sin(nowSec * 12) * 0.7;
      this.pattyRingLed.material.emissiveIntensity = 1.8 + Math.sin(nowSec * 14) * 0.7;
    } else {
      this.feverLight.intensity = 0;
      this.pattyRingLed.material.emissiveIntensity = 0.85;
    }

    // Animazione statuina 3D di Patty
    if (this.pattyAnchor) {
      let jumpOffset = 0;
      if (this.pattyJumpTimer > 0) {
        this.pattyJumpTimer = Math.max(0, this.pattyJumpTimer - dt);
        const phase = 1 - this.pattyJumpTimer / 0.55;
        jumpOffset = Math.sin(phase * Math.PI) * 0.55 * this.pattyJumpStrength;
      } else {
        this.pattyJumpStrength = 0;
      }
      const idleBob = Math.sin(nowSec * 2.6) * 0.03;
      const idleYaw = Math.sin(nowSec * 1.4) * 0.11;
      this.pattyAnchor.position.y = this.pattyBaseY + idleBob + jumpOffset;
      this.pattyAnchor.rotation.y = PATTY_STATUE_SPOT.yaw + idleYaw;
    }

    // Aggiorna particelle 3D
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        continue;
      }
      p.vy -= 9.5 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.05, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      p.mesh.scale.setScalar(Math.max(0.1, p.life * 1.6));
    }

    // Camera flipper con micro-tracking morbido sulla pallina + shake
    const ballFocusZ = Math.max(-0.6, Math.min(2.2, 0.55 + sim.ball.z * 0.14));
    const shakeX = (Math.random() - 0.5) * sim.shake * 0.18;
    const shakeY = (Math.random() - 0.5) * sim.shake * 0.14;
    this.camera.position.set(-0.08 + shakeX, 19.3 + shakeY, 13.7);
    this.camera.lookAt(-0.06, 0, ballFocusZ);

    this.renderer.render(this.scene, this.camera);
  }
}

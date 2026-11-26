import * as THREE from '../vendor/three.module.min.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { EffectComposer } from '../vendor/EffectComposer.js';
import { RenderPass } from '../vendor/RenderPass.js';
import { UnrealBloomPass } from '../vendor/UnrealBloomPass.js';
import { OutputPass } from '../vendor/OutputPass.js';
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
    this.toysLoaded = false;
    this.pattyAnchor = null;
    this.pattyBaseY = PATTY_STATUE_SPOT.y + 0.24;
    this.pattyJumpTimer = 0;
    this.pattyJumpStrength = 0;
    this.particles = [];
    this.trailHistory = [];
    this.composer = null;
    this.bloomPass = null;
    this.onReadyChange = null;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0705);
    this.scene.fog = new THREE.FogExp2(0x0d0705, 0.011);

    this.camera = new THREE.PerspectiveCamera(44, 9 / 16, 0.5, 80);

    this.setupEnvironmentAndLights();
    this.buildCabinetAndPlayfield();
    this.buildDynamicTableParts();
    this.setupPostProcessing();
    this.loadPattyStatue();
    this.loadPinballToys();
    this.resize();
  }

  setupEnvironmentAndLights() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
    this.scene.environmentIntensity = 0.34;
    roomEnv.dispose();
    pmrem.dispose();

    // Ambiente contenuto per far risaltare il look "lit from within"
    const hemi = new THREE.HemisphereLight(0xffe9cc, 0x221008, 0.34);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff0d4, 0.78);
    keyLight.position.set(5.2, 16, 8.2);
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

    const rimLight = new THREE.DirectionalLight(0xff62ba, 0.85);
    rimLight.position.set(-7, 9, -9);
    this.scene.add(rimLight);

    // Luce 3-punti dedicata su Patty 3D (decay=0 per illuminare bene muso, ciuffo e petto)
    this.pattySpot = new THREE.SpotLight(0xfff6e3, 4.2, 12, 0.55, 0.55, 0);
    this.pattySpot.position.set(-1.3, 4.8, -3.0);
    this.pattySpot.target.position.set(PATTY_STATUE_SPOT.x, PATTY_STATUE_SPOT.y + 0.9, PATTY_STATUE_SPOT.z);
    this.scene.add(this.pattySpot);
    this.scene.add(this.pattySpot.target);

    this.pattyFill = new THREE.PointLight(0xffead1, 2.4, 5.2, 0);
    this.pattyFill.position.set(PATTY_STATUE_SPOT.x + 1.3, PATTY_STATUE_SPOT.y + 1.3, PATTY_STATUE_SPOT.z + 1.9);
    this.scene.add(this.pattyFill);

    this.feverLight = new THREE.PointLight(0xff3ea5, 0, 18);
    this.feverLight.position.set(-0.35, 3.8, -1.5);
    this.scene.add(this.feverLight);
  }

  setupPostProcessing() {
    try {
      const w = this.canvas.clientWidth || window.innerWidth || 720;
      const h = this.canvas.clientHeight || window.innerHeight || 1280;
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.42, 0.36, 1.05);
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    } catch {
      this.composer = null;
      this.bloomPass = null;
    }
  }

  buildCabinetAndPlayfield() {
    const texLoader = new THREE.TextureLoader();
    const playfieldTex = texLoader.load('./assets/playfield_art.webp');
    playfieldTex.colorSpace = THREE.SRGBColorSpace;
    playfieldTex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    // Clearcoat laccato come vero vetro/vernice da flipper senza bruciare il ritratto
    const pfMat = new THREE.MeshPhysicalMaterial({
      color: 0xb59c82,
      map: playfieldTex,
      roughness: 0.34,
      metalness: 0.02,
      clearcoat: 0.42,
      clearcoatRoughness: 0.24,
      envMapIntensity: 0.26,
    });
    const pfMesh = new THREE.Mesh(new THREE.PlaneGeometry(TABLE.width, TABLE.height), pfMat);
    pfMesh.rotation.x = -Math.PI / 2;
    pfMesh.receiveShadow = true;
    this.scene.add(pfMesh);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3b1f10, roughness: 0.46, metalness: 0.08 });
    const baseBox = new THREE.Mesh(new THREE.BoxGeometry(11.1, 0.8, 19.1), woodMat);
    baseBox.position.set(0, -0.42, 0);
    this.scene.add(baseBox);

    const sideHeight = 0.88;
    for (const [x, y, z, w, h, d] of [
      [-5.21, 0.26, 0, 0.42, sideHeight, 19.1],
      [5.21, 0.26, 0, 0.42, sideHeight, 19.1],
      [0, 0.26, -9.25, 10.84, sideHeight, 0.42],
      [0, 0.16, 9.25, 10.84, 0.65, 0.48],
    ]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodMat);
      m.position.set(x, y, z);
      this.scene.add(m);
    }

    const brassMat = new THREE.MeshStandardMaterial({ color: 0xebb95e, roughness: 0.22, metalness: 0.88 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xe2eef5, roughness: 0.14, metalness: 0.94 });

    for (const seg of WALL_SEGMENTS) {
      const dx = seg.x2 - seg.x1;
      const dz = seg.z2 - seg.z1;
      const len = Math.hypot(dx, dz);
      if (len < 0.01) continue;
      const h = seg.kind === 'arch' || seg.kind === 'wall' ? 0.46 : 0.30;
      const thick = seg.kind === 'laneWall' ? 0.08 : 0.11;
      const mat = seg.kind === 'rail' ? railMat : brassMat;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, h, thick), mat);
      mesh.position.set((seg.x1 + seg.x2) / 2, h / 2, (seg.z1 + seg.z2) / 2);
      mesh.rotation.y = -Math.atan2(dz, dx);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    // Wireform cromato ad arco sull'orbit destro e arco superiore
    const wireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(4.52, 0.42, -5.2),
      new THREE.Vector3(3.45, 0.56, -7.25),
      new THREE.Vector3(0.40, 0.58, -8.35),
      new THREE.Vector3(-2.30, 0.52, -7.60),
    ]);
    const wireMesh = new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 36, 0.052, 10, false), railMat);
    wireMesh.castShadow = true;
    this.scene.add(wireMesh);

    const orbitWireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.45, 0.44, -6.30),
      new THREE.Vector3(3.15, 0.48, -4.95),
      new THREE.Vector3(3.18, 0.44, -2.55),
    ]);
    const orbitWireMesh = new THREE.Mesh(new THREE.TubeGeometry(orbitWireCurve, 22, 0.048, 10, false), railMat);
    this.scene.add(orbitWireMesh);

    // Strisce neon interne lungo l'arco superiore e i fianchi (effetti "lit from within")
    this.archNeonMat = new THREE.MeshStandardMaterial({
      color: 0xffbe3b,
      emissive: 0xff9b1a,
      emissiveIntensity: 1.9,
      roughness: 0.2,
    });
    const archNeonPts = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI + (i / 24) * Math.PI;
      archNeonPts.push(new THREE.Vector3(0.04 + Math.cos(a) * 4.72, 0.08, -4.6 + Math.sin(a) * 3.92));
    }
    const archNeonTube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archNeonPts), 40, 0.042, 8, false),
      this.archNeonMat,
    );
    this.scene.add(archNeonTube);

    this.sideNeonMat = new THREE.MeshStandardMaterial({
      color: 0xff3ea5,
      emissive: 0xff3ea5,
      emissiveIntensity: 1.85,
      roughness: 0.2,
    });
    for (const sx of [-4.72, 4.02]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 9.6), this.sideNeonMat);
      strip.position.set(sx, 0.14, 0.4);
      this.scene.add(strip);
    }

    // 3 Frecce LED animate sul playfield verso i bumper
    const chevronShape = new THREE.Shape();
    chevronShape.moveTo(0, 0.22);
    chevronShape.lineTo(0.24, -0.06);
    chevronShape.lineTo(0.14, -0.12);
    chevronShape.lineTo(0, 0.05);
    chevronShape.lineTo(-0.14, -0.12);
    chevronShape.lineTo(-0.24, -0.06);
    chevronShape.closePath();
    const chevronGeo = new THREE.ShapeGeometry(chevronShape);
    chevronGeo.rotateX(-Math.PI / 2);

    this.chaseChevrons = [-0.2, -0.75, -1.3].map(zPos => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff5ec4,
        emissive: 0xff3ea5,
        emissiveIntensity: 0.4,
        roughness: 0.25,
      });
      const m = new THREE.Mesh(chevronGeo, mat);
      m.position.set(-0.35, 0.015, zPos);
      this.scene.add(m);
      return mat;
    });

    // Gate unidirezionale
    const gdx = ONE_WAY_GATE.x2 - ONE_WAY_GATE.x1;
    const gdz = ONE_WAY_GATE.z2 - ONE_WAY_GATE.z1;
    const gateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(Math.hypot(gdx, gdz), 0.14, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.2, metalness: 0.9, transparent: true, opacity: 0.72 }),
    );
    gateMesh.position.set((ONE_WAY_GATE.x1 + ONE_WAY_GATE.x2) / 2, 0.34, (ONE_WAY_GATE.z1 + ONE_WAY_GATE.z2) / 2);
    gateMesh.rotation.y = -Math.atan2(gdz, gdx);
    this.scene.add(gateMesh);

    // Piedistallo dorato per Patty 3D
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(PATTY_STATUE_SPOT.x, 0, PATTY_STATUE_SPOT.z);
    const pedBase = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.18, 0.26, 28), woodMat);
    pedBase.position.y = 0.13;
    pedBase.receiveShadow = true;
    const pedGold = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 1.00, 0.12, 28), brassMat);
    pedGold.position.y = 0.31;
    this.pattyRingLed = new THREE.Mesh(
      new THREE.TorusGeometry(0.98, 0.045, 10, 32),
      new THREE.MeshStandardMaterial({ color: 0xff3ea5, emissive: 0xff3ea5, emissiveIntensity: 2.0 }),
    );
    this.pattyRingLed.rotation.x = Math.PI / 2;
    this.pattyRingLed.position.y = 0.38;
    pedestalGroup.add(pedBase, pedGold, this.pattyRingLed);
    this.scene.add(pedestalGroup);
  }

  buildDynamicTableParts() {
    // Pallina cromata + luce dinamica + scia luminosa
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.06,
      envMapIntensity: 2.5,
    });
    this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(TABLE.ballRadius, 28, 20), ballMat);
    this.ballMesh.castShadow = true;
    this.ballMesh.position.set(TABLE.shooterLaneCenterX, TABLE.ballRadius, TABLE.plungerRestZ - TABLE.ballRadius);
    this.scene.add(this.ballMesh);

    this.ballLight = new THREE.PointLight(0x88f7ff, 1.1, 3.6, 1.5);
    this.ballLight.position.set(this.ballMesh.position.x, 0.45, this.ballMesh.position.z);
    this.scene.add(this.ballLight);

    // 8 sfere per la scia luminosa
    this.trailMeshes = [];
    const trailGeo = new THREE.SphereGeometry(TABLE.ballRadius * 0.72, 10, 8);
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(
        trailGeo,
        new THREE.MeshBasicMaterial({ color: 0x7ce8ff, transparent: true, opacity: 0, depthWrite: false }),
      );
      m.visible = false;
      this.scene.add(m);
      this.trailMeshes.push(m);
    }

    // Molla Plunger
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
      new THREE.MeshStandardMaterial({ color: 0xff3ea5, emissive: 0xff3ea5, emissiveIntensity: 1.1, roughness: 0.3 }),
    );
    tip.rotation.x = Math.PI / 2;
    this.plungerGroup.add(rod, tip);
    this.scene.add(this.plungerGroup);

    // Flipper (gruppo base, poi sostituito da Toy_Flipper di Blender al load)
    this.flipperGroups = FLIPPERS.map(f => {
      const group = new THREE.Group();
      group.position.set(f.pivotX, 0.04, f.pivotZ);
      const fallback = new THREE.Mesh(
        new THREE.BoxGeometry(f.length, 0.22, f.radiusBase * 1.4),
        new THREE.MeshStandardMaterial({ color: 0xfff5de, roughness: 0.28 }),
      );
      fallback.position.set(f.length / 2, 0.12, 0);
      group.add(fallback);
      group.rotation.y = -f.restAngle;
      this.scene.add(group);
      return group;
    });

    // 3 Pop Bumper (anello LED luminoso + alloggiamento per i giocattoli Blender)
    this.bumperGroups = BUMPERS.map(b => {
      const g = new THREE.Group();
      g.position.set(b.x, 0, b.z);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(b.r * 0.72, b.r * 0.86, 0.14, 24),
        new THREE.MeshStandardMaterial({ color: 0x261710, roughness: 0.4 }),
      );
      base.position.y = 0.07;

      const ringMat = new THREE.MeshStandardMaterial({
        color: b.color,
        emissive: b.color,
        emissiveIntensity: 2.1,
        roughness: 0.2,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(b.r * 0.94, 0.065, 12, 30), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.08;

      const toyMount = new THREE.Group();
      toyMount.position.y = 0.10;
      const fallbackCap = new THREE.Mesh(
        new THREE.CylinderGeometry(b.r * 0.85, b.r * 0.72, 0.24, 22),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.25 }),
      );
      fallbackCap.position.y = 0.14;
      toyMount.add(fallbackCap);

      const light = new THREE.PointLight(b.color, 1.35, 4.4);
      light.position.y = 0.65;
      g.add(base, ring, toyMount, light);

      this.scene.add(g);
      return { group: g, toyMount, ringMat, light };
    });

    // 2 Slingshot (diffusore luminoso interno + punto di aggancio per Toy_SlingshotCap)
    this.slingMeshes = SLINGSHOTS.map(sl => {
      const v = sl.vertices;
      const cx = (v[0].x + v[1].x + v[2].x) / 3;
      const cz = (v[0].z + v[1].z + v[2].z) / 3;

      const shape = new THREE.Shape();
      shape.moveTo(v[0].x, -v[0].z);
      shape.lineTo(v[1].x, -v[1].z);
      shape.lineTo(v[2].x, -v[2].z);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.20, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff8c2b,
        emissive: 0xff3ea5,
        emissiveIntensity: 1.4,
        roughness: 0.3,
        transparent: true,
        opacity: 0.78,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.02;
      this.scene.add(mesh);

      const light = new THREE.PointLight(0xff5ea8, 0.85, 3.2);
      light.position.set(cx, 0.45, cz);
      this.scene.add(light);

      return { mesh, mat, light };
    });

    // 3 Rollover LED P-A-T
    this.rolloverLeds = ROLLOVERS.map(ro => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x5c3e24,
        emissive: 0xffbe3b,
        emissiveIntensity: 0.35,
      });
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(ro.r * 0.72, ro.r * 0.72, 0.03, 20), mat);
      disc.position.set(ro.x, 0.015, ro.z);
      this.scene.add(disc);
      return mat;
    });

    // 3 Drop Target ("Biscotti Cucina")
    this.dropGroups = DROP_TARGETS.map(t => {
      const dx = t.x2 - t.x1;
      const dz = t.z2 - t.z1;
      const len = Math.hypot(dx, dz);
      const g = new THREE.Group();
      g.position.set((t.x1 + t.x2) / 2, 0, (t.z1 + t.z2) / 2);
      g.rotation.y = -Math.atan2(dz, dx);

      const fallback = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.40, 0.13),
        new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xff8c1a, emissiveIntensity: 0.9, roughness: 0.28 }),
      );
      fallback.position.y = 0.20;
      g.add(fallback);
      this.scene.add(g);
      return g;
    });

    // Spinner orbit destro
    this.spinnerPivot = new THREE.Group();
    this.spinnerPivot.position.set(ORBIT_SPINNER.x, 0.42, ORBIT_SPINNER.z);
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.34, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x4fd1c5, emissive: 0x4fd1c5, emissiveIntensity: 1.4, metalness: 0.65, roughness: 0.25 }),
    );
    this.spinnerPivot.add(blade);
    this.scene.add(this.spinnerPivot);

    // Pool particelle 3D brillanti (HDR > 1 per UnrealBloomPass)
    const sparkGeo = new THREE.SphereGeometry(0.06, 6, 6);
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.8, 0.8) }));
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
        box.getSize(size);

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
                m.color.setRGB(1.42, 1.35, 1.26);
                m.metalness = 0.04;
                m.roughness = 0.78;
                m.metalnessMap = null;
                m.envMapIntensity = 1.05;
                m.needsUpdate = true;
              }
            }
          }
        });

        const anchor = new THREE.Group();
        anchor.position.set(PATTY_STATUE_SPOT.x, this.pattyBaseY, PATTY_STATUE_SPOT.z);
        anchor.rotation.order = 'YXZ';
        anchor.rotation.y = PATTY_STATUE_SPOT.yaw;
        anchor.rotation.x = PATTY_STATUE_SPOT.pitch ?? 0;
        anchor.add(model);

        this.scene.add(anchor);
        this.pattyAnchor = anchor;
        this.pattyLoaded = true;
        this.onReadyChange?.();
      },
      undefined,
      () => {
        this.pattyLoaded = true;
        this.onReadyChange?.();
      },
    );
  }

  loadPinballToys() {
    const loader = new GLTFLoader();
    loader.load(
      './assets/pinball_toys.glb',
      gltf => {
        const byName = new Map();
        gltf.scene.traverse(obj => {
          if (obj.name) byName.set(obj.name, obj);
        });

        const enableShadows = root => {
          root.traverse(c => {
            if (c.isMesh) {
              c.castShadow = true;
              c.receiveShadow = true;
            }
          });
        };

        // 3 Pop Bumper toys (Elefantino, Biscotto, Ciotola)
        const bumperNames = ['Toy_Elefantino', 'Toy_Biscotto', 'Toy_Ciotola'];
        for (let i = 0; i < 3; i++) {
          const src = byName.get(bumperNames[i]);
          if (src) {
            const clone = src.clone();
            clone.position.set(0, 0, 0);
            clone.scale.setScalar(i === 0 ? 1.05 : 1.02);
            enableShadows(clone);
            this.bumperGroups[i].toyMount.clear();
            this.bumperGroups[i].toyMount.add(clone);
          }
        }

        // 2 Flippers
        const flipSrc = byName.get('Toy_Flipper');
        if (flipSrc) {
          for (const g of this.flipperGroups) {
            const clone = flipSrc.clone();
            clone.position.set(0, 0, 0);
            enableShadows(clone);
            g.clear();
            g.add(clone);
          }
        }

        // 3 Drop Targets
        const dropSrc = byName.get('Toy_DropBiscuit');
        if (dropSrc) {
          for (const g of this.dropGroups) {
            const clone = dropSrc.clone();
            clone.position.set(0, 0, 0);
            clone.scale.setScalar(1.1);
            enableShadows(clone);
            g.clear();
            g.add(clone);
          }
        }

        // 2 Slingshot caps traslucidi con colonnine cromate
        for (const name of ['Toy_SlingshotCap_L', 'Toy_SlingshotCap_R']) {
          const src = byName.get(name);
          if (src) {
            const clone = src.clone();
            clone.position.set(0, 0, 0);
            enableShadows(clone);
            this.scene.add(clone);
          }
        }

        this.toysLoaded = true;
        this.onReadyChange?.();
      },
      undefined,
      () => {
        this.toysLoaded = true;
        this.onReadyChange?.();
      },
    );
  }

  triggerPattyJump(strength = 1) {
    this.pattyJumpTimer = 0.55;
    this.pattyJumpStrength = Math.max(this.pattyJumpStrength, strength);
  }

  spawnSparks(x, z, colorHex = 0xffbe3b, count = 10) {
    const hdrColor = new THREE.Color(colorHex).multiplyScalar(2.4);
    let spawned = 0;
    for (const p of this.particles) {
      if (p.life > 0) continue;
      const a = Math.random() * Math.PI * 2;
      const spd = 2.5 + Math.random() * 4.5;
      p.mesh.position.set(x, 0.25, z);
      p.mesh.material.color.copy(hdrColor);
      p.mesh.visible = true;
      p.vx = Math.cos(a) * spd;
      p.vy = 2.0 + Math.random() * 3.5;
      p.vz = Math.sin(a) * spd;
      p.life = 0.45 + Math.random() * 0.25;
      spawned++;
      if (spawned >= count) break;
    }
  }

  projectToScreen(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    return {
      x: (v.x * 0.5 + 0.5) * w,
      y: (-v.y * 0.5 + 0.5) * h,
    };
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    if (this.composer) {
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.composer.setSize(w, h);
    }
    const aspect = w / Math.max(1, h);
    this.camera.aspect = aspect;
    const zoomFactor = aspect < 0.62 ? 0.62 / Math.max(0.42, aspect) : 1.0;
    this.camera.fov = Math.min(58, 44 * zoomFactor);
    this.camera.updateProjectionMatrix();
  }

  render(sim, dt, nowSec) {
    this.ballMesh.position.set(sim.ball.x, TABLE.ballRadius, sim.ball.z);
    this.ballLight.position.set(sim.ball.x, 0.55, sim.ball.z);

    // Scia luminosa quando la pallina si muove veloce
    const speed = Math.hypot(sim.ball.vx, sim.ball.vz);
    this.trailHistory.unshift({ x: sim.ball.x, z: sim.ball.z });
    if (this.trailHistory.length > this.trailMeshes.length) this.trailHistory.length = this.trailMeshes.length;
    const trailVis = speed > 6.5 && sim.phase === 'playing' ? Math.min(1, (speed - 6.5) / 10) : 0;
    for (let i = 0; i < this.trailMeshes.length; i++) {
      const tm = this.trailMeshes[i];
      const pt = this.trailHistory[i];
      if (!pt || trailVis <= 0.02 || i === 0) {
        tm.visible = false;
      } else {
        const fade = (1 - i / this.trailMeshes.length) * trailVis;
        tm.visible = true;
        tm.position.set(pt.x, TABLE.ballRadius * 0.9, pt.z);
        tm.scale.setScalar(Math.max(0.25, 0.95 - i * 0.09));
        tm.material.opacity = fade * 0.52;
      }
    }

    this.plungerGroup.position.z = TABLE.plungerRestZ + sim.plungerPower * 0.72;

    for (let i = 0; i < this.flipperGroups.length; i++) {
      this.flipperGroups[i].rotation.y = -sim.flipperAngles[i];
    }

    // Pop bumper pulse + bloom boost
    for (let i = 0; i < this.bumperGroups.length; i++) {
      const f = sim.bumperFlash[i];
      const bg = this.bumperGroups[i];
      bg.group.scale.setScalar(1 + f * 0.16);
      bg.ringMat.emissiveIntensity = 1.9 + f * 2.8 + (sim.feverTime > 0 ? 0.8 : 0);
      bg.light.intensity = 1.15 + f * 3.2;
    }

    // Slingshot pulse
    for (let i = 0; i < this.slingMeshes.length; i++) {
      const f = sim.slingFlash[i];
      this.slingMeshes[i].mat.emissiveIntensity = 1.2 + f * 2.4;
      this.slingMeshes[i].light.intensity = 0.75 + f * 2.4;
    }

    // Rollover LEDs P-A-T
    for (let i = 0; i < this.rolloverLeds.length; i++) {
      this.rolloverLeds[i].emissiveIntensity = sim.rolloverLit[i] ? 2.6 : 0.25;
    }

    // Frecce LED chase sul playfield
    const chaseSpeed = sim.feverTime > 0 ? 9.0 : 3.2;
    const activeArrow = Math.floor(nowSec * chaseSpeed) % 3;
    for (let i = 0; i < this.chaseChevrons.length; i++) {
      this.chaseChevrons[i].emissiveIntensity = i === activeArrow ? 2.4 : 0.35;
    }

    // Drop Targets scendono quando abbattuti
    for (let i = 0; i < this.dropGroups.length; i++) {
      const targetY = sim.dropDown[i] ? -0.34 : 0;
      this.dropGroups[i].position.y += (targetY - this.dropGroups[i].position.y) * Math.min(1, dt * 18);
    }

    this.spinnerPivot.rotation.x = sim.spinnerAngle;

    // Elefantino Fever glow
    if (sim.feverTime > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(nowSec * 12);
      this.feverLight.intensity = 1.5 + pulse * 1.4;
      this.pattyRingLed.material.emissiveIntensity = 2.2 + pulse * 1.1;
      this.archNeonMat.emissive.setHex(0xff3ea5);
      this.archNeonMat.emissiveIntensity = 2.1 + pulse * 0.9;
      this.sideNeonMat.emissiveIntensity = 2.2 + pulse * 0.9;
    } else {
      this.feverLight.intensity = 0;
      this.pattyRingLed.material.emissiveIntensity = 1.9;
      this.archNeonMat.emissive.setHex(0xff9b1a);
      this.archNeonMat.emissiveIntensity = 1.8;
      this.sideNeonMat.emissiveIntensity = 1.65;
    }

    // Statuina 3D di Patty
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

    // Particelle
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

    const ballFocusZ = Math.max(-0.5, Math.min(2.2, 0.55 + sim.ball.z * 0.14));
    const shakeX = (Math.random() - 0.5) * sim.shake * 0.18;
    const shakeY = (Math.random() - 0.5) * sim.shake * 0.14;
    this.camera.position.set(-0.08 + shakeX, 19.3 + shakeY, 13.7);
    this.camera.lookAt(-0.06, 0, ballFocusZ);

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

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
    this.cabinetLoaded = false;
    this.pattyAnchor = null;
    this.pattyBaseY = PATTY_STATUE_SPOT.y;
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
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0705);
    this.scene.fog = new THREE.FogExp2(0x0d0705, 0.010);

    this.camera = new THREE.PerspectiveCamera(44, 9 / 16, 0.5, 90);

    this.setupEnvironmentAndLights();
    this.buildPlayfieldAndRails();
    this.buildDynamicTableParts();
    this.setupPostProcessing();
    this.loadCabinet();
    this.loadPattyStatue();
    this.loadPinballToys();
    this.resize();
  }

  setupEnvironmentAndLights() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();

    // Carica il panorama equirettangolare Cycles interno di Casa di Silvia per riflessi reali
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      './assets/casa_silvia_env.webp',
      envTex => {
        envTex.mapping = THREE.EquirectangularReflectionMapping;
        envTex.colorSpace = THREE.SRGBColorSpace;
        const rt = pmrem.fromEquirectangular(envTex);
        this.scene.environment = rt.texture;
        this.scene.environmentIntensity = 0.44;
        envTex.dispose();
        pmrem.dispose();
      },
      undefined,
      () => {
        const roomEnv = new RoomEnvironment();
        this.scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
        this.scene.environmentIntensity = 0.34;
        roomEnv.dispose();
        pmrem.dispose();
      },
    );

    const hemi = new THREE.HemisphereLight(0xffe5c4, 0x1c0d06, 0.28);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff0d4, 0.72);
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

    const rimLight = new THREE.DirectionalLight(0xff5ec0, 0.85);
    rimLight.position.set(-7, 9, -9);
    this.scene.add(rimLight);

    // Luce dedicata morbida e frontale mirata a testa/petto di Patty (senza hotspot sul piedistallo)
    this.pattySpot = new THREE.SpotLight(0xfff4df, 1.05, 14, 0.44, 0.72, 0);
    this.pattySpot.position.set(-1.3, 4.9, -4.0);
    this.pattySpot.target.position.set(PATTY_STATUE_SPOT.x, PATTY_STATUE_SPOT.y + 1.45, PATTY_STATUE_SPOT.z);
    this.scene.add(this.pattySpot);
    this.scene.add(this.pattySpot.target);

    this.pattyFill = new THREE.PointLight(0xffebd4, 1.15, 7.0, 0);
    this.pattyFill.position.set(PATTY_STATUE_SPOT.x + 1.25, PATTY_STATUE_SPOT.y + 1.75, PATTY_STATUE_SPOT.z + 2.25);
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
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.44, 0.38, 1.08);
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    } catch {
      this.composer = null;
      this.bloomPass = null;
    }
  }

  makeRadialShadowTexture() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(6, 3, 2, 0.72)');
    g.addColorStop(0.5, 'rgba(6, 3, 2, 0.34)');
    g.addColorStop(1, 'rgba(6, 3, 2, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  buildPlayfieldAndRails() {
    const texLoader = new THREE.TextureLoader();
    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    const albedoTex = texLoader.load('./assets/playfield_dark_albedo.webp');
    albedoTex.colorSpace = THREE.SRGBColorSpace;
    albedoTex.anisotropy = maxAniso;

    const roughTex = texLoader.load('./assets/playfield_roughness.webp');
    roughTex.anisotropy = maxAniso;

    const emissiveTex = texLoader.load('./assets/playfield_emissive.webp');
    emissiveTex.colorSpace = THREE.SRGBColorSpace;
    emissiveTex.anisotropy = maxAniso;

    const pfMat = new THREE.MeshPhysicalMaterial({
      map: albedoTex,
      roughnessMap: roughTex,
      roughness: 1.0,
      metalness: 0.04,
      emissive: new THREE.Color(0xffbe5c),
      emissiveMap: emissiveTex,
      emissiveIntensity: 0.90,
      clearcoat: 0.72,
      clearcoatRoughness: 0.14,
      envMapIntensity: 0.24,
    });
    const pfMesh = new THREE.Mesh(new THREE.PlaneGeometry(TABLE.width, TABLE.height), pfMat);
    pfMesh.rotation.x = -Math.PI / 2;
    pfMesh.receiveShadow = true;
    this.scene.add(pfMesh);

    const brassMat = new THREE.MeshStandardMaterial({ color: 0xebb95e, roughness: 0.22, metalness: 0.90 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xe6f1f8, roughness: 0.12, metalness: 0.95 });

    for (const seg of WALL_SEGMENTS) {
      const dx = seg.x2 - seg.x1;
      const dz = seg.z2 - seg.z1;
      const len = Math.hypot(dx, dz);
      if (len < 0.01) continue;
      const h = seg.kind === 'arch' || seg.kind === 'wall' ? 0.44 : 0.28;
      const thick = seg.kind === 'laneWall' ? 0.075 : 0.105;
      const mat = seg.kind === 'rail' ? railMat : brassMat;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, h, thick), mat);
      mesh.position.set((seg.x1 + seg.x2) / 2, h / 2, (seg.z1 + seg.z2) / 2);
      mesh.rotation.y = -Math.atan2(dz, dx);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    // Wireform cromati
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

    // Neon interni arco & fianchi
    this.archNeonMat = new THREE.MeshStandardMaterial({
      color: 0xffbe3b,
      emissive: 0xff9b1a,
      emissiveIntensity: 1.95,
      roughness: 0.2,
    });
    const archNeonPts = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI + (i / 24) * Math.PI;
      archNeonPts.push(new THREE.Vector3(0.04 + Math.cos(a) * 4.72, 0.08, -4.6 + Math.sin(a) * 3.92));
    }
    this.scene.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archNeonPts), 40, 0.042, 8, false),
      this.archNeonMat,
    ));

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

    // 3 Frecce LED animate
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

    // Bordo LED discreto attorno al balconcino di Patty (sotto la soglia di bloom per zero aloni bianchi)
    this.pattyRingLed = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.028, 10, 32),
      new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xff9a2e, emissiveIntensity: 0.42, roughness: 0.52 }),
    );
    this.pattyRingLed.rotation.x = Math.PI / 2;
    this.pattyRingLed.position.set(PATTY_STATUE_SPOT.x, 0.35, PATTY_STATUE_SPOT.z);
    this.scene.add(this.pattyRingLed);

    // Lastra di vetro protettivo obliquo con riflesso leggero dell'ambiente di Casa di Silvia
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.045,
      roughness: 0.04,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 0.75,
      depthWrite: false,
    });
    const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(TABLE.width - 0.1, TABLE.height - 0.1), glassMat);
    glassMesh.rotation.x = -Math.PI / 2;
    glassMesh.position.y = 0.86;
    this.scene.add(glassMesh);
  }

  buildDynamicTableParts() {
    // Pallina cromata lucente + ombra morbida a contatto + luce + scia
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.05,
      envMapIntensity: 2.6,
    });
    this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(TABLE.ballRadius, 28, 20), ballMat);
    this.ballMesh.castShadow = true;
    this.ballMesh.position.set(TABLE.shooterLaneCenterX, TABLE.ballRadius, TABLE.plungerRestZ - TABLE.ballRadius);
    this.scene.add(this.ballMesh);

    this.ballShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(TABLE.ballRadius * 2.9, TABLE.ballRadius * 2.9),
      new THREE.MeshBasicMaterial({ map: this.makeRadialShadowTexture(), transparent: true, depthWrite: false }),
    );
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.ballShadow.position.set(this.ballMesh.position.x, 0.012, this.ballMesh.position.z + 0.04);
    this.scene.add(this.ballShadow);

    this.ballLight = new THREE.PointLight(0x88f7ff, 1.25, 3.8, 1.4);
    this.ballLight.position.set(this.ballMesh.position.x, 0.55, this.ballMesh.position.z);
    this.scene.add(this.ballLight);

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
      new THREE.MeshStandardMaterial({ color: 0xff3ea5, emissive: 0xff3ea5, emissiveIntensity: 1.2, roughness: 0.3 }),
    );
    tip.rotation.x = Math.PI / 2;
    this.plungerGroup.add(rod, tip);
    this.scene.add(this.plungerGroup);

    // Flipper
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

    // 3 Pop Bumper
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
        emissiveIntensity: 2.2,
        roughness: 0.2,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(b.r * 0.94, 0.068, 12, 30), ringMat);
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

      const light = new THREE.PointLight(b.color, 1.55, 4.6);
      light.position.y = 0.65;
      g.add(base, ring, toyMount, light);

      this.scene.add(g);
      return { group: g, toyMount, ringMat, light };
    });

    // 2 Slingshot
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
        emissiveIntensity: 1.5,
        roughness: 0.3,
        transparent: true,
        opacity: 0.82,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.02;
      this.scene.add(mesh);

      const light = new THREE.PointLight(0xff5ea8, 0.95, 3.4);
      light.position.set(cx, 0.45, cz);
      this.scene.add(light);

      return { mesh, mat, light };
    });

    // 3 Rollover LED P-A-T
    this.rolloverLeds = ROLLOVERS.map(ro => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x5c3e24,
        emissive: 0xffbe3b,
        emissiveIntensity: 0.45,
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
        new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xff8c1a, emissiveIntensity: 0.95, roughness: 0.28 }),
      );
      fallback.position.y = 0.20;
      g.add(fallback);
      this.scene.add(g);
      return g;
    });

    // Spinner
    this.spinnerPivot = new THREE.Group();
    this.spinnerPivot.position.set(ORBIT_SPINNER.x, 0.42, ORBIT_SPINNER.z);
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.34, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x4fd1c5, emissive: 0x4fd1c5, emissiveIntensity: 1.5, metalness: 0.65, roughness: 0.25 }),
    );
    this.spinnerPivot.add(blade);
    this.scene.add(this.spinnerPivot);

    // Particelle
    const sparkGeo = new THREE.SphereGeometry(0.055, 6, 6);
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.9, 0.8) }));
      m.visible = false;
      this.scene.add(m);
      this.particles.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0 });
    }
  }

  loadCabinet() {
    const loader = new GLTFLoader();
    loader.load(
      './assets/pinball_cabinet.glb',
      gltf => {
        gltf.scene.traverse(obj => {
          if (obj.isMesh) {
            obj.receiveShadow = true;
            if (obj.name === 'Backbox_Marquee_Face' && obj.material) {
              obj.material.emissiveIntensity = 1.35;
            }
          }
        });
        this.scene.add(gltf.scene);
        this.cabinetLoaded = true;
        this.onReadyChange?.();
      },
      undefined,
      () => {
        this.cabinetLoaded = true;
        this.onReadyChange?.();
      },
    );
  }

  loadPattyStatue() {
    const loader = new GLTFLoader();
    const mountModel = gltf => {
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
            const toLambert = m => new THREE.MeshLambertMaterial({
              map: m.map || null,
              color: new THREE.Color(0xf2dec8),
              emissive: new THREE.Color(0xffe8d0),
              emissiveMap: m.map || null,
              emissiveIntensity: 0.38,
            });
            obj.material = Array.isArray(obj.material)
              ? obj.material.map(toLambert)
              : toLambert(obj.material);
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
    };

    loader.load(
      './assets/Patty_Seated_3D.glb',
      mountModel,
      undefined,
      () => {
        loader.load('./assets/Patty_HF_3D.glb', mountModel, undefined, () => {
          this.pattyLoaded = true;
          this.onReadyChange?.();
        });
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

        const bumperNames = ['Toy_Elefantino', 'Toy_Biscotto', 'Toy_Ciotola'];
        for (let i = 0; i < 3; i++) {
          const src = byName.get(bumperNames[i]);
          if (src) {
            const clone = src.clone();
            clone.position.set(0, 0, 0);
            clone.scale.setScalar(i === 0 ? 1.08 : 1.02);
            enableShadows(clone);
            this.bumperGroups[i].toyMount.clear();
            this.bumperGroups[i].toyMount.add(clone);
          }
        }

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
    this.camera.fov = Math.min(58, 45 * zoomFactor);
    this.camera.updateProjectionMatrix();
  }

  render(sim, dt, nowSec) {
    this.ballMesh.position.set(sim.ball.x, TABLE.ballRadius, sim.ball.z);
    this.ballShadow.position.set(sim.ball.x, 0.012, sim.ball.z + 0.04);
    this.ballLight.position.set(sim.ball.x, 0.55, sim.ball.z);

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

    for (let i = 0; i < this.bumperGroups.length; i++) {
      const f = sim.bumperFlash[i];
      const bg = this.bumperGroups[i];
      bg.group.scale.setScalar(1 + f * 0.16);
      bg.ringMat.emissiveIntensity = 2.0 + f * 2.8 + (sim.feverTime > 0 ? 0.8 : 0);
      bg.light.intensity = 1.35 + f * 3.2;
    }

    for (let i = 0; i < this.slingMeshes.length; i++) {
      const f = sim.slingFlash[i];
      this.slingMeshes[i].mat.emissiveIntensity = 1.3 + f * 2.4;
      this.slingMeshes[i].light.intensity = 0.85 + f * 2.4;
    }

    for (let i = 0; i < this.rolloverLeds.length; i++) {
      this.rolloverLeds[i].emissiveIntensity = sim.rolloverLit[i] ? 2.6 : 0.35;
    }

    const chaseSpeed = sim.feverTime > 0 ? 9.0 : 3.2;
    const activeArrow = Math.floor(nowSec * chaseSpeed) % 3;
    for (let i = 0; i < this.chaseChevrons.length; i++) {
      this.chaseChevrons[i].emissiveIntensity = i === activeArrow ? 2.4 : 0.35;
    }

    for (let i = 0; i < this.dropGroups.length; i++) {
      const targetY = sim.dropDown[i] ? -0.34 : 0;
      this.dropGroups[i].position.y += (targetY - this.dropGroups[i].position.y) * Math.min(1, dt * 18);
    }

    this.spinnerPivot.rotation.x = sim.spinnerAngle;

    if (sim.feverTime > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(nowSec * 12);
      this.feverLight.intensity = 1.6 + pulse * 1.4;
      this.pattyRingLed.material.emissiveIntensity = 2.2 + pulse * 1.1;
      this.archNeonMat.emissive.setHex(0xff3ea5);
      this.archNeonMat.emissiveIntensity = 2.1 + pulse * 0.9;
      this.sideNeonMat.emissiveIntensity = 2.2 + pulse * 0.9;
    } else {
      this.feverLight.intensity = 0;
      this.pattyRingLed.material.emissiveIntensity = 1.9;
      this.archNeonMat.emissive.setHex(0xff9b1a);
      this.archNeonMat.emissiveIntensity = 1.9;
      this.sideNeonMat.emissiveIntensity = 1.7;
    }

    if (this.pattyAnchor) {
      let jumpOffset = 0;
      if (this.pattyJumpTimer > 0) {
        this.pattyJumpTimer = Math.max(0, this.pattyJumpTimer - dt);
        const phase = 1 - this.pattyJumpTimer / 0.55;
        jumpOffset = Math.sin(phase * Math.PI) * 0.55 * this.pattyJumpStrength;
      } else {
        this.pattyJumpStrength = 0;
      }
      const idleBob = Math.sin(nowSec * 2.6) * 0.025;
      const idleYaw = Math.sin(nowSec * 1.4) * 0.08;
      this.pattyAnchor.position.y = this.pattyBaseY + idleBob + jumpOffset;
      this.pattyAnchor.rotation.y = PATTY_STATUE_SPOT.yaw + idleYaw;
    }

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

    // Inquadra sia la backbox "FLIPPER DI PATTY" che i flipper in basso
    const ballFocusZ = Math.max(-0.8, Math.min(1.8, 0.1 + sim.ball.z * 0.12));
    const shakeX = (Math.random() - 0.5) * sim.shake * 0.18;
    const shakeY = (Math.random() - 0.5) * sim.shake * 0.14;
    this.camera.position.set(-0.06 + shakeX, 20.6 + shakeY, 15.2);
    this.camera.lookAt(-0.05, 0.35, ballFocusZ);

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

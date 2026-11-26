# LOOK.md — Flipper di Patty v2 Deluxe

- **Three.js Version:** `0.170.0` (vendored offline in `./vendor/`)
- **Target Picture:** `./design/target_look.png`

## 1. Illuminazione & Atmosfera ("Lit from Within")
- **Sfondo / Stanza:** `#0d0705`, `HemisphereLight` contenuta (`intensity: 0.34`) così la scena non appare piatta ma illuminata dall'interno del tavolo.
- **Spotlight dedicato su Patty 3D:** `SpotLight` caldo frontale (`intensity: 7.5`) + `PointLight` fill frontale (`intensity: 2.4`) + rim fucsia (`0.85`).
- **Playfield Clearcoat:** `MeshPhysicalMaterial` (`color: #b59c82`, `clearcoat: 0.42`, `clearcoatRoughness: 0.24`, `roughness: 0.34`, `envMapIntensity: 0.26`) con riflessi ambientali contenuti da `RoomEnvironment`.
- **Post-Processing (`UnrealBloomPass` + `OutputPass`):**
  - `threshold: 1.05` (HDR selettivo: il bloom si accende **solo** su LED `emissiveIntensity >= 1.8`, scintille e highlight, mai sul piano o sul ritratto di Patty)
  - `strength: 0.42`
  - `radius: 0.36`

## 2. Asset Blender (`assets/pinball_toys.glb`) & Parti 3D
- **Pop Bumper 1 (Top Center):** `Toy_Elefantino` fucsia lucido (`#ff3ea5`) con proboscide, orecchie e occhi ovali scuri, anello LED fucsia sotto (`r = 0.55`).
- **Pop Bumper 2 (Sinistra):** `Toy_Biscotto` osso dorato smussato (`#ffbe3b`) su corona ottone (`r = 0.49`).
- **Pop Bumper 3 (Destra):** `Toy_Ciotola` turchese (`#4fd1c5`) con crocchette lucide all'interno (`r = 0.49`).
- **Drop Target (3× sinistra):** `Toy_DropBiscuit` dorati con LED arancio-fucsia.
- **Flipper & Slingshot:** `Toy_Flipper` scolpiti (`length = 1.24`) + coperture traslucide `Toy_SlingshotCap_L/R` illuminate da sotto.
- **Patty 3D (`assets/Patty_HF_3D.glb`):** piedistallo alto sinistro `(-3.55, 0.34, -6.92)`, `yaw ≈ 0.58`, `metalness: 0.04`, `roughness: 0.82`, `metalnessMap: null`, `receiveShadow: false`.

## 3. Framing, Leggibilità & Mobile
- Il mobile occupa `86%–92%` dell'altezza del viewport desktop (`1280×720`) e `100%` senza overflow orizzontale su smartphone (`390×844`).
- Testa di Patty 3D con almeno `16px` di margine sotto la barra `P-A-T`; medaglioni `P`, `A`, `T` e banner `"CASA DI SILVIA"` interamente visibili sopra i controlli touch senza sovrapposizioni tra chip HUD.
- Flag di pronto: `window.__omGame.getState().ready === true` (`pattyLoaded && toysLoaded`).

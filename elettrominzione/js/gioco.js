/*
 * Elettrominzione — da una straordinaria idea dell'Ing. Rosario Leotta.
 *
 * La scena è resa in Blender (cartella blender/): sfondo, primo piano (il parapetto) e l'ubriaco in tre pose,
 * tutti con la stessa camera prospettica, che sta in SCENA.camera. Il gioco lavora in metri: il getto vive
 * nel piano y = 0, i tre conduttori lo attraversano in punti fissi, e ogni punto del mondo si porta sui pixel
 * dello sfondo con la camera. Il getto è una fila di gocce balistiche: finché è continuo e attaccato
 * all'ubriaco, se tocca l'alone di un cavo la corrente passa (nella «fisica reale» si spezza dopo 15 cm).
 */
(function () {
  "use strict";

  const S = window.SCENA, CAM = S.camera;
  const G = 9.81;
  const ROTTURA = 0.15;              // m: oltre, un getto vero è già gocce (Splash Lab, BYU)
  const SEZIONE = Math.PI * 0.0025 ** 2;   // getto di 5 mm di diametro
  const R_CORPO = 1000;              // ohm, mani-piedi, ordine di grandezza
  const LITRI_BIRRA = 0.25;          // quanto arriva in vescica da una birra (grossolano)

  const LIVELLI = [
    { nome: "Livello 1", kv: 132, alone: 0.25, birre: 2, barcolla: 0.035, vento: 0,
      aiuto: "Tieni premuto PIPÌ. Con ▲▼ alzi o abbassi la mira. Stai lontano dagli aloni azzurri: lì la scarica salta anche senza toccare il cavo." },
    { nome: "Livello 2", kv: 220, alone: 0.4, birre: 4, barcolla: 0.06, vento: 0.7,
      aiuto: "220 kV: gli aloni crescono. Quattro birre: barcolla di più." },
    { nome: "Livello 3", kv: 380, alone: 0.5, birre: 6, barcolla: 0.07, vento: 1.2,
      aiuto: "380 kV e vento a raffiche: fra i cavi non si passa più. Getto alto, quasi dritto in su, e ricade vicino al ponte." },
  ];

  const $ = (id) => document.getElementById(id);
  const cv = $("scena"), g = cv.getContext("2d");
  const ui = {
    hud: $("hud"), livello: $("hud-livello"), kv: $("hud-kv"), vescica: $("vescica-livello"), audio: $("audio"),
    fumetto: $("fumetto"), titolo: $("titolo"), gioca: $("gioca"), fisica: $("fisica-reale"), comandi: $("comandi"),
    cartellino: $("cartellino"), cSopra: $("c-sopra"), cTitolo: $("c-titolo"), cCorpo: $("c-corpo"), cAzioni: $("c-azioni"),
  };

  /* ---------- immagini ---------- */

  const IMG = {};
  Object.entries(S.strati).forEach(([nome, d]) => { IMG[nome] = new Image(); IMG[nome].src = d.img; });

  // l'ubriaco carbonizzato: la stessa posa, scurita, per lo sfarfallio della scossa
  let carbone = null;
  function preparaCarbone() {
    const d = S.strati["ubriaco-folgorato"], im = IMG["ubriaco-folgorato"];
    carbone = document.createElement("canvas");
    carbone.width = d.w; carbone.height = d.h;
    const q = carbone.getContext("2d");
    q.drawImage(im, 0, 0);
    q.globalCompositeOperation = "source-atop";
    q.fillStyle = "rgb(18 16 14 / 88%)";
    q.fillRect(0, 0, d.w, d.h);
  }

  /* ---------- proiezione: metri del mondo → pixel dello sfondo ---------- */

  const M = CAM.mondo_camera;
  function aCamera(p) {
    return [0, 1, 2].map((i) => M[i][0] * p[0] + M[i][1] * p[1] + M[i][2] * p[2] + M[i][3]);
  }
  function P(x, y, z) {
    const c = aCamera([x, y, z]);
    return [CAM.larghezza / 2 + (CAM.focale_px * c[0]) / -c[2], CAM.altezza / 2 - (CAM.focale_px * c[1]) / -c[2]];
  }
  // pixel per metro alla profondità di un punto
  function scala(x, y, z) { return CAM.focale_px / -aCamera([x, y, z])[2]; }

  const PIEDI = CAM.piedi, ORIGINE = CAM.origine_getto, PAR = CAM.parapetto;

  /* ---------- inquadratura sul canvas ---------- */

  let dpr = 1, vista = { s: 1, ox: 0, oy: 0 };
  function adatta() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    // la parte dello sfondo che deve sempre vedersi: ubriaco, getto, cavi
    const verticale = r.height > r.width;
    const roi = verticale ? [200, 1480, 40, 1180] : [120, 1760, 30, 1190];
    const w = roi[1] - roi[0], h = roi[3] - roi[2];
    // lo sfondo copre sempre tutta la larghezza; in altezza avanza cielo sopra o si taglia un po'
    const s = Math.max(Math.min(cv.width / w, cv.height / h), cv.width / CAM.larghezza);
    vista = { s, ox: cv.width / 2 - s * (roi[0] + w / 2), oy: cv.height / 2 - s * (roi[2] + h / 2) };
    vista.ox = Math.min(0, Math.max(cv.width - s * CAM.larghezza, vista.ox));   // mai bordi vuoti ai lati
    // niente vuoti sotto lo sfondo: se avanza spazio, lo sfondo scende fino al bordo
    const fondo = vista.oy + s * CAM.altezza;
    if (fondo < cv.height) vista.oy += cv.height - fondo;
  }
  window.addEventListener("resize", adatta);

  /* ---------- audio (sintetizzato, niente file) ---------- */

  let audio = null, muto = false, rumoreGetto = null;
  try { muto = localStorage.getItem("elettro-muto") === "1"; } catch (e) { /* facoltativo */ }
  function avviaAudio() {
    if (audio || !(window.AudioContext || window.webkitAudioContext)) return;
    audio = new (window.AudioContext || window.webkitAudioContext)();
    const n = audio.sampleRate * 1.5, buf = audio.createBuffer(1, n, audio.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    audio.rumore = buf;
    // il fruscio del getto: rumore filtrato, volume a zero finché non si fa pipì
    const src = audio.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = audio.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2400; f.Q.value = 0.7;
    rumoreGetto = audio.createGain(); rumoreGetto.gain.value = 0;
    src.connect(f).connect(rumoreGetto).connect(audio.destination); src.start();
  }
  function suona(fn) { if (audio && !muto) { try { fn(audio, audio.currentTime); } catch (e) { /* niente */ } } }
  function scossaSonora() {
    suona((a, t) => {
      const ronzio = a.createOscillator(); ronzio.type = "sawtooth"; ronzio.frequency.value = 100;
      const gr = a.createGain(); gr.gain.setValueAtTime(0.0001, t); gr.gain.exponentialRampToValueAtTime(0.35, t + 0.02); gr.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      ronzio.connect(gr).connect(a.destination); ronzio.start(t); ronzio.stop(t + 1.7);
      const crepitio = a.createBufferSource(); crepitio.buffer = a.rumore;
      const f = a.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1800;
      const gc = a.createGain(); gc.gain.setValueAtTime(0.5, t); gc.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      crepitio.connect(f).connect(gc).connect(a.destination); crepitio.start(t); crepitio.stop(t + 1.4);
    });
  }
  function glu() {
    suona((a, t) => {
      for (let k = 0; k < 3; k++) {
        const o = a.createOscillator(); o.type = "sine";
        o.frequency.setValueAtTime(260 - k * 30, t + k * 0.16); o.frequency.exponentialRampToValueAtTime(120, t + k * 0.16 + 0.12);
        const gg = a.createGain(); gg.gain.setValueAtTime(0.0001, t + k * 0.16); gg.gain.exponentialRampToValueAtTime(0.25, t + k * 0.16 + 0.02); gg.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.16 + 0.14);
        o.connect(gg).connect(a.destination); o.start(t + k * 0.16); o.stop(t + k * 0.16 + 0.15);
      }
    });
  }
  function tss() {
    suona((a, t) => {
      const s = a.createBufferSource(); s.buffer = a.rumore;
      const f = a.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 5000;
      const gg = a.createGain(); gg.gain.setValueAtTime(0.12, t); gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      s.connect(f).connect(gg).connect(a.destination); s.start(t); s.stop(t + 0.3);
    });
  }
  function aggiornaAudioIcona() { ui.audio.textContent = muto ? "🔇" : "🔊"; }
  ui.audio.addEventListener("click", () => {
    muto = !muto;
    try { localStorage.setItem("elettro-muto", muto ? "1" : "0"); } catch (e) { /* facoltativo */ }
    aggiornaAudioIcona();
  });
  aggiornaAudioIcona();

  /* ---------- stato del gioco ---------- */

  let stato = "titolo", lv = 0, t = 0, tStato = 0;
  let mira = 25, vescica = 1, vescicaIniziale = 1, fisicaReale = false;
  let gocce = [], segmento = 0, tieni = false, schizzi = 0, avvisi = {};
  let effetti = [], scossa = null, bevute = 0;
  const premuti = new Set();

  function barcollo(tt) {
    const L = LIVELLI[lv], a = L.barcolla;
    return a * (0.6 * Math.sin(1.3 * tt) + 0.4 * Math.sin(2.9 * tt + 1)) + a * 0.35 * Math.sin(0.37 * tt + 2);
  }
  function vento(tt) { const L = LIVELLI[lv]; return L.vento * Math.sin(0.7 * tt) * Math.sin(0.23 * tt + 2); }

  // origine e direzione del getto, col corpo inclinato di phi attorno ai piedi
  function bocca(phi) {
    const dx = ORIGINE[0] - PIEDI[0], dz = ORIGINE[2] - PIEDI[2];
    return [PIEDI[0] + dx * Math.cos(phi) + dz * Math.sin(phi), PIEDI[2] - dx * Math.sin(phi) + dz * Math.cos(phi)];
  }
  const velocita = () => 1.8 + 2.4 * Math.pow(Math.max(vescica, 0) / vescicaIniziale, 0.6);
  const portata = () => 0.06 * (0.4 + 0.6 * Math.max(vescica, 0) / vescicaIniziale);   // litri al secondo

  function fumetto(testo, durata = 5) {
    ui.fumetto.textContent = testo;
    ui.fumetto.hidden = false;
    ui.fumetto.classList.remove("sparito");
    clearTimeout(fumetto.t);
    fumetto.t = setTimeout(() => ui.fumetto.classList.add("sparito"), durata * 1000);
  }

  function vai(nuovo) { stato = nuovo; tStato = 0; }

  function iniziaLivello(i) {
    lv = i;
    const L = LIVELLI[lv];
    vescicaIniziale = vescica = L.birre * LITRI_BIRRA;
    mira = 25; gocce = []; effetti = []; segmento = 0; tieni = false; schizzi = 0; avvisi = {}; scossa = null; bevute = 0;
    premuti.clear();
    ui.livello.textContent = L.nome;
    ui.kv.textContent = L.kv + " kV";
    aggiornaVescica();
    ui.cartellino.hidden = true;
    ui.titolo.hidden = true;
    ui.hud.hidden = false;
    ui.comandi.hidden = false;
    adatta();
    fumetto(`${L.birre} birre in corpo. Linea da ${L.kv} kV sotto il ponte.`, 3);
    vai("beve");
  }

  function aggiornaVescica() { ui.vescica.style.width = Math.max(0, (vescica / vescicaIniziale) * 100) + "%"; }

  /* ---------- simulazione ---------- */

  function passo(dt) {
    t += dt; tStato += dt;
    if (stato === "beve") {
      // una birra ogni 0,9 s, poi si comincia
      const n = Math.floor(tStato / 0.9);
      if (n > bevute && bevute < LIVELLI[lv].birre) { bevute++; glu(); }
      if (tStato > LIVELLI[lv].birre * 0.9 + 0.4) { vai("gioco"); fumetto(LIVELLI[lv].aiuto, 7); }
      return;
    }
    if (stato !== "gioco" && stato !== "scossa") return;

    const phi = barcollo(t);
    if (stato === "gioco") {
      if (premuti.has("su")) mira = Math.min(85, mira + 55 * dt);
      if (premuti.has("giu")) mira = Math.max(-15, mira - 55 * dt);
      const vuole = premuti.has("pipi") && vescica > 0;
      if (vuole && !tieni) segmento++;
      tieni = vuole;
      if (rumoreGetto && audio) rumoreGetto.gain.setTargetAtTime(tieni && !muto ? 0.06 : 0, audio.currentTime, 0.05);
      if (tieni) {
        vescica -= portata() * dt;
        aggiornaVescica();
        // circa 120 gocce al secondo: il getto resta una linea liscia
        passo.acc = (passo.acc || 0) + dt * 120;
        const [ox, oz] = bocca(phi), v = velocita(), th = ((mira * Math.PI) / 180) - phi;
        while (passo.acc >= 1) {
          passo.acc -= 1;
          gocce.push({ x: ox, z: oz, vx: v * Math.cos(th), vz: v * Math.sin(th), eta: 0, seg: segmento, v0: v });
        }
      }
    }

    const ax = stato === "gioco" ? vento(t) : 0;
    const L = LIVELLI[lv];
    for (const d of gocce) {
      if (d.morta) continue;
      d.vx += ax * dt; d.vz -= G * dt;
      d.x += d.vx * dt; d.z += d.vz * dt; d.eta += dt;
      // il parapetto (e le scarpe, se il getto ricade dentro il ponte)
      if ((d.x > PAR.x0 - 0.03 && d.x < PAR.x1 + 0.03 && d.z < PAR.cima) || (d.x < PAR.x0 && d.z < PIEDI[2] + 0.05)) {
        d.morta = true; schizzi++; spruzzo(d.x, d.z);
        if (!avvisi.scarpe && schizzi > 25) { avvisi.scarpe = true; fumetto("Sul muretto e sulle scarpe… mira più in alto!", 3); }
        continue;
      }
      if (d.x < CAM.muro_ponte_x && d.z < CAM.z_ponte - 0.1) { d.morta = true; continue; }
      if (d.z < 0.15 || d.x > 12) { d.morta = true; continue; }
      if (stato !== "gioco") continue;
      for (const [xc, zc] of CAM.conduttori) {
        const r = 0.025 + L.alone;
        if ((d.x - xc) ** 2 + (d.z - zc) ** 2 < r * r) {
          const attaccata = d.seg === segmento && tieni;
          const continua = !fisicaReale || d.eta * d.v0 < ROTTURA;
          if (attaccata && continua) { folgora(d, xc, zc); return; }
          // gocce staccate: sfrigolano e basta
          d.morta = true;
          if (Math.random() < 0.3) scintilla(d.x, d.z, 0.4);
          if (!avvisi.gocce && fisicaReale) { avvisi.gocce = true; tss(); fumetto("Tss! Arrivano solo gocce: fra una goccia e l'altra c'è aria, e l'aria isola.", 5); }
          else if (!avvisi.staccato && !fisicaReale) { avvisi.staccato = true; fumetto("Getto staccato: niente scossa. Ma non riprovarci col getto attaccato!", 4); }
          break;
        }
      }
    }
    if (gocce.length > 600 || t % 1 < dt) gocce = gocce.filter((d) => !d.morta);

    for (const e of effetti) e.vita -= dt;
    effetti = effetti.filter((e) => e.vita > 0);
    for (const e of effetti) if (e.tipo === "goccia") { e.vz -= G * dt; e.x += e.vx * dt; e.z += e.vz * dt; }

    if (stato === "gioco" && vescica <= 0 && !gocce.some((d) => !d.morta)) vittoria();
    if (stato === "scossa" && tStato > 2.2 && ui.cartellino.hidden) cartellinoScossa();
  }

  function spruzzo(x, z) {
    if (Math.random() > 0.35) return;
    for (let k = 0; k < 2; k++) effetti.push({ tipo: "goccia", x, z, vx: (Math.random() - 0.5) * 1.2, vz: Math.random() * 1.2, vita: 0.35 });
  }
  function scintilla(x, z, vita) { effetti.push({ tipo: "scintilla", x, z, vita, max: vita }); }

  /* ---------- la scossa ---------- */

  function folgora(d, xc, zc) {
    // lunghezza del getto continuo: dalla goccia che tocca fino all'ubriaco
    const seg = gocce.filter((q) => q.seg === d.seg && !q.morta).sort((a, b) => b.eta - a.eta);
    let L = 0, prima = null;
    for (const q of seg) {
      if (q.eta > d.eta) continue;
      if (prima) L += Math.hypot(q.x - prima.x, q.z - prima.z);
      prima = q;
    }
    const [ox, oz] = bocca(barcollo(t));
    if (prima) L += Math.hypot(ox - prima.x, oz - prima.z);
    const Lv = LIVELLI[lv];
    const sigma = 2.2 / (1 + 0.25 * Lv.birre);            // S/m: più birre, urina più diluita
    const R = L / (sigma * SEZIONE);
    const Vfase = (Lv.kv * 1000) / Math.sqrt(3);          // tensione di un conduttore verso terra
    const I = Vfase / (R + R_CORPO);
    scossa = { xc, zc, L, sigma, R, Vfase, I, gocce: seg.filter((q) => q.eta <= d.eta) };
    tieni = false;
    premuti.clear();
    document.querySelectorAll(".tasto.premuto").forEach((b) => b.classList.remove("premuto"));
    if (rumoreGetto && audio) rumoreGetto.gain.setTargetAtTime(0, audio.currentTime, 0.02);
    scossaSonora();
    try { navigator.vibrate && navigator.vibrate([80, 40, 120, 40, 200]); } catch (e) { /* facoltativo */ }
    for (let k = 0; k < 14; k++) scintilla(xc + (Math.random() - 0.5) * 0.3, zc + (Math.random() - 0.5) * 0.3, 0.6 + Math.random() * 0.8);
    vai("scossa");
  }

  const fmt = (n, cifre = 1) => n.toLocaleString("it-IT", { maximumFractionDigits: cifre, minimumFractionDigits: cifre });
  function ohm(R) { return R >= 1e6 ? fmt(R / 1e6) + " MΩ" : R >= 1e3 ? fmt(R / 1e3, 0) + " kΩ" : fmt(R, 0) + " Ω"; }
  function ampere(I) { return I >= 1 ? fmt(I, 2) + " A" : fmt(I * 1000, 0) + " mA"; }

  const BATTUTE = [
    "L'Ing. Leotta l'aveva detto.",
    "Chiuso il circuito, chiusa la serata.",
    "La legge di Ohm non perdona.",
    "Ultima birra: servita alla rete elettrica nazionale.",
  ];

  function cartellinoScossa() {
    const s = scossa, Lv = LIVELLI[lv];
    const pos = (I) => Math.min(100, Math.max(0, ((Math.log10(I) + 4) / 5) * 100));
    ui.cSopra.textContent = `${Lv.nome} · linea da ${Lv.kv} kV`;
    ui.cTitolo.textContent = "Elettrominzione!";
    ui.cTitolo.className = "zap";
    ui.cCorpo.innerHTML = `
      <p>${BATTUTE[Math.floor(Math.random() * BATTUTE.length)]} Il getto ha fatto da filo fra il cavo e l'ubriaco, e la corrente è passata.</p>
      <dl class="conti">
        <dt>Tensione del cavo verso terra</dt><dd>${fmt(s.Vfase / 1000, 0)} kV</dd>
        <dt>Getto continuo</dt><dd>${fmt(s.L, 2)} m di urina</dd>
        <dt>Conducibilità (${Lv.birre} birre, diluita)</dt><dd>${fmt(s.sigma, 2)} S/m</dd>
        <dt>Resistenza del getto R = L / (σ·S)</dt><dd>${ohm(s.R)}</dd>
        <dt>Corrente I = V / R</dt><dd>${ampere(s.I)}</dd>
      </dl>
      <div class="soglie" aria-label="Corrente nel corpo">
        <div class="soglie-barra"><span class="soglie-segno" style="left:${pos(s.I)}%"></span></div>
        <div class="soglie-etichette">
          <span style="left:${pos(0.001)}%">1 mA<br>si sente</span>
          <span style="left:${pos(0.03)}%;top:16px">30 mA salvavita</span>
          <span style="left:${pos(0.1)}%;top:0">100 mA cuore</span>
          <span style="left:${pos(1)}%">1 A<br>ustioni</span>
        </div>
      </div>
      <p class="piccolo">Perché conduce: l'urina è acqua con sali sciolti (sodio, potassio, cloruri) e sono gli ioni a portare la corrente. Più birre, urina più diluita e meno conduttiva… ma a queste tensioni non basta.</p>
      <p class="piccolo">Nella realtà un getto si spezza in gocce dopo circa 15 cm, e l'aria fra le gocce isola: prova la «Fisica reale» dal menu. (L'Ing. Leotta resta della sua idea.)</p>`;
    azioni([["Riprova", () => iniziaLivello(lv)], ["Menu", menu, true]]);
    ui.cartellino.hidden = false;
  }

  function vittoria() {
    vai("vinto");
    if (rumoreGetto && audio) rumoreGetto.gain.setTargetAtTime(0, audio.currentTime, 0.05);
    const Lv = LIVELLI[lv];
    const stelle = schizzi < 15 ? 3 : schizzi < 80 ? 2 : 1;
    const ultimo = lv === LIVELLI.length - 1;
    ui.cSopra.textContent = `${Lv.nome} · linea da ${Lv.kv} kV`;
    ui.cTitolo.textContent = ultimo ? "Diploma di elettrominzione" : "Vescica vuota!";
    ui.cTitolo.className = "";
    ui.cCorpo.innerHTML = `
      <p class="stelle">${"★".repeat(stelle)}${"☆".repeat(3 - stelle)}</p>
      <p>${ultimo ? "Sei birre, 380 kV, vento a raffiche: e sei ancora vivo. L'Ing. Rosario Leotta ti conferisce il diploma ad honorem." : "Svuotato senza chiudere il circuito."}
      ${stelle < 3 ? " Ma il muretto e le scarpe non ringraziano: la prossima volta mira più alto." : " E pure le scarpe sono asciutte."}</p>
      ${fisicaReale ? '<p class="piccolo">In «Fisica reale» il getto arriva ai cavi già in gocce: non può chiudere il circuito. Non vuol dire che sia una buona idea.</p>' : ""}`;
    azioni(ultimo ? [["Ricomincia", () => iniziaLivello(0)], ["Menu", menu, true]] : [["Livello successivo", () => iniziaLivello(lv + 1)], ["Menu", menu, true]]);
    ui.cartellino.hidden = false;
  }

  function azioni(lista) {
    ui.cAzioni.innerHTML = "";
    lista.forEach(([testo, fn, secondario]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bottone" + (secondario ? " secondario" : "");
      b.textContent = testo;
      b.addEventListener("click", fn);
      ui.cAzioni.appendChild(b);
    });
  }

  function menu() {
    vai("titolo");
    ui.cartellino.hidden = true;
    ui.hud.hidden = true;
    ui.comandi.hidden = true;
    ui.fumetto.hidden = true;
    ui.titolo.hidden = false;
    gocce = []; effetti = []; scossa = null;
    adatta();
  }

  /* ---------- disegno ---------- */

  function cielo() {
    const W = cv.width, H = cv.height;
    const orizzonte = vista.oy + vista.s * 520;
    const gr = g.createLinearGradient(0, Math.min(0, orizzonte - H), 0, orizzonte);
    gr.addColorStop(0, "#1f2a52");
    gr.addColorStop(0.55, "#8a6f8e");
    gr.addColorStop(0.85, "#e7a07c");
    gr.addColorStop(1, "#f6c28e");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    // un sole basso dietro le colline
    const [sx, sy] = [vista.ox + vista.s * 1500, orizzonte - vista.s * 40];
    const sole = g.createRadialGradient(sx, sy, 0, sx, sy, vista.s * 260);
    sole.addColorStop(0, "rgb(255 236 190 / 95%)");
    sole.addColorStop(0.15, "rgb(255 210 150 / 60%)");
    sole.addColorStop(1, "rgb(255 190 130 / 0%)");
    g.fillStyle = sole;
    g.fillRect(0, 0, W, H);
  }

  function strato(nome, extra) {
    const d = S.strati[nome], im = extra || IMG[nome];
    g.drawImage(im, d.x, d.y, d.w, d.h);
  }

  function disegnaUbriaco(phi) {
    let nome = "ubriaco-normale";
    if (stato === "beve" && tStato % 0.9 < 0.62 && bevute < LIVELLI[lv].birre + 1 && tStato < LIVELLI[lv].birre * 0.9) nome = "ubriaco-beve";
    const inScossa = stato === "scossa" || (stato !== "titolo" && scossa);
    if (inScossa) nome = "ubriaco-folgorato";
    const [px, py] = P(PIEDI[0], PIEDI[1], PIEDI[2]);
    g.save();
    g.translate(px, py);
    // tremolio durante la scossa, barcollio sempre
    const tremo = inScossa && tStato < 1.6 ? (Math.random() - 0.5) * 6 : 0;
    g.rotate(phi * 0.9);
    g.translate(-px + tremo, -py);
    if (inScossa && carbone && ((tStato < 1.6 && Math.floor(tStato * 14) % 2) || tStato >= 1.6)) strato(nome, carbone);
    else strato(nome);
    g.restore();
  }

  function aloni() {
    const L = LIVELLI[lv];
    const pulsa = 0.5 + 0.5 * Math.sin(t * 5);
    for (const [xc, zc] of CAM.conduttori) {
      const [x, y] = P(xc, 0, zc), r = (0.025 + L.alone) * scala(xc, 0, zc);
      const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r);
      gr.addColorStop(0, "rgb(160 235 255 / 0%)");
      gr.addColorStop(0.75, `rgb(120 220 255 / ${0.1 + 0.08 * pulsa})`);
      gr.addColorStop(1, "rgb(120 220 255 / 0%)");
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = `rgb(150 230 255 / ${0.35 + 0.35 * pulsa})`;
      g.lineWidth = 2;
      g.setLineDash([6, 5]);
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
      // piccoli archi che crepitano sul bordo
      if (Math.random() < 0.25) {
        const a = Math.random() * Math.PI * 2;
        fulmine(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, x + Math.cos(a) * r, y + Math.sin(a) * r, 3, "rgb(190 245 255 / 70%)", 1.2);
      }
    }
  }

  function getto() {
    // una linea per ogni tratto: gocce dello stesso segmento, in ordine di uscita
    const perSeg = new Map();
    for (const d of gocce) if (!d.morta) { if (!perSeg.has(d.seg)) perSeg.set(d.seg, []); perSeg.get(d.seg).push(d); }
    const sp = scala(ORIGINE[0], 0, ORIGINE[2]);
    for (const [seg, lista] of perSeg) {
      lista.sort((a, b) => b.eta - a.eta);
      const attaccato = seg === segmento && tieni;
      const pts = lista.map((d) => P(d.x, 0, d.z));
      if (attaccato && stato === "gioco") pts.push(P(bocca(barcollo(t))[0], 0, bocca(barcollo(t))[1]));
      const continui = [], gocceSciolte = [];
      lista.forEach((d, i) => (fisicaReale && d.eta * d.v0 >= ROTTURA ? gocceSciolte : continui).push(pts[i]));
      if (attaccato && stato === "gioco") continui.push(pts[pts.length - 1]);
      g.lineCap = "round"; g.lineJoin = "round";
      if (continui.length > 1) {
        for (const [w, col] of [[0.024, "rgb(255 205 40 / 35%)"], [0.013, "rgb(255 220 70 / 90%)"], [0.004, "rgb(255 250 210 / 90%)"]]) {
          g.strokeStyle = col; g.lineWidth = Math.max(1.2, w * sp);
          g.beginPath(); continui.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        }
      }
      g.fillStyle = "rgb(255 220 70 / 90%)";
      for (const [x, y] of gocceSciolte) { g.beginPath(); g.arc(x, y, Math.max(1.2, 0.007 * sp), 0, Math.PI * 2); g.fill(); }
    }
  }

  function fulmine(x0, y0, x1, y1, pezzi, colore, larghezza) {
    g.strokeStyle = colore; g.lineWidth = larghezza;
    g.beginPath(); g.moveTo(x0, y0);
    const lx = x1 - x0, ly = y1 - y0, n = Math.hypot(lx, ly) || 1;
    for (let k = 1; k < pezzi; k++) {
      const f = k / pezzi, off = (Math.random() - 0.5) * n * 0.25;
      g.lineTo(x0 + lx * f - (ly / n) * off, y0 + ly * f + (lx / n) * off);
    }
    g.lineTo(x1, y1); g.stroke();
  }

  function effettiScossa() {
    if (!scossa) return;
    const k = tStato;
    // lampo bianco iniziale
    if (k < 0.35) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgb(235 250 255 / ${0.8 * (1 - k / 0.35)})`; g.fillRect(0, 0, cv.width, cv.height); g.restore(); }
    if (k < 1.8) {
      // la scarica corre lungo il getto, dal cavo all'ubriaco
      const pts = scossa.gocce.map((d) => P(d.x, 0, d.z));
      const [ox, oz] = bocca(barcollo(t));
      pts.push(P(ox, 0, oz));
      for (const [col, w] of [["rgb(120 220 255 / 55%)", 7], ["rgb(235 250 255 / 95%)", 2.2]]) {
        g.strokeStyle = col; g.lineWidth = w;
        g.beginPath();
        pts.forEach(([x, y], i) => { const j = (Math.random() - 0.5) * 6; i ? g.lineTo(x + j, y + j) : g.moveTo(x, y); });
        g.stroke();
      }
      // archi attorno al corpo
      const [cx, cy] = P(PIEDI[0] + 0.05, 0, PIEDI[2] + 1.1);
      const sc = scala(PIEDI[0], 0, PIEDI[2] + 1);
      for (let q = 0; q < 4; q++) {
        const a = Math.random() * Math.PI * 2, r = sc * (0.5 + Math.random() * 0.5);
        fulmine(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.3, 5, "rgb(200 245 255 / 90%)", 2);
      }
    }
    // fumo dalla testa
    if (k > 1.2) {
      const [hx, hy] = P(PIEDI[0], 0, PIEDI[2] + 1.75);
      const sc = scala(PIEDI[0], 0, PIEDI[2] + 1.75);
      for (let q = 0; q < 5; q++) {
        const f = ((k * 0.6 + q / 5) % 1);
        g.fillStyle = `rgb(70 70 75 / ${0.45 * (1 - f)})`;
        g.beginPath(); g.arc(hx + Math.sin(q * 2.3 + k) * sc * 0.08, hy - f * sc * 0.9, sc * (0.06 + f * 0.14), 0, Math.PI * 2); g.fill();
      }
    }
  }

  function effettiVari() {
    for (const e of effetti) {
      const [x, y] = P(e.x, 0, e.z), sc = scala(e.x, 0, e.z);
      if (e.tipo === "goccia") { g.fillStyle = "rgb(255 220 90 / 80%)"; g.beginPath(); g.arc(x, y, Math.max(1, 0.008 * sc), 0, Math.PI * 2); g.fill(); }
      else if (e.tipo === "scintilla") {
        const f = e.vita / e.max;
        for (let q = 0; q < 3; q++) {
          const a = Math.random() * Math.PI * 2, r = sc * 0.15 * f * (0.5 + Math.random());
          fulmine(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, 3, `rgb(220 250 255 / ${f})`, 1.5);
        }
      }
    }
  }

  function mirino(phi) {
    if (stato !== "gioco") return;
    // freccetta della mira davanti alla pancia
    const [ox, oz] = bocca(phi), th = (mira * Math.PI) / 180 - phi;
    const [x0, y0] = P(ox, 0, oz), [x1, y1] = P(ox + Math.cos(th) * 0.45, 0, oz + Math.sin(th) * 0.45);
    g.strokeStyle = "rgb(255 255 255 / 55%)"; g.lineWidth = 2; g.setLineDash([4, 4]);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
    g.fillStyle = "rgb(255 255 255 / 80%)";
    g.beginPath(); g.arc(x1, y1, 3, 0, Math.PI * 2); g.fill();
  }

  function disegna() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    cielo();
    g.setTransform(vista.s, 0, 0, vista.s, vista.ox, vista.oy);
    // il fiume continua sotto lo sfondo, se lo schermo è più alto
    g.fillStyle = "#35554f";
    g.fillRect(-2000, CAM.altezza - 2, CAM.larghezza + 4000, 4000);
    strato("sfondo");
    const phi = stato === "titolo" ? barcollo(t) * 0.6 : barcollo(t);
    if (stato !== "titolo") aloni();
    disegnaUbriaco(phi);
    getto();
    effettiVari();
    strato("primo-piano");
    mirino(phi);
    effettiScossa();
  }

  /* ---------- titolo scintillante ---------- */

  const sc2 = $("scintille"), gs = sc2.getContext("2d");
  let lampiTitolo = [];
  function scintilleTitolo(dt) {
    if (ui.titolo.hidden) return;
    const r = sc2.getBoundingClientRect(), k = Math.min(window.devicePixelRatio || 1, 2);
    if (sc2.width !== Math.round(r.width * k)) { sc2.width = Math.round(r.width * k); sc2.height = Math.round(r.height * k); }
    gs.clearRect(0, 0, sc2.width, sc2.height);
    if (Math.random() < dt * 7) {
      // un arco che salta fra due punti del bordo della scritta
      const W = sc2.width, H = sc2.height, m = 40 * k;
      const lato = () => [m + Math.random() * (W - 2 * m), Math.random() < 0.5 ? m * 0.9 : H - m * 0.9];
      lampiTitolo.push({ a: lato(), b: [m + Math.random() * (W - 2 * m), H / 2 + (Math.random() - 0.5) * H * 0.3], vita: 0.18 });
    }
    for (const l of lampiTitolo) {
      l.vita -= dt;
      const [x0, y0] = l.a, [x1, y1] = l.b, n = 7;
      for (const [col, w] of [["rgb(120 210 255 / 45%)", 6 * k], ["rgb(240 252 255 / 95%)", 1.6 * k]]) {
        gs.strokeStyle = col; gs.lineWidth = w; gs.lineCap = "round";
        gs.beginPath(); gs.moveTo(x0, y0);
        for (let q = 1; q < n; q++) gs.lineTo(x0 + ((x1 - x0) * q) / n + (Math.random() - 0.5) * 22 * k, y0 + ((y1 - y0) * q) / n + (Math.random() - 0.5) * 22 * k);
        gs.lineTo(x1, y1); gs.stroke();
      }
    }
    lampiTitolo = lampiTitolo.filter((l) => l.vita > 0);
  }

  /* ---------- ciclo ---------- */

  let t0 = 0;
  function ciclo(ms) {
    const dt = t0 ? Math.min(0.05, (ms - t0) / 1000) : 0;
    t0 = ms;
    // passi piccoli: il getto resta liscio anche a pochi fotogrammi
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (let i = 0; i < n; i++) passo(dt / n);
    if (stato === "titolo") t += dt;
    disegna();
    scintilleTitolo(dt);
    requestAnimationFrame(ciclo);
  }

  /* ---------- comandi ---------- */

  document.querySelectorAll("[data-tasto]").forEach((b) => {
    const k = b.dataset.tasto;
    const giu = (e) => { e.preventDefault(); avviaAudio(); if (stato === "gioco") { premuti.add(k); b.classList.add("premuto"); } };
    const su = (e) => { e.preventDefault(); premuti.delete(k); b.classList.remove("premuto"); };
    b.addEventListener("pointerdown", (e) => { b.setPointerCapture(e.pointerId); giu(e); });
    b.addEventListener("pointerup", su);
    b.addEventListener("pointercancel", su);
    b.addEventListener("lostpointercapture", su);
    b.addEventListener("contextmenu", (e) => e.preventDefault());
  });
  const TASTI = { ArrowUp: "su", w: "su", ArrowDown: "giu", s: "giu", " ": "pipi", Enter: "pipi" };
  window.addEventListener("keydown", (e) => { const k = TASTI[e.key]; if (k && stato === "gioco") { premuti.add(k); e.preventDefault(); } });
  window.addEventListener("keyup", (e) => { const k = TASTI[e.key]; if (k) premuti.delete(k); });
  window.addEventListener("blur", () => premuti.clear());

  ui.gioca.addEventListener("click", () => { avviaAudio(); fisicaReale = ui.fisica.checked; iniziaLivello(0); });

  // per le prove automatiche (nessun effetto sul gioco)
  window.__elettro = {
    stato: () => ({ stato, lv, mira, vescica, schizzi, gocce: gocce.length }),
    livello: (i) => iniziaLivello(i),
    mira: (a) => { mira = a; },
    premi: (k, on) => (on ? premuti.add(k) : premuti.delete(k)),
    salta: () => { if (stato === "beve") { tStato = 99; } },
  };

  function parti() {
    preparaCarbone();
    adatta();
    requestAnimationFrame(ciclo);
  }
  const pronta = (im) => new Promise((ok) => {
    if (im.complete && im.naturalWidth) ok();
    else { im.addEventListener("load", ok, { once: true }); im.addEventListener("error", ok, { once: true }); }
  });
  Promise.all(Object.values(IMG).map(pronta)).then(parti);
})();

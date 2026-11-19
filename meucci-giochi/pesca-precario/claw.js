/* MIM CLAW · Pesca il Precario — Passatempi del Prof. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'meucci-claw-stats-v1';
  const COVER_MODE = new URLSearchParams(window.location.search).get('cover') === '1';

  const SHIRT_COLORS = ['#d9f482', '#ef9aad', '#94c9ed', '#c6a5ec', '#eeb879', '#89d3bf'];
  const HAIR_COLORS = ['#543e31', '#b48a53', '#38362f', '#b1b0a3', '#92583a'];
  const SKIN_COLORS = ['#f4c99a', '#e6ad79', '#bd875f', '#f8d9b5'];

  const SURNAMES = [
    'Barbagallo', 'Pappalardo', 'Privitera', 'Russo', 'Grasso', 'Musumeci',
    'Torrisi', 'Giuffrida', 'Caruso', 'Costanzo', 'Lanzafame', 'Gullotta',
    'Mancuso', 'Faro', 'Leonardi', 'Pennisi', 'Maugeri', 'Toscano'
  ];
  const NAMES_M = ['Salvatore', 'Rosario', 'Calogero', 'Carmelo', 'Alfio', 'Giuseppe', 'Gaetano', 'Sebastiano', 'Orazio', 'Antonino', 'Mario', 'Vincenzo'];
  const NAMES_F = ['Carmela', 'Concetta', 'Agata', 'Maria', 'Grazia', 'Santina', 'Graziella', 'Lucia', 'Francesca', 'Giuseppa', 'Rosaria', 'Elena'];
  const CLASSES = [
    { code: 'A-28', name: 'Matematica e Scienze' },
    { code: 'A-18', name: 'Filosofia e Scienze Umane' },
    { code: 'A-60', name: 'Tecnologia nella Scuola Media' },
    { code: 'B-15', name: 'Laboratorio Elettrotecnico' },
    { code: 'A-11', name: 'Discipline Letterarie e Latino' },
    { code: 'A-46', name: 'Scienze Giuridico-Economiche' },
    { code: 'A-26', name: 'Matematica' },
    { code: 'ADSS', name: 'Sostegno Scuola Secondaria II Grado' },
    { code: 'A-50', name: 'Scienze Naturali, Chimiche e Bio' }
  ];

  const TITLES = [
    'Master da 1500 ore completato alle ore 23:58 della notte di scadenza.',
    'Certificazione informatica di 4 domande con risposta multipla identica.',
    'Certificazione C2 rilasciata da università telematica delle Svalbard.',
    'Corso di perfezionamento avanzato sulla "Didattica della cattedra pieghevole".',
    '24 CFU sudati due settimane prima che cambiassero di nuovo la legge.',
    'Abilitazione CLIL conseguita parlando solo in dialetto catanese stretto.'
  ];
  const LOGISTICS = [
    'Paternò–Acireale alle 06:45 con Fiat Panda a metano del 2004.',
    '92 km di statale quotidiani con cantiere e senso unico alternato perenne.',
    '2 pullman FCE e un monopattino elettrico per uno spezzone di 4 ore.',
    'Pendolare dell’Etna: tiene sempre pala da neve e catene nel bagagliaio.',
    'Co-titolare su 3 plessi diversi a 35 km di distanza l’uno dall’altro.',
    'Divide il viaggio con colleghi che parlano solo di ricostruzione di carriera.'
  ];
  const HOPES = [
    'Crede davvero che quest’anno la 18 ore sotto casa esca al primo turno.',
    'Aggiorna la casella PEC ogni 45 secondi anche durante i pranzi di famiglia.',
    'Ha già comprato l’agenda scolastica nuova sperando nel sabato libero.',
    'Prega ogni sera per una maternità fino al 30 giugno in un solo plesso.',
    'Ha il terrore di essere scavallato da un ricorso cautelare al TAR alle 23:59.',
    'Controlla l’albo pretorio alle 2 di notte con due caffè già in corpo.'
  ];

  const TANK_WHISPERS = [
    'Ho fatto pure il CLIL!',
    '24 CFU col sangue!',
    'Anche 6 ore vanno bene!',
    'Aggiorno la PEC!',
    'Master 1500 ore!',
    'Panda a metano pronta!',
    'Niente sabato please…',
    'Sotto casa stavolta!'
  ];

  const PROF_LINES = {
    idle: [
      'Io il 31 agosto dormo sereno.',
      'Prenditi un caffè, c’è tempo.',
      'Guarda come sgomitano lì dentro.',
      'Posto fisso vista mare.'
    ],
    aim: [
      'Mira bene… tanto decide l’Algoritmo.',
      'Poverino, ci spera davvero.',
      'Quello ha pure speso 800 € di corso.'
    ],
    grab: [
      'Preso! Vediamo se regge la pinza…',
      'Occhio che sale verso la 18 ore!',
      'Tieni il fiato…'
    ],
    siren: [
      'Ops! Troppa fortuna rilevata!',
      'L’Algoritmo ha fatto due conti…',
      'Eh no, la pinza è tarata da fiera!'
    ],
    fakeoutWin: [
      'Ma dai?! Davvero sotto casa?!',
      'Aspetta… com’è possibile?!'
    ],
    rettifica: [
      'ECCOLA LA RETTIFICA! Ahahaha!',
      'Come non detto. Buona trasferta!',
      'Il Ministero dà, il Ministero toglie.'
    ],
    afterDrop: [
      'Ottima scelta, Algoritmo. Altro caffè!',
      'Un altro giro, offro io.',
      'E io intanto timbro alle 8 sotto casa.',
      'Mandiamogli subito il decreto su WhatsApp!'
    ]
  };

  const CHUTES = [
    { id: 0, code: '18H SOTTO CASA', short: '18h SOTTO CASA', sub: 'Sabato libero', color: '#e6c36a', dark: '#4d3912', text: '#fff0bd' },
    { id: 1, code: 'SPEZZONE 4+6+8h', short: 'SPEZZONE', sub: '4+6+8h · 3 comuni', color: '#f0ad5e', dark: '#54310f', text: '#ffe3bf' },
    { id: 2, code: '115 KM DI CURVE', short: '115 KM CURVE', sub: 'Catene a bordo', color: '#ef7b8d', dark: '#541825', text: '#ffd7de' },
    { id: 3, code: 'SUPPLENZA 2 GG', short: 'SUPPLENZA 2 GG', sub: 'Con Consiglio', color: '#74c5ee', dark: '#153a4f', text: '#d8f3ff' },
    { id: 4, code: 'SALTA IL TURNO', short: 'SALTA TURNO', sub: 'Bug algoritmo', color: '#b49ce8', dark: '#30224c', text: '#eadfff' }
  ];

  const OUTCOMES = [
    {
      id: 'spezzone_triplo',
      chute: 1,
      rarity: 'COMUNE',
      title: 'Spezzone 4+6+8h su 3 comuni di montagna',
      shortLine: '3 comuni in 5 giorni con buco di 3 ore tra un plesso e l’altro.',
      decreeText: 'Si assegna la prestigiosa cattedra oraria esterna 4h + 6h + 8h distribuita su tre comuni non collegati da mezzi pubblici, con finestra panoramica di 3 ore in auto alla 3ª ora.'
    },
    {
      id: 'spezzone_buco',
      chute: 1,
      rarity: 'COMUNE',
      title: 'Spezzone 6 ore con 4 ore di buco al giorno',
      shortLine: 'Entri alle 8, esci alle 14, ma lavori solo due ore.',
      decreeText: 'Assegnazione di spezzone da 6 ore settimanali strategicamente piazzate alla 1ª ora e alla 6ª ora di lunedì, mercoledì e sabato. Parcheggio non incluso.'
    },
    {
      id: 'spezzone_lunedi_sabato',
      chute: 1,
      rarity: 'RARA',
      title: 'Lunedì 1ª ora + Sabato 6ª ora in sede disagiata',
      shortLine: 'L’orario perfetto per rovinarti sia l’inizio che la fine della settimana.',
      decreeText: 'Cattedra spezzata ad altissima efficienza logistica: prima ora del lunedì al Plesso Nord e ultima ora del sabato al Plesso Sud. Buon fine settimana!'
    },
    {
      id: 'curve_etna',
      chute: 2,
      rarity: 'COMUNE',
      title: '115 km di tornanti · Catene a bordo obbligatorie',
      shortLine: 'Sede vista cratere, partenza alle 05:50 con la Panda a metano.',
      decreeText: 'Nomina annuale fino al 30 giugno presso istituto montano a 115 km dall’abitazione. Richiesti pneumatici termici da settembre a maggio e thermos da un litro.'
    },
    {
      id: 'curve_cantiere',
      chute: 2,
      rarity: 'COMUNE',
      title: '94 km su statale con semaforo di cantiere perenne',
      shortLine: '18 minuti di rosso alternato alle 7 del mattino garantiti.',
      decreeText: 'Trasferta quotidiana lungo la statale con tre cantieri ANAS permanenti e galleria a senso unico alternato. Rimborso chilometrico: una pacca sulla spalla.'
    },
    {
      id: 'curve_isola',
      chute: 2,
      rarity: 'EPICA',
      title: 'Plesso con aliscafo delle 06:15 (salvo mare mosso)',
      shortLine: 'Se tira scirocco resti a dormire in sala professori.',
      decreeText: 'Assegnazione d’ufficio con traversata mattutina obbligata. In caso di mare forza 5 è prevista l’ospitalità gratuita sullo sgabuzzino delle risme A4.'
    },
    {
      id: 'supplenza_cdc',
      chute: 3,
      rarity: 'COMUNE',
      title: 'Supplenza di 2 giorni con 4 Consigli di Classe',
      shortLine: 'Prendi servizio giovedì, fai 6 ore di riunioni venerdì, saluti sabato.',
      decreeText: 'Supplenza breve di 48 ore comprensiva di 4 Consigli di Classe pomeridiani, verbalizzazione straordinaria e recupero chiavi della LIM guasta.'
    },
    {
      id: 'supplenza_lampo',
      chute: 3,
      rarity: 'RARA',
      title: 'Chiamata alle 07:42 per coprire la 1ª ora alle 08:00',
      shortLine: 'Devi teletrasportarti in classe prima ancora di firmare il contratto.',
      decreeText: 'Convocazione lampo ricevuta via telefono mentre dormivi. Presa di servizio immediata in segreteria a 40 km entro 18 minuti netti. Corri, Prof!'
    },
    {
      id: 'supplenza_maternita',
      chute: 3,
      rarity: 'RARA',
      title: 'Supplenza “fino al rientro del titolare” (rientra lunedì)',
      shortLine: 'Il tempo di imparare i nomi della 2ªB ed è già finita.',
      decreeText: 'Incarico fino ad avente diritto con rientro improvviso del titolare previsto fra esattamente tre giorni lavorativi, giusto dopo che hai comprato i libri.'
    },
    {
      id: 'salta_quadratino',
      chute: 4,
      rarity: 'COMUNE',
      title: 'Considerato rinunciatario per un quadratino B non spuntato',
      shortLine: 'L’Algoritmo ti ha saltato a piè pari e ha dato la cattedra a chi aveva 12 punti meno.',
      decreeText: 'L’Algoritmo MIM v0.9b dichiara la S.V. rinunciataria automatica per mancata spunta del flag n. 47/ter. Ricorso al TAR consigliato entro il 2029.'
    },
    {
      id: 'salta_pec',
      chute: 4,
      rarity: 'EPICA',
      title: 'Algoritmo impallato · Convocazione finita nello spam',
      shortLine: 'La PEC è arrivata alle 23:54 con scadenza accettazione alle 23:59.',
      decreeText: 'Nomina generata in fascia notturna con validità cinque minuti e mezzo. L’Algoritmo ringrazia per la comprensione e rimanda al prossimo turno.'
    },
    {
      id: 'ruolo_subito',
      chute: 0,
      rarity: 'LEGGENDARIA 0,0%',
      title: '18h Sotto Casa · Ruolo al primo colpo',
      shortLine: 'Mai sbloccata nella storia della Repubblica.',
      decreeText: 'Errore critico di sistema: nessuno ha mai ottenuto questa cattedra senza prima patire anni di statale e spezzoni.',
      lockedForever: true
    }
  ];

  // Persistent stats
  let stats = { infrante: 0, unlocked: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') {
      if (Number.isInteger(saved.infrante) && saved.infrante >= 0) stats.infrante = saved.infrante;
      if (saved.unlocked && typeof saved.unlocked === 'object') stats.unlocked = saved.unlocked;
    }
  } catch (_) {}

  function saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (_) {}
  }

  const canvas = $('claw-world');
  let ctx = canvas.getContext('2d');
  const toastEl = $('toast');
  const statusEl = $('machine-status');
  const modeLineEl = document.querySelector('.mode-line');
  const statComodeEl = $('stat-comode');
  const statInfranteEl = $('stat-infrante');
  const btnLeft = $('btn-left');
  const btnRight = $('btn-right');
  const btnDrop = $('btn-drop');
  const btnRefill = $('refill');
  const nominaForm = $('nomina-form');
  const colleagueInput = $('colleague-name');
  const btnClearNomina = $('btn-clear-nomina');

  const backdrop = new Image();
  backdrop.onload = () => {
    if (COVER_MODE) draw();
  };
  backdrop.src = 'scenario.webp';

  let W = 1000;
  let H = 620;
  let isMobile = false;
  let time = 0;
  let lastFrame = 0;
  let personSerial = 1;
  let customColleague = '';
  let targetedId = null;
  let selectedPerson = null;
  let lastDecree = null;
  let dropsCount = 0;
  let seenFakeout = false;
  let sirenTimer = 0;
  let coffeeSteamPhase = 0;
  let profBubble = { text: PROF_LINES.idle[0], timer: 4.5 };
  let profMood = 'relaxed'; // relaxed | amused | shocked | evilLaugh
  let profMoodTimer = 0;
  let tankWhisper = { personId: null, text: '', timer: 1.8 };
  let confetti = [];
  let sparks = [];
  let gags = [];
  let binProps = [];
  let chuteBounce = [0, 0, 0, 0, 0];
  let flashComoda = 0;

  const input = { left: false, right: false };
  let dragActive = false;
  let dragStartX = 0;
  let dragMoved = false;

  const state = {
    phase: 'aim', // aim | descend | grab | ascend | carry | sirenFreeze | pauseSiren | slip | fakeoutPause | fakeoutEject | settle
    timer: 0,
    clawX: 500,
    clawY: 100,
    clawAngle: 0,
    clawOpen: 0.78,
    autoAimX: null,
    grabbed: null,
    targetChute: 1,
    plannedOutcome: null,
    isFakeout: false,
    carriedToGoal: false,
    slipStartX: 0,
    slipStartY: 0,
    slipRot: 0,
    slipBounced: false,
    clackPlayed: false,
    ejectBootProgress: 0,
    dropStartX: 0,
    dropStartY: 0,
    dropTargetX: 0,
    dropTargetY: 0
  };

  let tankPeople = [];

  function haptic(pattern) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(pattern); } catch (_) {}
    }
  }

  function toast(msg) {
    if (toastEl) toastEl.textContent = msg;
  }

  function setStatus(text, isAlert = false) {
    if (statusEl) statusEl.textContent = text;
    if (modeLineEl) modeLineEl.classList.toggle('alert', isAlert);
  }

  function setProfBubble(category) {
    const list = PROF_LINES[category] || PROF_LINES.idle;
    profBubble.text = list[Math.floor(Math.random() * list.length)];
    profBubble.timer = 4.6;
  }

  function setProfMood(mood, duration = 2.4) {
    profMood = mood;
    profMoodTimer = duration;
  }

  function addGag(text, x, y, color = '#d9f482', duration = 0.85) {
    gags.push({ text, x, y, color, life: duration, maxLife: duration });
  }

  function emitSparks(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 70 + Math.random() * 140;
      sparks.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 40,
        life: 0.35 + Math.random() * 0.3,
        color: i % 2 ? '#fef08a' : '#ff7b82'
      });
    }
  }

  function layout() {
    if (COVER_MODE) {
      W = 1200;
      H = 800;
      isMobile = false;
      const vip = { x: 24, y: 122, w: 268, h: 646 };
      const cab = { x: 312, y: 36, w: 866, h: 740 };
      const marquee = { x: cab.x + 16, y: cab.y + 14, w: cab.w - 32, h: 64 };
      const glass = { x: cab.x + 22, y: marquee.y + marquee.h + 12, w: cab.w - 44, h: cab.h - 208 };
      const railY = glass.y + 24;
      const chuteY = glass.y + glass.h - 92;
      const chuteW = (glass.w - 32) / 5;
      return {
        vip, cab, marquee, glass, railY, chuteY, chuteW,
        minX: glass.x + 48,
        maxX: glass.x + glass.w - 48,
        pileFloorY: chuteY - 12,
        chuteXs: Array.from({ length: 5 }, (_, i) => glass.x + 16 + chuteW * (i + 0.5))
      };
    }

    if (isMobile) {
      const vip = { x: 14, y: 12, w: W - 28, h: 124 };
      const cab = { x: 14, y: 158, w: W - 28, h: H - 172 };
      const marquee = { x: cab.x + 10, y: cab.y + 12, w: cab.w - 20, h: 52 };
      const glass = { x: cab.x + 14, y: marquee.y + marquee.h + 10, w: cab.w - 28, h: cab.h - 150 };
      const railY = glass.y + 22;
      const chuteY = glass.y + glass.h - 86;
      const chuteW = (glass.w - 20) / 5;
      return {
        vip, cab, marquee, glass, railY, chuteY, chuteW,
        minX: glass.x + 36,
        maxX: glass.x + glass.w - 36,
        pileFloorY: chuteY - 10,
        chuteXs: Array.from({ length: 5 }, (_, i) => glass.x + 10 + chuteW * (i + 0.5))
      };
    }

    const vip = { x: 18, y: 20, w: 224, h: H - 38 };
    const cab = { x: 256, y: 30, w: W - 274, h: H - 48 };
    const marquee = { x: cab.x + 14, y: cab.y + 14, w: cab.w - 28, h: 56 };
    const glass = { x: cab.x + 18, y: marquee.y + marquee.h + 10, w: cab.w - 36, h: cab.h - 162 };
    const railY = glass.y + 22;
    const chuteY = glass.y + glass.h - 84;
    const chuteW = (glass.w - 28) / 5;
    return {
      vip, cab, marquee, glass, railY, chuteY, chuteW,
      minX: glass.x + 42,
      maxX: glass.x + glass.w - 42,
      pileFloorY: chuteY - 10,
      chuteXs: Array.from({ length: 5 }, (_, i) => glass.x + 14 + chuteW * (i + 0.5))
    };
  }

  function makePerson(customName = '') {
    const id = personSerial++;
    const woman = id % 5 < 2;
    const cls = CLASSES[(id * 3) % CLASSES.length];
    const generatedName = (woman ? NAMES_F[id % NAMES_F.length] : NAMES_M[id % NAMES_M.length]) + ' ' + SURNAMES[(id * 5) % SURNAMES.length];
    return {
      id,
      name: customName || generatedName,
      generatedName,
      customName: customName || '',
      woman,
      cls: `${cls.code} · ${cls.name}`,
      score: (24.0 + ((id * 7) % 58) * 0.5).toFixed(1) + ' pt',
      pos: '#' + (120 + ((id * 41) % 980)),
      titleDesc: TITLES[id % TITLES.length],
      logistics: LOGISTICS[(id * 3) % LOGISTICS.length],
      hope: HOPES[(id * 7) % HOPES.length],
      color: SHIRT_COLORS[id % SHIRT_COLORS.length],
      hair: HAIR_COLORS[(id * 2) % HAIR_COLORS.length],
      skin: SKIN_COLORS[(id * 3) % SKIN_COLORS.length],
      variant: id % 3,
      dir: id % 2 === 0 ? 1 : -1,
      phase: Math.random() * 6.28,
      x: 500,
      y: 400,
      homeX: 500,
      homeY: 400,
      tilt: (Math.random() - 0.5) * 0.16,
      bobOffset: Math.random() * 6.28,
      dangling: false,
      startled: false,
      droppingIn: false,
      vy: 0
    };
  }

  function buildBinProps(g) {
    const types = ['briefcase', 'diploma', 'phone', 'folder', 'books', 'briefcase'];
    const left = g.glass.x + 44;
    const usable = g.glass.w - 88;
    binProps = types.map((kind, i) => ({
      kind,
      x: left + (usable * (i + 0.35)) / types.length + Math.sin(i * 4.2) * 14,
      y: g.pileFloorY - (i % 2 === 0 ? 8 : 22),
      rot: Math.sin(i * 2.3) * 0.22
    }));
  }

  function populateTank(preserveTarget = false) {
    const g = layout();
    const rows = isMobile ? [8, 7, 6] : [9, 8, 7];
    const leftPad = g.glass.x + 48;
    const usableW = g.glass.w - 96;
    const list = [];
    let idx = 0;
    for (let r = 0; r < rows.length; r++) {
      const cols = rows[r];
      const rowY = g.pileFloorY - 12 - r * (isMobile ? 28 : 26);
      for (let c = 0; c < cols; c++) {
        const p = makePerson();
        const frac = cols === 1 ? 0.5 : c / (cols - 1);
        const jitter = Math.sin((idx + 1) * 3.1) * 11;
        const hx = Math.max(g.minX, Math.min(g.maxX, leftPad + frac * usableW + (r % 2 ? 10 : -8) + jitter));
        const hy = rowY + Math.cos((idx + 2) * 2.7) * 4;
        p.homeX = hx;
        p.homeY = hy;
        p.x = hx;
        p.y = hy;
        p.layer = r;
        list.push(p);
        idx++;
      }
    }
    tankPeople = list;
    buildBinProps(g);
    if (!preserveTarget) {
      targetedId = null;
      if (customColleague) {
        tagCustomColleague(customColleague, false);
      }
    }
  }

  function replaceSlotWithNewPrecario(slotTemplate) {
    const g = layout();
    const p = makePerson();
    p.homeX = slotTemplate.homeX;
    p.homeY = slotTemplate.homeY;
    p.layer = slotTemplate.layer ?? 2;
    p.x = slotTemplate.homeX;
    p.y = g.glass.y + 30;
    p.droppingIn = true;
    p.vy = 0;
    tankPeople.push(p);
  }

  function tagCustomColleague(name, slideClaw = true) {
    const clean = name.trim().slice(0, 34);
    customColleague = clean;
    if (btnClearNomina) btnClearNomina.hidden = !clean;
    if (!clean) {
      tankPeople.forEach(p => {
        if (p.customName) {
          p.customName = '';
          p.name = p.generatedName || p.name;
        }
      });
      targetedId = null;
      return;
    }

    tankPeople.forEach(p => {
      if (p.customName) {
        p.customName = '';
        p.name = p.generatedName || p.name;
      }
    });

    const sorted = [...tankPeople].sort((a, b) => {
      const aScore = (a.layer || 0) * 100 - Math.abs(a.homeX - (layout().minX + layout().maxX) * 0.5) * 0.25;
      const bScore = (b.layer || 0) * 100 - Math.abs(b.homeX - (layout().minX + layout().maxX) * 0.5) * 0.25;
      return bScore - aScore;
    });
    const chosen = sorted[0];
    if (chosen) {
      chosen.customName = clean;
      chosen.name = clean;
      targetedId = chosen.id;
      if (slideClaw && state.phase === 'aim') {
        state.autoAimX = chosen.x;
      }
      window.ClawAudio?.play('target');
      toast(`Nel mirino: ${clean}! Premi PESCA per il decreto.`);
    }
  }

  function resize() {
    if (COVER_MODE) {
      W = 1200;
      H = 800;
      isMobile = false;
      canvas.width = W;
      canvas.height = H;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      populateTank(false);
      setupCoverShowcase();
      return;
    }

    const prevMobile = isMobile;
    isMobile = window.innerWidth <= 640;
    W = isMobile ? 640 : 1000;
    H = isMobile ? 760 : 620;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const g = layout();
    if (!tankPeople.length || prevMobile !== isMobile) {
      const savedCustom = customColleague;
      populateTank(false);
      if (savedCustom) tagCustomColleague(savedCustom, false);
      state.clawX = (g.minX + g.maxX) * 0.56;
      state.clawY = g.railY + 46;
    } else {
      state.clawX = Math.max(g.minX, Math.min(g.maxX, state.clawX));
    }
  }

  function setupCoverShowcase() {
    const g = layout();
    sirenTimer = 999;
    profBubble = { text: 'Io il 31 agosto dormo sereno.', timer: 999 };
    profMood = 'relaxed';
    tankWhisper = { personId: tankPeople[4]?.id, text: 'Ho fatto pure il CLIL!', timer: 999 };
    const dangling = makePerson('Concetta Russo');
    dangling.woman = true;
    dangling.color = '#ef9aad';
    dangling.dangling = true;
    dangling.startled = true;
    dangling.x = g.chuteXs[2] + 35;
    dangling.y = g.glass.y + 235;
    state.clawX = dangling.x;
    state.clawY = dangling.y - 54;
    state.clawOpen = 0.24;
    state.clawAngle = 0.08;
    state.grabbed = dangling;
    state.phase = 'carry';
  }

  function round(c, x, y, w, h, r, fill, stroke, lw = 1.5) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = lw;
      c.stroke();
    }
  }

  function txt(c, s, x, y, size = 12, color = '#edf4f1', align = 'left', font = 'ui-monospace, monospace', weight = 700) {
    c.fillStyle = color;
    c.font = `${weight} ${size}px ${font}`;
    c.textAlign = align;
    c.fillText(s, x, y);
    c.textAlign = 'left';
  }

  function drawWrappedText(c, text, x, y, maxWidth, lineHeight, fontSize, color, font, weight = 600) {
    c.fillStyle = color;
    c.font = `${weight} ${fontSize}px ${font}`;
    const words = String(text).split(/\s+/);
    let line = '';
    let curY = y;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (c.measureText(test).width > maxWidth && line) {
        c.fillText(line, x, curY);
        line = words[i];
        curY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) c.fillText(line, x, curY);
    return curY;
  }

  function drawProp(c, prop) {
    c.save();
    c.translate(prop.x, prop.y);
    c.rotate(prop.rot);
    if (prop.kind === 'briefcase') {
      round(c, -11, -7, 22, 13, 2.5, '#6a442a', '#2e1a0d', 1.2);
      round(c, -4, -10, 8, 4, 1.5, null, '#472a16', 1.6);
      c.fillStyle = '#e6c36a';
      c.fillRect(-3, -2, 6, 3);
    } else if (prop.kind === 'diploma') {
      round(c, -12, -3, 24, 6, 3, '#f3ebd3', '#8c7d5b', 1);
      c.fillStyle = '#c83b4a';
      c.fillRect(-2, -3.5, 4, 7);
    } else if (prop.kind === 'phone') {
      round(c, -5, -8, 10, 15, 2, '#1d2734', '#70849c', 1);
      round(c, -3.5, -6, 7, 10, 1, '#9be5ff');
    } else if (prop.kind === 'folder') {
      round(c, -10, -6, 20, 12, 2, '#b93f4b', '#5d1820', 1.2);
      c.fillStyle = '#f4efe2';
      c.fillRect(-7, -4, 14, 2.5);
    } else {
      round(c, -10, -4, 20, 5, 1.5, '#3b6a82', '#172e3a', 1);
      round(c, -9, -9, 18, 5, 1.5, '#c6933d', '#5c4114', 1);
    }
    c.restore();
  }

  function drawPrecario(c, p, scale = 1, rotation = 0, showShadow = false, hovered = false) {
    const startled = Boolean(p.startled || p.dangling || hovered);
    const tremble = hovered ? Math.sin(time * 38) * 1.2 : 0;
    const px = p.x + tremble;
    const py = p.y;

    if (showShadow) {
      c.save();
      c.fillStyle = '#0903087a';
      c.beginPath();
      c.ellipse(px, py + 2, 13 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    c.save();
    c.translate(px, py);
    c.rotate(rotation);
    c.scale(scale * (p.dir || 1), scale);
    const kick = p.dangling ? Math.sin(time * 22) * 5.5 : 0;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    // Legs & shoes
    c.strokeStyle = '#142e36';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(-4, -10);
    c.lineTo(-4 - kick, -2);
    c.moveTo(3, -10);
    c.lineTo(3 + kick, -2);
    c.stroke();
    round(c, -10 - kick, -4, 10, 5, 2, '#18323a', '#09232c', 1.2);
    round(c, kick, -4, 11, 5, 2, '#18323a', '#09232c', 1.2);

    // Torso & shirt/tie
    round(c, -8, -24, 16, 15, 5, !p.woman && p.variant === 1 ? '#f4f0dd' : p.color, '#14303c', 1.4);
    if (p.woman) {
      if (p.variant === 1) {
        c.fillStyle = p.color;
        c.strokeStyle = '#14303c';
        c.beginPath();
        c.moveTo(-6, -14);
        c.lineTo(-10, -7);
        c.quadraticCurveTo(0, -4, 10, -7);
        c.lineTo(6, -14);
        c.closePath();
        c.fill();
        c.stroke();
      }
      round(c, -3, -23, 5, 9, 2, '#f2eed7');
    } else {
      round(c, -3, -24, 5, 12, 2, '#f2eed7');
      c.fillStyle = '#df6b58';
      c.beginPath();
      c.moveTo(0, -21);
      c.lineTo(-2, -13);
      c.lineTo(2, -14);
      c.fill();
    }

    // Arms
    c.strokeStyle = p.skin || '#f4c99a';
    c.lineWidth = 4;
    c.beginPath();
    if (startled) {
      c.moveTo(-7, -20);
      c.lineTo(-12, -28 + kick * 0.4);
      c.lineTo(-14, -35 + kick * 0.5);
      c.moveTo(7, -20);
      c.lineTo(12, -27 - kick * 0.4);
      c.lineTo(14, -34 - kick * 0.5);
    } else {
      c.moveTo(-7, -20);
      c.lineTo(-10, -12);
      c.moveTo(7, -20);
      c.lineTo(10, -12);
    }
    c.stroke();

    // Back hair
    if (p.woman || p.variant === 2) {
      c.fillStyle = p.hair || '#543e31';
      c.beginPath();
      c.ellipse(-2, -33, 11, p.woman && p.variant === 0 ? 14 : 12, 0, 0, Math.PI * 2);
      c.fill();
    }
    if (p.woman && p.variant === 1) {
      c.fillStyle = p.hair;
      c.beginPath();
      c.ellipse(-10, -32, 4, 9, -0.2, 0, Math.PI * 2);
      c.fill();
      round(c, -12, -37, 4, 3, 1, p.color);
    }
    if (p.woman && p.variant === 2) {
      c.fillStyle = p.hair;
      c.beginPath();
      c.ellipse(-7, -43, 5, 5, 0, 0, Math.PI * 2);
      c.fill();
    }

    // Head
    c.fillStyle = p.skin || '#f4c99a';
    c.strokeStyle = '#754d37';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(0, -33, 9, 10, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.ellipse(8, -31, 4, 3, 0, 0, Math.PI * 2);
    c.fill();

    // Front hair
    c.fillStyle = p.hair || '#543e31';
    c.beginPath();
    if (!p.woman && p.variant === 1) {
      c.ellipse(-6, -35, 4, 8, 0.2, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(-1, -42, 8, 3, -0.1, 0, Math.PI * 2);
      c.fill();
    } else {
      c.moveTo(-9, -31);
      c.bezierCurveTo(-15, -48, 8, -51, 10, -37);
      c.bezierCurveTo(5, -40, 1, -36, -5, -37);
      c.lineTo(-7, -31);
      c.closePath();
      c.fill();
    }

    // Eyes & glasses
    const blinking = !startled && Math.sin(time * 1.4 + (p.id || 0) * 2.1) > 0.985;
    if (startled) {
      c.fillStyle = '#fff9e7';
      c.beginPath();
      c.ellipse(4, -34, 3.2, 3.7, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#754d37';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(1, -40);
      c.lineTo(7, -41);
      c.stroke();
    }
    c.fillStyle = '#223747';
    c.beginPath();
    if (blinking) {
      c.strokeStyle = '#223747';
      c.lineWidth = 1.5;
      c.moveTo(2, -34);
      c.lineTo(6, -34);
      c.stroke();
    } else {
      c.arc(4, -34, 1.6, 0, Math.PI * 2);
      c.fill();
    }
    if (p.variant === 1) {
      c.strokeStyle = '#496376';
      c.lineWidth = 1.4;
      c.strokeRect(0, -37, 7, 5);
    }

    // Mouth
    c.strokeStyle = '#925a42';
    c.lineWidth = 1.2;
    c.beginPath();
    if (startled) {
      c.fillStyle = '#6e4339';
      c.ellipse(4, -27, 2.5, 3.1, 0, 0, Math.PI * 2);
      c.fill();
    } else {
      c.moveTo(2, -27);
      c.quadraticCurveTo(4, -25, 6, -27);
      c.stroke();
    }
    c.restore();

    // Fear '!' badge when hovered directly under crane
    if (hovered && !p.dangling) {
      round(c, px - 8, py - 66 * scale, 16, 18, 5, '#f6e8bc', '#bb8053', 1.4);
      txt(c, '!', px, py - 52.5 * scale, 13, '#9a3c2b', 'center', 'ui-monospace, monospace', 900);
    }

    // Target badge above colleague
    if (p.id === targetedId || p.customName) {
      const pulse = Math.sin(time * 6) * 2;
      const badgeLabel = p.customName ? p.customName.toUpperCase() : 'NEL MIRINO';
      c.save();
      c.font = '800 10px ui-monospace, monospace';
      const tw = Math.min(148, Math.max(66, c.measureText(badgeLabel).width + 16));
      const bx = p.dangling ? px + 34 : px - tw / 2;
      const by = p.dangling ? py - 34 : py - (hovered ? 86 : 68) * scale + pulse;
      round(c, bx, by, tw, 18, 5, '#d9f482', '#172318', 1.5);
      c.fillStyle = '#141d11';
      c.textAlign = 'center';
      let shown = badgeLabel;
      while (c.measureText(shown).width > tw - 10 && shown.length > 4) {
        shown = shown.slice(0, -2) + '…';
      }
      c.fillText(shown, bx + tw / 2, by + 13);
      c.restore();
    }
  }

  function drawVipLounge(g) {
    const v = g.vip;
    ctx.save();

    // Rich dark walnut wood-paneled lounge wall
    const bg = ctx.createLinearGradient(v.x, v.y, v.x, v.y + v.h);
    bg.addColorStop(0, '#231c1a');
    bg.addColorStop(0.6, '#1a1922');
    bg.addColorStop(1, '#12151f');
    round(ctx, v.x, v.y, v.w, v.h, 14, bg, '#e6c36a', 2.2);

    ctx.save();
    round(ctx, v.x, v.y, v.w, v.h, 14);
    ctx.clip();
    ctx.strokeStyle = '#33262066';
    ctx.lineWidth = 1.5;
    for (let pxLine = v.x + 18; pxLine < v.x + v.w; pxLine += 26) {
      ctx.beginPath();
      ctx.moveTo(pxLine, v.y);
      ctx.lineTo(pxLine, v.y + v.h);
      ctx.stroke();
    }

    // Framed wall diploma on desktop/cover
    if (!isMobile) {
      const dx = v.x + v.w * 0.5;
      const dy = v.y + 178;
      round(ctx, dx - 34, dy - 20, 68, 42, 4, '#f3ebd3', '#c89b44', 2.5);
      ctx.fillStyle = '#5c4b32';
      ctx.fillRect(dx - 24, dy - 10, 48, 3);
      ctx.fillRect(dx - 20, dy - 3, 40, 2);
      ctx.fillRect(dx - 16, dy + 3, 32, 2);
      ctx.fillStyle = '#c93a47';
      ctx.beginPath();
      ctx.arc(dx + 20, dy + 11, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Top golden badge
    const badgeW = isMobile ? 168 : v.w - 24;
    const badgeX = v.x + 12;
    const badgeY = v.y + 10;
    round(ctx, badgeX, badgeY, badgeW, 38, 8, '#3a2b14', '#e6c36a', 1.6);
    txt(ctx, '★ ZONA VIP', badgeX + badgeW / 2, badgeY + 15, 10, '#e6c36a', 'center', 'ui-monospace, monospace', 800);
    txt(ctx, 'DI RUOLO · FUORI CONCORSO', badgeX + badgeW / 2, badgeY + 30, 9.5, '#fff0bd', 'center', 'ui-monospace, monospace', 800);

    const px = isMobile ? v.x + 96 : v.x + v.w * 0.44;
    const py = isMobile ? v.y + 108 : v.y + v.h * 0.62;
    const scale = isMobile ? 1.12 : 1.56;

    // Warm overhead lamp spotlight in VIP lounge
    if (!isMobile) {
      const cone = ctx.createRadialGradient(px, py - 35, 12, px, py - 24, 130);
      cone.addColorStop(0, '#ffd88933');
      cone.addColorStop(1, '#ffd88900');
      ctx.fillStyle = cone;
      ctx.fillRect(v.x + 4, v.y + 52, v.w - 8, v.h - 150);

      // Side wooden coffee table + miniature silver Moka pot
      const tx = px + 62;
      const ty = py + 2;
      round(ctx, tx - 18, ty - 22, 36, 6, 2, '#6b4228', '#2c190d', 1.4);
      round(ctx, tx - 3, ty - 16, 6, 20, 2, '#51311c', '#2c190d', 1.2);
      round(ctx, tx - 12, ty + 2, 24, 4, 2, '#51311c');
      // Moka pot silhouette
      ctx.fillStyle = '#c9d5e2';
      ctx.strokeStyle = '#334457';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tx - 8, ty - 22);
      ctx.lineTo(tx - 6, ty - 33);
      ctx.lineTo(tx - 8, ty - 42);
      ctx.lineTo(tx + 8, ty - 42);
      ctx.lineTo(tx + 6, ty - 33);
      ctx.lineTo(tx + 8, ty - 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      round(ctx, tx - 9, ty - 45, 18, 4, 2, '#344150');
      round(ctx, tx - 2, ty - 49, 4, 4, 1.5, '#19222d');
      ctx.strokeStyle = '#1f2936';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(tx + 7, ty - 39);
      ctx.quadraticCurveTo(tx + 15, ty - 35, tx + 8, ty - 29);
      ctx.stroke();
    }

    // Tufted Chesterfield armchair + Prof
    const laughBounce = (profMood === 'amused' || profMood === 'evilLaugh') ? Math.abs(Math.sin(time * 14)) * 2.5 : 0;
    const shockJitter = profMood === 'shocked' ? Math.sin(time * 42) * 1.5 : 0;

    ctx.save();
    ctx.translate(px + shockJitter, py - laughBounce * 0.4);
    ctx.scale(scale, scale);

    // Armchair shadow
    ctx.fillStyle = '#0906097a';
    ctx.beginPath();
    ctx.ellipse(0, 8, 32, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    round(ctx, -28, -42, 56, 40, 10, '#6e2831', '#3b1116', 2);
    // Brass tuft buttons
    ctx.fillStyle = '#e6c36a';
    [[-14, -30], [0, -30], [14, -30], [-7, -21], [7, -21]].forEach(([bx, by]) => {
      ctx.beginPath();
      ctx.arc(bx, by, 1.3, 0, Math.PI * 2);
      ctx.fill();
    });
    round(ctx, -32, -22, 12, 24, 5, '#84343e', '#3b1116', 1.6);
    round(ctx, 20, -22, 12, 24, 5, '#84343e', '#3b1116', 1.6);
    round(ctx, -24, -12, 48, 16, 6, '#84343e', '#3b1116', 1.6);

    // Trousers & loafers
    round(ctx, -12, -6, 10, 12, 3, '#1d2d3a', '#0c151d', 1.2);
    round(ctx, 2, -6, 10, 12, 3, '#1d2d3a', '#0c151d', 1.2);

    // Jacket & tie
    round(ctx, -12, -30, 24, 24, 6, '#2f5e53', '#152c26', 1.6);
    round(ctx, -3, -29, 6, 15, 2, '#f5f0df');
    ctx.fillStyle = '#e6c36a';
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.lineTo(-2.5, -17);
    ctx.lineTo(2.5, -17);
    ctx.fill();

    // Head
    ctx.fillStyle = '#f2c394';
    ctx.strokeStyle = '#754d37';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, -41 - laughBounce * 0.4, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Neat hair with silver temples
    ctx.fillStyle = '#38362f';
    ctx.beginPath();
    ctx.ellipse(0, -49 - laughBounce * 0.4, 10, 5, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b4b8bf';
    ctx.fillRect(-10, -46 - laughBounce * 0.4, 3, 6);
    ctx.fillRect(7, -46 - laughBounce * 0.4, 3, 6);

    // Expressions by profMood
    const headOff = -laughBounce * 0.4;
    if (profMood === 'shocked') {
      ctx.fillStyle = '#fff9e7';
      ctx.strokeStyle = '#182430';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(-4, -42 + headOff, 3.6, 0, Math.PI * 2);
      ctx.arc(4, -42 + headOff, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#182430';
      ctx.beginPath();
      ctx.arc(-4, -42 + headOff, 1.3, 0, Math.PI * 2);
      ctx.arc(4, -42 + headOff, 1.3, 0, Math.PI * 2);
      ctx.fill();
      // Open O mouth
      ctx.fillStyle = '#6e2d2d';
      ctx.beginPath();
      ctx.ellipse(0, -35 + headOff, 2.8, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Gold-rimmed glasses
      round(ctx, -7, -44 + headOff, 6, 4.5, 1.2, '#1e2c3a', '#e6c36a', 1);
      round(ctx, 1, -44 + headOff, 6, 4.5, 1.2, '#1e2c3a', '#e6c36a', 1);
      if (profMood === 'amused' || profMood === 'evilLaugh') {
        ctx.fillStyle = '#6e2d2d';
        ctx.beginPath();
        ctx.arc(0, -37 + headOff, 4.4, 0, Math.PI);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#6c3e2b';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, -37 + headOff, 4, 0.15, Math.PI - 0.15);
        ctx.stroke();
      }
    }

    // Raised right arm holding steaming espresso cup
    const sip = profMood === 'shocked' ? Math.sin(time * 40) * 2.2 : Math.sin(coffeeSteamPhase * 1.4) * 1.6;
    ctx.strokeStyle = '#2f5e53';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, -24);
    ctx.lineTo(20, -18);
    ctx.lineTo(24, -27 + sip);
    ctx.stroke();
    round(ctx, 18, -28 + sip, 12, 3, 1.5, '#e5dfd0', '#8f8470', 1);
    round(ctx, 20, -36 + sip, 8, 8, 2, '#fff9ee', '#8f8470', 1);
    ctx.strokeStyle = '#ffffff78';
    ctx.lineWidth = 1.4;
    for (let s = 0; s < 2; s++) {
      const sx = 22 + s * 4;
      const sy = -38 + sip;
      const wave = Math.sin(time * 4 + s * 2) * 2.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + wave, sy - 6, sx - wave * 0.6, sy - 12);
      ctx.stroke();
    }
    ctx.restore();

    // Prof Speech Bubble
    if (profBubble.text && profBubble.timer > 0) {
      if (isMobile) {
        const bx = v.x + 188;
        const by = v.y + 12;
        const bw = v.w - 200;
        const bh = v.h - 24;
        round(ctx, bx, by, bw, bh, 10, '#f4efe2', '#e6c36a', 1.8);
        txt(ctx, 'PROF. DI RUOLO:', bx + 12, by + 20, 9.5, '#7a591e', 'left', 'ui-monospace, monospace', 800);
        drawWrappedText(ctx, `“${profBubble.text}”`, bx + 12, by + 40, bw - 22, 17, 13, '#18222e', 'system-ui, sans-serif', 700);
      } else {
        const bx = v.x + 14;
        const by = v.y + 58;
        const bw = v.w - 28;
        const bh = 62;
        round(ctx, bx, by, bw, bh, 10, '#f4efe2', '#e6c36a', 1.8);
        ctx.fillStyle = '#f4efe2';
        ctx.beginPath();
        ctx.moveTo(px - 8, by + bh - 1);
        ctx.lineTo(px, by + bh + 10);
        ctx.lineTo(px + 8, by + bh - 1);
        ctx.fill();
        drawWrappedText(ctx, `“${profBubble.text}”`, bx + 12, by + 24, bw - 24, 18, 13.5, '#18222e', 'system-ui, sans-serif', 700);

        const plaqueY = v.y + v.h - 98;
        const brass = ctx.createLinearGradient(v.x + 18, plaqueY, v.x + v.w - 18, plaqueY + 82);
        brass.addColorStop(0, '#f0d48a');
        brass.addColorStop(0.5, '#c4963e');
        brass.addColorStop(1, '#8d6424');
        round(ctx, v.x + 16, plaqueY, v.w - 32, 82, 9, brass, '#5c4216', 2);
        txt(ctx, 'POSTO FISSO', v.x + v.w / 2, plaqueY + 23, 10, '#2a1c08', 'center', 'ui-monospace, monospace', 800);
        txt(ctx, 'AL SICURO', v.x + v.w / 2, plaqueY + 46, 19, '#1c1204', 'center', 'system-ui, sans-serif', 900);
        txt(ctx, 'Tu guardi. Loro sgomitano.', v.x + v.w / 2, plaqueY + 67, 10.5, '#3b280b', 'center', 'system-ui, sans-serif', 700);
      }
    }

    ctx.restore();
  }

  function drawChuteIcon(c, index, x, y, color) {
    c.save();
    c.translate(x, y);
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    if (index === 0) {
      // Gold star
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 6 : 2.6;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      c.fill();
    } else if (index === 1) {
      // 3 little school roofs
      [-7, 0, 7].forEach(ox => {
        c.beginPath();
        c.moveTo(ox - 3.5, 2);
        c.lineTo(ox, -3);
        c.lineTo(ox + 3.5, 2);
        c.stroke();
      });
    } else if (index === 2) {
      // Winding mountain road
      c.beginPath();
      c.moveTo(-7, 4);
      c.lineTo(-2, -4);
      c.lineTo(2, 1);
      c.lineTo(7, -5);
      c.stroke();
    } else if (index === 3) {
      // Calendar 2G badge
      round(c, -6, -5, 12, 10, 2, null, color, 1.3);
      txt(c, '2G', 0, 3, 7, color, 'center', 'ui-monospace, monospace', 900);
    } else {
      // Glitch X
      c.beginPath();
      c.moveTo(-4, -4);
      c.lineTo(4, 4);
      c.moveTo(4, -4);
      c.lineTo(-4, 4);
      c.stroke();
    }
    c.restore();
  }

  function drawCabinet(g) {
    const cab = g.cab;
    const mq = g.marquee;
    const gl = g.glass;
    const sirenActive = sirenTimer > 0;

    // Outer beveled arcade cabinet frame + rivets
    const frameGrad = ctx.createLinearGradient(cab.x, cab.y, cab.x, cab.y + cab.h);
    frameGrad.addColorStop(0, '#314059');
    frameGrad.addColorStop(0.5, '#1e293c');
    frameGrad.addColorStop(1, '#121927');
    round(ctx, cab.x, cab.y, cab.w, cab.h, 16, frameGrad, '#786e58', 2.6);

    // Corner brass bolts
    [[cab.x + 9, cab.y + 9], [cab.x + cab.w - 9, cab.y + 9], [cab.x + 9, cab.y + cab.h - 9], [cab.x + cab.w - 9, cab.y + cab.h - 9]].forEach(([rx, ry]) => {
      ctx.fillStyle = '#c8a65a';
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Physical Rotating Alarm Beacon Dome on top edge of cabinet
    const beaconX = cab.x + cab.w / 2;
    const beaconY = cab.y + 2;
    round(ctx, beaconX - 18, beaconY - 12, 36, 14, 5, '#3b485c', '#889bb5', 1.4);
    const domeGrad = ctx.createRadialGradient(beaconX - 3, beaconY - 16, 2, beaconX, beaconY - 14, 14);
    domeGrad.addColorStop(0, sirenActive ? '#fff2f2' : '#ff949b');
    domeGrad.addColorStop(0.5, sirenActive ? '#ff3144' : '#9c2d38');
    domeGrad.addColorStop(1, '#581219');
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(beaconX, beaconY - 11, 11, Math.PI, 0);
    ctx.fill();
    if (sirenActive) {
      ctx.save();
      const pulse = 0.55 + Math.sin(time * 24) * 0.35;
      ctx.fillStyle = `rgba(255, 64, 80, ${pulse})`;
      ctx.beginPath();
      ctx.arc(beaconX, beaconY - 14, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Marquee header
    const mqGrad = ctx.createLinearGradient(mq.x, mq.y, mq.x, mq.y + mq.h);
    mqGrad.addColorStop(0, '#3a2344');
    mqGrad.addColorStop(1, '#1a152a');
    round(ctx, mq.x, mq.y, mq.w, mq.h, 10, mqGrad, '#d9f482', 2);

    // Warm chase bulbs
    const bulbCount = Math.floor(mq.w / 28);
    for (let i = 0; i < bulbCount; i++) {
      const bx = mq.x + 14 + i * ((mq.w - 28) / Math.max(1, bulbCount - 1));
      const lit = (Math.floor(time * 5) + i) % 3 === 0;
      if (lit) {
        ctx.fillStyle = '#fef08a38';
        ctx.beginPath();
        ctx.arc(bx, mq.y + 8, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = lit ? '#fef08a' : '#574e38';
      ctx.beginPath();
      ctx.arc(bx, mq.y + 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (sirenActive) {
      const blink = Math.sin(time * 22) > 0;
      round(ctx, mq.x + 10, mq.y + 14, mq.w - 20, mq.h - 20, 7, blink ? '#8f1d2c' : '#4f141e', '#ff9b9b', 2);
      txt(
        ctx,
        state.phase === 'fakeoutEject' || state.phase === 'fakeoutPause'
          ? '⚠ RETTIFICA D’UFFICIO MIM!'
          : '⚠ ANOMALIA: TROPPA FORTUNA!',
        mq.x + mq.w / 2,
        mq.y + mq.h * 0.68,
        isMobile ? 14 : 18,
        '#fff5db',
        'center',
        'ui-monospace, monospace',
        900
      );
    } else {
      txt(
        ctx,
        'ALGORITMO MIM v0.9b · SEZIONE NOMINE',
        mq.x + mq.w / 2,
        mq.y + mq.h * 0.67,
        isMobile ? 13 : 17,
        '#d9f482',
        'center',
        'ui-monospace, monospace',
        900
      );
    }

    // Glass tank with illustrated Sala Professori twilight backdrop
    ctx.save();
    round(ctx, gl.x, gl.y, gl.w, gl.h, 10, '#0d192b', '#4d6580', 2);
    ctx.clip();

    if (backdrop.complete && backdrop.naturalWidth) {
      const s = Math.max(gl.w / backdrop.width, gl.h / backdrop.height);
      const dw = backdrop.width * s;
      const dh = backdrop.height * s;
      ctx.drawImage(backdrop, gl.x + (gl.w - dw) / 2, gl.y + (gl.h - dh) * 0.42, dw, dh);
    }

    // Dark-blue atmospheric overlay so crane & plushies pop
    const shade = ctx.createLinearGradient(0, gl.y, 0, gl.y + gl.h);
    shade.addColorStop(0, '#0c182c92');
    shade.addColorStop(0.55, '#0e1d32a8');
    shade.addColorStop(1, '#08101ee6');
    ctx.fillStyle = shade;
    ctx.fillRect(gl.x, gl.y, gl.w, gl.h);

    // Sweeping crimson alarm beam inside tank during siren
    if (sirenActive) {
      const sweepX = gl.x + gl.w * 0.5 + Math.sin(time * 9) * gl.w * 0.45;
      const beam = ctx.createLinearGradient(beaconX, gl.y, sweepX, gl.y + gl.h);
      beam.addColorStop(0, 'rgba(255, 65, 82, 0.34)');
      beam.addColorStop(1, 'rgba(255, 65, 82, 0.03)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(beaconX - 24, gl.y);
      ctx.lineTo(beaconX + 24, gl.y);
      ctx.lineTo(sweepX + 120, gl.y + gl.h);
      ctx.lineTo(sweepX - 120, gl.y + gl.h);
      ctx.closePath();
      ctx.fill();
    }

    // Volumetric spotlight cone from crane during aim & descend
    if (state.phase === 'aim' || state.phase === 'descend' || state.phase === 'grab') {
      const spot = ctx.createLinearGradient(state.clawX, g.railY, state.clawX, g.pileFloorY);
      spot.addColorStop(0, 'rgba(217, 244, 130, 0.22)');
      spot.addColorStop(0.75, 'rgba(217, 244, 130, 0.08)');
      spot.addColorStop(1, 'rgba(217, 244, 130, 0.02)');
      ctx.fillStyle = spot;
      ctx.beginPath();
      ctx.moveTo(state.clawX - 16, g.railY + 8);
      ctx.lineTo(state.clawX + 16, g.railY + 8);
      ctx.lineTo(state.clawX + 95, g.pileFloorY + 6);
      ctx.lineTo(state.clawX - 95, g.pileFloorY + 6);
      ctx.closePath();
      ctx.fill();
    }

    // Grounded Plushie Bin Bed (warm crimson-velvet pit sitting above the chutes)
    const bedTop = g.pileFloorY - 82;
    const bedGrad = ctx.createLinearGradient(0, bedTop, 0, g.chuteY);
    bedGrad.addColorStop(0, '#361523');
    bedGrad.addColorStop(0.22, '#542032');
    bedGrad.addColorStop(1, '#280d18');
    ctx.fillStyle = bedGrad;
    ctx.fillRect(gl.x, bedTop, gl.w, g.chuteY - bedTop + 4);
    ctx.strokeStyle = '#9b4a6266';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gl.x, bedTop);
    ctx.lineTo(gl.x + gl.w, bedTop);
    ctx.stroke();

    // Spotlight oval pool on the velvet floor
    if (state.phase === 'aim' || state.phase === 'descend') {
      const pool = ctx.createRadialGradient(state.clawX, g.pileFloorY - 12, 8, state.clawX, g.pileFloorY - 12, 74);
      pool.addColorStop(0, 'rgba(255, 246, 178, 0.26)');
      pool.addColorStop(1, 'rgba(255, 246, 178, 0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(state.clawX, g.pileFloorY - 12, 74, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Scattered miniature school props
    for (const pr of binProps) {
      drawProp(ctx, pr);
    }

    // Overhead double I-beam crane rail + rivets + brass bumper stops
    round(ctx, gl.x + 12, g.railY - 10, gl.w - 24, 15, 4, '#566982', '#97adc9', 1.6);
    ctx.fillStyle = '#334257';
    ctx.fillRect(gl.x + 14, g.railY - 5, gl.w - 28, 5);
    for (let rx = gl.x + 32; rx < gl.x + gl.w - 28; rx += 64) {
      ctx.fillStyle = '#b4c5d9';
      ctx.beginPath();
      ctx.arc(rx, g.railY - 7.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    round(ctx, gl.x + 10, g.railY - 12, 10, 19, 3, '#c89b44', '#5c4216', 1.4);
    round(ctx, gl.x + gl.w - 20, g.railY - 12, 10, 19, 3, '#c89b44', '#5c4216', 1.4);

    // Determine closest precario under crane for scared hover reaction
    let hoveredId = null;
    if ((state.phase === 'aim' || state.phase === 'descend') && !COVER_MODE) {
      const cand = pickTargetPerson();
      if (cand && Math.abs(cand.x - state.clawX) < 34) hoveredId = cand.id;
    }

    // Draw tank pile (back layer to front layer) with drop shadows
    const sortedPile = [...tankPeople].sort((a, b) => (a.layer || 0) - (b.layer || 0) || a.y - b.y);
    const spriteScale = isMobile ? 0.92 : 1.05;
    for (const p of sortedPile) {
      const bob = p.droppingIn ? 0 : Math.sin(time * 2.2 + p.bobOffset) * 1.1;
      drawPrecario(ctx, { ...p, y: p.y + bob }, spriteScale, p.tilt, !p.droppingIn, p.id === hoveredId);
    }

    // Translucent beveled acrylic retaining rail across front of plushie bin
    const railTop = g.pileFloorY - 2;
    const railH = g.chuteY - railTop;
    const acrylic = ctx.createLinearGradient(0, railTop, 0, g.chuteY);
    acrylic.addColorStop(0, 'rgba(205, 232, 255, 0.20)');
    acrylic.addColorStop(1, 'rgba(120, 165, 210, 0.12)');
    ctx.fillStyle = acrylic;
    ctx.fillRect(gl.x, railTop, gl.w, railH);
    ctx.strokeStyle = 'rgba(218, 240, 255, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(gl.x, railTop);
    ctx.lineTo(gl.x + gl.w, railTop);
    ctx.stroke();

    // Occasional hopeful whisper bubble from a random precario in tank
    if (tankWhisper.timer > 0 && tankWhisper.text) {
      const speaker = tankPeople.find(p => p.id === tankWhisper.personId) || tankPeople[0];
      if (speaker) {
        ctx.save();
        ctx.font = '700 10.5px system-ui, sans-serif';
        const bw = Math.min(180, ctx.measureText(tankWhisper.text).width + 18);
        const bx = Math.max(gl.x + 8, Math.min(gl.x + gl.w - bw - 8, speaker.x - bw / 2));
        const by = speaker.y - 72;
        round(ctx, bx, by, bw, 22, 7, '#f4efe2f5', '#607891', 1.4);
        txt(ctx, tankWhisper.text, bx + bw / 2, by + 14.5, 10.5, '#192432', 'center', 'system-ui, sans-serif', 700);
        ctx.restore();
      }
    }

    // 5 Chunky Illuminated Chutes at bottom of tank
    for (let i = 0; i < CHUTES.length; i++) {
      const ch = CHUTES[i];
      const cx = g.chuteXs[i];
      const cw = g.chuteW - 6;
      const bounceOffset = Math.sin(Math.min(1, chuteBounce[i]) * Math.PI) * 5;
      const x = cx - cw / 2;
      const y = g.chuteY + bounceOffset;
      const h = gl.y + gl.h - g.chuteY - 6;

      const isTargetHighlight = (state.phase === 'carry' || state.phase === 'sirenFreeze' || state.phase === 'pauseSiren' || state.phase === 'slip' || state.phase === 'fakeoutPause' || state.phase === 'fakeoutEject') && state.targetChute === i;
      const glowActive = isTargetHighlight || chuteBounce[i] > 0;

      if (glowActive) {
        ctx.save();
        ctx.shadowColor = ch.color;
        ctx.shadowBlur = 16;
        round(ctx, x, y, cw, h, 8, ch.dark, '#ffffff', 2.4);
        ctx.restore();
      } else {
        round(ctx, x, y, cw, h, 8, ch.dark, ch.color, 1.8);
      }

      // Inner bevel & recessed funnel opening
      round(ctx, x + 5, y + 4, cw - 10, 14, 4, '#070c14', ch.color, 1);

      if (i === 0) {
        ctx.save();
        ctx.strokeStyle = '#e6c36a99';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 6);
        ctx.lineTo(x + cw - 12, y + 16);
        ctx.moveTo(x + cw - 12, y + 6);
        ctx.lineTo(x + 12, y + 16);
        ctx.stroke();
        ctx.restore();
      }

      // Mini icon & labels
      drawChuteIcon(ctx, i, cx, y + 29, ch.color);
      const labelFont = isMobile ? 8.2 : 10;
      txt(ctx, ch.short, cx, y + 48, labelFont, ch.text, 'center', 'ui-monospace, monospace', 900);
      txt(ctx, ch.sub, cx, y + 62, isMobile ? 7.2 : 8.8, '#c7d3df', 'center', 'system-ui, sans-serif', 600);
    }

    // Dangling / falling grabbed precario
    if (state.grabbed) {
      drawPrecario(ctx, state.grabbed, spriteScale * 1.06, state.grabbed.dangling ? state.clawAngle * 1.5 : state.slipRot, false, false);
    }

    // Shaded Spring Boot / Piston during Rettifica d'Ufficio
    if (state.phase === 'fakeoutEject' && state.ejectBootProgress > 0) {
      const bx = g.chuteXs[0];
      const by = g.chuteY + 8 - Math.sin(Math.min(1, state.ejectBootProgress) * Math.PI) * 58;
      ctx.save();
      ctx.strokeStyle = '#d8e3ee';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bx, g.chuteY + 20);
      ctx.lineTo(bx - 12, by + 10);
      ctx.stroke();
      ctx.translate(bx, by);
      ctx.rotate(-0.35);
      round(ctx, -20, -13, 40, 22, 6, '#d94a56', '#fff2d8', 2);
      txt(ctx, 'NO!', 0, 3, 12, '#fff', 'center', 'ui-monospace, monospace', 900);
      ctx.restore();
    }

    // Aiming dashed line when in 'aim'
    if (state.phase === 'aim' && !COVER_MODE) {
      ctx.save();
      ctx.strokeStyle = '#d9f48248';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(state.clawX, state.clawY + 28);
      ctx.lineTo(state.clawX, g.pileFloorY - 22);
      ctx.stroke();
      ctx.restore();
    }

    // Detailed Chrome Crane
    drawClaw(g);

    // Electrical sparks when siren fires
    for (const sp of sparks) {
      ctx.fillStyle = sp.color;
      ctx.fillRect(sp.x - 1.5, sp.y - 1.5, 3, 3);
    }

    // Cartoon Impact Puffs
    for (const gg of gags) {
      const alpha = Math.min(1, (gg.life / gg.maxLife) * 2.2);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '900 11px ui-monospace, monospace';
      const tw = Math.max(54, ctx.measureText(gg.text).width + 18);
      round(ctx, gg.x - tw / 2, gg.y - 12, tw, 22, 7, '#f6ebd0', '#2b2016', 2);
      txt(ctx, gg.text, gg.x, gg.y + 3, 11, '#8c222e', 'center', 'ui-monospace, monospace', 900);
      ctx.restore();
    }

    // Subtle glass glare reflection on top
    ctx.strokeStyle = '#ffffff14';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(gl.x + 20, gl.y + 120);
    ctx.lineTo(gl.x + 150, gl.y - 10);
    ctx.moveTo(gl.x + gl.w - 130, gl.y + gl.h);
    ctx.lineTo(gl.x + gl.w + 20, gl.y + gl.h - 150);
    ctx.stroke();

    // Confetti particles
    for (const c of confetti) {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // end glass clip

    // Outer glass border crisp stroke
    round(ctx, gl.x, gl.y, gl.w, gl.h, 10, null, '#5a7594', 2);

    // Bottom cabinet bezel label
    const footY = gl.y + gl.h + 10;
    const footH = cab.y + cab.h - footY - 10;
    round(ctx, cab.x + 18, footY, cab.w - 36, footH, 8, '#172130', '#41536d', 1.6);
    txt(
      ctx,
      COVER_MODE ? 'SCELTA CASUALE MA SEMPRE PEGGIORE' : 'GETTONI: ∞ (SEI DI RUOLO)  ·  CLICCA UN PRECARIO PER IL DOSSIER',
      cab.x + cab.w / 2,
      footY + footH * 0.62,
      isMobile ? 9.5 : 11,
      '#9eb3cb',
      'center',
      'ui-monospace, monospace',
      700
    );
  }

  function drawClaw(g) {
    const x = state.clawX;
    const y = state.clawY;
    const railY = g.railY;

    // Trolley carriage with brass pulley wheel & status LED
    const trolleyGrad = ctx.createLinearGradient(x - 28, railY - 14, x - 28, railY + 10);
    trolleyGrad.addColorStop(0, '#d5e0ec');
    trolleyGrad.addColorStop(0.5, '#9cb0c7');
    trolleyGrad.addColorStop(1, '#687b92');
    round(ctx, x - 28, railY - 14, 56, 24, 6, trolleyGrad, '#2b394d', 2);

    // Side rail rollers
    ctx.fillStyle = '#38465a';
    ctx.beginPath();
    ctx.arc(x - 19, railY - 2, 4, 0, Math.PI * 2);
    ctx.arc(x + 19, railY - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Rotating brass pulley wheel
    ctx.save();
    ctx.translate(x, railY - 2);
    ctx.rotate((y - railY) * 0.08);
    ctx.fillStyle = '#e6c36a';
    ctx.strokeStyle = '#5c4216';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();

    // Trolley status LED
    const ledColor = sirenTimer > 0
      ? (Math.sin(time * 24) > 0 ? '#ff4252' : '#58121a')
      : state.phase === 'aim'
        ? '#d9f482'
        : '#f0ad5e';
    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(x + 19, railY - 9, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Braided metallic cable
    ctx.strokeStyle = '#5c7088';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(x, railY + 10);
    ctx.lineTo(x, y - 4);
    ctx.stroke();
    ctx.strokeStyle = '#dce8f5';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - 0.8, railY + 10);
    ctx.lineTo(x - 0.8, y - 4);
    ctx.stroke();

    // Claw head & 3 shaded pincers
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(state.clawAngle);

    // Spring coil collar
    round(ctx, -6, -16, 12, 9, 2, '#92a6bd', '#2d3b4d', 1.4);

    // Back center prong (subtle depth)
    ctx.strokeStyle = '#6c7f96';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, 26);
    ctx.stroke();

    // Chrome swivel hub
    const hubGrad = ctx.createLinearGradient(-15, -9, 15, 9);
    hubGrad.addColorStop(0, '#eef5fc');
    hubGrad.addColorStop(0.5, '#b6c7da');
    hubGrad.addColorStop(1, '#7589a1');
    round(ctx, -16, -9, 32, 18, 6, hubGrad, '#2c3a4c', 2);
    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();

    const spread = 0.22 + state.clawOpen * 0.56;
    [-1, 1].forEach(side => {
      ctx.save();
      ctx.translate(side * 10, 6);
      ctx.rotate(-side * spread);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Outer dark steel outline
      ctx.strokeStyle = '#2c3a4c';
      ctx.lineWidth = 8.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * 15, 19);
      ctx.lineTo(side * 4, 36);
      ctx.stroke();
      // Inner brushed silver
      ctx.strokeStyle = '#e1ebf5';
      ctx.lineWidth = 4.6;
      ctx.stroke();
      // Red rubber grip tip
      ctx.fillStyle = '#d94a56';
      ctx.beginPath();
      ctx.arc(side * 4, 36, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  function drawCoverOverlay() {
    if (!COVER_MODE) return;
    ctx.save();
    round(ctx, 22, 18, 272, 92, 12, '#131d2ee8', '#d9f482', 2);
    txt(ctx, 'MEUCCI / PASSATEMPI DEL PROF.', 38, 42, 10, '#a3b1bf', 'left', 'ui-monospace, monospace', 700);
    txt(ctx, 'MIM CLAW', 38, 76, 30, '#d9f482', 'left', 'system-ui, sans-serif', 900);
    txt(ctx, 'PESCA IL PRECARIO', 38, 98, 14, '#ef9aad', 'left', 'ui-monospace, monospace', 800);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#131d2f');
    bg.addColorStop(1, '#0b121f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const g = layout();
    drawCabinet(g);
    drawVipLounge(g);
    drawCoverOverlay();
  }

  function chooseOutcome(chuteIndex) {
    const pool = OUTCOMES.filter(o => o.chute === chuteIndex && !o.lockedForever);
    return pool[Math.floor(Math.random() * pool.length)] || OUTCOMES[0];
  }

  function startDrop() {
    if (state.phase !== 'aim') return;
    window.ClawAudio?.arm();
    window.ClawAudio?.play('drop');
    haptic(25);
    state.autoAimX = null;
    state.phase = 'descend';
    state.timer = 0;
    state.clawOpen = 0.90;
    setStatus('● ALGORITMO MIM · DISCESA IN CORSO…');
    setProfBubble('aim');
    if (btnDrop) btnDrop.disabled = true;
  }

  function pickTargetPerson() {
    let best = null;
    let bestDist = Infinity;
    for (const p of tankPeople) {
      const dist = Math.abs(p.x - state.clawX);
      const bonus = p.id === targetedId ? 42 : 0;
      if (dist - bonus < bestDist) {
        bestDist = dist - bonus;
        best = p;
      }
    }
    if (best && Math.abs(best.x - state.clawX) <= 78) return best;
    if (tankPeople.length) {
      return [...tankPeople].sort((a, b) => Math.abs(a.x - state.clawX) - Math.abs(b.x - state.clawX))[0];
    }
    return null;
  }

  function finishCatch(outcome) {
    const p = state.grabbed;
    const isRettifica = state.isFakeout;
    state.phase = 'aim';
    state.grabbed = null;
    state.clawOpen = 0.78;
    sirenTimer = 0;
    if (btnDrop) btnDrop.disabled = false;

    const g = layout();
    state.clawY = g.railY + 46;

    stats.infrante += 1;
    stats.unlocked[outcome.id] = (stats.unlocked[outcome.id] || 0) + 1;
    saveStats();
    renderScoreboard();
    renderAlbum();

    const protNum = String(100 + stats.infrante * 17 + ((p?.id || 1) % 89)).padStart(5, '0');
    lastDecree = {
      person: p || makePerson(),
      outcome,
      chute: CHUTES[outcome.chute],
      isRettifica,
      prot: `PROT. GPS-2026/${protNum}`
    };
    renderDecree();
    setStatus('● ALGORITMO MIM v0.9b · PRONTO');
    setProfMood(isRettifica ? 'evilLaugh' : 'amused', 2.8);
    setProfBubble(isRettifica ? 'rettifica' : 'afterDrop');
    toast(isRettifica
      ? `RETTIFICA D'UFFICIO! ${lastDecree.person.name} spedito a ${lastDecree.chute.code}!`
      : `${lastDecree.person.name} → ${lastDecree.chute.code}! Decreto pronto sotto.`);

    if (p && p.customName) {
      customColleague = '';
      targetedId = null;
      if (btnClearNomina) btnClearNomina.hidden = true;
    }
  }

  function tick(dt) {
    time += dt;
    coffeeSteamPhase += dt;
    if (sirenTimer > 0) sirenTimer = Math.max(0, sirenTimer - dt);
    if (profMoodTimer > 0) {
      profMoodTimer = Math.max(0, profMoodTimer - dt);
      if (profMoodTimer === 0) profMood = 'relaxed';
    }
    if (flashComoda > 0) {
      flashComoda = Math.max(0, flashComoda - dt);
      if (flashComoda === 0 && statComodeEl) {
        statComodeEl.classList.remove('flash-comoda', 'flash-rettifica');
        statComodeEl.textContent = '0';
      }
    }

    for (let i = 0; i < 5; i++) {
      if (chuteBounce[i] > 0) chuteBounce[i] = Math.max(0, chuteBounce[i] - dt * 2.4);
    }

    profBubble.timer -= dt;
    if (profBubble.timer <= 0) setProfBubble('idle');

    tankWhisper.timer -= dt;
    if (tankWhisper.timer <= 0 && tankPeople.length) {
      const rp = tankPeople[Math.floor(Math.random() * tankPeople.length)];
      tankWhisper = {
        personId: rp.id,
        text: TANK_WHISPERS[Math.floor(Math.random() * TANK_WHISPERS.length)],
        timer: 3.8
      };
    }

    for (const p of tankPeople) {
      if (p.droppingIn) {
        p.vy += 580 * dt;
        p.y += p.vy * dt;
        if (p.y >= p.homeY) {
          p.y = p.homeY;
          p.vy = 0;
          p.droppingIn = false;
        }
      }
    }

    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      c.life -= dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 280 * dt;
      if (c.life <= 0) confetti.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.life -= dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 240 * dt;
      if (sp.life <= 0) sparks.splice(i, 1);
    }
    for (let i = gags.length - 1; i >= 0; i--) {
      const gg = gags[i];
      gg.life -= dt;
      gg.y -= 18 * dt;
      if (gg.life <= 0) gags.splice(i, 1);
    }

    if (COVER_MODE) return;

    const g = layout();

    if (state.phase === 'aim') {
      state.clawY = g.railY + 46;
      let moveDir = 0;
      if (input.left) moveDir -= 1;
      if (input.right) moveDir += 1;
      if (moveDir !== 0) {
        state.autoAimX = null;
        state.clawX = Math.max(g.minX, Math.min(g.maxX, state.clawX + moveDir * (isMobile ? 195 : 235) * dt));
        state.clawAngle = Math.max(-0.15, Math.min(0.15, state.clawAngle * 0.85 - moveDir * 0.05));
        window.ClawAudio?.play('move');
      } else if (state.autoAimX !== null) {
        const dx = state.autoAimX - state.clawX;
        if (Math.abs(dx) < 3) {
          state.clawX = state.autoAimX;
          state.autoAimX = null;
          state.clawAngle *= 0.85;
        } else {
          const step = Math.sign(dx) * Math.min(Math.abs(dx), 290 * dt);
          state.clawX += step;
          state.clawAngle = -Math.sign(dx) * 0.06;
        }
      } else {
        state.clawAngle *= Math.pow(0.05, dt);
      }
      return;
    }

    state.timer += dt;

    if (state.phase === 'descend') {
      const targetY = g.pileFloorY - 52;
      const easeIn = Math.min(1, 0.35 + state.timer * 2.6);
      const nearSlow = state.clawY > targetY - 60 ? 0.65 : 1;
      state.clawY = Math.min(targetY, state.clawY + 165 * easeIn * nearSlow * dt);
      const candidate = pickTargetPerson();
      if (candidate) {
        const dx = candidate.x - state.clawX;
        state.clawX += dx * Math.min(1, 3.8 * dt);
      }
      if (state.clawY >= targetY || (candidate && state.clawY >= candidate.y - 42)) {
        const caught = candidate || makePerson();
        const idx = tankPeople.indexOf(caught);
        const template = { homeX: caught.homeX, homeY: caught.homeY, layer: caught.layer };
        if (idx >= 0) tankPeople.splice(idx, 1);
        replaceSlotWithNewPrecario(template);

        caught.dangling = true;
        caught.startled = true;
        state.grabbed = caught;
        state.phase = 'grab';
        state.timer = 0;

        dropsCount += 1;
        state.isFakeout = (!seenFakeout && dropsCount >= 5) || Math.random() < 0.12;
        if (state.isFakeout) seenFakeout = true;
        state.targetChute = state.isFakeout ? (Math.random() < 0.5 ? 1 : 2) : 1 + Math.floor(Math.random() * 4);
        state.plannedOutcome = chooseOutcome(state.targetChute);
        state.carriedToGoal = false;
        state.clackPlayed = false;
        state.slipBounced = false;

        window.ClawAudio?.play('grab');
        haptic([25, 20]);
        addGag('PRESO!', caught.x + 24, state.clawY - 12, '#d9f482', 0.85);
        setProfBubble('grab');
        toast(`Preso ${caught.name}! Direzione: 18h sotto casa…`);
      }
      return;
    }

    if (state.phase === 'grab') {
      const tClose = Math.min(1, state.timer / 0.36);
      state.clawOpen = 0.90 - 0.70 * tClose;
      if (state.grabbed) {
        state.grabbed.x = state.clawX;
        state.grabbed.y = state.clawY + 52;
      }
      if (state.timer >= 0.68) {
        state.phase = 'ascend';
        state.timer = 0;
      }
      return;
    }

    if (state.phase === 'ascend') {
      const topY = g.railY + 46;
      const strain = Math.sin(state.timer * 18) * 0.12;
      state.clawY = Math.max(topY, state.clawY - (128 + strain * 25) * dt);
      state.clawAngle = Math.sin(time * 9) * 0.04;
      if (state.grabbed) {
        state.grabbed.x = state.clawX;
        state.grabbed.y = state.clawY + 52;
      }
      if (state.clawY <= topY) {
        state.phase = 'carry';
        state.timer = 0;
        toast('Ci siamo quasi… 18 ore sotto casa?!');
      }
      return;
    }

    if (state.phase === 'carry') {
      const goalX = g.chuteXs[0];
      const destX = state.isFakeout
        ? goalX
        : state.carriedToGoal
          ? g.chuteXs[state.targetChute]
          : goalX;

      const dx = destX - state.clawX;
      const speed = state.carriedToGoal ? 155 : 120;
      const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      state.clawX += step;
      state.clawAngle = Math.sin(time * 8) * 0.06 - Math.sign(dx) * 0.05;

      if (state.grabbed) {
        state.grabbed.x = state.clawX;
        state.grabbed.y = state.clawY + 52;
      }

      if (!state.isFakeout && !state.carriedToGoal) {
        if (Math.abs(state.clawX - goalX) < g.chuteW * 0.48 || state.timer > 1.35) {
          state.carriedToGoal = true;
          state.phase = 'sirenFreeze';
          state.timer = 0;
          sirenTimer = 2.6;
          emitSparks(state.clawX, g.railY + 4, 12);
          addGag('BZZT!', state.clawX + 26, state.clawY - 8, '#ff8d96', 0.85);
          window.ClawAudio?.play('siren');
          setStatus('⚠ ANOMALIA: TROPPA FORTUNA RILEVATA!', true);
          setProfBubble('siren');
          toast('⚠ ANOMALIA! Troppa fortuna rilevata dall’Algoritmo!');
        }
      } else if (Math.abs(dx) < 3) {
        state.clawX = destX;
        if (state.isFakeout) {
          state.phase = 'fakeoutPause';
          state.timer = 0;
          state.clawOpen = 0.85;
          state.dropStartX = state.clawX;
          state.dropStartY = state.clawY + 52;
          state.dropTargetX = goalX;
          state.dropTargetY = g.chuteY + 34;
          if (statComodeEl) {
            statComodeEl.textContent = '1';
            statComodeEl.classList.add('flash-comoda');
          }
          for (let k = 0; k < 24; k++) {
            confetti.push({
              x: goalX,
              y: g.chuteY + 10,
              vx: (Math.random() - 0.5) * 230,
              vy: -90 - Math.random() * 140,
              life: 1.2,
              color: k % 2 ? '#d9f482' : '#e6c36a'
            });
          }
          window.ClawAudio?.play('coffee');
          setProfMood('shocked', 1.8);
          setProfBubble('fakeoutWin');
          toast('INCREDIBILE! 18 ORE SOTTO CASA?!');
        } else {
          state.phase = 'pauseSiren';
          state.timer = 0;
        }
      }
      return;
    }

    if (state.phase === 'sirenFreeze') {
      state.clawAngle = Math.sin(time * 36) * 0.1;
      if (state.grabbed) {
        state.grabbed.x = state.clawX + Math.sin(time * 34) * 2;
        state.grabbed.y = state.clawY + 52;
      }
      if (state.timer >= 0.85) {
        state.phase = 'carry';
        state.timer = 0;
      }
      return;
    }

    if (state.phase === 'pauseSiren') {
      state.clawAngle = Math.sin(time * 38) * 0.14;
      // Prongs visibly slip open slightly mid-pause
      if (state.timer > 0.42) {
        state.clawOpen = 0.20 + Math.min(1, (state.timer - 0.42) / 0.35) * 0.28;
        if (!state.clackPlayed) {
          state.clackPlayed = true;
          window.ClawAudio?.play('clack');
          addGag('CLACK…', state.clawX + 26, state.clawY + 18, '#ffd485', 0.7);
        }
      }
      if (state.grabbed) {
        state.grabbed.x = state.clawX + Math.sin(time * 36) * 3;
        state.grabbed.y = state.clawY + 52 + (state.timer > 0.42 ? 4 : 0);
      }
      if (state.timer >= 0.95) {
        state.phase = 'slip';
        state.timer = 0;
        state.clawOpen = 0.95;
        state.slipStartX = state.clawX;
        state.slipStartY = state.clawY + 56;
        state.slipRot = 0;
        window.ClawAudio?.play('slip');
      }
      return;
    }

    if (state.phase === 'slip') {
      const dur = 0.95;
      const t = Math.min(1, state.timer / dur);
      const targetY = g.chuteY + 34;
      const targetX = g.chuteXs[state.targetChute];
      // Eased gravity drop with brief rim bounce around t = 0.72
      let yFrac = t < 0.72 ? Math.pow(t / 0.72, 1.85) : 1 - Math.sin(((t - 0.72) / 0.28) * Math.PI) * 0.14;
      if (t >= 0.72 && !state.slipBounced) {
        state.slipBounced = true;
        chuteBounce[state.targetChute] = 1;
        addGag('OPS!', targetX + 18, g.chuteY - 8, CHUTES[state.targetChute].color, 0.75);
        window.ClawAudio?.play('chute');
        haptic([35, 30, 50]);
        for (let k = 0; k < 10; k++) {
          confetti.push({
            x: targetX,
            y: g.chuteY + 12,
            vx: (Math.random() - 0.5) * 160,
            vy: -70 - Math.random() * 90,
            life: 0.75,
            color: CHUTES[state.targetChute].color
          });
        }
      }
      if (state.grabbed) {
        state.grabbed.x = state.slipStartX + (targetX - state.slipStartX) * t;
        state.grabbed.y = state.slipStartY + (targetY - state.slipStartY) * yFrac;
        state.slipRot = t * (state.targetChute % 2 ? 2.2 : -2.2);
      }
      if (t >= 1) {
        state.phase = 'settle';
        state.timer = 0;
      }
      return;
    }

    if (state.phase === 'fakeoutPause') {
      const p = state.grabbed;
      if (p) {
        const dropT = Math.min(1, state.timer / 0.55);
        p.x = state.dropStartX;
        p.y = state.dropStartY + (state.dropTargetY - state.dropStartY) * (dropT * dropT);
      }
      if (state.timer >= 1.65) {
        state.phase = 'fakeoutEject';
        state.timer = 0;
        sirenTimer = 2.4;
        state.ejectBootProgress = 0;
        if (statComodeEl) {
          statComodeEl.classList.remove('flash-comoda');
          statComodeEl.classList.add('flash-rettifica');
          statComodeEl.textContent = '0';
          flashComoda = 1.4;
        }
        addGag('RETTIFICA!', g.chuteXs[0] + 24, g.chuteY - 18, '#ff8d96', 1.1);
        window.ClawAudio?.play('rettifica');
        haptic([60, 40, 90]);
        setStatus('⚠ RETTIFICA D’UFFICIO MIM IN CORSO!', true);
        setProfMood('evilLaugh', 2.4);
        setProfBubble('rettifica');
        toast('⚠ RETTIFICA D’UFFICIO! Troppo bello per essere vero!');
      }
      return;
    }

    if (state.phase === 'fakeoutEject') {
      const dur = 1.25;
      const t = Math.min(1, state.timer / dur);
      state.ejectBootProgress = t * 2.1;
      const startX = g.chuteXs[0];
      const endX = g.chuteXs[state.targetChute];
      const baseY = g.chuteY + 34;
      if (state.grabbed) {
        state.grabbed.x = startX + (endX - startX) * t;
        state.grabbed.y = baseY - Math.sin(t * Math.PI) * 200;
        state.slipRot = t * 6.4;
      }
      if (t >= 1) {
        chuteBounce[state.targetChute] = 1;
        window.ClawAudio?.play('chute');
        state.phase = 'settle';
        state.timer = 0;
      }
      return;
    }

    if (state.phase === 'settle') {
      if (state.timer >= 0.30) {
        finishCatch(state.plannedOutcome);
      }
    }
  }

  function renderScoreboard() {
    if (statInfranteEl) statInfranteEl.textContent = String(stats.infrante);
  }

  function renderAlbum() {
    const grid = $('album-grid');
    const countEl = $('album-count');
    if (!grid || !countEl) return;

    const unlockedCount = OUTCOMES.filter(o => !o.lockedForever && stats.unlocked[o.id] > 0).length;
    countEl.textContent = `${unlockedCount} / ${OUTCOMES.length}`;

    grid.innerHTML = '';
    for (const o of OUTCOMES) {
      const hits = stats.unlocked[o.id] || 0;
      const unlocked = !o.lockedForever && hits > 0;
      const card = document.createElement('article');
      card.className = `trophy-card ${o.lockedForever ? 'legendary' : unlocked ? 'unlocked' : 'locked'}`;
      const rarityClass = o.rarity.toLowerCase().startsWith('comune')
        ? 'comune'
        : o.rarity.toLowerCase().startsWith('rara')
          ? 'rara'
          : o.rarity.toLowerCase().startsWith('epica')
            ? 'epica'
            : 'leggendaria';

      const top = document.createElement('div');
      top.className = 'trophy-top';
      const pill = document.createElement('span');
      pill.className = `trophy-rarity ${rarityClass}`;
      pill.textContent = o.rarity;
      const cnt = document.createElement('span');
      cnt.className = 'trophy-count';
      cnt.textContent = o.lockedForever ? '0,00%' : unlocked ? `×${hits}` : 'Bloccata';
      top.append(pill, cnt);

      const h4 = document.createElement('h4');
      h4.textContent = unlocked || o.lockedForever ? o.title : `Cattedra misteriosa (${CHUTES[o.chute].short})`;

      const desc = document.createElement('p');
      desc.textContent = unlocked || o.lockedForever ? o.shortLine : 'Pesca nello scivolo corrispondente per sbloccare.';

      card.append(top, h4, desc);
      grid.appendChild(card);
    }
  }

  function renderDecree() {
    if (!lastDecree) return;
    const empty = $('decreto-empty');
    const card = $('decreto-card');
    if (empty) empty.hidden = true;
    if (card) card.hidden = false;

    const { person, outcome, chute, isRettifica, prot } = lastDecree;
    $('decreto-prot').textContent = prot;
    const stamp = $('decreto-stamp');
    stamp.textContent = isRettifica ? 'RETTIFICATO D’UFFICIO' : 'ASSEGNATO D’UFFICIO';
    stamp.classList.toggle('rettifica', isRettifica);

    $('decreto-name').textContent = person.name;
    $('decreto-class').textContent = person.cls;
    $('decreto-score').textContent = `Punteggio GPS: ${person.score} (${person.pos})`;
    $('decreto-chute').textContent = chute.code;
    $('decreto-rarity').textContent = `RARITÀ: ${outcome.rarity}`;
    $('decreto-title').textContent = outcome.title;
    $('decreto-text').textContent = outcome.decreeText;

    const avatarCanvas = $('decreto-avatar');
    if (avatarCanvas) {
      const actx = avatarCanvas.getContext('2d');
      actx.clearRect(0, 0, avatarCanvas.width, avatarCanvas.height);
      drawPrecario(actx, { ...person, x: 32, y: 56, dir: 1, dangling: false, startled: true, customName: '' }, 1.2, 0);
    }
  }

  async function shareDecreeImage() {
    if (!lastDecree) return;
    haptic(25);
    const { person, outcome, chute, isRettifica, prot } = lastDecree;

    const cardW = 1000;
    const cardH = 620;
    const off = document.createElement('canvas');
    off.width = cardW;
    off.height = cardH;
    const o = off.getContext('2d');

    o.fillStyle = '#101726';
    o.fillRect(0, 0, cardW, cardH);
    round(o, 24, 24, cardW - 48, cardH - 48, 18, '#f4efe2', '#d2c5a6', 3);

    o.fillStyle = '#5e5544';
    o.font = '800 14px ui-monospace, monospace';
    o.fillText("MINISTERO DELL'ISTRUZIONE E DEL MERITO (MOLTO PROVVISORIO)", 54, 68);
    o.fillStyle = '#7c6f56';
    o.font = '700 14px ui-monospace, monospace';
    o.fillText(`${prot} · ALGORITMO MIM v0.9b`, 54, 94);

    o.strokeStyle = '#d3c6ab';
    o.lineWidth = 2;
    o.beginPath();
    o.moveTo(54, 114);
    o.lineTo(cardW - 54, 114);
    o.stroke();

    o.save();
    o.translate(cardW - 180, 92);
    o.rotate(-0.12);
    round(o, -110, -26, 220, 52, 6, '#be2a3a14', '#be2a3a', 4);
    o.fillStyle = '#be2a3a';
    o.font = '900 15px ui-monospace, monospace';
    o.textAlign = 'center';
    o.fillText(isRettifica ? 'RETTIFICATO D’UFFICIO' : 'ASSEGNATO D’UFFICIO', 0, 6);
    o.restore();

    round(o, 54, 140, 128, 142, 14, '#e7dec8', '#c6b898', 2);
    drawPrecario(o, { ...person, x: 118, y: 248, dir: 1, dangling: false, startled: true, customName: '' }, 2.35, 0);

    o.fillStyle = '#161d26';
    let nameSize = 36;
    o.font = `900 ${nameSize}px system-ui, sans-serif`;
    while (o.measureText(person.name).width > 710 && nameSize > 22) {
      nameSize -= 2;
      o.font = `900 ${nameSize}px system-ui, sans-serif`;
    }
    o.fillText(person.name, 206, 184);

    o.fillStyle = '#355849';
    o.font = '800 18px ui-monospace, monospace';
    o.fillText(person.cls, 206, 222);

    o.fillStyle = '#5a5343';
    o.font = '700 16px system-ui, sans-serif';
    o.fillText(`Punteggio GPS: ${person.score} (${person.pos})`, 206, 254);

    round(o, 54, 306, cardW - 108, 198, 14, '#ece4cf', '#cbbda0', 2);
    round(o, 76, 326, 230, 32, 7, '#1c2838');
    o.fillStyle = '#d9f482';
    o.font = '800 14px ui-monospace, monospace';
    o.textAlign = 'center';
    o.fillText(chute.code, 191, 347);
    o.textAlign = 'left';

    o.fillStyle = '#7d4a1b';
    o.font = '800 13px ui-monospace, monospace';
    o.fillText(`RARITÀ: ${outcome.rarity}`, 324, 347);

    o.fillStyle = '#18202b';
    let titleSize = 22;
    o.font = `900 ${titleSize}px system-ui, sans-serif`;
    while (o.measureText(outcome.title).width > cardW - 152 && titleSize > 16) {
      titleSize -= 1;
      o.font = `900 ${titleSize}px system-ui, sans-serif`;
    }
    o.fillText(outcome.title, 76, 390);

    drawWrappedText(o, outcome.decreeText, 76, 426, cardW - 152, 26, 18, '#2f3742', 'system-ui, sans-serif', 600);

    o.fillStyle = '#5b513e';
    o.font = 'italic 700 16px system-ui, sans-serif';
    o.fillText('Con affetto, il collega di ruolo · Posto fisso al sicuro.', 54, 536);

    o.fillStyle = '#6f6552';
    o.font = '700 13px ui-monospace, monospace';
    o.fillText('Realizzato dal Prof. Rossano Bella · hidetoshi777.github.io/Scuola/meucci-giochi/pesca-precario/', 54, 568);

    const slug = person.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'precario';
    const filename = `decreto-mim-${slug}.png`;

    const downloadBlob = blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Decreto scaricato! Giralo subito su WhatsApp.');
    };

    const shareText = `📜 DECRETO PROVVISORISSIMO MIM — ${person.name}: "${outcome.title}". Con affetto, il collega di ruolo!`;

    off.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          title: 'MIM CLAW · Decreto Provvisorissimo',
          text: shareText,
          files: [file]
        }).then(() => toast('Decreto condiviso!')).catch(err => {
          if (err.name !== 'AbortError') downloadBlob(blob);
        });
      } else {
        downloadBlob(blob);
      }
    }, 'image/png');
  }

  async function copyDecreeWhatsApp() {
    if (!lastDecree) return;
    const { person, outcome, chute, prot } = lastDecree;
    const msg =
      `📜 *DECRETO PROVVISORISSIMO MIM* (${prot})\n` +
      `👤 *${person.name}* (${person.cls})\n` +
      `🎯 Esito Algoritmo: *${chute.code}*\n` +
      `📌 _${outcome.title}_\n` +
      `${outcome.decreeText}\n\n` +
      `☕ _Con affetto, il collega di ruolo (posto fisso al sicuro)._\n` +
      `👉 https://hidetoshi777.github.io/Scuola/meucci-giochi/pesca-precario/`;

    try {
      await navigator.clipboard.writeText(msg);
      toast('Testo del decreto copiato! Incollalo su WhatsApp.');
    } catch (_) {
      window.prompt('Copia il testo per WhatsApp:', msg);
    }
  }

  function openDossier(p) {
    haptic(20);
    selectedPerson = p;
    $('dossier-name').textContent = p.name;
    $('dossier-class').textContent = p.cls;
    $('dossier-score').textContent = `${p.score} (${p.pos})`;
    $('dossier-title-desc').textContent = p.titleDesc;
    $('dossier-logistics').textContent = p.logistics;
    $('dossier-hope').textContent = p.hope;

    const dc = $('dossier-canvas');
    if (dc) {
      const dctx = dc.getContext('2d');
      dctx.clearRect(0, 0, dc.width, dc.height);
      drawPrecario(dctx, { ...p, x: 35, y: 60, dir: 1, dangling: false, startled: false, customName: '' }, 1.35, 0);
    }
    const modal = $('dossier-modal');
    if (modal && typeof modal.showModal === 'function') modal.showModal();
  }

  function bindHoldButton(btn, key) {
    if (!btn) return;
    const down = e => {
      e.preventDefault();
      window.ClawAudio?.arm();
      input[key] = true;
      btn.classList.add('is-down');
    };
    const up = () => {
      input[key] = false;
      btn.classList.remove('is-down');
    };
    btn.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  }

  bindHoldButton(btnLeft, 'left');
  bindHoldButton(btnRight, 'right');

  btnDrop?.addEventListener('click', startDrop);

  btnRefill?.addEventListener('click', () => {
    if (state.phase !== 'aim') return;
    window.ClawAudio?.arm();
    window.ClawAudio?.play('coffee');
    populateTank(false);
    toast('Teca rifornita di nuovi precari speranzosi!');
  });

  nominaForm?.addEventListener('submit', e => {
    e.preventDefault();
    const val = colleagueInput?.value.trim() || '';
    if (!val) {
      toast('Scrivi il nome di un collega da mettere in vetrina.');
      colleagueInput?.focus();
      return;
    }
    window.ClawAudio?.arm();
    tagCustomColleague(val, true);
  });

  btnClearNomina?.addEventListener('click', () => {
    if (colleagueInput) colleagueInput.value = '';
    tagCustomColleague('', false);
    toast('Nome collega rimosso. Tornano i precari casuali.');
  });

  $('btn-share-decreto')?.addEventListener('click', shareDecreeImage);
  $('btn-copy-wa')?.addEventListener('click', copyDecreeWhatsApp);

  $('dossier-close')?.addEventListener('click', () => {
    $('dossier-modal')?.close();
    selectedPerson = null;
  });
  $('dossier-modal')?.addEventListener('click', e => {
    if (e.target === $('dossier-modal')) {
      $('dossier-modal').close();
      selectedPerson = null;
    }
  });
  $('dossier-target')?.addEventListener('click', () => {
    if (selectedPerson && state.phase === 'aim') {
      targetedId = selectedPerson.id;
      state.autoAimX = selectedPerson.x;
      window.ClawAudio?.arm();
      window.ClawAudio?.play('target');
      toast(`Artiglio puntato su ${selectedPerson.name}! Premi PESCA!`);
    }
    $('dossier-modal')?.close();
    selectedPerson = null;
  });

  canvas.addEventListener('pointerdown', e => {
    if (COVER_MODE || state.phase !== 'aim') return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const g = layout();
    if (x >= g.glass.x && x <= g.glass.x + g.glass.w && y >= g.glass.y && y <= g.glass.y + g.glass.h) {
      dragActive = true;
      dragStartX = x;
      dragMoved = false;
    }
  });

  canvas.addEventListener('pointermove', e => {
    if (!dragActive || state.phase !== 'aim') return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    if (Math.abs(x - dragStartX) > 7) {
      dragMoved = true;
      const g = layout();
      state.autoAimX = null;
      state.clawX = Math.max(g.minX, Math.min(g.maxX, x));
    }
  });

  window.addEventListener('pointerup', e => {
    if (!dragActive) return;
    const wasMoved = dragMoved;
    dragActive = false;
    dragMoved = false;
    if (wasMoved || state.phase !== 'aim') return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (W / rect.width);
    const clickY = (e.clientY - rect.top) * (H / rect.height);

    let hit = null;
    for (let i = tankPeople.length - 1; i >= 0; i--) {
      const p = tankPeople[i];
      if (Math.hypot(p.x - clickX, (p.y - 22) - clickY) < 30) {
        hit = p;
        break;
      }
    }
    if (hit) {
      openDossier(hit);
    } else {
      const g = layout();
      if (clickX >= g.glass.x && clickX <= g.glass.x + g.glass.w && clickY < g.chuteY) {
        window.ClawAudio?.arm();
        state.autoAimX = Math.max(g.minX, Math.min(g.maxX, clickX));
      }
    }
  });

  window.addEventListener('keydown', e => {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      input.left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      input.right = true;
    } else if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') && state.phase === 'aim') {
      if (document.activeElement?.tagName === 'BUTTON' || document.activeElement?.tagName === 'A') return;
      e.preventDefault();
      startDrop();
    }
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = false;
  });

  function frame(now) {
    const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    if (!document.hidden) tick(dt);
    draw();
    if (!COVER_MODE) requestAnimationFrame(frame);
  }

  if (COVER_MODE) {
    document.body.classList.add('cover-mode');
  }

  window.addEventListener('resize', () => {
    if (!COVER_MODE) resize();
  });

  resize();
  renderScoreboard();
  renderAlbum();
  draw();
  if (!COVER_MODE) requestAnimationFrame(frame);
})();

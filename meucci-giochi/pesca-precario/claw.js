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
      'Aspetta a stappare lo spumante…'
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
    { id: 0, code: '18H SOTTO CASA', short: '18h SOTTO CASA', sub: 'Sabato libero', color: '#e6c36a', dark: '#544016', text: '#fff0bd' },
    { id: 1, code: 'SPEZZONE 4+6+8h', short: 'SPEZZONE', sub: '4+6+8h · 3 comuni', color: '#f0ad5e', dark: '#5a3610', text: '#ffe3bf' },
    { id: 2, code: '115 KM DI CURVE', short: '115 KM CURVE', sub: 'Catene a bordo', color: '#ef7b8d', dark: '#5b1c29', text: '#ffd7de' },
    { id: 3, code: 'SUPPLENZA 2 GG', short: 'SUPPLENZA 2 GG', sub: 'Con Consiglio', color: '#74c5ee', dark: '#173f56', text: '#d8f3ff' },
    { id: 4, code: 'SALTA IL TURNO', short: 'SALTA TURNO', sub: 'Bug algoritmo', color: '#b49ce8', dark: '#352654', text: '#eadfff' }
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

  // Elements
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
  let tankWhisper = { personId: null, text: '', timer: 1.5 };
  let confetti = [];
  let flashComoda = 0;

  // Input flags
  const input = { left: false, right: false };
  let dragActive = false;
  let dragStartX = 0;
  let dragMoved = false;

  // Claw & game state
  const state = {
    phase: 'aim', // aim | descend | grab | ascend | carry | pauseSiren | slip | fakeoutPause | fakeoutEject | result
    timer: 0,
    clawX: 500,
    clawY: 100,
    clawAngle: 0,
    clawOpen: 0.72,
    autoAimX: null,
    grabbed: null,
    targetChute: 1,
    plannedOutcome: null,
    isFakeout: false,
    carriedToGoal: false,
    slipStartX: 0,
    slipStartY: 0,
    slipRot: 0,
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
    profBubble.timer = 4.2;
  }

  function layout() {
    if (COVER_MODE) {
      W = 1200;
      H = 800;
      isMobile = false;
      const vip = { x: 24, y: 122, w: 268, h: 646 };
      const cab = { x: 312, y: 22, w: 866, h: 756 };
      const marquee = { x: cab.x + 14, y: cab.y + 12, w: cab.w - 28, h: 66 };
      const glass = { x: cab.x + 22, y: marquee.y + marquee.h + 10, w: cab.w - 44, h: cab.h - 216 };
      const railY = glass.y + 24;
      const chuteY = glass.y + glass.h - 92;
      const chuteW = (glass.w - 32) / 5;
      return {
        vip, cab, marquee, glass, railY, chuteY, chuteW,
        minX: glass.x + 48,
        maxX: glass.x + glass.w - 48,
        pileFloorY: chuteY - 6,
        chuteXs: Array.from({ length: 5 }, (_, i) => glass.x + 16 + chuteW * (i + 0.5))
      };
    }

    if (isMobile) {
      const vip = { x: 14, y: 12, w: W - 28, h: 124 };
      const cab = { x: 14, y: 146, w: W - 28, h: H - 160 };
      const marquee = { x: cab.x + 10, y: cab.y + 10, w: cab.w - 20, h: 52 };
      const glass = { x: cab.x + 14, y: marquee.y + marquee.h + 8, w: cab.w - 28, h: cab.h - 154 };
      const railY = glass.y + 22;
      const chuteY = glass.y + glass.h - 86;
      const chuteW = (glass.w - 20) / 5;
      return {
        vip, cab, marquee, glass, railY, chuteY, chuteW,
        minX: glass.x + 36,
        maxX: glass.x + glass.w - 36,
        pileFloorY: chuteY - 6,
        chuteXs: Array.from({ length: 5 }, (_, i) => glass.x + 10 + chuteW * (i + 0.5))
      };
    }

    const vip = { x: 18, y: 18, w: 224, h: H - 36 };
    const cab = { x: 256, y: 18, w: W - 274, h: H - 36 };
    const marquee = { x: cab.x + 14, y: cab.y + 12, w: cab.w - 28, h: 58 };
    const glass = { x: cab.x + 18, y: marquee.y + marquee.h + 10, w: cab.w - 36, h: cab.h - 168 };
    const railY = glass.y + 22;
    const chuteY = glass.y + glass.h - 84;
    const chuteW = (glass.w - 28) / 5;
    return {
      vip, cab, marquee, glass, railY, chuteY, chuteW,
      minX: glass.x + 42,
      maxX: glass.x + glass.w - 42,
      pileFloorY: chuteY - 6,
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
      tilt: (Math.random() - 0.5) * 0.18,
      bobOffset: Math.random() * 6.28,
      dangling: false,
      startled: false,
      droppingIn: false,
      vy: 0
    };
  }

  function populateTank(preserveTarget = false) {
    const g = layout();
    const rows = [7, 6, 5]; // bottom 7, middle 6, top 5 -> 18 precari
    const leftPad = g.glass.x + 56;
    const usableW = g.glass.w - 112;
    const list = [];
    let idx = 0;
    for (let r = 0; r < rows.length; r++) {
      const cols = rows[r];
      const rowY = g.pileFloorY - 22 - r * (isMobile ? 42 : 38);
      for (let c = 0; c < cols; c++) {
        const p = makePerson();
        const frac = cols === 1 ? 0.5 : c / (cols - 1);
        const jitter = Math.sin((idx + 1) * 3.1) * 14;
        const hx = Math.max(g.minX, Math.min(g.maxX, leftPad + frac * usableW + (r % 2 ? 12 : -8) + jitter));
        const hy = rowY + Math.cos((idx + 2) * 2.7) * 5;
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

    // Clear previous custom tag
    tankPeople.forEach(p => {
      if (p.customName) {
        p.customName = '';
        p.name = p.generatedName || p.name;
      }
    });

    // Pick a prominent upper-row precario near center
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
      const dpr = 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    tankWhisper = { personId: tankPeople[3]?.id, text: 'Ho fatto pure il CLIL!', timer: 999 };
    const dangling = makePerson('Concetta Russo');
    dangling.woman = true;
    dangling.color = '#ef9aad';
    dangling.dangling = true;
    dangling.startled = true;
    dangling.x = g.chuteXs[2] + 35;
    dangling.y = g.glass.y + 235;
    state.clawX = dangling.x;
    state.clawY = dangling.y - 52;
    state.clawOpen = 0.25;
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

  function drawPrecario(c, p, scale = 1, rotation = 0) {
    const startled = Boolean(p.startled || p.dangling);
    c.save();
    c.translate(p.x, p.y);
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

    // Target badge above colleague (offset aside if dangling from claw so prongs don't cover it)
    if (p.id === targetedId || p.customName) {
      const pulse = Math.sin(time * 6) * 2;
      const badgeLabel = p.customName ? p.customName.toUpperCase() : 'NEL MIRINO';
      c.save();
      c.font = '800 10px ui-monospace, monospace';
      const tw = Math.min(148, Math.max(66, c.measureText(badgeLabel).width + 16));
      const bx = p.dangling ? p.x + 34 : p.x - tw / 2;
      const by = p.dangling ? p.y - 34 : p.y - 68 * scale + pulse;
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
    // Gold VIP panel
    const bg = ctx.createLinearGradient(v.x, v.y, v.x, v.y + v.h);
    bg.addColorStop(0, '#1e2736');
    bg.addColorStop(1, '#121927');
    round(ctx, v.x, v.y, v.w, v.h, 14, bg, '#e6c36a', 2.2);

    // Top golden badge
    const badgeW = isMobile ? 168 : v.w - 24;
    const badgeX = isMobile ? v.x + 12 : v.x + 12;
    const badgeY = v.y + 10;
    round(ctx, badgeX, badgeY, badgeW, 38, 8, '#362c16', '#e6c36a', 1.5);
    txt(ctx, '★ ZONA VIP', badgeX + badgeW / 2, badgeY + 15, 10, '#e6c36a', 'center', 'ui-monospace, monospace', 800);
    txt(ctx, 'DI RUOLO · FUORI CONCORSO', badgeX + badgeW / 2, badgeY + 30, 9.5, '#fff0bd', 'center', 'ui-monospace, monospace', 800);

    // Position armchair + Prof depending on desktop/cover vs mobile
    const px = isMobile ? v.x + 104 : v.x + v.w * 0.48;
    const py = isMobile ? v.y + 108 : v.y + v.h * 0.56;
    const scale = isMobile ? 1.15 : 1.62;

    // Cozy rug / floor lamp glow
    if (!isMobile) {
      const glow = ctx.createRadialGradient(px, py - 24, 12, px, py - 24, 110);
      glow.addColorStop(0, '#e6c36a28');
      glow.addColorStop(1, '#e6c36a00');
      ctx.fillStyle = glow;
      ctx.fillRect(v.x + 6, v.y + 54, v.w - 12, v.h - 140);
    }

    // Leather armchair behind Prof
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scale, scale);
    round(ctx, -28, -42, 56, 40, 10, '#6e2831', '#3b1116', 2);
    round(ctx, -32, -22, 12, 24, 5, '#84343e', '#3b1116', 1.6);
    round(ctx, 20, -22, 12, 24, 5, '#84343e', '#3b1116', 1.6);
    round(ctx, -24, -12, 48, 16, 6, '#84343e', '#3b1116', 1.6);

    // Prof di Ruolo (calm, smug grin, sunglasses or glasses, coffee cup)
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
    ctx.ellipse(0, -41, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Neat dark hair with distinguished silver temples
    ctx.fillStyle = '#38362f';
    ctx.beginPath();
    ctx.ellipse(0, -49, 10, 5, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b4b8bf';
    ctx.fillRect(-10, -46, 3, 6);
    ctx.fillRect(7, -46, 3, 6);
    // Smug glasses & big relaxed smile
    ctx.fillStyle = '#182430';
    round(ctx, -7, -44, 6, 4.5, 1.2, '#1e2c3a', '#e6c36a', 1);
    round(ctx, 1, -44, 6, 4.5, 1.2, '#1e2c3a', '#e6c36a', 1);
    ctx.strokeStyle = '#6c3e2b';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -37, 4, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // Raised right arm holding steaming espresso cup
    const sip = Math.sin(coffeeSteamPhase * 1.4) * 1.6;
    ctx.strokeStyle = '#2f5e53';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, -24);
    ctx.lineTo(20, -18);
    ctx.lineTo(24, -27 + sip);
    ctx.stroke();
    // Cup & saucer
    round(ctx, 18, -28 + sip, 12, 3, 1.5, '#e5dfd0', '#8f8470', 1);
    round(ctx, 20, -36 + sip, 8, 8, 2, '#fff9ee', '#8f8470', 1);
    // Steam
    ctx.strokeStyle = '#ffffff70';
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
        const by = v.y + 62;
        const bw = v.w - 28;
        const bh = 62;
        round(ctx, bx, by, bw, bh, 10, '#f4efe2', '#e6c36a', 1.8);
        // Little triangle pointer
        ctx.fillStyle = '#f4efe2';
        ctx.beginPath();
        ctx.moveTo(px - 8, by + bh - 1);
        ctx.lineTo(px, by + bh + 10);
        ctx.lineTo(px + 8, by + bh - 1);
        ctx.fill();
        drawWrappedText(ctx, `“${profBubble.text}”`, bx + 12, by + 24, bw - 24, 18, 13.5, '#18222e', 'system-ui, sans-serif', 700);

        // Bottom brass plaque inside VIP lounge
        const plaqueY = v.y + v.h - 104;
        const brass = ctx.createLinearGradient(v.x + 18, plaqueY, v.x + v.w - 18, plaqueY + 86);
        brass.addColorStop(0, '#f0d48a');
        brass.addColorStop(0.5, '#c4963e');
        brass.addColorStop(1, '#8d6424');
        round(ctx, v.x + 16, plaqueY, v.w - 32, 86, 9, brass, '#5c4216', 2);
        txt(ctx, 'POSTO FISSO', v.x + v.w / 2, plaqueY + 24, 10, '#2a1c08', 'center', 'ui-monospace, monospace', 800);
        txt(ctx, 'AL SICURO', v.x + v.w / 2, plaqueY + 47, 19, '#1c1204', 'center', 'system-ui, sans-serif', 900);
        txt(ctx, 'Tu guardi. Loro sgomitano.', v.x + v.w / 2, plaqueY + 69, 10.5, '#3b280b', 'center', 'system-ui, sans-serif', 700);
      }
    }

    ctx.restore();
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

  function drawCabinet(g) {
    const cab = g.cab;
    const mq = g.marquee;
    const gl = g.glass;

    // Outer arcade cabinet frame
    const frameGrad = ctx.createLinearGradient(cab.x, cab.y, cab.x, cab.y + cab.h);
    frameGrad.addColorStop(0, '#28364c');
    frameGrad.addColorStop(1, '#141c2b');
    round(ctx, cab.x, cab.y, cab.w, cab.h, 16, frameGrad, '#5d7392', 2.5);

    // Top marquee header
    const mqGrad = ctx.createLinearGradient(mq.x, mq.y, mq.x, mq.y + mq.h);
    mqGrad.addColorStop(0, '#36213e');
    mqGrad.addColorStop(1, '#1c162b');
    round(ctx, mq.x, mq.y, mq.w, mq.h, 10, mqGrad, '#d9f482', 2);

    // Marquee chase bulbs
    const bulbCount = Math.floor(mq.w / 26);
    for (let i = 0; i < bulbCount; i++) {
      const bx = mq.x + 14 + i * ((mq.w - 28) / Math.max(1, bulbCount - 1));
      const lit = (Math.floor(time * 5) + i) % 3 === 0;
      ctx.fillStyle = lit ? '#fef08a' : '#574e38';
      ctx.beginPath();
      ctx.arc(bx, mq.y + 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const sirenActive = sirenTimer > 0;
    if (sirenActive) {
      const blink = Math.sin(time * 24) > 0;
      round(ctx, mq.x + 10, mq.y + 14, mq.w - 20, mq.h - 20, 7, blink ? '#851d2a' : '#4a141d', '#ff9b9b', 2);
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

    // Inner Glass Tank backdrop
    const tankGrad = ctx.createLinearGradient(gl.x, gl.y, gl.x, gl.y + gl.h);
    tankGrad.addColorStop(0, '#0f1c2e');
    tankGrad.addColorStop(0.65, '#15273e');
    tankGrad.addColorStop(1, '#101b2a');
    round(ctx, gl.x, gl.y, gl.w, gl.h, 10, tankGrad, '#4d6580', 2);

    // Subtle school windows / lockers inside backdrop
    ctx.save();
    round(ctx, gl.x, gl.y, gl.w, gl.h, 10);
    ctx.clip();
    ctx.fillStyle = '#1b314d66';
    for (let wx = gl.x + 28; wx < gl.x + gl.w - 40; wx += 110) {
      ctx.fillRect(wx, gl.y + 44, 64, 96);
      ctx.fillStyle = '#26446855';
      ctx.fillRect(wx + 6, gl.y + 50, 24, 38);
      ctx.fillRect(wx + 34, gl.y + 50, 24, 38);
      ctx.fillStyle = '#1b314d66';
    }
    // Overhead rail track
    round(ctx, gl.x + 14, g.railY - 7, gl.w - 28, 12, 4, '#51637a', '#8aa0bd', 1.5);
    ctx.restore();

    // 5 Chutes at bottom of tank
    for (let i = 0; i < CHUTES.length; i++) {
      const ch = CHUTES[i];
      const cx = g.chuteXs[i];
      const cw = g.chuteW - 6;
      const x = cx - cw / 2;
      const y = g.chuteY;
      const h = gl.y + gl.h - y - 8;

      const isTargetHighlight = (state.phase === 'carry' || state.phase === 'slip' || state.phase === 'fakeoutPause' || state.phase === 'fakeoutEject') && state.targetChute === i;
      round(ctx, x, y, cw, h, 8, ch.dark, isTargetHighlight ? '#ffffff' : ch.color, isTargetHighlight ? 2.5 : 1.8);

      // Chute mouth opening
      round(ctx, x + 5, y + 4, cw - 10, 14, 4, '#080e17', ch.color, 1);

      // Golden barred hatch on Chute 0 (18h sotto casa)
      if (i === 0) {
        ctx.save();
        ctx.strokeStyle = '#e6c36a88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 6);
        ctx.lineTo(x + cw - 12, y + 16);
        ctx.moveTo(x + cw - 12, y + 6);
        ctx.lineTo(x + 12, y + 16);
        ctx.stroke();
        ctx.restore();
      }

      // Chute labels
      const labelFont = isMobile ? 8.5 : 10.5;
      txt(ctx, ch.short, cx, y + 34, labelFont, ch.text, 'center', 'ui-monospace, monospace', 900);
      txt(ctx, ch.sub, cx, y + 49, isMobile ? 7.5 : 9, '#c7d3df', 'center', 'system-ui, sans-serif', 600);
    }

    // Draw tank pile (back layer to front layer)
    const sortedPile = [...tankPeople].sort((a, b) => (a.layer || 0) - (b.layer || 0) || a.y - b.y);
    const spriteScale = isMobile ? 0.92 : 1.05;
    for (const p of sortedPile) {
      const bob = p.droppingIn ? 0 : Math.sin(time * 2.2 + p.bobOffset) * 1.4;
      drawPrecario(ctx, { ...p, y: p.y + bob }, spriteScale, p.tilt);
    }

    // Occasional hopeful whisper bubble from a random precario in tank
    if (tankWhisper.timer > 0 && tankWhisper.text) {
      const speaker = tankPeople.find(p => p.id === tankWhisper.personId) || tankPeople[0];
      if (speaker) {
        ctx.save();
        ctx.font = '700 10.5px system-ui, sans-serif';
        const bw = Math.min(180, ctx.measureText(tankWhisper.text).width + 18);
        const bx = Math.max(gl.x + 8, Math.min(gl.x + gl.w - bw - 8, speaker.x - bw / 2));
        const by = speaker.y - 74;
        round(ctx, bx, by, bw, 22, 7, '#f4efe2f0', '#607891', 1.4);
        txt(ctx, tankWhisper.text, bx + bw / 2, by + 14.5, 10.5, '#192432', 'center', 'system-ui, sans-serif', 700);
        ctx.restore();
      }
    }

    // Dangling / falling grabbed precario
    if (state.grabbed) {
      drawPrecario(ctx, state.grabbed, spriteScale * 1.06, state.grabbed.dangling ? state.clawAngle * 1.5 : state.slipRot);
    }

    // Spring boot animation during Rettifica d'Ufficio
    if (state.phase === 'fakeoutEject' && state.ejectBootProgress > 0) {
      const bx = g.chuteXs[0];
      const by = g.chuteY + 8 - Math.sin(Math.min(1, state.ejectBootProgress) * Math.PI) * 52;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(-0.35);
      round(ctx, -18, -12, 36, 20, 6, '#d94a56', '#fff2d8', 2);
      txt(ctx, 'NO!', 0, 3, 11, '#fff', 'center', 'ui-monospace, monospace', 900);
      ctx.restore();
    }

    // Aiming dashed line when in 'aim'
    if (state.phase === 'aim' && !COVER_MODE) {
      ctx.save();
      ctx.strokeStyle = '#d9f48244';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(state.clawX, state.clawY + 26);
      ctx.lineTo(state.clawX, g.pileFloorY - 22);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Trolley, Cable & 3-Prong Claw
    drawClaw(g);

    // Subtle glass glare reflection on top
    ctx.save();
    round(ctx, gl.x, gl.y, gl.w, gl.h, 10);
    ctx.clip();
    ctx.strokeStyle = '#ffffff16';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(gl.x + 20, gl.y + 120);
    ctx.lineTo(gl.x + 150, gl.y - 10);
    ctx.moveTo(gl.x + gl.w - 130, gl.y + gl.h);
    ctx.lineTo(gl.x + gl.w + 20, gl.y + gl.h - 150);
    ctx.stroke();
    ctx.restore();

    // Bottom cabinet bezel label
    const footY = gl.y + gl.h + 12;
    const footH = cab.y + cab.h - footY - 10;
    round(ctx, cab.x + 18, footY, cab.w - 36, footH, 8, '#1a2434', '#394b63', 1.5);
    txt(
      ctx,
      COVER_MODE ? 'SCELTA CASUALE MA SEMPRE PEGGIORE' : 'GETTONI: ∞ (SEI DI RUOLO)  ·  CLICCA UN PRECARIO PER IL DOSSIER',
      cab.x + cab.w / 2,
      footY + footH * 0.62,
      isMobile ? 9.5 : 11,
      '#99adc4',
      'center',
      'ui-monospace, monospace',
      700
    );

    // Confetti particles
    for (const c of confetti) {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawClaw(g) {
    const x = state.clawX;
    const y = state.clawY;
    const railY = g.railY;

    // Trolley on rail
    round(ctx, x - 24, railY - 12, 48, 20, 6, '#b8c8db', '#394b63', 2);
    round(ctx, x - 8, railY - 5, 16, 8, 3, '#e6c36a', '#5c4216', 1.2);

    // Cable
    ctx.strokeStyle = '#c8d6e5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, railY + 8);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Claw head & swinging prongs
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(state.clawAngle);

    // Hub
    round(ctx, -14, -8, 28, 16, 5, '#d8e3ee', '#314256', 2);
    ctx.fillStyle = sirenTimer > 0 ? '#ff6470' : '#d9f482';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    const spread = 0.25 + state.clawOpen * 0.55;
    // Left prong
    ctx.save();
    ctx.translate(-9, 6);
    ctx.rotate(spread);
    ctx.strokeStyle = '#dbe6f2';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, 18);
    ctx.lineTo(-4, 34);
    ctx.stroke();
    ctx.restore();

    // Right prong
    ctx.save();
    ctx.translate(9, 6);
    ctx.rotate(-spread);
    ctx.strokeStyle = '#dbe6f2';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(14, 18);
    ctx.lineTo(4, 34);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  function drawCoverOverlay(g) {
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
    drawCoverOverlay(g);
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
    state.clawOpen = 0.85;
    setStatus('● ALGORITMO MIM · DISCESA IN CORSO…');
    setProfBubble('aim');
    if (btnDrop) btnDrop.disabled = true;
  }

  function pickTargetPerson() {
    let best = null;
    let bestDist = Infinity;
    for (const p of tankPeople) {
      const dist = Math.abs(p.x - state.clawX);
      // Prioritize tagged custom colleague if fairly close
      const bonus = p.id === targetedId ? 42 : 0;
      if (dist - bonus < bestDist) {
        bestDist = dist - bonus;
        best = p;
      }
    }
    if (best && Math.abs(best.x - state.clawX) <= 78) {
      return best;
    }
    // Generous magnet: grab the nearest top precario
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
    state.clawOpen = 0.72;
    sirenTimer = 0;
    if (btnDrop) btnDrop.disabled = false;

    const g = layout();
    state.clawY = g.railY + 46;

    stats.infrante += 1;
    stats.unlocked[outcome.id] = (stats.unlocked[outcome.id] || 0) + 1;
    saveStats();
    renderScoreboard();
    renderAlbum();

    // Update decree
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
    setProfBubble(isRettifica ? 'rettifica' : 'afterDrop');
    toast(isRettifica
      ? `RETTIFICA D'UFFICIO! ${lastDecree.person.name} spedito a ${lastDecree.chute.code}!`
      : `${lastDecree.person.name} → ${lastDecree.chute.code}! Decreto pronto sotto.`);

    // If that was the tagged custom colleague, clear active colleague tag for next random grabs
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
    if (flashComoda > 0) {
      flashComoda = Math.max(0, flashComoda - dt);
      if (flashComoda === 0 && statComodeEl) {
        statComodeEl.classList.remove('flash-comoda', 'flash-rettifica');
        statComodeEl.textContent = '0';
      }
    }

    profBubble.timer -= dt;
    if (profBubble.timer <= 0) setProfBubble('idle');

    tankWhisper.timer -= dt;
    if (tankWhisper.timer <= 0 && tankPeople.length) {
      const rp = tankPeople[Math.floor(Math.random() * tankPeople.length)];
      tankWhisper = {
        personId: rp.id,
        text: TANK_WHISPERS[Math.floor(Math.random() * TANK_WHISPERS.length)],
        timer: 3.4
      };
    }

    // Settle newly dropped replacements in tank
    for (const p of tankPeople) {
      if (p.droppingIn) {
        p.vy += 680 * dt;
        p.y += p.vy * dt;
        if (p.y >= p.homeY) {
          p.y = p.homeY;
          p.vy = 0;
          p.droppingIn = false;
        }
      }
    }

    // Confetti
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      c.life -= dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 320 * dt;
      if (c.life <= 0) confetti.splice(i, 1);
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
        state.clawX = Math.max(g.minX, Math.min(g.maxX, state.clawX + moveDir * (isMobile ? 250 : 320) * dt));
        state.clawAngle = Math.max(-0.18, Math.min(0.18, state.clawAngle * 0.85 - moveDir * 0.06));
        window.ClawAudio?.play('move');
      } else if (state.autoAimX !== null) {
        const dx = state.autoAimX - state.clawX;
        if (Math.abs(dx) < 4) {
          state.clawX = state.autoAimX;
          state.autoAimX = null;
          state.clawAngle *= 0.85;
        } else {
          const step = Math.sign(dx) * Math.min(Math.abs(dx), 420 * dt);
          state.clawX += step;
          state.clawAngle = -Math.sign(dx) * 0.08;
        }
      } else {
        state.clawAngle *= Math.pow(0.05, dt);
      }
      return;
    }

    state.timer += dt;

    if (state.phase === 'descend') {
      const targetY = g.pileFloorY - 56;
      state.clawY = Math.min(targetY, state.clawY + 340 * dt);
      // Slight homing onto nearest precario during descent
      const candidate = pickTargetPerson();
      if (candidate) {
        const dx = candidate.x - state.clawX;
        state.clawX += dx * Math.min(1, 5 * dt);
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
        state.clawOpen = 0.22;
        state.phase = 'grab';
        state.timer = 0;

        dropsCount += 1;
        state.isFakeout = (!seenFakeout && dropsCount >= 5) || Math.random() < 0.12;
        if (state.isFakeout) seenFakeout = true;
        state.targetChute = state.isFakeout ? (Math.random() < 0.5 ? 1 : 2) : 1 + Math.floor(Math.random() * 4);
        state.plannedOutcome = chooseOutcome(state.targetChute);
        state.carriedToGoal = false;

        window.ClawAudio?.play('grab');
        haptic([25, 20]);
        setProfBubble('grab');
        toast(`Preso ${caught.name}! Direzione: 18h sotto casa…`);
      }
      return;
    }

    if (state.phase === 'grab') {
      if (state.grabbed) {
        state.grabbed.x = state.clawX;
        state.grabbed.y = state.clawY + 52;
      }
      if (state.timer >= 0.28) {
        state.phase = 'ascend';
        state.timer = 0;
      }
      return;
    }

    if (state.phase === 'ascend') {
      const topY = g.railY + 46;
      state.clawY = Math.max(topY, state.clawY - 250 * dt);
      if (state.grabbed) {
        state.grabbed.x = state.clawX;
        state.grabbed.y = state.clawY + 52;
      }
      if (state.clawY <= topY) {
        state.phase = 'carry';
        state.timer = 0;
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
      const speed = state.carriedToGoal ? 290 : 210;
      const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      state.clawX += step;
      state.clawAngle = Math.sin(time * 12) * 0.08 - Math.sign(dx) * 0.07;

      if (state.grabbed) {
        state.grabbed.x = state.clawX;
        state.grabbed.y = state.clawY + 52;
      }

      if (!state.isFakeout && !state.carriedToGoal) {
        // Head toward Chute 0 first until passing near Chute 1 or 0.55s elapsed, then trigger siren!
        if (Math.abs(state.clawX - goalX) < g.chuteW * 0.72 || state.timer > 0.75) {
          state.carriedToGoal = true;
          sirenTimer = 2.1;
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
          for (let k = 0; k < 22; k++) {
            confetti.push({
              x: goalX,
              y: g.chuteY + 10,
              vx: (Math.random() - 0.5) * 240,
              vy: -90 - Math.random() * 140,
              life: 1.0,
              color: k % 2 ? '#d9f482' : '#e6c36a'
            });
          }
          window.ClawAudio?.play('coffee');
          setProfBubble('fakeoutWin');
          toast('INCREDIBILE! 18 ORE SOTTO CASA?!');
        } else {
          state.phase = 'pauseSiren';
          state.timer = 0;
        }
      }
      return;
    }

    if (state.phase === 'pauseSiren') {
      // Shudder above bad chute before slipping
      state.clawAngle = Math.sin(time * 42) * 0.14;
      if (state.grabbed) {
        state.grabbed.x = state.clawX + Math.sin(time * 40) * 3;
        state.grabbed.y = state.clawY + 52;
      }
      if (state.timer >= 0.42) {
        state.phase = 'slip';
        state.timer = 0;
        state.clawOpen = 0.92;
        state.slipStartX = state.clawX;
        state.slipStartY = state.clawY + 52;
        state.slipRot = 0;
        window.ClawAudio?.play('slip');
      }
      return;
    }

    if (state.phase === 'slip') {
      const dur = 0.52;
      const t = Math.min(1, state.timer / dur);
      const targetY = g.chuteY + 36;
      const targetX = g.chuteXs[state.targetChute];
      if (state.grabbed) {
        state.grabbed.x = state.slipStartX + (targetX - state.slipStartX) * t;
        state.grabbed.y = state.slipStartY + (targetY - state.slipStartY) * (t * t);
        state.slipRot = t * (state.targetChute % 2 ? 1.8 : -1.8);
      }
      if (t >= 1) {
        window.ClawAudio?.play('chute');
        haptic([35, 30, 50]);
        finishCatch(state.plannedOutcome);
      }
      return;
    }

    if (state.phase === 'fakeoutPause') {
      const p = state.grabbed;
      if (p) {
        const dropT = Math.min(1, state.timer / 0.35);
        p.x = state.dropStartX;
        p.y = state.dropStartY + (state.dropTargetY - state.dropStartY) * (dropT * dropT);
      }
      if (state.timer >= 0.95) {
        state.phase = 'fakeoutEject';
        state.timer = 0;
        sirenTimer = 2.0;
        state.ejectBootProgress = 0;
        if (statComodeEl) {
          statComodeEl.classList.remove('flash-comoda');
          statComodeEl.classList.add('flash-rettifica');
          statComodeEl.textContent = '0';
          flashComoda = 1.2;
        }
        window.ClawAudio?.play('rettifica');
        haptic([60, 40, 90]);
        setStatus('⚠ RETTIFICA D’UFFICIO MIM IN CORSO!', true);
        setProfBubble('rettifica');
        toast('⚠ RETTIFICA D’UFFICIO! Troppo bello per essere vero!');
      }
      return;
    }

    if (state.phase === 'fakeoutEject') {
      const dur = 0.72;
      const t = Math.min(1, state.timer / dur);
      state.ejectBootProgress = t * 2.2;
      const startX = g.chuteXs[0];
      const endX = g.chuteXs[state.targetChute];
      const baseY = g.chuteY + 34;
      if (state.grabbed) {
        state.grabbed.x = startX + (endX - startX) * t;
        state.grabbed.y = baseY - Math.sin(t * Math.PI) * 180;
        state.slipRot = t * 6.2;
      }
      if (t >= 1) {
        window.ClawAudio?.play('chute');
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

    // Dark framing + Cream parchment slip
    o.fillStyle = '#101726';
    o.fillRect(0, 0, cardW, cardH);
    round(o, 24, 24, cardW - 48, cardH - 48, 18, '#f4efe2', '#d2c5a6', 3);

    // Header band
    o.fillStyle = '#5e5544';
    o.font = '800 14px ui-monospace, monospace';
    o.fillText("MINISTERO DELL'ISTRUZIONE E DEL MERITO (MOLTO PROVVISORIO)", 54, 68);
    o.fillStyle = '#7c6f56';
    o.font = '700 14px ui-monospace, monospace';
    o.fillText(`${prot} · ALGORITMO MIM v0.9b`, 54, 94);

    // Divider
    o.strokeStyle = '#d3c6ab';
    o.lineWidth = 2;
    o.beginPath();
    o.moveTo(54, 114);
    o.lineTo(cardW - 54, 114);
    o.stroke();

    // Red Slanted Rubber Stamp
    o.save();
    o.translate(cardW - 180, 92);
    o.rotate(-0.12);
    round(o, -110, -26, 220, 52, 6, '#be2a3a14', '#be2a3a', 4);
    o.fillStyle = '#be2a3a';
    o.font = '900 15px ui-monospace, monospace';
    o.textAlign = 'center';
    o.fillText(isRettifica ? 'RETTIFICATO D’UFFICIO' : 'ASSEGNATO D’UFFICIO', 0, 6);
    o.restore();

    // Avatar card
    round(o, 54, 140, 128, 142, 14, '#e7dec8', '#c6b898', 2);
    drawPrecario(o, { ...person, x: 118, y: 248, dir: 1, dangling: false, startled: true, customName: '' }, 2.35, 0);

    // Name & class (auto-scale name so long colleague names never clip)
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

    // Decree body box
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

    // Sign-off & Footer
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

  // Controls binding (holdable buttons)
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

  // Canvas tap (dossier) + horizontal drag (aim)
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

    // Check click on a precario inside tank
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
      // Tapping empty space in upper tank slides claw horizontally
      const g = layout();
      if (clickX >= g.glass.x && clickX <= g.glass.x + g.glass.w && clickY < g.chuteY) {
        window.ClawAudio?.arm();
        state.autoAimX = Math.max(g.minX, Math.min(g.maxX, clickX));
      }
    }
  });

  // Keyboard support
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

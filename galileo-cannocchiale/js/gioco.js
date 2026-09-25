(function () {
  const DURATA = 10 * 60;

  const TAPPE = [
    {
      scena: "pisa",
      domanda: "Dove nasce Galileo Galilei, nel 1564?",
      scelte: [
        { t: "A Pisa", ok: true },
        { t: "A Roma", ok: false },
        { t: "A Venezia", ok: false },
      ],
      si: "Sì. Nasce a Pisa nel 1564.",
      no: "No. Nasce a Pisa, nel 1564.",
      ricorda: "Nasce a Pisa nel 1564.",
    },
    {
      scena: "cannocchiale",
      domanda: "Nel 1609 punta uno strumento verso il cielo. Cos’è?",
      scelte: [
        { t: "Una macchina fotografica", ok: false },
        { t: "Un cannocchiale che ha migliorato", ok: true },
        { t: "Un microscopio", ok: false },
      ],
      si: "Sì. Non lo inventa da zero: lo migliora e lo punta al cielo.",
      no: "No. Migliora un cannocchiale e lo punta al cielo. Non lo inventa da zero.",
      ricorda: "Migliora il cannocchiale e lo punta al cielo.",
    },
    {
      scena: "luna",
      domanda: "Cosa vede sulla Luna?",
      scelte: [
        { t: "Una superficie liscia e perfetta", ok: false },
        { t: "Una faccia che sorride", ok: false },
        { t: "Montagne e crateri", ok: true },
      ],
      si: "Sì. La Luna non è una palla liscia.",
      no: "No. Vede montagne e crateri. La Luna non è liscia.",
      ricorda: "Sulla Luna ci sono montagne e crateri.",
    },
    {
      scena: "giove",
      domanda: "Intorno a Giove, nel 1610, cosa scopre?",
      scelte: [
        { t: "Quattro lune", ok: true },
        { t: "Un anello come quello di Saturno", ok: false },
        { t: "Niente: Giove è solo un punto", ok: false },
      ],
      si: "Sì. Quattro lune. Le chiama stelle medicee.",
      no: "No. Scopre quattro lune. Le chiama stelle medicee.",
      ricorda: "Giove ha quattro lune: le stelle medicee.",
    },
    {
      scena: "venere",
      domanda: "Venere mostra le fasi, come la Luna. Questo vuol dire che…",
      scelte: [
        { t: "Venere è una stella fissa", ok: false },
        { t: "La Terra sta ferma al centro", ok: false },
        { t: "Venere gira intorno al Sole", ok: true },
      ],
      si: "Sì. Le fasi di Venere mostrano che gira intorno al Sole.",
      no: "No. Le fasi mostrano che Venere gira intorno al Sole.",
      ricorda: "Le fasi di Venere: gira intorno al Sole.",
    },
    {
      scena: "caduta",
      domanda: "Due palle, una pesante e una leggera, cadono dalla stessa altezza. Senza aria, chi arriva prima?",
      scelte: [
        { t: "Arrivano insieme", ok: true },
        { t: "Sempre la più pesante", ok: false },
        { t: "Sempre la più leggera", ok: false },
      ],
      si: "Sì. Il peso non decide chi arriva prima. Lo studia con il piano inclinato.",
      no: "No. Arrivano insieme. Il peso non decide. La storia della Torre di Pisa è un racconto.",
      ricorda: "Senza aria, pesante e leggero cadono insieme.",
    },
    {
      scena: "processo",
      domanda: "Nel 1633 il tribunale della Chiesa cosa gli fa?",
      scelte: [
        { t: "Lo fa papa", ok: false },
        { t: "Lo condanna e lo tiene in casa", ok: true },
        { t: "Gli dà un premio", ok: false },
      ],
      si: "Sì. Deve rinnegare l’idea che la Terra giri intorno al Sole. Resta agli arresti ad Arcetri, vicino a Firenze.",
      no: "No. Lo condannano. Resta agli arresti in casa, ad Arcetri.",
      ricorda: "Nel 1633 è condannato: arresti in casa ad Arcetri.",
    },
    {
      scena: "libro",
      domanda: "Il Dialogo sopra i due massimi sistemi in che lingua è scritto?",
      scelte: [
        { t: "Solo in latino", ok: false },
        { t: "In francese", ok: false },
        { t: "In italiano", ok: true },
      ],
      si: "Sì. Lo scrive in italiano, perché lo capiscano in tanti.",
      no: "No. Il Dialogo è in italiano, non solo per i dotti.",
      ricorda: "Il Dialogo è scritto in italiano.",
    },
  ];

  const SCENE = {
    pisa: `<svg viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" fill="#1a2744"/>
      <circle cx="150" cy="42" r="16" fill="#f3e2b0"/>
      <path d="M78 168 L92 48 L118 48 L132 168 Z" fill="#d7c4a2"/>
      <path d="M86 150 h28 M88 128 h30 M90 106 h30 M92 84 h28 M96 62 h24" stroke="#8d7348" stroke-width="3"/>
      <rect x="40" y="168" width="120" height="8" fill="#6e5a3a"/>
    </svg>`,
    cannocchiale: `<svg viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" fill="#10182e"/>
      <circle cx="40" cy="36" r="1.4" fill="#fff"/><circle cx="150" cy="28" r="1.2" fill="#fff"/><circle cx="170" cy="70" r="1" fill="#fff"/><circle cx="30" cy="90" r="1.1" fill="#fff"/>
      <g transform="rotate(-28 100 110)">
        <rect x="48" y="96" width="108" height="22" rx="11" fill="#c6a15a"/>
        <rect x="146" y="90" width="22" height="34" rx="6" fill="#8d6a32"/>
        <rect x="36" y="100" width="18" height="14" rx="4" fill="#6b5228"/>
      </g>
    </svg>`,
    luna: `<svg viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" fill="#0c1428"/>
      <circle cx="100" cy="100" r="62" fill="#e7e1d4"/>
      <circle cx="78" cy="78" r="14" fill="#c9c2b2"/><circle cx="118" cy="92" r="10" fill="#cfc8b8"/>
      <circle cx="96" cy="124" r="16" fill="#bdb6a6"/><circle cx="130" cy="124" r="7" fill="#d5cec0"/>
      <circle cx="70" cy="116" r="6" fill="#d4cdbf"/>
    </svg>`,
    giove: `<svg viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" fill="#0c1428"/>
      <circle cx="100" cy="100" r="36" fill="#e6c48a"/>
      <ellipse cx="100" cy="92" rx="36" ry="6" fill="#c99555" opacity=".7"/>
      <ellipse cx="100" cy="112" rx="34" ry="5" fill="#f0d7a8" opacity=".8"/>
      <circle cx="28" cy="100" r="5" fill="#f4efe4"/><circle cx="52" cy="100" r="4" fill="#d9d3c6"/>
      <circle cx="150" cy="100" r="4.5" fill="#f4efe4"/><circle cx="172" cy="100" r="3.5" fill="#d9d3c6"/>
    </svg>`,
    venere: `<svg viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" fill="#140e22"/>
      <circle cx="158" cy="46" r="18" fill="#f6e7a8"/>
      <g fill="#f3d48a" stroke="#140e22" stroke-width="0">
        <circle cx="46" cy="120" r="16"/>
        <path d="M78 104 a16 16 0 1 0 0 32 a10 16 0 1 1 0-32z"/>
        <path d="M118 104 a16 16 0 0 1 0 32 a16 16 0 0 1 0-32z" fill="#f3d48a"/>
        <path d="M118 104 a16 16 0 0 0 0 32z" fill="#140e22"/>
        <circle cx="154" cy="120" r="16" fill="#3a2a18" stroke="#f3d48a" stroke-width="3"/>
      </g>
    </svg>`,
    caduta: `<svg viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" fill="#1c2438"/>
      <rect x="24" y="150" width="152" height="10" rx="2" fill="#8d7348"/>
      <circle cx="70" cy="78" r="16" fill="#d7c4a2"/><circle cx="118" cy="96" r="28" fill="#c6a15a"/>
      <path d="M70 40 v18 M118 48 v16" stroke="#f4efe4" stroke-width="2" stroke-dasharray="3 3"/>
    </svg>`,
    processo: `<svg viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" fill="#24180f"/>
      <rect x="54" y="36" width="92" height="120" rx="2" fill="#3a2416"/>
      <rect x="64" y="48" width="30" height="40" fill="#f3e2b0"/><rect x="106" y="48" width="30" height="40" fill="#f3e2b0"/>
      <path d="M79 48 v40 M121 48 v40 M64 68 h30 M106 68 h30" stroke="#3a2416" stroke-width="2"/>
      <rect x="86" y="112" width="28" height="44" fill="#6b3a22"/>
    </svg>`,
    libro: `<svg viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" fill="#1a140e"/>
      <path d="M36 48 h64 c8 10 8 94 0 108 H36z" fill="#f4efe4"/>
      <path d="M164 48 h-64 c-8 10 -8 94 0 108 h64z" fill="#e7dcc4"/>
      <path d="M100 56 v96" stroke="#8d7348" stroke-width="3"/>
      <path d="M48 78 h40 M48 92 h36 M112 78 h36 M112 92 h32" stroke="#8d7348" stroke-width="2"/>
    </svg>`,
  };

  const vista = document.getElementById("vista");
  const tappaEl = document.getElementById("tappa");
  const puntiEl = document.getElementById("punti");
  const tempoEl = document.getElementById("tempo");
  const domandaEl = document.getElementById("domanda");
  const scelteEl = document.getElementById("scelte");
  const esitoEl = document.getElementById("esito");
  const avantiBtn = document.getElementById("avanti");
  const start = document.getElementById("start");
  const play = document.getElementById("play");
  const fine = document.getElementById("fine");
  const inizia = document.getElementById("inizia");
  const rigioca = document.getElementById("rigioca");
  const votoEl = document.getElementById("voto");
  const ricordaEl = document.getElementById("ricorda");

  let indice = 0;
  let punti = 0;
  let bloccato = false;
  let secondi = DURATA;
  let timer = null;

  function formatta(s) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + String(r).padStart(2, "0");
  }

  function tick() {
    if (secondi <= 0) {
      tempoEl.textContent = "0:00";
      tempoEl.classList.add("scaduto");
      return;
    }
    secondi -= 1;
    tempoEl.textContent = formatta(secondi);
    if (secondi <= 120) tempoEl.classList.add("basso");
  }

  function mostraTappa() {
    const tappa = TAPPE[indice];
    bloccato = false;
    vista.innerHTML = SCENE[tappa.scena];
    tappaEl.textContent = indice + 1 + " di " + TAPPE.length;
    puntiEl.textContent = String(punti);
    domandaEl.textContent = tappa.domanda;
    esitoEl.hidden = true;
    esitoEl.textContent = "";
    avantiBtn.hidden = true;
    scelteEl.hidden = false;
    scelteEl.innerHTML = "";
    tappa.scelte.forEach((scelta) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scelta";
      btn.textContent = scelta.t;
      btn.addEventListener("click", () => rispondi(scelta, btn));
      scelteEl.appendChild(btn);
    });
  }

  function rispondi(scelta, btn) {
    if (bloccato) return;
    bloccato = true;
    const tappa = TAPPE[indice];
    scelteEl.querySelectorAll("button").forEach((b) => {
      b.disabled = true;
    });
    if (scelta.ok) {
      punti += 1;
      btn.classList.add("giusta");
      esitoEl.textContent = tappa.si;
    } else {
      btn.classList.add("sbagliata");
      scelteEl.querySelectorAll("button").forEach((b, i) => {
        if (tappa.scelte[i].ok) b.classList.add("giusta");
      });
      esitoEl.textContent = tappa.no;
    }
    puntiEl.textContent = String(punti);
    esitoEl.hidden = false;
    avantiBtn.hidden = false;
    avantiBtn.focus();
  }

  function chiudi() {
    clearInterval(timer);
    play.hidden = true;
    fine.hidden = false;
    votoEl.textContent = punti + " su " + TAPPE.length;
    ricordaEl.innerHTML = "";
    TAPPE.forEach((tappa) => {
      const li = document.createElement("li");
      li.textContent = tappa.ricorda;
      ricordaEl.appendChild(li);
    });
  }

  function avvia() {
    indice = 0;
    punti = 0;
    secondi = DURATA;
    tempoEl.classList.remove("basso", "scaduto");
    tempoEl.textContent = formatta(secondi);
    start.hidden = true;
    fine.hidden = true;
    play.hidden = false;
    clearInterval(timer);
    timer = setInterval(tick, 1000);
    mostraTappa();
  }

  avantiBtn.addEventListener("click", () => {
    indice += 1;
    if (indice >= TAPPE.length) chiudi();
    else mostraTappa();
  });

  inizia.addEventListener("click", avvia);
  rigioca.addEventListener("click", avvia);
})();

(function () {
  "use strict";

  const CAPITOLI = [
    { label: "Prologo", min: 0 },
    { label: "Menlo", min: 1 },
    { label: "Manhattan", min: 3 },
    { label: "Guerra", min: 5 },
    { label: "Tesla", min: 7 },
    { label: "Chicago", min: 11 },
    { label: "Epilogo", min: 13 },
  ];

  const SCENE = [
    {
      cap: "Prologo",
      tag: "Dopo il film",
      img: "img/player.png",
      bgPos: "50% 20%",
      portrait: null,
      nome: "Prof.",
      ruolo: "Tecnologie elettriche",
      testo:
        "Hai visto Edison — L'uomo che illuminò il mondo (2017). Seguiamo le tappe del film con le stesse immagini del materiale: laboratorio, città, rivalità, Expo, kinetoscopio.",
    },
    {
      cap: "Menlo Park",
      tag: "Laboratorio",
      img: "img/hero-menlo.png",
      bgPos: "55% 40%",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Menlo Park, 1870",
      testo:
        "Non basta un lampo di luce. Mi serve un filamento che resti acceso ore — altrimenti la lampadina non cambia la vita delle persone.",
      nota: "Energia elettrica → luce e calore nel filamento.",
    },
    {
      cap: "Menlo Park",
      tag: "Filamenti",
      img: "img/hero-menlo.png",
      bgPos: "50% 55%",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Prove",
      testo:
        "Provo, brucio, ricomincio. Nel film la lampadina «che dura» nasce qui, non in un solo giorno di fortuna.",
    },
    {
      cap: "Manhattan",
      tag: "Corrente continua",
      img: "img/bg-manhattan.png",
      bgPos: "50% 55%",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Progetto CC",
      testo:
        "Passo alla città: illuminare Manhattan. Scelgo la corrente continua (CC) — gli elettroni vanno sempre nello stesso verso, come in una pila.",
      nota: "CC: utile vicino all'impianto; sulle lunghe distanze perde efficacia.",
    },
    {
      cap: "Manhattan",
      tag: "J.P. Morgan",
      img: "img/bg-manhattan.png",
      bgPos: "50% 45%",
      portrait: null,
      nome: "Narratore",
      ruolo: "Soldi e luce",
      testo:
        "J.P. Morgan finanzia il sogno. Senza investitori, lampioni e cavi restano solo esperimenti chiusi in un laboratorio.",
    },
    {
      cap: "Guerra delle correnti",
      tag: "Westinghouse",
      img: "img/npc-westinghouse-tesla.png",
      bgPos: "50% 25%",
      portrait: null,
      nome: "Westinghouse",
      ruolo: "Proposta",
      testo:
        "Nel film propongo a Edison di lavorare insieme. Lui rifiuta. Da quel momento non è più solo tecnica: è guerra di brevetti, soldi e stampa.",
    },
    {
      cap: "Guerra delle correnti",
      tag: "Ripasso",
      img: "img/bg-manhattan.png",
      bgPos: "50% 50%",
      portrait: "img/player.png",
      nome: "Prof.",
      ruolo: "Domanda",
      testo: "Cosa succede quando Edison rifiuta la collaborazione con Westinghouse?",
      scelte: [
        {
          label: "Accettano e la rivalità finisce subito",
          ok: false,
          nota: "No: nel film Edison rifiuta — nasce la «guerra delle correnti».",
        },
        {
          label: "Edison rifiuta — inizia la guerra delle correnti",
          ok: true,
          nota: "Esatto. Competizione su CC, CA, brevetti e immagine.",
        },
      ],
    },
    {
      cap: "Tesla",
      tag: "Promessa",
      img: "img/hero-menlo.png",
      bgPos: "48% 45%",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Capo laboratorio",
      testo:
        "Nikola Tesla lavora per me. Gli prometto una ricompensa che nel film non arriva. Lui se ne va — deluso.",
    },
    {
      cap: "Tesla",
      tag: "Corrente alternata",
      img: "img/npc-westinghouse-tesla.png",
      bgPos: "50% 30%",
      portrait: null,
      nome: "Tesla",
      ruolo: "Con Westinghouse",
      testo:
        "Passo da Westinghouse. Sviluppiamo la corrente alternata (CA): nel filo va avanti e indietro, molte volte al secondo. I trasformatori portano energia lontano.",
      nota: "In Italia oggi: CA 230 V · 50 Hz in casa.",
    },
    {
      cap: "CA vs CC",
      tag: "Ripasso",
      img: "img/bg-chicago.png",
      bgPos: "50% 40%",
      portrait: "img/player.png",
      nome: "Prof.",
      ruolo: "Domanda",
      testo: "Quale affermazione è vera nel film e in tecnologie elettriche?",
      scelte: [
        {
          label: "La CA serve sulle lunghe distanze (con trasformatori)",
          ok: true,
          nota: "Giusto. Westinghouse e Tesla puntano su questo.",
        },
        {
          label: "La CC è l'unica corrente usata in tutte le case oggi",
          ok: false,
          nota: "No. In casa abbiamo CA; la CC resta in pile ed elettronica.",
        },
      ],
    },
    {
      cap: "Stampa",
      tag: "Campagna mediatica",
      img: "img/bg-manhattan.png",
      bgPos: "50% 50%",
      portrait: "img/player.png",
      nome: "Narratore",
      ruolo: "Opinione pubblica",
      testo:
        "Edison attacca la CA anche sui giornali — la descrive pericolosa. Nel film è battaglia di idee e titoli, non violenza: conta cosa crede la gente.",
      nota: "Ripasso: immagine pubblica conta quanto il cavo.",
    },
    {
      cap: "Chicago 1893",
      tag: "Esposizione",
      img: "img/bg-chicago.png",
      bgPos: "50% 45%",
      portrait: null,
      nome: "Narratore",
      ruolo: "Appalto",
      testo:
        "All'Esposizione universale di Chicago (1893) si decide chi illumina la fiera intera. Non una lampadina sola: migliaia di luci insieme.",
    },
    {
      cap: "Chicago 1893",
      tag: "Vittoria CA",
      img: "img/bg-chicago.png",
      bgPos: "55% 50%",
      portrait: null,
      nome: "Westinghouse & Tesla",
      ruolo: "Sistema CA",
      testo:
        "Nel film Westinghouse e Tesla vincono l'illuminazione dell'Expo. La CA dimostra di reggere un evento enorme.",
    },
    {
      cap: "Kinetoscopio",
      tag: "Dopo la guerra",
      img: "img/hero-menlo.png",
      bgPos: "60% 50%",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Nuova invenzione",
      testo:
        "La guerra delle correnti non mi ferma. Mi dedico al kinetoscopio — immagini in movimento, i primi passi del cinema.",
      nota: "Altra frontiera dell'elettricità applicata.",
    },
    {
      cap: "Epilogo",
      tag: "Fine",
      img: "img/player.png",
      bgPos: "50% 25%",
      portrait: null,
      nome: "Prof.",
      ruolo: "Ripasso",
      testo:
        "Hai seguito il filo del film: Menlo Park, Manhattan in CC, rifiuto a Westinghouse, Tesla e CA, Chicago, kinetoscopio. Ora rileggi il fumetto o annota CC e CA sul quaderno.",
    },
  ];

  const elCap = document.getElementById("storia-cap");
  const elTag = document.getElementById("storia-tag");
  const elPasso = document.getElementById("storia-passo");
  const elBg = document.getElementById("storia-bg");
  const elSceneWrap = document.getElementById("storia-scene-wrap");
  const elPortrait = document.getElementById("storia-portrait");
  const elNome = document.getElementById("storia-nome");
  const elRuolo = document.getElementById("storia-ruolo");
  const elTesto = document.getElementById("storia-testo");
  const elNota = document.getElementById("storia-nota");
  const elActions = document.getElementById("storia-actions");
  const elHint = document.getElementById("storia-hint");
  const elProgress = document.getElementById("storia-progress-fill");
  const elProgressBar = document.getElementById("storia-progress");
  const elEnd = document.getElementById("storia-end");
  const elStage = document.getElementById("storia-stage");
  const elIntro = document.getElementById("storia-intro");
  const elRail = document.getElementById("storia-rail");
  const btnRestart = document.getElementById("storia-restart");
  const btnStart = document.getElementById("storia-start");

  if (!elTesto || !elActions) return;

  let index = 0;
  let started = false;
  let choiceLocked = false;
  const total = SCENE.length;
  const reduceMotion =
    document.body.classList.contains("reduced-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const imagesToPreload = [];
  SCENE.forEach((s) => {
    if (s.img && imagesToPreload.indexOf(s.img) === -1) imagesToPreload.push(s.img);
    if (s.portrait && imagesToPreload.indexOf(s.portrait) === -1) imagesToPreload.push(s.portrait);
  });
  imagesToPreload.forEach((src) => {
    const im = new Image();
    im.src = src;
  });

  function capitoloCorrente() {
    let cap = CAPITOLI[0].label;
    CAPITOLI.forEach((c) => {
      if (index >= c.min) cap = c.label;
    });
    return cap;
  }

  function buildRail() {
    if (!elRail) return;
    elRail.innerHTML = "";
    CAPITOLI.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "storia-rail-dot";
      b.textContent = c.label;
      b.addEventListener("click", () => {
        if (!started) return;
        index = c.min;
        choiceLocked = false;
        render();
      });
      elRail.appendChild(b);
    });
  }

  function syncRail() {
    if (!elRail) return;
    const cur = capitoloCorrente();
    elRail.querySelectorAll(".storia-rail-dot").forEach((dot) => {
      const label = dot.textContent;
      dot.classList.toggle("is-here", label === cur);
      const capDef = CAPITOLI.find((c) => c.label === label);
      dot.classList.toggle("is-done", capDef && index > capDef.min);
    });
  }

  function progressPct() {
    if (total <= 1) return 100;
    return Math.round((index / (total - 1)) * 100);
  }

  function advance(delta) {
    index = Math.max(0, Math.min(total - 1, index + delta));
    if (index >= total - 1 && delta > 0) {
      index = total;
    }
    choiceLocked = false;
    render();
  }

  function fadeScene(then) {
    if (!elSceneWrap || reduceMotion) {
      then();
      return;
    }
    elSceneWrap.classList.add("is-fade");
    window.setTimeout(() => {
      then();
      window.requestAnimationFrame(() => {
        elSceneWrap.classList.remove("is-fade");
      });
    }, 180);
  }

  function render() {
    if (!started) return;

    if (index >= total) {
      showEnd();
      return;
    }

    if (elEnd) elEnd.hidden = true;
    if (elStage) elStage.hidden = false;

    const s = SCENE[index];
    if (elCap) elCap.textContent = s.cap;
    if (elTag) elTag.textContent = s.tag;
    if (elPasso) elPasso.textContent = `Passo ${index + 1} di ${total}`;

    fadeScene(() => {
      if (elBg) {
        if (elBg.getAttribute("src") !== s.img) {
          elBg.classList.remove("is-loaded");
          elBg.src = s.img;
          elBg.onload = () => elBg.classList.add("is-loaded");
        } else {
          elBg.classList.add("is-loaded");
        }
        elBg.style.objectPosition = s.bgPos || "center center";
        elBg.alt = `${s.tag} — ${s.cap}`;
      }
    });

    if (elPortrait) {
      if (s.portrait) {
        elPortrait.src = s.portrait;
        elPortrait.hidden = false;
      } else {
        elPortrait.hidden = true;
      }
    }

    if (elNome) elNome.textContent = s.nome;
    if (elRuolo) elRuolo.textContent = s.ruolo;
    if (elTesto) elTesto.textContent = s.testo;

    if (elNota) {
      if (s.nota && !s.scelte) {
        elNota.textContent = s.nota;
        elNota.hidden = false;
      } else if (!s.scelte) {
        elNota.hidden = true;
      }
    }

    const pct = progressPct();
    if (elProgress) elProgress.style.width = `${pct}%`;
    if (elProgressBar) elProgressBar.setAttribute("aria-valuenow", String(pct));

    syncRail();

    elActions.innerHTML = "";
    const hasChoices = s.scelte && s.scelte.length;

    if (elHint) elHint.hidden = !!hasChoices;

    if (hasChoices) {
      if (elNota) elNota.hidden = true;
      s.scelte.forEach((ch) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "storia-choice";
        btn.textContent = ch.label;
        btn.addEventListener("click", () => {
          if (choiceLocked) return;
          if (ch.ok === false) {
            btn.classList.add("is-ko");
            if (elNota) {
              elNota.textContent = ch.nota || "Riprova.";
              elNota.hidden = false;
            }
            return;
          }
          choiceLocked = true;
          btn.classList.add("is-ok");
          elActions.querySelectorAll("button").forEach((b) => {
            b.disabled = true;
          });
          if (elNota) {
            elNota.textContent = ch.nota || "Avanti.";
            elNota.hidden = false;
          }
          window.setTimeout(() => {
            advance(1);
          }, 700);
        });
        elActions.appendChild(btn);
      });
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary storia-continue";
      btn.textContent = index >= total - 1 ? "Concludi" : "Continua →";
      btn.addEventListener("click", () => advance(1));
      elActions.appendChild(btn);
    }
  }

  function showEnd() {
    if (elStage) elStage.hidden = true;
    if (elEnd) elEnd.hidden = false;
    if (elProgress) elProgress.style.width = "100%";
    if (elProgressBar) elProgressBar.setAttribute("aria-valuenow", "100");
    if (elCap) elCap.textContent = "Fine";
    if (elPasso) elPasso.textContent = `Passo ${total} di ${total}`;
    syncRail();
  }

  function startStory() {
    started = true;
    index = 0;
    choiceLocked = false;
    if (elIntro) elIntro.hidden = true;
    if (elStage) elStage.hidden = false;
    render();
  }

  function restart() {
    started = true;
    index = 0;
    choiceLocked = false;
    if (elIntro) elIntro.hidden = true;
    render();
  }

  function resetAll() {
    started = false;
    index = 0;
    choiceLocked = false;
    if (elIntro) elIntro.hidden = false;
    if (elStage) elStage.hidden = true;
    if (elEnd) elEnd.hidden = true;
    if (elProgress) elProgress.style.width = "0%";
  }

  buildRail();

  if (btnStart) btnStart.addEventListener("click", startStory);
  if (btnRestart) {
    btnRestart.addEventListener("click", () => {
      if (started) restart();
      else startStory();
    });
  }
  document.querySelectorAll("[data-storia-restart]").forEach((b) => {
    b.addEventListener("click", restart);
  });

  document.addEventListener("keydown", (ev) => {
    if (!started || index >= total) return;
    const s = SCENE[index];
    if (s.scelte && s.scelte.length) return;
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      advance(1);
    }
  });

  resetAll();
})();

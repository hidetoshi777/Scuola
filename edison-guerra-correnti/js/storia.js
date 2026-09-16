(function () {
  "use strict";

  /** @typedef {{ label: string; next: number; ok?: boolean; nota?: string }} Scelta */

  const SCENE = [
    {
      cap: "Prologo",
      tag: "Dopo il film",
      img: "img/player.png",
      portrait: null,
      nome: "Prof.",
      ruolo: "Tecnologie elettriche",
      testo:
        "Hai visto Edison — L'uomo che illuminò il mondo (2017). Ora ripercorriamo le scene chiave con immagini e dialoghi brevi: lampadina, Manhattan, Tesla, Chicago.",
    },
    {
      cap: "Menlo Park",
      tag: "Laboratorio",
      img: "img/hero-menlo.png",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Menlo Park, New Jersey",
      testo:
        "Qui non basta accendere una lampadina per un attimo. Serve un filamento che resti acceso ore — altrimenti la luce non cambia il mondo.",
      nota: "Didattica: energia elettrica → luce + calore nel filamento.",
    },
    {
      cap: "Menlo Park",
      tag: "Prova dopo prova",
      img: "img/hero-menlo.png",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Inventore",
      testo: "Centinaia di test. Fallisco, cambio materiale, riprovo. Nel film la lampadina «che dura» nasce da questo laboratorio.",
    },
    {
      cap: "Manhattan",
      tag: "Corrente continua",
      img: "img/bg-manhattan.png",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Progetto CC",
      testo:
        "Ora penso in grande: illuminare Manhattan. Uso la corrente continua (CC): gli elettroni vanno sempre nello stesso verso, come in una batteria.",
      nota: "CC: simbolo batteria nelle icone del materiale. Vicino all'impianto funziona; sulle distanze lunghe è più difficile.",
    },
    {
      cap: "Manhattan",
      tag: "J.P. Morgan",
      img: "img/bg-manhattan.png",
      portrait: "img/player.png",
      nome: "Narratore",
      ruolo: "Finanziamenti",
      testo:
        "J.P. Morgan crede nel progetto e mette soldi. Senza investitori, lampadine e cavi restano solo esperimenti in laboratorio.",
    },
    {
      cap: "Guerra delle correnti",
      tag: "Proposta",
      img: "img/bg-manhattan.png",
      portrait: null,
      nome: "Westinghouse",
      ruolo: "Imprenditore",
      testo:
        "Nel film propongo a Edison di collaborare. Lui rifiuta. Da lì non è più solo scienza: è competizione, brevetti, stampa.",
    },
    {
      cap: "Guerra delle correnti",
      tag: "Scelta",
      img: "img/icons-collect.png",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Cosa rifiuta?",
      testo: "Cosa succede quando rifiuto Westinghouse?",
      scelte: [
        {
          label: "Accetto subito e chiudiamo la rivalità",
          ok: false,
          nota: "No: nel film Edison rifiuta e la competizione diventa «guerra delle correnti».",
        },
        {
          label: "Rifiuto — nasce la guerra delle correnti",
          ok: true,
          next: 7,
          nota: "Esatto: brevetti, soldi e immagine pubblica.",
        },
      ],
    },
    {
      cap: "Tesla",
      tag: "Da Edison…",
      img: "img/hero-menlo.png",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Capo laboratorio",
      testo:
        "Nikola Tesla lavora per me. Nel film gli prometto una ricompensa che poi non arriva. Lui se ne va deluso.",
    },
    {
      cap: "Tesla",
      tag: "…a Westinghouse",
      img: "img/npc-westinghouse-tesla.png",
      portrait: null,
      nome: "Tesla",
      ruolo: "Con Westinghouse",
      testo:
        "Passo a Westinghouse. Crediamo nella corrente alternata (CA): va avanti e indietro nel filo, molte volte al secondo. Con i trasformatori si porta energia lontano.",
      nota: "Oggi in Italia usiamo CA 230 V · 50 Hz in casa.",
    },
    {
      cap: "CA vs CC",
      tag: "Scelta tecnica",
      img: "img/icons-collect.png",
      portrait: "img/player.png",
      nome: "Prof.",
      ruolo: "Ripasso",
      testo: "Quale affermazione è vera nel film (e in tecno)?",
      scelte: [
        {
          label: "La CA conviene sulle lunghe distanze con trasformatori",
          ok: true,
          next: 10,
          nota: "Giusto: Tesla/Westinghouse puntano su questo.",
        },
        {
          label: "La CC è l'unica usata oggi in tutte le case",
          ok: false,
          nota: "No: in casa abbiamo CA alternata. La CC resta dove serve (pile, elettronica).",
        },
      ],
    },
    {
      cap: "Campagna mediatica",
      tag: "Stampa",
      img: "img/bg-manhattan.png",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Contro la CA",
      testo:
        "Edison attacca la CA anche con la stampa — la presenta pericolosa. Nel film è una battaglia di opinioni, non scene violente: conta cosa crede la gente.",
      nota: "Storicamente ci fu una dura campagna; in classe restiamo sul messaggio mediatico.",
    },
    {
      cap: "Chicago 1893",
      tag: "Esposizione universale",
      img: "img/bg-chicago.png",
      portrait: null,
      nome: "Narratore",
      ruolo: "Appalto",
      testo:
        "All'Esposizione di Chicago (1893) si decide chi illumina la fiera. È la prova del nove: non una lampadina sola, ma migliaia di luci accese insieme.",
    },
    {
      cap: "Chicago 1893",
      tag: "Vittoria CA",
      img: "img/bg-chicago.png",
      portrait: null,
      nome: "Westinghouse & Tesla",
      ruolo: "Sistema CA",
      testo:
        "Nel film Westinghouse e Tesla «vincono» l'illuminazione dell'Expo. La CA mostra di poter alimentare un evento enorme.",
    },
    {
      cap: "Kinetoscopio",
      tag: "Nuova strada",
      img: "img/hero-menlo.png",
      portrait: "img/player.png",
      nome: "Edison",
      ruolo: "Dopo la guerra",
      testo:
        "La guerra delle correnti non mi ferma. Mi concentro sul kinetoscopio: immagini che si muovono — i primi passi del cinema.",
      nota: "Invenzione diversa dalla lampadina, ma sempre elettricità e innovazione.",
    },
    {
      cap: "Epilogo",
      tag: "Fine storia",
      img: "img/player.png",
      portrait: null,
      nome: "Prof.",
      ruolo: "Ripasso",
      testo:
        "Hai ripercorso il film: Menlo Park, Manhattan in CC, rifiuto a Westinghouse, Tesla e CA, Chicago 1893, kinetoscopio. Ripassa CC e CA sul quaderno.",
    },
  ];

  const elCap = document.getElementById("storia-cap");
  const elTag = document.getElementById("storia-tag");
  const elBg = document.getElementById("storia-bg");
  const elPortrait = document.getElementById("storia-portrait");
  const elNome = document.getElementById("storia-nome");
  const elRuolo = document.getElementById("storia-ruolo");
  const elTesto = document.getElementById("storia-testo");
  const elNota = document.getElementById("storia-nota");
  const elActions = document.getElementById("storia-actions");
  const elProgress = document.getElementById("storia-progress-fill");
  const elEnd = document.getElementById("storia-end");
  const elStage = document.getElementById("storia-stage");
  const btnRestart = document.getElementById("storia-restart");

  if (!elTesto || !elActions) return;

  let index = 0;

  function progressPct() {
    return Math.round((index / (SCENE.length - 1)) * 100);
  }

  function render() {
    if (index >= SCENE.length) {
      showEnd();
      return;
    }
    if (elEnd) elEnd.hidden = true;
    if (elStage) elStage.hidden = false;

    const s = SCENE[index];
    if (elCap) elCap.textContent = s.cap;
    if (elTag) elTag.textContent = s.tag;
    if (elBg) {
      elBg.src = s.img;
      elBg.alt = s.tag + " — " + s.cap;
    }
    if (elPortrait) {
      if (s.portrait) {
        elPortrait.src = s.portrait;
        elPortrait.hidden = false;
        elPortrait.alt = "";
      } else {
        elPortrait.hidden = true;
      }
    }
    if (elNome) elNome.textContent = s.nome;
    if (elRuolo) elRuolo.textContent = s.ruolo;
    if (elTesto) elTesto.textContent = s.testo;
    if (elNota) {
      if (s.nota) {
        elNota.textContent = s.nota;
        elNota.hidden = false;
      } else {
        elNota.hidden = true;
      }
    }
    if (elProgress) elProgress.style.width = progressPct() + "%";

    elActions.innerHTML = "";
    if (s.scelte && s.scelte.length) {
      s.scelte.forEach((ch) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "storia-choice";
        btn.textContent = ch.label;
        btn.addEventListener("click", () => {
          if (ch.ok === false) {
            btn.classList.add("is-ko");
            if (elNota) {
              elNota.textContent = ch.nota || "Riprova.";
              elNota.hidden = false;
            }
            return;
          }
          btn.classList.add("is-ok");
          if (ch.nota && elNota) {
            elNota.textContent = ch.nota;
            elNota.hidden = false;
          }
          window.setTimeout(() => {
            index = typeof ch.next === "number" ? ch.next : index + 1;
            render();
          }, 600);
        });
        elActions.appendChild(btn);
      });
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary storia-continue";
      btn.textContent = index >= SCENE.length - 1 ? "Fine" : "Continua";
      btn.addEventListener("click", () => {
        index += 1;
        render();
      });
      elActions.appendChild(btn);
    }
  }

  function showEnd() {
    if (elStage) elStage.hidden = true;
    if (elEnd) elEnd.hidden = false;
    if (elProgress) elProgress.style.width = "100%";
  }

  function restart() {
    index = 0;
    render();
  }

  if (btnRestart) btnRestart.addEventListener("click", restart);
  document.querySelectorAll("[data-storia-restart]").forEach((b) => {
    b.addEventListener("click", restart);
  });

  render();
})();

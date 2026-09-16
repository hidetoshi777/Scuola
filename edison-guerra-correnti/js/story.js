/**
 * Visual story sul film Edison — L'uomo che illuminò il mondo.
 * Poche scelte (soprattutto «Continua»), scene con le PNG del materiale.
 */
window.STORIA_EDISON = {
  titolo: "Guerra delle correnti",
  sottotitolo: "Dopo il film Edison",
  inizio: "prologo",
  personaggi: {
    prof: { nome: "Prof.", ruolo: "Tecnologie elettriche", classe: "prof" },
    edison: { nome: "Edison", ruolo: "Inventore", classe: "edison" },
    westinghouse: { nome: "Westinghouse", ruolo: "Imprenditore", classe: "westinghouse" },
    tesla: { nome: "Tesla", ruolo: "Ingegnere", classe: "tesla" },
    narratore: { nome: "Narratore", ruolo: "Scena", classe: "narratore" },
  },
  nodi: {
    prologo: {
      scena: "intro",
      capitolo: "Prologo",
      speaker: "prof",
      testo:
        "Hai visto Edison — L'uomo che illuminò il mondo (2017). Seguiamo le tappe del film: Menlo Park, Manhattan, rivalità, Chicago 1893, kinetoscopio. Tante immagini, dialoghi brevi.",
      scelte: [{ testo: "Continua", vai: "regola" }],
    },
    regola: {
      scena: "intro",
      capitolo: "Prologo",
      speaker: "prof",
      testo:
        "Ripasso veloce: CC = corrente continua (elettroni sempre nello stesso verso, come in una pila). CA = corrente alternata (va avanti e indietro nel filo). Nel film è proprio questo lo scontro.",
      scelte: [{ testo: "Continua", vai: "menlo1" }],
    },
    menlo1: {
      scena: "menlo",
      capitolo: "1 · Menlo Park",
      speaker: "edison",
      testo:
        "Non basta un lampo di luce. Mi serve un filamento che resti acceso ore — altrimenti la lampadina non cambia la vita delle persone.",
      scelte: [{ testo: "Continua", vai: "menlo2" }],
    },
    menlo2: {
      scena: "menlo",
      capitolo: "1 · Menlo Park",
      speaker: "edison",
      testo:
        "Provo, brucio, ricomincio. Nel film la lampadina «che dura» nasce qui, non in un solo giorno di fortuna. Energia elettrica → luce e calore nel filamento.",
      scelte: [{ testo: "Continua", vai: "manhattan1" }],
    },
    manhattan1: {
      scena: "manhattan",
      capitolo: "2 · Manhattan",
      speaker: "edison",
      testo:
        "Passo alla città: illuminare Manhattan. Scelgo la corrente continua (CC). Utile vicino all'impianto; sulle lunghe distanze perde efficacia.",
      scelte: [{ testo: "Continua", vai: "manhattan2" }],
    },
    manhattan2: {
      scena: "manhattan",
      capitolo: "2 · Manhattan",
      speaker: "narratore",
      testo:
        "J.P. Morgan finanzia il sogno. Senza investitori, lampioni e cavi restano solo esperimenti chiusi in un laboratorio.",
      scelte: [{ testo: "Continua", vai: "guerra1" }],
    },
    guerra1: {
      scena: "rivale",
      capitolo: "3 · Guerra delle correnti",
      speaker: "westinghouse",
      testo:
        "Nel film propongo a Edison di lavorare insieme. Lui rifiuta. Da quel momento non è più solo tecnica: è guerra di brevetti, soldi e stampa.",
      scelte: [{ testo: "Continua", vai: "guerra_quiz" }],
    },
    guerra_quiz: {
      scena: "manhattan",
      capitolo: "3 · Guerra delle correnti",
      speaker: "prof",
      testo: "Cosa succede quando Edison rifiuta la collaborazione con Westinghouse?",
      scelte: [
        {
          testo: "Accettano e la rivalità finisce subito.",
          vai: "guerra_sbaglio",
        },
        {
          testo: "Edison rifiuta — inizia la guerra delle correnti.",
          vai: "guerra_ok",
        },
      ],
    },
    guerra_sbaglio: {
      scena: "manhattan",
      capitolo: "3 · Guerra delle correnti",
      speaker: "prof",
      testo:
        "No: nel film Edison rifiuta. Nasce la «guerra delle correnti» — competizione su CC, CA, brevetti e immagine pubblica.",
      scelte: [{ testo: "Continua", vai: "tesla1" }],
    },
    guerra_ok: {
      scena: "rivale",
      capitolo: "3 · Guerra delle correnti",
      speaker: "prof",
      testo:
        "Esatto. Competizione su CC, CA, brevetti e titoli sui giornali — non violenza, ma battaglia di idee e soldi.",
      scelte: [{ testo: "Continua", vai: "tesla1" }],
    },
    tesla1: {
      scena: "menlo",
      capitolo: "4 · Tesla",
      speaker: "edison",
      testo:
        "Nikola Tesla lavora per me. Gli prometto una ricompensa che nel film non arriva. Lui se ne va — deluso.",
      scelte: [{ testo: "Continua", vai: "tesla2" }],
    },
    tesla2: {
      scena: "rivale",
      capitolo: "4 · Tesla",
      speaker: "tesla",
      testo:
        "Passo da Westinghouse. Sviluppiamo la corrente alternata (CA): nel filo va avanti e indietro, molte volte al secondo. I trasformatori portano energia lontano.",
      scelte: [{ testo: "Continua", vai: "ca_quiz" }],
    },
    ca_quiz: {
      scena: "chicago",
      capitolo: "4 · CA e CC",
      speaker: "prof",
      testo: "Quale affermazione è vera nel film e in tecnologie elettriche?",
      scelte: [
        {
          testo: "La CA serve sulle lunghe distanze (con trasformatori).",
          vai: "ca_ok",
        },
        {
          testo: "La CC è l'unica corrente usata in tutte le case oggi.",
          vai: "ca_sbaglio",
        },
      ],
    },
    ca_sbaglio: {
      scena: "chicago",
      capitolo: "4 · CA e CC",
      speaker: "prof",
      testo:
        "No. In casa abbiamo CA (in Italia 230 V, 50 Hz). La CC resta in pile, USB ed elettronica — non «l'unica» in tutte le case.",
      scelte: [{ testo: "Continua", vai: "stampa" }],
    },
    ca_ok: {
      scena: "chicago",
      capitolo: "4 · CA e CC",
      speaker: "tesla",
      testo:
        "Giusto. Westinghouse e io puntiamo su questo. Edison resta sulla CC a Manhattan — per ora.",
      scelte: [{ testo: "Continua", vai: "stampa" }],
    },
    stampa: {
      scena: "manhattan",
      capitolo: "5 · Opinione pubblica",
      speaker: "narratore",
      testo:
        "Edison attacca la CA anche sui giornali — la descrive pericolosa. Nel film è battaglia di titoli: conta cosa crede la gente, non solo il cavo.",
      scelte: [{ testo: "Continua", vai: "chicago1" }],
    },
    chicago1: {
      scena: "chicago",
      capitolo: "6 · Chicago 1893",
      speaker: "narratore",
      testo:
        "All'Esposizione universale di Chicago (1893) si decide chi illumina la fiera intera. Non una lampadina sola: migliaia di luci insieme.",
      scelte: [{ testo: "Continua", vai: "chicago2" }],
    },
    chicago2: {
      scena: "chicago",
      capitolo: "6 · Chicago 1893",
      speaker: "tesla",
      testo:
        "Nel film Westinghouse e Tesla vincono l'illuminazione dell'Expo. La CA dimostra di reggere un evento enorme.",
      scelte: [{ testo: "Continua", vai: "kineto" }],
    },
    kineto: {
      scena: "kineto",
      capitolo: "7 · Dopo la guerra",
      speaker: "edison",
      testo:
        "La guerra delle correnti non mi ferma. Mi dedico al kinetoscopio — immagini in movimento, i primi passi del cinema.",
      scelte: [{ testo: "Continua", vai: "fine" }],
    },
    fine: {
      scena: "intro",
      capitolo: "Epilogo",
      speaker: "prof",
      testo:
        "Hai seguito il filo del film: Menlo Park, Manhattan in CC, rifiuto a Westinghouse, Tesla e CA, Chicago, kinetoscopio. Annota CC e CA sul quaderno — o rileggi il fumetto.",
      epilogo: true,
      riepilogo:
        "Menlo Park · Manhattan (CC) · guerra delle correnti · Tesla e CA · Chicago 1893 · kinetoscopio. CC = continua; CA = alternata (230 V in casa). Prossimo passo: il fumetto sulla storia dell'elettricità.",
      scelte: [{ testo: "Vedi il riepilogo", vai: "__fine__" }],
    },
  },
};

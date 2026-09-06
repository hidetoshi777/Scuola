window.KantData = {
  giudizi: [
    {
      id: "g1",
      text: "Il triangolo ha tre angoli",
      bin: "analitico-apriori",
      hint: "Il predicato è già nel soggetto; non serve esperienza.",
    },
    {
      id: "g2",
      text: "Questa mela è rossa",
      bin: "sintetico-aposteriori",
      hint: "Aggiunge qualcosa e dipende dall’esperienza.",
    },
    {
      id: "g3",
      text: "7 + 5 = 12",
      bin: "sintetico-apriori",
      hint: "Amplia la conoscenza e vale con necessità (esempio classico kantiano).",
    },
    {
      id: "g4",
      text: "Tutti i corpi sono estesi",
      bin: "analitico-apriori",
      hint: "«Esteso» è già nel concetto di corpo.",
    },
    {
      id: "g5",
      text: "Ogni evento ha una causa",
      bin: "sintetico-apriori",
      hint: "Per Kant è un principio che struttura l’esperienza, non una semplice osservazione.",
    },
    {
      id: "g6",
      text: "Ieri ha piovuto a Königsberg",
      bin: "sintetico-aposteriori",
      hint: "Fatto contingente, solo dall’esperienza.",
    },
  ],
  bins: [
    { id: "analitico-apriori", label: "Analitico a priori" },
    { id: "sintetico-apriori", label: "Sintetico a priori" },
    { id: "analitico-aposteriori", label: "Analitico a posteriori" },
    { id: "sintetico-aposteriori", label: "Sintetico a posteriori" },
  ],
  passeggiata: [
    {
      id: "s1",
      luogo: "Piazza del Castello",
      tipo: "quiz",
      domanda: "Secondo Kant, conosciamo la cosa «in sé»?",
      opzioni: [
        { t: "Sì, con la scienza moderna", ok: false },
        { t: "No: conosciamo i fenomeni, non il noumeno come oggetto", ok: true },
        { t: "Solo se usiamo i sensi al massimo", ok: false },
      ],
      spiegazione: "La conoscenza umana ha un confine: il fenomeno. Il noumeno si può pensare, non conoscere come esperienza.",
    },
    {
      id: "s2",
      luogo: "Passeggiata delle Otto",
      tipo: "quiz",
      domanda: "Cosa significa la «rivoluzione copernicana» di Kant?",
      opzioni: [
        { t: "La Terra gira intorno al Sole (solo astronomia)", ok: false },
        { t: "Gli oggetti dell’esperienza si adattano alle forme della mente", ok: true },
        { t: "La morale dipende dal consenso della maggioranza", ok: false },
      ],
      spiegazione: "Come Copernico sposta il centro, Kant sposta il centro della conoscenza: dalle cose alle condizioni del soggetto.",
    },
    {
      id: "s3",
      luogo: "Biblioteca",
      tipo: "quiz",
      domanda: "«7 + 5 = 12» per Kant è soprattutto…",
      opzioni: [
        { t: "Analitico a posteriori", ok: false },
        { t: "Sintetico a priori", ok: true },
        { t: "Solo un’abitudine mentale", ok: false },
      ],
      spiegazione: "Aggiunge qualcosa di nuovo (sintetico) ma vale indipendentemente dal contare oggetti ogni volta (a priori).",
    },
    {
      id: "s4",
      luogo: "Mercato",
      tipo: "morale",
      domanda: "Il bottegaio ti dà resto in più. Cosa chiede l’imperativo categorico?",
      opzioni: [
        {
          t: "Lo tengo: «se nessuno se ne accorge, va bene»",
          ok: false,
        },
        {
          t: "Lo restituisco: non posso volere che tutti trattengano il resto «se nessuno se ne accorge»",
          ok: true,
        },
        {
          t: "Lo tengo solo se mi serve per un fine buono",
          ok: false,
        },
      ],
      spiegazione: "Universalizza la massima. Se tutti tenessero il resto «in segreto», fiducia e commercio crollerebbero.",
    },
    {
      id: "s5",
      luogo: "Ponte sulla Pregel",
      tipo: "morale",
      domanda: "Un amico chiede di mentire per coprirlo. Quale risposta è più kantiana?",
      opzioni: [
        { t: "Mentire è ok se l’amicizia lo richiede", ok: false },
        { t: "Non mentire: la massima «menti quando conviene» non può essere legge universale", ok: true },
        { t: "Mentire va bene se aumenta la felicità media", ok: false },
      ],
      spiegazione: "Per Kant il dovere non è calcolato sul piacere o sull’utile contingente: guarda la forma della massima.",
    },
    {
      id: "s6",
      luogo: "Sotto le stelle",
      tipo: "quiz",
      domanda: "Nella citazione finale, cielo stellato e legge morale indicano…",
      opzioni: [
        { t: "Solo poesia, senza contenuto filosofico", ok: false },
        { t: "L’ordine del mondo sensibile e la dignità della persona morale", ok: true },
        { t: "Che l’etica deriva dall’astronomia", ok: false },
      ],
      spiegazione: "Due meraviglie: fuori l’infinito cosmico; dentro la legge morale che fonda libertà e responsabilità.",
    },
  ],
};

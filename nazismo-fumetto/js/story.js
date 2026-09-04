/**
 * Storia didattica a fumetto sul Nazismo (1933–1945).
 * Poche scelte (soprattutto «Continua»), tante scene illustrate diverse.
 * Le rare scelte multiple correggono un concetto, non ramificano la trama.
 */
window.STORIA_NAZISMO = {
  titolo: "Ombre sul Reich",
  sottotitolo: "Una storia a fumetto per capire il Nazismo",
  inizio: "prologo",
  personaggi: {
    guida: { nome: "Guida", ruolo: "Voce didattica", classe: "guida" },
    lena: { nome: "Lena", ruolo: "Compagna di studio", classe: "lena" },
    tu: { nome: "Tu", ruolo: "Studente / studentessa", classe: "tu" },
    documento: { nome: "Documento", ruolo: "Fonte storica", classe: "documento" },
    narratore: { nome: "Narratore", ruolo: "Scena", classe: "narratore" },
  },
  nodi: {
    prologo: {
      scena: "aula",
      capitolo: "Prologo",
      speaker: "guida",
      testo:
        "Benvenuto. Qui non giochiamo a fare i dittatori: studiamo come il Nazismo è potuto nascere, crescere e distruggere milioni di vite. Andremo avanti soprattutto con le immagini e i fatti. Le poche scelte servono solo a fissare un’idea.",
      scelte: [{ testo: "Continua", vai: "regola" }],
    },
    regola: {
      scena: "appunti",
      capitolo: "Prologo",
      speaker: "guida",
      testo:
        "Regola d’oro: studiare il Nazismo non significa ammirarlo. Significa riconoscere crisi, propaganda e odio legalizzato — per difendere la democrazia.",
      scelte: [{ testo: "Continua", vai: "incontro" }],
    },
    incontro: {
      scena: "aula",
      capitolo: "Prologo",
      speaker: "lena",
      testo:
        "Io sono Lena. Domanda secca: come arriva Hitler al potere, se la Germania aveva una Repubblica?",
      scelte: [
        {
          testo: "Con un colpo di Stato tipo Marcia su Roma.",
          vai: "incontro_sbaglio",
        },
        {
          testo: "Con crisi, elezioni e poi lo smantellamento della democrazia.",
          vai: "incontro_ok",
        },
      ],
    },
    incontro_sbaglio: {
      scena: "aula",
      capitolo: "Prologo",
      speaker: "guida",
      testo:
        "Quasi, ma no: Mussolini marcia su Roma nel 1922. Hitler diventa cancelliere nel 1933 entrando dal sistema politico, poi lo distrugge dall’interno.",
      scelte: [{ testo: "Continua", vai: "weimar" }],
    },
    incontro_ok: {
      scena: "aula",
      capitolo: "Prologo",
      speaker: "lena",
      testo:
        "Esatto. Prima conquista spazio nella crisi, poi usa le istituzioni contro le istituzioni. Andiamo a Weimar.",
      scelte: [{ testo: "Continua", vai: "weimar" }],
    },
    weimar: {
      scena: "weimar",
      capitolo: "1 · Weimar e la crisi",
      speaker: "narratore",
      testo:
        "Germania dopo il 1918: Repubblica giovane, risarcimenti, reduci feriti nell’orgoglio. Formalmente democratica, di fatto fragile.",
      scelte: [{ testo: "Continua", vai: "crisi29" }],
    },
    crisi29: {
      scena: "weimar",
      capitolo: "1 · Weimar e la crisi",
      speaker: "documento",
      testo:
        "1929: crollo di Wall Street. Disoccupazione, fame, denaro senza valore. La crisi non «crea» da sola il Nazismo — ma gli apre la porta.",
      scelte: [{ testo: "Continua", vai: "ascesa" }],
    },
    ascesa: {
      scena: "potere",
      capitolo: "2 · L’ascesa",
      speaker: "guida",
      testo:
        "Il NSDAP cresce con miti, parate e violenza di strada. Nel gennaio 1933 Hitler è nominato cancelliere. Non è ancora padrone assoluto: lo diventerà in pochi mesi.",
      scelte: [{ testo: "Continua", vai: "abilitazione" }],
    },
    abilitazione: {
      scena: "potere",
      capitolo: "2 · L’ascesa",
      speaker: "documento",
      testo:
        "Incendio del Reichstag, emergenza, legge di pieno poteri: il Parlamento firma la propria inutilità. Partiti vietati, sindacati spezzati, terrore politico.",
      scelte: [{ testo: "Continua", vai: "notte" }],
    },
    notte: {
      scena: "notte",
      capitolo: "2 · Consolidamento",
      speaker: "narratore",
      testo:
        "1934, «Notte dei lunghi coltelli»: Hitler elimina rivali interni (soprattutto le SA). Non è solo lotta di potere — è un messaggio: chi contesta il Führer sparisce.",
      scelte: [{ testo: "Continua", vai: "mein_kampf" }],
    },
    mein_kampf: {
      scena: "libro",
      capitolo: "3 · Ideologia",
      speaker: "lena",
      testo:
        "Nel Mein Kampf trovano posto razzismo, antisemitismo, Lebensraum (spazio vitale a Est), odio per democrazia e comunismo. Non è «solo un libro»: è un programma.",
      scelte: [{ testo: "Continua", vai: "razza" }],
    },
    razza: {
      scena: "libro",
      capitolo: "3 · Ideologia",
      speaker: "guida",
      testo:
        "La teoria della razza inventa una gerarchia falsa: «ariani» in cima, altri popoli sotto, ebrei come «nemico assoluto». Una menzogna usata per giustificare discriminazione e poi sterminio.",
      scelte: [{ testo: "Continua", vai: "gioventu" }],
    },
    gioventu: {
      scena: "gioventu",
      capitolo: "4 · Società totalitaria",
      speaker: "documento",
      testo:
        "La dittatura entra nella vita quotidiana: scuola, associazioni, tempo libero. La gioventù viene organizzata e educata all’obbedienza. Chi resta fuori rischia exclusione e sospetto.",
      scelte: [{ testo: "Continua", vai: "radio" }],
    },
    radio: {
      scena: "radio",
      capitolo: "4 · Società totalitaria",
      speaker: "narratore",
      testo:
        "Radio, cinema, manifesti: la propaganda di Goebbels non informa — plasma. Accanto, la paura della Gestapo. Consenso e terrore camminano insieme.",
      scelte: [{ testo: "Continua", vai: "anschluss" }],
    },
    anschluss: {
      scena: "anschluss",
      capitolo: "5 · Verso la guerra",
      speaker: "guida",
      testo:
        "Espansione passo dopo passo: Saar, Renania, Anschluss con l’Austria (1938), Sudeti… Ogni volta le democrazie europee temporizzano. Hitler legge la debolezza come permesso.",
      scelte: [{ testo: "Continua", vai: "shoah_intro" }],
    },
    shoah_intro: {
      scena: "shoah",
      capitolo: "6 · Dalla discriminazione allo sterminio",
      speaker: "guida",
      testo:
        "Questa parte è dura, ed è doverosa. La Shoah non è un incidente: è il punto d’arrivo di un’ideologia che ha reso legale l’odio.",
      scelte: [{ testo: "Continua", vai: "norimberga" }],
    },
    norimberga: {
      scena: "shoah",
      capitolo: "6 · Dalla discriminazione allo sterminio",
      speaker: "documento",
      testo:
        "1935, leggi di Norimberga: cittadinanza spezzata, diritti tolti, discriminazione di Stato. Poi violenza, deportazioni, ghetti. Durante la guerra: «Soluzione finale».",
      scelte: [{ testo: "Continua", vai: "campi" }],
    },
    campi: {
      scena: "shoah",
      capitolo: "6 · Dalla discriminazione allo sterminio",
      speaker: "documento",
      testo:
        "Concentramento: detenzione, lavoro forzato, fame (es. Dachau). Sterminio: uccidere in massa, spesso con camere a gas (es. Auschwitz-Birkenau, Treblinka), soprattutto in Polonia.",
      scelte: [{ testo: "Continua", vai: "guerra" }],
    },
    guerra: {
      scena: "guerra",
      capitolo: "7 · Guerra e crollo",
      speaker: "narratore",
      testo:
        "1939: invasione della Polonia. Poi Europa in fiamme, attacco all’URSS, crimini ovunque. Nel 1945 il Reich crolla. Restano macerie — e domande.",
      scelte: [{ testo: "Continua", vai: "resistenza" }],
    },
    resistenza: {
      scena: "resistenza",
      capitolo: "7 · Guerra e crollo",
      speaker: "lena",
      testo:
        "Non tutti tacquero. Ci furono resistenza, esilio, sabotaggio, aiuto agli ebrei — in Germania e nei Paesi occupati. Rari, rischiosi, essenziali da ricordare.",
      scelte: [{ testo: "Continua", vai: "processi" }],
    },
    processi: {
      scena: "processi",
      capitolo: "8 · Giustizia e memoria",
      speaker: "documento",
      testo:
        "A Norimberga i processi giudicano crimini di guerra e contro l’umanità. Non riparano tutto — ma dicono una cosa nuova: anche i potenti rispondono.",
      scelte: [{ testo: "Continua", vai: "memoria" }],
    },
    memoria: {
      scena: "memoria",
      capitolo: "8 · Giustizia e memoria",
      speaker: "guida",
      testo:
        "Studiare il Nazismo oggi è allenamento civico: riconoscere capri espiatori, bugie ripetute, violenza «giustificata», democrazie svuotate dall’interno.",
      scelte: [
        {
          testo: "Il segnale che mi resta: quando l’odio diventa legge.",
          vai: "fine",
        },
        {
          testo: "Il segnale che mi resta: quando si tace per comodità.",
          vai: "fine",
        },
      ],
    },
    fine: {
      scena: "appunti",
      capitolo: "Epilogo",
      speaker: "guida",
      testo:
        "Porta a casa il segnale che hai scelto. La storia a fumetto finisce qui — lo studio no. Puoi ripassare le schede o fare il laboratorio.",
      epilogo: true,
      riepilogo:
        "Hai percorso Weimar, ascesa, ideologia, società totalitaria, espansione, Shoah, guerra, resistenza, processi e memoria. Prossimo passo: Imparare o Laboratorio.",
      scelte: [{ testo: "Vedi il riepilogo", vai: "__fine__" }],
    },
  },
};

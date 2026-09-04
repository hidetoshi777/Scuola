/**
 * Storia didattica a fumetto sul Nazismo (1933–1945).
 * Le scelte sbagliate non «puniscono»: correggono e insegnano.
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
        "Benvenuto. Qui non giochiamo a fare i dittatori: studiamo come il Nazismo è potuto nascere, crescere e distruggere milioni di vite. Tu e Lena attraverserete alcune scene-chiave. Le scelte contano: sbagliare serve a capire.",
      scelte: [
        { testo: "Iniziamo.", vai: "incontro" },
        { testo: "Prima una regola d’oro.", vai: "regola" },
      ],
    },
    regola: {
      scena: "aula",
      capitolo: "Prologo",
      speaker: "guida",
      testo:
        "Regola d’oro: studiare il Nazismo non significa ammirarlo. Significa riconoscere i meccanismi — crisi, propaganda, odio legalizzato — per difendere la democrazia.",
      scelte: [{ testo: "Chiaro. Andiamo.", vai: "incontro" }],
    },
    incontro: {
      scena: "aula",
      capitolo: "Prologo",
      speaker: "lena",
      testo:
        "Io sono Lena. Ho sul banco i miei appunti e un dubbio: «Come ha fatto Hitler a prendere il potere se la Germania aveva una Repubblica?» Tu cosa rispondi, di pancia?",
      scelte: [
        {
          testo: "Ha fatto un colpo di Stato militare, come Mussolini.",
          vai: "incontro_sbaglio_colpo",
        },
        {
          testo: "Ha sfruttato crisi e elezioni, poi ha smantellato la democrazia.",
          vai: "incontro_ok",
        },
        {
          testo: "Il popolo lo voleva tutti, fin dal primo giorno.",
          vai: "incontro_sbaglio_popolo",
        },
      ],
    },
    incontro_sbaglio_colpo: {
      scena: "aula",
      capitolo: "Prologo",
      speaker: "guida",
      testo:
        "Attenzione: Mussolini arriva con la Marcia su Roma (1922). Hitler diventa cancelliere nel gennaio 1933 dopo un percorso elettorale e alleanze politiche. Poi, da dentro lo Stato, distrugge le libertà.",
      scelte: [{ testo: "Ok, corretto. Andiamo alla crisi.", vai: "weimar" }],
    },
    incontro_sbaglio_popolo: {
      scena: "aula",
      capitolo: "Prologo",
      speaker: "guida",
      testo:
        "No: non tutto il popolo lo sosteneva. Il consenso cresce soprattutto dopo il 1929, con disoccupazione e paura. Anche dopo, restano oppositori — repressi, esiliati, uccisi.",
      scelte: [{ testo: "Capito. Vediamo il contesto.", vai: "weimar" }],
    },
    incontro_ok: {
      scena: "aula",
      capitolo: "Prologo",
      speaker: "lena",
      testo:
        "Esatto. Vinse spazio politico nella crisi, poi usò le istituzioni contro le istituzioni. Andiamo indietro: Repubblica di Weimar.",
      scelte: [{ testo: "A Weimar.", vai: "weimar" }],
    },
    weimar: {
      scena: "weimar",
      capitolo: "1 · Weimar e la crisi",
      speaker: "narratore",
      testo:
        "Germania, anni Venti–Trenta. La Repubblica di Weimar è giovane, nata dopo la sconfitta del 1918. Formalmente democratica… ma fragile: governi che cadono, risarcimenti di guerra, rabbia dei reduci.",
      scelte: [{ testo: "Cosa fa esplodere tutto?", vai: "crisi29" }],
    },
    crisi29: {
      scena: "weimar",
      capitolo: "1 · Weimar e la crisi",
      speaker: "documento",
      testo:
        "1929: crollo di Wall Street. In Germania fabbriche chiudono, code alla fame, denaro che non vale più niente. La crisi non «crea» da sola il Nazismo — ma gli offre terreno fertile.",
      scelte: [
        {
          testo: "Allora la crisi spiega tutto da sola.",
          vai: "crisi_sbaglio",
        },
        {
          testo: "Serve anche propaganda, violenza e debolezza democratica.",
          vai: "crisi_ok",
        },
      ],
    },
    crisi_sbaglio: {
      scena: "weimar",
      capitolo: "1 · Weimar e la crisi",
      speaker: "guida",
      testo:
        "La crisi è una causa necessaria, non sufficiente. Altri Paesi soffrirono la Grande Depressione senza diventare dittature razziste. Contano scelte politiche, propaganda e violenza organizzata.",
      scelte: [{ testo: "Continuiamo.", vai: "ascesa" }],
    },
    crisi_ok: {
      scena: "weimar",
      capitolo: "1 · Weimar e la crisi",
      speaker: "lena",
      testo:
        "Sì: crisi + paura + nemici inventati + un partito pronto a colpire. Ora vediamo come Hitler sale.",
      scelte: [{ testo: "L’ascesa.", vai: "ascesa" }],
    },
    ascesa: {
      scena: "potere",
      capitolo: "2 · L’ascesa",
      speaker: "guida",
      testo:
        "Il NSDAP cresce con miti, parate, SA in strada e un messaggio semplice: «Noi contro di loro». Nel 1933 Hitler è nominato cancelliere. Non è ancora padrone assoluto — ma lo diventerà in pochi mesi.",
      scelte: [
        {
          testo: "Come elimina la democrazia così in fretta?",
          vai: "abilitazione",
        },
        {
          testo: "Quindi le elezioni bastano a legittimare tutto.",
          vai: "elezioni_sbaglio",
        },
      ],
    },
    elezioni_sbaglio: {
      scena: "potere",
      capitolo: "2 · L’ascesa",
      speaker: "guida",
      testo:
        "No. Vincere o entrare al governo non dà il diritto di cancellare i diritti altrui. La democrazia include limiti: costituzione, opposizioni, stampa libera. Hitler li spezza.",
      scelte: [{ testo: "Vediamo i passaggi.", vai: "abilitazione" }],
    },
    abilitazione: {
      scena: "potere",
      capitolo: "2 · L’ascesa",
      speaker: "documento",
      testo:
        "Incendio del Reichstag (1933), sospensione di libertà, legge di pieno poteri: il Parlamento firma la propria inutilità. Partiti vietati, sindacati spezzati, terrore politico. Nasce la dittatura.",
      scelte: [{ testo: "E l’ideologia?", vai: "mein_kampf" }],
    },
    mein_kampf: {
      scena: "libro",
      capitolo: "3 · Ideologia",
      speaker: "lena",
      testo:
        "Nel Mein Kampf Hitler mette in fila idee tossiche già presenti in Europa: razzismo, antisemitismo, spazio vitale (Lebensraum), odio per democrazia e comunismo. Non è «solo un libro»: è un programma.",
      scelte: [
        {
          testo: "Qual è il cuore della teoria della razza?",
          vai: "razza",
        },
        {
          testo: "Cos’è il Lebensraum?",
          vai: "lebensraum",
        },
      ],
    },
    razza: {
      scena: "libro",
      capitolo: "3 · Ideologia",
      speaker: "guida",
      testo:
        "Immagina una scala inventata: in cima gli «ariani», sotto gli altri popoli, e gli ebrei come «nemico assoluto». È una menzogna scientifica usata per giustificare discriminazione e, poi, sterminio.",
      scelte: [
        { testo: "E il Lebensraum?", vai: "lebensraum" },
        { testo: "Passiamo alla dittatura quotidiana.", vai: "dittatura" },
      ],
    },
    lebensraum: {
      scena: "libro",
      capitolo: "3 · Ideologia",
      speaker: "documento",
      testo:
        "Lebensraum = «spazio vitale». Idea di conquistare terre a Est (Polonia, URSS) per risorse e dominio. Guida verso guerra di aggressione e crimini di massa.",
      scelte: [{ testo: "Come si vive sotto il regime?", vai: "dittatura" }],
    },
    dittatura: {
      scena: "strada",
      capitolo: "4 · Dittatura totale",
      speaker: "narratore",
      testo:
        "Nella Germania nazista lo Stato entra ovunque: scuola, radio, cinema, lavoro. Chi dissentisce rischia denunce, campi, morte. La propaganda di Goebbels non «informa»: plasma.",
      scelte: [
        {
          testo: "Propaganda e terrore bastano a spiegare il consenso?",
          vai: "consenso",
        },
        {
          testo: "Tutti erano nazisti convinti.",
          vai: "consenso_sbaglio",
        },
      ],
    },
    consenso_sbaglio: {
      scena: "strada",
      capitolo: "4 · Dittatura totale",
      speaker: "guida",
      testo:
        "Troppo semplice. C’erano fanatici, opportunisti, indifferenti, terrorizzati e resistenti. La storia è fatta di gradi di responsabilità — non di una sola etichetta.",
      scelte: [{ testo: "Parliamo di consenso e paura.", vai: "consenso" }],
    },
    consenso: {
      scena: "strada",
      capitolo: "4 · Dittatura totale",
      speaker: "lena",
      testo:
        "Misto pericoloso: orgoglio nazionale, lavoro ritrovato per alcuni, spettacolo delle parate… e paura della Gestapo. Il silenzio di molti aiutò il regime quanto le urla dei fanatici.",
      scelte: [{ testo: "La persecuzione degli ebrei.", vai: "shoah_intro" }],
    },
    shoah_intro: {
      scena: "shoah",
      capitolo: "5 · Dalla discriminazione allo sterminio",
      speaker: "guida",
      testo:
        "Questa parte è dura, ed è doverosa. La Shoah non è un incidente di percorso: è il punto d’arrivo di un’ideologia che ha reso legale l’odio. Procediamo con rispetto.",
      scelte: [{ testo: "Continua.", vai: "norimberga" }],
    },
    norimberga: {
      scena: "shoah",
      capitolo: "5 · Dalla discriminazione allo sterminio",
      speaker: "documento",
      testo:
        "1935, leggi di Norimberga: gli ebrei perdono cittadinanza piena, diritti, dignità pubblica. Poi violenza (Kristallnacht), deportazioni, ghetti. Infine, durante la guerra, la «Soluzione finale».",
      scelte: [
        {
          testo: "Campi di concentramento e di sterminio sono la stessa cosa?",
          vai: "campi",
        },
        {
          testo: "Fu «solo» una tragedia di guerra inevitabile.",
          vai: "shoah_sbaglio",
        },
      ],
    },
    shoah_sbaglio: {
      scena: "shoah",
      capitolo: "5 · Dalla discriminazione allo sterminio",
      speaker: "guida",
      testo:
        "No. Fu un progetto deliberato di sterminio. Guerre uccidono; la Shoah organizza l’assassinio industriale di civili — ebrei, rom, disabili, oppositori — perché «così doveva essere» secondo l’ideologia.",
      scelte: [{ testo: "Differenza tra i campi.", vai: "campi" }],
    },
    campi: {
      scena: "shoah",
      capitolo: "5 · Dalla discriminazione allo sterminio",
      speaker: "documento",
      testo:
        "Concentramento: detenzione, lavoro forzato, fame, violenza (es. Dachau). Sterminio: strutture pensate per uccidere in massa, spesso con camere a gas (es. Auschwitz-Birkenau, Treblinka, Sobibor), soprattutto in Polonia.",
      scelte: [{ testo: "E la guerra?", vai: "guerra" }],
    },
    guerra: {
      scena: "guerra",
      capitolo: "6 · Guerra e crollo",
      speaker: "narratore",
      testo:
        "1939: invasione della Polonia. Poi Europa in fiamme. Alleanze con l’Italia fascista, attacco all’URSS, crimini ovunque. Nel 1945 il Reich crolla. Hitler si suicida. Restano macerie… e la memoria da costruire.",
      scelte: [
        {
          testo: "L’Italia poteva restare neutrale?",
          vai: "italia",
        },
        {
          testo: "Passiamo alla memoria.",
          vai: "memoria",
        },
      ],
    },
    italia: {
      scena: "guerra",
      capitolo: "6 · Guerra e crollo",
      speaker: "lena",
      testo:
        "Sì, in teoria: la Spagna di Franco restò fuori. Mussolini invece scelse l’alleanza, anche per tentazione di vittoria facile. Dopo l’armistizio del ’43 arrivò l’occupazione nazista. Scelte hanno conseguenze.",
      scelte: [{ testo: "Memoria e oggi.", vai: "memoria" }],
    },
    memoria: {
      scena: "memoria",
      capitolo: "7 · Perché studiarlo",
      speaker: "guida",
      testo:
        "Studiare il Nazismo non è antiquariato. È allenamento: riconoscere capri espiatori, bugie ripetute, violenza «giustificata», democrazie svuotate dall’interno.",
      scelte: [
        {
          testo: "Quale segnale ti allarma di più, oggi?",
          vai: "scelta_finale",
        },
      ],
    },
    scelta_finale: {
      scena: "memoria",
      capitolo: "7 · Perché studiarlo",
      speaker: "tu",
      testo: "Scegli il segnale che vuoi portare a casa. Non c’è una sola risposta giusta: tutte sono pezzi dello stesso allarme.",
      scelte: [
        {
          testo: "Quando l’odio diventa legge.",
          vai: "fine_legge",
        },
        {
          testo: "Quando la propaganda sostituisce i fatti.",
          vai: "fine_propaganda",
        },
        {
          testo: "Quando si tace per paura o comodità.",
          vai: "fine_silenzio",
        },
      ],
    },
    fine_legge: {
      scena: "memoria",
      capitolo: "Epilogo",
      speaker: "guida",
      testo:
        "Hai scelto la legalizzazione dell’odio. Norimberga insegna: se lo Stato discrimina per origine o fede, la civiltà è già ferita. Fine della storia a fumetto — ma non dello studio.",
      epilogo: true,
      riepilogo:
        "Hai percorso crisi di Weimar, ascesa, ideologia, dittatura, Shoah, guerra e memoria. Prossimo passo: ripassa i fatti in Imparare o mettiti alla prova in Laboratorio.",
      scelte: [{ testo: "Vedi il riepilogo", vai: "__fine__" }],
    },
    fine_propaganda: {
      scena: "memoria",
      capitolo: "Epilogo",
      speaker: "guida",
      testo:
        "Hai scelto la propaganda. Goebbels sapeva che una bugia ripetuta può sembrare verità. Controquesto: fonti, dubbio, rispetto per i fatti. Fine della storia a fumetto — ma non dello studio.",
      epilogo: true,
      riepilogo:
        "Hai percorso crisi di Weimar, ascesa, ideologia, dittatura, Shoah, guerra e memoria. Prossimo passo: ripassa i fatti in Imparare o mettiti alla prova in Laboratorio.",
      scelte: [{ testo: "Vedi il riepilogo", vai: "__fine__" }],
    },
    fine_silenzio: {
      scena: "memoria",
      capitolo: "Epilogo",
      speaker: "guida",
      testo:
        "Hai scelto il silenzio. Non tutti furono carnefici; molti furono spettatori. La democrazia chiede voce, non solo opinioni private. Fine della storia a fumetto — ma non dello studio.",
      epilogo: true,
      riepilogo:
        "Hai percorso crisi di Weimar, ascesa, ideologia, dittatura, Shoah, guerra e memoria. Prossimo passo: ripassa i fatti in Imparare o mettiti alla prova in Laboratorio.",
      scelte: [{ testo: "Vedi il riepilogo", vai: "__fine__" }],
    },
  },
};

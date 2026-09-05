/* =========================================================
   Dati del desktop — catalogo lavori Canva + attività web.
   Aggiornato dalla ricognizione del 2026-09-04.

   NOTA sui link Canva: l'unica chiave stabile è il design ID.
   Il link viene composto qui (canvaLink) al caricamento della
   pagina, non salvato — i link brevi canva.com/d/xxxx restituiti
   dall'API cambiano a ogni richiesta.

   NOTA privacy: i materiali del percorso individualizzato (due
   alunni, cartelle Canva a parte) e gli appunti personali non
   scolastici NON sono in questo elenco di proposito: il sito è
   pubblico. Restano nel catalogo di lavoro locale, non versionato.
   ========================================================= */

function canvaLink(id) {
  return "https://www.canva.com/design/" + id + "/view";
}

/* L'ordine qui è l'ordine dei ripiani sullo scaffale, dal più pieno al più vuoto. */
window.MATERIE = {
  storia: { label: "Storia", adesivo: "st-colonna" },
  italiano: { label: "Italiano", adesivo: "st-pennino" },
  edcivica: { label: "Educazione civica", adesivo: "st-libro-stella" },
  geografia: { label: "Geografia", adesivo: "st-globo" },
  religione: { label: "Religione", adesivo: "st-colomba" },
  filosofia: { label: "Filosofia", adesivo: "st-gufo" },
};

window.ATTIVITA_WEB = [
  {
    titolo: "Rotazione terrestre",
    materia: "Scienze",
    classe: "Prima media",
    descrizione: "Sito interattivo su giorno/notte, stagioni e fusi orari, con gioco a tempo finale.",
    url: "rotazione-terrestre/",
    tinta: "scienze",
    adesivo: "st-pianeta",
    extra: [{ label: "Gioco", url: "rotazione-terrestre/gioco.html" }],
  },
  {
    titolo: "Parti invariabili del discorso",
    materia: "Italiano",
    classe: "Prima superiore",
    descrizione: "Avverbi, preposizioni, congiunzioni e interiezioni: teoria, quattro esercizi e un gioco a tempo.",
    url: "parti-invariabili/",
    tinta: "italiano",
    adesivo: "st-pennino",
    extra: [{ label: "Gioco", url: "parti-invariabili/gioco.html" }],
  },
  {
    titolo: "Ombre sul Reich — Nazismo a fumetto",
    materia: "Storia",
    classe: "Secondo grado",
    descrizione: "Visual novel didattica sul Nazismo: storia a fumetto con scelte, per capire crisi, propaganda, dittatura e Shoah.",
    url: "nazismo-fumetto/",
    tinta: "storia",
    adesivo: "st-fumetto",
    extra: [
      { label: "Fumetto", url: "nazismo-fumetto/fumetto.html" },
      { label: "Mappa", url: "nazismo-fumetto/mappa.html" },
      { label: "Storia interattiva", url: "nazismo-fumetto/gioco.html" },
    ],
  },
  {
    titolo: "Manzoni — Archivio del manoscritto",
    materia: "Italiano",
    classe: "Secondo grado",
    descrizione: "Laboratorio su Alessandro Manzoni e I Promessi Sposi: studio, rete dei personaggi, esercizi e prova a tempo, con le slide Canva del Prof.",
    url: "manzoni-promessi/",
    tinta: "italiano",
    adesivo: "st-libro-aperto",
    extra: [
      { label: "Fumetto", url: "manzoni-promessi/fumetto.html" },
      { label: "Personaggi", url: "manzoni-promessi/personaggi.html" },
      { label: "Memory", url: "manzoni-promessi/gioco.html" },
    ],
  },
];

/* Lavori Canva per materia. pp = numero di pagine, id = design ID Canva. */
window.CANVA = [
  // ---- STORIA — Tardo antico e Medioevo ----
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "La debolezza dell'impero romano", pp: 19, id: "DAFVGYG9s1Q" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "Schemino caduta impero romano", pp: 1, id: "DAGU-UcsbTM" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "I Regni romano Barbarici", pp: 19, id: "DAFVCKUfcu0" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "I tre regni dopo la caduta dell'impero Romano: Ostrogoti, Longobardi e Franchi", pp: 18, id: "DAFVsKkZkPI" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "Franchi e Bizantini", pp: 22, id: "DAFV7zzglvY" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "Il monachesimo", pp: 23, id: "DAFT-c0qlzg" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "Lotta per le investiture", pp: 18, id: "DAFOKEIuC0E" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "La rinascita dopo l'anno 1000", pp: 21, id: "DAFTsdqfvro" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "La nascita dei comuni", pp: 23, id: "DAFT-dKsPms" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "Scoperte e invenzioni nel Medioevo", pp: 15, id: "DAFSwacI8Y0" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "I NORMANNI", pp: 1, id: "DAFRcsTrIgc" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "Da Federico I Barbarossa a Federico II di Svevia", pp: 29, id: "DAFYTz9gmJM" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "Il Regno di Federico II", pp: 12, id: "DAFYsLYGau4" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "Bonifacio VIII vs Filippo IV + cattività avignonese", pp: 23, id: "DAFZCI5TqCg" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "Guerra delle Rose + Guerra dei cent'anni e Giovanna d'Arco", pp: 21, id: "DAFZKp8Tk5k" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "Storia della Sicilia — infografica", pp: 1, id: "DAFbSLfkdb8" },
  { materia: "storia", periodo: "Tardo antico e Medioevo", titolo: "La Sicilia del mito", pp: 22, id: "DAFP-RjFzzU" },

  // ---- STORIA — Età moderna ----
  { materia: "storia", periodo: "Età moderna", titolo: "La Spagna. Dagli Aragonesi a Cristoforo Colombo", pp: 22, id: "DAFZmIxSwO8" },
  { materia: "storia", periodo: "Età moderna", titolo: "Le guerre d'Italia", pp: 16, id: "DAFfWGLHcu0" },
  { materia: "storia", periodo: "Età moderna", titolo: "L'Italia Spagnola", pp: 7, id: "DAFguVgy_6E" },
  { materia: "storia", periodo: "Età moderna", titolo: "La Riforma protestante", pp: 15, id: "DAFeqFKhyEs" },
  { materia: "storia", periodo: "Età moderna", titolo: "Le guerre di Religione tra cattolici e protestanti", pp: 21, id: "DAFf-RgLqWU" },
  { materia: "storia", periodo: "Età moderna", titolo: "Guerra dei Trent'anni", pp: 14, id: "DAFhvtpWESE" },
  { materia: "storia", periodo: "Età moderna", titolo: "Olivares / Richelieu e Mazzarino", pp: 14, id: "DAFiP-DZATw" },
  { materia: "storia", periodo: "Età moderna", titolo: "La rivoluzione inglese", pp: 17, id: "DAFhqU6QowY" },
  { materia: "storia", periodo: "Età moderna", titolo: "Infografica sulla Restaurazione Stuart e la \"Gloriosa Rivoluzione\"", pp: 3, id: "DAFisbeKQZs" },
  { materia: "storia", periodo: "Età moderna", titolo: "Lo sviluppo delle scienze nel XVII secolo", pp: 21, id: "DAFkdy2wkuc" },
  { materia: "storia", periodo: "Età moderna", titolo: "Luigi XIV — Re Sole + Illuminismo", pp: 17, id: "DAFm6tHXpxE" },
  { materia: "storia", periodo: "Età moderna", titolo: "I più importanti paesi nei vari secoli (dal XV al XVIII)", pp: 1, id: "DAFgt7r6VT0" },
  { materia: "storia", periodo: "Età moderna", titolo: "La Rivoluzione Americana", pp: 17, id: "DAF5-c3mvgc" },
  { materia: "storia", periodo: "Età moderna", titolo: "La Rivoluzione Francese", pp: 16, id: "DAF6Tx524nM" },
  { materia: "storia", periodo: "Età moderna", titolo: "Le vittorie di Napoleone", pp: 3, id: "DAFu6qVRJbc" },
  { materia: "storia", periodo: "Età moderna", titolo: "Le sconfitte di Napoleone", pp: 2, id: "DAFvAKF0f7U" },
  { materia: "storia", periodo: "Età moderna", titolo: "La Rivoluzione Industriale", pp: 13, id: "DAF7SUFBGVo" },

  // ---- STORIA — Risorgimento ----
  { materia: "storia", periodo: "Risorgimento", titolo: "I Moti del '20-'21", pp: 14, id: "DAFvqW83Cdk" },
  { materia: "storia", periodo: "Risorgimento", titolo: "Moti del 1830", pp: 2, id: "DAFwAPZZgVk" },
  { materia: "storia", periodo: "Risorgimento", titolo: "I moti del 1848", pp: 14, id: "DAFwUD3WRO4" },
  { materia: "storia", periodo: "Risorgimento", titolo: "L'unità d'Italia", pp: 17, id: "DAFvQGpO9TY" },
  { materia: "storia", periodo: "Risorgimento", titolo: "I protagonisti dell'Unità d'Italia", pp: 4, id: "DAFwj_kfGhk" },
  { materia: "storia", periodo: "Risorgimento", titolo: "Schemino regni Unità d'Italia", pp: 1, id: "DAFyXtAhMfE" },

  // ---- STORIA — Novecento ----
  { materia: "storia", periodo: "Novecento", titolo: "Belle Époque", pp: 19, id: "DAF0meVynx0" },
  { materia: "storia", periodo: "Novecento", titolo: "La prima guerra mondiale (Italia)", pp: 20, id: "DAF2OFcPV3A" },
  { materia: "storia", periodo: "Novecento", titolo: "La prima guerra mondiale (parte 2 — Europa)", pp: 18, id: "DAF4ch5JAfs" },
  { materia: "storia", periodo: "Novecento", titolo: "Le 6 ragioni dell'ascesa di Mussolini", pp: 4, id: "DAF6gY-5TG8" },
  { materia: "storia", periodo: "Novecento", titolo: "Il Nazismo", pp: 11, id: "DAGe-xaxEtU" },

  // ---- ITALIANO — Letteratura ----
  { materia: "italiano", periodo: "Letteratura", titolo: "Alle origini della nostra poesia", pp: 20, id: "DAFQD-r2Cvg" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Dante", pp: 20, id: "DAFX8u75EYU" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Il Sommo Poeta: Dante Alighieri", pp: 16, id: "DAF1ph5Dx8U" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Giovanni Boccaccio", pp: 16, id: "DAFhR0Q8HfM" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Boccaccio", pp: 1, id: "DAFi4Sz9-4I" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Francesco Petrarca: infografica", pp: 1, id: "DAFdXV_YulE" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Ludovico Ariosto", pp: 15, id: "DAF5mSZqkF4" },
  { materia: "italiano", periodo: "Letteratura", titolo: "La Gerusalemme liberata", pp: 14, id: "DAF_euDvvNo" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Giuseppe Parini", pp: 2, id: "DAGCeYUh5Vg" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Carlo Goldoni", pp: 13, id: "DAGCrm-HWfw" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Alessandro Manzoni", pp: 16, id: "DAFyiZnXJhs" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Giacomo Leopardi", pp: 12, id: "DAFzA0ySpOM" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Giovanni Verga", pp: 15, id: "DAF1vybI_Zo" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Giovanni Pascoli", pp: 13, id: "DAF2-vCsXcg" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Giosuè Carducci: il poeta vate", pp: 1, id: "DAF46KTJWew" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Le 3 correnti letterarie di fine Ottocento", pp: 3, id: "DAF3OVTc0yg" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Luigi Pirandello", pp: 18, id: "DAF9clHasKE" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Svevo e d'Annunzio", pp: 4, id: "DAF-qiPcLAo" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Ermetismo", pp: 14, id: "DAF-1diqHTI" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Eneide", pp: 11, id: "DAFTItrrry0" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Il male", pp: 16, id: "DAFOvkFszKU" },
  { materia: "italiano", periodo: "Letteratura", titolo: "Canto degli italiani", pp: 13, id: "DAFPL_5qB5A" },

  // ---- ITALIANO — Grammatica, metrica, scrittura ----
  { materia: "italiano", periodo: "Grammatica e scrittura", titolo: "Metrica poesia", pp: 24, id: "DAFOKlZUNHY" },
  { materia: "italiano", periodo: "Grammatica e scrittura", titolo: "Esercizio di metrica", pp: 3, id: "DAFO7xPRzuk" },
  { materia: "italiano", periodo: "Grammatica e scrittura", titolo: "Il testo argomentativo", pp: 12, id: "DAFQ0oLq7_c" },
  { materia: "italiano", periodo: "Grammatica e scrittura", titolo: "Grammatica: la frase", pp: 2, id: "DAF1Koxb_iU" },
  { materia: "italiano", periodo: "Grammatica e scrittura", titolo: "Il predicato (verbale e nominale)", pp: 3, id: "DAF2S9HAt9s" },
  { materia: "italiano", periodo: "Grammatica e scrittura", titolo: "Complementi predicativi e complemento partitivo", pp: 1, id: "DAF7SIPZCwg" },

  // ---- GEOGRAFIA ----
  { materia: "geografia", titolo: "Le popolazioni in Geografia", pp: 16, id: "DAFuzg1ogLY" },
  { materia: "geografia", titolo: "I settori economici: Geografia", pp: 20, id: "DAFzGxfT_d8" },
  { materia: "geografia", titolo: "Corea del Sud", pp: 8, id: "DAGCkolfUWA" },

  // ---- EDUCAZIONE CIVICA ----
  { materia: "edcivica", titolo: "La Costituzione della Repubblica Italiana", pp: 15, id: "DAFSBuSp1H8" },
  { materia: "edcivica", titolo: "Le quattro festività civili in Italia", pp: 2, id: "DAFhMMm5qe0" },
  { materia: "edcivica", titolo: "Eguaglianza", pp: 15, id: "DAFPUMa_Cck" },
  { materia: "edcivica", titolo: "La libertà nel mondo", pp: 14, id: "DAHHZ3wcFwA" },
  { materia: "edcivica", titolo: "La censura di Internet in Cina", pp: 1, id: "DAHIh1Nwr7M" },
  { materia: "edcivica", titolo: "Canva bullismo", pp: 12, id: "DAHGbiMeFaQ" },
  { materia: "edcivica", titolo: "Le società", pp: 3, id: "DAFjp8bbHYc" },
  { materia: "edcivica", titolo: "Concorso nazionale Tricolore vivo", pp: 18, id: "DAF_7TtKsds" },
  { materia: "edcivica", titolo: "Le forme dell'inquinamento", pp: 14, id: "DAG2liP4Obk" },

  // ---- FILOSOFIA ----
  { materia: "filosofia", titolo: "Freud e la psicanalisi", pp: 10, id: "DAF3O0SlRWg" },

  // ---- RELIGIONE ----
  { materia: "religione", titolo: "Islam", pp: 3, id: "DAHCaUFrgOU" },
];

/* =========================================================
   Quizizz (priorità) e Kahoot collegati agli argomenti.
   Si mostrano nella scheda del dorso se una chiave compare
   nel titolo del lavoro. Link pubblici da verificare in classe:
   Quizizz può cambiare visibilità o URL nel tempo.
   Preferiti: ≥10 domande, medie o superiori, in italiano.
   ========================================================= */
window.QUIZ = [
  {
    titolo: "Crisi III secolo e caduta Impero Romano d'Occidente",
    url: "https://quizizz.com/admin/quiz/5e5cea88cfbab7001c930ab9/crisi-iii-secolo-e-caduta-impero-romano-doccidente",
    piattaforma: "quizizz",
    domande: 12,
    livello: "medie / superiori",
    chiavi: ["impero romano", "caduta impero", "debolezza dell'impero"],
  },
  {
    titolo: "Invasioni barbariche e crollo dell'impero romano",
    url: "https://quizizz.com/admin/quiz/5fc25538c1a4f9001d52bd14/le-invasioni-barbariche-e-il-crollo-dellimpero-romano",
    piattaforma: "quizizz",
    domande: 10,
    livello: "medie",
    chiavi: ["impero romano", "romano barbarici", "ostrogoti", "longobardi"],
  },
  {
    titolo: "Verifica di storia — inizio Medioevo",
    url: "https://quizizz.com/admin/quiz/5de152df1b745c001b905c6f/verifica-di-storia",
    piattaforma: "quizizz",
    domande: 15,
    livello: "medie",
    chiavi: ["medioevo", "longobardi", "regni romano", "monachesimo", "anno 1000", "comuni", "normanni"],
  },
  {
    titolo: "Classi sociali e ordini medievali",
    url: "https://quizizz.com/admin/quiz/662bc08422709d50ad4aea3b/classi-sociali-e-ordini-medievali",
    piattaforma: "quizizz",
    domande: 12,
    livello: "medie / superiori",
    chiavi: ["comuni", "medioevo", "rinascita", "monachesimo"],
  },
  {
    titolo: "Riforma protestante e Controriforma cattolica",
    url: "https://quizizz.com/admin/quiz/61effd80033f8f001eaacb9a/riforma-protestante-e-controriforma-cattolica",
    piattaforma: "quizizz",
    domande: 37,
    livello: "superiori",
    chiavi: ["riforma protestante", "guerre di religione", "guerra dei trent"],
  },
  {
    titolo: "Illuminismo",
    url: "https://quizizz.com/admin/quiz/5e82fc9f2a2da0001bf2496a/illuminismo",
    piattaforma: "quizizz",
    domande: 14,
    livello: "superiori",
    chiavi: ["illuminismo", "luigi xiv"],
  },
  {
    titolo: "Rivoluzione Francese e Napoleone",
    url: "https://quizizz.com/admin/quiz/5cf160f2736c68001a825245/rivoluzione-francese-e-napoleone",
    piattaforma: "quizizz",
    domande: 13,
    livello: "superiori",
    chiavi: ["rivoluzione francese", "napoleone"],
  },
  {
    titolo: "Rivoluzione Industriale inglese",
    url: "https://quizizz.com/admin/quiz/5c058e059877ff001a44aa3b/rivoluzione-industriale-inglese",
    piattaforma: "quizizz",
    domande: 12,
    livello: "medie / superiori",
    chiavi: ["rivoluzione industriale"],
  },
  {
    titolo: "Seconda Rivoluzione Industriale e società di massa",
    url: "https://quizizz.com/admin/quiz/5f68cf79a2bc84001b2dbbce/seconda-rivoluzione-industriale-e-la-societa-di-massa",
    piattaforma: "quizizz",
    domande: 12,
    livello: "superiori",
    chiavi: ["rivoluzione industriale", "belle epoque", "belle époque"],
  },
  {
    titolo: "L'unità d'Italia",
    url: "https://quizizz.com/admin/quiz/6707eb9ca7cf5e7af3a7eea1/lunita-ditalia",
    piattaforma: "quizizz",
    domande: 12,
    livello: "medie / superiori",
    chiavi: ["unita d'italia", "unità d'italia", "risorgimento", "protagonisti dell'unita", "moti del"],
  },
  {
    titolo: "Domande sulla Storia Italiana — Risorgimento",
    url: "https://quizizz.com/admin/quiz/67c8ad032d11778f24e9e495/domande-sulla-storia-italiana",
    piattaforma: "quizizz",
    domande: 14,
    livello: "superiori",
    chiavi: ["unita d'italia", "unità d'italia", "moti del", "protagonisti"],
  },
  {
    titolo: "Prima guerra mondiale",
    url: "https://quizizz.com/admin/quiz/592a94c0109f9a10007bd15d/prima-guerra-mondiale",
    piattaforma: "quizizz",
    domande: 15,
    livello: "medie / superiori",
    chiavi: ["prima guerra mondiale", "guerra mondiale"],
  },
  {
    titolo: "Fascismo e Nazismo",
    url: "https://quizizz.com/admin/quiz/5cb47d91139b67001a97360b/fascismo-e-nazismo",
    piattaforma: "quizizz",
    domande: 17,
    livello: "superiori",
    chiavi: ["nazismo", "mussolini", "fascismo"],
  },
  {
    titolo: "Primo dopoguerra e avvento del fascismo",
    url: "https://quizizz.com/admin/quiz/65aaa535524f09376d4fdf91/primo-dopoguerra-e-avvento-del-fascismo",
    piattaforma: "quizizz",
    domande: 32,
    livello: "superiori",
    chiavi: ["mussolini", "nazismo", "fascismo"],
  },
  {
    titolo: "Dante Alighieri e la Divina Commedia",
    url: "https://quizizz.com/admin/quiz/5e44416fb74fcc001b278b09/dante-alighieri-e-la-divina-commedia",
    piattaforma: "quizizz",
    domande: 30,
    livello: "superiori",
    chiavi: ["dante", "sommo poeta"],
  },
  {
    titolo: "Domande su Dante Alighieri",
    url: "https://quizizz.com/admin/quiz/67064e6c5738099aedc33792/domande-su-dante-alighieri",
    piattaforma: "quizizz",
    domande: 56,
    livello: "medie / superiori",
    chiavi: ["dante", "sommo poeta"],
  },
  {
    titolo: "Da Petrarca a Boccaccio",
    url: "https://quizizz.com/admin/quiz/5aa967a0efcc94001bbc9aad/verifica-di-letteratura-da-petrarca-a-boccaccio",
    piattaforma: "quizizz",
    domande: 16,
    livello: "superiori",
    chiavi: ["petrarca", "boccaccio", "origini della nostra poesia"],
  },
  {
    titolo: "Alessandro Manzoni",
    url: "https://quizizz.com/admin/quiz/655f8e5d618a37b38455b324/alessandro-manzoni",
    piattaforma: "quizizz",
    domande: 15,
    livello: "superiori",
    chiavi: ["manzoni"],
  },
  {
    titolo: "Leopardi",
    url: "https://quizizz.com/admin/quiz/5a0734f3ef2e20100068ee7a/leopardi",
    piattaforma: "quizizz",
    domande: 43,
    livello: "superiori",
    chiavi: ["leopardi"],
  },
  {
    titolo: "Verismo e Giovanni Verga",
    url: "https://quizizz.com/admin/quiz/5bd878a6add4cd001b70b97e/verismo-e-giovanni-verga",
    piattaforma: "quizizz",
    domande: 14,
    livello: "superiori",
    chiavi: ["verga", "verismo", "correnti letterarie"],
  },
  {
    titolo: "Quiz sul Verismo e Giovanni Verga",
    url: "https://quizizz.com/admin/quiz/6749d1d998eaf0c692ffc323/quiz-sul-verismo-e-giovanni-verga",
    piattaforma: "quizizz",
    domande: 12,
    livello: "superiori",
    chiavi: ["verga", "verismo"],
  },
  {
    titolo: "Pirandello",
    url: "https://quizizz.com/admin/quiz/664c991cee5be42c870fd9be/pirandello",
    piattaforma: "quizizz",
    domande: 20,
    livello: "superiori",
    chiavi: ["pirandello"],
  },
  {
    titolo: "Costituzione Italiana",
    url: "https://quizizz.com/admin/quiz/657089b56d18dd0c6b7b2cd7/costituzione-italiana-quiz",
    piattaforma: "quizizz",
    domande: 14,
    livello: "medie / superiori",
    chiavi: ["costituzione", "eguaglianza", "repubblica"],
  },
  {
    titolo: "Dallo Statuto Albertino alla Costituzione",
    url: "https://quizizz.com/admin/quiz/6008617f2cb83a001b229a9f/dallo-statuto-albertino-alla-costituzione",
    piattaforma: "quizizz",
    domande: 14,
    livello: "superiori",
    chiavi: ["costituzione", "festivita civili", "festività civili", "tricolore"],
  },
  {
    titolo: "L'inquinamento — forme e cause",
    url: "https://quizizz.com/admin/quiz/6787c6028018f952040bfc7b/linquinamento",
    piattaforma: "quizizz",
    domande: 20,
    livello: "medie / superiori",
    chiavi: ["inquinamento"],
  },
];

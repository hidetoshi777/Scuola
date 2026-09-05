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
   Match: se `ids` contiene l'ID Canva del dorso, oppure se una
   `chiave` compare nel titolo (dopo normalizzazione accenti).
   Link pubblici da verificare in classe: Quizizz/Wayground può
   cambiare visibilità.    Preferiti: ≥10 domande, medie/superiori, IT.

   Senza quiz pubblico IT adeguato (al 2026-09): Giuseppe Parini,
   Giosuè Carducci, «Il male», Corea del Sud, censura Internet in Cina.
   ========================================================= */
window.QUIZ = [
  // ---- STORIA: tardo antico / Medioevo ----
  {
    titolo: "Crisi III secolo e caduta Impero Romano d'Occidente",
    url: "https://quizizz.com/admin/quiz/5e5cea88cfbab7001c930ab9/crisi-iii-secolo-e-caduta-impero-romano-doccidente",
    piattaforma: "quizizz", domande: 12, livello: "medie / superiori",
    chiavi: ["debolezza dell'impero", "caduta impero romano", "schemino caduta"],
  },
  {
    titolo: "Invasioni barbariche e crollo dell'impero romano",
    url: "https://quizizz.com/admin/quiz/5fc25538c1a4f9001d52bd14/le-invasioni-barbariche-e-il-crollo-dellimpero-romano",
    piattaforma: "quizizz", domande: 10, livello: "medie",
    chiavi: ["regni romano barbarici", "schemino caduta", "debolezza dell'impero"],
  },
  {
    titolo: "Bizantini e Longobardi",
    url: "https://quizizz.com/admin/quiz/5fc5e865a04e19001d44bb14/bizantini-e-longobardi",
    piattaforma: "quizizz", domande: 27, livello: "medie",
    chiavi: ["franchi e bizantini", "ostrogoti, longobardi", "regni romano barbarici"],
  },
  {
    titolo: "I Franchi e l'Impero Carolingio",
    url: "https://quizizz.com/admin/quiz/5ff1a5f4dde9f8001b68f9b3/storia-i-franchi-e-limpero-carolingio",
    piattaforma: "quizizz", domande: 30, livello: "medie",
    chiavi: ["franchi e bizantini", "ostrogoti, longobardi e franchi"],
  },
  {
    titolo: "Verifica di storia — inizio Medioevo",
    url: "https://quizizz.com/admin/quiz/5de152df1b745c001b905c6f/verifica-di-storia",
    piattaforma: "quizizz", domande: 15, livello: "medie",
    chiavi: ["regni romano barbarici", "longobardi"],
  },
  {
    titolo: "Classi sociali e ordini medievali",
    url: "https://quizizz.com/admin/quiz/662bc08422709d50ad4aea3b/classi-sociali-e-ordini-medievali",
    piattaforma: "quizizz", domande: 12, livello: "medie / superiori",
    chiavi: ["nascita dei comuni", "rinascita dopo l'anno 1000", "monachesimo"],
  },
  {
    titolo: "Lotta per le investiture",
    url: "https://quizizz.com/admin/quiz/5e7a256bd82f7a001bdf5722/lotta-per-le-investiture",
    piattaforma: "quizizz", domande: 12, livello: "medie",
    chiavi: ["lotta per le investiture"],
  },
  {
    titolo: "Federico I e Federico II di Svevia",
    url: "https://quizizz.com/admin/quiz/5eafe6c032679a001bf04f7c/federico-i-e-federico-ii-di-svevia",
    piattaforma: "quizizz", domande: 12, livello: "medie / superiori",
    chiavi: ["barbarossa", "federico ii", "federico i"],
  },
  {
    titolo: "Federico II",
    url: "https://quizizz.com/admin/quiz/660eca1dddb360a8121fbfb4/federico-ii",
    piattaforma: "quizizz", domande: 12, livello: "superiori",
    chiavi: ["regno di federico ii", "federico ii"],
  },
  {
    titolo: "Crisi religiosa — Bonifacio VIII e Avignone",
    url: "https://quizizz.com/admin/quiz/6330d64c20d470001eb4edd9/crisi-religiosa-history-game",
    piattaforma: "quizizz", domande: 10, livello: "superiori",
    chiavi: ["bonifacio viii", "cattivita avignonese", "cattività avignonese"],
  },
  {
    titolo: "Guerra dei 100 anni e Guerra delle Due Rose",
    url: "https://quizizz.com/admin/quiz/65d3110c3fa296d87f23671a/la-guerra-dei-100-anni-e-la-guerra-delle-due-rose",
    piattaforma: "quizizz", domande: 13, livello: "medie / superiori",
    chiavi: ["guerra delle rose", "cent'anni", "giovanna d'arco"],
  },
  {
    titolo: "I Normanni",
    url: "https://quizizz.com/admin/quiz/5de152df1b745c001b905c6f/verifica-di-storia",
    piattaforma: "quizizz", domande: 15, livello: "medie",
    chiavi: ["normanni"],
  },
  {
    titolo: "L'arte arabo-normanna in Sicilia",
    url: "https://quizizz.com/admin/quiz/5fd9392132ca6f001be67b42/larte-arabo-normanna-in-sicilia-edcivica",
    piattaforma: "quizizz", domande: 12, livello: "medie / superiori",
    chiavi: ["sicilia"],
  },
  {
    titolo: "La rinascita del Basso Medioevo",
    url: "https://quizizz.com/admin/quiz/5f844dd4dba761001b250c1a/la-rinascita-del-basso-medioevo",
    piattaforma: "quizizz", domande: 15, livello: "medie / superiori",
    chiavi: ["scoperte e invenzioni", "rinascita dopo l'anno 1000", "nascita dei comuni"],
  },

  // ---- STORIA: età moderna ----
  {
    titolo: "Cristoforo Colombo",
    url: "https://quizizz.com/admin/quiz/645c9f4dd6238a001fb61e65/cristoforo-colombo",
    piattaforma: "quizizz", domande: 11, livello: "medie",
    chiavi: ["aragonesi", "cristoforo colombo", "spagna"],
  },
  {
    titolo: "L'Impero di Carlo V e la Francia di Francesco I",
    url: "https://quizizz.com/admin/quiz/5c1278878e25c3001a731701/limpero-di-carlo-v-e-la-francia-di-francesco-i",
    piattaforma: "quizizz", domande: 20, livello: "superiori",
    chiavi: ["guerre d'italia"],
  },
  {
    titolo: "L'Italia e la Francia tra Seicento e Settecento",
    url: "https://quizizz.com/admin/quiz/5fb6812949aabf001c5ad6bf/litalia-e-la-francia-tra-seicento-e-settecento",
    piattaforma: "quizizz", domande: 46, livello: "superiori",
    chiavi: ["italia spagnola"],
  },
  {
    titolo: "Riforma protestante e Controriforma cattolica",
    url: "https://quizizz.com/admin/quiz/61effd80033f8f001eaacb9a/riforma-protestante-e-controriforma-cattolica",
    piattaforma: "quizizz", domande: 37, livello: "superiori",
    chiavi: ["riforma protestante", "guerre di religione"],
  },
  {
    titolo: "Guerra dei Trent'anni",
    url: "https://quizizz.com/admin/quiz/61effd80033f8f001eaacb9a/riforma-protestante-e-controriforma-cattolica",
    piattaforma: "quizizz", domande: 37, livello: "superiori",
    chiavi: ["guerra dei trent"],
  },
  {
    titolo: "Assolutismo e monarchia costituzionale",
    url: "https://quizizz.com/admin/quiz/620bc087df6835001dfb12b6/assolutismo-monarchia-costutuzionale",
    piattaforma: "quizizz", domande: 30, livello: "superiori",
    chiavi: ["richelieu", "mazzarino", "olivares", "luigi xiv"],
  },
  {
    titolo: "La rivoluzione inglese",
    url: "https://quizizz.com/admin/quiz/5dc3d5dab2deaa001b313910/la-rivoluzione-inglese",
    piattaforma: "quizizz", domande: 25, livello: "medie / superiori",
    chiavi: ["rivoluzione inglese", "gloriosa rivoluzione", "restaurazione stuart"],
  },
  {
    titolo: "Il Seicento e la Rivoluzione scientifica",
    url: "https://quizizz.com/admin/quiz/5c9dca5be79f6a001a495410/il-seicento-e-la-rivoluzione-scientifica",
    piattaforma: "quizizz", domande: 30, livello: "medie",
    chiavi: ["sviluppo delle scienze", "scienze nel xvii"],
  },
  {
    titolo: "Illuminismo",
    url: "https://quizizz.com/admin/quiz/5e82fc9f2a2da0001bf2496a/illuminismo",
    piattaforma: "quizizz", domande: 14, livello: "superiori",
    chiavi: ["illuminismo", "luigi xiv", "re sole"],
  },
  {
    titolo: "Il Seicento in Europa",
    url: "https://quizizz.com/admin/quiz/5e8a467ae19819001b05422f/il-seicento-in-europa",
    piattaforma: "quizizz", domande: 24, livello: "medie / superiori",
    chiavi: ["paesi nei vari secoli", "xv al xviii"],
  },
  {
    titolo: "La Rivoluzione Americana",
    url: "https://quizizz.com/admin/quiz/60378c45e3c775001b2da8b9/la-rivoluzione-americana",
    piattaforma: "quizizz", domande: 46, livello: "medie / superiori",
    chiavi: ["rivoluzione americana"],
  },
  {
    titolo: "Rivoluzione Francese e Napoleone",
    url: "https://quizizz.com/admin/quiz/5cf160f2736c68001a825245/rivoluzione-francese-e-napoleone",
    piattaforma: "quizizz", domande: 13, livello: "superiori",
    chiavi: ["rivoluzione francese", "napoleone"],
  },
  {
    titolo: "Rivoluzione Industriale inglese",
    url: "https://quizizz.com/admin/quiz/5c058e059877ff001a44aa3b/rivoluzione-industriale-inglese",
    piattaforma: "quizizz", domande: 12, livello: "medie / superiori",
    chiavi: ["rivoluzione industriale"],
  },
  {
    titolo: "Seconda Rivoluzione Industriale e società di massa",
    url: "https://quizizz.com/admin/quiz/5f68cf79a2bc84001b2dbbce/seconda-rivoluzione-industriale-e-la-societa-di-massa",
    piattaforma: "quizizz", domande: 12, livello: "superiori",
    chiavi: ["rivoluzione industriale", "belle epoque", "belle époque"],
  },

  // ---- STORIA: Risorgimento / Novecento ----
  {
    titolo: "L'unità d'Italia",
    url: "https://quizizz.com/admin/quiz/6707eb9ca7cf5e7af3a7eea1/lunita-ditalia",
    piattaforma: "quizizz", domande: 12, livello: "medie / superiori",
    chiavi: ["unita d'italia", "unità d'italia", "protagonisti dell'unita", "schemino regni"],
  },
  {
    titolo: "Domande sulla Storia Italiana — Risorgimento",
    url: "https://quizizz.com/admin/quiz/67c8ad032d11778f24e9e495/domande-sulla-storia-italiana",
    piattaforma: "quizizz", domande: 14, livello: "superiori",
    chiavi: ["moti del", "unita d'italia", "unità d'italia", "protagonisti dell'unita"],
  },
  {
    titolo: "Unità d'Italia (ripasso medie)",
    url: "https://quizizz.com/admin/quiz/5d975ddcd06a50001d9e7f19/unita-ditalia",
    piattaforma: "quizizz", domande: 21, livello: "medie",
    chiavi: ["unita d'italia", "unità d'italia", "schemino regni"],
  },
  {
    titolo: "Prima guerra mondiale",
    url: "https://quizizz.com/admin/quiz/592a94c0109f9a10007bd15d/prima-guerra-mondiale",
    piattaforma: "quizizz", domande: 15, livello: "medie / superiori",
    chiavi: ["prima guerra mondiale"],
  },
  {
    titolo: "Fascismo e Nazismo",
    url: "https://quizizz.com/admin/quiz/5cb47d91139b67001a97360b/fascismo-e-nazismo",
    piattaforma: "quizizz", domande: 17, livello: "superiori",
    chiavi: ["nazismo", "mussolini"],
  },
  {
    titolo: "Primo dopoguerra e avvento del fascismo",
    url: "https://quizizz.com/admin/quiz/65aaa535524f09376d4fdf91/primo-dopoguerra-e-avvento-del-fascismo",
    piattaforma: "quizizz", domande: 32, livello: "superiori",
    chiavi: ["mussolini", "nazismo"],
  },

  // ---- ITALIANO ----
  {
    titolo: "Da Petrarca a Boccaccio",
    url: "https://quizizz.com/admin/quiz/5aa967a0efcc94001bbc9aad/verifica-di-letteratura-da-petrarca-a-boccaccio",
    piattaforma: "quizizz", domande: 16, livello: "superiori",
    chiavi: ["petrarca", "boccaccio", "origini della nostra poesia"],
  },
  {
    titolo: "Dante Alighieri e la Divina Commedia",
    url: "https://quizizz.com/admin/quiz/5e44416fb74fcc001b278b09/dante-alighieri-e-la-divina-commedia",
    piattaforma: "quizizz", domande: 30, livello: "medie / superiori",
    chiavi: ["dante", "sommo poeta"],
  },
  {
    titolo: "Domande su Dante Alighieri",
    url: "https://quizizz.com/admin/quiz/67064e6c5738099aedc33792/domande-su-dante-alighieri",
    piattaforma: "quizizz", domande: 56, livello: "medie / superiori",
    chiavi: ["dante", "sommo poeta"],
  },
  {
    titolo: "Ariosto — Orlando Furioso",
    url: "https://quizizz.com/admin/quiz/5fb7828408abe5001cbee3a2/ariosto-orlando-furioso",
    piattaforma: "quizizz", domande: 70, livello: "medie / superiori",
    chiavi: ["ariosto"],
  },
  {
    titolo: "Tasso e Tassoni",
    url: "https://quizizz.com/admin/quiz/67586a82a11cbc3574f6c4c4/tasso-e-tassoni",
    piattaforma: "quizizz", domande: 30, livello: "superiori",
    chiavi: ["gerusalemme liberata", "tasso"],
  },
  {
    titolo: "Carlo Goldoni",
    url: "https://quizizz.com/admin/quiz/5e7fa1e3ae5d94001ba5b5ef/carlo-goldoni",
    piattaforma: "quizizz", domande: 17, livello: "superiori",
    chiavi: ["goldoni"],
  },
  {
    titolo: "Alessandro Manzoni",
    url: "https://quizizz.com/admin/quiz/655f8e5d618a37b38455b324/alessandro-manzoni",
    piattaforma: "quizizz", domande: 15, livello: "superiori",
    chiavi: ["manzoni"],
  },
  {
    titolo: "Leopardi",
    url: "https://quizizz.com/admin/quiz/5a0734f3ef2e20100068ee7a/leopardi",
    piattaforma: "quizizz", domande: 43, livello: "superiori",
    chiavi: ["leopardi"],
  },
  {
    titolo: "Verismo e Giovanni Verga",
    url: "https://quizizz.com/admin/quiz/5bd878a6add4cd001b70b97e/verismo-e-giovanni-verga",
    piattaforma: "quizizz", domande: 14, livello: "superiori",
    chiavi: ["verga", "correnti letterarie"],
  },
  {
    titolo: "Quiz sul Verismo e Giovanni Verga",
    url: "https://quizizz.com/admin/quiz/6749d1d998eaf0c692ffc323/quiz-sul-verismo-e-giovanni-verga",
    piattaforma: "quizizz", domande: 12, livello: "superiori",
    chiavi: ["verga", "verismo"],
  },
  {
    titolo: "Giovanni Pascoli",
    url: "https://quizizz.com/admin/quiz/5fb929deecef31001bbf48dd/giovanni-pascoli",
    piattaforma: "quizizz", domande: 18, livello: "medie / superiori",
    chiavi: ["pascoli", "correnti letterarie"],
  },
  {
    titolo: "Italo Svevo",
    url: "https://quizizz.com/admin/quiz/5cf0dde5051cfe001d0d3110/italo-svevo",
    piattaforma: "quizizz", domande: 39, livello: "superiori",
    chiavi: ["svevo"],
  },
  {
    titolo: "Estetismo e Decadentismo",
    url: "https://quizizz.com/admin/quiz/674b0dd98b0399fa8da362a9/quiz-su-estetismo-e-decadentismo",
    piattaforma: "quizizz", domande: 13, livello: "superiori",
    chiavi: ["d'annunzio", "dannunzio", "svevo e d"],
  },
  {
    titolo: "Pirandello",
    url: "https://quizizz.com/admin/quiz/664c991cee5be42c870fd9be/pirandello",
    piattaforma: "quizizz", domande: 20, livello: "superiori",
    chiavi: ["pirandello"],
  },
  {
    titolo: "L'Ermetismo e Quasimodo",
    url: "https://quizizz.com/admin/quiz/656504d133e2f311fbd5e73f/lermetismo-e-quasimodo",
    piattaforma: "quizizz", domande: 11, livello: "superiori",
    chiavi: ["ermetismo"],
  },
  {
    titolo: "Epica: L'Eneide",
    url: "https://quizizz.com/admin/quiz/5dd81b0d0a7eb3001b8a26b3/epica-leneide",
    piattaforma: "quizizz", domande: 27, livello: "medie",
    chiavi: ["eneide"],
  },
  {
    titolo: "L'inno di Mameli",
    url: "https://quizizz.com/admin/quiz/65241d1158b4fe2a29eaef8b/linno-di-mameli",
    piattaforma: "quizizz", domande: 10, livello: "elementare / medie",
    chiavi: ["canto degli italiani", "mameli"],
  },
  {
    titolo: "Test di metrica",
    url: "https://quizizz.com/admin/quiz/5fbff02df0e31a001b89d7cb/test-di-metrica",
    piattaforma: "quizizz", domande: 10, livello: "medie",
    chiavi: ["metrica"],
  },
  {
    titolo: "Verifica sulla poesia",
    url: "https://quizizz.com/admin/quiz/605379143f892b001c8e6a04/verifica-in-gioco-a-tempo-sulla-poesia",
    piattaforma: "quizizz", domande: 16, livello: "medie",
    chiavi: ["metrica poesia", "esercizio di metrica"],
  },
  {
    titolo: "Testo argomentativo",
    url: "https://quizizz.com/admin/quiz/5e26bef47000fe001c9d0ac9/testo-argomentativo",
    piattaforma: "quizizz", domande: 16, livello: "medie / superiori",
    chiavi: ["testo argomentativo"],
  },
  {
    titolo: "Analisi logica: soggetto e predicato",
    url: "https://quizizz.com/admin/quiz/5fc531dfa5267a001da5912d/analisi-logica-soggetto-e-predicato",
    piattaforma: "quizizz", domande: 17, livello: "medie",
    chiavi: ["grammatica: la frase", "la frase"],
  },
  {
    titolo: "Predicato verbale e nominale",
    url: "https://quizizz.com/admin/quiz/5db81d66ffa276001af3ab7c/predicato-verbale-e-nominale",
    piattaforma: "quizizz", domande: 34, livello: "superiori",
    chiavi: ["predicato"],
  },
  {
    titolo: "Complementi predicativi",
    url: "https://quizizz.com/admin/quiz/67b3a41921b4972fdfb61853/i-complementi-predicativi-del-soggetto-e-delloggetto",
    piattaforma: "quizizz", domande: 14, livello: "medie",
    chiavi: ["complementi predicativi", "complemento partitivo"],
  },
  {
    titolo: "Complementi partitivo, specificazione, denominazione",
    url: "https://quizizz.com/admin/quiz/5e903d36374718001b2e4f9f/i-complementi-partitivo-di-specificazione-e-denominazione",
    piattaforma: "quizizz", domande: 15, livello: "medie",
    chiavi: ["complemento partitivo", "complementi predicativi"],
  },

  // ---- GEOGRAFIA / CIVICA / FILOSOFIA / RELIGIONE ----
  {
    titolo: "Popolazione mondiale",
    url: "https://quizizz.com/admin/quiz/5bfd8dfe2e5bc5001aaadf22/popolazione-mondiale",
    piattaforma: "quizizz", domande: 15, livello: "medie",
    chiavi: ["popolazioni"],
  },
  {
    titolo: "Settori economici",
    url: "https://quizizz.com/admin/quiz/5ea6d3da83b075001d3ed938/settori-economici",
    piattaforma: "quizizz", domande: 30, livello: "medie",
    chiavi: ["settori economici"],
  },
  {
    titolo: "Costituzione Italiana",
    url: "https://quizizz.com/admin/quiz/657089b56d18dd0c6b7b2cd7/costituzione-italiana-quiz",
    piattaforma: "quizizz", domande: 14, livello: "medie / superiori",
    chiavi: ["costituzione", "eguaglianza"],
  },
  {
    titolo: "Dallo Statuto Albertino alla Costituzione",
    url: "https://quizizz.com/admin/quiz/6008617f2cb83a001b229a9f/dallo-statuto-albertino-alla-costituzione",
    piattaforma: "quizizz", domande: 14, livello: "superiori",
    chiavi: ["costituzione", "festivita civili", "festività civili", "tricolore"],
  },
  {
    titolo: "Costituzione: principi fondamentali e diritti umani",
    url: "https://quizizz.com/admin/quiz/605ca760f9c561001c933d7b/costituzione-principi-fondamentali-e-diritti-umani",
    piattaforma: "quizizz", domande: 20, livello: "medie / superiori",
    chiavi: ["liberta nel mondo", "libertà nel mondo", "eguaglianza"],
  },
  {
    titolo: "Diritti umani",
    url: "https://quizizz.com/admin/quiz/640aef2824aa4c001d591c91/diritti-umani",
    piattaforma: "quizizz", domande: 11, livello: "superiori",
    chiavi: ["liberta nel mondo", "libertà nel mondo"],
  },
  {
    titolo: "Domande sul bullismo",
    url: "https://quizizz.com/admin/quiz/6760702ec4edec441eb6766d/domande-sul-bullismo-e-genere",
    piattaforma: "quizizz", domande: 14, livello: "superiori",
    chiavi: ["bullismo"],
  },
  {
    titolo: "Le società (forme societarie)",
    url: "https://quizizz.com/admin/quiz/5fb7a44dbe6c2d001b1a7393/le-societa",
    piattaforma: "quizizz", domande: 32, livello: "superiori",
    chiavi: ["le societa", "le società"],
  },
  {
    titolo: "L'inquinamento — forme e cause",
    url: "https://quizizz.com/admin/quiz/6787c6028018f952040bfc7b/linquinamento",
    piattaforma: "quizizz", domande: 20, livello: "medie / superiori",
    chiavi: ["inquinamento"],
  },
  {
    titolo: "Quiz sulla psicoanalisi di Freud",
    url: "https://quizizz.com/admin/quiz/681a8a1c026c64606f86b5c7/quiz-sulla-psicoanalisi-di-freud",
    piattaforma: "quizizz", domande: 14, livello: "superiori",
    chiavi: ["freud", "psicanalisi", "psicoanalisi"],
  },
  {
    titolo: "L'Islam",
    url: "https://quizizz.com/admin/quiz/5fbd0093608716001c655509/lislam-om",
    piattaforma: "quizizz", domande: 10, livello: "medie",
    chiavi: ["islam"],
  },
];

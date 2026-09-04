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

window.MATERIE = {
  storia: { label: "Storia", icona: "🏛️" },
  italiano: { label: "Italiano", icona: "📖" },
  geografia: { label: "Geografia", icona: "🌍" },
  edcivica: { label: "Educazione civica", icona: "⚖️" },
  filosofia: { label: "Filosofia", icona: "🧠" },
  religione: { label: "Religione", icona: "🕊️" },
};

window.ATTIVITA_WEB = [
  {
    titolo: "Rotazione terrestre",
    materia: "Scienze",
    classe: "Prima media",
    descrizione: "Sito interattivo su giorno/notte, stagioni e fusi orari, con gioco a tempo finale.",
    url: "rotazione-terrestre/",
    stato: "live",
    extra: [{ label: "Gioco", url: "rotazione-terrestre/gioco.html" }],
  },
  {
    titolo: "Parti invariabili del discorso",
    materia: "Italiano",
    classe: "Prima superiore",
    descrizione: "Avverbi, preposizioni, congiunzioni e interiezioni: teoria, quattro esercizi e un gioco a tempo.",
    url: "parti-invariabili/",
    stato: "live",
    extra: [{ label: "Gioco", url: "parti-invariabili/gioco.html" }],
  },
  {
    titolo: "Ombre sul Reich — Nazismo a fumetto",
    materia: "Storia",
    classe: "Secondo grado",
    descrizione: "Visual novel didattica sul Nazismo: storia a fumetto con scelte, per capire crisi, propaganda, dittatura e Shoah.",
    url: "nazismo-fumetto/",
    stato: "live",
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
    stato: "live",
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

  // ---- FILOSOFIA ----
  { materia: "filosofia", titolo: "Freud e la psicanalisi", pp: 10, id: "DAF3O0SlRWg" },

  // ---- RELIGIONE / ATTIVITÀ ALTERNATIVA ----
  { materia: "religione", titolo: "Canva per Alternativa Religione", pp: 14, id: "DAG2liP4Obk" },
  { materia: "religione", titolo: "Islam", pp: 3, id: "DAHCaUFrgOU" },
];

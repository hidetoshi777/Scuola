window.MazziniData = {
  casi: [
    {
      id: "c1",
      text: "Fondatore della Giovane Italia (1831): unità, libertà, repubblica",
      bin: "mazzini",
      hint: "Programma mazziniano: nazione unita, libera e repubblicana.",
    },
    {
      id: "c2",
      text: "Primo ministro piemontese: diplomazia, monarchie costituzionali, alleanze",
      bin: "cavour",
      hint: "Cavour punta su Stato sabaudo, riforme e intese europee — non sulla repubblica.",
    },
    {
      id: "c3",
      text: "Eroe dei Mille: spedizione in Sicilia, azione militare popolare",
      bin: "garibaldi",
      hint: "Garibaldi è l’uomo d’azione sul campo; Mazzini è soprattutto ideologo e organizzatore.",
    },
    {
      id: "c4",
      text: "Motto «Dio e il Popolo»; Doveri dell’uomo; esilio e propaganda",
      bin: "mazzini",
      hint: "Pensiero e tenacia di Mazzini: dovere verso la patria e rete di esuli.",
    },
    {
      id: "c5",
      text: "Alleanza con Napoleone III e guerra del 1859 contro l’Austria",
      bin: "cavour",
      hint: "Strategia cavouriana: far entrare l’Italia nella diplomazia delle grandi potenze.",
    },
    {
      id: "c6",
      text: "Repubblica Romana 1849: difesa di Roma contro i francesi",
      bin: "mazzini",
      hint: "Mazzini (triunviro) e Garibaldi difendono la Repubblica Romana: fallisce, ma resta simbolo.",
    },
  ],
  bins: [
    { id: "mazzini", label: "Mazzini" },
    { id: "cavour", label: "Cavour" },
    { id: "garibaldi", label: "Garibaldi" },
  ],
  battles: [
    {
      id: "metternich",
      nome: "Metternich",
      ruolo: "Cancelliere austriaco · Restaurazione",
      bg: "img/battle/bg-metternich.jpg",
      sprite: "img/battle/enemy-metternich.png",
      hpMax: 100,
      attacchi: [
        { id: "decreto", nome: "Decreto", danno: 14, testo: "Metternich firma un decreto: ordine e censura sulla penisola." },
        { id: "censura", nome: "Censura", danno: 18, testo: "La polizia austriaca chiude fogli e società segrete." },
      ],
      domandeFacili: [
        {
          q: "Chi è Metternich nel contesto del Risorgimento?",
          opzioni: [
            { t: "Cancelliere austriaco della Restaurazione", ok: true },
            { t: "Generale dei Mille con Garibaldi", ok: false },
            { t: "Primo ministro del Piemonte sabaudo", ok: false },
          ],
          spiegazione: "Metternich incarna l’ordine assoluto austriaco dopo il 1815.",
        },
        {
          q: "Cosa vuole soprattutto Mazzini per l’Italia?",
          opzioni: [
            { t: "Unità, libertà e repubblica", ok: true },
            { t: "Solo monarchie assolute alleate all’Austria", ok: false },
            { t: "Dividere l’Italia in piccoli Stati vassalli", ok: false },
          ],
          spiegazione: "Il programma mazziniano lega nazione, libertà e forma repubblicana.",
        },
        {
          q: "La Giovane Italia nasce soprattutto per…",
          opzioni: [
            { t: "Organizzare i giovani verso l’unità nazionale", ok: true },
            { t: "Difendere i privilegi feudali austriaci", ok: false },
            { t: "Sostituire Cavour come primo ministro", ok: false },
          ],
          spiegazione: "1831: società segreta educativa e politica per l’Italia unita.",
        },
        {
          q: "Il motto tipico di Mazzini è…",
          opzioni: [
            { t: "«Dio e il Popolo»", ok: true },
            { t: "«L’Italia farà da sé» (solo Cavour)", ok: false },
            { t: "«Ordine e trono» di Metternich", ok: false },
          ],
          spiegazione: "Religione della patria e sovranità popolare: «Dio e il Popolo».",
        },
      ],
      domandeIdee: [
        {
          q: "Perché Mazzini è spesso in contrasto con Cavour?",
          opzioni: [
            { t: "Repubblica dal basso vs monarchie e diplomazia", ok: true },
            { t: "Entrambi volevano restare sotto l’Austria", ok: false },
            { t: "Cavour era repubblicano, Mazzini monarchico", ok: false },
          ],
          spiegazione: "Stesso obiettivo di unità, metodi e forma di Stato diversi.",
        },
        {
          q: "La Restaurazione (dopo il 1815) per Metternich significa soprattutto…",
          opzioni: [
            { t: "Contenere rivoluzioni e idee nazionali", ok: true },
            { t: "Promuovere la Giovane Italia", ok: false },
            { t: "Unificare l’Italia sotto Mazzini", ok: false },
          ],
          spiegazione: "Congresso di Vienna e controllo austriaco: repressione dei moti.",
        },
        {
          q: "Nei Doveri dell’uomo Mazzini insiste soprattutto su…",
          opzioni: [
            { t: "Dovere verso famiglia, patria, umanità", ok: true },
            { t: "Solo profitto individuale senza impegno", ok: false },
            { t: "Obbedienza cieca all’impero austriaco", ok: false },
          ],
          spiegazione: "Educazione civica: diritti legati ai doveri verso la comunità.",
        },
      ],
      hint: "Metternich = Austria, Restaurazione, censura. Mazzini = unità + repubblica + popolo.",
    },
    {
      id: "radetzky",
      nome: "Radetzky",
      ruolo: "Generale austriaco · Lombardo-Veneto",
      bg: "img/battle/bg-radetzky.jpg",
      sprite: "img/battle/enemy-radetzky.png",
      hpMax: 110,
      attacchi: [
        { id: "carica", nome: "Carica", danno: 16, testo: "Radetzky lancia la carica: le baionette chiudono Milano." },
        { id: "repressione", nome: "Repressione", danno: 20, testo: "Dopo le Cinque Giornate torna la repressione militare." },
      ],
      domandeFacili: [
        {
          q: "Chi è Radetzky?",
          opzioni: [
            { t: "Generale austriaco nel Lombardo-Veneto", ok: true },
            { t: "Triunviro della Repubblica Romana", ok: false },
            { t: "Fondatore della Giovane Italia", ok: false },
          ],
          spiegazione: "Radetzky è il braccio militare austriaco in Italia settentrionale.",
        },
        {
          q: "La Repubblica Romana del 1849…",
          opzioni: [
            { t: "Nasce a Roma; Mazzini è tra i triunviri", ok: true },
            { t: "È uno Stato vassallo di Metternich", ok: false },
            { t: "È solo un progetto di Cavour nel 1859", ok: false },
          ],
          spiegazione: "1849: esperienza repubblicana breve, poi caduta sotto i francesi.",
        },
        {
          q: "Garibaldi nella Repubblica Romana…",
          opzioni: [
            { t: "Difende Roma sul campo", ok: true },
            { t: "Firma i trattati con l’Austria", ok: false },
            { t: "Chiude la Giovane Italia", ok: false },
          ],
          spiegazione: "Azione militare: Garibaldi; ideologia e governo: Mazzini.",
        },
        {
          q: "Dopo i fallimenti, Mazzini…",
          opzioni: [
            { t: "Continua dall’esilio a organizzare e scrivere", ok: true },
            { t: "Abbandona ogni idea nazionale", ok: false },
            { t: "Diventa cancelliere austriaco", ok: false },
          ],
          spiegazione: "Tenacia: esilio, reti, propaganda anche dopo le sconfitte.",
        },
      ],
      domandeIdee: [
        {
          q: "Perché 1849 è importante per capire Mazzini?",
          opzioni: [
            { t: "Mostra il sogno repubblicano messo alla prova", ok: true },
            { t: "È l’anno in cui Cavour unifica tutta l’Italia", ok: false },
            { t: "Metternich fonda la Giovane Italia", ok: false },
          ],
          spiegazione: "La Repubblica Romana è il momento alto (e tragico) del progetto.",
        },
        {
          q: "Quale contrasto è corretto?",
          opzioni: [
            { t: "Mazzini: repubblica; Cavour: via monarchico-diplomatica", ok: true },
            { t: "Mazzini: solo Austria; Cavour: solo esilio", ok: false },
            { t: "Entrambi rifiutano l’unità italiana", ok: false },
          ],
          spiegazione: "Stesso Risorgimento, due strategie: popolo/repubblica vs Stato/diplomazia.",
        },
        {
          q: "Il Lombardo-Veneto sotto Radetzky è…",
          opzioni: [
            { t: "Dominio austriaco represso militarmente", ok: true },
            { t: "Una repubblica mazziniana stabile", ok: false },
            { t: "Il regno di Sardegna di Cavour", ok: false },
          ],
          spiegazione: "Dopo i moti del 1848 l’Austria riconquista con la forza.",
        },
      ],
      hint: "Radetzky = esercito austriaco. 1849 = Repubblica Romana. Mazzini non si arrende.",
    },
  ],
};

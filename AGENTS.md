# Scuola

Materiali didattici interattivi, ognuno in una **sottocartella autonoma**.

## Contesto sostegno (locale)

Per PEI e lavori su alunni specifici dell’a.s. **2026/2027** (Ferraris Acireale, professionale AM): leggi e aggiorna il file locale **`SOSTEGNO_2026_2027.md`** (gitignored, non pubblicare). Non mettere nomi o dati sensibili nel sito o nei commit.

## Terza e quarta professionale (livello)

Le classi **terza AM** e **quarta AM** (Ferraris Acireale, professionale) hanno circa **17 anni**, ma il livello è **terra terra terra**: tipo **terza media**, spesso più basso. Frasi cortissime, tanto visivo, niente paragrafi, niente lessico da liceo. Vale per inglese, italiano, storia: si spiega come a 13 anni, anche se anagraficamente sono grandi.

## Struttura: non sempre completa

La cartella tipo (`index` + `imparare` + `fumetto` + `laboratorio` + `gioco`) vale per i lavori da programma, ricchi. **Se il Prof chiede un pezzo solo** (es. tre o quattro vignette, una scheda, solo il fumetto), si fa **solo quello**: una sottocartella, registrazione sullo scaffale, credito, obblighi del pezzo chiesto. Per un fumetto restano tavole generate, sfoglia, schermo intero, zoom, stampa tutto. **Non** inventare Studio / Lab / Gioco se non sono stati chiesti.

## Organizzazione

- Ogni attività vive in una propria cartella (es. `rotazione-terrestre/`, `parti-invariabili/`).
- **Non cancellare** i lavori già pubblicati: si aggiungono e si ordinano nuove cartelle.
- **Niente rimandi** tra un lavoro e l’altro (niente link incrociati nella navigazione **interna** delle attività).
- La homepage comune è **Lo scaffale** (`index.html` + `js/data.js`): dopo ogni nuova attività web, **registrala obbligatoriamente** in `window.ATTIVITA_WEB` (titolo, materia, descrizione, url, **copertina**, tinta, adesivo, extra). La `copertina` punta a `img/og-share.jpg` (o `.png`) dell’attività e compare sulla cartellina dello scaffale. Altrimenti la classe non la trova dallo scaffale.
- In **ogni** lavoro per la scuola, nel footer (o credito visibile), scrivi sempre: **Realizzato dal Prof. Rossano Bella**.
- **Stampe**: su ogni foglio stampato (fumetti, attestati, schede) il credito **Realizzato dal Prof. Rossano Bella** va in **piccolo** — i materiali non devono circolare anonimi in copisteria.
- Per i prossimi lavori Scuola, **usa il MCP Canva** (lavori e risorse già presenti nell’account Canva del Prof.) quando servono grafiche, template, export o materiali già realizzati lì: non reinventare da zero se Canva ha già qualcosa di utile.
- **Inserire i Canva del Prof.**: se per un argomento esiste già un design Canva (presentazione, poster, slide, ecc.), **va messo in una sezione dedicata** del lavoro (es. «Le slide del Prof.» / galleria export), non solo riusato come asset sparso. Prima di inventare grafiche nuove, cerca e riusa quei Canva.

## Preferenze agente

- **Mobile first (sempre)**: forte attenzione all’uso su **cellulare**. Layout, dialoghi, bottoni, immagini e touch devono funzionare bene su schermi stretti (leggibilità, aree cliccabili grandi, niente overflow orizzontale, stage VN usabile col pollice). Controllare almeno a ~390px di larghezza prima di pubblicare.
- **Visual novel su telefono**: scena/ritratto e testo devono stare **nello stesso viewport** (immagine in alto ~40%, dialogo sotto con scroll interno se serve). Evitare layout dove le immagini restano «sopra» fuori schermo mentre si legge solo il fumetto. I **ritratti** sul cellulare restano **piccoli** (angolo scena, non mezza faccia a tutto schermo).
- **Niente verifiche lunghe**: dopo le modifiche, commit/push e basta. Il Prof. prova lui sul browser e dice se qualcosa non va. Evitare walkthrough video, computer-use prolungato e suite di test manuali elaborate, salvo richiesta esplicita. Un controllo rapido mobile (viewport stretto) resta comunque dovuto.
- **Fumetto = tavole illustrate OBBLIGATORIE** quando c’è un fumetto: immagini generate da noi (GenerateImage / Grok o export Canva se già esiste materiale utile) — **vietato** accontentarsi di placeholder HTML/CSS. Più vignette per tavola. **Numero di tavole: da 4 a 8**, in base alla complessità (per un pezzo facilissimo vanno bene 4). Testo in italiano; nelle lezioni di **lingua** le nuvolette possono essere nella lingua da imparare, con traduzione italiana visibile. Trama minima, sfoglia pagina, schermo intero, zoom, stampa tutto. Non inventare Studio / Lab / Gioco se il Prof ha chiesto solo il fumetto.
- **Tema scuro di default**: ogni nuova attività parte in tema scuro; il chiaro resta un’opzione del toggle.
- **Gioco = didattico**: `gioco.html` deve far ripassare contenuti, non solo divertire. Preferisci formati diversi dal solo questionario (es. memory a coppie, ordina la trama, percorso a tappe con scelte sul fatto giusto). **Niente arcade puro** (Tetris / sparatutto / dodge) se non porta apprendimento chiaro. Se non trovi un’alternativa didattica solida, **usa domande/risposte** (quiz a tempo) come sul Manzoni originale.
- **Mappa / percorso di gioco**: se c’è un percorso a tappe, **non** bastano linee SVG grezze su fondo piatto. Usa uno **sfondo a tema** (immagine illustrata) e un tracciato chiaro, leggibile, senza linee che si incrociano a caso. Pin ordinati lungo il cammino.
- **Visual novel / fumetti didattici**: preferisci **poche scelte** (spesso solo «Continua») e **tante immagini di scena diverse**. Le scelte servono a correggere un concetto, non a ramificare la trama. Per le illustrazioni usa **sempre** generazione immagini (GenerateImage / Grok) o Canva quando già c’è materiale utile — non inventare «fumetti» solo con markup.
- **Riuso immagini**: le scene e i ritratti del fumetto vanno **riproposti in Home** (e dove davvero aiutano). In **Imparare**, **Laboratorio** e **Gioco** inserisci immagini **solo se funzionali** allo studio o all’esercizio — niente tavole fumetto decorative «buttate» a lato. Ok grafici/animazioni/JPEG ad hoc per lo studio.
- **Layout diversi (obbligatorio)**: ogni nuova attività deve avere una **composizione chiaramente diversa** dalle precedenti — non lo stesso template (header sticky + hero + path numerato + card) con soli colori/font cambiati. Cambia struttura di navigazione, ritmo delle sezioni, tipografia e schema di pagina (es. rail laterale, costellazione, magazine asimmetrico, mappa-gioco…), restando coerente al tema e mobile-first.
- **Mappe e personaggi storici realistici**: niente silhouettes schematiche o “poligoni grezzi” se si può fare di meglio. Per le **mappe** usa contorni reali (SVG/GeoJSON open data) anche se i confini sono odierni/semplificati, con nota didattica chiara. Per i **personaggi storici** punta a ritratti riconoscibili e verosimili (foto storiche di pubblico dominio, Canva, o generazione immagini guidata), non a figure generiche o cartoon anonimi.
- **Riferimenti storici veritieri**: in giochi/battaglie/fumetti usa **nomi e figure reali** (es. Metternich, Radetzky), non solo allegorie astratte al posto dei protagonisti.
- **Canva nel sito**: laddove il Prof. ha già fatto un Canva sull’argomento, **mettilo in una sezione dedicata** dell’attività (export + galleria/slide viewer), così gli alunni lo vedono come materiale di classe. Il sito non sostituisce il Canva: lo valorizza. Il viewer Canva deve avere **schermo intero** (pulsante + Fullscreen API; frecce per cambiare slide anche in fullscreen; Esc per uscire).
- **Imparare = cuore del lavoro**: `imparare.html` è la sezione di **studio** (il centro didattico), non un riassunto estetico né tre bullet superficiali. Deve contenere le **informazioni da sapere** con **spiegazioni e esempi** (soprattutto in filosofia: definizioni, contrasti, casi). Layout **ordinato e leggibile** (indice + capitoli lineari); niente collage confusi. Date, cause, fatti, distinzioni chiave. Poi «ricorda così», timeline, contrasti (X ≠ Y). **Niente acronimi forzati**. Niente solo immagini con una riga di testo. Se manca un pezzo canonico del programma (es. in Kant la **pace perpetua**), **aggiungilo**.
- **Ritratto in Imparare**: se c’è un ritratto in testata, resta **compatto a lato del titolo** (`max-width` circa 7.5–8rem, come Kant/Tommaso). Mai a tutta larghezza o alto mezza pagina sul PC.
- **Home leggibile sul fumetto**: se la home usa tavola/hero a tutto campo dietro il testo, il testo deve restare **leggibile** (scrim/overlay scuro più forte sotto la copia, ombra leggera sul titolo). Niente fumetto che «esonda» nella scritta.
- **Citazione ad hoc**: ogni home di attività ha una **citazione** del personaggio/tema; la stessa (campo `citazione` in `ATTIVITA_WEB`) compare anche sulla **cartellina** dello scaffale, sopra o sulla copertina.
- **Anteprima di condivisione (obbligatoria)**: ogni attività (e lo scaffale) deve avere meta Open Graph + Twitter Card sulla home (`og:title`, `og:description`, `og:url`, `og:image` assoluta HTTPS su GitHub Pages). Metti `img/og-share.jpg` (preferibilmente ~1200×630) o riusa la tavola/hero principale copiata come `og-share`. La stessa immagine va in `ATTIVITA_WEB.copertina` così compare sulla cartellina dello scaffale. Senza immagine assoluta WhatsApp non mostra la anteprima.
- **Zoom fumetto**: pinch + doppio tap via `../js/fumetto-zoom.js` (FumettoZoom) su ogni `fumetto.html`; reset allo sfogliare pagina; con zoom attivo non cambiare tavola con swipe. Pulsante **Stampa tutto** (`../js/fumetto-print.js`) a fianco di Schermo intero: stampa tutte le tavole.

Struttura **piena** (quando il lavoro è da programma, ricco):

```
nome-attivita/
  index.html
  imparare.html
  fumetto.html
  laboratorio.html
  gioco.html
  css/
  js/
```

Struttura **corta** (quando il Prof chiede un pezzo): solo i file del pezzo + `index.html` che lo apre, più scaffale e credito. Non riempire le altre pagine per abitudine.

## Pubblicazione (sempre così)

Dopo ogni nuova attività:

1. Registrala sullo **scaffale** (`js/data.js` → `ATTIVITA_WEB`).
2. Apri una pull request e **fai tu il merge** su `main` (Origin), senza aspettare.
3. Pubblica su GitHub, così la classe ha l’indirizzo web.

Repository GitHub: `https://github.com/hidetoshi777/Scuola`  
Sito base: `https://hidetoshi777.github.io/Scuola/`

### Indirizzi attuali

| Attività | Home | Gioco |
|----------|------|-------|
| Rotazione terrestre (prima media) | https://hidetoshi777.github.io/Scuola/rotazione-terrestre/ | https://hidetoshi777.github.io/Scuola/rotazione-terrestre/gioco.html |
| Parti invariabili (prima superiore) | https://hidetoshi777.github.io/Scuola/parti-invariabili/ | https://hidetoshi777.github.io/Scuola/parti-invariabili/gioco.html |
| Ombre sul Reich · Nazismo a fumetto | https://hidetoshi777.github.io/Scuola/nazismo-fumetto/ | [Fumetto](https://hidetoshi777.github.io/Scuola/nazismo-fumetto/fumetto.html) · [Mappa](https://hidetoshi777.github.io/Scuola/nazismo-fumetto/mappa.html) · [VN](https://hidetoshi777.github.io/Scuola/nazismo-fumetto/gioco.html) |
| Manzoni · Archivio del manoscritto | https://hidetoshi777.github.io/Scuola/manzoni-promessi/ | [Fumetto](https://hidetoshi777.github.io/Scuola/manzoni-promessi/fumetto.html) · [Memory](https://hidetoshi777.github.io/Scuola/manzoni-promessi/gioco.html) |
| Kant · I cieli stellati | https://hidetoshi777.github.io/Scuola/kant-cieli-stellati/ | [Fumetto](https://hidetoshi777.github.io/Scuola/kant-cieli-stellati/fumetto.html) · [Passeggiata](https://hidetoshi777.github.io/Scuola/kant-cieli-stellati/gioco.html) |
| Tommaso · Le cinque vie | https://hidetoshi777.github.io/Scuola/tommaso-cinque-vie/ | [Fumetto](https://hidetoshi777.github.io/Scuola/tommaso-cinque-vie/fumetto.html) · [Cammino](https://hidetoshi777.github.io/Scuola/tommaso-cinque-vie/gioco.html) |
| Kierkegaard · Aut-aut | https://hidetoshi777.github.io/Scuola/kierkegaard-aut-aut/ | [Fumetto](https://hidetoshi777.github.io/Scuola/kierkegaard-aut-aut/fumetto.html) · [Aut-aut](https://hidetoshi777.github.io/Scuola/kierkegaard-aut-aut/gioco.html) |
| Logica · Induttivo e deduttivo | https://hidetoshi777.github.io/Scuola/logica-induttivo-deduttivo/ | [Fumetto](https://hidetoshi777.github.io/Scuola/logica-induttivo-deduttivo/fumetto.html) · [Prove](https://hidetoshi777.github.io/Scuola/logica-induttivo-deduttivo/gioco.html) |
| Mazzini · Giovane Italia | https://hidetoshi777.github.io/Scuola/mazzini-giovane-italia/ | [Fumetto](https://hidetoshi777.github.io/Scuola/mazzini-giovane-italia/fumetto.html) · [Battaglia](https://hidetoshi777.github.io/Scuola/mazzini-giovane-italia/gioco.html) |
| Origini della poesia | https://hidetoshi777.github.io/Scuola/origini-poesia-italiana/ | [Fumetto](https://hidetoshi777.github.io/Scuola/origini-poesia-italiana/fumetto.html) · [Percorso](https://hidetoshi777.github.io/Scuola/origini-poesia-italiana/gioco.html) |
| Hello · Presentazioni | https://hidetoshi777.github.io/Scuola/presentazioni-inglese/ | [Fumetto](https://hidetoshi777.github.io/Scuola/presentazioni-inglese/) |

I vecchi link alla radice (`/gioco.html`, ecc.) reindirizzano ancora alla rotazione terrestre.

Se `gh` non è già collegato:

```bash
gh auth login --hostname github.com --git-protocol https --web --skip-ssh-key
gh auth setup-git
```

Poi, da `main` aggiornato:

```bash
git remote add github https://github.com/hidetoshi777/Scuola.git 2>/dev/null || true
git push github main
```

GitHub mostra il codice. Gli alunni usano il link Pages, non la pagina del file su GitHub.

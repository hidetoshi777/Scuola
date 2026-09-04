# Scuola

Materiali didattici interattivi, ognuno in una **sottocartella autonoma**.

## Organizzazione

- Ogni attività vive in una propria cartella (es. `rotazione-terrestre/`, `parti-invariabili/`).
- **Non cancellare** i lavori già pubblicati: si aggiungono e si ordinano nuove cartelle.
- **Niente rimandi** tra un lavoro e l’altro (niente link incrociati nella navigazione).
- Una homepage comune con i link si potrà fare in seguito, se servirà.
- In **ogni** lavoro per la scuola, nel footer (o credito visibile), scrivi sempre: **Realizzato dal Prof. Rossano Bella**.
- Per i prossimi lavori Scuola, **usa il MCP Canva** (lavori e risorse già presenti nell’account Canva del Prof.) quando servono grafiche, template, export o materiali già realizzati lì: non reinventare da zero se Canva ha già qualcosa di utile.

Struttura tipica di ogni cartella:

```
nome-attivita/
  index.html
  imparare.html
  laboratorio.html
  gioco.html
  css/
  js/
```

## Pubblicazione (sempre così)

Dopo ogni nuova attività:

1. Apri una pull request e **fai tu il merge** su `main` (Origin), senza aspettare.
2. Pubblica su GitHub, così la classe ha l’indirizzo web.

Repository GitHub: `https://github.com/hidetoshi777/Scuola`  
Sito base: `https://hidetoshi777.github.io/Scuola/`

### Indirizzi attuali

| Attività | Home | Gioco |
|----------|------|-------|
| Rotazione terrestre (prima media) | https://hidetoshi777.github.io/Scuola/rotazione-terrestre/ | https://hidetoshi777.github.io/Scuola/rotazione-terrestre/gioco.html |
| Parti invariabili (prima superiore) | https://hidetoshi777.github.io/Scuola/parti-invariabili/ | https://hidetoshi777.github.io/Scuola/parti-invariabili/gioco.html |
| Ombre sul Reich · Nazismo a fumetto | https://hidetoshi777.github.io/Scuola/nazismo-fumetto/ | https://hidetoshi777.github.io/Scuola/nazismo-fumetto/gioco.html |

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

# Scuola

Dopo ogni nuova attività:

1. Apri una pull request e fai il **merge** su `main` (Origin).
2. Pubblica su GitHub, così la classe ha l’indirizzo web.

## Pubblicazione (sempre così)

Repository GitHub: `https://github.com/hidetoshi777/Scuola`  
Sito: `https://hidetoshi777.github.io/Scuola/`  
Gioco: `https://hidetoshi777.github.io/Scuola/gioco.html`

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

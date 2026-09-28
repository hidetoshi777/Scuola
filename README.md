# Scuola

Materiali didattici interattivi per la scuola secondaria. Ogni attività è una cartella autonoma, senza link tra un lavoro e l’altro.

Realizzato dal Prof. Rossano Bella.

## Attività

### Raccoglitore professionale (terza e quarta AM)

- https://hidetoshi777.github.io/Scuola/professionale/

### Rotazione terrestre · Prima media

- Home: https://hidetoshi777.github.io/Scuola/rotazione-terrestre/
- Gioco: https://hidetoshi777.github.io/Scuola/rotazione-terrestre/gioco.html

### Parti invariabili del discorso · Prima superiore

- Home: https://hidetoshi777.github.io/Scuola/parti-invariabili/
- Gioco: https://hidetoshi777.github.io/Scuola/parti-invariabili/gioco.html

### Acciaio, alluminio e ghisa · Quarta professionale

- Home: https://hidetoshi777.github.io/Scuola/acciaio-alluminio-ghisa/
- Scheda: https://hidetoshi777.github.io/Scuola/acciaio-alluminio-ghisa/scheda.html
- Fumetto: https://hidetoshi777.github.io/Scuola/acciaio-alluminio-ghisa/fumetto.html
- Gioco: https://hidetoshi777.github.io/Scuola/acciaio-alluminio-ghisa/gioco.html
- Densità (allenamento γ): https://hidetoshi777.github.io/Scuola/acciaio-alluminio-ghisa/densita.html

### Galileo · Il cannocchiale

Solo gioco, circa dieci minuti. Non è nel raccoglitore professionale.

- Gioco: https://hidetoshi777.github.io/Scuola/galileo-cannocchiale/

### Edison · Guerra delle correnti · Quarta professionale (tecnologie elettriche)

- Home: https://hidetoshi777.github.io/Scuola/edison-guerra-correnti/
- Scheda caduta di tensione: https://hidetoshi777.github.io/Scuola/edison-guerra-correnti/scheda.html
- Fumetto: https://hidetoshi777.github.io/Scuola/edison-guerra-correnti/fumetto.html

## Struttura del repository

```
rotazione-terrestre/        → scienze, prima media
parti-invariabili/          → italiano, prima superiore
acciaio-alluminio-ghisa/    → tecnologia, quarta professionale (scheda, fumetto, gioco)
edison-guerra-correnti/     → tecnologie elettriche, quarta professionale (fumetto + scheda caduta tensione)
```

Nuove attività: nuova sottocartella, stessa struttura (home, imparare, laboratorio, gioco).

## QA dei materiali (TypeSafe / Jev) — obbligatorio

Per **ogni nuovo lavoro** Scuola (e per ogni espansione sostanziale di quiz / studio / laboratorio), **prima della pubblicazione** è obbligatorio un passaggio di QA con **TypeSafe (modello Jev)**:

- Jev giudica (sì/no, scelta, punteggio); non scrive il materiale.
- Al minimo: tutte le domande del quiz; segnalare e correggere incongruenze (es. opzione vs spiegazione) e semplificazioni fuorvianti.
- Report nella cartella del lavoro (es. `_qa_jev_quiz.json`).

Dettagli operativi per gli agenti: `AGENTS.md`.

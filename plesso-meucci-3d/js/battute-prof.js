/**
 * Battute parlate del Prof. Unica fonte del testo: le legge il gioco e le legge
 * _voce_prof.py, che genera audio/prof/<chiave>.mp3 con ElevenLabs.
 * Se cambi una frase qui, rigenera il suo mp3 (python _voce_prof.py --solo chiave).
 */
export const BATTUTE_PROF = {
  benvenuto: 'Benvenuto in 3 AM. La TV è guasta: ti guido passo passo.',
  vieni: 'Entra e vieni da me, vicino alla cattedra. Quando compare il tasto, premilo.',
  panico: 'Niente panico. Prima regola: non si tocca a caso.',
  stacca: 'Stacca la corrente al quadretto vicino alla porta. Poi prendi tester e fusibile.',
  tensioneTolta: 'Bene: tensione tolta. Ora il tester, sul banco vicino alle finestre.',
  circuitoChiuso: 'Circuito chiuso di nuovo. Riattacca la corrente, poi collaudiamo la TV.',
  correnteOk: 'Corrente ok. Vai alla TV e accendila: è il collaudo finale!',
  ancoraNiente: 'Ancora niente. Segui la missione: sicurezza, strumenti, riparazione.',
  aspetta: 'Aspetta: prima togli tensione. Sicurezza sempre.',
  evviva: 'Evviva, la TV funziona! Ottimo lavoro: questo è il collaudo di un vero professionista!'
};

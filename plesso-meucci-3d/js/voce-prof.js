import { VOCE_PROF } from './battute-prof.js';

/** MP3 già generati: durante il gioco non servono servizi vocali esterni. */
export function createProfVoice({ toggle, replay, controls, status }) {
  const storageKey = 'meucci-voce-prof';
  const files = new Map(VOCE_PROF.lines.map(({ text, file }) =>
    [text, new URL('../audio/' + file, import.meta.url).href]));
  const audio = new Audio();
  audio.preload = 'none';
  let enabled = true;
  try { enabled = localStorage.getItem(storageKey) !== 'off'; } catch { /* preferenza facoltativa */ }
  let current = null;
  let generation = 0;

  function render() {
    toggle.textContent = enabled ? 'Voce: attiva' : 'Voce: spenta';
    toggle.setAttribute('aria-pressed', String(enabled));
    replay.textContent = !audio.paused && !audio.ended ? 'Ferma audio' : 'Riascolta';
    replay.disabled = !current || !enabled;
  }

  function stop() {
    generation++;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    render();
  }

  function play() {
    stop();
    if (!enabled || !current || document.hidden) return;
    const ticket = generation;
    audio.src = current;
    status.textContent = 'Voce sintetica italiana';
    audio.play().catch((error) => {
      if (ticket !== generation) return;
      status.textContent = error.name === 'NotAllowedError'
        ? 'Tocca Riascolta per ascoltare.'
        : 'Audio non disponibile. Puoi leggere il testo.';
      render();
    });
  }

  toggle.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(storageKey, enabled ? 'on' : 'off'); } catch { /* preferenza facoltativa */ }
    if (enabled) play();
    else {
      stop();
      status.textContent = 'Voce spenta';
    }
    render();
  });
  replay.addEventListener('click', () => {
    if (!audio.paused && !audio.ended) stop();
    else play();
  });
  for (const event of ['play', 'pause', 'ended']) audio.addEventListener(event, render);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  render();

  return {
    show(who, text) {
      stop();
      current = who === 'Prof' ? files.get(text) || null : null;
      controls.hidden = !current;
      status.hidden = !current;
      status.textContent = enabled ? 'Voce sintetica italiana' : 'Voce spenta';
      render();
      play();
    },
    hide() {
      current = null;
      stop();
      controls.hidden = true;
      status.hidden = true;
    }
  };
}

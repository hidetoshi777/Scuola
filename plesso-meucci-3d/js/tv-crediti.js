/**
 * TV dell'aula: al collaudo riuscito partono i titoli di coda sul render
 * isometrico del Plesso Meucci (al posto della vecchia sigla PlayStation).
 */

const CREDITS = [
  { t: 'MEUCCI 3 AM', s: 'h1' },
  { t: 'Circuito interrotto', s: 'h2' },
  { gap: 1 },
  { t: 'Corso AM · Plesso Meucci', s: 'p' },
  { t: 'IISS «G. Ferraris» · Acireale', s: 'p' },
  { gap: 1 },
  { t: 'Un gioco del', s: 'small' },
  { t: 'Prof. Rossano Bella', s: 'name' },
  { gap: 1 },
  { t: 'con il', s: 'small' },
  { t: 'Prof. Rosario Leotta', s: 'name' },
  { gap: 1 },
  { t: 'Classe 3 AM · a.s. 2026/2027', s: 'p' },
  { gap: 1 },
  { t: 'Prof 3D: «Cartoon Teacher Model» di eduardolira', s: 'tiny' },
  { t: 'licenza CC BY 4.0', s: 'tiny' },
  { t: 'Voce del Prof: sintesi vocale ElevenLabs', s: 'tiny' },
  { gap: 1 },
  { t: '«Prima regola: non si tocca a caso.»', s: 'quote' },
  { gap: 2 },
  { t: 'Grazie per aver giocato!', s: 'h2', final: true }
];

const STYLE = {
  h1: { font: '900 40px system-ui, sans-serif', color: '#fde68a', h: 50 },
  h2: { font: '800 26px system-ui, sans-serif', color: '#f8fafc', h: 38 },
  p: { font: '600 18px system-ui, sans-serif', color: '#e2e8f0', h: 28 },
  small: { font: '500 14px system-ui, sans-serif', color: '#94a3b8', h: 22 },
  name: { font: '800 24px system-ui, sans-serif', color: '#7dd3fc', h: 34 },
  tiny: { font: '500 12px system-ui, sans-serif', color: '#94a3b8', h: 18 },
  quote: { font: 'italic 600 17px Georgia, serif', color: '#fef3c7', h: 28 }
};
const GAP = 22;
const TITLE_CARD_S = 4.2; // cartello "Collaudo OK" prima dei titoli
const SCROLL_PX_S = 30;
const INSET = 12;       // margine nero attorno al "programma", come una TV vera
const SAFE = 26;        // le scritte svaniscono prima di arrivare al bordo
const FADE = 34;

export function createTvCredits({ canvas, imageUrl, onEnd }) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const img = new Image();
  let imgReady = false;
  img.onload = () => { imgReady = true; };
  img.src = imageUrl;

  // Posizione verticale di ogni riga dentro il blocco dei titoli
  let y = 0;
  let finalY = 0;
  const rows = CREDITS.map((c) => {
    if (c.gap) {
      y += GAP * c.gap;
      return null;
    }
    const st = STYLE[c.s];
    const row = { ...c, st, y: y + st.h / 2 };
    if (c.final) finalY = row.y;
    y += st.h;
    return row;
  }).filter(Boolean);

  let startMs = 0;
  let ended = false;
  let audio = null;

  // Cielo come nel widget del meteo: il render della scuola ha lo sfondo trasparente
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2f7fc1');
  sky.addColorStop(1, '#5aa6dc');

  function drawBackground(t) {
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    if (!imgReady) return;
    // Ken Burns: zoom lento e leggero spostamento
    const k = Math.min(1, t / 40);
    const scale = 0.98 + 0.14 * k;
    const iw = img.width;
    const ih = img.height;
    const fit = Math.min(W / iw, H / ih) * scale;
    const dw = iw * fit;
    const dh = ih * fit;
    const dx = (W - dw) / 2 - 14 * k;
    const dy = (H - dh) / 2 + 14 + 6 * k;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function drawTitleCard(t) {
    const a = Math.min(1, t / 0.6) * (t > TITLE_CARD_S - 0.6 ? Math.max(0, (TITLE_CARD_S - t) / 0.6) : 1);
    ctx.save();
    ctx.globalAlpha = a;
    const grad = ctx.createLinearGradient(0, H / 2 - 70, 0, H / 2 + 70);
    grad.addColorStop(0, 'rgba(2,6,14,0)');
    grad.addColorStop(0.5, 'rgba(2,6,14,0.82)');
    grad.addColorStop(1, 'rgba(2,6,14,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H / 2 - 70, W, 140);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4ade80';
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.fillText('COLLAUDO OK!', W / 2, H / 2 - 12);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText('La TV della 3 AM funziona di nuovo', W / 2, H / 2 + 26);
    ctx.restore();
  }

  function drawCredits(t) {
    // velo scuro che entra piano, così il render resta visibile ma il testo si legge
    const veil = Math.min(0.62, (t / 1.2) * 0.62);
    ctx.fillStyle = `rgba(2,6,14,${veil})`;
    ctx.fillRect(0, 0, W, H);

    // il blocco parte da sotto lo schermo e sale finché l'ultima riga è al centro
    const travel = H + finalY - H / 2;
    const offset = Math.min(travel, t * SCROLL_PX_S);
    const top = H - offset;
    if (offset >= travel && !ended) {
      ended = true;
      if (onEnd) onEnd();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lo = INSET + SAFE;
    const hi = H - INSET - SAFE;
    for (const r of rows) {
      const ry = top + r.y;
      // dissolvenza: la riga intera (non solo il centro) deve stare nella fascia sicura
      const room = Math.min(ry - r.st.h / 2 - lo, hi - (ry + r.st.h / 2));
      const edge = Math.min(1, room / FADE);
      if (edge <= 0) continue;
      ctx.globalAlpha = edge;
      ctx.font = r.st.font;
      ctx.fillStyle = r.st.color;
      ctx.fillText(r.t, W / 2, ry);
    }
    ctx.globalAlpha = 1;
  }

  function drawScanlines() {
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let yy = 0; yy < H; yy += 4) ctx.fillRect(0, yy, W, 1);
  }

  return {
    start(nowMs) {
      startMs = nowMs;
      ended = false;
      audio = playJingle();
    },
    stop() {
      if (audio) audio.stop();
      audio = null;
    },
    /** Disegna il fotogramma; restituisce il colore del bagliore della TV nella stanza. */
    draw(nowMs) {
      const t = (nowMs - startMs) / 1000;
      ctx.fillStyle = '#020305';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(INSET, INSET, W - INSET * 2, H - INSET * 2);
      ctx.clip();
      drawBackground(t);
      if (t < TITLE_CARD_S) {
        drawTitleCard(t);
      } else {
        drawCredits(t - TITLE_CARD_S);
      }
      drawScanlines();
      ctx.restore();
      return t < TITLE_CARD_S ? 0xbbf7d0 : 0x93c5fd;
    }
  };
}

// Jingle allegro: arpeggio, giro di accordi e chiusura, ~9 secondi
let sharedCtx = null;
function playJingle() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    sharedCtx = sharedCtx || new AC();
    const ctx = sharedCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
    const t0 = ctx.currentTime + 0.05;

    const note = (freq, t, dur, type = 'triangle', vol = 0.18) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + dur + 0.05);
    };

    const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;
    // fanfara iniziale
    [C5, E5, G5, C6].forEach((f, i) => note(f, t0 + i * 0.12, 0.5, 'square', 0.08));
    note(C6, t0 + 0.5, 0.9, 'triangle', 0.16);
    note(G5 * 1.5, t0 + 0.5, 0.9, 'sine', 0.06);

    // giro I–V–vi–IV in Do, arpeggiato
    const chords = [
      [261.63, 329.63, 392.0],
      [196.0, 246.94, 392.0],
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 349.23]
    ];
    chords.forEach((ch, i) => {
      const tc = t0 + 1.6 + i * 1.6;
      note(ch[0] / 2, tc, 1.6, 'sine', 0.16);
      ch.forEach((f, j) => {
        note(f, tc + j * 0.18, 1.2, 'triangle', 0.1);
        note(f * 2, tc + 0.8 + j * 0.12, 0.6, 'sine', 0.05);
      });
    });
    // chiusura
    const tend = t0 + 1.6 + 4 * 1.6;
    [261.63, 329.63, 392.0, 523.25].forEach((f) => note(f, tend, 2.4, 'triangle', 0.1));
    note(C6, tend + 0.1, 2.0, 'sine', 0.08);

    return { stop: () => { try { master.disconnect(); } catch (_) { /* già staccato */ } } };
  } catch (e) {
    console.warn('Web Audio non disponibile:', e);
    return null;
  }
}

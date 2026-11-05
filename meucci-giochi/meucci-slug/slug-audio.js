/* Meucci Slug - Audio Engine (Web Audio API Synthesizer & voci ElevenLabs) */
(() => {
  'use strict';

  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  function initCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function noiseBuffer() {
    if (!ctx) return null;
    const size = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Voci registrate con ElevenLabs (generate da _voce_slug.py): annunciatore arcade + Prof. Bella
  const VOCI = ['start1', 'start2', 'heavy', 'shotgun', 'rocket', 'laser', 'moke', 'bomb', 'cedolino',
    'boss1', 'boss2', 'complete1', 'complete2', 'gameover',
    'prof_start1', 'prof_start2', 'prof_moke', 'prof_coffee', 'prof_arancino',
    'prof_hit1', 'prof_hit2', 'prof_hit3', 'prof_win1', 'prof_win2'];
  const vocePath = k => 'assets/voce/' + k + '.mp3';
  // gli mp3 si scaricano subito; si decodificano quando esiste l'AudioContext (dopo il primo tocco)
  const voceRaw = {};
  VOCI.forEach(k => {
    voceRaw[k] = fetch(vocePath(k)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
  });
  const voceBuf = {};
  let voceSrc = null, voceEl = null, voceTimer = null, lastQuip = 0, quipIdx = 0;

  function decodeVoce(k) {
    if (!voceBuf[k]) {
      voceBuf[k] = voceRaw[k].then(ab => (ab ? new Promise(res => ctx.decodeAudioData(ab.slice(0), res, () => res(null))) : null));
    }
    return voceBuf[k];
  }
  function stopVoce() {
    if (voceSrc) { try { voceSrc.stop(); } catch (_) {} voceSrc = null; }
    if (voceEl) { voceEl.pause(); voceEl = null; }
  }
  // ripiego con <audio> (es. pagina aperta da file, dove fetch e' bloccato)
  function playEl(k) {
    stopVoce();
    const a = new Audio(vocePath(k));
    a.volume = 0.95;
    a.onended = () => { if (voceEl === a) voceEl = null; };
    a.play().catch(() => {});
    voceEl = a;
  }
  function voce(k) {
    if (muted || !voceRaw[k]) return;
    clearTimeout(voceTimer);
    initCtx();
    if (!ctx) { playEl(k); return; }
    const t0 = performance.now();
    decodeVoce(k).then(buf => {
      if (muted || performance.now() - t0 > 1500) return;
      if (!buf) { playEl(k); return; }
      stopVoce();
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      src.buffer = buf;
      g.gain.value = 0.95;
      src.connect(g);
      g.connect(ctx.destination);
      src.onended = () => { if (voceSrc === src) voceSrc = null; };
      src.start();
      voceSrc = src;
    });
  }
  // la battuta del Prof arriva quando l'annunciatore ha finito (al massimo 4 s di attesa)
  function poi(k, ms) {
    clearTimeout(voceTimer);
    const t0 = performance.now();
    const tick = () => {
      if (voceSrc || voceEl) {
        if (performance.now() - t0 < ms + 4000) voceTimer = setTimeout(tick, 120);
        return;
      }
      voce(k);
    };
    voceTimer = setTimeout(tick, ms);
  }

  const MeucciSlugAudio = {
    arm() {
      initCtx();
      if (ctx) VOCI.forEach(decodeVoce);
    },

    toggleMute() {
      muted = !muted;
      if (muted) { stopVoce(); clearTimeout(voceTimer); }
      if (muted && ctx && ctx.state === 'running') ctx.suspend();
      if (!muted && ctx && ctx.state === 'suspended') ctx.resume();
      return muted;
    },

    isMuted() {
      return muted;
    },

    play(name) {
      if (muted) return;
      initCtx();
      if (!ctx) return;
      const t = ctx.currentTime;

      if (name === 'shoot') {
        // Timbro base: snappy stamp thud + chirp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
      } else if (name === 'heavy') {
        // Heavy Machine Gun: metallic punch
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.06);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.06);
      } else if (name === 'shotgun') {
        // Shotgun Ferie: explosive blast
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.22);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      } else if (name === 'rocket') {
        // Rocket Launcher: whoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(450, t + 0.18);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      } else if (name === 'explosion') {
        // Low rumble explosion
        const src = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        src.buffer = noiseBuffer();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, t);
        filter.frequency.exponentialRampToValueAtTime(50, t + 0.35);
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(t);
        src.stop(t + 0.35);
      } else if (name === 'jump') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(480, t + 0.12);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      } else if (name === 'horn') {
        // Mini Moke clacson
        [360, 440].forEach(f => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, t);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.setValueAtTime(0.2, t + 0.14);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.18);
        });
      } else if (name === 'pickup') {
        // High dual chime
        [587, 880].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + idx * 0.06);
          gain.gain.setValueAtTime(0.25, t + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t + idx * 0.06);
          osc.stop(t + idx * 0.06 + 0.14);
        });
      } else if (name === 'hit') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      } else if (name === 'precario_screams') {
        const quotes = ['Nooo!', 'Il mio ricorso!', 'I miei 60 CFU!', 'Ero a 42 punti!', 'Scavallato!'];
        // Occasional comic text or audio
      }
    },

    announce(what) {
      if (/^start\d$/.test(what)) { voce(what); poi('prof_' + what, 500); }
      else if (/^complete\d$/.test(what)) { voce(what); poi('prof_win' + what.slice(-1), 500); }
      else if (what === 'moke') { voce('moke'); poi('prof_moke', 400); }
      else if (what === 'coffee' || what === 'arancino') voce('prof_' + what);
      else if (what === 'hit') {
        // battuta del Prof quando lo colpiscono: rara, e mai sopra un'altra voce
        const now = performance.now();
        if (voceSrc || voceEl || now - lastQuip < 7000 || Math.random() < 0.4) return;
        lastQuip = now;
        voce('prof_hit' + (1 + (quipIdx++ % 3)));
      }
      else voce(what);
    },

    startMusic() {
      if (musicTimer) return;
      initCtx();
      // Arcade bass rhythm (132 BPM)
      const bassNotes = [110, 110, 130.8, 110, 146.8, 130.8, 110, 98];
      musicTimer = setInterval(() => {
        if (muted || !ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const freq = bassNotes[musicStep % bassNotes.length];
        musicStep++;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.14);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);

        // Hi-hat noise on alternating steps
        if (musicStep % 2 === 1) {
          const src = ctx.createBufferSource();
          const filter = ctx.createBiquadFilter();
          const hgain = ctx.createGain();
          src.buffer = noiseBuffer();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(6000, now);
          hgain.gain.setValueAtTime(0.04, now);
          hgain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          src.connect(filter);
          filter.connect(hgain);
          hgain.connect(ctx.destination);
          src.start(now);
          src.stop(now + 0.04);
        }
      }, 225);
    },

    stopMusic() {
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    }
  };

  window.MeucciSlugAudio = MeucciSlugAudio;
})();

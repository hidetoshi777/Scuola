/* Meucci Slug - Audio Engine (Web Audio API Synthesizer & Speech Announcer) */
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

  function speak(text) {
    if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'it-IT';
      u.rate = 1.15;
      u.pitch = 0.85; // Deep arcade voice
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  const MeucciSlugAudio = {
    arm() {
      initCtx();
    },

    toggleMute() {
      muted = !muted;
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

    announce(weapon) {
      if (weapon === 'start') speak('Missione uno. Partenza!');
      else if (weapon === 'heavy') speak('Heavy Concorso!');
      else if (weapon === 'shotgun') speak('Ferie di agosto!');
      else if (weapon === 'rocket') speak('Ricorso respinto!');
      else if (weapon === 'laser') speak('Laser del Tester!');
      else if (weapon === 'moke') speak('Moke Slug!');
      else if (weapon === 'complete') speak('Missione compiuta! Il ruolo è salvo!');
      else if (weapon === 'gameover') speak('Game Over! Fila riassegnata.');
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

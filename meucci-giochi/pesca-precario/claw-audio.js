/* Synthesized arcade & bureaucratic sounds; audio starts only after a user gesture. */
(() => {
  'use strict';
  const button = document.getElementById('sound');
  const KEY = 'meucci-claw-sound-v1';
  let enabled = false;
  let unavailable = false;
  let context = null;
  let master = null;
  let noiseBuffer = null;
  const lastPlayed = new Map();

  try {
    enabled = localStorage.getItem(KEY) === '1';
  } catch (_) {
    /* Optional preference. */
  }

  function update() {
    if (!button) return;
    button.textContent = unavailable ? 'Suoni non disponibili' : `♫ Suoni: ${enabled ? 'accesi' : 'spenti'}`;
    button.setAttribute('aria-pressed', String(enabled));
    button.disabled = unavailable;
    button.title = enabled ? 'Tocca per spegnere i suoni' : 'Tocca per accendere i suoni';
  }

  async function arm() {
    if (!enabled || unavailable) return;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('Audio unavailable');
        context = new Audio();
        master = context.createGain();
        master.gain.value = 0.22;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.ratio.value = 4;
        master.connect(compressor);
        compressor.connect(context.destination);

        noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.8), context.sampleRate);
        const samples = noiseBuffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      }
      await context.resume();
      master.gain.setTargetAtTime(enabled ? 0.22 : 0, context.currentTime, 0.025);
    } catch (_) {
      enabled = false;
      unavailable = true;
      update();
    }
  }

  function tone(frequency, end, duration, volume, type = 'sine', delay = 0) {
    const now = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, frequency), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.025);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  function noise(duration, volume, cutoff, delay = 0) {
    const now = context.currentTime + delay;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + duration + 0.025);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  function play(kind) {
    if (!enabled || !context || context.state !== 'running') return;
    const now = context.currentTime;
    const cooldowns = { move: 0.14, chute: 0.2, siren: 0.35, rettifica: 0.5, coffee: 0.3 };
    const cooldown = cooldowns[kind] ?? 0.12;
    if (now - (lastPlayed.get(kind) ?? -10) < cooldown) return;
    lastPlayed.set(kind, now);

    if (kind === 'move') {
      tone(145, 165, 0.06, 0.12, 'triangle');
      noise(0.04, 0.05, 650);
    } else if (kind === 'drop') {
      tone(420, 140, 0.34, 0.28, 'triangle');
      noise(0.18, 0.12, 950);
    } else if (kind === 'grab') {
      noise(0.08, 0.32, 1600);
      tone(220, 520, 0.14, 0.32, 'square');
    } else if (kind === 'siren') {
      tone(760, 540, 0.16, 0.34, 'sawtooth', 0);
      tone(540, 760, 0.16, 0.34, 'sawtooth', 0.16);
      tone(760, 540, 0.16, 0.28, 'sawtooth', 0.32);
    } else if (kind === 'slip') {
      tone(640, 150, 0.36, 0.34, 'sine');
      tone(320, 110, 0.32, 0.2, 'triangle', 0.08);
    } else if (kind === 'chute') {
      tone(260, 95, 0.16, 0.38, 'triangle');
      noise(0.09, 0.35, 1200, 0.09);
      tone(150, 68, 0.14, 0.42, 'triangle', 0.09);
    } else if (kind === 'rettifica') {
      tone(175, 130, 0.26, 0.42, 'sawtooth', 0);
      tone(240, 690, 0.18, 0.34, 'triangle', 0.2);
      tone(690, 140, 0.24, 0.28, 'triangle', 0.36);
    } else if (kind === 'coffee') {
      tone(523, 523, 0.14, 0.22, 'sine', 0);
      tone(659, 659, 0.22, 0.24, 'sine', 0.1);
    } else if (kind === 'target') {
      tone(740, 980, 0.09, 0.24, 'sine', 0);
      tone(980, 1320, 0.12, 0.22, 'sine', 0.08);
    }
  }

  if (button) {
    button.addEventListener('click', async () => {
      enabled = !enabled;
      update();
      if (enabled) {
        await arm();
        play('coffee');
      } else if (context) {
        master.gain.setTargetAtTime(0, context.currentTime, 0.025);
      }
      try {
        localStorage.setItem(KEY, enabled ? '1' : '0');
      } catch (_) {
        /* Keep the in-session choice. */
      }
      update();
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (context && document.hidden) context.suspend().catch(() => {});
    else if (context && enabled) arm();
  });

  window.ClawAudio = {
    arm,
    play,
    get enabled() {
      return enabled;
    },
  };
  update();
})();

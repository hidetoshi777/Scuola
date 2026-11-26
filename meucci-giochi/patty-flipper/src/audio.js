// Motore audio ibrido: Web Audio sintetico arcade + campionamento reale patty_bark.mp3

export class PinballAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.barkBuffer = null;
    this.barkFallback = null;
    this.lastBarkAt = 0;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        this.loadBark();
      }
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  async loadBark() {
    try {
      const res = await fetch('./assets/patty_bark.mp3');
      if (!res.ok) return;
      const arr = await res.arrayBuffer();
      if (this.ctx) {
        this.barkBuffer = await this.ctx.decodeAudioData(arr);
      }
    } catch {
      // Fallback silenzioso se decodeAudioData fallisce
      this.barkFallback = new Audio('./assets/patty_bark.mp3');
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
  }

  playBark(pitch = 1.0) {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastBarkAt < 450) return;
    this.lastBarkAt = nowMs;

    if (this.ctx && this.barkBuffer) {
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      src.buffer = this.barkBuffer;
      src.playbackRate.value = pitch;
      gain.gain.value = 0.58;
      src.connect(gain).connect(this.ctx.destination);
      src.start();
    } else if (this.barkFallback) {
      this.barkFallback.currentTime = 0;
      this.barkFallback.volume = 0.5;
      this.barkFallback.play().catch(() => {});
    }
  }

  tone(freq, dur = 0.08, type = 'triangle', vol = 0.1, endFreq = null) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t + dur);
    }
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  flipper() {
    this.tone(175, 0.045, 'triangle', 0.11, 75);
  }

  flipperHit() {
    this.tone(310, 0.06, 'sine', 0.12, 190);
  }

  bumper(combo = 1) {
    const base = 390 + Math.min(combo, 10) * 35;
    this.tone(base, 0.09, 'sine', 0.14, base * 1.45);
    this.tone(base * 0.5, 0.06, 'triangle', 0.08, 90);
  }

  slingshot() {
    this.tone(260, 0.07, 'square', 0.065, 520);
  }

  launch(power = 0.8) {
    this.tone(140, 0.16, 'sawtooth', 0.07, 420 + power * 240);
  }

  rollover(index = 0) {
    const notes = [523.25, 659.25, 783.99];
    this.tone(notes[index % 3], 0.12, 'sine', 0.12);
  }

  dropTarget() {
    this.tone(620, 0.08, 'triangle', 0.11, 340);
  }

  spinner() {
    this.tone(880, 0.05, 'sine', 0.07, 1280);
  }

  multiplierUp() {
    this.tone(523, 0.09, 'triangle', 0.12);
    setTimeout(() => this.tone(659, 0.09, 'triangle', 0.12), 75);
    setTimeout(() => this.tone(784, 0.16, 'triangle', 0.13), 150);
    this.playBark(1.06);
  }

  feverStart() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.14, 'triangle', 0.13), i * 70);
    });
    this.playBark(1.12);
  }

  ballSave() {
    this.tone(440, 0.12, 'sine', 0.12, 880);
    this.playBark(1.0);
  }

  drain() {
    this.tone(240, 0.34, 'sawtooth', 0.08, 95);
  }

  tilt() {
    this.tone(110, 0.38, 'sawtooth', 0.1, 60);
  }
}

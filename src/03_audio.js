/* =====================================================================
   03_audio.js — Audio procedural con Web Audio API.
   Ambientes (mar, viento, zumbido, aves), SFX sintetizados y
   un secuenciador ligero de música por nivel. Sin archivos de audio.
   No suena nada antes de la primera interacción del usuario.
   ===================================================================== */

const NOTE_I = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function noteToMidi(n) { const m = /^([A-G][#b]?)(-?\d)$/.exec(n); if (!m) return null; return 12 * (parseInt(m[2]) + 1) + NOTE_I[m[1]]; }
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

/* Pistas: cada token de melodía = corchea. '.' silencio, '-' prolonga. Acordes: raíz por compás. */
const MUSIC = {
  title: { bpm: 92, key: 'D', lead: 'marimba', pad: true, drums: 'soft', bassStyle: 'pulse',
    chords: ['Dm9', 'Bbmaj7', 'Fmaj7', 'C6'],
    mel: 'A4 . D5 E5 F5 - E5 D5 | C5 . A4 - G4 A4 C5 - | A4 . F4 G4 A4 - C5 D5 | E5 - D5 C5 D5 - - . ' },
  festival: { bpm: 112, key: 'G', lead: 'pluck', pad: false, drums: 'cumbia', bassStyle: 'cumbia',
    chords: ['G', 'C', 'D', 'G', 'Em', 'C', 'D7', 'G'],
    mel: 'B4 D5 G5 - F#5 E5 D5 B4 | C5 E5 G5 - E5 D5 C5 . | A4 D5 F#5 - E5 D5 C5 A4 | B4 - G4 - . . . . | G5 . E5 - D5 B4 D5 E5 | C5 - E5 - G5 - E5 . | D5 C5 B4 A4 F#4 A4 D5 . | G4 - - . . . . . ' },
  coast: { bpm: 84, key: 'A', lead: 'marimba', pad: true, drums: 'soft', bassStyle: 'roots',
    chords: ['Amaj7', 'F#m7', 'Dmaj7', 'E6'],
    mel: 'E5 . C#5 . B4 C#5 E5 . | F#5 - E5 . C#5 . A4 . | . B4 C#5 E5 F#5 . E5 C#5 | B4 - - . G#4 A4 B4 . ' },
  plant: { bpm: 100, key: 'E', lead: 'bell', pad: true, drums: 'tech', bassStyle: 'pulse',
    chords: ['Em7', 'Cmaj7', 'Am7', 'B7sus'],
    mel: 'B4 . E5 . G5 . F#5 E5 | . . B4 . C5 . B4 . | A4 . C5 . E5 . D5 C5 | B4 - - - . . . . ' },
  mystery: { bpm: 70, key: 'C', lead: 'bell', pad: true, drums: 'none', bassStyle: 'drone',
    chords: ['Cm(add9)', 'Abmaj7', 'Fm9', 'G7b9'],
    mel: 'G5 . . Eb5 . . D5 . | . . C5 . . . . . | Ab4 . . C5 . . F5 . | . . D5 - - . B4 . ' },
  dunes: { bpm: 88, key: 'F', lead: 'flute', pad: true, drums: 'soft', bassStyle: 'roots',
    chords: ['F', 'Am7', 'Bbmaj7', 'C'],
    mel: 'A4 C5 F5 - E5 . C5 . | E5 - D5 C5 A4 . . . | D5 . F5 . A5 - G5 F5 | E5 - C5 - . . . . ' },
  wind: { bpm: 96, key: 'D', lead: 'flute', pad: true, drums: 'soft', bassStyle: 'pulse',
    chords: ['Dmaj7', 'Em7', 'F#m7', 'Gmaj7'],
    mel: 'F#5 . A5 . E5 . D5 . | B4 - D5 - E5 . F#5 . | C#5 . E5 . A5 - F#5 . | G5 - F#5 E5 D5 - . . ' },
  vault: { bpm: 104, key: 'B', lead: 'lead', pad: true, drums: 'tech', bassStyle: 'pulse',
    chords: ['Bm', 'G', 'Em', 'F#7'],
    mel: 'F#4 B4 D5 F#5 . D5 B4 . | G4 B4 D5 G5 . D5 B4 . | E4 G4 B4 E5 . B4 G4 . | F#4 A#4 C#5 F#5 - - . . ' },
  sad: { bpm: 66, key: 'A', lead: 'marimba', pad: true, drums: 'none', bassStyle: 'drone',
    chords: ['Am', 'F', 'C', 'G'],
    mel: 'E5 . . C5 . . A4 . | . . F4 . A4 . C5 . | E5 . . D5 . . C5 . | B4 - - - . . . . ' },
  citadel: { bpm: 108, key: 'C', lead: 'bell', pad: true, drums: 'tech', bassStyle: 'pulse',
    chords: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G6', 'Am7', 'Fmaj7', 'G'],
    mel: 'E5 G5 B5 . A5 G5 E5 . | F5 A5 C6 . B5 A5 F5 . | G5 B5 D6 . C6 B5 G5 . | A5 - G5 - E5 - D5 . ' },
  oasis: { bpm: 94, key: 'G', lead: 'pluck', pad: true, drums: 'cumbia', bassStyle: 'roots',
    chords: ['Gmaj7', 'Em7', 'Cmaj7', 'D6'],
    mel: 'D5 . B4 G4 A4 B4 D5 . | E5 - D5 B4 G4 . . . | C5 E5 G5 - F#5 E5 D5 . | B4 A4 G4 - . . . . ' },
  council: { bpm: 80, key: 'Eb', lead: 'bell', pad: true, drums: 'soft', bassStyle: 'roots',
    chords: ['Ebmaj7', 'Cm7', 'Abmaj7', 'Bb'],
    mel: 'G5 . Eb5 . Bb4 . Eb5 F5 | G5 - - . . F5 Eb5 . | C5 . Eb5 . Ab5 - G5 F5 | Eb5 - D5 - Bb4 - . . ' },
  calima: { bpm: 124, key: 'D', lead: 'lead', pad: true, drums: 'drive', bassStyle: 'drive',
    chords: ['Dm', 'Bb', 'C', 'A7'],
    mel: 'D5 . F5 . A5 . F5 D5 | Bb4 . D5 . F5 . D5 Bb4 | C5 . E5 . G5 . E5 C5 | C#5 - E5 - A5 - . . ' },
  ending: { bpm: 90, key: 'D', lead: 'marimba', pad: true, drums: 'soft', bassStyle: 'pulse',
    chords: ['D', 'A/C#', 'Bm7', 'Gmaj7', 'Em7', 'A', 'Dmaj7', 'A'],
    mel: 'F#5 - E5 D5 E5 - A4 . | F#5 - E5 D5 B4 - . . | D5 E5 F#5 - A5 - G5 F#5 | E5 - - - . . . . ' },
};
const CHORD_Q = {
  '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], m9: [0, 3, 7, 10, 14], '6': [0, 4, 7, 9],
  'm(add9)': [0, 3, 7, 14], '7sus': [0, 5, 7, 10], '7b9': [0, 4, 7, 10, 13], sus: [0, 5, 7],
};
function parseChord(name) {
  const base = name.split('/')[0];
  const m = /^([A-G][#b]?)(.*)$/.exec(base);
  const root = NOTE_I[m[1]];
  const q = CHORD_Q[m[2]] || CHORD_Q[''];
  return { root, ints: q };
}

const Audio2 = {
  ctx: null, ok: false, master: null, music: null, sfxG: null, amb: null, noiseBuf: null,
  ambNodes: {}, ambTarget: { sea: 0, wind: 0, hum: 0, birds: 0, storm: 0, bubbles: 0 },
  track: null, trackName: null, step: 0, nextTime: 0, timer: null, intensity: 1,
  unlock() {
    if (this.ok) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.9;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      this.master.connect(comp); comp.connect(c.destination);
      this.music = c.createGain(); this.music.connect(this.master);
      this.sfxG = c.createGain(); this.sfxG.connect(this.master);
      this.amb = c.createGain(); this.amb.connect(this.master);
      this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0); let b = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = 0.98 * b + 0.02 * w; d[i] = w * 0.6 + b * 2.2; }
      this.pulse = c.createPeriodicWave(...this._pulseCoeffs(0.25));
      this.ok = true;
      this.applyVolumes();
      this._startAmbience();
      this.timer = setInterval(() => this._schedule(), 25);
      if (this._pendingTrack) { const t = this._pendingTrack; this._pendingTrack = null; this.playMusic(t); }
    } catch (e) { this.ok = false; }
  },
  _pulseCoeffs(duty) {
    const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
    for (let k = 1; k < n; k++) { real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) * Math.cos(k * Math.PI * duty); imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) * Math.sin(k * Math.PI * duty); }
    return [real, imag];
  },
  applyVolumes() {
    if (!this.ok) return;
    const s = Game.settings;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(s.music * 0.42, t, 0.1);
    this.sfxG.gain.setTargetAtTime(s.sfx * 0.8, t, 0.05);
    this.amb.gain.setTargetAtTime(s.ambience * 0.7, t, 0.1);
  },
  noise(t, dur, { type = 'bandpass', freq = 1000, q = 1, gain = 0.3, attack = 0.002, dest = null, freqEnd = null } = {}) {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const gn = c.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(gain, t + attack); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(gn); gn.connect(dest || this.sfxG);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
  },
  tone(t, freq, dur, { type = 'sine', gain = 0.2, attack = 0.005, release = null, freqEnd = null, dest = null, vib = 0, detune = 0, wave = null } = {}) {
    const c = this.ctx;
    const o = c.createOscillator();
    if (wave) o.setPeriodicWave(wave); else o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.detune.value = detune;
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(gain, t + attack);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + (release ?? dur));
    if (vib) { const l = c.createOscillator(); l.frequency.value = 5.5; const lg = c.createGain(); lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
    o.connect(gn); gn.connect(dest || this.sfxG);
    o.start(t); o.stop(t + (release ?? dur) + 0.05);
  },
  sfx(name, opt = {}) {
    if (!this.ok || Game.settings.sfx <= 0) return;
    const t = this.ctx.currentTime + 0.005;
    const v = opt.vol ?? 1;
    switch (name) {
      case 'jump': this.tone(t, 280, 0.14, { type: 'square', gain: 0.06 * v, freqEnd: 620 }); break;
      case 'land': this.noise(t, 0.08, { type: 'lowpass', freq: 500, gain: 0.18 * v }); break;
      case 'step': this.noise(t, 0.04, { type: 'bandpass', freq: 1800 + Math.random() * 900, q: 2, gain: 0.05 * v }); break;
      case 'stepMetal': this.tone(t, 900 + Math.random() * 200, 0.05, { type: 'triangle', gain: 0.03 * v }); this.noise(t, 0.03, { freq: 4000, gain: 0.03 * v }); break;
      case 'splash': this.noise(t, 0.25, { type: 'bandpass', freq: 1500, freqEnd: 500, q: 0.8, gain: 0.14 * v }); break;
      case 'ui': this.tone(t, 1046, 0.05, { type: 'triangle', gain: 0.07 * v }); break;
      case 'uiMove': this.tone(t, 784, 0.03, { type: 'triangle', gain: 0.04 * v }); break;
      case 'uiBack': this.tone(t, 523, 0.07, { type: 'triangle', gain: 0.06 * v, freqEnd: 392 }); break;
      case 'confirm': this.tone(t, 659, 0.07, { type: 'triangle', gain: 0.08 * v }); this.tone(t + 0.06, 988, 0.12, { type: 'triangle', gain: 0.08 * v }); break;
      case 'success': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(t + i * 0.07, f, 0.35, { type: 'triangle', gain: 0.07 * v })); this.tone(t + 0.35, 2093, 0.5, { gain: 0.03 * v }); break;
      case 'unlock': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(t + i * 0.09, f, 0.5, { type: 'square', wave: this.pulse, gain: 0.05 * v })); [1568, 2093].forEach((f, i) => this.tone(t + 0.5 + i * 0.12, f, 0.8, { gain: 0.04 * v })); break;
      case 'error': this.tone(t, 330, 0.16, { type: 'triangle', gain: 0.08 * v }); this.tone(t + 0.12, 247, 0.22, { type: 'triangle', gain: 0.08 * v }); break;
      case 'soft': this.tone(t, 587, 0.1, { type: 'sine', gain: 0.06 * v }); break;
      case 'alarm': for (let i = 0; i < 3; i++) { this.tone(t + i * 0.32, 880, 0.15, { type: 'square', wave: this.pulse, gain: 0.04 * v }); this.tone(t + i * 0.32 + 0.16, 660, 0.15, { type: 'square', wave: this.pulse, gain: 0.04 * v }); } break;
      case 'scan': this.tone(t, 400, 0.5, { type: 'sine', gain: 0.07 * v, freqEnd: 1800, vib: 30 }); break;
      case 'sample': [0, 0.05, 0.1].forEach((d, i) => this.tone(t + d, 500 + i * 220, 0.08, { gain: 0.06 * v, freqEnd: 900 + i * 300 })); break;
      case 'drip': this.tone(t, 1400, 0.12, { gain: 0.07 * v, freqEnd: 500 }); break;
      case 'pump': this.tone(t, 70, 0.6, { type: 'sawtooth', gain: 0.05 * v, attack: 0.1 }); this.noise(t, 0.6, { type: 'lowpass', freq: 300, gain: 0.06 * v, attack: 0.1 }); break;
      case 'charge': [0, 0.08, 0.16, 0.24].forEach((d, i) => this.tone(t + d, 600 + i * 150, 0.07, { type: 'square', wave: this.pulse, gain: 0.03 * v })); break;
      case 'discharge': [0, 0.08, 0.16].forEach((d, i) => this.tone(t + d, 900 - i * 180, 0.07, { type: 'square', wave: this.pulse, gain: 0.03 * v })); break;
      case 'bubble': for (let i = 0; i < 4; i++) this.tone(t + i * 0.05 + Math.random() * 0.03, 500 + Math.random() * 700, 0.05, { gain: 0.03 * v, freqEnd: 1500 }); break;
      case 'gust': this.noise(t, 0.9, { type: 'bandpass', freq: 400, freqEnd: 1400, q: 1.5, gain: 0.12 * v, attack: 0.3 }); break;
      case 'limen': [1568, 2349, 3136].forEach((f, i) => this.tone(t + i * 0.04, f, 1.2, { gain: 0.03 * v, detune: (i - 1) * 8 })); break;
      case 'mirage': this.tone(t, 220, 1.2, { type: 'sawtooth', gain: 0.03 * v, freqEnd: 440, attack: 0.3 }); this.tone(t, 223, 1.2, { type: 'sine', gain: 0.05 * v, freqEnd: 330, attack: 0.3 }); break;
      case 'mystery': this.tone(t, 98, 1.6, { type: 'sine', gain: 0.12 * v, attack: 0.05 }); this.tone(t, 147, 1.6, { type: 'triangle', gain: 0.04 * v, attack: 0.3 }); this.tone(t + 0.2, 1175, 1.4, { gain: 0.02 * v }); break;
      case 'hit': this.noise(t, 0.12, { type: 'lowpass', freq: 900, gain: 0.15 * v }); this.tone(t, 200, 0.12, { type: 'square', wave: this.pulse, gain: 0.04 * v, freqEnd: 90 }); break;
      case 'page': this.noise(t, 0.12, { type: 'highpass', freq: 2500, gain: 0.06 * v, attack: 0.02 }); break;
      case 'collect': [1046, 1318, 1568].forEach((f, i) => this.tone(t + i * 0.05, f, 0.15, { type: 'triangle', gain: 0.05 * v })); break;
      case 'valve': this.noise(t, 0.3, { type: 'bandpass', freq: 3000, freqEnd: 800, gain: 0.08 * v }); this.tone(t, 180, 0.12, { type: 'square', wave: this.pulse, gain: 0.04 * v }); break;
      case 'power': this.tone(t, 110, 0.8, { type: 'sawtooth', gain: 0.05 * v, freqEnd: 220, attack: 0.1 }); this.tone(t + 0.3, 880, 0.4, { gain: 0.03 * v }); break;
      case 'blackout': this.tone(t, 220, 1.2, { type: 'sawtooth', gain: 0.08 * v, freqEnd: 40 }); this.noise(t, 0.5, { type: 'lowpass', freq: 400, gain: 0.1 * v }); break;
      case 'voice': {
        const vc = opt.voice || 'amaya';
        const V = { amaya: [440, 'triangle', 0.035], kiru: [880, 'square', 0.018], naira: [330, 'sine', 0.05], dante: [294, 'square', 0.02], eliana: [392, 'sine', 0.045], limen: [1568, 'sine', 0.02], mirage: [262, 'sawtooth', 0.015], mosaico: [523, 'triangle', 0.03], npc: [370, 'triangle', 0.03], beta: [660, 'square', 0.015] }[vc] || [440, 'triangle', 0.03];
        const f = V[0] * (0.9 + Math.random() * 0.25);
        this.tone(t, f, 0.045, { type: V[1], wave: V[1] === 'square' ? this.pulse : null, gain: V[2] * v, freqEnd: f * (vc === 'kiru' ? 1.3 : 1.05) });
        break;
      }
      default: this.tone(t, 660, 0.05, { type: 'triangle', gain: 0.05 * v });
    }
  },
  /* ---------- ambiente continuo ---------- */
  _startAmbience() {
    const c = this.ctx;
    const mk = (type, freq, q) => {
      const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const gn = c.createGain(); gn.gain.value = 0;
      src.connect(f); f.connect(gn); gn.connect(this.amb); src.start();
      return { src, f, gn };
    };
    this.ambNodes.sea = mk('lowpass', 520, 0.6);
    this.ambNodes.wind = mk('bandpass', 600, 1.2);
    this.ambNodes.storm = mk('bandpass', 260, 0.7);
    const hum = c.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 55;
    const hf = c.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 180;
    const hg = c.createGain(); hg.gain.value = 0; hum.connect(hf); hf.connect(hg); hg.connect(this.amb); hum.start();
    this.ambNodes.hum = { gn: hg };
    this._ambT = 0;
  },
  setAmbience(o) { Object.assign(this.ambTarget, { sea: 0, wind: 0, hum: 0, birds: 0, storm: 0, bubbles: 0 }, o); },
  updateAmbience(dt) {
    if (!this.ok) return;
    this._ambT += dt;
    const t = this.ctx.currentTime, a = this.ambTarget, T = this._ambT;
    const wave = 0.55 + 0.45 * Math.sin(T * 0.9) * Math.sin(T * 0.37 + 1);
    this.ambNodes.sea.gn.gain.setTargetAtTime(a.sea * 0.22 * wave, t, 0.3);
    this.ambNodes.sea.f.frequency.setTargetAtTime(380 + 300 * wave, t, 0.3);
    const gust = 0.5 + 0.5 * Math.sin(T * 0.6) * Math.sin(T * 0.23 + 2);
    this.ambNodes.wind.gn.gain.setTargetAtTime(a.wind * 0.16 * (0.4 + gust), t, 0.4);
    this.ambNodes.wind.f.frequency.setTargetAtTime(400 + 900 * gust, t, 0.4);
    this.ambNodes.storm.gn.gain.setTargetAtTime(a.storm * 0.35 * (0.6 + 0.4 * gust), t, 0.5);
    this.ambNodes.hum.gn.gain.setTargetAtTime(a.hum * 0.05, t, 0.4);
    if (a.birds > 0 && Math.random() < dt * 0.35 * a.birds) {
      const f = 2200 + Math.random() * 1600; const n = 2 + (Math.random() * 3 | 0);
      for (let i = 0; i < n; i++) this.tone(t + i * 0.09, f * (1 + (i % 2) * 0.18), 0.07, { gain: 0.012, freqEnd: f * 1.25, dest: this.amb });
    }
    if (a.bubbles > 0 && Math.random() < dt * 3 * a.bubbles) this.tone(t, 500 + Math.random() * 900, 0.05, { gain: 0.012, freqEnd: 1600, dest: this.amb });
  },
  /* ---------- música ---------- */
  playMusic(name) {
    if (this.trackName === name) return;
    if (!this.ok) { this._pendingTrack = name; this.trackName = null; return; }
    this.trackName = name;
    const tr = MUSIC[name];
    if (!tr) { this.track = null; return; }
    const mel = tr.mel.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
    this.track = Object.assign({}, tr, { melTokens: mel, chordObjs: tr.chords.map(parseChord), root: NOTE_I[tr.key] });
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.12;
    const t = this.ctx.currentTime;
    this.music.gain.cancelScheduledValues(t);
    this.music.gain.setValueAtTime(0.0001, t);
    this.music.gain.linearRampToValueAtTime(Game.settings.music * 0.42, t + 1.2);
  },
  stopMusic() { this.track = null; this.trackName = null; },
  _schedule() {
    if (!this.ok || !this.track || this.ctx.state !== 'running') return;
    const tr = this.track;
    const stepDur = 60 / tr.bpm / 4; // semicorchea
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this._playStep(this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step++;
    }
  },
  _inst(name, t, midi, dur, vel) {
    const f = mtof(midi), dest = this.music;
    switch (name) {
      case 'marimba': this.tone(t, f, dur, { type: 'sine', gain: 0.16 * vel, release: Math.min(0.6, dur + 0.25), dest }); this.tone(t, f * 4, 0.03, { type: 'triangle', gain: 0.03 * vel, dest }); break;
      case 'pluck': this.tone(t, f, dur, { type: 'triangle', gain: 0.13 * vel, release: Math.min(0.4, dur + 0.15), dest }); this.tone(t, f * 2, 0.06, { type: 'square', wave: this.pulse, gain: 0.02 * vel, dest }); break;
      case 'bell': this.tone(t, f, dur, { type: 'sine', gain: 0.11 * vel, release: dur + 0.9, dest }); this.tone(t, f * 2.76, dur, { type: 'sine', gain: 0.025 * vel, release: 0.5, dest }); break;
      case 'flute': this.tone(t, f, dur, { type: 'sine', gain: 0.12 * vel, attack: 0.06, release: dur + 0.12, vib: 4, dest }); this.noise(t, 0.08, { type: 'bandpass', freq: f * 2, q: 4, gain: 0.015 * vel, dest }); break;
      case 'lead': this.tone(t, f, dur, { type: 'square', wave: this.pulse, gain: 0.05 * vel, release: dur + 0.08, vib: 3, dest }); break;
      case 'bass': this.tone(t, f, dur, { type: 'triangle', gain: 0.2 * vel, release: dur + 0.05, dest }); break;
      case 'pad': {
        this.tone(t, f, dur, { type: 'sawtooth', gain: 0.012 * vel, attack: dur * 0.4, release: dur + 0.4, detune: -6, dest });
        this.tone(t, f, dur, { type: 'sine', gain: 0.03 * vel, attack: dur * 0.3, release: dur + 0.4, detune: 5, dest });
        break;
      }
    }
  },
  _drum(kind, t, vel = 1) {
    const dest = this.music;
    switch (kind) {
      case 'kick': this.tone(t, 140, 0.18, { type: 'sine', gain: 0.3 * vel, freqEnd: 45, dest }); break;
      case 'snare': this.noise(t, 0.14, { type: 'bandpass', freq: 1800, q: 0.7, gain: 0.1 * vel, dest }); break;
      case 'hat': this.noise(t, 0.04, { type: 'highpass', freq: 7000, gain: 0.05 * vel, dest }); break;
      case 'shaker': this.noise(t, 0.06, { type: 'bandpass', freq: 6000, q: 1.5, gain: 0.05 * vel, attack: 0.015, dest }); break;
      case 'conga': this.tone(t, 220, 0.15, { type: 'sine', gain: 0.12 * vel, freqEnd: 170, dest }); break;
      case 'congaHi': this.tone(t, 330, 0.12, { type: 'sine', gain: 0.1 * vel, freqEnd: 260, dest }); break;
      case 'clave': this.tone(t, 2500, 0.03, { type: 'sine', gain: 0.06 * vel, dest }); break;
    }
  },
  _playStep(step, t, sd) {
    const tr = this.track;
    const bar = Math.floor(step / 16), s = step % 16;
    const nBars = tr.chordObjs.length;
    const ch = tr.chordObjs[bar % nBars];
    const baseRoot = 36 + ch.root; // C2…
    const intensity = this.intensity;
    // melodía (corcheas)
    if (s % 2 === 0) {
      const mi = (step / 2) % tr.melTokens.length;
      const tok = tr.melTokens[mi];
      if (tok && tok !== '.' && tok !== '-') {
        let len = 1; while (tr.melTokens[(mi + len) % tr.melTokens.length] === '-' && len < 8) len++;
        const midi = noteToMidi(tok);
        if (midi) this._inst(tr.lead, t, midi, sd * 2 * len * 0.9, 0.9);
      }
    }
    // pad al inicio de compás
    if (tr.pad && s === 0) ch.ints.slice(0, 4).forEach((iv) => this._inst('pad', t, 60 + ((ch.root + iv) % 12) - (ch.root + iv >= 12 ? 0 : 0), sd * 16, 0.8));
    // bajo
    const bs = tr.bassStyle;
    if (bs === 'roots' && (s === 0 || s === 8)) this._inst('bass', t, baseRoot + (s === 8 ? 7 : 0), sd * 6, 1);
    if (bs === 'pulse' && s % 4 === 0) this._inst('bass', t, baseRoot + (s === 12 ? 12 : 0), sd * 3, 0.8);
    if (bs === 'cumbia' && (s === 0 || s === 6 || s === 8 || s === 14)) this._inst('bass', t, baseRoot + (s === 8 || s === 14 ? 7 : 0), sd * 2, 1);
    if (bs === 'drone' && s === 0) this._inst('bass', t, baseRoot, sd * 15, 0.7);
    if (bs === 'drive' && s % 2 === 0) this._inst('bass', t, baseRoot + (s % 8 === 6 ? 12 : 0), sd * 1.5, 0.9);
    // arpegio suave
    if (tr.lead !== 'lead' && s % 4 === 2 && tr.drums !== 'none') {
      const iv = ch.ints[(s / 4 | 0) % ch.ints.length];
      this._inst('pluck', t, 60 + ch.root + iv, sd * 2, 0.35);
    }
    // percusión
    const d = tr.drums;
    if (d === 'cumbia') {
      if (s % 2 === 0) this._drum('shaker', t, s % 4 === 2 ? 1 : 0.6);
      if (s === 0 || s === 8) this._drum('kick', t, 0.7);
      if (s === 4 || s === 12) this._drum('conga', t);
      if (s === 6 || s === 14) this._drum('congaHi', t, 0.8);
      if (s === 3 || s === 10) this._drum('clave', t, 0.7);
    } else if (d === 'tech') {
      if (s % 8 === 0) this._drum('kick', t, 0.6);
      if (s % 4 === 2) this._drum('hat', t, 0.7);
      if (s === 12 && bar % 2 === 1) this._drum('snare', t, 0.5);
    } else if (d === 'drive') {
      if (s % 4 === 0) this._drum('kick', t, 0.8 * intensity);
      if (s % 2 === 1) this._drum('hat', t, 0.6);
      if (s === 4 || s === 12) this._drum('snare', t, 0.7);
    } else if (d === 'soft') {
      if (s === 0) this._drum('kick', t, 0.35);
      if (s % 4 === 2) this._drum('shaker', t, 0.4);
    }
  },
};

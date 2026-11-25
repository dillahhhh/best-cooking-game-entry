// WARUNG RUSH — audio: tiny WebAudio bleeps, all synthesized, no files.
// A short sizzle while cooking, a happy chime on serve, a low buzz on a
// walk-out, a click on every button. Mute toggles everything.
export function createAudio() {
  return { ctx: null, muted: false, sizzleUntil: 0 };
}

function ensureCtx(audio) {
  if (audio.ctx) return audio.ctx;
  if (typeof window === 'undefined') return null; // headless logic test
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audio.ctx = new AC();
  return audio.ctx;
}

/** Resume the context from a user gesture (browsers block audio before one). */
export function unlockAudio(audio) {
  const ctx = ensureCtx(audio);
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone(audio, freq, seconds, type, gainValue, when = 0) {
  if (audio.muted) return;
  const ctx = ensureCtx(audio);
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

export function playClick(audio) { tone(audio, 660, 0.06, 'square', 0.04); }
export function playAdd(audio) { tone(audio, 520, 0.08, 'triangle', 0.06); tone(audio, 780, 0.08, 'triangle', 0.05, 0.05); }
export function playCook(audio) { tone(audio, 220, 0.15, 'sawtooth', 0.05); tone(audio, 330, 0.15, 'sawtooth', 0.04, 0.08); }
export function playServe(audio) {
  tone(audio, 523, 0.12, 'triangle', 0.08);
  tone(audio, 659, 0.12, 'triangle', 0.08, 0.09);
  tone(audio, 784, 0.2, 'triangle', 0.09, 0.18);
}
export function playBad(audio) { tone(audio, 160, 0.25, 'sawtooth', 0.07); tone(audio, 110, 0.3, 'sawtooth', 0.06, 0.1); }
export function playBurnt(audio) { tone(audio, 90, 0.4, 'sawtooth', 0.08); }
export function playTick(audio) { tone(audio, 880, 0.05, 'square', 0.03); }
export function playStart(audio) {
  tone(audio, 392, 0.12, 'triangle', 0.07);
  tone(audio, 523, 0.12, 'triangle', 0.07, 0.1);
  tone(audio, 659, 0.2, 'triangle', 0.08, 0.2);
}

export function toggleMute(audio) {
  audio.muted = !audio.muted;
  return audio.muted;
}

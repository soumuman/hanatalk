// Keep AudioContext creation/resume inside the original user gesture, before IDB awaits.
let context;
let enabled = true;
const voices = new Set();
export function setSoundEnabled(value) {
  enabled = value !== false;
  if (!enabled) stopSounds();
}
export function prepareSound() {
  if (!enabled) return;
  try {
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) return;
    if (!context || context.state === 'closed') context = new AudioContext();
    if (context.state !== 'running') context.resume().catch(() => {});
    // A silent buffer started synchronously also unlocks older Safari audio sessions.
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    source.connect(context.destination);
    source.onended = () => source.disconnect();
    source.start();
  } catch { /* Audio must never prevent recording. */ }
}
export function stopSounds() {
  for (const voice of voices) {
    try { voice.gain.gain.cancelScheduledValues(context.currentTime); voice.gain.gain.setTargetAtTime(0, context.currentTime, .012); voice.osc.stop(context.currentTime + .06); } catch {}
  }
}
export function playAddition(count) {
  if (!enabled || !context || context.state !== 'running' || globalThis.document?.visibilityState === 'hidden') return;
  try {
    stopSounds();
    const notes = count === 5
      ? [[220, 0, .72], [261.63, .20, .76], [329.63, .43, .77]]
      : [[246.94, 0, .32]];
    const start = context.currentTime + .01;
    for (const [frequency, offset, duration] of notes) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const time = start + offset;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency * .97, time);
      osc.frequency.exponentialRampToValueAtTime(frequency, time + .10);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(count === 5 ? .035 : .055, time + .055);
      gain.gain.exponentialRampToValueAtTime(.0001, time + duration - .02);
      gain.gain.linearRampToValueAtTime(0, time + duration);
      osc.connect(gain); gain.connect(context.destination);
      const voice = {osc, gain};
      voices.add(voice);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); voices.delete(voice); };
      osc.start(time); osc.stop(time + duration + .01);
    }
  } catch { /* Unsupported/interrupted audio is silent; saving remains available. */ }
}

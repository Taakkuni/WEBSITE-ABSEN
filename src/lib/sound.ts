/**
 * Web Audio API synthesizer for instant zero-dependency sound effects
 */
export function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Friendly 3-tone chime (C5 -> E5 -> G5)
    const tones = [523.25, 659.25, 783.99];
    tones.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);

      gain.gain.setValueAtTime(0, now + index * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, now + index * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.3);
    });
  } catch (e) {
    // AudioContext might be restricted until user gesture
  }
}

export function playErrorSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    // AudioContext ignored
  }
}

export function speakMessage(text: string) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    // Speech synthesis ignored
  }
}

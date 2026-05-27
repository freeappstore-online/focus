// --- Web Audio: gentle bell + optional ticking ---
// Lazily-constructed AudioContext (must be resumed inside a user gesture).

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** Resume the audio context — call inside a user gesture. */
export async function unlockAudio(): Promise<void> {
  const c = getContext();
  if (!c) return;
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      // ignore
    }
  }
}

/** Gentle bell: a soft sine "ding" with exponential decay. */
export function playBell(): void {
  const c = getContext();
  if (!c) return;
  if (c.state === "suspended") {
    c.resume().catch(() => {});
  }
  const now = c.currentTime;

  // Two-tone bell — fundamental + perfect fifth — for a softer, less alarm-like sound.
  const tones = [
    { freq: 880, gain: 0.18, decay: 1.6 }, // A5
    { freq: 1318.5, gain: 0.09, decay: 1.4 }, // E6
  ];

  for (const tone of tones) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = tone.freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(tone.gain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.decay);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + tone.decay + 0.05);
  }
}

// --- Ticking ---
// Implemented as a low-volume periodic click. We schedule one tick now and rely
// on a setInterval in the caller to re-trigger; this keeps it cheap to start/stop.

export function playTick(): void {
  const c = getContext();
  if (!c) return;
  if (c.state === "suspended") return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.value = 1200;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.015, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}

// Clean, minimalist Web Audio API synthesizer for Apple/Nike-style physical & haptic UI audio

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let masterGain: GainNode | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;

export const triggerHaptic = (pattern: number | number[] = 15): void => {
  if (typeof window !== 'undefined' && navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on unsupported hardware
    }
  }
};

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (!masterCompressor) {
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-14, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(10, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(4, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.005, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.1, audioCtx.currentTime);

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.8, audioCtx.currentTime);

      masterCompressor.connect(masterGain);
      masterGain.connect(audioCtx.destination);
    }
  }
  return audioCtx;
};

const getOutputNode = (ctx: AudioContext): AudioNode => {
  return masterCompressor || ctx.destination;
};

export const toggleSound = (enabled?: boolean): boolean => {
  if (enabled !== undefined) {
    soundEnabled = enabled;
  } else {
    soundEnabled = !soundEnabled;
  }
  return soundEnabled;
};

export const isSoundEnabled = (): boolean => soundEnabled;

export const toggleAmbientDrone = (_enable?: boolean): boolean => {
  // Ambient drones are intentionally disabled in the clean lifestyle constitution
  return false;
};

export const isAmbientActive = (): boolean => false;

/**
 * Clean, subtle, organic audio cues (Apple / Nike fitness standard):
 * - click: Crisp, subtle mechanical dial tap (iOS keyboard/dial feel)
 * - pop: Warm, rounded wooden pop (friendly micro-interaction)
 * - accept / equip: Crisp dual-tone harmonic confirmation
 * - complete: Warm uplifting major triad chime (celebrating achievement)
 * - purchase: Rich metallic coin drop with velvet bass resonance
 * - notification: Subtle double chime (warm bell shimmer)
 * - laser / action: Crisp physical athletic swoosh
 * - error: Gentle, soft low double-tap (discreet haptic disapproval)
 * - oracle / mystery: Ambient acoustic harmonic swell
 * - levelUp: Inspiring celebratory milestone fanfare
 */
export const playSound = (
  type: 'click' | 'accept' | 'complete' | 'laser' | 'error' | 'oracle' | 'notification' | 'purchase' | 'equip' | 'levelUp' | 'pop'
): void => {
  if (type === 'complete' || type === 'purchase' || type === 'levelUp') {
    triggerHaptic([18, 30, 20]);
  } else if (type === 'error') {
    triggerHaptic([35, 20, 35]);
  } else {
    triggerHaptic(10);
  }

  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const output = getOutputNode(ctx);

    switch (type) {
      /**
       * 1. CLICK: Crisp mechanical dial tap (iOS haptic click feel)
       */
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.025);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(600, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(output);

        osc.start(now);
        osc.stop(now + 0.028);
        break;
      }

      /**
       * 2. POP: Rounded, organic bubble pop
       */
      case 'pop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

        osc.connect(gain);
        gain.connect(output);

        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      /**
       * 3. ACCEPT / EQUIP: Crisp dual-tone confirmation chime
       */
      case 'equip':
      case 'accept': {
        const notes = [659.25, 880]; // E5 -> A5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.045;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.linearRampToValueAtTime(0.06, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);

          osc.connect(gain);
          gain.connect(output);

          osc.start(start);
          osc.stop(start + 0.13);
        });
        break;
      }

      /**
       * 4. COMPLETE: Warm athletic triumph chord (C5 - E5 - G5 - C6)
       */
      case 'complete': {
        const chord = [523.25, 659.25, 783.99, 1046.50];
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.035;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.linearRampToValueAtTime(0.05, start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);

          osc.connect(gain);
          gain.connect(output);

          osc.start(start);
          osc.stop(start + 0.48);
        });
        break;
      }

      /**
       * 5. PURCHASE: Warm metallic coin resonance with velvet bass body
       */
      case 'purchase': {
        // Metallic coin ring
        const coinOsc = ctx.createOscillator();
        const coinGain = ctx.createGain();
        coinOsc.type = 'sine';
        coinOsc.frequency.setValueAtTime(1760, now); // A6
        coinOsc.frequency.exponentialRampToValueAtTime(2637, now + 0.03); // E7

        coinGain.gain.setValueAtTime(0.07, now);
        coinGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        coinOsc.connect(coinGain);
        coinGain.connect(output);
        coinOsc.start(now);
        coinOsc.stop(now + 0.3);

        // Warm secondary tone
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(440, now + 0.02);

        subGain.gain.setValueAtTime(0.05, now + 0.02);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        subOsc.connect(subGain);
        subGain.connect(output);
        subOsc.start(now + 0.02);
        subOsc.stop(now + 0.24);
        break;
      }

      /**
       * 6. NOTIFICATION: Clean Apple-style double chime
       */
      case 'notification': {
        const tones = [880, 1318.51]; // A5 -> E6
        tones.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.08;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.linearRampToValueAtTime(0.05, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

          osc.connect(gain);
          gain.connect(output);

          osc.start(start);
          osc.stop(start + 0.18);
        });
        break;
      }

      /**
       * 7. ERROR: Discreet, soft double-tap
       */
      case 'error': {
        [0, 0.08].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + offset;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, start);
          osc.frequency.exponentialRampToValueAtTime(140, start + 0.05);

          gain.gain.setValueAtTime(0.06, start);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);

          osc.connect(gain);
          gain.connect(output);

          osc.start(start);
          osc.stop(start + 0.055);
        });
        break;
      }

      /**
       * 8. LASER / ACTION: Clean athletic swoosh
       */
      case 'laser': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.07);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(output);

        osc.start(now);
        osc.stop(now + 0.075);
        break;
      }

      /**
       * 9. ORACLE / MYSTERY: Warm harmonic swell
       */
      case 'oracle': {
        const notes = [440, 554.37, 659.25]; // A major
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.04;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.linearRampToValueAtTime(0.04, start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

          osc.connect(gain);
          gain.connect(output);

          osc.start(start);
          osc.stop(start + 0.38);
        });
        break;
      }

      /**
       * 10. LEVEL UP: Uplifting milestone fanfare
       */
      case 'levelUp': {
        const notes = [392, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.055;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.linearRampToValueAtTime(0.055, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);

          osc.connect(gain);
          gain.connect(output);

          osc.start(start);
          osc.stop(start + 0.42);
        });
        break;
      }

      default:
        break;
    }
  } catch {
    // Graceful fallback if Web Audio is unsupported
  }
};

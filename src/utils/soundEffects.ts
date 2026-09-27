// Advanced Web Audio API synthesizer for futuristic Tron, Star Trek, and Transformers UI soundscapes

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let masterGain: GainNode | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;

// Ambient Warp Core / Tron Grid drone nodes
let ambientOsc1: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientFilter: BiquadFilterNode | null = null;
let ambientGain: GainNode | null = null;
let ambientLfo: OscillatorNode | null = null;
let ambientLfoGain: GainNode | null = null;
let ambientActive = false;

export const triggerHaptic = (pattern: number | number[] = 20): void => {
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
    // Set up master compression stage for punchy, cinema-grade sci-fi audio without distortion
    if (!masterCompressor) {
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(12, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(6, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.15, audioCtx.currentTime);

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.85, audioCtx.currentTime);

      masterCompressor.connect(masterGain);
      masterGain.connect(audioCtx.destination);
    }
  }
  return audioCtx;
};

// Returns destination node (master compressor if initialized, else context destination)
const getOutputNode = (ctx: AudioContext): AudioNode => {
  return masterCompressor || ctx.destination;
};

export const toggleSound = (enabled?: boolean): boolean => {
  if (enabled !== undefined) {
    soundEnabled = enabled;
  } else {
    soundEnabled = !soundEnabled;
  }
  if (!soundEnabled && ambientActive) {
    toggleAmbientDrone(false);
  }
  return soundEnabled;
};

export const isSoundEnabled = (): boolean => soundEnabled;

/**
 * Ambient Drone: Star Trek Enterprise Warp Core + Tron Grid Sub-Hum
 * Hypnotic, subtle 55Hz sub-thrum with 0.18Hz LFO filter breathing and cyan harmonics
 */
export const toggleAmbientDrone = (enable?: boolean): boolean => {
  const ctx = getAudioContext();
  if (!ctx) return false;

  const targetState = enable !== undefined ? enable : !ambientActive;
  ambientActive = targetState;

  if (ambientActive && soundEnabled) {
    try {
      stopAmbientNodes();

      const now = ctx.currentTime;
      ambientGain = ctx.createGain();
      ambientGain.gain.setValueAtTime(0.001, now);
      ambientGain.gain.linearRampToValueAtTime(0.025, now + 1.2); // Smooth fade in

      // Sub-bass sine (Enterprise warp core primary resonance - 55Hz A1)
      ambientOsc1 = ctx.createOscillator();
      ambientOsc1.type = 'sine';
      ambientOsc1.frequency.setValueAtTime(55, now);

      // Low Tron grid overtone (110Hz triangle with subtle detune)
      ambientOsc2 = ctx.createOscillator();
      ambientOsc2.type = 'triangle';
      ambientOsc2.frequency.setValueAtTime(110.4, now);

      // Low-pass resonant filter
      ambientFilter = ctx.createBiquadFilter();
      ambientFilter.type = 'lowpass';
      ambientFilter.frequency.setValueAtTime(120, now);
      ambientFilter.Q.setValueAtTime(3.5, now);

      // LFO for slow warp core rhythmic pulsation (0.22Hz)
      ambientLfo = ctx.createOscillator();
      ambientLfo.type = 'sine';
      ambientLfo.frequency.setValueAtTime(0.22, now);

      ambientLfoGain = ctx.createGain();
      ambientLfoGain.gain.setValueAtTime(45, now); // Filter frequency modulation range

      ambientLfo.connect(ambientLfoGain);
      ambientLfoGain.connect(ambientFilter.frequency);

      ambientOsc1.connect(ambientFilter);
      ambientOsc2.connect(ambientFilter);
      ambientFilter.connect(ambientGain);
      ambientGain.connect(getOutputNode(ctx));

      ambientOsc1.start(now);
      ambientOsc2.start(now);
      ambientLfo.start(now);
    } catch {
      ambientActive = false;
    }
  } else {
    stopAmbientNodes();
  }
  return ambientActive;
};

const stopAmbientNodes = (): void => {
  try {
    if (ambientOsc1) {
      ambientOsc1.stop();
      ambientOsc1.disconnect();
    }
    if (ambientOsc2) {
      ambientOsc2.stop();
      ambientOsc2.disconnect();
    }
    if (ambientLfo) {
      ambientLfo.stop();
      ambientLfo.disconnect();
    }
    if (ambientLfoGain) ambientLfoGain.disconnect();
    if (ambientFilter) ambientFilter.disconnect();
    if (ambientGain) ambientGain.disconnect();
  } catch {}
  ambientOsc1 = null;
  ambientOsc2 = null;
  ambientLfo = null;
  ambientLfoGain = null;
  ambientFilter = null;
  ambientGain = null;
};

export const isAmbientActive = (): boolean => ambientActive;

/**
 * Synthesizes high-fidelity futuristic sound effects:
 * - click: Star Trek LCARS dual touchscreen chime with Tron tactile lightgrid pulse
 * - accept: Transformers cybernetic transformation servo + magnetic Tron clamp lock
 * - complete: Star Trek transporter beam / Enterprise warp chime with golden-ratio crystal harmonics
 * - laser: Tron identity disc ricochet / Transformers energon blaster with FM modulation
 * - error: Star Trek LCARS access denied klaxon + Tron de-resolution drop
 * - oracle: Enterprise computer query acknowledgement ("Working...") + Tron MCP neural sync
 * - notification: Iconic Star Trek comm-badge double chirp with crystal shimmer
 */
export const playSound = (
  type: 'click' | 'accept' | 'complete' | 'laser' | 'error' | 'oracle' | 'notification' | 'purchase' | 'equip' | 'levelUp' | 'pop'
): void => {
  if (type === 'complete' || type === 'oracle' || type === 'purchase' || type === 'levelUp') {
    triggerHaptic([25, 45, 25]);
  } else if (type === 'error') {
    triggerHaptic([50, 30, 50]);
  } else {
    triggerHaptic(12);
  }

  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const output = getOutputNode(ctx);

    switch (type) {
      case 'pop':
      /**
       * 1. CLICK: Star Trek LCARS Touchscreen Chirp + Tron Lightgrid Contact
       * Twin high-frequency crystal beeps with instant envelope & subtle sub-bass tactile thump
       */
      case 'click': {
        // High LCARS tone 1 (1864Hz - Bb6)
        const oscHigh1 = ctx.createOscillator();
        const gainHigh1 = ctx.createGain();
        oscHigh1.type = 'sine';
        oscHigh1.frequency.setValueAtTime(1864, now);
        oscHigh1.frequency.exponentialRampToValueAtTime(1600, now + 0.038);

        gainHigh1.gain.setValueAtTime(0.075, now);
        gainHigh1.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

        oscHigh1.connect(gainHigh1);
        gainHigh1.connect(output);
        oscHigh1.start(now);
        oscHigh1.stop(now + 0.04);

        // High LCARS overtone 2 (2489Hz - Eb7, offset by 4ms)
        const oscHigh2 = ctx.createOscillator();
        const gainHigh2 = ctx.createGain();
        oscHigh2.type = 'sine';
        oscHigh2.frequency.setValueAtTime(2489, now + 0.004);
        oscHigh2.frequency.exponentialRampToValueAtTime(2150, now + 0.035);

        gainHigh2.gain.setValueAtTime(0.0001, now);
        gainHigh2.gain.setValueAtTime(0.055, now + 0.004);
        gainHigh2.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        oscHigh2.connect(gainHigh2);
        gainHigh2.connect(output);
        oscHigh2.start(now + 0.004);
        oscHigh2.stop(now + 0.036);

        // Tron lightgrid tactile pulse (110Hz down to 45Hz sub punch)
        const oscSub = ctx.createOscillator();
        const gainSub = ctx.createGain();
        oscSub.type = 'triangle';
        oscSub.frequency.setValueAtTime(120, now);
        oscSub.frequency.exponentialRampToValueAtTime(45, now + 0.03);

        gainSub.gain.setValueAtTime(0.065, now);
        gainSub.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        oscSub.connect(gainSub);
        gainSub.connect(output);
        oscSub.start(now);
        oscSub.stop(now + 0.032);
        break;
      }

      /**
       * 2. ACCEPT / EQUIP: Transformers Servo Transformation + Tron Magnetic Grid Lock
       * 2-stage robotic mechanical whir followed by resonant dual-tone magnetic clamp
       */
      case 'equip':
      case 'accept': {
        // Stage 1: Mechanical actuator servo (frequency-modulated sawtooth sweep)
        const servoCarrier = ctx.createOscillator();
        const servoMod = ctx.createOscillator();
        const servoModGain = ctx.createGain();
        const servoFilter = ctx.createBiquadFilter();
        const servoGain = ctx.createGain();

        servoCarrier.type = 'sawtooth';
        servoCarrier.frequency.setValueAtTime(210, now);
        servoCarrier.frequency.exponentialRampToValueAtTime(540, now + 0.11);

        // Fast robotic actuator FM modulation (65Hz)
        servoMod.type = 'sine';
        servoMod.frequency.setValueAtTime(65, now);
        servoModGain.gain.setValueAtTime(140, now);
        servoModGain.gain.exponentialRampToValueAtTime(20, now + 0.11);

        servoMod.connect(servoCarrier.frequency);

        servoFilter.type = 'bandpass';
        servoFilter.frequency.setValueAtTime(450, now);
        servoFilter.frequency.exponentialRampToValueAtTime(1200, now + 0.11);
        servoFilter.Q.setValueAtTime(4, now);

        servoGain.gain.setValueAtTime(0.07, now);
        servoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        servoCarrier.connect(servoFilter);
        servoFilter.connect(servoGain);
        servoGain.connect(output);

        servoMod.start(now);
        servoCarrier.start(now);
        servoMod.stop(now + 0.12);
        servoCarrier.stop(now + 0.12);

        // Stage 2: Tron magnetic grid clamp (twin resonant crystal pings at +0.06s)
        const lockTone1 = ctx.createOscillator();
        const lockTone2 = ctx.createOscillator();
        const lockGain = ctx.createGain();

        lockTone1.type = 'sine';
        lockTone1.frequency.setValueAtTime(659.25, now + 0.06); // E5
        lockTone1.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

        lockTone2.type = 'sine';
        lockTone2.frequency.setValueAtTime(1318.5, now + 0.06); // E6
        lockTone2.frequency.exponentialRampToValueAtTime(1760, now + 0.18); // A6

        lockGain.gain.setValueAtTime(0.0001, now);
        lockGain.gain.setValueAtTime(0.09, now + 0.06);
        lockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        lockTone1.connect(lockGain);
        lockTone2.connect(lockGain);
        lockGain.connect(output);

        lockTone1.start(now + 0.06);
        lockTone2.start(now + 0.06);
        lockTone1.stop(now + 0.23);
        lockTone2.stop(now + 0.23);
        break;
      }

      /**
       * 3. COMPLETE / PURCHASE / LEVEL UP: Star Trek Transporter Shimmer / Enterprise Warp Chime + Tron Harmonizer
       * Multi-layered crystalline harmonic cluster with resonant filter opening and sub-bloom
       */
      case 'purchase':
      case 'levelUp':
      case 'complete': {
        const chordFrequencies = [
          523.25, // C5
          659.25, // E5
          783.99, // G5
          1046.5, // C6
          1318.5, // E6
          1567.98, // G6
        ];

        // Harmonic shimmer cascade
        chordFrequencies.forEach((freq, idx) => {
          const delay = idx * 0.042;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          // Detuning for lush sci-fi chorus
          osc.frequency.setValueAtTime(freq + (idx % 2 === 0 ? 1.5 : -1.5), now + delay);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(freq * 1.2, now + delay);
          filter.Q.setValueAtTime(4.5, now + delay);

          const duration = 0.42 - idx * 0.03;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.setValueAtTime(0.07 - idx * 0.008, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(output);

          osc.start(now + delay);
          osc.stop(now + delay + duration + 0.02);
        });

        // Sub-bass resonance bloom (Warp power engagement - 65Hz)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(65.4, now);
        subOsc.frequency.exponentialRampToValueAtTime(130.8, now + 0.28);

        subGain.gain.setValueAtTime(0.09, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

        subOsc.connect(subGain);
        subGain.connect(output);
        subOsc.start(now);
        subOsc.stop(now + 0.44);
        break;
      }

      /**
       * 4. LASER: Tron Identity Disc Throw / Transformers Energon Blaster / Phaser Beam
       * Rapid FM-modulated laser beam with metallic harmonic resonance and low-end dissipation
       */
      case 'laser': {
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // Downward laser frequency sweep: 2600Hz -> 85Hz in 0.17s
        carrier.type = 'sawtooth';
        carrier.frequency.setValueAtTime(2600, now);
        carrier.frequency.exponentialRampToValueAtTime(85, now + 0.17);

        // High-rate FM modulator for that metallic Tron identity disc buzz (175Hz)
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(175, now);
        modulator.frequency.exponentialRampToValueAtTime(40, now + 0.17);

        modGain.gain.setValueAtTime(950, now);
        modGain.gain.exponentialRampToValueAtTime(15, now + 0.17);

        modulator.connect(carrier.frequency);

        // Swept bandpass filter for authentic analog phaser / disc whoosh
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.frequency.exponentialRampToValueAtTime(280, now + 0.17);
        filter.Q.setValueAtTime(5, now);

        gain.gain.setValueAtTime(0.095, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        carrier.connect(filter);
        filter.connect(gain);
        gain.connect(output);

        modulator.start(now);
        carrier.start(now);
        modulator.stop(now + 0.19);
        carrier.stop(now + 0.19);
        break;
      }

      /**
       * 5. ORACLE: Star Trek Computer Voice Acknowledge + Tron Neural MCP Grid Sync
       * Resonant multi-stage sweep ("Computer...") + dual crystal LCARS chord & digital shimmer
       */
      case 'oracle': {
        // Stage 1: Resonant neural spooling sweep (140Hz -> 480Hz)
        const spoolOsc = ctx.createOscillator();
        const spoolFilter = ctx.createBiquadFilter();
        const spoolGain = ctx.createGain();

        spoolOsc.type = 'triangle';
        spoolOsc.frequency.setValueAtTime(140, now);
        spoolOsc.frequency.exponentialRampToValueAtTime(480, now + 0.08);

        spoolFilter.type = 'bandpass';
        spoolFilter.frequency.setValueAtTime(320, now);
        spoolFilter.frequency.exponentialRampToValueAtTime(960, now + 0.08);
        spoolFilter.Q.setValueAtTime(6, now);

        spoolGain.gain.setValueAtTime(0.085, now);
        spoolGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        spoolOsc.connect(spoolFilter);
        spoolFilter.connect(spoolGain);
        spoolGain.connect(output);

        spoolOsc.start(now);
        spoolOsc.stop(now + 0.095);

        // Stage 2: Iconic Star Trek Computer dual-chime (784Hz [G5] and 1046.5Hz [C6])
        const tone1 = ctx.createOscillator();
        const tone2 = ctx.createOscillator();
        const chimeGain = ctx.createGain();

        tone1.type = 'sine';
        tone1.frequency.setValueAtTime(783.99, now + 0.07);
        tone1.frequency.exponentialRampToValueAtTime(830, now + 0.28);

        tone2.type = 'sine';
        tone2.frequency.setValueAtTime(1046.5, now + 0.09);
        tone2.frequency.exponentialRampToValueAtTime(1100, now + 0.3);

        chimeGain.gain.setValueAtTime(0.0001, now);
        chimeGain.gain.setValueAtTime(0.09, now + 0.09);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

        tone1.connect(chimeGain);
        tone2.connect(chimeGain);
        chimeGain.connect(output);

        tone1.start(now + 0.07);
        tone2.start(now + 0.09);
        tone1.stop(now + 0.35);
        tone2.stop(now + 0.35);

        // Stage 3: Tron neural shimmer overtone (1568Hz crystalline tail)
        const shimmerOsc = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmerOsc.type = 'sine';
        shimmerOsc.frequency.setValueAtTime(1567.98, now + 0.1);

        shimmerGain.gain.setValueAtTime(0.0001, now);
        shimmerGain.gain.setValueAtTime(0.045, now + 0.1);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        shimmerOsc.connect(shimmerGain);
        shimmerGain.connect(output);
        shimmerOsc.start(now + 0.1);
        shimmerOsc.stop(now + 0.39);
        break;
      }

      /**
       * 6. NOTIFICATION: Star Trek Comm-Badge Double Chirp (LCARS Communicator)
       * Distinctive rising chirp 1, micro-pause, rising chirp 2 with Tron shimmer
       */
      case 'notification': {
        // Chirp 1: 987.77Hz (B5) -> 1318.5Hz (E6) in 0.055s
        const chirp1 = ctx.createOscillator();
        const chirp1Gain = ctx.createGain();
        chirp1.type = 'sine';
        chirp1.frequency.setValueAtTime(987.77, now);
        chirp1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.055);

        chirp1Gain.gain.setValueAtTime(0.095, now);
        chirp1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

        chirp1.connect(chirp1Gain);
        chirp1Gain.connect(output);
        chirp1.start(now);
        chirp1.stop(now + 0.058);

        // Chirp 2: 1318.5Hz (E6) -> 1760Hz (A6) in 0.075s (starting after 0.065s)
        const chirp2Time = now + 0.065;
        const chirp2 = ctx.createOscillator();
        const chirp2Gain = ctx.createGain();
        chirp2.type = 'sine';
        chirp2.frequency.setValueAtTime(1318.5, chirp2Time);
        chirp2.frequency.exponentialRampToValueAtTime(1760, chirp2Time + 0.075);

        chirp2Gain.gain.setValueAtTime(0.0001, now);
        chirp2Gain.gain.setValueAtTime(0.1, chirp2Time);
        chirp2Gain.gain.exponentialRampToValueAtTime(0.0001, chirp2Time + 0.19);

        chirp2.connect(chirp2Gain);
        chirp2Gain.connect(output);
        chirp2.start(chirp2Time);
        chirp2.stop(chirp2Time + 0.2);

        // Crystalline Tron harmonic sparkle
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.type = 'triangle';
        sparkle.frequency.setValueAtTime(2637, chirp2Time + 0.015);

        sparkleGain.gain.setValueAtTime(0.0001, now);
        sparkleGain.gain.setValueAtTime(0.04, chirp2Time + 0.015);
        sparkleGain.gain.exponentialRampToValueAtTime(0.0001, chirp2Time + 0.22);

        sparkle.connect(sparkleGain);
        sparkleGain.connect(output);
        sparkle.start(chirp2Time + 0.015);
        sparkle.stop(chirp2Time + 0.23);
        break;
      }

      /**
       * 7. ERROR: Star Trek LCARS Access Denied + Transformers Warning Alert + Tron De-rez
       * Low tritone dissonance (116Hz / 164Hz) with 32Hz amplitude tremolo & sub drop
       */
      case 'error': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const tremolo = ctx.createOscillator();
        const tremoloGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const mainGain = ctx.createGain();

        // Dissonant spaceship warning tritone
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(116.54, now); // Bb2
        osc1.frequency.exponentialRampToValueAtTime(65, now + 0.24);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(164.81, now); // E3 (tritone dissonance)
        osc2.frequency.exponentialRampToValueAtTime(92, now + 0.24);

        // Rapid 32Hz warning flutter (tremolo)
        tremolo.type = 'sine';
        tremolo.frequency.setValueAtTime(32, now);
        tremoloGain.gain.setValueAtTime(0.04, now);

        // Filter sweeps down to damp harsh high end
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, now);
        filter.frequency.exponentialRampToValueAtTime(180, now + 0.24);
        filter.Q.setValueAtTime(3, now);

        mainGain.gain.setValueAtTime(0.09, now);
        mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        osc1.connect(filter);
        osc2.connect(filter);
        tremolo.connect(mainGain.gain);
        filter.connect(mainGain);
        mainGain.connect(output);

        tremolo.start(now);
        osc1.start(now);
        osc2.start(now);
        tremolo.stop(now + 0.26);
        osc1.stop(now + 0.26);
        osc2.stop(now + 0.26);
        break;
      }
    }
  } catch {
    // Gracefully handle any browser audio policy or autoplay restrictions
  }
};

/**
 * Safe client-side Web Audio & SpeechSynthesis service for Bagdar Asia Campus Audio Guides.
 */
class CampusAudioService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCtx: AudioContext | null = null;
  private ambientOscillator: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  /**
   * Initializes or resumes AudioContext upon user gesture
   */
  private initAudioContext() {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass && !this.audioCtx) {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Generates a calming, gentle ambient campus soundscape (distant warm breeze / library hum)
   */
  startAmbientAtmosphere(mode: 'day' | 'night' = 'day') {
    if (this.isMuted) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      this.stopAmbientAtmosphere();

      // Create gentle brownian-style low-frequency drone
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      // Filter settings for subtle, soothing room acoustic
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(mode === 'night' ? 180 : 320, this.audioCtx.currentTime);

      // Pitch: gentle soothing tone (F#2 ~ 92Hz or A2 ~ 110Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(mode === 'night' ? 82.4 : 110.0, this.audioCtx.currentTime);

      // Soft volume (subtle background feeling)
      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, this.audioCtx.currentTime + 2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      this.ambientOscillator = osc;
      this.ambientGain = gain;
    } catch (e) {
      console.warn("Ambient audio initialization bypassed:", e);
    }
  }

  stopAmbientAtmosphere() {
    try {
      if (this.ambientGain && this.audioCtx) {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.5);
      }
      setTimeout(() => {
        if (this.ambientOscillator) {
          try { this.ambientOscillator.stop(); } catch (_) {}
          this.ambientOscillator.disconnect();
          this.ambientOscillator = null;
        }
      }, 600);
    } catch (e) {
      // Ignore cleanup error
    }
  }

  /**
   * Speaks the campus audio guide with synchronized callbacks
   */
  speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      onBoundary?: (charIndex: number) => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): boolean {
    if (!this.synth) return false;

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.lang = 'en-US';

    // Pick best English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => 
      (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Premium')))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (options?.onBoundary) {
      utterance.onboundary = (e) => {
        options.onBoundary!(e.charIndex);
      };
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      if (options?.onError) options.onError();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    return true;
  }

  pauseSpeaking() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  resumeSpeaking() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking && !this.synth.paused);
  }

  isPaused(): boolean {
    return !!(this.synth && this.synth.paused);
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
      this.stopAmbientAtmosphere();
    }
  }
}

export const campusAudio = new CampusAudioService();

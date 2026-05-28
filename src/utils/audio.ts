/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Lazy initialize upon first user gesture to comply with browser autoplay policy
    this.muted = localStorage.getItem('isMuted') === 'true';
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('isMuted', String(this.muted));
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playTap() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  playClickLocked() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  playMatch() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      // Play a beautiful 3-note arpeggio C5 -> E5 -> G5
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.06 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  playShuffle() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      
      // Sweep pitch up and down rapidly to sound like a card shuffle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.1);
      osc.frequency.linearRampToValueAtTime(150, now + 0.2);
      osc.frequency.linearRampToValueAtTime(450, now + 0.3);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  playPowerup() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const notes = [349.23, 440.00, 523.25, 698.46, 880.00]; // F4, A4, C5, F5, A5
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.2);
      });
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  playWin() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      // Glorious victory progression
      const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]; // C5 to C6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });

      // Play backing chord at the end
      setTimeout(() => {
        if (this.muted) return;
        const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major
        const chordNow = ctx.currentTime;
        chord.forEach((freq) => {
          const oscNode = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscNode.type = 'sawtooth';
          oscNode.frequency.setValueAtTime(freq, chordNow);
          gainNode.gain.setValueAtTime(0.05, chordNow);
          gainNode.gain.exponentialRampToValueAtTime(0.001, chordNow + 1.2);
          oscNode.connect(gainNode);
          gainNode.connect(ctx.destination);
          oscNode.start(chordNow);
          oscNode.stop(chordNow + 1.2);
        });
      }, 640);

    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  playLose() {
    if (this.muted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      // Sad sliding trombone-like sound
      const notes = [293.66, 277.18, 261.63, 246.94]; // D4, Db4, C4, B3

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        osc.frequency.linearRampToValueAtTime(freq - 20, now + idx * 0.15 + 0.14);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.16);
      });
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }
}

export const gameAudio = new AudioSynthesizer();

// Generate alert sound using Web Audio API - no external files needed
export function playAlertSound(type: 'ping' | 'urgent' = 'ping') {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    if (type === 'ping') {
      // Subtle 2-tone ping - not jarring, but noticeable
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc1.frequency.setValueAtTime(1100, ctx.currentTime + 0.12); // C#6

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.15); // E6

      gain.gain.setValueAtTime(0.08, ctx.currentTime); // Low volume
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.4);

      setTimeout(() => ctx.close(), 500);
    } else {
      // More urgent 3-tone alert for critical events
      const times = [0, 0.2, 0.4];
      const freqs = [880, 1100, 1320];

      times.forEach((t, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + t);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.18);
      });

      setTimeout(() => ctx.close(), 800);
    }
  } catch {
    // Audio not available - fail silently
  }
}

const WAVEFORM_BAR_COUNT = 72;

export function getStaticWaveformBars(seed: number) {
  return Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
    const base = 10 + ((index * 11 + seed) % 24);
    const accent = index % 9 === 0 ? 10 : index % 5 === 0 ? 6 : 0;
    const dip = index % 13 === 0 ? 7 : 0;
    return Math.max(6, Math.min(base + accent - dip, 42));
  });
}

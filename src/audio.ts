export function amplitudeToRelativeDb(amplitude: number): number {
  const safeAmplitude = Math.max(amplitude, 0.000001);
  return 20 * Math.log10(safeAmplitude) + 100;
}

export function rmsFromTimeDomain(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const normalized = (data[i] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / data.length);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(previous: number, next: number, weight: number): number {
  return previous + (next - previous) * weight;
}

export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder.toString().padStart(2, '0')}s`;
}

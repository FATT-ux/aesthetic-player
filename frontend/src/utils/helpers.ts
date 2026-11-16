import { FastAverageColor } from 'fast-average-color';
import type { LyricLine } from '../types/music';

const fac = new FastAverageColor();

export function parseLrc(lrc: string): LyricLine[] {
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + ms / 1000;
      const text = match[4].trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }
  return result;
}

export async function extractDominantColor(imageUrl: string): Promise<string> {
  try {
    const color = await fac.getColorAsync(imageUrl, { crossOrigin: 'anonymous' });
    return color.hex;
  } catch {
    return '#ff4d6d';
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

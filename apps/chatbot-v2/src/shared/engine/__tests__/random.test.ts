import { describe, it, expect } from 'vitest';
import { createSeed, nextRandom } from '../random';

function sequence(seed: number, length: number) {
  const values: number[] = [];
  let state = seed;
  for (let i = 0; i < length; i++) {
    const [value, next] = nextRandom(state);
    values.push(value);
    state = next;
  }
  return values;
}

describe('seeded random', () => {
  it('repeats the same sequence for the same seed', () => {
    expect(sequence(42, 20)).toEqual(sequence(42, 20));
    expect(sequence(42, 20)).not.toEqual(sequence(43, 20));
  });

  it('returns values in [0, 1)', () => {
    for (const value of sequence(7, 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('creates 32-bit integer seeds', () => {
    const seed = createSeed();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed >>> 0).toBe(seed);
  });
});

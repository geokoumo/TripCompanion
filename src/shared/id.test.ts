import { describe, expect, it } from 'vitest';
import { generateId } from './lib/id';

describe('generateId', () => {
  it('generates a non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique values across calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

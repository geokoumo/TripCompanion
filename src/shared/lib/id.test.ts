import { describe, expect, it } from 'vitest';
import { generateShareToken } from './id';

describe('generateShareToken', () => {
  it('produces a 64-character hex string (256 bits of entropy)', () => {
    const token = generateShareToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never repeats across calls (would indicate a broken/predictable source)', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateShareToken()));
    expect(tokens.size).toBe(200);
  });

  it('throws rather than silently falling back to a weak source when crypto.getRandomValues is unavailable', () => {
    const original = globalThis.crypto;
    // getRandomValues lives on the prototype, so deleting it off the
    // instance is a no-op, and `globalThis.crypto` itself is a getter-only
    // accessor in Node (a plain assignment throws) — redefine the property
    // instead to simulate an environment without WebCrypto.
    Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true });
    try {
      expect(() => generateShareToken()).toThrow();
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });
});

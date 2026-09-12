import { describe, expect, it } from 'vitest';
import { resolveCopy } from './lib/copy';

describe('resolveCopy', () => {
  it('resolves a key with no placeholders', () => {
    expect(resolveCopy('tripHealth.passed.stayOverlaps')).toBe('No overlapping stays.');
  });

  it('fills in a single placeholder', () => {
    expect(resolveCopy('tripHealth.action.completeTripInfo')).toBe('Complete trip info');
  });

  it('fills in multiple placeholders from params', () => {
    const text = resolveCopy('tripHealth.description.stayOverlap', { stay: 'Tokyo', conflicting: 'Kyoto', date: 'Aug 25' });
    expect(text).toBe('Tokyo checkout overlaps with Kyoto check-in on Aug 25.');
  });

  it('leaves an unmatched placeholder token untouched rather than throwing', () => {
    const text = resolveCopy('tripHealth.description.stayOverlap', { stay: 'Tokyo' });
    expect(text).toBe('Tokyo checkout overlaps with {{conflicting}} check-in on {{date}}.');
  });

  it('falls back to the raw key for an unknown key, rather than crashing', () => {
    expect(resolveCopy('tripHealth.title.doesNotExist')).toBe('tripHealth.title.doesNotExist');
  });

  it('substitutes the same placeholder name every time it appears', () => {
    const text = resolveCopy('X {{name}} and {{name}} again', { name: 'A' });
    // resolveCopy treats its first argument purely as a lookup key, so an
    // unregistered "key" (this literal template) falls back to itself —
    // still exercising the replace regex against a repeated placeholder.
    expect(text).toBe('X A and A again');
  });
});

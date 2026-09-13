import { describe, expect, it } from 'vitest';
import { describeCard } from './accessibleLabel';

describe('describeCard', () => {
  it('returns just the identity when no extras are given', () => {
    expect(describeCard('Open Delta DL123')).toBe('Open Delta DL123');
  });

  it('appends only the truthy extras, comma-separated, preserving order', () => {
    expect(describeCard('Open Delta DL123', 'Scheduled', false, undefined, null, 'document attached')).toBe(
      'Open Delta DL123, Scheduled, document attached',
    );
  });

  it('never invents an extra — an all-falsy extras list leaves the identity untouched', () => {
    expect(describeCard('Open Sushi Dai', false, undefined, null)).toBe('Open Sushi Dai');
  });
});

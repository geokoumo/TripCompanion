import { describe, expect, it } from 'vitest';
import { stopTravelerLabel } from './lib/travelerLabel';
import type { Traveler } from '../travelers/types';

const travelers: Traveler[] = [
  { id: 'a', name: 'Alex', avatarColor: 'avatar-1' },
  { id: 'b', name: 'Sam', avatarColor: 'avatar-2' },
];

describe('stopTravelerLabel (F-12)', () => {
  it('lists named travelers regardless of assignedToNobody', () => {
    expect(stopTravelerLabel({ travelerIds: ['a', 'b'] }, travelers, 'Everyone')).toBe('Alex, Sam');
  });

  it('uses the given "everyone" label for an empty, unflagged travelerIds — the existing, unchanged default meaning', () => {
    expect(stopTravelerLabel({ travelerIds: [] }, travelers, 'Everyone')).toBe('Everyone');
    expect(stopTravelerLabel({ travelerIds: [], assignedToNobody: false }, travelers, 'Everyone')).toBe('Everyone');
    expect(stopTravelerLabel({ travelerIds: [], assignedToNobody: undefined }, travelers, 'Everyone')).toBe('Everyone');
  });

  it('reports "no traveler assigned" for an empty travelerIds flagged by removal, never conflating it with "everyone"', () => {
    expect(stopTravelerLabel({ travelerIds: [], assignedToNobody: true }, travelers, 'Everyone')).toBe('No traveler assigned');
  });

  it('respects the caller-supplied "everyone" wording (e.g. lowercase "all")', () => {
    expect(stopTravelerLabel({ travelerIds: [] }, travelers, 'all')).toBe('all');
  });
});

import { describe, expect, it } from 'vitest';
import type { ItineraryStop } from '../types';
import { recentStopLocations } from './recentStopLocations';

function makeStop(overrides: Partial<ItineraryStop> = {}): ItineraryStop {
  return {
    id: 's1',
    date: '2026-09-15',
    time: '10:00',
    allDay: false,
    title: 'Stop',
    type: 'sight',
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

describe('recentStopLocations', () => {
  it('returns stop locations most-recently-dated first', () => {
    const result = recentStopLocations([
      makeStop({ id: 'a', date: '2026-09-10', location: 'Asakusa' }),
      makeStop({ id: 'b', date: '2026-09-15', location: 'Shibuya' }),
    ]);
    expect(result).toEqual(['Shibuya', 'Asakusa']);
  });

  it('deduplicates case-insensitively, keeping the most recent occurrence', () => {
    const result = recentStopLocations([
      makeStop({ id: 'a', date: '2026-09-10', location: 'shibuya' }),
      makeStop({ id: 'b', date: '2026-09-15', location: 'Shibuya' }),
    ]);
    expect(result).toEqual(['Shibuya']);
  });

  it('skips stops with no location', () => {
    const result = recentStopLocations([makeStop({ location: undefined }), makeStop({ id: 'b', location: 'Ginza' })]);
    expect(result).toEqual(['Ginza']);
  });

  it('caps the result', () => {
    const stops = Array.from({ length: 15 }, (_, i) => makeStop({ id: `s${i}`, date: `2026-09-${10 + i}`, location: `Place ${i}` }));
    expect(recentStopLocations(stops, 5)).toHaveLength(5);
  });
});

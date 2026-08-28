import { describe, expect, it } from 'vitest';
import { computeOverlappingStopIds } from './lib/stopOverlap';
import type { ItineraryStop } from './types';

function stop(overrides: Partial<ItineraryStop>): ItineraryStop {
  return {
    id: 'id',
    date: '2026-09-06',
    time: '10:00',
    allDay: false,
    title: 'Stop',
    type: 'sight',
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

describe('computeOverlappingStopIds', () => {
  it('flags two timed stops with overlapping ranges', () => {
    const stops = [
      stop({ id: 'a', time: '10:00', durationMinutes: 90 }),
      stop({ id: 'b', time: '10:30', durationMinutes: 30 }),
    ];
    const overlapping = computeOverlappingStopIds(stops);
    expect(overlapping).toEqual(new Set(['a', 'b']));
  });

  it('never flags an all-day stop against a timed stop on the same day', () => {
    const stops = [
      stop({ id: 'allday', allDay: true, time: undefined, durationMinutes: undefined }),
      stop({ id: 'timed', time: '10:00', durationMinutes: 90 }),
    ];
    const overlapping = computeOverlappingStopIds(stops);
    expect(overlapping.size).toBe(0);
  });

  it('never flags two all-day stops against each other', () => {
    const stops = [
      stop({ id: 'a', allDay: true, time: undefined }),
      stop({ id: 'b', allDay: true, time: undefined }),
    ];
    expect(computeOverlappingStopIds(stops).size).toBe(0);
  });

  it('ignores stops with no duration set', () => {
    const stops = [
      stop({ id: 'a', time: '10:00', durationMinutes: undefined }),
      stop({ id: 'b', time: '10:15', durationMinutes: 60 }),
    ];
    expect(computeOverlappingStopIds(stops).size).toBe(0);
  });
});

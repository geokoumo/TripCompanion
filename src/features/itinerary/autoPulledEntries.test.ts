import { describe, expect, it } from 'vitest';
import { autoPulledEntryMeta, buildAutoPulledEntries, groupAutoPulledByDate, resolveAutoPulledSource } from './lib/autoPulledEntries';
import type { Flight } from '../flights/types';
import type { Stay } from '../stays/types';

function flight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'Test Air',
    flightNumber: 'TA1',
    depAirport: 'ATH',
    depDate: '2026-09-05',
    depTime: '23:40',
    arrAirport: 'NRT',
    arrDate: '2026-09-06',
    arrTime: '06:15',
    status: 'scheduled',
    ...overrides,
  };
}

function stay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Hotel',
    address: 'Addr',
    checkinDate: '2026-09-06',
    checkinTime: '15:00',
    checkoutDate: '2026-09-10',
    checkoutTime: '11:00',
    ...overrides,
  };
}

describe('buildAutoPulledEntries', () => {
  it('contributes a departure and arrival entry per flight', () => {
    const entries = buildAutoPulledEntries([flight()], []);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.kind)).toEqual(['departure', 'arrival']);
    expect(entries[0]!.date).toBe('2026-09-05');
    expect(entries[1]!.date).toBe('2026-09-06');
  });

  it('contributes a check-in and check-out entry per stay', () => {
    const entries = buildAutoPulledEntries([], [stay()]);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.kind)).toEqual(['checkin', 'checkout']);
  });

  it('sorts every entry chronologically by date then time regardless of source order', () => {
    const entries = buildAutoPulledEntries([flight()], [stay()]);
    const stamps = entries.map((e) => e.date + e.time);
    const sorted = [...stamps].sort();
    expect(stamps).toEqual(sorted);
  });

  it('gives each entry a stable id derived from its source so re-renders keep React keys stable', () => {
    const entries = buildAutoPulledEntries([flight({ id: 'abc' })], []);
    expect(entries.map((e) => e.id)).toEqual(['flight-dep-abc', 'flight-arr-abc']);
  });
});

describe('groupAutoPulledByDate', () => {
  it('groups entries under their date, preserving arrival order within a day', () => {
    const entries = buildAutoPulledEntries([flight({ depDate: '2026-09-06', arrDate: '2026-09-06', depTime: '08:00', arrTime: '09:00' })], []);
    const grouped = groupAutoPulledByDate(entries);
    expect(grouped.size).toBe(1);
    expect(grouped.get('2026-09-06')).toHaveLength(2);
  });

  it('returns an empty map for no entries', () => {
    expect(groupAutoPulledByDate([]).size).toBe(0);
  });
});

describe('autoPulledEntryMeta', () => {
  it('shows the confirmation number when the source flight has a booking reference', () => {
    const entries = buildAutoPulledEntries([flight({ id: 'f1', bookingRef: 'AB123' })], []);
    expect(autoPulledEntryMeta(entries[0]!, [flight({ id: 'f1', bookingRef: 'AB123' })], [])).toBe('Confirmation #AB123');
  });

  it('shows the confirmation number when the source stay has a booking reference', () => {
    const entries = buildAutoPulledEntries([], [stay({ id: 's1', bookingRef: 'HB-9' })]);
    expect(autoPulledEntryMeta(entries[0]!, [], [stay({ id: 's1', bookingRef: 'HB-9' })])).toBe('Confirmation #HB-9');
  });

  it('never invents a confirmation number when the source has none', () => {
    const entries = buildAutoPulledEntries([flight({ id: 'f1' })], []);
    expect(autoPulledEntryMeta(entries[0]!, [flight({ id: 'f1' })], [])).toBeUndefined();
  });
});

describe('resolveAutoPulledSource', () => {
  it('resolves a flight entry back to the exact same flight record its own tab edits', () => {
    const f = flight({ id: 'f1' });
    const entries = buildAutoPulledEntries([f], []);
    expect(resolveAutoPulledSource(entries[0]!, [f], [])).toEqual({ kind: 'flight', flight: f });
  });

  it('resolves a stay entry back to the exact same stay record its own tab edits', () => {
    const s = stay({ id: 's1' });
    const entries = buildAutoPulledEntries([], [s]);
    expect(resolveAutoPulledSource(entries[0]!, [], [s])).toEqual({ kind: 'stay', stay: s });
  });

  it('returns null when the source record no longer exists (deleted since)', () => {
    const entries = buildAutoPulledEntries([flight({ id: 'f1' })], []);
    expect(resolveAutoPulledSource(entries[0]!, [], [])).toBeNull();
  });
});

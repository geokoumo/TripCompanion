import { describe, expect, it } from 'vitest';
import { detectStayOverlap } from './detectStayOverlap';
import type { Stay } from './schemas';

function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Hotel Azul',
    address: '123 Main St',
    checkinDate: '2026-09-05',
    checkinTime: '15:00',
    checkoutDate: '2026-09-08',
    checkoutTime: '11:00',
    ...overrides,
  };
}

describe('detectStayOverlap', () => {
  it('flags two stays whose date ranges overlap', () => {
    const a = makeStay({ id: 's1', checkinDate: '2026-09-05', checkoutDate: '2026-09-08' });
    const b = makeStay({ id: 's2', checkinDate: '2026-09-07', checkoutDate: '2026-09-10' });
    expect(detectStayOverlap(a, [b])).toEqual([{ code: 'STAY_OVERLAP', field: 'checkinDate', conflictingId: 's2' }]);
  });

  it('is valid when one stay checks out exactly when the next checks in, same time', () => {
    const a = makeStay({ id: 's1', checkoutDate: '2026-09-08', checkoutTime: '11:00' });
    const b = makeStay({ id: 's2', checkinDate: '2026-09-08', checkinTime: '11:00' });
    expect(detectStayOverlap(a, [b])).toEqual([]);
  });

  it('flags an overlap when the next check-in is a minute before the previous check-out', () => {
    const a = makeStay({ id: 's1', checkoutDate: '2026-09-08', checkoutTime: '11:00' });
    const b = makeStay({ id: 's2', checkinDate: '2026-09-08', checkinTime: '10:59' });
    expect(detectStayOverlap(a, [b])).toEqual([{ code: 'STAY_OVERLAP', field: 'checkinDate', conflictingId: 's2' }]);
  });

  it('is valid for two stays with a gap between them', () => {
    const a = makeStay({ id: 's1', checkinDate: '2026-09-01', checkoutDate: '2026-09-03' });
    const b = makeStay({ id: 's2', checkinDate: '2026-09-05', checkoutDate: '2026-09-08' });
    expect(detectStayOverlap(a, [b])).toEqual([]);
  });

  it('flags identical stays as overlapping', () => {
    const a = makeStay({ id: 's1' });
    const b = makeStay({ id: 's2' });
    expect(detectStayOverlap(a, [b])).toEqual([{ code: 'STAY_OVERLAP', field: 'checkinDate', conflictingId: 's2' }]);
  });

  it('EDITING: excludes the stay itself from the comparison set by id', () => {
    const candidate = makeStay({ id: 's1' });
    const preEditSelf = makeStay({ id: 's1' });
    expect(detectStayOverlap(candidate, [preEditSelf])).toEqual([]);
  });

  it('flags a stay fully nested inside another', () => {
    const outer = makeStay({ id: 's1', checkinDate: '2026-09-01', checkoutDate: '2026-09-10' });
    const inner = makeStay({ id: 's2', checkinDate: '2026-09-03', checkoutDate: '2026-09-05' });
    expect(detectStayOverlap(inner, [outer])).toEqual([{ code: 'STAY_OVERLAP', field: 'checkinDate', conflictingId: 's1' }]);
  });

  it('reports a conflict per overlapping stay when there are several', () => {
    const candidate = makeStay({ id: 's1', checkinDate: '2026-09-05', checkoutDate: '2026-09-08' });
    const overlapping = makeStay({ id: 's2', checkinDate: '2026-09-06', checkoutDate: '2026-09-09' });
    const distinct = makeStay({ id: 's3', checkinDate: '2026-10-01', checkoutDate: '2026-10-03' });
    const errors = detectStayOverlap(candidate, [overlapping, distinct]);
    expect(errors).toEqual([{ code: 'STAY_OVERLAP', field: 'checkinDate', conflictingId: 's2' }]);
  });

  it('returns no errors when there are no other stays', () => {
    expect(detectStayOverlap(makeStay(), [])).toEqual([]);
  });
});

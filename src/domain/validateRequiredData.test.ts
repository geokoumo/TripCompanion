import { describe, expect, it } from 'vitest';
import { validateRequiredData } from './validateRequiredData';

describe('validateRequiredData', () => {
  it('returns no errors when every required field is present', () => {
    expect(validateRequiredData('traveler', { id: 't1', name: 'Ada' })).toEqual([]);
  });

  it('flags a missing field as MISSING_REQUIRED_DATA with the field name', () => {
    expect(validateRequiredData('traveler', { id: 't1' })).toEqual([{ code: 'MISSING_REQUIRED_DATA', field: 'name' }]);
  });

  it('treats an empty string as missing', () => {
    expect(validateRequiredData('traveler', { id: 't1', name: '' })).toEqual([{ code: 'MISSING_REQUIRED_DATA', field: 'name' }]);
  });

  it('treats a whitespace-only string as missing', () => {
    expect(validateRequiredData('traveler', { id: 't1', name: '   ' })).toEqual([{ code: 'MISSING_REQUIRED_DATA', field: 'name' }]);
  });

  it('treats an empty array as missing', () => {
    const errors = validateRequiredData('expense', {
      id: 'e1',
      amount: 10,
      currency: 'EUR',
      categoryId: 'food',
      date: '2026-09-05',
      paidBy: 't1',
      splitAmong: [],
    });
    expect(errors).toEqual([{ code: 'MISSING_REQUIRED_DATA', field: 'splitAmong' }]);
  });

  it('does not treat 0 as missing', () => {
    const errors = validateRequiredData('expense', {
      id: 'e1',
      amount: 0,
      currency: 'EUR',
      categoryId: 'food',
      date: '2026-09-05',
      paidBy: 't1',
      splitAmong: ['t1'],
    });
    expect(errors).toEqual([]);
  });

  it('does not treat false as missing', () => {
    expect(
      validateRequiredData('packingItem', { id: 'p1', text: 'Passport', category: 'Documents', travelerId: 't1', done: false }),
    ).toEqual([]);
  });

  it('reports every missing field, not just the first', () => {
    const errors = validateRequiredData('flight', { id: 'f1' });
    const fields = errors.map((e) => e.field).sort();
    expect(fields).toEqual(['airline', 'arrAirport', 'arrDate', 'arrTime', 'depAirport', 'depDate', 'depTime', 'flightNumber'].sort());
  });

  describe('activity time — conditionally required', () => {
    it('requires time when not all-day', () => {
      const errors = validateRequiredData('activity', { id: 'a1', title: 'Colosseum', type: 'sight', date: '2026-09-05', allDay: false });
      expect(errors).toContainEqual({ code: 'MISSING_REQUIRED_DATA', field: 'time' });
    });

    it('does not require time when all-day', () => {
      const errors = validateRequiredData('activity', { id: 'a1', title: 'Colosseum', type: 'sight', date: '2026-09-05', allDay: true });
      expect(errors).toEqual([]);
    });

    it('requires time when allDay is entirely absent (defaults to timed)', () => {
      const errors = validateRequiredData('activity', { id: 'a1', title: 'Colosseum', type: 'sight', date: '2026-09-05' });
      expect(errors).toContainEqual({ code: 'MISSING_REQUIRED_DATA', field: 'time' });
    });
  });

  it('validates a trip entity', () => {
    expect(validateRequiredData('trip', { id: 't1', title: 'Japan', startDate: '2026-09-01', endDate: '2026-09-10' })).toEqual([]);
    expect(validateRequiredData('trip', { id: 't1' })).toEqual(
      expect.arrayContaining([
        { code: 'MISSING_REQUIRED_DATA', field: 'title' },
        { code: 'MISSING_REQUIRED_DATA', field: 'startDate' },
        { code: 'MISSING_REQUIRED_DATA', field: 'endDate' },
      ]),
    );
  });

  it('validates a document entity', () => {
    expect(
      validateRequiredData('document', { id: 'd1', title: 'Passport', category: 'other', fileType: 'pdf', storagePath: 'a/b.pdf' }),
    ).toEqual([]);
  });

  it('validates a booking entity', () => {
    expect(validateRequiredData('booking', { id: 'b1', name: 'Trattoria', type: 'restaurant' })).toEqual([]);
    expect(validateRequiredData('booking', { id: 'b1' })).toEqual(
      expect.arrayContaining([
        { code: 'MISSING_REQUIRED_DATA', field: 'name' },
        { code: 'MISSING_REQUIRED_DATA', field: 'type' },
      ]),
    );
  });

  it('validates a stay entity', () => {
    expect(
      validateRequiredData('stay', {
        id: 's1',
        name: 'Hotel Azul',
        address: '123 Main St',
        checkinDate: '2026-09-05',
        checkinTime: '15:00',
        checkoutDate: '2026-09-08',
        checkoutTime: '11:00',
      }),
    ).toEqual([]);
  });
});

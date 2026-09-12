import { describe, expect, it } from 'vitest';
import {
  ActivitySchema,
  BookingSchema,
  DocumentSchema,
  ExpenseSchema,
  FlightSchema,
  PackingItemSchema,
  StaySchema,
  TravelerSchema,
  TripSchema,
} from './schemas';

describe('domain schemas', () => {
  it('parses a minimal valid Traveler', () => {
    expect(TravelerSchema.safeParse({ id: 't1', name: 'Ada' }).success).toBe(true);
  });

  it('rejects a Traveler with a blank name', () => {
    expect(TravelerSchema.safeParse({ id: 't1', name: '' }).success).toBe(false);
  });

  it('parses a minimal valid Activity, defaulting allDay/travelerIds/done', () => {
    const result = ActivitySchema.safeParse({ id: 'a1', title: 'Museum', type: 'sight', date: '2026-09-06' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ allDay: false, travelerIds: [], done: false });
    }
  });

  it('rejects an Activity with an unknown type', () => {
    expect(ActivitySchema.safeParse({ id: 'a1', title: 'Museum', type: 'not-a-type', date: '2026-09-06' }).success).toBe(false);
  });

  it('parses an Activity with the optional price/currency/location fields', () => {
    const result = ActivitySchema.safeParse({
      id: 'a1',
      title: 'Guided tour',
      type: 'sight',
      date: '2026-09-06',
      time: '10:00',
      durationMinutes: 90,
      price: 25,
      currency: 'EUR',
      location: 'Old Town',
    });
    expect(result.success).toBe(true);
  });

  it('parses a minimal valid Flight', () => {
    const result = FlightSchema.safeParse({
      id: 'f1',
      airline: 'Aegean',
      flightNumber: 'A3600',
      depAirport: 'ATH',
      depDate: '2026-09-05',
      depTime: '10:00',
      arrAirport: 'FCO',
      arrDate: '2026-09-05',
      arrTime: '12:00',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('scheduled');
  });

  it('rejects a Flight missing a required field', () => {
    expect(FlightSchema.safeParse({ id: 'f1', airline: 'Aegean' }).success).toBe(false);
  });

  it('parses a minimal valid Stay', () => {
    const result = StaySchema.safeParse({
      id: 's1',
      name: 'Hotel Azul',
      address: '123 Main St',
      checkinDate: '2026-09-05',
      checkinTime: '15:00',
      checkoutDate: '2026-09-08',
      checkoutTime: '11:00',
    });
    expect(result.success).toBe(true);
  });

  it('parses a minimal valid Booking', () => {
    expect(BookingSchema.safeParse({ id: 'b1', type: 'restaurant', name: 'Trattoria' }).success).toBe(true);
  });

  it('rejects a Booking with an unknown type', () => {
    expect(BookingSchema.safeParse({ id: 'b1', type: 'not-a-type', name: 'Trattoria' }).success).toBe(false);
  });

  it('parses a minimal valid Document', () => {
    const result = DocumentSchema.safeParse({
      id: 'd1',
      category: 'other',
      title: 'Passport',
      fileType: 'pdf',
      storagePath: 'user1/trip1/passport.pdf',
      uploadedAt: '2026-09-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('parses a minimal valid Expense', () => {
    const result = ExpenseSchema.safeParse({
      id: 'e1',
      amount: 20,
      currency: 'EUR',
      categoryId: 'food',
      date: '2026-09-05',
      paidBy: 't1',
      splitAmong: ['t1'],
    });
    expect(result.success).toBe(true);
  });

  it('parses a minimal valid PackingItem, defaulting quantity/done', () => {
    const result = PackingItemSchema.safeParse({ id: 'p1', text: 'Passport', category: 'Documents', travelerId: 't1' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ quantity: 1, done: false });
  });

  it('parses a full Trip aggregate with nested entities', () => {
    const result = TripSchema.safeParse({
      id: 't1',
      title: 'Japan',
      startDate: '2026-09-05',
      endDate: '2026-09-12',
      activities: [{ id: 'a1', title: 'Museum', type: 'sight', date: '2026-09-06' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.homeCurrency).toBe('EUR');
      expect(result.data.activities).toHaveLength(1);
      expect(result.data.stays).toEqual([]);
    }
  });

  it('rejects a Trip missing required fields', () => {
    expect(TripSchema.safeParse({ id: 't1' }).success).toBe(false);
  });
});

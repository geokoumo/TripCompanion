import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { todayStr } from '../../../shared/lib/dateFormat';
import type { Trip } from '../../trips/types';
import { TodayView } from './TodayView';

const TODAY = todayStr();

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    legs: [],
    flights: [],
    stays: [],
    itineraryStops: [],
    travelers: [],
    ...overrides,
  } as Trip;
}

describe('TodayView — current leg banner', () => {
  it('shows the current leg when today falls within one of the trip\'s legs', () => {
    render(
      <TodayView
        trip={makeTrip({ legs: [{ id: 'l1', city: 'Kyoto', country: 'Japan', startDate: TODAY, endDate: TODAY, currency: 'EUR' }] })}
        onOpenStop={vi.fn()}
        onOpenAutoPulledEntry={vi.fn()}
      />,
    );
    expect(screen.getByText('Current leg')).toBeInTheDocument();
    expect(screen.getByText('KYOTO')).toBeInTheDocument();
    expect(screen.getByText(/Kyoto, Japan/)).toBeInTheDocument();
  });

  it('shows no banner when today falls outside every leg — never guesses a default', () => {
    render(
      <TodayView
        trip={makeTrip({ legs: [{ id: 'l1', city: 'Kyoto', country: 'Japan', startDate: '2020-01-01', endDate: '2020-01-05', currency: 'EUR' }] })}
        onOpenStop={vi.fn()}
        onOpenAutoPulledEntry={vi.fn()}
      />,
    );
    expect(screen.queryByText('Current leg')).not.toBeInTheDocument();
  });

  it('shows no banner when the trip has no legs at all', () => {
    render(<TodayView trip={makeTrip()} onOpenStop={vi.fn()} onOpenAutoPulledEntry={vi.fn()} />);
    expect(screen.queryByText('Current leg')).not.toBeInTheDocument();
  });
});

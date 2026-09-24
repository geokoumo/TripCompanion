import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../app/providers/AuthProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Trip } from '../../trips/types';
import type { Flight } from '../types';
import { FlightForm } from './FlightForm';

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'Delta',
    flightNumber: 'DL123',
    depAirport: 'JFK',
    depDate: '2026-09-15',
    depTime: '10:00',
    arrAirport: 'LHR',
    arrDate: '2026-09-15',
    arrTime: '22:00',
    status: 'scheduled',
    ...overrides,
  };
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    flights: [],
    stays: [],
    documents: [],
    ...overrides,
  } as Trip;
}

function renderForm(props: Partial<React.ComponentProps<typeof FlightForm>> = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(
    <ToastProvider>
      <AuthProvider>
        <FlightForm trip={makeTrip()} updateTrip={vi.fn().mockResolvedValue(undefined)} initial={makeFlight()} onClose={onClose} onSave={onSave} {...props} />
      </AuthProvider>
    </ToastProvider>,
  );
  return { onSave, onClose };
}

describe('FlightForm — required-field validation matches the persisted schema', () => {
  it('blocks saving with a blank airline instead of letting an invalid Flight reach the repository', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm();

    await user.clear(screen.getByLabelText('Airline'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Edit flight')).toBeInTheDocument();
  });

  it('still saves a flight with every required field present (regression guard on the check above)', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

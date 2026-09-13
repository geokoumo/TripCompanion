import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Trip } from '../types';
import { ShareSheet } from './ShareSheet';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    shareSettings: { enabled: false, includedTabs: [] },
    ...overrides,
  } as Trip;
}

function renderSheet(trip: Trip, onSave = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ToastProvider>
      <ShareSheet trip={trip} onClose={vi.fn()} onSave={onSave} />
    </ToastProvider>,
  );
  return { onSave };
}

describe('ShareSheet — tab chip accessible state', () => {
  it('exposes each tab chip\'s selected state via aria-pressed, not just a visual attribute', () => {
    renderSheet(makeTrip());
    const overviewChip = screen.getByRole('button', { name: 'Overview' });
    const flightsChip = screen.getByRole('button', { name: 'Flights' });
    // Overview is included by default when no share settings exist yet.
    expect(overviewChip).toHaveAttribute('aria-pressed', 'true');
    expect(flightsChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('flips aria-pressed when a chip is toggled', async () => {
    const user = userEvent.setup();
    renderSheet(makeTrip());
    const flightsChip = screen.getByRole('button', { name: 'Flights' });
    expect(flightsChip).toHaveAttribute('aria-pressed', 'false');
    await user.click(flightsChip);
    expect(flightsChip).toHaveAttribute('aria-pressed', 'true');
  });
});

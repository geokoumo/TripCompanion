import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TripHealthBanner } from './TripHealthBanner';
import type { TripHealthWarning } from '../types';

function warning(overrides: Partial<TripHealthWarning> = {}): TripHealthWarning {
  return {
    id: 'w1',
    severity: 'warning',
    title: 'Missing exchange rate JPY to EUR',
    description: 'desc',
    fixLabel: 'Add Exchange Rate',
    fixTarget: 'budget',
    ...overrides,
  };
}

describe('TripHealthBanner', () => {
  it('shows an all-clear state when there are no warnings, rather than disappearing', () => {
    render(<TripHealthBanner warnings={[]} onOpen={() => {}} />);
    expect(screen.getByText('All checks passed.')).toBeInTheDocument();
  });

  it('shows the warning count and a summary when warnings exist', () => {
    render(<TripHealthBanner warnings={[warning(), warning({ id: 'w2', title: 'Overlapping stays: A & B' })]} onOpen={() => {}} />);
    expect(screen.getByText('2 Trip Health issues')).toBeInTheDocument();
    expect(screen.getByText(/Missing exchange rate JPY to EUR, Overlapping stays: A & B/)).toBeInTheDocument();
  });

  it('uses singular phrasing for exactly one warning', () => {
    render(<TripHealthBanner warnings={[warning()]} onOpen={() => {}} />);
    expect(screen.getByText('1 Trip Health issue')).toBeInTheDocument();
  });

  it('calls onOpen when tapped', async () => {
    const onOpen = vi.fn();
    render(<TripHealthBanner warnings={[warning()]} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

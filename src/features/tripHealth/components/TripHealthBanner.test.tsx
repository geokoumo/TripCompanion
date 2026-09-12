import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TripHealthBanner } from './TripHealthBanner';
import type { TripHealthWarning } from '../types';

function warning(overrides: Partial<TripHealthWarning> = {}): TripHealthWarning {
  return {
    type: 'MISSING_EXCHANGE_RATE',
    severity: 'warning',
    entityType: 'trip',
    entityId: 't1',
    titleKey: 'tripHealth.title.missingExchangeRate',
    descriptionKey: 'tripHealth.description.missingExchangeRate',
    params: { count: '2', currency: 'JPY', expenseWord: 'expenses are' },
    action: 'tripHealth.action.addExchangeRate',
    navigationTarget: 'budget',
    ...overrides,
  };
}

describe('TripHealthBanner', () => {
  it('shows an all-clear state when there are no warnings, rather than disappearing', () => {
    render(<TripHealthBanner warnings={[]} onOpen={() => {}} />);
    expect(screen.getByText('All checks passed.')).toBeInTheDocument();
  });

  it('shows the warning count and a description when there is exactly one warning', () => {
    render(<TripHealthBanner warnings={[warning()]} onOpen={() => {}} />);
    expect(screen.getByText('1 Trip Health issue')).toBeInTheDocument();
    expect(screen.getByText('2 JPY expenses are missing a saved exchange rate. Add a fixed rate so budget totals are calculated from saved trip data only.')).toBeInTheDocument();
  });

  it('joins each warning\'s title when there is more than one', () => {
    const stayWarning = warning({
      type: 'STAY_OVERLAP',
      entityType: 'stay',
      entityId: 's1',
      titleKey: 'tripHealth.title.stayOverlap',
      descriptionKey: 'tripHealth.description.stayOverlap',
      params: { stay: 'Tokyo', conflicting: 'Kyoto', date: 'Aug 25' },
      action: 'tripHealth.action.updateStayDates',
      navigationTarget: 'stays',
    });
    render(<TripHealthBanner warnings={[warning(), stayWarning]} onOpen={() => {}} />);
    expect(screen.getByText('2 Trip Health issues')).toBeInTheDocument();
    expect(screen.getByText('Missing exchange rate, Overlapping stays')).toBeInTheDocument();
  });

  it('calls onOpen when tapped', async () => {
    const onOpen = vi.fn();
    render(<TripHealthBanner warnings={[warning()]} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

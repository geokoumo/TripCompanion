import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SearchResultGroup } from '../types';
import { SearchScreen } from './SearchScreen';

const searchTrips = vi.fn<(query: string) => Promise<SearchResultGroup[]>>();

vi.mock('../../../app/providers/TripsProvider', () => ({
  useTripsContext: () => ({ searchTrips }),
}));

describe('SearchScreen', () => {
  it('always shows the privacy reassurance caption, before and after a search', async () => {
    searchTrips.mockResolvedValue([]);
    render(<SearchScreen onOpenTrip={vi.fn()} />);
    expect(screen.getByText('Searching your own private data only')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/Flight number/), 'Kyoto');
    await waitFor(() => expect(searchTrips).toHaveBeenCalled());
    expect(screen.getByText('Searching your own private data only')).toBeInTheDocument();
  });

  it('labels each result row with its real match type, grouped under the trip it belongs to', async () => {
    const groups: SearchResultGroup[] = [
      {
        tripId: 't1',
        tripTitle: 'Japan — Summer',
        matches: [
          { type: 'flight', id: 'f1', label: 'Emirates EK210 · DXB → HND', tab: 'flights' },
          { type: 'stay', id: 's1', label: 'Park Hyatt Tokyo', tab: 'stays' },
        ],
      },
    ];
    searchTrips.mockResolvedValue(groups);
    const user = userEvent.setup();
    render(<SearchScreen onOpenTrip={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/Flight number/), 'Tokyo');

    await waitFor(() => expect(screen.getByText('Japan — Summer')).toBeInTheDocument());
    expect(screen.getByText('Flight')).toBeInTheDocument();
    expect(screen.getByText('Stay')).toBeInTheDocument();
    expect(screen.getByText('Emirates EK210 · DXB → HND')).toBeInTheDocument();
  });

  it('opening a result calls onOpenTrip with the trip and the match\'s own tab', async () => {
    const onOpenTrip = vi.fn();
    const groups: SearchResultGroup[] = [
      { tripId: 't1', tripTitle: 'Japan — Summer', matches: [{ type: 'stay', id: 's1', label: 'Park Hyatt Tokyo', tab: 'stays' }] },
    ];
    searchTrips.mockResolvedValue(groups);
    const user = userEvent.setup();
    render(<SearchScreen onOpenTrip={onOpenTrip} />);
    await user.type(screen.getByPlaceholderText(/Flight number/), 'Hyatt');

    await waitFor(() => expect(screen.getByText('Park Hyatt Tokyo')).toBeInTheDocument());
    await user.click(screen.getByText('Park Hyatt Tokyo'));
    expect(onOpenTrip).toHaveBeenCalledWith('t1', 'stays');
  });
});

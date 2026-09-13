import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ManageTravelersSheet } from './ManageTravelersSheet';
import type { Trip } from '../../trips/types';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Japan',
    travelers: [
      { id: 'existing1', name: 'Alex', avatarColor: 'avatar-1' },
      { id: 'existing2', name: 'Sam', avatarColor: 'avatar-2' },
    ],
    expenses: [],
    checklistItems: [],
    itineraryStops: [],
    ...overrides,
  } as Trip;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('ManageTravelersSheet', () => {
  it('shows the travelers already on the trip', () => {
    render(<ManageTravelersSheet trip={makeTrip()} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  it('save is disabled until something actually changes', async () => {
    const user = userEvent.setup();
    render(<ManageTravelersSheet trip={makeTrip()} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), 'Maria');
    await user.click(screen.getByRole('button', { name: '+ Add traveler' }));

    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/ })).not.toBeDisabled();
  });

  it('adds new travelers appended to the existing list, never replacing it', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ManageTravelersSheet trip={makeTrip()} onClose={onClose} onSave={onSave} />);

    await user.type(screen.getByLabelText('Name'), 'Maria');
    await user.click(screen.getByRole('button', { name: '+ Add traveler' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.travelers.map((t) => t.name)).toEqual(['Alex', 'Sam', 'Maria']);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('a newly added (unsaved) traveler can be removed instantly, no confirmation needed', async () => {
    const user = userEvent.setup();
    render(<ManageTravelersSheet trip={makeTrip()} onClose={() => {}} onSave={() => {}} />);
    await user.type(screen.getByLabelText('Name'), 'Maria');
    await user.click(screen.getByRole('button', { name: '+ Add traveler' }));
    await user.click(screen.getByRole('button', { name: 'Remove Maria' }));

    expect(screen.queryByText('Maria')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('renames an existing traveler in place', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ManageTravelersSheet trip={makeTrip()} onClose={() => {}} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Rename Alex' }));
    // Two "Name" fields now coexist (the inline rename row + the add-new-traveler row) — the rename one renders first.
    const input = screen.getAllByLabelText('Name')[0]!;
    await user.clear(input);
    await user.type(input, 'Alexandra');
    // Two "Save" buttons coexist while editing (inline row + footer) — the inline one comes first in DOM order.
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0]!);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.travelers.map((t) => t.name)).toEqual(['Alexandra', 'Sam']);
  });

  it('blocks removal of a traveler linked to an expense, explaining why', async () => {
    const user = userEvent.setup();
    const trip = makeTrip({
      expenses: [
        { id: 'e1', amount: 10, currency: 'EUR', categoryId: 'c1', date: '2026-01-01', paidBy: 'existing1', splitAmong: ['existing1', 'existing2'] },
      ] as Trip['expenses'],
    });
    render(<ManageTravelersSheet trip={trip} onClose={() => {}} onSave={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Remove Alex' }));
    const dialog = screen.getByText("Can't remove").closest('[role="dialog"]') as HTMLElement;
    expect(within(dialog).getByText(/linked to 1 expense/)).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();

    // Two elements answer to the accessible name "Close" here (the modal's own X icon and this footer button) — target by visible text instead.
    await user.click(within(dialog).getByText('Close'));
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('warns about cascading checklist items and stop assignments before removing, and applies the cascade on save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const trip = makeTrip({
      checklistItems: [{ id: 'ci1', travelerId: 'existing2', text: 'Passport', category: 'docs', quantity: 1, done: false }] as Trip['checklistItems'],
      itineraryStops: [{ id: 's1', travelerIds: ['existing2'], title: 'Museum' }] as unknown as Trip['itineraryStops'],
    });
    render(<ManageTravelersSheet trip={trip} onClose={() => {}} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Remove Sam' }));
    const dialog = screen.getByText('Remove Sam?').closest('[role="dialog"]') as HTMLElement;
    expect(within(dialog).getByText(/removes 1 of their checklist item/)).toBeInTheDocument();
    expect(within(dialog).getByText(/unassigned from 1 activity/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

    expect(screen.queryByText('Sam')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Save/ }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.travelers.map((t) => t.name)).toEqual(['Alex']);
    expect(saved.checklistItems).toEqual([]);
    expect((saved.itineraryStops[0] as unknown as { travelerIds: string[] }).travelerIds).toEqual([]);
  });

  it('does not close until save actually resolves, and disables the button meanwhile', async () => {
    const user = userEvent.setup();
    const { promise, resolve } = deferred<void>();
    const onSave = vi.fn(() => promise);
    const onClose = vi.fn();
    render(<ManageTravelersSheet trip={makeTrip()} onClose={onClose} onSave={onSave} />);

    await user.type(screen.getByLabelText('Name'), 'Maria');
    await user.click(screen.getByRole('button', { name: '+ Add traveler' }));
    await user.click(screen.getByRole('button', { name: /^Save/ }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();

    resolve();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddTravelerSheet } from './AddTravelerSheet';
import type { Trip } from '../../trips/types';

const trip = {
  id: 't1',
  title: 'Japan',
  travelers: [{ id: 'existing1', name: 'Alex', avatarColor: 'avatar-1' }],
} as Trip;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('AddTravelerSheet', () => {
  it('shows the travelers already on the trip', () => {
    render(<AddTravelerSheet trip={trip} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('save is disabled until at least one name is added to the list', async () => {
    const user = userEvent.setup();
    render(<AddTravelerSheet trip={trip} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByRole('button', { name: 'Add traveler' })).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), 'Maria');
    await user.click(screen.getByRole('button', { name: '+ Add to list' }));

    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add traveler' })).not.toBeDisabled();
  });

  it('a name can be removed from the pending list before saving', async () => {
    const user = userEvent.setup();
    render(<AddTravelerSheet trip={trip} onClose={() => {}} onSave={() => {}} />);
    await user.type(screen.getByLabelText('Name'), 'Maria');
    await user.click(screen.getByRole('button', { name: '+ Add to list' }));
    await user.click(screen.getByRole('button', { name: 'Remove Maria' }));

    expect(screen.queryByText('Maria')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add traveler' })).toBeDisabled();
  });

  it('saves the existing travelers plus every newly added one, appended, never replacing the existing list', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<AddTravelerSheet trip={trip} onClose={onClose} onSave={onSave} />);

    await user.type(screen.getByLabelText('Name'), 'Maria');
    await user.click(screen.getByRole('button', { name: '+ Add to list' }));
    await user.type(screen.getByLabelText('Name'), 'Sam');
    await user.click(screen.getByRole('button', { name: '+ Add to list' }));
    await user.click(screen.getByRole('button', { name: 'Add 2 travelers' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.travelers.map((t) => t.name)).toEqual(['Alex', 'Maria', 'Sam']);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('does not close until the save actually resolves, and disables the button meanwhile', async () => {
    const user = userEvent.setup();
    const { promise, resolve } = deferred<void>();
    const onSave = vi.fn(() => promise);
    const onClose = vi.fn();
    render(<AddTravelerSheet trip={trip} onClose={onClose} onSave={onSave} />);

    await user.type(screen.getByLabelText('Name'), 'Maria');
    await user.click(screen.getByRole('button', { name: '+ Add to list' }));
    await user.click(screen.getByRole('button', { name: 'Add traveler' }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();

    resolve();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

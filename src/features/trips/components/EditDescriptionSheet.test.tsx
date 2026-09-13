import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditDescriptionSheet } from './EditDescriptionSheet';
import type { Trip } from '../types';

const trip = { id: 't1', title: 'Japan', description: 'Old description' } as Trip;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('EditDescriptionSheet', () => {
  it('does not close until the save actually resolves', async () => {
    const user = userEvent.setup();
    const { promise, resolve } = deferred<void>();
    const onSave = vi.fn(() => promise);
    const onClose = vi.fn();
    render(<EditDescriptionSheet trip={trip} onClose={onClose} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();

    resolve();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('ignores a second click while the first save is still in flight', async () => {
    const user = userEvent.setup();
    const { promise } = deferred<void>();
    const onSave = vi.fn(() => promise);
    render(<EditDescriptionSheet trip={trip} onClose={() => {}} onSave={onSave} />);

    const button = screen.getByRole('button', { name: 'Save' });
    await user.click(button);
    // Button is now disabled + relabeled, so a second click can't reach onSave again.
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

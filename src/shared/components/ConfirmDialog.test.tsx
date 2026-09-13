import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DeleteConfirmSheet } from './ConfirmDialog';

describe('DeleteConfirmSheet', () => {
  it('names the item being deleted', () => {
    render(<DeleteConfirmSheet itemName="Colosseum" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/Colosseum/)).toBeInTheDocument();
  });

  it('has an explicit Cancel action distinct from the destructive one', () => {
    render(<DeleteConfirmSheet itemName="Colosseum" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
  });

  it('calls onCancel, not onConfirm, when Cancel is clicked', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DeleteConfirmSheet itemName="Colosseum" onConfirm={onConfirm} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when the destructive action is clicked', async () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmSheet itemName="Colosseum" onConfirm={onConfirm} onCancel={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

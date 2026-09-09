import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('exposes itself as a switch with the current checked state', () => {
    render(<Switch checked={false} onChange={() => {}} label="Add to itinerary" />);
    const track = screen.getByRole('switch', { name: 'Add to itinerary' });
    expect(track).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the flipped value when tapped', async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Add to itinerary" />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('flips from on to off the same way', async () => {
    const onChange = vi.fn();
    render(<Switch checked={true} onChange={onChange} label="Add to itinerary" />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('shows the optional description text', () => {
    render(<Switch checked={false} onChange={() => {}} label="Add to itinerary" description="Pre-fill day and slot in schedule" />);
    expect(screen.getByText('Pre-fill day and slot in schedule')).toBeInTheDocument();
  });
});

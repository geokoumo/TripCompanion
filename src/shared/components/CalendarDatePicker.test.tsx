import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CalendarDatePicker } from './CalendarDatePicker';

describe('CalendarDatePicker', () => {
  it('labels a day with its full date so a screen reader announces more than a bare number', () => {
    // The component computes "today" from the real clock with no way to
    // inject a fixed one, so a hardcoded fixture date will eventually BE
    // "today" and gain an extra label segment — pick one 10 years out
    // instead of a fixed calendar date, so this can't flake from clock
    // drift the way a fixed "2026-09-15" did once the sandbox's clock
    // actually reached that date.
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 10);
    const iso = farFuture.toISOString().slice(0, 10);
    const [, , day] = iso.split('-').map(Number);
    const monthName = farFuture.toLocaleString('en-US', { month: 'long' });
    render(<CalendarDatePicker value={iso} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: `${monthName} ${day}, ${farFuture.getFullYear()}, selected` })).toBeInTheDocument();
  });

  it('marks today with aria-current="date"', () => {
    const realToday = new Date().toISOString().slice(0, 10);
    const [y, , d] = realToday.split('-').map(Number);
    render(<CalendarDatePicker value={realToday} onChange={() => {}} />);
    const button = screen.getByRole('button', { name: new RegExp(`${d}, ${y}, today`) });
    expect(button).toHaveAttribute('aria-current', 'date');
  });

  it('disables (not just visually dims) a day outside minDate/maxDate, so it cannot be activated by keyboard either', () => {
    render(<CalendarDatePicker value="2026-09-15" minDate="2026-09-10" maxDate="2026-09-20" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'September 5, 2026' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'September 25, 2026' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'September 12, 2026' })).not.toBeDisabled();
  });

  it('disables every cell belonging to an adjacent month', () => {
    render(<CalendarDatePicker value="2026-09-15" onChange={() => {}} />);
    // August 31 shows as a leading outside-month cell for September 2026.
    expect(screen.getByRole('button', { name: 'August 31, 2026' })).toBeDisabled();
  });

  it('calls onChange with the selected date when an enabled day is clicked', async () => {
    const onChange = vi.fn();
    render(<CalendarDatePicker value="2026-09-15" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'September 20, 2026' }));
    expect(onChange).toHaveBeenCalledWith('2026-09-20');
  });

  it('does not call onChange when a disabled (out-of-range) day is clicked', async () => {
    const onChange = vi.fn();
    render(<CalendarDatePicker value="2026-09-15" minDate="2026-09-10" maxDate="2026-09-20" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'September 25, 2026' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

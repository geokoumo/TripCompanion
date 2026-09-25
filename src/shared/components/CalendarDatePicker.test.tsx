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
    // Same clock-drift risk as above (this exact fixture flaked once the
    // sandbox's clock reached its hardcoded "day 25 of the range" — that day
    // became "today" and gained the extra label segment) — anchor to a
    // fixed day-of-month 10 years out instead of a fixed calendar date.
    const future = new Date();
    future.setFullYear(future.getFullYear() + 10);
    future.setDate(15);
    const year = future.getFullYear();
    const monthName = future.toLocaleString('en-US', { month: 'long' });
    const iso = (day: number) => `${year}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    render(<CalendarDatePicker value={iso(15)} minDate={iso(10)} maxDate={iso(20)} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: `${monthName} 5, ${year}` })).toBeDisabled();
    expect(screen.getByRole('button', { name: `${monthName} 25, ${year}` })).toBeDisabled();
    expect(screen.getByRole('button', { name: `${monthName} 12, ${year}` })).not.toBeDisabled();
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
    // Same clock-drift risk as the fixture above — anchor 10 years out.
    const future = new Date();
    future.setFullYear(future.getFullYear() + 10);
    future.setDate(15);
    const year = future.getFullYear();
    const monthName = future.toLocaleString('en-US', { month: 'long' });
    const iso = (day: number) => `${year}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const onChange = vi.fn();
    render(<CalendarDatePicker value={iso(15)} minDate={iso(10)} maxDate={iso(20)} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: `${monthName} 25, ${year}` }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

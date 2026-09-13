import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { WheelTimePicker } from './WheelTimePicker';

describe('WheelTimePicker', () => {
  // jsdom doesn't implement scrollTo — the component uses it to snap the
  // wheel to the selected value on mount/change, which isn't what these
  // tests exercise, so a no-op stub is enough.
  beforeAll(() => {
    Element.prototype.scrollTo = vi.fn();
  });

  it('exposes each hour/minute value as a real, labeled, keyboard-operable option', () => {
    render(<WheelTimePicker value="09:30" onChange={() => {}} />);
    const hourOption = screen.getByRole('option', { name: 'Hour 09' });
    expect(hourOption.tagName).toBe('BUTTON');
    expect(hourOption).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Minute 30' })).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onChange with the new hour when a different hour option is activated', async () => {
    const onChange = vi.fn();
    render(<WheelTimePicker value="09:30" onChange={onChange} />);
    await userEvent.click(screen.getByRole('option', { name: 'Hour 14' }));
    expect(onChange).toHaveBeenCalledWith('14:30');
  });

  it('calls onChange with the new minute when a different minute option is activated', async () => {
    const onChange = vi.fn();
    render(<WheelTimePicker value="09:30" onChange={onChange} />);
    await userEvent.click(screen.getByRole('option', { name: 'Minute 45' }));
    expect(onChange).toHaveBeenCalledWith('09:45');
  });

  it('disables (real disabled attribute, not just styling) a fully-occupied hour', () => {
    const isTimeDisabled = (hour: number) => hour === 10; // every minute of 10:xx is occupied
    render(<WheelTimePicker value="09:30" onChange={() => {}} isTimeDisabled={isTimeDisabled} />);
    expect(screen.getByRole('option', { name: 'Hour 10' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Hour 09' })).not.toBeDisabled();
  });

  it('does not call onChange when a disabled hour is clicked', async () => {
    const onChange = vi.fn();
    const isTimeDisabled = (hour: number) => hour === 10;
    render(<WheelTimePicker value="09:30" onChange={onChange} isTimeDisabled={isTimeDisabled} />);
    await userEvent.click(screen.getByRole('option', { name: 'Hour 10' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('jumps to a preset time when its chip is tapped', async () => {
    const onChange = vi.fn();
    render(<WheelTimePicker value="09:30" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '12:00' }));
    expect(onChange).toHaveBeenCalledWith('12:00');
  });
});

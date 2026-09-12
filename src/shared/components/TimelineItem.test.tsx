import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TimelineItem } from './TimelineItem';

describe('TimelineItem', () => {
  it('renders marker, title, and subtitle', () => {
    render(<TimelineItem marker={<span>19</span>} title="Arrival in Tokyo" subtitle="Haneda Airport" />);
    expect(screen.getByText('19')).toBeInTheDocument();
    expect(screen.getByText('Arrival in Tokyo')).toBeInTheDocument();
    expect(screen.getByText('Haneda Airport')).toBeInTheDocument();
  });

  it('renders as a static row with no button role when onClick is omitted', () => {
    render(<TimelineItem marker="•" title="Static row" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders as a real button and fires onClick when interactive', async () => {
    const onClick = vi.fn();
    render(<TimelineItem marker="•" title="Tap me" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tap me' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

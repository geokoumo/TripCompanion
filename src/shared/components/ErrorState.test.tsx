import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders headline and body', () => {
    render(<ErrorState headline="Broke" body="It broke." />);
    expect(screen.getByText('Broke')).toBeInTheDocument();
    expect(screen.getByText('It broke.')).toBeInTheDocument();
  });

  it('shows no retry button when onRetry is omitted', () => {
    render(<ErrorState headline="Broke" body="It broke." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onRetry when the retry button is tapped, with the default label', async () => {
    const onRetry = vi.fn();
    render(<ErrorState headline="Broke" body="It broke." onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

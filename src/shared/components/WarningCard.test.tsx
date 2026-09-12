import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WarningCard } from './WarningCard';

describe('WarningCard', () => {
  it('renders the title and description', () => {
    render(<WarningCard title="Missing rate" description="Add a rate." />);
    expect(screen.getByText('Missing rate')).toBeInTheDocument();
    expect(screen.getByText('Add a rate.')).toBeInTheDocument();
  });

  it('renders no button when no action is given, never a dead-end fix', () => {
    render(<WarningCard title="X" description="Y" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onAction when the fix button is tapped', async () => {
    const onAction = vi.fn();
    render(<WarningCard title="X" description="Y" actionLabel="Fix it" onAction={onAction} />);
    await userEvent.click(screen.getByRole('button', { name: 'Fix it' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

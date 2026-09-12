import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Trip Health" />);
    expect(screen.getByText('Trip Health')).toBeInTheDocument();
  });

  it('shows no back button when onBack is omitted', () => {
    render(<PageHeader title="Home" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onBack when the back button is tapped, using the given accessible label', async () => {
    const onBack = vi.fn();
    render(<PageHeader title="Trip Health" onBack={onBack} backLabel="Back to Overview" />);
    await userEvent.click(screen.getByRole('button', { name: 'Back to Overview' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders trailing content when given', () => {
    render(<PageHeader title="Home" trailing={<span>Gear</span>} />);
    expect(screen.getByText('Gear')).toBeInTheDocument();
  });
});

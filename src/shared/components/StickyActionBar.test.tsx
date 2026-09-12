import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StickyActionBar } from './StickyActionBar';

describe('StickyActionBar', () => {
  it('renders its children', () => {
    render(
      <StickyActionBar>
        <button type="button">Save</button>
      </StickyActionBar>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('marks itself pinned only when asked, so Modal footers (already pinned by flex layout) do not get position: sticky too', () => {
    const { container, rerender } = render(<StickyActionBar>x</StickyActionBar>);
    expect(container.firstChild).toHaveAttribute('data-pinned', 'false');
    rerender(<StickyActionBar pinned>x</StickyActionBar>);
    expect(container.firstChild).toHaveAttribute('data-pinned', 'true');
  });
});

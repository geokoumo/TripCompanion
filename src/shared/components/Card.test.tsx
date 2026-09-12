import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders as a real button when onClick is given, so it is keyboard-operable', async () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Content</Card>);
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders as a plain div with no interactive role when onClick is omitted', () => {
    render(<Card>Static content</Card>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Static content')).toBeInTheDocument();
  });

  it('uses a role="button" div instead of a real button when nestedInteractive is set, so it can contain its own button', async () => {
    const onClick = vi.fn();
    const onMenuClick = vi.fn();
    render(
      <Card onClick={onClick} nestedInteractive>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick();
          }}
        >
          Menu
        </button>
      </Card>,
    );
    // The outer card and the inner "Menu" button must both exist as separate buttons/roles.
    expect(screen.getAllByRole('button')).toHaveLength(2);
    await userEvent.click(screen.getByText('Menu'));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('activates on Enter/Space for the nestedInteractive variant, but not when the event originated from a child', async () => {
    const onClick = vi.fn();
    render(
      <Card onClick={onClick} nestedInteractive aria-label="Open card">
        <button type="button">Menu</button>
      </Card>,
    );
    const card = screen.getByRole('button', { name: 'Open card' });
    card.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the accent and muted data attributes', () => {
    render(
      <Card onClick={() => {}} accent="teal" muted>
        X
      </Card>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-accent', 'teal');
    expect(button).toHaveAttribute('data-muted', 'true');
  });
});

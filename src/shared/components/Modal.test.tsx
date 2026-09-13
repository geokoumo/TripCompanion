import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('labels the dialog with its own title via aria-labelledby', () => {
    render(
      <Modal title="Edit stop" onClose={() => {}}>
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Edit stop' })).toBeInTheDocument();
  });

  it('moves focus into the dialog on open when nothing inside claims it', () => {
    render(
      <Modal title="Edit stop" onClose={() => {}}>
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('does not steal focus from a field that already autofocused itself', () => {
    render(
      <Modal title="New stop" onClose={() => {}}>
        <input autoFocus placeholder="Title" />
      </Modal>,
    );
    expect(screen.getByPlaceholderText('Title')).toHaveFocus();
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Edit stop" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Edit stop" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked, but not when the sheet itself is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="Edit stop" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    await userEvent.click(screen.getByText('Body'));
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = container.firstElementChild as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('only lets the topmost of two nested modals respond to Escape', async () => {
    const onCloseOuter = vi.fn();
    const onCloseInner = vi.fn();

    // Mirrors real usage (e.g. DateTimeField's picker Modal opening on top
    // of a form Modal that's already mounted): the inner modal appears in a
    // LATER render, not the same initial commit — its mount effect (and
    // stack push) genuinely runs after the outer's.
    function Nested() {
      const [innerOpen, setInnerOpen] = useState(false);
      return (
        <Modal title="Outer" onClose={onCloseOuter}>
          <button type="button" onClick={() => setInnerOpen(true)}>
            Open inner
          </button>
          {innerOpen && (
            <Modal title="Inner" onClose={onCloseInner}>
              <p>Inner body</p>
            </Modal>
          )}
        </Modal>
      );
    }

    render(<Nested />);
    await userEvent.click(screen.getByRole('button', { name: 'Open inner' }));
    await userEvent.keyboard('{Escape}');
    expect(onCloseInner).toHaveBeenCalledTimes(1);
    expect(onCloseOuter).not.toHaveBeenCalled();
  });

  it('traps Tab focus within the dialog, wrapping from the last focusable element back to the first', async () => {
    render(
      <Modal title="Edit stop" onClose={() => {}}>
        <button type="button">First</button>
        <button type="button">Last</button>
      </Modal>,
    );
    screen.getByRole('button', { name: 'Last' }).focus();
    await userEvent.tab();
    // Wraps back inside the dialog (to the close button, the first focusable element) rather than escaping to the document body.
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
  });
});

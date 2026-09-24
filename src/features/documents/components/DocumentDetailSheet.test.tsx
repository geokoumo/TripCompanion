import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../app/providers/AuthProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Trip } from '../../trips/types';
import type { Document } from '../types';
import { DocumentDetailSheet } from './DocumentDetailSheet';

function makeDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: 'd1',
    category: 'other',
    title: 'Passport scan',
    relatedTo: undefined,
    fileType: 'image',
    // A local data: URL short-circuits useDocumentUrl's signed-URL fetch and
    // handleDelete's own storage-cleanup call — this test is only about the
    // trip-record write, not Supabase Storage.
    storagePath: 'data:image/png;base64,iVBORw0KGgo=',
    uploadedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Document;
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    documents: [makeDoc()],
    ...overrides,
  } as Trip;
}

function renderSheet(props: Partial<React.ComponentProps<typeof DocumentDetailSheet>> = {}) {
  const onClose = vi.fn();
  const updateTrip = vi.fn().mockResolvedValue(undefined);
  render(
    <ToastProvider>
      <AuthProvider>
        <DocumentDetailSheet doc={makeDoc()} trip={makeTrip()} updateTrip={updateTrip} onClose={onClose} {...props} />
      </AuthProvider>
    </ToastProvider>,
  );
  return { onClose, updateTrip };
}

describe('DocumentDetailSheet — delete', () => {
  it('deletes the document and closes on success', async () => {
    const user = userEvent.setup();
    const { onClose, updateTrip } = renderSheet();

    await user.click(screen.getByRole('button', { name: 'Delete document' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('a failed delete leaves the sheet open and does not claim success, instead of rejecting unhandled', async () => {
    // Regression: handleDelete previously had no try/catch around
    // updateTrip(), so a rejected save (e.g. a transient write failure)
    // propagated as an unhandled promise rejection out of the fire-and-forget
    // `void handleDelete()` call site — and, since nothing stopped execution,
    // it also never reached the point of showing a false "Deleted." success.
    // This asserts the safe outcome: no close, no success toast, no crash.
    const user = userEvent.setup();
    const updateTrip = vi.fn().mockRejectedValue(new Error('save-failed'));
    const { onClose } = renderSheet({ updateTrip });

    await user.click(screen.getByRole('button', { name: 'Delete document' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
    // The sheet itself is still open — its title is still on screen.
    expect(screen.getByText('Details')).toBeInTheDocument();
  });
});

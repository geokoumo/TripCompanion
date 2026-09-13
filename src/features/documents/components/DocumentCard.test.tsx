import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Document } from '../types';
import { DocumentCard } from './DocumentCard';

function makeDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: 'd1',
    category: 'boarding_pass',
    title: 'Emirates EK210 Boarding Pass',
    relatedTo: 'DXB → HND flight',
    fileType: 'pdf',
    storagePath: 'x',
    uploadedAt: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

describe('DocumentCard', () => {
  it('shows the related-to label, upload date, and file type — all real fields, never a manufactured status', () => {
    render(<DocumentCard doc={makeDoc()} onOpen={vi.fn()} />);
    expect(screen.getByText('DXB → HND flight · 1 Aug 2026 · PDF')).toBeInTheDocument();
  });

  it('falls back gracefully when relatedTo is absent', () => {
    render(<DocumentCard doc={makeDoc({ relatedTo: undefined })} onOpen={vi.fn()} />);
    expect(screen.getByText('1 Aug 2026 · PDF')).toBeInTheDocument();
  });

  it('renders the file type in its established uppercase short form (matches the AddDocumentForm chip labels)', () => {
    render(<DocumentCard doc={makeDoc({ fileType: 'qr', relatedTo: undefined })} onOpen={vi.fn()} />);
    expect(screen.getByText('1 Aug 2026 · QR')).toBeInTheDocument();
  });
});

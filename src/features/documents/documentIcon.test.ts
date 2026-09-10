import { describe, expect, it } from 'vitest';
import { FileIcon, QrIcon } from '../../shared/components/icons';
import type { Document } from './types';
import { documentIconFor } from './lib/documentIcon';

function doc(overrides: Partial<Document> = {}): Document {
  return {
    id: 'd1',
    category: 'other',
    title: 'Doc',
    fileType: 'pdf',
    storagePath: 'path/to/doc.pdf',
    uploadedAt: '2026-09-01',
    ...overrides,
  };
}

describe('documentIconFor', () => {
  it('uses the QR icon for a QR-code document', () => {
    expect(documentIconFor(doc({ fileType: 'qr' }))).toBe(QrIcon);
  });

  it('uses the generic file icon for a PDF', () => {
    expect(documentIconFor(doc({ fileType: 'pdf' }))).toBe(FileIcon);
  });

  it('uses the generic file icon for an image too', () => {
    expect(documentIconFor(doc({ fileType: 'image' }))).toBe(FileIcon);
  });
});

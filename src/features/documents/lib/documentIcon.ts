import { FileIcon, PlaneIcon, QrIcon } from '../../../shared/components/icons';
import type { IconTone } from '../../../shared/components/IconCircle';
import type { DocumentCategoryId } from '../../../config/constants';
import type { Document } from '../types';

export const DOCUMENT_CATEGORY_TONE: Record<DocumentCategoryId, IconTone> = {
  boarding_pass: 'rust',
  hotel_confirmation: 'teal',
  ticket: 'teal',
  insurance: 'brass',
  other: 'gray',
};

export function documentIconFor(doc: Document): typeof PlaneIcon {
  if (doc.fileType === 'qr') return QrIcon;
  return FileIcon;
}

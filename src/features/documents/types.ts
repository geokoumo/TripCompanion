import { z } from 'zod';
import { DOCUMENT_CATEGORIES, DOCUMENT_FILE_TYPES, type DocumentCategoryId, type DocumentFileTypeId } from '../../config/constants';
import { nullableOptional } from '../../shared/lib/zodHelpers';

const categoryIds = DOCUMENT_CATEGORIES.map((c) => c.id) as [DocumentCategoryId, ...DocumentCategoryId[]];
const fileTypeIds = [...DOCUMENT_FILE_TYPES] as [DocumentFileTypeId, ...DocumentFileTypeId[]];

export const DocumentSchema = z.object({
  id: z.string(),
  category: z.enum(categoryIds),
  title: z.string().min(1, 'Title is required'),
  // Free text describing what this is attached to (e.g. "ATH → NRT flight") —
  // not a foreign key, since the source can be a flight, a stay, or any
  // booking-item type. Set automatically when uploaded from that record's
  // own Attachments section.
  relatedTo: nullableOptional(z.string()),
  fileType: z.enum(fileTypeIds),
  storagePath: z.string().min(1),
  uploadedAt: z.string(),
});

export type Document = z.infer<typeof DocumentSchema>;

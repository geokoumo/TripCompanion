import { z } from 'zod';
import { DOCUMENT_CATEGORIES, DOCUMENT_FILE_TYPES, type DocumentCategoryId, type DocumentFileTypeId } from '../../config/constants';
import { nullableOptional } from '../../shared/lib/zodHelpers';

const categoryIds = DOCUMENT_CATEGORIES.map((c) => c.id) as [DocumentCategoryId, ...DocumentCategoryId[]];
const fileTypeIds = [...DOCUMENT_FILE_TYPES] as [DocumentFileTypeId, ...DocumentFileTypeId[]];

const documentSourceTypes = ['flight', 'stay', 'booking'] as const;
export type DocumentSourceType = (typeof documentSourceTypes)[number];

export const DocumentSchema = z.object({
  id: z.string(),
  category: z.enum(categoryIds),
  title: z.string().min(1, 'Title is required'),
  // Free text describing what this is attached to (e.g. "ATH → NRT flight")
  // — kept for display (DocumentCard's meta line, "Related to" in
  // DocumentDetailSheet) and for AddDocumentForm's manual free-text entry,
  // which has no source entity to derive an id from. Set automatically when
  // uploaded from a record's own Attachments section.
  relatedTo: nullableOptional(z.string()),
  // F-11: the stable identity a document is actually attached to, set
  // alongside relatedTo whenever uploaded from a specific flight/stay/
  // booking-item's own form. Optional and absent on any document that
  // predates this field (or was added via AddDocumentForm's free-text
  // entry, which has no single source record) — those keep matching by
  // relatedTo alone, exactly as before. See lib/relatedTo.ts's
  // documentBelongsToSource, the one place both matching strategies live.
  sourceType: nullableOptional(z.enum(documentSourceTypes)),
  sourceId: nullableOptional(z.string()),
  fileType: z.enum(fileTypeIds),
  storagePath: z.string().min(1),
  uploadedAt: z.string(),
});

export type Document = z.infer<typeof DocumentSchema>;

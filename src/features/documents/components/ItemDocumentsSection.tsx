import type { Trip } from '../../trips/types';
import type { Document } from '../types';
import { DocumentCard } from './DocumentCard';
import styles from './ItemDocumentsSection.module.css';

interface ItemDocumentsSectionProps {
  trip: Trip;
  /** The exact relatedTo label this record's own AttachmentsField uses — see documents/lib/relatedTo.ts. */
  relatedTo: string;
  onOpenDocument: (doc: Document) => void;
}

/**
 * The "Documents" section of an item's View Details sheet — reuses the
 * same documents.relatedTo label match the record's own AttachmentsField
 * (edit form) already uses, so a View shows exactly what its Edit form
 * would. Never fabricates a document; a record with none gets a single
 * compact line, not a full empty-state panel.
 */
export function ItemDocumentsSection({ trip, relatedTo, onOpenDocument }: ItemDocumentsSectionProps) {
  const docs = trip.documents.filter((d) => d.relatedTo === relatedTo);

  return (
    <div className={styles.section}>
      <div className={styles.header}>Documents</div>
      {docs.length === 0 ? (
        <div className={styles.empty}>No documents attached</div>
      ) : (
        docs.map((doc) => <DocumentCard key={doc.id} doc={doc} onOpen={onOpenDocument} />)
      )}
    </div>
  );
}

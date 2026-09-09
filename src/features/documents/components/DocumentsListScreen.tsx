import { useState } from 'react';
import { DOCUMENT_CATEGORIES } from '../../../config/constants';
import { Fab } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import type { Trip } from '../../trips/types';
import { AddDocumentForm } from './AddDocumentForm';
import { DocumentCard } from './DocumentCard';
import { DocumentDetailSheet } from './DocumentDetailSheet';
import styles from './DocumentCard.module.css';

interface DocumentsListScreenProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

export function DocumentsListScreen({ trip, updateTrip }: DocumentsListScreenProps) {
  const [adding, setAdding] = useState(false);
  // An id, not a snapshot of the Document itself — so a Replace (which
  // changes storagePath while the sheet stays open) is picked up right
  // away instead of the sheet going on pointing at a file that was just
  // deleted from storage.
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = viewingId ? (trip.documents.find((d) => d.id === viewingId) ?? null) : null;

  const groups = DOCUMENT_CATEGORIES.map((cat) => ({
    ...cat,
    docs: trip.documents.filter((d) => d.category === cat.id),
  })).filter((g) => g.docs.length > 0);

  return (
    <div style={{ paddingTop: 8 }}>
      {trip.documents.length === 0 && (
        <EmptyState headline="No documents yet" body="Add tickets, boarding passes, reservations, and other travel documents to keep everything in one place." />
      )}

      {groups.map((group) => (
        <div key={group.id}>
          <div className={styles.sectionHeader}>{group.label}</div>
          {group.docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onOpen={() => setViewingId(doc.id)} />
          ))}
        </div>
      ))}

      <Fab onClick={() => setAdding(true)} aria-label="Add document" />

      {adding && <AddDocumentForm trip={trip} updateTrip={updateTrip} onClose={() => setAdding(false)} onSaved={() => setAdding(false)} />}
      {viewing && <DocumentDetailSheet doc={viewing} trip={trip} updateTrip={updateTrip} onClose={() => setViewingId(null)} />}
    </div>
  );
}

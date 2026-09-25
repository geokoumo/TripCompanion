import { useRef, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { FileIcon } from '../../../shared/components/icons';
import { generateId } from '../../../shared/lib/id';
import { readAsDataUrl, uploadTripFile, validateTripFile } from '../../../data/storage/tripFilesBucket';
import type { DocumentCategoryId } from '../../../config/constants';
import type { Trip } from '../../trips/types';
import { deleteDocumentWithUndo } from '../lib/deleteDocumentWithUndo';
import { documentBelongsToSource } from '../lib/relatedTo';
import type { Document, DocumentSourceType } from '../types';
import styles from './AttachmentsField.module.css';

interface AttachmentsFieldProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
  /** Free-text label tying an uploaded document back to the record it was uploaded from — see documents/types.ts. */
  relatedTo: string;
  /** The record's own type + id (F-11) — stamped onto every newly-uploaded document alongside relatedTo, so matching stays correct even if the record is later renamed or its label collides with another. */
  sourceType: DocumentSourceType;
  sourceId: string;
  defaultCategory: DocumentCategoryId;
}

function inferFileType(file: File): 'pdf' | 'image' {
  return file.type === 'application/pdf' ? 'pdf' : 'image';
}

/** Optional attachments section reused by the Flight/Stay/booking-item forms — uploads straight into the shared documents table, tagged with `relatedTo` and (F-11) a stable sourceType/sourceId. */
export function AttachmentsField({ trip, updateTrip, relatedTo, sourceType, sourceId, defaultCategory }: AttachmentsFieldProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const attached = trip.documents.filter((d) => documentBelongsToSource(d, sourceType, sourceId, relatedTo));

  const handleFile = async (file: File) => {
    const validationError = validateTripFile(file);
    if (validationError) {
      showToast(validationError, { variant: 'error' });
      return;
    }
    setUploading(true);
    try {
      const storagePath = user ? await uploadTripFile(user.id, trip.id, file) : await readAsDataUrl(file);
      const doc: Document = {
        id: generateId(),
        category: defaultCategory,
        title: file.name,
        relatedTo,
        sourceType,
        sourceId,
        fileType: inferFileType(file),
        storagePath,
        uploadedAt: new Date().toISOString(),
      };
      await updateTrip((t) => ({ ...t, documents: [...t.documents, doc] }));
      showToast('Attachment added.');
    } catch {
      showToast('Upload failed. Tap to retry.', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const remove = (doc: Document) => void deleteDocumentWithUndo(doc, updateTrip, showToast);

  return (
    <div>
      <div className={styles.label}>Attachments</div>
      {attached.map((doc) => (
        <div key={doc.id} className={styles.row}>
          <FileIcon size={18} />
          <span className={styles.name}>{doc.title}</span>
          <button type="button" className={styles.remove} onClick={() => void remove(doc)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className={styles.dropzone} disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? 'Uploading…' : '+ Add ticket, boarding pass, or QR code'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

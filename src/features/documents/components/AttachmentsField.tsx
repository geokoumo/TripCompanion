import { useRef, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { FileIcon } from '../../../shared/components/icons';
import { generateId } from '../../../shared/lib/id';
import { deleteTripFile, isLocalDataUrl, readAsDataUrl, uploadTripFile } from '../../../data/storage/tripFilesBucket';
import type { DocumentCategoryId } from '../../../config/constants';
import type { Trip } from '../../trips/types';
import type { Document } from '../types';
import styles from './AttachmentsField.module.css';

interface AttachmentsFieldProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
  /** Free-text label tying an uploaded document back to the record it was uploaded from — see documents/types.ts. */
  relatedTo: string;
  defaultCategory: DocumentCategoryId;
}

function inferFileType(file: File): 'pdf' | 'image' {
  return file.type === 'application/pdf' ? 'pdf' : 'image';
}

/** Optional attachments section reused by the Flight/Stay/booking-item forms — uploads straight into the shared documents table, tagged with `relatedTo`. */
export function AttachmentsField({ trip, updateTrip, relatedTo, defaultCategory }: AttachmentsFieldProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const attached = trip.documents.filter((d) => d.relatedTo === relatedTo);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const storagePath = user ? await uploadTripFile(user.id, trip.id, file) : await readAsDataUrl(file);
      const doc: Document = {
        id: generateId(),
        category: defaultCategory,
        title: file.name,
        relatedTo,
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

  const remove = async (doc: Document) => {
    await updateTrip((t) => ({ ...t, documents: t.documents.filter((d) => d.id !== doc.id) }));
    if (!isLocalDataUrl(doc.storagePath)) void deleteTripFile(doc.storagePath);
  };

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

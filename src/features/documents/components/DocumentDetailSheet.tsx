import { useRef, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { DOCUMENT_CATEGORIES } from '../../../config/constants';
import { DownloadIcon, FileIcon, QrIcon, ShareExternalIcon } from '../../../shared/components/icons';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';
import { deleteTripFile, isLocalDataUrl, readAsDataUrl, uploadTripFile } from '../../../data/storage/tripFilesBucket';
import type { Trip } from '../../trips/types';
import { useDocumentUrl } from '../lib/useDocumentUrl';
import type { Document } from '../types';
import styles from './DocumentDetailSheet.module.css';

interface DocumentDetailSheetProps {
  doc: Document;
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
  onClose: () => void;
}

export function DocumentDetailSheet({ doc, trip, updateTrip, onClose }: DocumentDetailSheetProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { url, loading } = useDocumentUrl(doc.storagePath);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const category = DOCUMENT_CATEGORIES.find((c) => c.id === doc.category);

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.title;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleShare = async () => {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: doc.title, url });
      } catch {
        // user cancelled the native share sheet — nothing to surface
      }
    } else {
      showToast('Sharing is not supported on this device.', { variant: 'warn' });
    }
  };

  const handleReplace = async (file: File) => {
    setReplacing(true);
    try {
      const newPath = user ? await uploadTripFile(user.id, trip.id, file) : await readAsDataUrl(file);
      const oldPath = doc.storagePath;
      await updateTrip((t) => ({
        ...t,
        documents: t.documents.map((d) => (d.id === doc.id ? { ...d, storagePath: newPath, uploadedAt: new Date().toISOString() } : d)),
      }));
      if (!isLocalDataUrl(oldPath)) void deleteTripFile(oldPath);
      showToast('Document replaced.');
    } catch {
      showToast('Upload failed. Tap to retry.', { variant: 'error' });
    } finally {
      setReplacing(false);
    }
  };

  const handleDelete = async () => {
    await updateTrip((t) => ({ ...t, documents: t.documents.filter((d) => d.id !== doc.id) }));
    if (!isLocalDataUrl(doc.storagePath)) void deleteTripFile(doc.storagePath);
    showToast('Deleted.');
    onClose();
  };

  return (
    <Modal title="Details" onClose={onClose}>
      <div className={styles.preview}>
        {loading && <FileIcon size={40} />}
        {!loading && url && doc.fileType !== 'pdf' && <img className={styles.previewImage} src={url} alt={doc.title} />}
        {!loading && (doc.fileType === 'pdf' || !url) && <FileIcon size={40} />}
      </div>

      <div className={styles.actions}>
        {doc.fileType === 'qr' && (
          <button type="button" className={styles.actionButton} onClick={() => setShowQr(true)}>
            <QrIcon size={20} />
            View QR
          </button>
        )}
        <button type="button" className={styles.actionButton} onClick={handleDownload} disabled={!url}>
          <DownloadIcon size={20} />
          Download
        </button>
        <button type="button" className={styles.actionButton} onClick={() => void handleShare()} disabled={!url}>
          <ShareExternalIcon size={20} />
          Share
        </button>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>Type</span>
        <span>{category?.singular ?? doc.category}</span>
      </div>
      {doc.relatedTo && (
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Related to</span>
          <span>{doc.relatedTo}</span>
        </div>
      )}
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>Uploaded</span>
        <span>{formatDateShort(doc.uploadedAt.slice(0, 10))}</span>
      </div>

      <div className={styles.destructiveRow}>
        <button type="button" className={styles.replaceLink} disabled={replacing} onClick={() => replaceInputRef.current?.click()}>
          {replacing ? 'Replacing…' : 'Replace document'}
        </button>
        <button type="button" className={styles.deleteLink} onClick={() => setConfirmDelete(true)}>
          Delete document
        </button>
      </div>
      <input
        ref={replaceInputRef}
        type="file"
        accept="application/pdf,image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleReplace(file);
          e.target.value = '';
        }}
      />

      {showQr && url && (
        <Modal title="QR code" onClose={() => setShowQr(false)}>
          <div className={styles.preview}>
            <img className={styles.previewImage} src={url} alt={`${doc.title} QR code`} />
          </div>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>Scan this code at the gate</p>
        </Modal>
      )}

      {confirmDelete && <DeleteConfirmSheet itemName={doc.title} onCancel={() => setConfirmDelete(false)} onConfirm={() => void handleDelete()} />}
    </Modal>
  );
}

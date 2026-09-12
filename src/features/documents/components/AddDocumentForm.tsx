import { useRef, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { DOCUMENT_CATEGORIES, DOCUMENT_FILE_TYPES, type DocumentCategoryId, type DocumentFileTypeId } from '../../../config/constants';
import { Button } from '../../../shared/components/Button';
import { ChipSelect } from '../../../shared/components/ChipSelect';
import { FieldWrapper, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { generateId } from '../../../shared/lib/id';
import { readAsDataUrl, uploadTripFile } from '../../../data/storage/tripFilesBucket';
import { addDocument } from '../../../data/repository/documentRepository';
import type { Trip } from '../../trips/types';
import type { Document } from '../types';

interface AddDocumentFormProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
  onClose: () => void;
  onSaved: () => void;
}

function inferFileType(file: File): DocumentFileTypeId {
  return file.type === 'application/pdf' ? 'pdf' : 'image';
}

export function AddDocumentForm({ trip, updateTrip, onClose, onSaved }: AddDocumentFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategoryId>('other');
  const [relatedTo, setRelatedTo] = useState('');
  const [fileType, setFileType] = useState<DocumentFileTypeId>('pdf');
  const [saving, setSaving] = useState(false);

  const handlePickFile = (picked: File) => {
    setFile(picked);
    setFileType(inferFileType(picked));
    if (!title) setTitle(picked.name.replace(/\.[^.]+$/, ''));
  };

  const canSave = file !== null && title.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const storagePath = user ? await uploadTripFile(user.id, trip.id, file) : await readAsDataUrl(file);
      const doc: Document = {
        id: generateId(),
        category,
        title: title.trim(),
        relatedTo: relatedTo.trim() || undefined,
        fileType,
        storagePath,
        uploadedAt: new Date().toISOString(),
      };
      await updateTrip((t) => addDocument(t, doc));
      showToast('Document added.');
      onSaved();
    } catch {
      showToast('Upload failed. Tap to retry.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add document"
      onClose={onClose}
      footer={
        <Button variant="primary" disabled={!canSave} onClick={() => void handleSave()}>
          Save
        </Button>
      }
    >
      <FieldWrapper label="File">
        <Button variant="secondary" style={{ width: '100%' }} onClick={() => inputRef.current?.click()}>
          {file ? file.name : 'Choose a file'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          hidden
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) handlePickFile(picked);
          }}
        />
      </FieldWrapper>

      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Emirates EK210" />

      <FieldWrapper label="Category">
        <ChipSelect options={DOCUMENT_CATEGORIES.map((c) => ({ id: c.id, label: c.singular }))} value={category} onChange={(id) => setCategory(id)} />
      </FieldWrapper>

      <FieldWrapper label="File type">
        <ChipSelect options={DOCUMENT_FILE_TYPES.map((f) => ({ id: f, label: f.toUpperCase() }))} value={fileType} onChange={(id) => setFileType(id)} />
      </FieldWrapper>

      <TextField
        label="Related to (optional)"
        value={relatedTo}
        onChange={(e) => setRelatedTo(e.target.value)}
        placeholder="e.g. ATH → NRT flight"
      />
    </Modal>
  );
}

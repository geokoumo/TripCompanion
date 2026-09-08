import { IconCircle } from '../../../shared/components/IconCircle';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { documentIconFor, DOCUMENT_CATEGORY_TONE } from '../lib/documentIcon';
import type { Document } from '../types';
import styles from './DocumentCard.module.css';

interface DocumentCardProps {
  doc: Document;
  onOpen: (doc: Document) => void;
}

export function DocumentCard({ doc, onOpen }: DocumentCardProps) {
  const Icon = documentIconFor(doc);
  const meta = [doc.relatedTo, formatDateShort(doc.uploadedAt.slice(0, 10))].filter(Boolean).join(' · ');

  return (
    <button type="button" className={styles.card} onClick={() => onOpen(doc)}>
      <IconCircle tone={DOCUMENT_CATEGORY_TONE[doc.category as keyof typeof DOCUMENT_CATEGORY_TONE]} size={40}>
        <Icon size={20} />
      </IconCircle>
      <div className={styles.main}>
        <div className={styles.title}>{doc.title}</div>
        {meta && <div className={styles.meta}>{meta}</div>}
      </div>
    </button>
  );
}

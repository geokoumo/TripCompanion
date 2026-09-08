import { IconCircle } from '../../../shared/components/IconCircle';
import { TicketIcon } from '../../../shared/components/icons';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { BOOKING_TYPE_ICON } from '../lib/bookingGridConfig';
import type { BookingItem } from '../types';
import styles from './BookingItemCard.module.css';

interface BookingItemCardProps {
  item: BookingItem;
  hasAttachment: boolean;
  onOpen: (item: BookingItem) => void;
}

function metaLine(item: BookingItem): string {
  const parts: string[] = [];
  if (item.location) parts.push(item.location);
  if (item.date) {
    const time = item.startTime ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}` : undefined;
    parts.push(time ? `${formatDateShort(item.date)} · ${time}` : formatDateShort(item.date));
  }
  if (item.partySize) parts.push(`${item.partySize} guest${item.partySize === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

export function BookingItemCard({ item, hasAttachment, onOpen }: BookingItemCardProps) {
  const { Icon, tone } = BOOKING_TYPE_ICON[item.type as keyof typeof BOOKING_TYPE_ICON];
  const meta = metaLine(item);

  return (
    <button type="button" className={styles.card} onClick={() => onOpen(item)}>
      <div className={styles.main}>
        <div className={styles.name}>{item.name}</div>
        {meta && <div className={styles.meta}>{meta}</div>}
        {item.bookingReference && <div className={styles.meta}>Ref: {item.bookingReference}</div>}
        {hasAttachment && (
          <div className={styles.badge}>
            <TicketIcon size={14} />
            Ticket attached
          </div>
        )}
      </div>
      <IconCircle tone={tone} size={36}>
        <Icon size={18} />
      </IconCircle>
    </button>
  );
}

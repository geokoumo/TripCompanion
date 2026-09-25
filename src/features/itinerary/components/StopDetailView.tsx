import { ITINERARY_STOP_TYPES } from '../../../config/constants';
import { Button } from '../../../shared/components/Button';
import { DetailBlock, DetailLinkRow, DetailRow, DetailSection } from '../../../shared/components/DetailView';
import { Modal } from '../../../shared/components/Modal';
import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import type { Traveler } from '../../travelers/types';
import { stopTravelerLabel } from '../lib/travelerLabel';
import type { ItineraryStop } from '../types';

interface StopDetailViewProps {
  stop: ItineraryStop;
  travelers: Traveler[];
  onClose: () => void;
  onEdit: () => void;
}

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Read-only "View Details" for an itinerary stop (Sight/Activity) — opened
 * from a tap on StopCard instead of jumping straight into StopForm.
 *
 * No Documents section here: unlike Flight/Stay/Booking items, StopForm
 * has no AttachmentsField, so there is no existing mechanism (not even the
 * loose documents.relatedTo label match the others use) tying a document
 * to a specific itinerary stop. Matching on stop.title would invent that
 * relationship rather than reuse one, and could wrongly surface a document
 * meant for an unrelated flight/stay/booking that happens to share the
 * same name — so this is intentionally omitted rather than fabricated.
 */
export function StopDetailView({ stop, travelers, onClose, onEdit }: StopDetailViewProps) {
  const type = ITINERARY_STOP_TYPES.find((t) => t.id === stop.type);
  const travelerLabel = stopTravelerLabel(stop, travelers, 'Everyone');

  return (
    <Modal
      title={stop.title}
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      }
    >
      <DetailSection>
        <DetailRow label="Type" value={type?.label ?? stop.type} />
        <DetailRow label="Date" value={formatDateNoYear(stop.date)} />
        {stop.allDay ? <DetailRow label="Time" value="All day" /> : stop.time && <DetailRow label="Time" value={stop.time} />}
        {!stop.allDay && stop.durationMinutes != null && <DetailRow label="Duration" value={durationLabel(stop.durationMinutes)} />}
        {stop.location && <DetailRow label="Location" value={stop.location} />}
        <DetailRow label="Travelers" value={travelerLabel} />
        {stop.link && <DetailLinkRow label="Link" href={stop.link} />}
      </DetailSection>

      {stop.note && <DetailBlock label="Note" value={stop.note} />}
    </Modal>
  );
}

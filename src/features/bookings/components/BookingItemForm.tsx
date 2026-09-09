import { useState } from 'react';
import { BOOKING_ITEM_TYPES, type BookingItemTypeId, type DocumentCategoryId } from '../../../config/constants';
import { Button } from '../../../shared/components/Button';
import { DateField } from '../../../shared/components/DateField';
import { TimeField } from '../../../shared/components/TimeField';
import { FieldRow, FieldWrapper, TextAreaField, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { Switch } from '../../../shared/components/Switch';
import { generateId } from '../../../shared/lib/id';
import { getTripDateRange } from '../../trips/lib/dateRange';
import type { Trip } from '../../trips/types';
import { AttachmentsField } from '../../documents/components/AttachmentsField';
import { PRICE_RANGES, type BookingItem, type PriceRange } from '../types';
import styles from './BookingItemForm.module.css';

interface BookingItemFormProps {
  type: BookingItemTypeId;
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
  initial?: BookingItem;
  addToItineraryDefault?: boolean;
  onClose: () => void;
  onSave: (item: BookingItem, addToItinerary: boolean) => void;
  onDelete?: () => void;
}

const emptyItem = (type: BookingItemTypeId): BookingItem => ({
  id: generateId(),
  type,
  name: '',
  details: {},
});

const NAME_LABEL: Partial<Record<BookingItemTypeId, string>> = {
  restaurant: 'Restaurant name',
  transport: 'Provider',
};

const ATTACHMENT_CATEGORY: Record<BookingItemTypeId, DocumentCategoryId> = {
  sight: 'ticket',
  restaurant: 'other',
  bar: 'other',
  transport: 'ticket',
  ticket: 'ticket',
  activity: 'ticket',
  other: 'other',
};

const NAME_PLACEHOLDER: Partial<Record<BookingItemTypeId, string>> = {
  sight: 'e.g. Sensō-ji Temple',
  restaurant: 'e.g. Sushi Dai',
  bar: 'e.g. Golden Gai District',
  transport: 'e.g. Shinkansen Nozomi 23',
  ticket: 'e.g. Tokyo Skytree Admission',
  activity: 'e.g. Cooking class',
  other: undefined,
};

export function BookingItemForm({ type, trip, updateTrip, initial, addToItineraryDefault = false, onClose, onSave, onDelete }: BookingItemFormProps) {
  const [item, setItem] = useState<BookingItem>(initial ?? emptyItem(type));
  const [addToItinerary, setAddToItinerary] = useState(addToItineraryDefault);
  const range = getTripDateRange(trip.legs, trip.flights);
  const config = BOOKING_ITEM_TYPES.find((t) => t.id === type)!;

  const update = <K extends keyof BookingItem>(key: K, value: BookingItem[K]) => setItem((prev) => ({ ...prev, [key]: value }));
  const updateDetails = <K extends keyof BookingItem['details']>(key: K, value: BookingItem['details'][K]) =>
    setItem((prev) => ({ ...prev, details: { ...prev.details, [key]: value } }));

  const timeOrderValid = !item.startTime || !item.endTime || item.endTime >= item.startTime;
  const canSave = item.name.trim().length > 0 && timeOrderValid;

  return (
    <Modal
      title={initial ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button variant="primary" disabled={!canSave} onClick={() => onSave(item, addToItinerary)}>
            Save
          </Button>
        </>
      }
    >
      <TextField
        label={NAME_LABEL[type] ?? 'Name'}
        autoFocus
        value={item.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder={NAME_PLACEHOLDER[type]}
      />

      {type === 'transport' ? (
        <FieldRow>
          <TextField label="From" value={item.details.fromLocation ?? ''} onChange={(e) => updateDetails('fromLocation', e.target.value)} />
          <TextField label="To" value={item.details.toLocation ?? ''} onChange={(e) => updateDetails('toLocation', e.target.value)} />
        </FieldRow>
      ) : (
        <TextField label="Location" value={item.location ?? ''} onChange={(e) => update('location', e.target.value)} placeholder="Neighborhood, city" />
      )}

      {type !== 'transport' && (
        <TextField label="Address" value={item.address ?? ''} onChange={(e) => update('address', e.target.value)} />
      )}

      {(type === 'sight' || type === 'ticket' || type === 'activity' || type === 'other') && (
        <TextField label="Category" value={item.details.category ?? ''} onChange={(e) => updateDetails('category', e.target.value)} placeholder="e.g. Temple, Museum" />
      )}

      {type === 'restaurant' && (
        <TextField label="Cuisine type" value={item.details.cuisineType ?? ''} onChange={(e) => updateDetails('cuisineType', e.target.value)} />
      )}

      {(type === 'restaurant' || type === 'bar') && (
        <FieldWrapper label="Price range">
          <div className={styles.priceRangeRow}>
            {PRICE_RANGES.map((p) => (
              <button
                key={p}
                type="button"
                className={styles.priceRangeChip}
                data-active={item.details.priceRange === p}
                onClick={() => updateDetails('priceRange', item.details.priceRange === p ? undefined : (p as PriceRange))}
              >
                {p}
              </button>
            ))}
          </div>
        </FieldWrapper>
      )}

      <FieldRow>
        <DateField label="Date" date={item.date ?? ''} onChange={(d) => update('date', d)} minDate={range?.startDate} maxDate={range?.endDate} />
      </FieldRow>
      <FieldRow>
        <TimeField label="Start time" time={item.startTime ?? ''} onChange={(t) => update('startTime', t)} />
        <TimeField label="End time" time={item.endTime ?? ''} onChange={(t) => update('endTime', t)} />
      </FieldRow>
      {!timeOrderValid && <p className={styles.conflictNote}>End time must be after start time.</p>}

      {type === 'transport' && (
        <FieldRow>
          <TextField label="Car" value={item.details.car ?? ''} onChange={(e) => updateDetails('car', e.target.value)} />
          <TextField label="Seat" value={item.details.seat ?? ''} onChange={(e) => updateDetails('seat', e.target.value)} />
          <TextField label="Platform" value={item.details.platform ?? ''} onChange={(e) => updateDetails('platform', e.target.value)} />
        </FieldRow>
      )}

      {(type === 'restaurant' || type === 'bar') && (
        <FieldWrapper label="Number of guests">
          <div className={styles.stepperRow}>
            <button
              type="button"
              className={styles.stepperButton}
              onClick={() => update('partySize', Math.max((item.partySize ?? 1) - 1, 1))}
              aria-label="Fewer guests"
            >
              −
            </button>
            <span className={styles.stepperValue}>{item.partySize ?? 1}</span>
            <button
              type="button"
              className={styles.stepperButton}
              onClick={() => update('partySize', (item.partySize ?? 1) + 1)}
              aria-label="More guests"
            >
              +
            </button>
          </div>
        </FieldWrapper>
      )}

      <FieldRow>
        <TextField label="Price" type="number" min={0} step="0.01" placeholder="0" value={item.price ?? ''} onChange={(e) => update('price', e.target.value ? Number(e.target.value) : undefined)} />
        <TextField
          label="Currency"
          value={item.currency ?? trip.homeCurrency}
          onChange={(e) => update('currency', e.target.value.toUpperCase())}
        />
      </FieldRow>

      <TextField label="Booking reference" value={item.bookingReference ?? ''} onChange={(e) => update('bookingReference', e.target.value)} />
      <TextAreaField label="Notes" value={item.notes ?? ''} onChange={(e) => update('notes', e.target.value)} />

      <div className={styles.itineraryRow}>
        <Switch
          checked={addToItinerary}
          onChange={setAddToItinerary}
          label="Add to itinerary"
          description="Pre-fill day and slot in schedule"
        />
      </div>

      <div className={styles.attachmentsSection}>
        <AttachmentsField trip={trip} updateTrip={updateTrip} relatedTo={item.name || config.singular} defaultCategory={ATTACHMENT_CATEGORY[type]} />
      </div>
    </Modal>
  );
}

import { useState } from 'react';
import { FLIGHT_STATUSES } from '../../../config/constants';
import { useToast } from '../../../app/providers/ToastProvider';
import { Button } from '../../../shared/components/Button';
import { DateTimeField } from '../../../shared/components/DateTimeField';
import { FieldRow, MoreToggle, TextField } from '../../../shared/components/Field';
import fieldStyles from '../../../shared/components/Field.module.css';
import { Modal } from '../../../shared/components/Modal';
import { StampToggle } from '../../../shared/components/StampToggle';
import { generateId } from '../../../shared/lib/id';
import { checkFlightTimeOrder } from '../lib/flightTime';
import { lookupAirportTimezone, MANUAL_TIMEZONE_OPTIONS, rememberAirportTimezone, resolveTimezone, timezoneDisplayLabel } from '../lib/timezones';
import type { FlightStatusId } from '../../../config/constants';
import type { Flight } from '../types';

interface FlightFormProps {
  initial?: Flight;
  onClose: () => void;
  onSave: (flight: Flight) => void;
  onDelete?: () => void;
}

const emptyFlight = (): Flight => ({
  id: generateId(),
  airline: '',
  flightNumber: '',
  depAirport: '',
  depDate: '',
  depTime: '',
  arrAirport: '',
  arrDate: '',
  arrTime: '',
  status: 'scheduled',
});

export function FlightForm({ initial, onClose, onSave, onDelete }: FlightFormProps) {
  const { showToast } = useToast();
  const [flight, setFlight] = useState<Flight>(initial ?? emptyFlight());
  const [showMore, setShowMore] = useState(Boolean(initial?.terminal || initial?.gate || initial?.bookingRef || initial?.link));

  const update = <K extends keyof Flight>(key: K, value: Flight[K]) => setFlight((prev) => ({ ...prev, [key]: value }));

  const depTzKnown = Boolean(lookupAirportTimezone(flight.depAirport || ''));
  const arrTzKnown = Boolean(lookupAirportTimezone(flight.arrAirport || ''));
  const depTz = resolveTimezone(flight.depAirport || '', flight.depTimezoneOverride);
  const arrTz = resolveTimezone(flight.arrAirport || '', flight.arrTimezoneOverride);
  const hasUnknownAirport = Boolean(flight.depAirport && !depTzKnown) || Boolean(flight.arrAirport && !arrTzKnown);

  const timeCheck = flight.depDate && flight.depTime && flight.arrDate && flight.arrTime ? checkFlightTimeOrder(flight) : null;

  const handleSave = () => {
    if (!flight.flightNumber.trim() || !flight.depAirport.trim() || !flight.arrAirport.trim()) {
      showToast('Λείπουν στοιχεία πτήσης — αριθμός, αναχώρηση, άφιξη.', { variant: 'error' });
      return;
    }
    if (!flight.depDate || !flight.depTime || !flight.arrDate || !flight.arrTime) {
      showToast('Λείπουν στοιχεία πτήσης — αριθμός, αναχώρηση, άφιξη.', { variant: 'error' });
      return;
    }
    if (timeCheck && !timeCheck.unresolvedTimezone && !timeCheck.isValid) {
      showToast('Η άφιξη πρέπει να είναι μετά την αναχώρηση (με βάση τις ζώνες ώρας).', { variant: 'error' });
      return;
    }
    if (flight.depTimezoneOverride) rememberAirportTimezone(flight.depAirport, flight.depTimezoneOverride);
    if (flight.arrTimezoneOverride) rememberAirportTimezone(flight.arrAirport, flight.arrTimezoneOverride);
    onSave(flight);
  };

  return (
    <Modal
      title={initial ? 'Επεξεργασία πτήσης' : 'Νέα πτήση'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Διαγραφή
            </Button>
          )}
          <Button variant="primary" onClick={handleSave}>
            Αποθήκευση
          </Button>
        </>
      }
    >
      {hasUnknownAirport && (
        <div
          style={{
            background: 'var(--color-brass-soft)',
            color: 'var(--color-brass)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontSize: 'var(--fs-meta)',
            marginBottom: 16,
          }}
        >
          Ένα αεροδρόμιο δεν είναι στον πίνακα. Διάλεξε ζώνη ώρας χειροκίνητα — θα αποθηκευτεί για την επόμενη φορά.
        </div>
      )}

      <TextField
        label="Αριθμός πτήσης"
        autoFocus
        value={flight.flightNumber}
        onChange={(e) => update('flightNumber', e.target.value)}
        placeholder="EK 106"
      />
      <TextField label="Αεροπορική" value={flight.airline} onChange={(e) => update('airline', e.target.value)} placeholder="Emirates" />

      <TextField
        label="Αναχώρηση (κωδικός)"
        value={flight.depAirport}
        onChange={(e) => update('depAirport', e.target.value.toUpperCase())}
        placeholder="ATH"
      />
      <DateTimeField
        label="Ώρα αναχώρησης"
        date={flight.depDate}
        time={flight.depTime}
        onDateChange={(d) => update('depDate', d)}
        onTimeChange={(t) => update('depTime', t)}
        caption={depTz ? timezoneDisplayLabel(depTz) : undefined}
      />
      {flight.depAirport && !depTzKnown && (
        <FieldRow>
          <div className={fieldStyles.field} style={{ flex: 1 }}>
            <label className={fieldStyles.label}>Ζώνη ώρας αναχώρησης</label>
            <select
              className={fieldStyles.select}
              value={flight.depTimezoneOverride ?? ''}
              onChange={(e) => update('depTimezoneOverride', e.target.value)}
            >
              <option value="">Επίλεξε ζώνη ώρας…</option>
              {MANUAL_TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </FieldRow>
      )}

      <TextField
        label="Άφιξη (κωδικός)"
        value={flight.arrAirport}
        onChange={(e) => update('arrAirport', e.target.value.toUpperCase())}
        placeholder="DXB"
      />
      <DateTimeField
        label="Ώρα άφιξης"
        date={flight.arrDate}
        time={flight.arrTime}
        onDateChange={(d) => update('arrDate', d)}
        onTimeChange={(t) => update('arrTime', t)}
        caption={arrTz ? timezoneDisplayLabel(arrTz) : undefined}
      />
      {flight.arrAirport && !arrTzKnown && (
        <FieldRow>
          <div className={fieldStyles.field} style={{ flex: 1 }}>
            <label className={fieldStyles.label}>Ζώνη ώρας άφιξης</label>
            <select
              className={fieldStyles.select}
              value={flight.arrTimezoneOverride ?? ''}
              onChange={(e) => update('arrTimezoneOverride', e.target.value)}
            >
              <option value="">Επίλεξε ζώνη ώρας…</option>
              {MANUAL_TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </FieldRow>
      )}

      <div className={fieldStyles.field}>
        <label className={fieldStyles.label}>Κατάσταση</label>
        <StampToggle options={FLIGHT_STATUSES} value={flight.status as FlightStatusId} onChange={(v) => update('status', v)} />
      </div>

      <TextField label="Σύνδεσμος" value={flight.link ?? ''} onChange={(e) => update('link', e.target.value)} placeholder="https://…" />

      <MoreToggle open={showMore} onToggle={() => setShowMore((v) => !v)} />
      {showMore && (
        <>
          <FieldRow>
            <TextField label="Τερματικός" value={flight.terminal ?? ''} onChange={(e) => update('terminal', e.target.value)} />
            <TextField label="Πύλη" value={flight.gate ?? ''} onChange={(e) => update('gate', e.target.value)} />
          </FieldRow>
          <TextField label="Κωδικός κράτησης" value={flight.bookingRef ?? ''} onChange={(e) => update('bookingRef', e.target.value)} />
        </>
      )}
    </Modal>
  );
}

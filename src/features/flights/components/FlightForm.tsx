import { useState } from 'react';
import { FLIGHT_STATUSES } from '../../../config/constants';
import { useToast } from '../../../app/providers/ToastProvider';
import { Button } from '../../../shared/components/Button';
import { DateTimeField } from '../../../shared/components/DateTimeField';
import { FieldRow, MoreToggle, TextAreaField, TextField } from '../../../shared/components/Field';
import fieldStyles from '../../../shared/components/Field.module.css';
import { Modal } from '../../../shared/components/Modal';
import { PresetChips } from '../../../shared/components/PresetChips';
import { StampToggle } from '../../../shared/components/StampToggle';
import { generateId } from '../../../shared/lib/id';
import { matchAirlineDomain } from '../lib/airlineDomains';
import { checkFlightTimeOrder } from '../lib/flightTime';
import { hasParsedFields, parseFlightText } from '../lib/parseFlightText';
import { getRecentValues, rememberRecentValue } from '../lib/recentValues';
import { lookupAirportTimezone, MANUAL_TIMEZONE_OPTIONS, rememberAirportTimezone, resolveTimezone, timezoneDisplayLabel } from '../lib/timezones';
import { AttachmentsField } from '../../documents/components/AttachmentsField';
import type { Trip } from '../../trips/types';
import type { FlightStatusId } from '../../../config/constants';
import type { Flight } from '../types';
import styles from './FlightForm.module.css';

interface FlightFormProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
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

export function FlightForm({ trip, updateTrip, initial, onClose, onSave, onDelete }: FlightFormProps) {
  const { showToast } = useToast();
  const [flight, setFlight] = useState<Flight>(initial ?? emptyFlight());
  const [showMore, setShowMore] = useState(Boolean(initial?.terminal || initial?.gate || initial?.bookingRef || initial?.link));
  const [recentAirlines] = useState(() => getRecentValues('airline'));
  const [recentAirports] = useState(() => getRecentValues('airport'));
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parseFailed, setParseFailed] = useState(false);
  const [autoFilledKeys, setAutoFilledKeys] = useState<Set<keyof Flight>>(new Set());

  const update = <K extends keyof Flight>(key: K, value: Flight[K]) => {
    setFlight((prev) => ({ ...prev, [key]: value }));
    setAutoFilledKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const badgeFor = (key: keyof Flight) => (autoFilledKeys.has(key) ? 'auto' : undefined);

  const applyParsedText = () => {
    const parsed = parseFlightText(pasteText);
    if (!hasParsedFields(parsed)) {
      setParseFailed(true);
      return;
    }
    setParseFailed(false);
    setFlight((prev) => ({ ...prev, ...parsed }));
    const filledKeys = Object.keys(parsed) as (keyof Flight)[];
    setAutoFilledKeys((prev) => new Set([...prev, ...filledKeys]));
    if (filledKeys.includes('bookingRef')) setShowMore(true);
    setPasteOpen(false);
    setPasteText('');
  };

  const suggestedAirline = !flight.airline && flight.link ? matchAirlineDomain(flight.link) : undefined;

  const depTzKnown = Boolean(lookupAirportTimezone(flight.depAirport || ''));
  const arrTzKnown = Boolean(lookupAirportTimezone(flight.arrAirport || ''));
  const depTz = resolveTimezone(flight.depAirport || '', flight.depTimezoneOverride);
  const arrTz = resolveTimezone(flight.arrAirport || '', flight.arrTimezoneOverride);
  const hasUnknownAirport = Boolean(flight.depAirport && !depTzKnown) || Boolean(flight.arrAirport && !arrTzKnown);

  const timeCheck = flight.depDate && flight.depTime && flight.arrDate && flight.arrTime ? checkFlightTimeOrder(flight) : null;

  const handleSave = () => {
    if (!flight.flightNumber.trim() || !flight.depAirport.trim() || !flight.arrAirport.trim()) {
      showToast('Missing flight details — number, departure, arrival.', { variant: 'error' });
      return;
    }
    if (!flight.depDate || !flight.depTime || !flight.arrDate || !flight.arrTime) {
      showToast('Missing flight details — number, departure, arrival.', { variant: 'error' });
      return;
    }
    if (timeCheck && !timeCheck.unresolvedTimezone && !timeCheck.isValid) {
      showToast('Arrival must be after departure (based on time zones).', { variant: 'error' });
      return;
    }
    if (flight.depTimezoneOverride) rememberAirportTimezone(flight.depAirport, flight.depTimezoneOverride);
    if (flight.arrTimezoneOverride) rememberAirportTimezone(flight.arrAirport, flight.arrTimezoneOverride);
    rememberRecentValue('airline', flight.airline);
    rememberRecentValue('airport', flight.depAirport);
    rememberRecentValue('airport', flight.arrAirport);
    onSave(flight);
  };

  return (
    <Modal
      title={initial ? 'Edit flight' : 'New flight'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      {!pasteOpen ? (
        <button type="button" className={styles.pasteToggle} onClick={() => setPasteOpen(true)}>
          Paste from email
        </button>
      ) : (
        <div className={styles.pasteBox}>
          <TextAreaField
            label="Confirmation text"
            autoFocus
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste the confirmation email text here…"
          />
          {parseFailed && <p className={styles.parseError}>Couldn't find flight details in that text.</p>}
          <div className={styles.pasteActions}>
            <Button
              variant="secondary"
              onClick={() => {
                setPasteOpen(false);
                setPasteText('');
                setParseFailed(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={applyParsedText}>
              Parse text
            </Button>
          </div>
        </div>
      )}

      {autoFilledKeys.size > 0 && (
        <p className={styles.autoNote}>Some fields were filled in automatically — check them before saving.</p>
      )}

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
          ⚠ One airport is not in the lookup table. Pick its time zone by hand — it gets saved for next time.
        </div>
      )}

      <TextField
        label="Flight number"
        autoFocus
        value={flight.flightNumber}
        onChange={(e) => update('flightNumber', e.target.value)}
        placeholder="EK 106"
        badge={badgeFor('flightNumber')}
      />
      {recentAirlines.length > 0 && <PresetChips presets={recentAirlines} onSelect={(v) => update('airline', v)} hideInput />}
      {suggestedAirline && <PresetChips presets={[suggestedAirline]} onSelect={(v) => update('airline', v)} hideInput />}
      <TextField label="Airline" value={flight.airline} onChange={(e) => update('airline', e.target.value)} placeholder="Emirates" />

      {recentAirports.length > 0 && <PresetChips presets={recentAirports} onSelect={(v) => update('depAirport', v)} hideInput />}
      <TextField
        label="Departure (code)"
        value={flight.depAirport}
        onChange={(e) => update('depAirport', e.target.value.toUpperCase())}
        placeholder="ATH"
        badge={badgeFor('depAirport')}
      />
      <DateTimeField
        label="Departure time"
        date={flight.depDate}
        time={flight.depTime}
        onDateChange={(d) => update('depDate', d)}
        onTimeChange={(t) => update('depTime', t)}
        caption={depTz ? timezoneDisplayLabel(depTz) : undefined}
        badge={badgeFor('depDate') ?? badgeFor('depTime')}
      />
      {flight.depAirport && !depTzKnown && (
        <FieldRow>
          <div className={fieldStyles.field} style={{ flex: 1 }}>
            <label className={fieldStyles.label}>Departure time zone</label>
            <select
              className={fieldStyles.select}
              value={flight.depTimezoneOverride ?? ''}
              onChange={(e) => update('depTimezoneOverride', e.target.value)}
            >
              <option value="">Select a time zone…</option>
              {MANUAL_TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </FieldRow>
      )}

      {recentAirports.length > 0 && <PresetChips presets={recentAirports} onSelect={(v) => update('arrAirport', v)} hideInput />}
      <TextField
        label="Arrival (code)"
        value={flight.arrAirport}
        onChange={(e) => update('arrAirport', e.target.value.toUpperCase())}
        placeholder="DXB"
        badge={badgeFor('arrAirport')}
      />
      <DateTimeField
        label="Arrival time"
        date={flight.arrDate}
        time={flight.arrTime}
        onDateChange={(d) => update('arrDate', d)}
        onTimeChange={(t) => update('arrTime', t)}
        caption={arrTz ? timezoneDisplayLabel(arrTz) : undefined}
        badge={badgeFor('arrDate') ?? badgeFor('arrTime')}
      />
      {timeCheck && !timeCheck.unresolvedTimezone && !timeCheck.isValid && (
        <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: -8, marginBottom: 16 }}>
          Arrival must be after departure (based on time zones).
        </p>
      )}
      {flight.arrAirport && !arrTzKnown && (
        <FieldRow>
          <div className={fieldStyles.field} style={{ flex: 1 }}>
            <label className={fieldStyles.label}>Arrival time zone</label>
            <select
              className={fieldStyles.select}
              value={flight.arrTimezoneOverride ?? ''}
              onChange={(e) => update('arrTimezoneOverride', e.target.value)}
            >
              <option value="">Select a time zone…</option>
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
        <label className={fieldStyles.label}>Status</label>
        <StampToggle options={FLIGHT_STATUSES} value={flight.status as FlightStatusId} onChange={(v) => update('status', v)} />
      </div>

      <TextField label="Link" value={flight.link ?? ''} onChange={(e) => update('link', e.target.value)} placeholder="https://…" />

      <MoreToggle open={showMore} onToggle={() => setShowMore((v) => !v)} />
      {showMore && (
        <>
          <FieldRow>
            <TextField label="Terminal" value={flight.terminal ?? ''} onChange={(e) => update('terminal', e.target.value)} />
            <TextField label="Gate" value={flight.gate ?? ''} onChange={(e) => update('gate', e.target.value)} />
          </FieldRow>
          <TextField
            label="Booking reference"
            value={flight.bookingRef ?? ''}
            onChange={(e) => update('bookingRef', e.target.value)}
            badge={badgeFor('bookingRef')}
          />
        </>
      )}

      <AttachmentsField
        trip={trip}
        updateTrip={updateTrip}
        relatedTo={flight.depAirport && flight.arrAirport ? `${flight.depAirport} → ${flight.arrAirport} flight` : 'Flight'}
        defaultCategory="boarding_pass"
      />
    </Modal>
  );
}

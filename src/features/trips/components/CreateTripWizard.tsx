import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { ChipSelect } from '../../../shared/components/ChipSelect';
import { DateField } from '../../../shared/components/DateField';
import { TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { generateId } from '../../../shared/lib/id';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { suggestCurrencyForCountry } from '../../budget/lib/currency';
import { buildChecklistFromTemplate, loadMasterTemplate, hasMasterTemplate, TEMPLATE_NAMES } from '../../checklist/lib/templates';
import { nextAvatarColor } from '../../travelers/lib/avatarColors';
import type { Traveler } from '../../travelers/types';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import type { Leg, Trip } from '../types';
import { isEndOnOrAfterStart } from '../validation';
import styles from './CreateTripWizard.module.css';

const STEPS = ['Βασικά', 'Πόλεις', 'Ταξιδιώτες', 'Βαλίτσα', 'Επιβεβαίωση'] as const;

interface CreateTripWizardProps {
  onClose: () => void;
  onCreated: (tripId: string) => void;
}

export function CreateTripWizard({ onClose, onCreated }: CreateTripWizardProps) {
  const { saveTrip } = useTripsContext();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [legs, setLegs] = useState<Leg[]>([]);
  const [legCity, setLegCity] = useState('');
  const [legCountry, setLegCountry] = useState('');

  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [travelerName, setTravelerName] = useState('');

  const [template, setTemplate] = useState<string | null>(null);

  const basicsValid = title.trim().length > 0 && startDate && endDate && isEndOnOrAfterStart(startDate, endDate);

  const addLeg = () => {
    if (!legCity.trim() || !legCountry.trim()) return;
    setLegs((prev) => [
      ...prev,
      {
        id: generateId(),
        city: legCity.trim(),
        country: legCountry.trim(),
        startDate: startDate || '',
        endDate: endDate || '',
        currency: suggestCurrencyForCountry(legCountry.trim()),
      },
    ]);
    setLegCity('');
    setLegCountry('');
  };

  const addTraveler = () => {
    if (!travelerName.trim()) return;
    setTravelers((prev) => [...prev, { id: generateId(), name: travelerName.trim(), avatarColor: nextAvatarColor(prev.length) }]);
    setTravelerName('');
  };

  const handleCreate = async () => {
    const effectiveTravelers = travelers.length > 0 ? travelers : [{ id: generateId(), name: 'Εγώ', avatarColor: nextAvatarColor(0) }];

    let checklistItems = effectiveTravelers.flatMap((t) =>
      template === '__master__' ? loadMasterTemplate(t.id) : template ? buildChecklistFromTemplate(template, t.id) : [],
    );
    if (template === '__master__' && checklistItems.length === 0) {
      checklistItems = [];
    }

    const trip: Trip = {
      id: generateId(),
      title: title.trim(),
      startDate,
      endDate,
      homeCurrency: legs[0]?.currency ?? 'EUR',
      archived: false,
      travelers: effectiveTravelers,
      legs,
      flights: [],
      stays: [],
      itineraryStops: [],
      ideas: [],
      budgetCategories: [],
      expenses: [],
      checklistItems,
      shareSettings: { enabled: false, includedTabs: [] },
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveTrip(trip);
      showToast('Το ταξίδι δημιουργήθηκε', 'success');
      onCreated(trip.id);
    } catch {
      // saveTrip already surfaces a toast on failure
    }
  };

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Modal
      title={STEPS[step]!}
      onClose={onClose}
      footer={
        <>
          {step > 0 && (
            <Button variant="secondary" onClick={goBack}>
              Πίσω
            </Button>
          )}
          {step < STEPS.length - 1 && step > 0 && (
            <Button variant="ghost" onClick={goNext}>
              Παράλειψη
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" disabled={step === 0 && !basicsValid} onClick={goNext}>
              Επόμενο
            </Button>
          ) : (
            <Button variant="primary" onClick={() => void handleCreate()}>
              Δημιουργία ταξιδιού
            </Button>
          )}
        </>
      }
    >
      <div className={styles.dots}>
        {STEPS.map((_, i) => (
          <span key={i} className={styles.dot} data-active={i === step} />
        ))}
      </div>

      {step === 0 && (
        <>
          <TextField
            label="Τίτλος ταξιδιού"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && basicsValid) goNext();
            }}
            placeholder="π.χ. Ιαπωνία — Φθινόπωρο"
          />
          <DateField label="Ημερομηνία έναρξης" date={startDate} onChange={setStartDate} />
          <DateField label="Ημερομηνία λήξης" date={endDate} onChange={setEndDate} minDate={startDate || undefined} />
          {startDate && endDate && !isEndOnOrAfterStart(startDate, endDate) && (
            <p style={{ color: 'var(--color-rust)', fontSize: 13 }}>Η λήξη πρέπει να είναι μετά ή ίδια με την έναρξη.</p>
          )}
        </>
      )}

      {step === 1 && (
        <>
          {legs.map((leg) => (
            <div key={leg.id} className={styles.legItem}>
              <span>
                {leg.city}, {leg.country} · {leg.currency}
              </span>
              <button type="button" className={styles.removeButton} onClick={() => setLegs((prev) => prev.filter((l) => l.id !== leg.id))}>
                ✕
              </button>
            </div>
          ))}
          <div className={styles.addRow}>
            <TextField label="Πόλη" value={legCity} onChange={(e) => setLegCity(e.target.value)} placeholder="Τόκιο" />
            <TextField label="Χώρα" value={legCountry} onChange={(e) => setLegCountry(e.target.value)} placeholder="Ιαπωνία" />
          </div>
          <Button variant="secondary" onClick={addLeg}>
            + Προσθήκη πόλης
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          {travelers.map((t) => (
            <div key={t.id} className={styles.travelerItem}>
              <span>{t.name}</span>
              <button type="button" className={styles.removeButton} onClick={() => setTravelers((prev) => prev.filter((p) => p.id !== t.id))}>
                ✕
              </button>
            </div>
          ))}
          <div className={styles.addRow}>
            <TextField
              label="Όνομα ταξιδιώτη"
              value={travelerName}
              onChange={(e) => setTravelerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTraveler();
                }
              }}
              placeholder="π.χ. Μαρία"
            />
          </div>
          <Button variant="secondary" onClick={addTraveler}>
            + Προσθήκη ταξιδιώτη
          </Button>
        </>
      )}

      {step === 3 && (
        <ChipSelect
          options={[
            ...TEMPLATE_NAMES.map((name) => ({ id: name, label: name })),
            ...(hasMasterTemplate() ? [{ id: '__master__', label: 'Αποθηκευμένο πρότυπο' }] : []),
          ]}
          value={template ?? ''}
          onChange={(id) => setTemplate(id)}
        />
      )}

      {step === 4 && (
        <>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Τίτλος</span>
            <span>{title}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Ημερομηνίες</span>
            <span>
              {formatDateShort(startDate)} → {formatDateShort(endDate)}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Πόλεις</span>
            <span>{legs.length > 0 ? legs.map((l) => l.city).join(', ') : 'Χωρίς προορισμό'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Ταξιδιώτες</span>
            <span>{travelers.length > 0 ? travelers.map((t) => t.name).join(', ') : 'Μόνο εγώ'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Βαλίτσα</span>
            <span>{template === '__master__' ? 'Αποθηκευμένο πρότυπο' : template ?? 'Χωρίς πρότυπο'}</span>
          </div>
        </>
      )}
    </Modal>
  );
}

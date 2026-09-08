import { useState } from 'react';
import { BUDGET_CATEGORY_PRESETS, CATEGORY_COLORS } from '../../../config/constants';
import { Button } from '../../../shared/components/Button';
import { ChipSelect } from '../../../shared/components/ChipSelect';
import { DateField } from '../../../shared/components/DateField';
import { FieldRow, MoreToggle, TextAreaField, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { PresetChips } from '../../../shared/components/PresetChips';
import { generateId } from '../../../shared/lib/id';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { suggestCurrencyForCountry } from '../../budget/lib/currency';
import { getDefaultCurrency } from '../../settings/lib/preferences';
import type { BudgetCategory } from '../../budget/types';
import { buildChecklistFromTemplate, loadMasterTemplate, hasMasterTemplate, TEMPLATE_NAMES } from '../../checklist/lib/templates';
import { nextAvatarColor } from '../../travelers/lib/avatarColors';
import type { Traveler } from '../../travelers/types';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { countryForCity, suggestCities } from '../lib/cityAutocomplete';
import type { Leg, Trip } from '../types';
import { isEndOnOrAfterStart } from '../validation';
import styles from './CreateTripWizard.module.css';

const STEPS = ['Basics', 'Cities', 'Travellers', 'Packing', 'Review'] as const;

const STEP_SUBTITLES: Record<number, string> = {
  0: 'Only these are required. Every other step can be skipped.',
  1: 'Add stops if this is a multi-city trip.',
  2: 'Who is coming along? Used for expenses and packing lists.',
  3: 'Pick a starter template so you are not staring at an empty list.',
  4: 'Check it over and create.',
};

const STARTER_CATEGORY_NAMES = BUDGET_CATEGORY_PRESETS.slice(0, 3);

export interface DuplicateSeed {
  categories: BudgetCategory[];
  checklistTemplateItems: { text: string; category: string; quantity: number }[];
}

interface CreateTripWizardProps {
  onClose: () => void;
  onCreated: (tripId: string) => void;
  duplicateSeed?: DuplicateSeed;
}

export function CreateTripWizard({ onClose, onCreated, duplicateSeed }: CreateTripWizardProps) {
  const { saveTrip } = useTripsContext();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [showMore, setShowMore] = useState(false);

  const [legs, setLegs] = useState<Leg[]>([]);
  const [legCity, setLegCity] = useState('');
  const [legCountry, setLegCountry] = useState('');
  const [showCityFields, setShowCityFields] = useState(false);

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

  const applyCitySuggestion = (cityName: string) => {
    setLegCity(cityName);
    const country = countryForCity(cityName);
    if (country) setLegCountry(country);
  };

  const addTraveler = () => {
    if (!travelerName.trim()) return;
    setTravelers((prev) => [...prev, { id: generateId(), name: travelerName.trim(), avatarColor: nextAvatarColor(prev.length) }]);
    setTravelerName('');
  };

  const handleCreate = async () => {
    const effectiveTravelers = travelers.length > 0 ? travelers : [{ id: generateId(), name: 'Me', avatarColor: nextAvatarColor(0) }];

    // Skipping "Cities" leaves a single unnamed destination spanning the trip's step-1 dates.
    const finalLegs: Leg[] =
      legs.length > 0
        ? legs
        : [{ id: generateId(), city: '', country: '', startDate, endDate, currency: getDefaultCurrency() }];

    const checklistItems = duplicateSeed
      ? effectiveTravelers.flatMap((t) =>
          duplicateSeed.checklistTemplateItems.map((item) => ({ id: generateId(), travelerId: t.id, ...item, done: false })),
        )
      : effectiveTravelers.flatMap((t) =>
          template === '__master__' ? loadMasterTemplate(t.id) : template ? buildChecklistFromTemplate(template, t.id) : [],
        );

    const budgetCategories: BudgetCategory[] = duplicateSeed
      ? duplicateSeed.categories.map((c) => ({ ...c, id: generateId() }))
      : STARTER_CATEGORY_NAMES.map((name, i) => ({ id: generateId(), name, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]! }));

    const trip: Trip = {
      id: generateId(),
      title: title.trim(),
      homeCurrency: finalLegs[0]?.currency ?? getDefaultCurrency(),
      archived: false,
      travelers: effectiveTravelers,
      legs: finalLegs,
      flights: [],
      stays: [],
      bookingItems: [],
      documents: [],
      itineraryStops: [],
      ideas: [],
      budgetCategories,
      rememberedLocations: [],
      expenses: [],
      checklistItems,
      description: description.trim() || undefined,
      shareSettings: { enabled: false, includedTabs: [] },
      schemaVersion: 2,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveTrip(trip);
      showToast(duplicateSeed ? 'Copied the budget categories and packing template only.' : 'Trip created.');
      onCreated(trip.id);
    } catch {
      // saveTrip already surfaces a toast on failure
    }
  };

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Modal
      title={<span className={styles.stepTitle}>{STEPS[step]}</span>}
      onClose={onClose}
      footer={
        <>
          {step > 0 && (
            <Button variant="secondary" onClick={goBack}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 && step > 0 && (
            <Button variant="secondary" onClick={goNext}>
              Skip
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" disabled={step === 0 && !basicsValid} onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={() => void handleCreate()}>
              Create trip
            </Button>
          )}
        </>
      }
    >
      <div className={styles.progress}>
        {STEPS.map((_, i) => (
          <span key={i} className={styles.segment} data-done={i <= step} />
        ))}
      </div>
      <div className={styles.stepMeta}>
        Step {step + 1} of {STEPS.length}
      </div>
      {STEP_SUBTITLES[step] && <p className={styles.subtitle}>{STEP_SUBTITLES[step]}</p>}

      {step === 0 && (
        <>
          <TextField
            label="Trip title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && basicsValid) goNext();
            }}
            placeholder="e.g. Japan in September"
          />
          <FieldRow>
            <DateField label="Start date" date={startDate} onChange={setStartDate} />
            <DateField label="End date" date={endDate} onChange={setEndDate} minDate={startDate || undefined} />
          </FieldRow>
          {startDate && endDate && !isEndOnOrAfterStart(startDate, endDate) && (
            <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>The end date must be on or after the start date.</p>
          )}
          <p className={styles.note}>Past dates are allowed — you can log a trip you already took.</p>

          <MoreToggle open={showMore} onToggle={() => setShowMore((v) => !v)} />
          {showMore && (
            <TextAreaField
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A few words about the trip…"
              rows={3}
            />
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
          {showCityFields ? (
            <>
              {suggestCities(legCity).length > 0 && (
                <PresetChips presets={suggestCities(legCity)} onSelect={applyCitySuggestion} hideInput />
              )}
              <div className={styles.addRow}>
                <TextField label="City" value={legCity} onChange={(e) => setLegCity(e.target.value)} placeholder="Tokyo" />
                <TextField label="Country" value={legCountry} onChange={(e) => setLegCountry(e.target.value)} placeholder="Japan" />
              </div>
              <Button variant="secondary" onClick={addLeg}>
                + Add city
              </Button>
            </>
          ) : (
            <button type="button" className={styles.addCityToggle} onClick={() => setShowCityFields(true)}>
              + Add city
            </button>
          )}
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
          <div className={styles.travelerAddRow}>
            <TextField
              label="Companion's name"
              value={travelerName}
              onChange={(e) => setTravelerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTraveler();
                }
              }}
              placeholder="e.g. Maria"
            />
            <Button
              variant="primary"
              style={{ flex: '0 0 auto', width: 48, height: 48, padding: 0, marginBottom: 'var(--space-4)' }}
              onClick={addTraveler}
              aria-label="Add traveller"
            >
              +
            </Button>
          </div>
          <p className={styles.note}>Colors are assigned automatically in the order you add people.</p>
        </>
      )}

      {step === 3 && (
        <>
          {duplicateSeed ? (
            <p className={styles.note}>The packing list will be copied from the original trip.</p>
          ) : (
            <>
              <ChipSelect
                options={[
                  ...TEMPLATE_NAMES.map((name) => ({ id: name, label: name })),
                  ...(hasMasterTemplate() ? [{ id: '__master__', label: 'Saved template' }] : []),
                ]}
                value={template ?? ''}
                onChange={(id) => setTemplate(id)}
              />
              <p className={styles.note}>The template just pre-fills the list. You can change all of it later.</p>
            </>
          )}
        </>
      )}

      {step === 4 && (
        <>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Title</span>
            <span>{title}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Dates</span>
            <span>
              {formatDateShort(startDate)} – {formatDateShort(endDate)}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Cities</span>
            <span>{legs.length > 0 ? legs.map((l) => l.city).join(', ') : 'No cities'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Travellers</span>
            <span>{travelers.length > 0 ? travelers.map((t) => t.name).join(', ') : 'Just me'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Packing</span>
            <span>{template === '__master__' ? 'Saved template' : (template ?? 'No template')}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Categories</span>
            <span>{STARTER_CATEGORY_NAMES.join(', ')}</span>
          </div>
        </>
      )}
    </Modal>
  );
}

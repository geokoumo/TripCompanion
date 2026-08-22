export const SCHEMA_VERSION = 1;

// Round-robin palette for traveler avatars.
export const TRAVELER_AVATAR_COLORS = [
  'rust',
  'teal',
  'brass',
  'purple',
  'gray',
] as const;
export type TravelerAvatarColor = (typeof TRAVELER_AVATAR_COLORS)[number];

// Round-robin palette for budget categories (5+ colors as required).
export const CATEGORY_COLORS = [
  'rust',
  'teal',
  'brass',
  'purple',
  'gray',
] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const BUDGET_CATEGORY_PRESETS = [
  'Φαγητό',
  'Μετακίνηση',
  'Διαμονή',
  'Ψυχαγωγία',
  'Σουβενίρ',
  'Έκτακτα',
] as const;

export const ITINERARY_STOP_TYPES = [
  { id: 'food', label: 'Φαγητό', letter: 'Φ' },
  { id: 'sight', label: 'Αξιοθέατο', letter: 'Α' },
  { id: 'transport', label: 'Μετακίνηση', letter: 'Μ' },
  { id: 'shop', label: 'Ψώνια', letter: 'Ψ' },
  { id: 'rest', label: 'Ξεκούραση', letter: 'Ξ' },
] as const;
export type ItineraryStopTypeId = (typeof ITINERARY_STOP_TYPES)[number]['id'];

export const FLIGHT_STATUSES = [
  { id: 'scheduled', label: 'Προγραμματισμένη' },
  { id: 'delayed', label: 'Καθυστέρηση' },
  { id: 'cancelled', label: 'Ακυρώθηκε' },
  { id: 'landed', label: 'Προσγειώθηκε' },
] as const;
export type FlightStatusId = (typeof FLIGHT_STATUSES)[number]['id'];

export const CHECKLIST_CATEGORIES = [
  'Έγγραφα',
  'Ηλεκτρονικά',
  'Ρούχα',
  'Φάρμακα',
  'Λοιπά',
] as const;

interface ChecklistTemplateItem {
  text: string;
  category: (typeof CHECKLIST_CATEGORIES)[number];
  quantity: number;
}

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplateItem[]> = {
  Γενικό: [
    { text: 'Διαβατήριο', category: 'Έγγραφα', quantity: 1 },
    { text: 'Εισιτήρια / boarding pass', category: 'Έγγραφα', quantity: 1 },
    { text: 'Ασφάλεια ταξιδιού', category: 'Έγγραφα', quantity: 1 },
    { text: 'Φορτιστής κινητού', category: 'Ηλεκτρονικά', quantity: 1 },
    { text: 'Powerbank', category: 'Ηλεκτρονικά', quantity: 1 },
    { text: 'Ρούχα', category: 'Ρούχα', quantity: 1 },
    { text: 'Εσώρουχα', category: 'Ρούχα', quantity: 1 },
    { text: 'Φάρμακα καθημερινής χρήσης', category: 'Φάρμακα', quantity: 1 },
  ],
  Πόλη: [
    { text: 'Διαβατήριο', category: 'Έγγραφα', quantity: 1 },
    { text: 'Άνετα παπούτσια', category: 'Ρούχα', quantity: 1 },
    { text: 'Φορτιστής κινητού', category: 'Ηλεκτρονικά', quantity: 1 },
    { text: 'Χάρτης / offline maps', category: 'Ηλεκτρονικά', quantity: 1 },
  ],
  Παραλία: [
    { text: 'Διαβατήριο', category: 'Έγγραφα', quantity: 1 },
    { text: 'Μαγιό', category: 'Ρούχα', quantity: 2 },
    { text: 'Αντηλιακό', category: 'Φάρμακα', quantity: 1 },
    { text: 'Πετσέτα θαλάσσης', category: 'Λοιπά', quantity: 1 },
    { text: 'Γυαλιά ηλίου', category: 'Λοιπά', quantity: 1 },
  ],
  Πεζοπορία: [
    { text: 'Διαβατήριο', category: 'Έγγραφα', quantity: 1 },
    { text: 'Παπούτσια πεζοπορίας', category: 'Ρούχα', quantity: 1 },
    { text: 'Παγούρι νερού', category: 'Λοιπά', quantity: 1 },
    { text: 'Φαρμακείο', category: 'Φάρμακα', quantity: 1 },
    { text: 'Powerbank', category: 'Ηλεκτρονικά', quantity: 1 },
  ],
  Επαγγελματικό: [
    { text: 'Διαβατήριο', category: 'Έγγραφα', quantity: 1 },
    { text: 'Επαγγελματική κάρτα', category: 'Έγγραφα', quantity: 1 },
    { text: 'Laptop', category: 'Ηλεκτρονικά', quantity: 1 },
    { text: 'Φορτιστής laptop', category: 'Ηλεκτρονικά', quantity: 1 },
    { text: 'Επίσημα ρούχα', category: 'Ρούχα', quantity: 1 },
  ],
};

// Small hand-curated airport-code -> city display name table (Greek).
export const AIRPORT_CITY_NAMES: Record<string, string> = {
  ATH: 'Αθήνα', SKG: 'Θεσσαλονίκη', JTR: 'Σαντορίνη', JMK: 'Μύκονος', HER: 'Ηράκλειο',
  RHO: 'Ρόδος', CFU: 'Κέρκυρα', LHR: 'Λονδίνο', LGW: 'Λονδίνο', CDG: 'Παρίσι',
  ORY: 'Παρίσι', FCO: 'Ρώμη', MXP: 'Μιλάνο', BCN: 'Βαρκελώνη', MAD: 'Μαδρίτη',
  AMS: 'Άμστερνταμ', FRA: 'Φρανκφούρτη', MUC: 'Μόναχο', VIE: 'Βιέννη', ZRH: 'Ζυρίχη',
  IST: 'Κωνσταντινούπολη', SAW: 'Κωνσταντινούπολη', JFK: 'Νέα Υόρκη', EWR: 'Νέα Υόρκη',
  LAX: 'Λος Άντζελες', ORD: 'Σικάγο', NRT: 'Τόκιο', HND: 'Τόκιο', KIX: 'Οσάκα',
  ITM: 'Οσάκα', DXB: 'Ντουμπάι', BKK: 'Μπανγκόκ', DPS: 'Μπαλί',
};

// Small hand-curated country -> default currency table.
export const COUNTRY_CURRENCY: Record<string, string> = {
  Ελλάδα: 'EUR',
  Ιταλία: 'EUR',
  Γαλλία: 'EUR',
  Γερμανία: 'EUR',
  Ισπανία: 'EUR',
  Πορτογαλία: 'EUR',
  Ολλανδία: 'EUR',
  Αυστρία: 'EUR',
  'Ηνωμένο Βασίλειο': 'GBP',
  'Ηνωμένες Πολιτείες': 'USD',
  Ιαπωνία: 'JPY',
  Ελβετία: 'CHF',
  Τουρκία: 'TRY',
  Ταϊλάνδη: 'THB',
  'Ηνωμένα Αραβικά Εμιράτα': 'AED',
};

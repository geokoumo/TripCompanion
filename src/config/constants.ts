export const SCHEMA_VERSION = 2;

// Round-robin palette for traveler avatars — fixed 4-color cycle, assigned in add order.
export const TRAVELER_AVATAR_COLORS = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
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

// Small hand-curated link-domain -> airline-name table, same "grows over
// time" pattern as the airport table. Pure string matching against pasted
// link text — never used to fetch or verify anything.
export const AIRLINE_DOMAINS: Record<string, string> = {
  'aegeanair.com': 'Aegean',
  'ryanair.com': 'Ryanair',
  'easyjet.com': 'easyJet',
  'lufthansa.com': 'Lufthansa',
  'emirates.com': 'Emirates',
  'qatarairways.com': 'Qatar Airways',
  'britishairways.com': 'British Airways',
  'airfrance.com': 'Air France',
  'klm.com': 'KLM',
  'turkishairlines.com': 'Turkish Airlines',
  'ana.co.jp': 'ANA',
  'jal.co.jp': 'Japan Airlines',
  'united.com': 'United',
  'delta.com': 'Delta',
  'aa.com': 'American Airlines',
  'wizzair.com': 'Wizz Air',
  'vueling.com': 'Vueling',
  'norwegian.com': 'Norwegian',
  'swiss.com': 'Swiss',
  'austrian.com': 'Austrian',
};

export interface CommonCity {
  el: string;
  en: string;
  country: string;
}

// Small hand-curated list of common travel-destination cities (Greek display
// name + Latin name + country), same "grows over time" pattern as the
// airport table. Starter set — not exhaustive.
export const COMMON_CITIES: CommonCity[] = [
  { el: 'Αθήνα', en: 'Athens', country: 'Ελλάδα' },
  { el: 'Θεσσαλονίκη', en: 'Thessaloniki', country: 'Ελλάδα' },
  { el: 'Πάτρα', en: 'Patras', country: 'Ελλάδα' },
  { el: 'Ηράκλειο', en: 'Heraklion', country: 'Ελλάδα' },
  { el: 'Ρόδος', en: 'Rhodes', country: 'Ελλάδα' },
  { el: 'Σαντορίνη', en: 'Santorini', country: 'Ελλάδα' },
  { el: 'Μύκονος', en: 'Mykonos', country: 'Ελλάδα' },
  { el: 'Κέρκυρα', en: 'Corfu', country: 'Ελλάδα' },
  { el: 'Χανιά', en: 'Chania', country: 'Ελλάδα' },
  { el: 'Ναύπλιο', en: 'Nafplio', country: 'Ελλάδα' },
  { el: 'Παρίσι', en: 'Paris', country: 'Γαλλία' },
  { el: 'Λυών', en: 'Lyon', country: 'Γαλλία' },
  { el: 'Νίκαια', en: 'Nice', country: 'Γαλλία' },
  { el: 'Μασσαλία', en: 'Marseille', country: 'Γαλλία' },
  { el: 'Λονδίνο', en: 'London', country: 'Ηνωμένο Βασίλειο' },
  { el: 'Μάντσεστερ', en: 'Manchester', country: 'Ηνωμένο Βασίλειο' },
  { el: 'Εδιμβούργο', en: 'Edinburgh', country: 'Ηνωμένο Βασίλειο' },
  { el: 'Ρώμη', en: 'Rome', country: 'Ιταλία' },
  { el: 'Μιλάνο', en: 'Milan', country: 'Ιταλία' },
  { el: 'Βενετία', en: 'Venice', country: 'Ιταλία' },
  { el: 'Φλωρεντία', en: 'Florence', country: 'Ιταλία' },
  { el: 'Νάπολη', en: 'Naples', country: 'Ιταλία' },
  { el: 'Βαρκελώνη', en: 'Barcelona', country: 'Ισπανία' },
  { el: 'Μαδρίτη', en: 'Madrid', country: 'Ισπανία' },
  { el: 'Σεβίλλη', en: 'Seville', country: 'Ισπανία' },
  { el: 'Βαλένθια', en: 'Valencia', country: 'Ισπανία' },
  { el: 'Λισαβόνα', en: 'Lisbon', country: 'Πορτογαλία' },
  { el: 'Πόρτο', en: 'Porto', country: 'Πορτογαλία' },
  { el: 'Άμστερνταμ', en: 'Amsterdam', country: 'Ολλανδία' },
  { el: 'Βερολίνο', en: 'Berlin', country: 'Γερμανία' },
  { el: 'Μόναχο', en: 'Munich', country: 'Γερμανία' },
  { el: 'Φρανκφούρτη', en: 'Frankfurt', country: 'Γερμανία' },
  { el: 'Αμβούργο', en: 'Hamburg', country: 'Γερμανία' },
  { el: 'Βιέννη', en: 'Vienna', country: 'Αυστρία' },
  { el: 'Ζυρίχη', en: 'Zurich', country: 'Ελβετία' },
  { el: 'Γενεύη', en: 'Geneva', country: 'Ελβετία' },
  { el: 'Πράγα', en: 'Prague', country: 'Τσεχία' },
  { el: 'Βουδαπέστη', en: 'Budapest', country: 'Ουγγαρία' },
  { el: 'Βαρσοβία', en: 'Warsaw', country: 'Πολωνία' },
  { el: 'Κοπεγχάγη', en: 'Copenhagen', country: 'Δανία' },
  { el: 'Στοκχόλμη', en: 'Stockholm', country: 'Σουηδία' },
  { el: 'Όσλο', en: 'Oslo', country: 'Νορβηγία' },
  { el: 'Δουβλίνο', en: 'Dublin', country: 'Ιρλανδία' },
  { el: 'Κωνσταντινούπολη', en: 'Istanbul', country: 'Τουρκία' },
  { el: 'Ντουμπάι', en: 'Dubai', country: 'Ηνωμένα Αραβικά Εμιράτα' },
  { el: 'Τόκιο', en: 'Tokyo', country: 'Ιαπωνία' },
  { el: 'Κιότο', en: 'Kyoto', country: 'Ιαπωνία' },
  { el: 'Οσάκα', en: 'Osaka', country: 'Ιαπωνία' },
  { el: 'Μπανγκόκ', en: 'Bangkok', country: 'Ταϊλάνδη' },
  { el: 'Σιγκαπούρη', en: 'Singapore', country: 'Σιγκαπούρη' },
  { el: 'Χονγκ Κονγκ', en: 'Hong Kong', country: 'Χονγκ Κονγκ' },
  { el: 'Σεούλ', en: 'Seoul', country: 'Νότια Κορέα' },
  { el: 'Νέα Υόρκη', en: 'New York', country: 'Ηνωμένες Πολιτείες' },
  { el: 'Λος Άντζελες', en: 'Los Angeles', country: 'Ηνωμένες Πολιτείες' },
  { el: 'Σικάγο', en: 'Chicago', country: 'Ηνωμένες Πολιτείες' },
  { el: 'Μαϊάμι', en: 'Miami', country: 'Ηνωμένες Πολιτείες' },
  { el: 'Τορόντο', en: 'Toronto', country: 'Καναδάς' },
  { el: 'Σίδνεϊ', en: 'Sydney', country: 'Αυστραλία' },
];

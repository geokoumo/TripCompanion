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
  'Stays',
  'Food',
  'Transport',
  'Sights',
  'Shopping',
] as const;

export const ITINERARY_STOP_TYPES = [
  { id: 'food', label: 'Food', letter: 'F' },
  { id: 'sight', label: 'Sight', letter: 'S' },
  { id: 'transport', label: 'Transport', letter: 'T' },
  { id: 'shop', label: 'Shopping', letter: 'B' },
  { id: 'rest', label: 'Rest', letter: '☾' },
] as const;
export type ItineraryStopTypeId = (typeof ITINERARY_STOP_TYPES)[number]['id'];

export const FLIGHT_STATUSES = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'delayed', label: 'Delayed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'landed', label: 'Landed' },
] as const;
export type FlightStatusId = (typeof FLIGHT_STATUSES)[number]['id'];

export const CHECKLIST_CATEGORIES = [
  'Documents',
  'Electronics',
  'Clothes',
  'Medicine',
  'Other',
] as const;

interface ChecklistTemplateItem {
  text: string;
  category: (typeof CHECKLIST_CATEGORIES)[number];
  quantity: number;
}

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplateItem[]> = {
  City: [
    { text: 'Passport', category: 'Documents', quantity: 1 },
    { text: 'Comfortable shoes', category: 'Clothes', quantity: 1 },
    { text: 'Phone charger', category: 'Electronics', quantity: 1 },
    { text: 'Map / offline maps', category: 'Electronics', quantity: 1 },
  ],
  Beach: [
    { text: 'Passport', category: 'Documents', quantity: 1 },
    { text: 'Swimsuit', category: 'Clothes', quantity: 2 },
    { text: 'Sunscreen', category: 'Medicine', quantity: 1 },
    { text: 'Beach towel', category: 'Other', quantity: 1 },
    { text: 'Sunglasses', category: 'Other', quantity: 1 },
  ],
  Hiking: [
    { text: 'Passport', category: 'Documents', quantity: 1 },
    { text: 'Hiking shoes', category: 'Clothes', quantity: 1 },
    { text: 'Water bottle', category: 'Other', quantity: 1 },
    { text: 'First-aid kit', category: 'Medicine', quantity: 1 },
    { text: 'Powerbank', category: 'Electronics', quantity: 1 },
  ],
  Business: [
    { text: 'Passport', category: 'Documents', quantity: 1 },
    { text: 'Business card', category: 'Documents', quantity: 1 },
    { text: 'Laptop', category: 'Electronics', quantity: 1 },
    { text: 'Laptop charger', category: 'Electronics', quantity: 1 },
    { text: 'Formal wear', category: 'Clothes', quantity: 1 },
  ],
  General: [
    { text: 'Passport', category: 'Documents', quantity: 1 },
    { text: 'Tickets / boarding pass', category: 'Documents', quantity: 1 },
    { text: 'Travel insurance', category: 'Documents', quantity: 1 },
    { text: 'Phone charger', category: 'Electronics', quantity: 1 },
    { text: 'Powerbank', category: 'Electronics', quantity: 1 },
    { text: 'Clothes', category: 'Clothes', quantity: 1 },
    { text: 'Underwear', category: 'Clothes', quantity: 1 },
    { text: 'Daily medication', category: 'Medicine', quantity: 1 },
  ],
};

// Small hand-curated airport-code -> city display name table.
export const AIRPORT_CITY_NAMES: Record<string, string> = {
  ATH: 'Athens', SKG: 'Thessaloniki', JTR: 'Santorini', JMK: 'Mykonos', HER: 'Heraklion',
  RHO: 'Rhodes', CFU: 'Corfu', LHR: 'London', LGW: 'London', CDG: 'Paris',
  ORY: 'Paris', FCO: 'Rome', MXP: 'Milan', BCN: 'Barcelona', MAD: 'Madrid',
  AMS: 'Amsterdam', FRA: 'Frankfurt', MUC: 'Munich', VIE: 'Vienna', ZRH: 'Zurich',
  IST: 'Istanbul', SAW: 'Istanbul', JFK: 'New York', EWR: 'New York',
  LAX: 'Los Angeles', ORD: 'Chicago', NRT: 'Tokyo', HND: 'Tokyo', KIX: 'Osaka',
  ITM: 'Osaka', DXB: 'Dubai', BKK: 'Bangkok', DPS: 'Bali',
};

// Small hand-curated country -> default currency table.
export const COUNTRY_CURRENCY: Record<string, string> = {
  Greece: 'EUR',
  Italy: 'EUR',
  France: 'EUR',
  Germany: 'EUR',
  Spain: 'EUR',
  Portugal: 'EUR',
  Netherlands: 'EUR',
  Austria: 'EUR',
  'United Kingdom': 'GBP',
  'United States': 'USD',
  Japan: 'JPY',
  Switzerland: 'CHF',
  Turkey: 'TRY',
  Thailand: 'THB',
  'United Arab Emirates': 'AED',
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
  city: string;
  country: string;
}

// Small hand-curated list of common travel-destination cities, same "grows
// over time" pattern as the airport table. Starter set — not exhaustive.
export const COMMON_CITIES: CommonCity[] = [
  { city: 'Athens', country: 'Greece' },
  { city: 'Thessaloniki', country: 'Greece' },
  { city: 'Patras', country: 'Greece' },
  { city: 'Heraklion', country: 'Greece' },
  { city: 'Rhodes', country: 'Greece' },
  { city: 'Santorini', country: 'Greece' },
  { city: 'Mykonos', country: 'Greece' },
  { city: 'Corfu', country: 'Greece' },
  { city: 'Chania', country: 'Greece' },
  { city: 'Nafplio', country: 'Greece' },
  { city: 'Paris', country: 'France' },
  { city: 'Lyon', country: 'France' },
  { city: 'Nice', country: 'France' },
  { city: 'Marseille', country: 'France' },
  { city: 'London', country: 'United Kingdom' },
  { city: 'Manchester', country: 'United Kingdom' },
  { city: 'Edinburgh', country: 'United Kingdom' },
  { city: 'Rome', country: 'Italy' },
  { city: 'Milan', country: 'Italy' },
  { city: 'Venice', country: 'Italy' },
  { city: 'Florence', country: 'Italy' },
  { city: 'Naples', country: 'Italy' },
  { city: 'Barcelona', country: 'Spain' },
  { city: 'Madrid', country: 'Spain' },
  { city: 'Seville', country: 'Spain' },
  { city: 'Valencia', country: 'Spain' },
  { city: 'Lisbon', country: 'Portugal' },
  { city: 'Porto', country: 'Portugal' },
  { city: 'Amsterdam', country: 'Netherlands' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Munich', country: 'Germany' },
  { city: 'Frankfurt', country: 'Germany' },
  { city: 'Hamburg', country: 'Germany' },
  { city: 'Vienna', country: 'Austria' },
  { city: 'Zurich', country: 'Switzerland' },
  { city: 'Geneva', country: 'Switzerland' },
  { city: 'Prague', country: 'Czechia' },
  { city: 'Budapest', country: 'Hungary' },
  { city: 'Warsaw', country: 'Poland' },
  { city: 'Copenhagen', country: 'Denmark' },
  { city: 'Stockholm', country: 'Sweden' },
  { city: 'Oslo', country: 'Norway' },
  { city: 'Dublin', country: 'Ireland' },
  { city: 'Istanbul', country: 'Turkey' },
  { city: 'Dubai', country: 'United Arab Emirates' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Kyoto', country: 'Japan' },
  { city: 'Osaka', country: 'Japan' },
  { city: 'Bangkok', country: 'Thailand' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Hong Kong', country: 'Hong Kong' },
  { city: 'Seoul', country: 'South Korea' },
  { city: 'New York', country: 'United States' },
  { city: 'Los Angeles', country: 'United States' },
  { city: 'Chicago', country: 'United States' },
  { city: 'Miami', country: 'United States' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Sydney', country: 'Australia' },
];

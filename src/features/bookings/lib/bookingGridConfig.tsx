import {
  BedIcon,
  CarIcon,
  DotsCircleIcon,
  DrinkIcon,
  FileIcon,
  ForkKnifeIcon,
  LandmarkIcon,
  PlaneIcon,
  StarIcon,
  TicketIcon,
} from '../../../shared/components/icons';
import type { IconTone } from '../../../shared/components/IconCircle';
import type { BookingItemTypeId } from '../../../config/constants';

/** Every tile in the "Add to trip" picker — Flights/Stays plus every booking_items type plus Documents. */
export type AddToTripDestination = 'flights' | 'stays' | BookingItemTypeId | 'documents';

export type AddToTripGroup = 'BOOK' | 'PLAN' | 'STORE';

interface GridEntry {
  id: AddToTripDestination;
  label: string;
  description: string;
  Icon: typeof PlaneIcon;
  tone: IconTone;
  group: AddToTripGroup;
}

/** Grouped per the approved Add-flow IA: BOOK / PLAN / STORE. */
export const ADD_TO_TRIP_GRID: GridEntry[] = [
  { id: 'flights', label: 'Flight', description: 'Airline, flight number, departure time', Icon: PlaneIcon, tone: 'rust', group: 'BOOK' },
  { id: 'stays', label: 'Stay', description: 'Hotel, rental check-in details & location', Icon: BedIcon, tone: 'teal', group: 'BOOK' },
  { id: 'ticket', label: 'Ticket', description: 'Train, ticket, reservation receipt', Icon: TicketIcon, tone: 'teal', group: 'BOOK' },
  { id: 'activity', label: 'Activity', description: 'Sight, food stop, tour, or custom plan', Icon: StarIcon, tone: 'brass', group: 'PLAN' },
  { id: 'restaurant', label: 'Restaurant', description: 'Reservation, cuisine, and location', Icon: ForkKnifeIcon, tone: 'teal', group: 'PLAN' },
  { id: 'bar', label: 'Bar', description: 'Casual plan — drinks, nightlife', Icon: DrinkIcon, tone: 'brass', group: 'PLAN' },
  { id: 'transport', label: 'Transport', description: 'Taxi, transfer, or local transport', Icon: CarIcon, tone: 'rust', group: 'PLAN' },
  { id: 'sight', label: 'Sight', description: 'Museum, landmark, or attraction', Icon: LandmarkIcon, tone: 'brass', group: 'PLAN' },
  { id: 'documents', label: 'Document', description: 'Boarding passes, IDs, confirmations', Icon: FileIcon, tone: 'teal', group: 'STORE' },
  { id: 'other', label: 'Other', description: 'Anything else worth tracking', Icon: DotsCircleIcon, tone: 'rust', group: 'STORE' },
];

/** Icon + tone for one booking_items type — reused by list cards, not just the picker. */
export const BOOKING_TYPE_ICON: Record<BookingItemTypeId, { Icon: typeof PlaneIcon; tone: IconTone }> = {
  sight: { Icon: LandmarkIcon, tone: 'brass' },
  restaurant: { Icon: ForkKnifeIcon, tone: 'teal' },
  bar: { Icon: DrinkIcon, tone: 'brass' },
  transport: { Icon: CarIcon, tone: 'rust' },
  ticket: { Icon: TicketIcon, tone: 'teal' },
  activity: { Icon: StarIcon, tone: 'brass' },
  other: { Icon: DotsCircleIcon, tone: 'rust' },
};

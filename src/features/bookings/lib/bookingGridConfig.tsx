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

interface GridEntry {
  id: AddToTripDestination;
  label: string;
  Icon: typeof PlaneIcon;
  tone: IconTone;
}

export const ADD_TO_TRIP_GRID: GridEntry[] = [
  { id: 'flights', label: 'Flights', Icon: PlaneIcon, tone: 'rust' },
  { id: 'stays', label: 'Stays', Icon: BedIcon, tone: 'teal' },
  { id: 'sight', label: 'Sights', Icon: LandmarkIcon, tone: 'brass' },
  { id: 'restaurant', label: 'Restaurants', Icon: ForkKnifeIcon, tone: 'teal' },
  { id: 'bar', label: 'Bars', Icon: DrinkIcon, tone: 'brass' },
  { id: 'transport', label: 'Transport', Icon: CarIcon, tone: 'rust' },
  { id: 'ticket', label: 'Tickets', Icon: TicketIcon, tone: 'teal' },
  { id: 'activity', label: 'Activities', Icon: StarIcon, tone: 'brass' },
  { id: 'documents', label: 'Documents', Icon: FileIcon, tone: 'teal' },
  { id: 'other', label: 'Other', Icon: DotsCircleIcon, tone: 'rust' },
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

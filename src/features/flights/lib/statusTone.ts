/** Shared by FlightCard and FlightDetailView so the two never disagree on a status's badge color. */
export const FLIGHT_STATUS_TONE: Record<string, 'teal' | 'rust' | 'gray' | 'brass'> = {
  scheduled: 'teal',
  delayed: 'brass',
  cancelled: 'rust',
  landed: 'gray',
};

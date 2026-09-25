import type { Traveler } from '../../travelers/types';
import type { ItineraryStop } from '../types';

/**
 * Who a stop is assigned to, in plain language. An empty travelerIds means
 * "everyone" by default (unchanged, existing meaning) — unless
 * assignedToNobody is set (F-12), which means the opposite: this stop was
 * assigned to one specific traveler who has since been removed from the
 * trip, leaving travelerIds empty for an entirely different reason. Named
 * travelers are always listed regardless of this flag.
 */
export function stopTravelerLabel(stop: Pick<ItineraryStop, 'travelerIds' | 'assignedToNobody'>, travelers: Traveler[], everyoneLabel: string): string {
  if (stop.travelerIds.length === 0) {
    return stop.assignedToNobody ? 'No traveler assigned' : everyoneLabel;
  }
  return travelers
    .filter((t) => stop.travelerIds.includes(t.id))
    .map((t) => t.name)
    .join(', ');
}

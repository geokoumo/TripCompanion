import { useEffect, useState } from 'react';
import type { TripTab } from '../../features/trips/types';

export type Route = { name: 'home' } | { name: 'trip'; tripId: string; tab: TripTab };

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);
  if (parts[0] === 'trip' && parts[1]) {
    const tab = (parts[2] as TripTab) || 'overview';
    return { name: 'trip', tripId: parts[1], tab };
  }
  return { name: 'home' };
}

export function useHashRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: Route) => {
    const hash = next.name === 'home' ? '#/' : `#/trip/${next.tripId}/${next.tab}`;
    window.location.hash = hash;
  };

  return [route, navigate];
}

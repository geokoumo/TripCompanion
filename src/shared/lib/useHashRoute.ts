import { useEffect, useState } from 'react';
import type { TripTab } from '../../features/trips/types';

export type TopLevelTab = 'home' | 'trips' | 'search' | 'more';

export type Route =
  | { name: 'home' }
  | { name: 'trips' }
  | { name: 'search' }
  | { name: 'more' }
  | { name: 'trip'; tripId: string; tab: TripTab }
  | { name: 'shared'; token: string };

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);
  if (parts[0] === 'trip' && parts[1]) {
    const tab = (parts[2] as TripTab) || 'overview';
    return { name: 'trip', tripId: parts[1], tab };
  }
  if (parts[0] === 'shared' && parts[1]) {
    return { name: 'shared', token: parts[1] };
  }
  if (parts[0] === 'trips') {
    return { name: 'trips' };
  }
  if (parts[0] === 'search') {
    return { name: 'search' };
  }
  if (parts[0] === 'more') {
    return { name: 'more' };
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
    const hash =
      next.name === 'home'
        ? '#/'
        : next.name === 'trips'
          ? '#/trips'
          : next.name === 'search'
            ? '#/search'
            : next.name === 'more'
              ? '#/more'
              : next.name === 'shared'
                ? `#/shared/${next.token}`
                : `#/trip/${next.tripId}/${next.tab}`;
    window.location.hash = hash;
  };

  return [route, navigate];
}

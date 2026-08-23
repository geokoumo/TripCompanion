import { TripListScreen } from '../features/trips/components/TripListScreen';
import { TripDetailScreen } from '../features/trips/components/TripDetailScreen';
import { SharedTripView } from '../features/trips/components/SharedTripView';
import { useHashRoute } from '../shared/lib/useHashRoute';
import { ErrorBoundary } from './ErrorBoundary';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastProvider } from './providers/ToastProvider';
import { TripsProvider } from './providers/TripsProvider';

function Router() {
  const [route, navigate] = useHashRoute();

  if (route.name === 'shared') {
    return <SharedTripView tripId={route.tripId} onExit={() => navigate({ name: 'home' })} />;
  }

  if (route.name === 'trip') {
    return (
      <TripDetailScreen
        tripId={route.tripId}
        activeTab={route.tab}
        onTabChange={(tab) => navigate({ name: 'trip', tripId: route.tripId, tab })}
        onBack={() => navigate({ name: 'home' })}
      />
    );
  }

  return <TripListScreen onOpenTrip={(tripId) => navigate({ name: 'trip', tripId, tab: 'overview' })} />;
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TripsProvider>
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </TripsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

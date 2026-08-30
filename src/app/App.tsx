import { ResetPasswordScreen } from '../features/auth/components/ResetPasswordScreen';
import { TripListScreen } from '../features/trips/components/TripListScreen';
import { TripDetailScreen } from '../features/trips/components/TripDetailScreen';
import { SharedTripView } from '../features/trips/components/SharedTripView';
import { useHashRoute } from '../shared/lib/useHashRoute';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingScreen } from './LoadingScreen';
import { AuthProvider, useAuth } from './providers/AuthProvider';
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

// Gates the app behind the initial auth-session resolution — otherwise a
// signed-in user briefly sees a signed-out shell (and, once the repository
// switch lands, could even glimpse the other data source) before the real
// session is known.
function AuthGatedApp() {
  const { loading, recoveryMode } = useAuth();

  if (loading) return <LoadingScreen />;
  if (recoveryMode) return <ResetPasswordScreen />;

  return (
    <TripsProvider>
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
    </TripsProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthGatedApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

import { useState } from 'react';
import { AccountScreen } from '../features/auth/components/AccountScreen';
import { ResetPasswordScreen } from '../features/auth/components/ResetPasswordScreen';
import { SignInGateScreen } from '../features/auth/components/SignInGateScreen';
import { SearchScreen } from '../features/search/components/SearchScreen';
import { TripListScreen } from '../features/trips/components/TripListScreen';
import { TripDetailScreen } from '../features/trips/components/TripDetailScreen';
import { SharedTripView } from '../features/trips/components/SharedTripView';
import { CreateTripWizard } from '../features/trips/components/CreateTripWizard';
import { useHashRoute, type Route } from '../shared/lib/useHashRoute';
import { BottomNav } from './BottomNav';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingScreen } from './LoadingScreen';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastProvider } from './providers/ToastProvider';
import { TripsProvider } from './providers/TripsProvider';

const TOP_LEVEL_ROUTES = new Set(['home', 'search', 'account']);

function Router({ route, navigate }: { route: Route; navigate: (route: Route) => void }) {
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

  if (route.name === 'search') {
    return <SearchScreen onOpenTrip={(tripId, tab) => navigate({ name: 'trip', tripId, tab })} />;
  }

  if (route.name === 'account') {
    return <AccountScreen />;
  }

  return <TripListScreen onOpenTrip={(tripId, tab) => navigate({ name: 'trip', tripId, tab: tab ?? 'overview' })} />;
}

// Gates the app behind the initial auth-session resolution — otherwise a
// signed-in user briefly sees a signed-out shell (and, once the repository
// switch lands, could even glimpse the other data source) before the real
// session is known.
function AuthGatedApp() {
  const { loading, recoveryMode, enabled, user } = useAuth();
  const [route, navigate] = useHashRoute();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (loading) return <LoadingScreen />;
  if (recoveryMode) return <ResetPasswordScreen />;
  // Accounts are configured but nobody's signed in — the app itself is
  // behind sign-in now, not just an optional data-source switch. (When
  // accounts aren't configured at all, `enabled` is false and the app keeps
  // working local-only, same as before.)
  if (enabled && !user) return <SignInGateScreen />;

  // The bottom nav is the app-shell's primary navigation across the three
  // top-level sections; a trip's own detail screen already has its back
  // link and in-trip tab bar, so the shell nav stays out of its way there.
  const showBottomNav = TOP_LEVEL_ROUTES.has(route.name);

  return (
    <TripsProvider>
      <ErrorBoundary>
        <div style={{ paddingBottom: showBottomNav ? 'calc(64px + env(safe-area-inset-bottom, 0px))' : 0 }}>
          <Router route={route} navigate={navigate} />
        </div>

        {showBottomNav && (
          <BottomNav
            active={route.name === 'search' || route.name === 'account' ? route.name : 'home'}
            onNavigate={(name) => navigate({ name })}
            onCreateTrip={() => setWizardOpen(true)}
          />
        )}

        {wizardOpen && (
          <CreateTripWizard
            onClose={() => setWizardOpen(false)}
            onCreated={(tripId) => {
              setWizardOpen(false);
              navigate({ name: 'trip', tripId, tab: 'overview' });
            }}
          />
        )}
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

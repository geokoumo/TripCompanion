import { Suspense, useState } from 'react';
import { useGuestGate } from '../features/auth/lib/useGuestGate';
import { useLocalTripsImportPrompt } from '../features/auth/lib/localImportPrompt';
import { LocalTripsImportPrompt } from '../features/auth/components/LocalTripsImportPrompt';
import { OnboardingFlow } from '../features/auth/components/OnboardingFlow';
import { ResetPasswordScreen } from '../features/auth/components/ResetPasswordScreen';
import { TripListScreen } from '../features/trips/components/TripListScreen';
import { TripDetailScreen } from '../features/trips/components/TripDetailScreen';
import { useHashRoute, type Route } from '../shared/lib/useHashRoute';
import { BottomNav } from './BottomNav';
import { ErrorBoundary } from './ErrorBoundary';
import { CreateTripWizardLazy, SearchScreenLazy, SettingsScreenLazy, SharedTripViewLazy } from './lazyScreens';
import { LoadingScreen } from './LoadingScreen';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { ScreenLoadingFallback } from './ScreenLoadingFallback';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastProvider } from './providers/ToastProvider';
import { TripsProvider } from './providers/TripsProvider';

const TOP_LEVEL_ROUTES = new Set(['home', 'search']);

function Router({ route, navigate }: { route: Route; navigate: (route: Route) => void }) {
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
    return <SearchScreenLazy onOpenTrip={(tripId, tab) => navigate({ name: 'trip', tripId, tab })} />;
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { continuingLocally, setContinuingLocally } = useGuestGate(user);
  const { localTrips, dismiss: dismissLocalTripsPrompt } = useLocalTripsImportPrompt(!!user);

  if (loading) return <LoadingScreen />;
  if (recoveryMode) return <ResetPasswordScreen />;
  // A shared link is meant for anyone who has it, signed in or not — it
  // must never sit behind the sign-in/"continue without an account" wall
  // below, which is a real barrier for a recipient with no interest in
  // creating an account. Resolved via the anonymous get_shared_trip RPC
  // (see data/repository/sharedTrip.ts), not the signed-in trip repository,
  // so it needs neither TripsProvider nor a sign-in decision to render.
  if (route.name === 'shared') {
    return (
      <Suspense fallback={<ScreenLoadingFallback />}>
        <SharedTripViewLazy token={route.token} onExit={() => navigate({ name: 'home' })} />
      </Suspense>
    );
  }
  // Accounts are configured and nobody's signed in — always show sign-in
  // first. "Continue without an account" only bypasses it for the current
  // session; reloading the app checks the login state again from scratch.
  if (enabled && !user && !continuingLocally) {
    return <OnboardingFlow onContinueLocally={() => setContinuingLocally(true)} />;
  }

  // The bottom nav is the app-shell's primary navigation across the three
  // top-level sections; a trip's own detail screen already has its back
  // link and in-trip tab bar, so the shell nav stays out of its way there.
  const showBottomNav = TOP_LEVEL_ROUTES.has(route.name);

  return (
    <TripsProvider>
      <ErrorBoundary>
        <div style={{ paddingBottom: showBottomNav ? 'calc(64px + env(safe-area-inset-bottom, 0px))' : 0 }}>
          <Suspense fallback={<ScreenLoadingFallback />}>
            <Router route={route} navigate={navigate} />
          </Suspense>
        </div>

        {showBottomNav && (
          <BottomNav
            active={route.name === 'search' ? 'search' : 'home'}
            onNavigate={(name) => navigate({ name })}
            onCreateTrip={() => setWizardOpen(true)}
            settingsActive={settingsOpen}
            onSettingsTap={() => setSettingsOpen(true)}
          />
        )}

        {wizardOpen && (
          <Suspense fallback={<ScreenLoadingFallback />}>
            <CreateTripWizardLazy
              onClose={() => setWizardOpen(false)}
              onCreated={(tripId) => {
                setWizardOpen(false);
                navigate({ name: 'trip', tripId, tab: 'overview' });
              }}
            />
          </Suspense>
        )}

        {settingsOpen && (
          <Suspense fallback={<ScreenLoadingFallback />}>
            <SettingsScreenLazy onClose={() => setSettingsOpen(false)} />
          </Suspense>
        )}

        {localTrips && <LocalTripsImportPrompt localTrips={localTrips} onClose={dismissLocalTripsPrompt} />}
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

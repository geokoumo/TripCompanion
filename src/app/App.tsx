import { Suspense, useState } from 'react';
import { useGuestGate } from '../features/auth/lib/useGuestGate';
import { useLocalTripsImportPrompt } from '../features/auth/lib/localImportPrompt';
import { LocalTripsImportPrompt } from '../features/auth/components/LocalTripsImportPrompt';
import { OnboardingFlow } from '../features/auth/components/OnboardingFlow';
import { ResetPasswordScreen } from '../features/auth/components/ResetPasswordScreen';
import { TripListScreen } from '../features/trips/components/TripListScreen';
import { TripDetailScreen } from '../features/trips/components/TripDetailScreen';
import { HomeDashboard } from '../features/trips/components/HomeDashboard';
import { useHashRoute, type Route, type TopLevelTab } from '../shared/lib/useHashRoute';
import { BottomNav } from './BottomNav';
import { ErrorBoundary } from './ErrorBoundary';
import { CreateTripWizardLazy, SearchScreenLazy, SettingsScreenLazy, SharedTripViewLazy } from './lazyScreens';
import { LoadingScreen } from './LoadingScreen';
import { MoreScreen } from './MoreScreen';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { ScreenLoadingFallback } from './ScreenLoadingFallback';
import { Sidebar } from './Sidebar';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastProvider } from './providers/ToastProvider';
import { TripsProvider } from './providers/TripsProvider';
import styles from './App.module.css';

const TOP_LEVEL_ROUTES = new Set(['home', 'trips', 'search', 'more']);

function Router({ route, navigate, onCreateTrip, onOpenSettings }: { route: Route; navigate: (route: Route) => void; onCreateTrip: () => void; onOpenSettings: () => void }) {
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

  if (route.name === 'trips') {
    return <TripListScreen onOpenTrip={(tripId, tab) => navigate({ name: 'trip', tripId, tab: tab ?? 'overview' })} />;
  }

  if (route.name === 'search') {
    return <SearchScreenLazy onOpenTrip={(tripId, tab) => navigate({ name: 'trip', tripId, tab })} />;
  }

  if (route.name === 'more') {
    return <MoreScreen onOpenSearch={() => navigate({ name: 'search' })} onOpenSettings={onOpenSettings} />;
  }

  return (
    <HomeDashboard
      onOpenTrip={(tripId, tab) => navigate({ name: 'trip', tripId, tab: tab ?? 'overview' })}
      onSeeAllTrips={() => navigate({ name: 'trips' })}
      onCreateTrip={onCreateTrip}
      onOpenSettings={onOpenSettings}
    />
  );
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

  // The bottom nav/sidebar are the app-shell's primary navigation across
  // the top-level sections; a trip's own detail screen already has its
  // back link and in-trip tab bar, so the shell nav stays out of its way
  // there (though the sidebar itself is always visible at desktop).
  const showBottomNav = TOP_LEVEL_ROUTES.has(route.name);
  const activeTab: TopLevelTab = route.name === 'trip' ? 'home' : route.name;

  return (
    <TripsProvider>
      <ErrorBoundary>
        <Sidebar active={activeTab} onNavigate={navigate} onCreateTrip={() => setWizardOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />

        <div className={styles.content} style={{ paddingBottom: showBottomNav ? 'var(--bottom-nav-clearance)' : 0 }}>
          <Suspense fallback={<ScreenLoadingFallback />}>
            <Router route={route} navigate={navigate} onCreateTrip={() => setWizardOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
          </Suspense>
        </div>

        {showBottomNav && <BottomNav active={activeTab} onNavigate={navigate} onCreateTrip={() => setWizardOpen(true)} />}

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

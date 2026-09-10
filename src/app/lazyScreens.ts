import { lazy } from 'react';

/**
 * Centralized React.lazy() wrappers for screens a user doesn't need in the
 * first few seconds of opening the app. Each is imported from every call
 * site that renders it (some of these have more than one) instead of each
 * site declaring its own lazy() — same underlying chunk either way, but
 * this keeps it to one lazy-loading boundary per component to reason about.
 */
export const CreateTripWizardLazy = lazy(() =>
  import('../features/trips/components/CreateTripWizard').then((m) => ({ default: m.CreateTripWizard })),
);

export const DocumentsListScreenLazy = lazy(() =>
  import('../features/documents/components/DocumentsListScreen').then((m) => ({ default: m.DocumentsListScreen })),
);

export const SearchScreenLazy = lazy(() =>
  import('../features/search/components/SearchScreen').then((m) => ({ default: m.SearchScreen })),
);

export const SettingsScreenLazy = lazy(() =>
  import('../features/settings/components/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);

export const ShareSheetLazy = lazy(() =>
  import('../features/trips/components/ShareSheet').then((m) => ({ default: m.ShareSheet })),
);

export const SharedTripViewLazy = lazy(() =>
  import('../features/trips/components/SharedTripView').then((m) => ({ default: m.SharedTripView })),
);

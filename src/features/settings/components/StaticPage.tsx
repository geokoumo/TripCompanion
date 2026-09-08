import styles from './SettingsScreen.module.css';

export const STATIC_PAGE_CONTENT = {
  help: {
    title: 'Help & Support',
    body: `Create a trip, then add flights, stays, an itinerary, a budget and a packing list from its tabs. Everything stays on this device unless you create an account to sync across devices.

Need something this page doesn't cover? This is placeholder copy for now — a real support contact will replace it in a later round.`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `This is placeholder copy — Trip Companion's real privacy policy will replace it in a later round.

In short: your trip data lives on your own device by default. Creating an account syncs it to your own private storage, protected by row-level security — nobody else can read another account's trips or documents.`,
  },
  terms: {
    title: 'Terms of Service',
    body: `This is placeholder copy — Trip Companion's real terms of service will replace it in a later round.

Trip Companion is provided as-is, for personal trip planning. You're responsible for the accuracy of the travel details you enter.`,
  },
} as const;

interface StaticPageProps {
  page: keyof typeof STATIC_PAGE_CONTENT;
}

/** Help & Support / Privacy Policy / Terms of Service — structurally real pages with placeholder copy, per the round's spec. */
export function StaticPage({ page }: StaticPageProps) {
  return (
    <div className={styles.staticBody}>
      {STATIC_PAGE_CONTENT[page].body.split('\n\n').map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

import styles from './SettingsScreen.module.css';

export const STATIC_PAGE_CONTENT = {
  help: {
    title: 'Help & Support',
    body: `Create a trip, then add flights, stays, an itinerary, a budget and a packing list from its tabs. Everything stays on this device unless you create an account to sync across devices.

Need something this page doesn't cover? This is placeholder copy for now — a real support contact will replace it in a later round.`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `!NOTICE! DRAFT — not yet reviewed by a lawyer. This describes what the app actually does today, as accurately as we can make it, but it has not been through legal or business review and must not be published or relied on as-is. See the "Needs review before launch" section at the end for what's still open.

Last updated: not yet published.

## What this covers

This policy covers TripCompanion, an app for planning a trip — flights, stays, an itinerary, a shared budget, a packing list, and travel documents — either only on your own device, or synced to an account you create.

## Information we collect

Account information: if you create an account, we collect the email address and password you sign up with, and, if you provide one, a display name. Your password is never stored by us in readable form — our authentication provider (Supabase Auth) stores only a salted hash of it.

Trip content: everything you enter about a trip — titles, dates, destinations, traveler names, flights, stays, itinerary stops, expenses, packing items, notes, and any documents you upload (boarding passes, confirmations, tickets, and similar). We collect only what you choose to enter; there is no separate tracking of your real-world location or travel.

Technical information: standard information our hosting and authentication providers see in order to serve requests at all — IP address, browser type, and request timestamps — for as long as those providers' own infrastructure logs require, not something we separately collect or query ourselves.

## Information we do not collect

We do not run analytics, advertising, or behavioral tracking of any kind — no Google Analytics, no ad pixels, no session-replay tools. We do not sell or rent personal information to anyone. The app sets no cookies; a signed-in session is kept in your browser's local storage, not a cookie.

## Where your data lives

Without an account, everything you enter stays only in your browser's local storage on that device — we never see it, and it is not backed up anywhere by us. Uninstalling the app, clearing site data, or switching devices loses it, with no way for us to recover it.

With an account, your trip data and uploaded documents are stored with our backend provider, Supabase, in a database and file storage scoped to your account, protected by row-level security rules that only your own signed-in account can query — enforced by the database itself, not just by the app's own code. We have not yet confirmed and published which region Supabase hosts this project's data in; see the review notes below.

## Third parties

Supabase provides authentication, database, and file storage for signed-in accounts, and necessarily processes the data described above to do that. Google Fonts serves this app's typefaces from Google's own servers, which — as a normal side effect of loading a web font — receives the requesting device's IP address. We do not otherwise embed third-party scripts, trackers, or advertising.

## Sharing a trip

Turning on sharing for a trip creates a read-only link containing a long random token. Anyone with that exact link can view the tabs you chose to include; the link is not discoverable or listed anywhere, and turning sharing off invalidates it. Uploaded documents are never included in a shared link, regardless of which tabs are shared.

## Your choices

You can delete an individual trip at any time, which removes that trip's data, including its uploaded documents, from our systems. You can sign out at any time, which does not delete your account or data. Self-service full account deletion isn't built yet — see the review notes below for what that will take.

## Children

TripCompanion isn't directed at children, and we don't knowingly collect information from anyone under the age of 16. If you believe a child has created an account, contact us and we'll delete it.

## Changes to this policy

If this policy changes in a way that matters, we'll update the "last updated" date above and, once we have a way to reach account holders directly, tell people who have an account.

## Needs review before launch

This section is here on purpose and should be deleted once every item is actually resolved — not just once the policy reads well.

Who "we" is: this document doesn't yet name a legal entity, business address, or contact email/method for privacy requests — all required in most jurisdictions before this can be published.

Legal basis and jurisdiction: which privacy law(s) this needs to satisfy (GDPR, CCPA/CPRA, or others) depends on where users actually are, which decides consent language, a lawful-basis statement, and user-rights language (access/correction/deletion/portability) that isn't fully written yet.

Supabase's own region and subprocessors: which data-center region this project's Supabase instance runs in, and Supabase's own subprocessor list, need to be confirmed and named here specifically — "our backend provider" isn't enough for a real policy.

Google Fonts: self-hosting the four font families this app uses instead of loading them from Google's CDN would remove the IP-sharing concern named above entirely, and is the more conservative choice for GDPR (a German court has held that loading Google Fonts from Google's own servers without consent violates GDPR) — recommended before launch in any EU-facing market, as an alternative to only disclosing it here.

Account deletion: there's currently no self-service "delete my account" action — only individual-trip deletion. Supabase doesn't allow a user to delete their own auth account from the client app directly; that needs either a small server-side function using a service-role key (never exposed to the browser) or a documented manual process (e.g., "email us"). Either way, it needs to exist and be described accurately here before this policy can promise it.

Backups and retention: how long Supabase (or any backup of this project) might retain data after a trip or account is deleted isn't something this document can currently state accurately.`,
  },
  terms: {
    title: 'Terms of Service',
    body: `!NOTICE! DRAFT — not yet reviewed by a lawyer. These terms describe intended behavior, not a finished legal agreement, and must not be published or relied on as-is. See the "Needs review before launch" section at the end.

Last updated: not yet published.

## Using TripCompanion

TripCompanion is a tool for planning your own trips — itinerary, bookings, budget, packing, and travel documents. You may use it without an account, in which case your data stays only on your device, or with an account, which syncs your data to your own private storage.

## Your account

You're responsible for keeping your password confidential and for anything done through your account. Tell us as soon as possible if you believe your account has been accessed without your permission.

## Your content

You keep ownership of everything you enter or upload — trip details, notes, and documents. By using the app, you give us only the limited permission needed to store and display that content back to you (and to anyone you deliberately share a trip with), nothing broader.

You're responsible for the accuracy of the travel details you enter, and for having the right to upload any document you attach — don't upload someone else's confidential documents without their permission.

## Sharing a trip

If you turn on sharing, you're choosing to make the tabs you select viewable, read-only, by anyone who has the link — including anyone you forward it to, intentionally or not. Turn sharing off at any time to invalidate the link.

## Acceptable use

Don't use TripCompanion to store or share unlawful content, to attempt to access another account's data, or to interfere with the service's normal operation (for example, automated abuse of the sign-up or storage systems).

## No warranty

TripCompanion is provided "as is." We don't guarantee it will be uninterrupted, error-free, or that your data will never be lost, and you should keep your own copy of anything irreplaceable (the app's export/download options exist for this). This is standard, expected language for a tool at this stage — not a statement that we take data loss lightly.

## Limitation of liability

To the fullest extent the law allows, TripCompanion and its creators aren't liable for indirect, incidental, or consequential damages arising from your use of the app — including a missed flight, an inaccurate itinerary, or lost trip data. [Placeholder — the specific liability cap and any carve-outs need a lawyer's input, not ours.]

## Ending your access

You can stop using the app and delete your trips at any time. We may suspend or end an account that violates the acceptable-use section above.

## Changes to these terms

If these terms change in a way that matters, we'll update the "last updated" date above and, once we have a way to reach account holders directly, tell people who have an account.

## Needs review before launch

This section is here on purpose and should be deleted once every item is actually resolved.

Governing law and dispute resolution: no governing-law clause, arbitration/dispute-resolution process, or venue is specified yet — this needs a business decision (where the company is based, or where it wants disputes handled) before a lawyer can finalize it.

Liability cap: the limitation-of-liability section above is intentionally generic placeholder language, not a reviewed legal clause — the actual cap, and whether any carve-outs are needed (e.g., for gross negligence, where many jurisdictions won't allow a full waiver), needs a lawyer.

Age requirement: these terms don't yet state a minimum age to create an account — needs a decision consistent with the Privacy Policy's children's-privacy section.

Company identity: like the Privacy Policy, this document needs the actual legal entity name, business address, and jurisdiction of incorporation before it can be published as a binding agreement.

Payment/subscription terms: not included because the app has no paid tier today — add a section here the moment one exists, rather than retrofitting it after launch.`,
  },
} as const;

interface StaticPageProps {
  page: keyof typeof STATIC_PAGE_CONTENT;
}

/**
 * Help & Support / Privacy Policy / Terms of Service. Body text supports two
 * lightweight conventions on top of plain blank-line-separated paragraphs:
 * a line starting with "## " renders as a section heading, and one starting
 * with "!NOTICE! " renders as a highlighted callout (used for the draft/
 * legal-review notice at the top of Privacy/Terms — never for ordinary body
 * text, so it stays rare enough to actually draw the eye).
 */
export function StaticPage({ page }: StaticPageProps) {
  return (
    <div className={styles.staticBody}>
      {STATIC_PAGE_CONTENT[page].body.split('\n\n').map((paragraph, i) => {
        if (paragraph.startsWith('## ')) {
          return (
            <h3 key={i} className={styles.staticHeading}>
              {paragraph.slice(3)}
            </h3>
          );
        }
        if (paragraph.startsWith('!NOTICE! ')) {
          return (
            <p key={i} className={styles.staticNotice}>
              {paragraph.slice(9)}
            </p>
          );
        }
        return <p key={i}>{paragraph}</p>;
      })}
    </div>
  );
}

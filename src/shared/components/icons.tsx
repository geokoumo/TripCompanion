import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function base({ size = 20, ...rest }: IconProps) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...rest };
}

/** Trip-header hero glyph — a safe, single default icon (not varied by status). */
export function CompassIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2l-2 5.6-5.6 2 2-5.6z" />
    </svg>
  );
}

export function PlaneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 13.5l7.5-2.2L15.5 3l2 .8-2.6 8.6 5.6-1 1 1.6-6.2 3-1.3 5.5-1.8-.6.4-5-5.8 1.8z" />
    </svg>
  );
}

export function BedIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
      <path d="M3 18v2M21 18v2" />
      <path d="M3 13v-2a2 2 0 0 1 2-2h5v4" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6.5" width="18" height="12.5" rx="2.5" />
      <path d="M3 10.5h18" />
      <circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 6.2c1.3.4 2.2 1.6 2.2 2.9s-.9 2.5-2.2 2.9" />
      <path d="M15.5 14c2.4.3 4.5 2.1 4.5 4.6" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M19.5 19.5l-4.3-4.3" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c0-3.6 3.4-6.2 7.5-6.2s7.5 2.6 7.5 6.2" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

/** Welcome screen's brand mark. */
export function TriangleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5l8 14H4z" />
    </svg>
  );
}

/** Welcome screen's "Plan" feature icon. */
export function ListIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Welcome screen's "Log" feature icon. */
export function TargetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Welcome screen's "Enjoy" feature icon. */
export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l1.8 5.6L19.5 10l-5.7 1.4L12 17l-1.8-5.6L4.5 10l5.7-1.4z" />
    </svg>
  );
}

/** In-trip bottom nav's "Bookings" tab (merged flights + stays). */
export function TicketIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 9.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.2a1.7 1.7 0 0 0 0 2.6v1.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.2a1.7 1.7 0 0 0 0-2.6z" />
      <path d="M9.5 7.5v9" strokeDasharray="1.8 2.2" />
    </svg>
  );
}

/** In-trip bottom nav's "Packing" tab. */
export function BackpackIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      <path d="M6 8h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" />
      <path d="M9 12h6M10 8v3M14 8v3" />
    </svg>
  );
}

/** "Add to trip" picker + Sights list — a temple/landmark silhouette. */
export function LandmarkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l8 4.5H4z" />
      <path d="M5 8.5v9M9.5 8.5v9M14.5 8.5v9M19 8.5v9" />
      <path d="M3.5 20.5h17" />
    </svg>
  );
}

/** "Add to trip" picker + Restaurants list — fork and knife. */
export function ForkKnifeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3v7a2 2 0 0 0 4 0V3M9 10v11" />
      <path d="M16 3c-1.2 0-2 1.5-2 4s.8 4 2 4v10" />
    </svg>
  );
}

/** "Add to trip" picker + Bars & Nightlife list — a martini glass. */
export function DrinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4h16l-8 9z" />
      <path d="M12 13v7M8 20h8" />
    </svg>
  );
}

/** "Add to trip" picker + Transport list — a car. */
export function CarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 16V11.5l2-4.5h12l2 4.5V16" />
      <path d="M4 16a1.3 1.3 0 0 0 1.3 1.3H6a1.3 1.3 0 0 0 1.3-1.3M16.7 16A1.3 1.3 0 0 0 18 17.3h.7A1.3 1.3 0 0 0 20 16" />
      <path d="M4 13h16" />
      <circle cx="7.5" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** "Add to trip" picker + Activities list — a compass-star for "things to do". */
export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4l2.2 5.8L20 12l-5.8 2.2L12 20l-2.2-5.8L4 12l5.8-2.2z" />
    </svg>
  );
}

/** Settings entry point — a gear. */
export function GearIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M17.7 6.3l-1.7 1.7M8 16l-1.7 1.7M17.7 17.7L16 16M8 8L6.3 6.3" />
    </svg>
  );
}

/** "Add to trip" picker's "Other" tile, and generic misc/more affordances. */
export function DotsCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="8" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Documents list/detail — a file/page glyph. */
export function FileIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3.5h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z" />
      <path d="M14 3.5v4h4" />
      <path d="M8 12.5h8M8 16h8" />
    </svg>
  );
}

/** A small QR-code glyph for document previews and the "View QR" action. */
export function QrIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
      <path d="M14 14h3v3h-3zM20.5 14v3M17 20.5h3.5" />
    </svg>
  );
}

/** Download action (documents, exports). */
export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5v11.5M8 11.5l4 4 4-4" />
      <path d="M4.5 17v2.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V17" />
    </svg>
  );
}

/** Share-outside-the-app action (native share sheet), distinct from the app's own trip-sharing icon. */
export function ShareExternalIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="18" cy="5.5" r="2.3" />
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="18" cy="18.5" r="2.3" />
      <path d="M8.1 10.8l7.8-4.4M8.1 13.2l7.8 4.4" />
    </svg>
  );
}

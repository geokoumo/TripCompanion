import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

type AccentTone = 'rust' | 'teal' | 'brass' | 'purple' | 'gray';

interface CardOwnProps {
  children: ReactNode;
  /** Left accent stripe indicating category/type/status — omit for a plain card. */
  accent?: AccentTone;
  /** Dims the card (e.g. a cancelled flight) without hiding its content. */
  muted?: boolean;
  className?: string;
}

type CardAsButtonProps = CardOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CardOwnProps> & {
    /** Presence of onClick makes this a real, keyboard-operable button — never a div with a click handler. */
    onClick: () => void;
    /**
     * Set when the card's content contains its OWN interactive element
     * (e.g. a secondary "···" menu button) — real `<button>` cannot contain
     * another `<button>`, so this renders a `role="button"` div with the
     * same keyboard behavior (Enter/Space activates) instead.
     */
    nestedInteractive?: boolean;
  };

type CardAsStaticProps = CardOwnProps & Omit<HTMLAttributes<HTMLDivElement>, keyof CardOwnProps> & { onClick?: undefined };

type CardProps = CardAsButtonProps | CardAsStaticProps;

/**
 * The one card surface (background/border/radius/padding/accent) shared by
 * every list row in the app — trips, stays, flights, itinerary stops,
 * booking items, documents. Each caller keeps its own internal content
 * layout; this only owns the outer surface, so it never fights the real
 * structural differences between a two-line document row and a multi-field
 * flight summary.
 *
 * Renders a real `<button>` whenever `onClick` is given, so every
 * interactive card is keyboard-focusable and screen-reader-announced as a
 * button — never a `<div onClick>`. Use `nestedInteractive` for the one
 * real exception: a card that also contains its own secondary button.
 */
export function Card({ children, accent, muted = false, className, onClick, ...rest }: CardProps) {
  const combinedClassName = className ? `${styles.card} ${className}` : styles.card;

  if (onClick && !('nestedInteractive' in rest && rest.nestedInteractive)) {
    return (
      <button
        type="button"
        className={combinedClassName}
        data-accent={accent}
        data-muted={muted}
        data-interactive="true"
        onClick={onClick}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }

  if (onClick) {
    const { nestedInteractive: _nestedInteractive, ...divRest } = rest as CardAsButtonProps;
    return (
      <div
        className={combinedClassName}
        data-accent={accent}
        data-muted={muted}
        data-interactive="true"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        {...(divRest as HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={combinedClassName} data-accent={accent} data-muted={muted} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {children}
    </div>
  );
}

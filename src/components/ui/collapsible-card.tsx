import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/** Native disclosure, with children kept mounted to preserve study state. */
export function CollapsibleCard({
  title,
  description,
  leading,
  id,
  className = '',
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  leading?: ReactNode;
  id?: string;
  className?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    // Fragment navigation may open native details before hydration. Accept that
    // attribute state; React still checks the summary and body descendants.
    <details
      className={`card collapsible-card ${className}`}
      id={id}
      open={defaultOpen}
      suppressHydrationWarning
    >
      <summary className="collapsible-card-summary">
        <h2 className="collapsible-card-heading">
          {leading}
          <span className="collapsible-card-label">
            <span>{title}</span>
            {description && <span className="collapsible-card-description">{description}</span>}
          </span>
          <ChevronDown className="collapsible-card-chevron" size={20} aria-hidden="true" />
        </h2>
      </summary>
      <div className="collapsible-card-body">{children}</div>
    </details>
  );
}

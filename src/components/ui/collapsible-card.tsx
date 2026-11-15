import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/** Native disclosure: closed initially, with children kept mounted to preserve study state. */
export function CollapsibleCard({
  title,
  description,
  leading,
  id,
  className = '',
  children,
}: {
  title: string;
  description?: string;
  leading?: ReactNode;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details className={`card collapsible-card ${className}`} id={id}>
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

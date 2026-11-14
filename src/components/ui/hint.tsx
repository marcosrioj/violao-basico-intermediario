'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, X } from 'lucide-react';

/** Optional interface help. Keep course content, field labels and errors outside this component. */
export function Hint({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  function close(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!open) return;
    const popup = panel.current;
    const button = trigger.current;
    if (!popup || !button) return;

    // Also close other hints in browsers without the native Popover API.
    document.dispatchEvent(new Event('violao:hint-open'));
    const dismiss = () => setOpen(false);
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'closed') dismiss();
    };
    const isInside = (target: EventTarget | null) =>
      target instanceof Node && (popup.contains(target) || button.contains(target));
    const onOutside = (event: Event) => {
      if (!isInside(event.target)) dismiss();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      dismiss();
      button.focus({ preventScroll: true });
    };
    const position = () => {
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft ?? 0;
      const top = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const gap = 8;
      popup.style.maxWidth = `${Math.max(0, width - gap * 2)}px`;
      popup.style.maxHeight = `${Math.max(0, height - gap * 2)}px`;
      const anchor = button.getBoundingClientRect();
      const bounds = popup.getBoundingClientRect();
      const x = Math.max(left + gap, Math.min(anchor.left, left + width - bounds.width - gap));
      const below = anchor.bottom + gap;
      const y =
        below + bounds.height <= top + height - gap ? below : anchor.top - bounds.height - gap;
      popup.style.left = `${x}px`;
      popup.style.top = `${Math.max(top + gap, Math.min(y, top + height - bounds.height - gap))}px`;
    };

    popup.addEventListener('toggle', onToggle);
    if (typeof popup.showPopover === 'function') {
      // Older DOM typings omit the optional source; browsers that lack it ignore the argument.
      if (!popup.matches(':popover-open'))
        Reflect.apply(popup.showPopover, popup, [{ source: button }]);
    } else popup.removeAttribute('popover');
    position();
    let resizeFrame: number | null = null;
    let observing = true;
    const resizeObserver =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            if (!observing || resizeFrame !== null) return;
            // Details, asynchronous content and wrapping can change the open panel's height.
            resizeFrame = requestAnimationFrame(() => {
              resizeFrame = null;
              if (observing) position();
            });
          })
        : null;
    resizeObserver?.observe(popup);
    resizeObserver?.observe(button);
    popup.focus({ preventScroll: true });
    document.addEventListener('violao:hint-open', dismiss);
    document.addEventListener('pointerdown', onOutside, true);
    document.addEventListener('focusin', onOutside);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);
    return () => {
      observing = false;
      resizeObserver?.disconnect();
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      popup.removeEventListener('toggle', onToggle);
      document.removeEventListener('violao:hint-open', dismiss);
      document.removeEventListener('pointerdown', onOutside, true);
      document.removeEventListener('focusin', onOutside);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      window.visualViewport?.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('scroll', position);
    };
  }, [open]);

  return (
    <span className={`ui-hint ${className}`} data-ui-hint>
      <button
        ref={trigger}
        type="button"
        className="ui-hint-trigger"
        aria-label={`Ajuda: ${label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        popoverTarget={id}
        onClick={(event) => {
          event.preventDefault();
          if (open) close();
          else setOpen(true);
        }}
      >
        <CircleHelp size={19} aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            id={id}
            ref={panel}
            popover="auto"
            className="ui-hint-panel"
            role="dialog"
            aria-label={label}
            aria-describedby={`${id}-content`}
            tabIndex={-1}
            data-ui-hint
          >
            <div className="ui-hint-heading">
              <strong>{label}</strong>
              <button
                type="button"
                className="ui-hint-close"
                aria-label="Fechar ajuda"
                onClick={() => close()}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div id={`${id}-content`} className="ui-hint-content">
              {children}
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}

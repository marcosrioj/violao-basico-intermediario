'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

/** Native dialog provides focus containment and makes the background inert. */
export function MobileNavigation({ brand, children }: { brand: ReactNode; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const media = window.matchMedia('(min-width: 1001px)');
    const closeOnDesktop = () => {
      if (media.matches) dialog.current?.close();
    };
    media.addEventListener('change', closeOnDesktop);
    return () => {
      document.body.style.overflow = previous;
      media.removeEventListener('change', closeOnDesktop);
    };
  }, [open]);
  return (
    <>
      <header className="mobile-header">
        {brand}
        <button
          ref={trigger}
          type="button"
          className="button secondary mobile-menu-button"
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls={id}
          aria-haspopup="dialog"
          onClick={() => {
            dialog.current?.showModal();
            setOpen(true);
          }}
        >
          <Menu size={22} aria-hidden="true" />
          <span>Menu</span>
        </button>
      </header>
      <dialog
        ref={dialog}
        id={id}
        className="mobile-drawer"
        aria-label="Menu principal"
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'),
          ).filter((element) => element.getClientRects().length);
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          setOpen(false);
          if (trigger.current?.getClientRects().length) trigger.current.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            )
              dialog.current?.close();
          }
          if ((event.target as HTMLElement).closest('a')) dialog.current?.close();
        }}
      >
        <div className="mobile-drawer-heading">
          <strong>Navegação</strong>
          <button
            type="button"
            className="button secondary icon"
            aria-label="Fechar menu"
            onClick={() => dialog.current?.close()}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        {children}
        <Link className="nav-link" href="/painel">
          Minha conta
        </Link>
      </dialog>
    </>
  );
}

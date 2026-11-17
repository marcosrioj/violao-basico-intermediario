'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** A deep link can target an answer or guide inside closed disclosure panels. */
export function HashReveal() {
  const pathname = usePathname();
  useEffect(() => {
    let frame = 0;
    const reveal = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let id: string;
        try {
          id = decodeURIComponent(window.location.hash.slice(1));
        } catch {
          return;
        }
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        let parent: HTMLElement | null = target;
        while (parent) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
          parent = parent.parentElement;
        }
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href*="#"]');
      if (
        !link ||
        (link.target && link.target !== '_self') ||
        link.hasAttribute('download') ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const destination = new URL(link.href);
      if (destination.origin === window.location.origin && destination.pathname === pathname)
        window.setTimeout(reveal, 0);
    };
    document.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', reveal);
      document.removeEventListener('click', onClick);
    };
  }, [pathname]);
  return null;
}

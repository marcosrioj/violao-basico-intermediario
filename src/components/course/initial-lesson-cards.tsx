'use client';

import { useEffect } from 'react';

/** Set the initial sidebar disclosure once; resizing must not undo a user's choice. */
export function InitialLessonCards() {
  useEffect(() => {
    const card = document.getElementById('repertorio-aula');
    if (card instanceof HTMLDetailsElement && window.matchMedia('(min-width: 1001px)').matches) {
      card.open = true;
    }
  }, []);
  return null;
}

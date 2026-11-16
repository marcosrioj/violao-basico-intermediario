import { validateLyricCues, type LyricCue } from './chart-lyrics';

/**
 * Preserve personal lyrics and measured timings while refreshing unchanged legacy estimates.
 * scoreWindow identifies the original harmonic cell even after a vocal pickup moves its bounds.
 * This only resolves data in memory; it never saves or removes personal entries.
 */
export function resolveStoredLyricCues(
  raw: string | null,
  totalBeats: number,
  defaults: LyricCue[],
): LyricCue[] {
  if (!raw) return defaults;
  let saved: LyricCue[];
  try {
    saved = validateLyricCues(JSON.parse(raw), totalBeats);
  } catch {
    return defaults;
  }
  const identity = (cue: Pick<LyricCue, 'text' | 'startBeat' | 'endBeat'>) =>
    JSON.stringify([cue.text, cue.startBeat, cue.endBeat]);
  const catalog = new Map<string, LyricCue | null>();
  const add = (key: string, cue: LyricCue) => {
    // Repeated text must still identify one occurrence, never a different verse by accident.
    if (catalog.has(key) && catalog.get(key) !== cue) catalog.set(key, null);
    else catalog.set(key, cue);
  };
  for (const cue of defaults) {
    add(identity(cue), cue);
    if (cue.scoreWindow) add(identity({ text: cue.text, ...cue.scoreWindow }), cue);
  }
  const resolved = saved.map((cue) => {
    const current = catalog.get(identity(cue));
    if (!current || cue.syllables?.some((part) => part.timing === 'manual')) return cue;
    // Copy the complete new estimate. Old syllable arrays must not mask retimed phrase bounds;
    // when the catalog has no syllables, the normal preparation step will regenerate them.
    return {
      ...current,
      ...(current.scoreWindow ? { scoreWindow: { ...current.scoreWindow } } : {}),
      ...(current.chordAnchors
        ? { chordAnchors: current.chordAnchors.map((anchor) => ({ ...anchor })) }
        : {}),
      ...(current.syllables
        ? { syllables: current.syllables.map((syllable) => ({ ...syllable })) }
        : {}),
    };
  });

  // A retimed catalog phrase can overlap a neighboring personal/manual edit. Roll back only
  // that connected conflict, then check again: restoring one old boundary may meet another
  // migrated neighbor. The already-validated saved list is the terminating safe baseline.
  let changed: boolean;
  do {
    changed = false;
    for (let index = 1; index < resolved.length; index++) {
      if (resolved[index].startBeat >= resolved[index - 1].endBeat) continue;
      for (const conflict of [index - 1, index]) {
        if (resolved[conflict] === saved[conflict]) continue;
        resolved[conflict] = saved[conflict];
        changed = true;
      }
    }
  } while (changed);
  return resolved;
}

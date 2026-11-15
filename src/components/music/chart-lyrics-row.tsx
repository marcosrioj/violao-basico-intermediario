'use client';

import { Fragment, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { LyricsClock } from './chart-lyrics-clock';
import type { ProjectedLyricCue } from './chart-lyrics';

function ActiveSyllable({
  clock,
  cue,
  syllable,
  text,
}: {
  clock: LyricsClock;
  cue: number;
  syllable: number;
  text: string;
}) {
  const fill = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (fill.current) return clock.paint(fill.current, cue, syllable);
  }, [clock, cue, syllable]);
  return (
    <span className="karaoke-glyph karaoke-fill" ref={fill}>
      {text}
    </span>
  );
}

/** Keep word wrapping and syllable widths identical before, during and after singing. */
function wordsIn(cue: ProjectedLyricCue) {
  const words: { parts: { text: string; index: number }[]; space: string }[] = [];
  let parts: { text: string; index: number }[] = [];
  for (const [index, syllable] of (cue.syllables ?? []).entries()) {
    const raw = cue.text.slice(syllable.from, syllable.to);
    const text = raw.trimEnd();
    const space = raw.slice(text.length);
    parts.push({ text, index });
    if (space) {
      words.push({ parts, space });
      parts = [];
    }
  }
  if (parts.length) words.push({ parts, space: '' });
  return words;
}

/** One visible copy of the text; cumulative emphasis is limited to the current visual line. */
export function ChartLyricsRow({
  clock,
  cues,
  firstBar,
  lastBar,
}: {
  clock: LyricsClock;
  cues: ProjectedLyricCue[];
  firstBar: number;
  lastBar: number;
}) {
  const row = useRef<HTMLParagraphElement>(null);
  const snapshot = useSyncExternalStore(
    clock.subscribe,
    () => clock.rowSnapshot(firstBar, lastBar),
    () => '',
  );
  const [cueId, first, last, active] = snapshot
    ? snapshot.split(':').map(Number)
    : [-1, -1, -1, -1];
  useLayoutEffect(() => {
    const element = row.current;
    if (!element) return;
    const updateLine = () => {
      const candidates = [...element.querySelectorAll<HTMLElement>('.karaoke-syllable')];
      const completed = candidates.filter((part) => part.hasAttribute('data-completed-syllable'));
      const anchor =
        element.querySelector<HTMLElement>('[data-active-syllable]') ?? completed.at(-1);
      const top = anchor?.getBoundingClientRect().top;
      // Read layout once per boundary/resize, before writing any emphasis attributes.
      const currentLine = completed.filter(
        (part) => top !== undefined && Math.abs(part.getBoundingClientRect().top - top) < 1,
      );
      const sung = new Set(currentLine);
      candidates.forEach((part) => part.toggleAttribute('data-sung-syllable', sung.has(part)));
    };
    updateLine();
    const observer = new ResizeObserver(updateLine);
    observer.observe(element);
    return () => observer.disconnect();
  }, [snapshot]);
  const visible = cues.filter((cue) => cue.startBar <= lastBar && cue.endBar >= firstBar);
  if (!visible.length) return null;
  return (
    <p className="karaoke-text" aria-live="off" ref={row}>
      {visible.map((cue, index) => {
        return (
          <Fragment key={cue.id}>
            {index > 0 && ' '}
            {!cue.syllables?.length
              ? cue.text
              : wordsIn(cue).map((word, wordIndex) => (
                  <Fragment key={wordIndex}>
                    <span className="karaoke-word">
                      {word.parts.map((part) => {
                        const done =
                          cue.id === cueId &&
                          first >= 0 &&
                          part.index >= first &&
                          part.index <= last;
                        const singing = cue.id === cueId && active === part.index;
                        return (
                          <span
                            className="karaoke-syllable"
                            key={part.index}
                            data-active-syllable={singing || undefined}
                            data-completed-syllable={done || undefined}
                            data-text={part.text}
                          >
                            {singing ? (
                              <ActiveSyllable
                                clock={clock}
                                cue={cue.id}
                                syllable={part.index}
                                text={part.text}
                              />
                            ) : (
                              <span className="karaoke-glyph">{part.text}</span>
                            )}
                          </span>
                        );
                      })}
                    </span>
                    {word.space}
                  </Fragment>
                ))}
          </Fragment>
        );
      })}
    </p>
  );
}

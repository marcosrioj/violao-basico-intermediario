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

/** Keep complete phrases under their original chart rows; timing only changes emphasis. */
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
  const snapshot = useSyncExternalStore(
    clock.subscribe,
    () => clock.rowSnapshot(firstBar, lastBar),
    () => '',
  );
  const states = new Map(
    snapshot
      ? snapshot.split(';').map((state) => {
          const [id, first, last, active] = state.split(':').map(Number);
          return [id, { first, last, active }] as const;
        })
      : [],
  );
  const visible = cues.filter((cue) => cue.startBar <= lastBar && cue.endBar >= firstBar);
  if (!visible.length) return null;
  return (
    <p className="karaoke-text" aria-live="off">
      {visible.map((cue, index) => {
        const state = states.get(cue.id);
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
                          state !== undefined &&
                          state.first >= 0 &&
                          part.index >= state.first &&
                          part.index <= state.last;
                        const singing = state?.active === part.index;
                        return (
                          <span
                            className="karaoke-syllable"
                            key={part.index}
                            data-active-syllable={singing || undefined}
                            data-sung-syllable={done || undefined}
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

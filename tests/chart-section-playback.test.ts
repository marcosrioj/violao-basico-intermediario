import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChartSection } from '../src/components/music/chart-section';
import { buildChartGroups } from '../src/components/music/chart-layout';
import type { SongVersion } from '../src/content/types';

const chart: SongVersion = {
  key: 'D',
  meter: '4/4',
  beats_per_bar: 4,
  beat_unit: 'quarter',
  adaptations: '',
  sections: [
    { id: 'I', title: 'Introdução', bars: [{ events: [{ chord: 'D', beats: 4 }] }] },
    {
      id: 'R',
      title: 'Refrão',
      bars: [
        {
          events: [
            { chord: 'D/F#', beats: 2 },
            { chord: 'G', beats: 2 },
          ],
        },
        { events: [{ chord: 'A', beats: 4 }] },
        { meter: '2/4', beats_per_bar: 2, events: [{ chord: 'G', beats: 2 }] },
        { events: [{ chord: 'D', beats: 4 }] },
      ],
    },
  ],
  order: [
    { section: 'I', repeat: 1 },
    { section: 'R', repeat: 2 },
  ],
};
const group = buildChartGroups(chart)[2];
type Props = React.ComponentProps<typeof ChartSection>;
function render(overrides: Partial<Props> = {}) {
  return renderToStaticMarkup(
    React.createElement(ChartSection, {
      chart,
      group,
      onStart: () => {},
      onPause: () => {},
      onResume: () => {},
      onRepeat: () => {},
      bpm: 72,
      ...overrides,
    }),
  );
}
function transportButton(html: string): string {
  const button = html.match(/<button[^>]*class="[^"]*chart-start[^"]*"[\s\S]*?<\/button>/);
  assert.ok(button, 'each playable passage has its local transport button');
  return button[0];
}

test('each passage keeps its contextual action and a restart action in every playback state', () => {
  for (const [playbackState, action] of [
    ['idle', 'Tocar daqui'],
    ['playing', 'Pausar'],
    ['paused', 'Continuar'],
  ] as const) {
    const html = render({ playbackState });
    const button = transportButton(html);
    assert.ok(button.includes(`aria-label="${action}: Refrão, passagem 2"`), button);
    assert.ok(button.endsWith(`${action}</button>`), button);
    assert.equal((html.match(/class="[^"]*chart-start[^"]*"/g) ?? []).length, 1);
    assert.ok(!html.includes('Parar'), 'there is no global stop action');
    assert.ok(html.includes('aria-label="Reiniciar trecho: Refrão, passagem 2"'));
    assert.equal((html.match(/class="[^"]*chart-restart[^"]*"/g) ?? []).length, 1);
    assert.ok(html.includes('aria-label="Repetir trecho: Refrão, passagem 2"'));
  }
});

test('an unavailable pause or resume handler leaves the passage start action operable', () => {
  for (const props of [
    { playbackState: 'playing' as const, onPause: undefined },
    { playbackState: 'paused' as const, onResume: undefined },
  ]) {
    const button = transportButton(render(props));
    assert.ok(button.includes('aria-label="Tocar daqui: Refrão, passagem 2"'));
    assert.ok(!button.includes('disabled'), 'a start handler is available');
  }
});

test('reference controls keep stable lesson anchors and omit an invented passage number', () => {
  for (const [playbackState, action] of [
    ['idle', 'Tocar daqui'],
    ['playing', 'Pausar'],
    ['paused', 'Continuar'],
  ] as const) {
    const html = render({ reference: true, playbackState });
    assert.ok(html.includes('id="section-R"'));
    for (let index = 0; index < group.bars.length; index++)
      assert.ok(html.includes(`id="bar-R-${index}"`));
    const button = transportButton(html);
    assert.ok(button.includes(`aria-label="${action}: Refrão"`), button);
    assert.ok(!button.includes('passagem'));
    assert.ok(html.includes('aria-label="Reiniciar trecho: Refrão"'));
  }
});

test('changing the local action preserves every bar, chord and responsive row boundary', () => {
  for (const maxBars of [1, 2, 4]) {
    const rows = (html: string) => html.slice(html.indexOf('<div class="chart-rows">'));
    const idleRows = rows(render({ maxBars, playbackState: 'idle' }));
    for (const playbackState of ['playing', 'paused'] as const)
      assert.equal(rows(render({ maxBars, playbackState })), idleRows);
    assert.equal((idleRows.match(/class="chart-bar"/g) ?? []).length, 4);
    assert.equal((idleRows.match(/class="chart-event"/g) ?? []).length, 5);
    assert.equal((idleRows.match(/class="chart-row"/g) ?? []).length, maxBars === 1 ? 4 : 3);
    assert.ok(idleRows.includes('<span class="chart-meter">2/4</span>'));
    assert.ok(idleRows.includes('D<wbr/>/F#'), 'slash bass remains part of the existing chord');
  }
});

test('a paused current bar keeps its musical position visible without changing its content', () => {
  const position = group.bars[1].playbackIndex;
  const playing = render({ position, playbackState: 'playing', onPreview: () => {} });
  const paused = render({ position, playbackState: 'paused', onPreview: () => {} });
  for (const html of [playing, paused]) {
    assert.equal((html.match(/aria-current="step"/g) ?? []).length, 1);
    assert.ok(html.includes('Compasso R2, 4/4: A, 4 pulsos. Ouvir primeiro acorde.'));
  }
  assert.ok(playing.includes('<span class="chart-playing">Tocando</span>'));
  assert.ok(paused.includes('<span class="chart-playing">Pausado</span>'));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import rawCourse from '../src/content/course-data.json';
import research from '../src/content/tempo-research.json';
import { songs, lessons } from '../src/content/course';
import {
  defaultPlaybackBpm,
  formatBpm,
  referenceBpm,
  type TempoResearch,
} from '../src/content/tempo';
import { scheduleChartBar, scheduleChartMetronome } from '../src/components/music/chart-timing';

test('every exact recording has a dated, sourced tempo review without changing the syllabus', () => {
  assert.deepEqual(Object.keys(research).sort(), Object.keys(rawCourse.songs).sort());
  assert.deepEqual(lessons, rawCourse.lessons);
  for (const [id, song] of Object.entries(songs)) {
    const tempo = song.tempo!;
    assert.ok(tempo, id);
    assert.match(tempo.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(tempo.recordingUrl, song.recording_url ?? song.listen_url, id);
    assert.ok(['documented', 'estimated', 'unresolved'].includes(tempo.status), id);
    assert.ok(tempo.note && tempo.recording && tempo.sources.length >= 2, id);
    for (const source of tempo.sources) {
      assert.equal(new URL(source.url).protocol, 'https:', id);
      assert.ok(source.title && source.evidence, id);
      assert.ok(!source.evidence.includes('/tmp/'), id);
    }
    for (const chart of Object.values(song.versions)) {
      assert.equal(tempo.playerUnit, chart.meter === '6/8' ? 'dotted-quarter' : 'quarter', id);
    }
    const bpm = referenceBpm(tempo);
    if (tempo.status === 'unresolved') {
      assert.equal(tempo.reference, null, id);
      assert.equal(bpm, null, id);
    } else {
      assert.ok(bpm !== null && bpm >= 30 && bpm <= 180, id);
    }
  }
});

test('6/8 source quarter tempo converts to dotted pulses without rounding audio timing', () => {
  const tempo = songs.me_derramar.tempo!;
  const bpm = referenceBpm(tempo)!;
  assert.equal(bpm, 56 / 1.5);
  assert.equal(formatBpm(bpm), '37,3');
  const chart = songs.me_derramar.versions.base;
  const bar = chart.sections[0].bars[0];
  const scheduled = scheduleChartBar(bar, 10, bpm);
  const click = scheduleChartMetronome(bar, chart, 10, bpm);
  // A 6/8 bar has three quarter notes, or two dotted-quarter pulses.
  assert.ok(Math.abs(scheduled.endAt - 10 - (3 * 60) / 56) < 1e-10);
  assert.equal(click.ticks.length, 6);
  assert.ok(Math.abs(click.ticks[1].at - click.ticks[0].at - 60 / 112) < 1e-10);
  assert.equal(referenceBpm(songs.ousado_amor.tempo!), 55);
});

test('all 39 lessons start at the recording reference, preserving exact compound pulses', () => {
  const defaults: Record<string, number> = {
    santo_espirito: 71.5,
    faz_chover_tna: 67,
    me_derramar: 56 / 1.5,
    sonda_me_usa_me: 62,
    renova_me: 94,
    poderoso_deus: 62,
    faz_chover: 72,
    lugar_secreto: 69,
    rompendo_em_fe: 68,
    ousado_amor: 55,
    preciso_de_ti: 68,
    a_ele_a_gloria: 75,
    bondade_de_deus: 68,
  };
  assert.deepEqual(Object.keys(defaults).sort(), Object.keys(songs).sort());
  for (const lesson of lessons) {
    const song = songs[lesson.song];
    assert.equal(defaultPlaybackBpm(lesson.bpm, song.tempo), defaults[lesson.song], lesson.id);
  }
  assert.equal(formatBpm(defaultPlaybackBpm(48, songs.santo_espirito.tempo)), '71,5');
  assert.equal(defaultPlaybackBpm(48), 48);
});

test('unresolved or invalid references cannot become playback defaults', () => {
  const unresolved: TempoResearch = {
    ...songs.poderoso_deus.tempo!,
    status: 'unresolved',
    reference: { bpm: 124, unit: 'quarter' },
  };
  assert.equal(referenceBpm(unresolved), null);
  assert.equal(defaultPlaybackBpm(48, unresolved), 48);
  assert.equal(defaultPlaybackBpm(48, { ...unresolved, status: 'estimated', reference: null }), 48);
  const known = songs.bondade_de_deus.tempo!;
  for (const bpm of [0, -68, NaN, Infinity]) {
    const invalid: TempoResearch = {
      ...known,
      reference: { bpm, unit: 'quarter' },
    };
    assert.equal(referenceBpm(invalid), null);
    assert.equal(defaultPlaybackBpm(48, invalid), 48);
  }
});

test('a 2/4 passage keeps the researched pulse and takes half a 4/4 bar', () => {
  const song = songs.bondade_de_deus;
  const bpm = referenceBpm(song.tempo!)!;
  const bars = Object.values(song.versions).flatMap((chart) =>
    chart.sections.flatMap((section) => section.bars),
  );
  const halfBar = bars.find((bar) => bar.meter === '2/4')!;
  const fullBar = bars.find(
    (bar) => bar.events.reduce((sum, event) => sum + event.beats, 0) === 4,
  )!;
  assert.ok(halfBar && fullBar);
  assert.equal(bpm, 68);
  assert.ok(
    Math.abs(
      scheduleChartBar(halfBar, 0, bpm).endAt * 2 - scheduleChartBar(fullBar, 0, bpm).endAt,
    ) < 1e-10,
  );
});

import type { ChartBar, SongVersion } from '@/content/types';
import type { LessonLyrics } from '@/content/song-lyrics-types';
import { parseChordSymbol, transposeChordSymbol } from './chord-symbol';
import { parsePastedTablature, PastedTablatureError } from './pasted-tablature';
import { splitLyricSyllables } from './lyric-syllables';
import { validateLyricCues, type LyricCue } from './chart-lyrics';

export interface PastedChartIssue {
  line: number;
  message: string;
}
export class PastedChartError extends Error {
  constructor(public issues: PastedChartIssue[]) {
    super(issues.map(({ line, message }) => `Linha ${line}: ${message}`).join('\n'));
    this.name = 'PastedChartError';
  }
}
export interface PastedChartOptions {
  meter?: '4/4' | '3/4' | '6/8';
  title?: string;
  /** Override the pasted capo, including zero to remove it. Undefined detects the text. */
  capo?: number;
}
export interface PastedChart {
  chart: SongVersion;
  lyricsContent?: LessonLyrics;
  warnings: PastedChartIssue[];
  barCount: number;
}
interface Token {
  chord: string;
  column: number;
  beat: number;
}
interface Unit {
  bars: ChartBar[];
  tokens: Token[];
  repeat: number;
  line: number;
  lyrics?: string;
  rawText?: string;
}
interface Section {
  title: string;
  repeat: number;
  line: number;
  units: Unit[];
  explicit?: boolean;
}
const MAX_BARS = 1000;
const MAX_REPEAT = 16;
const tonalMetadata = /^(tom(?: de refer[eê]ncia(?: \(som real\))?)?|key|capotraste|capo)\s*:\s*/i;
const timingMetadata = /^(?:bpm|tempo|andamento|compasso)\s*:/i;

function fail(line: number, message: string): never {
  throw new PastedChartError([{ line, message }]);
}
function chord(token: string): string | null {
  return /^N\.?C\.?$/i.test(token) ? 'N.C.' : (parseChordSymbol(token)?.symbol ?? null);
}
function repeatSuffix(input: string, line: number) {
  const match = input.match(/\s*(?:\(\s*)?(?:[x×]\s*(\d+)|(\d+)\s*[x×])\s*\)?\s*$/i);
  if (!match) return { text: input, repeat: 1 };
  const repeat = Number(match[1] ?? match[2]);
  if (repeat < 1 || repeat > MAX_REPEAT) fail(line, `Use uma repetição entre 1 e ${MAX_REPEAT}.`);
  return { text: input.slice(0, match.index), repeat };
}
function expandTabs(input: string) {
  let column = 0;
  return input.replace(/[^\t]|\t/g, (character) => {
    const value = character === '\t' ? ' '.repeat(4 - (column % 4)) : character;
    column += value.length;
    return value;
  });
}
function maskChordGroups(input: string) {
  const characters = input.split('');
  const openings: { column: number; group: boolean }[] = [];
  for (let column = 0; column < input.length; column++) {
    if (input[column] === '(') {
      // A group begins between tokens; an extension is attached to its chord: C7(b9).
      openings.push({ column, group: column === 0 || /[\s|:(]/.test(input[column - 1]) });
    } else if (input[column] === ')') {
      const opening = openings.pop();
      if (opening?.group) {
        // Spaces preserve the chord columns used by lyrics and tablature.
        characters[opening.column] = ' ';
        characters[column] = ' ';
      }
    }
  }
  return characters.join('');
}
function parseChordLine(input: string, beats: number, line: number): Unit | null {
  const ending = repeatSuffix(input, line);
  let text = maskChordGroups(ending.text);
  let repeat = ending.repeat;
  if (text.includes('|:') || text.includes(':|')) {
    if (!/^\s*\|:.*:\|\s*$/.test(text))
      fail(line, 'Use |: acordes :| na mesma linha ou indique x2 após a linha.');
    text = text.replace('|:', '| ').replace(':|', ' |');
    if (repeat === 1) repeat = 2;
  }
  const hasBars = text.includes('|');
  const words = [...text.matchAll(/[^\s|]+/g)];
  if (!words.length) return null;
  const symbols = words.map((token) => chord(token[0]));
  const recognized = symbols.filter(Boolean).length;
  const looksLikeChords = words.every((token) =>
    /^[A-H](?:[#b♯♭])?(?:(?:maj|min|dim|aug|sus|add|omit|alt|no)|[0-9mM#+°ø/().b-])*$/.test(
      token[0],
    ),
  );
  if (
    !hasBars &&
    recognized !== words.length &&
    !looksLikeChords &&
    (recognized < 2 || recognized / words.length < 0.5)
  )
    return null;
  for (let index = 0; index < words.length; index++) {
    if (!symbols[index])
      fail(
        line,
        `Acorde não reconhecido: “${words[index][0]}”. Confira a cifra ou separe o texto dos acordes.`,
      );
  }
  const bars: ChartBar[] = [];
  const tokens: Token[] = [];
  if (!hasBars) {
    words.forEach((word, index) => {
      bars.push({ events: [{ chord: symbols[index]!, beats }] });
      tokens.push({ chord: symbols[index]!, column: word.index, beat: index * beats });
    });
  } else {
    let column = 0;
    for (const [index, part] of text.split('|').entries()) {
      if (!part.trim()) {
        if (index > 0 && index < text.split('|').length - 1)
          fail(line, 'Compasso vazio: escreva os acordes ou N.C. para silêncio.');
      } else {
        const entries = [...part.matchAll(/\S+/g)];
        const duration = beats / entries.length;
        if (entries.length > 16) fail(line, 'Use até 16 acordes por compasso.');
        const events = entries.map((entry, event) => {
          const symbol = chord(entry[0])!;
          tokens.push({
            chord: symbol,
            column: column + entry.index,
            beat: bars.length * beats + event * duration,
          });
          return { chord: symbol, beats: duration };
        });
        bars.push({ events });
      }
      column += part.length + 1;
    }
  }
  return { bars, tokens, repeat, line, rawText: maskChordGroups(input) };
}
function parseInline(input: string, beats: number, line: number): Unit | null {
  if (!input.includes('[')) return null;
  const ending = repeatSuffix(input, line);
  const matches = [...ending.text.matchAll(/\[([^\]]+)\]/g)];
  if (!matches.length || ending.text.replace(/\[[^\]]+\]/g, '').match(/[\[\]]/))
    fail(line, 'Feche cada acorde entre colchetes, por exemplo [Am]Meu texto.');
  const tokens: Token[] = [];
  let text = '';
  let end = 0;
  matches.forEach((match, index) => {
    text += ending.text.slice(end, match.index);
    const symbol = chord(match[1].trim());
    if (!symbol) fail(line, `Acorde não reconhecido: “${match[1]}”.`);
    tokens.push({ chord: symbol, column: text.length, beat: index * beats });
    end = match.index + match[0].length;
  });
  text += ending.text.slice(end);
  return {
    bars: tokens.map(({ chord }) => ({ events: [{ chord, beats }] })),
    tokens,
    repeat: ending.repeat,
    line,
    ...(text.trim() ? { lyrics: text } : {}),
  };
}

function colonSectionHeading(input: string, beats: number, line: number) {
  const text = input.trim();
  // Metadata and bar repeat signs have their own meaning; URLs are not section titles.
  if (tonalMetadata.test(text) || timingMetadata.test(text)) return null;
  const heading = text.match(/^([^:[\]|]+):(?!\/)(.*)$/);
  if (!heading) return null;
  const tail = repeatSuffix(heading[2], line).text;
  // A colon inside an ordinary lyric stays literal. A title may stand alone or precede music.
  return !tail.trim() || parseInline(tail, beats, line) || parseChordLine(tail, beats, line)
    ? heading
    : null;
}

/** Parse plain text locally. Chord columns locate vocal anchors, not recorded vocal durations. */
export function parsePastedChart(input: string, options: PastedChartOptions = {}): PastedChart {
  if (!input.trim()) fail(1, 'Cole a cifra da música antes de carregar.');
  if (input.length > 50_000) fail(1, 'Use até 50.000 caracteres por cifra.');
  const meter = options.meter ?? '4/4';
  if (!['4/4', '3/4', '6/8'].includes(meter)) fail(1, 'Escolha 4/4, 3/4 ou 6/8.');
  const beats = meter === '6/8' ? 2 : meter === '3/4' ? 3 : 4;
  const sections: Section[] = [];
  let current: Section = {
    title: options.title?.trim() || 'Minha música',
    repeat: 1,
    line: 1,
    units: [],
  };
  let pending: Unit | undefined;
  let key = 'Livre';
  let annotation = false;
  let sourceCapo = 0;
  let shapeKey: string | undefined;
  if (
    options.capo !== undefined &&
    (!Number.isInteger(options.capo) || options.capo < 0 || options.capo > 12)
  )
    fail(1, 'O capotraste deve ser uma casa inteira entre 0 e 12.');
  const providedLines: string[] = [];
  const warnings: PastedChartIssue[] = [];
  const warn = (line: number, message: string) => {
    if (!warnings.some((item) => item.message === message)) warnings.push({ line, message });
  };
  const lines = input
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(expandTabs);
  for (let index = 0; index < lines.length; index++) {
    let raw = lines[index];
    const line = index + 1;
    if (!raw.trim()) continue;
    try {
      const tab = parsePastedTablature(
        lines,
        index,
        beats,
        pending?.rawText ? repeatSuffix(pending.rawText, pending.line).text : undefined,
      );
      if (tab) {
        const repeat = pending?.repeat ?? 1;
        if (pending) current.units.splice(current.units.indexOf(pending), 1);
        current.units.push({ bars: tab.bars, tokens: [], repeat, line });
        for (const warning of tab.warnings) warn(warning.line, warning.message);
        pending = undefined;
        index += tab.consumedLines - 1;
        continue;
      }
    } catch (error) {
      if (error instanceof PastedTablatureError) fail(error.line, error.message);
      throw error;
    }
    if (/^\s*[|:─━—–\-_=]+\s*$/.test(raw)) continue;
    if (annotation && (/^\s*-\s/.test(raw) || /^\s*https?:\/\//i.test(raw))) {
      warn(line, 'Notas e fontes ficam no texto colado e não acrescentam compassos à execução.');
      continue;
    }
    let ending = repeatSuffix(raw, line);
    const bracketHeading = raw.trim().match(/^\[([^\]]+)\]\s*:?(.*)$/);
    const colonHeading = bracketHeading ? null : colonSectionHeading(raw, beats, line);
    const heading = bracketHeading ?? colonHeading;
    const headingEnding = heading ? repeatSuffix(heading[1], line) : undefined;
    const plainHeading = ending.text
      .trim()
      .match(
        /^(?:intro(?:dução)?|verso|estrofe|refr[aã]o|ponte|solo|final|coda|parte)(?:\s+\d+)?\s*:?$/i,
      );
    if ((heading && (colonHeading || !chord(heading[1].trim()))) || plainHeading) {
      // A malformed chord inside a lyric is an error, not an invented section title.
      if (
        bracketHeading &&
        /^[A-H][#b♯♭]?(?:\d|m\d)/.test(bracketHeading[1]) &&
        bracketHeading[2].trim() &&
        !parseChordLine(bracketHeading[2], beats, line)
      )
        fail(line, `Acorde não reconhecido: “${bracketHeading[1]}”.`);
      const tail = heading?.[2] ?? '';
      const tailEnding = repeatSuffix(tail, line);
      const title = (headingEnding?.text ?? ending.text).trim().replace(/:$/, '');
      annotation = /^(?:observa[çc][õo]es|fontes|refer[eê]ncias|notas)(?:\b|$)/i.test(title);
      if (current.units.length || current.explicit) sections.push(current);
      // Both [Refrão] x2 and Refrão: x2 repeat the section; trailing chords repeat only their line.
      const outerRepeat =
        heading && !tailEnding.text.trim() ? tailEnding.repeat : plainHeading ? ending.repeat : 1;
      if (headingEnding && headingEnding.repeat > 1 && outerRepeat > 1)
        fail(line, 'Indique a repetição do trecho apenas uma vez.');
      current = {
        title,
        explicit: true,
        repeat: headingEnding && headingEnding.repeat > 1 ? headingEnding.repeat : outerRepeat,
        line,
        units: [],
      };
      pending = undefined;
      raw = tailEnding.text.trim() ? tail.trimStart() : '';
      if (!raw) continue;
      ending = repeatSuffix(raw, line);
    }

    // Web pages often concatenate these two labels. Keep the written shapes and
    // sounding key separate; only playback adds the capo offset to notes.
    const metadataText = raw.trim();
    const metadata = metadataText.match(tonalMetadata);
    if (metadata) {
      const capoMatch = metadataText.match(/(?:capotraste|capo)\s*:\s*([^\n]*)/i);
      if (capoMatch) {
        const value = capoMatch[1].trim();
        if (/^(?:sem(?:\s+capotraste)?|nenhum|n[aã]o|no capo)\s*[.!]?$/i.test(value))
          sourceCapo = 0;
        else {
          const match = value.match(/^(\d+)\s*(?:[ªºa°o]\s*)?(?:(?:casa|traste)s?)?\s*[.!]?$/i);
          if (!match || Number(match[1]) > 12)
            fail(line, 'Informe o capotraste entre 0 e 12, por exemplo “Capotraste: 1ª casa”.');
          sourceCapo = Number(match[1]);
        }
      }
      if (/^(?:tom|key)/i.test(metadata[1])) {
        const value = metadataText.slice(metadata[0].length, capoMatch?.index).trim();
        const parts = value.split(/\s*(?:->|→)\s*/);
        const tones = parts.map((part) => chord(part.trim().split(/[\s(]/)[0]));
        if (tones.some((value) => !value || value === 'N.C.'))
          fail(line, 'Informe um tom válido depois de “Tom:”.');
        key = tones.join(' → ');
        const shape = value.match(
          /(?:com\s+)?(?:forma|formato|posi[çc][aã]o|desenho)(?:\s+(?:de|em))?\s*:?\s*([^\s)]+)/i,
        );
        if (shape) {
          const parsed = chord(shape[1]);
          if (!parsed || parsed === 'N.C.') fail(line, 'Confira o acorde informado em “forma de”.');
          shapeKey = parsed;
        }
      }
      pending = undefined;
      continue;
    }
    if (timingMetadata.test(raw.trim())) {
      warn(line, 'Use os controles para escolher o andamento e o compasso da cifra.');
      pending = undefined;
      continue;
    }
    if (/^\s*(?:\(?\s*[x×]\s*\d+\s*\)?|\(?\s*\d+\s*[x×]\s*\)?)\s*$/i.test(raw)) {
      if (!current.units.length) fail(line, 'Escreva um trecho antes da indicação de repetição.');
      current.repeat = ending.repeat;
      pending = undefined;
      continue;
    }
    const unit = parseInline(raw, beats, line) ?? parseChordLine(raw, beats, line);
    if (unit) {
      current.units.push(unit);
      if (unit.lyrics) providedLines.push(unit.lyrics.trim());
      pending = unit.lyrics ? undefined : unit;
    } else {
      providedLines.push(raw.trim());
      if (raw.trim().length > 6000) fail(line, 'Divida a letra em linhas de até 6.000 caracteres.');
      if (pending) {
        pending.lyrics = raw;
        pending = undefined;
      } else {
        warn(
          line,
          'Linhas sem acordes correspondentes ficam na letra completa; coloque acordes acima de cada linha para acompanhá-la.',
        );
      }
    }
  }

  if (current.units.length || current.explicit) sections.push(current);
  if (
    sections.length > 250 ||
    sections.reduce((count, section) => count + section.repeat, 0) > 1000
  )
    fail(1, 'Use até 250 trechos e 1.000 passagens por cifra.');
  const effectiveCapo = options.capo ?? sourceCapo;
  const chart: SongVersion = {
    key:
      options.capo !== undefined && shapeKey
        ? (transposeChordSymbol(shapeKey, effectiveCapo) ?? key)
        : key,
    capo: effectiveCapo,
    ...(shapeKey ? { shape_key: shapeKey } : {}),
    meter,
    beats_per_bar: beats,
    beat_unit: meter === '6/8' ? 'dotted-quarter' : 'quarter',
    subdivisions_per_beat: meter === '6/8' ? 3 : 1,
    adaptations: '',
    sections: [],
    order: [],
  };
  const cues: LyricCue[] = [];
  const templates = new Map<string, { id: string; bars: ChartBar[]; cues: LyricCue[] }>();
  let totalBars = 0;
  for (const section of sections) {
    let template = templates.get(section.title.toLocaleLowerCase('pt-BR'));
    if (section.units.length) {
      const bars: ChartBar[] = [];
      const localCues: LyricCue[] = [];
      for (const unit of section.units) {
        if (unit.bars.length * unit.repeat + bars.length > MAX_BARS)
          fail(unit.line, `Use até ${MAX_BARS} compassos, contando as repetições.`);
        for (let repeat = 0; repeat < unit.repeat; repeat++) {
          const startBeat = bars.length * beats;
          const endBeat = startBeat + unit.bars.length * beats;
          if (unit.lyrics?.trim()) {
            const text = unit.lyrics.trim();
            if (text.length > 6000)
              fail(unit.line, 'Divida a letra em linhas de até 6.000 caracteres.');
            const leading = unit.lyrics.length - unit.lyrics.trimStart().length;
            const parts = splitLyricSyllables(text);
            const anchors: { from: number; beat: number }[] = [];
            for (const token of unit.tokens) {
              if (token.chord === 'N.C.') continue;
              const column = token.column - leading;
              const part = parts.find((part) => column >= part.from && column < part.to);
              if (!part) {
                warn(
                  unit.line,
                  'Alguns acordes ficam fora dos caracteres da letra e não definem uma entrada vocal.',
                );
                continue;
              }
              if (anchors.some((anchor) => anchor.from === part.from)) {
                warn(
                  unit.line,
                  'Acordes sobre a mesma sílaba mantêm a harmonia; apenas a primeira entrada marca o canto.',
                );
                continue;
              }
              if (token.beat === 0 && part.from > 0) {
                warn(
                  unit.line,
                  'A primeira entrada vocal foi estimada: a cifra não informa o tempo das palavras anteriores ao primeiro acorde.',
                );
                continue;
              }
              anchors.push({ from: part.from, beat: startBeat + token.beat });
            }
            localCues.push({
              text,
              startBeat,
              endBeat,
              ...(anchors.length ? { chordAnchors: anchors } : {}),
            });
          }
          bars.push(...unit.bars);
        }
      }
      const id = `T${chart.sections.length + 1}`;
      template = { id, bars, cues: localCues };
      templates.set(section.title.toLocaleLowerCase('pt-BR'), template);
      chart.sections.push({ id, title: section.title, bars });
    }
    if (!template) {
      const id = `T${chart.sections.length + 1}`;
      template = { id, bars: [], cues: [] };
      chart.sections.push({ id, title: section.title, bars: [] });
      warn(
        section.line,
        `O trecho “${section.title}” não tem compassos escritos; seu título foi preservado sem acrescentar som.`,
      );
    }
    if (totalBars + template.bars.length * section.repeat > MAX_BARS)
      fail(section.line, `Use até ${MAX_BARS} compassos, contando as repetições.`);
    chart.order.push({ section: template.id, repeat: section.repeat });
    for (let repeat = 0; repeat < section.repeat; repeat++) {
      const shift = totalBars * beats;
      for (const cue of template.cues)
        cues.push({
          ...cue,
          startBeat: cue.startBeat + shift,
          endBeat: cue.endBeat + shift,
          ...(cue.chordAnchors
            ? {
                chordAnchors: cue.chordAnchors.map((anchor) => ({
                  ...anchor,
                  beat: anchor.beat + shift,
                })),
              }
            : {}),
        });
      totalBars += template.bars.length;
    }
  }
  if (!totalBars)
    fail(
      1,
      'Nenhum acorde encontrado. Use cifras como C, Am, F e G, acima da letra ou entre barras.',
    );
  if (cues.length > 1000) fail(1, 'Use até 1.000 linhas de letra, contando as repetições.');
  return {
    chart,
    barCount: totalBars,
    warnings,
    ...(providedLines.length
      ? {
          lyricsContent: {
            providedLines,
            cues: validateLyricCues(cues, totalBars * beats),
            status: 'draft' as const,
            alignmentNote:
              'A posição escrita dos acordes orienta a letra. Tempos entre entradas são estimados, sem medição de uma gravação.',
          },
        }
      : {}),
  };
}

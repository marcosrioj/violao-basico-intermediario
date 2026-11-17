import type { ChartBar, ChartEvent } from '@/content/types';
import { parseChordSymbol } from './chord-symbol';

export interface PastedTablatureIssue {
  line: number;
  message: string;
}
export class PastedTablatureError extends Error {
  constructor(
    public line: number,
    message: string,
  ) {
    super(message);
    this.name = 'PastedTablatureError';
  }
}
export interface PastedTablature {
  bars: ChartBar[];
  consumedLines: number;
  warnings: PastedTablatureIssue[];
}
interface StringLine {
  label: string;
  parts: string[];
  prefix: number;
  line: number;
}
const labels = ['E', 'B', 'G', 'D', 'A', 'E'];
// Standard guitar tuning, from the first/high string to the sixth/low string.
const openNotes = [64, 59, 55, 50, 45, 40];

function stringLine(raw: string, index: number): StringLine | null {
  const match = /^(\s*)([A-Ga-g][#b♯♭]?|[1-6])?\s*\|(.+)$/.exec(raw);
  if (!match || !/[-–—\dxX]/.test(match[3])) return null;
  const words = match[3].split(/[\s|]+/).filter(Boolean);
  if (words.length && words.every((word) => parseChordSymbol(word))) return null;
  if (/[ACDEFGMm]/.test(match[3])) return null;
  if (!match[2] && /[^\d\s|xXhHpPbBrRsStTvV~^/\\().<>\-–—]/.test(match[3])) return null;
  const body = match[3].replace(/[–—]/g, '-').replace(/\s+$/, '');
  // Single and double closing bars are visual boundaries, not empty measures.
  const parts = body.replace(/\|+$/, '').split(/\|+/);
  return { label: match[2] ?? '', parts, prefix: raw.indexOf('|') + 1, line: index + 1 };
}

/** Six-string ASCII tab. Horizontal spacing estimates rhythm; written pitches are retained. */
export function parsePastedTablature(
  lines: string[],
  start: number,
  beats: number,
  chordLine?: string,
): PastedTablature | null {
  const first = stringLine(lines[start] ?? '', start);
  if (!first) return null;
  if (!Number.isFinite(beats) || beats <= 0)
    throw new PastedTablatureError(start + 1, 'Escolha uma fórmula de compasso válida.');
  const strings: StringLine[] = [];
  let cursor = start;
  while (strings.length < 6 && cursor < lines.length) {
    if (!lines[cursor].trim()) {
      cursor++;
      continue;
    }
    const parsed = stringLine(lines[cursor], cursor);
    if (!parsed) break;
    if (lines[cursor].length > 6000)
      throw new PastedTablatureError(
        cursor + 1,
        'Divida a tablatura em linhas de até 6.000 caracteres.',
      );
    const string = strings.length;
    if (
      parsed.label &&
      parsed.label.toUpperCase() !== labels[string] &&
      parsed.label !== String(string + 1)
    )
      throw new PastedTablatureError(
        cursor + 1,
        'Use as seis cordas na ordem e, B, G, D, A, E (afinação padrão).',
      );
    if (parsed.parts.length !== first.parts.length)
      throw new PastedTablatureError(
        cursor + 1,
        'Alinhe as barras de compasso nas seis linhas da tablatura.',
      );
    strings.push(parsed);
    cursor++;
  }
  if (strings.length !== 6)
    throw new PastedTablatureError(
      start + 1,
      'A tablatura precisa das seis linhas de cordas: e, B, G, D, A, E.',
    );
  const warnings: PastedTablatureIssue[] = [
    {
      line: start + 1,
      message:
        'O ritmo da tablatura é estimado pelo espaçamento horizontal; confira o andamento e as durações ao tocar.',
    },
  ];
  const warn = (line: number, message: string) => {
    if (!warnings.some((warning) => warning.message === message)) warnings.push({ line, message });
  };
  const harmony = [...(chordLine ?? '').matchAll(/[^\s|]+/g)].flatMap((match) => {
    const parsed = parseChordSymbol(match[0]);
    return parsed ? [{ symbol: parsed.symbol, column: match.index - first.prefix }] : [];
  });
  const sourceWidth = first.parts.reduce(
    (sum, _part, index) =>
      sum + Math.max(...strings.map((row) => row.parts[index].length)) + (index ? 1 : 0),
    0,
  );
  if (harmony.some((item) => item.column < 0)) {
    if (harmony.length > sourceWidth)
      throw new PastedTablatureError(
        start + 1,
        'Alinhe cada acorde com uma posição distinta da tablatura.',
      );
    harmony.forEach((item, index) => {
      item.column = Math.floor((index * sourceWidth) / harmony.length);
    });
    warn(
      start + 1,
      'Os acordes compactos foram distribuídos pela largura da tablatura; alinhe-os acima das notas para indicar posições específicas.',
    );
  }
  const bars: ChartBar[] = [];
  let sourceOffset = 0;
  for (let measure = 0; measure < first.parts.length; measure++) {
    const width = Math.max(...strings.map((row) => row.parts[measure].length));
    if (!width) throw new PastedTablatureError(start + 1, 'Compasso de tablatura vazio.');
    if (strings.some((row) => row.parts[measure].length !== width))
      warn(
        start + 1,
        'Linhas de tablatura com larguras diferentes foram completadas à direita; confira seu alinhamento.',
      );
    const attacks = new Map<number, number[]>();
    strings.forEach((row, string) => {
      const body = row.parts[measure];
      if (/[^\d\sxXhHpPbBrRsStTvV~^/\\().<>\-]/.test(body))
        throw new PastedTablatureError(
          row.line,
          'Há um símbolo não reconhecido na tablatura. Use casas, traços e marcações usuais de técnica.',
        );
      if (/[xXhHpPbBrRsStTvV~^/\\().<>]/.test(body))
        warn(
          row.line,
          'As técnicas da tablatura são preservadas na leitura; o áudio usa ataques simples e não simula bends, slides, harmônicos ou abafamentos.',
        );
      for (const note of body.matchAll(/\d+|[xX]/g)) {
        if (/^[xX]$/.test(note[0])) {
          if (!attacks.has(note.index)) attacks.set(note.index, []);
          continue;
        }
        const fret = Number(note[0]);
        if (fret > 24)
          throw new PastedTablatureError(
            row.line,
            `Casa ${fret} fora da extensão suportada (0 a 24).`,
          );
        // A bend/release target is not a new picked note. Keep its printed marker only.
        if (/[bBrR]/.test(body[note.index - 1] ?? '')) continue;
        const pitches = attacks.get(note.index) ?? [];
        pitches.push(openNotes[string] + fret);
        attacks.set(note.index, pitches);
      }
    });
    const localHarmony = harmony.map((item) => ({ ...item }));
    if (first.parts.length === 1) {
      for (const item of localHarmony) {
        let previous: number;
        do {
          previous = item.column;
          for (const row of strings) {
            for (const fret of row.parts[0].matchAll(/\d+/g)) {
              if (fret.index < item.column && item.column < fret.index + fret[0].length)
                item.column = fret.index;
            }
          }
        } while (previous !== item.column);
      }
    }
    const splits = [0];
    if (first.parts.length === 1 && localHarmony.length > 1) {
      for (const item of localHarmony.slice(1)) {
        if (item.column > splits.at(-1)! && item.column < width) splits.push(item.column);
        else
          warn(
            start + 1,
            'Um acorde ficou fora da largura da tablatura; ele não criou um compasso adicional.',
          );
      }
    }
    splits.push(width);
    for (let segment = 0; segment < splits.length - 1; segment++) {
      const from = splits[segment];
      const to = splits[segment + 1];
      const columns = [...attacks.keys()]
        .filter((column) => column >= from && column < to)
        .sort((a, b) => a - b);
      if (columns.length > 256)
        throw new PastedTablatureError(
          start + 1,
          'Divida a tablatura em compassos com até 256 ataques.',
        );
      if (columns[0] !== from) columns.unshift(from);
      const events: ChartEvent[] = columns.map((column, index) => {
        const notes = [...new Set(attacks.get(column) ?? [])];
        const writtenChord =
          localHarmony.findLast((item) => item.column <= sourceOffset + column)?.symbol ??
          harmony[0]?.symbol;
        return {
          chord: writtenChord ?? (notes.length ? 'Tablatura' : 'Pausa'),
          notes,
          beats: (((columns[index + 1] ?? to) - column) * beats) / (to - from),
        };
      });
      // Remove accumulated floating point error without moving a note onset.
      const duration = events.slice(0, -1).reduce((sum, event) => sum + event.beats, 0);
      events[events.length - 1].beats = beats - duration;
      bars.push({
        events,
        tablature: strings.map(
          (row, string) =>
            `${row.label || (string ? labels[string] : 'e')}|${row.parts[measure].slice(from, to).padEnd(to - from, '-')}|`,
        ),
      });
    }
    sourceOffset += width + 1;
  }
  return { bars, consumedLines: cursor - start, warnings };
}

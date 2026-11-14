export type EarLevel = 'foundations' | 'thirds';
export interface EarQuestion {
  root: number;
  semitones: number;
}
export const earIntervals: Record<number, { label: string; explanation: string }> = {
  3: {
    label: 'Terça menor',
    explanation:
      'São 3 semitons. A terça menor fica um semitom abaixo da terça maior a partir da mesma nota inicial.',
  },
  4: {
    label: 'Terça maior',
    explanation:
      'São 4 semitons. A terça maior fica um semitom acima da terça menor a partir da mesma nota inicial.',
  },
  7: {
    label: 'Quinta justa',
    explanation: 'São 7 semitons. É uma distância mais ampla que a terça e menor que a oitava.',
  },
  12: {
    label: 'Oitava justa',
    explanation:
      'São 12 semitons. As duas notas têm o mesmo nome em alturas diferentes; a frequência da segunda é o dobro da primeira.',
  },
};
export const earChoices: Record<EarLevel, number[]> = {
  foundations: [4, 7, 12],
  thirds: [3, 4],
};
function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.max(0, Math.min(0.999999999, random())) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
/** Balanced six-question session; roots vary so naming one fixed pitch is insufficient. */
export function createEarSession(level: EarLevel, random = Math.random): EarQuestion[] {
  const choices = earChoices[level];
  const intervals = shuffle(
    Array.from({ length: 6 }, (_, i) => choices[i % choices.length]),
    random,
  );
  const roots = shuffle([48, 50, 52, 55, 57, 60], random);
  return intervals.map((semitones, i) => ({ semitones, root: roots[i] }));
}
export function summarizeEarSession(questions: EarQuestion[], answers: number[]) {
  const answered = Math.min(questions.length, answers.length);
  const mistakes = questions
    .slice(0, answered)
    .filter((question, i) => question.semitones !== answers[i]);
  return { answered, correct: answered - mistakes.length, mistakes };
}

import type { Match } from "@/types/football";

export type Round = "ROUND_OF_32" | "ROUND_OF_16" | "QUARTER_FINALS" | "SEMI_FINALS" | "FINAL" | "THIRD_PLACE";

export interface BracketRound {
  id: Round;
  label: string;
  shortLabel: string;
  matches: (Match | undefined)[];
}

/*
 * Copa do Mundo 2026 — official bracket structure (FIFA draw, Dec 2024)
 *
 * The 32-team knockout is split into two symmetric halves.
 * Each half contributes one team to the Final.
 *
 * Left half (matches index 0-7 in R32):  slots A1–A8
 * Right half (matches index 8-15 in R32): slots B1–B8
 *
 * Winners propagate:
 *   R32[0] vs R32[1] → R16[0]   R32[2] vs R32[3] → R16[1]
 *   R16[0] vs R16[1] → QF[0]    ...
 *   QF[0]  vs QF[1]  → SF[0]    ...
 *   SF[0]  vs SF[1]  → FINAL
 *
 * The API returns knockout matches ordered by matchday (49–79).
 * We sort them by utcDate and split into the bracket order below.
 */

const ROUND_ORDER: Round[] = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "FINAL",
  "THIRD_PLACE",
];

export function buildBracket(allMatches: Match[]): {
  left: BracketRound[];
  right: BracketRound[];
  final?: Match;
  thirdPlace?: Match;
} {
  const byStage = (stage: Round) =>
    allMatches
      .filter((m) => m.stage === stage)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  const r32 = byStage("ROUND_OF_32");   // 16 matches
  const r16 = byStage("ROUND_OF_16");   // 8 matches
  const qf  = byStage("QUARTER_FINALS"); // 4 matches
  const sf  = byStage("SEMI_FINALS");    // 2 matches
  const fi  = byStage("FINAL");          // 1 match
  const tp  = byStage("THIRD_PLACE");    // 1 match

  /* Split each round into left (first half) and right (second half) */
  const half = <T,>(arr: T[]): [T[], T[]] => {
    const mid = Math.ceil(arr.length / 2);
    return [arr.slice(0, mid), arr.slice(mid)];
  };

  const [r32L, r32R] = half(pad(r32, 16));
  const [r16L, r16R] = half(pad(r16, 8));
  const [qfL,  qfR]  = half(pad(qf,  4));
  const [sfL,  sfR]  = half(pad(sf,  2));

  const makeRound = (id: Round, label: string, short: string, matches: (Match | undefined)[]): BracketRound =>
    ({ id, label, shortLabel: short, matches });

  const left: BracketRound[] = [
    makeRound("ROUND_OF_32",   "16 Avos de Final", "R32",  r32L),
    makeRound("ROUND_OF_16",   "Oitavas",          "R16",  r16L),
    makeRound("QUARTER_FINALS","Quartas",           "QF",   qfL),
    makeRound("SEMI_FINALS",   "Semifinais",        "SF",   sfL),
  ];

  const right: BracketRound[] = [
    makeRound("SEMI_FINALS",   "Semifinais",        "SF",   sfR),
    makeRound("QUARTER_FINALS","Quartas",           "QF",   qfR),
    makeRound("ROUND_OF_16",   "Oitavas",          "R16",  r16R),
    makeRound("ROUND_OF_32",   "16 Avos de Final", "R32",  r32R),
  ];

  return {
    left,
    right,
    final:      fi[0],
    thirdPlace: tp[0],
  };
}

/** Pad array with `undefined` to reach `size` */
function pad(arr: Match[], size: number): (Match | undefined)[] {
  return [...arr, ...Array(Math.max(0, size - arr.length)).fill(undefined)].slice(0, size);
}

export { ROUND_ORDER };

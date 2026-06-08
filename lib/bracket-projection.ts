import type { Match, Team, Group, Standing } from "@/types/football";

/* ─────────────────────────────────────────────────────────────────────────────
 * Copa do Mundo 2026 — phase-aware bracket projection
 *
 * Official R32 bracket (FIFA draw, December 2024) — matches 73–88:
 *   Slot 0  (M74): W-E  vs 3rd(A/B/C/D/F)   → R16 M89 ┐
 *   Slot 1  (M77): W-I  vs 3rd(C/D/F/G/H)   → R16 M89 ┘ → QF M97 ┐
 *   Slot 2  (M73): 2nd-A vs 2nd-B            → R16 M90 ┐            │
 *   Slot 3  (M75): W-F  vs 2nd-C             → R16 M90 ┘ → QF M97 ┘ → SF-L
 *   Slot 4  (M76): W-C  vs 2nd-F             → R16 M91 ┐            │
 *   Slot 5  (M78): 2nd-E vs 2nd-I            → R16 M91 ┘ → QF M99 ┐ │
 *   Slot 6  (M79): W-A  vs 3rd(C/E/F/H/I)   → R16 M92 ┐            │
 *   Slot 7  (M80): W-L  vs 3rd(E/H/I/J/K)   → R16 M92 ┘ → QF M99 ┘ ┘
 *   Slot 8  (M83): 2nd-K vs 2nd-L            → R16 M93 ┐            ┐
 *   Slot 9  (M84): W-H  vs 2nd-J             → R16 M93 ┘ → QF M98 ┐ │
 *   Slot 10 (M81): W-D  vs 3rd(B/E/F/I/J)   → R16 M94 ┐            │
 *   Slot 11 (M82): W-G  vs 3rd(A/E/H/I/J)   → R16 M94 ┘ → QF M98 ┘ → SF-R
 *   Slot 12 (M86): W-J  vs 2nd-H             → R16 M95 ┐            │
 *   Slot 13 (M88): 2nd-D vs 2nd-G            → R16 M95 ┘ → QF M100 ┐│
 *   Slot 14 (M85): W-B  vs 3rd(E/F/G/I/J)   → R16 M96 ┐             │
 *   Slot 15 (M87): W-K  vs 3rd(D/E/I/J/L)   → R16 M96 ┘ → QF M100 ┘┘
 *
 * Phase-aware — only projects ONE round ahead:
 *   GROUP_STAGE → R32 PROJ,  R16/QF/SF/Final = TBD
 *   ROUND_OF_32 → R32 real,  R16 PROJ, QF/SF/Final = TBD
 *   ROUND_OF_16 → R16 real,  QF PROJ,  SF/Final = TBD
 *   …and so on
 * ───────────────────────────────────────────────────────────────────────────── */

// ── Tournament phase ──────────────────────────────────────────────────────────

export type TournamentPhase =
  | "PRE_TOURNAMENT"
  | "GROUP_STAGE"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "FINAL"
  | "FINISHED";

export const PHASE_LABELS: Record<TournamentPhase, string> = {
  PRE_TOURNAMENT: "Pré-torneio",
  GROUP_STAGE:    "Fase de Grupos",
  ROUND_OF_32:    "16 Avos de Final",
  ROUND_OF_16:    "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS:    "Semifinais",
  FINAL:          "Final",
  FINISHED:       "Encerrado",
};

const PHASE_ORDER: TournamentPhase[] = [
  "PRE_TOURNAMENT", "GROUP_STAGE", "ROUND_OF_32", "ROUND_OF_16",
  "QUARTER_FINALS", "SEMI_FINALS", "FINAL", "FINISHED",
];

function phaseGte(a: TournamentPhase, b: TournamentPhase): boolean {
  return PHASE_ORDER.indexOf(a) >= PHASE_ORDER.indexOf(b);
}

export function detectPhase(allMatches: Match[], apiKnockout: Match[]): TournamentPhase {
  // Only count matches with real (non-empty) team names — excludes FIFA placeholder matches
  const real = (s: string) =>
    apiKnockout.filter(m => m.stage === s && m.homeTeam?.name && m.awayTeam?.name);
  const allDone = (ms: Match[]) =>
    ms.length > 0 && ms.every(m => m.status === "FINISHED");

  const fi  = real("FINAL");
  const sf  = real("SEMI_FINALS");
  const qf  = real("QUARTER_FINALS");
  const r16 = real("ROUND_OF_16");
  const r32 = real("ROUND_OF_32");

  if (fi.length > 0)  return allDone(fi)  ? "FINISHED"       : "FINAL";
  if (sf.length > 0)  return allDone(sf)  ? "FINAL"          : "SEMI_FINALS";
  if (qf.length > 0)  return allDone(qf)  ? "SEMI_FINALS"    : "QUARTER_FINALS";
  if (r16.length > 0) return allDone(r16) ? "QUARTER_FINALS" : "ROUND_OF_16";
  if (r32.length > 0) return allDone(r32) ? "ROUND_OF_16"    : "ROUND_OF_32";

  const gs = allMatches.filter(m => m.stage === "GROUP_STAGE");
  if (gs.length === 0) return "PRE_TOURNAMENT";
  return allDone(gs) ? "ROUND_OF_32" : "GROUP_STAGE";
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface ResolvedTeam {
  team: Pick<Team, "id" | "name" | "shortName" | "tla" | "crest">;
  isProjected: boolean;
  sourceLabel: string;
}

export interface ProjectedMatch {
  matchId?: number;
  home: ResolvedTeam;
  away: ResolvedTeam;
  stage: string;
  utcDate?: string;
  score?: Match["score"];
  status?: Match["status"];
  isConfirmed: boolean;
}

export interface FullBracket {
  phase:       TournamentPhase;
  r32:         ProjectedMatch[];
  r16:         ProjectedMatch[];
  qf:          ProjectedMatch[];
  sf:          ProjectedMatch[];
  final?:      ProjectedMatch;
  thirdPlace?: ProjectedMatch;
}

// ── Hardcoded Copa 2026 R32 bracket (official FIFA draw) ─────────────────────

type SlotDef =
  | { type: "winner"; group: string }
  | { type: "runner"; group: string }
  // eligibleGroups = groups whose 3rd-place qualifier can fill this slot
  | { type: "best3"; eligibleGroups: string[] };

interface R32SlotDef { home: SlotDef; away: SlotDef }

/*
 * Source: Wikipedia — 2026 FIFA World Cup knockout stage
 * Matches 73–88, bracket pairings 89–96 (R16), 97–100 (QF)
 *
 * LEFT HALF  → slots 0–7  (R32→R16→QF→SF feeding the left side of the Final)
 * RIGHT HALF → slots 8–15 (R32→R16→QF→SF feeding the right side of the Final)
 *
 * Slot pair → R16 → QF mapping:
 *   (0,1)→M89, (2,3)→M90  →  QF M97  ┐
 *   (4,5)→M91, (6,7)→M92  →  QF M99  ┘ → SF-L
 *   (8,9)→M93,(10,11)→M94 →  QF M98  ┐
 *  (12,13)→M95,(14,15)→M96 → QF M100 ┘ → SF-R
 */
export const COPA_2026_R32: R32SlotDef[] = [
  // ── Left half ────────────────────────────────────────────────────────────────
  // Slot 0 — Match 74 (June 29, Foxborough)
  { home: { type: "winner", group: "E" }, away: { type: "best3", eligibleGroups: ["A","B","C","D","F"] } },
  // Slot 1 — Match 77 (June 30, East Rutherford)
  { home: { type: "winner", group: "I" }, away: { type: "best3", eligibleGroups: ["C","D","F","G","H"] } },
  // Slot 2 — Match 73 (June 28, Inglewood)
  { home: { type: "runner", group: "A" }, away: { type: "runner", group: "B" } },
  // Slot 3 — Match 75 (June 29, Guadalajara)
  { home: { type: "winner", group: "F" }, away: { type: "runner", group: "C" } },
  // Slot 4 — Match 76 (June 29, Houston)
  { home: { type: "winner", group: "C" }, away: { type: "runner", group: "F" } },
  // Slot 5 — Match 78 (June 30, Arlington)
  { home: { type: "runner", group: "E" }, away: { type: "runner", group: "I" } },
  // Slot 6 — Match 79 (June 30, Mexico City)
  { home: { type: "winner", group: "A" }, away: { type: "best3", eligibleGroups: ["C","E","F","H","I"] } },
  // Slot 7 — Match 80 (July 1, Atlanta)
  { home: { type: "winner", group: "L" }, away: { type: "best3", eligibleGroups: ["E","H","I","J","K"] } },
  // ── Right half ───────────────────────────────────────────────────────────────
  // Slot 8 — Match 83 (July 2, Toronto)
  { home: { type: "runner", group: "K" }, away: { type: "runner", group: "L" } },
  // Slot 9 — Match 84 (July 2, Inglewood)
  { home: { type: "winner", group: "H" }, away: { type: "runner", group: "J" } },
  // Slot 10 — Match 81 (July 1, Santa Clara)
  { home: { type: "winner", group: "D" }, away: { type: "best3", eligibleGroups: ["B","E","F","I","J"] } },
  // Slot 11 — Match 82 (July 1, Seattle)
  { home: { type: "winner", group: "G" }, away: { type: "best3", eligibleGroups: ["A","E","H","I","J"] } },
  // Slot 12 — Match 86 (July 3, Miami Gardens)
  { home: { type: "winner", group: "J" }, away: { type: "runner", group: "H" } },
  // Slot 13 — Match 88 (July 3, Arlington)
  { home: { type: "runner", group: "D" }, away: { type: "runner", group: "G" } },
  // Slot 14 — Match 85 (July 2, Vancouver)
  { home: { type: "winner", group: "B" }, away: { type: "best3", eligibleGroups: ["E","F","G","I","J"] } },
  // Slot 15 — Match 87 (July 3, Kansas City)
  { home: { type: "winner", group: "K" }, away: { type: "best3", eligibleGroups: ["D","E","I","J","L"] } },
];

// ── Internal helpers ──────────────────────────────────────────────────────────

export function groupLetter(raw: string): string {
  return raw.replace(/^group[_ ]/i, "").trim().toUpperCase();
}

const TBD_TEAM: ResolvedTeam["team"] = {
  id: 0, name: "A definir", shortName: "TBD", tla: "TBD", crest: "",
};

function teamAtPos(standings: Group[], letter: string, pos: number): Team | null {
  const g   = standings.find(s => groupLetter(s.group) === letter);
  const row: Standing | undefined = g?.table[pos - 1];
  return row?.team ?? null;
}

export function bestThirdTeams(standings: Group[], n = 8): { team: Team; group: string }[] {
  return standings
    .map(g => ({ entry: g.table[2], group: groupLetter(g.group) }))
    .filter((x): x is { entry: Standing; group: string } => !!x.entry)
    .map(({ entry, group }) => ({
      team: entry.team, group,
      pts: entry.points, gd: entry.goalDifference, gf: entry.goalsFor,
    }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, n)
    .map(({ team, group }) => ({ team, group }));
}

/**
 * Assign best 8 third-place teams to the 8 bracket slots using eligible-group
 * constraints (from FIFA Annex C). Uses most-constrained-first greedy to avoid
 * impossible assignments.
 */
function computeBest3Assignment(
  best3: { team: Team; group: string }[],
): Map<string, { team: Team; group: string }> {
  // Collect all best3 slot definitions with their keys
  const slots: { key: string; eligible: string[] }[] = [];
  for (let i = 0; i < COPA_2026_R32.length; i++) {
    const s = COPA_2026_R32[i];
    if (s.home.type === "best3") slots.push({ key: `${i}:home`, eligible: s.home.eligibleGroups });
    if (s.away.type === "best3") slots.push({ key: `${i}:away`, eligible: s.away.eligibleGroups });
  }

  const result = new Map<string, { team: Team; group: string }>();
  const usedGroups = new Set<string>();
  const pending = new Set(slots.map(s => s.key));

  // Repeatedly assign the most-constrained remaining slot
  while (pending.size > 0) {
    let mostConstrainedKey = "";
    let minOptions = Infinity;

    for (const slot of slots) {
      if (!pending.has(slot.key)) continue;
      const available = best3.filter(t => slot.eligible.includes(t.group) && !usedGroups.has(t.group)).length;
      if (available < minOptions) { minOptions = available; mostConstrainedKey = slot.key; }
    }

    if (!mostConstrainedKey) break;
    pending.delete(mostConstrainedKey);

    const slot = slots.find(s => s.key === mostConstrainedKey)!;
    const candidate = best3.find(t => slot.eligible.includes(t.group) && !usedGroups.has(t.group));
    if (candidate) {
      result.set(mostConstrainedKey, candidate);
      usedGroups.add(candidate.group);
    }
  }

  return result;
}

function resolveSlot(
  def: SlotDef,
  slotKey: string,
  standings: Group[],
  best3Assignment: Map<string, { team: Team; group: string }>,
): ResolvedTeam {
  if (def.type === "winner") {
    return {
      team: teamAtPos(standings, def.group, 1) ?? TBD_TEAM,
      isProjected: true,
      sourceLabel: `1º Grupo ${def.group}`,
    };
  }
  if (def.type === "runner") {
    return {
      team: teamAtPos(standings, def.group, 2) ?? TBD_TEAM,
      isProjected: true,
      sourceLabel: `2º Grupo ${def.group}`,
    };
  }
  // best3
  const entry = best3Assignment.get(slotKey);
  return {
    team: entry?.team ?? TBD_TEAM,
    isProjected: true,
    sourceLabel: entry ? `Melhor 3º – Grupo ${entry.group}` : "Melhor 3º",
  };
}

const WINNER_RE = /(?:winner|1st|1°|1º)\s+group\s+([A-L])/i;
const RUNNER_RE = /(?:runner.?up|2nd|2°|2º)\s+group\s+([A-L])/i;
const THIRD_RE  = /(?:third|3rd|3°|3º)\s+group\s+([A-L])/i;
const BEST3_RE  = /best\s+(?:third|3rd)/i;

function resolveApiTeam(
  apiTeam: Team,
  standings: Group[],
  best3: { team: Team; group: string }[],
  best3Idx: { n: number },
): ResolvedTeam {
  const name = apiTeam?.name ?? "";
  let m: RegExpMatchArray | null;

  if ((m = name.match(WINNER_RE))) {
    const t = teamAtPos(standings, m[1].toUpperCase(), 1);
    return { team: t ?? apiTeam, isProjected: true, sourceLabel: `1º Grupo ${m[1].toUpperCase()}` };
  }
  if ((m = name.match(RUNNER_RE))) {
    const t = teamAtPos(standings, m[1].toUpperCase(), 2);
    return { team: t ?? apiTeam, isProjected: true, sourceLabel: `2º Grupo ${m[1].toUpperCase()}` };
  }
  if ((m = name.match(THIRD_RE))) {
    const t = teamAtPos(standings, m[1].toUpperCase(), 3);
    return { team: t ?? apiTeam, isProjected: true, sourceLabel: `3º Grupo ${m[1].toUpperCase()}` };
  }
  if (BEST3_RE.test(name)) {
    const entry = best3[best3Idx.n++];
    return {
      team: entry?.team ?? apiTeam,
      isProjected: true,
      sourceLabel: entry ? `Melhor 3º – Grupo ${entry.group}` : "Melhor 3º",
    };
  }

  return { team: apiTeam, isProjected: false, sourceLabel: apiTeam.shortName || apiTeam.tla };
}

function buildNextRound(prev: ProjectedMatch[], stage: string): ProjectedMatch[] {
  const out: ProjectedMatch[] = [];
  for (let i = 0; i < prev.length; i += 2) {
    const m1 = prev[i];
    const m2 = prev[i + 1];
    if (!m1) continue;
    out.push({
      home: winnerOf(m1),
      away: m2 ? winnerOf(m2) : { team: TBD_TEAM, isProjected: false, sourceLabel: "A definir" },
      stage,
      isConfirmed: false,
    });
  }
  return out;
}

function winnerOf(m: ProjectedMatch): ResolvedTeam {
  if (m.score?.winner === "HOME_TEAM") return { ...m.home, isProjected: false };
  if (m.score?.winner === "AWAY_TEAM") return { ...m.away, isProjected: false };
  return { ...m.home, isProjected: true };
}

function loserOf(m: ProjectedMatch): ResolvedTeam {
  if (m.score?.winner === "HOME_TEAM") return { ...m.away, isProjected: false };
  if (m.score?.winner === "AWAY_TEAM") return { ...m.home, isProjected: false };
  return { ...m.away, isProjected: true };
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function buildFullBracket(
  apiKnockout: Match[],
  standings: Group[],
  allMatches: Match[],
): FullBracket {
  const phase = detectPhase(allMatches, apiKnockout);
  const best3 = bestThirdTeams(standings);
  const best3Assignment = computeBest3Assignment(best3);
  const best3Idx = { n: 0 }; // for resolveApiTeam fallback

  // Only use API matches with confirmed team names
  const byStage = (s: string) =>
    apiKnockout
      .filter(m => m.stage === s && m.homeTeam?.name && m.awayTeam?.name)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  function fromApi(m: Match): ProjectedMatch {
    const home = resolveApiTeam(m.homeTeam, standings, best3, best3Idx);
    const away = resolveApiTeam(m.awayTeam, standings, best3, best3Idx);
    return {
      matchId: m.id, home, away,
      stage: m.stage, utcDate: m.utcDate,
      score: m.score, status: m.status,
      isConfirmed: !home.isProjected && !away.isProjected,
    };
  }

  const tbd = (n: number, stage: string): ProjectedMatch[] =>
    Array.from({ length: n }, () => ({
      home: { team: TBD_TEAM, isProjected: false, sourceLabel: "A definir" },
      away: { team: TBD_TEAM, isProjected: false, sourceLabel: "A definir" },
      stage,
      isConfirmed: false,
    }));

  // ── R32 ─────────────────────────────────────────────────────────────────────
  const apiR32 = byStage("ROUND_OF_32");
  const r32: ProjectedMatch[] = COPA_2026_R32.map((slot, i): ProjectedMatch => {
    const apiMatch = apiR32[i];
    if (apiMatch) return fromApi(apiMatch);
    return {
      home: resolveSlot(slot.home, `${i}:home`, standings, best3Assignment),
      away: resolveSlot(slot.away, `${i}:away`, standings, best3Assignment),
      stage: "ROUND_OF_32",
      isConfirmed: false,
    };
  });

  // ── R16 ─────────────────────────────────────────────────────────────────────
  let r16: ProjectedMatch[];
  if (!phaseGte(phase, "ROUND_OF_32")) {
    r16 = tbd(8, "ROUND_OF_16");
  } else {
    const apiR16 = byStage("ROUND_OF_16");
    r16 = apiR16.length > 0 ? apiR16.map(fromApi) : buildNextRound(r32, "ROUND_OF_16");
  }

  // ── QF ──────────────────────────────────────────────────────────────────────
  let qf: ProjectedMatch[];
  if (!phaseGte(phase, "ROUND_OF_16")) {
    qf = tbd(4, "QUARTER_FINALS");
  } else {
    const apiQF = byStage("QUARTER_FINALS");
    qf = apiQF.length > 0 ? apiQF.map(fromApi) : buildNextRound(r16, "QUARTER_FINALS");
  }

  // ── SF ──────────────────────────────────────────────────────────────────────
  let sf: ProjectedMatch[];
  if (!phaseGte(phase, "QUARTER_FINALS")) {
    sf = tbd(2, "SEMI_FINALS");
  } else {
    const apiSF = byStage("SEMI_FINALS");
    sf = apiSF.length > 0 ? apiSF.map(fromApi) : buildNextRound(qf, "SEMI_FINALS");
  }

  // ── Final ────────────────────────────────────────────────────────────────────
  let final: ProjectedMatch | undefined;
  if (!phaseGte(phase, "SEMI_FINALS")) {
    final = tbd(1, "FINAL")[0];
  } else {
    const apiFiReal = byStage("FINAL")[0];
    if (apiFiReal) {
      final = fromApi(apiFiReal);
    } else {
      const projected = buildNextRound(sf, "FINAL")[0];
      const apiFiSched = apiKnockout.find(m => m.stage === "FINAL");
      final = projected && apiFiSched
        ? { ...projected, utcDate: apiFiSched.utcDate, matchId: apiFiSched.id }
        : projected;
    }
  }

  // ── 3rd place ────────────────────────────────────────────────────────────────
  let thirdPlace: ProjectedMatch | undefined;
  if (!phaseGte(phase, "SEMI_FINALS")) {
    thirdPlace = tbd(1, "THIRD_PLACE")[0];
  } else {
    const apiTpReal = byStage("THIRD_PLACE")[0];
    if (apiTpReal) {
      thirdPlace = fromApi(apiTpReal);
    } else {
      const apiTpSched = apiKnockout.find(m => m.stage === "THIRD_PLACE");
      const projected: ProjectedMatch = {
        home: sf[0] ? loserOf(sf[0]) : { team: TBD_TEAM, isProjected: false, sourceLabel: "A definir" },
        away: sf[1] ? loserOf(sf[1]) : { team: TBD_TEAM, isProjected: false, sourceLabel: "A definir" },
        stage: "THIRD_PLACE",
        isConfirmed: false,
      };
      thirdPlace = apiTpSched
        ? { ...projected, utcDate: apiTpSched.utcDate, matchId: apiTpSched.id }
        : projected;
    }
  }

  return { phase, r32, r16, qf, sf, final, thirdPlace };
}

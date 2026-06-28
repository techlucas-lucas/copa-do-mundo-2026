import type { Match, Team, Group, Standing } from "@/types/football";

/* ─────────────────────────────────────────────────────────────────────────────
 * Copa do Mundo 2026 — phase-aware bracket projection
 *
 * R32 hardcoded with confirmed FIFA pairings (June 2026).
 * Slot order preserves official bracket crossings:
 *   Slots 0,1  → R16 M89 (Alemanha/Paraguai vs França/Suécia)        ┐ QF M97 → SF-L
 *   Slots 2,3  → R16 M90 (África do Sul/Canadá vs Holanda/Marrocos)  ┘
 *   Slots 4,5  → R16 M93 (Portugal/Croácia vs Espanha/Áustria)       ┐ QF M98 → SF-L
 *   Slots 6,7  → R16 M94 (EUA/Bósnia vs Bélgica/Senegal)            ┘
 *   Slots 8,9  → R16 M91 (Brasil/Japão vs Costa do Marfim/Noruega)   ┐ QF M99 → SF-R
 *   Slots 10,11 → R16 M92 (México/Equador vs Inglaterra/RD Congo)    ┘
 *   Slots 12,13 → R16 M95 (Argentina/Cabo Verde vs Austrália/Egito)  ┐ QF M100→ SF-R
 *   Slots 14,15 → R16 M96 (Suíça/Argélia vs Colômbia/Gana)          ┘
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

// football-data.org uses LAST_32/LAST_16; normalise to the canonical names we use internally
const STAGE_ALIASES: Record<string, string> = {
  LAST_32:  "ROUND_OF_32",
  LAST_16:  "ROUND_OF_16",
};
function canonicalStage(s: string): string { return STAGE_ALIASES[s] ?? s; }

export function detectPhase(allMatches: Match[], apiKnockout: Match[]): TournamentPhase {
  // Only count matches with real (non-empty) team names — excludes FIFA placeholder matches
  const real = (canonical: string) =>
    apiKnockout.filter(m =>
      canonicalStage(m.stage) === canonical && m.homeTeam?.name && m.awayTeam?.name
    );
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
  | { type: "best3"; eligibleGroups: string[] }
  // names[0] = display name (PT), rest = aliases for API lookup (EN, etc.)
  | { type: "named"; names: string[] };

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
 *   (4,5)→M93, (6,7)→M94  →  QF M98  ┘ → SF-L
 *   (8,9)→M91,(10,11)→M92 →  QF M99  ┐
 *  (12,13)→M95,(14,15)→M96 → QF M100 ┘ → SF-R
 */
export const COPA_2026_R32: R32SlotDef[] = [
  // ── Left half ────────────────────────────────────────────────────────────────
  // Slots 0,1 → R16 M89 (vencedores se enfrentam nas oitavas)
  // Slot 0 — M74
  { home: { type: "named", names: ["Alemanha", "Germany"] },                 away: { type: "named", names: ["Paraguai", "Paraguay"] } },
  // Slot 1 — M77
  { home: { type: "named", names: ["França", "France"] },                    away: { type: "named", names: ["Suécia", "Sweden"] } },
  // Slots 2,3 → R16 M90
  // Slot 2 — M73
  { home: { type: "named", names: ["África do Sul", "South Africa"] },       away: { type: "named", names: ["Canadá", "Canada"] } },
  // Slot 3 — M75
  { home: { type: "named", names: ["Holanda", "Netherlands", "Holland"] },   away: { type: "named", names: ["Marrocos", "Morocco"] } },
  // Slots 4,5 → R16 M93
  // Slot 4 — M83
  { home: { type: "named", names: ["Portugal"] },                            away: { type: "named", names: ["Croácia", "Croatia"] } },
  // Slot 5 — M84
  { home: { type: "named", names: ["Espanha", "Spain"] },                    away: { type: "named", names: ["Áustria", "Austria"] } },
  // Slots 6,7 → R16 M94
  // Slot 6 — M81
  { home: { type: "named", names: ["Estados Unidos", "United States", "USA"] }, away: { type: "named", names: ["Bósnia", "Bosnia", "Bosnia and Herzegovina"] } },
  // Slot 7 — M82
  { home: { type: "named", names: ["Bélgica", "Belgium"] },                  away: { type: "named", names: ["Senegal"] } },
  // ── Right half ───────────────────────────────────────────────────────────────
  // Slots 8,9 → R16 M91
  // Slot 8 — M76
  { home: { type: "named", names: ["Brasil", "Brazil"] },                    away: { type: "named", names: ["Japão", "Japan"] } },
  // Slot 9 — M78
  { home: { type: "named", names: ["Costa do Marfim", "Ivory Coast", "Côte d'Ivoire"] }, away: { type: "named", names: ["Noruega", "Norway"] } },
  // Slots 10,11 → R16 M92
  // Slot 10 — M79
  { home: { type: "named", names: ["México", "Mexico"] },                    away: { type: "named", names: ["Equador", "Ecuador"] } },
  // Slot 11 — M80
  { home: { type: "named", names: ["Inglaterra", "England"] },               away: { type: "named", names: ["RD Congo", "DR Congo", "Congo DR", "Democratic Republic of Congo"] } },
  // Slots 12,13 → R16 M95
  // Slot 12 — M86
  { home: { type: "named", names: ["Argentina"] },                           away: { type: "named", names: ["Cabo Verde", "Cape Verde"] } },
  // Slot 13 — M88
  { home: { type: "named", names: ["Austrália", "Australia"] },              away: { type: "named", names: ["Egito", "Egypt"] } },
  // Slots 14,15 → R16 M96
  // Slot 14 — M85
  { home: { type: "named", names: ["Suíça", "Switzerland"] },                away: { type: "named", names: ["Argélia", "Algeria"] } },
  // Slot 15 — M87
  { home: { type: "named", names: ["Colômbia", "Colombia"] },                away: { type: "named", names: ["Gana", "Ghana"] } },
];

// ── Internal helpers ──────────────────────────────────────────────────────────

export function groupLetter(raw: string): string {
  return raw.replace(/^group[_ ]/i, "").trim().toUpperCase();
}

const TBD_TEAM: ResolvedTeam["team"] = {
  id: 0, name: "A definir", shortName: "TBD", tla: "TBD", crest: "",
};

function normalizeStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Find the API R32 match that corresponds to a named slot, by matching team names
// (order-independent, handles both home/away orientations)
function findNamedApiMatch(apiMatches: Match[], homeNames: string[], awayNames: string[]): Match | undefined {
  const hn = homeNames.map(normalizeStr);
  const an = awayNames.map(normalizeStr);
  return apiMatches.find(m => {
    const h = normalizeStr(m.homeTeam?.name ?? "");
    const a = normalizeStr(m.awayTeam?.name ?? "");
    const fwd = hn.some(n => h === n || h.includes(n) || n.includes(h)) &&
                an.some(n => a === n || a.includes(n) || n.includes(a));
    const rev = an.some(n => h === n || h.includes(n) || n.includes(h)) &&
                hn.some(n => a === n || a.includes(n) || n.includes(a));
    return fwd || rev;
  });
}

function findTeamInStandings(standings: Group[], names: string[]): Team | null {
  const needles = names.map(normalizeStr);
  for (const group of standings) {
    for (const row of group.table) {
      const t = row.team;
      const candidates = [t.name, t.shortName, t.tla]
        .filter(Boolean)
        .map(s => normalizeStr(s!));
      if (candidates.some(c => needles.some(n => c === n || c.includes(n) || n.includes(c)))) {
        return t;
      }
    }
  }
  return null;
}

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
  if (def.type === "named") {
    return {
      team: findTeamInStandings(standings, def.names) ?? TBD_TEAM,
      isProjected: true,
      sourceLabel: def.names[0],
    };
  }
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
  // normalise LAST_32 → ROUND_OF_32, LAST_16 → ROUND_OF_16, etc.
  const byStage = (canonical: string) =>
    apiKnockout
      .filter(m => canonicalStage(m.stage) === canonical && m.homeTeam?.name && m.awayTeam?.name)
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
  // isPlaceholder: API sometimes returns "Winner Group X" before teams are confirmed
  const isPlaceholderName = (name?: string) =>
    !name || WINNER_RE.test(name) || RUNNER_RE.test(name) || THIRD_RE.test(name) || BEST3_RE.test(name);

  const apiR32 = byStage("ROUND_OF_32");
  const r32: ProjectedMatch[] = COPA_2026_R32.map((slot, i): ProjectedMatch => {
    // For named slots, find the matching API match by team name — NOT by date-order index,
    // because the API sorts by date while slots are in bracket-position order.
    const apiMatch = (slot.home.type === "named" && slot.away.type === "named")
      ? findNamedApiMatch(apiR32, slot.home.names, slot.away.names)
      : apiR32[i];

    if (apiMatch &&
        !isPlaceholderName(apiMatch.homeTeam?.name) &&
        !isPlaceholderName(apiMatch.awayTeam?.name)) {
      return fromApi(apiMatch);
    }
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

"use client";

import { useState, useMemo, Fragment } from "react";
import Image from "next/image";
import type { Match, Team } from "@/types/football";
import { groupLetter } from "@/lib/bracket-projection";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamStats {
  team: Team;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

type SimScores = Record<number, { home: number | null; away: number | null }>;

// ── Standings engine ──────────────────────────────────────────────────────────

function computeStandings(matches: Match[], sim: SimScores): Record<string, TeamStats[]> {
  const data: Record<string, Record<number, TeamStats>> = {};

  for (const m of matches) {
    if (m.stage !== "GROUP_STAGE" || !m.group) continue;
    const grp = groupLetter(m.group);
    if (!data[grp]) data[grp] = {};

    const init = (t: Team) => {
      if (!data[grp][t.id])
        data[grp][t.id] = {
          team: t, played: 0, won: 0, draw: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, points: 0,
        };
    };
    init(m.homeTeam);
    init(m.awayTeam);

    const isPlayed = ["FINISHED", "IN_PLAY", "LIVE", "PAUSED"].includes(m.status);
    let hg: number | null = isPlayed ? m.score.fullTime.home : (sim[m.id]?.home ?? null);
    let ag: number | null = isPlayed ? m.score.fullTime.away : (sim[m.id]?.away ?? null);

    // Both goals must be set to apply the result
    if (hg === null || ag === null) continue;

    const h = data[grp][m.homeTeam.id];
    const a = data[grp][m.awayTeam.id];
    h.played++; a.played++;
    h.goalsFor += hg; h.goalsAgainst += ag;
    a.goalsFor += ag; a.goalsAgainst += hg;

    if (hg > ag)      { h.won++; a.lost++; h.points += 3; }
    else if (hg < ag) { a.won++; h.lost++; a.points += 3; }
    else              { h.draw++; a.draw++; h.points++; a.points++; }
  }

  const result: Record<string, TeamStats[]> = {};
  for (const [grp, teams] of Object.entries(data)) {
    result[grp] = Object.values(teams).sort((a, b) =>
      b.points - a.points ||
      (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      a.team.name.localeCompare(b.team.name),
    );
  }
  return result;
}

// ── Score input (stepper + direct input) ─────────────────────────────────────

function ScoreInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => {
          if (value === null) onChange(0);
          else if (value > 0) onChange(value - 1);
        }}
        className="w-7 h-10 flex items-center justify-center bg-gray-800 border border-r-0 border-gray-700 rounded-l-lg text-gray-300 hover:text-white hover:bg-gray-700 text-base font-bold transition-colors"
        aria-label="Diminuir"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={99}
        value={value ?? ""}
        onChange={(e) => {
          if (e.target.value === "") { onChange(null); return; }
          onChange(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)));
        }}
        placeholder="–"
        aria-label="Placar"
        className="
          w-10 h-10 text-center bg-gray-800 border-y border-gray-700
          text-white font-black text-lg focus:outline-none focus:border-yellow-500
          tabular-nums
          [appearance:textfield]
          [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none
        "
      />
      <button
        type="button"
        onClick={() => onChange((value ?? -1) + 1)}
        className="w-7 h-10 flex items-center justify-center bg-gray-800 border border-l-0 border-gray-700 rounded-r-lg text-gray-300 hover:text-white hover:bg-gray-700 text-base font-bold transition-colors"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}

// ── Match row ─────────────────────────────────────────────────────────────────

const PLAYED_STATUSES = new Set(["FINISHED", "IN_PLAY", "LIVE", "PAUSED"]);

function MatchSimRow({
  match,
  simScore,
  onChange,
}: {
  match: Match;
  simScore: { home: number | null; away: number | null } | undefined;
  onChange: (side: "home" | "away", value: number | null) => void;
}) {
  const isFixed = PLAYED_STATUSES.has(match.status);
  const isLive  = match.status === "IN_PLAY" || match.status === "LIVE";

  const hg = isFixed ? match.score.fullTime.home : (simScore?.home ?? null);
  const ag = isFixed ? match.score.fullTime.away : (simScore?.away ?? null);
  const hasScore = hg !== null && ag !== null;

  const homeWon = hasScore && hg! > ag!;
  const awayWon = hasScore && ag! > hg!;

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  }).format(new Date(match.utcDate));

  return (
    <article className={`
      rounded-xl border px-3 py-2.5 flex items-center gap-2 transition-colors
      ${isLive  ? "border-red-800 bg-red-950/10"
      : isFixed ? "border-gray-700 bg-gray-900/80"
                : "border-gray-800 bg-gray-900 hover:border-gray-700"}
    `}>
      {/* Group label */}
      <span className="hidden sm:block w-14 text-[10px] text-gray-600 font-mono text-right shrink-0">
        {match.group ? `Gr. ${groupLetter(match.group)}` : ""}
      </span>

      {/* Home team */}
      <div className="flex flex-1 items-center gap-1.5 min-w-0 justify-end">
        <span className={`text-sm font-semibold truncate text-right leading-tight ${homeWon ? "text-yellow-400" : "text-white"}`}>
          {match.homeTeam.shortName || match.homeTeam.tla}
        </span>
        {match.homeTeam.crest ? (
          <Image src={match.homeTeam.crest} alt="" width={22} height={22} className="object-contain shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-700 shrink-0" />
        )}
      </div>

      {/* Score / input */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isFixed ? (
          <div className="flex items-center gap-1 min-w-[72px] justify-center">
            {isLive && <span className="live-dot mr-1" aria-hidden />}
            <span className={`text-2xl font-black tabular-nums leading-none ${homeWon ? "text-yellow-400" : "text-white"}`}>
              {hg ?? "–"}
            </span>
            <span className="text-gray-600 text-sm mx-0.5">—</span>
            <span className={`text-2xl font-black tabular-nums leading-none ${awayWon ? "text-yellow-400" : "text-white"}`}>
              {ag ?? "–"}
            </span>
          </div>
        ) : (
          <>
            <ScoreInput value={hg} onChange={(v) => onChange("home", v)} />
            <span className="text-gray-700 text-xs font-bold px-0.5">×</span>
            <ScoreInput value={ag} onChange={(v) => onChange("away", v)} />
          </>
        )}
      </div>

      {/* Away team */}
      <div className="flex flex-1 items-center gap-1.5 min-w-0">
        {match.awayTeam.crest ? (
          <Image src={match.awayTeam.crest} alt="" width={22} height={22} className="object-contain shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-700 shrink-0" />
        )}
        <span className={`text-sm font-semibold truncate leading-tight ${awayWon ? "text-yellow-400" : "text-white"}`}>
          {match.awayTeam.shortName || match.awayTeam.tla}
        </span>
      </div>

      {/* Time (unplayed only) */}
      {!isFixed && (
        <span className="hidden sm:block w-12 text-[11px] text-gray-500 text-right shrink-0 tabular-nums">
          {time}
        </span>
      )}
    </article>
  );
}

// ── Compact group table ───────────────────────────────────────────────────────

function GroupCard({ group, standings }: { group: string; standings: TeamStats[] }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-800/80 border-b border-gray-700/60 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-gray-200">
          Grupo {group}
        </span>
        <div className="flex gap-2 text-[10px] font-bold uppercase text-gray-500">
          <span className="w-5 text-right">Pts</span>
          <span className="w-6 text-right">GD</span>
          <span className="w-4 text-right">J</span>
        </div>
      </div>

      {/* Rows */}
      {standings.map((s, idx) => {
        const gd = s.goalsFor - s.goalsAgainst;
        return (
          <div
            key={s.team.id}
            className={`flex items-center px-3 py-2 border-b border-gray-800/50 last:border-0 gap-2 ${
              idx < 2    ? "bg-green-950/30"
              : idx === 2 ? "bg-yellow-950/20"
                          : ""
            }`}
          >
            <span className="text-xs text-gray-500 w-3 shrink-0 tabular-nums">{idx + 1}</span>
            {s.team.crest ? (
              <Image src={s.team.crest} alt="" width={16} height={16} className="object-contain shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-gray-700 shrink-0" />
            )}
            <span className="flex-1 text-xs font-semibold text-white truncate">{s.team.tla}</span>
            <div className="flex gap-2 text-xs tabular-nums shrink-0">
              <span className="w-5 text-right font-black text-white">{s.points}</span>
              <span className={`w-6 text-right font-medium ${gd > 0 ? "text-green-400" : gd < 0 ? "text-red-400" : "text-gray-500"}`}>
                {gd > 0 ? "+" : ""}{gd}
              </span>
              <span className="w-4 text-right text-gray-500">{s.played}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Round navigation ──────────────────────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export default function SimulatorClient({ matches }: { matches: Match[] }) {
  // Distinct matchdays for group stage, sorted
  const matchdays = useMemo(() => {
    const days = new Set(
      matches.filter(m => m.stage === "GROUP_STAGE" && m.matchday != null).map(m => m.matchday!),
    );
    return [...days].sort((a, b) => a - b);
  }, [matches]);

  // Default to first matchday with unplayed matches, else last matchday
  const [currentMatchday, setCurrentMatchday] = useState<number>(() => {
    const groupMatches = matches
      .filter(m => m.stage === "GROUP_STAGE" && m.matchday != null)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
    const next = groupMatches.find(m => m.status !== "FINISHED");
    return next?.matchday ?? groupMatches[groupMatches.length - 1]?.matchday ?? 1;
  });

  const [simScores, setSimScores] = useState<SimScores>({});

  const handleScore = (matchId: number, side: "home" | "away", value: number | null) => {
    setSimScores(prev => ({
      ...prev,
      [matchId]: {
        home: side === "home" ? value : (prev[matchId]?.home ?? null),
        away: side === "away" ? value : (prev[matchId]?.away ?? null),
      },
    }));
  };

  // Live standings from sim + actual results
  const computedGroups = useMemo(
    () => computeStandings(matches, simScores),
    [matches, simScores],
  );

  // Matches for the visible round, sorted chronologically
  const roundMatches = useMemo(
    () =>
      matches
        .filter(m => m.stage === "GROUP_STAGE" && m.matchday === currentMatchday)
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()),
    [matches, currentMatchday],
  );

  const mdIdx    = matchdays.indexOf(currentMatchday);
  const hasPrev  = mdIdx > 0;
  const hasNext  = mdIdx < matchdays.length - 1;

  // Count simulated (non-null) matches
  const simCount = Object.values(simScores).filter(s => s.home !== null || s.away !== null).length;

  // Date-change separator helper
  const dayOf = (utcDate: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "short", day: "2-digit", month: "long",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(utcDate));

  return (
    <div>
      {/* Top bar: sim status + reset */}
      {simCount > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-blue-950/30 border border-blue-900/40">
          <span className="text-xs text-blue-400 flex-1">
            {simCount} resultado{simCount !== 1 ? "s" : ""} simulado{simCount !== 1 ? "s" : ""} —
            classificação atualizada abaixo
          </span>
          <button
            type="button"
            onClick={() => setSimScores({})}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white transition-colors"
          >
            Resetar
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[420px_1fr] lg:items-start gap-6">

        {/* ── Left: Group standings ── */}
        <aside className="lg:sticky lg:top-16 lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto">
          <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
            Classificação
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
            {Object.entries(computedGroups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([grp, standings]) => (
                <GroupCard key={grp} group={grp} standings={standings} />
              ))}
          </div>

          <div className="mt-3 flex flex-col gap-1 text-[10px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-950 border border-green-900/60" />
              <span>1º e 2º — classificam automaticamente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-yellow-950 border border-yellow-900/60" />
              <span>3º — potencial melhor terceiro</span>
            </div>
          </div>
        </aside>

        {/* ── Right: Round + matches ── */}
        <section>
          {/* Round navigation */}
          <div className="flex items-center justify-between gap-3 mb-5 p-3 rounded-xl bg-gray-900 border border-gray-800">
            <button
              type="button"
              onClick={() => hasPrev && setCurrentMatchday(matchdays[mdIdx - 1])}
              disabled={!hasPrev}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:border-gray-600 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              <ChevronLeft />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="text-center">
              <p className="text-lg font-black text-white">Rodada {currentMatchday}</p>
              <p className="text-xs text-gray-500">
                {currentMatchday} de {matchdays.length} &middot; {roundMatches.length} jogos
              </p>
            </div>

            <button
              type="button"
              onClick={() => hasNext && setCurrentMatchday(matchdays[mdIdx + 1])}
              disabled={!hasNext}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:border-gray-600 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight />
            </button>
          </div>

          {/* Match list with date separators */}
          <div className="flex flex-col gap-2">
            {roundMatches.map((m, idx) => {
              const today = dayOf(m.utcDate);
              const prevDay = idx > 0 ? dayOf(roundMatches[idx - 1].utcDate) : null;
              return (
                <Fragment key={m.id}>
                  {today !== prevDay && (
                    <p className={`text-[11px] uppercase tracking-widest text-gray-500 font-bold ${idx > 0 ? "mt-3" : ""}`}>
                      {today}
                    </p>
                  )}
                  <MatchSimRow
                    match={m}
                    simScore={PLAYED_STATUSES.has(m.status) ? undefined : simScores[m.id]}
                    onChange={(side, value) => handleScore(m.id, side, value)}
                  />
                </Fragment>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

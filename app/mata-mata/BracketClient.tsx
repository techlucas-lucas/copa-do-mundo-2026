"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import type { ProjectedMatch, ResolvedTeam, FullBracket, TournamentPhase } from "@/lib/bracket-projection";
import { PHASE_LABELS } from "@/lib/bracket-projection";

const POLL_MS = 30_000;

// ── API response shape ────────────────────────────────────────────────────────
interface BracketResponse {
  bracket: FullBracket;
  updatedAt: string;
}

// ── Team row ──────────────────────────────────────────────────────────────────
function TeamRow({ resolved, score, won }: {
  resolved: ResolvedTeam;
  score: number | null;
  won: boolean;
}) {
  const { team, isProjected, sourceLabel } = resolved;
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 transition-colors ${won ? "bg-yellow-900/20" : ""}`}
      title={isProjected ? `Projetado: ${sourceLabel}` : team.name}
    >
      {team.crest ? (
        <Image src={team.crest} alt={team.name} width={18} height={18} className="object-contain shrink-0" />
      ) : (
        <div className="w-[18px] h-[18px] rounded-full bg-gray-700 shrink-0 flex items-center justify-center text-[8px] text-gray-500 font-bold">
          {team.tla?.slice(0, 2) ?? "?"}
        </div>
      )}
      <span className={`text-xs truncate flex-1 font-semibold leading-tight ${won ? "text-yellow-400" : isProjected ? "text-gray-300" : "text-white"}`}>
        {team.shortName || team.tla || team.name}
      </span>
      {isProjected && (
        <span className="text-[8px] font-black uppercase tracking-wide text-blue-400 shrink-0 border border-blue-900 rounded px-0.5">
          PROJ
        </span>
      )}
      {score !== null && (
        <span className={`text-xs font-black tabular-nums shrink-0 ${won ? "text-yellow-400" : "text-gray-400"}`}>
          {score}
        </span>
      )}
    </div>
  );
}

// ── Slot card ─────────────────────────────────────────────────────────────────
function SlotCard({ match, label, highlighted = false }: {
  match?: ProjectedMatch;
  label?: string;
  highlighted?: boolean;
}) {
  const isLive    = match?.status === "IN_PLAY" || match?.status === "LIVE";
  const showScore = match ? ["FINISHED", "IN_PLAY", "LIVE", "PAUSED"].includes(match.status ?? "") : false;
  const homeWon   = match?.score?.winner === "HOME_TEAM";
  const awayWon   = match?.score?.winner === "AWAY_TEAM";
  const confirmed = match?.isConfirmed;
  const projected = !confirmed && !!match;

  return (
    <div className={`
      w-44 rounded-lg border overflow-hidden transition-all duration-300
      ${highlighted  ? "border-yellow-600 bg-yellow-950/20"
        : isLive     ? "border-red-700 bg-red-950/10"
        : confirmed  ? "border-gray-600 bg-gray-900"
        : projected  ? "border-gray-700 border-dashed bg-gray-900"
                     : "border-gray-800 bg-gray-900"}
    `} role="article" aria-label={label}>
      {label && (
        <div className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border-b ${
          highlighted ? "bg-yellow-600/20 text-yellow-500 border-yellow-700/30"
                      : "bg-gray-800 text-gray-600 border-gray-700/50"
        }`}>
          {label}
          {isLive && <span className="ml-1 text-red-400 font-black animate-pulse">● AO VIVO</span>}
        </div>
      )}
      <div className="divide-y divide-gray-800/80">
        {match ? (
          <>
            <TeamRow resolved={match.home} score={showScore ? (match.score?.fullTime.home ?? 0) : null} won={homeWon} />
            <TeamRow resolved={match.away} score={showScore ? (match.score?.fullTime.away ?? 0) : null} won={awayWon} />
          </>
        ) : (
          <><TbdRow /><TbdRow /></>
        )}
      </div>
    </div>
  );
}

function TbdRow() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="w-[18px] h-[18px] rounded-full bg-gray-800 shrink-0" />
      <span className="text-xs text-gray-600 italic">A definir</span>
    </div>
  );
}

// ── Round column ──────────────────────────────────────────────────────────────
function RoundColumn({ label, short, matches, side }: {
  label: string; short: string;
  matches: (ProjectedMatch | undefined)[];
  side: "left" | "right";
}) {
  const isRight = side === "right";
  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
        {short}
      </div>
      <div className="relative flex flex-col gap-2">
        {matches.map((match, idx) => {
          const isPairStart = idx % 2 === 0;
          const hasPair     = idx + 1 < matches.length;
          return (
            <div key={idx} className="relative flex items-center">
              {/* Horizontal arm */}
              <div className={`absolute top-1/2 w-5 h-px bg-gray-700 ${isRight ? "-left-5" : "-right-5"}`} aria-hidden />
              {/* Vertical bracket arm */}
              {isPairStart && hasPair && (
                <div
                  className={`absolute top-1/2 w-px bg-gray-700 ${isRight ? "-left-5" : "-right-5"}`}
                  style={{ height: "calc(100% + 8px + 2px)" }}
                  aria-hidden
                />
              )}
              <SlotCard match={match} label={`${short} · ${idx + 1}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Final column ──────────────────────────────────────────────────────────────
function FinalColumn({ finalMatch, thirdPlace }: {
  finalMatch?: ProjectedMatch;
  thirdPlace?: ProjectedMatch;
}) {
  return (
    <div className="flex flex-col items-center gap-4 z-10">
      <TrophyIcon className="w-9 h-9 text-yellow-400" />
      <div className="flex flex-col items-center gap-1.5">
        <span className="px-3 py-0.5 rounded-full bg-yellow-600/20 border border-yellow-600/40 text-[10px] font-black uppercase tracking-widest text-yellow-400">
          Final
        </span>
        <SlotCard match={finalMatch} label="Grande Final" highlighted />
      </div>
      <div className="flex flex-col items-center gap-1.5 mt-2 opacity-70">
        <span className="px-3 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-[9px] font-bold uppercase tracking-widest text-gray-500">
          3º Lugar
        </span>
        <SlotCard match={thirdPlace} label="Disputa 3º Lugar" />
      </div>
    </div>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M6 2h12M6 2v6a6 6 0 0 0 12 0V2M6 2H3v4a3 3 0 0 0 3 3M18 2h3v4a3 3 0 0 1-3 3M12 14v4M8 21h8M10 18h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Phase banner ──────────────────────────────────────────────────────────────
const NEXT_PHASE_LABEL: Partial<Record<TournamentPhase, string>> = {
  GROUP_STAGE:    "projetando 16 Avos",
  ROUND_OF_32:    "projetando Oitavas",
  ROUND_OF_16:    "projetando Quartas",
  QUARTER_FINALS: "projetando Semis",
  SEMI_FINALS:    "projetando Final",
};

function PhaseBanner({ phase }: { phase: TournamentPhase }) {
  const label  = PHASE_LABELS[phase];
  const next   = NEXT_PHASE_LABEL[phase];
  const isLive = ["ROUND_OF_32","ROUND_OF_16","QUARTER_FINALS","SEMI_FINALS","FINAL"].includes(phase);
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg bg-gray-900 border border-gray-800">
      {isLive && <span className="live-dot shrink-0" aria-hidden />}
      <span className="text-xs font-semibold text-white">
        Fase atual: <span className="text-yellow-400">{label}</span>
      </span>
      {next && (
        <span className="text-xs text-blue-400 flex items-center gap-1">
          <span className="text-[9px] font-black border border-blue-800 rounded px-1">PROJ</span>
          {next}
        </span>
      )}
      {phase === "FINISHED" && (
        <span className="text-xs text-green-400 font-semibold">Torneio encerrado</span>
      )}
    </div>
  );
}

// ── Status bar ────────────────────────────────────────────────────────────────
function StatusBar({ updatedAt, allMatches }: { updatedAt: string; allMatches: ProjectedMatch[] }) {
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(updatedAt));

  const liveCount = allMatches.filter(m => m.status === "IN_PLAY" || m.status === "LIVE").length;
  const doneCount = allMatches.filter(m => m.status === "FINISHED").length;
  const total     = allMatches.length;

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs mb-3">
      <span className="flex items-center gap-1.5 text-gray-600">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden />
        Atualiza a cada 30s · última vez às {time}
      </span>
      {total > 0 && <span className="text-gray-500">{doneCount}/{total} encerradas</span>}
      {liveCount > 0 && (
        <span className="flex items-center gap-1.5 text-red-400 font-semibold">
          <span className="live-dot" aria-hidden />
          {liveCount} ao vivo
        </span>
      )}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500 mb-5">
      <div className="flex items-center gap-1.5">
        <div className="w-10 h-px bg-gray-600" />
        <span>Confronto confirmado pela FIFA</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-10 h-px border-t border-dashed border-gray-600" />
        <span>Confronto projetado</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-black text-blue-400 border border-blue-900 rounded px-1 py-0.5">PROJ</span>
        <span>Seleção projetada com base na classificação atual</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BracketClient({ initial }: { initial: BracketResponse }) {
  const [data, setData] = useState<BracketResponse>(initial);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchLatest = useCallback(async () => {
    try {
      const res  = await fetch("/api/bracket", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as BracketResponse;
      setData(json);
    } catch { /* keep stale data on network error */ }
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(fetchLatest, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchLatest]);

  const { bracket, updatedAt } = data;
  const allMatches = [...bracket.r32, ...bracket.r16, ...bracket.qf, ...bracket.sf,
    ...(bracket.final ? [bracket.final] : []),
    ...(bracket.thirdPlace ? [bracket.thirdPlace] : [])];

  const hasR32 = bracket.r32.length > 0;

  // ── Split into left/right halves ──
  const half = <T,>(arr: T[]): [T[], T[]] => {
    const mid = Math.ceil(arr.length / 2);
    return [arr.slice(0, mid), arr.slice(mid)];
  };
  const pad = <T,>(arr: T[], n: number): (T | undefined)[] =>
    [...arr, ...Array(Math.max(0, n - arr.length)).fill(undefined)].slice(0, n);

  const [r32L, r32R] = half(pad(bracket.r32, 16));
  const [r16L, r16R] = half(pad(bracket.r16, 8));
  const [qfL,  qfR ] = half(pad(bracket.qf,  4));
  const [sfL,  sfR ] = half(pad(bracket.sf,  2));

  const leftCols  = [
    { short: "R32", matches: r32L },
    { short: "R16", matches: r16L },
    { short: "QF",  matches: qfL  },
    { short: "SF",  matches: sfL  },
  ];
  const rightCols = [
    { short: "SF",  matches: sfR  },
    { short: "QF",  matches: qfR  },
    { short: "R16", matches: r16R },
    { short: "R32", matches: r32R },
  ];

  return (
    <div>
      <PhaseBanner phase={bracket.phase} />
      <StatusBar updatedAt={updatedAt} allMatches={allMatches} />
      <Legend />

      {/* overflow-x-auto on a clean wrapper — no negative margins that fight parent padding */}
      <div className="overflow-x-auto pb-6" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="min-w-max px-2">
          {hasR32 ? (
            <div className="flex items-center justify-center gap-0">
              {leftCols.map((col, i) => (
                <div key={`L${i}`} className="flex items-center">
                  <RoundColumn {...col} label={col.short} side="left" />
                  <div className="w-5 shrink-0" aria-hidden />
                </div>
              ))}
              <FinalColumn finalMatch={bracket.final} thirdPlace={bracket.thirdPlace} />
              {rightCols.map((col, i) => (
                <div key={`R${i}`} className="flex items-center">
                  <div className="w-5 shrink-0" aria-hidden />
                  <RoundColumn {...col} label={col.short} side="right" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );

}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-600">
      <TrophyIcon className="w-12 h-12 text-yellow-800 mb-4" />
      <p className="text-sm">Aguardando dados da fase de grupos</p>
      <p className="text-xs mt-1">O bracket será populado assim que a API retornar as classificações</p>
    </div>
  );
}

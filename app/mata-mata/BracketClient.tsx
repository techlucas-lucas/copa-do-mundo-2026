"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import type {
  ProjectedMatch,
  ResolvedTeam,
  FullBracket,
  TournamentPhase,
} from "@/lib/bracket-projection";
import { PHASE_LABELS } from "@/lib/bracket-projection";

const POLL_MS  = 30_000;
const BASE_W   = 110;  // px per R32 slot — determines all bracket proportions
const CONN_H   = 32;   // px height for connector rows between rounds

interface BracketResponse {
  bracket: FullBracket;
  updatedAt: string;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function ShieldIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5L12 1zm0 5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm0 11c-1.93 0-3.6-.88-4.72-2.25C7.55 13.67 9.7 13 12 13c2.3 0 4.45.67 4.72 1.75C15.6 16.12 13.93 17 12 17z" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M6 2h12M6 2v6a6 6 0 0 0 12 0V2M6 2H3v4a3 3 0 0 0 3 3M18 2h3v4a3 3 0 0 1-3 3M12 14v4M8 21h8M10 18h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Team cell (one side of a match card) ──────────────────────────────────────
function TeamCell({
  resolved,
  won,
  score,
  showScore,
}: {
  resolved?: ResolvedTeam;
  won: boolean;
  score: number | null;
  showScore: boolean;
}) {
  const isTbd = !resolved || resolved.team.id === 0;
  const team  = resolved?.team;

  return (
    <div className="flex flex-col items-center gap-[2px]" style={{ width: 33 }}>
      {/* Crest / shield */}
      {isTbd ? (
        <span className="text-gray-600"><ShieldIcon size={20} /></span>
      ) : team?.crest ? (
        <Image
          src={team.crest}
          alt={team.name ?? ""}
          width={22}
          height={16}
          className="object-contain rounded-sm"
          unoptimized
        />
      ) : (
        <div
          className="flex items-center justify-center rounded bg-gray-700 text-[7px] font-black text-gray-300"
          style={{ width: 22, height: 16 }}
        >
          {team?.tla?.slice(0, 2) ?? "?"}
        </div>
      )}

      {/* TLA */}
      <span
        className={`font-bold leading-none ${
          won    ? "text-yellow-400"
          : isTbd ? "text-gray-600"
          :         "text-white"
        }`}
        style={{ fontSize: 8 }}
      >
        {isTbd ? "---" : (team?.tla || team?.shortName?.slice(0, 3) || "???")}
      </span>

      {/* Score */}
      {showScore && score !== null && (
        <span
          className={`font-black tabular-nums leading-none ${won ? "text-yellow-300" : "text-gray-500"}`}
          style={{ fontSize: 9 }}
        >
          {score}
        </span>
      )}

      {/* Selection circle */}
      <div
        className={`rounded-full border-2 ${
          won ? "border-yellow-400 bg-yellow-400/20" : "border-gray-600"
        }`}
        style={{ width: 13, height: 13 }}
      />
    </div>
  );
}

// ── Match card ────────────────────────────────────────────────────────────────
function MatchCard({
  match,
  label,
  highlighted = false,
}: {
  match?: ProjectedMatch;
  label: string;
  highlighted?: boolean;
}) {
  const isLive      = match?.status === "IN_PLAY" || match?.status === "LIVE";
  const showScore   = match
    ? ["FINISHED", "IN_PLAY", "LIVE", "PAUSED"].includes(match.status ?? "")
    : false;
  const homeWon     = match?.score?.winner === "HOME_TEAM";
  const awayWon     = match?.score?.winner === "AWAY_TEAM";
  const isConfirmed = match?.isConfirmed;
  const isProj      = !isConfirmed && !!match;

  return (
    <div className="flex flex-col items-center">
      {/* Label */}
      <p
        className="text-center text-gray-500 font-medium leading-tight mb-1"
        style={{ fontSize: 7.5, maxWidth: BASE_W - 4 }}
      >
        {label}
      </p>

      {/* Card box */}
      <div
        className={`rounded-xl border overflow-hidden transition-all ${
          highlighted  ? "border-yellow-600 bg-yellow-950/20"
          : isLive     ? "border-red-600    bg-red-950/10"
          : isConfirmed? "border-gray-500   bg-gray-900"
          : isProj     ? "border-gray-700   bg-gray-900"
          :               "border-gray-800   bg-gray-900"
        }`}
        style={{
          borderStyle: isProj && !isConfirmed && !isLive && !highlighted ? "dashed" : "solid",
        }}
      >
        <div className="flex items-center gap-1 px-1.5 py-1.5">
          <TeamCell
            resolved={match?.home}
            won={homeWon}
            score={match?.score?.fullTime.home ?? null}
            showScore={showScore}
          />
          <span className="text-gray-600 font-black" style={{ fontSize: 11 }}>×</span>
          <TeamCell
            resolved={match?.away}
            won={awayWon}
            score={match?.score?.fullTime.away ?? null}
            showScore={showScore}
          />
        </div>
        {isLive && (
          <div className="px-1 py-0.5 bg-red-950/40 text-center animate-pulse" style={{ fontSize: 7, color: "#f87171" }}>
            AO VIVO
          </div>
        )}
      </div>
    </div>
  );
}

// ── Connector row: SVG lines linking pairs to next round ──────────────────────
// parentCount: cards in the source round (16 for R32→R16, 8 for R16→QF, …)
// slotUnits:   BASE_W units each source card spans (1 for R32, 2 for R16, …)
function ConnectorRow({
  parentCount,
  slotUnits,
}: {
  parentCount: number;
  slotUnits: number;
}) {
  const pairCount    = parentCount / 2;
  const pairW        = slotUnits * 2 * BASE_W;
  const leftCX       = (slotUnits * BASE_W) / 2;
  const rightCX      = (slotUnits * BASE_W * 3) / 2;
  const midX         = slotUnits * BASE_W;

  return (
    <div className="flex" style={{ height: CONN_H }}>
      {Array.from({ length: pairCount }, (_, i) => (
        <svg key={i} width={pairW} height={CONN_H} style={{ display: "block", flexShrink: 0 }}>
          <line x1={leftCX}  y1={0}        x2={leftCX}  y2={CONN_H / 2} stroke="#374151" strokeWidth={1} />
          <line x1={rightCX} y1={0}        x2={rightCX} y2={CONN_H / 2} stroke="#374151" strokeWidth={1} />
          <line x1={leftCX}  y1={CONN_H/2} x2={rightCX} y2={CONN_H / 2} stroke="#374151" strokeWidth={1} />
          <line x1={midX}    y1={CONN_H/2} x2={midX}    y2={CONN_H}     stroke="#374151" strokeWidth={1} />
        </svg>
      ))}
    </div>
  );
}

// ── Stage row ─────────────────────────────────────────────────────────────────
function BracketRow({
  matches,
  stagePrefix,
  slotUnits,
  isFinal = false,
}: {
  matches: (ProjectedMatch | undefined)[];
  stagePrefix: string;
  slotUnits: number;
  isFinal?: boolean;
}) {
  return (
    <div className="flex">
      {matches.map((match, i) => (
        <div
          key={i}
          className="flex items-start justify-center"
          style={{ width: slotUnits * BASE_W, flexShrink: 0 }}
        >
          <MatchCard
            match={match}
            label={isFinal ? stagePrefix : `${stagePrefix} ${i + 1}`}
            highlighted={isFinal}
          />
        </div>
      ))}
    </div>
  );
}

// ── Phase banner ──────────────────────────────────────────────────────────────
function PhaseBanner({ phase }: { phase: TournamentPhase }) {
  const label  = PHASE_LABELS[phase];
  const isLive = ["ROUND_OF_32","ROUND_OF_16","QUARTER_FINALS","SEMI_FINALS","FINAL"].includes(phase);
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs">
      {isLive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" aria-hidden />}
      <span className="font-semibold text-white">
        Fase atual: <span className="text-yellow-400">{label}</span>
      </span>
      {phase === "FINISHED" && (
        <span className="text-green-400 font-semibold">Torneio encerrado</span>
      )}
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BracketClient({ initial }: { initial: BracketResponse }) {
  const [data, setData]   = useState<BracketResponse>(initial);
  const intervalRef       = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchLatest = useCallback(async () => {
    try {
      const res  = await fetch("/api/bracket", { cache: "no-store" });
      if (!res.ok) return;
      setData((await res.json()) as BracketResponse);
    } catch { /* keep stale data */ }
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(fetchLatest, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchLatest]);

  const { bracket, updatedAt } = data;

  const pad = <T,>(arr: T[], n: number): (T | undefined)[] =>
    [...arr, ...Array(Math.max(0, n - arr.length)).fill(undefined)].slice(0, n);

  const r32 = pad(bracket.r32, 16);
  const r16 = pad(bracket.r16, 8);
  const qf  = pad(bracket.qf,  4);
  const sf  = pad(bracket.sf,  2);

  const allMatches = [
    ...bracket.r32, ...bracket.r16, ...bracket.qf, ...bracket.sf,
    ...(bracket.final      ? [bracket.final]      : []),
    ...(bracket.thirdPlace ? [bracket.thirdPlace] : []),
  ];

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(updatedAt));

  const liveCount = allMatches.filter(m => m.status === "IN_PLAY" || m.status === "LIVE").length;
  const doneCount = allMatches.filter(m => m.status === "FINISHED").length;
  const hasR32    = bracket.r32.length > 0;

  const totalW = 16 * BASE_W;

  return (
    <div>
      <PhaseBanner phase={bracket.phase} />

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" aria-hidden />
          Atualiza a cada 30s · última vez às {time}
        </span>
        {allMatches.length > 0 && (
          <span className="text-gray-500">{doneCount}/{allMatches.length} encerradas</span>
        )}
        {liveCount > 0 && (
          <span className="flex items-center gap-1.5 text-red-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" aria-hidden />
            {liveCount} ao vivo
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500 mb-5">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-px bg-gray-500" />
          <span>Confirmado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-px border-t border-dashed border-gray-600" />
          <span>Aguardando resultado</span>
        </div>
      </div>

      {/* Bracket */}
      <div className="overflow-x-auto pb-6" style={{ WebkitOverflowScrolling: "touch" }}>
        {hasR32 ? (
          <div style={{ width: totalW, minWidth: totalW }}>

            {/* ── Dezesseis avos de final ── */}
            <BracketRow
              matches={r32}
              stagePrefix="Dezesseis avos de final"
              slotUnits={1}
            />

            {/* ── Connector R32 → R16 ── */}
            <ConnectorRow parentCount={16} slotUnits={1} />

            {/* ── Oitavas de final ── */}
            <BracketRow
              matches={r16}
              stagePrefix="Oitavas de final"
              slotUnits={2}
            />

            {/* ── Connector R16 → QF ── */}
            <ConnectorRow parentCount={8} slotUnits={2} />

            {/* ── Quartas de final ── */}
            <BracketRow
              matches={qf}
              stagePrefix="Quartas de final"
              slotUnits={4}
            />

            {/* ── Connector QF → SF ── */}
            <ConnectorRow parentCount={4} slotUnits={4} />

            {/* ── Semifinais ── */}
            <BracketRow
              matches={sf}
              stagePrefix="Semifinais"
              slotUnits={8}
            />

            {/* ── Connector SF → Final ── */}
            <ConnectorRow parentCount={2} slotUnits={8} />

            {/* ── Final ── */}
            <BracketRow
              matches={[bracket.final]}
              stagePrefix="Final"
              slotUnits={16}
              isFinal
            />

            {/* ── Disputa 3º lugar ── */}
            {bracket.thirdPlace && (
              <div className="mt-8 flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-semibold mb-1">Disputa do 3º Lugar</span>
                  <MatchCard match={bracket.thirdPlace} label="3º Lugar" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

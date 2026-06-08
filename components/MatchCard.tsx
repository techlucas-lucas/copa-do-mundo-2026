import type { Match } from "@/types/football";
import Image from "next/image";

const STATUS = {
  SCHEDULED: { label: "Agendado",  cls: "text-gray-400" },
  LIVE:      { label: "AO VIVO",   cls: "text-red-400 font-bold" },
  IN_PLAY:   { label: "AO VIVO",   cls: "text-red-400 font-bold" },
  PAUSED:    { label: "Intervalo", cls: "text-yellow-400" },
  FINISHED:  { label: "Encerrado", cls: "text-green-400" },
  POSTPONED: { label: "Adiado",    cls: "text-orange-400" },
  CANCELLED: { label: "Cancelado", cls: "text-red-400" },
} as const;

function formatTime(utcDate: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  }).format(new Date(utcDate));
}

function formatDate(utcDate: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", timeZone: "America/Sao_Paulo",
  }).format(new Date(utcDate));
}

function Flag({ src, name }: { src?: string; name: string }) {
  if (!src) return <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">?</div>;
  return (
    <Image
      src={src}
      alt={`Bandeira de ${name}`}
      width={40}
      height={40}
      className="object-contain w-10 h-10"
    />
  );
}

export default function MatchCard({ match, isNext = false }: { match: Match; isNext?: boolean }) {
  const { label, cls } = STATUS[match.status as keyof typeof STATUS] ?? { label: match.status, cls: "text-gray-400" };
  const isLive = match.status === "IN_PLAY" || match.status === "LIVE";
  const showScore = ["FINISHED", "IN_PLAY", "LIVE", "PAUSED"].includes(match.status);
  const homeWon = match.score.winner === "HOME_TEAM";
  const awayWon = match.score.winner === "AWAY_TEAM";

  return (
    <article
      id={`match-${match.id}`}
      className={`
        bg-gray-900 border rounded-xl p-4 flex flex-col gap-3 transition-colors duration-200
        ${isLive  ? "border-red-800 bg-red-950/10"
        : isNext  ? "border-green-700 bg-green-950/10"
                  : "border-gray-800 hover:border-gray-700"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 truncate max-w-[120px]">{match.group ?? match.stage}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {isNext && !isLive && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-green-900/60 text-green-400 border border-green-800">
              Próximo
            </span>
          )}
          {isLive && <span className="live-dot" aria-hidden />}
          <span className={cls}>{label}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <Flag src={match.homeTeam.crest} name={match.homeTeam.name} />
          <span className={`text-sm font-semibold text-center leading-tight truncate w-full text-center ${homeWon ? "text-yellow-400" : ""}`}>
            {match.homeTeam.shortName || match.homeTeam.tla}
          </span>
        </div>

        {/* Score / time */}
        <div className="flex flex-col items-center gap-0.5 min-w-[72px]">
          {showScore ? (
            <>
              <span className="text-2xl font-black tabular-nums leading-none">
                {match.score.fullTime.home ?? 0}
                <span className="text-gray-500 mx-1">—</span>
                {match.score.fullTime.away ?? 0}
              </span>
              {match.score.halfTime.home !== null && !isLive && (
                <span className="text-[10px] text-gray-600">
                  HT {match.score.halfTime.home}:{match.score.halfTime.away}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-base font-bold text-white tabular-nums">{formatTime(match.utcDate)}</span>
              <span className="text-[10px] text-gray-500">{formatDate(match.utcDate)}</span>
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <Flag src={match.awayTeam.crest} name={match.awayTeam.name} />
          <span className={`text-sm font-semibold text-center leading-tight truncate w-full text-center ${awayWon ? "text-yellow-400" : ""}`}>
            {match.awayTeam.shortName || match.awayTeam.tla}
          </span>
        </div>
      </div>
    </article>
  );
}

import Image from "next/image";
import type { Match } from "@/types/football";

interface Props {
  match?: Match;
  label?: string;
  isHighlighted?: boolean;
}

function TeamRow({ team, score, won }: {
  team: { name: string; shortName: string; tla: string; crest?: string };
  score: number | null;
  won: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 ${won ? "text-yellow-400" : "text-gray-200"}`}>
      {team.crest ? (
        <Image src={team.crest} alt={team.name} width={18} height={18} className="object-contain shrink-0" />
      ) : (
        <div className="w-[18px] h-[18px] rounded-full bg-gray-700 shrink-0" />
      )}
      <span className="text-xs font-semibold truncate flex-1 leading-tight">
        {team.shortName || team.tla || team.name}
      </span>
      {score !== null && (
        <span className={`text-xs font-black tabular-nums ml-auto shrink-0 ${won ? "text-yellow-400" : "text-gray-400"}`}>
          {score}
        </span>
      )}
    </div>
  );
}

function TbdRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="w-[18px] h-[18px] rounded-full bg-gray-700 shrink-0" />
      <span className="text-xs text-gray-500 italic">{label}</span>
    </div>
  );
}

export default function BracketSlot({ match, label, isHighlighted }: Props) {
  const showScore = match && ["FINISHED", "IN_PLAY", "LIVE", "PAUSED"].includes(match.status);
  const isLive = match?.status === "IN_PLAY" || match?.status === "LIVE";
  const homeWon = match?.score.winner === "HOME_TEAM";
  const awayWon = match?.score.winner === "AWAY_TEAM";

  return (
    <div
      className={`
        w-44 rounded-lg border overflow-hidden transition-colors duration-200
        ${isHighlighted ? "border-yellow-600 bg-yellow-950/20" : isLive ? "border-red-700 bg-red-950/10" : "border-gray-700 bg-gray-900"}
      `}
      role="article"
      aria-label={label}
    >
      {label && (
        <div className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${isHighlighted ? "bg-yellow-600/20 text-yellow-400" : "bg-gray-800 text-gray-500"}`}>
          {label}
          {isLive && <span className="ml-1 text-red-400">● AO VIVO</span>}
        </div>
      )}

      <div className="divide-y divide-gray-800">
        {match ? (
          <>
            <TeamRow
              team={match.homeTeam}
              score={showScore ? (match.score.fullTime.home ?? 0) : null}
              won={homeWon}
            />
            <TeamRow
              team={match.awayTeam}
              score={showScore ? (match.score.fullTime.away ?? 0) : null}
              won={awayWon}
            />
          </>
        ) : (
          <>
            <TbdRow label="A definir" />
            <TbdRow label="A definir" />
          </>
        )}
      </div>
    </div>
  );
}

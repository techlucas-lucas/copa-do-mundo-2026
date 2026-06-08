import type { Group } from "@/types/football";
import Image from "next/image";

export default function GroupTable({ group }: { group: Group }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-green-800 px-4 py-2.5 flex items-center justify-between">
        <h3 className="font-bold text-yellow-400 text-sm uppercase tracking-wide">
          {group.group ?? "Grupo"}
        </h3>
        <span className="text-[10px] text-green-300 font-medium uppercase tracking-widest">
          J&nbsp;&nbsp;V&nbsp;&nbsp;E&nbsp;&nbsp;D&nbsp;&nbsp;SG&nbsp;&nbsp;Pts
        </span>
      </div>

      {/* Rows */}
      <ul role="list">
        {group.table.map((row, i) => {
          const advances = i < 2;
          return (
            <li
              key={row.team.id}
              className={`
                flex items-center gap-3 px-3 py-2.5 border-b border-gray-800 last:border-0
                transition-colors duration-150 hover:bg-gray-800/50 cursor-default
                ${advances ? "bg-green-950/20" : ""}
              `}
            >
              {/* Position */}
              <span className={`w-5 text-xs text-center font-bold shrink-0 ${advances ? "text-green-400" : "text-gray-600"}`}>
                {row.position}
              </span>

              {/* Flag + name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {row.team.crest ? (
                  <Image
                    src={row.team.crest}
                    alt={`Bandeira de ${row.team.name}`}
                    width={22}
                    height={22}
                    className="object-contain shrink-0"
                  />
                ) : (
                  <div className="w-[22px] h-[22px] rounded-full bg-gray-700 shrink-0" />
                )}
                <span className="text-sm font-medium truncate">{row.team.shortName}</span>
              </div>

              {/* Stats — tabular nums */}
              <div className="flex items-center gap-3 text-xs tabular-nums text-gray-400 shrink-0">
                <span className="w-4 text-center">{row.playedGames}</span>
                <span className="w-4 text-center">{row.won}</span>
                <span className="w-4 text-center">{row.draw}</span>
                <span className="w-4 text-center">{row.lost}</span>
                <span className={`w-6 text-center ${row.goalDifference > 0 ? "text-green-400" : row.goalDifference < 0 ? "text-red-400" : ""}`}>
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </span>
                <span className="w-6 text-center font-bold text-yellow-400">{row.points}</span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Legend */}
      <div className="px-3 py-1.5 flex items-center gap-1.5 border-t border-gray-800 bg-gray-950/50">
        <span className="w-2.5 h-2.5 rounded-sm bg-green-800 shrink-0" aria-hidden />
        <span className="text-[10px] text-gray-500">Classificado para o mata-mata</span>
      </div>
    </div>
  );
}

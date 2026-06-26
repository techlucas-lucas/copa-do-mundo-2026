import { Fragment } from "react";
import Image from "next/image";
import type { Group, Standing } from "@/types/football";

function groupLetter(raw: string): string {
  return raw.replace(/^group[_ ]/i, "").trim().toUpperCase();
}

interface ThirdEntry {
  team: Standing["team"];
  group: string;
  points: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalDifference: number;
  goalsFor: number;
}

// A 3rd-place team is mathematically qualified when not enough teams
// ranked below can possibly surpass them (by max achievable points).
function isMathQualified(rank: number, entry: ThirdEntry, all: ThirdEntry[]): boolean {
  const below = all.slice(rank); // teams ranked worse (0-indexed: this team is at index rank-1)
  const canOvertake = below.filter(
    t => t.points + 3 * (3 - t.playedGames) >= entry.points,
  );
  return canOvertake.length < 9 - rank;
}

export default function BestThirdsPanel({ standings }: { standings: Group[] }) {
  if (!standings || standings.length === 0) return null;

  const all: ThirdEntry[] = standings
    .flatMap(g => {
      const row = g.table[2];
      return row
        ? [
            {
              team: row.team,
              group: groupLetter(g.group),
              points: row.points,
              playedGames: row.playedGames,
              won: row.won,
              draw: row.draw,
              lost: row.lost,
              goalDifference: row.goalDifference,
              goalsFor: row.goalsFor,
            },
          ]
        : [];
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor,
    );

  if (all.length === 0) return null;

  const cutoff = 8;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          Melhores Terceiros Colocados
          <span className="text-[10px] font-normal text-gray-500 bg-gray-800 border border-gray-700 rounded px-2 py-0.5">
            Top 8 avançam
          </span>
        </h2>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wide text-[10px]">
                <th className="text-left px-3 py-2 w-6 font-medium">#</th>
                <th className="text-left px-2 py-2 font-medium">Seleção</th>
                <th className="px-2 py-2 text-center font-medium w-8">Gr</th>
                <th className="px-2 py-2 text-center font-medium w-8">J</th>
                <th className="px-2 py-2 text-center font-medium w-7">V</th>
                <th className="px-2 py-2 text-center font-medium w-7">E</th>
                <th className="px-2 py-2 text-center font-medium w-7">D</th>
                <th className="px-2 py-2 text-center font-medium w-8">Pts</th>
                <th className="px-2 py-2 text-center font-medium w-10">SG</th>
                <th className="px-2 py-2 text-center font-medium w-8">GP</th>
                <th className="px-3 py-2 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {all.map((entry, idx) => {
                const rank = idx + 1;
                const inTop8 = rank <= cutoff;
                const qualified = inTop8 && isMathQualified(rank, entry, all);
                const isLastQualifier = rank === cutoff;

                return (
                  <Fragment key={entry.team.id}>
                    <tr
                      className={`transition-colors ${
                        inTop8
                          ? "hover:bg-gray-800/40"
                          : "opacity-50 hover:opacity-60"
                      } ${isLastQualifier ? "border-b-2 border-dashed border-gray-700" : "border-b border-gray-800/50"} last:border-0`}
                    >
                      {/* Rank */}
                      <td
                        className={`px-3 py-2.5 font-black tabular-nums text-center ${
                          inTop8 ? "text-yellow-400" : "text-gray-600"
                        }`}
                      >
                        {rank}
                      </td>

                      {/* Team */}
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          {entry.team.crest ? (
                            <Image
                              src={entry.team.crest}
                              alt=""
                              width={22}
                              height={16}
                              className="object-contain rounded-sm shrink-0"
                              unoptimized
                            />
                          ) : (
                            <div className="w-[22px] h-[16px] bg-gray-700 rounded-sm shrink-0" />
                          )}
                          <span
                            className={`font-semibold leading-none ${
                              inTop8 ? "text-white" : "text-gray-500"
                            }`}
                          >
                            {entry.team.shortName || entry.team.name}
                          </span>
                        </div>
                      </td>

                      {/* Group */}
                      <td className="px-2 py-2.5 text-center text-gray-400 font-mono font-bold">
                        {entry.group}
                      </td>

                      {/* Played */}
                      <td className="px-2 py-2.5 text-center text-gray-400 tabular-nums">
                        {entry.playedGames}
                      </td>

                      {/* W D L */}
                      <td className="px-2 py-2.5 text-center text-gray-500 tabular-nums">{entry.won}</td>
                      <td className="px-2 py-2.5 text-center text-gray-500 tabular-nums">{entry.draw}</td>
                      <td className="px-2 py-2.5 text-center text-gray-500 tabular-nums">{entry.lost}</td>

                      {/* Points */}
                      <td
                        className={`px-2 py-2.5 text-center font-black tabular-nums ${
                          inTop8 ? "text-white" : "text-gray-600"
                        }`}
                      >
                        {entry.points}
                      </td>

                      {/* GD */}
                      <td
                        className={`px-2 py-2.5 text-center tabular-nums font-semibold ${
                          entry.goalDifference > 0
                            ? "text-green-400"
                            : entry.goalDifference < 0
                            ? "text-red-400"
                            : "text-gray-500"
                        }`}
                      >
                        {entry.goalDifference > 0
                          ? `+${entry.goalDifference}`
                          : entry.goalDifference}
                      </td>

                      {/* GF */}
                      <td className="px-2 py-2.5 text-center text-gray-400 tabular-nums">
                        {entry.goalsFor}
                      </td>

                      {/* Status badge */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {qualified ? (
                          <span className="inline-flex items-center gap-1 text-green-400 font-semibold text-[10px] bg-green-950/70 border border-green-800 rounded-full px-2 py-0.5">
                            <svg
                              className="w-2.5 h-2.5 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                              aria-hidden
                            >
                              <path
                                d="M5 13l4 4L19 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Classificado
                          </span>
                        ) : inTop8 ? (
                          <span className="inline-flex items-center gap-1 text-yellow-600 text-[10px]">
                            <svg
                              className="w-2.5 h-2.5 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                              aria-hidden
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" strokeLinecap="round" />
                            </svg>
                            Em disputa
                          </span>
                        ) : null}
                      </td>
                    </tr>

                    {/* Cutoff separator row */}
                    {isLastQualifier && idx < all.length - 1 && (
                      <tr>
                        <td colSpan={11} className="px-3 py-1 text-center">
                          <span className="text-[10px] text-gray-600 tracking-widest uppercase">
                            ─── corte ───
                          </span>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-3 py-1.5 border-t border-gray-800 bg-gray-950/40 text-[10px] text-gray-600 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-900 border border-green-700" />
            Matematicamente classificado
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full border border-yellow-700" />
            Posição provisória
          </span>
        </div>
      </div>
    </section>
  );
}

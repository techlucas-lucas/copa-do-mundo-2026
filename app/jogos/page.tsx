import { getMatches } from "@/lib/football-api";
import MatchCard from "@/components/MatchCard";
import AutoScroller from "./AutoScroller";
import type { Match } from "@/types/football";

export const metadata = { title: "Jogos — Copa do Mundo 2026" };

function groupByDate(matches: Match[]): Record<string, Match[]> {
  return matches.reduce<Record<string, Match[]>>((acc, match) => {
    const date = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(match.utcDate));
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});
}

function findNextMatch(matches: Match[]): Match | null {
  // Priority 1: any match currently live
  const live = matches.find(m => m.status === "IN_PLAY" || m.status === "LIVE");
  if (live) return live;

  // Priority 2: first upcoming match (chronologically, not yet finished)
  const now = Date.now();
  return (
    matches
      .filter(m => m.status === "SCHEDULED" || m.status === "TIMED")
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
      .find(m => new Date(m.utcDate).getTime() >= now - 2 * 60 * 60 * 1000) // allow 2h window
    ?? null
  );
}

async function getData() {
  try {
    const data = await getMatches();
    return data.matches ?? [];
  } catch {
    return [];
  }
}

export default async function JogosPage() {
  const matches = await getData();
  const byDate = groupByDate(matches);
  const nextMatch = findNextMatch(matches);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-yellow-400 mb-2">Jogos</h1>
      <p className="text-gray-400 mb-8 text-sm">Todos os {matches.length} jogos da Copa do Mundo FIFA 2026</p>

      {matches.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>Dados indisponíveis. Verifique sua chave de API no <code className="text-green-400">.env.local</code>.</p>
        </div>
      ) : (
        Object.entries(byDate).map(([date, dayMatches]) => (
          <section key={date} className="mb-8">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2">
              {date}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dayMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  isNext={m.id === nextMatch?.id}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Scrolls viewport to center the next/live match after hydration */}
      <AutoScroller matchId={nextMatch?.id ?? null} />
    </div>
  );
}

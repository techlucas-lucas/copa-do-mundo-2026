import { getTeams } from "@/lib/football-api";
import Image from "next/image";

export const metadata = { title: "Seleções — Copa do Mundo 2026" };

async function getData() {
  try {
    const data = await getTeams();
    return data.teams ?? [];
  } catch {
    return [];
  }
}

export default async function SelecoesPage() {
  const teams = await getData();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-yellow-400 mb-2">Seleções</h1>
      <p className="text-gray-400 mb-8 text-sm">{teams.length} seleções na Copa do Mundo FIFA 2026</p>

      {teams.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-6xl mb-4">⚽</p>
          <p>Dados indisponíveis. Verifique sua chave de API no <code className="text-green-400">.env.local</code>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-green-700 transition-colors"
            >
              {team.crest ? (
                <Image
                  src={team.crest}
                  alt={team.name}
                  width={56}
                  height={56}
                  className="object-contain"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-2xl">⚽</div>
              )}
              <span className="text-xs font-semibold text-center text-gray-200 leading-tight">{team.name}</span>
              <span className="text-xs text-gray-500">{team.tla}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

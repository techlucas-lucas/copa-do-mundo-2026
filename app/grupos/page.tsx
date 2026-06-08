import { getStandings } from "@/lib/football-api";
import GroupTable from "@/components/GroupTable";

export const metadata = { title: "Grupos — Copa do Mundo 2026" };

async function getData() {
  try {
    const data = await getStandings();
    return data.standings ?? [];
  } catch {
    return [];
  }
}

export default async function GruposPage() {
  const groups = await getData();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-yellow-400 mb-2">Grupos</h1>
      <p className="text-gray-400 mb-8 text-sm">Copa do Mundo FIFA 2026 — 12 grupos, 48 seleções</p>

      {groups.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-6xl mb-4">⚽</p>
          <p>Dados indisponíveis. Verifique sua chave de API no <code className="text-green-400">.env.local</code>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupTable key={group.group} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

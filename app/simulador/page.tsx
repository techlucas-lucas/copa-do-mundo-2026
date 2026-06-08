import { getMatches } from "@/lib/football-api";
import SimulatorClient from "./SimulatorClient";

export const metadata = { title: "Simulador — Copa do Mundo 2026" };

async function getData() {
  try {
    const data = await getMatches();
    return data.matches ?? [];
  } catch {
    return [];
  }
}

export default async function SimuladorPage() {
  const matches = await getData();

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-yellow-400 mb-1">Simulador</h1>
        <p className="text-gray-400 text-sm">
          Simule resultados e veja a classificação atualizar em tempo real
        </p>
      </div>

      <SimulatorClient matches={matches} />
    </div>
  );
}

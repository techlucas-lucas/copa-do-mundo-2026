import { getMatches, getStandings } from "@/lib/football-api";
import { buildFullBracket } from "@/lib/bracket-projection";
import BracketClient from "./BracketClient";

export const metadata = { title: "Mata-Mata — Copa do Mundo 2026" };

const KNOCKOUT_STAGES = new Set([
  "ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINALS",
  "SEMI_FINALS", "FINAL", "THIRD_PLACE",
]);

async function getInitialData() {
  try {
    const [matchesData, standingsData] = await Promise.all([
      getMatches(),
      getStandings(),
    ]);
    const allMatches      = matchesData.matches ?? [];
    const knockoutMatches = allMatches.filter(m => KNOCKOUT_STAGES.has(m.stage));
    const standings       = standingsData.standings ?? [];
    return {
      bracket: buildFullBracket(knockoutMatches, standings, allMatches),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      bracket: { phase: "PRE_TOURNAMENT" as const, r32: [], r16: [], qf: [], sf: [], final: undefined, thirdPlace: undefined },
      updatedAt: new Date().toISOString(),
    };
  }
}

export default async function MataMataPage() {
  const initial = await getInitialData();

  return (
    <div className="px-4 py-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-yellow-400 mb-1">Mata-Mata</h1>
        <p className="text-gray-400 text-sm">
          Copa do Mundo FIFA 2026 — 32 seleções, 6 fases
        </p>
      </div>

      {/* Phase badges */}
      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        {[
          { label: "16 Avos",   n: "16 jogos" },
          { label: "Oitavas",   n: "8 jogos"  },
          { label: "Quartas",   n: "4 jogos"  },
          { label: "Semifinais",n: "2 jogos"  },
          { label: "Final",     n: "1 jogo"   },
        ].map(({ label, n }) => (
          <span
            key={label}
            className="px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-gray-400"
          >
            <span className="text-white font-semibold">{label}</span>
            <span className="mx-1 text-gray-700">·</span>
            {n}
          </span>
        ))}
      </div>

      {/* Live bracket — client polls every 30s */}
      <BracketClient initial={initial} />

      {/* Copa 2026 rules */}
      <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-sm font-bold text-white mb-3">
          Regras da Copa do Mundo 2026
        </h2>
        <ul className="text-xs text-gray-400 space-y-2 leading-relaxed">
          <li>
            <span className="text-green-400 font-semibold">48 seleções</span>
            {" "}— formato expandido pela primeira vez na história da Copa
          </li>
          <li>
            <span className="text-green-400 font-semibold">12 grupos</span>
            {" "}(A–L) de 4 seleções — os 2 primeiros de cada grupo se classificam automaticamente
          </li>
          <li>
            <span className="text-green-400 font-semibold">8 melhores 3ºs</span>
            {" "}— dentre os 12 terceiros colocados, os 8 melhores (por pontos, saldo, gols pró) também avançam
          </li>
          <li>
            <span className="text-green-400 font-semibold">32 seleções</span>
            {" "}no mata-mata — 16 avos → oitavas → quartas → semis → final
          </li>
          <li>
            <span className="text-green-400 font-semibold">Prorrogação + pênaltis</span>
            {" "}em caso de empate em qualquer fase eliminatória
          </li>
          <li>
            <span className="text-yellow-400 font-semibold">Sedes:</span>
            {" "}EUA (60 jogos em 11 cidades), México (10 jogos, 3 cidades), Canadá (13 jogos, 2 cidades)
          </li>
        </ul>
      </div>
    </div>
  );
}

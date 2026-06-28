import { getMatches, getStandings } from "@/lib/football-api";
import { buildFullBracket } from "@/lib/bracket-projection";

// football-data.org uses LAST_32/LAST_16 — include both variants
const KNOCKOUT_STAGES = new Set([
  "ROUND_OF_32", "LAST_32",
  "ROUND_OF_16", "LAST_16",
  "QUARTER_FINALS", "SEMI_FINALS", "FINAL", "THIRD_PLACE",
]);

export async function GET() {
  try {
    const [matchesData, standingsData] = await Promise.all([
      getMatches(),
      getStandings(),
    ]);

    const allMatches      = matchesData.matches ?? [];
    const knockoutMatches = allMatches.filter(m => KNOCKOUT_STAGES.has(m.stage));
    const standings       = standingsData.standings ?? [];

    const bracket = buildFullBracket(knockoutMatches, standings, allMatches);

    return Response.json({
      knockoutMatches,
      standings,
      bracket,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      {
        error: String(err),
        knockoutMatches: [],
        standings: [],
        bracket: { r32: [], r16: [], qf: [], sf: [], final: undefined, thirdPlace: undefined },
        updatedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

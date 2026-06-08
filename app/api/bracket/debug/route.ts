import { getMatches, getStandings } from "@/lib/football-api";
import { buildFullBracket, bestThirdTeams, groupLetter, PHASE_LABELS } from "@/lib/bracket-projection";

const KNOCKOUT_STAGES = new Set([
  "ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINALS",
  "SEMI_FINALS", "FINAL", "THIRD_PLACE",
]);

export async function GET() {
  const [matchesData, standingsData] = await Promise.all([
    getMatches(),
    getStandings(),
  ]);

  const allMatches      = matchesData.matches ?? [];
  const knockoutMatches = allMatches.filter(m => KNOCKOUT_STAGES.has(m.stage));
  const standings       = standingsData.standings ?? [];
  const bracket = buildFullBracket(knockoutMatches, standings, allMatches);
  const best3 = bestThirdTeams(standings);

  // ── Build human-readable HTML report ──────────────────────────────────────
  const rows = (matches: typeof bracket.r32, label: string) =>
    matches.map((m, i) => `
      <tr>
        <td>${label} #${i + 1}</td>
        <td>${m.home.sourceLabel}</td>
        <td style="font-weight:bold">${m.home.team.shortName || m.home.team.name}</td>
        <td style="color:#6b7280">vs</td>
        <td style="font-weight:bold">${m.away.team.shortName || m.away.team.name}</td>
        <td>${m.away.sourceLabel}</td>
        <td style="color:${m.isConfirmed ? '#4ade80' : m.home.isProjected ? '#60a5fa' : '#9ca3af'}">
          ${m.isConfirmed ? '✅ Confirmado' : '🔵 Projetado'}
        </td>
        <td style="color:#9ca3af">${m.status ?? '—'}</td>
      </tr>
    `).join("");

  const groupTable = standings.map((g) => `
    <tr>
      <td style="font-weight:bold">Grupo ${groupLetter(g.group)}</td>
      ${g.table.slice(0, 3).map((row) =>
        `<td>${row.position}. ${row.team.shortName} (${row.points}pts)</td>`
      ).join("")}
    </tr>
  `).join("");

  const best3Html = best3.map((e, i) =>
    `<tr><td>#${i + 1}</td><td>${e.team.shortName}</td><td>Grupo ${e.group}</td></tr>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Bracket Debug — Copa 2026</title>
  <style>
    body { font-family: monospace; background:#111; color:#e5e7eb; padding:2rem; font-size:13px; }
    h1 { color:#facc15; } h2 { color:#4ade80; margin-top:2rem; }
    table { border-collapse:collapse; width:100%; margin-top:.5rem; }
    th { text-align:left; color:#9ca3af; border-bottom:1px solid #374151; padding:4px 8px; }
    td { padding:4px 8px; border-bottom:1px solid #1f2937; }
    tr:hover td { background:#1f2937; }
    .badge { display:inline-block; font-size:10px; font-weight:bold; padding:1px 5px; border-radius:3px; background:#1e3a5f; color:#60a5fa; }
  </style>
</head>
<body>
  <h1>🔍 Bracket Debug — Copa do Mundo 2026</h1>
  <p style="color:#6b7280">Atualizado: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
  <p>Fase atual: <strong style="color:#facc15">${PHASE_LABELS[bracket.phase]}</strong> (${bracket.phase})</p>
  <p>API knockout matches: <strong>${knockoutMatches.length}</strong> | Grupos: <strong>${standings.length}</strong></p>

  <h2>📊 Classificação Atual (top-3 por grupo)</h2>
  <table>
    <tr><th>Grupo</th><th>1º</th><th>2º</th><th>3º</th></tr>
    ${groupTable}
  </table>

  <h2>🥉 8 Melhores 3ºs Colocados (projetados)</h2>
  <table>
    <tr><th>Rank</th><th>Seleção</th><th>Origem</th></tr>
    ${best3Html}
  </table>

  <h2>🏆 R32 — 16 Avos de Final (${bracket.r32.filter(m=>m.isConfirmed).length} confirmados, ${bracket.r32.filter(m=>!m.isConfirmed).length} projetados)</h2>
  <table>
    <tr><th>Partida</th><th>Origem A</th><th>Time A</th><th></th><th>Time B</th><th>Origem B</th><th>Status</th><th>API</th></tr>
    ${rows(bracket.r32, "R32")}
  </table>

  <h2>⚽ R16 — Oitavas (${bracket.r16.filter(m=>m.isConfirmed).length} confirmados)</h2>
  <table>
    <tr><th>Partida</th><th>Origem A</th><th>Time A</th><th></th><th>Time B</th><th>Origem B</th><th>Status</th><th>API</th></tr>
    ${rows(bracket.r16, "R16")}
  </table>

  <h2>⚡ QF — Quartas (${bracket.qf.filter(m=>m.isConfirmed).length} confirmados)</h2>
  <table>
    <tr><th>Partida</th><th>Origem A</th><th>Time A</th><th></th><th>Time B</th><th>Origem B</th><th>Status</th><th>API</th></tr>
    ${rows(bracket.qf, "QF")}
  </table>

  <h2>🔥 SF — Semifinais</h2>
  <table>
    <tr><th>Partida</th><th>Origem A</th><th>Time A</th><th></th><th>Time B</th><th>Origem B</th><th>Status</th><th>API</th></tr>
    ${rows(bracket.sf, "SF")}
  </table>

  ${bracket.final ? `
  <h2>🏅 Final</h2>
  <table>
    <tr><th>Partida</th><th>Origem A</th><th>Time A</th><th></th><th>Time B</th><th>Origem B</th><th>Status</th><th>API</th></tr>
    ${rows([bracket.final], "Final")}
  </table>` : ""}
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

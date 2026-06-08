import { getMatches } from "@/lib/football-api";
import MatchCard from "@/components/MatchCard";
import type { Match } from "@/types/football";
import Link from "next/link";

async function getData() {
  try {
    const [live, scheduled, finished] = await Promise.all([
      getMatches({ status: "IN_PLAY" }),
      getMatches({ status: "SCHEDULED" }),
      getMatches({ status: "FINISHED" }),
    ]);
    return {
      liveMatches:     live.matches ?? [],
      upcomingMatches: (scheduled.matches ?? []).slice(0, 6),
      recentMatches:   (finished.matches ?? []).slice(-4).reverse(),
    };
  } catch {
    return { liveMatches: [], upcomingMatches: [], recentMatches: [] };
  }
}

/* ── Icon components (SVG only) ── */
function CalendarIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}
function TableIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18" strokeLinecap="round"/>
    </svg>
  );
}
function BracketIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M4 6h4v12H4M20 6h-4v12h4M12 12H8M12 12h4M12 6v12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Stat card ── */
function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
      <div className="text-2xl font-black text-yellow-400 tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

/* ── Section ── */
function Section({ title, children, href, linkLabel }: {
  title: React.ReactNode;
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-green-400 hover:text-green-300 transition-colors cursor-pointer">
            {linkLabel ?? "Ver todos"}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const { liveMatches, upcomingMatches, recentMatches } = await getData();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* ── Hero ── */}
      <section className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-yellow-400 leading-tight">
          Copa do Mundo
        </h1>
        <p className="text-2xl sm:text-3xl font-bold text-green-400 mt-1">FIFA 2026</p>
        <p className="text-gray-400 mt-2 text-sm tracking-wide">
          EUA&nbsp;·&nbsp;México&nbsp;·&nbsp;Canadá
        </p>

        {/* Quick nav */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <Link
            href="/jogos"
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-full transition-colors duration-200 cursor-pointer min-h-[44px] text-sm"
          >
            <CalendarIcon />
            Jogos
          </Link>
          <Link
            href="/grupos"
            className="flex items-center gap-2 border border-green-700 hover:bg-green-900/50 text-green-300 font-semibold px-5 py-3 rounded-full transition-colors duration-200 cursor-pointer min-h-[44px] text-sm"
          >
            <TableIcon />
            Grupos
          </Link>
          <Link
            href="/mata-mata"
            className="flex items-center gap-2 border border-yellow-700 hover:bg-yellow-900/20 text-yellow-400 font-semibold px-5 py-3 rounded-full transition-colors duration-200 cursor-pointer min-h-[44px] text-sm"
          >
            <BracketIcon />
            Mata-Mata
          </Link>
        </div>
      </section>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-10">
        <StatCard value="48" label="Seleções" />
        <StatCard value="12" label="Grupos" />
        <StatCard value="104" label="Jogos" />
        <StatCard value="3" label="Países-sede" />
        <StatCard value={liveMatches.length > 0 ? liveMatches.length : "—"} label="Ao vivo" />
      </div>

      {/* ── Live ── */}
      {liveMatches.length > 0 && (
        <Section
          title={
            <span className="flex items-center gap-2">
              <span className="live-dot" aria-hidden />
              <span className="text-red-400">Ao Vivo</span>
            </span>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveMatches.map((m: Match) => <MatchCard key={m.id} match={m} />)}
          </div>
        </Section>
      )}

      {/* ── Recent results ── */}
      {recentMatches.length > 0 && (
        <Section title="Resultados Recentes" href="/jogos" linkLabel="Ver todos os jogos">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentMatches.map((m: Match) => <MatchCard key={m.id} match={m} />)}
          </div>
        </Section>
      )}

      {/* ── Upcoming ── */}
      {upcomingMatches.length > 0 && (
        <Section title="Próximos Jogos" href="/jogos" linkLabel="Ver agenda completa">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingMatches.map((m: Match) => <MatchCard key={m.id} match={m} />)}
          </div>
        </Section>
      )}

      {/* ── Empty state ── */}
      {liveMatches.length === 0 && upcomingMatches.length === 0 && recentMatches.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} aria-hidden>
            <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 6.88 2.74M12 22a10 10 0 0 1-6.88-2.74M2 12h20M12 2v20" strokeLinecap="round"/>
          </svg>
          <p className="text-base">Nenhum jogo no momento.</p>
          <p className="mt-1 text-sm">
            Configure a chave no{" "}
            <code className="text-green-400 text-xs">.env.local</code>
            {" "}para carregar os dados.
          </p>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-green-900 border-t border-green-800 mt-10">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <span className="font-bold text-white">Copa do Mundo FIFA 2026</span>
          <span className="text-green-400 text-xs">EUA · México · Canadá</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-green-300" aria-label="Links do rodapé">
          <Link href="/jogos"     className="hover:text-white transition-colors cursor-pointer text-xs">Jogos</Link>
          <Link href="/grupos"    className="hover:text-white transition-colors cursor-pointer text-xs">Grupos</Link>
          <Link href="/mata-mata" className="hover:text-white transition-colors cursor-pointer text-xs">Mata-Mata</Link>
          <Link href="/selecoes"  className="hover:text-white transition-colors cursor-pointer text-xs">Seleções</Link>
        </nav>
        <p className="text-green-600 text-xs text-center sm:text-right">
          Dados por{" "}
          <a
            href="https://www.football-data.org"
            className="underline hover:text-yellow-400 transition-colors cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
          >
            football-data.org
          </a>
        </p>
      </div>
    </footer>
  );
}

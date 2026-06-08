"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/",            label: "Início" },
  { href: "/jogos",       label: "Jogos" },
  { href: "/grupos",      label: "Grupos" },
  { href: "/mata-mata",   label: "Mata-Mata" },
  { href: "/simulador",   label: "Simulador" },
  { href: "/selecoes",    label: "Seleções" },
];

/* ── SVG icons (no emoji) ── */
function BallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 6.88 2.74M12 22a10 10 0 0 1-6.88-2.74M2 12h20M12 2v20M4.93 4.93l14.14 14.14" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6" aria-hidden>
      <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-green-800 border-b border-green-700 sticky top-0 z-[var(--z-overlay)]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-black text-lg text-yellow-400 shrink-0"
          onClick={() => setOpen(false)}
        >
          <BallIcon className="w-6 h-6 text-yellow-400" />
          <span className="hidden sm:inline">Copa do Mundo</span>
          <span className="sm:hidden">Copa 2026</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Menu principal">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer min-h-[44px] flex items-center ${
                pathname === href
                  ? "bg-green-600 text-yellow-400"
                  : "text-green-100 hover:bg-green-700 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-green-100 hover:bg-green-700 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav
          className="md:hidden border-t border-green-700 bg-green-800 px-4 pb-4 pt-2 flex flex-col gap-1"
          aria-label="Menu mobile"
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer min-h-[44px] flex items-center ${
                pathname === href
                  ? "bg-green-600 text-yellow-400"
                  : "text-green-100 hover:bg-green-700"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

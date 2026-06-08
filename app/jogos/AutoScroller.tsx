"use client";

import { useEffect } from "react";

interface Props {
  matchId: number | null;
}

export default function AutoScroller({ matchId }: Props) {
  useEffect(() => {
    if (!matchId) return;
    const el = document.getElementById(`match-${matchId}`);
    if (!el) return;

    // Give the browser a tick to finish layout before scrolling
    requestAnimationFrame(() => {
      const navbarHeight = 64;
      const rect = el.getBoundingClientRect();
      const targetScrollY =
        window.scrollY +
        rect.top -
        (window.innerHeight - rect.height) / 2 -
        navbarHeight / 2;

      window.scrollTo({ top: Math.max(0, targetScrollY), behavior: "smooth" });
    });
  }, [matchId]);

  return null;
}

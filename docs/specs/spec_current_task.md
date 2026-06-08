---
date: 2026-06-08
topic: Spec de Implementação — Copa do Mundo 2026
status: ready
---

# Spec — Copa do Mundo 2026

## Fase 1 — Scaffolding do Projeto
- [ ] `npx create-next-app` com TypeScript + Tailwind + App Router
- [ ] Instalar dependências: `zod`
- [ ] Criar `.env.local` com `FOOTBALL_API_KEY`

## Fase 2 — Tipos e Cliente de API
- [ ] CRIAR `src/types/football.ts` — interfaces Match, Standing, Team, Group
- [ ] CRIAR `src/lib/football-api.ts` — funções getMatches(), getStandings(), getTeams()
- [ ] CRIAR `src/app/api/football/[...path]/route.ts` — proxy de API

## Fase 3 — Layout e Componentes Base
- [ ] MODIFICAR `src/app/layout.tsx` — navbar, footer, tema verde/amarelo/azul
- [ ] CRIAR `src/components/Navbar.tsx`
- [ ] CRIAR `src/components/Footer.tsx`
- [ ] CRIAR `src/components/MatchCard.tsx` — card de partida
- [ ] CRIAR `src/components/GroupTable.tsx` — tabela de classificação do grupo
- [ ] CRIAR `src/components/TeamFlag.tsx` — bandeira + nome da seleção

## Fase 4 — Páginas
- [ ] MODIFICAR `src/app/page.tsx` — Home com próximos jogos e jogos ao vivo
- [ ] CRIAR `src/app/grupos/page.tsx` — grid dos 12 grupos
- [ ] CRIAR `src/app/jogos/page.tsx` — agenda filtrada por data/fase

## Success Criteria
- Automated: `npm run build` sem erros TypeScript
- Manual: Grupos aparecem com tabela de classificação, jogos mostram placares corretos

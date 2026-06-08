---
date: 2026-06-08
topic: Copa do Mundo 2026 - Site de Tabela e Resultados
tags: [nextjs, tailwind, football-api, copa-do-mundo]
status: approved
---

# PRD — Copa do Mundo 2026

## Objetivo
Site de tabela de grupos e resultados da Copa do Mundo FIFA 2026, com dados em tempo real via API externa (football-data.org).

## Público-alvo
Torcedores brasileiros querendo acompanhar resultados, classificação dos grupos e agenda de jogos.

## Funcionalidades Core

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| Home | Visão geral da competição, próximos jogos e destaques | P0 |
| Grupos | Tabela de classificação dos 12 grupos (48 seleções) | P0 |
| Jogos | Agenda completa com resultados por data/fase | P0 |
| Seleções | Cards com cada seleção participante | P1 |
| Fase eliminatória | Bracket visual das fases mata-mata | P2 |

## Dados Externos

**API:** football-data.org  
**Competição:** FIFA World Cup 2026 (código: `WC2026`)  
**Endpoints usados:**
- `GET /v4/competitions/WC/matches` — partidas
- `GET /v4/competitions/WC/standings` — classificação
- `GET /v4/competitions/WC/teams` — seleções

**Estratégia de cache:** ISR (Incremental Static Regeneration) com revalidate 60s para dados em tempo real.

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS v4 |
| HTTP Client | fetch nativo (Server Components) |
| Deploy | Vercel |

## Estrutura de Páginas

```
/              → Home (próximos jogos, destaques)
/grupos        → Classificação de todos os grupos
/jogos         → Agenda e resultados completos
/seleções      → Grid de seleções participantes
```

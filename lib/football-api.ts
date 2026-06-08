import { promises as fs } from 'fs';
import path from 'path';
import type { MatchesResponse, StandingsResponse, TeamsResponse } from '@/types/football';

const BASE_URL = 'https://api.football-data.org/v4';
const COMPETITION = 'WC';
const CACHE_DIR = path.join(process.cwd(), '.cache');

// Revalidation per endpoint type (seconds)
const REVALIDATE = {
  matches: 300,     // 5 min — match scores change slowly
  liveMatches: 30,  // 30s — only during live games
  standings: 300,   // 5 min
  teams: 3600,      // 1 hour — never changes during the tournament
} as const;

// Persist response to a local JSON file so we can serve stale data if the API is down
async function writeCache(key: string, data: unknown): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(data), 'utf-8');
  } catch {
    // Non-fatal — cache write failure should never break the page
  }
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(CACHE_DIR, `${key}.json`), 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function fetchFootball<T>(path: string, cacheKey: string, revalidate: number): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY ?? '' },
      next: { revalidate },
    });

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const data = await res.json() as T;
    await writeCache(cacheKey, data);
    return data;
  } catch (err) {
    // API failed — try the local file cache as fallback
    const cached = await readCache<T>(cacheKey);
    if (cached) return cached;
    throw err;
  }
}

export function getMatches(params?: { status?: string; matchday?: number }): Promise<MatchesResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.matchday) query.set('matchday', String(params.matchday));
  const qs = query.toString() ? `?${query}` : '';
  const isLive = params?.status === 'IN_PLAY' || params?.status === 'LIVE';
  const cacheKey = `matches${qs ? '_' + params?.status : ''}`;
  return fetchFootball<MatchesResponse>(
    `/competitions/${COMPETITION}/matches${qs}`,
    cacheKey,
    isLive ? REVALIDATE.liveMatches : REVALIDATE.matches,
  );
}

export function getStandings(): Promise<StandingsResponse> {
  return fetchFootball<StandingsResponse>(
    `/competitions/${COMPETITION}/standings`,
    'standings',
    REVALIDATE.standings,
  );
}

export function getTeams(): Promise<TeamsResponse> {
  return fetchFootball<TeamsResponse>(
    `/competitions/${COMPETITION}/teams`,
    'teams',
    REVALIDATE.teams,
  );
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  group?: string;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export interface Match {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  stage: string;
  group: string | null;
  homeTeam: Team;
  awayTeam: Team;
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    fullTime: Score;
    halfTime: Score;
  };
  matchday: number | null;
}

export interface Standing {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface Group {
  stage: string;
  type: string;
  group: string;
  table: Standing[];
}

export interface CompetitionResponse {
  competition: {
    id: number;
    name: string;
    emblem: string;
  };
  season: {
    startDate: string;
    endDate: string;
    currentMatchday: number | null;
  };
}

export interface MatchesResponse extends CompetitionResponse {
  matches: Match[];
}

export interface StandingsResponse extends CompetitionResponse {
  standings: Group[];
}

export interface TeamsResponse extends CompetitionResponse {
  teams: Team[];
}

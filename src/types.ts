export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD' | 'F';

export interface Match {
  id: string;
  stage: Stage;
  home: string; // team code e.g. "BRA"
  away: string;
  homeGoals: number | null; // 90'+ET goals (no shootout goals)
  awayGoals: number | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  winner: string | null; // knockout only; set even when decided on pens
  kickoff: string; // ISO datetime
}

export interface Results {
  lastSynced: string;
  source: string;
  matches: Match[];
}

export interface Rules {
  groupWin: number;
  groupDraw: number;
  reachR32: number;
  winR32: number;
  winR16: number;
  winQF: number;
  winSF: number;
  winFinal: number;
  pointsPerGoal: number;
}

export interface Participant {
  name: string;
  teams: string[];
}

export interface Participants {
  teamNames: Record<string, string>;
  participants: Participant[];
}

export interface Overrides {
  matches: Array<Partial<Match> & { id: string }>;
}

export interface TeamScore {
  total: number;
  breakdown: Array<{ label: string; points: number }>;
}

export interface Standings {
  teams: Record<string, TeamScore>;
  leaderboard: Array<{
    name: string;
    total: number;
    teams: Array<{ code: string; total: number }>;
  }>;
}

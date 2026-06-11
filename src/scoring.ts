import type { Match, Results, Rules, Participants, Overrides, Standings, TeamScore } from './types';

export function applyOverrides(results: Results, overrides: Overrides): Results {
  const byId = new Map(results.matches.map(mt => [mt.id, { ...mt }]));
  for (const o of overrides.matches) {
    const existing = byId.get(o.id);
    if (existing) byId.set(o.id, { ...existing, ...o });
    else byId.set(o.id, o as Match);
  }
  return { ...results, matches: [...byId.values()] };
}

const KNOCKOUT_WIN: Array<[Match['stage'], keyof Rules, string]> = [
  ['R32', 'winR32', 'Win Round of 32'],
  ['R16', 'winR16', 'Win Round of 16'],
  ['QF', 'winQF', 'Win Quarter-final'],
  ['SF', 'winSF', 'Win Semi-final'],
  ['F', 'winFinal', 'Win the Final'],
];

export function computeStandings(results: Results, rules: Rules, participants: Participants): Standings {
  const teams: Record<string, TeamScore> = {};
  const team = (code: string): TeamScore => (teams[code] ??= { total: 0, breakdown: [] });
  const add = (code: string, label: string, points: number) => {
    if (!points) return;
    const t = team(code);
    const row = t.breakdown.find(b => b.label === label);
    if (row) row.points += points;
    else t.breakdown.push({ label, points });
    t.total += points;
  };
  for (const p of participants.participants) for (const code of p.teams) team(code);

  // Qualification: appearing in any knockout fixture (any status) means the team reached the R32
  const reached = new Set<string>();
  for (const mt of results.matches) {
    if (mt.stage === 'GROUP' || mt.stage === 'THIRD') continue;
    for (const code of [mt.home, mt.away]) {
      if (!reached.has(code)) {
        reached.add(code);
        add(code, 'Qualified for knockouts', rules.reachR32);
      }
    }
  }

  for (const mt of results.matches) {
    if (mt.status !== 'FINISHED') continue;
    if (mt.homeGoals != null) add(mt.home, 'Goals', mt.homeGoals * rules.pointsPerGoal);
    if (mt.awayGoals != null) add(mt.away, 'Goals', mt.awayGoals * rules.pointsPerGoal);

    if (mt.stage === 'GROUP') {
      if (mt.homeGoals == null || mt.awayGoals == null) continue;
      if (mt.homeGoals === mt.awayGoals) {
        add(mt.home, 'Group-stage draw', rules.groupDraw);
        add(mt.away, 'Group-stage draw', rules.groupDraw);
      } else {
        add(mt.homeGoals > mt.awayGoals ? mt.home : mt.away, 'Group-stage win', rules.groupWin);
      }
      continue;
    }
    if (mt.stage === 'THIRD') continue;
    const winRule = KNOCKOUT_WIN.find(([stage]) => stage === mt.stage);
    if (winRule && mt.winner) add(mt.winner, winRule[2], rules[winRule[1]]);
  }

  const leaderboard = participants.participants
    .map(p => ({
      name: p.name,
      teams: p.teams.map(code => ({ code, total: team(code).total })),
      total: p.teams.reduce((s, code) => s + team(code).total, 0),
    }))
    .sort((a, b) => b.total - a.total);

  return { teams, leaderboard };
}

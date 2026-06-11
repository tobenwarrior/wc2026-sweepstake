import { describe, it, expect } from 'vitest';
import { applyOverrides, computeStandings } from '../src/scoring';
import type { Match, Results, Rules, Participants } from '../src/types';

const rules: Rules = { groupWin: 3, groupDraw: 1, reachR32: 5, winR32: 5, winR16: 7, winQF: 10, winSF: 15, winFinal: 20, pointsPerGoal: 1 };
const participants: Participants = {
  teamNames: { BRA: 'Brazil', MEX: 'Mexico', GER: 'Germany' },
  participants: [
    { name: 'Lucas', teams: ['BRA'] },
    { name: 'Ana', teams: ['MEX', 'GER'] },
  ],
};
const m = (p: Partial<Match>): Match => ({
  id: 'x', stage: 'GROUP', home: 'BRA', away: 'MEX', homeGoals: null, awayGoals: null,
  status: 'FINISHED', winner: null, kickoff: '2026-06-11T00:00:00Z', ...p,
});
const res = (matches: Match[]): Results => ({ lastSynced: '', source: 't', matches });

describe('computeStandings', () => {
  it('awards group win, draw, and goal points', () => {
    const s = computeStandings(res([
      m({ id: '1', homeGoals: 2, awayGoals: 1 }),
      m({ id: '2', home: 'MEX', away: 'GER', homeGoals: 0, awayGoals: 0 }),
    ]), rules, participants);
    expect(s.teams['BRA'].total).toBe(3 + 2);
    expect(s.teams['MEX'].total).toBe(1 + 1);
    expect(s.teams['GER'].total).toBe(1 + 0);
    expect(s.leaderboard[0]).toMatchObject({ name: 'Lucas', total: 5 });
    expect(s.leaderboard[1]).toMatchObject({ name: 'Ana', total: 3 });
  });

  it('ignores unfinished matches', () => {
    const s = computeStandings(res([m({ id: '1', status: 'LIVE', homeGoals: 1, awayGoals: 0 })]), rules, participants);
    expect(s.teams['BRA'].total).toBe(0);
  });

  it('awards progression points from knockout appearances and wins', () => {
    const s = computeStandings(res([
      m({ id: 'k1', stage: 'R32', homeGoals: 1, awayGoals: 0, winner: 'BRA' }),
      m({ id: 'k2', stage: 'R16', homeGoals: 0, awayGoals: 0, winner: 'BRA' }), // pens
    ]), rules, participants);
    // BRA: reachR32 5 + winR32 5 + winR16 7 + 1 goal = 18
    expect(s.teams['BRA'].total).toBe(18);
    // MEX appeared in R32 and R16 -> reachR32 counted once
    expect(s.teams['MEX'].total).toBe(5);
  });

  it('qualification points awarded as soon as a knockout match is scheduled', () => {
    const s = computeStandings(res([m({ id: 'k', stage: 'R32', status: 'SCHEDULED' })]), rules, participants);
    expect(s.teams['BRA'].total).toBe(5);
    expect(s.teams['MEX'].total).toBe(5);
  });

  it('winner of the final earns winFinal but THIRD place match earns no progression', () => {
    const s = computeStandings(res([
      m({ id: 'f', stage: 'F', homeGoals: 1, awayGoals: 0, winner: 'BRA' }),
      m({ id: 't', stage: 'THIRD', home: 'MEX', away: 'GER', homeGoals: 2, awayGoals: 1, winner: 'MEX' }),
    ]), rules, participants);
    expect(s.teams['BRA'].breakdown.find(b => b.label === 'Win the Final')!.points).toBe(20);
    expect(s.teams['MEX'].total).toBe(5 + 2); // reachR32 + 2 goals
  });

  it('pointsPerGoal of 0 disables goal scoring', () => {
    const s = computeStandings(res([m({ id: '1', homeGoals: 4, awayGoals: 0 })]), { ...rules, pointsPerGoal: 0 }, participants);
    expect(s.teams['BRA'].total).toBe(3);
  });
});

describe('applyOverrides', () => {
  it('override fields beat API fields, others kept; unknown ids appended', () => {
    const base = res([m({ id: '1', homeGoals: 2, awayGoals: 1 })]);
    const out = applyOverrides(base, { matches: [
      { id: '1', homeGoals: 3 },
      { id: 'new', stage: 'GROUP', home: 'GER', away: 'BRA', homeGoals: 0, awayGoals: 0, status: 'FINISHED', winner: null, kickoff: '2026-06-12T00:00:00Z' },
    ] });
    expect(out.matches.find(x => x.id === '1')!.homeGoals).toBe(3);
    expect(out.matches.find(x => x.id === '1')!.awayGoals).toBe(1);
    expect(out.matches).toHaveLength(2);
  });
});

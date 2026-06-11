import { describe, it, expect } from 'vitest';
import { validateRules, validateResults, validateParticipants } from '../src/validate';

describe('validate', () => {
  it('accepts good rules and rejects missing/non-numeric fields', () => {
    expect(validateRules({ groupWin: 3, groupDraw: 1, reachR32: 5, winR32: 5, winR16: 7, winQF: 10, winSF: 15, winFinal: 20, pointsPerGoal: 0 })).toEqual([]);
    expect(validateRules({ groupWin: '3' })).not.toEqual([]);
  });

  it('rejects matches with bad stage or status', () => {
    expect(validateResults({ lastSynced: '', source: 's', matches: [
      { id: '1', stage: 'NOPE', home: 'A', away: 'B', homeGoals: null, awayGoals: null, status: 'FINISHED', winner: null, kickoff: '' },
    ] })).not.toEqual([]);
  });

  it('accepts good results and participants', () => {
    expect(validateResults({ lastSynced: '', source: 's', matches: [] })).toEqual([]);
    expect(validateParticipants({ teamNames: {}, participants: [{ name: 'L', teams: ['BRA'] }] })).toEqual([]);
    expect(validateParticipants({ participants: [{ teams: [] }] })).not.toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { bracketStages } from '../src/bracket';
import type { Match } from '../src/types';

const m = (p: Partial<Match>): Match => ({
  id: 'x', stage: 'R32', home: 'BRA', away: 'MEX', homeGoals: null, awayGoals: null,
  status: 'SCHEDULED', winner: null, kickoff: '2026-06-28T00:00:00Z', ...p,
});

describe('bracketStages', () => {
  it('groups knockout matches by stage in bracket order, sorted by kickoff, padded to expected size', () => {
    const stages = bracketStages([
      m({ id: 'f', stage: 'F', kickoff: '2026-07-19T00:00:00Z' }),
      m({ id: 'b', stage: 'R32', kickoff: '2026-06-29T00:00:00Z' }),
      m({ id: 'a', stage: 'R32', kickoff: '2026-06-28T00:00:00Z' }),
      m({ id: 'g', stage: 'GROUP' }), // excluded
    ]);
    expect(stages.map(s => s.stage)).toEqual(['R32', 'R16', 'QF', 'SF', 'THIRD', 'F']);
    const r32 = stages.find(s => s.stage === 'R32')!;
    expect(r32.matches.filter(Boolean).map(x => x!.id)).toEqual(['a', 'b']);
    expect(r32.matches).toHaveLength(16); // padded with null TBD slots
    expect(stages.find(s => s.stage === 'F')!.matches).toHaveLength(1);
    expect(stages.find(s => s.stage === 'QF')!.matches).toEqual([null, null, null, null]);
  });
});

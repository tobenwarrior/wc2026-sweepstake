const RULE_KEYS = ['groupWin', 'groupDraw', 'reachR32', 'winR32', 'winR16', 'winQF', 'winSF', 'winFinal', 'pointsPerGoal'];
const STAGES = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'THIRD', 'F'];
const STATUSES = ['SCHEDULED', 'LIVE', 'FINISHED'];

export function validateRules(r: any): string[] {
  if (!r || typeof r !== 'object') return ['rules.json: not an object'];
  return RULE_KEYS.filter(k => typeof r[k] !== 'number').map(k => `rules.json: "${k}" must be a number`);
}

export function validateResults(r: any): string[] {
  if (!r || !Array.isArray(r.matches)) return ['results.json: missing matches array'];
  const errs: string[] = [];
  r.matches.forEach((mt: any, i: number) => {
    if (!mt.id) errs.push(`match[${i}]: missing id`);
    if (!STAGES.includes(mt.stage)) errs.push(`match[${i}]: bad stage "${mt.stage}"`);
    if (!STATUSES.includes(mt.status)) errs.push(`match[${i}]: bad status "${mt.status}"`);
  });
  return errs;
}

export function validateParticipants(p: any): string[] {
  if (!p || !Array.isArray(p.participants)) return ['participants.json: missing participants array'];
  return p.participants
    .map((x: any, i: number) => (!x.name || !Array.isArray(x.teams) ? `participants[${i}]: needs name and teams[]` : null))
    .filter((e: string | null): e is string => e !== null);
}

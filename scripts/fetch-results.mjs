// Fetch World Cup 2026 matches from football-data.org and write public/data/results.json
// Env: FOOTBALL_DATA_KEY. Exit codes: 0 = wrote changes, 78 = no changes, 1 = failure.
import { readFileSync, writeFileSync } from 'node:fs';

const KEY = process.env.FOOTBALL_DATA_KEY;
if (!KEY) {
  console.error('FOOTBALL_DATA_KEY not set');
  process.exit(1);
}

const COMPETITION = process.env.COMPETITION ?? 'WC';
const STAGE_MAP = {
  GROUP_STAGE: 'GROUP',
  LAST_32: 'R32',
  PLAYOFF_ROUND: 'R32',
  LAST_16: 'R16',
  QUARTER_FINALS: 'QF',
  SEMI_FINALS: 'SF',
  THIRD_PLACE: 'THIRD',
  FINAL: 'F',
};
const STATUS_MAP = {
  SCHEDULED: 'SCHEDULED',
  TIMED: 'SCHEDULED',
  POSTPONED: 'SCHEDULED',
  CANCELLED: 'SCHEDULED',
  IN_PLAY: 'LIVE',
  PAUSED: 'LIVE',
  SUSPENDED: 'LIVE',
  FINISHED: 'FINISHED',
  AWARDED: 'FINISHED',
};

const r = await fetch(`https://api.football-data.org/v4/competitions/${COMPETITION}/matches`, {
  headers: { 'X-Auth-Token': KEY },
});
if (!r.ok) {
  console.error(`API ${r.status}: ${await r.text()}`);
  process.exit(1);
}
const data = await r.json();
if (!Array.isArray(data.matches)) {
  console.error('unexpected payload: no matches array');
  process.exit(1);
}

const code = team => team?.tla ?? team?.name ?? 'TBD';
const matches = data.matches.map(mt => ({
  id: String(mt.id),
  stage: STAGE_MAP[mt.stage] ?? 'GROUP',
  home: code(mt.homeTeam),
  away: code(mt.awayTeam),
  // fullTime on this API includes extra time; penalty shootout goals are reported
  // separately, so this matches the sweepstake's "90'+ET only" convention
  homeGoals: mt.score?.fullTime?.home ?? null,
  awayGoals: mt.score?.fullTime?.away ?? null,
  status: STATUS_MAP[mt.status] ?? 'SCHEDULED',
  winner:
    mt.score?.winner === 'HOME_TEAM' ? code(mt.homeTeam)
    : mt.score?.winner === 'AWAY_TEAM' ? code(mt.awayTeam)
    : null,
  kickoff: mt.utcDate,
}));

const out = { lastSynced: new Date().toISOString(), source: 'football-data.org', matches };
const path = 'public/data/results.json';
let prev = '';
try {
  prev = readFileSync(path, 'utf8');
} catch {}
const next = JSON.stringify(out, null, 2) + '\n';
const strip = s => s.replace(/"lastSynced": "[^"]*"/, '');
if (strip(prev) === strip(next)) {
  console.log('no changes');
  process.exit(78);
}
writeFileSync(path, next);
console.log(`wrote ${matches.length} matches`);

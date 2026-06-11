# WC2026 Sweepstake Tracker — Design

Date: 2026-06-11. Approved by Lucas.

## Goal
A FIFA World Cup 2026 team-draw sweepstake tracker on GitHub Pages: editable scoring rules, auto-pulled live results with manual override, shared leaderboard.

## Architecture
- Static frontend (Vite + vanilla TypeScript) deployed to GitHub Pages.
- GitHub Action on cron (every 15 min, plus `workflow_dispatch`) runs a Node script that fetches WC2026 matches from football-data.org (`FOOTBALL_DATA_KEY` repo secret), normalizes to `data/results.json`, commits only when content changed and fetch was valid.
- All shared state is JSON in the repo:
  - `data/participants.json` — participants and owned teams.
  - `data/rules.json` — points table: groupWin 3, groupDraw 1, reachR32 5, winR32 5, winR16 7, winQF 10, winSF 15, winFinal 20, `pointsPerGoal` (adjustable, default 0). All values editable.
  - `data/overrides.json` — per-match manual corrections; always beat API data.

## Scoring engine
Pure function `computeStandings(results, rules, participants)`:
- Group stage: win/draw points per match; goals × pointsPerGoal in all stages.
- Stage-progression points derived from match data (team appears in R32 match → reachR32; winner of R32 match → winR32; etc.). No separate progression bookkeeping.
- Knockout: winner on penalties counts as the win; goals counted at 90'+ET only (shootout goals excluded).
- Output: leaderboard (participant, total, per-category breakdown) and per-team detail.

## UI
- Main page: leaderboard, expandable per-participant breakdown, recent/ongoing match results, last-synced timestamp.
- Admin panel behind `#admin`: edit rules, enter/correct results (writes overrides), edit team assignments. Saves commit JSON via GitHub API using a fine-grained PAT stored only in the editor's localStorage. Fallback: edit JSON directly on github.com.

## Error handling
- Action keeps last good results.json (commit only on valid fetch).
- Schema-validate all JSON in the browser; banner on invalid data instead of broken page.
- Full degradation path to manual-only mode.

## Testing
- TDD unit tests on the scoring engine: group points, goal points, progression derivation, override precedence, penalty-shootout edge cases.
- Action dry-run via workflow_dispatch; manual smoke test with fixture data.

## Open items
- Verify football-data.org free tier includes WC2026; fallback to unofficial FIFA endpoint behind the same normalizer.

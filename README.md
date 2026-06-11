# WC2026 Sweepstake Tracker

World Cup 2026 team-draw sweepstake leaderboard. Results auto-sync from
football-data.org; scoring rules are fully editable; manual overrides always
beat API data. Hosted free on GitHub Pages.

## How scoring works

Each owned team earns points per `public/data/rules.json` (all values editable):

| Event | Default points |
|---|---|
| Group-stage win | 3 |
| Group-stage draw | 1 |
| Qualify to knockouts (reach Round of 32) | 5 |
| Win Round of 32 | 5 |
| Win Round of 16 | 7 |
| Win Quarter-final | 10 |
| Win Semi-final | 15 |
| Win the Final | 20 |
| Each goal scored (90'+ET, shootout goals excluded) | 0 (off) |

Knockout wins on penalties count as wins. Qualification points are awarded as
soon as a team appears in a knockout fixture.

## Setup (one-time)

1. Create a GitHub repo and push this project, then enable **Settings → Pages →
   Source: GitHub Actions**.
2. Get a free API key at [football-data.org](https://www.football-data.org/client/register)
   and add it as a repo secret named `FOOTBALL_DATA_KEY`
   (**Settings → Secrets and variables → Actions**).
3. Edit `public/data/participants.json` with your real participants, team codes
   (FIFA three-letter codes, e.g. `BRA`), and display names.

The `Sync results` workflow runs every 15 minutes and commits
`public/data/results.json` when anything changed; Pages redeploys
automatically.

## Editing rules / fixing wrong results

Open the site with `#admin` at the end of the URL. The admin panel lets you:

- edit every rule value (including `pointsPerGoal`),
- correct any match result (saved to `public/data/overrides.json`, which always
  beats API data),
- edit participants/teams as raw JSON.

Saving asks once for a GitHub **fine-grained personal access token** with
*Contents: read & write* on this repo only, plus `owner/repo`; both are kept in
your browser's localStorage only. Alternatively just edit the JSON files
directly on github.com — identical effect.

## Development

```bash
npm install
npm run dev    # local preview
npm test       # scoring engine tests
npm run build  # production build
```

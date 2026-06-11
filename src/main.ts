import { applyOverrides, computeStandings } from './scoring';
import { validateRules, validateResults, validateParticipants } from './validate';
import { renderLeaderboard, renderRules, renderMatches, showBanner } from './render';
import { initAdmin } from './admin';
import './style.css';

async function load<T>(path: string): Promise<T> {
  const r = await fetch(`${import.meta.env.BASE_URL}${path}?t=${Date.now()}`);
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

async function boot() {
  try {
    const [rules, participants, overrides, results] = await Promise.all([
      load<any>('data/rules.json'),
      load<any>('data/participants.json'),
      load<any>('data/overrides.json'),
      load<any>('data/results.json'),
    ]);
    const errs = [...validateRules(rules), ...validateResults(results), ...validateParticipants(participants)];
    if (errs.length) {
      showBanner('Data problems: ' + errs.join('; '));
      return;
    }
    const merged = applyOverrides(results, overrides);
    // API-provided team names fill the gaps; participants.json entries win
    participants.teamNames = { ...(results.teamNames ?? {}), ...participants.teamNames };
    const standings = computeStandings(merged, rules, participants);
    renderLeaderboard(document.getElementById('leaderboard')!, standings, participants);
    renderRules(document.getElementById('rules')!, rules);
    renderMatches(document.getElementById('matches')!, merged, participants);
    document.getElementById('synced')!.textContent = results.lastSynced
      ? `Last synced: ${new Date(results.lastSynced).toLocaleString()}`
      : 'No results synced yet';

    const maybeAdmin = () => {
      if (location.hash === '#admin') initAdmin({ rules, participants, overrides, results: merged });
    };
    maybeAdmin();
    window.addEventListener('hashchange', maybeAdmin);
  } catch (e: any) {
    showBanner('Failed to load data: ' + e.message);
  }
}

boot();

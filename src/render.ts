import type { Standings, Results, Rules, Participants } from './types';

const esc = (s: string) =>
  s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function renderLeaderboard(el: HTMLElement, s: Standings, p: Participants) {
  const name = (code: string) => p.teamNames[code] ?? code;
  el.innerHTML =
    `<h2>Leaderboard</h2>` +
    s.leaderboard
      .map(
        (row, i) => `
    <details class="entry">
      <summary><span class="rank">${i + 1}</span> <strong>${esc(row.name)}</strong> <span class="pts">${row.total} pts</span></summary>
      ${row.teams
        .map(
          t => `
        <div class="team"><strong>${esc(name(t.code))}</strong> — ${t.total} pts
          <ul>${(s.teams[t.code]?.breakdown ?? []).map(b => `<li>${esc(b.label)}: ${b.points}</li>`).join('') || '<li>no points yet</li>'}</ul>
        </div>`,
        )
        .join('')}
    </details>`,
      )
      .join('');
}

const RULE_LABELS: Array<[keyof Rules, string]> = [
  ['groupWin', 'Group-stage win'],
  ['groupDraw', 'Group-stage draw'],
  ['reachR32', 'Qualify to knockouts (reach Round of 32)'],
  ['winR32', 'Win Round of 32 (reach Round of 16)'],
  ['winR16', 'Win Round of 16 (reach Quarter-final)'],
  ['winQF', 'Win Quarter-final (reach Semi-final)'],
  ['winSF', 'Win Semi-final (reach Final)'],
  ['winFinal', 'Win the Final — World Champion'],
  ['pointsPerGoal', 'Each goal scored'],
];

export function renderRules(el: HTMLElement, rules: Rules) {
  el.innerHTML =
    `<h2>Scoring rules</h2><table class="rules"><tbody>` +
    RULE_LABELS.map(([k, label]) => `<tr><td>${esc(label)}</td><td class="pts">${rules[k]}</td></tr>`).join('') +
    `</tbody></table>`;
}

export function renderMatches(el: HTMLElement, r: Results, p: Participants) {
  const name = (code: string) => p.teamNames[code] ?? code;
  if (!r.matches.length) {
    el.innerHTML = `<h2>Matches</h2><p>No matches yet — results will appear once the sync runs.</p>`;
    return;
  }
  const recent = [...r.matches].sort((a, b) => b.kickoff.localeCompare(a.kickoff)).slice(0, 20);
  el.innerHTML =
    `<h2>Matches</h2><table><tbody>` +
    recent
      .map(
        mt => `
    <tr class="${mt.status.toLowerCase()}">
      <td>${esc(mt.stage)}</td>
      <td>${esc(name(mt.home))} ${mt.homeGoals ?? ''}–${mt.awayGoals ?? ''} ${esc(name(mt.away))}</td>
      <td>${mt.status === 'FINISHED' && mt.winner ? '🏆 ' + esc(name(mt.winner)) : esc(mt.status)}</td>
    </tr>`,
      )
      .join('') +
    `</tbody></table>`;
}

export function showBanner(msg: string) {
  const b = document.getElementById('banner')!;
  b.textContent = msg;
  b.hidden = false;
}

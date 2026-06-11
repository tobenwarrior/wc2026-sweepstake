import type { Match, Stage, Participants } from './types';

const BRACKET_ORDER: Array<{ stage: Stage; label: string; size: number }> = [
  { stage: 'R32', label: 'Round of 32', size: 16 },
  { stage: 'R16', label: 'Round of 16', size: 8 },
  { stage: 'QF', label: 'Quarter-finals', size: 4 },
  { stage: 'SF', label: 'Semi-finals', size: 2 },
  { stage: 'THIRD', label: 'Third place', size: 1 },
  { stage: 'F', label: 'Final', size: 1 },
];

export interface BracketStage {
  stage: Stage;
  label: string;
  matches: Array<Match | null>; // null = TBD slot
}

export function bracketStages(matches: Match[]): BracketStage[] {
  return BRACKET_ORDER.map(({ stage, label, size }) => {
    const played = matches
      .filter(mt => mt.stage === stage)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    const padded: Array<Match | null> = [...played.slice(0, size)];
    while (padded.length < size) padded.push(null);
    return { stage, label, matches: padded };
  });
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function renderBracket(el: HTMLElement, matches: Match[], p: Participants) {
  const ownerOf: Record<string, string> = {};
  for (const person of p.participants) for (const code of person.teams) ownerOf[code] = person.name;
  const name = (code: string) => p.teamNames[code] ?? code;
  const side = (mt: Match, code: string, goals: number | null) => {
    const isWinner =
      mt.status === 'FINISHED' &&
      (mt.winner ? mt.winner === code : false);
    const owner = ownerOf[code];
    return `<div class="slot ${isWinner ? 'winner' : ''}">
      <span class="tname">${esc(name(code))}${owner ? ` <span class="owner">${esc(owner)}</span>` : ''}</span>
      <span class="score">${goals ?? ''}</span>
    </div>`;
  };
  const stages = bracketStages(matches);
  const hasAny = stages.some(s => s.matches.some(Boolean));
  el.innerHTML =
    `<h2>Knockout bracket</h2>` +
    (hasAny ? '' : `<p>Bracket fills in automatically once knockout fixtures are set.</p>`) +
    `<div class="bracket">` +
    stages
      .map(
        s => `
      <div class="round">
        <h3>${esc(s.label)}</h3>
        ${s.matches
          .map(mt =>
            mt
              ? `<div class="bmatch ${mt.status.toLowerCase()}">${side(mt, mt.home, mt.homeGoals)}${side(mt, mt.away, mt.awayGoals)}${
                  mt.status === 'FINISHED' && mt.winner && mt.homeGoals === mt.awayGoals ? `<div class="pens">${esc(name(mt.winner))} win on penalties</div>` : ''
                }</div>`
              : `<div class="bmatch tbd"><div class="slot"><span class="tname">TBD</span></div><div class="slot"><span class="tname">TBD</span></div></div>`,
          )
          .join('')}
      </div>`,
      )
      .join('') +
    `</div>`;
}

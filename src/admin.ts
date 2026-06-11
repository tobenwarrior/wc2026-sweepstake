import type { Rules, Participants, Overrides, Results, Match } from './types';

interface AdminState {
  rules: Rules;
  participants: Participants;
  overrides: Overrides;
  results: Results;
}

const TOKEN_KEY = 'wc2026_gh_token';
const REPO_KEY = 'wc2026_gh_repo'; // "owner/repo"

async function commitFile(path: string, content: unknown, message: string) {
  const token = localStorage.getItem(TOKEN_KEY) ?? prompt('GitHub fine-grained token (contents: read+write on this repo):');
  const repo = localStorage.getItem(REPO_KEY) ?? prompt('Repo (owner/name):');
  if (!token || !repo) throw new Error('token and repo required');
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REPO_KEY, repo);
  const api = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
  const cur = await fetch(api, { headers });
  const sha = cur.ok ? (await cur.json()).sha : undefined;
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2) + '\n'))),
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(api, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
}

function saveButton(label: string, onSave: () => Promise<void>): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      await onSave();
      btn.textContent = 'Saved ✓ (Pages redeploys in ~1 min)';
    } catch (e: any) {
      btn.textContent = label;
      alert('Save failed: ' + e.message);
    } finally {
      btn.disabled = false;
      setTimeout(() => (btn.textContent = label), 5000);
    }
  };
  return btn;
}

export function initAdmin(state: AdminState) {
  const panel = document.getElementById('admin-panel')!;
  if (!panel.hidden) return; // already initialized
  panel.hidden = false;
  panel.innerHTML = '<h2>Admin</h2>';

  // --- Rules editor ---
  const rulesFs = document.createElement('fieldset');
  rulesFs.innerHTML = '<legend>Scoring rules</legend>';
  const inputs: Record<string, HTMLInputElement> = {};
  for (const [key, value] of Object.entries(state.rules)) {
    const label = document.createElement('label');
    label.textContent = key;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = 'any';
    input.value = String(value);
    inputs[key] = input;
    label.appendChild(input);
    rulesFs.appendChild(label);
  }
  rulesFs.appendChild(
    saveButton('Save rules', async () => {
      const next: any = {};
      for (const [k, input] of Object.entries(inputs)) next[k] = Number(input.value);
      await commitFile('public/data/rules.json', next, 'admin: update rules');
    }),
  );
  panel.appendChild(rulesFs);

  // --- Match override editor ---
  const ovFs = document.createElement('fieldset');
  ovFs.innerHTML = '<legend>Correct a match result</legend>';
  const select = document.createElement('select');
  select.innerHTML =
    '<option value="">— pick a match —</option>' +
    state.results.matches
      .map(mt => `<option value="${mt.id}">${mt.stage}: ${mt.home} vs ${mt.away} (${mt.status})</option>`)
      .join('');
  const homeGoals = document.createElement('input');
  const awayGoals = document.createElement('input');
  homeGoals.type = awayGoals.type = 'number';
  homeGoals.placeholder = 'home goals';
  awayGoals.placeholder = 'away goals';
  const status = document.createElement('select');
  status.innerHTML = ['SCHEDULED', 'LIVE', 'FINISHED'].map(s => `<option>${s}</option>`).join('');
  status.value = 'FINISHED';
  const winner = document.createElement('input');
  winner.type = 'text';
  winner.placeholder = 'winner code (knockout only, e.g. BRA)';
  select.onchange = () => {
    const mt = state.results.matches.find(x => x.id === select.value);
    if (!mt) return;
    homeGoals.value = mt.homeGoals != null ? String(mt.homeGoals) : '';
    awayGoals.value = mt.awayGoals != null ? String(mt.awayGoals) : '';
    status.value = mt.status;
    winner.value = mt.winner ?? '';
  };
  for (const el of [select, homeGoals, awayGoals, status, winner]) {
    const wrap = document.createElement('label');
    wrap.appendChild(el);
    ovFs.appendChild(wrap);
  }
  ovFs.appendChild(
    saveButton('Save override', async () => {
      if (!select.value) throw new Error('pick a match first');
      const o: Partial<Match> & { id: string } = {
        id: select.value,
        homeGoals: homeGoals.value === '' ? null : Number(homeGoals.value),
        awayGoals: awayGoals.value === '' ? null : Number(awayGoals.value),
        status: status.value as Match['status'],
        winner: winner.value.trim() || null,
      };
      const next = { matches: [...state.overrides.matches.filter(x => x.id !== o.id), o] };
      await commitFile('public/data/overrides.json', next, `admin: override match ${o.id}`);
      state.overrides = next;
    }),
  );
  panel.appendChild(ovFs);

  // --- Participants editor (raw JSON) ---
  const pFs = document.createElement('fieldset');
  pFs.innerHTML = '<legend>Participants & teams (raw JSON)</legend>';
  const ta = document.createElement('textarea');
  ta.value = JSON.stringify(state.participants, null, 2);
  pFs.appendChild(ta);
  pFs.appendChild(
    saveButton('Save participants', async () => {
      const parsed = JSON.parse(ta.value); // throws with a clear message if invalid
      await commitFile('public/data/participants.json', parsed, 'admin: update participants');
    }),
  );
  panel.appendChild(pFs);

  // --- Token reset ---
  const reset = document.createElement('button');
  reset.textContent = 'Forget saved GitHub token';
  reset.onclick = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REPO_KEY);
    alert('Token cleared');
  };
  panel.appendChild(reset);
}

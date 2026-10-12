import { validateUsageReport, type UsageReport } from '../server/codexReports';
import { validateCodexCopy, type CodexUsageCopy } from '../content/codexUsage';
const LOCAL_REPORT = 'codex-report-for-sign-in-v2';
interface Account {
  authenticated: boolean; submissionsOpen: boolean; signInAvailable?: boolean; login?: string; csrf?: string;
  revision?: string | null; contribution?: { status: 'pending_review' | 'accepted'; optIn: boolean } | null;
}
export function initContribution(root: HTMLElement): void {
  const parsed: unknown = JSON.parse(root.querySelector('[data-contribution-copy]')?.textContent || '{}');
  if (!validateCodexCopy(parsed)) return;
  const copy: CodexUsageCopy = parsed;
  const c = copy.contribution, m = copy.messages;
  const node = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-${name}]`)!;
  const file = node<HTMLInputElement>('report-file'), status = node('report-status'), results = node('report-results');
  const optIn = node<HTMLInputElement>('opt-in'), consent = node<HTMLInputElement>('consent'), submit = node<HTMLButtonElement>('submit');
  let report: UsageReport | null = null, account: Account = { authenticated: false, submissionsOpen: false }, busy = false, generation = 0;
  const fmt = new Intl.NumberFormat('en-NZ');
  const forget = () => { try { sessionStorage.removeItem(LOCAL_REPORT); } catch { /* Optional local storage. */ } };
  const paint = () => {
    node('sharing-closed').hidden = account.submissionsOpen;
    node('sign-in').hidden = account.authenticated || !account.signInAvailable || (account.submissionsOpen && !report);
    node('account').hidden = !account.authenticated;
    node('submit-controls').hidden = !account.submissionsOpen || !report;
    submit.disabled = busy || !report || !consent.checked || !account.authenticated || !account.submissionsOpen;
    submit.textContent = account.contribution ? c.replace : c.submit;
    node('login').textContent = account.login || '';
    node('attribution').hidden = !account.contribution;
    node('withdraw').hidden = !account.contribution;
    optIn.disabled = busy || (!account.submissionsOpen && !account.contribution?.optIn);
    file.disabled = busy;
    consent.disabled = busy;
    for (const name of ['attribution', 'withdraw', 'logout']) node<HTMLButtonElement>(name).disabled = busy;
  };
  const preview = (candidate: unknown) => {
    report = validateUsageReport(candidate); consent.checked = false;
    if (!report) { forget(); results.hidden = true; status.textContent = m.invalidReport; paint(); return; }
    const input = report.buckets.reduce((n, b) => n + b.input_tokens, 0), output = report.buckets.reduce((n, b) => n + b.output_tokens, 0);
    node('report-sessions').textContent = fmt.format(report.summary.usableSessions);
    node('report-buckets').textContent = fmt.format(report.buckets.length);
    node('report-input').textContent = fmt.format(input); node('report-output').textContent = fmt.format(output);
    node('report-json').textContent = JSON.stringify(report, null, 2);
    results.hidden = false; status.textContent = m.loaded;
    paint();
  };
  const refresh = async () => {
    const response = await fetch('/api/codex/github/me', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) throw new Error('unavailable');
    account = await response.json() as Account;
    optIn.checked = account.contribution?.optIn === true;
    consent.checked = false;
    node('contribution-state').textContent = account.contribution ? m[account.contribution.status === 'accepted' ? 'accepted' : 'pending'] : '';
    paint();
  };
  file.addEventListener('change', async () => {
    const selection = ++generation;
    report = null; forget(); results.hidden = true; consent.checked = false; paint();
    const selected = file.files?.[0];
    if (!selected) { status.textContent = m.noFile; return; }
    if (selected.size > 256_000) { status.textContent = m.tooLarge; return; }
    try { const value: unknown = JSON.parse(await selected.text()); if (selection === generation) preview(value); }
    catch { if (selection === generation) status.textContent = m.invalidReport; }
  });
  consent.addEventListener('change', paint);
  node('sign-in').addEventListener('click', () => {
    // Persist only the selected aggregate for a short OAuth round trip, never identity or tokens.
    if (report) try { sessionStorage.setItem(LOCAL_REPORT, JSON.stringify({ report, exp: Date.now() + 15 * 60_000 })); } catch { /* Reselect after sign-in if storage is disabled. */ }
  });
  const profiles = async () => {
    const list = document.querySelector<HTMLElement>('[data-contributors-list]');
    if (!list) return;
    list.replaceChildren();
    const empty = document.querySelector<HTMLElement>('[data-contributors-empty]');
    if (empty) empty.hidden = false;
    try {
      const response = await fetch('/api/codex/contributors', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json() as { contributors: { login: string; profileUrl: string; avatarUrl: string }[] };
      for (const person of data.contributors) {
        if (!/^[A-Za-z0-9-]{1,39}$/.test(person.login) || person.profileUrl !== 'https://github.com/' + person.login ||
            !/^https:\/\/avatars\.githubusercontent\.com\/u\/[0-9]+\?s=96$/.test(person.avatarUrl)) continue;
        const li = document.createElement('li'), link = document.createElement('a'), img = document.createElement('img'), label = document.createElement('span');
        link.href = person.profileUrl; link.rel = 'noopener noreferrer';
        img.src = person.avatarUrl; img.alt = c.avatarAlt + ' ' + person.login; img.width = 48; img.height = 48; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
        label.textContent = person.login; link.append(img, label); li.append(link); list.append(li);
      }
      if (empty) empty.hidden = list.childElementCount > 0;
    } catch { /* Suppress public profiles when unavailable. */ }
  };
  const mutate = async (method: 'POST' | 'PATCH' | 'DELETE', logout = false) => {
    if (busy || !account.authenticated || !account.csrf) return;
    if (method === 'POST' && !logout && (!report || !consent.checked || !account.submissionsOpen)) return;
    if (method === 'DELETE' && !window.confirm(c.withdrawConfirm)) return;
    busy = true; paint(); status.textContent = m.sending;
    try {
      const body = logout ? {} : method === 'DELETE' ? { revision: account.revision } : method === 'PATCH' ?
        { revision: account.revision, optIn: optIn.checked } : { revision: account.revision, report, optIn: optIn.checked };
      const response = await fetch(logout ? '/api/codex/github/logout' : '/api/codex-contribute', {
        method, credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-codex-csrf': account.csrf }, body: JSON.stringify(body),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        if (result.error === 'changed_reload') { await refresh(); throw new Error('changed'); }
        if (response.status === 401) { account = { authenticated: false, submissionsOpen: account.submissionsOpen }; }
        throw new Error('failed');
      }
      const result = await response.json() as { status?: string };
      if (logout || method === 'DELETE' || method === 'POST') { forget(); report = null; file.value = ''; results.hidden = true; }
      await refresh(); await profiles();
      status.textContent = logout ? m.signedOut : method === 'DELETE' ? m.withdrawn : method === 'PATCH' ? m.saved : result.status === 'accepted' ? m.accepted : m.pending;
    } catch (error) { status.textContent = error instanceof Error && error.message === 'changed' ? m.changed : m.failed; }
    finally { busy = false; consent.checked = false; paint(); }
  };
  submit.addEventListener('click', () => void mutate('POST'));
  node('attribution').addEventListener('click', () => void mutate('PATCH'));
  node('withdraw').addEventListener('click', () => void mutate('DELETE'));
  node('logout').addEventListener('click', () => void mutate('POST', true));
  const url = new URL(location.href);
  const oauth = url.searchParams.get('github');
  if (oauth) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(LOCAL_REPORT) || 'null') as { exp: number; report: unknown } | null;
      if (saved && saved.exp > Date.now() && saved.exp <= Date.now() + 15 * 60_000) preview(saved.report);
    } catch { /* Expired or unavailable local preview. */ }
    forget(); url.searchParams.delete('github'); history.replaceState(null, '', url);
    if (oauth === 'failed') status.textContent = m.signInFailed;
  } else forget();
  void refresh().catch(() => { status.textContent = m.failed; paint(); });
  void profiles(); paint();
}

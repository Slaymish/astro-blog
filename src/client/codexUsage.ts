export interface Plan { name: string; monthlyNzd: number; dailyHours: number; weeklyHours: number }
export interface Strategy { subscriptions: number[]; monthlyNzd: number; creditsNzd: number; includedHours: number }
export const ASSUMPTIONS = {
  codingDays: 30,
  additionalHourNzd: 7,
  sampleCount: 0,
  lastUpdated: null as string | null,
  plans: [
    { name: 'Plus', monthlyNzd: 41, dailyHours: 1.5, weeklyHours: 7 },
    { name: 'Pro 100', monthlyNzd: 205, dailyHours: 7.5, weeklyHours: 35 },
    { name: 'Pro 200', monthlyNzd: 409, dailyHours: 15, weeklyHours: 70 },
    { name: 'Pro 500', monthlyNzd: 1024, dailyHours: 37.5, weeklyHours: 175 },
  ] satisfies Plan[],
};
export function optimise(hoursPerDay: number): Strategy {
  if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0) throw new RangeError('Daily hours must be positive');
  const { plans, codingDays, additionalHourNzd } = ASSUMPTIONS;
  const demand = hoursPerDay * codingDays;
  let best: Strategy | undefined;
  // Include credits-only top-ups on each combination. A cap of 12 accounts
  // is ample for the 0.25–12 hour slider but is not a general-purpose solver.
  for (let a = 0; a <= 12; a++)
    for (let b = 0; b <= 12 - a; b++)
      for (let c = 0; c <= 12 - a - b; c++)
        for (let d = 0; d <= 12 - a - b - c; d++) {
          if (a + b + c + d === 0) continue;
          const counts = [a, b, c, d];
          const base = counts.reduce((total, n, i) => total + n * plans[i].monthlyNzd, 0);
          const daily = counts.reduce((total, n, i) => total + n * plans[i].dailyHours, 0);
          const weekly = counts.reduce((total, n, i) => total + n * plans[i].weeklyHours, 0);
          const included = Math.min(demand, daily * codingDays, weekly * codingDays / 7);
          const credits = Math.max(0, demand - included) * additionalHourNzd;
          const candidate = { subscriptions: counts, monthlyNzd: base + credits, creditsNzd: credits, includedHours: included };
          if (!best || candidate.monthlyNzd < best.monthlyNzd - 0.001 ||
              (Math.abs(candidate.monthlyNzd - best.monthlyNzd) < 0.001 &&
                counts.reduce((sum, n) => sum + n, 0) < best.subscriptions.reduce((sum, n) => sum + n, 0))) {
            best = candidate;
          }
        }
  return best!;
}
export function describeStrategy(strategy: Strategy, creditsLabel = '', planLabels = ASSUMPTIONS.plans.map(plan => plan.name)): string {
  const subscriptions = strategy.subscriptions
    .map((n, i) => n ? `${n} × ${planLabels[i]}` : '')
    .filter(Boolean).join(' + ');
  return subscriptions + (strategy.creditsNzd > 0.005 ? ' + ' + creditsLabel : '');
}
export function initCodexUsage(root: HTMLElement): void {
  const range = root.querySelector<HTMLInputElement>('[data-hours]');
  if (!range) return;
  const currency = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 });
  const planLabels = JSON.parse(root.dataset.planLabels || '[]') as string[];
  const update = () => {
    const hours = Number(range.value);
    const outcome = optimise(hours);
    const fields: Record<string, string> = {
      hours: hours.toFixed(2),
      sessions: (hours * 60 / 35).toFixed(1),
      strategy: describeStrategy(outcome, root.dataset.creditsLabel, planLabels),
      monthly: currency.format(outcome.monthlyNzd),
      subscriptions: currency.format(outcome.monthlyNzd - outcome.creditsNzd),
      credits: currency.format(outcome.creditsNzd),
    };
    for (const [key, value] of Object.entries(fields)) {
      const element = root.querySelector<HTMLElement>(`[data-result="${key}"]`);
      if (element) element.textContent = value;
    }
  };
  range.addEventListener('input', update);
  update();
}

/**
 * The GPU cost calculator that sits inside the GPUShare post. Cloud prices
 * are converted to the selected electricity-rate currency.
 * `compute` is exported pure so it can be tested without a DOM.
 */

export const MODELS = [
  { name: 'Llama 3.1 8B (BF16)', vram: '~8 GB', tokPerSec: 55, quality: 'Everyday tasks' },
  { name: 'Qwen3 14B (Q4)', vram: '~10 GB', tokPerSec: 37, quality: 'Reasoning, multilingual' },
  { name: 'Gemma 3 12B (Q4)', vram: '~8 GB', tokPerSec: 45, quality: 'Coding, instruction following' },
  { name: 'Qwen3 32B (Q4)', vram: '~18 GB', tokPerSec: 15, quality: 'Near GPT-4-mini (needs offload)' },
] as const;

/** Approximate cloud cost per output token (USD) for comparable quality tiers. */
const CLOUD_COST_PER_TOKEN: Record<string, { provider: string; costPerToken: number }> = {
  'Llama 3.1 8B (BF16)': { provider: 'GPT-4o mini', costPerToken: 0.6 / 1_000_000 },
  'Qwen3 14B (Q4)': { provider: 'GPT-4o mini', costPerToken: 0.6 / 1_000_000 },
  'Gemma 3 12B (Q4)': { provider: 'GPT-4o mini', costPerToken: 0.6 / 1_000_000 },
  'Qwen3 32B (Q4)': { provider: 'GPT-4o', costPerToken: 10.0 / 1_000_000 },
};

/** RTX 5070 Ti typical inference draw. */
export const GPU_WATTAGE = 150;

export type Currency = 'NZD' | 'USD' | 'EUR';

export const PRESETS: Record<string, { rate: number; currency: Currency }> = {
  NZ: { rate: 0.346, currency: 'NZD' },
  US: { rate: 0.168, currency: 'USD' },
  EU: { rate: 0.265, currency: 'EUR' },
};

// ECB reference rates: 1 EUR = 1.1225 USD = 2.0002 NZD.
// A dated snapshot keeps this estimate reproducible without a runtime FX API.
export const FX_DATE = '2 October 2026';
export const FX_SOURCE = 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.ff.html';
const UNITS_PER_USD: Record<Currency, number> = {
  NZD: 2.0002 / 1.1225,
  USD: 1,
  EUR: 1 / 1.1225,
};
const CURRENCY_PREFIX: Record<Currency, string> = { NZD: 'NZ$', USD: 'US$', EUR: '€' };

export function formatCost(n: number, currency: Currency = 'NZD'): string {
  const prefix = CURRENCY_PREFIX[currency];
  if (n < 0.0001) return `<${prefix}0.0001`;
  if (n < 0.01) return `${prefix}${n.toFixed(4)}`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

export interface CalculatorInputs {
  modelIndex: number;
  tokensPerResponse: number;
  responsesPerDay: number;
  electricityRate: number;
  currency?: Currency;
}

export interface CalculatorResults {
  inferenceTimeSec: number;
  costPerResponse: number;
  dailyCost: number;
  monthlyCost: number;
  cloudCostPerResponse: number;
  cloudMonthlyCost: number;
  multiplier: number;
}

export function compute(inputs: CalculatorInputs): CalculatorResults {
  const model = MODELS[inputs.modelIndex] ?? MODELS[0];
  const cloud = CLOUD_COST_PER_TOKEN[model.name]!;

  const inferenceTimeSec = inputs.tokensPerResponse / model.tokPerSec;
  const kwhPerResponse = (GPU_WATTAGE / 1000) * (inferenceTimeSec / 3600);
  const costPerResponse = kwhPerResponse * inputs.electricityRate;

  const dailyCost = costPerResponse * inputs.responsesPerDay;
  const monthlyCost = dailyCost * 30;

  const cloudCostPerResponse = cloud.costPerToken * inputs.tokensPerResponse *
    UNITS_PER_USD[inputs.currency ?? 'NZD'];
  const cloudMonthlyCost = cloudCostPerResponse * inputs.responsesPerDay * 30;
  const multiplier = costPerResponse > 0 ? cloudCostPerResponse / costPerResponse : 0;

  return {
    inferenceTimeSec,
    costPerResponse,
    dailyCost,
    monthlyCost,
    cloudCostPerResponse,
    cloudMonthlyCost,
    multiplier,
  };
}

/** Compare local against cloud, preserving direction even close to parity. */
export function formatComparison(multiplier: number): string {
  if (!Number.isFinite(multiplier) || multiplier <= 0) return 'N/A';
  if (multiplier === 1) return 'Same cost';
  const percent = Math.abs(1 - 1 / multiplier) * 100;
  const rounded = multiplier > 1 ? Math.min(percent, 99.9) : percent;
  const amount = percent < 1 ? '<1' : rounded.toFixed(1).replace(/\.0$/, '');
  return `${amount}% ${multiplier > 1 ? 'lower' : 'higher'}`;
}

/** Every text the calculator shows for a set of inputs, keyed by data-result. */
export function describe(inputs: CalculatorInputs): Record<string, string> {
  const currency = inputs.currency ?? 'NZD';
  const prefix = CURRENCY_PREFIX[currency];
  const model = MODELS[inputs.modelIndex] ?? MODELS[0];
  const cloud = CLOUD_COST_PER_TOKEN[model.name]!;
  const results = compute(inputs);
  return {
    tokens: String(inputs.tokensPerResponse),
    responses: String(inputs.responsesPerDay),
    rate: `${prefix}${inputs.electricityRate.toFixed(3)}/kWh`,
    'rate-min': `${prefix}${RATE_RANGE.min.toFixed(2)}`,
    'rate-max': `${prefix}${RATE_RANGE.max.toFixed(2)}`,
    'exchange-rate': currency === 'USD' ? 'USD comparison' :
      `1 US$ = ${prefix}${UNITS_PER_USD[currency].toFixed(4)}`,
    'per-response': formatCost(results.costPerResponse, currency),
    daily: formatCost(results.dailyCost, currency),
    monthly: formatCost(results.monthlyCost, currency),
    multiplier: formatComparison(results.multiplier),
    'cloud-monthly': `${formatCost(results.cloudMonthlyCost, currency)}/mo`,
    'local-monthly': `${formatCost(results.monthlyCost, currency)}/mo`,
    'cloud-provider': cloud.provider,
    'local-model': model.name.split(' (')[0]!,
    footnote:
      `Local cost = ${GPU_WATTAGE}W GPU draw x inference time x electricity rate. ` +
      `Cloud comparison uses ${cloud.provider} output token pricing. ` +
      'Actual throughput varies with quantisation, context length, and batch size.',
  };
}

/** The electricity rate's bounds, shared by the slider and the number field. */
export const RATE_RANGE = { min: 0.01, max: 0.6, step: 0.001 } as const;

/** The state the page is built in, so the results read correctly before any script runs. */
export const DEFAULT_INPUTS: CalculatorInputs = {
  modelIndex: 0,
  tokensPerResponse: 500,
  responsesPerDay: 50,
  electricityRate: PRESETS.NZ!.rate,
  currency: PRESETS.NZ!.currency,
};

/** How long the results sit still before a screen reader hears them. */
const ANNOUNCE_DELAY_MS = 700;

export function initGpuCalculator(root: HTMLElement): void {
  const modelSelect = root.querySelector<HTMLSelectElement>('[data-input="model"]');
  const tokens = root.querySelector<HTMLInputElement>('[data-input="tokens"]');
  const responses = root.querySelector<HTMLInputElement>('[data-input="responses"]');
  const rate = root.querySelector<HTMLInputElement>('[data-input="rate"]');
  const rateField = root.querySelector<HTMLInputElement>('[data-input="rate-field"]');
  const announcer = root.querySelector<HTMLElement>('[data-calc-announce]');
  if (!modelSelect || !tokens || !responses || !rate) return;

  const presets = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-preset]'));

  let currency: Currency = DEFAULT_INPUTS.currency ?? 'NZD';
  let announceTimer: ReturnType<typeof setTimeout> | undefined;

  const render = (): void => {
    const inputs: CalculatorInputs = {
      modelIndex: Number(modelSelect.value),
      tokensPerResponse: Number(tokens.value),
      responsesPerDay: Number(responses.value),
      electricityRate: Number(rate.value),
      currency,
    };
    const text = describe(inputs);

    for (const element of root.querySelectorAll<HTMLElement>('[data-result]')) {
      const value = text[element.dataset.result ?? ''];
      if (value !== undefined) element.textContent = value;
    }

    // A slider announces its raw number unless told otherwise.
    tokens.setAttribute('aria-valuetext', `${text.tokens} tokens`);
    responses.setAttribute('aria-valuetext', `${text.responses} responses`);
    rate.setAttribute('aria-valuetext', text.rate!);

    for (const preset of presets) {
      const value = PRESETS[preset.dataset.preset ?? ''];
      preset.setAttribute('aria-pressed', String(value !== undefined && value.currency === currency && value.rate === inputs.electricityRate));
    }

    // One polite summary once the inputs settle, not one per slider step.
    if (announcer) {
      clearTimeout(announceTimer);
      announceTimer = setTimeout(() => {
        announcer.textContent =
          `Monthly: ${text['local-monthly']} locally, ${text['cloud-monthly']} on ${text['cloud-provider']}. ` +
          `Local is ${text.multiplier}.`;
      }, ANNOUNCE_DELAY_MS);
    }
  };

  for (const control of [modelSelect, tokens, responses]) {
    control.addEventListener('input', render);
  }

  rate.addEventListener('input', () => {
    if (rateField) rateField.value = rate.value;
    render();
  });

  // The number field is the precise way in: the slider has 590 steps.
  rateField?.addEventListener('input', () => {
    const value = Number(rateField.value);
    if (!Number.isFinite(value) || value < RATE_RANGE.min || value > RATE_RANGE.max) return;
    rate.value = String(value);
    render();
  });

  for (const preset of presets) {
    preset.addEventListener('click', () => {
      const value = PRESETS[preset.dataset.preset ?? ''];
      if (value === undefined) return;
      currency = value.currency;
      rate.value = String(value.rate);
      if (rateField) rateField.value = String(value.rate);
      render();
    });
  }

  render();
}

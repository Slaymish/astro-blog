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

export function initGpuCalculator(root: HTMLElement): void {
  const modelSelect = root.querySelector<HTMLSelectElement>('[data-input="model"]');
  const tokens = root.querySelector<HTMLInputElement>('[data-input="tokens"]');
  const responses = root.querySelector<HTMLInputElement>('[data-input="responses"]');
  const rate = root.querySelector<HTMLInputElement>('[data-input="rate"]');
  if (!modelSelect || !tokens || !responses || !rate) return;

  const presets = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-preset]'));
  const out = (name: string): HTMLElement | null => root.querySelector(`[data-result="${name}"]`);

  let currency: Currency = 'NZD';

  const render = (): void => {
    const inputs: CalculatorInputs = {
      modelIndex: Number(modelSelect.value),
      tokensPerResponse: Number(tokens.value),
      responsesPerDay: Number(responses.value),
      electricityRate: Number(rate.value),
      currency,
    };
    const model = MODELS[inputs.modelIndex] ?? MODELS[0];
    const cloud = CLOUD_COST_PER_TOKEN[model.name]!;
    const results = compute(inputs);

    const set = (name: string, value: string): void => {
      const element = out(name);
      if (element) element.textContent = value;
    };

    set('tokens', String(inputs.tokensPerResponse));
    set('responses', String(inputs.responsesPerDay));
    set('rate', `${CURRENCY_PREFIX[currency]}${inputs.electricityRate.toFixed(3)}/kWh`);
    set('rate-min', `${CURRENCY_PREFIX[currency]}${Number(rate.min).toFixed(2)}`);
    set('rate-max', `${CURRENCY_PREFIX[currency]}${Number(rate.max).toFixed(2)}`);
    set('exchange-rate', currency === 'USD' ? 'USD comparison' :
      `1 US$ = ${CURRENCY_PREFIX[currency]}${UNITS_PER_USD[currency].toFixed(4)}`);
    set('per-response', formatCost(results.costPerResponse, currency));
    set('daily', formatCost(results.dailyCost, currency));
    set('monthly', formatCost(results.monthlyCost, currency));
    set('multiplier', formatComparison(results.multiplier));
    set('cloud-monthly', `${formatCost(results.cloudMonthlyCost, currency)}/mo`);
    set('local-monthly', `${formatCost(results.monthlyCost, currency)}/mo`);
    set('cloud-provider', cloud.provider);
    set('local-model', model.name.split(' (')[0]!);
    set(
      'footnote',
      `Local cost = ${GPU_WATTAGE}W GPU draw x inference time x electricity rate. ` +
        `Cloud comparison uses ${cloud.provider} output token pricing. ` +
        'Actual throughput varies with quantisation, context length, and batch size.',
    );

    for (const preset of presets) {
      const value = PRESETS[preset.dataset.preset ?? ''];
      preset.setAttribute('aria-pressed', String(value !== undefined && value.currency === currency && value.rate === inputs.electricityRate));
    }
  };

  for (const control of [modelSelect, tokens, responses, rate]) {
    control.addEventListener('input', render);
  }

  for (const preset of presets) {
    preset.addEventListener('click', () => {
      const value = PRESETS[preset.dataset.preset ?? ''];
      if (value === undefined) return;
      currency = value.currency;
      rate.value = String(value.rate);
      render();
    });
  }

  render();
}

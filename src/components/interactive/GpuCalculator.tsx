import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MODELS = [
  { name: 'Llama 3.1 8B (BF16)', vram: '~8 GB', tokPerSec: 55, quality: 'Everyday tasks' },
  { name: 'Qwen3 14B (Q4)', vram: '~10 GB', tokPerSec: 37, quality: 'Reasoning, multilingual' },
  { name: 'Gemma 3 12B (Q4)', vram: '~8 GB', tokPerSec: 45, quality: 'Coding, instruction following' },
  { name: 'Qwen3 32B (Q4)', vram: '~18 GB', tokPerSec: 15, quality: 'Near GPT-4-mini (needs offload)' },
] as const;

/** Approximate cloud cost per output token (USD) for comparable quality tiers */
const CLOUD_COST_PER_TOKEN: Record<string, { provider: string; costPerToken: number }> = {
  'Llama 3.1 8B (BF16)': { provider: 'GPT-4o mini', costPerToken: 0.60 / 1_000_000 },
  'Qwen3 14B (Q4)': { provider: 'GPT-4o mini', costPerToken: 0.60 / 1_000_000 },
  'Gemma 3 12B (Q4)': { provider: 'GPT-4o mini', costPerToken: 0.60 / 1_000_000 },
  'Qwen3 32B (Q4)': { provider: 'GPT-4o', costPerToken: 10.00 / 1_000_000 },
};

const GPU_WATTAGE = 150; // RTX 5070 Ti typical inference draw

const PRESETS: Record<string, number> = {
  'NZ': 0.346,
  'US': 0.168,
  'EU': 0.265,
};

function formatCost(n: number, currency = 'NZD'): string {
  if (n < 0.0001) return `<${currency === 'NZD' ? 'NZ' : ''}$0.0001`;
  if (n < 0.01) return `${currency === 'NZD' ? 'NZ' : ''}$${n.toFixed(4)}`;
  if (n >= 1_000) return `${currency === 'NZD' ? 'NZ' : ''}$${(n / 1_000).toFixed(1)}K`;
  return `${currency === 'NZD' ? 'NZ' : ''}$${n.toFixed(2)}`;
}

export default function GpuCalculator() {
  const [modelIndex, setModelIndex] = useState(0);
  const [tokensPerResponse, setTokensPerResponse] = useState(500);
  const [responsesPerDay, setResponsesPerDay] = useState(50);
  const [electricityRate, setElectricityRate] = useState(0.346); // NZ default
  const [ratePreset, setRatePreset] = useState<string | null>('NZ');

  const model = MODELS[modelIndex];
  const cloud = CLOUD_COST_PER_TOKEN[model.name];

  const results = useMemo(() => {
    const inferenceTimeSec = tokensPerResponse / model.tokPerSec;
    const inferenceTimeHrs = inferenceTimeSec / 3600;
    const kwhPerResponse = (GPU_WATTAGE / 1000) * inferenceTimeHrs;
    const costPerResponse = kwhPerResponse * electricityRate;

    const dailyCost = costPerResponse * responsesPerDay;
    const monthlyCost = dailyCost * 30;

    const cloudCostPerResponse = cloud.costPerToken * tokensPerResponse;
    const cloudMonthlyCost = cloudCostPerResponse * responsesPerDay * 30;
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
  }, [model, tokensPerResponse, responsesPerDay, electricityRate, cloud]);

  return (
    <div
      className="not-prose my-8 rounded-lg border p-5 sm:p-6"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
    >
      <h3
        className="mt-0 mb-1 text-lg font-semibold tracking-tight"
        style={{ color: 'var(--text)' }}
      >
        GPUShare Cost Calculator
      </h3>
      <p className="mt-0 mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>
        See what local inference actually costs on a 5070 Ti vs cloud APIs.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Model selector */}
        <div className="sm:col-span-2">
          <Label>Model</Label>
          <select
            value={modelIndex}
            onChange={(e) => setModelIndex(Number(e.target.value))}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            style={{
              background: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {MODELS.map((m, i) => (
              <option key={m.name} value={i}>
                {m.name} - {m.vram}, ~{m.tokPerSec} tok/s - {m.quality}
              </option>
            ))}
          </select>
        </div>

        {/* Tokens per response */}
        <div>
          <Label>
            Tokens per response:{' '}
            <span style={{ color: 'var(--accent)' }}>{tokensPerResponse}</span>
          </Label>
          <input
            type="range"
            min={50}
            max={4000}
            step={50}
            value={tokensPerResponse}
            onChange={(e) => setTokensPerResponse(Number(e.target.value))}
            className="mt-1 w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
          <div className="mt-1 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>50</span>
            <span>4,000</span>
          </div>
        </div>

        {/* Responses per day */}
        <div>
          <Label>
            Responses per day:{' '}
            <span style={{ color: 'var(--accent)' }}>{responsesPerDay}</span>
          </Label>
          <input
            type="range"
            min={1}
            max={500}
            step={1}
            value={responsesPerDay}
            onChange={(e) => setResponsesPerDay(Number(e.target.value))}
            className="mt-1 w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
          <div className="mt-1 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>1</span>
            <span>500</span>
          </div>
        </div>

        {/* Electricity rate */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label>
              Electricity rate:{' '}
              <span style={{ color: 'var(--accent)' }}>${electricityRate.toFixed(3)}/kWh</span>
            </Label>
            <div className="flex gap-1.5">
              {Object.entries(PRESETS).map(([label, rate]) => (
                <button
                  key={label}
                  onClick={() => { setElectricityRate(rate); setRatePreset(label); }}
                  className="rounded px-2 py-0.5 text-xs font-medium transition-colors"
                  style={{
                    background: ratePreset === label ? 'var(--accent)' : 'var(--surface-2, var(--bg))',
                    color: ratePreset === label ? 'white' : 'var(--text-muted)',
                    border: `1px solid ${ratePreset === label ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min={0.01}
            max={0.60}
            step={0.001}
            value={electricityRate}
            onChange={(e) => { setElectricityRate(Number(e.target.value)); setRatePreset(null); }}
            className="mt-1 w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
          <div className="mt-1 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>$0.01</span>
            <span>$0.60</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultCard label="Per response" value={formatCost(results.costPerResponse)} />
        <ResultCard label="Daily" value={formatCost(results.dailyCost)} />
        <ResultCard label="Monthly" value={formatCost(results.monthlyCost)} />
        <ResultCard
          label="vs cloud"
          value={results.multiplier >= 1000 ? `${Math.round(results.multiplier / 100) * 100}x cheaper` : `${Math.round(results.multiplier)}x cheaper`}
          accent
        />
      </div>

      {/* Cloud comparison */}
      <div
        className="mt-4 rounded-md border px-4 py-3 text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Cloud equivalent ({cloud.provider}):</span>{' '}
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              {formatCost(results.cloudMonthlyCost, 'USD')}/mo
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Local ({model.name.split(' (')[0]}):</span>{' '}
            <span className="font-medium" style={{ color: 'var(--accent)' }}>
              {formatCost(results.monthlyCost)}/mo
            </span>
          </div>
        </div>
      </div>

      <p
        className="mt-3 mb-0 text-xs leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Local cost = {GPU_WATTAGE}W GPU draw x inference time x electricity rate.
        Cloud comparison uses {cloud.provider} output token pricing.
        Actual throughput varies with quantisation, context length, and batch size.
      </p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
      {children}
    </label>
  );
}

function ResultCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="rounded-md border px-3 py-3 text-center"
      style={{
        background: accent ? 'color-mix(in srgb, var(--accent) 8%, var(--bg))' : 'var(--bg)',
        borderColor: accent ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <div
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="mt-1 text-base font-semibold tabular-nums sm:text-lg"
          style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

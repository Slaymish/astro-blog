import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MODELS = [
  { name: 'Llama 3.1 8B (BF16)', vram: '~8 GB', tokPerSec: 55, quality: 'Everyday tasks' },
  { name: 'Qwen3 14B (Q4)', vram: '~10 GB', tokPerSec: 37, quality: 'Reasoning, multilingual' },
  { name: 'Gemma 3 12B (Q4)', vram: '~8 GB', tokPerSec: 45, quality: 'Coding, instruction following' },
  { name: 'Qwen3 32B (Q4)', vram: '~18 GB', tokPerSec: 15, quality: 'Needs offload' },
] as const;

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
  const [electricityRate, setElectricityRate] = useState(0.346);
  const [gpuWattage, setGpuWattage] = useState(150);
  const [tokensPerSecond, setTokensPerSecond] = useState<number>(MODELS[0].tokPerSec);


  const results = useMemo(() => {
    const inferenceTimeSec = tokensPerResponse / tokensPerSecond;
    const inferenceTimeHrs = inferenceTimeSec / 3600;
    const kwhPerResponse = (gpuWattage / 1000) * inferenceTimeHrs;
    const costPerResponse = kwhPerResponse * electricityRate;

    const dailyCost = costPerResponse * responsesPerDay;
    const monthlyCost = dailyCost * 30;

    return {
      inferenceTimeSec,
      costPerResponse,
      dailyCost,
      monthlyCost,
    };
  }, [tokensPerSecond, gpuWattage, tokensPerResponse, responsesPerDay, electricityRate]);

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
        Estimate the GPU electricity cost of local inference on a 5070 Ti.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Model selector */}
        <div className="sm:col-span-2">
          <Label>Model assumption</Label>
          <span className="select mt-1">
            <select
              value={modelIndex}
              onChange={(event) => {
                const index = Number(event.target.value);
                setModelIndex(index);
                setTokensPerSecond(MODELS[index].tokPerSec);
              }}
              className="input input--sm"
            >
              {MODELS.map((m, i) => (
                <option key={m.name} value={i}>
                  {m.name}{m.quality === 'Needs offload' ? ' (Needs offload)' : ''}
                </option>
              ))}
            </select>
          </span>
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
            className="range mt-1"
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
            className="range mt-1"
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
              Electricity rate assumption:{' '}
              <span style={{ color: 'var(--accent)' }}>NZ${electricityRate.toFixed(3)}/kWh</span>
            </Label>
          </div>
          <input
            type="range"
            min={0.01}
            max={0.60}
            step={0.001}
            value={electricityRate}
            onChange={(event) => setElectricityRate(Number(event.target.value))}
            className="range mt-1"
          />
          <div className="mt-1 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>NZ$0.01</span>
            <span>NZ$0.60</span>
          </div>
        </div>
        <div>
          <Label>GPU power assumption: {gpuWattage}W</Label>
          <input type="range" min={1} max={600} value={gpuWattage} onChange={(event) => setGpuWattage(Number(event.target.value))} className="range mt-1" />
        </div>
        <div>
          <Label>Output throughput assumption: {tokensPerSecond} tokens/s</Label>
          <input type="range" min={1} max={200} value={tokensPerSecond} onChange={(event) => setTokensPerSecond(Number(event.target.value))} className="range mt-1" />
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ResultCard label="Per response" value={formatCost(results.costPerResponse)} />
        <ResultCard label="Daily" value={formatCost(results.dailyCost)} />
        <ResultCard label="Monthly" value={formatCost(results.monthlyCost)} />
      </div>

      <div
        className="mt-4 rounded-md border px-4 py-3 text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      >
        Comparison needs matching currency and cost scope. No cloud price or savings comparison is shown.
      </div>

      <p
        className="mt-3 mb-0 text-xs leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Estimated GPU energy = ({gpuWattage}W / 1,000) × (output tokens / {tokensPerSecond} tokens per second / 3,600).
        Estimated cost = energy in kWh × electricity tariff in NZD per kWh.
        Starting values are illustrative assumptions, not measured benchmarks or current tariffs. Change them to your measurements.
        This excludes input processing, idle power, the rest of the computer, hardware and hosting costs.
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

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const GPU_DATA = [
  { name: 'NVIDIA A100 40GB', tdpWatts: 250, tokensPerSec: 2800 },
  { name: 'NVIDIA A100 80GB', tdpWatts: 300, tokensPerSec: 3200 },
  { name: 'NVIDIA H100 80GB', tdpWatts: 700, tokensPerSec: 12000 },
  { name: 'NVIDIA H200 141GB', tdpWatts: 700, tokensPerSec: 18000 },
  { name: 'NVIDIA B200 192GB', tdpWatts: 1000, tokensPerSec: 36000 },
] as const;

/** Map a 0-1 slider value to a log-scale token count */
function sliderToTokens(v: number): number {
  const minLog = Math.log10(1_000);
  const maxLog = Math.log10(100_000_000);
  return Math.round(10 ** (minLog + v * (maxLog - minLog)));
}

function tokensToSlider(tokens: number): number {
  const minLog = Math.log10(1_000);
  const maxLog = Math.log10(100_000_000);
  return (Math.log10(tokens) - minLog) / (maxLog - minLog);
}

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCost(n: number): string {
  if (n < 0.01) return '<$0.01';
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatKwh(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} MWh`;
  return `${n.toFixed(2)} kWh`;
}

export default function GpuCalculator() {
  const [gpuIndex, setGpuIndex] = useState(2); // default H100
  const [tokenSlider, setTokenSlider] = useState(tokensToSlider(1_000_000));
  const [electricityRate, setElectricityRate] = useState(0.12);

  const tokensPerDay = sliderToTokens(tokenSlider);
  const gpu = GPU_DATA[gpuIndex];

  const results = useMemo(() => {
    const gpuDailyCapacity = gpu.tokensPerSec * 86_400;
    const gpusNeeded = Math.max(tokensPerDay / gpuDailyCapacity, 0.001);
    const dailyKwh = gpusNeeded * (gpu.tdpWatts / 1000) * 24;
    const dailyCost = dailyKwh * electricityRate;
    return {
      gpusNeeded,
      dailyKwh,
      monthlyCost: dailyCost * 30,
      dailyCost,
    };
  }, [tokensPerDay, gpu, electricityRate]);

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
        className="mt-0 mb-5 text-lg font-semibold tracking-tight"
        style={{ color: 'var(--text)' }}
      >
        GPU Inference Cost Calculator
      </h3>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* GPU selector */}
        <div className="sm:col-span-2">
          <Label>GPU Model</Label>
          <select
            value={gpuIndex}
            onChange={(e) => setGpuIndex(Number(e.target.value))}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            style={{
              background: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {GPU_DATA.map((g, i) => (
              <option key={g.name} value={i}>
                {g.name} ({g.tdpWatts}W TDP, ~{formatTokens(g.tokensPerSec)} tok/s)
              </option>
            ))}
          </select>
        </div>

        {/* Tokens per day */}
        <div>
          <Label>
            Tokens per day:{' '}
            <span style={{ color: 'var(--accent)' }}>{formatTokens(tokensPerDay)}</span>
          </Label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={tokenSlider}
            onChange={(e) => setTokenSlider(Number(e.target.value))}
            className="accent-slider mt-1 w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
          <div
            className="mt-1 flex justify-between text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>1K</span>
            <span>100M</span>
          </div>
        </div>

        {/* Electricity rate */}
        <div>
          <Label>
            Electricity rate:{' '}
            <span style={{ color: 'var(--accent)' }}>${electricityRate.toFixed(2)}/kWh</span>
          </Label>
          <input
            type="range"
            min={0.01}
            max={0.50}
            step={0.01}
            value={electricityRate}
            onChange={(e) => setElectricityRate(Number(e.target.value))}
            className="accent-slider mt-1 w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
          <div
            className="mt-1 flex justify-between text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>$0.01</span>
            <span>$0.50</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <ResultCard label="GPUs needed" value={results.gpusNeeded < 1 ? results.gpusNeeded.toFixed(3) : results.gpusNeeded.toFixed(1)} />
        <ResultCard label="Daily energy" value={formatKwh(results.dailyKwh)} />
        <ResultCard label="Daily cost" value={formatCost(results.dailyCost)} />
        <ResultCard label="Monthly cost" value={formatCost(results.monthlyCost)} />
      </div>

      <p
        className="mt-4 mb-0 text-xs leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Estimates based on GPU TDP and approximate inference throughput. Actual costs vary with utilization, cooling overhead, and hardware pricing.
      </p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-sm font-medium"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </label>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      className="rounded-md border px-3 py-3 text-center"
      style={{
        background: 'var(--bg)',
        borderColor: 'var(--border)',
      }}
      layout
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
          className="mt-1 text-lg font-semibold tabular-nums"
          style={{ color: 'var(--accent)' }}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

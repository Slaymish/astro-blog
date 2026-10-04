import assert from 'node:assert/strict';
import test from 'node:test';
import { GPU_WATTAGE, MODELS, PRESETS, compute, formatCost, formatComparison } from '../src/client/gpuCalculator';

test('the default inputs retain the local electricity calculation', () => {
  const results = compute({
    modelIndex: 0,
    tokensPerResponse: 500,
    responsesPerDay: 50,
    electricityRate: PRESETS.NZ!.rate,
  });

  assert.equal(results.costPerResponse, ((500 / 55) / 3600) * 0.15 * 0.346);
  assert.equal(results.inferenceTimeSec, 500 / 55);
  assert.equal(results.dailyCost, results.costPerResponse * 50);
  assert.equal(results.monthlyCost, results.dailyCost * 30);
});

test('the GPU draw is the only wattage in the arithmetic', () => {
  const rate = 0.5;
  const results = compute({
    modelIndex: 0,
    tokensPerResponse: 3600 * MODELS[0].tokPerSec,
    responsesPerDay: 1,
    electricityRate: rate,
  });
  // One hour of inference is exactly GPU_WATTAGE/1000 kWh.
  assert.equal(results.costPerResponse, (GPU_WATTAGE / 1000) * rate);
});

test('a slower model costs more per response at the same token count', () => {
  const inputs = { tokensPerResponse: 500, responsesPerDay: 50, electricityRate: 0.346 };
  const fast = compute({ ...inputs, modelIndex: 0 });
  const slow = compute({ ...inputs, modelIndex: 3 });
  assert(slow.costPerResponse > fast.costPerResponse);
  assert.equal(slow.inferenceTimeSec, 500 / MODELS[3].tokPerSec);
});

test('an out-of-range model index falls back to the first model rather than throwing', () => {
  assert.deepEqual(
    compute({ modelIndex: 99, tokensPerResponse: 500, responsesPerDay: 1, electricityRate: 0.3 }),
    compute({ modelIndex: 0, tokensPerResponse: 500, responsesPerDay: 1, electricityRate: 0.3 }),
  );
});

test('a free response cannot produce an infinite multiplier', () => {
  const results = compute({
    modelIndex: 0,
    tokensPerResponse: 0,
    responsesPerDay: 10,
    electricityRate: 0.346,
  });
  assert.equal(results.costPerResponse, 0);
  assert.equal(results.multiplier, 0);
});

test('every model has cloud pricing to compare against', () => {
  for (const [index, model] of MODELS.entries()) {
    const results = compute({
      modelIndex: index,
      tokensPerResponse: 500,
      responsesPerDay: 1,
      electricityRate: 0.346,
    });
    assert(results.cloudCostPerResponse > 0, `${model.name} has no cloud cost`);
  }
});

test('formatCost keeps small numbers readable and abbreviates large ones', () => {
  assert.equal(formatCost(0.00001), '<NZ$0.0001');
  assert.equal(formatCost(0.005), 'NZ$0.0050');
  assert.equal(formatCost(1.5), 'NZ$1.50');
  assert.equal(formatCost(2500), 'NZ$2.5K');
  assert.equal(formatCost(1.5, 'USD'), 'US$1.50');
});


test('cloud and local costs use the same currency for every regional preset', () => {
  // 4,000 tokens * 500 responses * 30 days at US$0.60 per million = US$36.
  const expectedCloudMonthly = { NZD: 36 * 2.0002 / 1.1225, USD: 36, EUR: 36 / 1.1225 };
  for (const preset of Object.values(PRESETS)) {
    const result = compute({
      modelIndex: 1, tokensPerResponse: 4000, responsesPerDay: 500,
      electricityRate: preset.rate, currency: preset.currency,
    });
    assert(Math.abs(result.cloudMonthlyCost - expectedCloudMonthly[preset.currency]) < 1e-10);
    assert.equal(result.multiplier, result.cloudCostPerResponse / result.costPerResponse);
  }
});

test('a custom electricity rate retains its selected currency', () => {
  const inputs = { modelIndex: 1, tokensPerResponse: 4000, responsesPerDay: 500, electricityRate: 0.6 };
  const us = compute({ ...inputs, currency: 'USD' });
  const nz = compute({ ...inputs, currency: 'NZD' });
  assert.equal(us.monthlyCost, nz.monthlyCost);
  assert.equal(us.cloudMonthlyCost, 36);
  assert(nz.cloudMonthlyCost > us.cloudMonthlyCost);
  assert.equal(formatComparison(us.multiplier), '12.6% higher');
  assert.equal(formatComparison(nz.multiplier), '36.8% lower');
});

test('comparison labels preserve the direction of savings, parity and higher costs', () => {
  assert.equal(formatComparison(2), '50% lower');
  assert.equal(formatComparison(0.5), '100% higher');
  assert.equal(formatComparison(1), 'Same cost');
  assert.equal(formatComparison(1.001), '<1% lower');
  assert.equal(formatComparison(0.999), '<1% higher');
  assert.equal(formatComparison(10_000), '99.9% lower');
});

test('an unavailable comparison cannot claim savings', () => {
  for (const value of [0, -1, Infinity, NaN]) assert.equal(formatComparison(value), 'N/A');
});

test('all three currencies have unambiguous display labels', () => {
  assert.equal(formatCost(1.5, 'EUR'), '€1.50');
  assert.equal(formatCost(0.005, 'USD'), 'US$0.0050');
  assert.equal(formatCost(0.00001, 'EUR'), '<€0.0001');
});

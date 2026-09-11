import assert from 'node:assert/strict';
import test from 'node:test';
import { GPU_WATTAGE, MODELS, PRESETS, compute, formatCost } from '../src/client/gpuCalculator';

test('the default inputs produce the cost the old component displayed', () => {
  const results = compute({
    modelIndex: 0,
    tokensPerResponse: 500,
    responsesPerDay: 50,
    electricityRate: PRESETS.NZ!,
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
  assert.equal(formatCost(1.5, 'USD'), '$1.50');
});

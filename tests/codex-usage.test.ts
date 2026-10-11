import test from 'node:test';
import assert from 'node:assert/strict';
import { optimise, describeStrategy, ASSUMPTIONS } from '../src/client/codexUsage';

test('usage optimiser returns a paid combination with enough modelled coverage', () => {
  for (const hours of [0.25, 1, 3, 6, 9, 12]) {
    const result = optimise(hours);
    assert.ok(result.monthlyNzd > 0);
    assert.ok(result.includedHours + result.creditsNzd / ASSUMPTIONS.additionalHourNzd >= hours * ASSUMPTIONS.codingDays - 0.001);
    assert.ok(describeStrategy(result).length > 0);
  }
});
test('estimated minimum price never decreases as requested usage rises', () => {
  let previous = 0;
  for (let q = 1; q <= 48; q++) {
    const result = optimise(q / 4);
    assert.ok(result.monthlyNzd + 0.001 >= previous);
    previous = result.monthlyNzd;
  }
});
test('invalid hours are rejected', () => {
  assert.throws(() => optimise(0), RangeError);
  assert.throws(() => optimise(Number.NaN), RangeError);
});

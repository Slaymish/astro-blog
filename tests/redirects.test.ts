/**
 * Every site-relative redirect target must exist in the build. A rule pointing
 * at a page that is no longer generated sends visitors to a 404 through a 301,
 * which is worse than not redirecting at all.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const skip = existsSync(join(dist, 'index.html')) ? false : 'run pnpm run build first';

interface Rule {
  from: string;
  to: string;
  status: number;
  force: boolean;
}

function rules(): Rule[] {
  const toml = readFileSync(join(root, 'netlify.toml'), 'utf8');
  return toml
    .split('[[redirects]]')
    .slice(1)
    .map((block) => ({
      from: /from\s*=\s*"([^"]+)"/.exec(block)?.[1] ?? '',
      to: /to\s*=\s*"([^"]+)"/.exec(block)?.[1] ?? '',
      status: Number(/status\s*=\s*(\d+)/.exec(block)?.[1] ?? '0'),
      force: /force\s*=\s*true/.test(block),
    }));
}

test('every rule declares a from, a to, a status and force', () => {
  const parsed = rules();
  assert(parsed.length > 0, 'netlify.toml declares no redirects');
  for (const rule of parsed) {
    assert(rule.from, `a rule has no from: ${JSON.stringify(rule)}`);
    assert(rule.to, `${rule.from} has no to`);
    assert([301, 302, 410].includes(rule.status), `${rule.from} has status ${rule.status}`);
    assert(rule.force, `${rule.from} is not forced, so a generated file would win`);
  }
});

test('no rule redirects a path to itself', () => {
  for (const rule of rules()) {
    assert.notEqual(rule.from, rule.to, `${rule.from} redirects to itself`);
  }
});

test('every site-relative target exists in the build', { skip }, () => {
  for (const rule of rules()) {
    if (!rule.to.startsWith('/')) continue;
    const clean = rule.to.replace(/:splat$/, '');
    const candidates = [clean, `${clean}.html`, join(clean, 'index.html')];
    assert(
      candidates.some((candidate) => existsSync(join(dist, candidate))),
      `${rule.from} -> ${rule.to} is not in the build`,
    );
  }
});

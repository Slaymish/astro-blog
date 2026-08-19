import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// The site removed Astro's client-side router in 003cb99. Without a <ClientRouter />
// rendered somewhere, the astro:* lifecycle events never fire and transition:* directives
// never animate, so any such code is inert. These tests lock the two halves together:
// the router and its machinery must both be present or both be absent.

const SRC_DIR = fileURLToPath(new URL('../src', import.meta.url));
const SOURCE_EXTENSIONS = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx', '.mjs']);

const ROUTER_COMPONENT = /<\s*(?:ClientRouter|ViewTransitions)\b/;
const ROUTER_EVENT_LISTENER =
  /addEventListener\(\s*['"`]astro:(?:page-load|after-swap|before-swap|before-preparation|after-preparation)['"`]/;
const TRANSITION_DIRECTIVE = /\stransition:(?:name|animate|persist|persist-props)\b/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [full] : [];
  });
}

const files = sourceFiles(SRC_DIR).map((file) => ({
  path: path.relative(SRC_DIR, file),
  contents: readFileSync(file, 'utf8')
}));

function matching(pattern: RegExp): string[] {
  return files.filter((file) => pattern.test(file.contents)).map((file) => file.path);
}

const routerSites = matching(ROUTER_COMPONENT);

test('the source tree is non-empty, so an empty scan cannot pass vacuously', () => {
  assert.ok(files.length > 50, `expected to scan the src tree, found ${files.length} files`);
});

test('no listener is bound to an astro router event unless a router is rendered', () => {
  const listeners = matching(ROUTER_EVENT_LISTENER);
  if (routerSites.length > 0) return;
  assert.deepEqual(
    listeners,
    [],
    'astro:* lifecycle listeners are dead without a <ClientRouter />; remove them or add the router'
  );
});

test('no transition directive is declared unless a router is rendered', () => {
  const directives = matching(TRANSITION_DIRECTIVE);
  if (routerSites.length > 0) return;
  assert.deepEqual(
    directives,
    [],
    'transition:* directives never animate without a <ClientRouter />; remove them or add the router'
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalFromAstro, publicPathFromAstro, SITE_URL } from '../src/lib/site';

test('file-format prerender URLs match public routes and sitemap URLs', () => {
  for (const [input, expected] of [
    ['/index.html', '/'],
    ['/work.html', '/work'],
    ['/work/you-inc.html', '/work/you-inc'],
    ['/about.html', '/about'],
    ['/posts/index', '/posts/index'],
    ['/about/', '/about'],
    ['/cv?from=about#academic', '/cv'],
  ]) {
    assert.equal(publicPathFromAstro(new URL(input, SITE_URL)), expected);
    assert.equal(canonicalFromAstro(new URL(input, SITE_URL)), `${SITE_URL}${expected}`);
  }
});

test('canonical overrides and configured site retain precedence', () => {
  const request = new URL('https://preview.example/work.html');
  assert.equal(canonicalFromAstro(request, new URL(SITE_URL)), `${SITE_URL}/work`);
  assert.equal(canonicalFromAstro(request, undefined, '/writing?from=work#top'), `${SITE_URL}/writing`);
  assert.equal(canonicalFromAstro(request, undefined, 'https://example.com/article?from=work#top'), 'https://example.com/article');
});

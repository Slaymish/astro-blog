import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownToHtml } from '../src/lib/markdown';

test('markdownToHtml escapes raw script tags', () => {
  const html = markdownToHtml('Hello<script>alert("xss")</script>');

  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('&lt;script&gt;'), true);
});

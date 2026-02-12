import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownToHtml } from '../src/lib/markdown';

test('markdownToHtml strips raw script tags', () => {
  const html = markdownToHtml('Hello<script>alert("xss")</script>');

  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('alert("xss")'), true);
});

test('markdownToHtml removes unsafe javascript links', () => {
  const html = markdownToHtml('[click me](javascript:alert(1))');

  assert.equal(html.includes('javascript:'), false);
  assert.equal(html.includes('href='), false);
});

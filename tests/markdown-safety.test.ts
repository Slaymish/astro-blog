import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownToHtml, markdownToPlainText, splitAtComponent } from '../src/content/markdown';

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

test('markdownToHtml drops a raw block element but keeps its text', () => {
  const html = markdownToHtml('Before\n\n<div onclick="steal()">inside</div>\n\nAfter');

  assert.equal(html.includes('<div'), false);
  assert.equal(html.includes('onclick'), false);
  assert.match(html, /Before/);
  assert.match(html, /After/);
});

test('markdownToHtml keeps safe protocols and site-relative links', () => {
  for (const href of ['https://example.com', 'http://example.com', 'mailto:a@b.co', 'tel:+6412345', '/work', '#top']) {
    const html = markdownToHtml(`[x](${href})`);
    assert.match(html, /href=/, `${href} was dropped`);
  }
});

test('markdownToHtml turns a component paragraph into a marker comment', () => {
  const html = markdownToHtml('Before\n\n{{gpu-calculator}}\n\nAfter');

  assert.match(html, /<!--component:gpu-calculator-->/);
  // The literal placeholder must not survive as visible text.
  assert.equal(html.includes('{{gpu-calculator}}'), false);
});

test('a component marker is only recognised as a whole paragraph', () => {
  assert.equal(markdownToHtml('text {{gpu-calculator}} inline').includes('<!--component:'), false);
  assert.match(markdownToHtml('text {{gpu-calculator}} inline'), /\{\{gpu-calculator\}\}/);
});

test('splitAtComponent returns the halves either side of the marker', () => {
  const html = markdownToHtml('Before\n\n{{gpu-calculator}}\n\nAfter');
  const halves = splitAtComponent(html, 'gpu-calculator');

  assert(halves !== null);
  assert.match(halves[0], /Before/);
  assert.match(halves[1], /After/);
  assert.equal(halves[0].includes('<!--component:'), false);
  assert.equal(halves[1].includes('<!--component:'), false);
});

test('splitAtComponent returns null when the marker is absent', () => {
  assert.equal(splitAtComponent(markdownToHtml('Just prose.'), 'gpu-calculator'), null);
  assert.equal(splitAtComponent(markdownToHtml('{{other-thing}}'), 'gpu-calculator'), null);
});

test('markdownToPlainText counts words without markup or code fences', () => {
  const text = markdownToPlainText('# Title\n\nSome [linked](https://x.co) prose.\n\n```\nnot prose\n```\n');

  assert.equal(text, 'Title Some linked prose.');
});

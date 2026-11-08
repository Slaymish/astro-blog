import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownToHtml, markdownToPlainText, splitAtComponents } from '../src/content/markdown';

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

test('splitAtComponents returns the pieces either side of a marker', () => {
  const html = markdownToHtml('Before\n\n{{gpu-calculator}}\n\nAfter');
  const [first, middle, last] = splitAtComponents(html, ['gpu-calculator']);

  assert(first?.type === 'html' && middle?.type === 'component' && last?.type === 'html');
  assert.match(first.html, /Before/);
  assert.equal(middle.name, 'gpu-calculator');
  assert.match(last.html, /After/);
  assert.equal(first.html.includes('<!--component:'), false);
  assert.equal(last.html.includes('<!--component:'), false);
});

test('splitAtComponents keeps every embed in reading order', () => {
  const html = markdownToHtml('A\n\n{{stream-reveal}}\n\nB\n\n{{gpu-calculator}}\n\nC');
  const segments = splitAtComponents(html, ['gpu-calculator', 'stream-reveal']);

  assert.deepEqual(
    segments.flatMap((segment) => segment.type === 'component' ? [segment.name] : []),
    ['stream-reveal', 'gpu-calculator'],
  );
  assert.equal(segments.filter((segment) => segment.type === 'html').length, 3);
});

test('splitAtComponents leaves a marker for a component the route cannot render', () => {
  const segments = splitAtComponents(markdownToHtml('{{other-thing}}'), ['gpu-calculator']);

  assert.equal(segments.length, 1);
  assert(segments[0]?.type === 'html');
  assert.match(segments[0].html, /<!--component:other-thing-->/);
});

test('splitAtComponents returns one HTML segment when there is no marker', () => {
  const segments = splitAtComponents(markdownToHtml('Just prose.'), ['gpu-calculator']);

  assert.equal(segments.length, 1);
  assert(segments[0]?.type === 'html');
  assert.match(segments[0].html, /Just prose\./);
});

test('markdownToPlainText counts words without markup or code fences', () => {
  const text = markdownToPlainText('# Title\n\nSome [linked](https://x.co) prose.\n\n```\nnot prose\n```\n');

  assert.equal(text, 'Title Some linked prose.');
});

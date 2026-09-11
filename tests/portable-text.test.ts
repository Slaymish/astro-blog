import assert from 'node:assert/strict';
import test from 'node:test';
import { portableTextToHtml, portableTextToPlainText } from '../src/content/portableText';
import type { PortableTextBody } from '../src/content/types';

const block = (style: string, text: string, key: string, markDefs: unknown[] = [], marks: string[] = []) => ({
  _type: 'block',
  _key: key,
  style,
  markDefs,
  children: [{ _type: 'span', _key: `${key}s`, marks, text }],
});

const body = (...blocks: unknown[]) => blocks as PortableTextBody;

test('headings get ids slugged from their text', () => {
  const html = portableTextToHtml(body(block('h2', 'A ledger before a dashboard', 'a')));
  assert.match(html, /<h2 id="a-ledger-before-a-dashboard">/);
});

test('a repeated heading gets a numbered id rather than a duplicate', () => {
  const html = portableTextToHtml(
    body(block('h2', 'Outcome', 'a'), block('h2', 'Outcome', 'b'), block('h2', 'Outcome', 'c')),
  );
  assert.match(html, /id="outcome"/);
  assert.match(html, /id="outcome-2"/);
  assert.match(html, /id="outcome-3"/);
});

test('h3 and h4 get ids too, and punctuation does not leak into them', () => {
  const html = portableTextToHtml(body(block('h3', 'Why? Because “it depends”.', 'a')));
  assert.match(html, /<h3 id="why-because-it-depends">/);
});

test('a javascript: link is dropped rather than rendered', () => {
  const html = portableTextToHtml(
    body(block('normal', 'click', 'a', [{ _type: 'link', _key: 'l', href: 'javascript:alert(1)' }], ['l'])),
  );
  assert.doesNotMatch(html, /javascript:/);
  assert.doesNotMatch(html, /<a /);
  assert.match(html, /<span>click<\/span>/);
});

test('an external link keeps its href and gets rel and target', () => {
  const html = portableTextToHtml(
    body(block('normal', 'there', 'a', [{ _type: 'link', _key: 'l', href: 'https://example.com' }], ['l'])),
  );
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /target="_blank"/);
});

test('a site-relative link is kept but not opened in a new tab', () => {
  const html = portableTextToHtml(
    body(block('normal', 'work', 'a', [{ _type: 'link', _key: 'l', href: '/work' }], ['l'])),
  );
  assert.match(html, /href="\/work"/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test('an in-body image renders a srcset, intrinsic dimensions and its alt text', () => {
  const html = portableTextToHtml(
    body({
      _type: 'image',
      alt: 'A status view',
      asset: {
        _id: 'image-abc-2446x1394-png',
        url: 'https://cdn.sanity.io/images/qnuj1c4o/production/abc-2446x1394.png',
        width: 2446,
        height: 1394,
      },
    }),
  );
  assert.match(html, /srcset="[^"]*480w[^"]*1440w"/);
  assert.match(html, /alt="A status view"/);
  assert.match(html, /width="1440"/);
  assert.match(html, /height="821"/);
  assert.match(html, /loading="lazy"/);
});

test('an image with no asset renders nothing rather than a broken tag', () => {
  assert.equal(portableTextToHtml(body({ _type: 'image', alt: 'x' })), '');
});

test('an empty or absent body renders an empty string', () => {
  assert.equal(portableTextToHtml(undefined), '');
  assert.equal(portableTextToHtml(null), '');
  assert.equal(portableTextToHtml([]), '');
});

test('plain text joins the blocks and ignores non-text types', () => {
  const text = portableTextToPlainText(
    body(block('h2', 'Heading', 'a'), block('normal', 'Body   copy', 'b'), { _type: 'image', alt: 'x' }),
  );
  assert.equal(text, 'Heading Body copy');
});

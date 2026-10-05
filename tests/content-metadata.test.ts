import assert from 'node:assert/strict';
import test from 'node:test';
import { renderedContentMetadata } from '../src/content/metadata';

test('rendered metadata includes code and table content and decodes HTML entities', () => {
  const result = renderedContentMetadata('<p>One &amp; two.</p><pre><code>const x = 1;</code></pre><table><tr><td>Measured</td><td>2</td></tr></table>');
  assert.equal(result.text, 'One & two. const x = 1; Measured 2');
});

test('citations are derived from readable body links, deduplicated and restricted to web URLs', () => {
  const result = renderedContentMetadata('<p><a href="https://example.com">A <strong>source</strong></a><a href="https://example.com">A source</a><a href="/work/p">Project</a><a href="javascript:alert(1)">bad</a><a href="#section">Section</a></p>');
  assert.deepEqual(result.citations, [{ name: 'A source', url: 'https://example.com' }, { name: 'Project', url: '/work/p' }]);
});

test('scripts, styles, buttons and comments cannot leak into article metadata', () => {
  const result = renderedContentMetadata('<p>Visible</p><!--hidden--><script>secret()</script><style>body{}</style><button><a href="https://example.com">Control</a></button>');
  assert.equal(result.text, 'Visible');
  assert.deepEqual(result.citations, []);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeHtmlAttribute, escapeXml } from '../src/lib/escape';

test('escapeHtmlAttribute encodes dangerous characters', () => {
  const input = `"><script>alert('x')</script>&`;
  const escaped = escapeHtmlAttribute(input);

  assert.equal(
    escaped,
    '&quot;&gt;&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;&amp;'
  );
});

test('escapeXml encodes XML entities', () => {
  const input = `Rock & Roll <test> "quote" 'single'`;
  const escaped = escapeXml(input);

  assert.equal(
    escaped,
    'Rock &amp; Roll &lt;test&gt; &quot;quote&quot; &apos;single&apos;'
  );
});

// Run with: npm test (node --test, Node >= 22.18 strips TS types natively)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc } from '../src/lib/escapeHtml.ts';
import { extractTelegramText } from '../src/lib/telegramText.ts';

const hostileEmbed =
  '<div class="tgme_widget_message_text js-message_text" dir="auto">' +
  'Breaking &lt;img src=x onerror=alert(1)&gt; news</div>';

test('telegram text decodes entities to plain text', () => {
  assert.equal(extractTelegramText(hostileEmbed), 'Breaking <img src=x onerror=alert(1)> news');
});

test('esc neutralises an <img onerror> payload from a Telegram post', () => {
  const html = `<div>${esc(extractTelegramText(hostileEmbed))}</div>`;
  assert.ok(!html.includes('<img'), html);
  assert.equal(html, '<div>Breaking &lt;img src=x onerror=alert(1)&gt; news</div>');
});

test('esc escapes quotes so attribute values cannot break out', () => {
  assert.equal(esc(`"'><`), '&quot;&#39;&gt;&lt;');
  assert.equal(esc(undefined), '');
  assert.equal(esc(42), '42');
});

test('&amp;lt; is not double-decoded into a tag', () => {
  const embed = '<div class="tgme_widget_message_text js-message_text">&amp;lt;b&amp;gt;</div>';
  assert.equal(extractTelegramText(embed), '&lt;b&gt;');
});

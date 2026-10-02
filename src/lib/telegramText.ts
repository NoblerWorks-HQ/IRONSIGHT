// Pull the plain-text body out of a t.me embed page. The result is PLAIN TEXT
// (entities decoded, so it may contain a literal "<"); every HTML sink must
// escape it with esc() from ./escapeHtml.
export function extractTelegramText(html: string): string | null {
  const textMatch = html.match(/<div class="tgme_widget_message_text js-message_text"[^>]*>(.*?)<\/div>/s);
  if (!textMatch) return null;
  const text = textMatch[1]
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#036;/g, '$')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

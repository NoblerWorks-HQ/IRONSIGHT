/** `color` at the given opacity (two hex digits, as in `#rrggbbAA`).
 *  Works for hex colours (appends the alpha, as before) and for `var(--x)` theme
 *  colours (via color-mix), where plain concatenation gave an invalid value. */
export function withAlpha(color: string, alphaHex: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return `${color}${alphaHex}`;
  const pct = Math.round((parseInt(alphaHex, 16) / 255) * 1000) / 10;
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

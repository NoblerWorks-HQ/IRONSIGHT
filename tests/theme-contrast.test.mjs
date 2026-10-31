// Every accent preset in both modes: WCAG AA for text on every surface, the -rgb
// twins in step with their hex, and the accent kept visibly apart from the
// semantic colours (threat red, ok green, warning amber, high orange).
// Colours come straight from src/app/globals.css, so this pins what ships.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
const themeTs = readFileSync(new URL('../src/lib/theme.ts', import.meta.url), 'utf8');

function block(selector) {
  const esc = selector.replace(/[[\]().*+?^$|\\]/g, '\\$&');
  const m = css.match(new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`));
  if (!m) return null;
  return Object.fromEntries([...m[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
}

const presets = [...themeTs.matchAll(/\{ id: '(\w+)', label: '(\w+)', swatch: '(#[0-9a-f]{6})' \}/g)]
  .map(([, id, label, swatch]) => ({ id, label, swatch }));

function vars(id, mode) {
  const v = { ...block(':root') };
  if (mode === 'light') Object.assign(v, block('[data-mode="light"]'));
  if (id !== 'mono') {
    Object.assign(v, block(`[data-theme="${id}"]`));
    if (mode === 'light') Object.assign(v, block(`[data-mode="light"][data-theme="${id}"]`));
  }
  const resolve = x => { const r = /^var\((--[\w-]+)\)$/.exec(x); return r ? resolve(v[r[1]]) : x; };
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x)]));
}

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function lum(h) {
  const [r, g, b] = rgb(h).map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function lab(h) {
  const [r, g, b] = rgb(h).map(c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const X = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), Y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), Z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}
const deltaE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

const SURFACES = ['--bg-primary', '--bg-secondary', '--bg-panel', '--bg-panel-header'];
const TEXT = ['--text-primary', '--text-secondary', '--accent', '--red', '--green', '--amber', '--orange', '--blue', '--cyan', '--purple'];
const SEMANTIC = ['--red', '--green', '--amber', '--orange'];

test('theme.ts lists the seven presets, mono first (the :root default)', () => {
  assert.deepEqual(presets.map(p => p.id), ['mono', 'cyan', 'amber', 'nvg', 'red', 'violet', 'ice']);
});

for (const { id, swatch } of presets) {
  for (const mode of ['dark', 'light']) {
    test(`${id} / ${mode}`, () => {
      const v = vars(id, mode);
      if (mode === 'dark') assert.equal(v['--accent'], swatch, 'swatch in theme.ts matches the dark accent');
      for (const [hex, trip] of [['--accent', '--accent-rgb'], ['--border-color', '--border-rgb'], ['--bg-primary', '--bg-primary-rgb']]) {
        assert.equal(v[trip], rgb(v[hex]).join(', '), `${trip} matches ${hex}`);
      }
      for (const fg of TEXT) for (const bg of SURFACES) {
        const c = contrast(v[fg], v[bg]);
        assert.ok(c >= 4.5, `${fg} ${v[fg]} on ${bg} ${v[bg]} = ${c.toFixed(2)}:1, below AA 4.5`);
      }
      const on = contrast(v['--on-accent'], v['--accent']);
      assert.ok(on >= 4.5, `--on-accent on --accent = ${on.toFixed(2)}:1`);
      for (const s of SEMANTIC) {
        const d = deltaE(v['--accent'], v[s]);
        assert.ok(d >= 20, `accent ${v['--accent']} too close to ${s} ${v[s]} (deltaE ${d.toFixed(1)})`);
      }
    });
  }
}

test('default is neutral: black in dark mode, white in light mode, no blue tint', () => {
  const d = vars('mono', 'dark'), l = vars('mono', 'light');
  assert.equal(d['--bg-primary'], '#000000');
  assert.equal(l['--bg-primary'], '#ffffff');
  assert.equal(l['--bg-panel'], '#ffffff');
  const grey = h => { const [r, g, b] = rgb(h); return r === g && g === b; };
  for (const v of [d, l]) for (const k of [...SURFACES, '--border-color', '--text-primary', '--text-secondary', '--accent', '--map-ocean', '--map-land', '--map-coast', '--map-border'])
    assert.ok(grey(v[k]), `${k} = ${v[k]} is not neutral grey`);
});

test('borders and map stay neutral grey in every accent preset', () => {
  for (const { id } of presets) for (const mode of ['dark', 'light']) {
    const v = vars(id, mode);
    for (const k of ['--border-color', '--map-border']) {
      const [r, g, b] = rgb(v[k]);
      assert.ok(r === g && g === b, `${id}/${mode} ${k} = ${v[k]}`);
    }
  }
});

test('light mode: --red banner text stays AA on the flashing alert banner', () => {
  const v = vars('mono', 'light');
  const m = /rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/.exec(v['--alert-flash-hi']);
  const [r, g, b, a] = m.slice(1).map(Number);
  const bg = rgb(v['--bg-panel']).map((c, i) => Math.round(c * (1 - a) + [r, g, b][i] * a));
  const hex = '#' + bg.map(c => c.toString(16).padStart(2, '0')).join('');
  const c = contrast(v['--red'], hex);
  assert.ok(c >= 4.5, `--red on banner ${hex} = ${c.toFixed(2)}:1`);
});

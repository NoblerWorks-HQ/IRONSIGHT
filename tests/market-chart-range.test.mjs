import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const routes = [
  ['markets', '../src/app/api/markets/route.ts', '${encodeURIComponent(sym)}'],
  ['oil', '../src/app/api/oil/route.ts', '${c.symbol}'],
];

test('daily market changes request a one-day chart window', async () => {
  for (const [name, path, symbolExpression] of routes) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    const template = source.match(/const url = `([^`]+)`;/)?.[1];
    assert.ok(template, `${name} route should define its Yahoo chart URL`);

    const url = template.replace(symbolExpression, 'BA');
    assert.equal(new URL(url).searchParams.get('range'), '1d', `${name} route`);
  }
});

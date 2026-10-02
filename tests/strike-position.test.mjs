import assert from 'node:assert/strict';
import test from 'node:test';

import { addStrikeMarker, geocodeStrike } from '../src/components/map/strike-position.ts';

test('a strike keeps the configured place coordinate across repeated renders', () => {
  const targets = [['kyiv', 'Kyiv']];
  const locations = { kyiv: [50.45, 30.52] };
  const originalRandom = Math.random;
  try {
    for (const random of [() => 0, () => 0.999999, () => { throw Error('randomness used'); }]) {
      Math.random = random;
      assert.deepEqual(
        geocodeStrike('Missile strike reported in Kyiv', '', targets, locations),
        { coords: [50.45, 30.52], place: 'Kyiv' },
      );
    }
  } finally {
    Math.random = originalRandom;
  }
});

test('unrelated city mentions do not create incident markers', () => {
  assert.equal(geocodeStrike('Kyiv city guide', '', [['kyiv', 'Kyiv']], { kyiv: [50.45, 30.52] }), null);
});

test('Leaflet receives the unmodified coordinate on every render', () => {
  const geo = geocodeStrike('Missile strike reported in Kyiv', '', [['kyiv', 'Kyiv']], { kyiv: [50.45, 30.52] });
  assert.ok(geo);
  const positions = [];
  const tooltips = [];
  const leaflet = {
    marker(coords) {
      positions.push([...coords]);
      return {
        addTo() { return this; },
        bindTooltip(label) { tooltips.push(label); return this; },
        bindPopup() { return this; },
      };
    },
  };
  const originalRandom = Math.random;
  try {
    for (const random of [() => 0, () => 0.999999, () => { throw Error('randomness used'); }]) {
      Math.random = random;
      addStrikeMarker(leaflet, {}, geo, {}, '<p>test</p>');
    }
  } finally {
    Math.random = originalRandom;
  }
  assert.deepEqual(positions, [[50.45, 30.52], [50.45, 30.52], [50.45, 30.52]]);
  assert.deepEqual(tooltips, Array(3).fill('Approximate place reference: Kyiv'));
});

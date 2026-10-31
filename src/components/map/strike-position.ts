import type * as Leaflet from 'leaflet';

/** Resolve a reported strike to a configured place reference, not an incident location. */
export function geocodeStrike(
  description: string,
  location: string,
  targets: [string, string][],
  strikeLocations: Record<string, [number, number]>,
): { coords: [number, number]; place: string } | null {
  const text = `${description} ${location}`.toLowerCase();

  // Require a strike-indicating word to avoid pins for unrelated place mentions.
  const strikeWords = ['strike', 'struck', 'hit', 'attack', 'bomb', 'missile', 'rocket',
    'drone', 'target', 'destroy', 'intercept', 'fire', 'launch', 'blast', 'explosion',
    'damage', 'killed', 'wounded', 'casualties', 'impact'];
  if (!strikeWords.some(w => text.includes(w))) return null;

  for (const [key, place] of targets) {
    if (text.includes(key) && strikeLocations[key]) {
      return { coords: strikeLocations[key], place };
    }
  }

  return null;
}

/** Put a strike marker at the configured place, without altering its coordinates. */
export function addStrikeMarker(
  leaflet: Pick<typeof import('leaflet'), 'marker'>,
  layer: Leaflet.LayerGroup,
  geo: { coords: [number, number]; place: string },
  icon: Leaflet.DivIcon,
  popupHtml: string,
): Leaflet.Marker {
  const marker = leaflet.marker(geo.coords, { icon }).addTo(layer);
  marker.bindTooltip(`Approximate place reference: ${geo.place}`);
  marker.bindPopup(popupHtml);
  return marker;
}

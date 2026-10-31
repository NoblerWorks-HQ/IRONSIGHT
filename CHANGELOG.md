# Changelog

Notable user-visible changes. Newest first.

## 2026-10-31

- **Map: no more basemap tiles.** CARTO's free dark tiles now need an API key and stamp "API KEY REQUIRED" on every tile, so the tile layer is gone. Land, coastlines and country borders are drawn from bundled Natural Earth 1:50m data (`world-atlas` + `topojson-client`), lazy-loaded with the map; the runtime fetch of Natural Earth border lines from GitHub is gone too. The map makes no third-party requests, is credited "Natural Earth", and is capped at zoom 8 (where 1:50m coastlines still hold up).
- **Colour themes.** Seven accent presets (Mono default, Cyan, Amber, NVG, Red, Violet, Ice) and a light / dark mode, switched from the header beside THEATER and remembered in the browser. The accent is chrome only; threat red, ok green and warning amber keep their meaning in every theme. Dark mode is pure black and light mode pure white, with neutral grey panels, borders and map in every preset (no navy tint); with nothing saved the accent is Mono (white on black). Cyan, the old look's accent, is one click away.
- **App icon.** The landing site's red crosshair mark is now the app's favicon (SVG, ICO and Apple touch icon).

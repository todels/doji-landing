# Doji landing

The Doji landing page hero, built from the Figma design (Doji-Internal, frame "Desktop - 2", node 231:19430).
Plain HTML, CSS and JavaScript, no build step.

The hero background is the live Doji Portal black hole, not an image. It runs the exact shader from
[doji-portal](https://github.com/todels/doji-portal) with the settings read out of the PNG the design used
(`doji-portal-4180x4020-20261114-184559.png`, the tool's "Side" preset), and is framed so the hole sits under the
dashboard just as the image did in Figma. The pointer is the tool's cursor lens: a small mass that bends the streams
into ragged, scattered arcs around it. The two edge glows above the dashboard are drawn by the shader too (overlay
blend done in GLSL), since CSS blend modes over a WebGL canvas don't work in every browser. The page is one screen like the Figma frame: no scrolling, the dashboard runs off the bottom.

## Run it

```
python3 -m http.server 5232
```

then open http://localhost:5232.

## Files

- `index.html`: nav, hero, the app preview
- `css/style.css`: page styles; `css/preview.css`: the app preview (dashboard mock)
- `js/portal-core.js`: copied from doji-portal (commit 5633c78, the scattered cursor lens), plus one addition:
  two additions: an optional Flow cursor (`uMFlow`, `uMAlong`, `streamDir`, `cursorFlow`; off unless `mflow: 1`)
  and the edge glows (`uGlow`, `blurEllipse`, `overlayWhite`). Keep them if you copy the file again.
- `js/hero.js`: the portal's settings and the camera maths that line it up with the dashboard
- `assets/`: Figma exports; `assets/portal-fallback.jpg` is shown only without WebGL 2

## Tuning the portal

The look lives in the `S` object at the top of `js/hero.js` (same names as the editor's "Copy settings").
`CURSOR_MASS` is the cursor's mass in the tool's units (a fraction of the window height, so 0.02 here looks like
Mass 0.02 in the tool), and `mscat` / `mlag` in `S` are the tool's Scatter and Lag. The warp works across the
whole portal: it fades linearly from full at the dashboard's top edge to nothing at the top of the page, and
`TEXT_PAD` turns it off near the nav, headline, text and buttons. The glows' sizes are `GLOW_WIDE` / `GLOW_CORE`. The camera (zoom, cx, cy) is computed from the layout, so
leave those alone: the portal follows the dashboard's position and scales with it below 1440px.

The canvas only draws while it is on screen and the tab is visible, and with reduced motion it runs slower.

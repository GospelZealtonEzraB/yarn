# Loopwise

A knitting teacher that builds each project with you one step at a time.

- `prototype/index.html` is the clickable product prototype and plan (open it in a browser).
- `web/` is the app: React, TypeScript, Vite, installable PWA.

## Run

```bash
cd web && npm install && npm run dev
```

```bash
cd web && npm test
```

## How pictures are made

Nothing is a stored image. `web/src/engine` holds a stitch vocabulary, a recipe
parser (`*K2, P2; rep from *`), a fabric model seen from the right side, and a
yarn-path renderer that draws each loop with its real over and under crossings.
Pattern templates in `web/src/patterns` turn gauge and measurements into steps.
The same data produces the instructions and the drawings, and the tests work
every generated pattern stitch by stitch.

The yarn-path view draws knit and purl. Shaping stitches render in the chart
view until their loop geometry is added and checked by an experienced knitter.

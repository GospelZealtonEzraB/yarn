# Loopwise scope

Loopwise teaches knitting from the first slip knot to finished garments. Each
project is built step by step, with pictures drawn from the same stitch data
that produces the instructions.

## Version 1: built and in the repo

| Area | What works |
|---|---|
| Learn | Yarn setup (weight, gauge, head size). Six-stage path. 16 written lessons covering stages 1 to 3, each a one-step-at-a-time follow-along led by a picture: a movement diagram synced to the step, or a drawn picture of the result. Each has a success check, a drill to do with yarn, and troubleshooting. |
| Make | Garter scarf, ribbed scarf, fingerless mitts (knitted flat and seamed) and ribbed beanie. Each project opens with the finished piece, an illustrated kit list and the lessons it needs. Each row shows stitch tiles, a plain sentence, a close-up of the fabric and the stitch count, and each step links to its how-to. All resize to any gauge from 10 to 34 stitches per 10 cm. |
| Practice | Four games: name that swatch, find the wrong stitch, chart reader (including wrong-side rows), and flashcards for 18 pattern abbreviations. |
| Lab | Type any row of shorthand and see the yarn path and chart. Colour by row, stitch or depth, hide layers, zoom to one stitch, trace the yarn. |
| Progress | Saved on the device. No account, no server. |
| Install | Installable, works offline once hosted. |

## The builder picture

Every project is shown as the whole finished item, drawn to scale from its
stitch counts and section lengths. Knitted sections are filled and textured,
the section in progress is brighter, sections still to come are a dashed
outline, and a needle line marks where the knitter is. A row of step chips
underneath is the map of the whole build.

Tube-shaped items (the beanie, the seamed mitts) also have a 3D view that can
be turned by dragging. It is spun from the same stitch counts, one mesh column
per stitch, so ribbing shows as real columns.

### 3D: what exists and what a fuller version takes

| Level | What it is | Needs | Status |
|---|---|---|---|
| 1. Solid of revolution | Hat or mitt as a turned shape with progress colours | three.js, already in the app | Built |
| 2. Shape as worn | The hat laid over a head at its knitted length, with progress | A head form. A plain built-in head is used until a detailed model is added at `web/public/models/head.glb` | Hat built. Mitts on a hand not built |
| 3. Stitch-level surface | Every loop as raised yarn | A normal or displacement texture generated from the stitch chart | Not built |
| 4. Non-tube garments | Gloves, socks, sweaters | A mesh assembled from several tubes with joins (thumb, heel, sleeves) | Not built |
| 5. Hands and needles in 3D | Animated technique views | Rigged 3D hand models and motion data from a real knitter | Not built, needs outside assets |

Stack for 3D: three.js with WebGL, which every current phone and desktop
browser supports. The app falls back to the flat picture where WebGL is
missing. No server is involved. The cost is download size: the app grew from
about 75 kB to about 220 kB compressed.

## Version 1 gaps, known and deliberate

- **Movement diagrams exist for knit, purl and bind-off**, showing needles and
  yarn without hands. Needle positions and yarn path were checked against the
  text and step photos of the Nimble Needles tutorials. No knitter has reviewed
  them.
- **Long-tail cast-on has written steps only.** The movement depends on hand
  position, which a needle-and-yarn diagram cannot show without misleading. It
  needs illustrated hands or video.
- **Lesson and pattern text has not been test-knitted.** The arithmetic is
  tested by the engine. The wording needs a knitter's read-through.
- **Yarn-path view draws knit, purl, k2tog and ssk.** Yarn over and M1
  increases appear in the chart only.
- **Photo coach is a placeholder screen.**
- **Row gauge is estimated** from stitch gauge. Steps say to trust the tape measure.
- **The Worn view uses a plain egg-shaped head** with no face or ears, so the hat looks like it covers most of the head. A detailed head model would fix the look. The mitts have no worn view yet.
- **Scarves have no 3D view.** They are flat, so the to-scale flat picture is the honest one.

## Version 2: next

1. Hosting: the GitHub Pages workflow is in place. Pages must be switched on in the repository settings (Settings, Pages, Source: GitHub Actions).
2. Loop geometry for yo, M1L and M1R in the yarn-path view (k2tog and ssk are done).
4. Movement diagrams for k2tog and ssk, a hands-on visual for the cast-on, and a knitter's review of all diagrams.
5. Mitts in the round with a thumb gusset, and mittens.
6. A dropped-stitch drawing, so the rescue lesson and a game can show the ladder.
7. Measured row gauge as an optional setting.

## Version 3: photo coach

Needs a small server and an Anthropic API key.

1. Serverless function that accepts a photo plus the current project step.
2. Check my work: returns marked problems and one fix each, as structured data.
3. Knit from a photo: returns item, stitch, construction and colour count, which select a template and its options. Stitch counts always come from the template, never from the model.
4. Paste or photograph a written pattern and have it converted to stitch data, validated by the engine before it is shown.

## Version 4: advanced

Stages 4 to 6: mittens, gloves, cables, lace, socks, a top-down sweater.
Colourwork charts. Gift log. Optional accounts and sync between devices.

## Decisions needed from the owner

| Decision | Why it matters |
|---|---|
| Where to host, and whether the site may be public | Needed before the app can be installed on a phone |
| Who reviews the knitting content | Protects learners from wrong instructions |
| Illustrator, video, or the technique rig for hand positions | The largest remaining gap for a true beginner |
| API key and monthly budget for the photo coach | Each photo analysed costs a small amount |
| English only, or continental too | Doubles the technique content |

## Where AI is and is not used

Used: reading photos, reading written patterns, answering questions from lesson content.
Not used: drawings, stitch counts, sizing, instructions, games. Those are computed and tested.

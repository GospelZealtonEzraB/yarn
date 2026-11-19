# Loopwise scope

Loopwise teaches knitting from the first slip knot to finished garments. Each
project is built step by step, with pictures drawn from the same stitch data
that produces the instructions.

## Version 1: built and in the repo

| Area | What works |
|---|---|
| Learn | Yarn setup (weight, gauge, head size). Six-stage path. 16 written lessons covering stages 1 to 3, each a one-step-at-a-time follow-along led by a picture: a movement diagram synced to the step, or a drawn picture of the result. Each has a success check, a drill to do with yarn, and troubleshooting. |
| Make | Garter scarf, textured scarf, fingerless mitts (knitted flat and seamed) and ribbed beanie. The textured scarf, the beanie body and the mitt hand can each be knitted in a choice of stitch patterns from a ten-pattern library. Each project opens with the finished piece, an illustrated kit list and the lessons it needs. Each row shows stitch tiles, a plain sentence, a close-up of the fabric and the stitch count, and each step links to its how-to. All resize to any gauge from 10 to 34 stitches per 10 cm. |
| Practice | Four games: name that swatch, find the wrong stitch, chart reader (including wrong-side rows), and flashcards for 18 pattern abbreviations. |
| Lab | Type any row of shorthand and see the yarn path and chart. Colour by row, stitch or depth, hide layers, zoom to one stitch, trace the yarn. |
| Progress | Saved on the device. No account, no server. |
| Install | Installable, works offline once hosted. |

## Stitch-pattern library

Ten knit-and-purl patterns: stockinette, garter, 1×1 rib, 2×2 rib, seed, moss,
box, basketweave, broken rib and garter ridges. Each is defined once as a
right-side chart. Flat and in-the-round instructions are derived from the
chart, and the tests work every pattern from those instructions and check the
result against the chart. Adding a pattern is one chart entry.

Not in the library yet: anything needing more than knit and purl (cables,
lace, slipped stitches) and colourwork.

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
- **The design coach is built but not switched on.** It needs the relay in `server/` deployed once, with the OpenAI key stored there.
- **Generated designs are unknitted.** The engine proves the counts; nobody has made the item.
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

## Design coach

Built on OpenAI's Responses API with reasoning switched on (default model
`gpt-6.1-terra`). Calls are stored, so they appear in the OpenAI account's
logs.

### Design it for me (agentic)

The knitter gives a photo, a description, or both. A design agent then works
in a loop until it has a plan that passes every check:

1. It studies the request and reads the knitter's profile: gauge,
   measurements, finished lessons, and every lesson the app has.
2. It designs the item for that knitter: construction, sections, stitch
   patterns, lengths.
3. It gets every stitch and row count from tools, never from its own
   arithmetic.
4. It test-knits its draft in the app's engine and corrects whatever does not
   fit.
5. It lists the skills needed in learning order, links each to an existing
   lesson where there is one, and writes a new lesson where there is not.
6. It chooses the yarn and tools for this design, with a reason for each.
7. It hands in one structured plan (JSON). The app checks it again and sends
   it back with the problems if anything fails.

The plan is saved as a project. The builder, the row cards, the finished-item
picture and the progress tracking all run from it.

What is proven: the rows fit together and reach the stitch counts claimed.
What is not: fit, appearance, anything the engine's shorthand cannot express
(the agent must list those under "not machine-checked"), and the wording of
generated lessons, which have no diagrams and no human review.

### Check my work

Given the project, step and expected fabric, the model reports the fabric it
sees, whether it matches, up to four possible mistakes with a fix and a
confidence each, and what looks right. Replies are checked against a fixed
shape and anything else is dropped.

### Where the key lives

On the relay in `server/` (a Cloudflare Worker, free plan), which accepts only
the app's address, only the app's two jobs, a fixed model and a cap on reply
size. Until it is deployed the Coach tab says it is not switched on; entering
a personal key in the app is a fallback.

Still to do: deploying the relay, a per-person usage limit, diagrams for
generated lessons, letting the knitter ask for changes to a plan, testing on
many real photos, and marking problems on the photo.

## Version 4: advanced

Stages 4 to 6: mittens, gloves, cables, lace, socks, a top-down sweater.
Colourwork charts. Gift log. Optional accounts and sync between devices.

## Decisions needed from the owner

| Decision | Why it matters |
|---|---|
| Where to host, and whether the site may be public | Needed before the app can be installed on a phone |
| Who reviews the knitting content | Protects learners from wrong instructions |
| Illustrator, video, or the technique rig for hand positions | The largest remaining gap for a true beginner |
| Whether to put the photo coach behind a server | Needed before sharing the app with others, so they do not each need a key |
| English only, or continental too | Doubles the technique content |

## Where AI is and is not used

Used: reading photos, reading written patterns, answering questions from lesson content.
Not used: drawings, stitch counts, sizing, instructions, games. Those are computed and tested.

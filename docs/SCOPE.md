# Loopwise scope

Loopwise teaches knitting from the first slip knot to finished garments. Each
project is built step by step, with pictures drawn from the same stitch data
that produces the instructions.

## Version 1: built and in the repo

| Area | What works |
|---|---|
| Learn | Yarn setup (weight, gauge, head size). Six-stage path. 16 written lessons covering stages 1 to 3, each with steps, a success check, a common mistake, and where possible an interactive drawing of the fabric. |
| Make | Garter scarf and ribbed beanie. Kit list, numbered steps, row counter, and a stitch-for-stitch picture of the piece that grows as you count. Both resize to any gauge from 10 to 34 stitches per 10 cm. |
| Practice | Name that swatch (drawn by the engine, so it never repeats a stored image). Flashcards for 18 pattern abbreviations. |
| Lab | Type any row of shorthand and see the yarn path and chart. Colour by row, stitch or depth, hide layers, zoom to one stitch, trace the yarn. |
| Progress | Saved on the device. No account, no server. |
| Install | Installable, works offline once hosted. |

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

## Version 2: next

1. Hosting: the GitHub Pages workflow is in place. Pages must be switched on in the repository settings (Settings, Pages, Source: GitHub Actions).
2. Loop geometry for yo, M1L and M1R in the yarn-path view (k2tog and ssk are done).
4. Movement diagrams for k2tog and ssk, a hands-on visual for the cast-on, and a knitter's review of all diagrams.
5. Ribbed scarf and fingerless mitts templates.
6. Two more games: chart reader, spot the dropped stitch.
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

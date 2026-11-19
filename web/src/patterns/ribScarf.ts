import { stockinetteRows, type Pattern, type Settings } from './types'

const LENGTH_CM = 150

/**
 * A 2x2 ribbed scarf worked flat. The cast-on is a multiple of 4 plus 2 so
 * both edges are knit columns on the right side and the two sides match.
 */
export function ribScarfPattern(s: Settings): Pattern {
  if (!(s.gauge >= 8 && s.gauge <= 40)) throw new Error('Gauge should be between 8 and 40 stitches per 10 cm.')
  const castOn = Math.round((20 * s.gauge) / 10 / 4) * 4 + 2
  const pairs = Math.round((LENGTH_CM * stockinetteRows(s.gauge)) / 10 / 2)
  const rs = '*K2, P2; rep from *, K2', ws = '*P2, K2; rep from *, P2'
  return {
    castOn,
    construction: 'flat',
    fits: `About 15 cm wide when relaxed and ${LENGTH_CM} cm long. Ribbing pulls in, so it stretches wider.`,
    kit: [
      { name: `${s.yarn} yarn`, qty: 'about 200 g' },
      { name: `Straight needles, ${s.needle}`, qty: '1 pair' },
      { name: 'Tapestry needle', qty: '1' },
      { name: 'Scissors', qty: '1' },
      { name: 'Tape measure', qty: '1' },
    ],
    steps: [
      { title: 'Cast on', recipe: `CO ${castOn}`, text: `Cast on ${castOn} stitches with the long-tail cast-on.`,
        tip: 'The count is a multiple of 4 plus 2, so the row starts and ends with knit 2.' },
      { title: 'Knit the ribbing', recipe: `RS: ${rs} · WS: ${ws}`, rows: Array.from({ length: pairs * 2 }, (_, i) => (i % 2 ? ws : rs)), until: `the scarf measures ${LENGTH_CM} cm`,
        text: 'Right-side rows: knit 2, purl 2 across, ending with knit 2. Wrong-side rows: purl 2, knit 2 across, ending with purl 2. Once the pattern is set you can stop counting and read the stitches: knit the Vs, purl the bumps.',
        tip: 'Move the yarn between the needles each time you switch, to the front before purls and to the back before knits.' },
      { title: 'Bind off in pattern', recipe: 'BO in rib', text: 'Bind off as usual, but knit the knit stitches and purl the purl stitches as you go. That keeps the edge as stretchy as the scarf.',
        tip: 'Finish on a wrong-side row so the bind-off chain sits on the right side.' },
      { title: 'Weave in the ends', recipe: 'Finish', text: 'Run each tail up a knit column on the wrong side for 5 cm, then back down the next column for 2 cm. Trim close.' },
    ],
  }
}

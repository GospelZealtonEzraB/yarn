import { garterRows, type Pattern, type Settings } from './types'

const WIDTH_CM = 18, LENGTH_CM = 150

/** A garter stitch scarf worked flat: knit every row. The classic first project. */
export function scarfPattern(s: Settings): Pattern {
  if (!(s.gauge >= 8 && s.gauge <= 40)) throw new Error('Gauge should be between 8 and 40 stitches per 10 cm.')
  const castOn = Math.round((WIDTH_CM * s.gauge) / 10)
  const rows = Math.round((LENGTH_CM * garterRows(s.gauge)) / 10 / 2) * 2
  return {
    castOn,
    construction: 'flat',
    halved: false,
    fits: `About ${WIDTH_CM} cm wide and ${LENGTH_CM} cm long.`,
    kit: [
      { name: `${s.yarn} yarn`, qty: 'about 200 g' },
      { name: `Straight needles, ${s.needle}`, qty: '1 pair' },
      { name: 'Tapestry needle', qty: '1' },
      { name: 'Scissors', qty: '1' },
      { name: 'Tape measure', qty: '1' },
    ],
    steps: [
      { title: 'Cast on', picture: 'caston', help: ['caston'], recipe: `CO ${castOn}`,
        text: `Cast on ${castOn} stitches with the long-tail cast-on.`,
        tip: `Pull out a tail of about ${Math.round(WIDTH_CM * 3 / 10) * 10 + 20} cm before making the slip knot.` },
      { title: 'Knit every row', help: ['knit'], recipe: 'K all sts, turn', rows: Array(rows).fill('K1'), cm: LENGTH_CM, until: `the scarf measures ${LENGTH_CM} cm, or you have about 2 m of yarn left`,
        text: 'Knit every stitch to the end of the row. Swap the needles between your hands so the full one is in your left hand, and knit back. Two rows make one ridge.',
        tip: `Count your stitches every few rows. You should always have ${castOn}. A growing count usually means the yarn was wrapped over the needle at the start of a row.` },
      { title: 'Bind off', picture: 'bindoff', help: ['bindoff'], recipe: 'BO all sts',
        text: 'Knit 2 stitches. Lift the first over the second and off the needle. Knit 1 more and lift again. Repeat to the end, cut the yarn and pull the tail through the last stitch.',
        tip: 'Bind off loosely, or the end of the scarf will pull in. Going up a needle size for this row helps.' },
      { title: 'Weave in the ends', picture: 'done', help: ['weave'], recipe: 'Finish',
        text: 'Thread each tail onto the tapestry needle and run it through the bumps along a ridge for about 5 cm, then back the other way for 2 cm. Trim close.' },
    ],
  }
}

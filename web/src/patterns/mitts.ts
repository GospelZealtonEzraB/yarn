import { stockinetteRows, type Pattern, type Settings } from './types'

const CUFF_CM = 6, HAND_CM = 9, TOP_CM = 2

/**
 * Fingerless mitts knitted flat as a rectangle and seamed up the side, leaving
 * a gap for the thumb. Only knit, purl and a simple seam are needed.
 */
export function mittsPattern(s: Settings): Pattern {
  if (!(s.gauge >= 8 && s.gauge <= 40)) throw new Error('Gauge should be between 8 and 40 stitches per 10 cm.')
  if (!(s.handCm >= 12 && s.handCm <= 28)) throw new Error('Hand measurement should be between 12 and 28 cm.')
  // About 10% smaller than the hand so the mitt grips, on a multiple of 4 plus 2 so the rib is symmetrical.
  const castOn = Math.max(14, Math.round((s.handCm * 0.9 * s.gauge) / 10 / 4) * 4 + 2)
  const rowG = stockinetteRows(s.gauge)
  const pairs = (cm: number) => Math.max(2, Math.round((cm * rowG) / 10 / 2))
  const rs = '*K2, P2; rep from *, K2', ws = '*P2, K2; rep from *, P2'
  const rib = (n: number) => Array.from({ length: n * 2 }, (_, i) => (i % 2 ? ws : rs))
  const plain = (n: number) => Array.from({ length: n * 2 }, (_, i) => (i % 2 ? 'P1' : 'K1'))
  const total = CUFF_CM + HAND_CM + TOP_CM
  return {
    castOn,
    construction: 'flat',
    fits: `Each mitt is ${total} cm long and fits a hand about ${s.handCm} cm around at the knuckles.`,
    kit: [
      { name: `${s.yarn} yarn`, qty: 'about 50 g' },
      { name: `Straight needles, ${s.needle}`, qty: '1 pair' },
      { name: 'Tapestry needle', qty: '1' },
      { name: 'Scissors', qty: '1' },
      { name: 'Tape measure', qty: '1' },
    ],
    steps: [
      { title: 'Cast on', recipe: `CO ${castOn}`, text: `Cast on ${castOn} stitches with the long-tail cast-on. Leave a 30 cm tail: you will sew the seam with it.` },
      { title: 'Knit the cuff', recipe: `RS: ${rs} · WS: ${ws}`, rows: rib(pairs(CUFF_CM)), until: `the cuff measures ${CUFF_CM} cm`,
        text: 'Work 2×2 ribbing. Right-side rows: knit 2, purl 2, ending with knit 2. Wrong-side rows: purl 2, knit 2, ending with purl 2.' },
      { title: 'Knit the hand', recipe: 'RS: K all · WS: P all', rows: plain(pairs(HAND_CM)), until: `the piece measures ${CUFF_CM + HAND_CM} cm from the cast-on edge`,
        text: 'Switch to stockinette. Knit every right-side row and purl every wrong-side row.',
        tip: 'The edges will curl. The seam straightens them out.' },
      { title: 'Knit the top edge', recipe: `RS: ${rs} · WS: ${ws}`, rows: rib(pairs(TOP_CM)), until: `the piece measures ${total} cm`,
        text: 'Work 2×2 ribbing again for a neat edge across the knuckles.' },
      { title: 'Bind off', recipe: 'BO in rib', text: 'Bind off loosely, knitting the knits and purling the purls. Leave a 30 cm tail.' },
      { title: 'Sew the side seam', recipe: 'Seam, leaving a thumb gap',
        text: 'Fold the rectangle in half with the right side out so the two long edges meet. Sew from the top edge down for 4 cm. Leave the next 5 cm open for your thumb. Then sew from the cast-on edge up to the bottom of the gap.',
        tip: 'Try it on before fastening off. Make the gap longer or shorter until your thumb is comfortable.' },
      { title: 'Finish, then make the second', recipe: 'Make 2', text: 'Weave in the ends on the inside. Knit a second mitt exactly the same. The two are identical, so either fits either hand.' },
    ],
  }
}

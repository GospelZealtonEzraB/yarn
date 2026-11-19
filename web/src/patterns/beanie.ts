import { knit, type Fabric } from '../engine/fabric'
import { stockinetteRows, type Pattern, type Settings } from './types'

export interface BeanieInput {
  /** Stitches per 10 cm, measured on the knitter's own swatch. */
  gauge: number
  /** Head circumference in cm. */
  headCm: number
}

export interface Beanie {
  castOn: number
  sections: number
  finishedCm: number
  /** Stitch count after each crown decrease round. */
  crownCounts: number[]
}

const EASE = 0.88 // a ribbed hat is knitted about 12% smaller than the head so it grips

/**
 * A bottom-up beanie in the round: 2x2 rib brim, stockinette body, crown
 * decreased in equal wedges. All counts come from gauge and head size.
 */
export function beanie({ gauge, headCm }: BeanieInput): Beanie {
  if (!(gauge >= 8 && gauge <= 40)) throw new Error('Gauge should be between 8 and 40 stitches per 10 cm.')
  if (!(headCm >= 30 && headCm <= 70)) throw new Error('Head circumference should be between 30 and 70 cm.')
  const ideal = Math.round((headCm * EASE * gauge) / 10 / 4) * 4
  // The cast-on must be a multiple of 4 for the rib and split into 6-12 equal crown wedges.
  let castOn = 0, sections = 0
  for (const delta of [0, 4, -4, 8, -8]) {
    const n = ideal + delta
    const fit = [8, 9, 7, 10, 6, 11, 12].find((s) => n % s === 0 && n / s >= 3)
    if (fit) { castOn = n; sections = fit; break }
  }
  if (!castOn) throw new Error('No workable stitch count for these numbers.')
  const crownCounts: number[] = []
  for (let k = castOn / sections - 2, n = castOn; k >= 0; k--) crownCounts.push((n -= sections))
  return { castOn, sections, crownCounts, finishedCm: Math.round((castOn / gauge) * 100) / 10 }
}

/** Every crown round as a recipe: a decrease round, then a plain round, down to the last decrease. */
export function crownRecipes(b: Beanie): string[] {
  const out: string[] = []
  for (let k = b.castOn / b.sections - 2; k >= 0; k--) {
    out.push(k ? `*K${k}, k2tog; rep from *` : '*k2tog; rep from *', 'K1')
  }
  return out.slice(0, -1)
}

export function beaniePattern(s: Settings): Pattern {
  const b = beanie(s)
  const rowG = stockinetteRows(s.gauge)
  const rib = Math.round((5 * rowG) / 10), body = Math.round((9 * rowG) / 10)
  const first = b.castOn / b.sections - 2
  const left = b.crownCounts[b.crownCounts.length - 1]
  return {
    castOn: b.castOn,
    construction: 'round',
    halved: true,
    wornOn: 'head',
    fits: `Measures ${b.finishedCm} cm around and stretches to fit a ${s.headCm} cm head.`,
    kit: [
      { name: `${s.yarn} yarn`, qty: 'about 100 g' },
      { name: `Circular needle, ${s.needle}, 40 cm long`, qty: '1' },
      { name: `Double-pointed needles, ${s.needle}`, qty: 'set of 5' },
      { name: 'Stitch marker', qty: '1' },
      { name: 'Tapestry needle', qty: '1' },
      { name: 'Tape measure', qty: '1' },
    ],
    steps: [
      { title: 'Cast on', picture: 'caston', help: ['caston'], recipe: `CO ${b.castOn}`,
        text: `Cast on ${b.castOn} stitches with the long-tail cast-on. Keep them loose enough to slide along the needle.`,
        tip: `Before the slip knot, pull out a tail about three times the hat's width around, roughly ${Math.round(b.finishedCm * 3 / 10) * 10} cm.` },
      { title: 'Join in the round', picture: 'ring', help: ['round'], recipe: 'PM, join',
        text: 'Spread the stitches along the needle with every loop hanging the same way and no twist. Slip the marker onto the right needle, then knit the first stitch on the left needle to close the circle.',
        tip: 'A twisted join cannot be fixed later. Check twice before that first stitch.' },
      { title: 'Knit the ribbed brim', help: ['rib'], recipe: '*K2, P2; rep from *', rows: Array(rib).fill('K2, P2'), cm: 5, until: 'the brim measures 5 cm',
        text: 'Knit 2, purl 2, all the way round. Slip the marker across each time you reach it.',
        tip: 'Bring the yarn to the front before purling and to the back before knitting. Pass it between the needles, never over them.' },
      { title: 'Knit the body', help: ['knit'], recipe: 'K all sts', rows: Array(body).fill('K1'), cm: 9, until: 'the hat measures 14 cm from the cast-on edge',
        text: 'Knit every stitch of every round. Worked in the round, that gives smooth stockinette with no purling.',
        tip: 'Try it on as you go. The stitches stretch safely on a circular needle.' },
      { title: 'Shape the crown', help: ['k2tog', 'dpn'], recipe: `*K${first}, k2tog; rep from *`, rows: crownRecipes(b), cm: Math.round((crownRecipes(b).length / rowG) * 100) / 10, until: `${left} stitches remain`,
        text: `Decrease round: knit ${first}, knit 2 together, repeat around (${b.crownCounts[0]} stitches left). Knit one plain round. Repeat both rounds, knitting one stitch fewer before each decrease.`,
        tip: 'Switch to double-pointed needles once the stitches no longer reach around the circular.' },
      { title: 'Close and finish', picture: 'done', help: ['weave'], recipe: 'Fasten off',
        text: `Cut the yarn, leaving a 20 cm tail. Thread it through the remaining ${left} stitches with the tapestry needle, pull tight like a drawstring, and weave every end into the inside.`,
        tip: 'A gentle wash and a flat dry (blocking) evens out the stitches before gifting.' },
    ],
  }
}

/** A sample of the brim and body, small enough to draw loop by loop. */
export const brimSwatch = (): Fabric => knit(16, [...Array(5).fill('K2, P2'), ...Array(4).fill('K1')], 'round')

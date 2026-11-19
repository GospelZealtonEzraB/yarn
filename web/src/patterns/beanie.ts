import { knit, type Fabric } from '../engine/fabric'

export interface BeanieInput {
  /** Stitches per 10 cm, measured on the knitter's own swatch. */
  gauge: number
  /** Head circumference in cm. */
  headCm: number
}

export interface BeanieStep { title: string; text: string; recipe: string }

export interface Beanie {
  castOn: number
  sections: number
  finishedCm: number
  /** Stitch count after each crown decrease round. */
  crownCounts: number[]
  steps: BeanieStep[]
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
  const first = castOn / sections - 2
  const crownCounts: number[] = []
  for (let k = first, n = castOn; k >= 0; k--) crownCounts.push((n -= sections))
  const left = crownCounts[crownCounts.length - 1]
  return {
    castOn, sections, crownCounts,
    finishedCm: Math.round((castOn / gauge) * 100) / 10,
    steps: [
      { title: 'Cast on', recipe: `CO ${castOn}`, text: `Cast on ${castOn} stitches with the long-tail cast-on.` },
      { title: 'Join in the round', recipe: 'PM, join', text: 'Check the stitches are not twisted, place a marker and knit the first stitch to close the circle.' },
      { title: 'Knit the ribbed brim', recipe: '*K2, P2; rep from *', text: 'Knit 2, purl 2 around until the brim measures 5 cm.' },
      { title: 'Knit the body', recipe: 'K all sts', text: 'Knit every round until the hat measures 14 cm from the cast-on edge.' },
      { title: 'Shape the crown', recipe: `*K${first}, k2tog; rep from *`, text: `Decrease round: knit ${first}, knit 2 together, repeat around (${crownCounts[0]} stitches). Knit one plain round. Repeat both rounds with one stitch fewer before each decrease until ${left} stitches remain.` },
      { title: 'Close and finish', recipe: 'Fasten off', text: `Cut the yarn, thread the tail through the remaining ${left} stitches, pull tight and weave in the ends.` },
    ],
  }
}

/** Every crown round as a recipe, for the chart view and for checking the arithmetic by actually working it. */
export function crownRecipes(b: Beanie): string[] {
  const out: string[] = []
  for (let k = b.castOn / b.sections - 2; k >= 0; k--) {
    out.push(k ? `*K${k}, k2tog; rep from *` : '*k2tog; rep from *', 'K1')
  }
  return out.slice(0, -1)
}

/** A sample of the brim and body, small enough to draw. */
export const brimSwatch = (): Fabric => knit(16, [...Array(5).fill('K2, P2'), ...Array(4).fill('K1')], 'round')

import type { Construction } from '../engine/fabric'

/**
 * The stitch-pattern library. Each pattern is defined once, as a chart of how
 * it looks from the right side, first row at the top of the list, each row
 * read left to right. Working instructions for flat and in-the-round knitting
 * are derived from the chart, so a pattern cannot be written one way and
 * drawn another.
 */
export interface StitchPattern {
  id: string
  name: string
  chart: string[]
  /** Rows per 10 cm as a multiple of stitches per 10 cm. An estimate. */
  rowFactor: number
  /** False for fabrics that curl at the edges, which rules them out for scarves. */
  liesFlat: boolean
  note: string
}

export const STITCH_PATTERNS: StitchPattern[] = [
  { id: 'stockinette', name: 'Stockinette', chart: ['k'], rowFactor: 1.35, liesFlat: false, note: 'Smooth Vs on the front. The classic sweater fabric. Curls at the edges.' },
  { id: 'garter', name: 'Garter', chart: ['k', 'p'], rowFactor: 2, liesFlat: true, note: 'Squishy ridges, the same on both sides. Lies flat.' },
  { id: 'rib1', name: '1×1 rib', chart: ['kp'], rowFactor: 1.35, liesFlat: true, note: 'Narrow columns. Very stretchy and the same on both sides.' },
  { id: 'rib2', name: '2×2 rib', chart: ['kkpp'], rowFactor: 1.35, liesFlat: true, note: 'Wider columns. Stretchy, pulls in, the same on both sides.' },
  { id: 'seed', name: 'Seed stitch', chart: ['kp', 'pk'], rowFactor: 1.7, liesFlat: true, note: 'A pebbly texture of scattered bumps. Lies flat.' },
  { id: 'moss', name: 'Moss stitch', chart: ['kp', 'kp', 'pk', 'pk'], rowFactor: 1.6, liesFlat: true, note: 'Like seed stitch, but each bump is two rows tall. Lies flat.' },
  { id: 'box', name: 'Box stitch', chart: ['kkpp', 'kkpp', 'ppkk', 'ppkk'], rowFactor: 1.6, liesFlat: true, note: 'Little two-by-two squares in a checkerboard. Lies flat.' },
  { id: 'basket', name: 'Basketweave', chart: [...Array(4).fill('kkkkpppp'), ...Array(4).fill('ppppkkkk')], rowFactor: 1.5, liesFlat: true, note: 'Blocks of smooth and bumpy fabric that look woven. Lies flat.' },
  { id: 'brokenrib', name: 'Broken rib', chart: ['kk', 'kp'], rowFactor: 1.5, liesFlat: true, note: 'Ribbing interrupted by plain rows. Textured but not clingy.' },
  { id: 'ridge', name: 'Garter ridges', chart: ['k', 'k', 'k', 'p'], rowFactor: 1.5, liesFlat: false, note: 'Smooth fabric with a raised ridge every fourth row.' },
]
export const stitchPattern = (id: string): StitchPattern => {
  const p = STITCH_PATTERNS.find((s) => s.id === id)
  if (!p) throw new Error(`There is no stitch pattern called "${id}".`)
  return p
}
export const repeatWidth = (p: StitchPattern) => p.chart[0].length

/** "kkpp" as "K2, P2". */
function shorthand(stitches: string): string {
  const out: string[] = []
  for (let i = 0; i < stitches.length;) {
    let j = i
    while (stitches[j] === stitches[i]) j++
    out.push(`${stitches[i].toUpperCase()}${j - i}`)
    i = j
  }
  return out.join(', ')
}

/**
 * Row-by-row recipes that produce the chart over `stitches` stitches.
 *
 * The chart is tiled from the left edge of the right side. A right-side row is
 * worked right to left, so its recipe is the tiled row backwards. A wrong-side
 * row (flat knitting only) is worked left to right with every stitch flipped.
 * The section must start on a right-side row.
 */
export function rowsFor(p: StitchPattern, stitches: number, count: number, construction: Construction): string[] {
  const w = repeatWidth(p)
  return Array.from({ length: count }, (_, r) => {
    const chartRow = p.chart[r % p.chart.length]
    const seen = (c: number) => chartRow[c % w]
    const wrongSide = construction === 'flat' && r % 2 === 1
    const worked = Array.from({ length: stitches }, (_, i) => (wrongSide ? (seen(i) === 'k' ? 'p' : 'k') : seen(stitches - 1 - i))).join('')
    const body = worked.slice(0, w), tail = worked.slice(w * Math.floor(stitches / w))
    if (stitches < w) return shorthand(worked)
    if (tail) return `*${shorthand(body)}; rep from *, ${shorthand(tail)}`
    return w === 1 ? `${body.toUpperCase()}1` : shorthand(body)
  })
}

/** A stitch count near `ideal` that the pattern fits with matching edges: whole repeats plus half a repeat. */
export function balanced(p: StitchPattern, ideal: number): number {
  const w = repeatWidth(p)
  return Math.max(Math.round(ideal / w), 1) * w + (w > 1 ? w / 2 : 0)
}

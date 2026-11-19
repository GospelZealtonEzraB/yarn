import type { Fabric } from './fabric'
import { STITCHES, type StitchId } from './stitch'

/**
 * Turns fabric into the path the yarn actually takes, with every crossing
 * marked over or under.
 *
 * Each stitch is one loop. Following the yarn left to right it has eight
 * spans: sinker, lower leg, upper leg, head, head, upper leg, lower leg,
 * sinker. A new loop is pulled through the head of the loop below it:
 *
 *   knit: the legs come out in FRONT of the old head, the sinkers sit BEHIND
 *         the old loop's sides. The front shows a V.
 *   purl: the mirror image. The old head and the new sinkers sit in front,
 *         which is the purl bump.
 *
 * So a loop's lower legs and sinkers take their depth from its own stitch
 * type, and its head and upper legs stay on the middle layer where the next
 * row crosses them.
 *
 * Shaping:
 *   k2tog: one loop through two loops below. The LEFT one lies on top, so the
 *          pair leans right.
 *   ssk:   one loop through two loops below. The RIGHT one lies on top, so
 *          the pair leans left.
 *   yo:    a loop through nothing, which leaves a hole.
 * A loop's head is drawn where the stitch above it sits, so loops lean toward
 * a decrease the way they do in fabric.
 */
/** `part` runs 0-7 left to right: sinker, lower leg, upper leg, head, head, upper leg, lower leg, sinker. */
export interface Span { d: string; z: number; row: number; col: number; part: number }

export interface StitchGeo {
  row: number
  col: number
  type: StitchId
  /** Where the loop's feet are. */
  x: number
  /** Where its head is: under the stitch that was worked into it. */
  headX: number
  /** Columns in the row below that this loop passes through. */
  parents: number[]
  /** Column in the row above that passes through this loop, if any. */
  child: number | null
}

export const CELL = { w: 26, h: 21 }
export const PAD = 10
/** Stitches the yarn-path view can draw. The rest appear in the chart only. */
// Yarn over is laid out but not enabled: its loop crowds the decrease beside it, and a crowded drawing misleads.
export const DRAWABLE: StitchId[] = ['k', 'p', 'k2tog', 'ssk']
export const canDraw = (f: Fabric) => f.rows.every((r) => r.every((s) => DRAWABLE.includes(s)))

/** Baseline of a row in drawing units, for a drawing `height` tall. */
export const rowBase = (height: number, row: number) => height - PAD - CELL.h * 0.35 - row * CELL.h

/** The three depth bands a span belongs to: -1 behind, 0 middle, 1 in front. */
export const band = (z: number): -1 | 0 | 1 => (z >= 1 ? 1 : z <= -1 ? -1 : 0)

type P = [number, number]

export function yarnSpans(fabric: Fabric): { spans: Span[]; stitches: StitchGeo[][]; width: number; height: number } {
  if (!canDraw(fabric)) throw new Error('The yarn-path view cannot draw every stitch in this fabric yet. Use the chart view for those.')
  const { w, h } = CELL
  const width = fabric.castOn * w + PAD * 2
  const height = (fabric.rows.length + 1) * h + PAD * 2

  // Pass 1: where each loop sits and which loops it passes through.
  let below = Array.from({ length: fabric.castOn }, (_, i) => PAD + i * w + w / 2)
  const stitches: StitchGeo[][] = fabric.rows.map((row, r) => {
    let next = 0
    const geo = row.map((type, col): StitchGeo => {
      const n = STITCHES[type].consumes
      const parents = Array.from({ length: n }, (_, i) => next + i)
      const x = n > 0
        ? parents.reduce((sum, i) => sum + below[i], 0) / n
        : ((below[next - 1] ?? below[0] - w) + (below[next] ?? below[below.length - 1] + w)) / 2
      next += n
      return { row: r, col, type, x, headX: x, parents, child: null }
    })
    below = geo.map((g) => g.x)
    return geo
  })
  for (let r = 1; r < stitches.length; r++) for (const st of stitches[r]) for (const p of st.parents) {
    stitches[r - 1][p].child = st.col
    stitches[r - 1][p].headX = st.x
  }

  // Pass 2: the strand itself.
  const spans: Span[] = []
  stitches.forEach((row, r) => {
    const y0 = rowBase(height, r)
    const pts: P[] = []
    row.forEach((st, c) => {
      const above = st.child === null ? null : stitches[r + 1][st.child]
      // In a decrease the loop underneath sits a little lower so both stay visible.
      const under = above && above.parents.length === 2 && !onTop(above, c)
      const lean = (t: number) => st.x + (st.headX - st.x) * t
      const lift = under ? 0.16 * h : 0
      const half = (side: -1 | 1): P[] => [
        [lean(0) + side * 0.17 * w, y0 - 0.36 * h],
        [lean(0.25) + side * 0.2 * w, y0 - 0.78 * h],
        [lean(0.8) + side * 0.37 * w, y0 - 1.26 * h + lift],
      ]
      const left = row[c - 1], right = row[c + 1]
      if (c === 0) pts.push([left ? (left.x + st.x) / 2 : st.x - w / 2, y0 + 0.16 * h])
      pts.push(...half(-1), [st.headX, y0 - 1.62 * h + lift], ...half(1).reverse())
      pts.push([right ? (right.x + st.x) / 2 : st.x + w / 2, y0 + 0.16 * h])
    })
    for (let i = 0; i < pts.length - 1; i++) {
      const col = Math.min(Math.floor(i / 8), row.length - 1)
      const part = i % 8
      const st = row[col]
      const front = st.type === 'p' ? -1 : 1
      const above = st.child === null ? null : stitches[r + 1][st.child]
      const top = above && above.parents.length === 2 && onTop(above, col) ? 0.5 : 0
      const z = part === 1 || part === 6 ? front : part === 0 || part === 7 ? -front : top
      spans.push({ d: bezier(pts, i), z, row: r, col, part })
    }
  })
  return { spans, stitches, width, height }
}

/** In a two-into-one decrease, which of the two loops below lies on top. */
function onTop(decrease: StitchGeo, parentCol: number): boolean {
  const [leftParent, rightParent] = decrease.parents
  return decrease.type === 'ssk' ? parentCol === rightParent : parentCol === leftParent
}

/** Catmull-Rom segment i -> i+1 as a cubic Bezier, so the whole row is one smooth strand. */
function bezier(p: P[], i: number): string {
  const a = p[Math.max(i - 1, 0)], b = p[i], c = p[i + 1], d = p[Math.min(i + 2, p.length - 1)]
  const f = (n: number) => n.toFixed(2)
  return `M${f(b[0])},${f(b[1])}C${f(b[0] + (c[0] - a[0]) / 6)},${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (d[0] - b[0]) / 6)},${f(c[1] - (d[1] - b[1]) / 6)} ${f(c[0])},${f(c[1])}`
}

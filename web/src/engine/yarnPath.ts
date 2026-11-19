import type { Fabric } from './fabric'

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
 * row crosses them. Three layers are enough for any knit and purl fabric.
 */
export interface Span { d: string; z: -1 | 0 | 1; row: number; col: number }

export const CELL = { w: 26, h: 21 }

// Half-loop control points as fractions of the cell, x from the loop centre,
// y from the row baseline (negative is up).
const HALF: [number, number][] = [[0.5, 0.16], [0.17, -0.36], [0.2, -0.78], [0.37, -1.26], [0, -1.62]]

type P = [number, number]

export function yarnSpans(fabric: Fabric): { spans: Span[]; width: number; height: number } {
  const supported = fabric.rows.every((r) => r.every((s) => s === 'k' || s === 'p'))
  if (!supported) throw new Error('The yarn-path view draws knit and purl only so far. Use the chart view for shaping stitches.')
  const cols = Math.max(...fabric.rows.map((r) => r.length))
  const { w, h } = CELL
  const pad = 10
  const height = (fabric.rows.length + 1) * h + pad * 2
  const spans: Span[] = []
  fabric.rows.forEach((row, r) => {
    const y0 = height - pad - h * 0.35 - r * h
    const pts: P[] = []
    row.forEach((_, c) => {
      const cx = pad + c * w + w / 2
      const left = HALF.map(([x, y]): P => [cx - x * w, y0 + y * h])
      const right = HALF.slice(0, 4).reverse().map(([x, y]): P => [cx + x * w, y0 + y * h])
      pts.push(...(c === 0 ? left : left.slice(1)), ...right)
    })
    for (let i = 0; i < pts.length - 1; i++) {
      const col = Math.min(Math.floor(i / 8), row.length - 1)
      const part = i % 8 // 0 sinker, 1 lower leg, 2 upper leg, 3-4 head, 5 upper, 6 lower, 7 sinker
      const front = row[col] === 'k' ? 1 : -1
      const z = part === 1 || part === 6 ? front : part === 0 || part === 7 ? -front : 0
      spans.push({ d: bezier(pts, i), z: z as Span['z'], row: r, col })
    }
  })
  return { spans, width: cols * w + pad * 2, height }
}

/** Catmull-Rom segment i -> i+1 as a cubic Bezier, so the whole row is one smooth strand. */
function bezier(p: P[], i: number): string {
  const a = p[Math.max(i - 1, 0)], b = p[i], c = p[i + 1], d = p[Math.min(i + 2, p.length - 1)]
  const f = (n: number) => n.toFixed(2)
  return `M${f(b[0])},${f(b[1])}C${f(b[0] + (c[0] - a[0]) / 6)},${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (d[0] - b[0]) / 6)},${f(c[1] - (d[1] - b[1]) / 6)} ${f(c[0])},${f(c[1])}`
}

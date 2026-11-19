import type { Fabric } from './fabric'
import type { Pattern } from '../patterns/types'

/**
 * The finished item as a true-to-scale outline, cut into the sections the
 * knitter works one after another. Everything is in centimetres: `u` runs
 * along the knitting from the cast-on edge, `v` across it from the centre
 * line. The picture and the progress marker both come from the same stitch
 * counts and section lengths as the instructions.
 */
export type Texture = 'rib' | 'garter' | 'stockinette'
export interface Section { step: number; title: string; rows: [number, number]; cm: [number, number]; texture: Texture }
export interface Product {
  sections: Section[]
  /** Outline as [u, v] points, up one side and back down the other. */
  outline: [number, number][]
  lengthCm: number
  widthCm: number
  marks: { fromCm: number; toCm: number; label: string }[]
}

function texture(fabric: Fabric, from: number): Texture {
  const a = fabric.rows[from], b = fabric.rows[from + 1] ?? a
  if (a.includes('p') && a.some((s) => s !== 'p')) return 'rib'
  return a.every((s) => s !== 'p') && b.every((s) => s === 'p') ? 'garter' : 'stockinette'
}

export function product(pattern: Pattern, fabric: Fabric, gauge: number): Product {
  const sections: Section[] = []
  let row = 0, cm = 0
  pattern.steps.forEach((st, i) => {
    if (!st.rows?.length) return
    if (!st.cm) throw new Error(`Step "${st.title}" has rows but no length.`)
    sections.push({ step: i, title: st.title, rows: [row, row + st.rows.length], cm: [cm, cm + st.cm], texture: texture(fabric, row) })
    row += st.rows.length
    cm += st.cm
  })
  const half = (stitches: number) => ((stitches / gauge) * 10) / (pattern.halved ? 2 : 1) / 2
  const side: [number, number][] = [[0, half(pattern.castOn)]]
  for (const s of sections) for (let r = s.rows[0]; r < s.rows[1]; r++) {
    const v = half(fabric.rows[r].length)
    const u = s.cm[0] + ((r + 1 - s.rows[0]) / (s.rows[1] - s.rows[0])) * (s.cm[1] - s.cm[0])
    // Only keep points where the width changes, plus section ends, so straight sides stay straight.
    if (v !== side[side.length - 1][1] || r === s.rows[1] - 1) side.push([u, v])
  }
  const outline: [number, number][] = [...side.map(([u, v]): [number, number] => [u, -v]), ...side.reverse()]
  return { sections, outline, lengthCm: cm, widthCm: half(pattern.castOn) * 2, marks: pattern.marks ?? [] }
}

/** How far along the piece a row count is, in cm from the cast-on edge. */
export function reached(p: Product, rowsDone: number): number {
  for (const s of p.sections) {
    if (rowsDone <= s.rows[0]) return s.cm[0]
    if (rowsDone < s.rows[1]) return s.cm[0] + ((rowsDone - s.rows[0]) / (s.rows[1] - s.rows[0])) * (s.cm[1] - s.cm[0])
  }
  return p.lengthCm
}

/**
 * The item as a solid of revolution, for tubes: a hat, or a mitt on a hand.
 * Returns the profile to spin around the vertical axis as [radius, height, cm
 * along the knitting] points.
 *
 * Each row is a ring whose circumference is its stitch count at gauge, so the
 * radius is known. Knitted fabric does not stretch along its length here, so
 * the distance between neighbouring rings along the surface equals the row
 * height. Where the radius shrinks quickly, as in a crown, that fixed
 * distance is spent going inward rather than upward, which is what makes the
 * top of a hat curve over.
 */
export function profile(p: Product, step = 0.25): [number, number, number][] {
  const side = p.outline.slice(p.outline.length / 2).reverse() // [u, half flat width], cast-on edge first
  const radiusAt = (u: number) => {
    for (let i = 1; i < side.length; i++) if (u <= side[i][0]) {
      const [u0, v0] = side[i - 1], [u1, v1] = side[i]
      const t = u1 === u0 ? 1 : (u - u0) / (u1 - u0)
      return ((v0 + (v1 - v0) * t) * 2) / Math.PI // flat width is half the circumference
    }
    return (side[side.length - 1][1] * 2) / Math.PI
  }
  const out: [number, number, number][] = [[radiusAt(0), 0, 0]]
  for (let u = step; u < p.lengthCm + step / 2; u += step) {
    const at = Math.min(u, p.lengthCm), [r0, y0, u0] = out[out.length - 1]
    // Stitch counts change in steps, a whole round at a time. Fabric cannot narrow faster than it is long,
    // so the radius follows the counts as fast as the row length allows and no faster.
    const ds = at - u0
    const r = Math.min(Math.max(radiusAt(at), r0 - ds * 0.96), r0 + ds * 0.96), dr = r - r0
    out.push([r, y0 + Math.sqrt(Math.max(ds * ds - dr * dr, 0)), at])
  }
  return out
}

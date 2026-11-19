import type { Fabric } from './fabric'

/**
 * A chart shows the right side of the fabric. Right-side rows are read right
 * to left as drawn. Wrong-side rows are read left to right, and every symbol
 * flips: a blank square is purled, a dot is knitted.
 */
export function workingOrder(cells: ('k' | 'p')[], wrongSide: boolean): ('k' | 'p')[] {
  return wrongSide ? cells.map((c) => (c === 'k' ? 'p' : 'k')) : [...cells].reverse()
}

/** A swatch with exactly one stitch worked the wrong way round. */
export function withMistake(fabric: Fabric, row: number, col: number): Fabric {
  const rows = fabric.rows.map((r) => [...r])
  rows[row][col] = rows[row][col] === 'k' ? 'p' : 'k'
  return { ...fabric, rows }
}
